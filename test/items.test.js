import test from 'node:test';
import assert from 'node:assert/strict';
import {baseId, foodCarry, itemLabel, merchantPrice, minListPrice, nearBank, netProceeds, packCapacity, packQty,
  packUsed, plusOf, qualityIds, rarityOf, stockQty, tradableBase} from '../src/planner/items.js';
import {canWear, gearRequirementOf, statsDominate} from '../src/planner/professions.js';
import {data} from './helpers.js';

const d = data();

test('item id arithmetic and labels', () => {
  const steel = d.gear.find(g => d.items[g.itemId].name === 'Steel blade').itemId;
  const id = steel + 3 * d.rarityScale + 2 * d.plusScale;
  assert.equal(baseId(d, id), steel);
  assert.equal(rarityOf(d, id), 3);
  assert.equal(plusOf(d, id), 2);
  assert.equal(itemLabel(d, id), '史诗 Steel blade +2');
  assert.equal(itemLabel(d, steel), 'Steel blade');
  assert.deepEqual(qualityIds(d, id), [0, 1, 2, 3, 4].map(r => steel + r * d.rarityScale));
});

test('stock, pack space and food carried', () => {
  const p = {bank: {7: 5}, overflow: {7: 2}, pack: [{itemId: 7, qty: 3}, {itemId: 7, qty: 1}], perks: {pockets: 2}};
  assert.equal(packQty(p, 7), 4);
  assert.equal(stockQty(p, 7), 11, 'bank, overflow and pack');
  assert.equal(packCapacity(p), 30);
  assert.equal(packCapacity({}), 28);
  assert.equal(packUsed(d, p), 4);
  assert.equal(foodCarry({foodPerTrip: -1}, 30), 30);
  assert.equal(foodCarry({foodPerTrip: -2}, 30), 29);
  assert.equal(foodCarry({}, 30), 20);
  assert.equal(nearBank(d, {x: d.banks[0].x + 1, y: d.banks[0].y}), true);
});

test('prices: merchant, tax and listing minimum', () => {
  const ore = d.jobs.find(j => j.skill === 'mining' && !j.inputs.length).output.itemId;
  assert.equal(merchantPrice(d, ore), Math.max(1, Math.floor(d.items[ore].value * .4)));
  assert.equal(merchantPrice(d, ore + d.rarityScale), merchantPrice(d, ore), 'priced on the base item');
  assert.equal(netProceeds(100, 10, 200), 980);
  assert.ok(netProceeds(minListPrice(99, 200), 1, 200) > 99, 'the minimum clears the floor after tax');
  assert.equal(tradableBase(d, d.coinId), false);
  assert.equal(tradableBase(d, ore), true);
});

test('wear requirements and stat dominance', () => {
  const amulet = d.gear.find(g => g.slot === 'amulet');
  assert.equal(gearRequirementOf(d, amulet.itemId).skill, 'none');
  assert.equal(canWear(d, {}, amulet.itemId), true, 'no skill needed');
  const blade = d.gear.find(g => g.slot === 'weapon' && g.needs === 'melee' && g.levelReq > 1);
  assert.equal(canWear(d, {melee: blade.levelReq - 1}, blade.itemId), false);
  assert.equal(canWear(d, {melee: blade.levelReq}, blade.itemId), true);
  assert.equal(gearRequirementOf(d, 1), null, 'not gear');
  assert.equal(statsDominate({accuracy: 5, strength: 3}, {accuracy: 4, strength: 3}), true);
  assert.equal(statsDominate({accuracy: 5, speed: 5}, {accuracy: 4, speed: 4}), false, 'slower is not dominant');
  assert.equal(statsDominate({accuracy: 4}, {accuracy: 4}), false, 'equal is not dominant');
});
