import {autoUsableMaterial, usableQualities} from '../planner/quality.js';
import {workEstimate} from '../planner/estimates.js';
import {POTIONS, foodEffects, foodHealing} from '../planner/supplies.js';
import {inventoryBudget, reviewInventory, saleProtectionReason} from '../planner/inventory.js';
import {PAYBACK_MARGIN, payback} from '../planner/investment.js';
import {baseId, dayTicks as dayTicksOf, distance, itemLabel, merchantPrice, minListPrice, netProceeds, plusOf, qualityIds, rarityOf, stockQty, tradableBase} from '../planner/items.js';

// Price grid (client Nb/Vn/ih/Zm; refusal 'market-price-step'): a price must be
// a multiple of a step that grows with it: 1 below 100, then 2, 5 or 10 times
// one hundredth of its power of ten (20 at 1,000-1,999; 1,000 at 50,000-99,999).
export function priceStep(price) {
  if(price<100)return 1;
  const power=10**(String(Math.floor(price)).length-1),unit=power/100;
  return price<2*power?2*unit:price<5*power?5*unit:10*unit;
}
export const onPriceStep=price=>Number.isInteger(price)&&price>0&&price%priceStep(price)===0;
// The highest valid price strictly below `price` (the client's undercut).
export function stepBelow(price) {
  const below=price-1;if(below<1)return 1;
  const step=priceStep(below);return Math.max(1,Math.floor(below/step)*step);
}
export const priceDown=price=>onPriceStep(price)?price:stepBelow(price);
export function priceUp(price) {
  if(onPriceStep(price))return price;
  const step=priceStep(price);return (Math.floor(price/step)+1)*step;
}

// Limit orders can rest after a partial fill. Track only orders we submitted;
// inventory removed into escrow is not evidence of a sale or realized income.
export function createMarket(data,planner,{now=Date.now,storage=null,autoSell=false,capacitySales=false,salePricing='list'}={}) {
  const key='deepvein-market-v1',ttl=15000,waitMs=4000,coolMs=30000;
  const reviewMs=1800000,recycleMs=7200000;
  const ironmanReason='铁人角色不支持普通玩家市场交易；保留盈余，请手动整理仓库';
  let saved={players:{}},savedText=null,storageReadable=true;
  let playerId=null,state=null,orders=[],ordersKnown=false,revision=0,taxBp=200,snapshotTick=-Infinity;
  let quotes=new Map(),requests=new Map(),cooldowns=new Map(),lastQuery=-Infinity,lastSync=-Infinity;
  let procurement=null,tops=new Map(),bookRequests=new Map(),equipmentScan=null,foodScan=null;
  let watched=[],potionWatched=[],watchCursor=0,priorityItem=null;
  let salesEnabled=autoSell===true;
  let capacitySalesEnabled=capacitySales===true;
  // 'list': sell by listing just under the lowest ask when that pays clearly
  // more than the best bid and recent trades show buyers at that price;
  // 'bid': fill the best buy order immediately (the original behaviour).
  let pricing=salePricing==='bid'?'bid':'list';
  // Town buyback (城镇回购, /api/buyback): once a day the town buys
  // over-supplied common goods listed at up to 1.5x the merchant price.
  let buyback=null;
  // Public price feed (/api/market/prices.json, regenerated every 5 minutes):
  // lowest ask and highest bid for every listed item, rarity and enhancement.
  // Planning valuations only; every actual order re-checks the live book.
  let feed=null;
  const feedTtl=900000;
  let need=null,recentOwned=[],reviewOrderId=null,status=salesEnabled?
    '市场优先；挂售至少 2 小时并重新定价后才回收':'平时出售已关闭，物品留给玩家处理';
  const persist=()=>{
    if(!storageReadable)return false;
    try {const text=JSON.stringify(saved);storage?.setItem(key,text);savedText=text;return true;} catch {return false;}
  };
  const quantity=stockQty;
  const valid=n=>Number.isSafeInteger(n)&&n>0;
  const tradable=id=>valid(id)&&id===planner.base(id)&&!!data.items[id]&&tradableBase(data,id);
  const action=(intent,label,reason='')=>({intent,label,reason});
  const wait=reason=>({...action(null,'市场比价',reason),marketWaiting:true});
  const defer=reason=>{status=reason;return {...action(null,'市场出售待处理',reason),marketDeferred:true};};
  const natural=p=>!p.route||p.route.phase==='toBank';
  const matching=(order,intent)=>order.itemId===intent.itemId&&
    order.side===(intent.t==='marketBuy'?'buy':'sell')&&order.price===intent.price&&
    order.qtyTotal===intent.qty;
  const ownMatch=(order,owned)=>order.id===owned.id&&order.itemId===owned.itemId&&
    order.side===owned.side&&order.price===owned.price&&order.qtyTotal===owned.qtyTotal;
  function playerState(id) {
    const record=saved.players[id]??={owned:{},attempt:null,income:0,spent:0,fillKeys:[]};
    record.sales??={};record.potionPurchases??=[];record.purchases??=[];
    return record;
  }
  function refresh() {
    if(!storage)return;
    try {
      const text=storage.getItem(key)??null;
      if(text!==savedText) {
        const value=JSON.parse(text??'null');
        if(value!==null&&!value?.players)throw new Error('Invalid market ledger');
        saved=value??{players:{}};savedText=text;
        if(playerId!==null)state=playerState(playerId);
      }
      storageReadable=true;
    } catch {storageReadable=false;}
  }
  function select(p) {
    // A passive tab also receives snapshots. Adopt the shared ledger before
    // writing so it cannot erase another tab's orders or spending commitment.
    refresh();
    if(playerId===p.id)return;
    playerId=p.id;state=playerState(playerId);
    orders=[];ordersKnown=false;revision=0;quotes=new Map();requests=new Map();cooldowns=new Map();
    tops=new Map();bookRequests=new Map();equipmentScan=null;foodScan=null;
    watched=[];potionWatched=[];watchCursor=0;priorityItem=null;
    lastQuery=-Infinity;lastSync=-Infinity;need=null;recentOwned=[];reviewOrderId=null;snapshotTick=-Infinity;taxBp=200;
    if(state.attempt){state.attempt.revision=-1;state.attempt.reviewSale=false;}
  }
  function receive(frame) {
    if(!Array.isArray(frame?.m))return;
    refresh();
    const fillOccurrences=new Map();
    for(const message of frame.m) {
      if((message.t==='welcome'||message.t==='snapshot')&&message.you?.id!=null) {
        const p=message.you;
        if(!Number.isFinite(frame.tick)||!Number.isFinite(p.lastTick)||!Number.isFinite(p.coins)||
          !Number.isFinite(p.x)||!Number.isFinite(p.y)||!p.bank||typeof p.bank!=='object'||!Array.isArray(p.pack))continue;
        select(message.you);
        if(frame.tick<Math.max(snapshotTick,state.snapshotTick??-Infinity))continue;
        snapshotTick=frame.tick;state.snapshotTick=frame.tick;
        // After a disconnect, disappearance plus new stock cannot prove that
        // the stock came from this cancellation rather than later production.
        if(message.t==='welcome'&&state.attempt?.reviewSale){state.attempt.reviewSale=false;persist();}
        let changed=false;
        for(const [id,sale]of Object.entries(state.sales)) {
          if(state.attempt?.intent.t==='marketSell'&&state.attempt.intent.itemId===Number(id))continue;
          const stock=quantity(p,Number(id));
          if(stock===sale.stock)continue;
          sale.qty=Math.min(stock,Math.max(0,sale.qty-Math.max(0,(sale.stock??stock)-stock)));
          sale.stock=stock;
          if(!sale.qty)delete state.sales[id];
          changed=true;
        }
        if(changed)persist();
        if(Number.isFinite(message.marketTaxBp))taxBp=Math.max(0,Math.min(10000,message.marketTaxBp));
        if(Array.isArray(message.orders)) {
          orders=message.orders.filter(o=>valid(o.id)&&valid(o.itemId)&&valid(o.price)&&valid(o.qtyTotal)&&
            valid(o.qtyRemaining)&&['buy','sell'].includes(o.side));
          ordersKnown=true;revision++;
          for(const [id,owned]of Object.entries(state.owned)) {
            if(!orders.some(o=>ownMatch(o,owned))) {
              recentOwned.push({...owned,removedAt:now()});delete state.owned[id];
            }
          }
          persist();
        }
      } else if(message.t==='marketBooks'&&Array.isArray(message.tops)&&!(frame.tick<snapshotTick)) {
        for(const top of message.tops)if(bookRequests.has(top.itemId)&&
          (top.ask===null||valid(top.ask)&&top.ask<=1e9)&&Number.isSafeInteger(top.askQty)&&top.askQty>=0) {
          tops.set(top.itemId,{...top,at:now()});bookRequests.delete(top.itemId);
        }
      } else if(message.t==='marketDepth'&&requests.has(message.itemId)&&!(frame.tick<snapshotTick)) {
        const rows=list=>(Array.isArray(list)?list:[]).filter(r=>valid(r.price)&&r.price<=1e9&&valid(r.qty));
        quotes.set(message.itemId,{at:now(),bids:rows(message.bids),asks:rows(message.asks),
          trades:rows(message.trades).filter(r=>Number.isFinite(r.tick)),
          tradesKnown:['bids','asks','trades'].every(key=>Array.isArray(message[key])&&rows(message[key]).length===message[key].length)&&
            message.trades.every(r=>Number.isFinite(r.tick)&&r.tick>=0&&r.tick<=frame.tick)});
        const ask=[...rows(message.asks)].sort((a,b)=>a.price-b.price)[0];
        tops.set(message.itemId,{itemId:message.itemId,ask:ask?.price??null,askQty:ask?.qty??0,at:now()});
        requests.delete(message.itemId);
      } else if(message.t==='marketFilled'&&state&&valid(message.qty)&&Number.isFinite(message.coins)) {
        const signature=JSON.stringify(message),occurrence=fillOccurrences.get(signature)??0;
        fillOccurrences.set(signature,occurrence+1);
        const intent=state.attempt?.intent;
        const pending=intent&&intent.itemId===message.itemId&&
          (intent.t==='marketBuy'?'buy':intent.t==='marketSell'?'sell':null)===message.side;
        recentOwned=recentOwned.filter(o=>now()-o.removedAt<ttl);
        const owned=[...Object.values(state.owned),...recentOwned]
          .filter(o=>o.itemId===message.itemId&&o.side===message.side);
        const other=orders.some(o=>o.itemId===message.itemId&&o.side===message.side&&
          !state.owned[o.id]&&!pending);
        if((pending||owned.length===1)&&!other) {
          // The reviewed envelope has only tick, optional command ack a, and m;
          // there is no fill id. Preserve equal legs within one frame, while an
          // exact replay is ignored. Identical separate frames with the same
          // tick/ack remain ambiguous, so we conservatively do not count twice.
          const fillKey=JSON.stringify([frame.tick,frame.a??null,message,occurrence]);
          if(state.fillKeys.includes(fillKey))continue;
          state.fillKeys.push(fillKey);state.fillKeys=state.fillKeys.slice(-50);
          if(message.side==='sell')state.income+=Math.max(0,message.coins-(message.tax??0));
          else state.spent+=Math.max(0,message.coins);
          if(pending)state.attempt.filled=Math.min(intent.qty,(state.attempt.filled??0)+message.qty);
          persist();
        }
      }
    }
  }
  function query(p) {
    select(p);
    if(p.ironman)return null;
    if((!ordersKnown||state.attempt)&&now()-lastSync>=5000) {
      lastSync=now();return {t:'resync'};
    }
    if(state.attempt||now()-lastQuery<1500)return null;
    for(const [itemId,request]of requests)if((request.background||request.potionBackground)&&
      request.sentAt!=null&&now()-request.sentAt>=waitMs) {
      requests.delete(itemId);cooldowns.set(itemId,now()+coolMs);
    }
    for(const [itemId,request]of requests)if(request.sentAt==null) {
      request.sentAt=now();lastQuery=now();return {t:'marketDepth',itemId};
    }
    for(const [id,request]of bookRequests)if(request.sentAt!=null&&now()-request.sentAt>=waitMs) {
      bookRequests.delete(id);cooldowns.set(id,now()+coolMs);
    }
    const itemIds=[...bookRequests].filter(([,r])=>r.sentAt==null).slice(0,64).map(([id])=>id);
    if(itemIds.length&&slots(p)) {
      for(const id of itemIds)bookRequests.get(id).sentAt=now();
      lastQuery=now();return {t:'marketBooks',itemIds};
    }
    if([...requests.values()].some(request=>request.sentAt!=null&&now()-request.sentAt<waitMs))return null;
    if(!slots(p))return null;
    const priorityQuote=quotes.get(priorityItem);
    if(priorityItem!==null&&!hasOrder(priorityItem)&&(cooldowns.get(priorityItem)??0)<=now()&&
      (!priorityQuote||now()-priorityQuote.at>=8000)) {
      requests.set(priorityItem,{at:now(),sentAt:now(),background:true});lastQuery=now();
      return {t:'marketDepth',itemId:priorityItem};
    }
    const background=[...watched.map(itemId=>({itemId,potion:false})),...potionWatched.map(itemId=>({itemId,potion:true}))];
    for(let n=0;n<background.length;n++) {
      const {itemId,potion}=background[watchCursor++%background.length],current=quotes.get(itemId);
      if((cooldowns.get(itemId)??0)>now()||hasOrder(itemId)||current&&now()-current.at<(potion?8000:ttl))continue;
      requests.set(itemId,{at:now(),sentAt:now(),...(potion?{potionBackground:true}:{background:true})});lastQuery=now();
      return {t:'marketDepth',itemId};
    }
    return null;
  }
  function watch(p,itemIds,priorityItemId=null) {
    select(p);
    // Quotes are read-only: always fetch them so planning can value sales.
    watched=p.ironman?[]:[...new Set(itemIds.filter(id=>tradable(id)&&!saleProtectionReason(data,id)))].slice(0,32);
    watchCursor%=watched.length||1;
    priorityItem=watched.includes(priorityItemId)?priorityItemId:null;
    for(const [id,request]of requests)if(request.background&&!watched.includes(id))requests.delete(id);
  }
  function watchPotions(p,itemIds) {
    select(p);
    if(procurement?.enabled)scan(p,itemIds.flatMap(variants));
    potionWatched=p.ironman?[]:[...new Set(itemIds.filter(id=>POTIONS.some(potion=>potion.itemId===id)&&tradable(id)))].slice(0,8);
    for(const [id,request]of requests)if(request.potionBackground&&!potionWatched.includes(id))requests.delete(id);
  }
  // Sale value of new output: the best of filling current bids, listing at the
  // ask (listing mode, with proven demand) and the merchant (系统回收), which
  // always buys at 40% of base value. The merchant is also the lower bound
  // while market quotes are missing, stale or cooling down.
  function opportunity(p,itemId,qty) {
    select(p);
    if(p.ironman)return null;
    if(!tradable(itemId)||saleProtectionReason(data,itemId)||!valid(qty))return null;
    const floor=merchantPrice(data,itemId);
    let merchant={net:floor*qty,qty,merchant:true};
    // Town buyback: valued at what it actually paid on average, for at most
    // half of its last daily volume (other sellers compete for it).
    const bb=buybackFor(p,itemId);
    if(bb&&qty+quantity(p,itemId)<=bb.qty/2) {
      const value=netOf(Math.round(bb.merchant*bb.ratio),qty);
      if(value>merchant.net)merchant={net:value,qty,buyback:true};
    }
    if(state.attempt||!slots(p)||hasOrder(itemId)||(cooldowns.get(itemId)??0)>now())return merchant;
    const book=quotes.get(itemId);
    if(!book||now()-book.at>=ttl) {
      // Price feed: the top bid, only for what its buyers can take after stock.
      const row=feedRow(itemId);
      if(row?.bid&&row.bidQty-quantity(p,itemId)>=qty) {
        const value=netOf(row.bid,qty);
        if(value>floor*qty&&value>merchant.net)return {net:value,qty,feed:true};
      }
      return merchant;
    }
    // Market value counts only new output that current buyers could absorb
    // after existing stock. Asking prices and escrow never count as earned income.
    let stock=quantity(p,itemId),remaining=qty,net=0,bidValue=null;
    for(const bid of [...book.bids].sort((a,b)=>b.price-a.price)) {
      const old=Math.min(stock,bid.qty),take=Math.min(remaining,bid.qty-old);
      const proceeds=netOf(bid.price,take);
      if(take>0&&proceeds<=floor*take)continue;
      stock-=old;remaining-=take;net+=proceeds;
      if(!remaining){bidValue={net,qty};break;}
    }
    // Listing mode: value at the listing price when recent buyers at that
    // price could take this output after existing stock and the queue ahead.
    if(pricing==='list'&&book.tradesKnown===true) {
      const listing=listingQuote(p,book,floor);
      const room=listing?listing.demand.volume-listing.demand.ahead-quantity(p,itemId):0;
      const best=[...book.bids].sort((a,b)=>b.price-a.price)[0]?.price;
      if(listing&&room>=qty&&listingWorthIt(listing,best)&&netOf(listing.price,qty)>floor*qty&&
        netOf(listing.price,qty)>(bidValue?.net??0))return {net:netOf(listing.price,qty),qty,listed:true};
    }
    return bidValue&&bidValue.net>merchant.net?bidValue:merchant;
  }
  // The lowest ask for one unit: a fresh live top of book, else the price feed.
  function askPrice(p,id) {
    select(p);
    const top=tops.get(id);
    if(top&&now()-top.at<60000)return top.ask>0&&top.askQty>0?top.ask:null;
    const row=feedRow(id);
    return row?.ask&&row.askQty>0?row.ask:null;
  }
  // What one unit would sell for through the three selling layers: the market
  // (bid, or listing in listing mode), the town buyback and the merchant.
  // Quality items are not sold automatically, so their market value is the
  // best fresh bid (live book or price feed) that could take the quantity.
  function unitValue(p,id,qty=1) {
    select(p);
    const merchant=merchantPrice(data,id);
    if(p.ironman)return merchant;
    // Protected ordinary items (e.g. bonus gems) have no sale quote: value them
    // like quality items, at the best fresh bid.
    const best=id===planner.base(id)?opportunity(p,id,qty):null;
    if(best)return Math.max(merchant,best.net>0?best.net/qty:0);
    const live=quotes.get(id);
    const bid=live&&now()-live.at<ttl?[...live.bids].sort((a,b)=>b.price-a.price).find(row=>row.qty>=qty)?.price:
      feedRow(id)?.bidQty>=qty?feedRow(id).bid:null;
    return Math.max(merchant,bid?netOf(bid,qty)/qty:0);
  }
  // Freshness counts from our fetch; a feed whose own timestamp is far from it
  // (an old cached copy, or a badly wrong clock) is not used.
  function setPriceFeed(value,at=now()) {
    const generated=Date.parse(value?.generatedAt);
    if(!value?.items||typeof value.items!=='object'||!Number.isFinite(generated)||Math.abs(at-generated)>3600000)return false;
    const price=n=>Number.isSafeInteger(n)&&n>0&&n<=1e9?n:null,amount=n=>Number.isSafeInteger(n)&&n>0?n:0;
    const items={};
    for(const [key,row]of Object.entries(value.items)) {
      const id=Number(key);
      if(!valid(id)||!row||typeof row!=='object')continue;
      items[id]={ask:price(row.lowestSell),askQty:amount(row.sellQty),bid:price(row.highestBuy),bidQty:amount(row.buyQty)};
    }
    feed={at,items};return true;
  }
  const feedRow=id=>feed&&now()-feed.at<feedTtl?feed.items[id]??null:null;
  function quote(id) {
    if((cooldowns.get(id)??0)>now())return {fallback:true};
    const current=quotes.get(id);
    if(current&&now()-current.at<ttl)return current;
    if(!requests.has(id))requests.set(id,{at:now(),sentAt:null});
    else {requests.get(id).background=false;requests.get(id).potionBackground=false;}
    // Count queue time too. A busy query queue must not keep the character idle.
    if(now()-requests.get(id).at>=waitMs) {
      const request=requests.get(id);
      if(request.sentAt!=null&&now()-request.sentAt>=waitMs){requests.delete(id);cooldowns.set(id,now()+coolMs);}
      return {fallback:true};
    }
    // Refresh stale quotes in the background, never reopen a blocking wait
    // each time a background tab wakes after the quote's fifteen-second TTL.
    if(current)return {fallback:true};
    return {waiting:true};
  }
  function atBank(p,intent,label,critical=false) {
    if(!critical&&!natural(p))return action(null,'市场交易待返仓','先完成当前任务，再处理盈余订单');
    if(!planner.nearBank(p)) {
      const bank=[...data.banks].sort((a,b)=>distance(p,a)-distance(p,b))[0];
      return action({t:'walk',...bank.approach},'市场交易 · 前往仓库',label);
    }
    if(p.route||p.path?.length)return action({t:'clearRoute'},'交易前停止路线并确认库存',label);
    return action(intent,label);
  }
  const tier=id=>rarityOf(data,id);
  const itemName=id=>itemLabel(data,id);
  const variants=id=>usableQualities(data,id);
  const purchasable=id=>valid(id)&&autoUsableMaterial(data,id)&&plusOf(data,id)<=5&&
    tradable(planner.base(id))&&(id<data.plusScale||!!planner.equipmentStats(id));
  function configureProcurement(value={}) {
    // Old reserve/hourly preferences migrate to value-based purchasing.
    procurement={enabled:value?.enabled!==false};
    if(!procurement.enabled)bookRequests.clear();
    return {...procurement};
  }
  function purchaseSpent() {
    if(!state)return 0;
    state.purchases=state.purchases.filter(e=>Number.isFinite(e.at)&&now()-e.at<3600000&&e.cost>0);
    return state.purchases.reduce((sum,e)=>sum+e.cost,0)+potionBudgetSpent();
  }
  function purchaseAllowance(p,goal=null) {
    return !procurement?.enabled||p.ironman?0:Math.max(0,p.coins-Math.max(0,goal?.budget?.coins??0));
  }
  function scan(p,ids) {
    select(p);
    if(!purchaseAllowance(p)||state.attempt||!slots(p))return [];
    const found=[];
    for(const id of new Set(ids.filter(purchasable))) {
      if(hasOrder(id)||(cooldowns.get(id)??0)>now())continue;
      const top=tops.get(id);
      if(top&&now()-top.at<60000){if(valid(top.ask)&&top.askQty>0)found.push(top);continue;}
      // The price feed answers without a query; buy() re-checks the live ask.
      const row=feedRow(id);
      if(row){if(row.ask&&row.askQty>0)found.push({itemId:id,ask:row.ask,askQty:row.askQty,feed:true});continue;}
      if(!bookRequests.has(id))bookRequests.set(id,{sentAt:null});
    }
    return found;
  }
  function marketUnitCost(p,id,qty=1) {
    select(p);const live=tops.get(id),rate=planner.coinRate?.(p);
    const top=live&&now()-live.at<60000?live:feedRow(id);
    if(p.ironman||!purchasable(id)||!procurement?.enabled||state.attempt||hasOrder(id)||!slots(p)||
      (cooldowns.get(id)??0)>now()||!top||!(rate>0)||!(top.ask>0)||top.askQty<qty||
      top.ask*qty>purchaseAllowance(p))return Infinity;
    return top.ask/rate;
  }
  function surplusValue(p,id,qty) {
    select(p);
    if(p.ironman||!tradable(id)||!valid(qty))return Infinity;
    const book=quote(id);
    // Unknown/stale markets never make goods "worthless". This query does not
    // pause gathering or authorize a sale; it only bounds the cost of disposal.
    if(book.waiting||book.fallback||!book.tradesKnown) {
      const row=feedRow(id);
      return row&&(row.ask||row.bid)?qty*Math.max(merchantPrice(data,id),row.ask??0,row.bid??0):Infinity;
    }
    const ask=Math.min(...book.asks.map(r=>r.price));
    const recent=book.trades.filter(r=>r.tick>=p.lastTick-recycleMs/data.tickMs);
    return qty*Math.max(merchantPrice(data,id),Number.isFinite(ask)?ask:0,
      ...book.bids.map(r=>r.price),...recent.map(r=>r.price));
  }
  function buy(p,id,qty,goal,label,reason,maxPrice=Infinity) {
    if(p.ironman||p.enhance||p.held||p.raidHeld||p.queue?.length||!purchasable(id)||!valid(qty)||state.attempt||!slots(p)||hasOrder(id))return null;
    const capacity=inventoryBudget(data,planner,p,goal);
    if(capacity.freeSlots<=0&&!(p.bank[id]>0))return null;
    const book=quote(id);
    if(book.waiting)return wait('正在核对候选物品的实时卖盘与采购预算');
    if(book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0];
    if(!ask||ask.price>maxPrice)return null;
    const amount=Math.min(qty,ask.qty,Math.floor(purchaseAllowance(p,goal)/ask.price),1000000);
    if(amount<1)return null;
    const result=atBank(p,{t:'marketBuy',itemId:id,qty:amount,price:ask.price},`${label} · ${itemName(id)} × ${amount}`,true);
    result.reason=`${reason}；单价 ${ask.price}，本笔 ${amount*ask.price} 金币；核对现有金币及任务必需开销`;
    if(result.intent?.t==='marketBuy')Object.assign(result,{procurement:true,purchaseReserve:goal?.budget?.coins??0});
    status=result.reason;return result;
  }
  function balancedPurchase(p,id,qty,goal,profession) {
    if(p.ironman||!purchasable(id)||!valid(qty)||state.attempt||!purchaseAllowance(p,goal))return null;
    need={itemId:id,qty,at:now()};
    const listed=orders.find(o=>o.itemId===id&&o.side==='sell'&&state.owned[o.id]);
    if(listed){reviewOrderId=null;return atBank(p,{t:'marketCancel',orderId:listed.id},'撤回自有挂单 · 当前计划需要',true);}
    if(!slots(p)||hasOrder(id)||(cooldowns.get(id)??0)>now())return null;
    const book=quote(id);
    if(book.waiting)return wait('比较买成品、买原料与自给的实际耗时');
    if(book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0],rate=planner.coinRate?.(p);
    if(!ask||!(rate>0))return null;
    const amount=Math.min(qty,ask.qty,Math.floor(purchaseAllowance(p,goal)/ask.price),1000000);
    if(amount<1)return null;
    const trip=2*Math.min(...data.banks.map(b=>distance(p,b.approach)))*data.tickMs/1000;
    // Buying its materials and crafting it (with the XP) beats buying it: the
    // planner crafts instead, and buys those materials through this same check.
    if(planner.crafting?.makeBeatsBuying(p,id,amount,amount*ask.price/rate,goal)) {
      status=`${itemName(id)}：买原料自制不比直接买贵（含制作经验），改为自制`;return null;
    }
    const seconds=amount*ask.price/rate+trip,self=planner.acquireEstimate?.(p,id,amount,profession);
    // Keep the goal's experience. Buying its ingredients need not compensate
    // every unrelated gathering XP point that self-supply would have earned.
    if(!self||seconds>(goal?.horizon??1800)||Number.isFinite(self.seconds)&&seconds>=self.seconds)return null;
    return buy(p,id,amount,goal,'市场补齐当前需求',`采购资金时间与往返约 ${Math.ceil(seconds)} 秒，自给${Number.isFinite(self.seconds)?`约 ${Math.ceil(self.seconds)} 秒`:'暂不可达'}`,ask.price);
  }
  function equipmentPurchase(p,goal,profession,{ids,score,evaluate,currentId=null,selfOptions=[]}) {
    select(p);if(!ids.length||!purchaseAllowance(p,goal))return null;
    const scanKey=JSON.stringify([profession,p.equipment,planner.levels(p)]);
    if(equipmentScan?.key!==scanKey)equipmentScan={key:scanKey,startedAt:now()};
    const bases=[...ids].sort((a,b)=>score(b)-score(a)).slice(0,3);
    if(currentId!=null&&ids.includes(planner.base(currentId))&&!bases.includes(planner.base(currentId)))bases.push(planner.base(currentId));
    const candidates=bases.flatMap(id=>variants(id).flatMap(quality=>Array.from({length:6},(_,plus)=>quality+plus*data.plusScale)));
    const books=scan(p,candidates),rate=planner.coinRate?.(p);if(!(rate>0))return null;
    const horizon=Math.max(7200,goal?.horizon??0),baseline=evaluate(bases[0]);
    if(!baseline)return null;
    const self=planner.acquireEstimate(p,bases[0],1,profession);
    const benchmark=Math.max(baseline.before*horizon,baseline.after*Math.max(0,horizon-self.seconds),
      ...selfOptions.map(option=>evaluate(option.id).after*Math.max(0,horizon-option.seconds)));
    const choices=books.filter(top=>top.ask<=purchaseAllowance(p,goal)).map(top=>{
      const improvement=evaluate(top.itemId),seconds=top.ask/rate+improvement.seconds;
      return {...top,improvement,value:improvement.after*Math.max(0,horizon-seconds)};
    }).filter(c=>c.improvement.after>c.improvement.before&&c.value>benchmark&&
      // Shared payback rule (investment.js): the price, as time at the gold rate,
      // must be repaid by the time saved while the piece is worn.
      payback({gold:c.ask,seconds:c.improvement.seconds,coinRate:rate,before:c.improvement.before,
        after:c.improvement.after,useSeconds:c.improvement.horizon??horizon}).worth)
      .sort((a,b)=>b.value-a.value||a.ask-b.ask);
    if(choices.length) {
      const best=choices[0],result=buy(p,best.itemId,1,goal,'市场升级装备',
        `比较品质与强化后的实际效率，预计提升 ${Math.round((best.improvement.after/Math.max(.001,best.improvement.before)-1)*100)}%；优于当前自制方案`,best.ask);
      if(result?.intent?.t==='marketBuy')result.equipmentItemId=best.itemId;
      return result;
    }
    // Optional investment quotes must never gate productive work. With many
    // qualities/slots, early quotes can expire before the last query finishes;
    // waiting for the whole set would restart the scan forever in a throttled tab.
    if(candidates.some(id=>bookRequests.has(id))) {
      status='后台查询装备报价；先继续当前供料或练级，取得报价后在任务边界复核';
      // One shared four-second window for the entire equipment/level state,
      // including unsent requests. Quote expiry cannot reopen that window.
      if(now()-equipmentScan.startedAt<waitMs)return wait('首次装备比价最多等待 4 秒；已有游戏任务继续运行');
    }
    return null;
  }
  function potionDose(p,id,goal,desired) {
    select(p);
    const reserve=inventoryBudget(data,planner,p,goal).items;
    const owned=variants(id).map(itemId=>({itemId,power:data.rarityMultipliers[tier(itemId)],
      qty:Math.min(desired,20,p.pack.filter(i=>i.itemId===itemId).reduce((n,i)=>n+i.qty,0)+
        (planner.nearBank(p)?p.bank[itemId]??0:0),Math.max(0,quantity(p,itemId)-(reserve[itemId]??0)))
    })).filter(choice=>choice.qty>0);
    if(!procurement?.enabled)return owned.sort((a,b)=>a.itemId-b.itemId)[0]??null;
    const choices=variants(id).map(itemId=>{
      const power=data.rarityMultipliers[tier(itemId)],top=tops.get(itemId);
      const available=p.pack.filter(i=>i.itemId===itemId).reduce((n,i)=>n+i.qty,0)+(planner.nearBank(p)?p.bank[itemId]??0:0);
      const qty=Math.min(desired,20,available,Math.max(0,quantity(p,itemId)-(reserve[itemId]??0)));
      const price=top&&now()-top.at<60000&&top.ask>0?top.ask:feedRow(itemId)?.ask??data.items[id].value*power;
      return {itemId,qty,power,value:price>0?price/power:Infinity};
    }).filter(c=>c.qty>0&&Number.isFinite(c.value)).sort((a,b)=>a.value-b.value||a.itemId-b.itemId);
    return choices[0]??null;
  }
  function potionStatus(p,itemId,goal=null,desiredQty=1) {
    select(p);
    const name=data.items[planner.base(itemId)]?.name??String(itemId);
    if(!procurement?.enabled)return {key:'procurement-off',message:`药水未喝：${name}库存不足，按收益采购已关闭`};
    if(p.ironman)return {key:'procurement-off',message:`药水未喝：${name}库存不足，铁人角色不采购市场药水`};
    if(!planner.nearBank(p)||p.route||p.path?.length||p.held||p.raidHeld||p.queue?.length)
      return {key:'route',message:`药水未喝：${name}库存不足，当前路线或位置不在安全补货边界`};
    if(!(purchaseAllowance(p,goal)>0))return {key:'budget',message:`药水未喝：${name}库存不足，采购预算不足`};
    const fresh=variants(itemId).some(id=>{const top=tops.get(id);return top&&now()-top.at<60000&&top.ask>0;});
    const waiting=variants(itemId).some(id=>bookRequests.has(id));
    if(!fresh)return {key:'quote',message:`药水未喝：${name}库存不足，正在等待有效卖盘报价`};
    if(!waiting&&desiredQty>0)return {key:'budget',message:`药水未喝：${name}暂无符合当前预算的卖盘`};
    return {key:'quote',message:`药水未喝：${name}暂无可用报价`};
  }
  // The most one bottle of this quality may cost. With a known worth (the
  // coins its hour of effect saves at the gold rate) the gold-as-time payback
  // rule applies; otherwise 3x base value per effect multiplier.
  const potionCap=(id,itemId,worth)=>(Number.isFinite(worth)&&worth>0?worth/PAYBACK_MARGIN:data.items[id].value*3)*
    data.rarityMultipliers[tier(itemId)];
  function balancedPotion(p,id,goal,desired,uncovered=[],worth=null) {
    if(!POTIONS.some(potion=>potion.itemId===id)||!valid(desired)||!planner.nearBank(p)||p.route||p.path?.length||
      p.enhance||p.held||p.raidHeld||p.queue?.length||goal?.itemTarget&&goal.targetItemId===id)return null;
    const reserve=inventoryBudget(data,planner,p,goal).items;
    const stocked=variants(id).reduce((n,itemId)=>n+Math.max(0,quantity(p,itemId)-(reserve[itemId]??0)),0);
    const missing=Math.max(0,Math.min(20,desired)-stocked);if(!missing)return null;
    const choices=scan(p,variants(id)).filter(top=>top.ask<=purchaseAllowance(p,goal)&&top.ask<=potionCap(id,top.itemId,worth))
      .sort((a,b)=>a.ask/data.rarityMultipliers[tier(a.itemId)]-b.ask/data.rarityMultipliers[tier(b.itemId)]||a.ask-b.ask);
    if(!choices.length)return null;
    const top=choices[0];
    // Cover other applicable expired effects before stacking this one to 20h.
    // Only fresh, affordable offers count; unknown stock never stalls work.
    let coverage=0;
    for(const other of new Set(uncovered))if(other!==id&&!variants(other).some(itemId=>quantity(p,itemId)>(reserve[itemId]??0))) {
      const asks=scan(p,variants(other)).filter(row=>row.ask<=purchaseAllowance(p,goal)&&
        row.ask<=data.items[other].value*3*data.rarityMultipliers[tier(row.itemId)]);
      if(asks.length)coverage+=Math.min(...asks.map(row=>row.ask));
    }
    if(coverage+top.ask>purchaseAllowance(p,goal)&&
      (p.brews?.[POTIONS.find(potion=>potion.itemId===id).kind]??0)>p.lastTick)return null;
    const coveredGoal=coverage+top.ask<=purchaseAllowance(p,goal)?
      {...goal,budget:{...goal?.budget,coins:(goal?.budget?.coins??0)+coverage}}:goal;
    const result=buy(p,top.itemId,coverage&&coveredGoal===goal?Math.min(1,missing):missing,coveredGoal,'按品质性价比补药',
      `各品质每瓶同为 1 小时，当前药效倍率 ×${data.rarityMultipliers[tier(top.itemId)]}`+
      (worth>0?`；药效每小时约省下价值 ${Math.round(worth*data.rarityMultipliers[tier(top.itemId)])} 金币的时间`:''),top.ask);
    return result?.intent?.t==='marketBuy'?{...result,consumablePurchase:true}:null;
  }
  function foodPurchase(p,goal,supplies) {
    select(p);if(!purchaseAllowance(p,goal)||!supplies.needFood)return null;
    const scanKey=JSON.stringify([goal?.skill,supplies.foodItemId,p.foodMaxTier]);
    if(foodScan?.key!==scanKey)foodScan={key:scanKey,startedAt:now()};
    const ids=data.jobs.filter(j=>j.skill==='cooking').flatMap(j=>variants(j.output.itemId))
      .filter(id=>tier(id)<=(p.foodMaxTier??1)&&(!goal?.itemTarget||id!==goal.targetItemId));
    const choices=scan(p,ids).map(top=>({...top,heal:foodHealing(data,planner,p,top.itemId,.5).heal}))
      .filter(c=>c.heal>=supplies.heal&&c.ask*supplies.needFood<=purchaseAllowance(p,goal))
      .sort((a,b)=>a.ask/a.heal-b.ask/b.heal||a.ask-b.ask);
    const best=choices[0];
    // A quote refresh cannot repeatedly defer preparing a usable food supply.
    if(!best)return now()-foodScan.startedAt<waitMs&&ids.some(id=>bookRequests.has(id))?
      wait('首次熟食比价最多等待 4 秒；随后继续自给备粮'):null;
    const self=planner.acquireEstimate(p,supplies.foodItemId,supplies.needFood+quantity(p,supplies.foodItemId)),rate=planner.coinRate(p);
    if(!(rate>0)||best.ask*supplies.needFood/rate>=self.seconds)return null;
    // Cooking it from bought fish (with the cooking XP) is no dearer: cook instead.
    if(planner.crafting?.makeBeatsBuying(p,best.itemId,supplies.needFood,best.ask*supplies.needFood/rate,goal))return null;
    const result=buy(p,best.itemId,supplies.needFood,goal,'市场补充熟食',
      `每份有效治疗 ${best.heal}；按实际缺口采购，遵守游戏自动进食品质上限`,best.ask);
    if(result?.intent?.t==='marketBuy')result.foodItemId=best.itemId;
    return result;
  }
  function buffFood(p,goal,{duration,enemyDps,healing,damageReduction,foodValue}) {
    select(p);if(!procurement?.enabled||p.ironman)return null;
    const ids=Object.values(data.items).filter(i=>i.heals).flatMap(i=>variants(i.id));
    const reserve=inventoryBudget(data,planner,p,goal,true).items,rate=planner.coinRate(p);
    const choices=scan(p,ids).map(top=>{
      const effects=foodEffects(data,top.itemId),tick=data.tickMs/1000;
      const fed=(p.brews?.fed??0)>p.lastTick?0:Math.min(duration,effects.fedTicks*tick);
      const rooted=(p.brews?.rooted??0)>p.lastTick?0:Math.min(duration,effects.rootedTicks*tick);
      // Use only half of the ideal 25% damage-buff time saving. Discrete hits
      // and travel make the theoretical maximum too optimistic.
      const benefit=rate*fed*.1+rooted*enemyDps/Math.max(1,healing)*damageReduction*foodValue;
      return {...top,fed,rooted,benefit};
    }).filter(c=>c.benefit>c.ask&&(!goal?.itemTarget||c.itemId!==goal.targetItemId))
      .sort((a,b)=>(b.benefit-b.ask)-(a.benefit-a.ask)||a.ask-b.ask);
    for(const c of choices) {
      const available=p.pack.filter(i=>i.itemId===c.itemId).reduce((n,i)=>n+i.qty,0)+(planner.nearBank(p)?p.bank[c.itemId]??0:0);
      const reason=`按本次战斗窗口比价，饱食覆盖约 ${Math.ceil(c.fed)} 秒、减伤约 ${Math.ceil(c.rooted)} 秒；参考价 ${c.ask}`;
      if(available>0&&quantity(p,c.itemId)>(reserve[c.itemId]??0))return action(
        {t:'eat',itemId:c.itemId,qty:1,...(!p.pack.some(i=>i.itemId===c.itemId&&i.qty>0)?{shelf:true}:{})},
        `使用增益食物 · ${itemName(c.itemId)}`,reason);
      if(!planner.nearBank(p)||p.route||p.path?.length||p.held||p.raidHeld||p.queue?.length)continue;
      // Buy only a dose that can be consumed without using reserved stock.
      if((reserve[c.itemId]??0)>quantity(p,c.itemId))continue;
      const result=buy(p,c.itemId,1,goal,'补充战斗增益食物',reason,c.ask);
      if(result?.intent?.t==='marketBuy')return {...result,consumablePurchase:true};
    }
    return null;
  }
  function slots(p) {
    return ordersKnown&&orders.length<(p.marketOrderSlots??10)&&Object.keys(state.owned).length<3;
  }
  const hasOrder=id=>orders.some(o=>o.itemId===id);
  function saleDemand(p,book,price,floor) {
    const trades=book.trades.filter(row=>row.tick<=p.lastTick&&(p.lastTick-row.tick)*data.tickMs<=recycleMs&&
      row.price>=price&&netOf(row.price,row.qty)>floor*row.qty);
    const volume=trades.reduce((n,row)=>n+row.qty,0);
    const ahead=book.asks.filter(row=>row.price<=price).reduce((n,row)=>n+row.qty,0);
    return {volume,ahead,illiquid:book.tradesKnown===true&&volume<=ahead};
  }
  // The price a new listing would use (just under the lowest ask, never above
  // recent trades, -10% per re-list) and the demand at that price.
  function listingQuote(p,book,floor,previous=null) {
    const prices=[...book.asks.map(row=>row.price),...book.trades.filter(row=>
      row.tick<=p.lastTick&&(p.lastTick-row.tick)*data.tickMs<=600000).map(row=>row.price)];
    const minimum=priceUp(minListPrice(floor,taxBp));
    const reference=prices.length?Math.min(...prices):floor*2;
    const recentDemand=book.trades.some(row=>row.tick<=p.lastTick&&(p.lastTick-row.tick)*data.tickMs<=recycleMs);
    const ask=recentDemand&&book.asks.length?stepBelow(Math.min(...book.asks.map(row=>row.price))):reference;
    const price=Math.max(minimum,priceDown(Math.min(ask,previous?Math.min(reference,Math.floor(previous.price*.9)):reference)));
    if(!valid(price)||price>1e9)return null;
    return {price,demand:saleDemand(p,book,price,floor)};
  }
  const netOf=(price,qty)=>netProceeds(price,qty,taxBp);
  const merchantUnit=id=>merchantPrice(data,id);
  const dayTicks=dayTicksOf(data);
  // Store the latest buyback report; the observed price ratio is what it
  // actually paid relative to the merchant price (capped at 1.5).
  function setBuyback(value,at=now()) {
    const last=value?.last;
    if(!last||!Number.isFinite(last.tick)||!Number.isFinite(last.coins)||!Array.isArray(last.items))return;
    const items=last.items.filter(r=>Number.isSafeInteger(r?.itemId)&&r.itemId>0&&Number.isSafeInteger(r.qty)&&r.qty>0&&data.items[planner.base(r.itemId)]);
    const atMerchant=items.reduce((n,r)=>n+r.qty*merchantUnit(r.itemId),0);
    if(!atMerchant)return;
    buyback={at,tick:last.tick,coins:last.coins,purse:Number.isFinite(value.purse)?value.purse:null,
      ratio:Math.min(1.5,Math.max(1,last.coins/atMerchant)),items:items.map(r=>({itemId:r.itemId,qty:r.qty}))};
  }
  // Buyback terms for an item bought in the last run: daily volume, the
  // observed price ratio, the 1.5x cap and the next run's tick.
  function buybackFor(p,itemId) {
    if(!buyback||now()-buyback.at>6*3600000||itemId!==planner.base(itemId))return null;
    const row=buyback.items.find(r=>r.itemId===itemId);
    if(!row)return null;
    const merchant=merchantUnit(itemId);
    let nextTick=buyback.tick+dayTicks;
    while(nextTick<=p.lastTick)nextTick+=dayTicks;
    return {qty:row.qty,ratio:buyback.ratio,merchant,cap:Math.floor(merchant*1.5),nextTick};
  }
  const buybackHolds=()=>Object.values(state?.owned??{}).filter(o=>o.buyback).length;
  // Listing is worth waiting for: >5% more after tax than the bid, and buyers
  // traded at that price recently beyond what is already queued ahead.
  const listingWorthIt=(listing,bidPrice)=>!!listing&&listing.demand.volume>listing.demand.ahead&&
    (bidPrice==null||netOf(listing.price,1)>netOf(bidPrice,1)*1.05);
  function listedQuantity(p,itemId) {
    select(p);
    return ordersKnown?orders.filter(o=>o.itemId===itemId&&o.side==='sell')
      .reduce((sum,o)=>sum+o.qtyRemaining,0):null;
  }
  function sale(p,vendorPlan,goal=null,profession='magic') {
    select(p);
    if(p.ironman)return defer(ironmanReason);
    const capacitySale=capacitySalesEnabled&&vendorPlan?.capacitySale===true;
    // Output of a task chosen for its sale income is sold even when everyday
    // selling is off; economy marks only those items as profitSale.
    const profitSale=vendorPlan?.profitSale===true;
    if(!salesEnabled&&!capacitySale&&!profitSale)return defer('平时出售已关闭，物品留给玩家处理');
    const scoped=result=>({...result,...(capacitySale?{capacitySale:true}:{}),...(profitSale?{profitSale:true}:{})});
    const intent=vendorPlan?.intent;
    if(intent?.t!=='marketDump')return vendorPlan;
    const id=intent.itemId,marketOnly=id!==planner.base(id);
    const retired=marketOnly?reviewInventory(data,planner,p,goal,profession).items.find(row=>row.itemId===id):null;
    const protectedReason=saleProtectionReason(data,id,marketOnly&&retired?.sellFromBank>0);
    if(protectedReason)return defer(protectedReason);
    if(!tradable(planner.base(id)))return defer('未确认可交易，保留物品');
    if(state.attempt)return defer('交易结果待确认，保留盈余并继续练级');
    if(!ordersKnown)return defer('等待同步市场订单，保留盈余并继续练级');
    if(hasOrder(id))return defer('同类物品已有订单，等待成交并继续练级');
    if(!slots(p))return defer('挂单槽暂满，保留盈余并继续练级');
    if((cooldowns.get(id)??0)>now())return defer('市场短暂冷却，稍后重新报价');
    const book=quote(id);
    if(book.waiting)return defer('查询买单与挂售价，等待期间继续练级');
    if(book.fallback)return defer('报价暂不可用，保留盈余并稍后重试');
    const previous=state.sales[id];
    const protectedQty=goal?.itemTarget?inventoryBudget(data,planner,p,goal).items[id]??0:0;
    const worn=Object.values(p.equipment??{}).filter(itemId=>itemId===id).length;
    const safeQty=Math.min(intent.qty,p.bank[id]??0,previous?.qty??1000000,retired?.sellFromBank??1000000,
      Math.max(0,quantity(p,id)+worn-protectedQty));
    if(safeQty<=0)return defer('暂无可出售的已确认盈余');
    if(marketOnly) {
      const what=data.gear.some(g=>g.itemId===planner.base(id))?'淘汰装备':'稀有加工品';
      const offer=equipmentOffer(p,id,safeQty,book);
      if(!offer)return defer(`${what}缺少近期同品质成交参考或需求不足；保留，不转系统回收`);
      status=`${what}按同品质近期成交参考出售，不转系统回收`;
      return scoped({...atBank(p,{t:'marketSell',itemId:id,...offer},
        `出售${what} · ${itemName(id)} × ${offer.qty}，单价 ${offer.price}`),equipmentSale:{goal,profession}});
    }
    const net=netOf;
    const bid=[...book.bids].sort((a,b)=>b.price-a.price).find(row=>
      net(row.price,Math.min(safeQty,row.qty))>intent.floor*Math.min(safeQty,row.qty));
    // In listing mode, wait for buyers at the ask unless this batch already
    // failed to sell through two re-pricings.
    const preferListing=pricing==='list'&&!(previous?.rounds>=2)&&book.tradesKnown===true&&
      listingWorthIt(listingQuote(p,book,intent.floor,previous),bid?.price);
    // Town buyback: list one below the cheapest ask, never above 1.5x the
    // merchant price, and hold through the next daily run. Taken only when
    // the bid pays less than the buyback's observed average and no ordinary
    // listing is clearly better; one attempt per batch, keeping a slot free.
    const bb=buybackFor(p,id);
    if(bb&&!previous?.buyback&&!preferListing&&buybackHolds()<2) {
      const asks=book.asks.map(row=>row.price);
      const price=priceDown(Math.min(bb.cap,asks.length?stepBelow(Math.min(...asks)):bb.cap));
      const minimum=priceUp(minListPrice(intent.floor,taxBp));
      const expected=net(Math.round(bb.merchant*bb.ratio),1);
      if(price>=minimum&&(!bid||net(bid.price,1)<expected)) {
        status='城镇回购：挂单等待下次回购，成交前不降价';
        const hours=Math.max(0,Math.ceil((bb.nextTick-p.lastTick)*data.tickMs/3600000));
        return {...scoped(atBank(p,{t:'marketSell',itemId:id,qty:safeQty,price},
          `城镇回购挂单 · ${data.items[id].name} × ${safeQty}，单价 ${price}`,false)),
          buyback:{holdUntilTick:bb.nextTick+Math.ceil(3600000/data.tickMs)},
          reason:`上次回购买入 ${bb.qty} 件，均价约商人价 ${bb.ratio.toFixed(2)} 倍；按不超过 1.5 倍（${bb.cap}）挂单，约 ${hours} 小时后回购，之后未成交转商人`};
      }
    }
    if(previous?.buyback&&!bid) {
      status='城镇回购未成交，按商人价出售';
      return scoped({...vendorPlan,intent:{...intent,qty:safeQty},label:`回购未成交 · ${data.items[id].name} × ${safeQty}，卖给商人`,
        reason:'上次回购没有买下本批挂单，按商人价出售剩余盈余'});
    }
    if(bid&&safeQty>0&&!preferListing) {
      status=pricing==='list'?'卖盘价没有明显更高或近期成交不足，直接成交买单':'优先成交税后高于系统回收的买单';
      return scoped(atBank(p,{t:'marketSell',itemId:id,qty:Math.min(safeQty,bid.qty),price:bid.price},
        `市场出售 · ${data.items[id].name}，单价 ${bid.price}`));
    }
    if(previous?.listedMs>=recycleMs&&previous.rounds>=2) {
      status='本批挂售已满 2 小时并重新定价，剩余物品转系统回收';
      return scoped({...vendorPlan,intent:{...intent,qty:safeQty},label:`长期未售出 · ${data.items[id].name} × ${safeQty}，系统回收`,
        reason:`累计挂售 ${Math.floor(previous.listedMs/60000)} 分钟、${previous.rounds} 轮；最新买单无更高税后收益，仅回收本批剩余盈余`});
    }
    const listing=listingQuote(p,book,intent.floor,previous);
    // Profit-task output was valued at no less than the merchant price. When
    // no bid beats the merchant and no recent buyers could absorb a listing,
    // sell to the merchant now instead of parking an unsellable listing.
    const marketable=!!listing&&book.tradesKnown===true&&listing.demand.volume>listing.demand.ahead&&
      net(listing.price,1)>intent.floor;
    if(profitSale&&!marketable) {
      status='收益工作产出：市场无更好成交，按商人价出售';
      return scoped({...vendorPlan,intent:{...intent,qty:safeQty},label:`出售给商人 · ${data.items[id].name} × ${safeQty}`,
        reason:`没有高于商人价（${intent.floor}/件）的买单，近 2 小时也没有足以消化挂单的成交；收益规划即按商人价估算`});
    }
    if(!listing)return defer('没有税后高于回收价的合法挂售价，保留物品');
    const {price,demand}=listing;
    if(capacitySale&&inventoryBudget(data,planner,p,goal).freeSlots<=0&&demand.illiquid) {
      status='满仓普通盈余：近期可见成交不足以覆盖排队卖量，转系统回收';
      return scoped({...vendorPlan,intent:{...intent,qty:safeQty},illiquidSale:true,
        label:`滞销普通盈余 · ${data.items[id].name} × ${safeQty}，系统回收`,
        reason:`最新买单没有更高税后收益；近 2 小时可见有效成交 ${demand.volume}，同价或更低卖量 ${demand.ahead}。只处理已扣除保留量的普通盈余`});
    }
    const qty=Math.min(safeQty,demand.volume>0?Math.max(1,demand.volume-demand.ahead):100);
    if(valid(price)&&price<=1e9&&net(price,qty)>intent.floor*qty) {
      status='市场挂卖；每 30 分钟顺路复核降价，累计至少 2 小时才回收';
      return scoped(atBank(p,{t:'marketSell',itemId:id,qty,price},
        `${previous?'市场重新定价':'市场挂卖'} · ${data.items[id].name} × ${qty}，单价 ${price}`,false));
    }
    return defer('没有税后高于回收价的合法挂售价，保留物品');
  }
  function equipmentOffer(p,id,qty,book) {
    if(!book?.tradesKnown||now()-book.at>=ttl)return null;
    const prices=book.trades.filter(row=>row.tick<=p.lastTick&&(p.lastTick-row.tick)*data.tickMs<=recycleMs)
      .map(row=>row.price).sort((a,b)=>a-b);
    if(!prices.length)return null;
    const reference=prices[Math.floor(prices.length/2)];
    const vendor=merchantPrice(data,id);
    const minimum=priceUp(Math.max(Math.ceil(reference*.9),minListPrice(vendor,taxBp)));
    const bid=[...book.bids].sort((a,b)=>b.price-a.price).find(row=>row.price>=minimum);
    if(bid)return {qty:Math.min(qty,bid.qty),price:bid.price};
    const price=Math.max(minimum,priceDown(Math.min(reference,book.asks.length?stepBelow(Math.min(...book.asks.map(row=>row.price))):reference)));
    const demand=saleDemand(p,book,price,vendor),available=demand.volume-demand.ahead;
    return available>0?{qty:Math.min(qty,available),price}:null;
  }
  function purchase(p,itemId,qty,goal=null,profession='magic') {
    select(p);
    if(procurement)return procurement.enabled?balancedPurchase(p,itemId,qty,goal,profession):null;
    if(p.ironman||!tradable(itemId)||!valid(qty)||state.attempt)return null;
    need={itemId,qty,at:now()};
    const listed=orders.find(o=>o.itemId===itemId&&o.side==='sell'&&state.owned[o.id]);
    if(listed){reviewOrderId=null;return atBank(p,{t:'marketCancel',orderId:listed.id},'撤回自有挂单 · 当前制作需要',true);}
    if(!slots(p)||hasOrder(itemId)||(cooldowns.get(itemId)??0)>now())return null;
    const book=quote(itemId);
    if(book.waiting)return wait('查询当前缺口的卖盘，比较采购筹币时间与自制经验');
    if(book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0];if(!ask)return null;
    const available=Math.max(0,p.coins-(goal?.budget?.coins??0));
    const amount=Math.min(qty,ask.qty,Math.floor(available/ask.price),1000000);if(amount<1)return null;
    const rate=planner.coinRate?.(p),cost=amount*ask.price;
    if(!(rate>0)||!Number.isFinite(rate))return null;
    const bankDistance=Math.min(...data.banks.map(b=>distance(p,b.approach)));
    const seconds=cost/rate+2*bankDistance*data.tickMs/1000;
    const self=planner.acquireEstimate?.(p,itemId,amount,profession);
    if(!self||seconds>(goal?.horizon??1800))return null;
    const job=data.jobs.find(j=>j.id===(goal?.recipeId??goal?.recipes?.[goal?.skill]));
    const tool=job&&Object.entries(data.toolSkills).find(([,skill])=>skill===job.skill)?.[0];
    const work=job&&workEstimate(data,job,planner.levels(p)[job.skill],
      {toolBonus:planner.equipmentStats(p.equipment[tool])?.bonus??0,quick:p.perks?.quick??0,hands:p.perks?.hands??0});
    const xpRate=goal?.rate?.xp??(work?work.xp/work.seconds:0);
    // Buying saves time but sacrifices the experience self-production earns.
    if((self.xp??0)>0&&!(xpRate>0))return null;
    if(Number.isFinite(self.seconds)&&!(seconds+(xpRate>0?(self.xp??0)/xpRate:0)<self.seconds))return null;
    status=`按当前缺口采购，预计筹币及往返 ${Math.ceil(seconds)} 秒`;
    return atBank(p,{t:'marketBuy',itemId,qty:amount,price:ask.price},
      `按需采购 · ${data.items[itemId].name} × ${amount}`,true);
  }
  function potionBudgetSpent() {
    if(!state)return 0;
    state.potionPurchases=state.potionPurchases.filter(entry=>now()-entry.at<3600000);
    return state.potionPurchases.reduce((sum,entry)=>sum+entry.cost,0);
  }
  // A potion ingredient, when buying it and brewing beats buying the potion.
  // Same safe boundary and live-book check as a potion purchase.
  function restockIngredient(p,itemId,qty,goal=null,maxPrice=Infinity,why='') {
    select(p);
    if(!procurement?.enabled||!valid(qty)||!planner.nearBank(p)||p.route||p.path?.length||
      p.enhance||p.held||p.raidHeld||p.queue?.length)return null;
    const result=buy(p,itemId,qty,goal,'买原料自制药水',why||'买原料自制比直接买药水便宜',maxPrice);
    return result?.intent?.t==='marketBuy'?{...result,consumablePurchase:true}:null;
  }
  function restockPotion(p,itemId,goal=null,desiredQty=1,uncovered=[],worth=null) {
    select(p);
    if(procurement)return procurement.enabled?balancedPotion(p,itemId,goal,desiredQty,uncovered,worth):null;
    if(p.ironman||goal?.itemTarget&&goal.targetItemId===itemId||!valid(desiredQty)||!POTIONS.some(potion=>potion.itemId===itemId)||!tradable(itemId)||state.attempt||
      !planner.nearBank(p)||p.route||p.path?.length||p.enhance||p.held||p.raidHeld||p.queue?.length||
      !slots(p)||hasOrder(itemId)||
      (cooldowns.get(itemId)??0)>now())return null;
    const reserve=goal?.budget?.items?.[itemId]??0,coins=goal?.budget?.coins??0;
    const missing=Math.min(20,desiredQty)-Math.max(0,quantity(p,itemId)-reserve);
    if(missing<=0)return null;
    const limit=Math.min(3000,Math.floor(Math.max(0,p.coins-coins-1000)*.01));
    const spent=potionBudgetSpent();
    if(limit<=spent||!persist())return null;
    const book=quote(itemId);
    if(book.waiting||book.fallback)return null;
    const ask=[...book.asks].sort((a,b)=>a.price-b.price)[0];
    if(!ask||ask.price>potionCap(itemId,itemId,worth)||ask.price+spent>limit)return null;
    const qty=Math.min(missing,ask.qty,Math.floor((limit-spent)/ask.price));
    if(!valid(qty))return null;
    return {...action({t:'marketBuy',itemId,qty,price:ask.price},`顺路补药 · ${data.items[itemId].name} × ${qty}`,
      `每瓶 ${ask.price} 金币，本批 ${qty*ask.price}；近一小时已承诺 ${spent}，当前额度 ${limit}；保留任务预算与 1000 金币`),
      consumablePurchase:true,potionRestock:{desiredQty,coins,reserve,worth}};
  }
  function issued(before,intent,plan=null) {
    select(before);
    if(before.ironman&&['marketBuy','marketSell','marketCancel','marketDump'].includes(intent.t))return false;
    if(intent.t==='marketBuy'&&!autoUsableMaterial(data,intent.itemId))return false;
    const equipmentSale=intent.t==='marketSell'&&plan?.equipmentSale;
    if(['marketSell','marketDump'].includes(intent.t)&&saleProtectionReason(data,intent.itemId,!!equipmentSale))return false;
    if(equipmentSale) {
      const row=reviewInventory(data,planner,before,equipmentSale.goal,equipmentSale.profession).items.find(i=>i.itemId===intent.itemId);
      const offer=equipmentOffer(before,intent.itemId,intent.qty,quotes.get(intent.itemId));
      if(state.attempt||!salesEnabled&&!(capacitySalesEnabled&&plan.capacitySale)&&plan.profitSale!==true||!row?.marketOnly||row.sellFromBank<intent.qty||
        !valid(intent.qty)||!offer||offer.price!==intent.price||offer.qty<intent.qty||!planner.nearBank(before)||
        before.route||before.path?.length||!slots(before)||hasOrder(intent.itemId))return false;
    }
    if(intent.t==='marketDump'&&plan?.illiquidSale) {
      const book=quotes.get(intent.itemId),minimum=priceUp(minListPrice(intent.floor,taxBp));
      const price=Math.max(minimum,book?.asks.length?priceDown(stepBelow(Math.min(...book.asks.map(row=>row.price)))):minimum);
      if(!capacitySalesEnabled||!plan.capacitySale||inventoryBudget(data,planner,before).freeSlots>0||
        !book||now()-book.at>=ttl||!saleDemand(before,book,price,intent.floor).illiquid||
        book.bids.some(row=>netOf(row.price,Math.min(intent.qty,row.qty))>
          intent.floor*Math.min(intent.qty,row.qty)))return false;
    }
    if(intent.t==='marketDump') {
      // Consume this batch's allowance before submission. An uncertain result
      // must not authorize recycling newly produced stock after a refresh.
      delete state.sales[intent.itemId];persist();
      return;
    }
    if(!['marketBuy','marketSell','marketCancel'].includes(intent.t)||state.attempt)return plan?.consumablePurchase||plan?.procurement?false:undefined;
    if(plan?.procurement) {
      const book=quotes.get(intent.itemId),ask=book?.asks.find(row=>row.price===intent.price&&row.qty>=intent.qty);
      const capacity=inventoryBudget(data,planner,before);
      if(!procurement?.enabled||intent.t!=='marketBuy'||!purchasable(intent.itemId)||!valid(intent.qty)||!valid(intent.price)||
        !planner.nearBank(before)||before.route||before.path?.length||before.enhance||before.held||before.raidHeld||before.queue?.length||
        capacity.freeSlots<=0&&!(before.bank[intent.itemId]>0)||!slots(before)||hasOrder(intent.itemId)||
        !book||now()-book.at>=ttl||!ask||intent.qty*intent.price>purchaseAllowance(before,{budget:{coins:plan.purchaseReserve??0}}))return false;
    } else if(plan?.consumablePurchase) {
      const restock=plan.potionRestock;
      if(intent.t!=='marketBuy'||!restock||!valid(intent.qty)||!valid(intent.price))return false;
      const current=restockPotion(before,intent.itemId,
        {budget:{coins:restock.coins,items:{[intent.itemId]:restock.reserve}}},restock.desiredQty,[],restock.worth);
      if(!current||current.intent.price!==intent.price||current.intent.qty<intent.qty)return false;
    }
    const cancelled=intent.t==='marketCancel'?state.owned[intent.orderId]:null;
    const order=cancelled&&orders.find(o=>ownMatch(o,cancelled));
    const itemId=intent.itemId??cancelled?.itemId;
    state.attempt={intent:{...intent},at:now(),baselineIds:orders.map(o=>o.id),revision,
      cancelledOrder:order?{...cancelled,qtyRemaining:order.qtyRemaining}:cancelled,
      capacitySale:plan?.capacitySale===true,profitSale:plan?.profitSale===true,buyback:plan?.buyback??null,
      equipmentSale:!!equipmentSale,
      reviewSale:!!cancelled&&reviewOrderId===intent.orderId,
      before:{id:before.id,coins:before.coins,quantity:itemId?quantity(before,itemId):0},filled:0};
    if(plan?.procurement&&intent.t==='marketBuy') {
      purchaseSpent();state.purchases.push({at:now(),cost:intent.price*intent.qty});
      if(!persist()){state.purchases.pop();state.attempt=null;return false;}
      return true;
    }
    if(plan?.consumablePurchase&&intent.t==='marketBuy') {
      // Reserve the full submitted amount before sending. Rejection or escrow
      // cancellation cannot turn a rolling spending limit into a retry loop.
      potionBudgetSpent();state.potionPurchases.push({at:now(),cost:intent.price*intent.qty});
      if(!persist()) {state.potionPurchases.pop();state.attempt=null;return false;}
      return true;
    }
    persist();
  }
  function confirmed(before,p,intent) {
    select(p);const attempt=state.attempt;
    if(!attempt||JSON.stringify(attempt.intent)!==JSON.stringify(intent))return false;
    if(intent.t==='marketCancel')return ordersKnown&&revision>attempt.revision&&
      !orders.some(o=>o.id===intent.orderId);
    const fresh=ordersKnown&&revision>attempt.revision;
    if(fresh&&orders.filter(o=>!attempt.baselineIds.includes(o.id)&&matching(o,intent)).length===1)return true;
    if((attempt.filled??0)>=intent.qty)return true;
    return fresh&&intent.t==='marketBuy'&&quantity(p,intent.itemId)-attempt.before.quantity>=intent.qty&&
      p.coins<attempt.before.coins;
  }
  function settled(p,intent) {
    select(p);const attempt=state.attempt;
    if(!attempt||!confirmed(null,p,intent))return;
    if(intent.t==='marketCancel') {
      const owned=state.owned[intent.orderId]??attempt.cancelledOrder;
      if(owned) {
        cooldowns.set(owned.itemId,now()+coolMs);
        if(owned.side==='sell') {
          const returned=Math.min(attempt.cancelledOrder?.qtyRemaining??0,
            Math.max(0,quantity(p,owned.itemId)-attempt.before.quantity));
          if(attempt.reviewSale&&returned>0)state.sales[owned.itemId]={qty:returned,stock:quantity(p,owned.itemId),price:owned.price,
            listedMs:(owned.listedMs??0)+Math.max(0,attempt.at-owned.at),rounds:owned.rounds??1,capacitySale:owned.capacitySale===true,profitSale:owned.profitSale===true,buyback:!!owned.buyback};
          else delete state.sales[owned.itemId];
        }
      }
      delete state.owned[intent.orderId];
    } else {
      const created=orders.filter(o=>!attempt.baselineIds.includes(o.id)&&matching(o,intent));
      const previous=intent.t==='marketSell'?state.sales[intent.itemId]:null;
      if(created.length===1)state.owned[created[0].id]={...created[0],at:attempt.at,
        listedMs:previous?.listedMs??0,rounds:(previous?.rounds??0)+1,capacitySale:attempt.capacitySale===true,profitSale:attempt.profitSale===true,equipmentSale:attempt.equipmentSale===true,buyback:attempt.buyback??null};
      if(intent.t==='marketSell')delete state.sales[intent.itemId];
      quotes.delete(intent.itemId);requests.delete(intent.itemId);
    }
    state.attempt=null;persist();
  }
  function next(p,goal=null,profession='magic') {
    select(p);
    if(p.ironman){status=ironmanReason;return null;}
    if(state.attempt) {
      if(confirmed(null,p,state.attempt.intent))settled(p,state.attempt.intent);
      else {status='交易结果待确认，暂不重发；继续自给';return null;}
    }
    if(!ordersKnown)return null;
    let deferredCancel=null;
    for(const owned of Object.values(state.owned)) {
      const order=orders.find(o=>ownMatch(o,owned));if(!order)continue;
      const returned=owned.equipmentSale?{...p,bank:{...p.bank,[order.itemId]:(p.bank[order.itemId]??0)+order.qtyRemaining}}:null;
      const retired=returned&&reviewInventory(data,planner,returned,goal,profession).items.find(row=>row.itemId===order.itemId);
      if(order.side==='sell'&&(saleProtectionReason(data,order.itemId,!!retired?.marketOnly)||
        owned.equipmentSale&&!(retired?.sellFromBank>=order.qtyRemaining))) {
        reviewOrderId=null;
        return atBank(p,{t:'marketCancel',orderId:order.id},'撤回受保护物品的旧脚本挂单',true);
      }
      if((cooldowns.get(order.itemId)??0)>now())continue;
      if(order.side==='sell'&&!salesEnabled&&!(capacitySalesEnabled&&owned.capacitySale===true)&&owned.profitSale!==true) {
        reviewOrderId=null;
        const cancel=atBank(p,{t:'marketCancel',orderId:order.id},'平时出售已关闭，撤回助手自己的挂单');
        if(cancel.intent)return cancel;
        deferredCancel??=cancel;continue;
      }
      const reserves=inventoryBudget(data,planner,p,goal).items;
      const needed=(reserves?.[order.itemId]??0)>quantity(p,order.itemId)||
        (need?.itemId===order.itemId&&now()-need.at<ttl);
      // A buyback listing is held, not re-priced, until just after the next daily run.
      if(order.side==='sell'&&!needed&&owned.buyback&&p.lastTick<owned.buyback.holdUntilTick)continue;
      if(order.side==='buy'||needed||now()-owned.at>=reviewMs) {
        reviewOrderId=order.side==='sell'&&!needed?order.id:null;
        return atBank(p,{t:'marketCancel',orderId:order.id},order.side==='buy'?
          '撤销采购余单，释放剩余金币':needed?'撤回自有挂单 · 当前计划需要':'复核市场挂单，撤回余量后重新定价',
          order.side==='buy'||needed);
      }
    }
    return deferredCancel;
  }
  function setAutoSell(enabled) {
    salesEnabled=enabled===true;
    if(!salesEnabled) {
      watched=[];priorityItem=null;watchCursor=0;reviewOrderId=null;
      for(const [id,request]of requests)if(request.background)requests.delete(id);
    }
    status=salesEnabled?'市场优先；挂售至少 2 小时并重新定价后才回收':'平时出售已关闭，物品留给玩家处理';
  }
  function setCapacitySales(enabled) {capacitySalesEnabled=enabled===true;}
  function setSalePricing(value) {pricing=value==='bid'?'bid':'list';}
  function rejected(code) {
    refresh();
    const known=['not-at-bank','price-changed','not-tradable','too-many-orders','cannot-afford',
      'below-floor','nothing-to-sell','no-such-order','storage-full','bank-full','pack-full',
      'nothing-to-deposit','nothing-to-withdraw','nothing-to-eat','cannot-enhance','cannot-fight',
      'cannot-set-route','cannot-wield','cannot-equip','level-too-low','market-price-step'];
    if(!state?.attempt||!known.includes(code))return;
    const intent=state.attempt.intent,owned=state.owned[intent.orderId];
    const id=intent.itemId??owned?.itemId;
    if(id!=null){cooldowns.set(id,now()+coolMs);quotes.delete(id);requests.delete(id);tops.delete(id);bookRequests.delete(id);}
    state.attempt=null;status='市场暂不可用，短暂冷却后再比价';persist();
  }
  const buybackSummary=()=>{
    if(!buyback)return '';
    const held=buybackHolds(),hours=Math.round((buyback.tick+dayTicks-snapshotTick)*data.tickMs/3600000);
    return `；城镇回购：上次买入 ${buyback.items.length} 种，均价约商人价 ${buyback.ratio.toFixed(2)} 倍`+
      (Number.isFinite(hours)&&hours>0?`，约 ${hours} 小时后再次回购`:'')+(held?`，等待回购的挂单 ${held} 笔`:'');
  };
  const feedSummary=()=>!feed?'；价格总表未取得，估值按实时报价或公式':now()-feed.at<feedTtl?
    `；价格总表 ${Math.max(0,Math.floor((now()-feed.at)/60000))} 分钟前更新，仅用于估值，下单前核对实时盘口`:'；价格总表已过期，估值按实时报价或公式';
  const summary=()=>`${status}${buybackSummary()}${feedSummary()}；成交净收入 ${state?.income??0}，采购支出 ${state?.spent??0}，自有挂单 ${Object.keys(state?.owned??{}).length}；近一小时补药承诺 ${potionBudgetSpent()}`+
    (procurement?.enabled?`；按收益／节时采购，无固定金币底线和小时限额；近一小时承诺 ${purchaseSpent()}`:'');
  function runtime(value) {
    if(value) {({saved,savedText,storageReadable,playerId,orders,ordersKnown,revision,taxBp,snapshotTick,quotes,requests,cooldowns,lastQuery,lastSync,procurement,tops,bookRequests,equipmentScan,foodScan,watched,potionWatched,watchCursor,priorityItem,salesEnabled,capacitySalesEnabled,need,recentOwned,reviewOrderId,status}=value);if(value.pricing)pricing=value.pricing;if('buyback' in value)buyback=value.buyback;if('feed' in value)feed=value.feed;state=playerId===null?null:playerState(playerId);}
    return {saved,savedText,storageReadable,playerId,orders,ordersKnown,revision,taxBp,snapshotTick,quotes,requests,cooldowns,lastQuery,lastSync,procurement,tops,bookRequests,equipmentScan,foodScan,watched,potionWatched,watchCursor,priorityItem,salesEnabled,capacitySalesEnabled,need,recentOwned,reviewOrderId,status,pricing,buyback,feed};
  }
  return {runtime,receive,next,sale,purchase,restockPotion,restockIngredient,potionStatus,potionBudgetSpent,query,watch,watchPotions,opportunity,listedQuantity,issued,confirmed,settled,rejected,summary,setAutoSell,setCapacitySales,setSalePricing,setBuyback,setPriceFeed,unitValue,askPrice,priceFeedAge:()=>feed?now()-feed.at:null,
    configureProcurement,equipmentPurchase,foodPurchase,buffFood,potionDose,marketUnitCost,surplusValue,watchPurchases:scan,
    purchaseAllowance:(p,goal)=>{select(p);return purchaseAllowance(p,goal);}};
}
