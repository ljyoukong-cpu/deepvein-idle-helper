import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';
import {masteryCandidates} from '../src/planner/collection.js';

const IRON = 3, IRON_BAR = 41, COPPER = 1, ROUGH_GEM = 100;
const idOf = (d, n) => Object.values(d.items).find(i => i.name === n).id;

function setup(collections, extra = {}) {
  const planner = makePlanner(), d = planner.data;
  planner.watchMarket = () => {};
  const p = player(planner, {hp: 100, activity: 'idle', path: null, collections, ...extra});
  return {planner, d, p, R: d.rarityScale};
}

test('candidates follow the native order: furthest into the tier first, rewards break ties', () => {
  const {d, p, R} = setup({});
  // Iron 9/10 (89%), Copper 50/100 (44%), uncommon iron bar 4/10 (33%),
  // common iron bar 2/10 (11%: under the native 12% cut).
  p.collections = {[IRON]: 9, [COPPER]: 50, [IRON_BAR + R]: 4, [IRON_BAR]: 2};
  const list = masteryCandidates(d, p);
  assert.deepEqual(list.map(c => c.itemId), [IRON, COPPER, IRON_BAR + R]);
  assert.equal(list[0].target, 10);
  assert.equal(list[2].rarity, 1);
  // Same progress: the larger reward (higher quality) comes first.
  p.collections = {[IRON]: 5, [IRON + R]: 5};
  assert.deepEqual(masteryCandidates(d, p).map(c => c.itemId), [IRON + R, IRON]);
});

test('legendary qualities and planted crops are skipped; seeds are not', () => {
  const {d, p, R} = setup({});
  const crop = d.jobs.find(j => j.grow).output.itemId, seed = idOf(d, 'Potato seed');
  p.collections = {[IRON + 4 * R]: 5, [crop]: 5, [seed]: 5};
  assert.deepEqual(masteryCandidates(d, p).map(c => c.itemId), [seed]);
});

test('a round keeps its first six in order across refreshes and moves on when a tier is reached', () => {
  const {planner, p} = setup({[IRON]: 9, [COPPER]: 50});
  const first = planner.masteryChooseGoal(p, 'melee');
  assert.equal(first.mastery.itemId, IRON);
  // A reload restores the same queue even when progress would reorder it.
  const saved = JSON.parse(JSON.stringify(planner.masteryRuntime()));
  p.collections[COPPER] = 99;
  planner.resetMastery();planner.masteryRuntime(saved);
  assert.equal(planner.masteryChooseGoal(p, 'melee').mastery.itemId, IRON);
  p.collections[IRON] = 10;
  assert.ok(planner.masteryCompleted(p, first));
  assert.equal(planner.masteryChooseGoal(p, 'melee').mastery.itemId, COPPER);
  assert.match(planner.masteryStatus(p), /Copper/);
});

test('an uncommon bar waits on gathering for uncommon ore instead of using common ore', () => {
  const {planner, d, p, R} = setup({});
  Object.assign(p, player(planner, {levels: {mining: 20, smithing: 20}, hp: 100, activity: 'idle', path: null,
    bank: {[IRON]: 500, [IRON + R]: 1}, collections: {[IRON_BAR + R]: 4}}));
  const goal = planner.masteryChooseGoal(p, 'melee');
  assert.equal(goal.mastery.itemId, IRON_BAR + R);
  const plan = planner.plan(p, goal, 'melee');
  const job = d.jobs.find(j => j.id === plan.intent?.jobId);
  assert.equal(job?.output.itemId, IRON, JSON.stringify(plan.intent ?? plan.reason));
  assert.match(plan.reason, /等待同品质产出/);
  // With the uncommon ore in stock, the uncommon recipe runs for the remaining six.
  p.bank[IRON + R] = 6;
  const craft = planner.plan(p, planner.masteryChooseGoal(p, 'melee'), 'melee');
  assert.equal(d.jobs.find(j => j.id === craft.intent?.jobId)?.output.itemId, IRON_BAR, JSON.stringify(craft.intent ?? craft.reason));
  assert.equal(craft.intent.rarity, 1);
  assert.equal(craft.intent.limit, 6);
});

test('rough gems compare every unlocked source: the gem stall beats iron once thieving opens it', () => {
  const mine = setup({}), stall = setup({});
  for (const [s, thieving] of [[mine, 1], [stall, 60]])
    Object.assign(s.p, player(s.planner, {levels: {mining: 20, thieving}, hp: 100, activity: 'idle', path: null,
      collections: {[ROUGH_GEM]: 7}}));
  const pick = s => s.d.jobs.find(j => j.id === s.planner.plan(s.p, s.planner.masteryChooseGoal(s.p, 'melee'), 'melee').intent?.jobId);
  assert.equal(pick(mine)?.name, 'Iron');
  assert.equal(pick(stall)?.name, 'Gem stall');
});
