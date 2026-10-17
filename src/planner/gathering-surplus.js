import {brewPower} from './supplies.js';
import {inventoryBudget, saleProtectionReason} from './inventory.js';
import {baseStride, distance, packCapacity, packQty, packUsed} from './items.js';

// Native onFull:'drop' removes every quality of BOTH main and bonus outputs.
// dropItem matches an exact pack item ID and leaves the active route intact.
export function planGatheringSurplus(data,planner,p,goal,style,mode,waitingGoals={}) {
  const route=p.route,job=data.jobs.find(j=>j.id===route?.jobId);
  if(!['balanced','experience'].includes(mode)||!goal||goal.itemTarget||goal.quest||goal.upgrade||
    goal.toolUpgrade||goal.craftPreparation||goal.temporary||goal.developmentFiller||
    !job||!['mining','woodcutting'].includes(job.skill)||job.inputs.length||job.grow||
    goal.skill!==job.skill||!(planner.level(p.skills[job.skill])<goal.target)||
    goal.recipeId!=null&&goal.recipeId!==job.id||p.activity!=='working'||route.phase!=='working'||
    (route.onFull??'bank')!=='bank'||route.errand||route.after||route.limit===0||
    p.workJobId!=null&&p.workJobId!==job.id||p.path?.length||p.enhance||p.held||p.raidHeld||p.queue?.length)return null;
  const id=job.output.itemId,item=data.items[id],site=data.sites.find(s=>s.id===route.siteId);
  if(!site||!site.jobIds.includes(job.id)||distance(p,site)>1||!item||item.stackable||
    id!==planner.base(id)||saleProtectionReason(data,id)||data.gear.some(g=>g.itemId===id)||
    data.jobs.some(j=>j.grow&&j.inputs.some(i=>i.itemId===id)))return null;
  const capacity=packCapacity(p);
  const free=capacity-packUsed(data,p),carried=packQty(p,id);
  const xp=planner.estimateWork(p,job).xp;
  const remaining=Math.min(route.limit??Infinity,Math.ceil((planner.thresholds[goal.target]-p.skills[job.skill])/xp));
  // Act in sizeable batches before fullness; never redirect an existing trip.
  if(free>Math.ceil(capacity/2)||!(remaining*job.output.qty>free))return null;
  let reserve=50;
  for(const plan of [goal,...Object.values(waitingGoals),planner.pendingEquipmentPlan?.(p,style)].filter(Boolean))
    reserve=Math.max(reserve,inventoryBudget(data,planner,p,plan).items[id]??0);
  const qty=Math.min(carried,Math.max(0,(p.bank[id]??0)+carried-reserve));
  if(!Number.isSafeInteger(qty)||qty<Math.ceil(capacity/2))return null;
  const value=planner.marketSurplusValue?.(p,id,qty)??Infinity,rate=planner.coinRate?.(p)??0;
  if(!Number.isFinite(value)||value<0||!(rate>0))return null;
  const stride=Math.round(baseStride(data,p)*(1+.2*brewPower(data,p,'swift')));
  const speed=Math.max(1000,stride,p.strideSpeed??0)/1000;
  const travel=2*Math.min(...data.banks.map(b=>Math.max(0,distance(p,b)-1)))*data.tickMs/1000/speed;
  const saved=Math.max(0,travel*Math.min(qty,remaining*job.output.qty-free)/capacity-4);
  if(!(saved>value/rate))return null;
  return {intent:{t:'dropItem',itemId:id,qty},label:`原地清理普通盈余 · ${item.name} ×${qty}`,
    reason:`保留至少 ${reserve} 件周转／计划材料及全部稀有物、副产物；按腾出背包比例预计省下约 ${Math.floor(saved)} 秒往返，`+
      `放弃产物估值 ${Math.ceil(value)} 金币（约 ${Math.ceil(value/rate)} 秒筹币）；当前采集继续`};
}
