import test from 'node:test';
import assert from 'node:assert/strict';
import {potionSaleWorth} from '../src/planner/quality.js';
import {reviewInventory} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

const SWIFT = 225;

test('with only uncommon Sage and Husk chitin held, the uncommon swift draught is brewed', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  planner.coinRate = () => 100;
  const recipe = d.jobs.find(j => j.output.itemId === SWIFT);
  const ore = d.jobs.find(j => j.skill === 'mining' && j.levelReq === 1);
  const site = d.sites.find(s => s.jobIds.includes(ore.id));
  const bank = Object.fromEntries(recipe.inputs.map(i => [i.itemId + R, 6]));
  const p = player(planner, {levels: {herblore: 53, mining: 50}, x: d.banks[0].x, y: d.banks[0].y, bank, path: null, activity: 'idle'});
  const plan = {intent: {t: 'setRoute', siteId: site.id, jobId: ore.id, onFull: 'bank', limit: 100}, label: '采矿', reason: ''};
  const result = planner.consumable(p, null, 'melee', plan);
  assert.equal(result?.intent?.jobId, recipe.id, JSON.stringify(result));
  assert.equal(result.intent.rarity, 1);
  assert.equal(result.intent.limit, 6);
});

test('a rare potion whose bid is far above the same effect\'s cheapest price is sold; drink the cheap one', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const asks = {[SWIFT]: 1980, [SWIFT + R]: 21500};
  let bid = 7600;
  planner.marketAsk = (_p, id) => asks[id] ?? null;
  planner.marketUnitValue = (_p, id) => id === SWIFT + R ? bid : 0;
  const p = player(planner, {bank: {[SWIFT + R]: 4}});
  assert.equal(potionSaleWorth(d, planner, p, SWIFT + R), true, '7,600 >= 2 x 1,980 x 1.3');
  planner.styleHint = 'melee';
  const row = reviewInventory(d, planner, p).items.find(r => r.itemId === SWIFT + R);
  assert.equal(row.marketOnly, true);
  assert.equal(row.sell, 4);
  bid = 4000;
  assert.equal(potionSaleWorth(d, planner, p, SWIFT + R), false, 'not far enough above: keep it');
  assert.equal(potionSaleWorth(d, planner, p, SWIFT), false, 'common potions are drunk, not sold');
});
