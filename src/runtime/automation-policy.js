// Player settings for the automatic World Boss and harvest (upstream v0.8.1):
// a local time window for joining, a per-round skip chance, and when to
// harvest (every field ripe, or one same-seed group ripe) after a random delay.
export function normalizeAutomation(value={}) {
  value??={};
  const number=(key,fallback,min,max)=>Number.isFinite(Number(value[key]))?Math.max(min,Math.min(max,Number(value[key]))):fallback;
  const time=(key,fallback,end=false)=>{
    const match=String(value[key]??'').trim().match(/^(\d{1,2})(?::([0-5]\d))?$/);
    if(!match)return fallback;
    const h=Number(match[1]),m=Number(match[2]??0);
    return h<24||end&&h===24&&m===0?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`:fallback;
  };
  const a=number('delayMin',0,0,1440),b=number('delayMax',0,0,1440);
  return {bossStart:time('bossStart','00:00'),bossEnd:time('bossEnd','24:00',true),skipPercent:number('skipPercent',0,0,100),
    harvestMode:value.harvestMode==='seed'?'seed':'all',delayMin:Math.min(a,b),delayMax:Math.max(a,b)};
}

// Equal start and end means all day; the window may cross midnight.
export function inBossWindow(settings,time=Date.now()) {
  const minutes=text=>{const [h,m]=text.split(':').map(Number);return h*60+m;};
  const date=new Date(time),current=date.getHours()*60+date.getMinutes();
  const start=minutes(settings.bossStart),end=minutes(settings.bossEnd);
  return start===end||(start<end?current>=start&&current<end:current>=start||current<end);
}

// One draw per round (and per harvest batch), kept across refreshes.
export function createAutomationPolicy({now=()=>Date.now(),random=Math.random,saved=null}={}) {
  let decision=saved?.boss??null,pending=saved?.farm??null;
  return {
    boss(key,settings) {
      if(!inBossWindow(settings,now()))return 'outside';
      if(!decision||decision.key!==key||decision.percent!==settings.skipPercent)
        decision={key,percent:settings.skipPercent,result:settings.skipPercent===0?'join':
          settings.skipPercent===100||random()*100<settings.skipPercent?'skip':'join'};
      return decision.result;
    },
    farm(key,settings) {
      if(!key){pending=null;return null;}
      const config=JSON.stringify([settings.harvestMode,settings.delayMin,settings.delayMax]);
      if(pending?.key!==key||pending.config!==config||!Number.isFinite(pending.dueAt))
        pending={key,config,dueAt:now()+60000*(settings.delayMin+random()*(settings.delayMax-settings.delayMin))};
      return {...pending,ready:now()>=pending.dueAt};
    },
    save:()=>({boss:decision,farm:pending})
  };
}
