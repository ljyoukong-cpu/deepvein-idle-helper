import {action, copy, distance, point, same, wait} from './util.js';
import {createAutomationPolicy, normalizeAutomation} from './automation-policy.js';

export function savedTask(p){
  const r=p.route;
  if(r.questId!==undefined)return {kind:'quest',questId:r.questId};
  const task=r.zoneId!==null?{kind:'zone',zoneId:r.zoneId,limit:r.limit}:
    {kind:'job',siteId:r.siteId,jobId:r.jobId,onFull:r.onFull,limit:r.limit,rarity:p.workRarity??0,...(r.best?{best:true}:{})};
  if(r.until!==undefined)task.ticks=Math.max(1,r.until-p.lastTick);
  return task;
}

export function createNativeBossJoinCapture({windowMs=1500,setTimer=setTimeout,clearTimer=clearTimeout,
  isReadOnly=()=>false,onSent=()=>{},onDuplicate=()=>{},onUnexpected=()=>{},onExpired=()=>{}}={}){
  let active=false,sent=false,unexpected=false,timer=null;
  const stopTimer=()=>{if(timer!==null){clearTimer(timer);timer=null;}};
  const expire=()=>{
    timer=null;
    if(!active)return;
    active=false;
    onExpired({sent,unexpected});
  };
  const scope={
    open(){
      stopTimer();active=true;sent=false;unexpected=false;timer=setTimer(expire,windowMs);return scope;
    },
    abort(){active=false;stopTimer();},
    markSent(){sent=true;active=false;},
    capture(intent,send){
      if(!active)return false;
      if(intent?.t==='attackWorldBoss'&&sent){onDuplicate();throw new Error('同次原生调用重复请求 Boss 攻击');}
      if(intent?.t==='attackWorldBoss'&&!unexpected){
        const result=send();sent=true;onSent();return result??true;
      }
      if(intent&&!isReadOnly(intent.t)){unexpected=true;onUnexpected(intent);}
      return false;
    },
    state:()=>({active,sent,unexpected})
  };
  return scope;
}

export function createWorldBoss(data,now=()=>Date.now(),{random=Math.random}={}){
  let participation='full';
  let settings=normalizeAutomation(),policy=createAutomationPolicy({now,random}),policyReason=null;
  const setParticipation=value=>participation=value==='tag'?'tag':'full';
  let boss=null,run=null,external=false,externalUntil=null,ignored=null,lastDeath=null,lastResult=null;
  let tick=0,received=now(),fresh=false,playerId=null,snapshotAt=0,visibleBossId=null,observationSince=now();
  let nextRise=null; // server tick of the next announced spawn (`bossNext`)
  // Rounds are counted explicitly: a new spawn always starts a new round, and
  // `ignored` names a round, so a reused entity id or a stale key can never
  // make a fresh spawn look already done. `restoredIgnoredKey` carries a done
  // round across a page reload, matched once against the next announcement.
  let round=0,restoredIgnoredKey=null;
  const currentTick=()=>tick+Math.max(0,now()-received)/(data.tickMs??600);
  const recentActivity=()=>fresh&&run?.stage==='fighting'&&Number.isFinite(run.lastActivityAt)&&
    now()>=run.lastActivityAt&&now()-run.lastActivityAt<=30000;
  const key=b=>b?`${b.name}:${b.until??`entity:${b.id}`}`:null;
  // Tag mode leaves after a confirmed hit: that round counts as joined, not skipped.
  const participated=()=>!!boss&&lastResult?.round===round&&lastResult.hit===true;
  const skipped=()=>!run&&!external&&!!boss&&fresh&&ignored===round&&!participated()&&
    (boss.until==null||currentTick()<boss.until);
  const ownQueue=p=>!!run&&p.id===run.playerId&&!!run.expectedQueue&&
    p.held===true&&p.raidHeld===true&&!p.route&&same(p.queue??[],run.expectedQueue);
  function acceptSaved(p){
    if(run?.savedConfirmed)return ownQueue(p);
    if(!run?.expectedQueue||p.id!==run.playerId||p.route||!p.held||!p.raidHeld)return false;
    const actual=p.queue??[],expected=run.expectedQueue;
    if(actual.length!==expected.length||!same(actual.slice(1),expected.slice(1)))return false;
    const head=actual[0],before=expected[0];
    if(!head)return false;
    if(before.limit===null&&head.limit!==null)return false;
    if(before.limit!==null&&Number.isFinite(before.limit)&&
      (!Number.isFinite(head.limit)||head.limit<=0||head.limit>before.limit))return false;
    if(before.ticks!==undefined&&(!Number.isInteger(head.ticks)||head.ticks<=0||head.ticks>before.ticks))return false;
    // Native best-recipe banking can change quality while setAside is in flight (upstream v0.7.18).
    if(before.kind==='job'&&before.best&&(!Number.isInteger(head.rarity)||head.rarity<0||head.rarity>4))return false;
    if(!same({...head,limit:before.limit,...(before.ticks===undefined?{}:{ticks:before.ticks}),
      ...(before.kind==='job'&&before.best?{rarity:before.rarity}:{})},before))return false;
    run.expectedQueue=copy(actual);run.savedConfirmed=true;return true;
  }
  function recordResult(reason){
    if(run)lastResult={name:run.name,attackSent:run.attackSent??null,hit:run.hit===true,round:run.round,
      reason:run.reason??reason??'角色已返回工作或原任务状态已改变，结束本轮接管',endedAt:run.endedAt??now()};
  }
  function finish(){recordResult();if(run)ignored=run.round;run=null;}
  function end(reason){
    if(!run||['ended','resuming'].includes(run.stage))return;
    run.stage='ended';run.reason=reason;run.endedAt=now();
  }
  function cancel(reason='调度暂停或玩家接管，结束本轮自动参与'){
    recordResult(reason);
    if(run){
      ignored=run.round;external=external||['fighting','dead'].includes(run.stage)||run.stage==='attacking'&&run.attackSent===true;
      if(external)externalUntil=run.until??externalUntil;
    }
    run=null;
  }
  function observe(frame){
    if(!frame||!Array.isArray(frame.m)||!Number.isFinite(frame.tick)||frame.tick<tick)return;
    const fightingAtStart=run&&['attacking','fighting','dead'].includes(run.stage)?run.playerId:null;
    // A snapshot can restore work before the same frame delivers our final hit.
    if(run&&['attacking','fighting'].includes(run.stage)&&
      !frame.m.some(m=>m.t==='bossRose'&&key(m)!==run.key)&&
      frame.m.some(m=>m.t==='raidHit'&&m.damage>0))run.hit=true;
    tick=frame.tick;received=now();
    for(const m of frame.m){
      if(m.t==='welcome'){
        boss=null;fresh=false;visibleBossId=null;observationSince=now();
        if(run)run.lastActivityAt=null;
        if(externalUntil===null)external=false;
        if(run&&m.you?.id!==run.playerId){run=null;ignored=null;external=false;lastDeath=null;}
      }
      if((m.t==='welcome'||m.t==='snapshot')&&m.you){
        if(playerId!==null&&m.you.id!==playerId)lastResult=null;
        playerId=m.you.id;snapshotAt=now();
        if(run&&m.you.id!==run.playerId){run=null;ignored=null;external=false;lastDeath=null;}
        if(run&&m.you.route&&!m.you.held&&!m.you.raidHeld&&run.stage!=='saving')finish();
      }
      if(m.t==='bossRose'&&point(m)&&typeof m.name==='string'&&Number.isFinite(m.until)){
        const previous=boss;
        const sameRound=previous?.name===m.name&&(previous.until==null||previous.until===m.until);
        if(!sameRound){visibleBossId=null;round++;}
        boss={name:m.name,x:m.x,y:m.y,until:m.until,id:sameRound?previous.id:null};fresh=true;
        const promoted=previous?.name===boss.name&&previous.until==null;
        if(restoredIgnoredKey!==null){if(key(boss)===restoredIgnoredKey)ignored=round;restoredIgnoredKey=null;}
        if(run&&run.round==null&&run.key===key(boss))run.round=round;
        if(promoted&&external)externalUntil=boss.until;
        if(run&&run.until==null&&run.name===boss.name){run.until=boss.until;run.key=key(boss);}
        if(run&&run.key!==key(boss))end('本轮世界 Boss 已结束');
        if(previous&&!promoted&&key(previous)!==key(boss))external=false;
      }
      if(m.t==='enter'&&m.player?.kind==='boss'&&point(m.player)&&typeof m.player.name==='string'){
        const b=m.player;
        if(!(b.hpRemaining<=0)){
          if(boss?.name!==b.name)round++; // first sighting of a new spawn
          boss={name:b.name,x:b.x,y:b.y,id:b.id,until:boss?.name===b.name?boss.until:null};fresh=true;
          visibleBossId=b.id;
          if(run&&run.name===b.name&&run.until!=null)boss.until=run.until;
        }
      }
      if(m.t==='bossNext'&&Number.isFinite(m.tick))nextRise=m.tick;
      if(m.t==='move'&&boss?.id!=null&&m.id===boss.id&&point(m)){
        boss.x=m.x;boss.y=m.y;
      }
      if(m.t==='leave'&&m.id===visibleBossId)visibleBossId=null;
      if(m.t==='bossGone'||m.t==='bossHp'&&m.hpRemaining===0&&boss){
        // The round is over: nothing carries into the next spawn.
        boss=null;fresh=false;external=false;visibleBossId=null;ignored=null;
        if(run)end('Boss 已结束，等待原生恢复原任务');
      }
      if(m.t==='raidHit'||m.t==='raidRejoined'){
        if(run&&['attacking','fighting'].includes(run.stage)){
          run.stage='fighting';run.lastActivityAt=now();if(m.damage>0)run.hit=true;
        }else if(!run&&(m.t==='raidRejoined'||external||boss&&ignored!==round||ignored===null)){
          // A late hit from our finished round is not proof of a new unbounded raid.
          external=true;externalUntil=boss?.until??null;
        }
      }
      if(m.t==='bossStruck'&&m.died===false&&run&&['attacking','fighting'].includes(run.stage)){
        run.stage='fighting';run.lastActivityAt=now();
      }
      const died=m.t==='bossStruck'&&m.died===true||m.t==='batch'&&
        m.e?.some(e=>e.kind==='died'&&e.keptPack===true);
      if(died){
        if(run&&['attacking','fighting','dead'].includes(run.stage)||fightingAtStart!==null){
          lastDeath={playerId:run?.playerId??fightingAtStart,tick:frame.tick};
          if(run){if(run.stage!=='ended')run.stage='dead';run.deathTick=frame.tick;}
        }else if(!run)external=false;
      }
    }
  }
  // The Boss's own tile usually cannot be walked onto, so a walk there finds no
  // path. Like the native join, aim at the tiles within three steps of it,
  // nearest to where the trip started first; a walk that finds no path moves
  // on to the next tile.
  const MAX_WALKS=8;
  function approachTile(from,b,attempt){
    const tiles=[];
    for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(dx||dy)tiles.push({x:b.x+dx,y:b.y+dy});
    tiles.sort((a,c)=>distance(from,a)-distance(from,c)||a.x-c.x||a.y-c.y);
    return tiles[attempt%tiles.length];
  }
  // interruptWalk: the helper's own walk (bank, market, portal) may be dropped
  // for a Boss; a player's walk in assist mode is left alone.
  function next(p,{interruptWalk=false}={}){
    if(!p)return null;
    if(external&&externalUntil!==null&&currentTick()>=externalUntil){external=false;externalUntil=null;}
    if(run&&p.id!==run.playerId){finish();return null;}
    if(run){
      if(run.expectedQueue&&!run.savedConfirmed&&run.stage!=='saving'&&!acceptSaved(p)){
        if(now()-run.sentAt<=15000)return wait('本轮已结束，仍在核对服务器保留的原任务');
        return {...wait('原任务保存未获确认，已停止自动操作；请检查游戏队列后再开始'),blocked:true};
      }
      if(run.expectedQueue&&run.stage!=='saving'&&!ownQueue(p)){
        // Native restoration or a player edit always wins over our saved copy.
        finish();return null;
      }
      if(!run.expectedQueue&&(p.route||p.queue?.length||p.held)){finish();return null;}
      if(run.stage==='saving'){
        if(acceptSaved(p)){run.stage='ready';run.progressAt=now();run.position={x:p.x,y:p.y};}
        else if(!p.route&&p.held&&(p.raidHeld||!same(p.queue??[],run.beforeQueue))){finish();return null;}
        else if(now()-run.sentAt>15000)return {...wait('原任务保存未获确认，已停止自动操作；请检查游戏队列后再开始'),blocked:true};
        else return wait('等待服务器确认原任务和玩家队列已完整保留');
      }
      if(run.until!=null&&currentTick()>=run.until&&run.stage!=='ended'&&run.stage!=='resuming')
        end('本轮 Boss 已到期，等待原生恢复');
      if(run.stage==='ended'||run.stage==='resuming'){
        if(!run.expectedQueue){finish();return null;}
        if(run.stage==='resuming')return now()-run.sentAt>20000?
          {...wait('原任务恢复未获确认，已停止重发；请检查游戏队列后再开始'),blocked:true}:
          wait('已请求恢复原队首任务，等待服务器确认');
        if(now()-run.endedAt<6000||snapshotAt<=run.endedAt)return wait(run.reason);
        if(ownQueue(p))return action({t:'startQueued',index:0},'原生尚未恢复，续跑已核对的原任务；其余队列顺序不变');
        finish();return null;
      }
      if(!fresh)return wait('等待服务器重新确认本轮 Boss 状态');
      if(run.stage==='dead')return wait('本轮 Boss 已阵亡并保留贡献，不再返场；等待原生恢复');
      if(participation==='tag'&&run.hit&&['attacking','fighting'].includes(run.stage))
        return action({t:'leaveWorldBoss'},'服务器已确认有效伤害，按所选策略离开并恢复原任务；奖励等待本轮结算');
      if(run.stage==='fighting')return wait(recentActivity()?
        run.hit?'近期收到参战回报，已命中 Boss':'近期收到参战回报，等待有效命中':
        run.hit?'曾命中 Boss，等待新的参战回报':'曾确认加入 Boss，等待新的参战回报');
      if(run.stage==='attacking'){
        if(run.nativeJoinPending)return now()-run.sentAt>90000?
          action({t:'leaveWorldBoss'},'原生加入迟迟未能执行，结束本轮并恢复原任务'):
          wait('等待游戏界面执行加入，尚未发送攻击请求');
        if(now()-run.sentAt>20000)return action({t:'leaveWorldBoss'},'参战未获确认，停止本轮尝试并恢复原任务');
        return wait('已请求参战，等待服务器命中或参战确认');
      }
      if(!boss||key(boss)!==run.key){end('本轮 Boss 信息已变化');return wait(run.reason);}
      if(distance(p,boss)<=3)return action({t:'attackWorldBoss'},'已到达 Boss，使用当前装备参与本轮');
      if(!same(run.position,{x:p.x,y:p.y})){
        run.position={x:p.x,y:p.y};run.progressAt=now();run.walkAttempts=0;
      }
      if(now()-run.progressAt>60000||now()-run.startedAt>360000)
        return action({t:'leaveWorldBoss'},'赶路未推进或超时，放弃本轮并恢复原任务');
      if(run.stage==='moving'){
        const changed=run.destination&&distance(run.destination,boss)>3;
        const stopped=snapshotAt>run.sentAt&&now()-run.sentAt>=5000&&!p.path?.length&&p.activity!=='walking';
        if(!changed&&!stopped)return wait('正在前往世界 Boss，保留玩家原队列');
        if((run.walkAttempts??0)>=MAX_WALKS)return action({t:'leaveWorldBoss'},
          `Boss 周围 ${MAX_WALKS} 个落脚点都走不过去，结束本轮并恢复原任务`);
      }
      const tile=approachTile(run.origin??p,boss,run.walkAttempts??0);
      return action({t:'walk',x:tile.x,y:tile.y},(run.walkAttempts??0)?
        '上一个落脚点没有可走路径，换 Boss 附近另一格前往':'前往 Boss 附近三格内的落脚点');
    }
    if(external||p.raidHeld)return wait('玩家正在参加世界 Boss，助手不接管也不收菜打断');
    if(!fresh||!boss||ignored===round)return null;
    // The player's time window and per-round skip chance (one draw per round).
    const verdict=policy.boss(key(boss),settings);
    policyReason=verdict==='outside'?`不在设定的参战时段（${settings.bossStart}–${settings.bossEnd}）`:
      verdict==='skip'?`本轮按 ${settings.skipPercent}% 概率跳过`:null;
    if(verdict!=='join')return null;
    const remaining=boss.until==null?null:boss.until-currentTick(),steps=Math.max(0,distance(p,boss)-3);
    if(remaining!==null&&remaining<Math.max(15,steps*2+10))return null;
    if(remaining===null&&steps>0)return null;
    const walking=!p.route&&(p.path?.length||p.activity==='walking');
    if(p.route?.errand||p.enhance||p.held||!p.route&&p.queue?.length||walking&&!interruptWalk)return null;
    if(p.route)return action({t:'setAside',raid:true},'临时保留当前任务的剩余份额和原队列，再参加世界 Boss');
    if(distance(p,boss)<=3)return action({t:'attackWorldBoss'},'使用当前装备参加世界 Boss');
    const tile=approachTile(p,boss,0);
    return action({t:'walk',x:tile.x,y:tile.y},'前往世界 Boss 附近三格内的落脚点；不增加或覆盖玩家队列');
  }
  function issued(intent,p,reason){
    if(!intent||!p)return;
    if(!run&&['setAside','walk','attackWorldBoss'].includes(intent.t)&&boss&&fresh){
      lastResult=null;
      run={key:key(boss),round,name:boss.name,until:boss.until,playerId:p.id,stage:'ready',
        startedAt:now(),startTick:p.lastTick,sentAt:now(),progressAt:now(),position:{x:p.x,y:p.y},origin:{x:p.x,y:p.y},
        beforeQueue:copy(p.queue??[]),expectedQueue:null,hit:false,attackSent:false,lastActivityAt:null};
      if(intent.t==='setAside'&&intent.raid&&p.route)run.expectedQueue=[savedTask(p),...copy(p.queue??[])];
    }
    if(!run)return;
    run.sentAt=now();
    if(intent.t==='setAside')run.stage='saving';
    if(intent.t==='walk'){
      run.stage='moving';run.destination={x:intent.x,y:intent.y};run.walkAttempts=(run.walkAttempts??0)+1;
    }
    // issued precedes the socket send: this records a join request, not acceptance.
    if(intent.t==='attackWorldBoss'){run.stage='attacking';run.attackSent=true;run.nativeJoinPending=false;}
    if(intent.t==='leaveWorldBoss')end(reason??'已停止本轮，等待原生恢复原任务');
    if(intent.t==='startQueued')run.stage='resuming';
  }
  function manualAction(intent,p=null){
    if(!intent)return;
    if(intent.t==='attackWorldBoss'){cancel();external=true;externalUntil=boss?.until??externalUntil;return;}
    if(intent.t==='leaveWorldBoss'){cancel();external=false;ignored=boss?round:null;return;}
    if(['queue','unqueue','moveQueued'].includes(intent.t)){cancel();return;}
    if(['walk','setRoute','fight','clearRoute','setAside','startQueued','skip','enhance'].includes(intent.t)){
      // Changing task or walking before departure keeps the round open; only
      // taking over a round the player is in skips it (upstream v0.7.18).
      const participating=external||p?.raidHeld===true;
      cancel();external=false;
      if(participating)ignored=boss?round:null;
    }
  }
  function retryNativeJoin(p){
    if(!run||run.stage!=='fighting'||run.nativeJoinRetried||!fresh||!boss||key(boss)!==run.key||
      visibleBossId==null||visibleBossId!==boss.id||!p||p.id!==run.playerId||!(p.hp>0)||distance(p,boss)>3||
      run.until!=null&&currentTick()>=run.until)return false;
    const quietSince=Math.max(observationSince,run.lastActivityAt??observationSince);
    if(now()-quietSince<=30000)return false;
    if(run.expectedQueue?!(run.savedConfirmed&&ownQueue(p)):(p.route||p.queue?.length||p.held))return false;
    run.nativeJoinRetried=true;run.stage='ready';return true;
  }
  return {
    observe,next,issued,manualAction,cancel,retryNativeJoin,setParticipation,
    setAutomation(value){settings=normalizeAutomation(value);},
    retrySkipped(){if(!skipped())return false;ignored=null;return true;},
    queueNativeJoin(){if(run?.stage==='attacking'){run.nativeJoinPending=true;run.attackSent=false;}},
    nativeJoinSent(){if(run?.stage==='attacking'){run.nativeJoinPending=false;run.attackSent=true;run.sentAt=now();}},
    ownsRun:()=>!!run,
    ownsQueue:p=>run?.expectedQueue&&!run.savedConfirmed?acceptSaved(p):ownQueue(p),
    ownsDeath:value=>lastDeath?.playerId===playerId&&lastDeath.tick===(typeof value==='number'?value:value?.tick),
    status:()=>({participation,name:boss?.name??run?.name??null,active:!!boss&&fresh&&
      (boss.until==null||currentTick()<boss.until),visible:fresh&&visibleBossId!=null&&visibleBossId===boss?.id,
      phase:run?.stage??(external?'manual':'watching'),skipped:skipped(),participated:participated(),
      hit:run?.hit??false,recentActivity:recentActivity()===true,lastActivityAt:run?.lastActivityAt??null,
      owned:!!run,until:boss?.until??run?.until??null,lastResult:copy(lastResult),
      policyReason:!run&&!external&&boss&&fresh?policyReason:null,
      nextIn:nextRise!=null&&nextRise>currentTick()?(nextRise-currentTick())*(data.tickMs??600)/1000:null}),
    // Round numbers restart with the page, so a done round is saved by its key,
    // and only an announced one (with an end time) is ever matched again.
    save:()=>copy({v:1,participation,boss,run,external,externalUntil,lastDeath,playerId,lastResult,
      ignoredKey:ignored!==null&&ignored===round&&boss?.until!=null?key(boss):null,policy:policy.save()}),
    restore(value){
      if(value?.v!==1)return;
      setParticipation(value.participation);
      policy=createAutomationPolicy({now,random,saved:value.policy});
      boss=null;fresh=false;visibleBossId=null;observationSince=now();
      external=value.external===true;ignored=null;
      const savedKey=typeof value.ignoredKey==='string'?value.ignoredKey:typeof value.ignored==='string'?value.ignored:null;
      restoredIgnoredKey=savedKey&&!savedKey.includes(':entity:')?savedKey:null;
      externalUntil=Number.isFinite(value.externalUntil)?value.externalUntil:null;
      playerId=value.playerId??null;lastDeath=value.lastDeath??null;
      const result=value.lastResult;
      lastResult=result&&typeof result.name==='string'&&typeof result.reason==='string'&&
        Number.isFinite(result.endedAt)&&(result.attackSent===null||typeof result.attackSent==='boolean')&&
        typeof result.hit==='boolean'?{...copy(result),round:null}:null;
      const r=value.run;
      if(r&&Number.isFinite(r.playerId)&&typeof r.key==='string'&&Number.isFinite(r.startedAt)&&
        ['ready','saving','moving','attacking','fighting','dead','ended','resuming'].includes(r.stage)&&
        Array.isArray(r.beforeQueue)&&(r.expectedQueue===null||Array.isArray(r.expectedQueue))){
        run=copy(r);
        run.round=null; // re-linked when the announcement for run.key arrives
        // A queued UI callback dies with its page. Only an explicitly unsent
        // join can be retried after new welcome/Boss snapshots validate the run.
        if(run.stage==='attacking'&&run.nativeJoinPending&&run.attackSent===false){run.stage='ready';run.nativeJoinPending=false;}
      }
    }
  };
}
