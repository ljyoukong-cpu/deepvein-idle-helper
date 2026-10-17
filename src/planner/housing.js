import {professionSkill} from './professions.js';
import {autoUsableMaterial} from './quality.js';
import {inventoryBudget, reviewInventory, saleProtectionReason} from './inventory.js';
import {COAL_ID, baseId, itemLabel, merchantPrice, plusOf, rarityOf} from './items.js';
import {payback} from './investment.js';

export const HOUSE_NAMES={mine:'矿井',sawmill:'锯木厂',pond:'鱼塘',garden:'花园',forge:'锻造炉',yard:'训练场',
  lockbox:'锁箱工作台',range:'炉灶',fletchrack:'制箭架',herbrack:'药草架',loom:'织布机',lectern:'符文讲台',
  post:'陪练桩',armour:'护甲架',target:'箭靶',altar:'祭坛',shrine:'幸运神龛',storeroom:'储藏室'};
export const HOUSE_ACTIONS=new Set(['buildRoom','placeFurniture','convertHouse','upgradeRoom']);
import {distance as houseDistance} from './items.js';
export {houseDistance};
// The command that restarts a route where it was: same site or zone, remaining
// count, banking rule and work quality.
export const resumeIntent=(p,route=p.route)=>route.zoneId!=null?{t:'fight',zoneId:route.zoneId,limit:route.limit??0}:
  {t:'setRoute',jobId:route.jobId,siteId:route.siteId,limit:route.limit??0,onFull:route.onFull??'bank',rarity:p.workRarity??route.rarity??0};
export function atHome(data,p) {
  const r=data?.houseTravel?.region;
  return !!r&&p.x>=r.x&&p.y>=r.y&&p.x<r.x+r.width&&p.y<r.y+r.height;
}
export function validHomePortal(data,p,intent) {
  const travel=data?.houseTravel;
  if(!travel||p.route||p.path?.length||p.held||p.raidHeld||p.queue?.length||p.enhance)return false;
  return intent.dir==='in'?!atHome(data,p)&&travel.portals.some(s=>houseDistance(p,s)<=1):
    intent.dir==='out'&&atHome(data,p)&&houseDistance(p,travel.exit)<=1;
}

// House points per item (client Tg/M$, index-DAY9oe71.js): a raw material
// gives its tier in its family; a crafted item gives the tier points of its raw
// inputs, x min(2, 1 + 0.5 x recipe depth), in the family that dominates them.
// Each quality step triples it; enhanced items cannot be converted.
const pointTables=new WeakMap();
export function housePointsOf(data,id) {
  if(!pointTables.has(data))pointTables.set(data,buildPointTable(data));
  return pointTables.get(data)(id);
}
function buildPointTable(data) {
  const materials=new Map();
  const families={woodcutting:'wood',mining:'stone',fishing:'fish',farming:'crop'};
  for(const job of data.jobs)if(families[job.skill]&&(job.skill==='farming'||!job.inputs.length))
    materials.set(job.output.itemId,{family:families[job.skill],level:job.levelReq});
  for(const monster of data.monsters)if(!materials.has(monster.drop))
    materials.set(monster.drop,{family:'hide',level:monster.level});
  for(const family of ['wood','stone','fish','crop','hide']) {
    const levels=[...new Set([...materials.values()].filter(m=>m.family===family).map(m=>m.level))].sort((a,b)=>a-b);
    for(const material of materials.values())if(material.family===family)material.points=levels.indexOf(material.level)+1;
  }
  const RARITY_POINTS=3,craftJobs=new Map(),crafted=new Map();
  for(const job of data.jobs)if(job.inputs.length&&!materials.has(job.output.itemId)&&!craftJobs.has(job.output.itemId))
    craftJobs.set(job.output.itemId,job);
  function craftedPoints(base) {
    if(crafted.has(base))return crafted.get(base);
    crafted.set(base,null);
    const families=new Map();let depth=0;
    (function walk(id,qty,level) {
      const raw=materials.get(baseId(data,id));
      if(raw){families.set(raw.family,(families.get(raw.family)??0)+qty*raw.points);return;}
      const job=level<=8&&craftJobs.get(baseId(data,id));
      if(!job)return;
      depth=Math.max(depth,level+1);
      for(const input of job.inputs)walk(input.itemId,qty*input.qty/job.output.qty,level+1);
    })(base,1,0);
    let family=null,total=0,top=0;
    for(const [name,n]of families){total+=n;if(n>top){top=n;family=name;}}
    const result=family&&total>0?{family,each:total*Math.min(2,1+.5*depth)}:null;
    crafted.set(base,result);return result;
  }
  return id=>{
    if(plusOf(data,id)>0)return null;
    const base=baseId(data,id),raw=materials.get(base),made=raw?null:craftedPoints(base);
    const family=raw?.family??made?.family;
    return family?{family,each:(raw?raw.points:made.each)*RARITY_POINTS**rarityOf(data,id)}:null;
  };
}

// Fuel for missing house points is whatever gives them most cheaply: each
// candidate is valued at its best sale (market, town buyback or merchant) per
// point it yields. Any quality except legendary; never planned materials, food
// reserve, worn or locked gear, enhanced or bank-locked items, or common coal.
export function chooseHouseFuel(data,{p,families,missing,inventory,budget,unitValue,refused={}}) {
  const donors=Object.entries(p.bank).map(([key,qty])=>{
    const id=Number(key),points=housePointsOf(data,id);
    if(!(qty>0)||!points||!families.includes(points.family)||id===COAL_ID||!autoUsableMaterial(data,id)||
      p.bankLocked?.includes(id)||(refused[id]??0)>p.lastTick)return null;
    const row=inventory.items.find(r=>r.itemId===id),base=baseId(data,id);
    // Ordinary surplus as the inventory review sees it; a quality material
    // (not gear, not otherwise protected) beyond what the plans reserve.
    const available=row?.sellFromBank>0?row.sellFromBank:
      rarityOf(data,id)>0&&!data.gear.some(g=>g.itemId===base)&&(base===COAL_ID||!saleProtectionReason(data,base))?
        Math.max(0,qty-(budget.items[id]??0)):0;
    if(available<=0)return null;
    return {itemId:id,available,each:points.each,unit:unitValue(id,available)};
  }).filter(Boolean).sort((a,b)=>a.unit/a.each-b.unit/b.each||a.itemId-b.itemId);
  let remaining=missing,cost=0;const conversions=[];
  for(const donor of donors) {
    const qty=Math.min(donor.available,Math.ceil(remaining/donor.each));
    if(qty<=0)continue;
    conversions.push({itemId:donor.itemId,qty});cost+=qty*donor.unit;remaining-=Math.floor(qty*donor.each);
    if(remaining<=0)break;
  }
  return {donors,conversions,cost,remaining};
}

// Native portal geometry: index-CoaXHkN-.js. The server additionally requires
// Home for housing commands (house-away); client-side affordability is insufficient.
export function createHousing(data,planner) {
  // Fuel the game ignored (no error, nothing changed) is skipped for a while.
  let owner=null,visit=null,retryAt=0,review=[],refusedFuel={};
  // "自动升级房屋" (upstream v0.8.2): off stops new building, placing, fuel and
  // upgrades; running timers continue and a visit under way leaves home.
  let enabled=true;
  const rules=data.houseRules,rooms=data.houseRooms??[];
  const housePoints=id=>housePointsOf(data,id);
  const known=p=>rules&&rooms.length&&Array.isArray(p.houseCells)&&p.houseCells.length>0&&
    p.houseCells.every(c=>Number.isInteger(c)&&c>=0&&c<rules.grid**2)&&p.houseFurniture&&p.house&&p.housePoints&&p.houseUpgrades;
  const roomName=id=>HOUSE_NAMES[id]??id;
  const cellPrice=p=>Math.round(rules.cellGold*rules.cellGrowth**Math.max(0,p.houseCells.length-1));
  const pointsFor=(p,id)=>Math.round(rules.upgradePoints*rules.pointsGrowth**(p.house[id]??0));
  const feeds=room=>[room.feeds,...room.alsoFeeds??[]];
  const points=(p,room)=>feeds(room).reduce((n,f)=>n+(p.housePoints[f]??0),0);
  function frontier(p) {
    return [...new Set(p.houseCells.flatMap(c=>[c-rules.grid,c+rules.grid,
      ...(c%rules.grid?[c-1]:[]),...(c%rules.grid<rules.grid-1?[c+1]:[])]))]
      .filter(c=>c>=0&&c<rules.grid**2&&c!==rules.lake&&!p.houseCells.includes(c)).sort((a,b)=>a-b);
  }
  const action=(intent,label,reason)=>({intent,label,reason,housing:true});
  function work(p,goal,style='magic',mode='balanced') {
    review=[];
    if(!enabled||!known(p)||mode==='assist'||goal?.itemTarget||p.held||p.raidHeld||p.queue?.length||p.enhance)return null;
    const budget=inventoryBudget(data,planner,p,goal),cells=frontier(p);
    // Maintenance can hold a separate equipment project while the main goal
    // remains unchanged. Its supplies must survive home spending too.
    const investment=planner.pendingEquipmentPlan?.(p,style);
    if(investment) {
      const reserved=inventoryBudget(data,planner,p,investment);budget.coins+=reserved.coins;
      for(const [id,qty]of Object.entries(reserved.items))budget.items[id]=Math.max(budget.items[id]??0,qty);
    }
    if(!p.houseBuild&&cells.length&&Number.isSafeInteger(cellPrice(p))&&p.coins>=cellPrice(p)+budget.coins)
      return action({t:'buildRoom',cell:cells[0]},`扩建房屋地块 · ${cellPrice(p).toLocaleString()} 金币`,
        '逐块扩建，保留当前计划必要开销；施工期间继续原任务，不花宝石加速');
    if(!goal||goal.developmentFiller||goal.temporary||goal.quest)return null;
    const skill=goal.mainSkill??goal.skill,combat=professionSkill(style),pressure=budget.freeSlots<=3;
    const trained=planner.trainedSkills(style).filter(s=>!['defence','hitpoints','farming'].includes(s));
    const current=room=>room.bonus.skill===skill||skill===combat&&room.bonus.kind==='combatXp'||
      room.id==='lectern'&&!!goal.enhancement;
    // A timer belongs to one facility, not the whole home. Maintain other
    // already placed, useful facilities during the same visit as well.
    const relevant=rooms.filter(room=>room.id==='storeroom'?pressure:room.id!=='garden'&&
      (current(room)||p.houseFurniture[room.id]&&(trained.includes(room.bonus.skill)||room.bonus.kind==='combatXp')));
    relevant.sort((a,b)=>Number(b.id==='storeroom')-Number(a.id==='storeroom')||
      Number(b.bonus.skill===skill)-Number(a.bonus.skill===skill)||(p.house[a.id]??0)-(p.house[b.id]??0));
    const inventory=reviewInventory(data,planner,p,goal,style,budget),coinRate=planner.coinRate(p);
    for(const room of relevant) {
      if(p.houseUpgrades[room.id]!=null)continue;
      if(!p.houseFurniture[room.id]) {
        // The entrance has a central passage through every possible 3x3 slot.
        const cell=p.houseCells.filter(c=>c!==rules.entrance&&c!==rules.lake)
          .find(c=>!Object.values(p.houseFurniture).some(f=>f.cell===c));
        if(cell!==undefined)return action({t:'placeFurniture',room:room.id,cell,slot:0},`摆放房屋设施 · ${roomName(room.id)}`,
          '使用空房间，不移动或拆除玩家已有设施');
        review.push(`${roomName(room.id)}：暂无空房间可摆放`);continue;
      }
      const needed=pointsFor(p,room.id),missing=Math.max(0,needed-points(p,room));
      if(!Number.isSafeInteger(needed))continue;
      if(!missing)return action({t:'upgradeRoom',room:room.id},`升级${roomName(room.id)} · ${(p.house[room.id]??0)+1} 级`,
        `使用 ${needed} 点已有房屋点数；升级在后台计时，原任务继续`);
      if(!(coinRate>0)){review.push(`${roomName(room.id)}：缺 ${missing} 点，收益暂无法估算，暂缓投料`);continue;}
      const {donors,conversions,cost,remaining}=chooseHouseFuel(data,{p,families:feeds(room),missing,inventory,budget,
        unitValue:(id,qty)=>planner.marketUnitValue?.(p,id,qty)??merchantPrice(data,id),refused:refusedFuel});
      if(remaining>0){review.push(`${roomName(room.id)}：缺 ${missing} 点，可用材料可补 ${missing-remaining} 点，不足整次升级`);continue;}
      const level=p.house[room.id]??0,delay=rules.upgradeTicks*rules.upgradeGrowth**level*data.tickMs/1000;
      const share=mode==='business'&&current(room)?1:1/Math.max(1,trained.length);
      const gain=rules.bonusPerLevel*room.rate/(1+rules.bonusPerLevel*room.rate*level);
      // Facilities are permanent. A one-day window divided across all skills
      // rejected even cheap first levels. Use a bounded week of active play.
      // Storage is valued against the reviewed cost of the next bank shelf;
      // two levels are needed for a slot, so halve the value on the odd step.
      if(room.id==='storeroom') {
        const worth=1000*1.5**(p.bankSlotsBought??0)/(level%2?1:2);
        if(!(cost<=worth)){review.push(`${roomName(room.id)}：材料约 ${Math.ceil(cost)} 金币，超过一格仓位的价值 ${Math.floor(worth)}，暂缓投料`);continue;}
      } else {
        // Shared payback rule (investment.js): materials' sale value, as time at
        // the gold rate, against the time the faster facility saves in that week.
        const result=payback({gold:cost,coinRate,before:1,after:1+share*gain,useSeconds:Math.max(0,7*86400-delay)});
        if(!result.worth){review.push(`${roomName(room.id)}：材料售价约 ${Math.ceil(cost)} 金币（约 ${(result.paid/3600).toFixed(1)} 小时），`+
          `一周只省约 ${(result.saved/3600).toFixed(1)} 小时，暂缓投料`);continue;}
      }
      const first=donors.find(d=>d.itemId===conversions[0].itemId);
      return action({t:'convertHouse',...conversions[0]},`准备${roomName(room.id)}升级 · 转换 ${itemLabel(data,conversions[0].itemId)} × ${conversions[0].qty}`,
        `还需 ${missing} 点，本批材料售价合计约 ${Math.ceil(cost)} 金币；先用每点最便宜的（本项约 ${(first.unit/first.each).toFixed(1)} 金币/点）；`+
        (room.id==='storeroom'?'仓库紧张，优先增加仓位':'按七天有效挂机、分摊各职业使用时间估算收益')+'；保留原计划材料、口粮和稀有物品');
    }
    return null;
  }
  function plan(p,goal,style='magic',mode='balanced',bankedLoad=false) {
    if(owner!==p.id){owner=p.id;visit=null;retryAt=0;review=[];}
    if(!known(p)||!data.houseTravel||mode==='assist'||goal?.itemTarget||p.held||p.raidHeld||p.queue?.length||p.enhance||p.route?.errand)return null;
    const home=atHome(data,p),wait=reason=>action(null,'房屋维护',reason);
    if(!enabled) {
      if(!visit)return null;
      visit.phase='leave';
    }
    if(!visit) {
      if(p.lastTick<retryAt)return null;
      // A manually opened home can be maintained without claiming a return task.
      if(home)return !p.route&&!p.path?.length?work(p,goal,style,mode):null;
      if(p.path?.length&&!bankedLoad||p.route&&!bankedLoad)return null;
      if(!work(p,goal,style,mode))return null;
      const route=p.route;
      if(route?.questId!=null)return null;
      const resume=!route||route.limit===0?null:resumeIntent(p,route);
      const portal=[...data.houseTravel.portals].sort((a,b)=>houseDistance(p,a)-houseDistance(p,b))[0];
      visit={phase:'enter',portalId:portal.id,resume};
    }
    if(visit.phase==='enter'&&home)visit.phase='work';
    if(visit.phase==='work') {
      if(home) {
        if(p.route||p.path?.length)return wait('等待家园内移动完成，再核对建造条件');
        const next=p.lastTick<retryAt?null:work(p,goal,style,mode);
        if(next)return next;
        visit.phase='leave'; // Construction timers run while the player works outside.
      } else visit.phase='enter'; // E.g. a completed Boss detour returned outside.
    }
    if(visit.phase==='leave'&&!home) {
      const resume=visit.resume;visit=null;
      return resume?action(resume,'恢复房屋维护前的任务','已离开家园，恢复原工作地点、品质和剩余数量'):null;
    }
    if(p.route)return action({t:'clearRoute'},'暂存本趟工作，准备回家','本趟已存仓；原任务已保存，建造后恢复');
    if(p.path?.length)return wait(home?'前往家园出口，随后恢复原任务':'前往家园传送门，等待服务器确认位置');
    const portal=home?data.houseTravel.exit:data.houseTravel.portals.find(s=>s.id===visit.portalId);
    if(!portal){visit=null;return null;}
    if(houseDistance(p,portal)<=1)return action({t:'portal',dir:home?'out':'in'},home?'离开家园':'进入家园','等待服务器确认传送完成');
    return action({t:'walk',...portal.approach},home?'走向家园出口':'前往家园传送门','完成这次房屋维护后恢复原任务');
  }
  function rejected(p) {
    if(owner!==p.id){owner=p.id;visit=null;}
    retryAt=p.lastTick+Math.ceil(300000/data.tickMs);
    if(visit)visit.phase='leave';
  }
  // The game ignored converting this item: skip it as fuel for six hours.
  function refuseFuel(p,itemId) {
    refusedFuel={...Object.fromEntries(Object.entries(refusedFuel).filter(([,until])=>until>p.lastTick)),
      [itemId]:p.lastTick+Math.ceil(6*3600000/data.tickMs)};
    rejected(p);
  }
  function status(p) {
    if(!known(p))return '等待服务器房屋数据；不猜测房间或花费';
    const building=p.houseBuild?`扩建中，约 ${Math.max(0,Math.ceil((p.houseBuild.doneTick-p.lastTick)*data.tickMs/60000))} 分钟`:
      frontier(p).length?`下一块 ${cellPrice(p).toLocaleString()} 金币`:'可扩建地块已开齐';
    return `房屋地块 ${p.houseCells.length} / ${rules.grid**2-1}（含入口）；${building}\n`+
      rooms.filter(r=>p.houseFurniture[r.id]).map(r=>`${roomName(r.id)} ${(p.house[r.id]??0)} 级${p.houseUpgrades[r.id]!=null?' · 升级中':''}`).join('、')+
      `\n${Object.keys(p.houseUpgrades).length} 个设施正在升级；不同设施可同时计时。`+
      (review.length?'\n上次投料评估：\n'+review.join('\n'):'')+
      '\n完成当前一趟后回家扩建、升级，再恢复原任务；只转换普通现货盈余，不拆设施、不花宝石。'+
      (p.lastTick<retryAt?'\n房屋操作被拒绝，暂缓五分钟；正常挂机继续。':'');
  }
  const validate=(p,intent,goal,style,mode)=>HOUSE_ACTIONS.has(intent.t)&&atHome(data,p)&&!p.route&&!p.path?.length&&
    p.lastTick>=retryAt&&JSON.stringify(work(p,goal,style,mode)?.intent)===JSON.stringify(intent);
  return {plan,status,validate,rejected,refuseFuel,cancel:()=>{visit=null;},
    setEnabled:value=>{enabled=value!==false;},enabled:()=>enabled,
    runtime(value){if(value){({owner,visit,retryAt}=value);review=value.review??[];refusedFuel=value.refusedFuel??{};}
      return {owner,visit,retryAt,review,refusedFuel};}};
}
