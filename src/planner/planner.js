import {PROFESSIONS, canWear as canWearWith, gearRequirementOf, matchesProfessionWeapon, professionSkill, starterWeapon} from './professions.js';
import {PAIR_TIERS, autoUsableMaterial, craftRecipe, mergeHold, potionSaleWorth, qualityHold, qualityWorth} from './quality.js';
import {RARITY_NAMES, baseId, distance, itemLabel, nearBank as nearBankAt, nearestBank as nearestBankTo, packCapacity, packQty, packUsed, plusOf, qualityPrefix, rarityOf} from './items.js';
import {createCrafting, finishTaskReason} from './crafting.js';
import {combatEstimate} from './estimates.js';
import {combatSupplies} from './supplies.js';
import {createStrategy} from './strategy.js';
import {POTION_FLOOR, farmingStocks, herbloreNeeds} from './farming.js';
import {createEnhancementTraining, planEnhancement} from './enhancement.js';
import {planConsumable} from './consumables.js';
import {createProgression} from './progression.js';
import {createSpecialization} from './specialization.js';
import {createQuests} from './quests.js';
import {createHousing} from './housing.js';
import {planGatheringSurplus} from './gathering-surplus.js';
import {perkOverview} from './perks.js';
import {chooseFallback} from './fallback.js';
import {createInvestments, payback as paybackRule} from './investment.js';
import {createCollectionMastery} from './collection.js';
import {HOT_FOLLOW_SKILLS, hotSkillAt, hotWindows} from '../runtime/hot-follow.js';
import {createAutomationPolicy, normalizeAutomation} from '../runtime/automation-policy.js';

export const NAMES = {
  mining:'采矿', fishing:'钓鱼', woodcutting:'伐木', farming:'农业', thieving:'盗窃',
  cooking:'烹饪', smithing:'锻造', fletching:'箭术制作', herblore:'炼药', crafting:'制作',
  enhancing:'强化', melee:'近战', ranged:'远程', magic:'魔法', defence:'防御', hitpoints:'生命'
};

export function createPlanner(data) {
  const {jobs, sites, banks, monsters, zones} = data;
  let consumableReason=null;
  const attacks = ['melee','ranged','magic'];
  const gear = new Map(data.gear.map(g => [g.itemId,g]));
  const thresholds = [0,0];
  const x = data.xp;
  for (let level = 2; level <= x.journeyLevel; level++) {
    thresholds[level] = Math.round(x.baseXp * (x.growth ** (level-1)-1) / (x.growth-1));
  }
  let total = thresholds.at(-1), step = total*x.beyondStep;
  while (total+step <= Number.MAX_SAFE_INTEGER) {
    total += step; thresholds.push(Math.round(total)); step *= x.beyondGrowth;
  }
  const level = xp => {
    let lo = 1, hi = thresholds.length-1;
    while (lo < hi) {
      const mid = Math.ceil((lo+hi)/2);
      if (thresholds[mid] <= xp) lo = mid; else hi = mid-1;
    }
    return lo;
  };
  const base = id => baseId(data,id);
  const plus = id => plusOf(data,id);
  const rarity = id => rarityOf(data,id);
  const mastery = createCollectionMastery(data);
  function equipmentStats(id) {
    const g=gear.get(base(id));
    if (!g) return null;
    const tier=data.rarityMultipliers[rarity(id)]??1, scale=1+data.enhanceScale*plus(id);
    return {...g,itemId:id,accuracy:Math.round(Math.round((g.accuracy??0)*tier)*scale),
      strength:Math.round(Math.round((g.strength??0)*tier)*scale),
      defence:Math.round(Math.round((g.defence??0)*tier)*scale),bonus:(g.bonus??0)*tier*scale,
      luck:(g.luck??0)*tier*scale};
  }
  const name = id => data.items[base(id)]?.name ?? jobs.find(j=>j.output.itemId===base(id))?.name ?? `物品 ${id}`;
  const fullName = id => itemLabel(data,id,name(id));
  const levels = p => Object.fromEntries(data.skills.map(s=>[s,level(p.skills[s])]));
  // Count exact quality IDs; raw materials of different qualities are not interchangeable.
  // Overflow is excluded here: it cannot be withdrawn until storage frees up.
  const count = (p,id) => id===data.coinId ? p.coins : (p.bank[id]??0)+packQty(p,id);
  const held = p => [...new Set([...Object.keys(p.bank).filter(id=>p.bank[id]>0).map(Number),
    ...p.pack.map(i=>i.itemId), ...Object.values(p.equipment).filter(Number.isFinite)])];
  const nearBank = p => nearBankAt(data,p);
  const nearestBank = p => nearestBankTo(data,p);
  const gearRequirement = id => gearRequirementOf(data,id);
  function gearScore(id,style) {
    const g=equipmentStats(id);
    if (!g) return 0;
    if (g.bonus) return g.bonus;
    const same=!g.style||g.style===style;
    if (g.slot==='weapon') return (g.accuracy+2*g.strength)/(g.speed??4)*(g.twoHanded?1.3:1);
    return (same?1:-1)*(g.accuracy+2*g.strength)+g.defence*.5+(g.luck??0);
  }
  const action = (intent,label,reason='') => ({intent,label,reason});
  const wait = reason => ({intent:null,label:'等待当前任务',reason});
  const blocked = reason => ({intent:null,label:'需要处理',reason,blocked:true});
  function itemTargetChoices() {
    const choices=new Map();
    const add=(itemId,skill,levelReq,source)=>{
      if(itemId===data.coinId||!data.items[itemId]||choices.has(itemId))return;
      choices.set(itemId,{itemId,name:name(itemId),skill,levelReq,source});
    };
    for(const job of [...jobs].sort((a,b)=>a.levelReq-b.levelReq))
      if(sites.some(s=>s.jobIds.includes(job.id)))add(job.output.itemId,job.skill,job.levelReq,job.grow?'种植':'制作／采集');
    for(const job of jobs)if(job.bonus?.chance>0&&sites.some(s=>s.jobIds.includes(job.id)))
      add(job.bonus.itemId,job.skill,job.levelReq,'采集副产');
    for(const monster of monsters)if(zones.some(z=>z.monsterId===monster.id)) {
      if((monster.dropChance??1)>0)add(monster.drop,null,1,'怪物掉落');
      if(monster.bonus?.chance>0)add(monster.bonus.itemId,null,1,'怪物副产');
    }
    add(data.shardId,null,1,'战斗掉落');add(190,'farming',1,'商人种子');
    return [...choices.values()];
  }
  function planItemTarget(p,goal,profession='magic',completedLoad=false) {
    const id=goal?.targetItemId??goal?.itemId,qty=goal?.qty??goal?.required;
    const choice=itemTargetChoices().find(item=>item.itemId===id);
    if(!choice||!Number.isSafeInteger(qty)||qty<1)return blocked('目标物品或数量无效，请重新设置物品目标');
    Object.assign(goal,{itemTarget:true,targetItemId:id,qty,skill:choice.skill??professionSkill(profession),target:Infinity});
    goal.budget??={coins:0,items:{}};goal.budget.items??={};
    goal.budget.items[id]=Math.max(goal.budget.items[id]??0,qty);
    const owned=count(p,id)+(p.overflow?.[id]??0)+Object.values(p.equipment).filter(item=>item===id).length+(goal.listedQty??0);
    if(owned>=qty)return {...wait(`已备齐 ${name(id)}：${owned}/${qty}`),completed:true,goal};
    const current=jobs.find(job=>job.id===p.route?.jobId);
    const consuming=current?.inputs.some(input=>input.itemId===id);
    const eating=data.items[id]?.heals&&p.route?.zoneId!=null&&(p.foodItemId===id||
      p.pack.some(item=>item.itemId===id&&item.qty>0)||!(p.foodItemId>0)&&count(p,id)>0);
    if(consuming||eating)return {...action({t:'clearRoute'},'停止消耗目标物品的旧任务',
      `先保护 ${name(id)} 库存，再继续本次物品目标`),goal};
    const reason=!completedLoad&&finishTaskReason(data,p);
    if(reason)return {...wait(reason),goal};
    return planTask(p,goal,profession);
  }
  const bankAction = (p,intent,label) => nearBank(p) ? action(intent,label) :
    action({t:'walk',...nearestBank(p).approach},'前往仓库',label);
  function gatheringDeparture(p,job) {
    if(!['mining','fishing','woodcutting'].includes(job.skill)||job.inputs.length||data.items[job.output.itemId]?.stackable)return null;
    // Native setRoute only checks whether one more output fits, not whether old cargo was banked.
    const cargo=p.pack.some(i=>i.qty>0&&(nearBank(p)||
      base(i.itemId)!==job.output.itemId&&!data.items[base(i.itemId)]?.stackable));
    if(!cargo)return null;
    if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'采集出发前整理背包','先停止旧路线，再把旧物资存仓');
    return bankAction(p,{t:'deposit'},'采集出发前存仓，腾出整包空间');
  }
  function carriedBatch(p,job) {
    const stacks=job.inputs.filter(i=>data.items[base(i.itemId)]?.stackable).length;
    const units=job.inputs.reduce((n,i)=>n+(data.items[base(i.itemId)]?.stackable?0:i.qty),0);
    const outputStack=!!data.items[base(job.output.itemId)]?.stackable;
    const room=packCapacity(p)-stacks-Number(outputStack);
    return Math.max(1,units?Math.floor(room/units):outputStack?50:room);
  }
  function productionDeparture(p,job,limit) {
    if(!job.inputs.length||job.grow)return null;
    const carried=Math.min(...job.inputs.map(i=>Math.floor(p.pack.filter(v=>v.itemId===i.itemId)
      .reduce((n,v)=>n+v.qty,0)/i.qty)));
    // Native route startup skips loading when the pack holds even one recipe.
    // Bank a partial leftover load so the native loader takes a complete trip.
    const available=Math.min(...job.inputs.map(i=>Math.floor(count(p,i.itemId)/i.qty)));
    const desired=Math.min(limit||Infinity,carriedBatch(p,job),available);
    if(carried<1||carried>=desired)return null;
    if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'制作出发前准备整批原料','先停止旧路线，存回零散原料后按背包容量取料');
    return bankAction(p,{t:'deposit'},'存回零散原料，再整批取料制作');
  }
  // Unlocked fields: the base fields by farming level (farmUnlocks, in id
  // order), plus fields gated by another skill (farmGates, client v0.8.1:
  // woodcutting 75, fishing 75, fletching 70, mining 85).
  // A field the player set to "不使用" in the game (saved choice 0, upstream
  // v0.8.7) is left alone: not counted, harvested into or replanted.
  const farmFields = p => {
    let index=0;
    return sites.filter(s=>s.kind==='field').sort((a,b)=>a.id-b.id).filter(site=>{
      const gate=data.farmGates?.[site.id];
      return gate?level(p.skills[gate.skill]??0)>=gate.level:level(p.skills.farming)>=(data.farmUnlocks[index++]??Infinity);
    }).filter(site=>p.plotChoice?.[site.id]!==0);
  };
  const farmFieldCount = (data.farmUnlocks?.length??0)+Object.keys(data.farmGates??{}).length;
  function farmPlots(p) {
    return farmFields(p).flatMap(site=>{
      const plot=p.plots?.[site.id];
      const job=plot&&jobs.find(j=>j.grow&&j.inputs[0].itemId===base(plot.seedItemId));
      if (!job) return [];
      const duration=Math.round(job.grow/(plot.sowSpeed??1));
      const water=data.farmWaterTrim;
      const trim=plot.trim??Math.min(plot.watered??0,Math.floor(job.grow/2/water))*water;
      return [{site,job,readyAt:plot.plantedAt+duration-Math.min(trim,Math.floor(duration/2))}];
    });
  }
  const hasSeed = (p,job) => held(p).some(id=>base(id)===job.inputs[0].itemId&&count(p,id)>0);
  const seedCount = (p,job) => held(p).filter(id=>base(id)===job.inputs[0].itemId).reduce((n,id)=>n+count(p,id),0)+
    Object.entries(p.overflow??{}).filter(([id])=>base(+id)===job.inputs[0].itemId).reduce((n,[,qty])=>n+qty,0);
  let farmingChoice={mode:'auto',jobId:null};
  // Harvest timing settings and the current batch's delay draw (automation-policy.js).
  let farmPolicy=null;
  const automation=()=>normalizeAutomation(api.automation);
  const farmingPreference=()=>({...farmingChoice});
  function setFarmingPreference(value) {
    const mode=value?.mode==='manual'?'manual':'auto';
    const jobId=jobs.find(j=>j.grow&&j.id===value?.jobId)?.id??null;
    if(mode!==farmingChoice.mode||jobId!==farmingChoice.jobId) {
      farmSearch=null;farmRetryAt=0;farmDelayReason=null;farmTarget=null;farmTargetReason=null;farmQuote=null;
    }
    farmingChoice={mode,jobId};
    return farmingPreference();
  }
  const manualFarmJob=()=>farmingChoice.mode==='manual'?jobs.find(j=>j.grow&&j.id===farmingChoice.jobId):null;
  const allowedCrop=job=>farmingChoice.mode!=='manual'||job.id===farmingChoice.jobId;
  const farmStockMode=p=>farmingChoice.mode==='auto'&&level(p.skills.farming)>=Math.max(...data.farmUnlocks);
  function manualFarmReason(p) {
    if(farmingChoice.mode!=='manual')return null;
    const job=manualFarmJob();
    if(!job)return '手动农业尚未选择有效作物，先继续其他任务';
    if(level(p.skills.farming)<job.levelReq)return `手动选择 ${job.name} 需要农业 ${job.levelReq} 级（当前 ${level(p.skills.farming)}），先继续其他任务`;
    return null;
  }
  function waitForFarmBatch(p) {
    const plots=farmPlots(p),growing=plots.filter(f=>f.readyAt>p.lastTick);
    if (!growing.length) return null;
    // "任一同种田全部成熟": one exact-seed group all ripe is enough (upstream v0.8.1).
    if(automation().harvestMode==='seed') {
      const groups=new Map();
      for(const f of plots){const key=p.plots[f.site.id].seedItemId;groups.set(key,[...groups.get(key)??[],f]);}
      if([...groups.values()].some(rows=>rows.every(f=>f.readyAt<=p.lastTick)))return null;
    }
    const readyAt=Math.max(...growing.map(f=>f.readyAt));
    return {...wait(`等全部成熟后一起收菜，最晚约 ${Math.ceil((readyAt-p.lastTick)*data.tickMs/1000)} 秒；先练其他技能`),
      label:'等待整批作物成熟',deferUntilTick:readyAt};
  }
  const farmErrand = (p,job,site) => ({...action(
    {t:'setRoute',siteId:site.id,jobId:job.id,onFull:'bank',limit:0,errand:true},
    `收获并补种 · ${job.name}`,'播种／收获后继续主任务，生长期间练其他技能'),farmJobId:job.id});
  // The game sows the rarest seed held first, unless its "plant common ones
  // first" switch is on. Herbs pair with drops of the same quality, so before a
  // planting errand the switch follows the quality the crop is short of.
  function sowFor(p,job,stocks,errand) {
    if(!errand?.intent)return errand;
    // The game sows a field's own saved seed choice before the errand's crop.
    // The helper picks the crops here, so a differing saved choice is cleared
    // first (one field per step); the game then sows the errand's crop.
    const seed=job.inputs[0].itemId;
    const field=farmFields(p).find(s=>p.plotChoice?.[s.id]!=null&&p.plotChoice[s.id]!==seed);
    if(field)return {...action({t:'plotChoice',siteId:field.id,seed:null},`清除田地的指定作物 · ${name(p.plotChoice[field.id])}`,
      `这块田在游戏里指定了种 ${name(p.plotChoice[field.id])}，补种时会代替 ${name(job.output.itemId)}；清除后按助手的选择补种`),
      farmJobId:job.id,then:sowQuality(p,job,stocks,errand)};
    return sowQuality(p,job,stocks,errand);
  }
  function sowQuality(p,job,stocks,errand) {
    const row=stocks?.find(r=>r.job.id===job.id);
    if(api.autoSeedQuality===false||!errand?.intent||!row?.herblore)return errand;
    const plainest=row.sowTier===0;
    if((p.plantPlainest===true)===plainest)return errand;
    const herb=name(job.output.itemId),drop=row.herblore.drops.map(id=>name(id)).join('、');
    return {...action({t:'plantPref',plainest},plainest?'种植改为先用普通种子':'种植改为先用稀有种子',
      plainest?`缺普通${herb}来配普通${drop}，稀有种子留在仓库`:
        `缺${RARITY_NAMES[row.sowTier]}${herb}来配同品质${drop}，先种稀有种子`),farmJobId:job.id,then:errand};
  }
  function harvestOnly(p) {
    farmState(p);
    farmDelayReason=manualFarmReason(p);
    if(farmDelayReason)return null;
    if(p.route?.errand||p.enhance||p.held||!p.route&&(p.path?.length||p.activity==='walking'))return null;
    const plots=farmPlots(p);
    if(plots.some(f=>f.readyAt>p.lastTick))return null;
    const eligible=jobs.filter(j=>j.grow&&allowedCrop(j)&&level(p.skills.farming)>=j.levelReq&&
      (hasSeed(p,j)||plots.some(f=>f.job.id===j.id)||farmingChoice.mode==='manual'&&plots.length)).sort((a,b)=>b.xp/b.grow-a.xp/a.grow);
    const stocks=farmStockMode(p)?farmingStocks(data,p,levels(p),null,thresholds):null;
    const job=stocks?stocks.find(row=>eligible.some(j=>j.id===row.job.id))?.job??busyCrop(p,eligible):eligible[0];
    farmTarget=job;farmTargetReason=null;
    if(stocks&&!job){farmDelayReason='农田已全解锁，作物库存充足且没有可续种的种子；先继续主任务';return null;}
    if(!job) {
      if(farmingChoice.mode==='manual')farmDelayReason=`缺少所选 ${manualFarmJob().name} 种子；辅助模式不采购或采种，继续原任务`;
      return null;
    }
    const site=plots.find(f=>f.job.id===job.id)?.site??plots[0]?.site??farmFields(p).find(s=>!p.plots?.[s.id]);
    if(!site)return null;
    // The native unlimited errand banks the harvest and restores route.after;
    // a finite harvest limit would stop before restoring the saved route.
    return {...farmErrand(p,job,site),reason:'整批收获并用已有种子补种；由游戏保留原任务剩余数量，完成后继续玩家队列'};
  }
  // Fields never stand idle: with every stock target met, harvest and replant a
  // crop that needs no new seeds (a ripe plot returns its own seed), choosing
  // the best farming experience; the crop already in the field wins a tie.
  function busyCrop(p,candidates) {
    const plots=farmPlots(p),ready=plots.filter(f=>f.readyAt<=p.lastTick),empty=farmFields(p).filter(s=>!p.plots?.[s.id]);
    if(!ready.length&&!empty.length)return null;
    const free=j=>(empty.length+ready.filter(f=>f.job.id!==j.id).length)*j.inputs[0].qty<=seedCount(p,j);
    return candidates.filter(free).sort((a,b)=>b.xp/b.grow-a.xp/a.grow||
      Number(ready.some(f=>f.job.id===b.id))-Number(ready.some(f=>f.job.id===a.id)))[0]??null;
  }
  let farmSearch=null,farmPlayerId=null,farmRetryAt=0,farmDelayReason=null,farmTarget=null,farmTargetReason=null,farmQuote=null;
  function farmState(p) {
    if (farmPlayerId===p.id) return;
    farmPlayerId=p.id;farmSearch=null;farmRetryAt=0;farmDelayReason=null;farmTarget=null;farmTargetReason=null;farmQuote=null;
  }
  function harvest(p,preferredJobId,goal=null,style='magic',completedLoad=false) {
    farmState(p);
    farmDelayReason=manualFarmReason(p);
    if(farmDelayReason)return null;
    if (p.route?.errand) return null;
    const plots=farmPlots(p), ready=plots.filter(f=>f.readyAt<=p.lastTick)
      .sort((a,b)=>a.readyAt-b.readyAt);
    const fields=farmFields(p),empty=fields.filter(s=>!p.plots?.[s.id]);
    const eligible=jobs.filter(j=>j.grow&&allowedCrop(j)&&level(p.skills.farming)>=j.levelReq);
    const stocks=farmStockMode(p)?farmingStocks(data,p,levels(p),goal,thresholds):null;
    const demanded=j=>stocks?stocks.some(row=>row.job.id===j.id&&row.plannedMissing>0):
      (goal?.budget?.items?.[j.output.itemId]??0)>count(p,j.output.itemId);
    const rank=(a,b)=>Number(demanded(b))-Number(demanded(a))||b.xp/b.grow-a.xp/a.grow||
      Number(b.id===preferredJobId)-Number(a.id===preferredJobId);
    let crops=stocks?stocks.map(row=>row.job):eligible.sort(rank);
    const busy=stocks&&!crops.length?busyCrop(p,eligible):null;
    if(busy)crops=[busy];
    // Native errands harvest every ripe plot, then sow only the route's crop.
    // A selected crop without seeds can therefore collect the old batch safely.
    const selected=crops[0]??manualFarmJob();
    farmTarget=selected;
    if(!selected) {
      if(stocks){farmSearch=null;farmQuote=null;farmTargetReason=null;farmDelayReason='农田已全解锁，作物库存充足且没有可续种的种子；先继续主任务';}
      return null;
    }
    const stock=stocks?.find(row=>row.job.id===selected.id);
    farmTargetReason=busy?`作物库存均已充足；为不让农田空闲，用现有种子续种 ${name(selected.output.itemId)}（农业经验最高）`:stock?`${demanded(selected)?'补充当前计划原料':'维持作物库存'} ${name(selected.output.itemId)}：库存 ${stock.total}/${stock.target}，在田作物计入后续供应`:
      demanded(selected)?`补充当前计划所需原料 ${name(selected.output.itemId)}`:'按已解锁作物的农业经验收益选择';
    // Herbs pair only with drops of their own quality: say which quality is
    // short, and which rare herbs are still waiting for matching drops.
    if(stock?.herblore) {
      const herb=selected.output.itemId,drop=stock.herblore.drops.map(id=>name(id)).join('、');
      const short=stock.herblore.tiers.filter(t=>t.short>0).map(t=>`${RARITY_NAMES[t.t]||'普通'} ${t.short}`).join('、');
      const waiting=[1,2,3].map(t=>({t,n:count(p,herb+t*data.rarityScale)}))
        .filter(w=>w.n>0&&!stock.herblore.tiers.some(x=>x.t===w.t)).map(w=>`${RARITY_NAMES[w.t]}${name(herb)} ${w.n}（等${RARITY_NAMES[w.t]}${drop}）`);
      farmTargetReason+=`${short?`；按配对品质缺 ${short}`:''}${waiting.length?`；${waiting.join('、')}`:''}`;
    }
    const seedSlots=empty.length+ready.filter(f=>f.job.id!==selected.id).length;
    const seedNeed=Math.max(0,(seedSlots||(!empty.length&&!ready.length?plots.filter(f=>f.job.id!==selected.id).length:0))*
      selected.inputs[0].qty-seedCount(p,selected));
    if(farmQuote&&(farmQuote.jobId!==selected.id||!seedNeed))farmQuote=null;
    const urgentHarvest=ready.some(f=>demanded(f.job));
    const farmingRequired=level(p.skills.farming)<(goal?.farmingTarget??0);
    const naturalBreak=completedLoad||!p.route||p.route.phase==='toBank';
    // An unlimited route still gets a chance to collect a worthwhile full batch.
    const fullBatchDue=!p.route?.limit&&plots.length&&ready.length===plots.length&&
      p.lastTick-ready[0].readyAt>=600000/data.tickMs;
    const deferFarm=reason=>{farmDelayReason=reason;return null;};
    const waitingBatch=waitForFarmBatch(p);
    let foregroundRate=goal?.rate?.xp;
    if (foregroundRate==null) {
      const job=jobs.find(j=>j.id===p.route?.jobId&&!j.grow);
      const current=job?strategy.estimateWork(p,job):p.route?.zoneId!=null?
        strategy.combatOptions(p,style).find(c=>c.zone.id===p.route.zoneId):null;
      foregroundRate=current?current.xp/current.seconds:Math.max(0,...jobs.filter(j=>!j.grow&&!j.inputs.length&&
        level(p.skills[j.skill])>=j.levelReq).map(j=>{const e=strategy.estimateWork(p,j);return e.xp/e.seconds;}));
    }
    if (farmSearch&&(farmSearch.job.id!==selected.id||!seedNeed)) farmSearch=null;
    if (farmSearch&&p.lastTick-farmSearch.started>farmSearch.maxTicks) {
      farmRetryAt=p.lastTick+Math.min(farmSearch.job.grow,600000/data.tickMs);farmSearch=null;farmQuote=null;
    }
    if(!completedLoad&&!urgentHarvest&&finishTaskReason(data,p))
      return deferFarm('先完成当前采集背包或制作批次，再合并收菜、补种及采种准备');
    // Reserve enough independent seeds for this whole planting/replacement
    // batch; mature plots of the chosen crop return their own seed.
    const owned=eligible.filter(j=>j.id===selected.id&&hasSeed(p,j)&&!seedNeed);
    // Native sowing errands also collect ripe fields, so a partial harvest
    // must wait. With no ripe fields, spare seeds can fill empty land without
    // touching the crops that are still growing.
    if (waitingBatch&&ready.length) return deferFarm(waitingBatch.reason);
    // A random delay after a batch qualifies, drawn once per batch (game time).
    if(ready.length) {
      const key=ready.map(f=>`${f.site.id}:${p.plots[f.site.id].seedItemId}:${p.plots[f.site.id].plantedAt}`).sort().join('|');
      const policy=createAutomationPolicy({now:()=>p.lastTick*data.tickMs,saved:{farm:farmPolicy}});
      const timing=policy.farm(key,automation());farmPolicy=policy.save().farm;
      if(!timing.ready)return deferFarm(`收菜随机延迟：约 ${Math.ceil((timing.dueAt-p.lastTick*data.tickMs)/60000)} 分钟后合批收菜`);
    }
    if (empty.length&&owned.length&&!ready.length) {
      if (!urgentHarvest&&!naturalBreak&&!fullBatchDue)
        return deferFarm('已有种子，等当前任务结束或返仓时合并收菜、补种');
      return sowFor(p,owned[0],stocks,farmErrand(p,owned[0],empty[0]));
    }
    if (ready.length&&(urgentHarvest||farmingChoice.mode==='manual'||!seedNeed)) {
      const expand=empty.length&&hasSeed(p,selected);
      const errand=farmErrand(p,selected,expand?empty[0]:ready[0].site);
      const collected=ready;
      const tick=data.tickMs/1000,readyXp=collected.reduce((n,f)=>n+f.job.xp*
        (data.rarityXp[rarity(p.plots[f.site.id].seedItemId)]??1),0);
      // Native farming may fetch seeds first, visits several fields, banks the
      // harvest, then resumes the original site/zone. Geometry is an estimate.
      const bankAt=point=>banks.find(b=>b.id===p.homeBank)??nearestBank(point);
      let position=p,steps=0;
      const travel=target=>{steps+=distance(position,target);position=target;};
      if (!p.pack.some(i=>base(i.itemId)===selected.inputs[0].itemId&&i.qty>0)) travel(bankAt(p).approach);
      travel(sites.find(s=>s.id===errand.intent.siteId));
      const remaining=collected.filter(f=>f.site.id!==errand.intent.siteId);
      while (remaining.length) {
        remaining.sort((a,b)=>distance(position,a.site)-distance(position,b.site));
        travel(remaining.shift().site);
      }
      travel(bankAt(position).approach);
      travel(sites.find(s=>s.id===p.route?.siteId)??zones.find(z=>z.id===p.route?.zoneId)??p);
      const trip=(steps+(collected.length+(expand?1:0))*4)*tick;
      if (!urgentHarvest&&!naturalBreak&&!fullBatchDue)
        return deferFarm('作物已成熟，等当前任务结束或返仓时合并收菜');
      // Credit a real crop upgrade over the same foreground planning horizon.
      let upgradeSeeds=held(p).filter(id=>base(id)===selected.inputs[0].itemId).reduce((n,id)=>n+count(p,id),0);
      const horizon=Math.min(goal?.horizon??strategy.horizon,strategy.horizon)/tick;
      // Conservatively credit only the first empty field.
      const expansionXp=expand&&upgradeSeeds>=selected.inputs[0].qty?selected.xp/selected.grow*horizon:0;
      if (expansionXp) upgradeSeeds-=selected.inputs[0].qty;
      const upgradeXp=collected.reduce((n,f)=>{
        const gain=selected.xp/selected.grow-f.job.xp/f.job.grow;
        if (gain<=0||upgradeSeeds<selected.inputs[0].qty) return n;
        upgradeSeeds-=selected.inputs[0].qty;
        return n+gain*horizon;
      },0);
      if (!stocks&&!urgentHarvest&&!farmingRequired&&readyXp+upgradeXp+expansionXp<foregroundRate*trip) {
        farmDelayReason=`收菜往返约 ${Math.ceil(trip)} 秒，当前收益不足；等顺路或合批`;
        // Keep crop upgrades attainable even when old crops are not worth a trip.
        if (!naturalBreak) return null;
      } else return sowFor(p,selected,stocks,{...errand,reason:`合批收获 ${collected.length} 块；预计往返及农活约 ${Math.ceil(trip)} 秒，完成后继续主任务`});
    }
    const catchUp=goal&&data.skills.includes(goal.skill)&&(goal.growth||goal.quest)&&level(p.skills[goal.skill])<level(p.skills.farming);
    if(seedNeed&&farmingChoice.mode==='auto'&&catchUp&&!empty.length&&ready.length<plots.length&&!demanded(selected))
      return deferFarm('作物仍在生长，先推进当前主任务及其原料需求；整批成熟后再准备作物升级');
    const sage=selected.inputs[0].itemId===190?selected:null;
    const seedPrice=data.items[190].value*4;
    const seedQty=Math.min(seedNeed,Math.floor((p.coins-Math.max(0,goal?.budget?.coins??0))/seedPrice));
    if(naturalBreak&&sage&&seedQty>0) {
      if(nearBank(p)&&(p.route||p.path?.length))return {
        ...action({t:'clearRoute'},'补种子前停止旧路线','在已完成背包的边界确认停下，再按整批缺口补种子'),farmJobId:sage.id};
      return {...bankAction(p,{t:'vendorBuy',itemId:190,qty:seedQty},`补 ${seedQty} 颗鼠尾草种子`),
        farmJobId:sage.id,reason:`本批尚缺 ${seedNeed} 颗种子；保留当前计划金币，按商人单价 ${seedPrice} 购买 ${seedQty} 颗`};
    }
    if(seedNeed&&naturalBreak&&p.lastTick>=farmRetryAt) {
      const purchase=api.marketPurchase?.(p,selected.inputs[0].itemId,seedNeed,
        {...goal,rate:{...goal?.rate,xp:foregroundRate}},style);
      if(purchase?.marketWaiting) {
        farmQuote??={jobId:selected.id,started:p.lastTick};
        farmDelayReason=`${selected.name} 本批尚缺 ${seedNeed} 颗种子；市场比价最多等待 4 秒，然后继续采种或主任务`;
        if((p.lastTick-farmQuote.started)*data.tickMs<4000)return {...purchase,farmJobId:selected.id,reason:farmDelayReason};
      } else if(purchase?.intent)return {...purchase,farmJobId:selected.id};
    }
    if (p.lastTick>=farmRetryAt) {
      // These bounded investments deliberately make long-term farm progress
      // even when a short foreground XP window would always reject them.
      const unlocked=j=>level(p.skills[j.skill])>=j.levelReq;
      const seedTime=j=>strategy.estimateWork(p,j).seconds/j.bonus.chance;
      const missing=eligible.filter(j=>j.id===selected.id&&seedNeed>0&&
        (empty.length||plots.some(f=>f.job.id!==j.id)))
        .flatMap(job=>{
          const source=jobs.filter(j=>j.bonus?.itemId===job.inputs[0].itemId)
            .sort((a,b)=>Number(unlocked(b))-Number(unlocked(a))||a.levelReq-b.levelReq||seedTime(a)-seedTime(b))[0];
          return source?[{job,source}]:[];
        }).sort((a,b)=>Number(unlocked(b.source))-Number(unlocked(a.source))||
          (empty.length?seedTime(a.source)-seedTime(b.source):
            unlocked(a.source)?rank(a.job,b.job):a.source.levelReq-b.source.levelReq||rank(a.job,b.job)));
      const expansion=empty.length>0;
      if (farmSearch&&(farmSearch.expansion!==expansion||farmSearch.style!==style||
        !missing.some(c=>c.job.id===farmSearch.job.id))) farmSearch=null;
      if (!farmSearch&&missing.length) {
        if (!naturalBreak) return deferFarm('等当前任务结束或返仓，再准备农业种子');
        farmSearch={...missing[0],expansion,style,started:p.lastTick,
          maxTicks:Math.ceil(Math.min(600,goal?.horizon??strategy.horizon)*1000/data.tickMs)};
      }
      if (farmSearch) {
        const {job,source}=farmSearch;
        farmSearch.needed=seedNeed;
        if (!unlocked(source)) {
          farmSearch.goal??={skill:source.skill,target:source.levelReq,horizon:600};
          const result=plan(p,farmSearch.goal,style);
          if (result.blocked||result.deferUntilTick) {
            farmRetryAt=p.lastTick+Math.min(job.grow,600000/data.tickMs);farmSearch=null;
          } else return {...result,farmJobId:job.id,
            reason:`解锁 ${job.name} 的自采种子：先练${NAMES[source.skill]}至 ${source.levelReq} 级；${result.reason||result.label}`};
        } else {
          const site=sites.filter(s=>s.jobIds.includes(source.id)).sort((a,b)=>distance(p,a)-distance(p,b))[0];
          if (site) {
            if (naturalBreak&&(goal?goal.growth:!!api.growthChooseGoal)) {
              farmSearch.toolGoal??={skill:source.skill,target:level(p.skills[source.skill])+1,
                horizon:600,growth:true,toolOnly:true};
              const improvement=plan(p,farmSearch.toolGoal,style);
              if (improvement) return {...improvement,farmJobId:job.id,
                reason:`准备采种工具 · ${NAMES[source.skill]}：${improvement.reason||improvement.label}`};
            }
            if (p.route?.jobId===source.id) return {...wait(`继续自采 ${job.name} 种子，本批尚缺 ${seedNeed} 颗，备齐后补种／换种`),farmJobId:job.id};
            const departure=gatheringDeparture(p,source);
            if(departure)return {...departure,farmJobId:job.id};
            return {...action({t:'setRoute',jobId:source.id,siteId:site.id,onFull:'bank',limit:0,rarity:0},
              `为${expansion?'空田':'升级作物'}补种子 · ${job.name}`,`从 ${source.name} 自采；本轮最多 ${Math.ceil(farmSearch.maxTicks*data.tickMs/60000)} 分钟，超时先继续其他任务`),farmJobId:job.id};
          }
        }
      }
    }
    const missingSource=!jobs.some(j=>j.bonus?.itemId===selected.inputs[0].itemId);
    if(seedNeed&&(missingSource||p.lastTick<farmRetryAt)) {
      if(missingSource&&naturalBreak&&p.lastTick>=farmRetryAt) {
        farmRetryAt=p.lastTick+Math.min(selected.grow,600000/data.tickMs);farmQuote=null;
      }
      farmDelayReason=`${selected.name} 本批尚缺 ${seedNeed} 颗种子；`+
        (!missingSource?'本轮采种／解锁准备已达时间预算或暂不可行，先继续主任务，稍后重试':
          sage?'保留当前计划金币，等待可负担的商人或市场采购':'市场暂未购得，未找到已核实的自采来源');
      if(farmingChoice.mode==='auto'&&naturalBreak&&(empty.length||ready.length)) {
        const neededGrowth=Math.min(Infinity,...plots.filter(f=>f.readyAt>p.lastTick&&demanded(f.job)).map(f=>f.job.grow));
        const temporary=(stocks?stocks.map(row=>row.job):eligible).find(j=>(hasSeed(p,j)||ready.some(f=>f.job.id===j.id))&&
          (demanded(j)||j.grow<=neededGrowth));
        if(temporary) {
          farmDelayReason+=`；临时种植 ${temporary.name}，继续补齐目标 ${selected.name} 种子`;
          return {...farmErrand(p,temporary,empty[0]??ready[0].site),reason:farmDelayReason};
        }
      }
    }
    return null;
  }
  const trainedSkills = (style='magic') => data.skills.filter(s=>!attacks.includes(s)||s===professionSkill(style));
  const balancedChooseGoal = (p,served={},deferred={},style='magic') => {
    const lv = levels(p);
    const eligible=trainedSkills(style).filter(s=>!['defence','hitpoints'].includes(s)&&!deferred[s]&&
      (s!=='farming'||lv.farming<Math.max(...data.farmUnlocks)));
    if (!eligible.length) return null;
    const stage = Math.min(thresholds.length-1, (Math.floor(Math.min(...eligible.map(s=>lv[s]))/5)+1)*5);
    const candidates = eligible.filter(s=>lv[s]<stage);
    candidates.sort((a,b)=>lv[a]-lv[b] || (served[a]??0)-(served[b]??0) || data.skills.indexOf(a)-data.skills.indexOf(b));
    const skill = candidates[0];
    return skill ? {skill,target:Math.min(stage,lv[skill]+1),stage} : null;
  };

  function plan(p, goal, profession='magic') {
    api.styleHint=profession;
    if (!goal||goal.toolOnly) return planTask(p,goal,profession);
    function prepareTool() {
      const result=planTask(p,goal.toolUpgrade,profession);
      if (!result||result.blocked||result.deferUntilTick) {delete goal.toolUpgrade;return null;}
      return {...result,goal,investmentGoal:goal,
        reason:`供料工具 · ${NAMES[goal.toolUpgrade.skill]}：${result.reason||result.label}`};
    }
    if (goal.toolUpgrade) {
      const result=prepareTool();
      if (result) return result;
    }
    const result=planTask(p,goal,profession);
    const job=result?.intent?.t==='setRoute'&&jobs.find(j=>j.id===result.intent.jobId);
    // Supply jobs used to skip all tool checks to prevent recursive upgrades.
    // Prepare one tool independently, then resume the original material plan.
    if (job&&!goal.mastery&&!goal.developmentFiller&&!goal.upgrade?.priority&&!job.grow&&job.skill!==goal.skill&&Object.values(data.toolSkills).includes(job.skill)) {
      goal.toolUpgrade={skill:job.skill,target:level(p.skills[job.skill])+1,toolOnly:true,
        growth:goal.growth,horizon:goal.horizon,specialization:goal.specialization,
        startedTick:goal.startedTick,skipUpgrade:goal.skipUpgrade,budget:{coins:goal.budget?.coins??0,items:{}}};
      const improvement=prepareTool();
      if (improvement) return improvement;
    }
    return result;
  }
  function planTask(p, goal, profession='magic') {
    const style=professionSkill(profession);
    const lv = levels(p);
    let completedUpgrade=false;
    // Training may spend its own planned fuel; a separate equipment project
    // must still leave the parent task's materials available.
    // A development project also holds the quality materials of the planned
    // gear (plannedGearReserve), so leveling does not spend them.
    let gearReserve=null;
    // Planned gear's quality materials are kept from every crafting goal
    // (quality.js reserve rules); item targets and upgrades bring their own.
    const qualityReserve=()=>goal.itemTarget||goal.upgrade||goal.mastery?goal.budget?.items:
      gearReserve??=mergeHold(goal.quest?goal.budget?.items:{},plannedGearReserve(p,profession));
    const unlocked = j => lv[j.skill]>=j.levelReq;
    const made = id => jobs.filter(j=>j.output.itemId===id);
    const atGoal = (skill,target) => lv[skill]>=target;
    const combatStyle = () => {
      const weapon = gear.get(base(p.equipment.weapon??0));
      return weapon?.magic ? 'magic' : weapon?.ranged ? 'ranged' : 'melee';
    };
    const canWear = id => canWearWith(data,lv,id);
    function siteFor(job) {
      let choices = sites.filter(s=>s.jobIds.includes(job.id));
      if (job.grow) {
        const allowed = farmFields(p).map(s=>s.id);
        choices = choices.filter(s=>allowed.includes(s.id));
      }
      return choices.sort((a,b)=>distance(p,a)-distance(p,b))[0];
    }
    // Include failures, common-material yields and owned tools. Walking, house,
    // potion and mastery effects still make this a base-rate estimate.
    function jobEstimate(job) {
      return strategy.estimateWork(p,job,lv);
    }
    // 补精通 byproducts (v0.8.5): the fastest unlocked job for this exact
    // quality of a bonus drop, counting its chance, quality odds, failures and
    // bank trips. Rough gems, for one, drop at several gathering spots.
    function masteryBonusSource(id,quantity) {
      const item=base(id),tier=rarity(id),seed=jobs.some(j=>j.grow&&j.inputs[0]?.itemId===item);
      const quality=seed||item===100||item===328||made(item).length||monsters.some(m=>m.drop===item);
      return jobs.filter(j=>j.bonus?.itemId===item&&j.bonus.chance>0&&!j.grow&&unlocked(j)&&siteFor(j)).map(job=>{
        const e=jobEstimate(job),odds=e.qualities??[1,0,0,0,0];
        // Native bonus seeds are at least uncommon.
        const chance=quality?(seed&&tier<2?tier===1?odds[0]+odds[1]:0:odds[tier]):tier===0?1:0;
        const attempts=quantity/(e.success*job.bonus.chance*chance);
        return {job,seconds:strategy.routeEstimate(p,job,attempts,{style:profession}).seconds};
      }).filter(c=>Number.isFinite(c.seconds)).sort((a,b)=>a.seconds-b.seconds||a.job.id-b.job.id)[0];
    }
    function cost(id, trail=[],quantity=1) {
      if (trail.includes(id)) return Infinity;
      const marketCost=api.marketUnitCost?.(p,id,Math.max(1,Math.ceil(quantity)))??Infinity;
      const producers = made(id).filter(unlocked);
      if (producers.length) return Math.min(marketCost,...producers.map(j => {
        if(j.grow) {
          if(!allowedCrop(j)&&!farmPlots(p).some(f=>f.job.id===j.id))return Infinity;
          const seed=hasSeed(p,j)||Object.values(p.plots??{}).some(plot=>base(plot.seedItemId)===j.inputs[0].itemId);
          return (jobTime(j)+(seed?0:cost(j.inputs[0].itemId,[...trail,id])))/(4+lv.farming/100);
        }
        return (jobEstimate(j).seconds+j.inputs.reduce((sum,i)=>sum+i.qty*cost(i.itemId,[...trail,id]),0))/jobEstimate(j).commonOutput;
      }));
      if (monsters.some(m=>m.drop===id)) return Math.min(marketCost,60);
      const bonuses = jobs.filter(j=>unlocked(j)&&j.bonus?.itemId===id);
      return Math.min(marketCost,bonuses.length ? Math.min(...bonuses.map(j=>jobTime(j)/j.bonus.chance)) : 3600);
    }
    function jobTime(job) {
      const e=jobEstimate(job);
      return e.seconds/e.success + (job.grow??0)/Math.max(1,farmFields(p).length)*data.tickMs/1000;
    }
    function batch(job, amount, trail=[]) {
      const site = siteFor(job);
      if (!site) return blocked(`${job.name} 没有可用地点`);
      if (job.grow) {
        if (p.route?.errand) return wait('完成本次收获补种后返回原任务');
        const manualReason=manualFarmReason(p);
        if(manualReason)return blocked(manualReason);
        const existing=farmPlots(p).some(f=>f.job.id===job.id);
        if(!allowedCrop(job)&&!existing)
          return blocked(`手动农业选择 ${manualFarmJob()?.name??'尚未设置'}，不会为 ${job.name} 改种；暂缓此目标，先继续其他任务`);
        const waitingBatch=waitForFarmBatch(p);
        if (waitingBatch&&(hasSeed(p,job)||existing))
          return {...waitingBatch,farmJobId:job.id};
        if(farmingChoice.mode==='manual') {
          if(!allowedCrop(job))return farmErrand(p,manualFarmJob(),farmPlots(p).find(f=>f.job.id===job.id).site);
          const result=harvest(p,job.id,{...goal,rate:{xp:0}},profession);
          return result??(waitingBatch?{...waitingBatch,farmJobId:job.id}:blocked(farmStatus(p).reason));
        }
      } else if (p.route?.jobId===job.id && p.route.zoneId==null) {
        if((p.workRarity??p.route.rarity??0)!==(job.rarity??0))return action({t:'clearRoute'},'当前批次已结束，切换制作品质');
        if((goal.itemTarget&&job.output.itemId===goal.targetItemId||goal.mastery&&job.output.itemId===goal.mastery.itemId)&&p.route.limit==null)
          return action({t:'clearRoute'},'切换为目标所需数量','停止原无限路线后，按尚缺成品数量继续');
        return wait(`继续 ${job.name}`);
      }
      if (!trail.length) {
        const improvement=upgrade(job.skill);
        if (improvement) return improvement;
      }
      // A project can span many native backpack trips. Truncating its demand
      // here also truncates every upstream recipe and forces repeated swaps.
      let quantity = Math.max(1,Math.ceil(amount));
      if (['mining','fishing','woodcutting'].includes(job.skill)&&!job.inputs.length&&!data.items[job.output.itemId]?.stackable) {
        const departure=gatheringDeparture(p,job);
        if(departure)return departure;
        if((!goal.itemTarget||job.output.itemId!==goal.targetItemId)&&(!goal.mastery||job.output.itemId!==goal.mastery.itemId))
          quantity=Math.max(quantity,Math.ceil((packCapacity(p)-packUsed(data,p))/job.output.qty));
      }
      const materialBatch = job.grow ? 1 : quantity;
      for (const ingredient of job.inputs) {
        if (job.grow && (held(p).some(id=>base(id)===ingredient.itemId&&count(p,id)>0) ||
          Object.values(p.plots??{}).some(plot=>base(plot.seedItemId)===ingredient.itemId))) continue;
        const needed = ingredient.qty*materialBatch+(job.rarity>0?qualityReserve()?.[ingredient.itemId]??0:0);
        if (count(p,ingredient.itemId)<needed) {
          return need(ingredient.itemId,needed,trail);
        }
      }
      if (job.grow) return farmErrand(p,job,site);
      const exact=job.rarity>0||goal.mastery&&job.output.itemId===goal.mastery.itemId||goal.quest?.jobId===job.id||goal.upgrade&&job.output.itemId===goal.upgrade.id||
        goal.itemTarget&&job.output.itemId===goal.targetItemId;
      const limit=exact?quantity:0,departure=productionDeparture(p,job,limit);
      if(departure)return departure;
      return action({t:'setRoute',siteId:site.id,jobId:job.id,onFull:'bank',limit,rarity:job.rarity??0},
        `${qualityPrefix(data,job.output.itemId)}${job.name}`,exact?`为${NAMES[goal.skill]}完成指定品质物品；${quantity} 次，按背包与仓库的同品质材料合批`:
          `为${NAMES[goal.skill]}供料／练级；无限工作，按实际等级与材料在满包／原料批次结束时调整`);
    }
    function train(skill,target,trail=[]) {
      if (atGoal(skill,target)&&!(goal.manualTrade&&!goal.quest&&skill===goal.mainSkill)) return wait(`${NAMES[skill]}已达到 ${target} 级`);
      if(skill==='farming')goal.farmingTarget=Math.max(goal.farmingTarget??0,target);
      if(skill==='farming'&&manualFarmReason(p))return blocked(manualFarmReason(p));
      if(!trail.length)api.watchPurchases?.(p,jobs.filter(j=>j.skill===skill&&!j.grow&&unlocked(j)).flatMap(j=>j.inputs.map(i=>i.itemId)));
      if (attacks.includes(skill)) return fight(skill);
      if (skill==='defence'||skill==='hitpoints') return fight(style);
      if (skill==='enhancing') return enhance();
      const prepareBatch=(goal.growth||goal.manualTrade||goal.batch>0)&&!goal.quest&&!goal.upgrade&&skill===goal.skill&&!trail.length;
      const fixed=skill===goal.mainSkill&&!trail.length?goal.fixedRecipeId:null;
      const batchLimits=new Map();
      const levelBatch=job=>Math.max(1,Math.ceil((thresholds[Math.min(lv[skill]+1,thresholds.length-1)]-
        thresholds[Math.min(lv[skill],thresholds.length-2)])/jobEstimate(job).xp));
      // A development project plans ahead: it prepares every material for the
      // whole stage (to its target level) before crafting, rather than one
      // level at a time. Business and fixed trades keep their time-bounded batches.
      const stagePlan=prepareBatch&&!!goal.development&&!goal.manualTrade&&!goal.specialization;
      // Crafts the owned materials support at each quality: a quality recipe
      // pairs its inputs at that quality (uncommon bars need uncommon copper and
      // tin), while plain inputs such as coal are shared.
      const craftsAt=(job,tier)=>{
        const key=`crafts:${job.id}:${tier}`;
        if(!batchLimits.has(key))batchLimits.set(key,
          craftRecipe(data,job,tier)?api.crafting.available(p,job,tier,qualityReserve(),5000):0);
        return batchLimits.get(key);
      };
      const ownedCrafts=job=>PAIR_TIERS.reduce((n,tier)=>n+craftsAt(job,tier),0);
      // Crafts the stage needs at common XP. Every higher quality gives more,
      // so owned crafts of all qualities together reaching this number makes
      // the stage certain: one total, no separate common target.
      const stageCrafts=job=>Math.max(1,Math.ceil(Math.max(1,
        thresholds[Math.min(goal.target??lv[skill]+1,thresholds.length-1)]-p.skills[skill])/jobEstimate(job).xp));
      // Commons to hold so that the total reaches the stage (quality crafts
      // already owned, including drops found while gathering, count).
      const stageBatch=job=>Math.max(1,stageCrafts(job)-ownedCrafts(job)+craftsAt(job,0));
      const supplyBatch=job=>{
        if(stagePlan)return Math.max(carriedBatch(p,job),stageBatch(job));
        const seconds=jobTime(job)+job.inputs.reduce((n,i)=>n+i.qty*cost(i.itemId,trail),0);
        const load=job.inputs.some(i=>!data.items[base(i.itemId)]?.stackable)?carriedBatch(p,job):Math.min(carriedBatch(p,job),levelBatch(job));
        return Math.max(load,Math.min(levelBatch(job),Math.max(1,Math.floor((goal.horizon??strategy.horizon)/seconds))));
      };
      function trainingLimit(job) {
        if(job.rarity>0) {
          const key=`${job.id}:${job.rarity}`;
          if(!batchLimits.has(key))batchLimits.set(key,api.crafting.available(p,jobs.find(j=>j.id===job.id),job.rarity,qualityReserve()));
          return batchLimits.get(key);
        }
        if(!prepareBatch||job.grow)return 50;
        if(batchLimits.has(job.id))return batchLimits.get(job.id);
        // A short recipe funded by owned gems must not become a long hunt for
        // random bonus drops when the leveling batch is enlarged. Intermediate
        // ingredients count too: two rough gems can fund two cut gems.
        const funded=amount=>{
          const stock={},purchases={};let money=0;
          function supply(id,quantity,seen=[]) {
            if(!autoUsableMaterial(data,id))return false;
            stock[id]??=count(p,id);
            const used=Math.min(quantity,stock[id]);stock[id]-=used;
            const missing=quantity-used;
            if(missing<=0||id===data.coinId)return true;
            if(seen.includes(id))return false;
            const qty=Math.ceil(missing),unit=api.marketUnitCost?.(p,id,qty+(purchases[id]??0))??Infinity;
            const price=Number.isFinite(unit)?unit*qty*api.coinRate(p):Infinity;
            if(Number.isFinite(unit)&&money+price<=(api.marketAllowance?.(p,goal)??0)&&
              unit*qty<=(goal.horizon??1800)) {
              money+=price;purchases[id]=(purchases[id]??0)+qty;return true;
            }
            const source=made(id).find(unlocked)??made(id)[0];
            if(source?.grow)return true;
            if(source)return source.inputs.every(i=>supply(i.itemId,i.qty*Math.ceil(missing/source.output.qty),[...seen,id]));
            if(monsters.some(m=>m.drop===id))return true;
            return !jobs.some(j=>j.bonus?.itemId===id)&&!monsters.some(m=>m.bonus?.itemId===id);
          }
          return job.inputs.every(i=>supply(i.itemId,i.qty*amount));
        };
        let low=0,high=supplyBatch(job);
        while(low<high) {
          const middle=Math.ceil((low+high)/2);
          if(funded(middle))low=middle;else high=middle-1;
        }
        batchLimits.set(job.id,low);return low;
      }
      const choices = jobs.filter(j=>j.skill===skill && (fixed==null||j.id===fixed) && (!j.grow||allowedCrop(j)) && unlocked(j) && siteFor(j))
        .flatMap(job=>!goal.itemTarget&&!goal.quest&&!goal.upgrade&&job.inputs.length&&!job.grow?
          [job,...[1,2,3,4].map(tier=>craftRecipe(data,job,tier)).filter(j=>j&&trainingLimit(j)>0&&qualityWorth(data,api,p,job,j.rarity).ok)]:[job])
        .filter(j=>fixed!=null||trainingLimit(j)>0);
      const neededXp = Math.max(1,thresholds[target]-p.skills[skill]);
      const scores=new Map();
      const score = j => {
        if(scores.has(j))return scores.get(j);
        const e=jobEstimate(j),n = Math.min(20,j.rarity?trainingLimit(j):50,Math.ceil(neededXp/(j.grow?j.xp:e.xp)));
        const ingredients = j.rarity?Math.max(0,api.crafting.estimate({...p,bank:{...p.bank,[j.output.itemId]:0},
          pack:p.pack.filter(i=>i.itemId!==j.output.itemId)},j.output.itemId,n*j.output.qty,{reserve:qualityReserve()}).seconds-e.seconds*n):
          j.inputs.reduce((sum,i)=>sum+Math.max(0,i.qty*n-count(p,i.itemId))*cost(i.itemId,trail,Math.max(0,i.qty*n-count(p,i.itemId))),0);
        const travel = distance(p,siteFor(j))*data.tickMs/1000;
        const value=(j.grow?j.xp:e.xp)*n/((j.grow?jobTime(j):e.seconds)*n+ingredients+travel);
        scores.set(j,value);return value;
      };
      choices.sort((a,b)=>score(b)-score(a)||a.id-b.id);
      if (!choices.length) return blocked(fixed!=null?`固定工作 ${jobs.find(j=>j.id===fixed)?.name} 缺少可持续准备的材料，等待材料或采购条件`:`${NAMES[skill]}没有已解锁任务`);
      // Gear first: planned quality pieces that can be crafted now from owned
      // materials (any maker skill whose level allows it) are made before
      // training, so their quality materials go into gear. All the quality
      // intermediates they need (e.g. every uncommon cobalt bar for several
      // cobalt tools) are smelted in one batch first, then the pieces are made.
      if(stagePlan&&!trail.length) {
        const maker=id=>jobs.find(j=>j.output.itemId===base(id)&&j.inputs.length&&!j.grow);
        const recipe=id=>{const m=maker(id);return m&&craftRecipe(data,m,rarity(id));};
        const canMake=id=>{const m=maker(id);return !!m&&lv[m.skill]>=m.levelReq;};
        const pieces=plannedQualityGear(p,profession).filter(id=>canMake(id)&&recipe(id)&&
          Number.isFinite(api.crafting.estimate(p,id,1,{}).seconds));
        if(pieces.length) {
          const totals={};
          for(const id of pieces)for(const input of recipe(id).inputs)
            if(rarity(input.itemId)>0&&maker(input.itemId))totals[input.itemId]=(totals[input.itemId]??0)+input.qty;
          for(const [key,want]of Object.entries(totals)) {
            const item=Number(key),missing=want-count(p,item);
            if(missing<=0||!canMake(item))continue;
            const possible=api.crafting.available(p,maker(item),rarity(item),{},want);
            const make=Math.min(missing,possible);
            if(make<=0)continue;
            // These intermediates are for the planned pieces themselves.
            gearReserve={};
            const result=need(item,count(p,item)+make,trail);
            result.reason=`先一次备齐计划装备所需的 ${fullName(item)}（共需 ${want}，现有 ${count(p,item)}，本批做 ${make}），`+
              `再逐件打造：${pieces.map(fullName).join('、')}；${result.reason||result.label}`;
            return result;
          }
          const piece=pieces.find(id=>recipe(id).inputs.every(i=>rarity(i.itemId)===0||count(p,i.itemId)>=i.qty))??pieces[0];
          // The piece being made uses its own reserved materials.
          gearReserve=plannedGearReserve(p,profession,piece);
          const result=need(piece,1,trail);
          result.reason=`先打造计划装备 ${fullName(piece)}：高品质材料留给装备，打造本身也给${NAMES[maker(piece).skill]}经验；`+
            `${result.reason||result.label}`;
          return result;
        }
      }
      goal.recipes ??= {};
      goal.recipeRarities??={};
      goal.recipeLevels??={};
      const preparation=prepareBatch?goal.craftPreparation:null;
      const prepared=choices.find(j=>j.id===preparation?.jobId&&(j.rarity??0)===(preparation.rarity??0));
      const cached=choices.find(j=>j.id===goal.recipes[skill]&&(j.rarity??0)===(goal.recipeRarities[skill]??0))??
        choices.find(j=>j.id===goal.recipes[skill]&&!j.rarity);
      const changed=goal.recipeLevels[skill]!=null&&goal.recipeLevels[skill]!==lv[skill];
      const betterQuality=choices[0]?.rarity>0&&score(choices[0])>score(cached??choices[0]);
      const betterSupply=cached?.inputs.length&&choices[0].inputs.some(i=>count(p,i.itemId)<i.qty*20&&
        Number.isFinite(api.marketUnitCost?.(p,i.itemId,Math.max(1,i.qty*20-count(p,i.itemId)))??Infinity))&&
        score(choices[0])>score(cached)*1.1;
      // Stage plan: gather until the owned crafts of every quality cover the
      // stage, then craft them all, the higher qualities first (more XP each).
      const stageBase=stagePlan?(prepared&&!prepared.rarity?prepared:cached&&!cached.rarity&&!changed?cached:
        choices.find(j=>!j.rarity&&j.inputs.length&&!j.grow)):null;
      const stageReady=!!stageBase&&ownedCrafts(stageBase)>=stageCrafts(stageBase);
      if(stageReady)delete goal.craftPreparation;
      const quality=stageReady?choices.filter(j=>j.rarity>0).sort((a,b)=>score(b)-score(a))[0]:null;
      const job=quality??stageBase??prepared??(betterQuality||betterSupply||changed&&!goal.specialization?choices[0]:(cached??choices[0]));
      goal.recipeLevels[skill]=lv[skill];
      goal.recipes[skill]=job.id;
      goal.recipeRarities[skill]=job.rarity??0;
      let amount=!prepareBatch&&goal.recipeId===job.id?Math.min(goal.batch??50,Math.ceil(neededXp/jobEstimate(job).xp)):
        Math.ceil(neededXp/(job.grow?job.xp:jobEstimate(job).xp));
      if(goal.specialization&&!goal.quest&&skill===goal.mainSkill&&!trail.length)amount=prepareBatch?supplyBatch(job):goal.batch??50;
      // Whole stage: until the total covers it, hold this many commons (it
      // shrinks as quality drops arrive); once covered, craft every common owned.
      if(stagePlan&&job===stageBase)amount=stageReady?Math.max(1,craftsAt(job,0)):stageBatch(job);
      else if(prepared)amount=preparation.amount;
      else if(prepareBatch&&job.inputs.length&&!job.grow) {
        const available=job.inputs.map(i=>Math.floor(count(p,i.itemId)/i.qty));
        if(available.every(n=>n>0)) amount=Math.min(amount,...available);
        else amount=Math.min(amount,Math.ceil((thresholds[lv[skill]+1]-p.skills[skill])/jobEstimate(job).xp));
        // Stackable products also need a useful supply batch; a few leftover
        // herbs must not turn every monster-material trip into two potions.
        if(!available.every(n=>n>0)&&(data.items[base(job.output.itemId)]?.stackable||job.inputs.some(i=>!data.items[base(i.itemId)]?.stackable))) {
          const load=carriedBatch(p,job);
          const useful=data.items[base(job.output.itemId)]?.stackable?Math.min(levelBatch(job),supplyBatch(job)):load;
          amount=Math.max(amount,useful);
        }
      }
      if(prepareBatch||job.rarity)amount=Math.min(amount,Math.max(fixed!=null?1:0,trainingLimit(job)));
      const result=batch(job,amount,trail);
      if(prepareBatch&&job.inputs.length&&!job.grow) {
        // Once supply has started, new drops must not shrink the planned batch.
        // Clear at dispatch: batch-boundary waits can hide the later work receipt.
        if(result.intent?.t==='setRoute'&&result.intent.jobId===job.id||p.route?.jobId===job.id)
          delete goal.craftPreparation;
        else if(!goal.upgrade&&!result.blocked) {
          const quantity=Math.max(1,Math.ceil(amount));
          if(job.inputs.some(i=>count(p,i.itemId)<i.qty*quantity))
            goal.craftPreparation={jobId:job.id,amount:quantity,...(job.rarity?{rarity:job.rarity}:{})};
        }
        if(goal.craftPreparation?.jobId===job.id) {
          const quantity=goal.craftPreparation.amount;
          const materials=job.inputs.map(i=>`${name(i.itemId)} ${count(p,i.itemId)}/${i.qty*quantity}`).join('、');
          result.reason=(stagePlan&&job===stageBase?`本阶段到 ${goal.target} 级需 ${stageCrafts(job)} 次（按普通经验算，各品质合计），`+
            `现有材料可做 ${ownedCrafts(job)} 次；采集到够再一起制作，高品质先做；`:`本批制作 ${job.name} ×${quantity}；`)+
            `备料 ${materials}；${result.reason||result.label}`;
        }
      }
      return result;
    }
    function need(id, quantity, trail=[]) {
      if(!autoUsableMaterial(data,id))return blocked(`传说物品 ${name(id)} 留给玩家支配`);
      if (trail.includes(id)) return blocked(`${name(id)} 的供料依赖形成循环`);
      if(goal.itemTarget||goal.mastery) {
        goal.budget??={coins:0,items:{}};goal.budget.items??={};
        if(id!==data.coinId)goal.budget.items[id]=Math.max(goal.budget.items[id]??0,quantity);
      }
      const next = [...trail,id];
      if (id===data.coinId) {
        const job = jobs.filter(j=>j.skill==='thieving'&&j.output.itemId===id&&unlocked(j))
          .sort((a,b)=>b.output.qty/jobTime(b)-a.output.qty/jobTime(a))[0];
        return batch(job,Math.ceil((quantity-p.coins)/job.output.qty),next);
      }
      // The reviewed vendor sells this starter seed at four times base value.
      // A single seed is returned by harvesting and starts the herb supply chain.
      if(id===190) {
        const qty=goal.itemTarget&&id===goal.targetItemId?Math.min(100,Math.max(1,quantity-count(p,id))):1;
        const price=data.items[190].value*4*qty;
        const reserve=Math.max(0,(goal.budget?.coins??0)-((goal.budget?.items?.[190]??0)>0?price:0));
        if(p.coins<price+reserve)return need(data.coinId,price+reserve,next);
        if(nearBank(p)&&(p.route||p.path?.length))return action({t:'clearRoute'},'购买启动种子前停止旧路线');
        return bankAction(p,{t:'vendorBuy',itemId:190,qty},goal.itemTarget?`购买 ${qty} 粒鼠尾草种子 · ${price} 金币`:
          `购买一粒鼠尾草启动种子 · ${price} 金币`);
      }
      const acquisitionGoal=goal.upgrade?.xpRate>0?{...goal,rate:{xp:goal.upgrade.xpRate}}:goal;
      const purchase=api.marketPurchase?.(p,id,Math.max(0,quantity-count(p,id)),acquisitionGoal,profession);
      // 补精通 may wait for random-quality yields (v0.8.3): a rare input is
      // gathered, stolen or dropped at its ordinary route while quotes run.
      const gatherQuality=!!goal.mastery&&rarity(id)>0;
      if (purchase&&!(gatherQuality&&purchase.marketWaiting)) return purchase;
      if (id===data.shardId) return fight(style,id,false);
      const producers = (id<data.plusScale?made(base(id)):[]).map(j=>gatherQuality&&!j.inputs.length?j:craftRecipe(data,j,rarity(id)))
        .filter(Boolean).sort((a,b)=>a.levelReq-b.levelReq);
      const available=producers.filter(unlocked).sort((a,b)=>{
        const time=j=>(jobEstimate(j).seconds+j.inputs.reduce((sum,i)=>sum+i.qty*cost(i.itemId,next),0))/jobEstimate(j).commonOutput;
        return time(a)-time(b);
      });
      const job = available.find(j=>j.id===goal.supplyRecipes?.[id])??available[0];
      if (job) {
        if(job.grow) {
          goal.budget??={coins:0,items:{}};goal.budget.items??={};
          goal.budget.items[id]=Math.max(goal.budget.items[id]??0,quantity);
        }
        const result=batch(job,Math.ceil((quantity-count(p,id))/job.output.qty),next);
        result.reason=`为${goal.mastery?`补精通 ${fullName(goal.mastery.itemId)}`:goal.itemTarget?`物品目标 ${name(goal.targetItemId)}`:goal.upgrade?`装备 ${name(goal.upgrade.id)}`:`${NAMES[goal.skill]} ${goal.target} 级目标`}补 ${fullName(id)}：`+
          `现有 ${count(p,id)}，计划需要 ${quantity}；${gatherQuality&&!job.inputs.length?'继续采集，等待同品质产出；攒齐后在本批结束时继续制作；':''}${result.reason||result.label}`;
        return result;
      }
      if (producers.length) {
        const producer=producers[0],result=train(producer.skill,producer.levelReq,next);
        result.reason=`为 ${name(goal.upgrade?.id??id)} 解锁 ${NAMES[producer.skill]} ${lv[producer.skill]}→${producer.levelReq} 级（${name(id)}）；${result.reason||result.label}`;
        return result;
      }
      if(rarity(id)>0&&!gatherQuality)return blocked(`缺少同品质材料 ${name(id)}；等待库存或合算报价，不为它无限刷随机掉落`);
      const sourceId=gatherQuality?base(id):id;
      if (monsters.some(m=>m.drop===sourceId||(goal.itemTarget||goal.mastery)&&m.bonus?.itemId===sourceId&&m.bonus.chance>0)) return fight(style,sourceId,false);
      const source = goal.mastery?masteryBonusSource(id,Math.max(1,quantity-count(p,id)))?.job:
        jobs.filter(j=>j.bonus?.itemId===sourceId&&unlocked(j))
          .sort((a,b)=>jobTime(a)/a.bonus.chance-jobTime(b)/b.bonus.chance)[0];
      if (source) return batch(source,50,next);
      if(goal.itemTarget||gatherQuality) {
        const locked=jobs.filter(j=>j.bonus?.itemId===sourceId&&j.bonus.chance>0).sort((a,b)=>a.levelReq-b.levelReq)[0];
        if(locked)return train(locked.skill,locked.levelReq,next);
      }
      return blocked(id===190 ? '缺少贤者种子：暂无已核实且合算的采购或自给来源，先继续其他技能' :
        `没有已知的自给来源：${name(id)}，暂缓此技能`);
    }
    function equip(itemId) {
      if (p.pack.some(i=>i.itemId===itemId)) return action({t:'wear',itemId},`装备 ${name(itemId)}`);
      return bankAction(p,{t:'equipFromBank',itemId},`装备 ${name(itemId)}`);
    }
    function selfSupply(id,trail=[]) {
      if (trail.includes(id)) return false;
      if (count(p,id)>0 || id===data.coinId || id===data.shardId) return true;
      if (jobs.some(j=>j.bonus?.itemId===id) || monsters.some(m=>m.drop===id||m.bonus.itemId===id)) return true;
      return made(id).some(j=>j.inputs.every(i=>selfSupply(i.itemId,[...trail,id])));
    }
    function upgrade(skill) {
      if(goal.itemTarget||goal.mastery)return null;
      if(goal.developmentFiller)return null;
      if(completedUpgrade||goal.temporary&&!goal.upgrade?.priority)return null;
      const rareCrafts=slot=>{
        const ids=data.gear.filter(g=>g.slot===slot&&canWear(g.itemId)&&(!g.style||g.style===skill)&&
          (slot!=='weapon'||matchesProfessionWeapon(g,profession))).flatMap(g=>[1,2,3,4].map(t=>g.itemId+t*data.rarityScale))
          .filter(id=>gearScore(id,skill)>gearScore(p.equipment[slot],skill)&&
            api.crafting.ingredients(id).some(material=>rarity(material)===rarity(id)&&count(p,material)>0));
        api.watchPurchases?.(p,ids.flatMap(id=>api.crafting.ingredients(id)));
        return ids.filter(id=>Number.isFinite(api.crafting.estimate(p,id,1,
          {reserve:goal.budget?.items,coins:goal.budget?.coins,buy:true}).seconds));
      };
      const shop=slot=>api.marketEquipment?.(p,goal,profession,{
        currentId:p.equipment[slot],
        selfOptions:rareCrafts(slot).map(id=>({id,seconds:api.crafting.estimate(p,id,1,{reserve:goal.budget?.items,coins:goal.budget?.coins,buy:true}).seconds})),
        ids:data.gear.filter(g=>g.slot===slot&&canWear(g.itemId)&&(!g.style||g.style===skill)&&
          (slot!=='weapon'||matchesProfessionWeapon(g,profession))&&
          gearScore(g.itemId+4*data.rarityScale+5*data.plusScale,skill)>gearScore(p.equipment[slot],skill)).map(g=>g.itemId),
        score:id=>gearScore(id,skill),evaluate:id=>upgradeReturn(id,slot,skill,true)});
      if (goal.upgrade) {
        const {slot}=goal.upgrade;let id=goal.upgrade.id;
        if(count(p,id)<=0) {
          const better=rareCrafts(slot).filter(candidate=>gearScore(candidate,skill)>gearScore(id,skill))
            .sort((a,b)=>gearScore(b,skill)-gearScore(a,skill))[0];
          if(better!=null)goal.upgrade.id=id=better;
        }
        const current=p.equipment[slot],worn=equipmentStats(current);
        const suitable=worn&&worn.slot===slot&&(!worn.style||worn.style===skill)&&
          (slot!=='weapon'||matchesProfessionWeapon(worn,profession));
        if (current===id||suitable&&gearScore(current,skill)>=gearScore(id,skill)) {
          delete goal.upgrade;completedUpgrade=true;return null;
        }
        else {
          if(count(p,id)<=0) {
            const market=shop(slot);
            if(market) {
              if(market.equipmentItemId)goal.upgrade={...goal.upgrade,id:market.equipmentItemId};
              return market;
            }
          }
          const result=count(p,id)>0?equip(id):need(id,1);
          result.reason=`完成装备升级 ${name(id)}：${result.reason||result.label}`;
          if(result.blocked)delete goal.upgrade;
          return result;
        }
      }
      const combat=attacks.includes(skill);
      const slots=combat?['weapon','helmet','body','legs','shield','ring','amulet']:
        Object.keys(data.toolSkills).filter(slot=>data.toolSkills[slot]===skill);
      for (const ownedOnly of goal.growth?[true,false]:[false]) for (const slot of slots) {
        if (slot==='shield'&&(profession==='melee_twohand'||equipmentStats(p.equipment.weapon??0)?.twoHanded)) continue;
        const matches=id=>{
          const g=gear.get(base(id));
          return g?.slot===slot&&canWear(id)&&
            (slot!=='weapon'||matchesProfessionWeapon(g,profession))&&(!g.style||g.style===skill);
        };
        const owned=held(p).filter(matches);
        const craftable=ownedOnly?[]:[...data.gear.filter(g=>matches(g.itemId)&&made(g.itemId).length&&selfSupply(g.itemId)).map(g=>g.itemId),...rareCrafts(slot)];
        const current=p.equipment[slot];
        if(!ownedOnly) {
          const market=shop(slot);
          if(market) {
            if(market.equipmentItemId)goal.upgrade={id:market.equipmentItemId,slot,skill,priority:true};
            return market;
          }
        }
        const candidates=[...new Set([...owned,...craftable])]
          .filter(id=>id!==current&&(current==null||!matches(current)||gearScore(id,skill)>gearScore(current,skill)))
          .map(id=>({id,investment:upgradeReturn(id,slot,skill,owned.includes(id))}))
          .filter(c=>c.investment.affordable).sort((a,b)=>{
            if(goal.growth&&owned.includes(a.id)!==owned.includes(b.id))return Number(owned.includes(b.id))-Number(owned.includes(a.id));
            if(goal.growth)return b.investment.after-a.investment.after||a.investment.seconds-b.investment.seconds;
            const value=c=>(c.investment.after??1)*(c.investment.horizon??goal.horizon??strategy.horizon)-
              (c.investment.seconds??0)*(c.investment.after??1);
            return value(b)-value(a);
          });
        if (!candidates.length) continue;
        const {id:best,investment}=candidates[0];
        if (owned.includes(best)) {
          const result=equip(best);result.investment=investment;return result;
        }
        goal.upgrade={id:best,slot,skill,priority:true,xpRate:investment.after};
        const result=need(best,1);
        if(result.blocked)delete goal.upgrade;
        result.reason=goal.growth?`阶段装备 ${name(best)}：${result.reason||result.label}`:
          `装备升级 ${name(best)}，自制预计 ${Math.ceil(investment.payback/60)} 分钟回本：${result.reason||result.label}`;
        result.investment=investment;
        return result;
      }
      return null;
    }
    function upgradeReturn(id,slot,skill,owned) {
      const recipe=made(base(id)).sort((a,b)=>a.levelReq-b.levelReq)[0],next={...p,equipment:{...p.equipment,[slot]:id}};
      // Native equipping a two-handed weapon removes the shield.
      if (slot==='weapon'&&equipmentStats(id)?.twoHanded) next.equipment.shield=null;
      const horizon=goal.horizon??strategy.horizon;
      const preparation=owned?0:rarity(id)>0?api.crafting.estimate(p,id,1,{reserve:goal.budget?.items,coins:goal.budget?.coins,buy:true}):
        recipe?strategy.routeEstimate(p,recipe,1,{style:profession}):{seconds:Infinity,xp:0};
      // Reaching a wear requirement unlocks a directed manufacturing project.
      // Accessories without a wear skill still need an affordable return; a
      // level-one character must not pursue endgame jewellery before fighting.
      const requirement=gearRequirement(id),stageUpgrade=!owned&&requirement.skill!=='none'&&requirement.level>1;
      const stageReady=Number.isFinite(owned?0:preparation.seconds)&&(stageUpgrade||!(preparation.unlocks?.length));
      const bank=nearestBank(p),equipmentTrip=nearBank(p)||p.pack.some(i=>i.itemId===id)?0:2*distance(p,bank)*data.tickMs/1000;
      const cost=(owned?0:preparation.seconds)+equipmentTrip+data.tickMs/1000;
      let before=0,after=0;
      if (attacks.includes(skill)) {
        const oldOptions=strategy.combatOptions(p,profession),newOptions=strategy.combatOptions(next,profession);
        // A missing profession weapon is an enabling investment, not a return
        // percentage against an unrelated combat style.
        for (const c of oldOptions) {
          const old=strategy.routeEstimate(p,{monsterId:c.monster.id},20,{style:profession});
          before=Math.max(before,c.xp*20/old.seconds);
        }
        for (const c of newOptions) {
          const upgraded=strategy.routeEstimate(next,{monsterId:c.monster.id},20,{style:profession});
          // Equipment should improve combat progress and survival. Crediting
          // more cooking XP for eating more food would reward weaker gear.
          after=Math.max(after,c.xp*20/upgraded.seconds);
        }
        if (!oldOptions.length&&newOptions.length) return {affordable:goal.growth||stageUpgrade?stageReady:Number.isFinite(cost)&&cost<=horizon,
          seconds:cost,payback:cost,before,after,horizon};
      } else {
        const task=jobs.find(j=>j.id===goal.recipes?.[skill])??jobs.filter(j=>j.skill===skill&&unlocked(j)&&!j.grow)
          .sort((a,b)=>jobEstimate(b).xp/jobEstimate(b).seconds-jobEstimate(a).xp/jobEstimate(a).seconds)[0];
        if (!task) return {affordable:false,seconds:cost,payback:Infinity};
        before=strategy.routeEstimate(p,task,50).rate?.xp??0;
        after=strategy.routeEstimate(next,task,50).rate?.xp??0;
      }
      const gain=after-before,payback=gain>0?Math.max(cost,(cost*after-(preparation.xp??0))/gain):Infinity;
      // Judge gear over the time it will actually be worn, not the planner's
      // 30-minute rolling window.
      const wear=Math.max(horizon,wearHorizon(id,slot,skill,after));
      // Shared payback rule (investment.js): time saved over the wear period
      // must beat the preparation time, less the XP that preparation earns.
      const worth=paybackRule({seconds:cost,credit:after>0?(preparation.xp??0)/after:0,before,after,useSeconds:wear}).worth;
      return {affordable:goal.growth||stageUpgrade?stageReady&&gain>0:worth&&cost<=wear,
        seconds:cost,payback,before,after,horizon:wear};
    }
    // Seconds until this piece is outgrown: XP to the next wear tier in the
    // same slot at the current rate, clamped to [30 min, 24 h]. Unknown rates
    // or the top tier use the full day.
    function wearHorizon(id,slot,skill,xpRate) {
      const DAY=86400,requirement=gearRequirement(id);
      const nextLevel=data.gear.filter(g=>g.slot===slot&&(!g.style||g.style===equipmentStats(id)?.style))
        .map(g=>gearRequirement(g.itemId)).filter(r=>r.skill===requirement.skill&&r.level>requirement.level)
        .map(r=>r.level).sort((a,b)=>a-b)[0];
      if(nextLevel==null)return DAY;
      if(requirement.skill!==skill||!(xpRate>0))return DAY;
      const xp=Math.max(0,(thresholds[Math.min(nextLevel,thresholds.length-1)]??0)-(p.skills[skill]??0));
      return Math.min(DAY,Math.max(1800,xp/xpRate));
    }
    function fight(style, requiredItem=null, prepareGear=true) {
      const fixedMonster=requiredItem===null&&goal.fixedMonsterId!=null?monsters.find(m=>m.id===goal.fixedMonsterId):null;
      if(requiredItem===null&&goal.fixedMonsterId!=null) {
        if(!fixedMonster)return blocked('固定怪物已不在当前数据中，请重新选择');
        if(!zones.some(z=>z.monsterId===fixedMonster.id))return blocked(`固定怪物 ${fixedMonster.name} 没有可用地点`);
      }
      if (prepareGear) {
        const improvement=upgrade(style);
        if (improvement) return improvement;
      }
      const weapons = held(p).filter(id=>{
        const g=gear.get(base(id));
        return matchesProfessionWeapon(g,profession)&&canWear(id);
      });
      const weaponScore = id => {
        return gearScore(id,style);
      };
      weapons.sort((a,b)=>weaponScore(b)-weaponScore(a));
      // upgrade() already compared owned alternatives and the bank trip. Keep
      // its decision instead of immediately overriding it with a raw stat sort.
      const weapon=weapons.includes(p.equipment.weapon)?p.equipment.weapon:weapons[0];
      if (weapon===undefined) {
        const starter=starterWeapon(profession);
        return need(starter,1);
      }
      if (p.equipment.weapon!==weapon) return equip(weapon);
      // Use deliberately conservative base stats: omit positive house/potion/mastery bonuses.
      const w=equipmentStats(weapon);
      const equipment=Object.values(p.equipment).filter(Number.isFinite).map(equipmentStats).filter(Boolean);
      const stat=key=>equipment.reduce((sum,g)=>sum+(key==='defence'||!g.style||g.style===style?1:-1)*(g[key]??0),0);
      const maxHp=lv.hitpoints;
      const safe = m => m.maxHit<maxHp/3 && maxHp/((10+m.attack)/(20+m.attack+lv.defence+stat('defence'))*(1+m.maxHit)/2)>=6;
      if(fixedMonster&&!safe(fixedMonster))return blocked(`固定怪物 ${fixedMonster.name} 目前无法安全战斗；请检查生命、防御与装备，不自动更换怪物`);
      const safeMonsters=monsters.filter(safe);
      if (!safeMonsters.length) return blocked('当前生命／防御不足以稳定战斗，请先检查装备与生命值');
      const choices=safeMonsters.filter(m=>(!fixedMonster||m.id===fixedMonster.id)&&zones.some(z=>z.monsterId===m.id)&&
        (requiredItem===null||requiredItem===data.shardId||m.drop===requiredItem&&(m.dropChance??1)>0||
          (goal.itemTarget||goal.mastery)&&m.bonus?.itemId===requiredItem&&m.bonus.chance>0)).map(m=>{
        const estimate=combatEstimate(data,m,{style,level:lv[style],accuracy:stat('accuracy'),
          strength:stat('strength'),defence:stat('defence'),defenceLevel:lv.defence,speed:w.speed??5,twoHanded:w.twoHanded});
        const zone=zones.find(z=>z.monsterId===m.id);
        const supplies=combatSupplies(data,api,p,estimate,{zone,monster:m,foodItemId:0,
          excludeFoodIds:goal.itemTarget?[goal.targetItemId]:[],
          horizon:goal.horizon??strategy.horizon,supplyCost:id=>strategy.supplyCost(p,id)});
        const unitCost=strategy.supplyCost(p,supplies.foodItemId);
        const foodSeconds=estimate.damage/supplies.heal*(Number.isFinite(unitCost)?unitCost:0);
        const bank=nearestBank(zone),tickSeconds=data.tickMs/1000;
        const windowKills=Math.max(1,supplies.horizonKills);
        const approach=p.route?.zoneId===zone.id?0:(distance(p,bank)+distance(bank,zone))*tickSeconds/windowKills;
        const restock=supplies.restockSeconds;
        const travelSeconds=approach+restock,seconds=estimate.seconds+foodSeconds+travelSeconds;
        const yieldPerKill=requiredItem===data.shardId?estimate.shards:requiredItem!==null?
          (m.drop===requiredItem?(m.dropChance??1):m.bonus.chance):estimate.xp;
        return {...estimate,monsterId:m.id,name:m.name,monsterMaxHit:m.maxHit,zone,foodSeconds,travelSeconds,supplies,
          xpPerMinute:60*estimate.xp/seconds,mainXpPerMinute:60*estimate.mainXp/seconds,
          coinsPerMinute:60*estimate.coins/seconds,score:yieldPerKill/seconds};
      }).filter(c=>c.supplies.sustainable);
      choices.sort((a,b)=>b.score-a.score||b.coinsPerMinute-a.coinsPerMinute);
      // Small estimate changes should not cause repeated travel between similar spots.
      const current=choices.find(c=>c.zone.id===p.route?.zoneId);
      const planned=requiredItem===null?choices.find(c=>c.monsterId===(goal.fixedMonsterId??goal.monsterId)):undefined;
      if(fixedMonster&&!planned)return blocked(`固定怪物 ${fixedMonster.name} 目前无法安全持续补给；等待食物或装备条件，不自动更换怪物`);
      if(goal.quest&&requiredItem===null&&!planned)return blocked('任务目标怪物目前无法安全有效击杀，先继续成长');
      const selected=planned??(current&&current.score>=choices[0]?.score*.9?current:choices[0]);
      if (!selected) return blocked('所需材料的怪物目前过强，先提升其他战斗技能');
      const supplies=selected.supplies;
      const marketFood=api.marketFood?.(p,goal,supplies);
      if(marketFood) {
        if(marketFood.foodItemId)goal.foodPreparation={playerId:p.id,style:profession,monsterId:selected.monsterId,
          itemId:marketFood.foodItemId,target:count(p,marketFood.foodItemId)+marketFood.intent.qty};
        return marketFood;
      }
      // The client resolves the enemy attack before automatic eating. A full
      // food pack therefore does not make entering combat at low HP safe.
      const targetHp=Math.min(supplies.maxHp,Math.floor(supplies.maxHp*.5)+selected.monsterMaxHit+1);
      const entering=p.route?.zoneId!==selected.zone.id;
      if ((entering&&p.hp<targetHp)||p.hp<=selected.monsterMaxHit) {
        if (p.route||p.path?.length) return action({t:'clearRoute'},'先停止当前路线并治疗',
          `当前生命 ${p.hp}，开战前至少恢复到 ${targetHp}`);
        const eligible=id=>autoUsableMaterial(data,id)&&(data.items[base(id)]?.heals??0)>0&&rarity(id)<=(p.foodMaxTier??1)&&
          (!goal.itemTarget||id!==goal.targetItemId);
        const compare=(a,b)=>Number(b===supplies.foodItemId)-Number(a===supplies.foodItemId)||
          (data.items[base(b)]?.heals??0)-(data.items[base(a)]?.heals??0);
        const carried=p.pack.filter(i=>i.qty>0&&eligible(i.itemId)).map(i=>i.itemId).sort(compare)[0];
        const stored=Object.keys(p.bank).map(Number).filter(id=>p.bank[id]>0&&eligible(id)).sort(compare)[0];
        const itemId=carried??stored;
        if (itemId!==undefined) {
          const result=carried!==undefined?action({t:'eat',itemId,qty:1},'战斗前吃一份食物回血'):
            bankAction(p,{t:'eat',itemId,qty:1,shelf:true},'战斗前从仓库吃一份食物回血');
          result.reason=`当前生命 ${p.hp}，恢复至至少 ${targetHp} 后才开战；每份食物都等待实际回血确认`;
          result.healing={targetHp,itemId};return result;
        }
      }
      goal.budget??={coins:0,items:{}};goal.budget.items??={};
      goal.budget.items[supplies.foodItemId]=Math.max(goal.budget.items[supplies.foodItemId]??0,supplies.reserve);
      const preparation=goal.foodPreparation;
      if (preparation&&(preparation.playerId!==p.id||preparation.style!==profession||
        preparation.monsterId!==selected.monsterId||preparation.itemId!==supplies.foodItemId||
        count(p,preparation.itemId)>=preparation.target||
        p.route?.zoneId===selected.zone.id&&supplies.currentFood>0)) delete goal.foodPreparation;
      // Once replenishment starts, finish that batch. Stopping at one carry
      // load makes the first bite trigger the same preparation all over again.
      if (!goal.foodPreparation&&supplies.needFood>0) goal.foodPreparation={
        playerId:p.id,style:profession,monsterId:selected.monsterId,itemId:supplies.foodItemId,target:supplies.reserve};
      if (goal.foodPreparation) {
        const {itemId,target}=goal.foodPreparation;
        goal.budget.items[itemId]=Math.max(goal.budget.items[itemId]??0,target);
        const result=need(base(itemId),target);
        result.reason=`战斗备粮 ${target} 份：${result.reason||result.label}`;
        result.supplies=supplies;return result;
      }
      if (p.eatAt!==.5) return action({t:'eatAt',at:.5},'设置半血进食');
      if (p.foodItemId!==supplies.foodItemId) return action({t:'chooseFood',itemId:supplies.foodItemId},`选择 ${name(supplies.foodItemId)} 作为补给`);
      if (p.foodPerTrip!==supplies.carryCommand) return action({t:'carryFood',count:supplies.carryCommand},`每趟携带 ${supplies.carry} 份食物`,supplies.reason);
      const carriedTargetFood=goal.itemTarget&&data.items[goal.targetItemId]?.heals&&
        p.pack.some(i=>i.itemId===goal.targetItemId&&i.qty>0);
      if ((supplies.bankFirst||carriedTargetFood)&&p.pack.length) {
        // An adjacent cooking site can keep replacing deposited food before
        // the next snapshot. Stop and confirm the old route before emptying it.
        if (p.route||p.path?.length) return action({t:'clearRoute'},'战斗补给前停止旧路线',
          '确认旧任务停止后再存包，避免持续产出掩盖存包结果');
        return bankAction(p,{t:'deposit'},'战斗出发前存包并补足当趟食物');
      }
      const purpose=requiredItem===data.shardId?'补强化碎片（按碎片效率）':requiredItem!==null?`补材料 ${name(requiredItem)}（按掉落效率）`:'练经验（按总经验效率）';
      const reason=`${purpose}；预计命中 ${(selected.hitChance*100).toFixed(0)}%，击杀 ${selected.seconds.toFixed(1)} 秒；`+
        `${NAMES[style]}经验 ${selected.mainXpPerMinute.toFixed(0)}/分，总经验 ${selected.xpPerMinute.toFixed(0)}/分，金币 ${selected.coinsPerMinute.toFixed(1)}/分。`+
        `${style==='magic'?`法术按防御的一半计算：${selected.effectiveDefence}。`:''}`+
        `已计入自制食物和往返补给的估算；${supplies.reason}未计药水、住宅、精通等加成。`;
      const result=p.route?.zoneId===selected.zone.id && combatStyle()===style&&matchesProfessionWeapon(w,profession)?wait(reason):
        action({t:'fight',zoneId:selected.zone.id,limit:0},`${NAMES[style]} · ${selected.name}`,reason);
      if (!result.intent) result.label=`继续${NAMES[style]} · ${selected.name}`;
      return {...result,combat:selected};
    }
    function enhance() {
      const result=planEnhancement(data,api,p,profession,goal);
      if(result.enhancement) {
        goal.enhancement=result.enhancement;goal.budget=result.budget;
        goal.enhancementProject??=result.enhancement;
      }
      if(result.needs) {
        const supply=need(result.needs.itemId,result.needs.quantity);
        supply.reason=`${result.reason}；${supply.reason||supply.label}`;
        return supply;
      }
      return result;
    }
    if (!goal) return blocked('参与训练的技能已达到数据表的等级上限');
    if (!trainedSkills(profession).includes(goal.skill)) return blocked(`${PROFESSIONS[profession]}模式不训练${NAMES[goal.skill]}`);
    if(goal.fixedRecipeId!=null) {
      const fixed=jobs.find(j=>j.id===goal.fixedRecipeId&&!j.grow&&j.skill===goal.mainSkill);
      if(!fixed)return blocked('固定工作已不在当前主业数据中，请重新选择');
      if(!unlocked(fixed))return blocked(`固定工作 ${fixed.name} 需要${NAMES[fixed.skill]} ${fixed.levelReq} 级（当前 ${lv[fixed.skill]}），不会自动改练其他配方`);
      if(!siteFor(fixed))return blocked(`固定工作 ${fixed.name} 没有可用地点，等待条件变化`);
    }
    if (Object.values(p.overflow??{}).some(n=>n>0)) return blocked('仓库已有溢出物品，请整理后继续');
    if(goal.upgrade?.priority) {
      const result=upgrade(goal.upgrade.skill??data.toolSkills[goal.upgrade.slot]??style);
      if(result)return {...result,goal,...(goal.professionOnly||goal.toolOnly?{priorityGear:true,investmentGoal:goal}:{})};
    }
    if (goal.professionOnly||goal.toolOnly) {
      const result=upgrade(goal.toolOnly?goal.skill:style);
      if (!result) return null;
      return {...result,priorityGear:true,investmentGoal:goal};
    }
    if ((goal.budget?.coins??0)>p.coins) {
      const result=need(data.coinId,goal.budget.coins);
      result.reason=`补足当前计划现金预算 ${goal.budget.coins}：${result.reason||result.label}`;
      result.goal=goal;return result;
    }
    let result;
    if(goal.mastery) {
      // 补精通: only self-made output counts, so no purchase of the target.
      // Crafts use the target quality's recipe; its rare inputs are gathered
      // (need() waits for same-quality yields) when the market has no deal.
      const {base:targetBase,itemId,rarity:tier,target}=goal.mastery;
      if(!p.collections)return wait('等待服务器收藏计数');
      if(mastery.skipped(goal))return blocked('补精通跳过传说品质与种植任务');
      const remaining=Math.max(0,target-(p.collections[itemId]??0));
      if(!remaining)return wait('本档精通已完成');
      const sources=made(targetBase).filter(j=>!j.grow&&sites.some(s=>s.jobIds.includes(j.id)));
      const source=sources.find(unlocked)??sources[0];
      if(source&&!unlocked(source))result=train(source.skill,source.levelReq);
      else if(source) {
        const recipe=source.inputs.length?craftRecipe(data,source,tier):source;
        if(!recipe)result=blocked(`${fullName(itemId)} 没有可核对的同品质配方`);
        else {
          // A gathered quality comes from random rolls: plan the whole tier
          // of actions at the expected rate rather than one per item.
          const perAction=recipe.inputs.length?recipe.output.qty:Math.max(1e-6,jobEstimate(recipe).tierOutput?.[tier]??0);
          result=batch(recipe,Math.ceil(remaining/perAction));
          result.reason=`补精通 ${fullName(itemId)}：还差 ${remaining}；${result.reason||result.label}`;
        }
      } else if(monsters.some(m=>m.drop===targetBase||m.bonus?.itemId===targetBase))result=fight(style,targetBase,false);
      else {
        const bonus=masteryBonusSource(itemId,remaining);
        if(bonus) {
          goal.skill=bonus.job.skill;goal.recipeId=bonus.job.id;
          result=batch(bonus.job,50);
          result.reason=`补精通 ${fullName(itemId)}：按掉率、品质、速度、失手与存仓往返选择 ${bonus.job.name}；${result.reason||result.label}`;
        } else {
          const locked=jobs.filter(j=>j.bonus?.itemId===targetBase&&j.bonus.chance>0&&!j.grow&&!unlocked(j)&&siteFor(j))
            .sort((a,b)=>a.levelReq-b.levelReq||a.id-b.id)[0];
          result=locked?train(locked.skill,locked.levelReq):blocked(`暂无已核实的亲自产出来源：${fullName(itemId)}`);
        }
      }
    } else if(goal.quest) {
      const quest=api.questRead(p).find(q=>q.key===goal.quest.key);
      if(!quest||quest.claimed||quest.remaining<=0)return wait('任务已完成或已刷新，重新安排成长');
      const job=jobs.find(j=>j.id===quest.jobId);
      if(quest.kind!=='kill'&&!job)return blocked('任务配方尚未核对，先继续成长');
      // Progress counts any quality. When the common recipe cannot be made from
      // stock now, held matched quality sets finish it first, rarest first; with
      // commons in stock, those are used and the rare materials kept.
      const reserve=plannedGearReserve(p,profession);
      const sets=job&&job.inputs.length&&!job.grow&&api.crafting.available(p,job,0,reserve,1)<1?
        PAIR_TIERS.filter(t=>t>0&&qualityWorth(data,api,p,job,t).ok).map(t=>({recipe:craftRecipe(data,job,t),n:api.crafting.available(p,job,t,reserve,quest.remaining)}))
          .find(s=>s.recipe&&s.n>0):null;
      result=quest.kind==='kill'?fight(style):sets?batch(sets.recipe,Math.min(quest.remaining,sets.n)):batch(job,quest.remaining);
      if(sets)result.reason=`任务计入任何品质：普通配方暂缺原料，先用已有的 ${RARITY_NAMES[sets.recipe.rarity]}配对做 ${Math.min(quest.remaining,sets.n)} 次；${result.reason||result.label}`;
    } else if(goal.itemTarget) {
      const id=goal.targetItemId,owned=count(p,id)+(p.overflow?.[id]??0)+
        Object.values(p.equipment).filter(item=>item===id).length+(goal.listedQty??0);
      result=need(id,count(p,id)+Math.max(0,goal.qty-owned));
    } else result=train(goal.skill,goal.target);
    result.goal=goal;
    return result;
  }
  function professionUpgrade(p,style='magic',investmentGoal=null,options={}) {
    const skill=professionSkill(style);
    const goal=investmentGoal??{skill,target:level(p.skills[skill])+1,horizon:1800,professionOnly:true,...options};
    return plan(p,goal,style);
  }
  // Per slot, the gear the plan aims for: the best piece wearable now and the
  // improvement at the next wear level, each in its lowest quality that beats
  // the worn item (an epic steel blade is improved by a rare cobalt blade at
  // the same wear level, long before the next tier). Legendary is never planned.
  function gearTargets(p,profession='magic') {
    const skill=professionSkill(profession),lv=levels(p),owned=held(p);
    const slots=['weapon','helmet','body','legs','shield','ring','amulet',...Object.keys(data.toolSkills)];
    // Quality materials are shared: pieces are planned in slot order and each
    // takes its materials out of this pool, so the plan never promises more.
    const pool={...p,pack:[],bank:{...p.bank}};
    for(const item of p.pack)pool.bank[item.itemId]=(pool.bank[item.itemId]??0)+item.qty;
    const take=(id,qty)=>{
      const job=jobs.find(j=>j.output.itemId===base(id)&&j.inputs.length&&!j.grow);
      const recipe=job&&craftRecipe(data,job,rarity(id));
      if(!recipe)return;
      const n=Math.ceil(qty/recipe.output.qty);
      for(const input of recipe.inputs)if(rarity(input.itemId)>0) {
        const want=input.qty*n,have=Math.min(want,pool.bank[input.itemId]??0);
        pool.bank[input.itemId]=(pool.bank[input.itemId]??0)-have;
        if(want>have)take(input.itemId,want-have);
      }
    };
    return slots.filter(slot=>slot!=='shield'||profession!=='melee_twohand').map(slot=>{
      const current=p.equipment[slot],score=id=>gearScore(id,data.toolSkills[slot]??skill);
      const matches=id=>{const g=gear.get(base(id));return g?.slot===slot&&
        (slot!=='weapon'||matchesProfessionWeapon(g,profession))&&(!g.style||g.style===skill);};
      const better=id=>current==null||!matches(current)||score(id)>score(current);
      const variant=g=>[0,1,2,3].map(r=>g.itemId+r*data.rarityScale).find(better)??null;
      const candidates=[...new Set([...data.gear.filter(g=>matches(g.itemId)).map(variant).filter(id=>id!=null),
        ...owned.filter(id=>matches(id)&&autoUsableMaterial(data,id)&&better(id))])].filter(id=>id!==current);
      const wearable=id=>canWearWith(data,lv,id);
      const available=candidates.filter(wearable).sort((a,b)=>score(b)-score(a)||a-b);
      const future=candidates.filter(id=>!wearable(id)).sort((a,b)=>gearRequirement(a).level-gearRequirement(b).level||score(b)-score(a));
      // The quality to plan for a target piece: the highest (up to epic) that
      // is owned or whose quality materials are all held, whatever the crafting
      // level today (that only decides when it is made); without such
      // materials, the lowest that beats the worn piece, as a target to look for.
      const planned=id=>{
        if(id==null)return null;
        const maker=jobs.find(j=>j.output.itemId===base(id)&&j.inputs.length&&!j.grow);
        for(let r=3;r>=1;r--) {
          const quality=base(id)+r*data.rarityScale;
          if(!better(quality))continue;
          if(count(p,quality)>0)return quality;
          // Its quality materials must not be worth more than the piece gains.
          if(maker&&!qualityWorth(data,api,p,maker,r).ok)continue;
          if(!Object.keys(api.crafting.shortfall(pool,quality,1).missing).length){take(quality,1);return quality;}
        }
        return id;
      };
      return {slot,current,upgrade:planned(available[0]??null),next:planned(future[0]??null)};
    });
  }
  // Planned quality pieces not yet owned. Their quality materials belong to
  // the gear: training must not burn them into bars or plates for XP.
  function plannedQualityGear(p,profession='magic') {
    const worn=Object.values(p.equipment);
    return [...new Set(gearTargets(p,profession).flatMap(t=>[t.upgrade,t.next]))]
      .filter(id=>id!=null&&rarity(id)>0&&count(p,id)<=0&&!worn.includes(id));
  }
  // The quality materials those pieces need, down their quality chain: the
  // bars, and the ore for any bars not yet made. Plain inputs (coal) are not held.
  function plannedGearReserve(p,profession='magic',except=null) {
    // Held materials are shared between pieces: a bar held for one is not
    // counted again for the next, which holds the ore for its own bar instead.
    const out={},left={};
    const have=id=>left[id]??=count(p,id);
    const reserve=(id,qty,trail)=>{
      const job=jobs.find(j=>j.output.itemId===base(id)&&j.inputs.length&&!j.grow);
      const recipe=job&&craftRecipe(data,job,rarity(id));
      if(!recipe)return;
      const n=Math.ceil(qty/recipe.output.qty);
      for(const input of recipe.inputs)if(rarity(input.itemId)>0) {
        const need=input.qty*n,used=Math.min(need,have(input.itemId));
        left[input.itemId]-=used;if(used>0)out[input.itemId]=(out[input.itemId]??0)+used;
        if(need>used&&!trail.includes(input.itemId))reserve(input.itemId,need-used,[...trail,input.itemId]);
      }
    };
    // The piece being made takes its share of the held materials first; only
    // the rest is held for the other pieces. Otherwise each new bar it smelts
    // would be claimed by another piece and it would smelt one more, forever.
    if(except!=null) {
      const own=out;
      reserve(except,1,[except]);
      for(const key of Object.keys(own))delete own[key];
    }
    for(const id of plannedQualityGear(p,profession))if(id!==except)reserve(id,1,[id]);
    return out;
  }
  function equipmentStatus(p,profession='magic') {
    return gearTargets(p,profession).map(({slot,current,upgrade,next})=>{
      const describe=id=>{
        if(id==null)return null;
        const job=jobs.find(j=>j.output.itemId===base(id));
        // A rarer piece is made from the same rarity of materials.
        const recipe=job&&craftRecipe(data,job,rarity(id));
        const stock=count(p,id)>0;
        const own=recipe&&!stock?Object.fromEntries(recipe.inputs.map(i=>[i.itemId,Math.max(0,i.qty-count(p,i.itemId))]).filter(([,qty])=>qty>0)):{};
        // Quality pieces follow their quality chain from stock (e.g. uncommon
        // cobalt ore -> bar -> helm); random rare drops are never ground for.
        if(rarity(id)>0&&!stock&&recipe) {
          const short=api.crafting.shortfall(p,id,1),made=api.crafting.estimate(p,id,1,{buy:true});
          return {id,name:fullName(id),wear:gearRequirement(id),owned:false,requirements:short.requirements,
            materials:own,chainMaterials:short.missing,seconds:made.seconds,money:made.money,quality:true};
        }
        const supply=stock?{seconds:0,unlocks:[],budget:{items:{}}}:recipe?
          strategy.routeEstimate(p,recipe,1,{style:profession}):{seconds:Infinity,unlocks:[],budget:{items:{}}};
        const all=Object.fromEntries(Object.entries(supply.budget.items).map(([item,qty])=>[item,Math.max(0,qty-count(p,+item))]).filter(([,qty])=>qty>0));
        // The item's own recipe, apart from what training to its unlock level
        // and the supply chain consume (often far larger).
        const rest=Object.fromEntries(Object.entries(all).map(([item,qty])=>[item,qty-(own[item]??0)]).filter(([,qty])=>qty>0));
        return {id,name:fullName(id),wear:gearRequirement(id),owned:stock,requirements:supply.unlocks??[],
          materials:own,chainMaterials:rest,seconds:supply.seconds};
      };
      return {slot,current:current==null?null:{id:current,name:fullName(current)},upgrade:describe(upgrade),next:describe(next)};
    });
  }
  function planAtBoundary(p,goal,style='magic',completedLoad=false) {
    // Price the next production batch while the native route finishes its load.
    // Watching quotes is read-only: no empty-pack return or route interruption.
    if(goal) {
      const id=goal.craftPreparation?.jobId??goal.fixedRecipeId??goal.recipes?.[goal.skill]??goal.recipeId;
      const original=jobs.find(j=>j.id===id);
      // 补精通 crafts watch the inputs at the target quality.
      const job=goal.mastery&&original?.inputs.length&&!original.grow?craftRecipe(data,original,goal.mastery.rarity)??original:original;
      const inputs=job?job.inputs.map(i=>i.itemId):jobs.filter(j=>j.skill===goal.skill&&!j.grow&&level(p.skills[j.skill])>=j.levelReq)
        .flatMap(j=>j.inputs.map(i=>i.itemId));
      api.watchPurchases?.(p,inputs);
    }
    const reason=!completedLoad&&finishTaskReason(data,p);
    // Keep the project's progress in view while the current load finishes:
    // material counts are read live; anything else is the last boundary's note.
    if (reason) {
      // A goal picked mid-load has no note yet: preview its next step once, on
      // a copy, so the real goal and its preparation are left untouched.
      if(goal&&!goal.craftPreparation&&goal.boundaryNote==null) {
        const preview=plan(p,JSON.parse(JSON.stringify(goal)),style);
        goal.boundaryNote=preview&&!preview.blocked&&!preview.deferUntilTick?preview.reason||preview.label||'':'';
      }
      const note=preparationNote(p,goal)||goal?.boundaryNote;
      return wait(note?`${reason}；之后：${note}`:reason);
    }
    const result=plan(p,goal,style);
    if(goal&&result?.reason&&!result.blocked&&!result.deferUntilTick)goal.boundaryNote=result.reason;
    return result;
  }
  function preparationNote(p,goal) {
    const prep=goal?.craftPreparation,job=prep&&jobs.find(j=>j.id===prep.jobId);
    const recipe=job&&craftRecipe(data,job,prep.rarity??0);
    if(!recipe)return null;
    return `备料 ${job.name} ×${prep.amount}：${recipe.inputs.map(i=>`${name(i.itemId)} ${count(p,i.itemId)}/${i.qty*prep.amount}`).join('、')}`;
  }
  // Why a crop is (or would be) grown, by the same rules harvest() uses.
  function cropWhy(p,job,goal,stocks) {
    const itemName=name(job.output.itemId);
    if(farmingChoice.mode==='manual')return job.id===farmingChoice.jobId?'手动指定的作物':'种下时的选择；成熟后改种手动指定作物';
    if(stocks) {
      const row=stocks.find(r=>r.job.id===job.id);
      const herb=jobs.some(j=>j.skill==='herblore'&&j.inputs.some(i=>i.itemId===job.output.itemId));
      const kind=herb?'炼药素材':data.items[job.output.itemId]?.heals?'食物储备':'原料';
      if(!row) {
        const busy=!stocks.length?busyCrop(p,jobs.filter(j=>j.grow&&allowedCrop(j)&&level(p.skills.farming)>=j.levelReq)):null;
        if(busy?.id===job.id)return `${kind}${itemName}库存已足；为不让农田空闲，用现有种子续种（农业经验最高）`;
        return `${kind}${itemName}库存已足；收获后改种${busy?name(busy.output.itemId):'需要的作物'}`;
      }
      if(row.plannedMissing>0)return `当前计划需要${itemName}，还缺 ${row.plannedMissing}`;
      if(row.reason==='herblore') {
        const h=row.herblore,recipe=jobs.find(j=>j.id===h.recipeId);
        const capped=Number.isFinite(h.toUnlock)&&h.potions===h.toUnlock?`，约够练到 ${h.unlockLevel} 级`:'';
        return `配合现有${h.drops.map(id=>name(id)).join('、')}炼制${name(recipe.output.itemId)}（${h.potions} 瓶${capped}）：`+
          `${itemName}库存 ${row.total}/${row.target}（在田作物计入后续供应）`;
      }
      if(row.reason==='ahead') {
        const a=row.ahead,recipe=jobs.find(j=>j.id===a.recipeId);
        return `提前备好 ${a.level} 级配方${name(recipe.output.itemId)}的${itemName}（生长慢，先种上）`+
          (a.potions>0?`：配合现有${a.drops.map(id=>name(id)).join('、')}可做 ${a.potions} 瓶`:`：尚无${a.drops.map(id=>name(id)).join('、')}，先备 ${POTION_FLOOR} 份`)+
          `，库存 ${row.total}/${row.target}`;
      }
      if(herb)return `药水储备（约 50 瓶）：${itemName}库存 ${row.total}/${row.target}`;
      return `${kind}${itemName}：库存 ${row.total}/${row.target}（在田作物计入后续供应）`;
    }
    const need=goal?.budget?.items?.[job.output.itemId]??0,have=count(p,job.output.itemId);
    if(need>have)return `当前计划需要 ${need} 个${itemName}（现有 ${have}）`;
    const best=jobs.filter(j=>j.grow&&level(p.skills.farming)>=j.levelReq).sort((a,b)=>b.xp/b.grow-a.xp/a.grow)[0];
    if(best?.id===job.id)return `农业经验最高的已解锁作物（约 ${Math.round(job.xp/(job.grow*data.tickMs/60000))} 经验/分钟/块）`;
    return `种下时的选择；成熟后按当前规则改种${best?name(best.output.itemId):'其他作物'}`;
  }
  function farmStatus(p,goal=null) {
    farmState(p);
    const fields=farmFields(p),plots=farmPlots(p),empty=fields.filter(s=>!p.plots?.[s.id]).length;
    const stocks=farmStockMode(p)?farmingStocks(data,p,levels(p),goal,thresholds):null;
    const best=farmingChoice.mode==='manual'?manualFarmJob():farmTarget??
      (stocks?stocks[0]?.job:
        jobs.filter(j=>j.grow&&level(p.skills.farming)>=j.levelReq).sort((a,b)=>b.xp/b.grow-a.xp/a.grow)[0]);
    // One line per crop in the fields, with the reason it is there.
    const groups=new Map();
    for(const plot of plots) {
      const row=groups.get(plot.job.id)??{name:plot.job.name,fields:0,readyAt:plot.readyAt,why:cropWhy(p,plot.job,goal,stocks)};
      row.fields++;row.readyAt=Math.max(row.readyAt,plot.readyAt);groups.set(plot.job.id,row);
    }
    const crops=[...groups.values()].map(row=>({name:row.name,fields:row.fields,why:row.why,
      readyMinutes:Math.max(0,Math.ceil((row.readyAt-p.lastTick)*data.tickMs/60000))}));
    const status={fields:fields.length,empty,planted:plots.length,preference:farmingPreference(),selectedName:best?.name??null,
      seedStock:best?seedCount(p,best):0,crops,next:best?{name:best.name,why:cropWhy(p,best,goal,stocks)}:null};
    const manualReason=manualFarmReason(p);
    if(manualReason)return {...status,crop:best?.name,reason:manualReason};
    if (!best) return {...status,reason:farmDelayReason??(farmStockMode(p)?'农田已全解锁，作物库存充足；先继续主任务':'暂无已解锁作物')};
    let reason;
    if (farmDelayReason&&!p.route?.errand) reason=farmDelayReason;
    else if (farmSearch) reason=`${farmSearch.expansion?'补齐空田':'升级作物'} · ${farmSearch.job.name}：`+
      (level(p.skills[farmSearch.source.skill])<farmSearch.source.levelReq?
        `先练${NAMES[farmSearch.source.skill]}至 ${farmSearch.source.levelReq} 级，再自采种子`:`正在从 ${farmSearch.source.name} 自采种子，本批尚缺 ${farmSearch.needed} 颗`);
    else if (p.lastTick<farmRetryAt) reason='本轮采种／前置练级已达时间预算，先继续其他任务，稍后重试';
    else if (hasSeed(p,best)) reason=`${best.name} 种子已备好，空田补种／成熟后更换`;
    else if (!empty&&plots.every(f=>f.job.id===best.id)) reason=`${best.name} 已种满；收获后种子循环使用`;
    else if(farmingChoice.mode==='manual'&&best.inputs[0].itemId===190)
      reason='缺少所选种子；训练模式可在保留当前计划金币后，按空田缺口向商人采购；辅助模式等待已有种子';
    else {
      const source=jobs.find(j=>j.bonus?.itemId===best.inputs[0].itemId);
      reason=`已解锁 ${best.name}，缺种子；`+(!source?'未找到已核实的采种路线，暂时保留现有作物':
        level(p.skills[source.skill])<source.levelReq?`自采需${NAMES[source.skill]} ${source.levelReq} 级（当前 ${level(p.skills[source.skill])}）`:
        `将分批从 ${source.name} 自采，补齐空田后逐步换种`);
    }
    if(farmingChoice.mode==='manual')reason=`手动种植 ${best.name}：${reason}`;
    else if(farmTargetReason)reason=`${farmTargetReason} · ${best.name}：${reason}`;
    return {...status,crop:best.name,reason};
  }
  const api={level,levels,thresholds,trainedSkills,balancedChooseGoal,plan:planAtBoundary,planItemTarget,itemTargetChoices,count,base,nearBank,carriedBatch,equipmentStats,farmPlots,farmFields,farmFieldCount,harvest,harvestOnly,professionUpgrade,equipmentStatus,gearTargets,plannedQualityGear,plannedGearReserve,farmStatus,
    hotFollowSkills:HOT_FOLLOW_SKILLS.slice(),hotSkillAt:tick=>hotSkillAt(data,tick),hotWindows:(tick,count=4)=>hotWindows(data,tick,count),
    setFarmingPreference,farmingPreference,
    taskBoundary:p=>!finishTaskReason(data,p)};
  api.reportConsumable=(key,message)=>{consumableReason={key,message};};
  api.consumableReason=()=>consumableReason;
  api.consumable=(p,goal,style,plan,window)=>{consumableReason=null;return planConsumable(data,api,p,goal,style,plan,window);};
  api.gatheringSurplus=(p,goal,style='magic',mode='balanced',waitingGoals={})=>planGatheringSurplus(data,api,p,goal,style,mode,waitingGoals);
  api.enhancementTraining=createEnhancementTraining(data,api);
  const strategy=createStrategy(data,api);
  api.crafting=createCrafting(data,api);
  Object.assign(api,{chooseGoal:strategy.chooseGoal,routeEstimate:strategy.routeEstimate,combatOptions:strategy.combatOptions,
    candidates:strategy.candidates,estimateWork:strategy.estimateWork,setMeasurements:strategy.setMeasurements,rateSource:strategy.rateSource,routeMeasurement:strategy.routeMeasurement,
    acquireEstimate:(p,id,qty,style='magic')=>rarity(id)>0?api.crafting.estimate(
      {...p,bank:{...p.bank,[id]:0},pack:p.pack.filter(i=>i.itemId!==id)},id,qty,{buy:true}):
      strategy.routeEstimate(p,{itemId:id},qty,{style}),
    coinRate:p=>Math.max(0,...jobs.filter(j=>j.output.itemId===data.coinId&&!j.inputs.length&&level(p.skills[j.skill])>=j.levelReq)
      .map(j=>{const e=strategy.estimateWork(p,j);return e.coins/e.seconds;}))});
  const growth=createProgression(data,api);
  const specialization=createSpecialization(data,api);
  const quests=createQuests(data,api);
  const housing=createHousing(data,api);
  const investments=createInvestments(data,api);
  return Object.assign(api,{growthChooseGoal:growth.chooseGoal,growthStatus:growth.status,
    housingPlan:housing.plan,housingStatus:housing.status,validateHousing:housing.validate,
    herbloreNeeds:p=>herbloreNeeds(data,p,levels(p),thresholds),
    qualityHold:(p,profession=api.styleHint??'magic',options)=>qualityHold(data,api,p,profession,options),
    potionSaleWorth:(p,id)=>potionSaleWorth(data,api,p,id),
    housingRuntime:housing.runtime,cancelHousing:housing.cancel,housingRejected:housing.rejected,refuseHouseFuel:housing.refuseFuel,setHousingEnabled:housing.setEnabled,
    observeDevelopment:growth.observe,resetDevelopment:growth.reset,developmentRuntime:growth.runtime,developmentStalled:growth.stalled,
    resumeDevelopment:growth.resumeReady,
    incomeChoices:specialization.incomeChoices,
    specialistChooseGoal:specialization.chooseGoal,specializationStatus:specialization.status,
    resetSpecialization:specialization.reset,
    masteryChooseGoal:mastery.chooseGoal,masteryCompleted:mastery.completed,masterySkipped:mastery.skipped,
    masteryStatus:mastery.status,masteryRuntime:mastery.runtime,resetMastery:mastery.reset,
    runtime(value) {
      if(value) {({farmingChoice,farmSearch,farmPlayerId,farmRetryAt,farmDelayReason,farmTarget,farmTargetReason,farmQuote}=value);farmPolicy=value.farmPolicy??null;specialization.runtime(value.specialization);growth.runtime(value.development);housing.runtime(value.housing);investments.runtime(value.investments);mastery.runtime(value.mastery);}
      return {farmingChoice,farmSearch,farmPlayerId,farmRetryAt,farmDelayReason,farmTarget,farmTargetReason,farmQuote,farmPolicy,specialization:specialization.runtime(),development:growth.runtime(),housing:housing.runtime(),investments:investments.runtime(),mastery:mastery.runtime()};
    },
    selectGoal(p,served,deferred,style,mode='balanced',mainTrade='auto',mainJobId=null,mainMonsterId=null) {
      if(mode!=='business'&&mode!=='balanced'&&!(mode==='experience'&&this.profitFloor>0))this.watchMarket?.(p,[]);
      // A worthwhile, unaffordable improvement is funded first (capped).
      if(mode==='balanced'||mode==='experience') {
        const funding=investments.fundingGoal(p,style,deferred);
        if(funding)return funding;
      }
      if(mode==='experience')return this.chooseGoal(p,served,deferred,style,{profitFloor:this.profitFloor??0});
      return (mode==='business'?this.specialistChooseGoal:mode==='experience'?this.chooseGoal:
        this.growthChooseGoal??this.chooseGoal)(p,served,deferred,style,mainTrade,mainJobId,mainMonsterId);
    },
    questRead:quests.read,questClaim:quests.claim,questChooseGoal:quests.chooseGoal,questCompleted:quests.completed,
    questReroll:quests.reroll,questOverview:quests.overview,
    perkOverview:p=>perkOverview(p),
    investmentOptions:(p,style,goal)=>investments.options(p,style,goal),fundingEnded:(p,goal)=>investments.fundingEnded(p,goal),
    fundingGoal:(p,style,deferred,goal)=>investments.fundingGoal(p,style,deferred,goal),
    chooseFallback:(p,goal,style)=>chooseFallback(data,api,p,goal,style)});
}
