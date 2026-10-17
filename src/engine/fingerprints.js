// Name-independent fingerprints for the engine entry points in the minified
// client. Each direct fingerprint must match exactly one top-level unit; it
// uses only parameter counts, string literals, property names and small AST
// shapes. Verified against client 1.0.1187 (dvi-lab reference) and 1.0.1189.

const has = (set, xs) => xs.every(x => set.has(x));
const fnNode = u => u.kind === 'function' ? u.node :
  (u.node.init && /^(Arrow)?Function/.test(u.node.init.type) ? u.node.init : null);
const params = u => fnNode(u)?.params.length ?? -1;
const bodyStmts = u => { const f = fnNode(u); return f && f.body.type === 'BlockStatement' ? f.body.body : null; };
const lastReturn = u => { const b = bodyStmts(u); return b?.at(-1)?.type === 'ReturnStatement' ? b.at(-1).argument : null; };
const singleReturn = u => { const b = bodyStmts(u); return b && b.length === 1 && b[0].type === 'ReturnStatement' ? b[0].argument : null; };
const objKeys = o => o?.type === 'ObjectExpression' ? o.properties.filter(p => p.type === 'Property' && !p.computed).map(p => p.key.name ?? p.key.value) : [];
const arrayOfObjects = (u, keys, min = 5) => {
  const a = u.node.init;
  if (u.kind !== 'const' || a?.type !== 'ArrayExpression' || a.elements.length < min) return false;
  return a.elements.every(e => e?.type === 'ObjectExpression') && has(new Set(objKeys(a.elements[0])), keys);
};
const isFnUnit = u => fnNode(u) !== null;
function walk(n, f) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { n.forEach(c => walk(c, f)); return; }
  if (typeof n.type === 'string') f(n);
  for (const k in n) { const v = n[k]; if (v && typeof v === 'object') walk(v, f); }
}
const findAll = (n, pred) => { const out = []; walk(n, x => pred(x) && out.push(x)); return out; };
const isModuleName = (mod, n) => n?.type === 'Identifier' && mod.unitOfName.has(n.name);

export const DIRECT = {
  tick: u => params(u) === 4 && has(u.strings, ['walking', 'working', 'drinking', 'banking', 'enhancing', 'idle', 'done']) &&
    has(u.props, ['lastTick', 'activity']) && findAll(fnNode(u).body, n => n.type === 'SwitchStatement').length >= 1,
  predict: u => params(u) === 3 && has(u.props, ['hypothetical', 'secretAt', 'offlineCapTicks', 'eventBox', 'rollIndex', 'stunUntil', 'foeIndex', 'lastTick']) &&
    findAll(fnNode(u).body, n => n.type === 'UnaryExpression' && n.operator === 'delete').length > 0,
  startFight: u => params(u) === 4 && has(u.strings, ['toBank', 'toWork', 'bank']) && has(u.props, ['zoneById', 'onFull', 'phase', 'route']),
  startWork: u => params(u) >= 5 && has(u.strings, ['toWork', 'toBank', 'drop']) && has(u.props, ['siteById', 'jobIds', 'levelReq', 'route']),
  createContext: u => params(u) === 2 && (k => k.length === 5 && has(new Set(k), ['world', 'seed', 'paths', 'windows', 'secretAt']))(objKeys(singleReturn(u))),
  hotSkill: u => params(u) === 1 && has(new Set(objKeys(lastReturn(u))), ['skill', 'kind', 'mult', 'from', 'until']) && has(u.strings, ['rarity', 'xp']),
  workChance: u => { const r = singleReturn(u); return params(u) === 2 && r?.type === 'ConditionalExpression' && r.consequent.type === 'Literal' && r.consequent.value === 1 && has(u.props, ['inputs', 'length', 'skills', 'skill']) && u.strings.size === 0; },
  enhanceChance: u => { const r = singleReturn(u); return params(u) === 2 && r?.type === 'CallExpression' && r.callee.property?.name === 'min' && u.strings.size === 1 && u.strings.has('enhance') && u.props.has('masteries'); },
  maxHp: u => params(u) === 1 && u.strings.size === 1 && u.strings.has('hp') && has(u.props, ['skills', 'hitpoints', 'masteries']),
  combatTargetTile: u => { const r = bodyStmts(u)?.at(-1); return params(u) === 2 && r?.type === 'ReturnStatement' && (k => k.length === 2 && k.includes('x') && k.includes('y'))(objKeys(r.argument)) && has(u.props, ['width', 'height', 'id']) && u.strings.size === 0 && bodyStmts(u).length === 2; },
  homeBank: u => params(u) === 2 && has(u.props, ['homeBank', 'world', 'bankById', 'isFinite']) && u.strings.size === 0,
  allSkills: u => u.kind === 'const' && u.node.init?.type === 'ArrayExpression' && u.node.init.elements.every(e => e?.type === 'Literal' && typeof e.value === 'string') && has(u.strings, ['mining', 'fishing', 'enhancing', 'melee', 'hitpoints']),
  levelXp: u => { const b = bodyStmts(u); return params(u) === 1 && b?.length === 2 && b[1].type === 'ReturnStatement' && b[1].argument.type === 'MemberExpression' && b[1].argument.computed && findAll(b[0], n => n.type === 'MemberExpression' && ['min', 'max', 'floor'].includes(n.property.name)).length === 3; },
  equipmentSlots: u => u.kind === 'const' && u.node.init?.type === 'ArrayExpression' && u.node.init.elements.every(e => e?.type === 'Literal' && typeof e.value === 'string') && u.node.init.elements[0].value === 'weapon' && has(u.strings, ['weapon', 'shield', 'helmet', 'pickaxe', 'mount']),
  monsters: u => arrayOfObjects(u, ['id', 'name', 'level', 'hp', 'maxHit', 'attack', 'defence', 'speed', 'xp', 'gold', 'drop']),
  // Optional (mastery spending): `return f(p.collections)+g(p.forgeLog)` and the track table.
  masteryEarnedPoints: u => {
    const r = singleReturn(u), arg = c => c?.type === 'CallExpression' && c.arguments.length === 1 ? c.arguments[0].property?.name : null;
    return params(u) === 1 && r?.type === 'BinaryExpression' && r.operator === '+' && arg(r.left) === 'collections' && arg(r.right) === 'forgeLog';
  },
  masteryTracks: u => arrayOfObjects(u, ['id', 'name', 'blurb', 'lane', 'perRank', 'unit'], 5),
};
export const OPTIONAL = new Set(['masteryEarnedPoints', 'masteryTracks']);
// Entry points the simulation cannot run without.
export const REQUIRED = ['tick', 'predict', 'startFight', 'startWork', 'createContext', 'world', 'predictionStartTick', 'predictionChunkTicks', 'tickMs', 'hotSkill', 'maxHp', 'homeBank', 'combatTargetTile', 'allSkills', 'equipmentSlots', 'levelXp', 'monsters'];

const uniqName = xs => { const s = [...new Set(xs)]; return s.length === 1 ? s[0] : null; };
const constValue = (mod, name) => { const i = mod.unitOfName.get(name)?.node.init; return i?.type === 'Literal' ? i.value : undefined; };

export const RELATIONAL = {
  // predict(): `<player>.lastTick = <CONST>`
  predictionStartTick: (mod, f) => uniqName(findAll(fnNode(mod.unitOfName.get(f.predict)).body, n => n.type === 'AssignmentExpression' &&
    n.operator === '=' && n.left.property?.name === 'lastTick' && isModuleName(mod, n.right)).map(n => n.right.name)),
  // predict(): chunked loop `h += <CONST>`
  predictionChunkTicks: (mod, f) => uniqName(findAll(fnNode(mod.unitOfName.get(f.predict)).body, n => n.type === 'AssignmentExpression' &&
    n.operator === '+=' && isModuleName(mod, n.right)).map(n => n.right.name)),
  // const W = F(<obj>) where F builds siteById/bankById/zoneById
  world: mod => {
    const builders = new Set(mod.units.filter(u => isFnUnit(u) && has(u.props, ['siteById', 'bankById', 'zoneById', 'collision'])).map(u => u.names[0]));
    return uniqName(mod.units.filter(u => u.kind === 'const' && u.node.init?.type === 'CallExpression' && builders.has(u.node.init.callee.name) &&
      u.node.init.arguments.length === 1 && isModuleName(mod, u.node.init.arguments[0])).map(u => u.names[0]));
  },
  // function T(a){return Math.floor((a-EPOCH)/TICK_MS)} with EPOCH > 1e12
  tickMs: mod => uniqName(mod.units.filter(isFnUnit).flatMap(u => {
    const r = singleReturn(u);
    if (params(u) !== 1 || r?.type !== 'CallExpression' || r.callee.property?.name !== 'floor') return [];
    const d = r.arguments[0];
    if (d?.type !== 'BinaryExpression' || d.operator !== '/' || d.left.type !== 'BinaryExpression' || d.left.operator !== '-' ||
      !isModuleName(mod, d.left.right) || !isModuleName(mod, d.right)) return [];
    const epoch = constValue(mod, d.left.right.name);
    return typeof epoch === 'number' && epoch > 1e12 ? [d.right.name] : [];
  })),
};

export const DOM_GLOBALS = new Set(['document', 'window', 'WebSocket', 'fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage',
  'navigator', 'location', 'requestAnimationFrame', 'indexedDB', 'Worker', 'HTMLElement', 'Image', 'Audio', 'AudioContext', 'history',
  'alert', 'getComputedStyle', 'MutationObserver', 'ResizeObserver', 'importScripts', 'postMessage']);

export function findEntryPoints(mod) {
  const found = {}, problems = [];
  for (const [k, pred] of Object.entries(DIRECT)) {
    const hits = mod.units.filter(u => {
      if ([...u.globals].some(g => DOM_GLOBALS.has(g))) return false;
      try { return pred(u); } catch { return false; }
    });
    if (hits.length === 1) found[k] = hits[0].names[0];
    else problems.push(`${OPTIONAL.has(k) ? 'optional ' : ''}${k}: ${hits.length} candidates`);
  }
  for (const [k, fn] of Object.entries(RELATIONAL)) {
    let r = null;
    try { r = fn(mod, found); } catch (e) { problems.push(`${k}: ${e.message}`); continue; }
    if (r) found[k] = r; else problems.push(`${k}: relation not resolved`);
  }
  return {found, problems};
}
