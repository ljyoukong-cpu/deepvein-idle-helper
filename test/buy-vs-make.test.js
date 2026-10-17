import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

// The user's case: a Fletching daily for a Cobalt rod needs Yew logs
// (Woodcutting 60) while Woodcutting is level 1. Buying the logs for a few
// hundred coins must beat unlocking Woodcutting 60.
test('cheap market logs beat unlocking Woodcutting for a rod quest', () => {
  const planner = makePlanner(), d = planner.data;
  const rod = d.jobs.find(j => d.items[j.output.itemId]?.name === 'Cobalt rod');
  const logs = rod.inputs.find(i => d.items[i.itemId].name === 'Yew logs').itemId;
  const bar = rod.inputs.find(i => i.itemId !== logs).itemId;
  const coinRate = 2; // a weak character: 2 coins per second
  planner.coinRate = () => coinRate;
  planner.marketAllowance = () => 1e6;
  // Market sells the logs for 300 each; nothing else is quoted.
  planner.marketUnitCost = (p, id) => id === logs ? 300 / coinRate : Infinity;
  const p = player(planner, {levels: {fletching: 60, smithing: 60, woodcutting: 1, mining: 60}, coins: 100000,
    bank: {[bar]: 20}});
  const withMarket = planner.routeEstimate(p, rod, 15, {style: 'melee', buyInputs: true});
  const selfOnly = planner.routeEstimate(p, rod, 15, {style: 'melee', buyInputs: false});
  assert.equal(withMarket.purchases[logs], 15, 'buys all 15 logs');
  assert.ok(!withMarket.unlocks?.some(u => u.skill === 'woodcutting'), 'no Woodcutting unlock');
  assert.ok(selfOnly.unlocks?.some(u => u.skill === 'woodcutting'), 'self-supply would need the unlock');
  assert.ok(withMarket.seconds < selfOnly.seconds / 10, `${withMarket.seconds}s vs ${selfOnly.seconds}s`);
});
