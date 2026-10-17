// Informational only: frontend filenames and file hashes never gate startup.
// The game's bundled client script, e.g. /assets/index-DAY9oe71.js.
export const CLIENT_ASSET=/^\/assets\/index-[\w-]+\.js$/;
export async function checkClient(data, sources, pageUrl) {
  const page=new URL(pageUrl);
  const clients=[data,...(data.compatibleClients??[])];
  const urls=[...new Set(sources.filter(Boolean))].map(src=>new URL(src,page))
    .filter(url=>url.origin===page.origin&&CLIENT_ASSET.test(url.pathname));
  const known=urls.find(url=>clients.some(c=>url.pathname===`/assets/${c.client}`));
  if (known) return {ok:true,message:`已核对游戏版本：${known.pathname.split('/').pop()}`};
  return {ok:true,message:urls.length?
    `当前游戏：${urls.map(u=>u.pathname.split('/').pop()).join('、')}；未核对，已跳过版本限制`:
    '未识别游戏文件名；已跳过版本限制'};
}

// Parse public tables as literals. Downloaded game code is never evaluated.
export function validateGameData(data) {
  const finite=n=>Number.isFinite(n)&&n>=0;
  const table=(rows,key,check)=>Array.isArray(rows)&&rows.length>0&&rows.length<10000&&
    new Set(rows.map(r=>r?.[key])).size===rows.length&&rows.every(r=>
      r&&Number.isInteger(r[key])&&r[key]>=0&&check(r));
  if(!data||!Array.isArray(data.skills)||!data.skills.includes('magic')||
    !Number.isFinite(data.tickMs)||data.tickMs<=0||!data.items) return false;
  const item=id=>Number.isInteger(id)&&Object.hasOwn(data.items,id);
  if(!Object.values(data.items).every(i=>i&&item(i.id)&&typeof i.name==='string'&&finite(i.value)))return false;
  if(!table(data.jobs,'id',j=>data.skills.includes(j.skill)&&typeof j.name==='string'&&
    finite(j.levelReq)&&j.levelReq>=1&&finite(j.xp)&&finite(j.baseTicks)&&j.baseTicks>0&&
    item(j.output?.itemId)&&finite(j.output.qty)&&j.output.qty>0&&Array.isArray(j.inputs)&&
    j.inputs.every(i=>item(i.itemId)&&finite(i.qty)&&i.qty>0)&&
    (!j.grow||finite(j.grow))&&['burn','caught'].every(k=>!j[k]||
      finite(j[k].chanceAtReq)&&j[k].chanceAtReq<=1&&j[k].safeAtLevel>j.levelReq)))return false;
  if(!table(data.gear,'itemId',g=>item(g.itemId)&&typeof g.slot==='string'&&
    ['accuracy','strength','defence','bonus','luck','speed','levelReq'].every(k=>g[k]===undefined||finite(g[k]))))return false;
  if(!table(data.monsters,'id',m=>typeof m.name==='string'&&
    ['level','hp','maxHit','attack','defence','speed','xp'].every(k=>finite(m[k]))&&m.hp>0&&m.speed>0&&
    (m.dropChance===undefined||finite(m.dropChance)&&m.dropChance<=1)&&
    Array.isArray(m.gold)&&m.gold.length===2&&m.gold.every(finite)&&m.gold[1]>=m.gold[0]&&item(m.drop)))return false;
  const xy=p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0;
  if(!table(data.sites,'id',s=>xy(s)&&Array.isArray(s.jobIds)&&s.jobIds.every(id=>data.jobs.some(j=>j.id===id))))return false;
  if(!table(data.zones,'id',z=>xy(z)&&data.monsters.some(m=>m.id===z.monsterId)))return false;
  if(!table(data.banks,'id',b=>xy(b)&&b.approach&&xy(b.approach)))return false;
  if(data.foodHealingMultipliers&&(!Array.isArray(data.foodHealingMultipliers)||
    data.foodHealingMultipliers.length!==5||!data.foodHealingMultipliers.every(n=>Number.isFinite(n)&&n>0)))return false;
  if(data.houseRooms&&(!Array.isArray(data.houseRooms)||!data.houseRooms.length||data.houseRooms.length>50||
    new Set(data.houseRooms.map(r=>r.id)).size!==data.houseRooms.length||!data.houseRooms.every(r=>
      /^[a-z]+$/.test(r.id)&&typeof r.name==='string'&&r.bonus&&typeof r.bonus.kind==='string'&&
      (!r.bonus.skill||data.skills.includes(r.bonus.skill))&&finite(r.rate)&&
      [r.feeds,...r.alsoFeeds??[]].every(f=>['wood','stone','fish','crop','hide'].includes(f)))))return false;
  // Fields unlocked by another skill (client v0.8.1 table): a known field and skill, a level.
  if(data.farmGates&&!Object.entries(data.farmGates).every(([id,g])=>data.sites.some(s=>s.id===Number(id)&&s.kind==='field')&&
    data.skills.includes(g?.skill)&&Number.isInteger(g?.level)&&g.level>=1))return false;
  if(data.houseRules&&(!Object.values(data.houseRules).every(n=>Number.isFinite(n)&&n>0)||
    data.houseRules.grid!==5||data.houseRules.entrance!==12||data.houseRules.lake!==6))return false;
  if(data.houseTravel) {
    const {region,portals,exit}=data.houseTravel;
    const portal=s=>s&&Number.isInteger(s.id)&&xy(s)&&s.approach&&xy(s.approach)&&
      Math.max(Math.abs(s.x-s.approach.x),Math.abs(s.y-s.approach.y))<=1;
    if(!region||region.name!=='Home'||!xy(region)||!Number.isInteger(region.width)||region.width<=0||
      !Number.isInteger(region.height)||region.height<=0||!portal(exit)||!Array.isArray(portals)||
      !portals.length||!portals.every(portal))return false;
  }
  return ['baseXp','growth','beyondStep','beyondGrowth','speedPerLevelAboveRequirement','journeyLevel']
    .every(k=>finite(data.xp?.[k]))&&data.xp.baseXp>0&&data.xp.growth>=1.001&&
    data.xp.beyondStep>=.001&&data.xp.beyondGrowth>=1.001&&
    Number.isInteger(data.xp.journeyLevel)&&data.xp.journeyLevel>=2&&data.xp.journeyLevel<=2000;
}

export function extractGameTables(source, parse, baseline) {
  if(typeof source!=='string'||source.length>6000000)throw new Error('公开数据大小异常');
  const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  const declarations=new Map(),functions=new Map();
  for(const statement of ast.body) {
    if(statement.type==='VariableDeclaration')for(const d of statement.declarations)
      if(d.id.type==='Identifier')declarations.set(d.id.name,d.init);
    if(statement.type==='FunctionDeclaration')functions.set(statement.id.name,statement);
  }
  const keys=node=>node?.type==='ObjectExpression'?node.properties.map(p=>p.key?.name??p.key?.value):[];
  function literal(node,scope={},trail=[]) {
    if(!node||trail.length>40)throw new Error('不支持的数据表达式');
    if(node.type==='Literal')return node.value;
    if(node.type==='Identifier') {
      if(Object.hasOwn(scope,node.name))return scope[node.name];
      if(trail.includes(node.name))throw new Error('循环数据声明');
      return literal(declarations.get(node.name),scope,[...trail,node.name]);
    }
    if(node.type==='ArrayExpression')return node.elements.map(n=>literal(n,scope,trail));
    if(node.type==='ObjectExpression')return Object.fromEntries(node.properties.map(p=>{
      if(p.type!=='Property'||p.computed||p.kind!=='init'||p.method)throw new Error('非静态属性');
      const key=p.key.name??p.key.value;
      if(['__proto__','constructor','prototype'].includes(key))throw new Error('无效属性');
      return [key,literal(p.value,scope,trail)];
    }));
    if(node.type==='UnaryExpression') {
      const n=literal(node.argument,scope,trail);
      if(node.operator==='!')return !n;
      if(node.operator==='-')return -n;
    }
    if(node.type==='BinaryExpression') {
      const a=literal(node.left,scope,trail),b=literal(node.right,scope,trail);
      if(node.operator==='+')return a+b;if(node.operator==='-')return a-b;
      if(node.operator==='*')return a*b;if(node.operator==='/')return a/b;
    }
    if(node.type==='CallExpression'&&node.callee.type==='Identifier') {
      const fn=functions.get(node.callee.name),body=fn?.body.body;
      const result=body?.length===1&&body[0].type==='ReturnStatement'?body[0].argument:null;
      // Cooking's burn descriptor is the only allowed literal constructor.
      if(fn?.params.length===1&&fn.params[0].type==='Identifier'&&node.arguments.length===1&&
        keys(result).length===3&&['itemId','chanceAtReq','safeAtLevel'].every(k=>keys(result).includes(k)))
        return literal(result,{[fn.params[0].name]:literal(node.arguments[0],scope,trail)},[...trail,node.callee.name]);
    }
    throw new Error('公开表包含未知表达式，保留已核对数据');
  }
  function one(required,array=true,exact=false) {
    const matches=[...declarations.values()].filter(node=>{
      const row=array&&node?.type==='ArrayExpression'?node.elements[0]:!array?node:null;
      const names=keys(row);
      return required.every(k=>names.includes(k))&&(!exact||names.length===required.length);
    });
    if(matches.length!==1)throw new Error(`无法唯一识别公开表：${required.join('/')}`);
    return literal(matches[0]);
  }
  const foodArrays=new Set();
  function findHealing(node) {
    if(!node||typeof node!=='object')return;
    if(node.type==='BinaryExpression'&&node.operator==='*'&&node.left.type==='MemberExpression'&&
      (node.left.property.name??node.left.property.value)==='heals'&&node.right.type==='MemberExpression'&&
      node.right.object.type==='Identifier')foodArrays.add(node.right.object.name);
    for(const child of Object.values(node)) {
      if(Array.isArray(child))child.forEach(findHealing);
      else if(child&&typeof child==='object')findHealing(child);
    }
  }
  findHealing(ast);
  if(foodArrays.size>1)throw new Error('无法唯一识别食物品质治疗表');
  const items=Object.fromEntries(one(['id','name','stackable','value']).map(i=>[i.id,i]));
  const banks=one(['id','x','y'],true,true).map(b=>{
    const old=baseline.banks.find(o=>o.id===b.id&&o.x===b.x&&o.y===b.y);
    if(!old)throw new Error('仓库地图变化，需核对寻路数据');
    return {...b,approach:{...old.approach}};
  });
  const jobs=one(['id','name','skill','baseTicks','xp','inputs','output']);
  const retired=new Set(jobs.filter(j=>j.retired).map(j=>j.id));
  const updated={...baseline,items,banks,
    jobs:jobs.filter(j=>!j.retired),
    gear:[...one(['itemId','slot','bonus']),...one(['itemId','slot','accuracy','strength','defence'])],
    sites:one(['id','x','y','kind','jobIds']).map(s=>({...s,jobIds:s.jobIds.filter(id=>!retired.has(id))})).filter(s=>s.jobIds.length),
    zones:one(['id','monsterId','x','y','width','height']),
    monsters:one(['id','hp','attack','defence','speed','gold','drop']),
    xp:one(['journeyLevel','baseXp','growth','beyondStep','beyondGrowth','speedPerLevelAboveRequirement'],false),
    toolSkills:one(['pickaxe','rod','axe','gloves','pan','hammer','knife','needle','mortar','hoe'],false,true),
    ...(foodArrays.size?{foodHealingMultipliers:literal(declarations.get([...foodArrays][0]))}:{})
  };
  if([...declarations.values()].some(n=>n?.type==='ArrayExpression'&&keys(n.elements[0]).includes('feeds')))
    updated.houseRooms=one(['id','name','bonus','feeds']).map(({id,name,bonus,feeds,alsoFeeds,rate})=>
      ({id,name,bonus,feeds,...alsoFeeds?{alsoFeeds}:{},rate:rate??1}));
  if(baseline.houseTravel) {
    const portals=one(['id','x','y','kind','jobIds']).filter(s=>s.look?.startsWith('portal:')||s.look==='portal-out');
    if(portals.length&&[...baseline.houseTravel.portals,baseline.houseTravel.exit].some(old=>
      !portals.some(s=>s.id===old.id&&s.x===old.x&&s.y===old.y)))throw new Error('家园传送门变化，需重新核对返家路线');
  }
  if(!validateGameData(updated))throw new Error('公开表校验失败，保留已核对数据');
  return updated;
}

export async function refreshGameData(data,sources,pageUrl,{fetch:request,parse,storage,extract}={}) {
  const page=new URL(pageUrl),url=sources.filter(Boolean).map(s=>new URL(s,page))
    .find(u=>u.origin===page.origin&&CLIENT_ASSET.test(u.pathname));
  if(!url)return {updated:false,message:'未识别公开表入口；使用内置数据，未知内容跳过'};
  const client=url.pathname.split('/').pop(),key='deepvein-public-tables-v1';
  if(client===data.client)return {updated:false,message:`数据已核对：${client}`};
  try {
    const saved=JSON.parse(storage?.getItem(key)||'null');
    const cache=saved&&{...saved,hot:saved.hot??data.hot,houseRooms:saved.houseRooms??data.houseRooms,houseRules:data.houseRules,houseTravel:data.houseTravel,
      farmGates:data.farmGates};
    if(cache?.client===client&&cache.protocol===data.protocol&&validateGameData(cache)&&!cache.jobs.some(j=>j.retired))
      return {updated:true,data:cache,message:`已加载本页校验数据：${client}`};
  } catch { /* A damaged cache never prevents a fresh public-data check. */ }
  try {
    const response=await request(url.href,{credentials:'omit',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('官网暂不可读');
    const source=await response.text();
    const updated=extract?await extract(source,data):extractGameTables(source,parse,data);
    updated.client=client;updated.captured=new Date().toISOString().slice(0,10);
    // Formula constants retain the reviewed baseline; tables are refreshed atomically.
    updated.formulaBaseline=data.formulaBaseline??data.client;
    try{storage?.setItem(key,JSON.stringify(updated));}catch { /* Refresh still applies in this tab. */ }
    return {updated:true,data:updated,message:`配方／装备／怪物表已更新并校验：${client}`};
  } catch(error) {
    return {updated:false,message:`${client} 数据更新暂缓：${error.message}；沿用已核对内容`};
  }
}
