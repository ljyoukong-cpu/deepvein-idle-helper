// Item quality (common, uncommon, rare, epic, legendary): every rule about it
// lives here, so recipes, pairing, reserves, prices and sales agree.
import {COAL_ID, RARITY_NAMES, baseId, qualityIds, qualityPrefix, rarityOf} from './items.js';

export {RARITY_NAMES, qualityIds, qualityPrefix, rarityOf};

export const LEGENDARY=4;
// Qualities a plan may combine, rarest first: rarer sets give more XP and are
// worth more. Legendary stays with the player.
export const PAIR_TIERS=[3,2,1,0];

// Legendary stock is player-controlled and is never used automatically.
export function autoUsableMaterial(data,itemId) {
  return Math.floor((itemId%data.plusScale)/data.rarityScale)<data.rarityMultipliers.length-1;
}

// The qualities of one item the helper may use (legendary excluded).
export const usableQualities=(data,id)=>qualityIds(data,id).filter(q=>autoUsableMaterial(data,q));

// A recipe at one quality (client Jt): every quality-bearing input and the
// output take that quality; coal and wild herbs stay plain.
export const qualityMaterials=new WeakMap();
export function craftRecipe(data,job,tier=0) {
  if(!tier)return job;
  if(!Number.isInteger(tier)||tier<1||tier>4||!job?.inputs.length||job.grow||job.output.itemId===data.coinId)return null;
  if(!qualityMaterials.has(data))qualityMaterials.set(data,new Set([
    ...data.jobs.map(j=>j.output.itemId),...data.monsters.map(m=>m.drop),100,328,
    ...data.jobs.filter(j=>j.grow).map(j=>j.inputs[0].itemId)]));
  const materials=qualityMaterials.get(data),offset=tier*data.rarityScale;
  return {...job,rarity:tier,xp:Math.round(job.xp*data.rarityXp[tier]),
    inputs:job.inputs.map(i=>i.itemId!==COAL_ID&&!(i.itemId>=201&&i.itemId<=207)&&materials.has(i.itemId)?
      {...i,itemId:i.itemId+offset}:i),output:{...job.output,itemId:job.output.itemId+offset}};
}

// Complete input sets of a recipe that `count` (item id -> quantity) covers.
// Quality never mixes inside one set, so each quality is counted on its own.
export const setsAt=(recipe,count)=>recipe?.inputs.length?
  Math.min(...recipe.inputs.map(i=>Math.floor(Math.max(0,count(i.itemId))/i.qty))):0;
// Sets of `job` per usable quality, rarest first: [{tier, recipe, sets}].
export function setsByTier(data,job,count) {
  return PAIR_TIERS.map(tier=>({tier,recipe:craftRecipe(data,job,tier)}))
    .filter(r=>r.recipe).map(r=>({...r,sets:setsAt(r.recipe,count)}));
}

// Is this item made by a recipe (processed), rather than gathered, grown or dropped?
export const processed=(data,id)=>data.jobs.some(j=>j.output.itemId===baseId(data,id)&&j.inputs.length&&!j.grow);

// Rare surplus that may be sold: only processed items (bars, planks, cut gems,
// quest output), never raw materials; not potions (valued by their effect),
// food or gear (their own rules), and never legendary or enhanced pieces.
// Sold on the market only, at recent same-quality trades.
export function marketQuality(data,id) {
  const tier=rarityOf(data,id),base=baseId(data,id);
  return tier>0&&tier<LEGENDARY&&id%data.plusScale===id&&processed(data,id)&&!data.items[base]?.heals&&
    !data.gear.some(g=>g.itemId===base)&&!data.jobs.some(j=>j.skill==='herblore'&&j.output.itemId===base);
}

// Rare potions: every quality lasts an hour at its own strength (x1.3, x1.6,
// ...). A rare bottle whose market bid is at least twice what the same effect
// costs at the cheapest quality is worth more sold: drink the cheap one.
export const POTION_SALE_RATIO=2;
export const isPotion=(data,id)=>data.jobs.some(j=>j.skill==='herblore'&&j.output.itemId===baseId(data,id));
export const marketPotion=(data,id)=>{const tier=rarityOf(data,id);return tier>0&&tier<LEGENDARY&&id%data.plusScale===id&&isPotion(data,id);};
export function potionSaleWorth(data,planner,p,id) {
  if(!marketPotion(data,id))return false;
  const power=t=>data.rarityMultipliers[t];
  const perEffect=Math.min(...usableQualities(data,id).map(q=>(planner.marketAsk?.(p,q)||Infinity)/power(rarityOf(data,q))));
  const bid=planner.marketUnitValue?.(p,id,1)??0;
  return Number.isFinite(perEffect)&&bid>=POTION_SALE_RATIO*perEffect*power(rarityOf(data,id));
}

// Reserve lists (item id -> quantity) combine by keeping the larger amount.
export function mergeHold(...lists) {
  const out={};
  for(const list of lists)for(const [id,qty]of Object.entries(list??{}))out[id]=Math.max(out[id]??0,qty);
  return out;
}

// The one list of rare materials nothing may dispose of (house fuel, sales):
// planned gear's quality chain, and rare herbs with their matched drops for
// the brews they pair into. Crafting goals keep only the gear part, so a
// herblore brew or quest may use the pairs it was kept for.
// It depends only on the quality stock, worn gear and levels, so copies of the
// player with more ordinary output (income estimates) share one computation.
const holds=new Map();
export function qualityHold(data,planner,p,profession,{gearOnly=false}={}) {
  if(!p||typeof p!=='object'||!p.bank)return {};
  const quality=[...Object.entries(p.bank),...(p.pack??[]).map(i=>[i.itemId,i.qty])]
    .filter(([id,qty])=>qty>0&&rarityOf(data,+id)>0).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const key=JSON.stringify([p.id,profession,gearOnly,quality,p.equipment,p.skills]);
  if(!holds.has(key)) {
    const gear=planner.plannedGearReserve?.(p,profession)??{};
    if(holds.size>=32)holds.delete(holds.keys().next().value);
    holds.set(key,gearOnly?gear:mergeHold(gear,planner.herbloreNeeds?.(p)?.pairs));
  }
  return holds.get(key);
}

// Making `job` at quality `tier` instead of common must pay: what its quality
// inputs would sell for over the common ones, against what the quality output
// is worth over the common one plus the extra XP (as time at the gold rate).
// E.g. a rare rough gem fits accessories of every level and sells high: it is
// not spent on a low ring worth little. Unknown prices count as nothing.
export function qualityWorth(data,planner,p,job,tier) {
  const recipe=craftRecipe(data,job,tier);
  if(!tier||!recipe)return {ok:!!recipe||!tier,extraIn:0,extraOut:0,xp:0};
  const value=(id,qty)=>qty*(planner.marketUnitValue?.(p,id,Math.max(1,qty))??0);
  const extraIn=recipe.inputs.reduce((n,i,k)=>n+value(i.itemId,i.qty)-value(job.inputs[k].itemId,job.inputs[k].qty),0);
  const extraOut=value(recipe.output.itemId,recipe.output.qty)-value(job.output.itemId,job.output.qty);
  const e=planner.estimateWork?.(p,job),rate=planner.coinRate?.(p)??0;
  const xp=e?.xp>0&&rate>0?(recipe.xp-job.xp)*e.seconds/e.xp*rate:0;
  return {ok:extraIn<=extraOut+xp,extraIn,extraOut,xp};
}
