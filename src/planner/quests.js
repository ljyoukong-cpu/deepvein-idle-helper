import {professionSkill} from './professions.js';
import {PAIR_TIERS} from './quality.js';
import {workEstimate} from './estimates.js';
import {dayTicks as dayTicksOf} from './items.js';

export function createQuests(data,planner) {
  const dayTicks=dayTicksOf(data);
  const title=q=>q.kind==='kill'?data.monsters.find(m=>m.id===q.monsterId)?.name:
    data.jobs.find(j=>j.id===q.jobId)?.name;
  function read(p) {
    if(!p?.quests||!Number.isFinite(p.lastTick)||p.lastTick<0)return [];
    const day=Math.floor(p.lastTick/dayTicks),rows=[];
    for(const [period,field,current,length]of [['daily','day',day,dayTicks],['weekly','week',Math.floor(day/7),7*dayTicks]]) {
      const stamp=p.quests[field];
      if(stamp!==current||!Array.isArray(p.quests[period]))continue;
      for(const q of p.quests[period]) {
        if(!q||typeof q.id!=='string'||!q.id||!['gather','craft','kill'].includes(q.kind)||
          !Number.isInteger(q.goal)||q.goal<=0||!Number.isInteger(q.done)||q.done<0||
          typeof q.claimed!=='boolean'||!data.skills.includes(q.reward?.skill)||
          !Number.isFinite(q.reward?.xp)||q.reward.xp<0||!Number.isFinite(q.reward?.coins)||q.reward.coins<0)continue;
        rows.push({...q,period,stamp,key:`${period}:${stamp}:${q.id}`,
          remaining:Math.max(0,q.goal-q.done),expiresAtTick:(stamp+1)*length});
      }
    }
    return rows;
  }
  function claim(p,style='magic') {
    const gear=planner.equipmentStats(p.equipment.weapon);
    const activeSkill=gear?.magic?'magic':gear?.ranged?'ranged':'melee';
    const q=read(p).find(q=>!q.claimed&&!q.remaining&&(q.kind!=='kill'||activeSkill===professionSkill(style)));
    if(!q)return null;
    const skill=q.kind==='kill'?activeSkill:q.reward.skill;
    return {intent:{t:'claimQuest',id:q.id},label:`领取${q.period==='daily'?'每日':'每周'}任务 · ${title(q)??q.id}`,
      reason:`领取 ${q.reward.coins} 金币与 ${q.reward.xp} ${skill} 经验；不打断当前任务`};
  }
  // Can this quest be finished before it resets? `estimate` is set when the
  // route itself was costed; `reason` explains a refusal.
  function feasibility(p,q,style,levels=planner.levels(p)) {
    const job=q.kind==='kill'?null:data.jobs.find(j=>j.id===q.jobId);
    const skill=q.kind==='kill'?professionSkill(style):job?.skill;
    if(!skill||!planner.trainedSkills(style).includes(skill))return {reason:'当前职业不训练该技能'};
    if(q.kind!=='kill'&&!job)return {reason:'任务配方尚未核对'};
    if(job&&(job.grow||job.levelReq>levels[skill]))return {reason:'配方等级不足'};
    if(q.kind==='kill'&&!data.monsters.some(m=>m.id===q.monsterId))return {reason:'任务怪物尚未核对'};
    // Progress counts successful produced events, including rare results,
    // once per action. Existing output stock cannot substitute for the work.
    const success=job?workEstimate(data,job,levels[skill],{hands:p.perks?.hands??0}).success:1;
    if(!(success>0))return {reason:'当前等级无法成功完成'};
    // Price the whole input chain, so a cheap market input can beat a long
    // unlock (e.g. buying wood for a rod quest without the Woodcutting level).
    if(job)planner.watchPurchases?.(p,planner.crafting?.ingredients(job.output.itemId)??job.inputs.map(i=>i.itemId));
    // Held matched quality sets count too (progress takes any quality); only
    // the rest needs the common supply chain.
    const crafts=Math.ceil(q.remaining/success);
    const held=job&&job.inputs.length&&!job.grow?Math.min(crafts,PAIR_TIERS.filter(t=>t>0)
      .reduce((n,t)=>n+(planner.crafting?.available?.(p,job,t,{},crafts)??0),0)):0;
    const work=job?workEstimate(data,job,levels[skill],{hands:p.perks?.hands??0}):null;
    const rest=crafts-held;
    const estimate=rest>0?planner.routeEstimate(p,job??{monsterId:q.monsterId},rest,{style,buyInputs:true}):
      {seconds:0,xp:0,coins:0,budget:{coins:0,items:{}},recipes:{[skill]:job.id},supplyRecipes:{},purchases:{}};
    if(held>0)estimate.seconds+=held*work.seconds/Math.max(.01,work.success),estimate.xp+=held*work.xp;
    const seconds=estimate.seconds,left=(q.expiresAtTick-p.lastTick)*data.tickMs/1000;
    const base={job,skill,estimate,seconds,left};
    if(!Number.isFinite(seconds)||seconds<=0)return {...base,reason:q.kind==='kill'?'没有可安全击杀的路线':'没有可行的供料路线'};
    if(seconds>left)return {...base,reason:'刷新前无法完成'};
    return {...base,ok:true};
  }
  // One free reroll per day, for an unstarted daily that cannot be done.
  // Mandatory dailies are otherwise always attempted, however slow.
  function reroll(p,style='magic') {
    const day=Math.floor(p.lastTick/dayTicks);
    if(!p?.quests||p.quests.day!==day||p.quests.rerolled===day)return null;
    for(const q of read(p).filter(q=>q.period==='daily'&&!q.claimed&&q.done===0)) {
      const check=feasibility(p,q,style);
      if(check.ok)continue;
      return {intent:{t:'rerollQuest',id:q.id},label:`重抽每日任务 · ${title(q)??q.id}`,
        reason:`${check.reason}；使用今天唯一一次免费重抽，其余每日任务照常完成`};
    }
    return null;
  }
  function chooseGoal(p,baseline,style='magic',deferred={}) {
    const levels=planner.levels(p),choices=[];
    for(const q of read(p)) {
      if(q.claimed||!q.remaining||deferred[q.key])continue;
      const check=feasibility(p,q,style,levels);
      if(!check.ok)continue;
      const {job,skill,estimate,seconds,left}=check;
      const daily=q.period==='daily';
      // Dailies and weeklies are mandatory: any length is fine if it finishes
      // before the reset. The horizon also bounds market purchases, so give it
      // room to buy every input the estimate already found cheaper than self-supply.
      const horizon=Math.min(left,Math.max(1800,seconds*2));
      const rate={xp:(estimate.xp+q.reward.xp)/seconds,coins:(estimate.coins+q.reward.coins)/seconds};
      const quest={key:q.key,id:q.id,period:q.period,stamp:q.stamp,kind:q.kind,
        ...(job?{jobId:job.id}:{monsterId:q.monsterId})};
      choices.push({skill,...(job?{recipeId:job.id}:{monsterId:q.monsterId}),batch:q.remaining,
        target:levels[skill]+1,stage:baseline?.stage,growth:true,quest,rate,budget:estimate.budget,
        ...(baseline?.specialization?{specialization:true,mainSkill:baseline.mainSkill,manualTrade:baseline.manualTrade}:{}),
        recipes:{...estimate.recipes,...(job?{[skill]:job.id}:{})},supplyRecipes:estimate.supplyRecipes,
        horizon,estimate,mandatory:true,urgent:left<=seconds+(baseline?.horizon??1800),
        reason:`${daily?'必做每日':'必做每周'}任务 · ${title(q)}：剩 ${q.remaining} 次，`+
          `预计 ${Math.ceil(seconds/60)} 分钟${Object.keys(estimate.purchases??{}).length?'（含市场补料）':''}；`+
          `含奖励 ${Math.round(rate.xp*60)} 经验/分、${Math.round(rate.coins*60)} 金币/分`});
    }
    // Dailies first, then weeklies; within each the most urgent, then the quickest.
    choices.sort((a,b)=>Number(b.quest.period==='daily')-Number(a.quest.period==='daily')||
      Number(b.urgent)-Number(a.urgent)||a.estimate.seconds-b.estimate.seconds||a.quest.key.localeCompare(b.quest.key));
    return choices[0]??null;
  }
  function completed(p,goal) {
    if(!goal?.quest)return false;
    const q=read(p).find(q=>q.key===goal.quest.key);
    return !q||q.claimed||q.remaining===0;
  }
  // For the plan panel: every open quest with its estimate or refusal reason.
  function overview(p,style='magic') {
    return read(p).filter(q=>!q.claimed).map(q=>{
      const base={key:q.key,period:q.period,title:title(q)??q.id,done:q.done,goal:q.goal,remaining:q.remaining};
      if(!q.remaining)return {...base,status:'可领取'};
      const check=feasibility(p,q,style);
      return check.ok?{...base,status:'可完成',seconds:check.seconds,buys:Object.keys(check.estimate?.purchases??{}).length}:
        {...base,status:check.reason};
    });
  }
  return {read,claim,chooseGoal,completed,reroll,overview};
}
