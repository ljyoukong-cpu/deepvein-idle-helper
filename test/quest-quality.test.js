import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

// The Nourishing draught quest with only uncommon Nightshade and uncommon
// Wraith dust held: quest progress counts any quality, so it uses them.
function herbalist(bank) {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  planner.watchMarket = () => {};
  const id = n => Object.values(d.items).find(i => i.name === n).id;
  const night = id('Nightshade'), dust = id('Wraith dust');
  const draught = d.jobs.find(j => j.skill === 'herblore' && j.name === 'Nourishing draught');
  const site = d.sites.find(s => s.jobIds.includes(draught.id));
  const p = player(planner, {levels: {herblore: 53, farming: 60}, lastTick: 1000, x: site.x, y: site.y, hp: 100, activity: 'idle',
    path: null, route: null, bank: bank({night, dust, R}),
    quests: {day: 0, week: 0, weekly: [], daily: [{id: 'q1', kind: 'craft', jobId: draught.id, goal: 15, done: 0, claimed: false,
      reward: {skill: 'herblore', xp: 1000, coins: 1000}}]}});
  return {planner, d, p, draught, R};
}

test('a craft quest uses held matched quality sets when the common recipe cannot be made', () => {
  const {planner, p, draught} = herbalist(({night, dust, R}) => ({[night + R]: 20, [dust + R]: 20, [dust]: 200}));
  const goal = planner.questChooseGoal(p, null, 'melee', {});
  assert.ok(goal, 'the quest is feasible from the held uncommon sets');
  const plan = planner.plan(p, goal, 'melee');
  assert.equal(plan.intent?.jobId, draught.id, JSON.stringify(plan.intent ?? plan.reason));
  assert.equal(plan.intent.rarity, 1, 'uncommon draughts');
});

test('with common inputs in stock the quest uses commons and keeps the rare materials', () => {
  const {planner, p, draught} = herbalist(({night, dust, R}) => ({[night + R]: 20, [dust + R]: 20, [night]: 30, [dust]: 200}));
  const goal = planner.questChooseGoal(p, null, 'melee', {});
  const plan = planner.plan(p, goal, 'melee');
  assert.equal(plan.intent?.jobId, draught.id);
  assert.equal(plan.intent.rarity ?? 0, 0);
});
