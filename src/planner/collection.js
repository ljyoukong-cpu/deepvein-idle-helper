// "补精通" (upstream v0.8.2–v0.8.5): fill the next tier of the game's
// collection rewards, in the order of its "upcoming rewards" list.
// Ladders and order follow the native collection page (index-DAY9oe71.js);
// collections count personal production only: stock, market buys and World
// Boss loot do not count.
import {professionSkill} from './professions.js';
import {LEGENDARY, PAIR_TIERS, RARITY_NAMES} from './quality.js';

export const MASTERY_STEPS=[1,10,100,1000,10000,100000,1000000,10000000];
export const MASTERY_REWARDS=[1,1,3,10,35,120,420,1500];
export const MASTERY_QUALITY=[1,3,10,30];
export const ROUND_SIZE=6;
const qualityName=tier=>RARITY_NAMES[tier]||'普通';

// Legendary is the player's; crops are left to the farming rules (v0.8.4).
export const skipMastery=(data,base,rarity=0)=>rarity>=LEGENDARY||data.jobs.some(j=>j.grow&&j.output.itemId===base);

export function masteryCandidates(data,p) {
  if(!p?.collections)return [];
  const bases=new Set();
  for(const job of data.jobs){bases.add(job.output.itemId);if(job.bonus)bases.add(job.bonus.itemId);}
  for(const monster of data.monsters){bases.add(monster.drop);if(monster.bonus)bases.add(monster.bonus.itemId);}
  const result=[];
  for(const base of bases) {
    // Single-entry companions and appearances have no next step once found.
    if(!data.items[base]||base===data.coinId||base===data.shardId||skipMastery(data,base)||
      base>=280&&base<293||base>=316&&base<323||base>=400&&base<=410)continue;
    for(const rarity of [...PAIR_TIERS].reverse()) {
      const itemId=base+rarity*data.rarityScale,count=p.collections[itemId]??0;
      if(!Number.isSafeInteger(count)||count<=0)continue;
      const step=MASTERY_STEPS.findIndex(n=>n>count);if(step<0)continue;
      const target=MASTERY_STEPS[step],previous=MASTERY_STEPS[step-1]??0,frac=(count-previous)/(target-previous);
      // The native "upcoming rewards" list shows items past 12% of their tier.
      if(frac>.12)result.push({itemId,base,rarity,target,frac,reward:MASTERY_REWARDS[step]*MASTERY_QUALITY[rarity]});
    }
  }
  return result.sort((a,b)=>b.frac-a.frac||b.reward-a.reward);
}

// One round: the first six candidates, in order, kept across refreshes; each
// is filled to its next tier, then the list is drawn again.
export function createCollectionMastery(data) {
  let owner=null,queue=[];
  const count=(p,target)=>p.collections?.[target.itemId]??0;
  const name=target=>`${qualityName(target.rarity)} ${data.items[target.base]?.name??target.base}`;
  function chooseGoal(p,style='magic') {
    if(owner!==p.id){owner=p.id;queue=[];}
    if(!p.collections)return null;
    queue=queue.filter(target=>!skipMastery(data,target.base,target.rarity));
    while(queue.length&&count(p,queue[0])>=queue[0].target)queue.shift();
    if(!queue.length)queue=masteryCandidates(data,p).slice(0,ROUND_SIZE);
    const target=queue[0];if(!target)return null;
    const job=data.jobs.find(j=>j.output.itemId===target.base)??data.jobs.find(j=>j.bonus?.itemId===target.base);
    return {mastery:{...target},skill:job?.skill??professionSkill(style),target:Infinity,
      recipeId:job?.id,budget:{coins:0,items:{}},
      reason:`补精通 · ${name(target)}：${count(p,target)} / ${target.target}，补到本档后继续下一项`};
  }
  const completed=(p,goal)=>!!p.collections&&count(p,goal.mastery)>=goal.mastery.target;
  const skipped=goal=>skipMastery(data,goal.mastery.base,goal.mastery.rarity);
  function status(p) {
    if(!p?.collections)return '等待服务器收藏计数；购买成品不计入精通。';
    const targets=owner===p.id&&queue.length?queue:masteryCandidates(data,p).slice(0,ROUND_SIZE);
    return targets.length?targets.map((target,index)=>`${index+1}. ${name(target)}：${count(p,target)} / ${target.target}`).join('\n'):
      '暂无可补的奖励项（已跳过传说与种植）；等待收藏进度变化。';
  }
  return {chooseGoal,completed,skipped,status,name,reset:()=>{owner=null;queue=[];},
    runtime(value){if(value){owner=value.owner??null;queue=(value.queue??[]).filter(t=>!skipMastery(data,t.base,t.rarity));}
      return {owner,queue};}};
}
