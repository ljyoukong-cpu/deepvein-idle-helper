import test from 'node:test';
import assert from 'node:assert/strict';
import {qualityWorth} from '../src/planner/quality.js';
import {inventoryBudget} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

test('a rare cut gem is not spent on a low ring worth less than the gem', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const ring = d.jobs.find(j => j.name === 'Silver ring');
  const [silver, gem] = ring.inputs.map(i => i.itemId), out = ring.output.itemId;
  planner.coinRate = () => 10;
  const prices = {[silver]: 100, [gem]: 500, [out]: 300, [silver + 2 * R]: 300, [gem + 2 * R]: 50000, [out + 2 * R]: 5000};
  planner.marketUnitValue = (_p, id) => prices[id] ?? 0;
  const p = player(planner, {levels: {crafting: 30}});
  const verdict = qualityWorth(d, planner, p, ring, 2);
  assert.equal(verdict.ok, false, JSON.stringify(verdict));
  prices[out + 2 * R] = 80000;
  assert.equal(qualityWorth(d, planner, p, ring, 2).ok, true, 'a rare ring worth more than its gem is made');
  assert.equal(qualityWorth(d, planner, p, ring, 0).ok, true, 'common is always fine');
});

test('rare materials kept for planned gear are in the budget every disposal reads', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const id = n => Object.values(d.items).find(i => i.name === n).id;
  const p = player(planner, {levels: {smithing: 70, mining: 70, melee: 70, defence: 60, hitpoints: 60},
    bank: {[id('Cobalt') + R]: 40, [id('Cobalt')]: 500, [id('Coal')]: 2000}});
  planner.styleHint = 'melee';
  const hold = planner.qualityHold(p, 'melee');
  assert.ok(hold[id('Cobalt') + R] > 0, JSON.stringify(hold));
  assert.ok(inventoryBudget(d, planner, p).items[id('Cobalt') + R] >= hold[id('Cobalt') + R]);
});
