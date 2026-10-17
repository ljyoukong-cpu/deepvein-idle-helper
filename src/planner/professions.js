import {baseId} from './items.js';

export const PROFESSIONS={magic:'法师',melee:'单手战士',melee_twohand:'双手战士',ranged:'短弓游侠',ranged_long:'长弓游侠'};

export const professionSkill=profession=>profession==='melee_twohand'?'melee':profession==='ranged_long'?'ranged':profession;
export const starterWeapon=profession=>({magic:152,melee:110,melee_twohand:390,ranged:140,ranged_long:146})[profession];

export function matchesProfessionWeapon(gear,profession) {
  if (!gear||gear.slot!=='weapon'||gear.needs!==professionSkill(profession)) return false;
  if (gear.needs==='melee') return !!gear.twoHanded===(profession==='melee_twohand');
  if (gear.needs==='ranged') return gear.speed===(profession==='ranged_long'?5:3);
  return true;
}


// The skill and level needed to wear a piece: its own requirement, else the
// tool's gathering skill, at its listed level or its recipe's level.
const gearIndex=new WeakMap();
export function gearRequirementOf(data,id) {
  if(!gearIndex.has(data))gearIndex.set(data,new Map(data.gear.map(g=>[g.itemId,g])));
  const base=baseId(data,id),g=gearIndex.get(data).get(base);
  if(!g)return null;
  return {skill:g.needs??data.toolSkills[g.slot]??'none',
    level:g.levelReq??data.jobs.find(j=>j.output.itemId===base)?.levelReq??1};
}
export const canWear=(data,levels,id)=>{
  const r=gearRequirementOf(data,id);
  return !!r&&(r.skill==='none'||(levels[r.skill]??0)>=r.level);
};

// `a` is at least as good as `b` in every stat (lower speed is better) and
// strictly better in one. Callers decide which pieces are comparable.
const STAT_KEYS=['bonus','accuracy','strength','defence','luck'];
export const statsDominate=(a,b)=>STAT_KEYS.every(k=>(a[k]??0)>=(b[k]??0))&&(a.speed??0)<=(b.speed??0)&&
  (STAT_KEYS.some(k=>(a[k]??0)>(b[k]??0))||(a.speed??0)<(b.speed??0));

