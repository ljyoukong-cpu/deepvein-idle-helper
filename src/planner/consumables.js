import {professionSkill} from './professions.js';
import {PAIR_TIERS, RARITY_NAMES, autoUsableMaterial, craftRecipe, setsAt, usableQualities} from './quality.js';
import {expectedAttacks, workEstimate} from './estimates.js';
import {POTIONS, brewPower, foodEffects, potionRefillQty} from './supplies.js';
import {inventoryBudget} from './inventory.js';
import {MAKE_BIAS} from './crafting.js';
import {baseId, baseStride, distance, nearestBank, packCapacity, packUsed, rarityOf} from './items.js';

export function swiftPotion(data,planner,p,plan,window,drinkQty) {
  const itemId=225,next=plan?.intent,route=next??p.route;
  if(!route||next&&!['walk','setRoute','fight'].includes(next.t))return null;
  const job=data.jobs.find(j=>j.id===route.jobId);
  const target=next?.t==='walk'?next:data.sites.find(s=>s.id===route.siteId)??data.zones.find(z=>z.id===route.zoneId);
  if(!target||!next&&(!job||job.grow||route.errand))return null;
  const tick=data.tickMs/1000;
  const bank=point=>nearestBank(data,point).approach;
  const stride=baseStride(data,p);
  const speed=Math.round(stride)/1000,boosted=Math.round(stride*1.2)/1000;
  let remaining=Math.min(600,Math.max(0,window)),travel=0,position=p;
  const move=to=>{const seconds=Math.min(remaining,distance(position,to)*tick/speed);
    travel+=seconds;remaining-=seconds;position=to;};
  // Drinking does not recompute an already generated path's strideSpeed.
  if(!next&&p.activity==='walking'&&p.path?.length) {
    remaining=Math.max(0,remaining-Math.max(0,p.path.length-(p.pathIndex??0))*tick/((p.strideSpeed??Math.round(stride))/1000));
    position=p.path.at(-1);
  }
  if(next?.t==='walk')move(target);
  else {
    if(!next&&route.phase==='toBank'&&!p.path?.length)move(bank(position));
    if(next)move(target);
    else position=target;
    if(job&&!job.inputs.length&&!job.grow&&['mining','fishing','woodcutting'].includes(job.skill)&&
      !data.items[job.output.itemId]?.stackable&&(route.onFull??'bank')==='bank'&&
      (next||!['toBank','banking'].includes(route.phase))) {
      const slot=Object.keys(data.toolSkills).find(k=>data.toolSkills[k]===job.skill);
      const seconds=workEstimate(data,job,planner.levels(p)[job.skill],{toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
        quick:p.perks?.quick??0,hands:p.perks?.hands??0}).seconds;
      const capacity=packCapacity(p);
      let dose=drinkQty;
      const freed=p.pack.filter(i=>i.itemId===itemId).reduce((slots,i)=>{
        const used=Math.min(dose,i.qty);dose-=used;
        return slots+(data.items[itemId]?.stackable?Number(used===i.qty):used);
      },0);
      const used=packUsed(data,p)-freed;
      let free=route.phase==='toBank'||route.phase==='banking'?capacity:Math.max(0,capacity-used);
      let count=route.limit==null||route.limit===0?Infinity:Math.max(0,route.limit);
      while(remaining>0&&count>0) {
        const batch=Math.min(count,Math.floor(free/job.output.qty));
        remaining=Math.max(0,remaining-batch*seconds);count-=batch;
        if(count<=0||remaining<=0)break; // The final finite batch stops in place.
        move(bank(target));
        if(!next)break; // Existing work may be replaced at this banking boundary.
        remaining=Math.max(0,remaining-3*tick);move(target);free=capacity;
      }
    }
  }
  const saved=travel*(1-speed/boosted);
  return travel>0?{intent:{t:'drink',itemId,qty:1},label:'使用疾行药剂',gain:saved,
    reason:`移动速度 +20%；按未来 ${Math.ceil(Math.min(600,window))} 秒内本路线的新路程与中途存仓往返估算，`+
      `可加速路程约 ${Math.floor(travel)} 秒，预计节省 ${Math.floor(saved)} 秒；不计当前已生成路径和未知后续任务`}:null;
}

// Keep applicable owned potions active for the actual next/current task,
// not its supply-chain goal label. Surplus food retains its value check.
export function planConsumable(data,planner,p,goal,profession,plan,window=600) {
  const report=(key,message)=>planner.reportConsumable?.(key,message);
  if(!p.brews||!Number.isFinite(p.lastTick)) {
    report('blocked','药水未喝：尚未取得有效的药效状态');
    planner.watchPotions?.(p,[]);return null;
  }
  if(p.enhance||plan?.blocked||plan?.deferUntilTick) {
    report('blocked','药水未喝：当前有强化或等待中的高优先级任务');
    planner.watchPotions?.(p,[]);return null;
  }
  if(p.held||p.raidHeld||p.queue?.length) {
    report('queue','药水未喝：玩家队列或搁置任务优先，等待队列完成');
    planner.watchPotions?.(p,[]);return null;
  }
  const next=plan?.intent;
  const route=next??p.route;
  const job=data.jobs.find(j=>j.id===route?.jobId);
  const budget=inventoryBudget(data,planner,p,goal,true),candidates=[];
  const active=kind=>(p.brews[kind]??0)>p.lastTick;
  const carried=id=>p.pack.some(i=>i.itemId===id&&i.qty>0);
  const accessible=id=>carried(id)||planner.nearBank(p)&&(p.bank[id]??0)>0;
  const potionVariants=id=>usableQualities(data,id);
  const potionQuantity=id=>p.pack.filter(i=>i.itemId===id&&i.qty>0).reduce((sum,i)=>sum+i.qty,0)+
    (planner.nearBank(p)?p.bank[id]??0:0);
  const potionReserve=id=>Math.max(0,budget.items[id]??0);
  const usablePotion=id=>Math.min(potionQuantity(id),Math.max(0,planner.count(p,id)-potionReserve(id)));
  const potionSurplus=id=>potionVariants(id).reduce((sum,itemId)=>
    sum+usablePotion(itemId),0);
  const ownedDose=(id,desired)=>potionVariants(id).map(itemId=>({itemId,power:data.rarityMultipliers[rarityOf(data,itemId)],
    qty:Math.min(desired,20,usablePotion(itemId))}))
    .filter(choice=>choice.qty>0).sort((a,b)=>a.itemId-b.itemId)[0]??null;
  const producing=id=>job?.output.itemId===id||data.jobs.some(j=>j.id===p.route?.jobId&&j.output.itemId===id)||
    p.activity==='working'&&data.jobs.some(j=>j.id===p.workJobId&&j.output.itemId===id);
  const surplus=id=>potionSurplus(id);
  const useQty=(id,desired)=>Math.min(desired,surplus(id));
  const coinRate=planner.coinRate?.(p)??0;
  // Coins one common bottle's hour of effect is worth: the share of time it
  // saves, at the gold rate (gold as time). Null when not measurable.
  const worthOf=fraction=>fraction>0&&coinRate>0?fraction*3600*coinRate:null;
  const restock=(id,desired,uncovered=[],worth=null)=>planner.nearBank(p)&&p.activity==='idle'&&!p.route&&!p.path?.length?
    planner.restockPotion?.(p,id,goal,desired,uncovered,worth):null;
  const recipeFor=itemId=>data.jobs.find(j=>j.skill==='herblore'&&!j.grow&&j.output.itemId===itemId);
  const brewSite=recipe=>data.sites.filter(s=>s.jobIds.includes(recipe.id)).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  const held=id=>Math.max(0,planner.count(p,id)-(budget.items[id]??0));
  // Cost per bottle of each way to cover a shortfall of `qty`: buying the
  // potion at its ask, or brewing it — held ingredients at what they would sell
  // for, missing ones at their ask, the brewing and trip time at the gold rate,
  // less the herblore training time its XP saves while herblore is the goal.
  function supplyCosts(itemId,qty,tier=0) {
    const buy=planner.marketAsk?.(p,itemId)??Infinity,base=recipeFor(itemId),site=base&&brewSite(base);
    const recipe=base&&craftRecipe(data,base,tier);
    if(!recipe||!site||planner.levels(p).herblore<recipe.levelReq)return {buy:buy||Infinity,brew:Infinity,missing:[]};
    let coins=0;const missing=[];
    for(const input of recipe.inputs) {
      const need=input.qty*qty,use=Math.min(need,held(input.itemId)),short=need-use;
      if(use>0)coins+=use*(planner.marketUnitValue?.(p,input.itemId,use)??0);
      if(short>0) {
        const ask=planner.marketAsk?.(p,input.itemId);
        coins+=ask>0?short*ask:Infinity;missing.push({itemId:input.itemId,qty:short,ask});
      }
    }
    const lv=planner.levels(p),e=workEstimate(data,recipe,lv.herblore,{quick:p.perks?.quick??0,hands:p.perks?.hands??0});
    const tick=data.tickMs/1000,trip=(distance(p,site)+distance(site,nearestBank(data,site).approach))*tick;
    const training=goal?.skill==='herblore'&&goal.rate?.xp>0?qty*e.xp/goal.rate.xp:0;
    const seconds=qty*e.seconds/Math.max(.01,e.success)+trip-training;
    return {buy:buy||Infinity,brew:(coins+seconds*coinRate)/qty,missing,training:training>0};
  }
  // Brew from held ingredients, only where switching task costs nothing: no
  // route, or the plan replaces it.
  const brew=(itemId,label,qty,why,tier=0)=>{
    const base=recipeFor(itemId),recipe=base&&craftRecipe(data,base,tier);
    if(!recipe||planner.levels(p).herblore<recipe.levelReq||!(next?.t==='setRoute'||!p.route&&!p.path?.length))return null;
    const n=Math.min(qty,20,setsAt(recipe,held));
    const site=brewSite(base);
    if(!(n>=1)||!site)return null;
    const quality=tier?`${RARITY_NAMES[tier]}`:'';
    return {intent:{t:'setRoute',siteId:site.id,jobId:base.id,onFull:'bank',limit:n,...(tier?{rarity:tier}:{})},label:`自制${quality}${label} × ${n}`,
      reason:`药水不足，用库存的${quality}${base.inputs.map(i=>data.items[i.itemId]?.name).join('、')}自制${why?`（${why}）`:''}；做完继续原任务`,
      potionBrew:{jobId:base.id}};
  };
  // Missing ingredients are bought at the same safe boundary as potions.
  const buyIngredient=(row,why)=>planner.nearBank(p)&&p.activity==='idle'&&!p.route&&!p.path?.length?
    planner.restockIngredient?.(p,row.itemId,row.qty,goal,Math.ceil(row.ask*1.05),why):null;
  const choose=()=>{
    const due=candidates.filter(({itemId})=>!producing(itemId))
      .map(potion=>({...potion,desired:potionRefillQty(p,potion.kind)})).filter(potion=>potion.desired>0)
      .sort((a,b)=>Number(active(a.kind))-Number(active(b.kind)));
    const missing=due.filter(({itemId,desired})=>surplus(itemId)<desired);
    const uncovered=missing.filter(({kind})=>!active(kind)).map(potion=>potion.itemId);
    planner.watchPotions?.(p,missing.map(potion=>potion.itemId));
    for(const {itemId,kind,action,desired,worth,canDrink=true}of due)if(canDrink) {
      const dose=planner.potionDose?.(p,itemId,goal,desired)??ownedDose(itemId,desired);
      const qty=useQty(itemId,desired);
      // Recover an expired effect immediately. If it is still active, a known
      // same-kind purchase can complete the 20-hour batch before drinking.
      if(active(kind)&&(dose?.qty??qty)>0&&(dose?.qty??qty)<desired) {
        const refill=restock(itemId,desired,uncovered,worth);if(refill)return refill;
      }
      if(dose)return {...action,intent:{t:'drink',itemId:dose.itemId,qty:dose.qty},
        reason:`${action.reason}；品质药效倍率 ×${dose.power}，使用 ${dose.qty} 瓶补时，保留目标及原料`};
      if(qty>0)return {...action,intent:{...action.intent,qty},
        reason:`${action.reason}；药效剩余不超过 6 小时，使用 ${qty} 瓶，目标约 20 小时（库存不足则先补现货）`};
    }
    for(const {itemId,desired,worth,label}of missing) {
      const name=label??data.items[itemId]?.name,needed=Math.min(20,desired-surplus(itemId));
      // Every quality competes per unit of effect (a 1.3x bottle lasts as long
      // but does 1.3x): buying any quality at its ask, or brewing any quality
      // the held matched sets make. What held sets make is weighed (and
      // brewed) first; the rest is decided after, against buying ingredients.
      const recipe=recipeFor(itemId),power=t=>data.rarityMultipliers[t];
      const options=recipe?PAIR_TIERS.map(t=>({t,n:Math.min(needed,setsAt(craftRecipe(data,recipe,t),held))})).filter(o=>o.n>=1)
        .map(o=>({...o,cost:supplyCosts(itemId,o.n,o.t)})).sort((a,b)=>a.cost.brew/power(a.t)-b.cost.brew/power(b.t)):[];
      const pick=options[0]??{t:0,n:needed,cost:supplyCosts(itemId,needed,0)};
      const short=pick.n,cost=pick.cost,round=n=>Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
      const buyPerEffect=Math.min(...potionVariants(itemId).map(id=>(planner.marketAsk?.(p,id)||Infinity)/power(rarityOf(data,id))));
      const why=`自制每瓶约 ${round(cost.brew)}（药效 ×${power(pick.t)}），市场每份药效最低约 ${round(buyPerEffect)}${cost.training?'；含炼药练级省下的时间':''}`;
      // With neither price known, brew what the held ingredients make, else buy.
      const brewing=cost.brew/power(pick.t)<=buyPerEffect*MAKE_BIAS||!Number.isFinite(cost.brew)&&!Number.isFinite(buyPerEffect);
      if(brewing&&!cost.missing.length) {
        const own=brew(itemId,name,short,why,pick.t);if(own)return own;
        if(Number.isFinite(cost.brew)){report('brew',`药水未喝：${name}自制更便宜（${why}），换任务或返仓时开做`);continue;}
      }
      if(brewing&&cost.missing.length&&Number.isFinite(cost.brew)) {
        const ingredient=buyIngredient(cost.missing[0],why);if(ingredient)return ingredient;
        report('brew',`药水未喝：${name}自制更便宜（${why}），返仓时买原料`);continue;
      }
      const refill=restock(itemId,desired,uncovered,worth);if(refill)return refill;
      const status=planner.potionStatus?.(p,itemId,goal,desired);
      report(status?.key??'stock',status?.message??`药水未喝：${data.items[itemId]?.name??itemId}库存不足，当前无法安全补货`);
    }
    return null;
  };
  const add=(potion,effect,worth=null)=>candidates.push({...potion,canDrink:true,worth,
    action:{intent:{t:'drink',itemId:potion.itemId,qty:1},
    label:`使用${potion.label}`,reason:`普通品质效果：${effect}；按当前实际任务使用药水，保留计划用量`}});
  // Swift is kept up for ~20 hours at a time, so its worth is the share of the
  // task spent walking (measured, else a bank round trip per carried load),
  // not only the walking in the next ten minutes.
  function walkingShare() {
    if(!route||route.errand||job?.grow)return 0;
    const key=route.zoneId!=null?`combat:${data.zones.find(z=>z.id===route.zoneId)?.monsterId}`:route.jobId!=null?`job:${route.jobId}`:null;
    const m=key&&planner.routeMeasurement?.(p,key);
    if(m?.seconds>0&&Number.isFinite(m.travelSeconds))return Math.max(0,Math.min(1,m.travelSeconds/m.seconds));
    const site=job&&data.sites.find(s=>s.id===route.siteId);
    if(!site)return 0;
    const slot=Object.keys(data.toolSkills).find(k=>data.toolSkills[k]===job.skill);
    const e=workEstimate(data,job,planner.levels(p)[job.skill],{toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
      quick:p.perks?.quick??0,hands:p.perks?.hands??0});
    const load=job.inputs.length?planner.carriedBatch?.(p,job)??1:Math.floor(packCapacity(p)/job.output.qty);
    const trip=2*distance(site,nearestBank(data,site).approach)*data.tickMs/Math.round(baseStride(data,p));
    const work=Math.max(1,load)*e.seconds/Math.max(.01,e.success);
    return trip/(trip+work);
  }
  const swift=swiftPotion(data,planner,p,plan,window,useQty(225,potionRefillQty(p,'swift')));
  const walking=walkingShare(),swiftPotionRow=POTIONS.find(potion=>potion.kind==='swift');
  const walkingWorth=worthOf(walking*(1-1/1.2));
  if(swift)candidates.push({...swiftPotionRow,action:swift,
    worth:Math.max(worthOf(swift.gain/Math.max(1,Math.min(600,window)))??0,walkingWorth??0)||null});
  else if(walking>=.02)candidates.push({...swiftPotionRow,worth:walkingWorth,
    action:{intent:{t:'drink',itemId:225,qty:1},label:'使用疾行药剂',
      reason:`移动速度 +20%；本任务约 ${Math.round(walking*100)}% 时间在走路（存仓往返），药效按约 20 小时连续保持`}});
  if(next&&!['setRoute','fight'].includes(next.t)||!route)return choose();
  if(route.errand||job?.grow) {
    if(job?.grow&&route.errand&&(next||p.activity==='working')&&
      planner.farmPlots(p).some(f=>f.readyAt<=p.lastTick))add(POTIONS.find(p=>p.kind==='hunter'),'返还种子的品质稀有倍率 +25%');
    return choose();
  }
  const zone=data.zones.find(z=>z.id===route.zoneId),monster=data.monsters.find(m=>m.id===zone?.monsterId);
  if(!job&&!monster)return choose();
  if(!next&&route.limit===0)return choose();
  const tick=data.tickMs/1000,lv=planner.levels(p),limit=route.limit>0?route.limit:Infinity;
  const cap=Math.min(600,Math.max(0,window));
  const slot=job&&Object.keys(data.toolSkills).find(k=>data.toolSkills[k]===job.skill);
  const work=job&&workEstimate(data,job,lv[job.skill],{
    toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,quick:p.perks?.quick??0,hands:p.perks?.hands??0});
  const style=professionSkill(profession),gear=Object.values(p.equipment).map(planner.equipmentStats).filter(Boolean);
  const stat=key=>gear.reduce((sum,g)=>sum+(key==='defence'||!g.style||g.style===style?1:-1)*(g[key]??0),0);
  const weapon=planner.equipmentStats(p.equipment.weapon);
  const fightSeconds=(warrior=brewPower(data,p,'warrior'),haste=brewPower(data,p,'haste'),fed=active('fed')?.25:0)=>{
    const divisor=style==='magic'?4.5:weapon?.twoHanded?6:style==='ranged'&&weapon?.speed===5?5:8;
    const baseHit=Math.max(1,1+Math.floor((lv[style]+stat('strength'))/divisor));
    const maxHit=Math.ceil(baseHit*(1+.1*warrior+fed));
    const accuracy=Math.max(1,10+lv[style]+stat('accuracy')+Math.round(10*warrior));
    const hit=accuracy/(accuracy+10+monster.defence*(style==='magic'?.5:1));
    return expectedAttacks(monster.hp,maxHit,hit)*(weapon?.speed??5)*tick/(1+.2*haste);
  };
  const seconds=job?work.seconds:fightSeconds(),duration=Math.min(cap,limit*seconds);
  const foodId=p.foodItemId>0?p.foodItemId:p.pack.find(i=>data.items[planner.base(i.itemId)]?.heals)?.itemId??60;
  const food=data.items[planner.base(foodId)];
  const meanHit=monster?(monster.maxHit+1)/2:0;
  const rootedHit=monster?Array.from({length:monster.maxHit},(_,i)=>Math.max(1,Math.floor((i+1)*.8)))
    .reduce((sum,damage)=>sum+damage,0)/monster.maxHit:0;
  const damageReduction=meanHit?1-rootedHit/meanHit:0;
  const enemyDps=monster?(10+monster.attack)/(20+monster.attack+lv.defence+stat('defence'))*
    (active('rooted')?rootedHit:meanHit)/(monster.speed*tick):0;
  const foodRarity=rarityOf(data,foodId);
  const rawHeal=Math.max(1,Math.round((food?.heals??0)*(data.foodHealingMultipliers??[1,1.2,1.5,2,3])[foodRarity]));
  const maxHp=Math.floor(lv.hitpoints*(1+.005*(p.masteries?.hp??0)));
  const gap=Math.max(1,maxHp-Math.floor(maxHp*(p.eatAt??.5)));
  const healFor=power=>Math.max(1,Math.min(gap,Math.floor(rawHeal*(1+.025*(p.perks?.meals??0)+.25*power))));
  const healing=healFor(brewPower(data,p,'nourish'));
  const foodValue=food?.value??0;
  // A potion's worth is the share of time it saves (XP +10% = 1/11 of the
  // hour; combat: fight time with versus without it), at the gold rate.
  for(const potion of POTIONS) {
    const {kind}=potion;
    let effect='',worth=null;
    if((kind==='gatherer'&&job&&!job.inputs.length&&['mining','fishing','woodcutting','thieving'].includes(job.skill))||
      (kind==='elixir'&&(job||monster))) {
      effect='经验 +10%';worth=worthOf(1-1/1.1);
    } else if(kind==='warrior'&&monster) {
      effect='命中 +10、最大伤害 +10%';worth=worthOf(1-fightSeconds(1,brewPower(data,p,'haste'))/fightSeconds(0,brewPower(data,p,'haste')));
    } else if(kind==='haste'&&monster) {
      effect='攻击速度 +20%';worth=worthOf(1-fightSeconds(brewPower(data,p,'warrior'),1)/fightSeconds(brewPower(data,p,'warrior'),0));
    } else if(kind==='abyssal'&&monster) {
      effect='击杀金币 +25%';
    } else if(kind==='nourish'&&monster&&healFor(1)>healFor(0)) {
      effect='食物治疗 +25%';
    } else if(kind==='hunter'&&job&&!job.inputs.length&&job.output.itemId!==data.coinId) {
      effect='产物的品质稀有倍率 +25%';
    } else if(kind==='hunter'&&monster?.drop!=null) {
      effect='掉落物的品质稀有倍率 +25%';
    }
    if(effect)add(potion,effect,worth);
  }
  const potion=choose();if(potion)return potion;
  if(!next&&p.activity!=='working'&&!planner.nearBank(p))return null;
  if(duration<30)return null;
  if(monster) {
    const marketFood=planner.marketBuffFood?.(p,goal,{duration,enemyDps,healing,damageReduction,foodValue});
    if(marketFood)return marketFood;
  }
  const options=[];
  if(monster)for(const item of Object.values(data.items).filter(i=>i.heals)) {
    const itemId=item.id,effects=foodEffects(data,itemId);
    if(!effects.rootedTicks||active('rooted')||!accessible(itemId)||planner.count(p,itemId)<=Math.max(0,budget.items[itemId]??0))continue;
    const covered=Math.min(duration,effects.rootedTicks*tick);
    const savedFood=covered*enemyDps/healing*damageReduction*foodValue;
    if(savedFood>item.value)options.push({intent:{t:'eat',itemId,qty:1,...(!carried(itemId)?{shelf:true}:{})},
      label:'用盈余作物补充减伤',reason:`承伤 -20%，覆盖本批约 ${Math.ceil(covered)} 秒；`+
        `预计节省食物估值 ${Math.floor(savedFood)}，消耗作物估值 ${item.value} 金币，保留正常补给和计划原料`,gain:(savedFood-item.value)/Math.max(.001,coinRate)});
  }
  options.sort((a,b)=>b.gain-a.gain||a.intent.itemId-b.intent.itemId);
  return options[0]??null;
}
