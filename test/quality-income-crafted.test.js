import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

test('a recipe in a quality the held sets make is a gold candidate, valued at that quality', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  planner.watchMarket = () => {};
  const bar = d.jobs.find(j => j.skill === 'smithing' && j.name === 'Bronze bar');
  const [copper, tin] = bar.inputs.map(i => i.itemId);
  const p = player(planner, {levels: {smithing: 10, mining: 10}, x: d.banks[0].x, y: d.banks[0].y,
    bank: {[copper + R]: 40, [tin + R]: 40}});
  const list = planner.candidates(p, 'melee', {});
  const rare = list.find(c => c.recipeId === bar.id && c.rarity === 1);
  assert.ok(rare, 'an uncommon bronze bar candidate');
  assert.equal(rare.output.itemId, bar.output.itemId + R);
  assert.deepEqual(rare.recipeRarities, {smithing: 1});
  planner.coinRate = () => 1;
  planner.marketUnitValue = (_p, id) => id === bar.output.itemId + R ? 400 : 0;
  const priced = planner.incomeChoices(p, [rare], 'melee')[0];
  assert.ok(priced.marketProceeds >= 400 * Math.min(rare.output.qty, 1), JSON.stringify(priced.marketProceeds));
  assert.deepEqual(priced.saleItems, [bar.output.itemId + R], 'sold as rare processed surplus');
});
