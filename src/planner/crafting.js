import {autoUsableMaterial, craftRecipe} from './quality.js';
import {workEstimate} from './estimates.js';
import {baseId, distance, packCapacity, packQty, packUsed, rarityOf} from './items.js';

// Making an item from bought materials may cost up to this much more than
// buying it outright: the crafting XP is worth something too.
export const MAKE_BIAS=1.15;

export function createCrafting(data,planner) {
  // Seconds (gold as time) to craft `qty` of `id` from bought materials, one
  // recipe level down: held inputs at what they would sell for, missing ones
  // at their market ask, plus the crafting time; the XP counts in full when
  // that skill is the current goal. Infinity when no recipe or input price.
  function fromBought(p,id,qty,goal=null) {
    const tier=rarityOf(data,id),levels=planner.levels(p),rate=planner.coinRate?.(p)??0;
    let best={seconds:Infinity,job:null};
    for(const original of data.jobs.filter(j=>j.output.itemId===baseId(data,id)&&j.inputs.length&&!j.grow&&levels[j.skill]>=j.levelReq)) {
      const job=craftRecipe(data,original,tier);if(!job)continue;
      const n=Math.ceil(qty/job.output.qty);
      let seconds=0;
      for(const input of job.inputs) {
        const need=input.qty*n,held=Math.min(need,Math.max(0,planner.count(p,input.itemId))),short=need-held;
        if(held>0)seconds+=rate>0?held*(planner.marketUnitValue?.(p,input.itemId,held)??0)/rate:0;
        if(short>0)seconds+=short*(planner.marketUnitCost?.(p,input.itemId,short)??Infinity);
      }
      const slot=Object.keys(data.toolSkills).find(s=>data.toolSkills[s]===job.skill);
      const e=workEstimate(data,job,levels[job.skill],{toolBonus:planner.equipmentStats(p.equipment?.[slot])?.bonus??0,
        quick:p.perks?.quick??0,hands:p.perks?.hands??0});
      seconds+=n*e.seconds/Math.max(.01,e.success);
      if(goal?.skill===job.skill&&goal.rate?.xp>0)seconds-=n*e.xp/goal.rate.xp;
      if(seconds<best.seconds)best={seconds,job:original};
    }
    return best;
  }
  // Whether making `id` from bought materials beats buying it at
  // `buySeconds` (its price as time), with the crafting XP weighed in.
  const makeBeatsBuying=(p,id,qty,buySeconds,goal=null)=>fromBought(p,id,qty,goal).seconds<=buySeconds*MAKE_BIAS;
  function estimate(p,id,qty,{reserve={},buy=false,coins=0}={}) {
    const stock={...p.bank},levels=planner.levels(p);
    for(const item of p.pack)stock[item.itemId]=(stock[item.itemId]??0)+item.qty;
    const keep={...reserve};
    if(p.enhance?.itemId)keep[p.enhance.itemId]=Math.max(keep[p.enhance.itemId]??0,1);
    for(const set of p.gearSets??[])for(const item of Object.values(set?.items??{}))
      if(Number.isInteger(item))for(const key of Object.keys(stock))
        if(+key%data.plusScale===item%data.plusScale)keep[key]=Math.max(keep[key]??0,1);
    for(const [key,n]of Object.entries(keep))stock[key]=Math.max(0,(stock[key]??0)-n);
    let money=0;
    function supply(itemId,amount,trail=[]) {
      if(!autoUsableMaterial(data,itemId))return Infinity;
      const used=Math.min(amount,stock[itemId]??0);stock[itemId]=(stock[itemId]??0)-used;
      const missing=amount-used;if(missing<=0)return 0;
      if(trail.includes(itemId)||itemId>=data.plusScale)return Infinity;
      const tier=Math.floor(itemId/data.rarityScale),base=planner.base(itemId);
      const job=data.jobs.find(j=>j.output.itemId===base&&j.inputs.length&&!j.grow&&levels[j.skill]>=j.levelReq);
      const recipe=job&&craftRecipe(data,job,tier);
      if(recipe) {
        const saved={...stock},beforeMoney=money;
        const n=Math.ceil(missing/recipe.output.qty),next=[...trail,itemId];
        let seconds=0;
        for(const input of recipe.inputs)seconds+=supply(input.itemId,n*input.qty,next);
        if(Number.isFinite(seconds)) {
          const slot=Object.keys(data.toolSkills).find(s=>data.toolSkills[s]===job.skill);
          const rate=workEstimate(data,recipe,levels[job.skill],{toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
            quick:p.perks?.quick??0,hands:p.perks?.hands??0});
          stock[itemId]=(stock[itemId]??0)+n*recipe.output.qty-missing;
          const travel=2*Math.min(...data.sites.filter(site=>site.jobIds.includes(job.id))
            .map(site=>distance(p,site)))*data.tickMs/1000;
          return seconds+n*rate.seconds/rate.success+travel;
        }
        for(const key of Object.keys(stock))delete stock[key];Object.assign(stock,saved);money=beforeMoney;
      }
      if(buy) {
        const unit=itemId===id?Infinity:planner.marketUnitCost?.(p,itemId,missing)??Infinity;
        if(Number.isFinite(unit)){money+=unit*missing*planner.coinRate(p);return unit*missing;}
        // Ordinary missing fuel can be gathered; never grind random rare drops.
        if(tier===0)return planner.routeEstimate({...p,bank:stock,pack:[]},{itemId},missing).seconds;
      }
      return Infinity;
    }
    const seconds=supply(id,qty);
    return {seconds:money>(planner.marketAllowance?.(p,{budget:{coins}})??0)?Infinity:seconds,money,xp:0};
  }
  // For display: walk the same quality chain against current stock and report
  // the materials still missing at its ends (e.g. uncommon cobalt ore), and the
  // crafting levels it needs. Ordinary fuel is left to `estimate`'s gathering.
  function shortfall(p,id,qty) {
    const stock={...p.bank},levels=planner.levels(p),missing={},requirements=[];
    for(const item of p.pack)stock[item.itemId]=(stock[item.itemId]??0)+item.qty;
    (function walk(itemId,amount,trail) {
      const used=Math.min(amount,stock[itemId]??0);stock[itemId]=(stock[itemId]??0)-used;
      const left=amount-used;if(left<=0)return;
      const tier=Math.floor(itemId%data.plusScale/data.rarityScale),job=data.jobs.find(j=>j.output.itemId===planner.base(itemId)&&j.inputs.length&&!j.grow);
      const recipe=job&&!trail.includes(itemId)&&craftRecipe(data,job,tier);
      if(!recipe||itemId>=data.plusScale){if(tier>0)missing[itemId]=(missing[itemId]??0)+left;return;}
      if(levels[job.skill]<job.levelReq&&!requirements.some(r=>r.skill===job.skill&&r.target>=job.levelReq))
        requirements.push({skill:job.skill,target:job.levelReq});
      const n=Math.ceil(left/recipe.output.qty);
      for(const input of recipe.inputs)walk(input.itemId,n*input.qty,[...trail,itemId]);
    })(id,qty,[]);
    return {missing,requirements};
  }
  // Crafts of `job` at quality `tier` that owned quality materials support, up
  // to `max` (a batch looks at 50; a whole stage looks further).
  function available(p,job,tier,reserve={},max=50) {
    const recipe=craftRecipe(data,job,tier);if(!recipe)return 0;
    // Output already owned must not count as raw material for another batch.
    const before={...p,bank:{...p.bank,[recipe.output.itemId]:0},pack:p.pack.filter(i=>i.itemId!==recipe.output.itemId)};
    if(!Number.isFinite(estimate(before,recipe.output.itemId,recipe.output.qty,{reserve}).seconds))return 0;
    let lo=0,hi=max;
    while(lo<hi) {const n=Math.ceil((lo+hi)/2);
      if(Number.isFinite(estimate(before,recipe.output.itemId,n*recipe.output.qty,{reserve}).seconds))lo=n;else hi=n-1;
    }
    return lo;
  }
  function ingredients(id,seen=new Set()) {
    if(seen.has(id))return [];seen.add(id);
    const original=data.jobs.find(j=>j.output.itemId===planner.base(id)&&j.inputs.length&&!j.grow);
    const job=original&&craftRecipe(data,original,rarityOf(data,id));
    return job?[...new Set(job.inputs.flatMap(i=>[i.itemId,...ingredients(i.itemId,seen)]))]:[];
  }
  return {estimate,shortfall,available,ingredients,fromBought,makeBeatsBuying};
}

export function bankedGatheringLoad(data,before,p) {
  const route=p.route,old=before?.route;
  if(!before||before.id!==p.id||p.lastTick<=before.lastTick||!route||!old||route.errand||old.errand||
    route.jobId!==old.jobId||route.siteId!==old.siteId||route.zoneId!==old.zoneId)return false;
  const job=data.jobs.find(j=>j.id===route.jobId);
  if(!job||job.inputs.length||!['mining','fishing','woodcutting'].includes(job.skill)||
    data.items[job.output.itemId]?.stackable)return false;
  const gained=id=>(p.bank[id]??0)-(before.bank[id]??0)-
    Math.max(0,(before.overflow?.[id]??0)-(p.overflow?.[id]??0));
  if(before.pack.some(item=>{
    if(baseId(data,item.itemId)!==job.output.itemId)return false;
    const moved=packQty(before,item.itemId)-packQty(p,item.itemId);
    return moved>0&&gained(item.itemId)>=moved;
  }))return true;
  // A snapshot can arrive after banking and refilling the next partial pack.
  // Its size need not decrease; gathering XP plus new shelved output still
  // identifies the completed trip. Overflow moving back to shelves does not.
  return (p.skills?.[job.skill]??0)>(before.skills?.[job.skill]??0)&&
    Object.keys(p.bank).some(id=>baseId(data,+id)===job.output.itemId&&gained(id)>0);
}

export function finishTaskReason(data,p) {
  const route=p.route,original=data.jobs.find(j=>j.id===route?.jobId);
  const job=original&&(original.inputs.length&&!original.grow?craftRecipe(data,original,p.workRarity??route?.rarity??0):original);
  // The game's fallback activity is only an idle filler: it is replaced at
  // once, not finished like the helper's own trips. Besides its flag, it is
  // recognised as the saved fallback task running without a limit (every
  // route the helper starts has a numeric limit; 0 means unlimited).
  const filler=route?.fallback||route?.limit==null&&p.fallback?.task?.jobId===route?.jobId;
  if (!job||job.grow||route.errand||filler||!route.phase||route.phase==='toBank'||route.limit===0) return null;
  const base=id=>baseId(data,id);
  const free=packCapacity(p)-packUsed(data,p);
  const output=data.items[base(job.output.itemId)];
  if (['mining','fishing','woodcutting'].includes(job.skill)&&!job.inputs.length&&!output?.stackable) {
    return free>=job.output.qty?'继续当前采集，背包满或本批完成后再切换任务':null;
  }
  if (!['smithing','cooking','fletching','herblore','crafting'].includes(job.skill)||
    route.limit!==null&&!(route.limit>0)) return null;
  if(route.limit===null&&output?.stackable&&job.inputs.every(i=>data.items[base(i.itemId)]?.stackable))return null;
  let freed=0;
  for (const input of job.inputs) {
    const count=p.pack.filter(i=>i.itemId===input.itemId).reduce((n,i)=>n+i.qty,0);
    if (count<input.qty) return null;
    freed+=data.items[base(input.itemId)]?.stackable?Number(count===input.qty):input.qty;
  }
  const extra=output?.stackable?Number(!p.pack.some(i=>i.itemId===job.output.itemId)):job.output.qty;
  return free+freed>=extra?'完成背包中已备材料的当前批次，再切换任务':null;
}
