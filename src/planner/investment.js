import {ENHANCEMENT_BASELINE, enhanceQuote} from './inventory.js';
import {combatEstimate, workEstimate} from './estimates.js';
import {canWear, gearRequirementOf, matchesProfessionWeapon, professionSkill} from './professions.js';
import {autoUsableMaterial, craftRecipe} from './quality.js';
import {baseId, itemLabel, merchantPrice, plusOf, rarityOf} from './items.js';

// Gold as time. Every spend (enhancing, gear, house points) is converted to the
// seconds the best gold job needs to earn it, and every improvement to the
// seconds it saves over the time it will actually be used. Spend only when the
// time saved beats the time paid by a margin.
export const PAYBACK_MARGIN=1.2;
// A funding stretch on the best gold job lasts at most this long.
export const FUNDING_CAP_SECONDS=3600;
// An item is valued for at most a week of use (until outgrown, if sooner).
export const USE_CAP_SECONDS=7*86400;
const FUNDING_RETRY_SECONDS=6*3600,CACHE_SECONDS=60;

// Seconds saved over `useSeconds` of play when progress per second rises
// from `before` to `after`: the same progress then takes before/after as long.
export const secondsSaved=(before,after,useSeconds)=>
  before>0&&after>before&&useSeconds>0?useSeconds*(1-before/after):0;

export function payback({gold=0,seconds=0,credit=0,coinRate,before,after,useSeconds}) {
  const paid=Math.max(0,seconds-credit)+(gold>0?(coinRate>0?gold/coinRate:Infinity):0);
  const saved=secondsSaved(before,after,useSeconds);
  return {paid,saved,net:saved-paid,worth:Number.isFinite(paid)&&saved>0&&saved>=paid*PAYBACK_MARGIN};
}

// Expected gold and shards to take an item from its current +N to `toPlus`.
// A failed attempt resets it to +0, so step k costs (g + (1-s)·E_k)/s, where
// E_k is the expected cost of rebuilding +k from +0 (client 1.0.1189 odds).
export function expectedEnhancement(data,planner,p,itemId,toPlus) {
  const base=itemId%data.plusScale,from=plusOf(data,itemId);
  let gold=0,shards=0,fromGold=0,fromShards=0;
  for(let k=0;k<toPlus;k++) {
    const quote=enhanceQuote(data,planner,p,base+k*data.plusScale),s=quote.chance;
    if(!(s>0))return {gold:Infinity,shards:Infinity};
    gold+=(quote.gold+(1-s)*gold)/s;shards+=(quote.shards+(1-s)*shards)/s;
    if(k+1===from){fromGold=gold;fromShards=shards;}
  }
  return {gold:gold-fromGold,shards:shards-fromShards};
}

const COMBAT_SLOTS=['weapon','helmet','body','legs','shield','ring','amulet'];

export function createInvestments(data,planner) {
  let cache=null,fundingDeferred={};
  const lvOf=p=>planner.levels(p);
  function combatStats(p,equipment,style) {
    const skill=professionSkill(style),lv=lvOf(p);
    const gear=Object.entries(equipment).filter(([slot,id])=>Number.isFinite(id)&&(slot!=='shield'||style!=='melee_twohand'))
      .map(([,id])=>planner.equipmentStats(id)).filter(Boolean);
    const weapon=planner.equipmentStats(equipment.weapon);
    const sum=k=>gear.reduce((n,g)=>n+(k==='defence'||!g.style||g.style===skill?1:-1)*(g[k]??0),0);
    return {style:skill,level:lv[skill],accuracy:sum('accuracy'),strength:sum('strength'),defence:sum('defence'),
      defenceLevel:lv.defence,speed:weapon?.speed??5,twoHanded:weapon?.twoHanded,luck:planner.equipmentStats(equipment.amulet)?.luck??0};
  }
  // What each slot is used for: the monster being fought, or the job its tool serves.
  function contexts(p,style,goal) {
    const skill=professionSkill(style),lv=lvOf(p);
    const monster=data.monsters.find(m=>m.id===(goal?.monsterId??data.zones.find(z=>z.id===p.route?.zoneId)?.monsterId))??
      (planner.combatOptions?.(p,style)??[]).map(c=>c.monster).sort((a,b)=>{
        const rate=m=>{const e=combatEstimate(data,m,combatStats(p,p.equipment,style));return e.mainXp/e.seconds;};
        return rate(b)-rate(a);
      })[0]??null;
    const jobFor=toolSkill=>data.jobs.find(j=>j.id===(goal?.recipes?.[toolSkill]??(goal?.skill===toolSkill?goal.recipeId:null)))??
      data.jobs.find(j=>j.id===p.route?.jobId&&j.skill===toolSkill)??
      data.jobs.filter(j=>j.skill===toolSkill&&!j.grow&&lv[toolSkill]>=j.levelReq&&data.sites.some(s=>s.jobIds.includes(j.id)))
        .sort((a,b)=>{const r=j=>{const e=workEstimate(data,j,lv[toolSkill]);return e.xp/e.seconds;};return r(b)-r(a);})[0]??null;
    return {skill,monster,jobFor};
  }
  // XP per second with `slot` holding `id`, by the game formulas on both sides
  // of a swap (a measurement only exists for the current equipment).
  function rate(p,style,ctx,slot,id) {
    const equipment={...p.equipment,[slot]:id},toolSkill=data.toolSkills[slot];
    if(toolSkill) {
      const job=ctx.jobFor(toolSkill);if(!job)return 0;
      const e=workEstimate(data,job,lvOf(p)[toolSkill],{toolBonus:planner.equipmentStats(id)?.bonus??0,
        quick:p.perks?.quick??0,hands:p.perks?.hands??0,
        luck:(data.toolLuck[rarityOf(data,id)]??0)+(planner.equipmentStats(equipment.amulet)?.luck??0)});
      return e.xp/e.seconds;
    }
    if(!ctx.monster)return 0;
    if(slot==='weapon'&&planner.equipmentStats(id)?.twoHanded)equipment.shield=null;
    const e=combatEstimate(data,ctx.monster,combatStats(p,equipment,style));
    return e.mainXp/e.seconds;
  }
  // Seconds until the piece is outgrown: XP to the next wear tier in its line
  // at its own rate, within [30 min, a week].
  function useSeconds(p,id,slot,skillRate) {
    const r=gearRequirementOf(data,id),g=planner.equipmentStats(id);
    if(!r||r.skill==='none'||!(skillRate>0))return USE_CAP_SECONDS;
    const next=data.gear.filter(o=>o.slot===slot&&(o.style??null)===(g?.style??null)&&o.needs===g?.needs)
      .map(o=>gearRequirementOf(data,o.itemId)).filter(o=>o.skill===r.skill&&o.level>r.level).map(o=>o.level).sort((a,b)=>a-b)[0];
    if(next==null)return USE_CAP_SECONDS;
    const xp=Math.max(0,(planner.thresholds[Math.min(next,planner.thresholds.length-1)]??0)-(p.skills[r.skill]??0));
    return Math.min(USE_CAP_SECONDS,Math.max(1800,xp/skillRate));
  }
  // Cheapest way to get an item: owned, made (time and bought inputs) or bought.
  function acquire(p,id,coinRate) {
    if(planner.count(p,id)>0)return {gold:0,seconds:0,source:'已持有'};
    const options=[];
    const job=data.jobs.find(j=>j.output.itemId===baseId(data,id)&&j.inputs.length&&!j.grow);
    if(job&&rarityOf(data,id)>0&&craftRecipe(data,job,rarityOf(data,id))) {
      const made=planner.crafting.estimate(p,id,1,{buy:true});
      if(Number.isFinite(made.seconds))options.push({gold:made.money??0,seconds:made.seconds,source:'自制'});
    } else if(job) {
      const made=planner.routeEstimate(p,job,1,{});
      if(Number.isFinite(made.seconds))options.push({gold:made.budget?.coins??0,seconds:made.seconds,source:'自制'});
    }
    const ask=planner.marketAsk?.(p,id);
    if(ask>0)options.push({gold:ask,seconds:0,source:'市场'});
    const cost=o=>o.seconds+(coinRate>0?o.gold/coinRate:Infinity);
    return options.sort((a,b)=>cost(a)-cost(b))[0]??null;
  }
  function slotsFor(p,style) {
    const twoHanded=style==='melee_twohand'||planner.equipmentStats(p.equipment.weapon)?.twoHanded;
    return [...COMBAT_SLOTS.filter(s=>s!=='shield'||!twoHanded),
      ...Object.keys(data.toolSkills).filter(s=>s!=='hoe'&&planner.trainedSkills(style).includes(data.toolSkills[s]))];
  }
  // Every worthwhile way to improve each worn piece, on the same terms.
  function compute(p,style,goal) {
    const ctx=contexts(p,style,goal),coinRate=planner.coinRate?.(p)??0,lv=lvOf(p),rows=[];
    const shardValue=planner.marketUnitValue?.(p,data.shardId,1)??merchantPrice(data,data.shardId);
    for(const slot of slotsFor(p,style)) {
      const current=p.equipment[slot],worn=planner.equipmentStats(current);
      if(!worn||slot==='mount')continue;
      const fits=id=>{const g=planner.equipmentStats(id);return !!g&&g.slot===slot&&(data.toolSkills[slot]||
        (!g.style||g.style===ctx.skill)&&(slot!=='weapon'||matchesProfessionWeapon(g,style)));};
      if(!fits(current))continue;
      const before=rate(p,style,ctx,slot,current);
      if(!(before>0))continue;
      const add=(kind,id,label,cost,extra={})=>{
        if(!cost)return;
        const after=rate(p,style,ctx,slot,id);
        if(!(after>before))return;
        const use=useSeconds(p,id,slot,after),result=payback({gold:cost.gold,seconds:cost.seconds,coinRate,before,after,useSeconds:use});
        rows.push({slot,kind,id,label,current,source:cost.source??null,gold:Math.round(cost.gold),seconds:cost.seconds,
          gain:after/before-1,useSeconds:use,...result,...extra});
      };
      // Enhance the worn piece: the best stopping point up to +5.
      if(autoUsableMaterial(data,current)&&plusOf(data,current)<ENHANCEMENT_BASELINE) {
        let best=null;
        for(let to=plusOf(data,current)+1;to<=ENHANCEMENT_BASELINE;to++) {
          const cost=expectedEnhancement(data,planner,p,current,to),target=current%data.plusScale+to*data.plusScale;
          const after=rate(p,style,ctx,slot,target);
          if(!(after>before)||!Number.isFinite(cost.gold))continue;
          const gold=cost.gold+cost.shards*shardValue,use=useSeconds(p,target,slot,after);
          const result=payback({gold,coinRate,before,after,useSeconds:use});
          if(!best||result.net>best.net)best={slot,kind:'enhance',id:target,current,toPlus:to,source:null,
            label:`强化 ${itemLabel(data,current)} → +${to}`,gold:Math.round(gold),coins:Math.round(cost.gold),shards:Math.ceil(cost.shards),
            seconds:0,gain:after/before-1,useSeconds:use,...result};
        }
        if(best)rows.push(best);
      }
      // A higher quality of the same piece.
      for(let r=rarityOf(data,current)+1;r<=3;r++) {
        const id=baseId(data,current)+r*data.rarityScale;
        if(!(rate(p,style,ctx,slot,id)>before))continue;
        add('quality',id,`换 ${itemLabel(data,id)}`,acquire(p,id,coinRate));break;
      }
      // Another piece wearable now, in its lowest quality that beats the worn one.
      const others=data.gear.filter(g=>g.itemId!==baseId(data,current)&&fits(g.itemId)&&canWear(data,lv,g.itemId))
        .map(g=>[0,1,2,3].map(r=>g.itemId+r*data.rarityScale).find(id=>rate(p,style,ctx,slot,id)>before))
        .filter(id=>id!=null).sort((a,b)=>rate(p,style,ctx,slot,b)-rate(p,style,ctx,slot,a)).slice(0,2);
      for(const id of others)add('tier',id,`换 ${itemLabel(data,id)}`,acquire(p,id,coinRate));
    }
    for(const row of rows)row.cheapest=row.worth&&!rows.some(o=>o!==row&&o.slot===row.slot&&o.worth&&o.net>row.net);
    return rows.sort((a,b)=>b.net-a.net);
  }
  function options(p,style,goal=null) {
    const key=JSON.stringify([p.id,style,p.equipment,lvOf(p),goal?.skill??null,goal?.recipeId??null,goal?.monsterId??null,p.route?.jobId??null,p.route?.zoneId??null]);
    if(cache?.key!==key||!(p.lastTick-cache.tick<CACHE_SECONDS*1000/data.tickMs)||p.lastTick<cache.tick)
      cache={key,tick:p.lastTick,rows:compute(p,style,goal)};
    return cache.rows.map(row=>({...row,affordable:row.gold<=p.coins}));
  }
  const fundingKey=row=>`${row.kind}:${row.id}`;
  // A worthwhile improvement that is not yet affordable: earn the gold first on
  // the best gold job, for at most an hour, then return to levelling. A stretch
  // that ends short leaves that improvement alone for six hours.
  function fundingGoal(p,style,deferred={},goal=null) {
    const row=options(p,style,goal).find(r=>r.cheapest&&!r.affordable&&r.gold>0&&
      !(fundingDeferred[fundingKey(r)]>p.lastTick));
    if(!row)return null;
    const choice=(planner.incomeChoices?.(p,planner.candidates(p,style,deferred),style)??[])[0];
    if(!choice)return null;
    const ticks=Math.ceil(FUNDING_CAP_SECONDS*1000/data.tickMs);
    return {...choice,target:planner.thresholds.length,funding:{key:fundingKey(row),gold:row.gold,label:row.label,until:p.lastTick+ticks},
      budget:{...choice.budget,coins:Math.max(choice.budget?.coins??0,row.gold)},horizon:FUNDING_CAP_SECONDS,
      reason:`筹资：${row.label} 约 ${row.gold.toLocaleString()} 金币（含失败重来），按 ${Math.round(row.useSeconds/3600)} 小时使用期可省约 `+
        `${(row.saved/3600).toFixed(1)} 小时，赚这笔钱约 ${(row.paid/3600).toFixed(1)} 小时；先做金币最高的工作，最多 1 小时，再回到练级`};
  }
  function fundingEnded(p,goal) {
    if(goal?.funding&&p.coins<goal.funding.gold)
      fundingDeferred[goal.funding.key]=p.lastTick+Math.ceil(FUNDING_RETRY_SECONDS*1000/data.tickMs);
  }
  function runtime(value) {
    if(value){cache=value.cache??null;fundingDeferred=value.fundingDeferred??{};}
    return {cache,fundingDeferred};
  }
  return {options,fundingGoal,fundingEnded,runtime};
}
