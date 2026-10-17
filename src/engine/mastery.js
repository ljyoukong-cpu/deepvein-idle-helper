import {simulate} from './runtime.js';
import {MASTERY_NAMES_ZH, MASTERY_RANK_LIMIT, MASTERY_TRACKS, rankCost, spentPoints} from './mastery-rules.js';

// Each rank adds 0.5% to its track's effect (client ni table).
const PER_RANK = .005;
const GATHER_SKILLS = ['mining', 'fishing', 'woodcutting', 'thieving', 'farming'];
const CRAFT_SKILLS = ['smithing', 'cooking', 'fletching', 'herblore', 'crafting'];
const COMBAT_TRACKS = ['hp', 'maxhit', 'accuracy'];

// How the account actually spends its time, from measured routes: working
// at gathering, at crafting, fighting, and walking (bank trips). Crafting is
// short next to gathering its materials, which this shows. Without
// measurements, the current goal's kind of work takes all the time.
export function timeShares(data, usage, goal = null) {
  const sums = {gather: 0, craft: 0, combat: 0, walk: 0};
  for (const [key, m] of Object.entries(usage ?? {})) {
    if (!(m?.seconds > 0)) continue;
    const travel = Math.min(m.seconds, Math.max(0, m.travelSeconds ?? 0)), work = m.seconds - travel;
    let kind = null;
    if (key.startsWith('combat:')) kind = 'combat';
    else {
      const job = data?.jobs.find(j => j.id === Number(key.split(':')[1]));
      kind = GATHER_SKILLS.includes(job?.skill) ? 'gather' : CRAFT_SKILLS.includes(job?.skill) ? 'craft' : null;
    }
    if (!kind) continue;
    sums[kind] += work; sums.walk += travel;
  }
  const total = Object.values(sums).reduce((a, b) => a + b, 0);
  if (total > 0) return Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v / total]));
  const kind = goal?.monsterId != null ? 'combat' : GATHER_SKILLS.includes(goal?.skill) ? 'gather' :
    CRAFT_SKILLS.includes(goal?.skill) ? 'craft' : null;
  return {gather: 0, craft: 0, combat: 0, walk: 0, ...(kind ? {[kind]: 1} : {})};
}

// Share of all time one more rank saves. XP shortens every goal; speeds only
// their own part of the time. Combat tracks use the engine's measured gain.
function rankValue(id, rank, shares, combatGain) {
  const step = PER_RANK / (1 + PER_RANK * rank);
  if (id === 'xp') return step;
  if (id === 'gather') return step * shares.gather;
  if (id === 'craft') return step * shares.craft;
  if (id === 'move') return step * shares.walk;
  if (COMBAT_TRACKS.includes(id)) return (combatGain[id] ?? 0) * shares.combat;
  return 0; // Offline time, rare finds and enhancing are not time an online helper saves.
}

// Spend mastery points only on the track with the best time saved per point,
// over all tracks: when that rank is not affordable yet, save for it rather
// than buy a cheaper, weaker one.
export function chooseMastery(api, p, goal, {metric = 'xp', data = null, usage = null, budgetMs = 300, clock = () => performance.now()} = {}) {
  if (typeof api?.masteryEarnedPoints !== 'function' || !Array.isArray(api.masteryTracks) || !p?.skills) return null;
  const tracks = api.masteryTracks.map(t => t.id).filter(id => MASTERY_TRACKS.includes(id) && id !== 'offline');
  const current = Object.fromEntries(MASTERY_TRACKS.map(id => [id, Number.isInteger(p.masteries?.[id]) ? p.masteries[id] : 0]));
  const earned = api.masteryEarnedPoints(p);
  let available = earned - spentPoints(current);
  if (!Number.isFinite(available) || available < Math.min(...tracks.map(id => rankCost(current[id] + 1)))) return null;
  const shares = timeShares(data, usage, goal);
  // Combat tracks: the engine's gain per rank on the goal's monster.
  const combatGain = {};
  if (shares.combat > 0 && goal?.monsterId != null) {
    const began = clock(), activity = {monsterId: goal.monsterId}, ranks = 5;
    const rate = masteries => {
      const r = simulate(api, {...p, masteries}, activity, {hours: .5, seed: 1, maxMs: 100, clock});
      return r && !r.failed && r.seconds > 0 ? (metric === 'coins' ? r.coins : r.xp) / r.seconds : null;
    };
    const base = rate(current);
    for (const id of COMBAT_TRACKS.filter(id => tracks.includes(id))) {
      if (!(base > 0) || clock() - began > budgetMs) break;
      const after = rate({...current, [id]: current[id] + ranks});
      combatGain[id] = after > base ? (1 - base / after) / ranks : 0;
    }
  }
  const ranks = {...current}, bought = {};
  let saving = null;
  for (let step = 0; step < 2000; step++) {
    const best = tracks.filter(id => ranks[id] < MASTERY_RANK_LIMIT)
      .map(id => ({id, cost: rankCost(ranks[id] + 1), value: rankValue(id, ranks[id], shares, combatGain)}))
      .filter(t => t.value > 0).sort((a, b) => b.value / b.cost - a.value / a.cost)[0];
    if (!best) break;
    if (best.cost > available) { saving = best; break; }
    ranks[best.id]++; available -= best.cost; bought[best.id] = (bought[best.id] ?? 0) + 1;
  }
  const name = id => MASTERY_NAMES_ZH[id] ?? api.masteryTracks.find(t => t.id === id)?.name ?? id;
  const split = `时间占比：采集 ${Math.round(shares.gather * 100)}%、制作 ${Math.round(shares.craft * 100)}%、` +
    `战斗 ${Math.round(shares.combat * 100)}%、走路 ${Math.round(shares.walk * 100)}%`;
  if (!Object.keys(bought).length)
    return saving ? {intent: null, saving: {id: saving.id, need: saving.cost},
      reason: `精通点数攒给 ${name(saving.id)}（下一级需 ${saving.cost} 点，现有 ${Math.floor(available)}）；${split}`} : null;
  const changes = Object.entries(bought).map(([id, n]) => `${name(id)} +${n}`).join('、');
  return {intent: {t: 'masteryConfirm', ranks: Object.fromEntries(Object.entries(ranks).filter(([, n]) => n > 0))},
    label: `分配精通点数 · ${changes}`,
    reason: `按实际时间占比，选每点省时最多的精通（${split}）` +
      `${saving ? `；剩余 ${Math.floor(available)} 点攒给 ${name(saving.id)}（需 ${saving.cost}）` : ''}`};
}
