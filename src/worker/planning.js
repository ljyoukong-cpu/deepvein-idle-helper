import {createEnhancementTraining} from '../planner/enhancement.js';
import {createPlanner} from '../planner/planner.js';
import {createEconomy} from '../economy/economy.js';
import {createMarket} from '../economy/market.js';
import {normalizeHotFollow} from '../runtime/hot-follow.js';
import {Trainer} from '../runtime/trainer.js';
import {engineApi, engineRates, engineReady, engineStatus, loadEngine, mergeRates} from '../engine/runtime.js';
import {chooseMastery} from '../engine/mastery.js';
import {planView} from '../planner/plan-view.js';
import {PLANNING_STORAGE_KEYS, enhancementStorage, wirePlanner} from '../economy/wiring.js';

// Only the decision phase is transferable. The page owns the socket, receipts,
// transaction journal, Boss lifecycle and every actual command submission.
export const decisionFields=['goal','served','deferred','questDeferred','waitingGoals','blockedReasons','sequence',
  'goalSince','bankedLoad','message','plan','history','farmJobId','progress','stallCheck','failures','failureKey','itemTarget','buffRefill',
  'hotFollow','hotParkedGoal','hotFollowValidation','fallbackCheckedAt','pausedError','consumableLogAt','potionBrew'];
// fallbackOwned is read-only here: only a confirmed snapshot on the page changes it.
export const inputFields=[...decisionFields,'player','active','style','mode','mainTrade','mainJobId','mainMonsterId','softRefused','fallbackOwned',
  'snapshotSequence','syncAfter','nextSync','lastSync'];
export const planningState=trainer=>Object.fromEntries(inputFields.map(key=>[key,trainer[key]]));

// The status message is display only: the page may annotate it (e.g. a skipped
// Boss) while a calculation runs, and that must not discard the result.
// The Boss countdown ticks every second; decisions only ask whether a Boss
// rises within five minutes (trainer bossSoon), so only that is compared.
export function planningGuard(trainer,planner,market,settings) {
  const boss=trainer.boss.status();
  return JSON.stringify([{...planningState(trainer),message:undefined},trainer.pending,trainer.recovery,trainer.awaitInitial,
    {...boss,nextIn:undefined,soon:(boss.nextIn??Infinity)<=300},planner.farmingPreference(),planner.housingRuntime?.(),planner.masteryRuntime?.(),market.runtime(),settings],(key,value)=>
    // A heartbeat alone does not invalidate an otherwise identical decision.
    key==='lastTick'||key==='snapshotTick'||key==='snapshotSequence'||key==='syncAfter'||key==='nextSync'||key==='lastSync'?undefined:
      value instanceof Map?[...value]:value);
}

const GUARD_PARTS=['调度状态','待确认操作','重连恢复','初始同步','世界 Boss','农业偏好','房屋','补精通','市场','设置'];
// Names what changed between two guards, so a discarded result can say why.
export function guardChange(before,after) {
  if(before===after)return null;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const differs=(a,b)=>Object.keys({...a,...b}).find(key=>!same(a?.[key],b?.[key]));
  try {
    const a=JSON.parse(before),b=JSON.parse(after),i=a.findIndex((part,k)=>!same(part,b[k]));
    if(i!==0)return GUARD_PARTS[i]??'未知';
    const key=differs(a[0],b[0]),inner=key==='player'&&differs(a[0].player,b[0].player);
    return `${GUARD_PARTS[0]} · ${key}${inner?`.${inner}`:''}`;
  } catch {return '未知';}
}

export function runPlanning(data,input,inspectOnly=false) {
  const planner=createPlanner(data),writes={};
  const storage={getItem:key=>input.storage[key]??null,setItem:(key,value)=>{
    if(input.storageUnavailable)throw new Error('网站存储不可用');
    input.storage[key]=value;writes[key]=value;
  }};
  planner.runtime(input.planner);
  planner.profitFloor=input.settings.profitFloor??0;
  planner.autoSeedQuality=input.settings.autoSeedQuality!==false;
  planner.automation=input.settings.automation;
  planner.setHousingEnabled(input.settings.autoHousing!==false);
  // The game's own engine (when loaded) calibrates every candidate; real
  // measurements of the current route still take precedence.
  if(input.engine)loadEngine(input.engine);
  const simulated=engineReady()&&input.trainer?.player?engineRates(data,planner,input.trainer.player,{budgetMs:500}):{};
  planner.setMeasurements(mergeRates(simulated,input.rates));
  planner.perkUsage=input.rates; // measured time per route: what this account actually does
  // Mastery points can only be counted and valued by the engine.
  if(engineApi())planner.masteryPurchase=(p,goal)=>chooseMastery(engineApi(),p,
    goal&&{...goal,inputs:data.jobs.find(j=>j.id===goal.recipeId)?.inputs??[]},
    {metric:goal?.specialization&&goal.rate?.coins>0?'coins':'xp',data,usage:input.rates});
  planner.enhancementTraining=createEnhancementTraining(data,planner,enhancementStorage(storage));
  const economy=createEconomy(data,planner,input.settings),market=createMarket(data,planner,{...input.settings,storage,now:()=>input.now});
  economy.runtime(input.economy);market.runtime(input.market);
  wirePlanner(planner,market,()=>economy,()=>!!input.settings.potionRestock);
  const commands=[],trainer=new Trainer(data,planner,intent=>commands.push(intent),()=>input.now);
  Object.assign(trainer,input.trainer);
  trainer.hotFollow=normalizeHotFollow(input.settings.hotFollow??trainer.hotFollow);
  trainer.hotParkedGoal=input.trainer.hotParkedGoal??null;
  trainer.autoFallback=input.settings.autoFallback!==false;
  trainer.inWorker=true;
  trainer.market=market;
  trainer.boss={status:()=>input.boss,cancel:()=>{}};
  let proposal=null;
  trainer.issue=plan=>{proposal=trainer.prepareIssue(plan);trainer.plan=proposal;};
  if(!inspectOnly)trainer.advance(input.deferBoss);
  const p=trainer.player;
  const view={
    review:input.details.inventory?economy.review(p,trainer.goal,trainer.style):null,
    equipment:input.details.equipment?planner.equipmentStatus(p,trainer.style):null,
    growth:trainer.mode==='balanced'?planner.growthStatus(p,trainer.style,trainer.deferred):null,
    business:trainer.mode==='business'?planner.specializationStatus(p,trainer.style,trainer.mainTrade,trainer.mainJobId,trainer.mainMonsterId):null,
    farming:planner.farmStatus(p,trainer.goal),
    plan:input.details.plan?planView(data,planner,trainer,p,{boss:input.boss,engineApi:engineApi()}):null
  };
  return {decision:Object.fromEntries(decisionFields.map(key=>[key,trainer[key]])),active:trainer.active,proposal,commands,
    sync:{syncAfter:trainer.syncAfter,nextSync:trainer.nextSync,lastSync:trainer.lastSync},
    planner:planner.runtime(),economy:economy.runtime(),market:market.runtime(),writes,view,
    engine:{...engineStatus(),simulated:Object.keys(simulated).length}};
}

export function applyPlanning(trainer,planner,economy,market,result,storage) {
  if(!result.active)trainer.pause(result.decision.message);
  for(const [key,value]of Object.entries(result.writes)) {
    if(!PLANNING_STORAGE_KEYS.includes(key))throw new Error('未知规划存储项');
    storage.setItem(key,value);
  }
  planner.runtime(result.planner);economy.runtime(result.economy);market.runtime(result.market);
  for(const key of decisionFields)trainer[key]=result.decision[key];
  // An error pause in the Worker: the page starts the gathering backup.
  if(!result.active&&trainer.pausedError&&!trainer.pausedError.backup)trainer.startBackup();
  // The Worker can request a fresh snapshot, never open a game connection.
  for(const intent of result.commands) {
    if(intent.t!=='resync')throw new Error('未知后台查询');
    trainer.send(intent);trainer.syncAfter=trainer.snapshotSequence;
    trainer.nextSync=result.sync.nextSync;trainer.lastSync=result.sync.lastSync;
  }
  if(result.proposal&&trainer.active)trainer.issue(result.proposal,true);
}

// One outstanding calculation, with a page-side watchdog. Terminating a wedged
// Worker leaves the game's native route untouched and never replays a command.
export function createPlanningClient(makeWorker,{timeout=8000,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  let worker=null,pending=null,sequence=0;
  function close(error=new Error('后台规划已取消')) {
    worker?.terminate();worker=null;
    if(pending){clearTimer(pending.timer);const {reject}=pending;pending=null;reject(error);}
  }
  function request(kind,input) {
    if(pending)return Promise.reject(new Error('后台规划仍在进行'));
    return new Promise((resolve,reject)=>{
      const id=++sequence;
      try {
        if(!worker) {
          worker=makeWorker();
          worker.onmessage=({data})=>{
            if(data.id!==pending?.id)return;
            clearTimer(pending.timer);const task=pending;pending=null;
            if(data.error)task.reject(new Error(data.error));else task.resolve(data.result);
          };
          worker.onerror=()=>close(new Error('后台规划线程异常'));
          worker.onmessageerror=()=>close(new Error('后台规划结果无法读取'));
        }
        pending={id,resolve,reject,timer:setTimer(()=>close(new Error('后台计算超过 8 秒，已终止本次计算')),timeout)};
        worker.postMessage({id,kind,input});
      }catch(error){close(error);reject(error);}
    });
  }
  return {request,close,get busy(){return !!pending;}};
}
