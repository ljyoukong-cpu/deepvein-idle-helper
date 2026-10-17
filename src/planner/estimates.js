// Expected base rates from the reviewed client. House, potion, mastery, event
// and guild modifiers are omitted; these estimates are not measured XP/hour.
export function workEstimate(data, job, skillLevel, options={}) {
  const speed=(1+Math.max(0,skillLevel-job.levelReq)*data.xp.speedPerLevelAboveRequirement)*
    (1+(options.toolBonus??0))*(1+.005*(options.quick??0));
  const failure=rule=>rule?Math.max(0,rule.chanceAtReq*(1-(skillLevel-job.levelReq)/
    (rule.safeAtLevel-job.levelReq)))*(1-.03*(options.hands??0)):0;
  const burn=failure(job.burn), caught=failure(job.caught), success=1-burn-caught;
  // A stun ending at tick t+s suppresses s-1 subsequent trials.
  const ticks=Math.max(1,job.baseTicks/speed)+caught*Math.max(0,(job.caught?.stunTicks??0)-1);
  const randomRarity=!job.inputs.length&&job.output.itemId!==data.coinId;
  // One roll against every threshold, scaled by (1+luck)×bonuses (client Lu).
  // rarityFactor, measured by the engine, is that whole product: tool and
  // amulet luck plus brews, house, masteries. Without it: tool and amulet only.
  const luck=options.rarityFactor??1+(options.luck??0), c=data.rarityChance;
  const cumulative=[1,...['uncommon','rare','epic','legendary'].map(k=>Math.min(1,c[k]*luck)),0];
  const rolled=cumulative.slice(0,5).map((n,i)=>n-cumulative[i+1]);
  const probabilities=randomRarity?rolled:[1,0,0,0,0];
  const xp=success*probabilities.reduce((sum,p,i)=>sum+p*Math.round(job.xp*data.rarityXp[i]),0);
  return {seconds:ticks*data.tickMs/1000,success,burn,caught,xp,
    commonOutput:success*probabilities[0]*job.output.qty,
    // Expected output of each quality per action, and of the bonus drop.
    tierOutput:probabilities.map(n=>success*n*job.output.qty),
    bonusOutput:job.bonus?success*job.bonus.chance:0,
    // Quality odds of one roll; a bonus drop rolls its own, even at coin stalls.
    qualities:rolled,
    output:success*job.output.qty,
    coins:job.output.itemId===data.coinId?success*job.output.qty:0};
}

// Exact expected number of attacks for independent hits with uniform damage
// 1..maxHit, including misses and overkill. E[h]=(1 + p/M*sum E[h-d])/p.
export function expectedAttacks(hp, maxHit, hitChance) {
  if(hitChance<=0) return Infinity;
  const expectation=new Float64Array(hp+1);
  let window=0;
  for(let remaining=1;remaining<=hp;remaining++) {
    window+=expectation[remaining-1];
    if(remaining-maxHit-1>=0) window-=expectation[remaining-maxHit-1];
    expectation[remaining]=1/hitChance+window/maxHit;
  }
  return expectation[hp];
}

export function combatEstimate(data, monster, stats) {
  const divisor=stats.style==='magic'?4.5:stats.twoHanded?6:
    stats.style==='ranged'&&stats.speed===5?5:8;
  const maxHit=Math.max(1,1+Math.floor((stats.level+stats.strength)/divisor));
  const accuracy=Math.max(1,10+stats.level+stats.accuracy);
  const effectiveDefence=monster.defence*(stats.style==='magic'?.5:1);
  const hitChance=accuracy/(accuracy+10+effectiveDefence);
  const attacks=expectedAttacks(monster.hp,maxHit,hitChance);
  const seconds=attacks*stats.speed*data.tickMs/1000;
  const enemyHit=(10+monster.attack)/(20+monster.attack+stats.defenceLevel+stats.defence);
  // Continuous DPS is a conservative approximation: the final player hit can
  // prevent an enemy attack. No regeneration or damage-reduction buffs counted.
  const damage=seconds/(monster.speed*data.tickMs/1000)*enemyHit*(monster.maxHit+1)/2;
  const shards=Math.min(.2,.08+monster.level*.0013)*(1+Math.floor(monster.level/30));
  return {seconds,attacks,maxHit,hitChance,effectiveDefence,damage,mainXp:monster.xp,
    xp:monster.xp+2*Math.max(1,Math.floor(monster.xp/3)),shards,
    coins:(monster.gold[0]+monster.gold[1])/2,drops:combatDrops(data,monster,stats.luck??0,shards)};
}

// Expected item drops per kill, keyed by exact item id (quality included).
// Valuing them is the caller's job: protected and unsellable items earn nothing.
export function combatDrops(data,monster,luck=0,shards=0) {
  const drops={},add=(id,qty)=>{if(id!=null&&qty>0)drops[id]=(drops[id]??0)+qty;};
  const c=data.rarityChance,cumulative=[1,...['uncommon','rare','epic','legendary'].map(k=>Math.min(1,c[k]*(1+luck))),0];
  const dropChance=Math.max(0,Math.min(1,monster.dropChance??1));
  if(monster.drop!=null)for(let tier=0;tier<5;tier++)
    add(monster.drop+tier*data.rarityScale,dropChance*(cumulative[tier]-cumulative[tier+1]));
  if(monster.bonus)add(monster.bonus.itemId,Math.min(1,monster.bonus.chance*(1+luck)));
  add(data.shardId,shards);
  return drops;
}
