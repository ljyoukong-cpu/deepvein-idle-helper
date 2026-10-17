import {buffKey} from '../planner/supplies.js';
import {BOSS_LOOT_RECEIPT, BOSS_LOOT_SENDERS} from '../ui/boss-loot.js';

export function measurementKeys(data,p,level) {
  const job=data.jobs.find(j=>j.id===p.route?.jobId),zone=data.zones.find(z=>z.id===p.route?.zoneId);
  const tier=p.workRarity??p.route?.rarity??0;
  const routeKey=p.route?.errand?null:zone?`combat:${zone.monsterId}`:job&&!job.grow?`job:${job.id}${tier?`:rarity:${tier}`:''}`:null;
  const skills=zone?['melee','ranged','magic','defence','hitpoints']:job?[job.skill]:[];
  return {routeKey,equipmentKey:JSON.stringify(Object.keys(p.equipment).sort().map(k=>[k,p.equipment[k]])),
    levelsKey:JSON.stringify(skills.map(s=>[s,level(p.skills[s])])),buffKey:buffKey(data,p)};
}

export class Telemetry {
  constructor(data,level) {
    this.data=data;this.level=level;this.previous=null;this.dirty=false;this.playerId=null;
    this.totalXp=0;this.netCoins=0;this.activeSeconds=0;this.idleSeconds=0;this.rates={};
  }
  command(intent) {if(intent.t!=='resync')this.dirty=true;}
  receive(frame) {
    // Receipts can follow their snapshot in the same frame. Inspect the whole
    // frame before observing it; unrelated rewards must not calibrate a route.
    if(frame.m.some(m=>m.t==='marketFilled'||m.t==='streak'||
      m.t==='batch'&&m.e?.some(e=>e.kind==='achievement'||e.kind==='boxOpened')||
      m.t==='chat'&&BOSS_LOOT_SENDERS.includes(m.name)&&BOSS_LOOT_RECEIPT.test(m.text??'')))this.dirty=true;
  }
  observe(p,now,{reset=false}={}) {
    if(this.playerId!==null&&this.playerId!==p.id){
      this.totalXp=0;this.netCoins=0;this.activeSeconds=0;this.idleSeconds=0;this.rates={};
    }
    this.playerId=p.id;
    const keys=measurementKeys(this.data,p,this.level);
    const base=id=>id%this.data.plusScale%this.data.rarityScale;
    const foodUnits=Object.entries(p.bank).reduce((n,[id,qty])=>n+(this.data.items[base(+id)]?.heals?qty:0),0)+
      p.pack.reduce((n,i)=>n+(this.data.items[base(i.itemId)]?.heals?i.qty:0),0);
    const current={...keys,id:p.id,at:now,skills:{...p.skills},coins:p.coins,
      enhancing:!!p.enhance,achievementCount:Object.keys(p.achievements??{}).length,
      foodUnits,kills:Object.values(p.tally?.monsters??{}).reduce((n,k)=>n+k,0),
      traveling:p.activity==='walking'||!!p.path?.length||['toBank','toSite'].includes(p.route?.phase),
      busy:!!(p.enhance||p.path?.length||p.activity==='walking'||p.activity==='working'||(!p.activity&&p.route))};
    const before=this.previous;this.previous=current;
    const seconds=before?(now-before.at)/1000:0;
    if(reset||!before||before.id!==p.id||seconds<=0||seconds>45){this.dirty=false;return;}
    const xp=Object.fromEntries(this.data.skills.map(s=>[s,p.skills[s]-before.skills[s]]));
    if(Object.values(xp).some(n=>n<0)){this.dirty=false;return;}
    this.totalXp+=Object.values(xp).reduce((a,b)=>a+b,0);this.netCoins+=p.coins-before.coins;
    if(before.busy)this.activeSeconds+=seconds;else this.idleSeconds+=seconds;
    if(!this.dirty&&before.achievementCount===current.achievementCount&&!current.enhancing&&!before.enhancing&&keys.routeKey&&before.routeKey===keys.routeKey&&
      before.equipmentKey===keys.equipmentKey&&before.levelsKey===keys.levelsKey&&before.buffKey===keys.buffKey){
      let rate=this.rates[keys.routeKey];
      if(!rate||rate.equipmentKey!==keys.equipmentKey||rate.levelsKey!==keys.levelsKey||rate.buffKey!==keys.buffKey)
        rate=this.rates[keys.routeKey]={...keys,seconds:0,xp:0,coins:0,samples:0,foodUsed:0,kills:0,travelSeconds:0};
      const skills=JSON.parse(keys.levelsKey).map(([s])=>s);
      rate.seconds+=seconds;rate.xp+=skills.reduce((sum,s)=>sum+xp[s],0);
      rate.coins+=p.coins-before.coins;rate.samples++;rate.updatedAt=now;
      if(keys.routeKey.startsWith('combat:')){
        rate.foodUsed+=Math.max(0,before.foodUnits-current.foodUnits);
        rate.kills+=Math.max(0,current.kills-before.kills);
      }
      if(before.traveling)rate.travelSeconds+=seconds;
      rate.xpPerSecond=rate.xp/rate.seconds;rate.coinsPerSecond=rate.coins/rate.seconds;
      rate.foodPerHour=rate.foodUsed*3600/rate.seconds;rate.secondsPerKill=rate.kills?rate.seconds/rate.kills:null;
    }
    this.dirty=false;
  }
  summary() {
    const seconds=this.activeSeconds+this.idleSeconds;
    return {playerId:this.playerId,totalXp:this.totalXp,netCoins:this.netCoins,activeSeconds:this.activeSeconds,
      idleSeconds:this.idleSeconds,xpPerHour:seconds?this.totalXp*3600/seconds:0,
      coinsPerHour:seconds?this.netCoins*3600/seconds:0,rates:this.rates};
  }
  restore(saved) {
    if(!saved||typeof saved!=='object')return;
    if(Number.isInteger(saved.playerId))this.playerId=saved.playerId;
    for(const key of ['totalXp','netCoins','activeSeconds','idleSeconds'])
      if(Number.isFinite(saved[key])&&(key==='netCoins'||saved[key]>=0))this[key]=saved[key];
    // Rate calibration is session-local: saved values may predate updated game data.
    this.previous=null;this.rates={};
  }
}
