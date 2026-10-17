import {matchesProfessionWeapon, professionSkill, starterWeapon} from './professions.js';
import {PAIR_TIERS, autoUsableMaterial, craftRecipe, qualityWorth, setsAt} from './quality.js';
import {combatEstimate, workEstimate} from './estimates.js';
import {buffKey, combatSupplies} from './supplies.js';
import {distance, merchantPrice, nearestBank, packCapacity, rarityOf} from './items.js';

// A rolling comparison of attainable routes, including their self-supply work.
// Gold is a constraint from an actual planned expense, never an XP conversion.
export function createStrategy(data, planner) {
  const horizon=1800, tick=data.tickMs/1000, jobs=data.jobs;
  const bankAt=p=>nearestBank(data,p);
  const siteAt=(p,j)=>data.sites.filter(s=>s.jobIds.includes(j.id))
    .sort((a,b)=>distance(p,a)-distance(p,b))[0];
  let measurements={};
  const setMeasurements=value=>{measurements=value??{};};
  // The measurement (real or simulated) that applies to this state, or null.
  function usableMeasurement(p,key,lv=planner.levels(p)) {
    const m=measurements[key];
    const working=m?m.seconds-(m.travelSeconds??0):0;
    if (!m||m.samples<3||working<60) return null;
    // Observed rates already include their buffs. Legacy records describe only
    // an unbuffed snapshot; never carry a temporary bonus into another state.
    if((m.buffKey??buffKey(data,{...p,brews:{}}))!==buffKey(data,p))return null;
    const equipmentKey=JSON.stringify(Object.keys(p.equipment).sort().map(k=>[k,p.equipment[k]]));
    const job=key.startsWith('job:')&&jobs.find(j=>j.id===Number(key.split(':')[1]));
    const levelsKey=JSON.stringify((job?[job.skill]:['melee','ranged','magic','defence','hitpoints']).map(s=>[s,lv[s]]));
    if (m.equipmentKey!==equipmentKey||m.levelsKey!==levelsKey) return null;
    return m;
  }
  // Where a candidate's rate comes from: 'measured', 'simulated' or 'formula'.
  const rateSource=(p,key)=>{const m=usableMeasurement(p,key);return !m?'formula':m.simulated?'simulated':'measured';};
  function calibrated(p,key,e,lv) {
    const m=usableMeasurement(p,key,lv);
    if (!m) return e;
    const working=m.seconds-(m.travelSeconds??0);
    // Remove observed travel before adding this candidate's separate travel
    // estimate. Do not infer faster material production from an XP bonus.
    const xp=m.xp??m.xpPerSecond*m.seconds,coins=m.coins??m.coinsPerSecond*m.seconds;
    return {...e,xp:Number.isFinite(xp)?xp/working*e.seconds:e.xp,
      coins:Number.isFinite(coins)?coins/working*e.seconds:e.coins,measured:true};
  }
  function estimateWork(p,j,lv=planner.levels(p)) {
    const slot=Object.keys(data.toolSkills).find(s=>data.toolSkills[s]===j.skill);
    const key=`job:${j.id}${j.rarity?`:rarity:${j.rarity}`:''}`;
    const luck=(data.toolLuck[rarityOf(data,p.equipment[slot]??0)]??0)+(planner.equipmentStats(p.equipment.amulet)?.luck??0);
    // The engine's measured quality factor also covers brews, house and
    // masteries; it is a sample, so it replaces the exact tool+amulet factor
    // only when clearly higher.
    const measured=usableMeasurement(p,key,lv)?.rarityFactor;
    return calibrated(p,key,workEstimate(data,j,lv[j.skill],{
      toolBonus:planner.equipmentStats(p.equipment[slot])?.bonus??0,
      quick:p.perks?.quick??0,hands:p.perks?.hands??0,luck,
      rarityFactor:measured>(1+luck)*1.15?measured:undefined}),lv);
  }
  function combatOptions(p,profession='magic') {
    const style=professionSkill(profession);
    const lv=planner.levels(p), gear=Object.values(p.equipment).map(planner.equipmentStats).filter(Boolean);
    const w=planner.equipmentStats(p.equipment.weapon);
    if (!matchesProfessionWeapon(w,profession)) return [];
    const stat=k=>gear.reduce((n,g)=>n+(k==='defence'||!g.style||g.style===style?1:-1)*(g[k]??0),0);
    return data.monsters.filter(m=>m.maxHit<lv.hitpoints/3&&
      lv.hitpoints/((10+m.attack)/(20+m.attack+lv.defence+stat('defence'))*(1+m.maxHit)/2)>=6)
      .map(m=>({monster:m,zone:data.zones.find(z=>z.monsterId===m.id),
        ...calibrated(p,`combat:${m.id}`,combatEstimate(data,m,{style,level:lv[style],
          accuracy:stat('accuracy'),strength:stat('strength'),defence:stat('defence'),
          defenceLevel:lv.defence,speed:w.speed??5,twoHanded:w.twoHanded,
          luck:planner.equipmentStats(p.equipment.amulet)?.luck??0}),lv)}));
  }
  function supplyCost(p,id,trail=[]) {
    if (trail.includes(id)) return Infinity;
    const lv=planner.levels(p),next=[...trail,id];
    const choices=jobs.filter(j=>j.output.itemId===id&&j.levelReq<=lv[j.skill]&&!j.grow);
    return choices.length?Math.min(...choices.map(j=>{
      const e=estimateWork(p,j,lv);
      return (e.seconds+j.inputs.reduce((n,i)=>n+i.qty*supplyCost(p,i.itemId,next),0))/e.commonOutput;
    })):Infinity;
  }
  function routeEstimate(p,jobOrId,amount=20,{style='magic',ignoreStock=false,includeTravel=true,completeTrips=false,buyInputs=false}={}) {
    const root=typeof jobOrId==='object'?jobOrId:jobs.find(j=>j.id===jobOrId);
    const lv=planner.levels(p), stock={}, budget={}, recipes={}, supplyRecipes={};
    if (!ignoreStock) {
      for (const [id,n] of Object.entries(p.bank)) stock[id]=n;
      for (const i of p.pack) stock[i.itemId]=(stock[i.itemId]??0)+i.qty;
    }
    // Owned materials are not free: what they would sell for is charged against
    // the route's gold (stockValue). Spending budgets use the coins alone.
    let seconds=0,xp=0,coins=0,position=p,unlocks=[],marketCoins=0,stockValue=0;
    const purchases={};
    const travel=to=>{
      if (includeTravel) seconds+=distance(position,to)*tick;
      position=to;
    };
    const invalid=()=>({seconds:Infinity,xp:0,coins:0,budget:{coins:0,items:{}},recipes:{},supplyRecipes:{},purchases:{}});
    function work(j,n,trail) {
      if (!siteAt(position,j)||j.grow||!Number.isFinite(n)||n<=0) return false;
      if (lv[j.skill]<j.levelReq&&!unlock(j.skill,j.levelReq,trail)) return false;
      for (const i of j.inputs) if (!supply(i.itemId,i.qty*n,trail)) return false;
      const e=estimateWork(p,j,lv),site=siteAt(position,j),bank=bankAt(site);
      travel(site);
      seconds+=e.seconds*n;xp+=e.xp*n;coins+=e.coins*n;
      // Project size and carried loads are separate. Nonstacked materials need
      // native bank trips; an all-stack recipe does not bank every fifty units.
      const stackSlots=j.inputs.filter(i=>data.items[i.itemId]?.stackable).length+
        Number(!!data.items[j.output.itemId]?.stackable);
      const unitSlots=Math.max(data.items[j.output.itemId]?.stackable?0:j.output.qty,
        j.inputs.reduce((n,i)=>n+(data.items[i.itemId]?.stackable?0:i.qty),0));
      const load=unitSlots?Math.max(1,Math.floor((packCapacity(p)-stackSlots)/unitSlots)):Infinity;
      if (includeTravel) seconds+=Math.max(0,Math.ceil(n/load)-1)*(2*distance(site,bank)+3)*tick;
      if(completeTrips)travel(bank.approach??bank);
      recipes[j.skill]??=j.id;supplyRecipes[j.output.itemId]=j.id;
      if (j.output.itemId!==data.coinId) stock[j.output.itemId]=(stock[j.output.itemId]??0)+e.commonOutput*n;
      if (j.bonus) stock[j.bonus.itemId]=(stock[j.bonus.itemId]??0)+j.bonus.chance*n;
      return true;
    }
    function unlock(skill,target,trail) {
      const marker=`skill:${skill}`;
      if (trail.includes(marker)) return false;
      const available=jobs.filter(j=>j.skill===skill&&!j.grow&&j.levelReq<=lv[skill]&&siteAt(position,j));
      const choice=available.sort((a,b)=>estimateWork(p,b,lv).xp/estimateWork(p,b,lv).seconds-
        estimateWork(p,a,lv).xp/estimateWork(p,a,lv).seconds)[0];
      if (!choice) return false;
      const required=Math.max(0,planner.thresholds[target]-(p.skills[skill]??0));
      const n=Math.ceil(required/estimateWork(p,choice,lv).xp);
      if (!work(choice,n,[...trail,marker])) return false;
      unlocks.push({skill,target});lv[skill]=target;return true;
    }
    function supply(id,quantity,trail) {
      if(!autoUsableMaterial(data,id))return false;
      budget[id]=(budget[id]??0)+Math.ceil(quantity);
      const used=Math.max(0,Math.min(quantity,stock[id]??0));stock[id]=(stock[id]??0)-used;
      if(used>0&&id!==data.coinId)stockValue+=used*(planner.marketUnitValue?.(p,id,Math.ceil(used))??merchantPrice(data,id));
      const missing=quantity-used;
      if (missing<1e-7) return true;
      if (trail.includes(id)) return false;
      const next=[...trail,id];
      if(buyInputs&&id!==root?.output?.itemId&&id!==root?.itemId) {
        const qty=Math.ceil(missing),unit=planner.marketUnitCost?.(p,id,qty+(purchases[id]??0))??Infinity;
        const cost=Number.isFinite(unit)?unit*qty*(planner.coinRate?.(p)??0):Infinity,allowance=planner.marketAllowance?.(p)??0;
        // Crafting it from bought materials (with the XP) beats buying it: fall
        // through to the recipe, whose inputs get this same choice.
        const make=Number.isFinite(unit)&&planner.crafting?.makeBeatsBuying({...p,x:position.x,y:position.y,bank:stock,pack:[]},id,qty,unit*qty);
        if(!make&&Number.isFinite(unit)&&cost>0&&marketCoins+cost+Math.max(0,-coins-marketCoins)<=allowance) {
          const bank=bankAt(position),to=bank.approach??bank;
          const purchaseSeconds=unit*qty+(includeTravel?distance(position,to)*tick:0);
          const self=routeEstimate({...p,x:position.x,y:position.y,bank:stock,pack:[]},{itemId:id},missing,
            {style,includeTravel,completeTrips:true});
          if(purchaseSeconds<self.seconds) {
            travel(to);seconds+=unit*qty;coins-=cost;marketCoins+=cost;
            purchases[id]=(purchases[id]??0)+qty;
            stock[id]=(stock[id]??0)+qty-missing;
            return true;
          }
        }
      }
      if(id===190) {
        const price=data.items[190].value*4;
        coins-=price;travel(bankAt(position).approach??bankAt(position));seconds+=tick;
        return true;
      }
      const choices=jobs.filter(j=>j.output.itemId===id&&!j.grow&&siteAt(position,j))
        .sort((a,b)=>a.levelReq-b.levelReq||estimateWork(p,a,lv).seconds/Math.max(.001,estimateWork(p,a,lv).commonOutput)-
          estimateWork(p,b,lv).seconds/Math.max(.001,estimateWork(p,b,lv).commonOutput));
      if (choices.length) {
        const j=choices[0],e=estimateWork(p,j,lv);
        if (!work(j,missing/e.commonOutput,next)) return false;
        stock[id]=Math.max(0,(stock[id]??0)-missing);return true;
      }
      // Harvests regenerate seeds. A crop source is attainable only when its
      // seed already exists, or a reviewed bonus drop supplies it. Unknown
      // merchant-only seeds never receive an invented acquisition time.
      const crop=jobs.find(j=>j.output.itemId===id&&j.grow&&j.levelReq<=lv.farming);
      if (crop) {
        const preference=planner.farmingPreference?.();
        if(preference?.mode==='manual'&&preference.jobId!==crop.id)return false;
        const planted=Object.values(p.plots??{}).some(f=>planner.base(f.seedItemId)===crop.inputs[0].itemId);
        const seeds=Object.keys(stock).some(k=>planner.base(Number(k))===crop.inputs[0].itemId&&stock[k]>0);
        if (!planted&&!seeds&&!supply(crop.inputs[0].itemId,1,next)) return false;
        const seedId=crop.inputs[0].itemId;
        const liveSeeds=Object.entries(stock).reduce((n,[id,qty])=>n+(planner.base(+id)===seedId?qty:0),0)+
          Object.values(p.plots??{}).filter(f=>planner.base(f.seedItemId)===seedId).length;
        const fields=Math.max(1,Math.min(planner.farmFields?.(p).length??data.farmUnlocks.filter(n=>n<=lv.farming).length,liveSeeds));
        const harvests=missing/(4+lv.farming/100);
        seconds+=Math.ceil(harvests/fields)*crop.grow*tick;xp+=harvests*crop.xp;
        recipes.farming=crop.id;supplyRecipes[id]=crop.id;
        return true;
      }
      const bonus=jobs.filter(j=>j.bonus?.itemId===id&&j.levelReq<=lv[j.skill]&&!j.grow)
        .sort((a,b)=>estimateWork(p,a,lv).seconds/a.bonus.chance-estimateWork(p,b,lv).seconds/b.bonus.chance)[0];
      if (bonus) {
        if (!work(bonus,missing/bonus.bonus.chance,next)) return false;
        stock[id]=Math.max(0,(stock[id]??0)-missing);return true;
      }
      const monster=combatOptions(p,style).filter(c=>c.monster.drop===id&&(c.monster.dropChance??1)>0||id===data.shardId)
        .sort((a,b)=>a.seconds/(id===data.shardId?a.shards:(a.monster.dropChance??1))-
          b.seconds/(id===data.shardId?b.shards:(b.monster.dropChance??1)))[0];
      if (!monster) return false;
      // A primary drop is one item of a rolled quality, not one ordinary item.
      // Use the same baseline rarity model as workEstimate; temporary bonuses
      // are not assumed to last for the entire material-supply expedition.
      const common=1-Math.min(1,data.rarityChance.uncommon*
        (1+(planner.equipmentStats(p.equipment.amulet)?.luck??0)));
      return fight(monster,missing/(id===data.shardId?monster.shards:common*(monster.monster.dropChance??1)),next);
    }
    function fight(c,n,trail=[]) {
      const supplies=combatSupplies(data,planner,p,c,{zone:c.zone,monster:c.monster,
        foodItemId:0,horizon,supplyCost:id=>supplyCost(p,id)});
      if (!supplies.sustainable||!supply(supplies.foodItemId,c.damage*n/supplies.heal,trail)) return false;
      const bank=bankAt(c.zone);
      const carried=p.pack.filter(i=>i.itemId===supplies.foodItemId).reduce((n,i)=>n+i.qty,0);
      const restockFirst=position!==p||supplies.bankFirst||!carried;
      if(restockFirst)travel(bankAt(position));
      const inside=position.x>=c.zone.x&&position.x<c.zone.x+(c.zone.width??1)&&
        position.y>=c.zone.y&&position.y<c.zone.y+(c.zone.height??1);
      if(!inside)travel(c.zone);
      const firstKills=restockFirst?supplies.expectedKills:
        Math.min(supplies.expectedKills,carried/supplies.safeFoodPerKill);
      const restocks=Math.max(0,Math.ceil((n-firstKills)/supplies.expectedKills));
      seconds+=c.seconds*n+(includeTravel?restocks*supplies.roundTripSeconds:0);
      xp+=c.xp*n;coins+=c.coins*n;
      if(completeTrips)travel(bank.approach??bank);
      return true;
    }
    let ok=false;
    if (root?.itemId!=null) {
      // Quote an additional missing quantity, while still using owned inputs.
      stock[root.itemId]=0;
      ok=supply(root.itemId,amount,[]);
    } else if (root?.monsterId) {
      const c=combatOptions(p,style).find(c=>c.monster.id===root.monsterId);
      ok=!!c&&fight(c,amount);
    } else if (root) ok=work(root,amount,[root.output.itemId]);
    if (!ok||!Number.isFinite(seconds)) return invalid();
    const net=coins-stockValue;
    return {seconds,xp,coins:net,stockValue,rate:{xp:xp/Math.max(1,seconds),coins:net/Math.max(1,seconds)},
      budget:{coins:Math.max(0,-coins-marketCoins),items:budget},recipes,supplyRecipes,unlocks,purchases};
  }
  function candidates(p,style='magic',deferred={},options={}) {
    const skill=professionSkill(style);
    const stockedBatch=options.stockedBatch===true;
    const routeOptions={style,ignoreStock:!!options.sustainable,completeTrips:!!options.sustainable||stockedBatch,buyInputs:true};
    const lv=planner.levels(p), candidates=[];
    planner.watchPurchases?.(p,jobs.filter(j=>!j.grow&&!deferred[j.skill]&&j.levelReq<=lv[j.skill])
      .flatMap(j=>j.inputs.map(i=>i.itemId)));
    for (const job of jobs.filter(j=>!j.grow&&!deferred[j.skill]&&j.levelReq<=lv[j.skill]&&siteAt(p,j))) {
      const batch=stockedBatch?Math.min(50,planner.carriedBatch(p,job)):50;
      if(stockedBatch&&(!job.inputs.length||job.inputs.some(i=>planner.count(p,i.itemId)<i.qty*batch)))continue;
      const e=estimateWork(p,job,lv);
      let amount=options.sustainable||stockedBatch?batch:Math.min(job.inputs.length?50:5000,Math.max(1,Math.floor(horizon/e.seconds))),estimate;
      for (let attempt=0;attempt<4;attempt++) {
        estimate=routeEstimate(p,job,amount,routeOptions);
        if(options.sustainable||stockedBatch)break;
        if (estimate.seconds<=horizon||!Number.isFinite(estimate.seconds)||amount===1) break;
        amount=Math.max(1,Math.floor(amount*horizon/estimate.seconds*.98));
      }
      if (estimate.seconds>horizon) continue;
      if (!Number.isFinite(estimate.seconds)||!estimate.xp) continue;
      // Gathered output of every quality and the bonus drop, as expected counts.
      const extras=!job.inputs.length&&job.output.itemId!==data.coinId?{actions:amount,
        qualityPerAction:e.tierOutput.slice(1),
        ...(job.bonus?{bonusPerAction:{itemId:job.bonus.itemId,qty:e.bonusOutput}}:{})}:{};
      candidates.push({skill:job.skill,recipeId:job.id,mainXpRate:e.xp*amount/estimate.seconds,output:{itemId:job.output.itemId,qty:Math.floor(e.commonOutput*amount)},...extras,recipes:{...estimate.recipes,[job.skill]:job.id},
        supplyRecipes:estimate.supplyRecipes,batch,estimate,rate:estimate.rate,horizon,
        budget:routeEstimate(p,job,batch,{style,buyInputs:true}).budget,target:lv[job.skill]+1,stage:lv[job.skill]+1});
      // The same recipe in a quality the held matched sets make (planned gear's
      // materials kept), valued at that quality: its output is worth more.
      if(job.inputs.length&&!stockedBatch&&!options.sustainable) {
        const hold=planner.qualityHold?.(p,style,{gearOnly:true})??{};
        for(const tier of PAIR_TIERS.filter(t=>t>0)) {
          const recipe=craftRecipe(data,job,tier),n=Math.min(amount,setsAt(recipe,id=>planner.count(p,id)-(hold[id]??0)));
          if(!(n>=1)||!qualityWorth(data,planner,p,job,tier).ok)continue;
          const q=routeEstimate(p,recipe,n,{...routeOptions,buyInputs:false});
          if(!Number.isFinite(q.seconds)||!q.xp)continue;
          const qe=estimateWork(p,recipe,lv);
          candidates.push({skill:job.skill,recipeId:job.id,rarity:tier,mainXpRate:qe.xp*n/q.seconds,
            output:{itemId:recipe.output.itemId,qty:Math.floor(qe.commonOutput*n)},recipes:{...q.recipes,[job.skill]:job.id},
            recipeRarities:{[job.skill]:tier},supplyRecipes:q.supplyRecipes,batch:n,estimate:q,rate:q.rate,horizon,
            budget:q.budget,target:lv[job.skill]+1,stage:lv[job.skill]+1});
        }
      }
    }
    if(stockedBatch)return candidates.sort((a,b)=>b.mainXpRate-a.mainXpRate||a.recipeId-b.recipeId);
    let fighter=p,preparation={seconds:0,xp:0,coins:0,budget:{coins:0,items:{}}};
    if (!matchesProfessionWeapon(planner.equipmentStats(p.equipment.weapon),style)) {
      const starter=starterWeapon(style);
      const recipe=jobs.find(j=>j.output.itemId===starter);
      preparation=planner.count(p,starter)>0?preparation:routeEstimate(p,recipe,1,{style});
      fighter={...p,equipment:{...p.equipment,weapon:starter}};
      if (planner.equipmentStats(starter)?.twoHanded) fighter.equipment.shield=null;
    }
    if (!deferred[skill]&&Number.isFinite(preparation.seconds)) for (const c of combatOptions(fighter,style)) {
      const supplies=combatSupplies(data,planner,fighter,c,{zone:c.zone,monster:c.monster,
        foodItemId:0,horizon:Math.max(1,horizon-preparation.seconds),supplyCost:id=>supplyCost(fighter,id)});
      if (!supplies.sustainable||supplies.horizonKills<1) continue;
      const estimate=routeEstimate(fighter,{monsterId:c.monster.id},Math.max(1,Math.floor(supplies.horizonKills)),routeOptions);
      estimate.seconds+=preparation.seconds;estimate.xp+=preparation.xp;estimate.coins+=preparation.coins;
      estimate.rate={xp:estimate.xp/estimate.seconds,coins:estimate.coins/estimate.seconds};
      const kills=Math.max(1,Math.floor(supplies.horizonKills));
      if (Number.isFinite(estimate.seconds)) candidates.push({skill,monsterId:c.monster.id,kills,drops:c.drops,
        mainXpRate:c.mainXp*kills/estimate.seconds,
        estimate,rate:estimate.rate,horizon,budget:routeEstimate(fighter,{monsterId:c.monster.id},20,{style}).budget,
        recipes:estimate.recipes,target:lv[skill]+1,stage:lv[skill]+1});
    }
    return candidates.sort((a,b)=>b.rate.xp-a.rate.xp||b.rate.coins-a.rate.coins||a.recipeId-b.recipeId);
  }
  // Profit floor (gold/hour): keep only tasks earning at least that much,
  // counting sales the current bids absorb, then maximise XP. If none
  // qualifies, earn as fast as possible instead.
  function withProfitFloor(p,choices,style,floor) {
    planner.watchMarket?.(p,choices.map(c=>c.output?.itemId??data.monsters.find(m=>m.id===c.monsterId)?.drop).filter(Boolean));
    const priced=planner.incomeChoices?planner.incomeChoices(p,choices,style):choices.filter(c=>c.rate.coins>0);
    const enough=priced.filter(c=>c.rate.coins*3600>=floor).sort((a,b)=>b.rate.xp-a.rate.xp);
    if(enough.length)return {choices:enough,note:`收益不低于 ${floor} 金币/小时的工作中经验最高`};
    const richest=[...priced].sort((a,b)=>b.rate.coins-a.rate.coins);
    return {choices:richest,note:richest.length?`没有工作达到 ${floor} 金币/小时，改做收益最高的工作`:''};
  }
  function chooseGoal(p,served={},deferred={},style='magic',options={}) {
    let choices=candidates(p,style,deferred),note='';
    const floor=Math.max(0,typeof options==='object'&&options?.profitFloor||0);
    if(floor>0&&choices.length){
      const filtered=withProfitFloor(p,choices,style,floor);
      if(filtered.choices.length)({choices,note}=filtered);
    }
    if (!choices.length) return null;
    let best=choices[0];
    const current=choices.find(c=>c.recipeId===p.route?.jobId||c.monsterId&&data.zones.find(z=>z.id===p.route?.zoneId)?.monsterId===c.monsterId);
    // The model already charges travel; retain an active route within 5% to
    // absorb stochastic estimates without endless switching.
    if (current&&current.rate.xp>=best.rate.xp*.95) best=current;
    const goal={...best,reason:`${note?note+'；':''}滚动 ${horizon/60} 分钟：采购／自备后的总经验约 ${(best.rate.xp*60).toFixed(0)}/分，`+
      `${note?'收益':'直接金币'}约 ${(best.rate.coins*60).toFixed(1)}/分${note?'':'（盈余出售另计）'}；已计供料与旅行`};
    const investment=planner.investmentBudget?.(p,goal,style);
    if (investment) {
      goal.budget.coins=Math.max(goal.budget.coins,investment.coins);
      goal.enhancement=investment.enhancement;
      if (p.coins<investment.coins) goal.reason=`先补足已核算回本的投资 ${investment.coins} 金币；${goal.reason}`;
    }
    return goal;
  }
  return {chooseGoal,candidates,routeEstimate,estimateWork,combatOptions,setMeasurements,supplyCost,horizon,rateSource,
    routeMeasurement:(p,key)=>usableMeasurement(p,key)};
}
