import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuests} from '../src/planner/quests.js';
import {nextPerkCost, perkOverview} from '../src/planner/perks.js';
import {validateIntent} from '../src/runtime/intents.js';
import {acknowledged} from '../src/runtime/trainer.js';
import {data, makePlanner, player} from './helpers.js';

const d = data();
const job = d.jobs.find(j => j.inputs.length && !j.grow && j.levelReq <= 1 && j.skill !== 'farming');
const daily = (id, extra = {}) => ({id, kind: 'craft', jobId: job.id, goal: 15, done: 0, claimed: false,
  reward: {skill: job.skill, xp: 1, coins: 1}, ...extra});
const stub = seconds => ({
  levels: () => Object.fromEntries(d.skills.map(s => [s, 50])),
  trainedSkills: () => d.skills,
  routeEstimate: () => ({seconds, xp: 1, coins: 0, budget: {coins: 0, items: {}}, recipes: {}, supplyRecipes: {}, purchases: {}}),
});
const withQuests = (quests, extra = {}) => ({lastTick: 1000, perks: {}, quests: {day: 0, week: 0, daily: quests, weekly: [], ...extra}});

test('reroll targets an unstarted daily that cannot be done', () => {
  const q = createQuests(d, stub(Infinity));
  const plan = q.reroll(withQuests([daily('d0:a')]));
  assert.deepEqual(plan.intent, {t: 'rerollQuest', id: 'd0:a'});
});

test('no reroll for feasible, started, or already-rerolled days', () => {
  assert.equal(createQuests(d, stub(600)).reroll(withQuests([daily('d0:a')])), null, 'feasible daily is done, not rerolled');
  assert.equal(createQuests(d, stub(Infinity)).reroll(withQuests([daily('d0:a', {done: 1})])), null, 'started daily cannot be rerolled');
  assert.equal(createQuests(d, stub(Infinity)).reroll(withQuests([daily('d0:a')], {rerolled: 0})), null, 'one reroll per day');
});

test('reroll intent validation mirrors the server rule', () => {
  const ok = withQuests([daily('d0:a')]);
  assert.equal(validateIntent(d, ok, {t: 'rerollQuest', id: 'd0:a'}), true);
  assert.equal(validateIntent(d, withQuests([daily('d0:a')], {rerolled: 0}), {t: 'rerollQuest', id: 'd0:a'}), false);
  assert.equal(validateIntent(d, withQuests([daily('d0:a', {done: 2})]), {t: 'rerollQuest', id: 'd0:a'}), false);
  assert.equal(validateIntent(d, ok, {t: 'rerollQuest', id: 'd0:missing'}), false);
});

test('reroll and perk purchases are confirmed from the snapshot', () => {
  const before = withQuests([daily('d0:a')]);
  assert.equal(acknowledged(before, withQuests([daily('d0:r0:b')]), {t: 'rerollQuest', id: 'd0:a'}), true);
  assert.equal(acknowledged(before, before, {t: 'rerollQuest', id: 'd0:a'}), false);
  assert.equal(acknowledged({perks: {quick: 1}}, {perks: {quick: 2}}, {t: 'buyPerk', id: 'quick'}), true);
  assert.equal(acknowledged({perks: {quick: 1}}, {perks: {quick: 1}}, {t: 'buyPerk', id: 'quick'}), false);
});

test('perk costs follow the client formulas and max ranks', () => {
  assert.equal(nextPerkCost({perks: {}}, 'pockets'), 20);
  assert.equal(nextPerkCost({perks: {pockets: 3}}, 'pockets'), 80);
  assert.equal(nextPerkCost({perks: {pockets: 5}}, 'pockets'), null);
  assert.equal(nextPerkCost({perks: {}}, 'quick'), 15);
  assert.equal(validateIntent(d, {perks: {}, questPoints: 14}, {t: 'buyPerk', id: 'quick'}), false);
  assert.equal(validateIntent(d, {perks: {}, questPoints: 15}, {t: 'buyPerk', id: 'quick'}), true);
});

test('quest points are reported, never spent automatically', () => {
  assert.deepEqual(perkOverview({questPoints: 40, perks: {}}), {points: 40});
  assert.equal(perkOverview({perks: {}}), null);
  const planner = makePlanner();
  assert.equal(planner.perkPurchase, undefined);
});

test('a long weekly is taken after dailies, whatever it pays', () => {
  const weekly = {...daily('w0:a'), id: 'w0:a', goal: 240};
  const q = createQuests(d, stub(1300));
  const goal = q.chooseGoal(withQuests([], {weekly: [weekly]}), {rate: {xp: 1e9, coins: 1e9}}, 'melee');
  assert.equal(goal?.quest.period, 'weekly');
  assert.equal(goal.mandatory, true);
  const both = q.chooseGoal(withQuests([daily('d0:a')], {weekly: [weekly]}), null, 'melee');
  assert.equal(both.quest.period, 'daily', 'dailies still come first');
});