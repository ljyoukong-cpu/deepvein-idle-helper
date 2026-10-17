import {canWear, gearRequirementOf, matchesProfessionWeapon, professionSkill, statsDominate} from './professions.js';
import {POTION_SALE_RATIO, autoUsableMaterial, craftRecipe, marketPotion, marketQuality} from './quality.js';
import {cropReserve, herbloreNeeds} from './farming.js';
import {COAL_ID, baseId, foodCarry, itemLabel, merchantPrice, plusOf, rarityOf, tradableBase} from './items.js';

// Read-only budgets and quotes; economy.js turns verified surplus into actions.
// Vendor, storage and worn-enhancement rules checked in index-DeoJ7Jh9.js.

export const ENHANCEMENT_BASELINE=5;

// Waiting for crops does not make that production batch disposable inventory.
// This view is for maintenance only; it must not replace the active goal.
export function reserveWaitingGoals(goal,waitingGoals={}) {
  const reservedGoals=Object.values(waitingGoals);
  if(!reservedGoals.length)return goal;
  const items={...goal?.budget?.items};
  for(const waiting of reservedGoals)for(const [id,qty]of Object.entries(waiting.budget?.items??{}))
    items[id]=Math.max(items[id]??0,qty);
  return {...goal,reservedGoals,budget:{items,coins:Math.max(goal?.budget?.coins??0,...reservedGoals.map(g=>g.budget?.coins??0))},
    farmingTarget:Math.max(goal?.farmingTarget??0,...reservedGoals.map(g=>g.farmingTarget??0))};
}

// Colour alone does not identify renewable surplus: mounts and rare bonus
// drops also have ordinary IDs. Reuse this gate at the final sale boundary.
export function saleProtectionReason(data,id,marketEquipment=false) {
  const base=baseId(data,id);
  if(!Number.isSafeInteger(id)||!data.items[base])return '未知物品，保留';
  if(!autoUsableMaterial(data,id))return '传说物品由玩家支配，保留';
  if(id===COAL_ID)return '普通煤炭用于所有品质的冶炼，从不出售';
  const marketRare=marketEquipment&&(marketQuality(data,id)||marketPotion(data,id));
  if(id!==base&&!(marketEquipment&&data.gear.some(g=>g.itemId===base))&&!marketRare)return '稀有或已强化物品，保留';
  if(data.gear.some(g=>g.itemId===base&&['mount','pet'].includes(g.slot)))return '坐骑／宠物，所有品质和重复个体均保留';
  if([...data.jobs,...data.monsters].some(row=>row.bonus?.itemId===base))return '低概率副产物／特殊掉落，不按普通盈余处理';
  if(data.jobs.some(j=>j.skill==='herblore'&&j.output.itemId===base)&&!marketRare)return '药水保留待用';
  if(base===data.coinId||base===data.shardId||base===359)return '金币／强化材料／保护卷轴，保留';
  if(base!==70&&!data.jobs.some(j=>j.output.itemId===base)&&!data.monsters.some(m=>m.drop===base))
    return '非普通生产或常规战斗产物，保留';
  return null;
}

export function inventoryBudget(data, planner, p, goal=null,consuming=false) {
  const levels=planner.levels(p), items={...goal?.budget?.items};
  const capacity=p.unlimitedBank||(p.brews?.blessing??0)>p.lastTick?Infinity:
    75+(p.bankSlotsBought??0)+Math.floor((p.house?.storeroom??0)/2);
  const used=Object.values(p.bank).filter(n=>n>0).length;
  const recoverableOverflow=Object.entries(p.overflow??{}).some(([id,n])=>n>0&&
    ((p.bank[id]??0)>0||used<capacity));
  const pressure=used>=capacity-3||Object.values(p.overflow??{}).some(n=>n>0);
  const reserve=(id,qty)=>{items[id]=Math.max(items[id]??0,Math.ceil(qty));};
  // Rare materials for planned gear and matched brews are never disposed of;
  // consuming (brewing, drinking) keeps only the gear part, so the matched
  // pairs can go into the brews they were kept for.
  for(const [id,qty]of Object.entries(planner.qualityHold?.(p,undefined,{gearOnly:consuming})??{}))reserve(Number(id),qty);
  const development=(goal?.development||goal?.quest)&&planner.developmentRuntime?.();
  const plans=[goal,...goal?.reservedGoals??[],...(development?.owner===p.id?[development.focus,...Object.values(development.parked)]:[])].filter(Boolean);
  const recipes=new Map();
  for(const plan of plans) {
    for(const [id,qty]of Object.entries(plan.budget?.items??{}))reserve(Number(id),qty);
    for(const [skill,id]of Object.entries(plan.recipes??{}))recipes.set(id,plan.recipeRarities?.[skill]??0);
    if(plan.recipeId!=null&&!recipes.has(plan.recipeId)) {
      // A 补精通 craft holds the inputs of its target quality.
      const job=data.jobs.find(j=>j.id===plan.recipeId);
      recipes.set(plan.recipeId,job?.inputs.length&&!job.grow?plan.mastery?.rarity??0:0);
    }
  }
  for(let route=p.route;route;route=route.after)if(route.jobId!=null)recipes.set(route.jobId,route===p.route?p.workRarity??route.rarity??0:route.rarity??0);
  for(const [id,tier]of recipes) {
    const original=data.jobs.find(j=>j.id===id),job=original&&craftRecipe(data,original,tier);
    if(job)for(const input of job.inputs)material(input.itemId,input.qty*50);
  }
  function material(id,qty,trail=[]) {
    reserve(id,qty);
    if(trail.includes(id))return;
    const sources=data.jobs.filter(j=>j.output.itemId===planner.base(id))
      .map(j=>craftRecipe(data,j,rarityOf(data,id))).filter(Boolean).sort((a,b)=>a.levelReq-b.levelReq);
    const job=sources.find(j=>levels[j.skill]>=j.levelReq)??(goal?.itemTarget?sources[0]:null);
    if(job)for(const input of job.inputs)material(input.itemId,
      Math.ceil(qty/job.output.qty)*input.qty,[...trail,id]);
  }
  for(const upgrade of plans.flatMap(plan=>[plan.upgrade,plan.toolUpgrade?.upgrade]))
    if(upgrade?.id!=null)material(upgrade.id%data.plusScale,1);
  if(goal?.itemTarget)material(goal.targetItemId,goal.qty);
  // Food is a renewable supply, but a reserve must survive a sale and a new trip.
  for(const item of Object.values(data.items))if(item.heals)reserve(item.id,Math.max(50,foodCarry(p)*3));
  // A replenishable pantry protects against disposal, not useful consumption.
  if(!consuming&&levels.farming>=Math.max(...data.farmUnlocks)) {
    const herblore=herbloreNeeds(data,p,levels,planner.thresholds);
    for(const job of data.jobs.filter(j=>j.grow&&j.levelReq<=levels.farming))reserve(job.output.itemId,cropReserve(data,p,job,levels,herblore));
  }
  return {items,coins:Math.max(0,...plans.map(plan=>plan.budget?.coins??0)),capacity,used,freeSlots:capacity-used,pressure,recoverableOverflow};
}
export function enhanceQuote(data, planner, p, itemId) {
  const base=baseId(data,itemId),n=plusOf(data,itemId),rarity=rarityOf(data,itemId);
  const recipe=data.jobs.find(j=>j.output.itemId===base);
  const tier=recipe?data.enhanceThresholds.filter(v=>recipe.levelReq>=v).length:3;
  const house=p.houseFurniture?.lectern?1+.01*(p.house?.lectern??0):1;
  // Client 1.0.1189: each Enhancing level above 1 multiplies the odds by +0.2%.
  const skill=1+.002*((planner.levels(p).enhancing??1)-1);
  const chance=Math.min(1,Math.max(.2,1-.06*n)*house*skill*(1+.0025*(p.masteries?.enhance??0)));
  return {fromPlus:n,toPlus:n+1,chance,gold:data.enhanceGold[tier]*[1,3,8,20,50][rarity]*(n+1),
    shards:data.enhanceShards*(n+1),xp:Math.round(20*(n+1)*data.rarityXp[rarity]),
    failurePlus:0};
}

export function reviewInventory(data, planner, p, goal=null, style='magic',budget=inventoryBudget(data,planner,p,goal)) {
  const lv=planner.levels(p),combatSkill=professionSkill(style);
  const name=id=>itemLabel(data,id);
  const seeds=new Set(data.jobs.filter(j=>j.grow).flatMap(j=>j.inputs.map(i=>i.itemId)));
  const inputs=new Set(data.jobs.flatMap(j=>j.inputs.map(i=>i.itemId)));
  const houseMaterials=new Set([...data.jobs.filter(j=>['mining','woodcutting','fishing','farming'].includes(j.skill))
    .map(j=>j.output.itemId),...data.monsters.map(m=>m.drop)]);
  const stock=new Map();
  const add=(id,qty,place)=>{
    if(!qty||!Number.isFinite(id)) return;
    if(!stock.has(id))stock.set(id,{itemId:id,name:name(id),bank:0,pack:0,worn:0,overflow:0});
    stock.get(id)[place]+=qty;
  };
  Object.entries(p.bank).forEach(([id,qty])=>add(Number(id),qty,'bank'));
  p.pack.forEach(i=>add(i.itemId,i.qty,'pack'));
  Object.values(p.equipment).forEach(id=>add(id,1,'worn'));
  Object.entries(p.overflow??{}).forEach(([id,qty])=>add(Number(id),qty,'overflow'));
  const locked=new Set([goal?.upgrade?.id,goal?.toolUpgrade?.upgrade?.id,p.enhance?.itemId]);
  for(const set of p.gearSets??[])for(const id of Object.values(set?.items??{}))if(Number.isFinite(id))locked.add(id);
  // Saved sets resolve a missing enhancement level to another level of the same
  // base item and rarity (client a$). Preserve that fallback too.
  const lockedVariants=new Set([...locked].filter(Number.isFinite).map(id=>id%data.plusScale));
  const requirement=g=>gearRequirementOf(data,g.itemId).level;
  const wearable=g=>canWear(data,lv,g.itemId);
  const relevant=g=>Object.hasOwn(data.toolSkills,g.slot)||(!g.style||g.style===combatSkill)&&
    (g.slot!=='weapon'||matchesProfessionWeapon(g,style))&&
    (g.slot!=='shield'||style!=='melee_twohand');
  const heldGear=[...stock.values()].filter(row=>row.bank+row.pack+row.worn>0)
    .map(row=>planner.equipmentStats(row.itemId)).filter(Boolean);
  const selfSource=(id,trail=[])=>!trail.includes(id)&&(id===data.coinId||data.jobs.some(j=>
    j.output.itemId===id&&lv[j.skill]>=j.levelReq&&j.inputs.every(i=>selfSource(i.itemId,[...trail,id]))));
  // Gear is compared within its own line (slot, style, weapon type), for every
  // style. A better piece replaces it only once that piece can be worn no later
  // than this one, so the wearable-now piece for a lower level is kept.
  const line=g=>[g.slot,g.style??'',g.needs??'',!!g.twoHanded,g.slot==='weapon'&&g.needs==='ranged'?g.speed:''].join('|');
  function dominated(g) {
    return heldGear.some(h=>h.itemId!==g.itemId&&line(h)===line(g)&&
      (wearable(h)||requirement(h)<=requirement(g))&&statsDominate(h,g));
  }
  // Of one piece of gear only the highest rarity (then enhancement) copy is a
  // possible upgrade; lower copies are surplus even before they can be worn.
  const rank=id=>rarityOf(data,id)*1000+plusOf(data,id);
  const superseded=id=>[...stock.values()].some(row=>row.itemId!==id&&planner.base(row.itemId)===planner.base(id)&&
    row.bank+row.pack+row.worn+row.overflow>0&&rank(row.itemId)>rank(id));
  const items=[...stock.values()].map(row=>{
    const id=row.itemId,base=planner.base(id),g=planner.equipmentStats(id);
    const total=row.bank+row.pack+row.worn+row.overflow;
    let keep=total,reason='用途未完全覆盖，先保留',category='保留';
    const potionSale=marketPotion(data,id)&&planner.potionSaleWorth?.(p,id)===true;
    const marketOnly=!!g&&id!==base||marketQuality(data,id)||potionSale;
    const protectedReason=saleProtectionReason(data,id,marketOnly);
    if(protectedReason)reason=protectedReason;
    else if(locked.has(id)||lockedVariants.has(id%data.plusScale))reason='装备方案／当前打造或强化目标';
    else if(potionSale){keep=0;reason=`稀有药水的买单价超过同等药效最便宜来源的 ${POTION_SALE_RATIO} 倍：只挂市场出售，自用较便宜的药水`;}
    else if(marketOnly&&!g){keep=0;reason='稀有加工品：保留清单以外的按同品质近期成交价只挂市场，不转系统回收';}
    else if(marketOnly) {
      keep=row.worn;
      if(superseded(id))reason='已持有同款更高品质／强化的一件；按原品质和强化等级仅售市场';
      else if(dominated(g))reason='同类已有更好且不晚于它可穿戴的装备；按原品质和强化等级仅售市场';
      else {keep=Math.max(1,keep);reason='该职业同类最高品质且可能成为升级，保留一件；重复的仅售市场';}
    }
    else if(seeds.has(base))reason='种子用于持续补种，不作为普通盈余出售';
    else if(data.items[base]?.heals) {keep=Math.min(total,budget.items[base]??50);reason='保留至少三趟战斗食物及当前计划需要量';}
    else if(inputs.has(base)||houseMaterials.has(base)) {
      const renewable=selfSource(base)||data.monsters.some(m=>m.drop===base);
      const planned=budget.items[base]??0;
      if(renewable||planned>0) {
        keep=Math.min(total,Math.max(planned,budget.pressure?0:50));
        reason=planned?'保留当前批次、供料链和打造需要量':budget.pressure?
          '仓库紧张，出售暂未纳入计划且可自行重新采集的普通库存':'保留 50 件周转材料，出售明确盈余';
      } else reason='尚无可用自给来源或后续用途未预算，保留';
    }
    else if(base===70) {keep=0;category='可卖候选';reason='烧焦食物，出售回收金币';}
    else if(g) {
      keep=row.worn;
      if(!dominated(g)&&!superseded(id))keep=Math.max(1,keep);
      keep=Math.min(total,keep);
      category=keep<total?'可卖候选':'保留';
      reason=superseded(id)?'已持有同款更高品质的一件；普通品质的出售':
        dominated(g)?'同类已有更好且不晚于它可穿戴的装备；已穿戴的仍保留':
        '保留一件未被替代的工具／装备（各职业分别保留），重复成品可处理';
    }
    keep=Math.max(keep,Math.min(total,budget.items[id]??0),row.worn);
    const sell=tradableBase(data,base)?Math.max(0,total-keep):0,vendorUnit=merchantPrice(data,base);
    if(sell>0)category='可卖候选';
    return {...row,total,keep,sell,sellFromBank:Math.min(row.bank,sell),
      sellFromPack:Math.min(row.pack,Math.max(0,sell-row.bank)),vendorUnit,category,reason,marketOnly,
      estimatedCoins:sell*vendorUnit};
  });
  const enhancements=Object.entries(p.equipment).flatMap(([slot,id])=>{
    const before=planner.equipmentStats(id);
    if(!before||!relevant(before)||!autoUsableMaterial(data,id))return [];
    const after=planner.equipmentStats(id+data.plusScale),quote=enhanceQuote(data,planner,p,id);
    const changes=['accuracy','strength','defence','luck'].filter(k=>after[k]>before[k])
      .map(k=>`${{accuracy:'命中',strength:'力量',defence:'防御',luck:'幸运'}[k]} +${Math.round((after[k]-before[k])*1000)/1000}`);
    const skill=data.toolSkills[slot];
    let priority=2,benefit=changes.join('、')||'属性取整后不变',gain=changes.length;
    if(skill) {
      gain=(1+after.bonus)/(1+before.bonus)-1;
      benefit=slot==='hoe'?'当前后台种植不浇水，强化锄头不缩短自然生长时间':
        `未触及速度上限时，工作速度约 +${(gain*100).toFixed(2)}%`;
      if(slot==='hoe')gain=0;
      if(data.jobs.find(j=>j.id===p.route?.jobId)?.skill===skill)priority=0;
    } else if(slot==='weapon')priority=1;
    if(!gain)priority=4;
    const target=planner.equipmentStats(id%data.plusScale+ENHANCEMENT_BASELINE*data.plusScale);
    const towardBaseline=quote.fromPlus<ENHANCEMENT_BASELINE&&slot!=='hoe'&&slot!=='mount'&&
      ['accuracy','strength','defence','luck','bonus'].some(k=>(target[k]??0)>(before[k]??0));
    return [{itemId:id,name:name(id),slot,...quote,benefit,priority,
      recommendation:quote.fromPlus>=ENHANCEMENT_BASELINE?'已达 +5 基线，暂不自动追加':
        !gain?(towardBaseline?'通往 +5 的中间步骤，按完整提升与预算安排':'暂不强化'):
        quote.chance<1?'向 +5 提升，有失败归零风险；按盈余预算安排':'向 +5 提升，首级无失败风险',
      affordable:p.coins>=quote.gold&&planner.count(p,data.shardId)>=quote.shards}];
  }).sort((a,b)=>a.priority-b.priority||a.gold-b.gold);
  return {items,enhancements,budget};
}
