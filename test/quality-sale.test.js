import test from 'node:test';
import assert from 'node:assert/strict';
import {marketQuality} from '../src/planner/quality.js';
import {reviewInventory, saleProtectionReason} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

test('rare processed surplus is sold on the market only; rare raw materials, potions and legendary are kept', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const id = n => Object.values(d.items).find(i => i.name === n).id;
  const bar = id('Bronze bar'), ore = id('Copper'), potion = id('Swift draught');
  assert.equal(marketQuality(d, bar + R), true, 'an uncommon bar is processed');
  assert.equal(marketQuality(d, ore + R), false, 'raw ore is never sold');
  assert.equal(marketQuality(d, potion + R), false, 'potions follow their own rule');
  assert.equal(marketQuality(d, bar + 4 * R), false, 'legendary stays with the player');
  assert.equal(marketQuality(d, bar), false, 'common output follows the everyday rules');
  assert.equal(saleProtectionReason(d, bar + R, true), null);
  assert.ok(saleProtectionReason(d, ore + R, true));
  planner.styleHint = 'melee';
  const p = player(planner, {levels: {smithing: 10}, bank: {[bar + R]: 30, [ore + R]: 30}});
  const rows = reviewInventory(d, planner, p).items;
  const barRow = rows.find(r => r.itemId === bar + R), oreRow = rows.find(r => r.itemId === ore + R);
  assert.equal(barRow.marketOnly, true);
  const held = planner.qualityHold(p, 'melee')[bar + R] ?? 0;
  assert.ok(barRow.sell > 0);
  assert.equal(barRow.sell, 30 - held, 'only what planned gear does not need');
  assert.equal(oreRow.sell, 0);
});
