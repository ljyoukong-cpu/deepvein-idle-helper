import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuests} from '../src/planner/quests.js';
import {data} from './helpers.js';

const d = data();
const dayTicks = 86400000 / d.tickMs;
const craftJob = d.jobs.find(j => j.inputs.length && !j.grow && j.levelReq <= 1 && j.skill !== 'farming');

// Planner stub: quests only needs levels, skills, route estimates and the market watch hook.
function stub({seconds = 600, coins = 0, purchases = {}} = {}) {
  const watched = [];
  const planner = {
    levels: () => Object.fromEntries(d.skills.map(s => [s, 50])),
    trainedSkills: () => d.skills.filter(s => !['melee', 'ranged'].includes(s)),
    routeEstimate: () => ({seconds, xp: 100, coins, budget: {coins: 0, items: {}}, recipes: {}, supplyRecipes: {}, purchases}),
    watchPurchases: (p, ids) => watched.push(...ids),
    crafting: {ingredients: id => [`chain-of-${id}`]},
    coinRate: () => 10,
  };
  return {planner, watched};
}
function playerWith(quests, tickInDay = 1000) {
  return {lastTick: tickInDay, perks: {}, quests: {day: 0, week: 0, daily: quests.filter(q => q.id.startsWith('d')), weekly: quests.filter(q => q.id.startsWith('w'))}};
}
const quest = (id, extra = {}) => ({id, kind: 'craft', jobId: craftJob.id, goal: 15, done: 0, claimed: false,
  reward: {skill: craftJob.skill, xp: 50, coins: 20}, ...extra});

test('a long daily is still chosen when it finishes before reset', () => {
  const {planner} = stub({seconds: 2 * 3600});
  const goal = createQuests(d, planner).chooseGoal(playerWith([quest('d0:craft:x')]), {rate: {xp: 999, coins: 999}});
  assert.ok(goal, 'two-hour daily is mandatory, not skipped by the old 20-minute cap');
  assert.equal(goal.mandatory, true);
  assert.ok(goal.horizon >= 2 * 3600, 'horizon leaves room to buy inputs');
});

test('a daily that cannot finish before reset is skipped', () => {
  const {planner} = stub({seconds: 3600});
  const lateTick = dayTicks - Math.floor(600000 / d.tickMs); // 10 minutes left
  assert.equal(createQuests(d, planner).chooseGoal(playerWith([quest('d0:craft:x')], lateTick), null), null);
});

test('dailies and weeklies both ignore the business coin threshold', () => {
  const {planner} = stub({seconds: 300, coins: 0});
  const baseline = {specialization: true, mainSkill: 'mining', rate: {xp: 1e9, coins: 1e9}};
  const q = createQuests(d, planner);
  assert.ok(q.chooseGoal(playerWith([quest('d0:craft:x')]), baseline));
  assert.equal(q.chooseGoal(playerWith([quest('w0:craft:x')]), baseline)?.quest.period, 'weekly');
});

test('daily input chains are put on the market watch list', () => {
  const {planner, watched} = stub();
  createQuests(d, planner).chooseGoal(playerWith([quest('d0:craft:x')]), null);
  assert.ok(watched.includes(`chain-of-${craftJob.output.itemId}`));
});

test('quickest daily goes first', () => {
  let calls = 0;
  const {planner} = stub();
  planner.routeEstimate = () => ({seconds: [3000, 900][calls++ % 2], xp: 1, coins: 0, budget: {coins: 0, items: {}}, recipes: {}, supplyRecipes: {}, purchases: {}});
  const goal = createQuests(d, planner).chooseGoal(playerWith([quest('d0:craft:a'), quest('d0:craft:b')]), null);
  assert.equal(goal.quest.id, 'd0:craft:b');
});
