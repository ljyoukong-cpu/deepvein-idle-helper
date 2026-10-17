import {SCRIPT_BUILT, SCRIPT_DISTRIBUTION, SCRIPT_VERSION} from '../version.js';
import {GAME_DATA} from '../data/game-data.js';
import {parsePublicClient} from '../vendor/acorn.js';
import {PLANNING_WORKER_SOURCE} from '../worker/source.js';
import {PROFESSIONS, professionSkill} from '../planner/professions.js';
import {POTIONS, activeBuffs} from '../planner/supplies.js';
import {createEnhancementTraining} from '../planner/enhancement.js';
import {MAIN_TRADES} from '../planner/specialization.js';
import {planView} from '../planner/plan-view.js';
import {HOUSE_ACTIONS} from '../planner/housing.js';
import {NAMES, createPlanner} from '../planner/planner.js';
import {createEconomy} from '../economy/economy.js';
import {createMarket} from '../economy/market.js';
import {createNativeBossJoinCapture} from '../runtime/world-boss.js';
import {MODE_LABELS, SOFT_ACTIONS, Trainer, acknowledged, isGuildRefusal} from '../runtime/trainer.js';
import {CLIENT_ASSET, refreshGameData} from '../data/public-tables.js';
import {validateIntent} from '../runtime/intents.js';
import {createUpdateChecker} from '../ui/update-checker.js';
import {gameLabel, translateGameText} from '../ui/labels-zh.js';
import {createBossLootChat, createBossLootHistory} from '../ui/boss-loot.js';
import {applyPlanning, createPlanningClient, guardChange, planningGuard, planningState} from '../worker/planning.js';
import {PLANNING_STORAGE_KEYS, enhancementStorage, wirePlanner} from '../economy/wiring.js';
import {fallbackOwnership} from '../planner/fallback.js';
import {normalizeAutomation} from '../runtime/automation-policy.js';

// Runs in the page at document-start. Uses the game's existing connection;
// Never reads credentials or opens a second game connection. Update checks read
// only the public release metadata; Tampermonkey handles installing new code.
(() => {
  if (window.__deepveinBalancedTrainer) return;
  window.__deepveinBalancedTrainer=true;
  const planner=createPlanner(GAME_DATA);
  const bossLoot=createBossLootHistory(GAME_DATA,localStorage);
  const bossLootChat=createBossLootChat(document,bossLoot,translateGameText);
  const farmingPreferenceKey='deepvein-farming-preference-v1';
  try {
    const saved=planner.setFarmingPreference(JSON.parse(localStorage.getItem(farmingPreferenceKey)||'null'));
    if(saved.mode==='manual'&&saved.jobId===null)planner.setFarmingPreference({mode:'auto',jobId:null});
  }catch{}
  const autoSellKey='deepvein-auto-sell-v1';
  let autoSell=false;
  try {autoSell=localStorage.getItem(autoSellKey)==='true';}catch{}
  const potionRestockKey='deepvein-potion-restock-v1',capacitySalesKey='deepvein-capacity-sales-v1';
  let potionRestock=true,capacitySales=true;
  try {
    potionRestock=localStorage.getItem(potionRestockKey)!=='false';
    capacitySales=localStorage.getItem(capacitySalesKey)!=='false';
  }catch{potionRestock=false;capacitySales=false;}
  // Sell surplus crafted output (common quality only; higher rarities kept). Default on.
  const sellCraftedKey='deepvein-sell-crafted-v1';
  let sellCrafted=true;
  try {sellCrafted=localStorage.getItem(sellCraftedKey)!=='false';}catch{}
  const autoFallbackKey='deepvein-auto-fallback-v1',fallbackOwnedKey='deepvein-fallback-owned-v1';
  let autoFallback=true;
  try {autoFallback=localStorage.getItem(autoFallbackKey)!=='false';}catch{}
  const autoHousingKey='deepvein-auto-housing-v1';
  let autoHousing=true;
  try {autoHousing=localStorage.getItem(autoHousingKey)!=='false';}catch{}
  const autoSeedQualityKey='deepvein-auto-seed-quality-v1';
  let autoSeedQuality=true;
  try {autoSeedQuality=localStorage.getItem(autoSeedQualityKey)!=='false';}catch{}
  function saveFallbackOwned(owned) {
    try {localStorage.setItem(fallbackOwnedKey,JSON.stringify(owned));}
    catch {/* Without it, a helper-set fallback later reads as the player's and is left alone. */}
  }
  // How sales are priced: 'list' at the ask (wait for buyers) or 'bid' (sell now).
  const salePricingKey='deepvein-sale-pricing-v1';
  let salePricing='list';
  try {salePricing=localStorage.getItem(salePricingKey)==='bid'?'bid':'list';}catch{}
  // Experience mode: minimum gold per hour a chosen task must earn (0 = off).
  const profitFloorKey='deepvein-profit-floor-v1';
  const validProfitFloor=value=>Number.isFinite(value)&&value>0?Math.min(1e9,Math.floor(value)):0;
  let profitFloor=0;
  try {profitFloor=validProfitFloor(Number(localStorage.getItem(profitFloorKey)));}catch{}
  planner.profitFloor=profitFloor;
  const enhancementStore=enhancementStorage(localStorage);
  planner.enhancementTraining=createEnhancementTraining(GAME_DATA,planner,enhancementStore);
  let economy=createEconomy(GAME_DATA,planner,{autoSell,capacitySales,sellCrafted});
  const market=createMarket(GAME_DATA,planner,{now:()=>Date.now(),storage:localStorage,autoSell,capacitySales,salePricing});
  const procurementKey='deepvein-procurement-v1';
  let procurement;
  try {procurement=market.configureProcurement(JSON.parse(localStorage.getItem(procurementKey)||'{}'));}
  catch {procurement=market.configureProcurement();}
  wirePlanner(planner,market,()=>economy,()=>potionRestock);
  const NativeWebSocket=window.WebSocket;
  let socket=null, panel=null, rendered='', farmingOptions='', mainJobOptions='', mainMonsterOptions='', targetOptions='', targetIdentity='', checking=false, startCheck=0, compatibilityMessage='', pumping=false,nativeBossClick=null;
  let foregroundSequence=-1,pendingNativeJoin=null;
  const abortNativeBossJoin=()=>{const scope=nativeBossClick;nativeBossClick=null;scope?.abort();};
  let targetSearch='',targetSelection='';
  const owner=crypto.randomUUID();
  const leaseKey='deepvein-balanced-trainer-lease';
  const styleKey='deepvein-balanced-trainer-profession';
  const modeKey='deepvein-trainer-mode-v1';
  const mainTradeKey='deepvein-trainer-main-trade-v1';
  const hotFollowKey='deepvein-hot-follow-v1';
  const mainJobKey='deepvein-trainer-main-job-v1';
  const mainMonsterKey='deepvein-trainer-main-monster-v1';
  const validMainJob=(jobId,trade)=>Number.isInteger(jobId)&&GAME_DATA.jobs.some(j=>j.id===jobId&&!j.grow&&j.skill===trade)?jobId:null;
  const validMainMonster=(monsterId,trade)=>trade==='combat'&&Number.isInteger(monsterId)&&GAME_DATA.monsters.some(m=>m.id===monsterId)?monsterId:null;
  const TRAINING_MODE_LABELS=MODE_LABELS;
  const modeInfo={
    balanced:'均衡发展：所有技能保持在最低技能以上 10 级以内（低等级经验便宜，每 10 级所需经验约为前 10 级的 3 倍）；范围内按速度、解锁与收入选择，原料技能落后时先练原料技能。',
    experience:'比较供料与往返后的总经验效率，允许技能等级拉开差距。',
    business:'主业、具体工作与战斗目标均可自动或手选；指定目标不会因其他工作收益更高而被替换，仍可安排必要供料与换装。',
    mastery:'按收藏页“即将获得奖励”从左到右补下一档，跳过传说品质与种植任务；本轮顺序固定，完成后按游戏新排序继续。只认亲自产出的收藏计数，购买成品不算；材料仍可按采购开关补齐。',
    assist:'仅合批收菜、用现有种子补种与蹭世界 Boss；保留玩家队列，完成临时外出后继续原任务。'
  };
  const runKey='deepvein-balanced-trainer-session';
  const itemTargetKey='deepvein-item-target-v1:';
  const bossParticipationKey='deepvein-boss-participation-v1';
  const metricsKey='deepvein-trainer-metrics-v1';
  let metricsPlayer=null,lastMetricsSave=0,dataCheck=null;
  let dataReady=[...document.scripts].some(s=>new URL(s.src||location.href,location.href).pathname===`/assets/${GAME_DATA.client}`);
  const readOnly=new Set(['resync','marketDepth','marketBook','marketBooks','ping','netStats','friends','marketChart',
    'marketStock','marketHistory','inspect','leaderboard','guildInfo','pollPeek']);
  const recentRequests={actions:[],queries:[]};
  const rejectionKey='deepvein-rejections-v1';
  let rejections=[],rejectionsSaved=true;
  function readRejections() {
    try {
      const value=JSON.parse(localStorage.getItem(rejectionKey)||'null');
      if(Array.isArray(value))return value.filter(r=>r&&typeof r.code==='string'&&Number.isFinite(r.time)).slice(0,10);
    } catch { /* Keep in-memory evidence when storage is unavailable. */ }
    return rejections;
  }
  rejections=readRejections();
  const diagnosticIntent=intent=>Object.fromEntries(Object.entries(intent).filter(([key])=>
    ['t','id','itemId','jobId','siteId','zoneId','qty','price','floor','orderId','x','y','limit','errand','onFull','worn','toPlus','once','shelf','at','count','raid','index','room','cell','slot','dir'].includes(key)));
  function diagnosticState(p,intent) {
    if(!p)return null;
    const id=intent?.itemId;
    return {tick:p.lastTick,x:p.x,y:p.y,activity:p.activity,nearBank:planner.nearBank(p),coins:p.coins,hp:p.hp,
      route:p.route?{...diagnosticIntent(p.route),phase:p.route.phase}:null,
      equipment:{...p.equipment},enhance:p.enhance?diagnosticIntent(p.enhance):null,packEntries:p.pack.length,
      item:id?{id,bank:p.bank[id]??0,pack:p.pack.filter(i=>i.itemId===id).reduce((n,i)=>n+i.qty,0),overflow:p.overflow?.[id]??0}:null};
  }
  const allowed=new Set([...readOnly,'setRoute','fight','walk','wear','equipFromBank','deposit',
    'eatAt','eat','drink','chooseFood','foodMaxTier','carryFood','enhance','clearRoute','marketDump','depositItem','dropItem','withdraw','marketBuy','marketSell','marketCancel','vendorBuy','claimQuest','rerollQuest','buyPerk','masteryConfirm','setFallback','plantPref','plotChoice','unqueue',
    'setAside','attackWorldBoss','leaveWorldBoss','startQueued','portal',...HOUSE_ACTIONS]);
  function rememberRequest(intent) {
    const list=recentRequests[readOnly.has(intent.t)?'queries':'actions'];
    list.push({time:Date.now(),intent:diagnosticIntent(intent)});if(list.length>5)list.shift();
  }
  function nativeBossJoinButton() {
    const visible=button=>button?.isConnected&&!button.hidden&&!button.disabled&&!button.closest('[hidden]')&&button.getClientRects().length;
    const button=document.querySelector?.('[data-boss-run]');
    if(visible(button)&&/^(Attack|攻击)$/.test(button.textContent.trim()))return button;
    const pill=document.querySelector?.('[data-boss-pill]');
    if(trainer.boss.status().visible&&visible(pill)&&/^(Join|加入|加入战斗)$/.test(pill.querySelector('.boss-pill-join')?.textContent.trim()??''))return pill;
    return null;
  }
  function afterGameEvent(callback) {
    if(typeof MessageChannel!=='function')return setTimeout(callback,0);
    const channel=new MessageChannel();
    channel.port1.onmessage=()=>{channel.port1.close();channel.port2.close();callback();};
    channel.port2.postMessage(null);
  }
  const trainer=new Trainer(GAME_DATA,planner,intent=>{
    if (!allowed.has(intent.t)) throw new Error('未支持的操作');
    if(intent.t==='leaveWorldBoss'){pendingNativeJoin=null;abortNativeBossJoin();}
    if(!autoSell&&!(capacitySales&&trainer.plan?.capacitySale)&&!trainer.plan?.profitSale&&['marketSell','marketDump'].includes(intent.t))
      throw new Error('日常出售已关闭，且当前操作不是获准的满仓清理');
    if (!validateIntent(GAME_DATA,trainer.player,intent,{planner,goal:trainer.goal,style:trainer.style,mode:trainer.mode,waitingGoals:trainer.waitingGoals})) throw new Error('计划涉及未知或受保护物品，等待重新核对');
    if (!socket||socket.readyState!==NativeWebSocket.OPEN) throw new Error('游戏连接已断开');
    const send=()=>{
      NativeWebSocket.prototype.send.call(socket,JSON.stringify(intent));rememberRequest(intent);
      if(intent.t==='attackWorldBoss')trainer.boss.nativeJoinSent();
    };
    if(intent.t==='attackWorldBoss'&&nativeBossJoinButton()) {
      const connection=socket,playerId=trainer.player.id,round=trainer.boss.status();
      trainer.boss.queueNativeJoin();
      // Our socket listener runs before the game's receiver. Let it apply the
      // snapshot before asking the native button to read its own player state.
      afterGameEvent(function joinNativeBoss(){
        if(!trainer.active||socket!==connection||socket.readyState!==NativeWebSocket.OPEN||
          trainer.player?.id!==playerId)return;
        if(Date.now()-trainer.received>45000){pendingNativeJoin=joinNativeBoss;pump();return;}
        if(trainer.snapshotSequence<=foregroundSequence){pendingNativeJoin=joinNativeBoss;return;}
        const plan=trainer.boss.next(trainer.player),current=trainer.boss.status();
        if(plan?.intent||plan?.blocked){pump();return;}
        if(!current.owned||current.phase!=='attacking'||current.name!==round.name||current.until!==round.until)return;
        try {
          if(!claimLease()){trainer.pause('另一个标签页已接管调度');return;}
          let scope;
          scope=createNativeBossJoinCapture({
            isReadOnly:type=>readOnly.has(type),
            onSent:()=>trainer.boss.nativeJoinSent(),
            onDuplicate:()=>rememberRequest({t:'attackWorldBoss',duplicateNativeJoin:true}),
            onUnexpected:intent=>{
              // The native map may lag our entity receipt. Stop its remote
              // supply/walk branch before it changes the preserved route.
              if(intent.t==='joinWorldBoss'&&!scope.state().sent){
                scope.abort();nativeBossClick=null;
                if(trainer.active&&socket===connection&&socket.readyState===NativeWebSocket.OPEN&&
                  trainer.player?.id===playerId&&trainer.boss.ownsRun()&&trainer.boss.status().phase==='attacking'){
                  try {send();scope.markSent();}catch(error){trainer.pause(`原生 Boss 加入未完成：${error.message}`);releaseLease();}
                }
                throw new Error('原生界面尚未看到 Boss，已结束远程加入流程');
              }
              trainer.pause('原生 Boss 流程执行了其他操作，已交还游戏处理');releaseLease();saveRun();
            },
            onExpired:state=>{
              if(nativeBossClick!==scope)return;
              nativeBossClick=null;
              if(state.sent)return;
              if(state.unexpected||!trainer.active||socket!==connection||
                socket.readyState!==NativeWebSocket.OPEN||trainer.player?.id!==playerId||!trainer.boss.ownsRun()||
                trainer.boss.status().phase!=='attacking'){
                abortNativeBossJoin();return;
              }
              try {send();scope.markSent();}catch(error){trainer.pause(`原生 Boss 加入未完成：${error.message}`);releaseLease();}
              finally {saveRun();render();}
            }
          });
          nativeBossClick=scope.open();
          const button=nativeBossJoinButton();
          if(button)try {button.click();}catch { /* Never replay an attack already sent by the native handler. */ }
        } catch(error) {trainer.pause(`原生 Boss 加入未完成：${error.message}`);releaseLease();}
        finally {saveRun();render();}
      });
      return;
    }
    send();
  });
  let planningView=null,planningViewKey='',planningFailures=0,planningError='';
  const background=typeof Worker==='function'?createPlanningClient(()=>{
    const url=URL.createObjectURL(new Blob([PLANNING_WORKER_SOURCE],{type:'text/javascript'}));
    try{return new Worker(url);}finally{URL.revokeObjectURL(url);}
  }):null;
  const planningSettings=()=>({autoSell,capacitySales,sellCrafted,autoFallback,autoSeedQuality,autoHousing,automation,potionRestock,profitFloor,salePricing,hotFollow:trainer.getHotFollow()});
  function planningStorage() {
    return Object.fromEntries(PLANNING_STORAGE_KEYS.map(key=>[key,localStorage.getItem(key)]));
  }
  function planningInput(deferBoss=false) {
    let storage={},storageUnavailable=false;
    try {storage=planningStorage();}catch{storageUnavailable=true;}
    return {data:GAME_DATA,trainer:planningState(trainer),planner:planner.runtime(),market:market.runtime(),
      economy:economy.runtime(),boss:trainer.boss.status(),rates:trainer.metrics.rates,now:Date.now(),
      settings:planningSettings(),storage,storageUnavailable,deferBoss,
      ...(engine.ready&&engine.workerId!==engine.client?{engine:{id:engine.client,factory:engine.factory}}:{}),
      details:{inventory:!!panel?.querySelector('[data-economy-details]')?.open,
        equipment:!!panel?.querySelector('[data-equipment-details]')?.open,plan:planDetailsWanted()}};
  }
  // The plan view ranks every candidate (~50 ms); compute it only while the
  // 计划 tab, or the 策略 tab with its profit-floor suggestions, is showing.
  function planDetailsWanted() {
    const selected=id=>panel?.querySelector(`#${id}`)?.getAttribute('aria-selected')==='true';
    return selected('dv-tab-plan')||selected('dv-tab-strategy')&&trainer.mode==='experience';
  }
  const viewKey=()=>JSON.stringify([trainer.player?.id,trainer.style,trainer.mode,trainer.mainTrade,trainer.mainJobId,
    trainer.mainMonsterId,trainer.player?.skills,trainer.player?.bank,trainer.player?.pack,trainer.player?.equipment,
    trainer.player?.plots,trainer.goal,planner.farmingPreference(),
    !!panel?.querySelector('[data-economy-details]')?.open,!!panel?.querySelector('[data-equipment-details]')?.open,
    planDetailsWanted(),profitFloor]);
  // A result is discarded when the state changed while it was computed. Should
  // that repeat (something keeps changing), say what and plan on the page once,
  // so the helper never sits idle on discarded results.
  let staleResults=0,staleLoggedAt=0,planOnPage=false,busySkips=0,scheduledAt=0;
  // What became of the last background calculations, for deepveinDebug().
  const planningTrace=[];
  const trace=(outcome,extra={})=>{
    planningTrace.push({at:new Date().toLocaleTimeString(),outcome,...extra});
    if(planningTrace.length>12)planningTrace.shift();
  };
  if(background)trainer.scheduleAdvance=deferBoss=>{
    scheduledAt=Date.now();
    if(planOnPage){planOnPage=false;trace('页面内计算');return trainer.advance(deferBoss);}
    if(background.busy){busySkips++;return;}
    const input=planningInput(deferBoss),guard=planningGuard(trainer,planner,market,planningSettings());
    const ledger=JSON.stringify(input.storage),requested=Date.now();
    background.request('advance',input).then(result=>{
      noteEngine(result.engine);
      const ms=Date.now()-requested;
      // Native work continues while computing. Do not stop it to acquire a lock.
      if(ms>3000)throw new Error(`本次规划耗时过长（${ms} 毫秒），重新计算`);
      const held=!trainer.active?'未运行':!trainer.compatible?'协议不兼容':trainer.awaitInitial?'等待首个状态':
        Date.now()-trainer.received>45000?'状态过期':trainer.pending?`待确认：${trainer.pending.label}`:
        trainer.recovery?'重连中':trainer.snapshotSequence<=trainer.syncAfter?'等待新快照':null;
      if(held){trace('丢弃',{ms,why:held});return;}
      const changed=guardChange(guard,planningGuard(trainer,planner,market,planningSettings()))??
        (!input.storageUnavailable&&ledger!==JSON.stringify(planningStorage())?'规划存储':null);
      if(changed) {
        trace('作废',{ms,why:changed});
        if(++staleResults>=3) {
          staleResults=0;planOnPage=true;
          if(Date.now()-staleLoggedAt>600000) {
            staleLoggedAt=Date.now();
            trainer.log(`后台规划结果连续 3 次因“${changed}”变化作废；下一步改在页面内直接计算`);
          }
        }
        return;
      }
      staleResults=0;
      if(!claimLease()){trainer.pause('另一个标签页已接管调度');return;}
      applyPlanning(trainer,planner,economy,market,result,localStorage);
      trace('已应用',{ms,command:result.proposal?.label??null,plan:result.decision.plan?.label??null,
        reason:result.decision.plan?.reason??result.decision.message});
      planningFailures=0;planningError='';planningView=result.view;planningViewKey=viewKey();
    }).catch(error=>{
      trace('出错',{error:error.message});
      planningError=error.message;
      if(trainer.active) {
        if(++planningFailures>=2)trainer.pauseError(`后台规划连续失败：${error.message}；游戏当前任务继续，点击开始可重试`);
        else trainer.log(`后台规划重试：${error.message}；游戏当前任务继续`);
      }
    }).finally(()=>render());
  };
  function inspectPlanning() {
    if(!background||background.busy||checking||!trainer.player||!dataReady)return;
    const key=viewKey();
    if(key===planningViewKey||trainer.active)return;
    planningViewKey=key;
    background.request('inspect',planningInput()).then(result=>{
      noteEngine(result.engine);
      if(key===viewKey()){planningView=result.view;render();}
    }).catch(error=>{planningError=error.message;render();});
  }
  const updates=createUpdateChecker({version:SCRIPT_VERSION,distribution:SCRIPT_DISTRIBUTION,fetch:(...args)=>fetch(...args),onChange:()=>render()});
  trainer.market=market;
  // The game's own simulation engine, extracted from the public client in the
  // Worker and cached per client build. Without it, formula estimates are used.
  const engineKey='deepvein-engine-v1';
  const engine={client:null,factory:null,ready:false,workerId:null,message:'引擎模拟：等待客户端数据'};
  let engineCheck=null;
  async function idleRequest(kind,input,waitMs=30000) {
    const until=Date.now()+waitMs;
    while(background.busy&&Date.now()<until)await new Promise(resolve=>setTimeout(resolve,200));
    return background.request(kind,input);
  }
  function prepareEngine() {
    if(!background){engine.message='引擎模拟需要 Worker，沿用公式估算';return null;}
    if(engineCheck)return engineCheck;
    engineCheck=(async()=>{
      const page=new URL(location.href);
      const url=[...document.scripts].map(s=>s.src).filter(Boolean).map(s=>new URL(s,page))
        .find(u=>u.origin===page.origin&&CLIENT_ASSET.test(u.pathname));
      if(!url){engine.message='未识别客户端入口，引擎模拟未启用；沿用公式估算';return;}
      const client=url.pathname.split('/').pop();
      let cached=null;
      try{cached=JSON.parse(localStorage.getItem(engineKey)||'null');}catch{}
      let input;
      if(cached?.client===client&&typeof cached.factory==='string')input={id:client,factory:cached.factory};
      else {
        const response=await fetch(url.href,{credentials:'omit',signal:AbortSignal.timeout(15000)});
        if(!response.ok)throw new Error('客户端暂不可读');
        input={id:client,source:await response.text()};
      }
      engine.message='引擎模拟：正在从客户端提取并自检';render();
      const result=await idleRequest('engine',input);
      if(!result.ok) {
        try{if(cached?.client===client)localStorage.removeItem(engineKey);}catch{}
        engine.message=`引擎模拟未启用：${result.error??'未知原因'}${result.problems?.length?`（${result.problems.slice(0,3).join('；')}）`:''}；沿用公式估算`;
        return;
      }
      const factory=input.factory??result.factory;
      Object.assign(engine,{client,factory,ready:true,workerId:client});
      if(result.factory)try{localStorage.setItem(engineKey,JSON.stringify({client,factory}));}catch{}
      engine.message=`引擎模拟已启用：${client}${result.stats?`，${result.stats.units} 个函数`:'（本机缓存）'}`;
      planningViewKey='';
    })().catch(error=>{engine.message=`引擎模拟未启用：${error.message}；沿用公式估算`;}).finally(()=>render());
    return engineCheck;
  }
  // Town buyback report (the market's 🏛️ 回购 view): read-only, hourly.
  async function refreshBuyback() {
    try {
      const response=await fetch('/api/buyback',{credentials:'same-origin',signal:AbortSignal.timeout(10000)});
      if(response.ok){market.setBuyback(await response.json());planningViewKey='';}
    } catch { /* Without it, sales are valued without the buyback. */ }
  }
  // Public price feed for planning valuations, regenerated every 5 minutes.
  async function refreshPrices() {
    try {
      const response=await fetch('/api/market/prices.json',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(response.ok&&market.setPriceFeed(await response.json()))planningViewKey='';
    } catch { /* Without it, planning uses live quotes and formula estimates as before. */ }
  }
  // Track what the Worker holds; a recreated Worker gets the engine again.
  function noteEngine(status) {
    if(!engine.ready||!status)return;
    engine.workerId=status.ok?status.id:null;
    if(status.id===engine.client&&!status.ok) {
      engine.ready=false;engine.message=`引擎模拟已停用：${status.error??'加载失败'}；沿用公式估算`;
      try{localStorage.removeItem(engineKey);}catch{}
    }
  }
  async function prepareData() {
    if(dataCheck)return dataCheck;
    dataCheck=(async()=>{
      const result=await refreshGameData(GAME_DATA,[...document.scripts].map(s=>s.src),location.href,
        {fetch:(...args)=>fetch(...args),parse:parsePublicClient,storage:localStorage,
          extract:background?(source,data)=>background.request('parse',{source,data}):undefined});
      if(result.updated) {
        Object.assign(GAME_DATA,result.data);planningView=null;planningViewKey='';
        const refreshed=createPlanner(GAME_DATA);
        refreshed.housingRuntime(planner.housingRuntime());
        refreshed.masteryRuntime(planner.masteryRuntime());
        refreshed.setFarmingPreference(planner.farmingPreference());
        refreshed.setHousingEnabled(autoHousing);
        refreshed.enhancementTraining=createEnhancementTraining(GAME_DATA,refreshed,enhancementStore);
        Object.assign(planner,refreshed);
        trainer.mainJobId=validMainJob(trainer.mainJobId,trainer.mainTrade);
        trainer.mainMonsterId=validMainMonster(trainer.mainMonsterId,trainer.mainTrade);
        trainer.telemetry.level=planner.level;trainer.telemetry.rates={};trainer.telemetry.previous=null;
        economy=createEconomy(GAME_DATA,planner,{autoSell,capacitySales,sellCrafted});
        wirePlanner(planner,market,()=>economy,()=>potionRestock);
        trainer.goal=null;trainer.plan=null;
      }
      compatibilityMessage=result.message;dataReady=true;render();
    })();
    return dataCheck;
  }
  function saveMetrics(force=false) {
    if(!trainer.player||!trainer.telemetry)return;
    if(metricsPlayer!==trainer.player.id) {
      metricsPlayer=trainer.player.id;
      try {
        const saved=JSON.parse(localStorage.getItem(metricsKey)||'null');
        if(saved?.playerId===metricsPlayer)trainer.telemetry.restore(saved.metrics);
      } catch { /* A malformed local report is ignored. */ }
    }
    if(!force&&Date.now()-lastMetricsSave<60000)return;
    lastMetricsSave=Date.now();
    try{localStorage.setItem(metricsKey,JSON.stringify({playerId:metricsPlayer,metrics:trainer.telemetry.summary()}));}
    catch { /* On-screen measurements remain available without storage. */ }
  }
  try { trainer.setStyle(localStorage.getItem(styleKey)); } catch { /* Default to mage. */ }
  try {
    const saved=localStorage.getItem(modeKey);
    trainer.mode=Object.hasOwn(TRAINING_MODE_LABELS,saved)?saved:'balanced';
  } catch { trainer.mode='balanced'; }
  try {
    const saved=localStorage.getItem(mainTradeKey);
    trainer.mainTrade=Object.hasOwn(MAIN_TRADES,saved)?saved:'auto';
  } catch { trainer.mainTrade='auto'; }
  trainer.autoFallback=autoFallback;trainer.onFallbackOwned=saveFallbackOwned;
  // Boss time window, skip chance and harvest timing (upstream v0.8.1 settings key).
  const automationKey='deepvein-automation-v1';
  let automation=normalizeAutomation();
  try {automation=normalizeAutomation(JSON.parse(localStorage.getItem(automationKey)||'{}'));}catch{}
  trainer.boss.setAutomation(automation);planner.automation=automation;
  planner.autoSeedQuality=autoSeedQuality;planner.setHousingEnabled?.(autoHousing);
  try {
    const owned=JSON.parse(localStorage.getItem(fallbackOwnedKey)||'null');
    if(owned&&typeof owned==='object'&&!Array.isArray(owned))
      trainer.fallbackOwned=Object.fromEntries(Object.entries(owned).filter(([,key])=>typeof key==='string'));
  } catch {trainer.fallbackOwned={};}
  try {trainer.setHotFollow(JSON.parse(localStorage.getItem(hotFollowKey)||'null')??{});}
  catch {trainer.setHotFollow({});}
  try {trainer.mainJobId=validMainJob(JSON.parse(localStorage.getItem(mainJobKey)||'null'),trainer.mainTrade);}
  catch {trainer.mainJobId=null;}
  try {trainer.mainMonsterId=validMainMonster(JSON.parse(localStorage.getItem(mainMonsterKey)||'null'),trainer.mainTrade);}
  catch {trainer.mainMonsterId=null;}
  try {
    const saved=JSON.parse(sessionStorage.getItem(runKey)||'null');
    if (saved?.playerId!=null&&Object.hasOwn(PROFESSIONS,saved.style)) {
      trainer.style=saved.style;
      trainer.mode=Object.hasOwn(TRAINING_MODE_LABELS,saved.mode)?saved.mode:'balanced';
      trainer.mainTrade=Object.hasOwn(MAIN_TRADES,saved.mainTrade)?saved.mainTrade:'auto';
      trainer.mainJobId=validMainJob(saved.mainJobId,trainer.mainTrade);
      trainer.mainMonsterId=validMainMonster(saved.mainMonsterId,trainer.mainTrade);
      trainer.boss.restore(saved.boss);
      if(saved.development?.owner===saved.playerId)planner.developmentRuntime(saved.development);
      if(saved.housing?.owner===saved.playerId)planner.housingRuntime(saved.housing);
      if(saved.mastery?.owner===saved.playerId)planner.masteryRuntime(saved.mastery);
      if(saved.buffRefill?.playerId===saved.playerId)trainer.buffRefill=saved.buffRefill;
      if(saved.hotParkedGoal)trainer.hotParkedGoal=saved.hotParkedGoal;
      trainer.recovery={playerId:saved.playerId,lastTick:saved.lastTick};
      trainer.awaitingWelcome=true;
      trainer.message='等待游戏登录，同一角色登录后自动恢复本标签页的调度';
    }
  } catch { /* In-page reconnection still works without session storage. */ }
  try {trainer.boss.setParticipation(localStorage.getItem(bossParticipationKey));}catch{}
  let savedRun='',savedItemTarget='';
  function saveRun() {
    if(trainer.player) {
      const key=itemTargetKey+trainer.player.id,target=trainer.itemTarget;
      const record=target?.playerId===trainer.player.id?JSON.stringify(target):'';
      if(savedItemTarget!==key+record)try {
        if(record)sessionStorage.setItem(key,record);else sessionStorage.removeItem(key);
        savedItemTarget=key+record;
      } catch { /* The current target remains usable in this page. */ }
    }
    const record=trainer.active||trainer.recovery?JSON.stringify({
      playerId:trainer.recovery?.playerId??trainer.player?.id,
      lastTick:trainer.recovery?.lastTick??trainer.player?.lastTick,style:trainer.style,mode:trainer.mode,mainTrade:trainer.mainTrade,mainJobId:trainer.mainJobId,mainMonsterId:trainer.mainMonsterId,boss:trainer.boss.save(),development:planner.developmentRuntime(),housing:planner.housingRuntime(),mastery:planner.masteryRuntime(),buffRefill:trainer.buffRefill,hotFollow:trainer.getHotFollow(),hotParkedGoal:trainer.hotParkedGoal,hotFollowState:trainer.hotFollowStatus()}):'';
    if (record===savedRun) return;
    try {
      if (record) sessionStorage.setItem(runKey,record); else sessionStorage.removeItem(runKey);
      savedRun=record;
    } catch { /* No cross-tab or permanent auto-start fallback. */ }
  }
  function syncHotValidation() {
    const glyph=document.querySelector?.('[data-hot-pill] [data-hot-glyph]');
    trainer.setHotDomSkill(glyph?.dataset?.skill??null,document.visibilityState==='hidden');
  }
  window.getHotFollow=()=>trainer.getHotFollow();
  window.setHotFollow=patch=>{
    const next=trainer.setHotFollow(patch);
    try {localStorage.setItem(hotFollowKey,JSON.stringify(next));}catch{trainer.log('热门跟随设置无法保存，本次修改仍在当前页面生效');}
    planningView=null;planningViewKey='';trainer.nextAction=0;render();pump();
    return next;
  };
  window.hotWindows=count=>trainer.hotWindows(count);
  window.hotFollowStatus=()=>trainer.hotFollowStatus();
  window.hotFollowSkills=planner.hotFollowSkills.slice();
  // Read-only report for the console: why the helper is (not) acting right now.
  window.deepveinDebug=()=>{
    const now=Date.now(),p=trainer.player,ago=t=>Number.isFinite(t)?now-t:null;
    const ready=trainer.snapshotSequence>trainer.syncAfter;
    const waiting=!trainer.active?'未运行':!dataReady?'等待游戏数据':trainer.awaitInitial?'等待首个状态':
      trainer.pending?`待确认：${trainer.pending.label}`:!ready?'等待新快照':now<trainer.nextAction?'操作间隔':
      p?.enhance?'强化中':p?.held||p?.raidHeld||p?.queue?.length?'玩家队列或搁置任务':null;
    return {version:SCRIPT_VERSION,built:SCRIPT_BUILT,active:trainer.active,compatible:trainer.compatible,waiting,
      message:trainer.message,pausedError:trainer.pausedError??null,
      pending:trainer.pending&&{label:trainer.pending.label,intent:trainer.pending.intent.t,agoMs:ago(trainer.pending.sentAt)},
      resolution:trainer.resolution??null,recovery:trainer.recovery??null,
      snapshot:{sequence:trainer.snapshotSequence,syncAfter:trainer.syncAfter,receivedAgoMs:ago(trainer.received),
        nextSyncInMs:trainer.nextSync-now},
      nextActionInMs:trainer.nextAction-now,
      worker:{available:!!background,busy:background?.busy??null,lastScheduledAgoMs:scheduledAt?now-scheduledAt:null,
        busySkips,staleResults,planOnPage,planningFailures,planningError,trace:planningTrace.slice()},
      player:p&&{activity:p.activity,route:p.route&&{jobId:p.route.jobId,zoneId:p.route.zoneId,phase:p.route.phase,
        errand:!!p.route.errand,limit:p.route.limit,fallback:!!p.route.fallback},path:p.path?.length??0,
        held:!!p.held,raidHeld:!!p.raidHeld,queue:p.queue?.length??0,enhance:!!p.enhance,lastStop:p.lastStop??null},
      goal:trainer.goal&&{skill:trainer.goal.skill,target:trainer.goal.target,craftPreparation:trainer.goal.craftPreparation??null},
      plan:trainer.plan&&{label:trainer.plan.label,reason:trainer.plan.reason},
      boss:trainer.boss.status(),history:trainer.history?.map(h=>`${new Date(h.time).toLocaleTimeString()} ${h.message}`)??null};
  };

  function releaseLease() {
    try {
      if (JSON.parse(localStorage.getItem(leaseKey)||'null')?.owner===owner) localStorage.removeItem(leaseKey);
    } catch { /* Nothing to release if storage is unavailable. */ }
  }
  function claimLease() {
    const now=Date.now();
    const lease=JSON.parse(localStorage.getItem(leaseKey)||'null');
    if (lease&&lease.owner!==owner&&lease.until>now) return false;
    localStorage.setItem(leaseKey,JSON.stringify({owner,until:now+20000}));
    return JSON.parse(localStorage.getItem(leaseKey))?.owner===owner;
  }
  window.WebSocket=class extends NativeWebSocket {
    constructor(...args) {
      super(...args);
      const url=new URL(String(args[0]),location.href);
      if (url.host!==location.host||url.pathname!=='/ws') return;
      if (socket) trainer.connectionLost();
      socket=this;
      bossLoot.connectionOpened();
      this.addEventListener('message',event=>{
        if (socket!==this||typeof event.data!=='string') return;
        try {
          const sequence=trainer.snapshotSequence;
          const frame=JSON.parse(event.data),pending=trainer.pending;
          const welcome=frame.m?.find(message=>message.t==='welcome');
          if(welcome?.you?.id!=null) {
            let saved=trainer.itemTarget?.playerId===welcome.you.id?trainer.itemTarget:null;
            if(!saved)try {saved=JSON.parse(sessionStorage.getItem(itemTargetKey+welcome.you.id)||'null');}catch{}
            trainer.restoreItemTarget(saved?.playerId===welcome.you.id?saved:null);
          }
          bossLoot.observe(frame);
          const errors=Array.isArray(frame.m)?frame.m.filter(m=>m.t==='error'):[];
          const context=errors.length&&trainer.player?{active:trainer.active,snapshotTick:trainer.snapshotTick,
            before:diagnosticState(pending?.before??trainer.player,pending?.intent),
            pending:pending?{label:pending.label?.slice(0,160),sentAt:pending.sentAt,intent:diagnosticIntent(pending.intent)}:null}:null;
          trainer.receive(frame);
          if(context) {
            // A frame may confirm an operation before reporting an unrelated error.
            // Capture every error even if the first one already paused the trainer.
            const previous=rejectionsSaved?readRejections():rejections;
            const records=errors.slice(-10).reverse().map(error=>({time:Date.now(),version:SCRIPT_VERSION,client:GAME_DATA.client,
              code:String(error.code??'未提供错误码').slice(0,120),frameTick:frame.tick,...context,
              scope:isGuildRefusal(error.code)?'guild':'unattributed',
              stale:frame.tick<context.snapshotTick,
              pendingConfirmed:!!pending&&trainer.snapshotSequence>sequence&&acknowledged(pending.before,trainer.player,pending.intent,GAME_DATA),
              after:diagnosticState(trainer.player,pending?.intent),
              actions:[...recentRequests.actions],queries:[...recentRequests.queries]}));
            rejections=[...records,...previous].slice(0,10);
            try {localStorage.setItem(rejectionKey,JSON.stringify(rejections));rejectionsSaved=true;}
            catch {rejectionsSaved=false;}
          }
          if (trainer.snapshotSequence>sequence) {
            pump();
            if(pendingNativeJoin){const join=pendingNativeJoin;pendingNativeJoin=null;afterGameEvent(join);}
          } else if(Array.isArray(frame.m)&&frame.m.some(m=>['bossRose','bossGone','raidHit'].includes(m?.t))) {
            // A Boss appearing, ending or a hit is checked at once, after the
            // game has applied the frame (upstream v0.8.6), not on the next timer.
            afterGameEvent(pump);
          }
        }
        catch (error) { trainer.pause(`无法解析游戏状态：${error.message}`); }
        render();
      });
      this.addEventListener('close',event=>{
        if (socket!==this) return;
        abortNativeBossJoin();
        ++startCheck; checking=false;
        trainer.connectionLost(event.code===4001?'角色已在别处登录，已取消自动恢复':
          event.code===4002?'服务器已停用此连接，已取消自动恢复':undefined);
        if (!trainer.recovery) releaseLease();
        render();
      });
    }
    send(raw) {
      if(this===socket&&nativeBossClick&&typeof raw==='string') {
        let intent;try {intent=JSON.parse(raw);}catch{}
        if(intent&&nativeBossClick.capture(intent,()=>{const result=super.send(raw);rememberRequest(intent);return result;}))return;
      }
      // A manual gameplay action takes precedence over the planner.
      if (this===socket&&(trainer.active||trainer.recovery)&&typeof raw==='string') {
        try {
          const intent=JSON.parse(raw),type=intent.t;
          // Quest-board upkeep by the player does not conflict with the helper's work.
          if ((allowed.has(type)&&!readOnly.has(type)&&!SOFT_ACTIONS.has(type))||['clearRoute','stopEnhance','queue','unqueue','moveQueued','unwear','gearSetApply','portal','setAside','skip','startQueued','goQuest'].includes(type)) {
            trainer.manualAction(intent);
            if(!trainer.active&&!trainer.recovery)releaseLease();
            if(nativeBossClick&&!trainer.boss.ownsRun())abortNativeBossJoin();
            saveRun();
          }
        } catch { /* Non-JSON traffic still belongs to the game. */ }
      }
      return super.send(raw);
    }
  };

  const mainJobName=job=>gameLabel(job.name);
  function farmingChoices(p) {
    const ids=p?[...new Set([...Object.keys(p.bank).map(Number),...p.pack.map(i=>i.itemId)])]:[];
    return GAME_DATA.jobs.filter(j=>j.grow).sort((a,b)=>a.levelReq-b.levelReq||a.id-b.id).map(j=>({
      id:j.id,name:gameLabel(j.name),level:j.levelReq,
      locked:!p||planner.level(p.skills.farming)<j.levelReq,
      seeds:p?ids.filter(id=>planner.base(id)===j.inputs[0].itemId).reduce((n,id)=>n+planner.count(p,id),0):null
    }));
  }
  function changeFarmingPreference(mode,jobId) {
    if(mode==='manual'&&jobId==null)jobId=farmingChoices(trainer.player).find(j=>!j.locked)?.id??GAME_DATA.jobs.find(j=>j.grow)?.id??null;
    const preference=planner.setFarmingPreference({mode,jobId});
    try {localStorage.setItem(farmingPreferenceKey,JSON.stringify(preference));}
    catch {trainer.log('种植偏好已应用，但无法保存；刷新后恢复原设置');}
    render();
  }
  async function startScheduling(target=null) {
    if(checking||trainer.recovery||!target&&trainer.active)return;
    const attempt=++startCheck;
    planningFailures=0;planningError='';
    checking=true;trainer.log('正在启动…');render();
    try {
      await prepareData();
      if(attempt!==startCheck)return;
      checking=false;
      if(!claimLease())trainer.pause('另一个标签页正在调度，请先暂停那个标签页');
      else if(target)trainer.startItemTarget(target.itemId,target.quantity);
      else trainer.start();
    } catch {
      if(attempt!==startCheck)return;
      checking=false;trainer.pause('无法完成启动检查，请检查网站存储权限后重试');
    }
    render();
  }
  const pauseTrainer=trainer.pause.bind(trainer);
  trainer.pause=(...args)=>{abortNativeBossJoin();return pauseTrainer(...args);};
  let integrationCleanup=null;
  function pauseScheduling() {
    ++startCheck; checking=false; trainer.pause(); releaseLease(); render();
  }
  function mount() {
    const host=document.createElement('div');
    host.id='deepvein-balanced-trainer';
    host.style.cssText='position:fixed;right:12px;top:60px;z-index:2147483646;';
    panel=host.attachShadow({mode:'open'});
    panel.innerHTML=`<style>
      :host {
        all: initial;
        color-scheme: dark;
        --panel: #26180e;
        --panel-raised: #34220f;
        --panel-sunken: #170e07;
        --edge: #4d3219;
        --edge-bright: #7a5230;
        --ink: #f5e6c8;
        --ink-muted: #d6bf98;
        --ink-faint: #ab9270;
        --brass: #e8b25a;
        --brass-bright: #f5c572;
        --on-brass: #231509;
        --moss: #9ed36b;
        --rust: #ec7a5a;
        --lg-dark: radial-gradient(ellipse 120% 80% at 50% 0%, #3b2717 0%, #25170d 65%, #1d1209 100%);
        --lg-wood: linear-gradient(135deg, #9a6632 0%, #6e411d 28%, #a26d37 52%, #5f3616 78%, #83502a 100%);
        --lg-grain: repeating-linear-gradient(90deg, rgb(0 0 0/12%) 0 1px, transparent 1px 4px, rgb(255 220 170/6%) 4px 5px, transparent 5px 9px);
        --lg-bead: inset 0 0 0 1px rgb(199 147 82 / 70%);
        --lg-drop: 0 0 0 1px #1f1108, 0 9px 22px -6px rgb(0 0 0 / 60%);
        --font-sans: "Mulish", ui-sans-serif, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        --font-mono: "Mulish", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        --trans: 160ms ease;
        font: 13px/1.5 var(--font-sans);
        color: var(--ink);
      }
      :host([data-theme="light"]) {
        color-scheme: light;
        --panel: #f3e6c8;
        --panel-raised: #f8eed6;
        --panel-sunken: #e2cfa4;
        --edge: #b89763;
        --edge-bright: #8c6636;
        --ink: #3d2612;
        --ink-muted: #6b4826;
        --ink-faint: #876640;
        --brass: #9a6212;
        --brass-bright: #b87a1e;
        --on-brass: #ffffff;
        --moss: #3b7326;
        --rust: #a8391f;
        --lg-dark: radial-gradient(ellipse 120% 90% at 50% 35%, #f8ecd2 0%, #ecdab3 60%, #dcc394 100%);
      }
      @media (prefers-reduced-motion: reduce) {
        :host { --trans: 0ms !important; }
        * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
      }
      * { box-sizing: border-box; }
      section {
        display: flex;
        flex-direction: column;
        width: 380px;
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - 76px);
        max-height: calc(100dvh - 76px);
        background: var(--lg-dark) padding-box, var(--lg-grain) border-box, var(--lg-wood) border-box;
        border: 1px solid transparent;
        border-radius: 8px;
        box-shadow: var(--lg-bead), var(--lg-drop);
        color: var(--ink);
        overflow: hidden;
        transition: width var(--trans), border-radius var(--trans);
      }
      section[data-integrated="true"] {
        width: 100%;
        max-width: 100%;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: transparent;
        max-height: none;
        flex: 1 1 auto;
        min-height: 0;
      }
      section[data-integrated="true"] > header {
        display: none !important;
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px 8px;
        background: transparent;
        border-bottom: 2px solid rgb(0 0 0 / 30%);
        box-shadow: 0 1px #ffdcaa14;
        flex-shrink: 0;
      }
      .brand { flex: 1; min-width: 0; }
      .eyebrow {
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--brass-bright);
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .eyebrow::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--brass-bright);
        display: inline-block;
      }
      .brand strong {
        display: block;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: .2px;
        color: var(--ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      [data-update-badge] {
        font-size: 11px;
        font-weight: 700;
        color: var(--on-brass);
        background: linear-gradient(180deg, #ffd06a, #c98a1e);
        border-radius: 4px;
        padding: 2px 7px;
        text-decoration: none;
        white-space: nowrap;
        box-shadow: inset 0 0 0 1px #ffe0a0;
      }
      [data-update-badge]:hover { opacity: .92; }
      [data-fold] {
        width: 28px;
        height: 28px;
        min-height: 28px;
        flex-shrink: 0;
        border: 0;
        background: linear-gradient(180deg, #a86d34, #6e3f18);
        border-radius: 50%;
        box-shadow: inset 0 0 0 2px #d9a560, 0 0 0 2px #3b2210;
        padding: 0;
        font-size: 16px;
        line-height: 1;
        color: #fff3dc;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform var(--trans);
      }
      [data-fold]:hover { transform: scale(1.06); }
      .runbar {
        padding: 8px 12px;
        background: var(--panel-sunken);
        border-bottom: 1px solid var(--edge);
        flex-shrink: 0;
        display: flex;
        align-items: stretch;
        gap: 10px;
      }
      .run-state {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
        min-width: 0;
      }
      .status-line {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 7px;
        background: var(--panel);
        border: 1px solid var(--edge);
        border-radius: 10px;
        flex-shrink: 0;
      }
      .status-led {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--ink-faint);
        box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
      }
      [data-running="true"] .status-led, [data-state="running"] .status-led {
        background: var(--moss);
        box-shadow: 0 0 5px var(--moss);
      }
      [data-state="paused"] .status-led {
        background: var(--ink-faint);
        box-shadow: 0 0 4px var(--ink-faint);
      }
      [data-state="checking"] .status-led {
        background: var(--brass-bright);
        box-shadow: 0 0 5px var(--brass-bright);
      }
      [data-state="recovery"] .status-led {
        background: #9fa8da;
        box-shadow: 0 0 5px #9fa8da;
      }
      [data-state="idle"] .status-led {
        background: var(--ink-faint);
        box-shadow: none;
      }
      .run-state b {
        font-size: 11px;
        font-weight: 700;
        color: var(--ink);
        white-space: nowrap;
      }
      [data-status] {
        flex: 1;
        min-width: 0;
        font-size: 12px;
        color: var(--ink-muted);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .buttons {
        display: flex;
        gap: 6px;
        flex-shrink: 0;
        align-items: center;
      }
      .buttons button {
        min-height: 32px;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--trans);
      }
      [data-start] {
        background: linear-gradient(180deg, #f5c572, #c98a2c);
        color: #2a1706;
        border: 0;
        box-shadow: inset 0 0 0 2px #ffe0a0, 0 0 0 2px #4a2a0c, 0 2px #4a2a0c;
        text-shadow: 0 1px 0 rgb(255 240 200 / 55%);
      }
      [data-start]:hover:not(:disabled) {
        background: linear-gradient(180deg, #ffd488, #d89a38);
      }
      [data-pause] {
        background: var(--panel);
        border: 1px solid var(--edge);
        color: var(--ink);
        box-shadow: inset 0 0 0 1px var(--edge-bright);
      }
      [data-pause]:hover:not(:disabled) {
        background: var(--panel-raised);
      }
      button:disabled { opacity: .4; cursor: default; }
      [data-compact-target] {
        width: 100%;
        padding: 4px 8px;
        background: var(--panel);
        border: 1px solid var(--edge);
        border-radius: 6px;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .compact-target-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      [data-compact-target-name] {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--brass-bright);
        font-weight: 700;
      }
      [data-compact-target-count] {
        white-space: nowrap;
        color: var(--ink-faint);
        font-family: var(--font-mono);
      }
      .compact-target-bar {
        height: 4px;
        background: var(--panel-sunken);
        border-radius: 2px;
        box-shadow: inset 0 0 0 1px var(--edge);
        overflow: hidden;
      }
      .compact-target-fill {
        height: 100%;
        background: linear-gradient(180deg, #ffd06a, #c98a1e);
        width: var(--target-pct, 0%);
        transition: width var(--trans);
      }
      .compact-label { display: none; }
      section[data-folded="true"]:not([data-integrated="true"]) {
        width: auto;
        min-width: 310px;
        max-width: 440px;
        height: 44px;
        flex-direction: row;
        align-items: center;
        border-radius: 22px;
        padding: 0 6px 0 10px;
        box-shadow: var(--lg-bead), var(--lg-drop);
      }
      section[data-folded="true"] header {
        order: 2;
        padding: 0;
        background: transparent;
        border: 0;
        box-shadow: none;
        gap: 6px;
        margin-left: 6px;
      }
      section[data-folded="true"] .brand,
      section[data-folded="true"] .full-label {
        display: none !important;
      }
      section[data-folded="true"] .runbar {
        order: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        padding: 0;
        background: transparent;
        border: 0;
      }
      section[data-folded="true"] .run-state {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex: 1;
        min-width: 0;
        cursor: grab;
        touch-action: none;
        user-select: none;
        gap: 6px;
      }
      section[data-dragging="true"] .run-state { cursor: grabbing; }
      section[data-folded="true"] .status-line {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }
      section[data-folded="true"] .status-pill { padding: 2px 6px; }
      section[data-folded="true"] [data-status] {
        max-width: 140px;
        font-size: 11px;
      }
      section[data-folded="true"][data-target="true"] [data-status] {
        max-width: 90px;
      }
      section[data-folded="true"] [data-compact-target] {
        padding: 2px 6px;
        border: 0;
        background: transparent;
        max-width: 130px;
        flex-shrink: 0;
      }
      section[data-folded="true"] .compact-target-bar { display: none; }
      section[data-folded="true"] .buttons button {
        min-height: 28px;
        padding: 3px 9px;
        border-radius: 14px;
      }
      section[data-folded="true"] .compact-label { display: inline; }
      section[data-folded="true"][data-running="true"] [data-start],
      section[data-folded="true"][data-running="false"] [data-pause] {
        display: none;
      }
      section[data-folded="true"] [data-fold] {
        width: 26px;
        height: 26px;
        min-height: 26px;
        border-radius: 13px;
        font-size: 15px;
      }
      section[data-folded="true"] [data-update-badge] {
        font-size: 0;
        padding: 0 4px;
        min-height: 26px;
        display: flex;
        align-items: center;
      }
      section[data-folded="true"] [data-update-badge]::after { content: '更新'; font-size: 10px; }
      .body {
        padding: 0;
        min-height: 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      [hidden] { display: none !important; }
      .tab-strip {
        display: flex;
        gap: 4px;
        padding: 6px 10px;
        background: var(--panel);
        border-bottom: 1px solid var(--edge);
        overflow-x: auto;
        scrollbar-width: none;
        flex-shrink: 0;
      }
      .tab-strip::-webkit-scrollbar { display: none; }
      [role="tab"] {
        background: transparent;
        border: 1px solid transparent;
        border-radius: 5px;
        color: var(--ink-muted);
        font-size: 12px;
        font-weight: 600;
        padding: 5px 9px;
        cursor: pointer;
        white-space: nowrap;
        min-height: 28px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: all var(--trans);
      }
      [role="tab"]:hover {
        background: rgba(255, 220, 170, 0.08);
        color: var(--ink);
      }
      [role="tab"][aria-selected="true"] {
        background: linear-gradient(180deg, #6e4423, #4b2c14);
        border-color: #c79352;
        color: var(--brass-bright);
        font-weight: 700;
        box-shadow: inset 0 0 0 1px #e8b25a50;
      }
      [role="tab"][data-has-update="true"]::after {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--brass-bright);
      }
      .panels-container {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 10px 12px;
        /* Same scrollbar as the inner boxes (the panel's dark color-scheme
           default): full width, arrows and an easy-to-grab thumb. */
        overscroll-behavior: contain;
      }
      [role="tabpanel"] {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--edge);
        border-radius: 6px;
        padding: 10px 12px;
      }
      .card-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 700;
        color: var(--ink);
      }
      .card-heading span {
        font-size: 11px;
        font-weight: normal;
        color: var(--ink-faint);
        font-family: var(--font-mono);
      }
      .farm-counts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        padding: 6px 0 8px;
        margin-bottom: 8px;
        border-bottom: 1px solid var(--edge);
      }
      .farm-count-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .farm-count-item b {
        display: block;
        font-family: var(--font-mono);
        font-size: 19px;
        line-height: 1.2;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--brass-bright);
      }
      .farm-count-item span {
        font-size: 10px;
        color: var(--ink-faint);
        text-transform: uppercase;
      }
      .current {
        background: var(--panel);
        border: 1px solid var(--edge);
        border-left: 3px solid var(--brass);
        border-radius: 6px;
        padding: 9px 11px;
      }
      .label {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: var(--brass);
        margin: 0 0 3px;
      }
      [data-activity] {
        font-size: 14px;
        font-weight: 700;
        color: var(--ink);
        margin: 0 0 3px;
      }
      [data-task] {
        color: var(--brass-bright);
        font-size: 12px;
        font-weight: 600;
        margin: 0 0 2px;
      }
      [data-goal], [data-reason] {
        font-size: 12px;
        color: var(--ink-muted);
        margin: 0 0 2px;
      }
      p { margin: 0 0 7px; overflow-wrap: anywhere; }
      p:last-child { margin-bottom: 0; }
      .levels {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px 6px;
        margin: 8px 0;
      }
      .levels span {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 3px 7px;
        background: var(--panel-sunken);
        border: 1px solid var(--edge);
        border-radius: 4px;
        font-size: 11px;
      }
      .levels b {
        font-family: var(--font-mono);
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--brass);
      }
      .levels span.low {
        border-color: var(--brass-bright);
        background: rgba(232, 178, 90, 0.12);
      }
      .levels span.low b { color: var(--brass-bright); }
      .levels span.excluded { opacity: .5; color: var(--ink-faint); }
      .levels span.excluded b { color: var(--ink-faint); }
      details {
        background: var(--panel);
        border: 1px solid var(--edge);
        border-radius: 6px;
        overflow: hidden;
      }
      details + details { margin-top: 7px; }
      summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        list-style: none;
        min-height: 38px;
        padding: 7px 11px;
        cursor: pointer;
        color: var(--ink);
        font-size: 12px;
        font-weight: 700;
        background: var(--panel);
        user-select: none;
        transition: background var(--trans);
      }
      summary::-webkit-details-marker { display: none; }
      summary:hover { background: rgba(255, 220, 170, 0.05); }
      summary::after {
        content: '+';
        color: var(--ink-faint);
        font-size: 15px;
        font-weight: 400;
      }
      details[open] > summary::after { content: '−'; }
      .detail-content {
        padding: 9px 11px 11px;
        border-top: 1px solid var(--edge);
        background: var(--panel-sunken);
      }
      .detail-content > details {
        margin-top: 5px;
        border-color: var(--edge);
        background: var(--panel);
      }
      .detail-content > details > summary {
        font-weight: 600;
        font-size: 11px;
        min-height: 34px;
        padding: 5px 9px;
        color: var(--ink-muted);
        background: transparent;
      }
      .detail-content > details[open] > .detail-content,
      .detail-content > details > p,
      .detail-content > details > pre {
        padding: 7px 9px;
      }
      label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 36px;
        margin-bottom: 7px;
        font-size: 12px;
        color: var(--ink-muted);
      }
      select, input[type="number"], input[type="search"] {
        min-height: 34px;
        padding: 5px 9px;
        border: 1px solid var(--edge);
        border-radius: 5px;
        background: var(--panel-sunken);
        color: var(--ink);
        font: inherit;
        transition: border-color var(--trans);
      }
      select { cursor: pointer; max-width: 65%; flex: 1; }
      input[type="number"] { width: 120px; font-family: var(--font-mono); }
      input[type="checkbox"] {
        width: 17px;
        height: 17px;
        accent-color: var(--brass);
        flex-shrink: 0;
        margin: 6px 0 6px 8px;
        cursor: pointer;
      }
      [data-item-target-search] {
        width: 100%;
        min-height: 36px;
        padding: 7px 10px;
        border: 1px solid var(--edge);
        border-radius: 5px;
        background: var(--panel-sunken);
        color: var(--ink);
        margin-bottom: 7px;
      }
      :is(button, select, input, summary, a, [role="tab"], [role="tabpanel"]):focus-visible {
        outline: 2px solid var(--brass-bright);
        outline-offset: 2px;
      }
      .notice {
        padding: 8px 10px;
        border: 1px solid var(--rust);
        background: rgba(236, 122, 90, 0.1);
        border-radius: 5px;
        color: var(--rust);
        margin: 7px 0;
        font-size: 11px;
      }
      .fine-print {
        font-size: 11px;
        line-height: 1.45;
        color: var(--ink-faint);
        margin-top: 5px;
      }
      .muted { color: var(--ink-muted); font-size: 12px; }
      .setting-note { padding: 0 0 6px; }
      pre {
        margin: 7px 0;
        padding: 7px 9px;
        background: var(--panel-sunken);
        border: 1px solid var(--edge);
        border-radius: 5px;
        font-family: var(--font-mono);
        font-size: 11px;
        line-height: 1.55;
        max-height: 220px;
        overflow-y: auto;
        color: var(--ink-muted);
        white-space: pre-wrap;
      }
      [data-metrics],[data-farm],[data-market],[data-growth],[data-quests],[data-rejections],[data-buffs]{ white-space: pre-line; }
      ol {
        margin: 0 0 8px;
        padding: 7px 9px;
        background: var(--panel-sunken);
        border: 1px solid var(--edge);
        border-radius: 5px;
        font-family: var(--font-mono);
        max-height: 190px;
        overflow-y: auto;
        font-size: 11px;
        color: var(--ink-muted);
        list-style: none;
      }
      li {
        padding: 2.5px 0;
        border-bottom: 1px dashed rgba(255,255,255,0.06);
        overflow-wrap: anywhere;
      }
      li:last-child { border-bottom: 0; }
      [data-hot-follow-controls] {
        margin: 6px 0 10px;
        padding-top: 4px;
      }
      .hot-fieldset {
        border: 1px solid var(--edge);
        border-radius: 6px;
        padding: 6px 10px 8px;
        margin: 6px 0 8px;
        background: rgba(0, 0, 0, 0.12);
      }
      .hot-fieldset legend {
        padding: 0 4px;
        font-size: 11px;
        font-weight: 700;
        color: var(--brass-bright);
      }
      .hot-sides-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2px 8px;
      }
      .hot-side-item {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 6px;
        min-height: 28px;
        margin: 0;
        cursor: pointer;
        user-select: none;
      }
      .hot-side-item input[type="checkbox"] {
        margin: 0;
      }
      .hot-side-item[data-disabled="true"] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .hot-side-name {
        font-size: 12px;
        color: var(--ink);
      }
      .hot-side-tag {
        font-size: 10px;
        color: var(--brass);
        margin-left: 2px;
      }
      .hot-schedule-box {
        margin-top: 8px;
        border: 1px solid var(--edge);
        border-radius: 6px;
        background: var(--panel-sunken);
        overflow: hidden;
      }
      .hot-schedule-title {
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 700;
        color: var(--brass-bright);
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid var(--edge);
      }
      .hot-schedule-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        line-height: 1.4;
      }
      .hot-schedule-table th, .hot-schedule-table td {
        padding: 3px 6px;
        text-align: left;
      }
      .hot-schedule-table th {
        color: var(--ink-faint);
        font-weight: 600;
        border-bottom: 1px solid var(--edge);
      }
      .hot-schedule-table tr.current-window {
        background: rgba(232, 178, 90, 0.16);
      }
      .hot-schedule-table tr.current-window td {
        color: var(--brass-bright);
        font-weight: 700;
      }
      .hot-schedule-table td.hot-time {
        font-family: var(--font-mono);
        color: var(--ink-muted);
        white-space: nowrap;
      }
      .hot-schedule-table tr.current-window td.hot-time {
        color: var(--brass-bright);
      }
      .hot-schedule-table td.hot-badge-cell {
        white-space: nowrap;
      }
      .hot-badge {
        display: inline-block;
        padding: 0 4px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 700;
      }
      .hot-badge-xp {
        background: rgba(158, 211, 107, 0.15);
        color: var(--moss);
        border: 1px solid rgba(158, 211, 107, 0.35);
      }
      .hot-badge-rarity {
        background: rgba(245, 197, 114, 0.15);
        color: var(--brass-bright);
        border: 1px solid rgba(245, 197, 114, 0.35);
      }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        padding: 7px 12px;
        background: var(--panel);
        border-top: 1px solid var(--edge);
        color: var(--ink-faint);
        font-size: 10px;
        letter-spacing: .3px;
        flex-shrink: 0;
      }
      .update-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
      }
      .update-actions a {
        display: flex;
        align-items: center;
        min-height: 32px;
        color: var(--brass-bright);
        text-decoration: underline;
        text-underline-offset: 3px;
        font-size: 12px;
      }
      @media(max-width: 480px) {
        :host(:not([data-positioned])) {
          top: 12px !important;
          right: 8px !important;
        }
        section {
          width: 380px;
          max-width: calc(100vw - 16px);
          max-height: calc(100vh - 24px);
          max-height: calc(100dvh - 24px);
        }
        header { padding-top: 10px; }
        .brand strong { font-size: 13px; }
      }
      .plan-scroll { overflow-x: auto; }
      .plan-table { width: 100%; border-collapse: collapse; font-size: 11px; font-variant-numeric: tabular-nums; }
      .plan-table th, .plan-table td { padding: 3px 4px; text-align: right; border-bottom: 1px solid var(--edge); white-space: nowrap; }
      .plan-table th:first-child, .plan-table td:first-child { text-align: left; white-space: normal; }
      .plan-table th { color: var(--ink-muted); font-weight: 600; }
      .plan-table tr[data-chosen="true"] td { color: var(--brass-bright); font-weight: 700; }
      .plan-source { font-size: 10px; padding: 0 4px; border-radius: 3px; border: 1px solid var(--edge); color: var(--ink-muted); }
      .plan-source[data-source="simulated"] { border-color: #c79352; color: var(--brass-bright); }
      .plan-source[data-source="measured"] { border-color: #6fae6f; color: #9fd49f; }
      .suggestions { display: grid; gap: 4px; }
      .suggestions button { text-align: left; font-size: 11px; padding: 4px 6px; }
      .suggestions button[aria-pressed="true"] { border-color: #c79352; color: var(--brass-bright); }
    </style><section aria-label="自给成长与职业助手">
      <header>
        <div class="brand">
          <div class="eyebrow">DEEP VEIN · 控制台</div>
          <strong data-heading>均衡成长 · 职业专精</strong>
        </div>
        <a data-update-badge hidden target="_blank" rel="noopener noreferrer">有更新</a>
        <button data-fold aria-label="收起面板" aria-expanded="true">−</button>
      </header>
      <div class="runbar">
        <div class="run-state">
          <div class="status-line">
            <span class="status-pill"><span class="status-led" aria-hidden="true"></span><b data-run-state>待机</b></span>
            <p data-status role="status">等待游戏状态…</p>
          </div>
          <div data-compact-target hidden role="progressbar" aria-label="本次物品目标" aria-valuemin="0">
            <div class="compact-target-header">
              <span data-compact-target-name></span>
              <span data-compact-target-count></span>
            </div>
            <div class="compact-target-bar"><div class="compact-target-fill"></div></div>
          </div>
        </div>
        <div class="buttons">
          <button data-start><span class="full-label">开始调度</span><span class="compact-label">开始</span></button>
          <button data-pause disabled><span class="full-label">暂停调度</span><span class="compact-label">暂停</span></button>
        </div>
      </div>
      <div class="body">
        <div class="tab-strip" role="tablist" aria-label="控制台分区标签">
          <button role="tab" id="dv-tab-overview" aria-controls="dv-panel-overview" aria-selected="true" tabindex="0">总览</button>
          <button role="tab" id="dv-tab-plan" aria-controls="dv-panel-plan" aria-selected="false" tabindex="-1">计划</button>
          <button role="tab" id="dv-tab-strategy" aria-controls="dv-panel-strategy" aria-selected="false" tabindex="-1">策略</button>
          <button role="tab" id="dv-tab-supplies" aria-controls="dv-panel-supplies" aria-selected="false" tabindex="-1">物资</button>
          <button role="tab" id="dv-tab-logs" aria-controls="dv-panel-logs" aria-selected="false" tabindex="-1">诊断</button>
        </div>
        <div class="panels-container">
          <div role="tabpanel" id="dv-panel-overview" aria-labelledby="dv-tab-overview" tabindex="0">
            <div class="current">
              <p class="label">当前任务</p>
              <p data-pause-error class="notice" role="alert" hidden></p>
              <p data-queue-block class="notice" hidden><span data-queue-text></span> <button type="button" data-clear-queue>清空游戏队列</button></p>
              <p data-activity>等待游戏状态</p>
              <p data-task></p>
              <p data-goal></p>
              <p data-reason></p>
            </div>
            <div class="card">
              <div class="card-heading"><strong>农田</strong><span data-farm-fields>等待田地状态</span></div>
              <div class="farm-counts">
                <div class="farm-count-item"><b data-farm-ready>—</b><span>待收获</span></div>
                <div class="farm-count-item"><b data-farm-growing>—</b><span>生长中</span></div>
                <div class="farm-count-item"><b data-farm-empty>—</b><span>空田</span></div>
              </div>
              <p data-farm class="muted"></p>
              <label>种植方式<select data-farming-mode aria-label="种植方式"><option value="auto">自动选择</option><option value="manual">指定作物</option></select></label>
              <label data-farming-crop-controls hidden>指定作物<select data-farming-crop aria-label="指定作物"></select></label>
              <label>收菜时机<select data-harvest-mode aria-label="收菜时机"><option value="all">全部田成熟</option><option value="seed">任一同种田全部成熟</option></select></label>
              <label>收菜随机延迟（分钟）<span><input data-delay-min type="number" min="0" max="1440" step="1" aria-label="最短延迟"> – <input data-delay-max type="number" min="0" max="1440" step="1" aria-label="最长延迟"></span></label>
              <p class="fine-print">成熟后按设定时机收菜；每批延迟只抽一次，刷新保留。默认 0 分钟。</p>
              <p data-farming-note></p>
            </div>
            <div class="card">
              <div class="card-heading"><strong>世界 Boss</strong><span>临时参与 · 原队列保留</span></div>
              <p data-boss class="muted"></p>
              <button type="button" data-boss-retry hidden>重新尝试本轮 Boss</button>
              <label>参战方式<select data-boss-participation aria-label="世界 Boss 参战方式"><option value="full">全程打到结束</option><option value="tag">确认有效伤害后离开</option></select></label>
              <label>参战时段<span><input data-boss-start size="5" aria-label="开始时间" placeholder="00:00"> – <input data-boss-end size="5" aria-label="结束时间" placeholder="24:00"></span></label>
              <label>每轮跳过概率 %<input data-boss-skip type="number" min="0" max="100" step="1" aria-label="每轮跳过概率"></label>
              <p class="fine-print">本机时间；起止相同表示全天，可跨午夜。时段外不自动参加。每轮只抽一次是否跳过，刷新后保留。</p>
              <p class="fine-print">离开模式须收到服务器确认的本人有效伤害。按游戏说明，命中过即可参与分配，金币随贡献变化；实际奖励以结束后的掉落记录为准。仅控制助手发起的参战。</p>
            </div>
            <details data-progress-details>
              <summary>等级与运行收益</summary>
              <div class="detail-content">
                <p data-growth class="muted"></p>
                <div class="levels"></div>
                <p data-blocked class="muted"></p>
                <p data-metrics class="muted"></p>
                <p class="fine-print">只统计已观察到的在线区间；离线奖励不用于估算战斗效率。</p>
              </div>
            </details>
            <p data-last-rejection class="notice" hidden></p>
          </div>

          <div role="tabpanel" id="dv-panel-plan" aria-labelledby="dv-tab-plan" tabindex="0" hidden>
            <div class="current">
              <p class="label">当前由谁决定</p>
              <p data-plan-layer>等待规划</p>
              <p data-plan-action></p>
              <p data-plan-goal class="muted"></p>
            </div>
            <div class="card">
              <div class="card-heading"><strong>候选比较</strong><span data-plan-basis></span></div>
              <div data-plan-candidates class="plan-scroll"></div>
              <p class="fine-print">每小时数值已含供料与往返。来源：引擎＝游戏自身引擎按当前角色模拟；实测＝本次运行测得；公式＝估算。★ 为当前选择；优先级更高的每日任务、Boss、物品目标会先执行。</p>
            </div>
            <div class="card">
              <div class="card-heading"><strong>投资（金币换时间）</strong><span data-plan-funding class="muted"></span></div>
              <div data-plan-investments class="plan-scroll"></div>
              <p class="fine-print">花费按金币最高的工作折成小时；强化含失败归零后重来的期望成本。省下＝装备使用期内（到下一档或最多一周）同样进度少花的时间。省下超过花费 1.2 倍才值得；同一位置只做最省的一项。值得但钱不够时，先做金币最高的工作最多 1 小时筹资。</p>
            </div>
            <div class="card">
              <div class="card-heading"><strong>任务与点数</strong></div>
              <div data-plan-quests></div>
              <p data-plan-points class="muted"></p>
            </div>
          </div>

          <div role="tabpanel" id="dv-panel-strategy" aria-labelledby="dv-tab-strategy" tabindex="0" hidden>
            <details data-settings-details open>
              <summary>成长设置<span data-settings-summary class="muted"></span></summary>
              <div class="detail-content">
                <label>成长策略<select data-mode aria-label="成长策略">${Object.entries(TRAINING_MODE_LABELS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
                <p data-mode-info class="muted setting-note"></p>
                <div data-main-trade-controls hidden>
                  <label>主业<select data-main-trade aria-label="主业">${Object.entries(MAIN_TRADES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
                  <div data-main-job-controls hidden>
                    <label>具体工作<select data-main-job aria-label="具体工作"></select></label>
                    <p data-main-job-info class="muted setting-note"></p>
                  </div>
                  <div data-main-monster-controls hidden>
                    <label>目标怪物<select data-main-monster aria-label="目标怪物"></select></label>
                    <p data-main-monster-info class="muted setting-note"></p>
                  </div>
                  <p class="muted setting-note">农业继续后台合批种收；强化随有用装备升级。手选主业不会被更赚钱的其它技能替换。</p>
                </div>
                <div data-profit-floor-controls hidden>
                  <label>最低收益（金币/小时）<input type="number" min="0" step="100" inputmode="numeric" data-profit-floor aria-label="最低收益（金币/小时）"></label>
                  <p class="muted setting-note">只选择收益不低于此值的工作，再比经验；出售收入按“出售方式”扣税估算；选中的工作产出会被出售。都达不到时改做最赚钱的工作。0 为不限制。</p>
                  <p class="label">按当前角色的建议（点击使用）</p>
                  <div data-profit-suggestions class="suggestions"><p class="muted setting-note">打开本页后计算…</p></div>
                </div>
                <div data-hot-follow-controls hidden>
                  <p data-hot-unavailable class="muted setting-note" hidden></p>
                  <div data-hot-body>
                    <label><span style="font-weight:700;color:var(--brass-bright)">跟随热门技能</span><input type="checkbox" data-hot-enabled aria-label="开启跟随热门技能"></label>
                    <fieldset class="hot-fieldset" data-hot-sides-group>
                      <legend>跟随副职业</legend>
                      <div class="hot-sides-grid" data-hot-sides>
                        ${planner.hotFollowSkills.map(skill=>`
                          <label class="hot-side-item" data-hot-side-wrap="${skill}">
                            <input type="checkbox" data-hot-side="${skill}" aria-label="${NAMES[skill]??skill}">
                            <span class="hot-side-name" data-hot-side-name>${NAMES[skill]??skill}</span>
                            <span class="hot-side-tag" data-hot-side-tag hidden>（主职业）</span>
                          </label>
                        `).join('')}
                      </div>
                    </fieldset>
                    <label><span>稀有发现也算加成</span><input type="checkbox" data-hot-count-rarity aria-label="稀有发现也算加成"></label>
                    <label><span>剩余不足不切换</span><input type="number" data-hot-min-minutes aria-label="剩余不足不切换分钟数" min="3" max="20" step="1" value="8"> 分钟</label>
                    <p class="muted setting-note">有加成且在所选职业里就去练，否则练主职业；世界 Boss、队列、物品目标优先。</p>
                    <div data-hot-schedule class="hot-schedule-box">
                      <div class="hot-schedule-title">热门轮换预报</div>
                      <table class="hot-schedule-table">
                        <thead>
                          <tr>
                            <th scope="col">时段</th>
                            <th scope="col">技能</th>
                            <th scope="col">类型与倍率</th>
                          </tr>
                        </thead>
                        <tbody data-hot-schedule-body></tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <label>战斗职业<select data-profession aria-label="战斗职业">${Object.entries(PROFESSIONS).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
                <p data-profession-info class="muted"></p>
                <p data-training-policy class="muted"></p>
                <label>自动设置后备活动<input type="checkbox" data-auto-fallback aria-label="自动设置后备活动"></label>
                <p class="fine-print">游戏自带的后备活动：计划做完或缺料时自动开始，手动停止、跳过或阵亡后不会启动；用于关闭页面、离线或暂停时不空闲。助手选能供应当前计划的采集，否则选经验最高的采集；你自己设置或清除的后备活动不会被改动。<span data-fallback-status></span></p>
                <label>按配对品质选种<input type="checkbox" data-auto-seed-quality aria-label="按配对品质选种"></label>
                <p class="fine-print">炼药的草药和怪物掉落必须同品质才能配。种草药前，助手按缺口切换游戏的“先种普通种子”：缺普通草药（配普通掉落）时打开，缺稀有草药（有同品质掉落等着）时关闭，稀有优先。关闭此项则不改动你的设置。</p>
                <p class="fine-print">切换成长策略／职业后点击“开始”。开始后断线或本页刷新自动恢复；暂停取消恢复。保持电脑运行和标签页打开。</p>
              </div>
            </details>
            <details data-item-target-details open>
              <summary>物品目标<span data-item-target-summary class="muted">未设置</span></summary>
              <div class="detail-content">
                <input data-item-target-search type="search" aria-label="搜索目标物品" placeholder="搜索物品名称（中文／英文）" autocomplete="off" aria-describedby="item-target-search-results">
                <p id="item-target-search-results" data-item-target-results class="muted" role="status" hidden></p>
                <label>目标物品<select data-item-target-item aria-label="目标物品"></select></label>
                <label>另外获得<input data-item-target-quantity aria-label="另外获得数量" type="number" min="1" max="1000000" step="1" value="100"></label>
                <p data-item-target-status class="muted" role="status"></p>
                <div class="buttons">
                  <button data-item-target-start>开始目标</button>
                  <button data-item-target-cancel disabled>取消目标</button>
                </div>
                <p class="fine-print">仅普通品质；原库存不计，采购计新增，完成继续原策略。顺路收菜不额外补料，种子目标暂停播种；Boss 可能消耗目标食物时暂缓。暂停保留目标，切换策略、主业或职业取消；不接管玩家队列。</p>
              </div>
            </details>
          </div>

          <div role="tabpanel" id="dv-panel-supplies" aria-labelledby="dv-tab-supplies" tabindex="0" hidden>
            <details data-more-details open>
              <summary>任务、装备与物资</summary>
              <div class="detail-content">
                <details data-quests-details open><summary>日常／周常任务</summary><p data-quests class="muted"></p><p class="fine-print">短且收益合算的任务优先，长任务顺路推进；完成后自动领奖，不停止当前工作。击杀任务经验按领奖时的武器职业发放。</p></details>
                <details data-equipment-details><summary>当前与下一档装备</summary><p data-equipment-policy class="muted"></p><pre data-equipment></pre></details>
                <details data-housing-details><summary>房屋扩建与升级</summary>
                  <label>自动升级房屋<input type="checkbox" data-auto-housing aria-label="自动升级房屋"></label>
                  <p class="fine-print">关闭后不再扩建、摆放、投料或开始新的升级；已开始的施工照常进行，正在回家维护时会退出并恢复原任务。</p>
                  <pre data-housing></pre></details>
                <details data-economy-details><summary>物资保留与强化预算</summary><pre data-inventory></pre><pre data-enhancement></pre>
                  <details><summary>预算规则</summary><p class="fine-print">保留计划用料、关键种子和装备；在用装备以 +5 为基线，每次尝试一级并确认。后续强化单次只用现有金币与最多 25% 自由碎片；同装备每阶段最多五次，失败停止本阶段重试。临近换代先换装，中间一级属性取整不变但 +5 有提升时可继续。</p><p class="fine-print">强化报价按基础属性估算，是否执行由策略决定；高阶失败可能回到 +0。售价有最低报价保护，未知物品和稀有装备保留。</p></details>
                </details>
                <details data-market-details><summary>市场采购与出售</summary>
                  <label>按收益采购<input type="checkbox" data-purchase-enabled aria-label="按收益采购"></label>
                  <p class="fine-print">制作先用现货，缺口优先比较市场供料；缺货、过贵或买不起再自备。按整批原料的价格、数量与省下的时间选择配方，不设固定金币底线或每小时限额，保留任务必需开销。背包、仓库同品质原料合批制作；稀有材料保留，已被完全替代的品质／强化装备仅按实际品级卖市场。</p>
                  <p class="fine-print">自主发展／经验优先练采矿、伐木时，可在原地清理不需要的普通主产物，省下的往返时间须超过产物价值；钓鱼、偷窃不自动丢。保留至少 50 件周转物资、计划材料、所有稀有物及副产物，不启用游戏的一键丢弃采集物。</p>
                  <label>平时也出售多余物品<input type="checkbox" data-auto-sell aria-label="平时也出售多余物品"></label>
                  <p class="fine-print">开启：每次回仓时，把所有超出保留量的普通物品按下方“出售方式”挂单或卖出。关闭：只出售为赚钱而选择的工作的产出（主业经营、最低收益按售价选中的工作，其收益本就按出售计算），其他物品只在仓库满时按“满仓时出售普通盈余”清理。保留量：当前计划和供料链需要的材料、每种 50 件周转材料、3 趟战斗食物、种子与作物储备；药水、稀有／特殊掉落、坐骑宠物、传说物品、强化材料和装备方案一律不卖。关闭时会撤回助手自己尚未成交的挂单，不动你的手动挂单。</p>
                  <label>满仓时出售普通盈余<input type="checkbox" data-capacity-sales aria-label="满仓时出售普通盈余"></label>
                  <label>出售制作产出（保留可能的升级）<input type="checkbox" data-sell-crafted aria-label="出售制作产出，保留可能的升级"></label>
                  <p class="fine-print">烹饪、锻造、制箭、制作的产出，超出计划用量、周转库存和口粮储备的部分会出售。装备按位置和职业分别比较，每款只留一件最高品质；当前能穿的低级件和还穿不上的高级件都保留，被更好且已可穿的装备取代后才出售；其余品质／强化件按同品质成交价仅挂市场。传说、药水和稀有材料不卖。平时出售关闭时也生效。</p>
                  <label>出售方式<select data-sale-pricing aria-label="出售方式"><option value="list">挂单：按卖盘价等待成交</option><option value="bid">直接卖给买单：立即成交</option></select></label>
                  <p class="fine-print">挂单：比最低卖价低一档挂出，税后须比最高买单多 5% 以上，且近 2 小时成交量足以消化同价排队卖量，否则直接卖给买单；同一批挂两轮仍未卖完时改为卖给买单。商人（系统回收，基础价值 40%）始终可卖，是所有估值的下限：为赚钱选中的工作，市场无法高于商人价时直接卖给商人。城镇回购：每小时读取回购记录；上次被回购的普通物品按其实付均价（约商人价的倍数）估值，挂单价不超过商人价 1.5 倍并低于最低卖价一档，保留到下次回购后才复核，未成交转商人；同时最多 2 笔，留出挂单槽。收益规划也按同样方式估值。</p>
                  <p data-market class="muted"></p>
                  <details><summary>出售范围与保护</summary><p class="fine-print">日常出售默认关闭，满仓清理默认开启。扣除计划用量后处理普通盈余和淘汰装备。品质／强化装备只有已有可穿戴且属性全面更好的替代品、没有在用或套装／目标引用时才可卖；按同品质同强化近 2 小时成交中位价参考，最多下浮 10%，没有可靠行情或需求不足则保留，绝不转系统回收。所有坐骑、宠物、低概率掉落（含白色）、稀有材料、种子、药水、食物储备和装备方案均保留。保护也覆盖旧版脚本挂单，未成交的会撤回，不动玩家手动单。按所选出售方式挂单或成交买单；挂售量参考近 2 小时可见成交和排队卖量。满仓且最新有效记录显示滞销的普通盈余可直接系统回收；其他仍需挂售至少 2 小时并重新定价。查询失败、历史缺失或挂单槽满不会触发直接回收。不自动捐赠。</p></details>
                </details>
                <details data-buffs-details><summary>药水与食物</summary>
                  <p data-buffs class="muted"></p>
                  <label>比价自动补药水<input type="checkbox" data-potion-restock aria-label="比价自动补药水"></label>
                  <p class="fine-print">药效余量 ≤ 6 小时时按需补至约 20 小时；过期先用现货，正常存仓时可顺路买药，补完恢复原任务。按价格／效果选择品质，不专程返仓。</p>
                  <details><summary>补给预算与药效说明</summary><p class="fine-print">各品质药水每瓶同为 1 小时，效果倍率依次为 1、1.3、1.6、2.2、3；单次最多 20 瓶，高品质药效先计时。有近期报价才考虑使用稀有盈余，目标物品和配方原料保留。采购按价格与效果核算，单瓶价格不得超过普通基础估值 × 药效倍率 × 3。熟食按有效治疗／价格比较，遵守游戏自动进食品质上限。缺货、价格不合适或金币不足则继续自给。</p><p class="fine-print">采集：采矿、钓鱼、伐木、盗窃经验 +10%；灵药：普通工作与战斗经验 +10%。猎人：提高产物、掉落及收菜返种品质。战士：命中 +10、最大伤害 +10%，法师也适用。疾行：新路程速度 +20%；急速：攻击速度 +20%；滋养：食物治疗 +25%；深渊：普通怪金币 +25%。以上为普通品质数值。</p><p class="fine-print">不保证断货或离仓时药效不断。富余作物按收益补战斗减伤；临时增益不降低安全携粮量。</p></details>
                </details>
              </div>
            </details>
            <p class="muted setting-note" data-supplies-assist hidden>辅助模式下无需配置物资、装备与市场，助手不会安排相关任务。</p>
          </div>

          <div role="tabpanel" id="dv-panel-logs" aria-labelledby="dv-tab-logs" tabindex="0" hidden>
            <details data-diagnostics-details open>
              <summary>运行记录与诊断</summary>
              <div class="detail-content">
                <ol></ol>
                <button data-export>导出运行记录</button>
                <details data-rejection-details hidden>
                  <summary>服务器拒绝记录</summary>
                  <p data-rejections class="muted"></p>
                  <button data-export-rejections>导出故障记录</button>
                  <p class="fine-print">最近 10 次仅保存在本机，刷新保留。公会提示不打断练级；同期操作仅作排查线索。记录不触发重试，未知错误仍会暂停。</p>
                </details>
                <p data-client class="fine-print"></p>
              </div>
            </details>
            <details data-update-details open>
              <summary>脚本更新<span class="muted">v${SCRIPT_VERSION} · 构建 ${SCRIPT_BUILT}</span></summary>
              <div class="detail-content">
                <p data-update-status role="status" class="muted"></p>
                <div class="update-actions">
                  <button data-update-check title="每分钟最多检查一次">检查更新</button>
                  <a data-update-install target="_blank" rel="noopener noreferrer">安装／更新</a>
                </div>
                <p class="fine-print">油猴可按自身设置自动更新；已打开的游戏页需刷新才能运行新版，不强制刷新或打断任务。</p>
              </div>
            </details>
          </div>
        </div>
        <div class="footer"><span>DEEP VEIN IDLE</span><span>成长策略 · 物资预算 · v${SCRIPT_VERSION}</span></div>
      </div>
    </section>`;
    document.body.append(host);
    const saveAutomation=()=>{
      const read=selector=>panel.querySelector(selector).value;
      automation=normalizeAutomation({...automation,bossStart:read('[data-boss-start]')||'00:00',bossEnd:read('[data-boss-end]')||'24:00',
        skipPercent:read('[data-boss-skip]'),harvestMode:read('[data-harvest-mode]'),delayMin:read('[data-delay-min]'),delayMax:read('[data-delay-max]')});
      trainer.boss.setAutomation(automation);planner.automation=automation;
      try {localStorage.setItem(automationKey,JSON.stringify(automation));}catch{trainer.log('Boss／收菜设置无法保存，本次修改仍在当前页面生效');}
      render();
    };
    for(const selector of ['[data-boss-start]','[data-boss-end]','[data-boss-skip]','[data-harvest-mode]','[data-delay-min]','[data-delay-max]'])
      panel.querySelector(selector).onchange=saveAutomation;
    panel.querySelector('[data-boss-participation]').onchange=event=>{
      const value=trainer.boss.setParticipation(event.currentTarget.value);
      try {localStorage.setItem(bossParticipationKey,value);}catch{}
      saveRun();render();
    };
    panel.querySelector('[data-boss-retry]').onclick=()=>{
      if(!trainer.active||!trainer.boss.retrySkipped())return;
      trainer.plan=null;trainer.nextAction=0;
      trainer.syncAfter=trainer.snapshotSequence;trainer.nextSync=0;
      trainer.log('重新检查本轮 Boss，先同步当前任务和队列');
      saveRun();render();pump();
    };
    const section=panel.querySelector('section'),dragHandle=panel.querySelector('.run-state');
    const positionKey='deepvein-helper-position-v1';
    let position=null,drag=null;
    try {
      const saved=JSON.parse(localStorage.getItem(positionKey)||'null');
      if(Array.isArray(saved)&&saved.length===2&&saved.every(Number.isFinite))position=saved;
    }catch{}
    function placePanel() {
      if(!position||section.getAttribute('data-integrated')==='true')return;
      const rect=section.getBoundingClientRect();
      host.setAttribute('data-positioned','true');
      host.style.right='auto';
      host.style.left=`${Math.max(8,Math.min(position[0],innerWidth-rect.width-8))}px`;
      host.style.top=`${Math.max(8,Math.min(position[1],innerHeight-rect.height-8))}px`;
    }
    dragHandle.onpointerdown=event=>{
      if(!panel.querySelector('.body').hidden||event.button!==0||!event.isPrimary)return;
      const rect=section.getBoundingClientRect();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};
      dragHandle.setPointerCapture(event.pointerId);event.preventDefault();
    };
    dragHandle.onpointermove=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved&&Math.hypot(dx,dy)<4)return;
      drag.moved=true;section.setAttribute('data-dragging','true');
      position=[drag.left+dx,drag.top+dy];placePanel();
    };
    dragHandle.onpointerup=dragHandle.onpointercancel=dragHandle.onlostpointercapture=event=>{
      if(!drag||drag.id!==event.pointerId)return;
      if(drag.moved) {
        const rect=section.getBoundingClientRect();position=[rect.left,rect.top];
        try {localStorage.setItem(positionKey,JSON.stringify(position));}catch{}
      }
      drag=null;section.setAttribute('data-dragging','false');
      if(dragHandle.hasPointerCapture(event.pointerId))dragHandle.releasePointerCapture(event.pointerId);
    };
    addEventListener('resize',placePanel);
    new ResizeObserver(placePanel).observe(section);
    placePanel();
    for(const selector of ['[data-update-badge]','[data-update-install]'])panel.querySelector(selector).href=updates.state.installUrl;
    panel.querySelector('[data-update-check]').onclick=()=>updates.check(true);
    panel.querySelector('[data-farming-mode]').onchange=event=>changeFarmingPreference(event.currentTarget.value,planner.farmingPreference().jobId);
    panel.querySelector('[data-farming-crop]').onchange=event=>changeFarmingPreference('manual',Number(event.currentTarget.value));
    panel.querySelector('[data-auto-sell]').onchange=event=>{
      autoSell=event.currentTarget.checked===true;
      economy.setAutoSell(autoSell);market.setAutoSell(autoSell);planner.resetSpecialization();
      try {localStorage.setItem(autoSellKey,String(autoSell));}
      catch {trainer.log('出售设置未能保存，刷新后默认关闭');}
      render();
    };
    const purchaseToggle=panel.querySelector('[data-purchase-enabled]');
    purchaseToggle.checked=procurement.enabled;
    purchaseToggle.onchange=()=>{
      const next={enabled:purchaseToggle.checked};
      try {localStorage.setItem(procurementKey,JSON.stringify(next));procurement=market.configureProcurement(next);}
      catch {purchaseToggle.checked=procurement.enabled;trainer.log('采购设置未能保存，本次修改未生效');}
      render();
    };
    panel.querySelector('[data-potion-restock]').onchange=event=>{
      potionRestock=event.currentTarget.checked===true;
      try {localStorage.setItem(potionRestockKey,String(potionRestock));}
      catch {potionRestock=false;trainer.log('补药设置无法保存，自动补药已关闭');}
      if(!potionRestock&&trainer.player)market.watchPotions(trainer.player,[]);
      render();
    };
    panel.querySelector('[data-auto-fallback]').onchange=event=>{
      autoFallback=event.currentTarget.checked===true;trainer.autoFallback=autoFallback;
      // Turning it back on resumes management of a fallback the player had cleared.
      if(autoFallback&&trainer.player&&!trainer.player.fallback&&trainer.fallbackOwned[trainer.player.id]) {
        const {[trainer.player.id]:cleared,...rest}=trainer.fallbackOwned;trainer.fallbackOwned=rest;saveFallbackOwned(rest);
      }
      trainer.fallbackCheckedAt=0;
      try {localStorage.setItem(autoFallbackKey,String(autoFallback));}
      catch {trainer.log('后备活动设置无法保存，刷新后恢复为开启');}
      render();
    };
    panel.querySelector('[data-auto-housing]').onchange=event=>{
      autoHousing=event.currentTarget.checked===true;planner.setHousingEnabled?.(autoHousing);
      try {localStorage.setItem(autoHousingKey,String(autoHousing));}
      catch {trainer.log('房屋设置无法保存，刷新后恢复为开启');}
      render();
    };
    panel.querySelector('[data-clear-queue]').onclick=()=>{
      try{trainer.clearGameQueue();}catch(error){trainer.log(`清空游戏队列未完成：${error.message}`);}
      render();
    };
    panel.querySelector('[data-auto-seed-quality]').onchange=event=>{
      autoSeedQuality=event.currentTarget.checked===true;planner.autoSeedQuality=autoSeedQuality;
      try {localStorage.setItem(autoSeedQualityKey,String(autoSeedQuality));}
      catch {trainer.log('选种设置无法保存，刷新后恢复为开启');}
      render();
    };
    panel.querySelector('[data-sell-crafted]').onchange=event=>{
      sellCrafted=event.currentTarget.checked===true;economy.setSellCrafted(sellCrafted);
      try {localStorage.setItem(sellCraftedKey,String(sellCrafted));}
      catch {trainer.log('出售制作产出设置无法保存，刷新后恢复为开启');}
      render();
    };
    panel.querySelector('[data-sale-pricing]').onchange=event=>{
      salePricing=event.currentTarget.value==='bid'?'bid':'list';market.setSalePricing(salePricing);
      try {localStorage.setItem(salePricingKey,salePricing);}
      catch {trainer.log('出售方式无法保存，刷新后恢复为挂单');}
      planner.resetSpecialization();render();
    };
    panel.querySelector('[data-capacity-sales]').onchange=event=>{
      capacitySales=event.currentTarget.checked===true;
      try {localStorage.setItem(capacitySalesKey,String(capacitySales));}
      catch {capacitySales=false;trainer.log('满仓清理设置无法保存，本页已关闭');}
      economy.setCapacitySales(capacitySales);market.setCapacitySales(capacitySales);render();
    };
    panel.querySelector('[data-mode]').onchange=event=>{
      ++startCheck;checking=false;
      trainer.setMode(event.currentTarget.value);releaseLease();
      try {localStorage.setItem(modeKey,trainer.mode);}
      catch {trainer.log('策略已切换，但无法保存偏好；刷新后默认均衡成长');}
      render();
    };
    panel.querySelector('[data-profit-floor]').onchange=event=>setProfitFloor(Number(event.currentTarget.value));
    panel.querySelector('[data-main-trade]').onchange=event=>{
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainTrade(event.currentTarget.value);
      if(trainer.mode==='business')releaseLease();
      try {
        localStorage.setItem(mainTradeKey,trainer.mainTrade);
        localStorage.setItem(mainJobKey,JSON.stringify(trainer.mainJobId));
        localStorage.setItem(mainMonsterKey,JSON.stringify(trainer.mainMonsterId));
      }
      catch {trainer.log('主业已切换，但无法保存偏好；刷新后自动选择主业');}
      render();
    };
    panel.querySelector('[data-main-job]').onchange=event=>{
      const jobId=event.currentTarget.value===''?null:validMainJob(Number(event.currentTarget.value),trainer.mainTrade);
      if(jobId===trainer.mainJobId)return;
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainJob(jobId);
      if(trainer.mode==='business')releaseLease();
      try {localStorage.setItem(mainJobKey,JSON.stringify(trainer.mainJobId));}
      catch {trainer.log('具体工作已切换，但无法保存；刷新后恢复原设置');}
      render();
    };
    panel.querySelector('[data-main-monster]').onchange=event=>{
      const monsterId=event.currentTarget.value===''?null:validMainMonster(Number(event.currentTarget.value),trainer.mainTrade);
      if(monsterId===trainer.mainMonsterId)return;
      if(trainer.mode==='business'){++startCheck;checking=false;}
      trainer.setMainMonster(monsterId);
      if(trainer.mode==='business')releaseLease();
      try {localStorage.setItem(mainMonsterKey,JSON.stringify(trainer.mainMonsterId));}
      catch {trainer.log('目标怪物已切换，但无法保存；刷新后恢复原设置');}
      render();
    };
    panel.querySelector('[data-profession]').onchange=event=>{
      ++startCheck; checking=false;
      trainer.setStyle(event.currentTarget.value); releaseLease();
      try { localStorage.setItem(styleKey,trainer.style); }
      catch { trainer.log('职业已切换，但无法保存偏好；刷新后默认法师'); }
      render();
    };
    panel.querySelector('[data-hot-enabled]').onchange=event=>{
      window.setHotFollow({enabled:event.currentTarget.checked===true});
    };
    panel.querySelectorAll('[data-hot-side]').forEach(input=>{
      input.onchange=()=>{
        const skill=input.getAttribute('data-hot-side');
        const cur=trainer.getHotFollow();
        let sides=cur.sides||[];
        if(input.checked) {
          if(!sides.includes(skill)) sides=[...sides,skill];
        } else {
          sides=sides.filter(s=>s!==skill);
        }
        window.setHotFollow({sides});
      };
    });
    panel.querySelector('[data-hot-count-rarity]').onchange=event=>{
      window.setHotFollow({countRarity:event.currentTarget.checked===true});
    };
    panel.querySelector('[data-hot-min-minutes]').onchange=event=>{
      const val=Math.max(3,Math.min(20,Number(event.currentTarget.value)||8));
      event.currentTarget.value=String(val);
      window.setHotFollow({minMinutes:val});
    };
    panel.querySelector('[data-fold]').onclick=event=>{
      const body=panel.querySelector('.body'); body.hidden=!body.hidden;
      panel.querySelector('section').setAttribute('data-folded',String(body.hidden));
      event.currentTarget.textContent=body.hidden?'+':'−';
      event.currentTarget.setAttribute('aria-label',body.hidden?'展开面板':'收起面板');
      event.currentTarget.setAttribute('aria-expanded',String(!body.hidden));
      dragHandle.title=body.hidden?'按住拖动助手位置':'';
      placePanel();
    };
    panel.querySelector('[data-start]').onclick=()=>startScheduling();
    panel.querySelector('[data-item-target-quantity]').value='100';
    panel.querySelector('[data-item-target-search]').oninput=event=>{targetSearch=event.currentTarget.value.trim().toLowerCase();render();};
    panel.querySelector('[data-item-target-item]').onchange=event=>{targetSelection=event.currentTarget.value;};
    panel.querySelector('[data-item-target-start]').onclick=()=>{
      const select=panel.querySelector('[data-item-target-item]');
      if(select.disabled||!select.value)return;
      return startScheduling({itemId:Number(select.value),quantity:Number(panel.querySelector('[data-item-target-quantity]').value)});
    };
    panel.querySelector('[data-item-target-cancel]').onclick=()=>{
      ++startCheck;checking=false;trainer.cancelItemTarget();render();
    };
    panel.querySelector('[data-pause]').onclick=()=>pauseScheduling();
    panel.querySelector('[data-equipment-details]').ontoggle=()=>{rendered='';render();};
    panel.querySelector('[data-export]').onclick=()=>{
      const report={version:SCRIPT_VERSION,exportedAt:new Date().toISOString(),client:GAME_DATA.client,
        profession:trainer.style,mode:trainer.mode,mainTrade:trainer.mainTrade,mainJobId:trainer.mainJobId,mainMonsterId:trainer.mainMonsterId,itemTarget:trainer.itemTargetStatus(),farmingPreference:planner.farmingPreference(),autoSell,potionRestock,capacitySales,boss:trainer.boss.status(trainer.player),metrics:trainer.telemetry.summary(),history:trainer.history,rejections,
        bossLoot:bossLoot.diagnostics(),
        goal:trainer.goal,waitingGoals:trainer.waitingGoals,blocked:trainer.blockedReasons,market:market.summary(),
        growth:trainer.player&&trainer.mode==='balanced'?planner.growthStatus(trainer.player,trainer.style,trainer.deferred):null,
        specialization:trainer.player&&trainer.mode==='business'?planner.specializationStatus(trainer.player,trainer.style,trainer.mainTrade,trainer.mainJobId,trainer.mainMonsterId):null,
        quests:trainer.player?planner.questRead(trainer.player):[],
        equipment:trainer.player?planner.equipmentStatus(trainer.player,trainer.style):null};
      const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='deepvein-run-report.json';link.click();
      URL.revokeObjectURL(url);
    };
    panel.querySelector('[data-export-rejections]').onclick=()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify({version:SCRIPT_VERSION,rejections},null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='deepvein-rejections.json';link.click();URL.revokeObjectURL(url);
    };
    const tabKey='deepvein-helper-ui-tab-v1';
    const tabs=Array.from(panel.querySelectorAll('[role="tab"]'));
    const tabpanels=Array.from(panel.querySelectorAll('[role="tabpanel"]'));
    // Tabs merged in v0.8.0: 目标 → 策略, 数据 → 总览, 更新 → 诊断.
    const MOVED_TABS={'dv-tab-target':'dv-tab-strategy','dv-tab-stats':'dv-tab-overview','dv-tab-update':'dv-tab-logs'};
    function switchTab(targetId,focus=false) {
      const targetTab=panel.querySelector(`#${MOVED_TABS[targetId]??targetId}`)||tabs[0];
      if(!targetTab)return;
      for(const tab of tabs) {
        const isSelected=tab===targetTab;
        tab.setAttribute('aria-selected',String(isSelected));
        tab.setAttribute('tabindex',isSelected?'0':'-1');
        if(isSelected&&focus)tab.focus();
      }
      const targetPanelId=targetTab.getAttribute('aria-controls');
      for(const p of tabpanels) p.hidden=p.id!==targetPanelId;
      try{localStorage.setItem(tabKey,targetTab.id);}catch{}
    }
    let savedTab=null;
    try{savedTab=localStorage.getItem(tabKey);}catch{}
    switchTab(savedTab||'dv-tab-overview');
    const tablist=panel.querySelector('[role="tablist"]');
    tablist.onclick=event=>{
      const tab=event.target.closest('[role="tab"]');
      if(tab){switchTab(tab.id);render();}
    };
    tablist.onkeydown=event=>{
      const tab=event.target.closest('[role="tab"]');
      if(!tab)return;
      const index=tabs.indexOf(tab);
      if(index===-1)return;
      let nextIndex=null;
      if(event.key==='ArrowRight'||event.key==='ArrowDown') nextIndex=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp') nextIndex=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home') nextIndex=0;
      else if(event.key==='End') nextIndex=tabs.length-1;
      if(nextIndex!==null){
        event.preventDefault();
        switchTab(tabs[nextIndex].id,true);render();
      }
    };

    // === 游戏 UI 融合（规格 §2、§3、§5、§6、§7、§8） ===
    if (!document.getElementById('dvh-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'dvh-styles';
      styleEl.setAttribute('data-no-i18n', '');
      styleEl.textContent = `
        .nav-icon.dvh-nav {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 44px; height: 40px; gap: 0; padding: 0; border: 0; border-radius: 6px;
          background: transparent; box-shadow: none; color: var(--ink, #f5e6c8); cursor: pointer;
        }
        .nav-icon.dvh-nav svg {
          width: 24px; height: 24px; opacity: 1; image-rendering: pixelated;
          filter: drop-shadow(0 2px 0 rgb(0 0 0 / 45%));
        }
        html.v4:not(.m-on) .nav-icon.dvh-nav:hover { background: #ffdcaa12; }
        html.v4:not(.m-on) .nav-icon.dvh-nav[aria-pressed=true] {
          background: #e8b25a29; box-shadow: inset 0 0 0 1px #e8b25a8c; color: #ffe2a8;
        }
        html.v4[data-theme=light] .nav-icon.dvh-nav[aria-pressed=true] { color: var(--ink, #3d2612); }
        .dvh-nav .nav-badge-dot {
          position: absolute; top: 3px; right: 3px; width: 9px; height: 9px; min-width: 9px;
          padding: 0; border-radius: 50%; background: var(--brass, #e8b25a);
          box-shadow: 0 0 0 2px var(--panel, #26180e);
        }
        html.v4:not(.m-on) #app .nav-strip.vertical .nav-icon.dvh-nav[aria-label]::after {
          content: attr(aria-label); position: absolute; right: calc(100% + 10px); top: 50%;
          transform: translateY(-50%); padding: 5px 9px; border-radius: 5px; white-space: nowrap;
          background: var(--lg-dark, #26180e); box-shadow: inset 0 0 0 1px #c79352b3, 0 4px 10px -4px #0000008c;
          font: 800 12px/1 "Mulish", sans-serif; color: inherit; text-shadow: 0 1px 0 rgb(0 0 0 / 60%);
          opacity: 0; pointer-events: none; transition: opacity .12s ease;
        }
        html.v4:not(.m-on) #app .nav-strip.vertical .nav-icon.dvh-nav[aria-label]:is(:hover, :focus-visible)::after {
          opacity: 1;
        }

        #dvh-panel.dvh-panel {
          position: fixed; z-index: 9;
          right: calc((var(--hotbar-w, 56px) + 13px) * var(--ui-zoom, 1));
          bottom: 1px; width: min(var(--lg-dock-w, 340px) * var(--ui-zoom, 1), calc(100vw - 80px));
          max-width: 360px;
          max-height: calc(100vh - 140px); max-height: calc(100dvh - 140px);
          display: flex; flex-direction: column; overflow: hidden;
          border: 1px solid transparent; border-radius: 8px;
          background:
            var(--lg-dark, radial-gradient(ellipse 120% 80% at 50% 0%, #3b2717 0%, #25170d 65%, #1d1209 100%)) padding-box,
            var(--lg-grain, repeating-linear-gradient(90deg, rgb(0 0 0/12%) 0 1px, transparent 1px 4px, rgb(255 220 170/6%) 4px 5px, transparent 5px 9px)) border-box,
            var(--lg-wood, linear-gradient(135deg, #9a6632 0%, #6e411d 28%, #a26d37 52%, #5f3616 78%, #83502a 100%)) border-box;
          box-shadow: inset 0 0 0 1px rgb(199 147 82 / 70%), 0 0 0 1px #1f1108, 0 9px 22px -6px rgb(0 0 0 / 60%);
          color: var(--ink, #f5e6c8); font: 13.5px/1.4 "Mulish", ui-sans-serif, system-ui, sans-serif;
          box-sizing: border-box; animation: board-in .32s cubic-bezier(.2,.8,.2,1) both;
        }
        #dvh-panel[hidden] { display: none !important; }
        .dvh-panel > h2 {
          display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0;
          padding: 12px 16px 10px; border-bottom: 2px solid rgb(0 0 0 / 30%); box-shadow: 0 1px #ffdcaa14;
          font: 800 24px/1.05 "Mulish", ui-sans-serif, sans-serif; color: var(--ink, #f5e6c8);
        }
        .dvh-panel > h2 [data-dvh-meta] {
          margin-left: auto; font: 700 12px/1.2 "Mulish", sans-serif; color: var(--ink-faint, #ab9270);
        }
        .dvh-close {
          width: 28px; height: 28px; border: 0; border-radius: 50%;
          background: linear-gradient(180deg, #a86d34, #6e3f18); color: #fff3dc;
          box-shadow: inset 0 0 0 2px #d9a560, 0 0 0 2px #3b2210;
          font-size: 18px; line-height: 1; display: flex; align-items: center; justify-content: center;
          cursor: pointer; padding: 0; margin-left: 8px; transition: transform .12s ease;
        }
        .dvh-close:hover { transform: scale(1.08); }
        .dvh-close:active { transform: scale(0.95); }
        /* One scroll area: the helper's own (dark) panels container inside the
           shadow root. The body only clips; the host shrinks to fit it. */
        .dvh-body {
          flex: 1 1 auto; min-height: 0; overflow: hidden; padding: 0; display: flex; flex-direction: column;
        }

        .dvh-bar {
          position: fixed; z-index: 9; display: flex; align-items: center; gap: 8px; min-height: 34px;
          padding: 4px 6px 4px 10px; border: 1px solid transparent; border-radius: 6px;
          background:
            var(--lg-dark, radial-gradient(ellipse 120% 80% at 50% 0%, #3b2717 0%, #25170d 65%, #1d1209 100%)) padding-box,
            var(--lg-wood, linear-gradient(135deg, #9a6632, #6e411d 28%, #a26d37 52%, #5f3616 78%, #83502a)) border-box;
          box-shadow: inset 0 0 0 1px #c79352b3, 0 4px 10px -4px #0000008c;
          color: var(--ink, #f5e6c8); font: 700 12px/1.3 "Mulish", ui-sans-serif, sans-serif;
          box-sizing: border-box; cursor: pointer; user-select: none; transition: opacity .15s ease;
        }
        .dvh-bar[hidden] { display: none !important; }
        .dvh-bar-state {
          flex: none; padding: 1px 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px #c7935266;
          color: var(--brass, #e8b25a); font-weight: 800; font-size: 11px;
        }
        .dvh-bar-state[data-state=running] { color: var(--moss, #9ed36b); box-shadow: inset 0 0 0 1px #9ed36b80; }
        .dvh-bar-state[data-state=paused] { color: var(--ink-faint, #ab9270); box-shadow: inset 0 0 0 1px #ab927066; }
        .dvh-bar-state[data-state=error] { color: var(--rust, #ec7a5a); box-shadow: inset 0 0 0 1px #ec7a5a80; }
        .dvh-bar-state[data-state=checking] { color: var(--brass-bright, #f5c572); }

        .dvh-bar-what {
          flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 11.5px; color: var(--ink, #f5e6c8);
        }
        .dvh-bar-progress {
          flex: 0 0 64px; height: 6px; border-radius: 3px; background: var(--panel-sunken, #120a05);
          box-shadow: inset 0 0 0 1px var(--edge, #4d3219); overflow: hidden; display: block;
        }
        .dvh-bar-progress[hidden] { display: none !important; }
        .dvh-bar-progress > b {
          display: block; height: 100%; background: linear-gradient(180deg, #ffd06a, #c98a1e);
          transition: width 180ms ease;
        }
        .dvh-bar-toggle {
          flex: none; padding: 4px 12px; min-height: 26px; border: 0; border-radius: 6px;
          background: linear-gradient(180deg, #f5c572, #c98a2c); color: #2a1706;
          font: 800 12px/1.2 "Mulish", sans-serif;
          box-shadow: inset 0 0 0 2px #ffe0a0, 0 0 0 2px #4a2a0c, 0 3px #4a2a0c;
          text-shadow: 0 1px 0 rgb(255 240 200 / 55%); cursor: pointer; outline: none;
        }
        .dvh-bar-toggle:hover { background: linear-gradient(180deg, #ffd488, #d89a38); }
        .dvh-bar-toggle:active { transform: translateY(3px); box-shadow: inset 0 0 0 2px #ffe0a0, 0 0 0 2px #4a2a0c; }
        .dvh-bar-toggle:focus-visible { outline: 2px solid #f5c572; outline-offset: 2px; }
      `;
      (document.head || document.documentElement).append(styleEl);
    }

    function isShown(el) {
      if (!el || !el.isConnected) return false;
      const rects = el.getClientRects();
      if (!rects.length) return false;
      const r = rects[0];
      if (r.width <= 0 || r.height <= 0) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden';
    }

    function ensurePanel() {
      let panelEl = document.getElementById('dvh-panel');
      if (!panelEl) {
        panelEl = document.createElement('section');
        panelEl.id = 'dvh-panel';
        panelEl.className = 'dvh-panel';
        panelEl.setAttribute('data-no-i18n', '');
        panelEl.setAttribute('role', 'dialog');
        panelEl.setAttribute('aria-labelledby', 'dvh-title');
        panelEl.hidden = true;
        panelEl.innerHTML = `
          <h2>
            <span id="dvh-title">脚本助手</span>
            <span data-dvh-meta>v${SCRIPT_VERSION} · ${SCRIPT_BUILT} · 待机</span>
            <button type="button" class="dvh-close" aria-label="关闭">×</button>
          </h2>
          <div class="dvh-body"></div>
        `;
        panelEl.querySelector('.dvh-close').onclick = () => setPanelOpen(false);
        document.body.append(panelEl);
      }
      return panelEl;
    }

    function ensureBar() {
      let bar = document.querySelector('[data-dvh-bar]');
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'dvh-bar';
        bar.setAttribute('data-dvh-bar', '');
        bar.setAttribute('data-no-i18n', '');
        bar.hidden = true;
        bar.innerHTML = `
          <b class="dvh-bar-state" data-state="idle" role="status" aria-live="polite">待机</b>
          <span class="dvh-bar-what">等待游戏状态</span>
          <span class="dvh-bar-progress" hidden><b style="width:0%"></b></span>
          <button type="button" class="dvh-bar-toggle">开始</button>
        `;
        bar.onclick = event => {
          if (event.target.closest('.dvh-bar-toggle')) return;
          togglePanel();
        };
        bar.querySelector('.dvh-bar-toggle').onclick = event => {
          event.stopPropagation();
          if (checking || trainer.active || trainer.recovery) {
            pauseScheduling();
          } else {
            startScheduling();
          }
        };
        document.body.append(bar);
      }
      return bar;
    }

    function mountNavButton(strip) {
      let navBtn = strip.querySelector('[data-dvh-nav]');
      let sep = strip.querySelector('[data-dvh-sep]');
      if (!navBtn) {
        navBtn = document.createElement('button');
        navBtn.type = 'button';
        navBtn.className = 'nav-icon dvh-nav';
        navBtn.setAttribute('data-dvh-nav', '');
        navBtn.setAttribute('data-no-i18n', '');
        navBtn.setAttribute('aria-label', '脚本助手');
        navBtn.setAttribute('data-tip', '脚本助手');
        navBtn.setAttribute('aria-pressed', 'false');
        navBtn.setAttribute('aria-haspopup', 'dialog');
        navBtn.setAttribute('aria-controls', 'dvh-panel');
        navBtn.innerHTML = `
          <svg viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" aria-hidden="true">
            <rect x="6" y="1" width="4" height="2" fill="#e8b25a"/>
            <rect x="6" y="13" width="4" height="2" fill="#e8b25a"/>
            <rect x="1" y="6" width="2" height="4" fill="#e8b25a"/>
            <rect x="13" y="6" width="2" height="4" fill="#e8b25a"/>
            <rect x="3" y="3" width="10" height="10" rx="1" fill="#9a6632"/>
            <rect x="4" y="4" width="8" height="8" fill="#3b2717"/>
            <rect x="6" y="6" width="4" height="4" fill="#f5c572"/>
            <rect x="7" y="7" width="2" height="2" fill="#231509"/>
            <rect x="7" y="3" width="2" height="2" fill="#ffd06a"/>
            <rect x="7" y="11" width="2" height="2" fill="#ffd06a"/>
            <rect x="3" y="7" width="2" height="2" fill="#ffd06a"/>
            <rect x="11" y="7" width="2" height="2" fill="#ffd06a"/>
          </svg>
          <b class="nav-badge nav-badge-dot" data-dvh-badge hidden></b>
        `;
        navBtn.onclick = () => togglePanel();
      }

      if (!sep) {
        sep = document.createElement('span');
        sep.className = 'nav-sep';
        sep.setAttribute('role', 'separator');
        sep.setAttribute('data-dvh-sep', '');
        sep.setAttribute('data-no-i18n', '');
      }

      const moreBtn = strip.querySelector('[data-nav-more]') || strip.querySelector('.nav-more-menu');
      if (navBtn.parentElement !== strip || navBtn.nextElementSibling !== (moreBtn || null)) {
        if (moreBtn) {
          strip.insertBefore(navBtn, moreBtn);
        } else {
          strip.append(navBtn);
        }
      }
      if (sep.parentElement !== strip || sep.nextElementSibling !== navBtn) {
        strip.insertBefore(sep, navBtn);
      }
      return navBtn;
    }

    function setPanelOpen(open) {
      const panelEl = ensurePanel();
      const prevOpen = !panelEl.hidden;
      panelEl.hidden = !open;
      const navBtn = document.querySelector('[data-dvh-nav]');
      if (navBtn) navBtn.setAttribute('aria-pressed', String(open));
      if (open) {
        updatePanelPosition();
        render();
        panelEl.querySelector('.dvh-close')?.focus();
      } else if (prevOpen) {
        const active = document.activeElement;
        if (active && (panelEl.contains(active) || host.contains(active) || panel.activeElement)) {
          navBtn?.focus();
        }
      }
    }
    function togglePanel() {
      const panelEl = ensurePanel();
      setPanelOpen(panelEl.hidden);
    }

    function updatePanelPosition() {
      const panelEl = document.getElementById('dvh-panel');
      if (!panelEl || panelEl.hidden) return;
      const strip = document.querySelector('#app .shell > nav.nav-strip');
      if (strip && isShown(strip)) {
        const stripRect = strip.getBoundingClientRect();
        if (strip.classList.contains('vertical')) {
          panelEl.style.right = `${Math.max(8, innerWidth - stripRect.left + 12)}px`;
          panelEl.style.bottom = `${Math.max(1, innerHeight - stripRect.bottom)}px`;
          panelEl.style.top = 'auto';
        } else {
          panelEl.style.right = '12px';
          if (stripRect.top < innerHeight / 2) {
            panelEl.style.top = `${Math.max(8, stripRect.bottom + 12)}px`;
            panelEl.style.bottom = 'auto';
          } else {
            panelEl.style.bottom = `${Math.max(1, innerHeight - stripRect.top + 12)}px`;
            panelEl.style.top = 'auto';
          }
        }
      }
    }

    function updateBarPosition() {
      const bar = document.querySelector('[data-dvh-bar]');
      if (!bar || bar.hidden) return;
      const routes = document.querySelector('#app .shell .panels > section.routes') || document.querySelector('#app .shell .routes');
      if (!routes || !isShown(routes)) {
        bar.hidden = true;
        return;
      }
      const rect = routes.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        bar.hidden = true;
        return;
      }
      bar.style.left = `${rect.left}px`;
      bar.style.width = `${rect.width}px`;
      if (innerHeight - rect.bottom < rect.top) {
        bar.style.bottom = `${innerHeight - rect.top + 6}px`;
        bar.style.top = 'auto';
      } else {
        bar.style.top = `${rect.bottom + 6}px`;
        bar.style.bottom = 'auto';
      }
    }

    function checkIntegration() {
      const html = document.documentElement;
      const shell = document.querySelector('#app .shell');
      const strip = document.querySelector('#app .shell > nav.nav-strip');
      const routes = document.querySelector('#app .shell .panels > section.routes') || document.querySelector('#app .shell .routes');
      const isDesktopV4 = html.classList.contains('v4') && !html.classList.contains('m-on');
      const isNavVisible = isDesktopV4 && isShown(strip);
      const isRoutesVisible = isDesktopV4 && isShown(routes) && !shell?.classList.contains('ui-editing');
      return { isDesktopV4, isNavVisible, isRoutesVisible, strip, routes };
    }

    let wasFolded = false;
    let routesObserver = null;
    let observedRoutes = null;

    function updateRoutesObserver(routes, shouldObserve) {
      if (!shouldObserve || !routes) {
        if (routesObserver) {
          routesObserver.disconnect();
          routesObserver = null;
          observedRoutes = null;
        }
        return;
      }
      if (routes !== observedRoutes) {
        if (routesObserver) routesObserver.disconnect();
        if (typeof ResizeObserver === 'function') {
          routesObserver = new ResizeObserver(() => updateBarPosition());
          routesObserver.observe(routes);
          observedRoutes = routes;
        }
      }
    }

    function syncIntegration() {
      const { isNavVisible, isRoutesVisible, strip, routes } = checkIntegration();
      const theme = document.documentElement.getAttribute('data-theme') || (document.documentElement.classList.contains('v4') && document.documentElement.dataset.theme) || 'dark';
      host.setAttribute('data-theme', theme);

      if (isNavVisible) {
        mountNavButton(strip);
        const panelEl = ensurePanel();
        const dvhBody = panelEl.querySelector('.dvh-body');
        if (host.parentElement !== dvhBody) {
          dvhBody.append(host);
          host.style.cssText = 'position:static;z-index:auto;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;';
          const section = panel.querySelector('section');
          if (section) section.setAttribute('data-integrated', 'true');
        }

        drag = null;
        section.setAttribute('data-dragging', 'false');

        const bodyEl = panel.querySelector('.body');
        if (bodyEl && bodyEl.hidden) {
          wasFolded = true;
          bodyEl.hidden = false;
          section.setAttribute('data-folded', 'false');
          const foldBtn = panel.querySelector('[data-fold]');
          if (foldBtn) {
            foldBtn.textContent = '−';
            foldBtn.setAttribute('aria-label', '收起面板');
            foldBtn.setAttribute('aria-expanded', 'true');
          }
        }

        const bar = ensureBar();
        if (isRoutesVisible) {
          bar.hidden = false;
          updateRoutesObserver(routes, true);
          updateBarPosition();
        } else {
          bar.hidden = true;
          updateRoutesObserver(null, false);
        }
        updatePanelPosition();
      } else {
        updateRoutesObserver(null, false);
        if (host.parentElement !== document.body) {
          document.body.append(host);
          host.style.cssText = 'position:fixed;right:12px;top:60px;z-index:2147483646;';
          section.removeAttribute('data-integrated');

          if (wasFolded) {
            const bodyEl = panel.querySelector('.body');
            if (bodyEl) {
              bodyEl.hidden = true;
              section.setAttribute('data-folded', 'true');
              const foldBtn = panel.querySelector('[data-fold]');
              if (foldBtn) {
                foldBtn.textContent = '+';
                foldBtn.setAttribute('aria-label', '展开面板');
                foldBtn.setAttribute('aria-expanded', 'false');
              }
            }
            wasFolded = false;
          }
          placePanel();
        }
        const panelEl = document.getElementById('dvh-panel');
        if (panelEl) panelEl.hidden = true;
        const bar = document.querySelector('[data-dvh-bar]');
        if (bar) bar.hidden = true;
        const navBtn = document.querySelector('[data-dvh-nav]');
        const sep = document.querySelector('[data-dvh-sep]');
        if (navBtn) navBtn.remove();
        if (sep) sep.remove();
      }
    }

    let syncScheduled = false;
    function scheduleSync() {
      if (syncScheduled) return;
      syncScheduled = true;
      requestAnimationFrame(() => {
        syncScheduled = false;
        syncIntegration();
      });
    }

    const targetApp = document.getElementById('app') ?? document.body;
    const observer = new MutationObserver(scheduleSync);
    observer.observe(targetApp, { childList: true, subtree: true });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    let observedShell = null;
    function updateShellObserver() {
      const shell = document.querySelector('#app .shell');
      if (shell && shell !== observedShell) {
        observer.observe(shell, { attributes: true, attributeFilter: ['class'] });
        observedShell = shell;
      }
    }
    updateShellObserver();

    function onResize() {
      updateShellObserver();
      scheduleSync();
      updateBarPosition();
      updatePanelPosition();
    }
    window.addEventListener('resize', onResize);

    function onKeydown(event) {
      if (event.key === 'Escape') {
        if ([...document.querySelectorAll('.veil')].some(isShown)) return;
        const panelEl = document.getElementById('dvh-panel');
        if (panelEl && !panelEl.hidden) {
          setPanelOpen(false);
        }
      }
    }
    window.addEventListener('keydown', onKeydown);

    const intervalHandle = setInterval(() => {
      updateShellObserver();
      scheduleSync();
      updateBarPosition();
    }, 1500);

    integrationCleanup = () => {
      observer.disconnect();
      updateRoutesObserver(null, false);
      clearInterval(intervalHandle);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeydown);
    };

    syncIntegration();
    render();
    updates.check();
    prepareData().then(()=>{if(trainer.recovery||trainer.active)pump();prepareEngine();});
    refreshBuyback();setInterval(refreshBuyback,3600000);
    refreshPrices();setInterval(refreshPrices,300000);
  }
  function setProfitFloor(value) {
    profitFloor=validProfitFloor(value);planner.profitFloor=profitFloor;
    try {localStorage.setItem(profitFloorKey,String(profitFloor));}
    catch {trainer.log('最低收益设置无法保存，刷新后恢复为不限制');}
    render();
  }
  const SOURCE_LABELS={simulated:'引擎',measured:'实测',formula:'公式'};
  const fmt=n=>Number.isFinite(n)?Math.round(n).toLocaleString('zh-CN'):'—';
  const el=(tag,props={},children=[])=>{const node=Object.assign(document.createElement(tag),props);node.append(...children);return node;};
  // Rebuild a container only when its content changed (render runs every second).
  function fill(selector,signature,build) {
    const box=panel.querySelector(selector);
    if(!box||box.dataset.signature===signature)return;
    box.dataset.signature=signature;box.replaceChildren(...build());
  }
  function renderPlan(view) {
    // Game names (jobs, monsters, items) arrive in English; show them in Chinese.
    const set=(selector,text)=>{const node=panel.querySelector(selector),value=translateGameText(text??'');
      if(node&&node.textContent!==value)node.textContent=value;};
    if(!view) {
      set('[data-plan-layer]',trainer.player?'正在计算计划…':'等待游戏状态');
      return;
    }
    set('[data-plan-layer]',view.layer);
    set('[data-plan-action]',view.action?.label?`${view.action.label}${view.action.reason?`：${view.action.reason}`:''}`:view.message??'');
    set('[data-plan-goal]',view.goal?`目标：${view.goal.label??''}${view.goal.target?` → ${view.goal.target} 级`:''}`+
      `${view.goal.via?`（当前做 ${view.goal.via}）`:''}${view.goal.reason?`；${view.goal.reason}`:''}`:'尚未选择目标');
    set('[data-plan-basis]',view.mode==='experience'&&view.profitFloor>0?`最低收益 ${fmt(view.profitFloor)}/时`:'');
    // XP is compared only within one skill; gold across all skills.
    const table=(title,columns,list,cells)=>[el('p',{className:'label',textContent:title}),list.length?
      el('table',{className:'plan-table'},[el('thead',{},[el('tr',{},columns.map(text=>el('th',{textContent:text})))]),
        el('tbody',{},list.map(c=>{
          const row=el('tr',{},[el('td',{textContent:`${c.chosen?'★ ':''}${translateGameText(c.label)}`}),...cells(c).map(text=>el('td',{textContent:text})),
            el('td',{},[el('span',{className:'plan-source',textContent:SOURCE_LABELS[c.source]??c.source})])]);
          row.dataset.chosen=String(c.chosen);row.lastChild.firstChild.dataset.source=c.source;return row;
        }))]):el('p',{className:'muted',textContent:'暂无可比较的工作（等级、装备或供料条件不足）'})];
    fill('[data-plan-candidates]',JSON.stringify([view.xpSkill,view.xpAcross,view.xpCandidates,view.goldCandidates]),()=>[
      ...(view.xpAcross?table('经验优先：全部技能按经验/时比较',['任务','技能','经验/时','来源'],view.xpCandidates,
        c=>[c.skillName,fmt(c.xpH)]):
        view.xpSkill?table(`${view.xpSkillName}：同技能内按经验/时比较`,['任务','经验/时','金币/时','来源'],view.xpCandidates,
          c=>[fmt(c.xpH),fmt(c.coinsH)]):[]),
      ...table('全部技能按金币/时比较',['任务','技能','金币/时','来源'],view.goldCandidates,c=>[c.skillName,fmt(c.coinsH)])]);
    fill('[data-plan-quests]',JSON.stringify(view.quests),()=>view.quests.length?view.quests.map(q=>el('p',{className:'muted',
      textContent:`${q.period==='daily'?'每日（必做）':'每周'} · ${translateGameText(q.title)} ${q.done}/${q.goal} · ${q.status}`+
        (q.seconds?` 约 ${Math.ceil(q.seconds/60)} 分钟`:'')+(q.buys?' · 含市场补料':'')})):
      [el('p',{className:'muted',textContent:'今天的任务已全部领取'})]);
    set('[data-plan-funding]',view.funding?`筹资中：${view.funding.label}，目标 ${fmt(view.funding.gold)} 金币，剩 ${view.funding.minutesLeft} 分钟`:'');
    const hours=h=>h>=10?`${Math.round(h)} 小时`:`${h.toFixed(1)} 小时`;
    fill('[data-plan-investments]',JSON.stringify(view.investments),()=>view.investments.length?
      [el('table',{className:'plan-table'},[el('thead',{},[el('tr',{},['项目','花费','赚钱','省下','结论'].map(text=>el('th',{textContent:text})))]),
        el('tbody',{},view.investments.map(r=>el('tr',{},[el('td',{textContent:`${translateGameText(r.label)}${r.source?`（${r.source}）`:''}`}),
          el('td',{textContent:`${fmt(r.gold)} 金币`}),el('td',{textContent:hours(r.paidHours)}),el('td',{textContent:hours(r.savedHours)}),
          el('td',{textContent:r.funding?'筹资中':!r.worth?'不值得':!r.cheapest?'有更省的':r.affordable?'值得，可做':'值得，待筹资'})])))])]:
      [el('p',{className:'muted',textContent:'暂无能提升在用装备的投资（或缺少金币收入估算）'})]);
    const perks=view.perks,mastery=view.mastery;
    set('[data-plan-points]',[
      perks?`任务点数 ${perks.points}：不自动兑换，由你自行分配`:null,
      mastery?`精通点数可用 ${fmt(mastery.earned-mastery.spent)}（共获得 ${fmt(mastery.earned)}）：${mastery.reason??'暂无可分配'}`:'精通点数：引擎模拟启用后计算',
    ].filter(Boolean).join('；'));
  }
  function renderSuggestions(view) {
    fill('[data-profit-suggestions]',JSON.stringify([view?.frontier??null,profitFloor]),()=>{
      if(!view)return [el('p',{className:'muted setting-note',textContent:trainer.player?'正在计算…':'等待游戏状态'})];
      if(!view.frontier.length)return [el('p',{className:'muted setting-note',textContent:'暂无可比较的工作'})];
      return view.frontier.map(point=>{
        const button=el('button',{type:'button',textContent:`≥ ${fmt(point.floor)} 金币/时 → ${fmt(point.xpH)} 经验/时`+
          (point.loss>.0005?`（经验 −${(point.loss*100).toFixed(1)}%）`:'（经验最高）')+
          ` · ${translateGameText(point.label)}，约 ${fmt(point.coinsH)} 金币/时`});
        button.setAttribute('aria-pressed',String(point.floor===profitFloor));
        button.onclick=()=>setProfitFloor(point.floor);
        return button;
      });
    });
  }
  function render() {
    bossLootChat.refresh();
    syncHotValidation();
    saveRun();
    saveMetrics();
    if (!panel) return;
    inspectPlanning();
    const p=trainer.player, lv=p?planner.levels(p):null;
    const itemTarget=trainer.itemTargetStatus(),targetChoices=planner.itemTargetChoices();
    const review=p?(background?planningView?.review:economy.review(p,trainer.goal,trainer.style)):null;
    const metrics=trainer.telemetry.summary();
    const marketText=market.summary();
    const crops=p?planner.farmPlots(p):[], ready=crops.filter(c=>c.readyAt<=p.lastTick).length;
    const farming=p?(background?planningView?.farming:planner.farmStatus(p,trainer.goal)):null;
    const preference=planner.farmingPreference(),choices=farmingChoices(p),selectedCrop=choices.find(j=>j.id===preference.jobId);
    // What is in each field and why, then the next crop to plant and why.
    const farmText=farming?[
      ...(farming.crops??[]).map(c=>`田里：${c.name} ×${c.fields}（${c.readyMinutes?`约 ${c.readyMinutes} 分钟成熟`:'已成熟'}）· ${c.why}`),
      farming.next&&!(farming.crops??[]).some(c=>c.name===farming.next.name&&c.why===farming.next.why)?`下次补种：${farming.next.name} · ${farming.next.why}`:null,
      farming.reason??'等待下一次合批种收',
    ].filter(Boolean).join('\n'):'登录角色后显示田地与种子库存。';
    const farmingNote=(preference.mode==='auto'?'':
      !p?'登录角色后核对作物等级与种子库存。':
      !selectedCrop?'未指定有效作物，等待重新选择。':selectedCrop.locked?`${selectedCrop.name}需农业 ${selectedCrop.level} 级；保留选择，解锁前暂停农田调度。`:
      selectedCrop.seeds===0?'缺种：可收获成熟作物，空田等待指定种子，不改种其他作物。':`下次可播种时使用${selectedCrop.name}，不改种其他作物。`)+
      (trainer.mode==='assist'?' 辅助模式只用现有或收回种子，不买种、不采种。':'');
    const growth=p&&trainer.mode==='balanced'?(background?planningView?.growth:planner.growthStatus(p,trainer.style,trainer.deferred)):null;
    const business=p&&trainer.mode==='business'?(background?planningView?.business:planner.specializationStatus(p,trainer.style,trainer.mainTrade,trainer.mainJobId,trainer.mainMonsterId)):null;
    const mainJobs=GAME_DATA.jobs.filter(j=>!j.grow&&j.skill===trainer.mainTrade).sort((a,b)=>a.levelReq-b.levelReq||a.id-b.id)
      .map(j=>({id:j.id,name:mainJobName(j),level:j.levelReq,locked:!p||lv[j.skill]<j.levelReq}));
    const selectedMainJob=mainJobs.find(j=>j.id===trainer.mainJobId);
    const mainMonsters=GAME_DATA.monsters.map(m=>({id:m.id,name:gameLabel(m.name),level:m.level})).sort((a,b)=>a.level-b.level||a.id-b.id);
    const selectedMainMonster=mainMonsters.find(m=>m.id===trainer.mainMonsterId);
    const boss=trainer.boss.status(p);
    const hot=trainer.hotFollowStatus(p);
    const hotText=hot.skill?'热门：'+(NAMES[hot.skill]??hot.skill)+' ×'+(hot.mult??(hot.kind==='rarity'?(GAME_DATA.hot?.rarity??1.25):(GAME_DATA.hot?.xp??1.2)))+' · 剩 '+Math.ceil(hot.remainingMinutes??0)+' 分 · '+(hot.active?'跟随中':'未跟随（'+hot.reason+'）'):'';
    const mainTradeName=trainer.mainTrade==='combat'?`${PROFESSIONS[trainer.style]}战斗`:MAIN_TRADES[trainer.mainTrade];
    const buffs=p?activeBuffs(GAME_DATA,p):[];
    const quests=p?planner.questRead(p):[];
    const job=GAME_DATA.jobs.find(j=>j.id===p?.route?.jobId);
    const zone=GAME_DATA.zones.find(z=>z.id===p?.route?.zoneId);
    const monster=zone&&GAME_DATA.monsters.find(m=>m.id===zone.monsterId);
    const work=job?`${NAMES[job.skill]} · ${job.name}`:monster?`战斗 · ${monster.name}`:'';
    const bossActivity=boss.owned?{attacking:'世界 Boss · 等待参战确认',fighting:boss.recentActivity?
      (boss.hit?'世界 Boss · 已命中，近期收到参战回报':'世界 Boss · 近期参战回报，等待有效命中'):
      (boss.hit?'世界 Boss · 曾命中，当前参战待确认':'世界 Boss · 当前参战待确认'),
      dead:'世界 Boss · 已阵亡，等待本轮结束',ended:'世界 Boss · 等待恢复原任务',resuming:'世界 Boss · 恢复原任务中'}[boss.phase]:null;
    const activity=bossActivity??(!p?'等待游戏状态':p.enhance?'强化装备':p.route?.phase==='toBank'?`返回仓库${work?`（${work}）`:''}`:
      p.activity==='walking'||p.path?.length?`行走中${work?`（${work}）`:''}`:
      p.activity==='working'?work||'工作中':`空闲${work?`（已安排${work}）`:''}`);
    const equipmentOpen=panel.querySelector('[data-equipment-details]').open;
    const houseText=p?planner.housingStatus(p):'等待房屋状态';
    const hotFollow=trainer.getHotFollow();
    const signature=JSON.stringify([planningError,updates.state,autoSell,potionRestock,capacitySales,itemTarget,targetChoices,targetSearch,review,metrics,farmText,houseText,farming,preference,choices,marketText,growth,business,mainJobs,trainer.mainJobId,mainMonsters,trainer.mainMonsterId,boss,hot,hotFollow,buffs,quests,activity,equipmentOpen,checking,compatibilityMessage,trainer.style,trainer.mode,trainer.mainTrade,trainer.active,trainer.message,trainer.goal,trainer.plan?.label,trainer.plan?.reason,lv,trainer.history,trainer.blockedReasons,rejections,rejectionsSaved,
      trainer.pausedError,trainer.recovery,p?.fallback??null,trainer.fallbackOwned,autoFallback,sellCrafted]);
    if (signature===rendered) return;
    rendered=signature;
    panel.querySelector('[data-update-status]').textContent=updates.state.checking?'正在检查脚本更新…':updates.state.message;
    panel.querySelector('[data-update-check]').disabled=updates.state.checking;
    for(const selector of ['[data-update-badge]','[data-update-install]'])panel.querySelector(selector).href=updates.state.installUrl;
    panel.querySelector('[data-update-badge]').hidden=!updates.state.available;
    panel.querySelector('[data-update-badge]').textContent=updates.state.available?`新版 ${updates.state.available}`:'';
    const updateTab=panel.querySelector('#dv-tab-logs');
    if(updateTab) updateTab.setAttribute('data-has-update',String(!!updates.state.available));
    const trained=planner.trainedSkills(trainer.style);
    panel.querySelector('[data-mode]').value=trainer.mode;
    const identity=itemTarget?`${itemTarget.playerId}:${itemTarget.itemId}:${itemTarget.quantity}`:'';
    if(identity!==targetIdentity) {
      targetIdentity=identity;targetOptions='';
      if(itemTarget) {
        targetSelection=String(itemTarget.itemId);
        panel.querySelector('[data-item-target-quantity]').value=String(itemTarget.quantity);
      }
    }
    const filteredTargets=targetChoices.filter(item=>targetSearch.split(/\s+/).every(word=>`${gameLabel(item.name)} ${item.name}`.toLowerCase().includes(word)));
    const targetSelect=panel.querySelector('[data-item-target-item]'),targetSignature=JSON.stringify([targetChoices,targetSearch]);
    if(targetSignature!==targetOptions) {
      targetOptions=targetSignature;
      targetSelection=targetSelection||targetSelect.value||String(targetChoices[0]?.itemId??'');
      targetSelect.replaceChildren();
      for(const item of filteredTargets) {
        const option=document.createElement('option');option.value=String(item.itemId);option.textContent=gameLabel(item.name);targetSelect.append(option);
      }
      if(!filteredTargets.length) {
        const option=document.createElement('option');option.value='';option.textContent='没有匹配的物品';targetSelect.append(option);
      }
      targetSelect.value=filteredTargets.some(item=>String(item.itemId)===targetSelection)?targetSelection:String(filteredTargets[0]?.itemId??'');
      targetSelect.disabled=!filteredTargets.length;
    }
    panel.querySelector('[data-item-target-results]').hidden=!targetSearch;
    panel.querySelector('[data-item-target-results]').textContent=filteredTargets.length?`找到 ${filteredTargets.length} 项物品`:'没有匹配的物品，请换个关键词。';
    panel.querySelector('[data-item-target-summary]').textContent=!itemTarget?'未设置':itemTarget.completed?'已完成':itemTarget.status==='pending'?'待同步':`${itemTarget.gained} / ${itemTarget.quantity}`;
    panel.querySelector('[data-item-target-status]').textContent=!itemTarget?'指定一件物品，集中准备原料并获得所填数量。':
      itemTarget.completed?`${gameLabel(itemTarget.name)}：已另外获得 ${itemTarget.gained} / ${itemTarget.quantity} 个。${trainer.active?`已继续${TRAINING_MODE_LABELS[trainer.mode]}。`:'调度已暂停。'}`:
      itemTarget.status==='pending'?`${gameLabel(itemTarget.name)}：等待最新库存，另外获得 ${itemTarget.quantity} 个；原有库存不计入。`:
      `${gameLabel(itemTarget.name)}：新增 ${itemTarget.gained} / ${itemTarget.quantity} 个，还差 ${itemTarget.remaining} 个。${trainer.active?'':'已暂停，点击开始调度继续目标。'}`;
    panel.querySelector('[data-item-target-start]').disabled=checking||!!trainer.recovery||!p||!trainer.compatible||!filteredTargets.length;
    panel.querySelector('[data-item-target-cancel]').disabled=!itemTarget;
    panel.querySelector('[data-main-trade-controls]').hidden=trainer.mode!=='business';
    panel.querySelector('[data-profit-floor-controls]').hidden=trainer.mode!=='experience';
    const floorInput=panel.querySelector('[data-profit-floor]');
    if(document.activeElement!==floorInput)floorInput.value=String(profitFloor);
    if(planDetailsWanted()) {
      let view=null;
      try{view=background?planningView?.plan??null:p?planView(GAME_DATA,planner,trainer,p):null;}catch{view=null;}
      renderPlan(view);if(trainer.mode==='experience')renderSuggestions(view);
    }
    panel.querySelector('[data-main-trade]').value=trainer.mainTrade;
    panel.querySelector('[data-main-job-controls]').hidden=trainer.mode!=='business'||['auto','combat'].includes(trainer.mainTrade);
    const mainJobSelect=panel.querySelector('[data-main-job]'),mainJobSignature=JSON.stringify(mainJobs);
    if(mainJobSignature!==mainJobOptions) {
      mainJobOptions=mainJobSignature;mainJobSelect.replaceChildren();
      const automatic=document.createElement('option');automatic.value='';automatic.textContent='自动选择本业工作';mainJobSelect.append(automatic);
      for(const job of mainJobs) {
        const option=document.createElement('option');option.value=String(job.id);option.disabled=job.locked;
        option.textContent=`${job.name} · ${job.level} 级${job.locked?' · 未解锁':''}`;mainJobSelect.append(option);
      }
    }
    const mainJobValue=trainer.mainJobId==null?'':String(trainer.mainJobId);
    if(mainJobSelect.value!==mainJobValue)mainJobSelect.value=mainJobValue;
    panel.querySelector('[data-main-job-info]').textContent=(selectedMainJob?
      selectedMainJob.locked?`${selectedMainJob.name}需${mainTradeName} ${selectedMainJob.level} 级；保留选择，不换其他工作。`:
        `固定${selectedMainJob.name}；补料、换装、收菜或 Boss 后返回。`:'在本业内自动比较收益与经验效率。')+' 切换后暂停调度，点击开始应用。';
    panel.querySelector('[data-main-monster-controls]').hidden=trainer.mode!=='business'||trainer.mainTrade!=='combat';
    const monsterSelect=panel.querySelector('[data-main-monster]'),monsterSignature=JSON.stringify(mainMonsters);
    if(monsterSignature!==mainMonsterOptions) {
      mainMonsterOptions=monsterSignature;monsterSelect.replaceChildren();
      const automatic=document.createElement('option');automatic.value='';automatic.textContent='自动选择战斗目标';monsterSelect.append(automatic);
      for(const monster of mainMonsters) {
        const option=document.createElement('option');option.value=String(monster.id);
        option.textContent=`${monster.name} · ${monster.level} 级`;monsterSelect.append(option);
      }
    }
    const monsterValue=trainer.mainMonsterId==null?'':String(trainer.mainMonsterId);
    if(monsterSelect.value!==monsterValue)monsterSelect.value=monsterValue;
    panel.querySelector('[data-main-monster-info]').textContent=(selectedMainMonster?`固定挑战 ${selectedMainMonster.name}；武器或食物不足以安全战斗时等待准备，不改打其他怪物。`:
      '根据职业、装备与补给自动选择安全的战斗目标。')+' 切换后暂停调度，点击开始应用。';

    const hotControls=panel.querySelector('[data-hot-follow-controls]');
    if(hotControls) {
      const isBusiness=trainer.mode==='business', hasMainTrade=trainer.mainTrade!=='auto';
      const unavailable=hotControls.querySelector('[data-hot-unavailable]');
      const hotBody=hotControls.querySelector('[data-hot-body]');
      if(!isBusiness) {
        hotControls.hidden=false;
        if(unavailable){unavailable.hidden=false;unavailable.textContent='跟随热门技能仅在主业经营模式下可用。';}
        if(hotBody) hotBody.hidden=true;
      } else if(!hasMainTrade) {
        hotControls.hidden=false;
        if(unavailable){unavailable.hidden=false;unavailable.textContent='主业设为自动选择时无法指定副职业跟随；请先选择具体主业。';}
        if(hotBody) hotBody.hidden=true;
      } else {
        hotControls.hidden=false;
        if(unavailable) unavailable.hidden=true;
        if(hotBody) {
          hotBody.hidden=false;
          const enabledCheckbox=hotBody.querySelector('[data-hot-enabled]');
          if(enabledCheckbox&&enabledCheckbox.checked!==hotFollow.enabled) enabledCheckbox.checked=hotFollow.enabled;
          const rarityCheckbox=hotBody.querySelector('[data-hot-count-rarity]');
          if(rarityCheckbox&&rarityCheckbox.checked!==hotFollow.countRarity) rarityCheckbox.checked=hotFollow.countRarity;
          const minMinutesInput=hotBody.querySelector('[data-hot-min-minutes]');
          if(minMinutesInput&&document.activeElement!==minMinutesInput&&Number(minMinutesInput.value)!==hotFollow.minMinutes) {
            minMinutesInput.value=String(hotFollow.minMinutes);
          }
          const mainSkill=trainer.mainTrade;
          hotBody.querySelectorAll('[data-hot-side-wrap]').forEach(wrap=>{
            const skill=wrap.getAttribute('data-hot-side-wrap');
            const checkbox=wrap.querySelector('[data-hot-side]');
            const tag=wrap.querySelector('[data-hot-side-tag]');
            const isMain=skill===mainSkill;
            wrap.setAttribute('data-disabled',String(isMain));
            if(checkbox) {
              checkbox.disabled=isMain;
              checkbox.checked=isMain?false:hotFollow.sides.includes(skill);
            }
            if(tag) tag.hidden=!isMain;
          });
          const scheduleBody=hotBody.querySelector('[data-hot-schedule-body]');
          if(scheduleBody) {
            const windows=trainer.hotWindows(4);
            const formatTime=tick=>{
              const time=Date.UTC(2026,0,1)+(tick??0)*GAME_DATA.tickMs;
              const date=new Date(time);
              return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
            };
            const existingRows=scheduleBody.querySelectorAll('tr');
            if(existingRows.length!==windows.length) {
              scheduleBody.replaceChildren();
              windows.forEach((win,idx)=>{
                const tr=document.createElement('tr');
                if(idx===0) tr.className='current-window';
                const tdTime=document.createElement('td');
                tdTime.className='hot-time';
                tdTime.textContent=`${formatTime(win.start)}~${formatTime(win.end)}${idx===0?' (当前)':''}`;
                const tdSkill=document.createElement('td');
                tdSkill.textContent=NAMES[win.skill]??win.skill;
                const tdBadge=document.createElement('td');
                tdBadge.className='hot-badge-cell';
                const badge=document.createElement('span');
                badge.className=`hot-badge hot-badge-${win.kind==='rarity'?'rarity':'xp'}`;
                badge.textContent=win.kind==='rarity'?`稀有 ×${win.mult??1.25}`:`经验 ×${win.mult??1.2}`;
                tdBadge.append(badge);
                tr.append(tdTime,tdSkill,tdBadge);
                scheduleBody.append(tr);
              });
            } else {
              windows.forEach((win,idx)=>{
                const tr=existingRows[idx];
                const expectedClass=idx===0?'current-window':'';
                if(tr.className!==expectedClass) tr.className=expectedClass;
                const tdTime=tr.children[0];
                const timeText=`${formatTime(win.start)}~${formatTime(win.end)}${idx===0?' (当前)':''}`;
                if(tdTime&&tdTime.textContent!==timeText) tdTime.textContent=timeText;
                const tdSkill=tr.children[1];
                const skillText=NAMES[win.skill]??win.skill;
                if(tdSkill&&tdSkill.textContent!==skillText) tdSkill.textContent=skillText;
                const badge=tr.children[2]?.querySelector('.hot-badge');
                const badgeClass=`hot-badge hot-badge-${win.kind==='rarity'?'rarity':'xp'}`;
                const badgeText=win.kind==='rarity'?`稀有 ×${win.mult??1.25}`:`经验 ×${win.mult??1.2}`;
                if(badge) {
                  if(badge.className!==badgeClass) badge.className=badgeClass;
                  if(badge.textContent!==badgeText) badge.textContent=badgeText;
                }
              });
            }
          }
        }
      }
    }
    panel.querySelector('[data-heading]').textContent=TRAINING_MODE_LABELS[trainer.mode]+(trainer.mode==='assist'?'':' · 职业专精');
    panel.querySelector('[data-settings-summary]').textContent=trainer.mode==='assist'?'仅辅助':PROFESSIONS[trainer.style];
    const stateText=checking?'检查中':trainer.recovery?'待恢复':trainer.active?'运行中':p?'已暂停':'待登录';
    panel.querySelector('[data-run-state]').textContent=stateText;
    panel.querySelector('[data-run-state]').setAttribute('data-running',String(trainer.active));
    const stateCode=checking?'checking':trainer.recovery?'recovery':trainer.active?'running':p?'paused':'idle';
    panel.querySelector('[data-run-state]').setAttribute('data-state',stateCode);
    panel.querySelector('section').setAttribute('data-state',stateCode);
    panel.querySelector('[data-boss-participation]').value=boss.participation;
    for(const [selector,value] of [['[data-boss-start]',automation.bossStart],['[data-boss-end]',automation.bossEnd],['[data-boss-skip]',automation.skipPercent],
      ['[data-harvest-mode]',automation.harvestMode],['[data-delay-min]',automation.delayMin],['[data-delay-max]',automation.delayMax]]) {
      const input=panel.querySelector(selector);
      if(input&&input!==panel.activeElement&&input.value!==String(value))input.value=String(value);
    }
    const targetActive=!!itemTarget&&!itemTarget.completed,compactTarget=panel.querySelector('[data-compact-target]');
    panel.querySelector('section').setAttribute('data-target',String(targetActive));compactTarget.hidden=!targetActive;
    if(targetActive) {
      const gained=Math.min(itemTarget.quantity,itemTarget.gained),percent=Math.floor(gained/itemTarget.quantity*100);
      const name=gameLabel(itemTarget.name),count=itemTarget.status==='pending'?'同步起始库存…':`${gained} / ${itemTarget.quantity} · ${percent}%`;
      panel.querySelector('[data-compact-target-name]').textContent=name;
      panel.querySelector('[data-compact-target-count]').textContent=count;
      compactTarget.setAttribute('aria-valuemax',String(itemTarget.quantity));compactTarget.setAttribute('aria-valuenow',String(gained));
      compactTarget.setAttribute('aria-valuetext',`${name}：${count}`);
      compactTarget.title=`${trainer.active?'运行中':'已暂停'} · ${name}：本次新增 ${gained} / ${itemTarget.quantity}；${translateGameText(trainer.message)}`;
      compactTarget.style.setProperty('--target-pct',`${percent}%`);
    } else {
      compactTarget.style.setProperty('--target-pct','0%');
    }
    panel.querySelector('[data-auto-sell]').checked=autoSell;
    panel.querySelector('[data-potion-restock]').checked=potionRestock;
    panel.querySelector('[data-capacity-sales]').checked=capacitySales;
    panel.querySelector('[data-sell-crafted]').checked=sellCrafted;
    panel.querySelector('[data-auto-fallback]').checked=autoFallback;
    panel.querySelector('[data-auto-seed-quality]').checked=autoSeedQuality;
    panel.querySelector('[data-auto-housing]').checked=autoHousing;
    {
      const p=trainer.player,task=p?.fallback?.task;
      const name=task?task.kind==='job'?gameLabel(GAME_DATA.jobs.find(j=>j.id===task.jobId)?.name??'未知工作'):
        gameLabel(GAME_DATA.zones.find(z=>z.id===task.zoneId)?.name??'战斗'):null;
      const owner=p?fallbackOwnership(p,trainer.fallbackOwned):null;
      panel.querySelector('[data-fallback-status]').textContent=!p?'':
        `当前：${name??'未设置'}${owner==='player'?'（你设置的，保持不变）':owner==='helper'?'（助手设置）':owner==='cleared'?'（你已清除；重新勾选可恢复自动设置）':''}`;
    }
    panel.querySelector('[data-sale-pricing]').value=salePricing;
    panel.querySelector('[data-mode-info]').textContent=modeInfo[trainer.mode];
    panel.querySelector('[data-training-policy]').textContent=trainer.mode==='assist'?
      '不安排练级、装备、交易或采购任务；不采种、不解锁新作物。玩家可继续编辑自己的队列，手动操作优先。':
      `自动打造换装 · ${autoSell?'比价出售与必要采购':capacitySales?'仅满仓清理普通盈余和淘汰装备 · 必要采购':'不自动出售 · 必要采购'}。常规切换遵守背包／批次边界；世界 Boss 临时参与结束后继续原任务。`;
    for(const selector of ['[data-equipment-details]','[data-economy-details]','[data-market-details]','[data-buffs-details]','[data-quests-details]'])
      panel.querySelector(selector).hidden=trainer.mode==='assist';
    panel.querySelector('[data-more-details]').hidden=trainer.mode==='assist';
    const suppliesAssist=panel.querySelector('[data-supplies-assist]');
    if(suppliesAssist) suppliesAssist.hidden=trainer.mode!=='assist';
    panel.querySelector('[data-equipment-policy]').textContent=trainer.mode==='balanced'?
      '先准备当前发展计划需要的工具与装备，再连续工作；全装备列表供参考，不代表同时制作。穿戴、制作与供料门槛分别检查。':
      trainer.mode==='business'?'按主业需要和预计回本选择工具或战斗装备；这里也列出其它装备门槛，列出不代表立即制作。':
      trainer.mode==='mastery'?'补精通使用当前装备；下方仅展示装备信息，不额外安排换装项目。战斗所需武器和口粮按实际条件准备。':
      '按预计经验收益和准备时间选择装备升级；列出全部门槛供参考，不强制逐件制作。';
    panel.querySelector('[data-profession]').value=trainer.style;
    panel.querySelector('[data-profession-info]').textContent=trainer.mode==='assist'?'辅助模式不安排职业练级或换装，使用角色当前装备。':
      `${PROFESSIONS[trainer.style]}路线 · 主修${NAMES[professionSkill(trainer.style)]} · 防御／生命自然提升，不单独追级`;
    panel.querySelector('[data-status]').textContent=trainer.message+(hotText?'；'+hotText:'');
    panel.querySelector('[data-last-rejection]').hidden=!rejections.length;
    panel.querySelector('[data-rejection-details]').hidden=!rejections.length;
    panel.querySelector('[data-last-rejection]').textContent=rejections.length?
      `上次${rejections[0].scope==='guild'?'公会提示（不影响自动练级）':'服务器拒绝'}：${rejections[0].code}；详见下方记录${rejectionsSaved?'':'（未能保存，刷新前请导出）'}`:'';
    panel.querySelector('[data-rejections]').textContent=rejections.map(r=>
      `${new Date(r.time).toLocaleString()} · v${r.version} · ${r.code}`+
      `\n当时${r.active?'正在调度':'已暂停'}；${r.stale?'过期消息；':''}${r.scope==='guild'?'公会功能返回，与自动任务分开处理':'错误归属未确定'}`+
      `\n待确认操作：${r.pending?`${translateGameText(r.pending.label??r.pending.intent?.t??'未知')} (${r.pending.intent?.t??'未知'})`:'无'}`+
      (r.pendingConfirmed?'；同帧已观察到成功回报':'')).join('\n\n');
    panel.querySelector('[data-goal]').textContent=trainer.mode==='mastery'&&!trainer.itemTarget?
      translateGameText(p?planner.masteryStatus(p):'开始后按收藏页“即将获得奖励”顺序补精通'):trainer.goal ?
      `目标：${NAMES[trainer.goal.skill]} · ${trainer.goal.reason??`目标 ${trainer.goal.target} 级`}` :
      trainer.mode==='balanced'?'比较库存、供料、解锁与收入，选择下一项发展计划':
      trainer.mode==='experience'?'比较当前可执行路线的总经验效率，选择下一批工作':
      trainer.mode==='assist'?'等待合批收菜或世界 Boss；玩家自行安排原队列':
      trainer.mainTrade!=='auto'?`指定主业：${mainTradeName}${selectedMainJob?` · ${selectedMainJob.name}`:selectedMainMonster?` · ${selectedMainMonster.name}`:''}；准备本业工作和必要供料`:'比较持续收入与市场需求，自动选择主业和必要供料';
    panel.querySelector('[data-activity]').textContent=`当前：${activity}`;
    panel.querySelector('[data-growth]').textContent=growth?
      (growth.project?`当前计划：${NAMES[growth.project.skill]} → ${growth.project.target} 级\n${growth.project.reason}\n`:'开始后选择发展计划\n')+
      `已完成 ${growth.completed??0} 项计划；均衡范围：最低 ${growth.lowestLevel??'—'} 级，各技能练到 ${growth.top??'—'} 级为止\n`+
      `范围内：${growth.remaining.map(s=>`${NAMES[s.skill]} ${s.level}`).join('、')||'无'}`+
      (growth.ahead?.length?`\n领先，等其他技能追上：${growth.ahead.map(s=>`${NAMES[s.skill]} ${s.level}`).join('、')}`:'')+
      (growth.alternatives?.length?`\n后续候选（完成后重评）：${growth.alternatives.map(g=>`${NAMES[g.skill]} → ${g.target}`).join('、')}`:'')+
      (growth.deferred.length?`\n生长／条件等待：${growth.deferred.map(s=>NAMES[s.skill]).join('、')}`:'')+
      '\n范围内按价值选（速度、其他技能用得上的解锁、收入）；下一档原料的技能落后时先练原料技能。防御／生命自然提升；当前计划的有用装备强化目标 +5，逐次确认。':
      trainer.mode==='experience'?'允许偏科；计入供料与旅行时间，以总经验效率选路线。农业仍在后台合批处理。':
      trainer.mode==='mastery'?(trainer.goal?.mastery?translateGameText(trainer.goal.reason)+'\n':'')+
        '每项补到下一档后继续下一项；本轮前六项顺序固定，刷新后继续。传说品质与种植任务跳过；买来的成品与世界 Boss 奖励不计入。缺同品质材料时继续采集、偷窃或打怪等待产出，市场报价同时进行。':
      trainer.mode==='business'?(trainer.mainTrade!=='auto'?`指定主业：${mainTradeName}${selectedMainJob?` · 指定工作：${selectedMainJob.name}`:selectedMainMonster?` · 指定怪物：${selectedMainMonster.name}`:''}\n`:'')+
        (business?.skill?`当前主业：${NAMES[business.skill]??business.skill}\n${business.reason??''}`:
          trainer.mainTrade!=='auto'?'等待开始或本业条件满足；不自动更换指定主业。':'主业待评估：开始后按可执行路线和市场买单选择。')+
        '\n市场报价为有限批次估算，不保证成交；保持主业稳定，必要时补料或换工具。':
      trainer.mode==='assist'?'收菜等待已种田地全部成熟；只用已有或收回种子补种。世界 Boss 参与完成后继续原队列。':'';
    panel.querySelector('[data-buffs]').textContent=buffs.length?buffs.map(b=>
      `${b.label}${POTIONS.some(v=>v.kind===b.kind)?` · 当前效力 ×${b.power}`:''} · 本类总剩余 ${b.remainingSeconds>=3600?`${Math.floor(Math.ceil(b.remainingSeconds/60)/60)} 小时 ${Math.ceil(b.remainingSeconds/60)%60} 分钟`:`${Math.ceil(b.remainingSeconds/60)} 分钟`}`).join('\n'):'暂无生效的药水或食物增益';
    panel.querySelector('[data-quests]').textContent=quests.length?quests.map(q=>{
      const name=q.kind==='kill'?GAME_DATA.monsters.find(m=>m.id===q.monsterId)?.name:
        GAME_DATA.jobs.find(j=>j.id===q.jobId)?.name;
      const skill=q.kind==='kill'?professionSkill(trainer.style):q.reward.skill;
      return `${q.period==='daily'?'日常':'周常'} · ${name??'未知目标'} · ${q.done}/${q.goal}`+
        `\n${q.claimed?'已领取':q.remaining<=0?'待领取':`剩余 ${q.remaining} 次`} · ${q.reward.coins} 金币 + ${q.reward.xp} ${NAMES[skill]??skill}经验`;
    }).join('\n\n'):'等待游戏任务数据';
    if(p&&equipmentOpen) {
      const slots={weapon:'武器',helmet:'头部',body:'上衣',legs:'腿部',shield:'副手',ring:'戒指',amulet:'项链',pickaxe:'镐',axe:'斧',rod:'钓竿',pan:'锅',hammer:'锤',knife:'刀',hoe:'锄',gloves:'手套',needle:'针',mortar:'研钵'};
      const describe=(g,label)=>{
        if(!g)return '';
        const needs=g.requirements.filter(r=>(lv[r.skill]??0)<r.target).map(r=>`${NAMES[r.skill]??r.skill} ${r.target}`);
        // Materials keep their quality: "罕见 钴锭" is not an ordinary cobalt bar.
        const quality=id=>['','罕见 ','稀有 ','史诗 ','传说 '][Math.floor(id%GAME_DATA.plusScale/GAME_DATA.rarityScale)]??'';
        const list=items=>Object.entries(items??{}).map(([id,qty])=>`${quality(+id)}${GAME_DATA.items[planner.base(+id)]?.name??id} ×${fmt(qty)}`).join('、');
        const own=list(g.materials),chain=list(g.chainMaterials);
        const head=`\n${label}：${g.name}（${g.wear.skill==='none'?'无等级门槛':`${NAMES[g.wear.skill]??g.wear.skill} ${g.wear.level}`}）`;
        if(g.owned)return `${head} · 已持有`;
        if(g.quality)return head+(needs.length?`\n先解锁：${needs.join('、')}`:'')+
          (own?`\n制作缺料：${own}`:'')+
          (chain?`\n尚缺品质原料：${chain}（只来自采集时的随机掉落或市场）`:
            Number.isFinite(g.seconds)?`\n品质原料已有，可按链制作${g.money>0?'（部分普通材料需购买）':''}`:'');
        return head+(needs.length?`\n先解锁：${needs.join('、')}`:`\n${Number.isFinite(g.seconds)?'前置技能已满足':'需掉落或市场来源'}`)+
          (own?`\n制作缺料：${own}`:'')+
          (chain?`\n${needs.length?'练级至解锁及供料链约需':'供料链约需'}：${chain}`:'');
      };
      panel.querySelector('[data-equipment]').textContent=(background?planningView?.equipment??[]:planner.equipmentStatus(p,trainer.style)).map(s=>
        `${slots[s.slot]??s.slot}：${s.current?.name??'未装备'}${describe(s.upgrade,'当前可穿')}${describe(s.next,'下一档')}`).join('\n\n');
    }
    {
      const blocked=!trainer.active&&trainer.queueBlocked&&trainer.player?.queue?.length>0,box=panel.querySelector('[data-queue-block]');
      if(box.hidden===blocked)box.hidden=!blocked;
      const text=blocked?`游戏队列：${trainer.queueSummary()}`:'',span=box.querySelector('[data-queue-text]');
      if(span.textContent!==text)span.textContent=text;
    }
    {
      const error=!trainer.active&&!trainer.recovery?trainer.pausedError:null,box=panel.querySelector('[data-pause-error]');
      box.hidden=!error;
      box.textContent=error?`已因错误暂停（${new Date(error.at).toLocaleTimeString()}）：${error.reason}。`+
        (error.backup?`角色已改做 ${error.backup} 采集，避免空闲；`:'角色未在空闲，保持当前任务；')+
        '处理后点击“开始调度”重试，详情见诊断。':'';
    }
    panel.querySelector('[data-task]').textContent=trainer.plan?.label??'';
    panel.querySelector('[data-reason]').textContent=trainer.plan?.reason??'';
    panel.querySelector('[data-task]').hidden=!trainer.plan?.label;
    panel.querySelector('[data-reason]').hidden=!trainer.plan?.reason;
    panel.querySelector('[data-farm]').textContent=farmText;
    panel.querySelector('[data-housing]').textContent=houseText;
    {
      // Base fields by farming level, plus fields gated by another skill.
      const lv=p?planner.levels(p):{},nextFarming=GAME_DATA.farmUnlocks.find(n=>(lv.farming??0)<n);
      const gate=Object.values(GAME_DATA.farmGates??{}).find(g=>(lv[g.skill]??0)<g.level);
      const next=nextFarming?` · 下一块农业 ${nextFarming} 级`:gate?` · 下一块 ${gate.name}：${NAMES[gate.skill]??gate.skill} ${gate.level} 级`:'';
      panel.querySelector('[data-farm-fields]').textContent=farming?`${farming.fields} / ${planner.farmFieldCount} 块${next}`:'等待田地状态';
    }
    panel.querySelector('[data-farm-ready]').textContent=farming?String(ready):'—';
    panel.querySelector('[data-farm-growing]').textContent=farming?String(crops.length-ready):'—';
    panel.querySelector('[data-farm-empty]').textContent=farming?String(farming.empty):'—';
    panel.querySelector('[data-farming-mode]').value=preference.mode;
    panel.querySelector('[data-farming-crop-controls]').hidden=preference.mode!=='manual';
    panel.querySelector('[data-farming-note]').textContent=farmingNote;
    const cropSelect=panel.querySelector('[data-farming-crop]'),optionsSignature=JSON.stringify(choices);
    if(optionsSignature!==farmingOptions) {
      farmingOptions=optionsSignature;cropSelect.replaceChildren();
      for(const choice of choices) {
        const option=document.createElement('option');option.value=String(choice.id);option.disabled=choice.locked;
        option.textContent=`${choice.name} · ${choice.level} 级 · ${choice.locked?'未解锁':`种子 ${choice.seeds}`}`;
        cropSelect.append(option);
      }
    }
    const cropValue=preference.jobId==null?'':String(preference.jobId);
    if(cropSelect.value!==cropValue)cropSelect.value=cropValue;
    const bossPhase={saving:'确认保留原任务和队列',ready:'准备出发',moving:'正在前往',attacking:'等待参战确认',
      fighting:boss.recentActivity?(boss.hit?'已命中，近期收到参战回报':'近期收到参战回报，等待有效命中'):
        (boss.hit?'曾命中，等待新的参战回报':'等待新的参战回报'),dead:'本轮已阵亡，保留贡献并等待结束',
      ended:'本轮结束，等待恢复原任务',resuming:'恢复原任务中',manual:'玩家正在参战，助手让行',watching:'等待可参与机会'};
    const lastBoss=boss.lastResult;
    panel.querySelector('[data-boss]').textContent=boss.name?`世界 Boss：${boss.name} · ${boss.participated&&boss.phase==='watching'?'本轮已确认有效伤害并按策略离开，等待结算':
      boss.skipped?'本轮已跳过，可手动重新尝试':boss.policyReason??bossPhase[boss.phase]??'等待状态'}`:
      lastBoss?`世界 Boss 上轮：${lastBoss.name} · ${lastBoss.hit?'服务器已确认命中':lastBoss.attackSent===true?'已请求加入，未收到有效命中确认':lastBoss.attackSent===false?'未请求加入':'旧版记录，加入请求未知'}；${lastBoss.reason}`:
      '世界 Boss：等待服务器公布';
    panel.querySelector('[data-boss-retry]').hidden=!boss.skipped;
    panel.querySelector('[data-boss-retry]').disabled=!trainer.active||!boss.skipped;
    panel.querySelector('[data-market]').textContent=marketText;
    panel.querySelector('[data-metrics]').textContent=`累计经验 ${Math.round(metrics.totalXp)} · 净金币 ${Math.round(metrics.netCoins)}\n`+
      `观测经验 ${Math.round(metrics.xpPerHour)}/时 · 净金币 ${Math.round(metrics.coinsPerHour)}/时\n`+
      `工作 ${Math.round(metrics.activeSeconds/60)} 分钟 · 空闲 ${Math.round(metrics.idleSeconds/60)} 分钟`;
    panel.querySelector('[data-inventory]').textContent=review?review.items.sort((a,b)=>b.sell-a.sell).map(i=>
      `${i.name}：${autoSell||capacitySales?`${autoSell?'':'仅满仓时：'}留 ${i.keep}，可卖候选 ${i.sell}${i.sell>i.sellFromBank?'（部分需先存仓）':''}`:`不自动出售，计划保留量 ${i.keep}`}\n${i.reason}`
    ).join('\n\n'):'等待角色库存';
    panel.querySelector('[data-enhancement]').textContent=review?review.enhancements.map(e=>
      `${e.name} +${e.fromPlus}→+${e.toPlus}：${e.recommendation}\n${e.benefit}\n${e.gold} 金币 + ${e.shards} 碎片；成功率 ${(e.chance*100).toFixed(1)}%${e.affordable?'':'；当前材料不足'}`
    ).join('\n\n'):'等待装备状态';
    panel.querySelector('[data-blocked]').textContent=Object.entries(trainer.blockedReasons).map(([skill,why])=>`暂缓${NAMES[skill]}：${why}`).join('；');
    panel.querySelector('[data-client]').textContent=compatibilityMessage+`；${engine.message}；${background?'后台 Worker 规划':'当前浏览器不支持 Worker，使用兼容计算'}${planningError?' · '+planningError:''}`;
    panel.querySelector('[data-start]').disabled=checking||trainer.active||!!trainer.recovery||!p||!trainer.compatible;
    panel.querySelector('[data-pause]').disabled=!checking&&!trainer.active&&!trainer.recovery;
    panel.querySelector('section').setAttribute('data-running',String(checking||trainer.active||!!trainer.recovery));
    panel.querySelector('.run-state').title=translateGameText(trainer.message);
    // Translate only display text; planner identities and exported diagnostics stay intact.
    for(const selector of ['data-status','data-goal','data-activity','data-growth','data-buffs','data-quests',
      'data-equipment','data-task','data-reason','data-farm','data-farming-note','data-boss','data-market',
      'data-inventory','data-enhancement','data-blocked']) {
      const element=panel.querySelector(`[${selector}]`);
      element.textContent=translateGameText(element.textContent);
    }
    // Rebuilt only on change: a per-second rebuild flickers and resets the log's scroll.
    fill('.levels',JSON.stringify([lv,trained,trainer.goal?.skill]),()=>Object.entries(lv??{}).map(([skill,n])=>{
      const row=document.createElement('span'), value=document.createElement('b');
      row.textContent=NAMES[skill]; value.textContent=String(n);
      if (!trained.includes(skill)) {row.className='excluded';value.textContent=`${n} · 不练`;}
      else if (['defence','hitpoints'].includes(skill)) value.textContent=`${n} · 随战斗`;
      else if (skill===trainer.goal?.skill) row.className='low';
      row.append(value); return row;
    }));
    fill('ol',JSON.stringify(trainer.history.map(entry=>[entry.time,entry.message])),()=>trainer.history.map(entry=>
      el('li',{textContent:`${new Date(entry.time).toLocaleTimeString()} ${translateGameText(entry.message)}`})));
    const isRunning=checking||trainer.active||!!trainer.recovery;
    const bar=document.querySelector('[data-dvh-bar]');
    if (bar && !bar.hidden) {
      const stateBadge=bar.querySelector('.dvh-bar-state');
      const whatSpan=bar.querySelector('.dvh-bar-what');
      const progSpan=bar.querySelector('.dvh-bar-progress');
      const progFill=progSpan.querySelector('b');
      const toggleBtn=bar.querySelector('.dvh-bar-toggle');
      if (stateBadge.getAttribute('data-state') !== stateCode) stateBadge.setAttribute('data-state', stateCode);
      if (stateBadge.textContent !== stateText) stateBadge.textContent = stateText;
      const targetActive=!!itemTarget&&!itemTarget.completed;
      let whatText='';
      if (targetActive) {
        const gained=Math.min(itemTarget.quantity,itemTarget.gained);
        const percent=Math.floor(gained/itemTarget.quantity*100);
        const name=gameLabel(itemTarget.name);
        whatText=`目标 ${name} · ${gained}/${itemTarget.quantity} (${percent}%) · ${translateGameText(activity)}`;
        progSpan.hidden=false;
        const pctWidth = `${percent}%`;
        if (progFill.style.width !== pctWidth) progFill.style.width = pctWidth;
      } else {
        whatText=translateGameText(activity);
        progSpan.hidden=true;
      }
      if (hot.active && hot.skill) {
        whatText=`热门·${NAMES[hot.skill]??hot.skill} · ${whatText}`;
      }
      if (whatSpan.textContent !== whatText) {
        whatSpan.textContent=whatText;
        whatSpan.title=whatText;
      }
      const btnText = isRunning ? '暂停' : '开始';
      if (toggleBtn.textContent !== btnText) toggleBtn.textContent = btnText;
      toggleBtn.disabled = !isRunning && (!p || !trainer.compatible);
    }
    const metaEl=document.querySelector('#dvh-panel [data-dvh-meta]');
    if (metaEl) {
      const expectedMeta = `v${SCRIPT_VERSION} · ${SCRIPT_BUILT} · ${stateText}`;
      if (metaEl.textContent !== expectedMeta) metaEl.textContent = expectedMeta;
    }
    const navBadge=document.querySelector('[data-dvh-nav] [data-dvh-badge]');
    if (navBadge) {
      navBadge.hidden=trainer.active||checking||!p;
    }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded',mount,{once:true});
  function pump() {
    if (pumping) return;
    pumping=true;
    try {
      if(nativeBossClick&&!nativeBossClick.state().active&&!trainer.boss.ownsRun())abortNativeBossJoin();
      if (trainer.active||trainer.recovery) {
        if (!claimLease()) trainer.pause('另一个标签页已接管调度');
        else if(dataReady) {
          const boss=trainer.boss.status();
          if(trainer.active&&!trainer.recovery&&boss.phase==='fighting'&&!boss.recentActivity&&
            trainer.snapshotSequence>trainer.syncAfter&&Date.now()-trainer.received<=45000&&
            nativeBossJoinButton()&&trainer.boss.retryNativeJoin(trainer.player))
            trainer.log('长期未收到个人参战回报，重新点击原生加入；本轮只补入一次');
          trainer.tick();
        }
      } else releaseLease();
    } catch (error) {
      if ((trainer.active||trainer.recovery)&&socket?.readyState!==NativeWebSocket.OPEN) trainer.connectionLost();
      else {trainer.pauseError(`调度已暂停：${error.message}`);releaseLease();}
    } finally {pumping=false;}
    render();
  }
  const timer=setInterval(()=>{pump();updates.check();},1000);
  let pageHidden=document.hidden;
  document.addEventListener('visibilitychange',()=>{
    const returned=pageHidden&&!document.hidden;pageHidden=document.hidden;
    if(!returned||(!trainer.active&&!trainer.recovery)||trainer.awaitingWelcome||socket?.readyState!==NativeWebSocket.OPEN)return;
    // Invalidate the old snapshot before pumping; foregrounding is not permission to replay work.
    foregroundSequence=trainer.snapshotSequence;trainer.syncAfter=trainer.snapshotSequence;
    const lastSync=Math.max(trainer.lastSync,...recentRequests.queries.filter(r=>r.intent.t==='resync').map(r=>r.time));
    trainer.nextSync=Math.max(Date.now(),lastSync+2000);
    pump();
  });
  window.addEventListener('pagehide',()=>{abortNativeBossJoin();saveRun();saveMetrics(true);clearInterval(timer);background?.close();releaseLease();bossLootChat.destroy();integrationCleanup?.();},{once:true});
})();
