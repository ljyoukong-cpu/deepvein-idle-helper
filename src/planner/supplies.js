import {autoUsableMaterial} from './quality.js';
import {baseId, distance, packCapacity, rarityOf} from './items.js';

// Reviewed client index-O0haAaUW.js: Ah/g1 (potions), j4/Rt (quality
// buckets), S1/$1/Or/T1 (food). A potion adds 6000 ticks at its own quality.
export const POTION_TICKS=6000;
export function potionRefillQty(p,kind) {
  const remaining=Math.max(0,(p.brews?.[kind]??0)-p.lastTick);
  return remaining>POTION_TICKS*6?0:Math.ceil((POTION_TICKS*20-remaining)/POTION_TICKS);
}
export const POTIONS=[
  {itemId:220,kind:'gatherer',label:'采集药剂'},
  {itemId:221,kind:'hunter',label:'猎人药剂'},
  {itemId:222,kind:'warrior',label:'战士药剂'},
  {itemId:223,kind:'elixir',label:'矿脉灵药'},
  {itemId:224,kind:'abyssal',label:'深渊药剂'},
  {itemId:225,kind:'swift',label:'疾行药剂'},
  {itemId:226,kind:'nourish',label:'滋养药剂'},
  {itemId:227,kind:'haste',label:'急速药剂'}
];

export function brewPower(data,p,kind) {
  if(!((p.brews?.[kind]??0)>p.lastTick))return 0;
  const clamp=tier=>Math.max(0,Math.min(data.rarityMultipliers.length-1,tier));
  const buckets=p.brewBuckets?.[kind];
  if(buckets?.length) {
    const total=buckets.reduce((sum,n)=>sum+n,0);
    const elapsed=Math.max(0,p.lastTick-(p.brews[kind]-total));
    let covered=0;
    for(let tier=buckets.length-1;tier>=0;tier--) {
      covered+=buckets[tier];
      if(elapsed<covered)return data.rarityMultipliers[clamp(tier)];
    }
  }
  return data.rarityMultipliers[clamp(p.brewTier?.[kind]??0)];
}

export function foodEffects(data,itemId) {
  const base=baseId(data,itemId);
  if(!(data.items[base]?.heals>0))return {fedTicks:0,rootedTicks:0};
  const rarity=Math.max(0,Math.min(4,rarityOf(data,itemId)));
  const fedTicks=[0,200,1000,18000,144000][rarity];
  if(base<170||base>179)return {fedTicks,rootedTicks:0};
  const crops=data.jobs.filter(j=>j.skill==='farming'&&j.grow!==undefined&&
    j.output.itemId>=170&&j.output.itemId<=179);
  const crop=crops.find(j=>j.output.itemId===base),maxLevel=Math.max(1,...crops.map(j=>j.levelReq));
  const progress=crop&&maxLevel>1?(crop.levelReq-1)/(maxLevel-1):0;
  const rootedTicks=Math.round((100+900*progress)/100)*100*[1,2,5,12,30][rarity];
  return {fedTicks,rootedTicks};
}

export function buffKey(data,p) {
  return JSON.stringify([...POTIONS.map(({kind})=>brewPower(data,p,kind)),
    (p.brews?.fed??0)>p.lastTick,(p.brews?.rooted??0)>p.lastTick]);
}

export function activeBuffs(data,p) {
  return [...POTIONS.map(({kind,label})=>({kind,label,power:brewPower(data,p,kind)})),
    {kind:'fed',label:'饱食：伤害 +25%',power:.25},
    {kind:'rooted',label:'扎根：承伤 -20%',power:.2}]
    .filter(({kind})=>(p.brews?.[kind]??0)>p.lastTick)
    .map(buff=>({...buff,remainingSeconds:(p.brews[buff.kind]-p.lastTick)*data.tickMs/1000}));
}

// Client index-DeoJ7Jh9.js: Vt/jl/J2/DT/G9/H2 and z9/In. Food is
// unstackable, while combat loot that does not fit goes directly to the bank.

export function foodHealing(data,planner,p,itemId,eatAt=.5) {
  const base=baseId(data,itemId),rarity=rarityOf(data,itemId);
  const item=data.items[base];
  if(!item?.heals)return {heal:0,currentHeal:0,maxHp:0,rarity};
  const raw=Math.max(1,Math.round(item.heals*(data.foodHealingMultipliers??[1,1.2,1.5,2,3])[rarity]));
  const maxHp=Math.floor(planner.level(p.skills.hitpoints)*(1+.005*(p.masteries?.hp??0)));
  const gap=Math.max(1,maxHp-Math.floor(maxHp*eatAt));
  const meals=.025*(p.perks?.meals??0);
  const nourish=.25*brewPower(data,p,'nourish');
  // Do not assume a timed healing buff survives the entire expedition.
  return {heal:Math.min(gap,Math.floor(raw*(1+meals))),
    currentHeal:Math.min(gap,Math.floor(raw*(1+meals+nourish))),maxHp,rarity};
}

export function combatSupplies(data,planner,p,estimate,options={}) {
  const {zone,monster}=options;
  const capacity=packCapacity(p),eatAt=options.eatAt??.5;
  const rarity=id=>rarityOf(data,id);
  const eligible=id=>autoUsableMaterial(data,id)&&data.items[planner.base(id)]?.heals>0&&rarity(id)<=(p.foodMaxTier??1)&&
    !options.excludeFoodIds?.includes(id);
  const stock=id=>planner.count(p,id);
  const owned=[...new Set([...Object.keys(p.bank).map(Number),...p.pack.map(i=>i.itemId)])].filter(id=>eligible(id)&&stock(id)>0);
  const recipes=data.jobs.filter(j=>j.skill==='cooking'&&planner.level(p.skills.cooking)>=j.levelReq);
  const cooked=new Set(data.jobs.filter(j=>j.skill==='cooking').map(j=>j.output.itemId));
  const possible=[...new Set([...owned,...recipes.map(j=>j.output.itemId)])];
  const preferred=options.foodItemId??(p.foodItemId>0?p.foodItemId:null);
  const damage=Math.max(0,estimate.damage??0),seconds=Math.max(data.tickMs/1000,estimate.seconds??1);
  const bank=zone?[...data.banks].sort((a,b)=>distance(a,zone)-distance(b,zone))[0]:null;
  const roundTripSeconds=options.roundTripSeconds??(bank?
    (2*distance(bank,zone)+3)*data.tickMs/1000:3*data.tickMs/1000);
  const horizon=Math.max(1,options.horizon??1800);
  // Only presets actually exposed by the client; -1/-2 are sent as sentinels.
  const choices=[5,10,20,-2,-1].map(command=>({command,
    count:command===-1?capacity:command===-2?Math.max(1,capacity-1):Math.min(command,capacity)}))
    .sort((a,b)=>a.count-b.count);
  const weapon=planner.equipmentStats(p.equipment.weapon);
  const healInterval=Math.min(weapon?.speed??5,monster?.speed??5)*data.tickMs/1000;
  const plans=[];
  for(const id of (preferred>0&&eligible(preferred)?[preferred]:possible).filter(eligible)) {
    const healing=foodHealing(data,planner,p,id,eatAt),heal=healing.heal;
    const foodPerKill=heal>0?damage/heal:Infinity,safeFoodPerKill=foodPerKill*1.25;
    const sustainable=heal>0&&heal/Math.max(.6,healInterval)>damage/seconds*1.25;
    const cost=options.supplyCost?options.supplyCost(id):Infinity;
    for(const option of choices) {
      const tripKills=safeFoodPerKill>0?Math.max(.1,(option.count-1)/safeFoodPerKill):Infinity;
      const required=k=>Math.max(option.count,Math.ceil(k*safeFoodPerKill)+1);
      const duration=k=>{
        const missing=Math.max(0,required(k)-stock(id));
        return k*seconds+Math.max(0,Math.ceil(k/tripKills)-1)*roundTripSeconds+(missing>0?missing*cost:0);
      };
      let lo=0,hi=Math.min(options.limit??Infinity,horizon/seconds);
      for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(duration(mid)<=horizon)lo=mid;else hi=mid;}
      // Restocking can reset the encounter. A good healing rate is insufficient
      // when even a full load runs out before one kill (including the margin).
      plans.push({id,healing,foodPerKill,safeFoodPerKill,sustainable:sustainable&&tripKills>=1,...option,tripKills,kills:lo,
        required:required(lo),seconds:duration(lo),oneKillSeconds:duration(1),cost});
    }
  }
  // More food cannot force a depot trip: overflowing combat loot is banked.
  // Prefer the larger load when preparation and predicted throughput are equal.
  plans.sort((a,b)=>Number(b.sustainable)-Number(a.sustainable)||b.kills-a.kills||b.count-a.count||b.healing.heal-a.healing.heal);
  const automatic=!(preferred>0&&eligible(preferred));
  const cookedPlans=automatic?plans.filter(plan=>cooked.has(planner.base(plan.id))&&
    plan.sustainable&&plan.oneKillSeconds<=horizon):[];
  const selected=(cookedPlans.length?cookedPlans:plans)[0]??{id:60,healing:foodHealing(data,planner,p,60,eatAt),command:-1,count:capacity,
    foodPerKill:damage/3,safeFoodPerKill:damage/3*1.25,tripKills:1,kills:0,required:capacity,sustainable:false};
  const foodItemId=selected.id,healing=selected.healing,heal=healing.heal;
  const carry=selected.count,carryCommand=selected.command;
  const {foodPerKill,safeFoodPerKill,sustainable}=selected;
  const expectedKills=Math.max(.1,Math.min(options.limit??Infinity,horizon/seconds,selected.tripKills));
  const reserve=Math.max(carry,Math.min(carry*3,selected.required));
  const currentFood=p.pack.filter(i=>eligible(i.itemId)).reduce((n,i)=>n+i.qty,0);
  // A departure load is not a retreat threshold. Let an active fight consume
  // its meals before planning another batch, rather than leaving after one bite.
  const continuing=p.route?.zoneId!=null&&p.route.zoneId===zone?.id&&currentFood>0;
  const quantity=stock(foodItemId),needFood=!continuing&&quantity<carry?Math.max(0,reserve-quantity):0;
  const cumulative=[1,...['uncommon','rare','epic','legendary'].map(k=>
    Math.min(1,(data.rarityChance[k]??0)*(options.rarityMultiplier??1))),0];
  const probabilities=cumulative.slice(0,5).map((v,i)=>Math.max(0,v-cumulative[i+1]));
  const distinct=(chance,n)=>1-(1-Math.min(1,chance))**n;
  const drop=monster?.drop!=null?data.items[monster.drop]:null;
  const dropChance=Math.max(0,Math.min(1,monster?.dropChance??1));
  const shardChance=monster?Math.min(.2,.08+monster.level*.0013):0;
  const bonusChance=monster?Math.min(1,(monster.bonus?.chance??0)*(options.rarityMultiplier??1)):0;
  const lootSlots=drop?(drop.stackable?probabilities.reduce((n,chance)=>n+distinct(chance*dropChance,expectedKills),0):expectedKills*dropChance)+
    distinct(shardChance,expectedKills)+(data.items[monster.bonus?.itemId]?.stackable===false?
      bonusChance*expectedKills:distinct(bonusChance,expectedKills))+distinct(1/500000,expectedKills):0;
  const lootFreeAtStart=capacity-(data.items[planner.base(foodItemId)]?.stackable?1:carry);
  // This is a planning estimate, not a claim that rare loot is lost: In() banks
  // each drop that cannot fit. Keep that distinct from a forced restocking trip.
  const firstKillConsumed=Math.min(carry,Math.floor(foodPerKill));
  const room=lootFreeAtStart+firstKillConsumed;
  // Count independent material/shard/bonus/rare-drop rolls. Some high-level
  // monsters now drop their ordinary material only half of the time.
  const lootCounts=[1,0,0,0,0];
  for(const chance of [dropChance,shardChance,bonusChance,1/500000])
    for(let n=4;n>=0;n--)lootCounts[n]=lootCounts[n]*(1-chance)+(n?lootCounts[n-1]*chance:0);
  const firstKillBankChance=drop?Math.min(1,lootCounts.slice(Math.max(0,room+1)).reduce((sum,n)=>sum+n,0)):0;
  const otherFood=p.pack.some(i=>eligible(i.itemId)&&i.itemId!==foodItemId);
  const occupied=p.pack.filter(i=>i.itemId!==foodItemId).length;
  const bankFirst=p.route?.zoneId!==zone?.id&&quantity>=carry&&
    (currentFood<carry||otherFood||occupied+carry>capacity);
  const restockSeconds=roundTripSeconds/expectedKills;
  return {foodItemId,...healing,carry,carryCommand,reserve,needFood,available:quantity,currentFood,
    foodPerKill,safeFoodPerKill,expectedKills,roundTripSeconds,restockSeconds,capacity,
    lootSlots,lootFreeAtStart,firstKillBankChance,bankFirst,sustainable,
    horizonKills:selected.kills,foodSeconds:foodPerKill*(selected.cost??0),
    reason:(automatic?(cookedPlans.length?'优先熟食续航，作物保留用于补充增益；':
      sustainable&&!cooked.has(planner.base(foodItemId))?'熟食当前无法在计划窗口内安全续航，暂用现有作物过渡；':''):'')+
      `每趟带 ${carry} 份，备粮 ${reserve} 份；有效治疗 ${heal}，预计每趟 ${expectedKills.toFixed(1)} 杀，`+
      `补给往返 ${roundTripSeconds.toFixed(0)} 秒，出发留 ${lootFreeAtStart} 格、预计战利品占 ${lootSlots.toFixed(1)} 格。`+
      '已加 25% 耗粮余量；战斗包满时额外掉落直接入仓，不会仅因包满返程。'};
}
