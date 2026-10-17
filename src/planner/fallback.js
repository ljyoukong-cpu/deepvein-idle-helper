import {inventoryBudget} from './inventory.js';
import {distance} from './items.js';

// The game's own fallback activity (client 0.0.1167, `setFallback`): a task the
// character starts by itself when its plan ends ("done" or out of materials),
// never after a manual stop, a skip or a death. It covers the time the helper
// is not driving: a closed or throttled tab, offline hours, a paused helper.
export const FALLBACK_SKILLS=['mining','fishing','woodcutting'];
export const fallbackKey=task=>task&&typeof task==='object'?
  `${task.kind}:${task.siteId??''}:${task.jobId??task.zoneId??''}:${task.rarity??0}`:'';

// Ownership: the helper only replaces a fallback it set itself. Any other one
// is the player's; one the player cleared after the helper set it stays clear.
export function fallbackOwnership(p,owned) {
  const mine=owned?.[p.id]??null,current=fallbackKey(p.fallback?.task);
  if(!current)return mine?'cleared':'none';
  return current===mine?'helper':'player';
}

export function chooseFallback(data,planner,p,goal=null,style='magic') {
  const levels=planner.levels(p);
  const jobs=data.jobs.filter(j=>FALLBACK_SKILLS.includes(j.skill)&&!j.inputs.length&&!j.grow&&
    levels[j.skill]>=j.levelReq&&data.sites.some(s=>s.jobIds.includes(j.id)));
  if(!jobs.length)return null;
  const rate=job=>{
    try {return planner.routeEstimate(p,job.id,50,{style,ignoreStock:true,completeTrips:true}).rate??{};}
    catch {return {};}
  };
  const xp=new Map(jobs.map(job=>[job,rate(job).xp??0]));
  // Feeding the plan: the gathered material still missing from the plan's
  // budget (its recipes' inputs, followed down to raw materials), weighted by
  // how long it takes to gather. The largest gap in time wins.
  const demand=inventoryBudget(data,planner,p,goal).items;
  const gap=job=>{
    const id=job.output.itemId,short=Math.max(0,(demand[id]??0)-planner.count(p,id));
    const e=planner.estimateWork?.(p,job);
    return short>0?short*(e?.seconds>0&&e.commonOutput>0?e.seconds/e.commonOutput:1):0;
  };
  const feeding=jobs.map(job=>({job,gap:gap(job)})).filter(row=>row.gap>0).sort((a,b)=>b.gap-a.gap)[0];
  const job=feeding?.job??[...jobs].sort((a,b)=>xp.get(b)-xp.get(a)||b.levelReq-a.levelReq)[0];
  if(!feeding&&!(xp.get(job)>0))return null;
  // The site nearest a bank: the fallback banks every load.
  const bankDistance=s=>Math.min(...data.banks.map(b=>distance(s,b)));
  const site=data.sites.filter(s=>s.jobIds.includes(job.id)).sort((a,b)=>bankDistance(a)-bankDistance(b)||a.id-b.id)[0];
  const missing=feeding?Math.max(0,(demand[job.output.itemId]??0)-planner.count(p,job.output.itemId)):0;
  return {job,task:{kind:'job',siteId:site.id,jobId:job.id,onFull:'bank',rarity:0},xpH:Math.round(xp.get(job)*3600),
    reason:feeding?`供应当前计划：还缺 ${missing} 份`:`可做采集中经验最高（约 ${Math.round(xp.get(job)*3600)} 经验/时）`};
}
