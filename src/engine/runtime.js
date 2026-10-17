import {buffKey} from '../planner/supplies.js';

// Lives in the planning Worker. The engine is the game's own simulation code,
// extracted from the public client (see extract.js); it scores candidate
// activities by simulating them tick by tick from the real character state.

let current = {id: null, ok: false, api: null, error: null};
const cache = new Map(); // calibration key -> simulated rate record
const CACHE_LIMIT = 600;
const COMBAT_SKILLS = ['melee', 'ranged', 'magic', 'defence', 'hitpoints'];

export function loadEngine({id, factory}) {
  try {
    const api = new Function(factory)();
    for (const k of ['tick', 'predict', 'startFight', 'startWork', 'createContext', 'maxHp', 'homeBank', 'combatTargetTile', 'hotSkill', 'levelXp'])
      if (typeof api[k] !== 'function') throw new Error(`engine missing ${k}`);
    if (api.tick.length !== 4 || !(api.world?.zones?.length > 0) || !(api.tickMs > 0)) throw new Error('engine shape check failed');
    smokeTest(api);
    current = {id, ok: true, api, error: null};
  } catch (error) {
    current = {id, ok: false, api: null, error: String(error?.message ?? error).slice(0, 200)};
  }
  cache.clear();
  return current;
}
export const engineStatus = () => ({id: current.id, ok: current.ok, error: current.error, cached: cache.size});
export const engineReady = () => current.ok;
export const engineApi = () => current.ok ? current.api : null;

// A fresh level-30 fighter must kill the first monster in ten minutes.
function smokeTest(api) {
  const skills = Object.fromEntries(api.allSkills.map(s => [s, 0]));
  for (const s of COMBAT_SKILLS) skills[s] = api.levelXp(30);
  const monster = api.monsters.find(m => api.world.zones.some(z => z.monsterId === m.id));
  const result = simulate(api, {id: 1, skills, lastTick: api.predictionStartTick}, {monsterId: monster.id}, {hours: 1 / 6, seed: 1, foodItemId: 64});
  if (!result || result.failed || !(result.kills > 0)) throw new Error('engine smoke test produced no kills');
}

// Cancel the game's hot-skill bonus for this activity: measurements describe
// the base rate, and the planner applies hot windows itself.
function cancelHot(api, start, end, skill) {
  const windows = [];
  for (let tick = start; tick <= end;) {
    const hot = api.hotSkill(tick), until = Math.min(end, hot.until - 1);
    const xp = hot.skill === skill && hot.kind === 'xp' ? hot.mult - 1 : 0, rare = hot.skill === skill && hot.kind === 'rarity' ? hot.mult - 1 : 0;
    if (xp || rare) windows.push({fromTick: tick, toTick: until, xpMult: 1 - xp, rarityMult: 1 - rare});
    tick = until + 1;
  }
  return windows;
}

// Simulate one activity from a copy of the player. Combat gets unlimited food
// (food logistics are planned separately); crafting gets unlimited inputs.
export function simulate(api, you, activity, {hours = 1, seed = 1, foodItemId = null, maxMs = Infinity, clock = () => performance.now()} = {}) {
  const began = clock();
  const start = api.predictionStartTick, durationTicks = Math.round(hours * 3600000 / api.tickMs);
  let zone = null, site = null, target;
  if (activity.monsterId != null) {
    zone = api.world.zones.find(z => z.monsterId === activity.monsterId);
    if (!zone) return null;
    target = api.combatTargetTile(zone, you.id ?? 1);
  } else {
    site = api.world.sites.find(s => s.jobIds.includes(activity.jobId));
    if (!site) return null;
    target = site;
  }
  const bank = api.homeBank({world: api.world}, target);
  const copy = structuredClone(you), shift = start - (Number.isFinite(you.lastTick) ? you.lastTick : start);
  const brews = {};
  for (const [kind, until] of Object.entries(copy.brews ?? {})) if (Number.isFinite(until)) brews[kind] = until + shift;
  const food = foodItemId ?? (copy.foodItemId > 0 ? copy.foodItemId : 64);
  // Enough for an hour (at most a few thousand actions). Some engine loops scale
  // with the stocked quantity, so never stock an "infinite" 1e9.
  const stock = {}, plenty = 20000;
  if (zone) stock[food] = plenty;
  for (const input of activity.inputs ?? []) stock[input.itemId] = plenty * input.qty;
  const p = {
    equipment: Object.fromEntries(api.equipmentSlots.map(k => [k, null])), masteries: {}, house: {}, houseFurniture: {},
    perks: {meals: 0, quick: 0, rest: 0, pockets: 0, hands: 0}, guildBonus: 0, bankOrder: [], bankLocked: [], tunics: [], guide: {},
    housePoints: {}, houseCells: [], houseBuild: null, houseUpgrades: {}, streak: {}, tally: {items: {}, monsters: {}, coinsEarned: 0},
    collection: {}, collections: {}, forgeLog: {}, achievements: {}, titles: [], coins: 0, bankSlotsBought: 0,
    foodMaxTier: 4, foodPerTrip: -1, eatAt: .5, ironman: false, brewTier: {},
    ...copy,
    // The engine reads every perk and slot directly; a missing key would turn
    // speeds and pack capacity into NaN, so merge onto complete defaults.
    perks: {meals: 0, quick: 0, rest: 0, pockets: 0, hands: 0, ...copy.perks},
    equipment: {...Object.fromEntries(api.equipmentSlots.map(k => [k, null])), ...copy.equipment},
    brews, id: you.id ?? 1, x: bank.x, y: bank.y, homeBank: bank.id, lastTick: start,
    pack: [], bank: stock, overflow: {}, route: null, enhance: null, plots: {}, queue: [], path: null, held: false, raidHeld: false,
    quests: {day: 0, week: 0, daily: [], weekly: []}, unlimitedBank: true, offlineCapTicks: durationTicks * 2,
    activity: 'idle', pathIndex: 0, stride: 0, strideSpeed: 1000, actionIndex: 0, rollIndex: {}, foeIndex: null, foeHp: 0,
    foeTicks: 0, attemptTicks: 0, stunUntil: 0, workSiteId: null, workJobId: null,
  };
  if (zone) p.foodItemId = food;
  p.hp = api.maxHp(p);
  const ctx = {...api.createContext(api.world, seed), windows: cancelHot(api, start, start + durationTicks, zone ? 'combat' : activity.skill), hypothetical: true};
  let q = null;
  api.predict(p, ctx, prepared => { q = prepared; return false; });
  if (!q) return {failed: true};
  q.offlineCapTicks = durationTicks * 2;
  const ok = zone ? api.startFight(q, ctx, zone.id) : api.startWork(q, ctx, site.id, activity.jobId, 'bank');
  if (!ok) return {failed: true};
  const skills = {...q.skills}, coins = q.coins;
  const r = {ticks: 0, movingTicks: 0, kills: 0, deaths: 0, food: 0, produced: 0, tiers: [0, 0, 0, 0, 0], endedEarly: false};
  for (let tick = 1; tick <= durationTicks; tick++) {
    if (q.activity === 'walking') r.movingTicks++;
    const events = [];
    api.tick(q, ctx, start + tick, events);
    for (const e of events) {
      if (e.kind === 'killed') r.kills++;
      else if (e.kind === 'died') r.deaths++;
      else if (e.kind === 'ate') r.food++;
      else if (e.kind === 'produced') {
        r.produced += e.qty ?? 1;
        if (activity.jobId === e.jobId && Number.isInteger(e.tier) && r.tiers[e.tier] != null) r.tiers[e.tier] += e.qty ?? 1;
      }
    }
    r.ticks = tick;
    if (tick % api.predictionChunkTicks === 0 && (r.deaths > 0 || q.route === null)) { r.endedEarly = true; break; }
    // A few recipes are pathologically slow to simulate; leave them to the formula.
    if ((tick & 255) === 0 && clock() - began > maxMs) return {failed: true, slow: true};
  }
  r.seconds = r.ticks * api.tickMs / 1000;
  r.travelSeconds = r.movingTicks * api.tickMs / 1000;
  r.coins = q.coins - coins;
  r.xpBySkill = Object.fromEntries(Object.keys(q.skills).map(s => [s, q.skills[s] - (skills[s] ?? 0)]).filter(([, v]) => v > 0));
  r.xp = Object.values(r.xpBySkill).reduce((a, b) => a + b, 0);
  return r;
}

// Calibration records for the planner, in the Telemetry rate format, for every
// monster and unlocked job. Simulations are cached by gear, levels, buffs and
// account bonuses, and limited to `budgetMs` per call; the rest follow later.
export function engineRates(data, planner, p, {budgetMs = 500, now = () => performance.now()} = {}) {
  if (!current.ok || !p?.skills || !p.equipment) return {};
  const api = current.api, began = now(), out = {};
  const levels = planner.levels(p);
  const equipmentKey = JSON.stringify(Object.keys(p.equipment).sort().map(k => [k, p.equipment[k]]));
  const buffs = buffKey(data, p);
  const account = JSON.stringify([p.perks ?? {}, p.masteries ?? {}, p.house ?? {}, Object.keys(p.houseFurniture ?? {}).sort(), p.guildBonus ?? 0]);
  const tasks = [
    ...data.monsters.filter(m => data.zones.some(z => z.monsterId === m.id)).map(m =>
      ({key: `combat:${m.id}`, skills: COMBAT_SKILLS, activity: {monsterId: m.id}})),
    ...data.jobs.filter(j => !j.grow && !j.rarity && j.levelReq <= levels[j.skill] && data.sites.some(s => s.jobIds.includes(j.id)))
      .map(j => ({key: `job:${j.id}`, skills: [j.skill], activity: {jobId: j.id, skill: j.skill, inputs: j.inputs}})),
  ];
  // The current route first: it is what the planner compares everything to.
  const currentKey = p.route?.zoneId != null ? `combat:${data.zones.find(z => z.id === p.route.zoneId)?.monsterId}` :
    p.route?.jobId != null ? `job:${p.route.jobId}` : null;
  tasks.sort((a, b) => Number(b.key === currentKey) - Number(a.key === currentKey));
  for (const task of tasks) {
    const levelsKey = JSON.stringify(task.skills.map(s => [s, levels[s]]));
    const cacheKey = JSON.stringify([current.id, task.key, equipmentKey, levelsKey, buffs, account]);
    let record = cache.get(cacheKey);
    if (!record) {
      if (now() - began > budgetMs) continue;
      let r = null;
      try { r = simulate(api, p, task.activity, {hours: 1, seed: 1, maxMs: 150, clock: now}); } catch { r = null; }
      if (!r || r.failed || !(r.seconds >= 60)) record = {skip: true};
      else {
        const xp = task.skills.reduce((n, s) => n + (r.xpBySkill[s] ?? 0), 0);
        // Gathering quality: one roll against thresholds scaled by a single
        // factor, so the share above common gives it (uncommon has enough samples).
        const rolled = r.tiers.reduce((a, b) => a + b, 0), above = rolled - r.tiers[0];
        const rarityFactor = !task.activity.inputs?.length && above >= 50 && above < rolled ?
          above / rolled / data.rarityChance.uncommon : null;
        // Dying in the simulation marks the route as worthless, not merely slow.
        record = {routeKey: task.key, equipmentKey, levelsKey, buffKey: buffs, seconds: r.seconds, travelSeconds: r.travelSeconds,
          xp: r.deaths ? 0 : xp, coins: r.deaths ? 0 : r.coins, samples: 3, kills: r.kills, foodUsed: r.food, deaths: r.deaths, simulated: true,
          ...(rarityFactor ? {rarityFactor} : {})};
      }
      if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
      cache.set(cacheKey, record);
    }
    if (!record.skip) out[task.key] = record;
  }
  return out;
}

// Real measurements win when the planner would use them; simulations fill the rest.
export function mergeRates(simulated, measured = {}) {
  const out = {...simulated};
  for (const [key, m] of Object.entries(measured ?? {})) {
    if (!(m && m.samples >= 3 && m.seconds - (m.travelSeconds ?? 0) >= 60)) continue;
    // Telemetry does not count qualities: keep the simulated factor for the same gear.
    const sim = simulated?.[key];
    out[key] = m.rarityFactor == null && sim?.rarityFactor && sim.equipmentKey === m.equipmentKey && sim.buffKey === m.buffKey ?
      {...m, rarityFactor: sim.rarityFactor} : m;
  }
  return out;
}
