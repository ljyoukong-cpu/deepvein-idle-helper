import test from 'node:test';
import assert from 'node:assert/strict';
import {workEstimate} from '../src/planner/estimates.js';
import {reviewInventory, saleProtectionReason} from '../src/planner/inventory.js';
import {mergeRates} from '../src/engine/runtime.js';
import {makePlanner, player} from './helpers.js';

const meteoric = d => d.jobs.find(j => j.skill === 'mining' && j.levelReq === 85);

test('a measured quality factor scales every quality threshold', () => {
  const planner = makePlanner(), d = planner.data, job = meteoric(d), c = d.rarityChance;
  const base = workEstimate(d, job, 99, {luck: 0});
  const lucky = workEstimate(d, job, 99, {luck: 0, rarityFactor: 10});
  const per = n => n / lucky.output;
  assert.ok(Math.abs(per(lucky.tierOutput[1]) - 10 * (c.uncommon - c.rare)) < 1e-9);
  assert.ok(Math.abs(per(lucky.tierOutput[4]) - 10 * c.legendary) < 1e-12);
  assert.ok(lucky.tierOutput[1] > 9 * base.tierOutput[1]);
  assert.ok(Math.abs(lucky.bonusOutput - lucky.success * job.bonus.chance) < 1e-12, 'bonus drop per action');
});

test('gathering gold/h counts every quality and the bonus drop at market value; nothing of it is sold', () => {
  const planner = makePlanner(), d = planner.data, job = meteoric(d), R = d.rarityScale, ore = job.output.itemId;
  const prices = {[ore + R]: 360, [ore + 2 * R]: 2500, [ore + 3 * R]: 70000, [ore + 4 * R]: 12_400_000, [job.bonus.itemId]: 5000};
  planner.marketUnitValue = (_p, id) => prices[id] ?? 0;
  planner.marketOpportunity = () => null;
  const p = player(planner, {levels: {mining: 99}});
  const perAction = [0.2, 0.02, 0.001, 0.0001];
  const candidate = {skill: 'mining', recipeId: job.id, output: {itemId: ore, qty: 1000}, actions: 10000,
    qualityPerAction: perAction, bonusPerAction: {itemId: job.bonus.itemId, qty: 0.005},
    estimate: {coins: 0, seconds: 3600}, rate: {xp: 1, coins: 0}};
  const [choice] = planner.incomeChoices(p, [candidate], 'melee');
  const expected = 10000 * (0.2 * 360 + 0.02 * 2500 + 0.001 * 70000 + 0.0001 * 12_400_000 + 0.005 * 5000);
  assert.ok(Math.abs(choice.marketProceeds - expected) < 1e-6, `${choice.marketProceeds} vs ${expected}`);
  assert.deepEqual(choice.saleItems, [], 'quality output and gems are valued, not sold');
});

test('legendary ore is valued but kept', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale, ore = meteoric(d).output.itemId;
  assert.ok(saleProtectionReason(d, ore + 4 * R));
  const p = player(planner, {levels: {mining: 99}, bank: {[ore + 4 * R]: 2}});
  assert.equal(reviewInventory(d, planner, p).items.find(i => i.itemId === ore + 4 * R).sell, 0);
});

test('a real measurement keeps the simulated quality factor for the same gear', () => {
  const sim = {'job:1': {samples: 3, seconds: 3600, travelSeconds: 0, equipmentKey: 'g', buffKey: 'b', rarityFactor: 9.8, simulated: true}};
  const real = {'job:1': {samples: 5, seconds: 3600, travelSeconds: 0, equipmentKey: 'g', buffKey: 'b', xp: 100}};
  assert.equal(mergeRates(sim, real)['job:1'].rarityFactor, 9.8);
  assert.equal(mergeRates(sim, {'job:1': {...real['job:1'], equipmentKey: 'other'}})['job:1'].rarityFactor, undefined);
});
