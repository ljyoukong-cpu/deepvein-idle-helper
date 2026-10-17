import test from 'node:test';
import assert from 'node:assert/strict';
import {onPriceStep, priceDown, priceStep, priceUp, stepBelow} from '../src/economy/market.js';
import {validateIntent} from '../src/runtime/intents.js';
import {data} from './helpers.js';

test('price steps follow the client grid', () => {
  assert.equal(priceStep(99), 1);
  assert.equal(priceStep(100), 2);
  assert.equal(priceStep(1000), 20);
  assert.equal(priceStep(25000), 500);
  assert.equal(priceStep(78999), 1000);
  assert.equal(onPriceStep(78999), false, 'the rejected listing');
  assert.equal(onPriceStep(79000), true);
  assert.equal(priceDown(78999), 78000);
  assert.equal(priceUp(78999), 79000);
  assert.equal(stepBelow(79000), 78000, 'undercut by one step');
  assert.equal(stepBelow(100), 99);
  assert.equal(stepBelow(2000), 1980);
  assert.equal(priceUp(1999), 2000);
  for (let p = 1; p < 200000; p += 37) {
    assert.ok(onPriceStep(priceDown(p)) && priceDown(p) <= p, `down ${p}`);
    assert.ok(onPriceStep(priceUp(p)) && priceUp(p) >= p, `up ${p}`);
    assert.ok(onPriceStep(stepBelow(p)) && (p === 1 || stepBelow(p) < p), `below ${p}`);
  }
});

test('an off-grid market order is never sent', () => {
  const d = data(), p = {bank: {}, pack: [], skills: {}};
  const item = Object.values(d.items).find(i => i.value > 0).id;
  assert.equal(validateIntent(d, p, {t: 'marketBuy', itemId: item, qty: 1, price: 78999}), false);
  assert.equal(validateIntent(d, p, {t: 'marketBuy', itemId: item, qty: 1, price: 79000}), true);
});
