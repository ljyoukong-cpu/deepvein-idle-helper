import {matchesProfessionWeapon, professionSkill} from './professions.js';
import {reviewInventory} from './inventory.js';
import {packCapacity} from './items.js';
import {marketQuality} from './quality.js';

export const MAIN_TRADES={auto:'自动选择（按收益）',mining:'采矿',fishing:'钓鱼',woodcutting:'伐木',
  thieving:'盗窃',cooking:'烹饪',smithing:'锻造',fletching:'箭术制作',herblore:'炼药',crafting:'制作',combat:'战斗（按所选职业）'};

// Compare renewable production, not a one-time warehouse liquidation. Market
// proceeds are a finite-batch forecast; only marketFilled records actual income.
export function createSpecialization(data,planner) {
  let owner=null,profession=null,selection='auto',selectedJob=null,selectedMonster=null,focus=null,pausedUntil={};
  const seconds=p=>p.lastTick*data.tickMs/1000;
  function select(p,style,requested='auto',jobId=null,monsterId=null) {
    if(owner===p.id&&profession===style&&selection===requested&&selectedJob===jobId&&selectedMonster===monsterId)return;
    owner=p.id;profession=style;selection=requested;selectedJob=jobId;selectedMonster=monsterId;focus=null;pausedUntil={};
  }
  function incomeChoices(p,candidates,style) {
    const choices=[];
    // Market value of an expected (possibly fractional) quantity: the best fresh
    // bid for that quality, else the merchant; net of tax.
    const value=(id,qty)=>qty>0?(planner.marketUnitValue?.(p,id,Math.max(1,Math.round(qty)))??0)*qty:0;
    for(let c of candidates) {
      let proceeds=0,actions=c.actions;const saleItems=[];
      // Quality crafting (held matched sets): its output at its market value,
      // sold on the market when it is rare processed surplus.
      if(c.rarity>0&&c.output) {
        proceeds+=value(c.output.itemId,c.output.qty);
        if(marketQuality(data,c.output.itemId))saleItems.push(c.output.itemId);
      } else if(c.output&&c.output.itemId!==data.coinId) {
        const {itemId,qty}=c.output;
        const minSale=['mining','fishing','woodcutting'].includes(c.skill)&&!data.items[itemId]?.stackable?
          Math.min(qty,packCapacity(p)):1;
        const before=reviewInventory(data,planner,p,c,style).items.find(i=>i.itemId===itemId);
        let saleQty=0,multiplier=1;
        for(;multiplier<=4;multiplier++) {
          const next={...p,bank:{...p.bank,[itemId]:(p.bank[itemId]??0)+qty*multiplier}};
          const after=reviewInventory(data,planner,next,c,style).items.find(i=>i.itemId===itemId);
          saleQty=Math.max(0,(after?.sell??0)-(before?.sell??0));
          if(saleQty>=minSale)break;
        }
        if(saleQty<minSale)saleQty=0;
        if(saleQty&&multiplier>1) {
          const estimate=planner.routeEstimate(p,c.recipeId,50*multiplier,{style,ignoreStock:true,completeTrips:true,buyInputs:true});
          if(!Number.isFinite(estimate.seconds)||estimate.seconds>1800||estimate.unlocks?.length)continue;
          c={...c,estimate,rate:estimate.rate};actions=50*multiplier;
        }
        // Protected potions, seeds, food reserves and gear are not sale income.
        if(saleQty>0) {
          const quote=planner.marketOpportunity?.(p,itemId,saleQty);
          if(quote?.qty===saleQty&&Number.isFinite(quote.net)&&quote.net>0){proceeds=quote.net;saleItems.push(itemId);}
        }
        // Gathered quality output (legendary included) and the bonus drop count
        // at market value; they are kept, not sold.
        if(c.qualityPerAction&&actions>0) {
          c.qualityPerAction.forEach((perAction,i)=>{proceeds+=value(itemId+(i+1)*data.rarityScale,perAction*actions);});
          if(c.bonusPerAction)proceeds+=value(c.bonusPerAction.itemId,c.bonusPerAction.qty*actions);
        }
      }
      // Monster drops: only what current bids absorb after existing stock, net
      // of tax, and never protected items (rare bonus drops, pets, shards kept).
      // Quality drops are not sold, but count at market value like gathered ones.
      if(c.monsterId!=null&&c.drops&&c.kills>0)for(const [id,perKill]of Object.entries(c.drops)) {
        if(Number(id)!==planner.base(Number(id))){proceeds+=value(Number(id),perKill*c.kills);continue;}
        const qty=Math.floor(perKill*c.kills);
        if(qty<1)continue;
        const quote=planner.marketOpportunity?.(p,Number(id),qty);
        if(quote?.qty===qty&&Number.isFinite(quote.net)&&quote.net>0){proceeds+=quote.net;saleItems.push(Number(id));}
      }
      const coins=c.estimate.coins+proceeds;
      if(!(coins>0)||!Number.isFinite(c.estimate.seconds)||c.estimate.seconds<=0)continue;
      // saleItems: what this choice's income assumes is sold; economy sells them even with everyday selling off.
      choices.push({...c,rate:{xp:c.rate.xp,coins:coins/c.estimate.seconds},marketProceeds:proceeds,saleItems});
    }
    choices.sort((a,b)=>b.rate.coins-a.rate.coins||b.rate.xp-a.rate.xp);
    return choices;
  }
  function manualGoal(p,served,deferred,style,requested) {
    const skill=requested==='combat'?professionSkill(style):requested,lv=planner.levels(p),now=seconds(p);
    if(!focus)focus={skill,since:now,progressAt:now,xp:p.skills[skill]};
    if(p.skills[skill]>focus.xp){focus.xp=p.skills[skill];focus.progressAt=now;}
    const excluded=Object.fromEntries(data.skills.filter(s=>s!==skill).map(s=>[s,true]));
    let best,temporary=false,watched=[];
    if(deferred[skill]) {
      const side=Object.fromEntries(data.skills.filter(s=>s!=='thieving').map(s=>[s,true]));
      best=!deferred.thieving&&planner.candidates(p,style,side).filter(c=>c.output?.itemId===data.coinId)
        .sort((a,b)=>b.rate.coins-a.rate.coins)[0];
      temporary=true;
    } else {
      const renewable=planner.candidates(p,style,excluded,{sustainable:true})
        .filter(c=>c.skill===skill&&!c.estimate.unlocks?.length);
      watched=renewable.map(c=>c.output?.itemId).filter(Boolean);
      const preferred=renewable.find(c=>c.recipeId===focus.recipeId)?.output?.itemId;
      planner.watchMarket?.(p,[preferred,...watched].filter(Boolean),preferred);
      const earning=incomeChoices(p,renewable,style).filter(c=>
        c.marketProceeds>0||c.output?.itemId===data.coinId||c.monsterId!=null);
      // A funded production batch is useful now. Future replacement inputs
      // should not make a faster stocked recipe lose to a large low-tier pile.
      const stocked=earning.length?[]:planner.candidates(p,style,excluded,{stockedBatch:true});
      const candidates=(stocked.length?stocked:planner.candidates(p,style,excluded)).filter(c=>c.skill===skill)
        .sort((a,b)=>(b.mainXpRate??b.rate.xp)-(a.mainXpRate??a.rate.xp));
      best=earning[0]??candidates[0];
      const current=candidates.find(c=>c.recipeId!=null&&c.recipeId===focus.recipeId||c.monsterId!=null&&c.monsterId===focus.monsterId);
      if(!earning.length&&current&&(current.mainXpRate??current.rate.xp)>=(best.mainXpRate??best.rate.xp)*.95)best=current;
      // A chosen profession remains valid even before its materials or starter
      // weapon are unlocked. Existing planning resolves that explicit dependency.
      best??=planner.growthChooseGoal(p,served,excluded,style);
    }
    if(!best) {
      focus.reason='指定主业暂时受阻，等待条件恢复；不会自动更换主业';
      planner.watchMarket?.(p,[]);return null;
    }
    const target=Math.min(planner.thresholds.length-1,data.jobs.filter(j=>j.skill===skill&&j.levelReq>lv[skill])
      .map(j=>j.levelReq).sort((a,b)=>a-b)[0]??lv[skill]+5);
    const recipe=data.jobs.find(j=>j.id===best.recipeId);
    const reason=temporary?'指定主业正在等待材料／条件；临时赚取直接金币，条件恢复后返回主业':
      `固定主业 · ${MAIN_TRADES[requested]}：`+(best.marketProceeds?
        '当前配方有买单支持，按完整供料与税后收益比较；报价变化只重选本主业的路线':
        '按供料与往返后的主业经验选路线；无买单也不自动换主业')+
      (recipe?`；当前配方 ${recipe.name}`:'')+
      (!best.marketProceeds&&Number.isFinite(best.mainXpRate)?`，预计本业经验 ${(best.mainXpRate*60).toFixed(0)}/分`:'');
    Object.assign(focus,{target,reason,...(!temporary?{recipeId:best.recipeId,monsterId:best.monsterId,rate:best.rate}:{})});
    planner.watchMarket?.(p,[best.output?.itemId,...watched].filter(Boolean),best.output?.itemId);
    const batch=best.batch??50;
    const budget={coins:best.budget?.coins??0,items:{...best.budget?.items}};
    if(!temporary)for(const input of data.jobs.find(j=>j.id===best.recipeId)?.inputs??[])
      budget.items[input.itemId]=Math.max(budget.items[input.itemId]??0,input.qty*batch);
    return {...best,budget,growth:false,development:false,developmentFiller:false,target:temporary?Math.min(planner.thresholds.length-1,lv[best.skill]+1):target,
      stage:target,specialization:true,manualTrade:requested,mainSkill:skill,temporary,
      startedXp:p.skills[best.skill],startedTick:p.lastTick,
      skipUpgrade:temporary||now-focus.progressAt>=600,batch,reason};
  }
  function fixedGoal(p,deferred,style,requested,job) {
    const skill=job.skill,lv=planner.levels(p),now=seconds(p);
    if(!focus)focus={skill,since:now,progressAt:now,xp:p.skills[skill]};
    if(p.skills[skill]>focus.xp){focus.xp=p.skills[skill];focus.progressAt=now;}
    const reason=`固定工作 · ${MAIN_TRADES[requested]}：${job.name}；准备所需装备与材料后返回此工作，不自动更换配方`;
    Object.assign(focus,{recipeId:job.id,reason});
    planner.watchMarket?.(p,[job.output.itemId],job.output.itemId);
    if(deferred[skill])return null;
    const batch=50,estimate=planner.routeEstimate(p,job,batch,{style,buyInputs:true});
    const target=Math.min(planner.thresholds.length-1,lv[skill]+1);
    const budget={coins:estimate.budget.coins,items:{...estimate.budget.items}};
    for(const input of job.inputs)budget.items[input.itemId]=Math.max(budget.items[input.itemId]??0,input.qty*batch);
    return {skill,recipeId:job.id,fixedRecipeId:job.id,recipes:{...estimate.recipes,[skill]:job.id},
      supplyRecipes:estimate.supplyRecipes,output:{...job.output},estimate,rate:estimate.rate,
      budget,target,stage:target,specialization:true,manualTrade:requested,mainSkill:skill,
      growth:false,startedXp:p.skills[skill],startedTick:p.lastTick,skipUpgrade:now-focus.progressAt>=600,batch,reason};
  }
  function chooseGoal(p,served={},deferred={},style='magic',requested='auto',jobId=null,monsterId=null) {
    if(!Object.hasOwn(MAIN_TRADES,requested))requested='auto';
    const fixed=data.jobs.find(j=>j.id===jobId&&j.skill===requested&&!j.grow);
    const monster=requested==='combat'&&data.monsters.find(m=>m.id===monsterId);
    select(p,style,requested,fixed?.id??null,monster?.id??null);
    if(fixed)return fixedGoal(p,deferred,style,requested,fixed);
    if(monster) {
      const skill=professionSkill(style),target=Math.min(planner.thresholds.length-1,planner.level(p.skills[skill])+1);
      const reason=`固定怪物：${monster.name}；检查安全、武器与食物，准备完成后返回此目标，不自动更换怪物`;
      focus??={skill,since:seconds(p)};Object.assign(focus,{target,monsterId:monster.id,reason});
      planner.watchMarket?.(p,[]);
      if(deferred[skill])return null;
      return {skill,monsterId:monster.id,fixedMonsterId:monster.id,target,stage:target,
        specialization:true,manualTrade:requested,mainSkill:skill,growth:false,horizon:1800,
        budget:{coins:0,items:{}},startedXp:p.skills[skill],startedTick:p.lastTick,reason};
    }
    if(requested!=='auto')return manualGoal(p,served,deferred,style,requested);
    const now=seconds(p),lv=planner.levels(p);
    if(focus&&p.skills[focus.skill]>focus.xp) {
      focus.xp=p.skills[focus.skill];focus.progressAt=now;
    }
    // A material/tool project that never reaches its main work cannot monopolize
    // the account. Finish the current load, then cool this direction for ten minutes.
    if(focus&&now-focus.progressAt>=900) {
      pausedUntil[focus.skill]=now+600;focus=null;
    }
    const excluded={...deferred};
    for(const [skill,until]of Object.entries(pausedUntil))if(until>now)excluded[skill]=true;
    const candidates=planner.candidates(p,style,excluded,{sustainable:true})
      .filter(c=>!c.estimate.unlocks?.length&&(!c.monsterId||
        matchesProfessionWeapon(planner.equipmentStats(p.equipment.weapon),style)));
    // Round-robin the skill groups before the market's bounded watch list, so
    // dozens of equipment recipes cannot hide every gathering opportunity.
    const groups=data.skills.map(skill=>candidates.filter(c=>c.skill===skill&&c.output?.itemId!==data.coinId));
    const ids=[];
    for(let i=0;i<Math.max(0,...groups.map(g=>g.length));i++)for(const group of groups) {
      if(group[i]?.output?.itemId)ids.push(group[i].output.itemId);
      // A monster's common drop is its sellable "output".
      else if(group[i]?.monsterId!=null)ids.push(data.monsters.find(m=>m.id===group[i].monsterId)?.drop);
    }
    const preferred=candidates.find(c=>c.recipeId===focus?.recipeId)?.output?.itemId;
    planner.watchMarket?.(p,[preferred,...ids].filter(Boolean),preferred);
    const choices=incomeChoices(p,candidates,style);
    let best=choices[0];
    const current=choices.find(c=>c.skill===focus?.skill);
    if(current&&(now-focus.since<1800||best.rate.coins<current.rate.coins*1.2))best=current;
    if(!best) {
      focus=null;
      return null;
    }
    if(focus?.skill!==best.skill)focus={skill:best.skill,since:now,progressAt:now,xp:p.skills[best.skill]};
    const nextLevel=data.jobs.filter(j=>j.skill===best.skill&&j.levelReq>lv[best.skill])
      .map(j=>j.levelReq).sort((a,b)=>a-b)[0];
    const target=Math.min(planner.thresholds.length-1,nextLevel??lv[best.skill]+5);
    const reason=`主业持续经营：预计 ${Math.round(best.rate.coins*60)} 金币/分、${Math.round(best.rate.xp*60)} 经验/分；`+
      (best.marketProceeds?'普通盈余按当前买单扣税估算，成交量变化会重评；':'只计直接金币，未售库存不计收入；')+
      '已计重新供料和往返，完成批次后复核';
    Object.assign(focus,{target,rate:best.rate,reason,recipeId:best.recipeId});
    planner.watchMarket?.(p,[best.output?.itemId,...ids].filter(Boolean),best.output?.itemId);
    return {...best,target,stage:target,specialization:true,mainSkill:best.skill,
      startedXp:p.skills[best.skill],startedTick:p.lastTick,
      skipUpgrade:now-focus.progressAt>=600,batch:50,reason};
  }
  function status(p,style='magic',requested='auto',jobId=null,monsterId=null) {
    if(!Object.hasOwn(MAIN_TRADES,requested))requested='auto';
    const fixed=data.jobs.find(j=>j.id===jobId&&j.skill===requested&&!j.grow);
    const monster=requested==='combat'&&data.monsters.find(m=>m.id===monsterId);
    select(p,style,requested,fixed?.id??null,monster?.id??null);
    if(fixed)return {skill:fixed.skill,requested,fixedRecipeId:fixed.id,recipeId:fixed.id,
      reason:focus?.reason??`已固定工作：${fixed.name}，开始后准备此工作所需装备和材料`};
    if(monster)return {skill:professionSkill(style),requested,fixedMonsterId:monster.id,monsterId:monster.id,
      reason:focus?.reason??`已固定怪物：${monster.name}，开始后检查安全、武器与食物`};
    return focus?{skill:focus.skill,target:focus.target,since:focus.since,rate:focus.rate,reason:focus.reason,requested}:
      requested!=='auto'?{skill:requested==='combat'?professionSkill(style):requested,requested,reason:'已指定主业，开始后规划供料和练级'}:null;
  }
  function reset(){owner=null;focus=null;pausedUntil={};}
  function runtime(value) {
    if(value) ({owner,profession,selection,selectedJob,selectedMonster,focus,pausedUntil}=value);
    return {owner,profession,selection,selectedJob,selectedMonster,focus,pausedUntil};
  }
  return {chooseGoal,status,reset,runtime,incomeChoices};
}
