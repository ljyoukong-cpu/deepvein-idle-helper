// Personal settlement evidence: research/boss-rewards-mechanics.md.
// Original chat ticks survive welcome-history replay and are not frame ticks.
// Chat senders of the town's boss-loot receipts.
export const BOSS_LOOT_SENDERS=['Deep Vein','The Deep'];
// Two native wordings: "… — on your shelf …" and the newer "…. On your shelf …".
export const BOSS_LOOT_RECEIPT=/^Your share of the (.+): (.+?)(?: — on|\. On) your shelf at the depot\.$/;

export function createBossLootHistory(data,storage,now=()=>Date.now()) {
  let playerId=null,entries=[],saved=true,lastFrame=null,migratedFrom=null;
  const storageKey=()=>`deepvein-boss-loot-v1:${playerId}`;
  function receipt(message,time) {
    if(!message||!BOSS_LOOT_SENDERS.includes(message.name)||
      typeof message.text!=='string'||message.text.length>4000||
      !Number.isSafeInteger(message.tick)||message.tick<0)return null;
    const match=BOSS_LOOT_RECEIPT.exec(message.text);
    if(!match)return null;
    // Both wordings use the original storage key, so history replays stay unique.
    return {key:`${message.tick}:Your share of the ${match[1]}: ${match[2]} — on your shelf at the depot.`,tick:message.tick,
      time:Number.isFinite(time)&&Math.abs(time)<=8640000000000000?time:null,boss:match[1],reward:match[2]};
  }
  function newest(rows) {
    const unique=new Map();
    for(const row of rows)if(!unique.has(row.key)||unique.get(row.key).time===null)unique.set(row.key,row);
    return [...unique.values()].sort((a,b)=>b.tick-a.tick||a.key.localeCompare(b.key)).slice(0,100);
  }
  function read(timeAt) {
    try {
      const value=JSON.parse(storage.getItem(storageKey())??'null');
      if(![1,2].includes(value?.v)||!Array.isArray(value.entries))return [];
      const calibrated=value.v===2&&value.timeRevision===3;
      if(!calibrated){saved=false;migratedFrom=value.v;}
      return value.entries.slice(0,100).map(row=>receipt({name:'The Deep',tick:row?.tick,
        text:typeof row?.boss==='string'&&typeof row?.reward==='string'?
          `Your share of the ${row.boss}: ${row.reward} — on your shelf at the depot.`:null},
        calibrated?row?.time:timeAt(row?.tick))).filter(Boolean);
    }catch {saved=false;return [];}
  }
  function observe(frame) {
    if(!Array.isArray(frame?.m))return;
    const receivedAt=now(),timeAt=messageTick=>{
      const time=Number.isSafeInteger(frame.tick)&&frame.tick>=0?
        receivedAt-(frame.tick-messageTick)*data.tickMs:null;
      return Number.isFinite(time)&&Math.abs(time)<=8640000000000000?time:null;
    };
    if(Number.isSafeInteger(frame.tick)&&frame.tick>=0)lastFrame={tick:frame.tick,receivedAt};
    const welcome=frame.m.find(m=>m?.t==='welcome');
    if(welcome) {
      const id=welcome.you?.id;
      if(!Number.isSafeInteger(id)||id<0){connectionOpened();return;}
      if(id!==playerId){playerId=id;saved=true;entries=[];migratedFrom=null;}
    }
    if(playerId===null)return;
    const messages=[...(Array.isArray(welcome?.chat)?welcome.chat:[]),...frame.m.filter(m=>m?.t==='chat')];
    const incoming=messages.map(message=>receipt(message,timeAt(message?.tick))).filter(Boolean);
    if(!welcome&&!incoming.length&&!entries.some(row=>row.time===null))return;
    const merged=newest([...entries,...read(timeAt),...incoming])
      .map(row=>row.time===null?{...row,time:timeAt(row.tick)}:row);
    if(saved&&JSON.stringify(merged)===JSON.stringify(entries))return;
    entries=merged;
    try {storage.setItem(storageKey(),JSON.stringify({v:2,timeRevision:3,entries}));saved=true;}
    catch {saved=false;}
  }
  function connectionOpened(){playerId=null;entries=[];saved=true;lastFrame=null;migratedFrom=null;}
  return {observe,connectionOpened,status:()=>({playerId,entries,saved}),
    diagnostics:()=>({playerId,schema:2,timeRevision:3,migratedFrom,tickMs:data.tickMs,lastFrame,
      entries:entries.map(row=>({...row,currentEstimate:lastFrame?
        lastFrame.receivedAt-(lastFrame.tick-row.tick)*data.tickMs:null}))})};
}

export function createBossLootChat(document,history,translateGameText=text=>text) {
  let mounted=null,style=null,disposed=false;
  const css=`
    .chat[data-dv-loot-open]>.chat-body>[data-log]{position:absolute;visibility:hidden;pointer-events:none}
    .chat[data-dv-loot-open]>.chat-body>[data-dm-people],
    .chat[data-dv-loot-open]>.chat-body>[data-compose],
    .chat[data-dv-loot-open]>.chat-body>[data-chat-guest]{display:none!important}
    .chat .dv-boss-loot[hidden]{display:none!important}
    .chat .dv-boss-loot{box-sizing:border-box;min-height:80px;gap:10px}
    .chat .dv-loot-note{color:var(--ink-faint);font-size:.9em;line-height:1.5}
    .chat .dv-loot-entry{padding:0 0 9px;border-bottom:1px solid var(--edge);overflow-wrap:anywhere}
    .chat .dv-loot-entry:last-child{border-bottom:0}
    .chat .dv-loot-title{display:flex;flex-wrap:wrap;gap:3px 10px;align-items:baseline;margin-bottom:3px}
    .chat .dv-loot-boss{color:var(--brass);font-weight:700}
    .chat .dv-loot-time{color:var(--ink-faint);font-size:.85em;font-variant-numeric:tabular-nums}
    .chat .dv-loot-reward{color:var(--ink);line-height:1.5}
    .m-on .chat .dv-boss-loot{height:auto!important;min-height:0;flex:1 1 auto}
    .m-on .chat[data-dv-loot-open]>.chat-body>[data-log]{display:none!important}
  `;
  const element=(tag,className,text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  const leave=(restoreScroll=true)=>{
    const m=mounted;if(!m?.active)return;
    m.active=false;m.panel.hidden=true;m.chat.removeAttribute('data-dv-loot-open');
    m.tab.setAttribute('aria-selected','false');
    for(const tab of m.tabs.querySelectorAll('[data-room]'))tab.setAttribute('aria-selected',String(tab.dataset.room===m.chat.dataset.room));
    if(restoreScroll&&m.chat.dataset.room===m.room)m.log.scrollTop=m.scroll;
  };
  const unmount=()=>{
    if(!mounted)return;
    leave();mounted.tabs.removeEventListener('click',mounted.onRoom);
    mounted.tab.remove();mounted.panel.remove();mounted=null;
  };
  function render() {
    const m=mounted;if(!m)return;
    const state=history.status(),signature=JSON.stringify(state);
    if(signature===m.signature)return;
    m.signature=signature;
    const scroll=m.panel.scrollTop;
    m.panel.replaceChildren();
    const note=state.playerId==null?'进入角色后开始记录自己的世界 Boss 掉落。':
      state.saved?'最近 100 条 · 仅保存本角色的掉落，记录保存在当前浏览器。':
        '浏览器暂时无法保存，刷新后本次记录可能丢失。';
    m.panel.append(element('div','dv-loot-note',note));
    const entries=state.entries??[];
    if(!entries.length)m.panel.append(element('div','dv-loot-note','暂无掉落记录；收到服务器的 Boss 奖励后会显示在这里。'));
    for(const entry of entries){
      const row=element('article','dv-loot-entry'),title=element('div','dv-loot-title');
      const time=Number.isFinite(entry.time)&&entry.time>0?new Date(entry.time).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'时间未知';
      title.append(element('strong','dv-loot-boss',translateGameText(entry.boss)),element('time','dv-loot-time',time));
      row.append(title,element('div','dv-loot-reward',translateGameText(entry.reward).replace(/\b(?:coins|gold)\b/gi,'金币').replace(/\bvoid ?shards\b/gi,'虚空碎片')));
      m.panel.append(row);
    }
    m.panel.scrollTop=scroll;
  }
  function refresh() {
    if(disposed||!document?.querySelector)return;
    const chat=document.querySelector('.chat'),body=chat?.querySelector('.chat-body'),tabs=body?.querySelector('.chat-tabs'),log=body?.querySelector('[data-log]');
    if(!chat||!body||!tabs||!log){unmount();return;}
    if(mounted?.chat!==chat||mounted.tabs!==tabs||!mounted.tab.isConnected||!mounted.panel.isConnected){
      unmount();
      chat.removeAttribute('data-dv-loot-open');
      for(const leftover of chat.querySelectorAll('[data-dv-boss-loot-tab],[data-dv-boss-loot-panel]'))leftover.remove();
      for(const nativeTab of tabs.querySelectorAll('[data-room]'))nativeTab.setAttribute('aria-selected',String(nativeTab.dataset.room===chat.dataset.room));
      if(!style){style=element('style');style.textContent=css;(document.head??document.body).append(style);}
      const tab=element('button','chat-tab','Boss 掉落'),panel=element('section','chat-log dv-boss-loot');
      tab.type='button';tab.dataset.dvBossLootTab='';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');
      panel.dataset.dvBossLootPanel='';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label','世界 Boss 掉落记录');panel.hidden=true;
      mounted={chat,body,tabs,log,tab,panel,active:false,room:null,scroll:0,height:260,signature:null,onRoom:null};
      const m=mounted;
      m.onRoom=event=>{
        const room=event.target.closest?.('[data-room]');
        if(!m.active||!room||!tabs.contains(room))return;
        const restore=room.dataset.room===m.room,scroll=m.scroll;
        leave(false);
        if(restore&&m.chat.dataset.room===m.room)m.log.scrollTop=scroll;
      };
      tabs.addEventListener('click',m.onRoom);
      tab.addEventListener('click',()=>{
        if(mounted!==m||m.active)return;
        m.scroll=log.scrollTop;m.room=chat.dataset.room;m.height=log.offsetHeight||parseFloat(log.style.height)||260;
        m.active=true;chat.setAttribute('data-dv-loot-open','');panel.hidden=false;
        panel.style.height=log.style.height||`${m.height}px`;
        for(const nativeTab of tabs.querySelectorAll('[data-room]'))nativeTab.setAttribute('aria-selected','false');
        tab.setAttribute('aria-selected','true');render();
      });
      tabs.append(tab);body.insertBefore(panel,log);
    }
    const m=mounted;
    if(m.active){
      if(m.chat.dataset.room!==m.room||m.tabs.querySelector('[data-room][aria-selected="true"]'))leave(false);
      else m.panel.style.height=m.log.style.height||`${m.height}px`;
    }
    render();
  }
  function destroy(){disposed=true;unmount();style?.remove();style=null;}
  return {refresh,destroy};
}
