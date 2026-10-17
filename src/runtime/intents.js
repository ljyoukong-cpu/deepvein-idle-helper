import {autoUsableMaterial} from '../planner/quality.js';
import {reserveWaitingGoals, reviewInventory, saleProtectionReason} from '../planner/inventory.js';
import {HOUSE_ACTIONS, validHomePortal} from '../planner/housing.js';
import {nextPerkCost} from '../planner/perks.js';
import {FALLBACK_SKILLS} from '../planner/fallback.js';
import {onPriceStep} from '../economy/market.js';
import {baseId, dayTicks, merchantPrice, nearBank, packCapacity, packQty, packUsed} from '../planner/items.js';
import {MASTERY_RANK_LIMIT, MASTERY_TRACKS} from '../engine/mastery-rules.js';

export function validateIntent(data,p,intent,{planner,goal=null,style='magic',mode='balanced',waitingGoals={}}={}) {
  goal=reserveWaitingGoals(goal,waitingGoals);
  if(['drink','eat','chooseFood','enhance','marketBuy','marketSell','marketDump','dropItem'].includes(intent.t)&&
    !autoUsableMaterial(data,intent.itemId))return false;
  if(intent.t==='foodMaxTier')return Number.isInteger(intent.tier)&&intent.tier>=0&&intent.tier<4;
  if(intent.t==='deposit'||intent.t==='depositItem') {
    if(p.route||p.path?.length||['walking','banking'].includes(p.activity)||p.enhance||
      !nearBank(data,p))return false;
    if(intent.t==='deposit')return p.pack.some(i=>i.qty>0);
    return Number.isSafeInteger(intent.itemId)&&!!data.items[baseId(data,intent.itemId)]&&
      Number.isSafeInteger(intent.qty)&&intent.qty>0&&
      packQty(p,intent.itemId)>=intent.qty;
  }
  if(intent.t==='dropItem') {
    const safe=planner?.gatheringSurplus?.(p,goal,style,mode,waitingGoals)?.intent;
    return !!safe&&intent.itemId===safe.itemId&&Number.isSafeInteger(intent.qty)&&intent.qty>0&&intent.qty<=safe.qty;
  }
  if(HOUSE_ACTIONS.has(intent.t))return planner?.validateHousing(p,intent,goal,style,mode)===true;
  if(intent.t==='portal')return validHomePortal(data,p,intent);
  if(intent.t==='withdraw') {
    const item=data.items[baseId(data,intent.itemId)],used=packUsed(data,p);
    return Number.isInteger(intent.itemId)&&!!item&&intent.qty===1&&(p.bank[intent.itemId]??0)>=1&&
      !p.route&&!p.path?.length&&!p.enhance&&nearBank(data,p)&&
      (used<packCapacity(p)||item.stackable&&p.pack.some(i=>i.itemId===intent.itemId&&i.qty>0));
  }
  if(intent.t==='setAside')return intent.raid===true&&!!p.route&&!p.route.errand&&!p.held&&!p.enhance;
  if(intent.t==='startQueued')return intent.index===0&&p.held===true&&p.raidHeld===true&&!p.route&&!!p.queue?.length;
  if(intent.t==='drink') {
    const carried=packQty(p,intent.itemId);
    const atBank=nearBank(data,p);
    const base=intent.itemId%data.rarityScale;
    return Number.isInteger(intent.itemId)&&intent.itemId>=220&&intent.itemId<data.rarityScale*5&&base>=220&&base<=227&&
      data.jobs.some(j=>j.skill==='herblore'&&j.output.itemId===base)&&
      Number.isInteger(intent.qty)&&intent.qty>=1&&intent.qty<=20&&
      intent.qty<=carried+(atBank?(p.bank[intent.itemId]??0):0);
  }
  if(intent.t==='claimQuest')return typeof intent.id==='string'&&['daily','weekly'].some(period=>
    p.quests?.[period==='daily'?'day':'week']===Math.floor(p.lastTick/dayTicks(data)/(period==='daily'?1:7))&&
    p.quests?.[period]?.some(q=>q.id===intent.id&&!q.claimed&&Number.isInteger(q.goal)&&q.goal>0&&Number.isInteger(q.done)&&q.done>=q.goal));
  if(intent.t==='rerollQuest') {
    // Server rule: once per day, an unstarted and unclaimed daily.
    const day=Math.floor(p.lastTick/dayTicks(data));
    return typeof intent.id==='string'&&p.quests?.day===day&&p.quests.rerolled!==day&&
      p.quests.daily?.some(q=>q.id===intent.id&&!q.claimed&&q.done===0)===true;
  }
  if(intent.t==='buyPerk') {
    const cost=nextPerkCost(p,intent.id);
    return typeof intent.id==='string'&&cost!=null&&Number.isInteger(p.questPoints)&&p.questPoints>=cost;
  }
  if(intent.t==='masteryConfirm') {
    // Server rule: every track listed, none below its locked rank. Points are
    // checked by the server (the page cannot count them without the engine).
    const ranks=intent.ranks,current=p.masteries??{};
    if(!ranks||typeof ranks!=='object'||Array.isArray(ranks))return false;
    if(!Object.entries(ranks).every(([id,n])=>MASTERY_TRACKS.includes(id)&&Number.isInteger(n)&&n>=1&&n<=MASTERY_RANK_LIMIT&&n>=(current[id]??0)))return false;
    if(!Object.entries(current).every(([id,n])=>!(n>0)||id in ranks))return false;
    return Object.entries(ranks).some(([id,n])=>n>(current[id]??0));
  }
  // Clearing the whole game queue: only from the player's own button.
  if(intent.t==='unqueue')return Object.keys(intent).length===1&&!!p.queue?.length;
  // Clearing a field's saved seed choice (the helper only ever clears it).
  if(intent.t==='plotChoice')return intent.seed===null&&Number.isInteger(intent.siteId)&&Object.keys(intent).length===3&&
    data.sites.some(s=>s.id===intent.siteId&&s.kind==='field')&&p.plotChoice?.[intent.siteId]!=null&&p.plotChoice[intent.siteId]!==0;
  if(intent.t==='plantPref')return typeof intent.plainest==='boolean'&&Object.keys(intent).length===2;
  if(intent.t==='setFallback') {
    // Only a gathering job the character can do now, at a real site, banking
    // when full; never a clear, a fight or an overflow-on-full setting.
    const task=intent.fallback?.task,job=data.jobs.find(j=>j.id===task?.jobId);
    const level=job&&planner?planner.level(p.skills[job.skill]):0;
    return !!job&&task.kind==='job'&&FALLBACK_SKILLS.includes(job.skill)&&!job.inputs.length&&!job.grow&&
      data.sites.some(s=>s.id===task.siteId&&s.jobIds.includes(job.id))&&task.onFull==='bank'&&task.rarity===0&&
      intent.fallback.onStorageFull===false&&level>=job.levelReq;
  }
  if(intent.t==='vendorBuy')return intent.itemId===190&&Number.isInteger(intent.qty)&&
    intent.qty>=1&&intent.qty<=100&&data.items[190]?.value>0;
  if (['marketDepth','marketBook','marketBuy','marketSell'].includes(intent.t)) {
    const known=Number.isSafeInteger(intent.itemId)&&intent.itemId>0&&
      Object.hasOwn(data.items,baseId(data,intent.itemId));
    if (['marketDepth','marketBook'].includes(intent.t)) return known;
    if(intent.t==='marketSell'&&saleProtectionReason(data,intent.itemId)) {
      const row=planner&&reviewInventory(data,planner,p,goal,style).items.find(i=>i.itemId===intent.itemId);
      if(!row?.marketOnly||row.sellFromBank<intent.qty)return false;
    }
    return known&&Number.isInteger(intent.qty)&&intent.qty>0&&intent.qty<=1000000&&
      onPriceStep(intent.price)&&intent.price<=1000000000&&
      Number.isSafeInteger(intent.qty*intent.price);
  }
  if (intent.t==='marketBooks') return Array.isArray(intent.itemIds)&&intent.itemIds.length>0&&intent.itemIds.length<=64&&
    intent.itemIds.every(itemId=>validateIntent(data,p,{t:'marketBook',itemId}));
  if (intent.t==='marketCancel') return Number.isSafeInteger(intent.orderId)&&intent.orderId>0;
  if(intent.t==='setRoute') {
    const job=data.jobs.find(j=>j.id===intent.jobId),site=data.sites.find(s=>s.id===intent.siteId);
    return !!job&&!!site&&site.jobIds.includes(job.id)&&Number.isInteger(intent.limit)&&intent.limit>=0&&
      (intent.rarity===undefined||Number.isInteger(intent.rarity)&&intent.rarity>=0&&intent.rarity<4);
  }
  if(intent.t==='fight')return data.zones.some(z=>z.id===intent.zoneId)&&Number.isInteger(intent.limit)&&intent.limit>=0;
  if(intent.t==='eat')return Number.isInteger(intent.itemId)&&intent.itemId>=0&&intent.itemId<data.plusScale&&
    data.items[intent.itemId%data.rarityScale]?.heals>0&&intent.qty===1&&
    (intent.shelf===undefined||typeof intent.shelf==='boolean');
  if(['wear','equipFromBank','enhance','marketDump'].includes(intent.t)) {
    const base=baseId(data,intent.itemId);
    if(!Object.hasOwn(data.items,base))return false;
    if(intent.t==='marketDump')return !saleProtectionReason(data,intent.itemId)&&intent.itemId===base&&Number.isInteger(intent.qty)&&intent.qty>0&&
      Number.isFinite(intent.floor)&&intent.floor>=merchantPrice(data,base);
    return data.gear.some(g=>g.itemId===base);
  }
  return true;
}
