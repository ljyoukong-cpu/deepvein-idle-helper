import {PAIR_TIERS, autoUsableMaterial, setsAt} from './quality.js';
import {foodEffects} from './supplies.js';
import {baseId, foodCarry, rarityOf, stockQty} from './items.js';

// Ordinary and rare crops share a pantry reserve, but recipe demands keep
// their exact quality IDs. Growing crops count only as future supply.

// Herbs for potions drunk while herblore is not being trained (one potion lasts
// an hour); training itself makes potions, so this only bridges the gaps.
export const POTION_FLOOR=50;

const herbIds=data=>new Set(data.jobs.filter(j=>j.grow).map(j=>j.output.itemId));
const held=stockQty;

// Herblore drives herb farming: each level band uses thousands of herbs, one
// per potion. The next recipe is the best-experience unlocked one whose other
// inputs (monster drops) are held; it can use as many herbs as those drops
// allow, and growing more than that is wasted until more drops arrive.
//
// It also plans one unlock ahead: herbs grow slowly, so the next recipe's herb
// is started while the current one runs. With the experience table, the current
// recipe only claims the potions (and shared drops) needed to reach that unlock;
// the remaining drops size the next herb, or it starts with the potion floor.
// A brew takes every input in one quality, so herbs and drops pair per quality:
// rare herbs only count against rare drops. Rarer pairs are brewed first (more
// XP, stronger and dearer potions). Legendary inputs stay with the player.
export function herbloreNeeds(data,p,levels,thresholds=null) {
  const herbs=herbIds(data),level=levels.herblore??1,R=data.rarityScale;
  const all=data.jobs.filter(j=>j.skill==='herblore');
  const recipes=all.filter(j=>j.levelReq<=level);
  const spare={},left=id=>spare[id]??held(p,id);
  const drops=recipe=>recipe.inputs.filter(i=>!herbs.has(i.itemId));
  const pairableAt=(recipe,t)=>setsAt({inputs:drops(recipe).map(i=>({...i,itemId:i.itemId+t*R}))},left);
  const pairable=recipe=>PAIR_TIERS.reduce((n,t)=>n+pairableAt(recipe,t),0);
  const next=[...recipes].sort((a,b)=>Number(pairable(b)>0)-Number(pairable(a)>0)||b.xp-a.xp||b.levelReq-a.levelReq)[0]??null;
  const upcoming=all.filter(j=>j.levelReq>level).sort((a,b)=>a.levelReq-b.levelReq||b.xp-a.xp)[0]??null;
  const xp=p.skills?.herblore;
  const toUnlock=next&&upcoming&&Number.isFinite(thresholds?.[upcoming.levelReq])&&Number.isFinite(xp)?
    Math.max(0,Math.ceil((thresholds[upcoming.levelReq]-xp)/next.xp)):Infinity;
  // Herbs needed per exact quality: as many as that quality's drops pair with.
  // `pairs`: the rare herbs and drops matched for these brews, kept together.
  const recipe={},floor={},byTier={},pairs={};let potions=0,room=toUnlock;
  if(next)for(const t of PAIR_TIERS) {
    const n=Math.min(pairableAt(next,t),room);
    if(!(n>0))continue;
    room-=n;potions+=n;byTier[t]=n;
    for(const i of next.inputs) {
      if(herbs.has(i.itemId))recipe[i.itemId+t*R]=(recipe[i.itemId+t*R]??0)+n*i.qty;
      else spare[i.itemId+t*R]=left(i.itemId+t*R)-n*i.qty;
      if(t>0)pairs[i.itemId+t*R]=(pairs[i.itemId+t*R]??0)+Math.min(n*i.qty,held(p,i.itemId+t*R));
    }
  }
  let ahead=null;
  if(upcoming&&Number.isFinite(toUnlock)) {
    const paired=pairableAt(upcoming,0),herbsAhead={};
    for(const i of upcoming.inputs)if(herbs.has(i.itemId))herbsAhead[i.itemId]=(paired>0?paired:POTION_FLOOR)*i.qty;
    ahead={recipe:upcoming,potions:paired,herbs:herbsAhead,drops:drops(upcoming).map(i=>i.itemId)};
  }
  for(const r of recipes)for(const i of r.inputs)if(herbs.has(i.itemId))floor[i.itemId]=Math.max(floor[i.itemId]??0,POTION_FLOOR*i.qty);
  return {next,potions,byTier,pairs,toUnlock,recipe,floor,ahead,drops:next?drops(next).map(i=>i.itemId):[]};
}

// The reserve a crop keeps against sale and aims for when farming: herbs by
// herblore needs, food crops by the food reserve unless a better crop replaces them.
export function cropReserve(data,p,job,levels,herblore=herbloreNeeds(data,p,levels)) {
  const itemId=job.output.itemId,item=data.items[itemId];
  if(data.jobs.some(j=>j.skill==='herblore'&&j.inputs.some(i=>i.itemId===itemId)))
    return Math.max((herblore.recipe[itemId]??0)+(herblore.ahead?.herbs[itemId]??0),herblore.floor[itemId]??0);
  if(!item?.heals)return 0;
  const effects=foodEffects(data,itemId);
  const replaced=data.jobs.some(j=>{
    if(!j.grow||j.id===job.id||j.levelReq>levels.farming)return false;
    const other=data.items[j.output.itemId],buff=foodEffects(data,j.output.itemId);
    return other?.heals>=item.heals&&buff.fedTicks>=effects.fedTicks&&buff.rootedTicks>=effects.rootedTicks&&
      (other.heals>item.heals||buff.fedTicks>effects.fedTicks||buff.rootedTicks>effects.rootedTicks);
  });
  if(replaced)return 0;
  return Math.max(500,foodCarry(p)*3);
}

// Crops below target, in priority order: the current plan's shortfall, then
// herbs for the next herblore recipe, then the potion floor and food reserve.
// With nothing short, the planner keeps the fields busy on farming experience.
export function farmingStocks(data,p,levels,goal=null,thresholds=null) {
  const base=id=>baseId(data,id),stock={...p.bank},R=data.rarityScale;
  for(const i of p.pack)stock[i.itemId]=(stock[i.itemId]??0)+i.qty;
  for(const [id,qty]of Object.entries(p.overflow??{}))stock[id]=(stock[id]??0)+qty;
  const herblore=herbloreNeeds(data,p,levels,thresholds);
  return data.jobs.filter(j=>j.grow&&j.levelReq<=levels.farming).map(job=>{
    const itemId=job.output.itemId,future={};
    for(const plot of Object.values(p.plots??{}))if(base(plot.seedItemId)===job.inputs[0].itemId) {
      const id=itemId+rarityOf(data,plot.seedItemId)*data.rarityScale;
      future[id]=(future[id]??0)+3; // Minimum confirmed native yield per field.
    }
    const growing=Object.values(future).reduce((a,b)=>a+b,0);
    const demands=Object.entries(goal?.budget?.items??{}).filter(([id])=>base(+id)===itemId);
    const total=Object.entries(stock).reduce((n,[id,qty])=>n+(autoUsableMaterial(data,+id)&&base(+id)===itemId?qty:0),0);
    // A herb counts only in the quality its drops pair with: compare need and
    // supply (held plus growing) per quality, and sow the rarest one short.
    const herb=data.jobs.some(j=>j.skill==='herblore'&&j.inputs.some(i=>i.itemId===itemId));
    const tierSupply=t=>(stock[itemId+t*R]??0)+(future[itemId+t*R]??0);
    const unmet=PAIR_TIERS.map(t=>({t,need:herblore.recipe[itemId+t*R]??0})).map(u=>({...u,short:Math.max(0,u.need-tierSupply(u.t))}));
    const recipeNeed=unmet.reduce((n,u)=>n+u.need,0),recipeShort=unmet.reduce((n,u)=>n+u.short,0);
    const sowTier=unmet.find(u=>u.short>0)?.t??0;
    const aheadNeed=herblore.ahead?.herbs[itemId]??0;
    const reserve=cropReserve(data,p,job,levels,herblore);
    const target=Math.max(reserve,demands.reduce((n,[,qty])=>n+qty,0));
    const plannedMissing=demands.reduce((n,[id,qty])=>n+Math.max(0,qty-(stock[id]??0)),0);
    const plannedUncovered=demands.reduce((n,[id,qty])=>n+Math.max(0,qty-(stock[id]??0)-(future[id]??0)),0);
    // Reserves and the next unlock are common herbs; food counts every quality.
    const held=herb?stock[itemId]??0:total,supply=herb?tierSupply(0):total+growing;
    const missing=Math.max(plannedUncovered,recipeShort,target-supply);
    // Tiers: plan shortfall, current recipe, the next unlock's herb, reserves.
    const tier=plannedUncovered>0?0:recipeShort>0?1:(herblore.recipe[itemId]??0)+aheadNeed>supply?1.5:missing>0?2:3;
    const floorNeed=herblore.floor[itemId]??0;
    const reason=plannedMissing>0?'plan':recipeShort>0||recipeNeed>0&&!aheadNeed?'herblore':
      aheadNeed>floorNeed&&recipeNeed+aheadNeed>=floorNeed?'ahead':recipeNeed>0?'herblore':'reserve';
    return {job,total,target,plannedMissing,plannedUncovered,missing,tier,reason,sowTier,
      ...(recipeNeed>0?{herblore:{recipeId:herblore.next.id,potions:herblore.potions,toUnlock:herblore.toUnlock,
        unlockLevel:herblore.ahead?.recipe.levelReq??null,drops:herblore.drops,need:recipeNeed,
        tiers:unmet.filter(u=>u.need>0)}}:{}),
      ...(aheadNeed>0?{ahead:{recipeId:herblore.ahead.recipe.id,level:herblore.ahead.recipe.levelReq,
        potions:herblore.ahead.potions,drops:herblore.ahead.drops,need:aheadNeed}}:{}),
      short:Math.max(plannedMissing,recipeShort,target-held)};
  }).filter(row=>row.short>0).sort((a,b)=>a.tier-b.tier||
    b.missing/b.target-a.missing/a.target||b.short/b.target-a.short/a.target);
}
