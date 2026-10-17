import {PROFESSIONS, professionSkill} from '../planner/professions.js';
import {autoUsableMaterial} from '../planner/quality.js';
import {bankedGatheringLoad, finishTaskReason} from '../planner/crafting.js';
import {POTIONS, POTION_TICKS, foodEffects} from '../planner/supplies.js';
import {inventoryBudget, reserveWaitingGoals} from '../planner/inventory.js';
import {MAIN_TRADES} from '../planner/specialization.js';
import {HOUSE_ACTIONS, atHome, resumeIntent} from '../planner/housing.js';
import {NAMES} from '../planner/planner.js';
import {Telemetry} from './telemetry.js';
import {hotSkillAt, hotWindows, normalizeHotFollow} from './hot-follow.js';
import {createWorldBoss} from './world-boss.js';
import {fallbackKey, fallbackOwnership} from '../planner/fallback.js';
import {distance, nearestBank, stockQty} from '../planner/items.js';

// State-dependent refusals in the reviewed client sr() message table. Unknown
// codes remain a stop, not an invitation to replay a command.
export const STATE_REFUSALS=new Set(['not-at-bank','bank-full','storage-full','pack-full',
  'nothing-to-sell','nothing-to-deposit','nothing-to-withdraw','nothing-to-eat','cannot-afford',
  'cannot-enhance','cannot-fight','cannot-set-route','cannot-wield','cannot-equip','level-too-low']);
export const MARKET_ACTIONS=new Set(['marketBuy','marketSell','marketCancel']);
export const MARKET_REFUSALS=new Set([...STATE_REFUSALS,'not-tradable','too-many-orders','price-changed','below-floor','no-such-order','market-price-step']);
// The helper sends no guild commands. These reviewed codes belong to the
// game's guild UI, which shares our connection. Revisit if guild automation is added.
export const GUILD_REFUSALS=new Set(['guild-name','guild-tag','guild-name-taken','guild-tag-taken',
  'guild-already-in','guild-not-in','guild-no-such-player','guild-full','guild-rank','guild-not-invited',
  'guild-leader-cannot-leave','guild-self','guild-not-material','guild-not-tradable','guild-bank-full','guild-short','guild-room-full']);
export function isGuildRefusal(code) {return GUILD_REFUSALS.has(code);}
// Optional quest-board actions. Their refusal codes are not reviewed, so a
// refusal disables the action for a while instead of pausing the helper.
// Growth modes and their labels (the UI uses the same names).
export const MODE_LABELS={balanced:'自主发展',experience:'经验优先',business:'主业经营',mastery:'补精通',assist:'只收菜＋蹭世界 Boss'};
export const SOFT_ACTIONS=new Set(['rerollQuest','buyPerk','masteryConfirm','setFallback','plantPref','plotChoice']);
export const ROUTE_STOPS=new Set(['noMaterials','storageFull','unreachable','levelTooLow','noSuchSite']);
// Bank, overflow and pack (shared definition in planner/items.js).
export const quantity=stockQty;
export const equipmentProject=goal=>goal?.upgrade?.priority||goal?.toolUpgrade?.upgrade?.priority;

export function depositReachedBank(before,p,intent) {
  if(!['deposit','depositItem'].includes(intent.t)||before.id!==p.id)return false;
  const carried=(state,id)=>state.pack.filter(i=>i.itemId===id).reduce((sum,i)=>sum+i.qty,0);
  const shelf=(state,id)=>(state.bank[id]??0)+(state.overflow?.[id]??0);
  const requested=intent.t==='depositItem'?[[intent.itemId,intent.qty]]:
    [...new Set(before.pack.map(i=>i.itemId))].map(id=>[id,carried(before,id)]);
  return requested.length>0&&requested.every(([id,qty])=>qty>0&&
    carried(before,id)-carried(p,id)>=qty&&shelf(p,id)-shelf(before,id)>=qty);
}

export function validPlayer(p, skills) {
  return p && skills.every(s=>Number.isFinite(p.skills?.[s])&&p.skills[s]>=0) &&
    Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.coins)&&Number.isFinite(p.hp)&&
    p.bank && typeof p.bank==='object' && Array.isArray(p.pack) && p.equipment &&
    p.pack.every(i=>Number.isInteger(i.itemId)&&Number.isFinite(i.qty)) &&
    (p.route===null || (p.route&&typeof p.route==='object'));
}

export function acknowledged(before, p, intent, data=null) {
  switch (intent.t) {
    case 'portal': return atHome(data,before)!==atHome(data,p)&&atHome(data,p)===(intent.dir==='in');
    case 'buildRoom': return p.houseBuild?.cell===intent.cell||
      !before.houseCells?.includes(intent.cell)&&p.houseCells?.includes(intent.cell)===true;
    case 'placeFurniture': return p.houseFurniture?.[intent.room]?.cell===intent.cell&&
      p.houseFurniture[intent.room].slot===intent.slot;
    case 'upgradeRoom': return (p.house?.[intent.room]??0)>(before.house?.[intent.room]??0)||
      Number.isFinite(p.houseUpgrades?.[intent.room])&&p.houseUpgrades[intent.room]>p.lastTick&&
      p.houseUpgrades[intent.room]!==before.houseUpgrades?.[intent.room];
    case 'convertHouse': return (before.bank[intent.itemId]??0)-(p.bank[intent.itemId]??0)>=intent.qty&&
      Object.entries(p.housePoints??{}).some(([family,n])=>n>(before.housePoints?.[family]??0));
    case 'setRoute': return (p.route?.jobId===intent.jobId &&
      (intent.errand?p.route.errand===true:p.route?.siteId===intent.siteId&&
        (p.workRarity??p.route?.rarity??0)===(intent.rarity??0))) ||
      (intent.errand && (JSON.stringify(p.plots??{})!==JSON.stringify(before.plots??{}) || p.skills.farming>before.skills.farming)) ||
      (p.lastStop?.jobId===intent.jobId&&p.lastStop.reason==='done'&&p.lastStop.tick>before.lastTick);
    case 'fight': return p.route?.zoneId===intent.zoneId ||
      (p.lastStop?.jobId===null&&p.lastStop.reason==='done'&&p.lastStop.tick>before.lastTick&&
        ['melee','ranged','magic'].some(s=>p.skills[s]>before.skills[s]));
    case 'walk': return distance(p,intent)<=1;
    case 'wear': case 'equipFromBank': return Object.values(p.equipment).includes(intent.itemId);
    case 'deposit': return p.pack.length<before.pack.length || p.pack.length===0;
    case 'dropItem': {
      // Gathering continues while the receipt travels back. New output may
      // partially refill the pack, but cannot itself reduce total inventory.
      const removed=quantity(before,intent.itemId)-quantity(p,intent.itemId);
      return removed>0&&removed<=intent.qty&&
        (p.bank[intent.itemId]??0)===(before.bank[intent.itemId]??0)&&
        (p.overflow?.[intent.itemId]??0)===(before.overflow?.[intent.itemId]??0);
    }
    case 'withdraw': return p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)>=intent.qty &&
      quantity(before,intent.itemId)===quantity(p,intent.itemId);
    case 'depositItem': return before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)>=intent.qty &&
      (p.bank[intent.itemId]??0)+(p.overflow?.[intent.itemId]??0)>
      (before.bank[intent.itemId]??0)+(before.overflow?.[intent.itemId]??0);
    case 'eatAt': return p.eatAt===intent.at;
    case 'chooseFood': return (p.foodItemId??0)===intent.itemId;
    case 'foodMaxTier': return p.foodMaxTier===intent.tier;
    case 'carryFood': return p.foodPerTrip===intent.count;
    case 'drink': {
      const scale=data?.rarityScale??1000;
      const kind=intent.itemId<scale*5?POTIONS.find(v=>v.itemId===intent.itemId%scale)?.kind:null,qty=intent.qty??1;
      return !!kind&&Number.isInteger(qty)&&qty>0&&quantity(before,intent.itemId)-quantity(p,intent.itemId)>=qty&&
        (p.brews?.[kind]??0)>p.lastTick&&
        p.brews[kind]>=Math.max(before.lastTick,before.brews?.[kind]??0)+qty*POTION_TICKS;
    }
    case 'eat': return (p.hp>before.hp||Object.entries(data?foodEffects(data,intent.itemId):{})
      .some(([effect,ticks])=>ticks>0&&(p.brews?.[effect==='fedTicks'?'fed':'rooted']??0)>
        Math.max(p.lastTick,before.brews?.[effect==='fedTicks'?'fed':'rooted']??0))) && (intent.shelf?
      (before.bank[intent.itemId]??0)-(p.bank[intent.itemId]??0):
      before.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0)-
      p.pack.filter(i=>i.itemId===intent.itemId).reduce((n,i)=>n+i.qty,0))>=(intent.qty??1);
    case 'clearRoute': return p.route===null&&!p.path?.length;
    case 'marketDump': return quantity(before,intent.itemId)-quantity(p,intent.itemId)>=intent.qty && p.coins>before.coins;
    case 'vendorBuy': return quantity(p,intent.itemId)-quantity(before,intent.itemId)>=intent.qty && p.coins<before.coins;
    case 'claimQuest': return ['daily','weekly'].some(period=>{
      const stamp=period==='daily'?'day':'week';
      return before.quests?.[stamp]===p.quests?.[stamp]&&
        before.quests?.[period]?.some(q=>q.id===intent.id&&!q.claimed&&q.done>=q.goal)&&
        p.quests?.[period]?.some(q=>q.id===intent.id&&q.claimed===true);
    });
    case 'rerollQuest': return before.quests?.day===p.quests?.day&&
      before.quests?.daily?.some(q=>q.id===intent.id)===true&&!p.quests?.daily?.some(q=>q.id===intent.id);
    case 'buyPerk': return (p.perks?.[intent.id]??0)>(before.perks?.[intent.id]??0);
    case 'plantPref': return (p.plantPlainest===true)===intent.plainest;
    case 'plotChoice': return (p.plotChoice?.[intent.siteId]??null)===intent.seed;
    case 'setFallback': return fallbackKey(p.fallback?.task)===fallbackKey(intent.fallback?.task)&&
      !!p.fallback?.onStorageFull===!!intent.fallback?.onStorageFull;
    case 'masteryConfirm': return Object.entries(intent.ranks??{}).every(([id,n])=>(p.masteries?.[id]??0)===n)&&
      Object.entries(intent.ranks??{}).some(([id,n])=>n>(before.masteries?.[id]??0));
    case 'enhance': return p.enhance?.itemId===intent.itemId || p.skills.enhancing>before.skills.enhancing;
    default: return false;
  }
}

export class Trainer {
  constructor(data, planner, send, now=()=>Date.now()) {
    this.data=data; this.planner=planner; this.send=send; this.now=now;
    this.active=false; this.player=null; this.received=0; this.goal=null;
    this.pending=null; this.recentDeposit=null; this.served={}; this.deferred={}; this.questDeferred={}; this.waitingGoals={}; this.blockedReasons={}; this.sequence=0;
    this.softRefused={};
    // Native fallback activity: on/off, the one the helper set per player, last check.
    this.autoFallback=true; this.fallbackOwned={}; this.fallbackCheckedAt=0;
    // The last error pause (shown on the overview) and whether this copy runs in the Worker.
    this.pausedError=null; this.inWorker=false;
    this.nextSync=0; this.nextAction=0; this.goalSince=0; this.bankedLoad=false;
    this.snapshotSequence=0; this.syncAfter=0; this.lastSync=-Infinity;
    this.message='等待登录后的游戏状态；安装后请刷新游戏';
    this.plan=null; this.history=[]; this.compatible=false;
    this.style='magic';
    this.mode='balanced';
    this.mainTrade='auto';
    this.mainJobId=null;
    this.mainMonsterId=null;
    this.itemTarget=null;
    this.buffRefill=null;
    this.potionBrew=null;
    this.consumableLogAt={};
    this.boss=createWorldBoss(data,now);
    this.farmJobId=null;
    this.recovery=null; this.awaitingWelcome=false;
    this.resolution=null;this.progress=null;this.stallCheck=null;this.failures=[];
    this.hotFollow=normalizeHotFollow();this.hotParkedGoal=null;this.hotFollowValidation=null;this.hotFollowLogAt=-Infinity;
    this.telemetry=new Telemetry(data,planner.level);this.metrics=this.telemetry.summary();
  }
  log(message) {
    this.history.unshift({time:this.now(),message});
    this.history=this.history.slice(0,8);
    this.message=message;
  }
  // An error pause should not leave the character standing still: if it is
  // idle, start the gathering backup (the fallback-activity choice) and keep
  // the error on the overview until the next start. Only the page can send;
  // a pause inside the planning Worker is handed back through pausedError.
  pauseError(reason) {
    this.pause(reason);
    this.pausedError={reason,at:this.now(),backup:null};
    if(!this.inWorker)this.startBackup();
  }
  startBackup() {
    const p=this.player;
    if(!p||!this.pausedError||this.pausedError.backup||!this.compatible||this.awaitingWelcome||this.mode==='assist'||
      p.route||p.path?.length||p.held||p.raidHeld||p.queue?.length||p.enhance)return null;
    const choice=this.planner.chooseFallback?.(p,null,this.style);
    if(!choice)return null;
    const intent={t:'setRoute',jobId:choice.task.jobId,siteId:choice.task.siteId,onFull:'bank',limit:0,rarity:0};
    try {this.send(intent);}
    catch(error){this.log(`备用采集未能开始：${error.message}`);return null;}
    this.pausedError={...this.pausedError,backup:choice.job.name};
    this.log(`已因错误暂停；角色改做 ${choice.job.name}，避免空闲`);
    return intent;
  }
  pause(reason='已暂停调度，游戏继续当前任务',preserveBoss=false) {
    this.pausedError=null;
    if(!preserveBoss){this.boss.cancel(reason);this.planner.cancelHousing?.();this.buffRefill=null;}
    if(this.player)this.planner.watchPotions?.(this.player,[]);
    this.active=false; this.pending=null; this.recentDeposit=null; this.recovery=null;this.resolution=null;this.stallCheck=null;this.bankedLoad=false; this.log(reason);
  }
  connectionLost(reason) {
    const resume=!reason&&(this.active||this.recovery);
    const previous=this.recovery??{playerId:this.player?.id,lastTick:this.player?.lastTick};
    this.pause(reason??(resume?'连接已断开，等待游戏自动重连；连上后自动继续':'连接已断开，调度保持暂停'),!!resume);
    this.compatible=false; this.awaitingWelcome=true;
    if (resume) this.recovery=previous;
  }
  setStyle(style) {
    if (!Object.hasOwn(PROFESSIONS,style)||style===this.style) return;
    this.cancelItemTarget();
    this.style=style;
    this.resetPlans();
    this.pause(`已选择${PROFESSIONS[style]}，点击开始重新规划；游戏当前任务仍继续`);
  }
  // A changed style, mode or main trade starts planning from scratch.
  resetPlans() {
    this.goal=null;this.plan=null;this.served={};this.deferred={};this.questDeferred={};this.waitingGoals={};this.blockedReasons={};
  }
  setMode(mode) {
    if(!Object.hasOwn(MODE_LABELS,mode)||mode===this.mode)return;
    this.cancelItemTarget();
    this.mode=mode;this.resetPlans();
    this.planner.resetSpecialization?.();
    this.planner.resetDevelopment?.();
    this.planner.resetMastery?.();
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${MODE_LABELS[mode]}，点击开始应用；先完成当前背包或批次`);
  }
  chooseGoal(p) {
    if(this.planner.selectGoal)return this.planner.selectGoal(p,this.served,this.deferred,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    return (this.planner.growthChooseGoal??this.planner.chooseGoal)(p,this.served,this.deferred,this.style);
  }
  setMainTrade(mainTrade) {
    if(!Object.hasOwn(MAIN_TRADES,mainTrade)||mainTrade===this.mainTrade)return;
    if(this.itemTarget){this.cancelItemTarget();this.pause('主业已更改，物品目标已取消');}
    this.mainTrade=mainTrade;this.mainJobId=null;this.mainMonsterId=null;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.resetPlans();
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择主业：${MAIN_TRADES[mainTrade]}，点击开始应用；先完成当前背包或批次`);
  }
  setMainJob(jobId) {
    const job=this.data.jobs.find(j=>j.id===jobId&&j.skill===this.mainTrade&&!j.grow);
    if(jobId!==null&&!job||jobId===this.mainJobId)return;
    this.cancelItemTarget();
    this.mainJobId=jobId;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.resetPlans();
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${job?`固定工作：${job.name}`:'自动选择工作'}，点击开始应用；游戏当前任务仍继续`);
  }
  setMainMonster(monsterId) {
    const monster=this.data.monsters.find(m=>m.id===monsterId);
    if(this.mainTrade!=='combat'||monsterId!==null&&!monster||monsterId===this.mainMonsterId)return;
    this.cancelItemTarget();
    this.mainMonsterId=monsterId;this.planner.resetSpecialization?.();
    if(this.mode!=='business')return;
    this.resetPlans();
    if(this.player)this.planner.watchMarket?.(this.player,[]);
    this.pause(`已选择${monster?`固定怪物：${monster.name}`:'自动选择怪物'}，点击开始应用；游戏当前任务仍继续`);
  }
  getHotFollow() {
    return {...this.hotFollow,sides:[...this.hotFollow.sides]};
  }
  setHotFollow(patch={}) {
    this.hotFollow=normalizeHotFollow({...this.hotFollow,...patch});
    this.plan=null;
    return this.getHotFollow();
  }
  hotWindows(count=4) {
    return hotWindows(this.data,this.player?.lastTick??0,count);
  }
  // The game's hot-skill badge is repainted by a page timer, which browsers
  // throttle in background tabs, so it can lag a window change by minutes.
  // Skip hidden tabs, accept the neighbouring window near a change, and stop
  // hot follow only after a mismatch has lasted two minutes.
  setHotDomSkill(skill,hidden=false) {
    const tick=this.player?.lastTick,local=hotSkillAt(this.data,tick);
    if(!skill||!local||hidden) {
      this.hotFollowValidation=null;this.hotMismatchSince=null;
      return;
    }
    const slack=Math.ceil(120000/this.data.tickMs);
    const nearby=[tick-slack,tick+slack].map(t=>hotSkillAt(this.data,t)?.skill);
    if(skill!==local.skill&&!nearby.includes(skill)) {
      const now=this.now();
      this.hotMismatchSince??=now;
      if(now-this.hotMismatchSince<120000)return;
      this.hotFollowValidation={expected:local.skill,actual:skill};
      if(now-this.hotFollowLogAt>=600000) {
        this.hotFollowLogAt=now;
        this.log('热门技能校验不一致：游戏显示 '+skill+'，本地计算 '+local.skill+'；已停用热门跟随');
      }
    } else {this.hotFollowValidation=null;this.hotMismatchSince=null;}
  }
  hotMainSkill() {
    return this.mainTrade==='combat'?'combat':this.mainTrade;
  }
  hotRouteSeconds(p,goal) {
    if(goal?.recipeId!=null) {
      const job=this.data.jobs.find(item=>item.id===goal.recipeId);
      const estimate=this.planner.routeEstimate?.(p,job,1,{style:this.style,buyInputs:true});
      if(Number.isFinite(estimate?.seconds))return estimate.seconds;
    }
    if(Number.isFinite(goal?.estimate?.seconds))return goal.estimate.seconds/Math.max(1,goal.batch??50);
    return 0;
  }
  hotFinishSeconds(p) {
    if(!finishTaskReason(this.data,p))return 0;
    const job=this.data.jobs.find(item=>item.id===p.route?.jobId);
    if(!job)return 0;
    const units=Number.isFinite(p.route?.limit)&&p.route.limit>0?Math.min(50,p.route.limit):28;
    return Math.max(0,units*(job.baseTicks??0)*this.data.tickMs/1000);
  }
  hotFollowStatus(p=this.player) {
    const current=hotSkillAt(this.data,p?.lastTick);
    const remainingMinutes=current?Math.max(0,(current.end-p.lastTick)*this.data.tickMs/60000):null;
    const result={active:false,skill:current?.skill??null,kind:current?.kind??null,mult:current?.mult??null,reason:'未启用',remainingMinutes};
    if(!p||!current)return result;
    if(this.hotFollowValidation){result.reason='热门数据校验不一致';return result;}
    if(!this.hotFollow.enabled||this.mode!=='business'||this.mainTrade==='auto')return result;
    const boss=this.boss?.status?.();
    if(['saving','ready','moving','attacking','fighting','dead','manual'].includes(boss?.phase)) {
      result.reason='世界 Boss 优先';return result;
    }
    if(this.itemTarget&&this.itemTarget.status!=='completed') {result.reason='物品目标优先';return result;}
    if(p.held||p.raidHeld||p.queue?.length) {result.reason='玩家队列优先';return result;}
    const mainSkill=this.hotMainSkill(),selected=new Set([mainSkill,...this.hotFollow.sides]);
    const target=hotSkillAt(this.data,p.lastTick+this.hotFollow.leadMinutes*60000/this.data.tickMs)??current;
    result.skill=target.skill;
    result.kind=target.kind;
    result.mult=target.mult;
    result.remainingMinutes=Math.max(0,(target.end-Math.max(p.lastTick,target.start))*this.data.tickMs/60000);
    if(!selected.has(target.skill)) {result.reason='不在所选职业';return result;}
    if(target.kind==='rarity'&&!this.hotFollow.countRarity) {result.reason='稀有发现未计入';return result;}
    if(target.skill===mainSkill) {result.active=true;result.reason='主职业已是热门';return result;}
    const boundary=!this.planner.taskBoundary||this.planner.taskBoundary(p);
    const finishSeconds=this.hotFinishSeconds(p);
    if(p.path?.length||p.activity==='walking'||p.activity==='working'||p.route&&!boundary) {
      result.remainingMinutes=Math.max(0,result.remainingMinutes-finishSeconds/60);
      result.reason='当前批次未完成';return result;
    }
    const candidate=this.planner.specialistChooseGoal?.(p,this.served,this.deferred,this.style,target.skill==='combat'?'combat':target.skill);
    const routeSeconds=this.hotRouteSeconds(p,candidate)+finishSeconds;
    if(result.remainingMinutes-routeSeconds/60<this.hotFollow.minMinutes) {
      result.reason='剩余不足 '+this.hotFollow.minMinutes+' 分钟';return result;
    }
    result.active=true;result.reason='跟随中';return result;
  }
  hotOverride(p) {
    const boundary=!this.planner.taskBoundary||this.planner.taskBoundary(p);
    if(this.goal?.hot&&boundary&&
      (p.lastTick>=this.goal.hot.end||!this.hotFollow.enabled||this.mode!=='business'||this.mainTrade==='auto')) {
      this.goal=this.hotParkedGoal;this.hotParkedGoal=null;this.plan=null;
      this.goalSince=this.now();this.log('热门时段结束，恢复原主业任务');
    }
    const status=this.hotFollowStatus(p),mainSkill=this.hotMainSkill();
    if(!status.active||status.skill===mainSkill||p.path?.length||p.activity==='walking'||p.activity==='working')return false;
    const window=hotSkillAt(this.data,p.lastTick+this.hotFollow.leadMinutes*60000/this.data.tickMs);
    if(!window)return false;
    if(this.goal?.hot?.start===window.start&&this.goal.hot.skill===window.skill)return false;
    const goal=this.planner.specialistChooseGoal?.(p,this.served,this.deferred,this.style,
      window.skill==='combat'?'combat':window.skill);
    if(!goal)return false;
    if(!this.goal?.hot)this.hotParkedGoal=this.goal;
    this.goal={...goal,hot:{skill:window.skill,kind:window.kind,mult:window.mult,start:window.start,end:window.end}};
    this.goalSince=this.now();this.plan=null;
    return true;
  }
  restoreItemTarget(saved) {
    if(saved==null){this.itemTarget=null;return true;}
    const choice=this.planner.itemTargetChoices?.().find(c=>c.itemId===saved.itemId);
    if(!choice||!Number.isSafeInteger(saved.playerId)||saved.playerId<0||
      !Number.isSafeInteger(saved.quantity)||saved.quantity<1||saved.quantity>1000000||
      !['pending','running','completed'].includes(saved.status)||
      (saved.status==='pending'?(saved.baseline!=null||saved.required!=null):
        !Number.isSafeInteger(saved.baseline)||saved.baseline<0||!Number.isSafeInteger(saved.required)||
        saved.required!==saved.baseline+saved.quantity))return false;
    this.itemTarget={itemTarget:true,playerId:saved.playerId,itemId:choice.itemId,targetItemId:choice.itemId,
      quantity:saved.quantity,baseline:saved.baseline??null,required:saved.required??null,
      qty:saved.required??null,status:saved.status,listedQty:0,skill:choice.skill};
    return true;
  }
  startItemTarget(itemId,amount) {
    const p=this.player;
    if(!p||!this.compatible){this.log('尚未同步兼容角色，不能开始物品目标');return false;}
    if(this.pending||this.resolution||p.enhance||p.route?.errand||p.held||p.raidHeld||p.queue?.length||
      this.boss.ownsRun()||this.boss.status().phase==='manual') {
      this.log('请等待当前操作、农事或 Boss 结束；物品目标不接管玩家队列或搁置任务');return false;
    }
    if(!this.restoreItemTarget({playerId:p.id,itemId,quantity:amount,baseline:null,required:null,status:'pending'})) {
      this.log('请选择可获取的普通物品，并输入 1 至 1000000 的整数数量');return false;
    }
    this.planner.cancelHousing?.();this.buffRefill=null;
    this.start(true);this.log('正在同步物品目标起始库存；本次额外获取，已有数量不计入进度');return this.active;
  }
  cancelItemTarget() {
    if(!this.itemTarget)return;
    this.itemTarget=null;
    if(this.goal?.itemTarget)this.goal=null;
    this.plan=null;this.log('物品目标已取消，继续当前批次后按原策略挂机');
  }
  itemTargetStatus() {
    const g=this.itemTarget;if(!g)return null;
    const listed=this.player?.id===g.playerId?this.market?.listedQuantity?.(this.player,g.itemId)??0:0;
    const owned=this.player?.id===g.playerId?quantity(this.player,g.itemId)+
      Object.values(this.player.equipment).filter(id=>id===g.itemId).length+listed:0;
    const completed=g.status==='completed';
    const gained=completed?g.quantity:g.baseline==null?0:Math.max(0,owned-g.baseline);
    return {...g,name:this.data.items[g.itemId]?.name??String(g.itemId),mode:this.mode,
      gained,remaining:Math.max(0,g.quantity-gained),completed};
  }
  manualAction(intent) {
    this.boss?.manualAction(intent,this.player);
    if(this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')return this.pause('检测到手动操作，已暂停调度');
    this.pending=null;this.resolution=null;this.plan=null;
    this.syncAfter=this.snapshotSequence;this.nextSync=0;this.nextAction=this.now()+1500;
    this.log('已让行手动操作；队列由你安排，继续监看收菜与世界 Boss');
  }
  receive(frame) {
    if (!frame || !Array.isArray(frame.m)) return;
    this.telemetry.receive(frame);
    this.market?.receive(frame);
    this.boss.observe(frame);
    const sequence=this.snapshotSequence;
    for (const message of frame.m) {
      if (message.t==='welcome') {
        this.compatible=message.protocol===this.data.protocol;
        if (!this.compatible) this.pause('游戏协议版本不匹配');
      }
      if (message.t==='welcome'||message.t==='snapshot') {
        if (this.awaitingWelcome&&message.t!=='welcome') continue;
        if (!this.awaitingWelcome&&Number.isFinite(this.snapshotTick) && frame.tick<this.snapshotTick) continue;
        if (!validPlayer(message.you,this.data.skills)) {
          this.pause('游戏状态格式发生变化，已暂停'); continue;
        }
        if(this.player&&message.you.id!==this.player.id) {
          this.waitingGoals={};
          if(this.active)this.pause('角色已变化，请检查后手动开始');
        }
        if(this.active&&message.you.lastStop?.reason==='died'&&message.you.lastStop.tick>(this.player?.lastTick??0)&&
          !this.boss.ownsDeath(message.you.lastStop.tick))
          this.pause('检测到角色死亡，请检查战斗配置后再继续');
        if (this.recovery && (this.recovery.playerId==null||message.you.id!==this.recovery.playerId)) {
          this.pause('重连后的角色已变化，请检查后手动开始');
        }
        if (this.recovery && (message.offline?.deaths>0 ||
          (message.you.lastStop?.reason==='died'&&message.you.lastStop.tick>this.recovery.lastTick&&
            !this.boss.ownsDeath(message.you.lastStop.tick)))) {
          this.pause('断线期间角色死亡，请检查战斗配置后再继续');
        }
        const first=!this.player;
        if(this.itemTarget&&this.itemTarget.playerId!==message.you.id)this.itemTarget=null;
        const oldRoute=this.player?.route,newRoute=message.you.route;
        if(message.t==='welcome'||this.player?.id!==message.you.id||!newRoute||
          oldRoute?.jobId!==newRoute.jobId||oldRoute?.siteId!==newRoute.siteId||oldRoute?.zoneId!==newRoute.zoneId)
          this.bankedLoad=false;
        else if(this.active&&bankedGatheringLoad(this.data,this.player,message.you))this.bankedLoad=true;
        this.telemetry.observe(message.you,this.now(),{reset:message.t==='welcome'||!!this.recovery||!this.active});
        this.metrics=this.telemetry.summary();this.planner.setMeasurements?.(this.metrics.rates);
        this.planner.perkUsage=this.metrics.rates;
        this.awaitingWelcome=false;
        this.player=message.you; this.received=this.now(); this.snapshotTick=frame.tick; this.awaitInitial=false;
        this.planner.enhancementTraining?.observe(this.player);
        this.snapshotSequence++;
        if(this.pending?.intent.t==='walk'){
          const position=`${this.player.x},${this.player.y}`;
          if(this.pending.position&&this.pending.position!==position)this.pending.sentAt=this.now();
          this.pending.position=position;
        }
        if (!this.active&&first) this.message=this.compatible?'已同步，可开始收益规划':'游戏协议版本不匹配';
        if (this.pending && (MARKET_ACTIONS.has(this.pending.intent.t)?
          this.market?.confirmed(this.pending.before,this.player,this.pending.intent):
          acknowledged(this.pending.before,this.player,this.pending.intent,this.data))) {
          const before=this.pending.before;
          if(depositReachedBank(before,this.player,this.pending.intent))
            this.recentDeposit={before,intent:this.pending.intent,confirmedAt:this.now()};
          if(this.pending.intent.t!=='clearRoute'&&(before.x!==this.player.x||before.y!==this.player.y||
            before.coins!==this.player.coins||JSON.stringify(before.equipment)!==JSON.stringify(this.player.equipment)||
            this.data.skills.some(s=>before.skills[s]!==this.player.skills[s])||
            JSON.stringify(before.pack)!==JSON.stringify(this.player.pack)))this.failures=[];
          if(MARKET_ACTIONS.has(this.pending.intent.t)) {
            this.market.settled(this.player,this.pending.intent);
            if(this.pending.intent.t==='marketBuy')this.plan=null;
          }
          if(this.pending.intent.t==='vendorBuy')this.plan=null;
          // Remember the fallback the helper set: any other one is the player's.
          if(this.pending.intent.t==='setFallback') {
            this.fallbackOwned={...this.fallbackOwned,[this.player.id]:fallbackKey(this.pending.intent.fallback?.task)};
            this.onFallbackOwned?.(this.fallbackOwned);
          }
          this.nextAction=Math.min(this.nextAction,this.pending.sentAt+1000);
          this.log(`已确认：${this.pending.label}`); this.pending=null;this.resolution=null;
        }
        if(this.pending&&['setRoute','fight'].includes(this.pending.intent.t)&&
          ROUTE_STOPS.has(this.player.lastStop?.reason)&&this.player.lastStop.tick>this.pending.before.lastTick&&
          this.player.lastStop.jobId===(this.pending.intent.jobId??null)){
          const reason=this.player.lastStop.reason;
          if(this.fault(`任务结束：${reason}`,`routeStop:${this.pending.intent.jobId??this.pending.intent.zoneId}:${reason}`)){
            if(this.goal&&['unreachable','levelTooLow','noSuchSite'].includes(reason)){
              this.deferred[this.goal.skill]=this.now()+300000;this.goal=null;
            }
            this.pending=null;this.resolution=null;this.nextAction=this.now()+1000;
            this.log(`任务结束：${reason}；按新库存和位置重新规划`);
          }
        }
      }
      if (!this.active&&!this.recovery) continue;
      if (message.t==='error') {
        if(isGuildRefusal(message.code)) {
          this.log(`公会提示：${message.code==='guild-already-in'?'相关角色已在公会中':message.code}；不影响自动练级`);
          continue;
        }
        const deposit=this.pending??this.recentDeposit;
        // Native banking can fulfil our deposit before the server handles it.
        // Its snapshot may precede the empty-deposit refusal, even in a separate
        // frame. Require exact stock transfer evidence and our own recent action.
        if(this.active&&message.code==='nothing-to-deposit'&&deposit&&
          (this.pending||this.now()-deposit.confirmedAt<=5000)&&frame.tick>=this.snapshotTick&&
          depositReachedBank(deposit.before,this.player,deposit.intent)) {
          this.pending=null;this.recentDeposit=null;this.resolution=null;this.plan=null;
          this.syncAfter=this.snapshotSequence;this.nextSync=0;
          this.log('物品已由游戏存仓，无需重复存入；同步库存后继续原计划');
          continue;
        }
        if(this.active&&this.pending&&HOUSE_ACTIONS.has(this.pending.intent.t)&&message.code==='house-away') {
          this.planner.housingRejected?.(this.player);
          this.pending=null;this.resolution=null;this.syncAfter=this.snapshotSequence;this.nextSync=0;
          this.nextAction=this.now()+1000;
          this.log('房屋操作需要在家园内，已暂缓五分钟；同步位置后继续原任务');
        } else if(this.active&&this.pending&&SOFT_ACTIONS.has(this.pending.intent.t)) {
          this.softRefused[this.pending.intent.t]=this.now()+6*3600000;
          this.log(`${this.pending.label} 被服务器拒绝（${String(message.code).slice(0,60)}）；6 小时内不再尝试，继续当前任务`);
          this.pending=null;this.resolution=null;this.syncAfter=this.snapshotSequence;this.nextSync=0;
          this.nextAction=this.now()+1000;
        } else if(this.active&&this.pending&&MARKET_ACTIONS.has(this.pending.intent.t)&&MARKET_REFUSALS.has(message.code)) {
          this.market?.rejected(message.code);
          this.checkCommand(`市场状态已变化：${message.code}`,message.code);
        } else if(this.active&&this.pending&&STATE_REFUSALS.has(message.code))this.checkCommand(`服务器状态已变化：${message.code}`,message.code);
        else this.pauseError(`服务器拒绝操作：${String(message.code).slice(0,100)}`);
      }
      if (message.t==='batch' && message.e?.some(e=>e.kind==='died')&&!this.boss.ownsDeath(frame.tick)) this.pause('检测到角色死亡，请检查战斗配置后再继续');
      if (message.t==='batch' && frame.tick>=this.snapshotTick &&
        message.e?.some(e=>['routeStopped','routeResumed','enhanced','enhanceFailed','questDone'].includes(e.kind))) {
        // Completion events are hints; fetch the authoritative state before replanning.
        this.syncAfter=this.snapshotSequence;
        this.nextSync=Math.min(this.nextSync,Math.max(this.now(),this.lastSync+2000));
      }
    }
    if (this.recovery&&this.compatible&&this.snapshotSequence>sequence) {
      this.recovery=null;
      this.start(true);
      if (this.active) this.log('已重新同步同一角色，自动继续调度');
    }
  }
  // What is waiting in the game's own queue, for messages. A held queue (e.g.
  // a task set aside for a Boss and never resumed) is not shown as a task.
  queueSummary(p=this.player) {
    const name=q=>q.kind==='zone'?`战斗 · ${this.data.monsters.find(m=>m.id===this.data.zones.find(z=>z.id===q.zoneId)?.monsterId)?.name??q.zoneId}`:
      q.kind==='quest'?'任务':this.data.jobs.find(j=>j.id===q.jobId)?.name??`工作 ${q.jobId}`;
    return `${(p?.queue??[]).map(name).join('、')}${p?.held?'（已搁置，不会自动开始）':''}`;
  }
  // Player-initiated only (the panel button): empty the game's queue.
  clearGameQueue() {
    if(!this.player?.queue?.length||this.active)return false;
    this.send({t:'unqueue'});this.queueBlocked=false;
    this.log('已按你的操作清空游戏队列；同步后可点击开始');return true;
  }
  start(preservePreparation=false) {
    if (!this.player||!this.compatible) return this.log('尚未取得兼容的角色状态，请刷新游戏后重试');
    if ((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&this.player.queue?.length&&!this.boss.ownsQueue(this.player)) {
      this.queueBlocked=true;
      return this.log(`游戏队列里还有 ${this.player.queue.length} 项：${this.queueSummary()}。为免打乱你的队列，请先在游戏里继续或清除，或点“清空游戏队列”，再开始自动调度`);
    }
    this.queueBlocked=false;
    this.active=true; this.recovery=null; this.pending=null; this.pausedError=null;
    if(!preservePreparation||!this.goal?.craftPreparation&&!equipmentProject(this.goal))this.goal=null;
    this.plan=null;
    this.resolution=null;this.progress=null;this.stallCheck=null;this.failures=[];this.bankedLoad=false;
    this.startedAt=this.now(); this.awaitInitial=true;
    this.syncAfter=this.snapshotSequence;
    this.nextSync=0; this.nextAction=0; this.log(this.mode==='assist'?'已开始辅助收菜与世界 Boss；保留你的原任务和队列':
      this.mode==='mastery'?'已开始按顺序补精通；每项只补下一档，跳过传说品质与种植任务':`已开始收益规划 + ${PROFESSIONS[this.style]}训练`);
  }
  checkCommand(reason,code=null) {
    if(this.resolution)return;
    this.resolution={sequence:this.snapshotSequence,reason,code};
    this.nextSync=0;this.log(`${reason}；先同步确认，再重新规划`);
  }
  fault(reason,key=reason) {
    if(this.failureKey!==key)this.failures=[];
    this.failureKey=key;
    this.failures=this.failures.filter(t=>this.now()-t<600000);this.failures.push(this.now());
    if(this.failures.length>3){this.pauseError(`连续恢复仍未成功：${reason}`);return false;}
    return true;
  }
  noteConsumable(key,message) {
    const now=this.now(),last=this.consumableLogAt[key];
    if(Number.isFinite(last)&&now-last<600000)return;
    this.consumableLogAt[key]=now;this.log(message);
  }
  consume(p,goal,style,plan) {
    const result=this.planner.consumable?.(p,goal,style,plan);
    const reason=this.planner.consumableReason?.();
    if(!result?.intent&&reason)this.noteConsumable(reason.key,reason.message);
    return result;
  }
  prepareIssue(plan) {
    // A refused optional setting (e.g. the sowing order) gives way to the work it preceded.
    while(plan.then&&SOFT_ACTIONS.has(plan.intent?.t)&&(this.softRefused[plan.intent.t]??0)>this.now())plan=plan.then;
    if(plan.intent.t==='fight') {
      const food=this.combatFoodPlan(this.player);if(food)return food;
    }
    if(!plan.housing&&['walk','setRoute','fight'].includes(plan.intent.t)) {
      const dose=this.consume(this.player,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,plan);
      if(dose?.intent)plan=dose;
    }
    return plan;
  }
  refillAtBank(p,goal) {
    if(this.buffRefill&&(this.buffRefill.playerId!==p.id||p.route||p.path?.length||!this.planner.nearBank(p)))this.buffRefill=null;
    if(this.buffRefill) {
      const reserved=reserveWaitingGoals(goal,{refill:{budget:this.buffRefill.budget}});
      const plan=this.consume(p,reserved,this.style,{intent:this.buffRefill.resume});
      if(plan?.intent){this.issue(plan);return true;}
      const resume=this.buffRefill.resume;this.buffRefill=null;
      this.issue({intent:resume,label:'补充增益后恢复原任务',reason:'恢复原工作地点、品质与剩余数量'});return true;
    }
    const route=p.route;
    const banking=!p.path?.length&&(p.activity==='banking'&&route?.phase==='banking'||
      p.activity==='idle'&&route?.phase==='toWork');
    // Unlimited routes the helper started resume as they were; the game's own
    // fallback and a player's unlimited route (assist mode) are left alone.
    if(!(this.bankedLoad||banking)||!this.planner.nearBank(p)||!route||route.fallback||route.limit===0&&this.mode==='assist'||route.errand||route.questId!=null||
      p.held||p.raidHeld||p.queue?.length||p.enhance)return false;
    const resume=resumeIntent(p,route);
    // Probe only a confirmed banking boundary, keeping the live route's input
    // reserve. Unknown prices never stop native work just to await a quote.
    const reserved={...goal,budget:inventoryBudget(this.data,this.planner,p,goal,true)};
    const plan=this.consume({...p,route:null,path:null,activity:'idle'},reserved,this.style,{intent:resume});
    // A brew starts here too: the pack was just banked, so nothing is lost.
    if(['drink','eat'].includes(plan?.intent?.t)||plan?.potionBrew){this.issue(plan);return true;}
    if(plan?.intent?.t!=='marketBuy')return false;
    this.buffRefill={playerId:p.id,resume,budget:reserved.budget};
    this.issue({intent:{t:'clearRoute'},label:'顺路补充增益，暂存原任务',reason:'已有合适卖盘；补充后恢复原路线，无需额外往返'});return true;
  }
  issue(plan,prepared=false) {
    if(!prepared)plan=this.prepareIssue(plan);
    this.plan=plan;const {intent,label}=plan;
    if((MARKET_ACTIONS.has(intent.t)||intent.t==='marketDump')&&this.market?.issued(this.player,intent,plan)===false) {
      this.message=this.player.ironman?'铁人角色不能执行普通玩家市场交易；保留物品':'采购报价或预算未通过复核，跳过本次购买';return;
    }
    if(['setRoute','fight','walk','clearRoute'].includes(intent.t))this.bankedLoad=false;
    if(plan.potionBrew)this.potionBrew={playerId:this.player.id,jobId:plan.potionBrew.jobId,until:this.now()+1200000};
    else if(['setRoute','fight','walk','clearRoute'].includes(intent.t))this.potionBrew=null;
    this.recentDeposit=null;
    this.pending={intent,label,before:this.player,sentAt:this.now(),consumablePurchase:plan.consumablePurchase===true};
    this.nextAction=this.now()+4000;this.log(`执行：${label}`);this.telemetry.command(intent);
    if(intent.t==='enhance')this.planner.enhancementTraining?.issued(this.player,intent);
    this.send(intent);this.nextSync=Math.min(this.nextSync,this.now()+2000);
  }
  // Keep the game's fallback activity on a gathering job that feeds the plan
  // (else the best experience). Never touches a fallback the player set or
  // cleared; checked at most every ten minutes.
  fallbackUpkeep(p) {
    if(!this.autoFallback||this.mode==='assist')return null;
    const ownership=fallbackOwnership(p,this.fallbackOwned);
    if(!['none','helper'].includes(ownership)||this.now()-this.fallbackCheckedAt<600000)return null;
    this.fallbackCheckedAt=this.now();
    const choice=this.planner.chooseFallback?.(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style);
    if(!choice||fallbackKey(choice.task)===fallbackKey(p.fallback?.task))return null;
    return {intent:{t:'setFallback',fallback:{task:choice.task,onStorageFull:false}},label:`设置后备活动 · ${choice.job.name}`,
      reason:`${choice.reason}；计划做完或缺料时游戏自动开始，手动停止、跳过或阵亡后不会启动`};
  }
  watchProgress(p) {
    if(!p.route&&!p.path?.length){this.progress=null;this.stallCheck=null;return false;}
    const job=this.data.jobs.find(j=>j.id===p.route?.jobId);
    const signature=JSON.stringify([p.x,p.y,p.path,p.route,p.activity,p.actionIndex,p.attemptTicks,p.foeHp,
      p.foeTicks,p.workJobId,p.workSiteId,p.stunUntil,job?p.skills[job.skill]:[p.skills[professionSkill(this.style)],p.skills.defence],
      p.route?.errand?p.plots:null]);
    const routeKey=`${p.route?.jobId??''}:${p.route?.zoneId??''}`;
    const xp=job?p.skills[job.skill]:p.skills[professionSkill(this.style)]+p.skills.defence;
    if(!this.progress||this.progress.signature!==signature){
      // Only real experience clears earlier stalls: re-issuing the same stuck
      // route also changes the signature and must not restart the count.
      if(this.progress?.routeKey===routeKey&&xp>this.progress.xp)this.failures=[];
      this.progress={signature,routeKey,xp,since:this.now()};this.stallCheck=null;return false;
    }
    // A long recipe or an explicit stun may legitimately take several minutes.
    // A crafting or gathering route left idle with no path is not working at all.
    const idle=p.activity==='idle'&&!p.path?.length&&job&&!job.grow&&!p.route.errand;
    const budget=idle?30000:Math.max(120000,(job?.baseTicks??0)*this.data.tickMs*4+60000);
    if(this.now()-this.progress.since<budget||p.stunUntil>p.lastTick)return false;
    if(!this.stallCheck){
      this.stallCheck={sequence:this.snapshotSequence};this.syncAfter=this.snapshotSequence;
      this.nextSync=this.now()+15000;this.lastSync=this.now();this.send({t:'resync'});
      this.log('任务长时间没有进展，正在同步核实');return true;
    }
    if(this.snapshotSequence<=this.stallCheck.sequence)return true;
    if(!this.fault('任务停滞',`stall:${routeKey}`))return true;
    // Keep the experience baseline so a restart is not mistaken for progress.
    this.stallCheck=null;this.progress={...this.progress,signature:null};
    // The same route stalled again after a restart: set this goal aside for
    // ten minutes and do other work instead of idling on it.
    if(this.failures.length>=2&&this.goal) {
      if(this.goal.quest)this.questDeferred[this.goal.quest.key]=this.now()+600000;
      else this.deferred[this.goal.skill]=this.now()+600000;
      this.blockedReasons[this.goal.skill]=`${job?.name??'当前任务'} 重启后仍然停滞，暂缓 10 分钟`;
      this.log(this.blockedReasons[this.goal.skill]);this.goal=null;
    }
    this.issue({intent:{t:'clearRoute'},label:'停止停滞路线并重新规划'});return true;
  }
  runItemTarget(p) {
    const g=this.itemTarget;
    if(!g||g.status==='completed')return false;
    const listed=p.ironman?0:this.market?.listedQuantity?.(p,g.itemId)??(this.market?.listedQuantity?null:0);
    if(listed===null){this.message='正在同步目标物品的已有挂单，避免撤单被计作新增';return true;}
    g.listedQty=listed;
    const owned=quantity(p,g.itemId)+Object.values(p.equipment).filter(id=>id===g.itemId).length+listed;
    if(g.baseline===null) {
      if(!Number.isSafeInteger(owned)||!Number.isSafeInteger(owned+g.quantity)){this.pause('目标库存数量异常，请检查后重新设置');return true;}
      g.baseline=owned;g.required=owned+g.quantity;g.qty=g.required;g.status='running';
    }
    this.goal=g;
    if(p.route?.errand){this.message='完成本次收获补种后继续物品目标';return true;}
    const enough=owned>=g.required;
    if(enough&&(p.route||p.path?.length)){this.issue({intent:{t:'clearRoute'},label:'目标数量已够，结束本次工作'});return true;}
    // Keep the same project while blocked or waiting for crops. Ordinary daily
    // selection and timed growth rotation must never replace this explicit goal.
    let plan=this.planner.planItemTarget(p,g,this.style,this.bankedLoad);
    const market=this.market?.next(p,g,this.style);
    if(market?.intent){this.issue(market);return true;}
    const maintenance=this.planner.maintenance?.(p,g,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    if(maintenance?.intent){this.issue(maintenance);return true;}
    if(maintenance?.marketWaiting||maintenance?.capacityLimited){this.plan=maintenance;this.message=maintenance.reason??maintenance.label;return true;}
    if(Object.values(p.overflow??{}).some(n=>n>0)){this.pause('物品目标等待仓库空间；目标已保留，请整理后继续');return true;}
    if(enough) {
      if(p.pack.length) {
        const bank=nearestBank(this.data,p);
        this.issue(this.planner.nearBank(p)?{intent:{t:'deposit'},label:'目标完成前将随身物资存仓'}:
          {intent:{t:'walk',...bank.approach},label:'目标数量已够，返回仓库'});return true;
      }
      g.status='completed';this.goal=null;this.plan=null;this.bankedLoad=false;
      this.log(`物品目标完成：额外获得 ${this.data.items[g.itemId]?.name??g.itemId} ×${g.quantity}，恢复原挂机策略`);return true;
    }
    if(this.watchProgress(p))return true;
    const seedTarget=this.data.jobs.some(j=>j.grow&&j.inputs.some(i=>i.itemId===g.itemId));
    // Target seeds must stay in stock. Other crops may be harvested at a task
    // boundary, but optional farm investment must not displace the item project.
    const harvest=!seedTarget&&!plan.blocked&&plan.intent?.t!=='clearRoute'&&(this.bankedLoad||this.planner.taskBoundary?.(p))?
      this.planner.harvestOnly?.(p):null;
    plan=harvest??plan;
    if(plan.farmJobId)this.farmJobId=plan.farmJobId;
    this.plan=plan;
    if(plan.intent?.t!=='clearRoute') {
      const consumable=this.consume(p,g,this.style,plan);
      if(consumable?.intent){this.issue(consumable);return true;}
    }
    if(!plan.intent){this.message=plan.reason??plan.label;return true;}
    this.bankedLoad=false;this.issue(plan);return true;
  }
  // 补精通 (upstream v0.8.2): fill the current round's next tier in order; the
  // goal stays until the server's collection count reaches it.
  runMastery(p) {
    if(p.route?.errand){this.message='完成本次收获补种后继续补精通';return;}
    if(this.goal?.mastery&&this.planner.masterySkipped(this.goal)) {
      this.log('补精通跳过种植与传说项，继续本轮下一项');this.goal=null;
    }
    if(this.goal?.mastery&&this.planner.masteryCompleted(p,this.goal)) {
      if(p.route||p.path?.length)return this.issue({intent:{t:'clearRoute'},label:'本档精通已完成，结束当前工作'});
      this.log(this.goal.reason.replace(/：.*/,'')+' · 本档已完成');this.goal=null;
    }
    if(!this.goal?.mastery)this.goal=this.planner.masteryChooseGoal(p,this.style);
    const goal=this.goal;
    if(!goal){this.plan=null;this.message=this.planner.masteryStatus(p);return;}
    let plan=this.planner.plan(p,goal,this.style,this.bankedLoad);
    const market=this.market?.next(p,goal,this.style);
    if(market?.intent)return this.issue(market);
    const maintenance=this.planner.maintenance?.(p,goal,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    if(maintenance?.intent)return this.issue(maintenance);
    if(maintenance?.marketWaiting||maintenance?.capacityLimited){this.plan=maintenance;this.message=maintenance.reason??maintenance.label;return;}
    if(Object.values(p.overflow??{}).some(n=>n>0))return this.pause('补精通等待仓库空间；本轮顺序已保留，请整理后继续');
    const housing=this.planner.housingPlan?.(p,goal,this.style,this.mode,this.bankedLoad);
    if(housing){this.plan=housing;if(housing.intent)return this.issue(housing);this.message=housing.reason;return;}
    if(this.watchProgress(p))return;
    const harvest=plan.intent?.t!=='clearRoute'&&(this.bankedLoad||this.planner.taskBoundary?.(p))?
      this.planner.harvestOnly?.(p):null;
    plan=harvest??plan;
    if(plan.farmJobId)this.farmJobId=plan.farmJobId;
    this.plan=plan;
    if(plan.intent?.t!=='clearRoute') {
      const consumable=this.consume(p,goal,this.style,plan);
      if(consumable?.intent)return this.issue(consumable);
    }
    if(!plan.intent){this.message=plan.reason??plan.label;return;}
    this.bankedLoad=false;this.issue(plan);
  }
  bossFoodPlan(p) {
    const target=this.itemTarget;
    const bossStatus=this.boss.status();
    if(!target||target.status==='completed'||bossStatus.active===false||!bossStatus.name||this.boss.ownsRun()||bossStatus.phase==='manual')return null;
    const targetId=target.targetItemId??target.itemId,targetBase=this.planner.base(targetId);
    if(!this.data.items[targetBase]?.heals)return null;
    const current=p.foodItemId;
    if(current>0&&autoUsableMaterial(this.data,current)&&this.planner.base(current)!==targetBase)return null;
    const rarity=id=>Math.floor(id%this.data.plusScale/this.data.rarityScale);
    const candidates=p.pack.filter(item=>item.qty>0&&autoUsableMaterial(this.data,item.itemId)&&this.data.items[this.planner.base(item.itemId)]?.heals&&
      this.planner.base(item.itemId)!==targetBase&&rarity(item.itemId)<=(p.foodMaxTier??1))
      .sort((a,b)=>(this.data.items[this.planner.base(b.itemId)]?.heals??0)-
        (this.data.items[this.planner.base(a.itemId)]?.heals??0)||a.itemId-b.itemId);
    const replacement=candidates[0]?.itemId;
    if(replacement===undefined)return {blocked:true,reason:'本场 Boss 跳过：唯一可用食物是目标物品'};
    if(current===replacement)return null;
    return {intent:{t:'chooseFood',itemId:replacement},label:'保护物品目标，切换 Boss 战斗食物',
      reason:`目标物品是食物，先选择背包中的非目标食物 ${this.data.items[this.planner.base(replacement)]?.name??replacement}`};
  }
  combatFoodPlan(p) {
    // Native explicit food selection bypasses the rarity ceiling. Confirm both
    // preferences before starting assistant combat, including a held Boss trip.
    if(p.foodItemId>0&&!autoUsableMaterial(this.data,p.foodItemId))return {
      intent:{t:'chooseFood',itemId:0},label:'保护传说食物，取消指定传说口粮',
      reason:'等待服务器确认食物选择后再开始战斗'};
    if(p.foodMaxTier>3)return {intent:{t:'foodMaxTier',tier:3},label:'保护传说食物，自动进食最高史诗',
      reason:'等待服务器确认品质上限后再开始战斗'};
    return null;
  }
  tick() {
    if (!this.active&&!this.recovery) return;
    const now=this.now();
    if (this.active&&now-(this.awaitInitial?this.startedAt:this.received)>45000) {
      this.pause('状态同步中；取得新状态后自动继续',true);
      this.recovery={playerId:this.player.id,lastTick:this.player.lastTick}; this.nextSync=0;
    }
    if (this.recovery) {
      if (!this.awaitingWelcome&&now>=this.nextSync) {
        this.nextSync=now+15000; this.send({t:'resync'});
      }
      return;
    }
    if (this.pending && now-this.pending.sentAt>(this.pending.intent.t==='walk'?300000:30000))
      this.checkCommand(`操作未得到确认：${this.pending.label}`);
    // A due periodic sync must not discard a response received since the last one.
    // Background timers can fire less often than the sync interval.
    const ready=!this.awaitInitial&&this.snapshotSequence>this.syncAfter;
    if (now>=this.nextSync) {
      this.syncAfter=this.snapshotSequence; this.nextSync=now+15000; this.lastSync=now;
      this.send({t:'resync'});
    }
    if(this.resolution&&this.snapshotSequence>this.resolution.sequence){
      const pending=this.pending,reason=this.resolution.reason,code=this.resolution.code;
      if(pending&&SOFT_ACTIONS.has(pending.intent.t)) {
        // Optional upkeep: an unconfirmed result disables it for a while, never pauses.
        this.softRefused[pending.intent.t]=now+6*3600000;
        this.pending=null;this.resolution=null;this.plan=null;this.nextAction=now+1000;
        this.log(`${pending.label} 未得到确认；6 小时内不再尝试，继续当前任务`);
      } else if(pending&&MARKET_ACTIONS.has(pending.intent.t)) {
        // The market ledger retains an ambiguous attempt across disconnects and
        // reloads. Resume self-supply without replaying that transaction.
        this.pending=null;this.resolution=null;this.plan=null;this.nextAction=now+1000;
        this.log(code?'市场操作未成交，冷却后重新比价；继续常规规划':'交易结果仍待核实，暂停新交易并继续自给任务');
      } else if(pending&&!code&&pending.intent.t==='convertHouse'&&
        quantity(this.player,pending.intent.itemId)===quantity(pending.before,pending.intent.itemId)&&
        JSON.stringify(this.player.housePoints??{})===JSON.stringify(pending.before.housePoints??{})) {
        // Nothing changed: the game ignored it and nothing was spent, so there
        // is no double-spending to guard against. Skip that fuel and carry on.
        this.planner.refuseHouseFuel?.(this.player,pending.intent.itemId);
        this.pending=null;this.resolution=null;this.plan=null;this.nextAction=now+1000;
        this.log(`${pending.label} 未生效（物品与房屋点数都没变，未花费）；该材料 6 小时内不再用于房屋点数，继续原任务`);
      } else {
        if(pending&&!code&&HOUSE_ACTIONS.has(pending.intent.t))
          return this.pauseError('房屋操作结果仍未确认，已暂停以防重复花费；请核对房屋状态后继续');
        if(pending&&!code&&pending.intent.t==='dropItem')
          return this.pauseError('原地丢弃结果仍未确认，已暂停调度以防重复丢弃；游戏当前采集继续');
        if(pending&&!code&&['enhance','marketDump','vendorBuy','eat','drink'].includes(pending.intent.t)&&
          (this.player.coins!==pending.before.coins||quantity(this.player,pending.intent.itemId)!==quantity(pending.before,pending.intent.itemId)||
            pending.intent.t==='eat'&&this.player.hp!==pending.before.hp))
          return this.pauseError('消耗型操作结果不明确，已暂停以防重复消耗');
        if(!this.fault(reason,`${pending?.intent.t}:${code??'timeout'}`))return;
        if(this.goal&&['setRoute','fight'].includes(pending?.intent.t)&&
          ['cannot-set-route','cannot-fight','level-too-low'].includes(code)){
          this.deferred[this.goal.skill]=now+300000;this.blockedReasons[this.goal.skill]=reason;
          this.waitingGoals[this.goal.skill]=this.goal;this.goal=null;
        }
        this.pending=null;this.resolution=null;this.plan=null;this.nextAction=now+1000;
        this.log('已取得新状态，保留目标和备料进度，重新规划可执行步骤');
      }
    }
    if((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&this.compatible&&!this.awaitInitial&&(ready||this.snapshotSequence>this.syncAfter)) {
      const query=this.market?.query(this.player);
      if(query&&!(query.t==='resync'&&this.lastSync===now)) {
        if(query.t==='resync')this.lastSync=now;
        this.send(query);
      }
    }
    // World Boss first (upstream v0.8.6): it runs before the ordinary waits
    // (sync, action cooldown, a walk awaiting confirmation). Any other
    // unconfirmed command, e.g. a trade, still waits for its result.
    const bossReady=!this.awaitInitial&&!this.player?.enhance&&(!this.pending||this.pending.intent.t==='walk');
    const boss=bossReady?this.bossTick(this.player,now):null;
    if(boss?.handled)return;
    const bossFoodBlocked=boss?.foodBlocked===true;
    if ((!ready&&this.snapshotSequence<=this.syncAfter)||this.awaitInitial||this.pending||now<this.nextAction) return;
    const p=this.player;
    if(p.enhance) {
      this.plan={intent:null,label:'等待本次强化结果',reason:'强化进行中，完成后继续原任务'};
      this.message=this.plan.reason;return;
    }
    if((this.mode!=='assist'||this.itemTarget&&this.itemTarget.status!=='completed')&&(p.held||p.raidHeld||p.queue?.length)) {
      this.consume(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,{intent:null});
      return this.pause('检测到玩家队列或搁置任务，保留原队列并暂停成长调度');
    }
    const result=this.scheduleAdvance?this.scheduleAdvance(false):this.advance(false);
    if(bossFoodBlocked) {
      const reason='本场 Boss 跳过：唯一可用食物是目标物品';
      // Once: the message is not replaced while a background result is pending.
      if(!this.message?.includes(reason))this.message=this.message?`${this.message}；${reason}`:reason;
    }
    return result;
  }
  // World Boss step: protective food settings, then joining, fighting or
  // leaving. `handled` means this tick is spent on the Boss.
  bossTick(p,now=this.now()) {
    const bossFood=this.bossFoodPlan(p),foodBlocked=bossFood?.blocked===true;
    if(foodBlocked) {
      this.plan={intent:null,label:'世界 Boss',reason:bossFood.reason};
      this.noteConsumable('boss-food',bossFood.reason);
    }
    if(bossFood?.intent) {
      if(this.pending)return {handled:true,foodBlocked}; // a walk first settles
      this.plan=bossFood;this.issue(bossFood);return {handled:true,foodBlocked};
    }
    // The helper's own errand walks yield to a Boss; in assist mode the walk is the player's.
    let bossPlan=foodBlocked?null:this.boss.next(p,{interruptWalk:this.mode!=='assist'});
    const bossStatus=this.boss.status();
    if(bossStatus.owned&&['attacking','fighting'].includes(bossStatus.phase)&&this.combatFoodPlan(p))
      bossPlan={intent:{t:'leaveWorldBoss'},label:'保护传说食物，结束本轮 Boss',
        reason:'已恢复的参战仍允许消耗传说食物，先离开本轮并恢复原任务'};
    if(!bossPlan)return {handled:false,foodBlocked};
    const blockedConsumable=this.consume(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,{intent:null});
    if(blockedConsumable?.intent)this.noteConsumable('boss',`药水未喝：世界 Boss 临时动作优先，${bossPlan.reason??'本轮先完成参战流程'}`);
    this.plan=bossPlan;this.message=bossPlan.reason??bossPlan.label;
    if(bossPlan.blocked){this.pause(bossPlan.reason,true);return {handled:true,foodBlocked};}
    if(bossPlan.intent) {
      if(now-(this.bossSentAt??-Infinity)<1000)return {handled:true,foodBlocked};
      if(bossPlan.intent.t==='attackWorldBoss') {
        const food=this.combatFoodPlan(p);
        if(food){if(!this.pending)this.issue(food);return {handled:true,foodBlocked};}
      }
      this.bossSentAt=now;
      // A Boss command replaces a walk still awaiting confirmation.
      this.pending=null;this.resolution=null;
      this.boss.issued(bossPlan.intent,p,bossPlan.reason);this.log(`执行：${bossPlan.label}`);
      this.send(bossPlan.intent);this.nextAction=now+1000;
      this.syncAfter=this.snapshotSequence;this.nextSync=0;
    }
    return {handled:true,foodBlocked};
  }
  // Pure decision phase may run on a cloned state in the planning Worker.
  // Connection freshness, acknowledgements and Boss protocol stay on the page.
  advance() {
    const p=this.player,now=this.now();
    const currentJob=this.data.jobs.find(job=>job.id===p.route?.jobId);
    if(this.mode!=='assist'&&this.goal&&!p.held&&!p.raidHeld&&!p.queue?.length&&
      currentJob?.inputs.length&&!currentJob.grow&&(p.workRarity??p.route.rarity??0)===4)
      return this.issue({intent:{t:'clearRoute'},label:'停止旧传说制作并保留材料',
        reason:'恢复的制作任务仍会消耗传说材料，先停止，再按普通至史诗材料重新规划'});
    if(this.mode!=='assist'&&this.goal&&p.route?.zoneId!=null&&!p.held&&!p.raidHeld&&!p.queue?.length&&this.combatFoodPlan(p))
      return this.issue({intent:{t:'clearRoute'},label:'先停止战斗并保护传说食物',
        reason:'原生自动进食设置允许消耗传说食物，确认安全设置后继续当前成长目标'});
    if(this.mode==='balanced')this.planner.observeDevelopment?.(p,this.goal,this.style);
    if(this.runItemTarget(p)) {
      return;
    }
    if(this.mode==='assist') {
      this.plan=this.planner.harvestOnly?.(p)??null;
      if(this.plan?.intent)return this.issue(this.plan);
      const consumable=this.consume(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,this.plan);
      if(consumable?.intent)return this.issue(consumable);
      this.message=this.plan?.reason??'监看作物与世界 Boss；继续你的原任务和队列';
      return;
    }
    const hotPreview=this.hotFollowStatus(p);
    const claim=hotPreview.active?null:this.planner.questClaim?.(p,this.style);
    if(claim?.intent)return this.issue(claim);
    // Quest-board upkeep needs no travel and never interrupts the current task.
    const softReady=t=>!((this.softRefused[t]??0)>this.now());
    const reroll=softReady('rerollQuest')&&this.planner.questReroll?.(p,this.style);
    if(reroll?.intent)return this.issue(reroll);
    // Quest points are left to the player: pocket space and small speed perks
    // cannot be valued reliably enough to spend them automatically.
    const fallback=softReady('setFallback')&&this.fallbackUpkeep(p);
    if(fallback?.intent)return this.issue(fallback);
    const mastery=softReady('masteryConfirm')&&this.planner.masteryPurchase?.(p,this.goal,this.style);
    if(mastery?.intent)return this.issue(mastery);
    if(this.mode==='mastery')return this.runMastery(p);
    if(this.goal?.enhancementProject&&this.goal.enhancement&&
      p.equipment[this.goal.enhancement.slot]!==this.goal.enhancement.itemId&&!p.enhance) {
      this.served.enhancing=++this.sequence;this.goal=null;this.plan=null;
    }
    // Reserve a fixed project's waiting batch before reviewing inventory sales.
    if(!this.goal&&this.mode==='balanced'&&this.planner.observeDevelopment)this.goal=this.chooseGoal(p);
    const projectGoal=this.goal??(this.mode==='business'?
      this.waitingGoals[this.mainTrade==='combat'?professionSkill(this.style):this.mainTrade]??this.chooseGoal(p):null);
    const maintenanceGoal=reserveWaitingGoals(projectGoal,this.waitingGoals);
    if(this.refillAtBank(p,maintenanceGoal)){this.goal=projectGoal;return;}
    // Do not start a home trip just before a Boss rises: the portal detour can
    // make it unreachable. A trip already under way is finished normally.
    const bossSoon=(this.boss.status().nextIn??Infinity)<=300;
    let housing=this.planner.housingPlan?.(p,maintenanceGoal,this.style,this.mode,this.bankedLoad);
    if(bossSoon&&housing&&!atHome(this.data,p)&&['portal','walk','clearRoute'].includes(housing.intent?.t))housing=null;
    if(housing){
      this.goal=projectGoal;this.plan=housing;
      if(housing.intent)return this.issue(housing);
      if(!this.watchProgress(p))this.message=housing.reason;return;
    }
    const marketPlan=this.market?.next(p,maintenanceGoal,this.style);
    if(marketPlan?.intent)return this.issue(marketPlan);
    const maintenance=this.planner.maintenance?.(p,maintenanceGoal,this.style,this.mode,this.mainTrade,this.mainJobId,this.mainMonsterId);
    if(maintenance?.intent)return this.issue(maintenance);
    if(maintenance?.marketWaiting){this.message=maintenance.reason??maintenance.label;return;}
    if(maintenance?.capacityLimited||maintenance?.priorityGear){
      this.plan=maintenance;
      const dose=this.consume(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,{intent:null});
      if(dose?.intent)return this.issue(dose);
      if(!this.watchProgress(p))this.message=maintenance.reason??maintenance.label;
      return;
    }
    if (Object.values(p.overflow??{}).some(n=>n>0)) return this.pause(maintenance?.reason??'仓库溢出且没有安全可处理的盈余，请检查保留物品');
    if(this.watchProgress(p))return;
    // Let the game's one-off errand finish banking and restoring its saved route.
    if (p.route?.errand && this.data.jobs.some(j=>j.id===p.route.jobId&&j.grow)) {
      this.message='正在收获补种，完成后继续原任务'; return;
    }
    // A potion brew the helper started runs to its end (it counts as a task
    // boundary until its ingredients are loaded, so the plan must not replace it).
    if(this.potionBrew&&(this.potionBrew.playerId!==p.id||p.route?.jobId!==this.potionBrew.jobId||now>this.potionBrew.until))
      this.potionBrew=null;
    if(this.potionBrew){this.message='正在自制药水，完成后继续原任务';return;}
    for (const [skill,until] of Object.entries(this.deferred)) if (until<=now) delete this.deferred[skill];
    for (const [key,until] of Object.entries(this.questDeferred)) if (until<=now) delete this.questDeferred[key];
    if(this.goal?.development&&!this.goal.craftPreparation&&!equipmentProject(this.goal)&&
      (this.bankedLoad||this.planner.taskBoundary?.(p))) {
      const resumed=this.planner.resumeDevelopment?.(p,this.deferred,this.goal);
      if(resumed){this.goal=resumed;delete this.waitingGoals[resumed.skill];this.goalSince=now;}
    }
    if(this.planner.developmentStalled?.(p,this.goal)&&(this.bankedLoad||this.planner.taskBoundary?.(p))) {
      this.deferred[this.goal.skill]=now+600000;
      this.log('本发展计划长时间没有本业进展，保留备料计划，暂做其他可行工作');this.goal=null;
    }
    const hotSelected=this.hotOverride(p);
    const hotStatus=this.hotFollowStatus(p);
    const hotActive=hotPreview.active||hotSelected||hotStatus.active||!!this.goal?.hot;
    const goalTimeout=this.goal?.development||this.goal?.funding?Infinity:this.goal?.quest?(this.goal.horizon??600)*1000:600000;
    if (this.goal && !this.goal.hot && !equipmentProject(this.goal) && (this.bankedLoad||!this.planner.taskBoundary||this.planner.taskBoundary(p)) &&
      ((this.goal.quest?this.planner.questCompleted(p,this.goal):
        this.goal.funding?p.coins>=this.goal.funding.gold||p.lastTick>=this.goal.funding.until:
        this.planner.level(p.skills[this.goal.skill])>=this.goal.target) || now-this.goalSince>goalTimeout&&!this.goal.craftPreparation ||
        this.goal.specialization&&!p.route&&p.skills[this.goal.skill]>this.goal.startedXp ||
        this.goal.temporary&&!this.deferred[this.goal.mainSkill])) {
      this.served[this.goal.skill]=++this.sequence;
      // A funding stretch that ended short sets that improvement aside for a while.
      if(this.goal.funding)this.planner.fundingEnded?.(p,this.goal);
      if(this.goal.quest&&now-this.goalSince>goalTimeout)this.questDeferred[this.goal.quest.key]=now+120000;
      // Allow other skills a turn after a long ingredient-gathering slice.
      if (now-this.goalSince>600000&&!this.goal.rate&&this.goal.fixedRecipeId==null&&this.goal.fixedMonsterId==null)
        this.deferred[this.goal.skill]=now+120000;
      this.goal=null;
    }
    for(let attempt=0;attempt<this.data.skills.length;attempt++) {
      let proposedGoal=null;
      const questsOpen=!this.goal?.hot&&this.goal?.quest?.period!=='daily'&&!this.goal?.craftPreparation&&!equipmentProject(this.goal)&&
        (this.bankedLoad||!this.planner.taskBoundary||this.planner.taskBoundary(p))&&
        this.planner.questRead?.(p).some(q=>!q.claimed&&q.remaining>0);
      if(questsOpen&&!hotActive) {
        // Dailies, then weeklies, are mandatory in every growth mode, including
        // a fixed trade. One quest goal is finished before the next weekly.
        proposedGoal=this.goal??this.chooseGoal(p);
        const quest=!equipmentProject(proposedGoal)&&!proposedGoal?.craftPreparation&&
          this.planner.questChooseGoal(p,proposedGoal,this.style,this.questDeferred);
        if(quest&&(quest.quest.period==='daily'||!this.goal?.quest)){this.goal=quest;this.goalSince=now;}
      } else if(questsOpen) {
        // A hot-skill window only delays a daily until it risks missing the reset.
        const quest=this.planner.questChooseGoal(p,this.goal,this.style,this.questDeferred);
        if(quest?.quest.period==='daily'&&quest.urgent){this.goal=quest;this.goalSince=now;}
      }
      for(const [skill,goal]of Object.entries(this.waitingGoals))
        if(this.planner.level(p.skills[skill])>=goal.target)delete this.waitingGoals[skill];
      // Select the foreground project before optional farm investment can take
      // the first turn. Otherwise a low skill may never get a material budget.
      if (!this.goal) {
        this.goal=proposedGoal??this.chooseGoal(p); this.goalSince=now;
        const waiting=this.waitingGoals[this.goal?.skill];
        if(!this.goal?.quest&&!equipmentProject(this.goal)&&waiting?.craftPreparation)this.goal=waiting;
        if(this.goal)delete this.waitingGoals[this.goal.skill];
      }
      // A growing herb crop still belongs to its deferred potion project while
      // another skill is running. Preserve that demand until the project resumes.
      const harvestGoal=reserveWaitingGoals(this.goal,this.waitingGoals);
      const harvest=this.planner.harvest(p,this.farmJobId,harvestGoal,this.style,this.bankedLoad);
      if (!this.goal&&!harvest) {
        this.message=this.mode==='business'&&(this.mainJobId!=null||this.mainMonsterId!=null)?
          this.blockedReasons[this.mainTrade==='combat'?professionSkill(this.style):this.mainTrade]??'固定目标正在等待材料或条件恢复，不自动更换工作':'当前模式暂无可行任务，等待条件变化';
        return;
      }
      const preparation=this.goal?.craftPreparation;
      this.plan=harvest??this.planner.plan(p,this.goal,this.style,this.bankedLoad);
      if(preparation&&this.plan.intent?.t==='setRoute'&&this.plan.intent.jobId===preparation.jobId)
        this.goalSince=now;
      if (this.plan.farmJobId&&!harvest) this.farmJobId=this.plan.farmJobId;
      if (this.plan.deferUntilTick) {
        if(!this.goal){this.message=this.plan.reason;return;}
        const until=now+Math.max(1000,(this.plan.deferUntilTick-p.lastTick)*this.data.tickMs);
        this.waitingGoals[this.goal.skill]=this.goal;
        this.deferred[this.goal.skill]=until;
        // Quests are chosen by key, not skill: without this the same mandatory
        // quest comes straight back on every attempt and nothing else runs.
        if(this.goal.quest)this.questDeferred[this.goal.quest.key]=until;
        delete this.blockedReasons[this.goal.skill];
        this.log(this.plan.reason);this.goal=null;continue;
      }
      if (this.plan.blocked) {
        if (Object.values(p.overflow??{}).some(n=>n>0)) return this.pause(this.plan.reason);
        if(!this.goal){this.message=this.plan.reason;return;}
        this.log(`${NAMES[this.goal.skill]}：${this.plan.reason}`);
        this.blockedReasons[this.goal.skill]=this.plan.reason;
        if(this.goal.quest)this.questDeferred[this.goal.quest.key]=now+120000;
        else this.deferred[this.goal.skill]=now+120000;
        this.goal=null;
        continue;
      }
      if (this.goal) delete this.blockedReasons[this.goal.skill];
      const surplus=!harvest&&!this.plan.intent&&this.planner.gatheringSurplus?.(p,this.goal,this.style,this.mode,this.waitingGoals);
      if(surplus?.intent)return this.issue(surplus);
      const consumable=this.consume(p,reserveWaitingGoals(this.goal,this.waitingGoals),this.style,this.plan);
      if(consumable?.intent)return this.issue(consumable);
      if(!(harvest?.marketWaiting&&harvest.farmJobId))this.bankedLoad=false;
      if (!this.plan.intent) { this.message=this.plan.combat?this.plan.label:this.plan.reason; return; }
      return this.issue(this.plan);
    }
    this.message='当前候选任务均在等待条件变化';
  }
}
