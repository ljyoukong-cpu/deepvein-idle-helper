import test from 'node:test';
import assert from 'node:assert/strict';
import {farmingStocks} from '../src/planner/farming.js';
import {makePlanner, player} from './helpers.js';
import {Trainer} from '../src/runtime/trainer.js';

test('a refused sowing-order switch gives way to the planting errand', () => {
  const planner = makePlanner();
  const t = new Trainer(planner.data, planner, () => {}, () => 1e9);
  t.player = player(planner, {});
  const errand = {intent: {t: 'setRoute', siteId: 1, jobId: 1, onFull: 'bank', limit: 0, errand: true}, label: '收获并补种'};
  const plan = {intent: {t: 'plantPref', plainest: true}, label: '种植改为先用普通种子', then: errand};
  assert.equal(t.prepareIssue(plan).intent.t, 'plantPref');
  t.softRefused.plantPref = 1e9 + 1000;
  assert.equal(t.prepareIssue(plan).intent.t, 'setRoute');
});

function herbalist(bank, extra = {}) {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const id = n => Object.values(d.items).find(i => i.name === n).id;
  const nightshade = id('Nightshade'), dust = id('Wraith dust');
  const top = Math.max(...d.farmUnlocks);
  const p = player(planner, {levels: {farming: Math.max(top, 70), herblore: 50}, lastTick: 1000, hp: 100, activity: 'idle', path: null,
    houseCells: [], house: {}, bank: bank({nightshade, dust, R}), ...extra});
  const row = () => farmingStocks(d, p, planner.levels(p)).find(r => r.job.output.itemId === nightshade);
  return {planner, d, p, R, nightshade, dust, row};
}

test('uncommon nightshade does not cover common wraith dust: common is sown', () => {
  const {row} = herbalist(({nightshade, dust, R}) => ({[nightshade + R]: 300, [dust]: 200}));
  const night = row();
  assert.equal(night.tier, 1, 'the brewing need is short even with 300 uncommon herbs');
  assert.equal(night.sowTier, 0);
  assert.deepEqual(night.herblore.tiers.map(t => [t.t, t.short]), [[0, 200]]);
});

test('rare drops waiting for rare herbs: the rare seed is sown first', () => {
  const {row} = herbalist(({nightshade, dust, R}) => ({[dust + R]: 20, [dust]: 200, [nightshade]: 500}));
  const night = row();
  assert.equal(night.sowTier, 1, 'common is covered; uncommon dust needs uncommon nightshade');
  assert.deepEqual(night.herblore.tiers.find(t => t.t === 1), {t: 1, need: 20, short: 20});
});

test('a field saved to another crop in the game is cleared before the planting errand', () => {
  const {planner, p, nightshade, R, d} = herbalist(({dust}) => ({[dust]: 200}));
  const seed = d.jobs.find(j => j.grow && j.output.itemId === nightshade).inputs[0].itemId;
  const pepper = d.jobs.find(j => j.grow && j.name === 'Ember pepper').inputs[0].itemId;
  const field = d.sites.filter(s => s.kind === 'field').sort((a, b) => a.id - b.id)[1];
  const farmer = {...p, bank: {...p.bank, [seed]: 20}, plantPlainest: true, plotChoice: {[field.id]: pepper}};
  const plan = planner.harvest(farmer, null, null, 'melee', true);
  assert.deepEqual(plan?.intent, {t: 'plotChoice', siteId: field.id, seed: null}, JSON.stringify(plan?.intent));
  assert.equal(plan.then?.intent?.errand, true, 'the planting errand follows');
  const cleared = planner.harvest({...farmer, plotChoice: {}}, null, null, 'melee', true);
  assert.equal(cleared?.intent?.t, 'setRoute');
  void R;
});

test('before planting, the game\'s sowing order is switched to the quality that is short', () => {
  const {planner, p, nightshade, dust, R, d} = herbalist(({nightshade, dust, R}) => ({[dust]: 200}));
  const seed = d.jobs.find(j => j.grow && j.output.itemId === nightshade).inputs[0].itemId;
  const farmer = {...p, bank: {...p.bank, [seed]: 10, [seed + R]: 10, [nightshade + R]: 300}, plantPlainest: false};
  const plan = planner.harvest(farmer, null, null, 'melee', true);
  assert.deepEqual(plan?.intent, {t: 'plantPref', plainest: true}, JSON.stringify(plan));
  assert.equal(plan.then?.intent?.errand, true, 'the planting errand follows');
  assert.match(plan.reason, /普通/);
  const set = planner.harvest({...farmer, plantPlainest: true}, null, null, 'melee', true);
  assert.equal(set?.intent?.t, 'setRoute', 'already set: plant straight away');
  planner.autoSeedQuality = false;
  assert.equal(planner.harvest(farmer, null, null, 'melee', true)?.intent?.t, 'setRoute', 'switched off: the player\'s setting is left alone');
  void dust;
});
