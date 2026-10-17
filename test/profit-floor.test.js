import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

function setup(floor) {
  const planner = makePlanner();
  planner.profitFloor = floor;
  planner.watchMarket = () => {};
  const p = player(planner, {levels: {mining: 20, fishing: 20, woodcutting: 20, thieving: 20, melee: 20, hitpoints: 20, defence: 20},
    coins: 0, hp: 200, activity: 'idle', path: null, held: false});
  return {planner, p};
}

test('experience mode without a floor maximises XP', () => {
  const {planner, p} = setup(0);
  const goal = planner.selectGoal(p, {}, {}, 'melee', 'experience');
  const all = planner.candidates(p, 'melee', {});
  assert.equal(goal.rate.xp, Math.max(...all.map(c => c.rate.xp)));
});

test('a profit floor keeps only tasks that earn enough, then maximises XP', () => {
  const {planner, p} = setup(1);
  const earners = planner.incomeChoices(p, planner.candidates(p, 'melee', {}), 'melee');
  assert.ok(earners.length > 0, 'some task earns gold (thieving or combat)');
  const floor = Math.floor(Math.min(...earners.map(c => c.rate.coins * 3600)));
  planner.profitFloor = floor;
  const goal = planner.selectGoal(p, {}, {}, 'melee', 'experience');
  assert.ok(goal.rate.coins * 3600 >= floor, `earns ${goal.rate.coins * 3600}/h >= ${floor}`);
  const eligible = earners.filter(c => c.rate.coins * 3600 >= floor);
  assert.equal(goal.rate.xp, Math.max(...eligible.map(c => c.rate.xp)));
  assert.match(goal.reason, /金币\/小时/);
});

test('an unreachable floor falls back to the best earner', () => {
  const {planner, p} = setup(1e9);
  const goal = planner.selectGoal(p, {}, {}, 'melee', 'experience');
  const earners = planner.incomeChoices(p, planner.candidates(p, 'melee', {}), 'melee');
  assert.equal(goal.rate.coins, Math.max(...earners.map(c => c.rate.coins)));
  assert.match(goal.reason, /改做收益最高/);
});
