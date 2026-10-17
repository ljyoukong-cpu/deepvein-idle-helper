import {gearRequirementOf, matchesProfessionWeapon, professionSkill, statsDominate} from './professions.js';
import {autoUsableMaterial} from './quality.js';
import {ENHANCEMENT_BASELINE, enhanceQuote} from './inventory.js';
import {itemLabel, plusOf} from './items.js';

// Count before sending so a refresh or an unconfirmed command cannot reset the
// attempt allowance. Failed/ambiguous work waits for the next equipment-use stage.
export function createEnhancementTraining(data,planner,{read=()=>null,write=()=>{}}={}) {
  const state=read()??{records:{}};
  state.records??={};
  function sync() {
    // Another tab may have finished an attempt since this tracker was created.
    // Keep newer local records too if a storage write was unavailable.
    for(const [id,row]of Object.entries(read()?.records??{})) {
      const current=state.records[id];
      if(!current||row.stage>current.stage||row.stage===current.stage&&
        (row.attempts>current.attempts||row.attempts===current.attempts&&
          (row.failed&&!current.failed||current.pending&&!row.pending)))state.records[id]=row;
    }
  }
  const key=(p,itemId,slot)=>`${p.id}:${slot}:${itemId%data.plusScale}`;
  const stage=(p,itemId,slot)=>{
    const gear=planner.equipmentStats(itemId);
    const skill=data.toolSkills[slot]||(gear?.needs&&gear.needs!=='none'?gear.needs:gear?.style||'defence');
    return Math.floor((planner.levels(p)[skill]??1)/5);
  };
  function blocked(p,itemId,slot) {
    sync();
    const row=state.records[key(p,itemId,slot)];
    if(!row||row.stage!==stage(p,itemId,slot))return null;
    return row.pending?'上一强化结果尚未确认，本阶段不重复发送':
      row.failed?'本装备本阶段已有失败，先练其它技能':
      row.attempts>=ENHANCEMENT_BASELINE?'本装备本阶段已尝试五次，先练其它技能':null;
  }
  function issued(p,intent) {
    if(intent.t!=='enhance'||!intent.worn)return;
    sync();
    const id=key(p,intent.itemId,intent.worn),current=stage(p,intent.itemId,intent.worn);
    let row=state.records[id];
    if(!row||row.stage!==current)row=state.records[id]={playerId:p.id,stage:current,attempts:0};
    row.attempts++;
    row.pending={itemId:intent.itemId,slot:intent.worn,xp:p.skills.enhancing};
    write(state);
  }
  function observe(p) {
    sync();
    if(p.enhance)return;
    let changed=false;
    for(const row of Object.values(state.records)) {
      const pending=row.pending;
      if(row.playerId!==p.id||!pending||p.skills.enhancing<=pending.xp)continue;
      row.failed=p.equipment[pending.slot]!==pending.itemId+data.plusScale;
      delete row.pending;changed=true;
    }
    if(changed)write(state);
  }
  return {blocked,issued,observe};
}

// Enhancing levels do not unlock recipes; each level adds 0.2% to the success
// multiplier (see enhanceQuote). Train by improving equipment that will be
// used, never by manufacturing spare XP sinks.
export function planEnhancement(data,planner,p,style='magic',goal=null) {
  if(p.enhance)return {intent:null,label:'等待本次强化结果',reason:'已有强化进行中，确认结果后再规划'};
  const lv=planner.levels(p),combatSkill=professionSkill(style);
  const relevant=g=>g&&g.slot!=='hoe'&&(data.toolSkills[g.slot]||
    g.slot!=='mount'&&(!g.style||g.style===combatSkill)&&
    (g.slot!=='weapon'||matchesProfessionWeapon(g,style))&&
    (g.slot!=='shield'||style!=='melee_twohand'));
  const recipe=id=>data.jobs.find(j=>j.output.itemId===planner.base(id));
  // Wearable now or at the very next level.
  const nearlyWearable=id=>{const r=gearRequirementOf(data,id);return r.skill==='none'||r.level<=(lv[r.skill]??0)+1;};
  const better=statsDominate;
  const owned=[...Object.keys(p.bank).filter(id=>p.bank[id]>0).map(Number),...p.pack.map(i=>i.itemId)];
  const options=[];
  let deferredReason='暂无值得强化的在用装备：先换阶段装备，或等待有实际属性收益的升级；不制造备用装备刷强化等级';
  for(const [slot,itemId]of Object.entries(p.equipment)) {
    const gear=planner.equipmentStats(itemId);
    if(goal?.specialization&&(goal.mainSkill===combatSkill?!!data.toolSkills[slot]:
      data.toolSkills[slot]!==goal.mainSkill))continue;
    if(!relevant(gear)||!autoUsableMaterial(data,itemId)||plusOf(data,itemId)>=ENHANCEMENT_BASELINE||goal?.upgrade?.slot===slot)continue;
    if(goal?.enhancement&&goal.enhancement.itemId!==itemId)continue;
    const quote=enhanceQuote(data,planner,p,itemId),after=planner.equipmentStats(itemId+data.plusScale);
    const target=planner.equipmentStats(itemId%data.plusScale+ENHANCEMENT_BASELINE*data.plusScale);
    // Rounded attributes can stay unchanged for one step on the way to +5.
    // Only cross that step when the baseline improves this same worn item.
    if(!better(after,gear)&&!(planner.enhancementTraining&&better(target,gear)))continue;
    const stopped=planner.enhancementTraining?.blocked(p,itemId,slot);
    if(stopped){deferredReason=stopped;continue;}
    const prior=goal?.enhancement;
    const otherCoins=Math.max(0,(goal?.budget?.coins??0)-(prior?.itemId===itemId?prior.gold??prior.quote?.gold??0:0));
    const otherShards=Math.max(0,(goal?.budget?.items?.[data.shardId]??0)-
      (prior?.itemId===itemId?prior.shards??prior.quote?.shards??0:0));
    // Gold as time (investment.js): enhance only when reaching the best stopping
    // point pays back within the piece's use, and no other way to improve this
    // slot (a rarer copy, another piece) pays back better.
    const rows=planner.investmentOptions?.(p,style,goal)??null;
    const row=rows?.find(r=>r.slot===slot&&r.kind==='enhance'&&r.current===itemId);
    if(rows) {
      if(!row?.worth) {
        deferredReason=row?`${row.label} 不回本：预计 ${row.gold.toLocaleString()} 金币（含失败重来，约 ${(row.paid/3600).toFixed(1)} 小时赚取），`+
          `使用期内只省约 ${(row.saved/3600).toFixed(1)} 小时`:deferredReason;
        continue;
      }
      if(!row.cheapest) {
        const best=rows.find(r=>r.slot===slot&&r.cheapest);
        deferredReason=`${best?.label??'其他升级'} 比强化更省`;continue;
      }
      if(plusOf(data,itemId)>=row.toPlus)continue;
    } else if(quote.fromPlus>0&&!planner.enhancementTraining)continue;
    // Spend only coins and shards no other plan has reserved; a worthwhile step
    // that cannot be paid yet is funded by a capped stretch on the best gold job.
    if(quote.gold>p.coins-otherCoins||quote.shards>planner.count(p,data.shardId)-otherShards) {
      deferredReason=`${row?.label??'强化'} 值得做，金币或碎片还不够：等待筹资，保留换装和补给预算`;continue;
    }
    // Equip an attainable tier upgrade first. Do not pay to enhance a piece
    // being replaced now or at the immediately upcoming level milestone.
    const replacement=[...data.gear.map(g=>g.itemId),...owned].some(id=>{
      const g=planner.equipmentStats(id),job=recipe(id);
      if(!relevant(g)||g.slot!==slot||!better(g,gear))return false;
      return nearlyWearable(id)&&(owned.includes(id)||job&&job.levelReq<=(lv[job.skill]??1)+1);
    });
    if(replacement)continue;
    const currentJob=data.jobs.find(j=>j.id===p.route?.jobId);
    const priority=slot==='weapon'?0:data.toolSkills[slot]===currentJob?.skill?1:data.toolSkills[slot]?2:3;
    options.push({itemId,slot,quote,priority,otherCoins,otherShards});
  }
  options.sort((a,b)=>a.priority-b.priority||a.quote.gold-b.quote.gold||a.itemId-b.itemId);
  const chosen=options[0];
  if(!chosen)return {intent:null,blocked:true,label:'强化暂缓',
    reason:deferredReason};
  const {itemId,slot,quote,otherCoins,otherShards}=chosen;
  const budget={coins:otherCoins+quote.gold,items:{...goal?.budget?.items,[data.shardId]:otherShards+quote.shards}};
  const enhancement={itemId,slot,toPlus:quote.toPlus,quote,gold:quote.gold,shards:quote.shards};
  const label=`强化在用装备 · ${itemLabel(data,itemId%data.plusScale)} +${quote.toPlus}`;
  const reason=`本次成功率 ${(quote.chance*100).toFixed(0)}%；消耗 ${quote.gold} 金币、${quote.shards} 碎片，获得 ${quote.xp} 强化经验；`+
    (quote.chance<1?'失败会回到 +0；':'')+
    '保留其它计划预算，在用装备目标 +5；逐级确认，同装备每阶段最多五次，失败后该阶段停止';
  const result={intent:null,label,reason,enhancement,budget};
  if(p.coins<budget.coins)return {...result,needs:{itemId:data.coinId,quantity:budget.coins},reason:`准备强化金币：需要 ${budget.coins}，当前 ${p.coins}；${reason}`};
  if(planner.count(p,data.shardId)<budget.items[data.shardId])return {...result,
    needs:{itemId:data.shardId,quantity:budget.items[data.shardId]},reason:`准备强化碎片：需要 ${budget.items[data.shardId]}，当前 ${planner.count(p,data.shardId)}；${reason}`};
  return {...result,intent:{t:'enhance',itemId,toPlus:quote.toPlus,once:true,worn:slot}};
}
