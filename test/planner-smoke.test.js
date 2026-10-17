import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

// End-to-end planner calls on a fresh character: gear evaluation, supply and
// route planning must produce an action or a reason, never throw.
for (const [label, goal, style] of [
  ['mining goal', {skill: 'mining', target: 10, horizon: 1800}, 'melee'],
  ['combat goal', {skill: 'melee', target: 10, horizon: 1800}, 'melee'],
  ['smithing goal', {skill: 'smithing', target: 5, horizon: 1800}, 'magic'],
]) test(`planner.plan handles a ${label}`, () => {
  const planner = makePlanner();
  const p = player(planner, {levels: {mining: 5, melee: 5, hitpoints: 10, defence: 5, smithing: 1}, coins: 500,
    hp: 100, activity: 'idle', path: null, held: false});
  const result = planner.plan(p, {...goal, budget: {coins: 0, items: {}}}, style);
  assert.ok(result && (result.intent || result.reason || result.label), JSON.stringify(result)?.slice(0, 200));
});
