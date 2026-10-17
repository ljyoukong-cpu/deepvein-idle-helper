import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseFallback, fallbackKey, fallbackOwnership} from '../src/planner/fallback.js';
import {Trainer, acknowledged} from '../src/runtime/trainer.js';
import {validateIntent} from '../src/runtime/intents.js';
import {makePlanner, player} from './helpers.js';

const gather = (d, skill) => d.jobs.find(j => j.skill === skill && j.levelReq === 1 && !j.inputs.length);

test('the fallback feeds the plan: smelting needs ore, so mine it', () => {
  const planner = makePlanner(), d = planner.data;
  const smelt = d.jobs.find(j => j.skill === 'smithing' && j.levelReq === 1 && j.inputs.length);
  const ore = smelt.inputs[0].itemId;
  const p = player(planner, {levels: {smithing: 10, mining: 10, fishing: 30, woodcutting: 30}});
  const choice = chooseFallback(d, planner, p, {skill: 'smithing', recipeId: smelt.id, target: 11, budget: {items: {}, coins: 0}}, 'melee');
  assert.equal(choice.job.output.itemId, ore, choice.reason);
  assert.equal(choice.task.kind, 'job');
  assert.ok(d.sites.find(s => s.id === choice.task.siteId).jobIds.includes(choice.job.id));
  assert.match(choice.reason, /供应当前计划/);
});

test('with nothing to feed, the best-experience gathering job is chosen', () => {
  const planner = makePlanner(), d = planner.data;
  const p = player(planner, {levels: {mining: 40, fishing: 1, woodcutting: 1}});
  const choice = chooseFallback(d, planner, p, null, 'melee');
  assert.equal(choice.job.skill, 'mining');
  assert.ok(choice.job.levelReq <= 40);
  assert.match(choice.reason, /经验最高/);
});

test('ownership: none, the helper\'s, the player\'s, or cleared by the player', () => {
  const task = {kind: 'job', siteId: 1, jobId: 1, onFull: 'bank', rarity: 0};
  assert.equal(fallbackOwnership({id: 7}, {}), 'none');
  assert.equal(fallbackOwnership({id: 7, fallback: null}, {}), 'none');
  assert.equal(fallbackOwnership({id: 7, fallback: {task}}, {7: fallbackKey(task)}), 'helper');
  assert.equal(fallbackOwnership({id: 7, fallback: {task: {...task, jobId: 2}}}, {7: fallbackKey(task)}), 'player');
  assert.equal(fallbackOwnership({id: 7, fallback: {task}}, {}), 'player');
  assert.equal(fallbackOwnership({id: 7, fallback: null}, {7: fallbackKey(task)}), 'cleared');
});

function trainer(planner, now = 1e9) {
  const t = new Trainer(planner.data, planner, () => {}, () => now);
  t.mode = 'balanced'; t.style = 'melee';
  return t;
}

test('upkeep sets a fallback when none is set, and leaves the player\'s alone', () => {
  const planner = makePlanner(), d = planner.data;
  const p = player(planner, {levels: {mining: 20}});
  const t = trainer(planner);
  const plan = t.fallbackUpkeep({...p, id: 7});
  assert.equal(plan.intent.t, 'setFallback');
  assert.equal(plan.intent.fallback.onStorageFull, false);
  assert.equal(validateIntent(d, p, plan.intent, {planner}), true);
  assert.equal(t.fallbackUpkeep({...p, id: 7}), null, 'checked at most every ten minutes');
  const own = {kind: 'job', siteId: d.sites.find(s => s.jobIds.includes(gather(d, 'fishing').id)).id,
    jobId: gather(d, 'fishing').id, onFull: 'bank', rarity: 0};
  assert.equal(trainer(planner).fallbackUpkeep({...p, id: 7, fallback: {task: own, onStorageFull: false}}), null, 'player\'s own');
  const cleared = trainer(planner); cleared.fallbackOwned = {7: fallbackKey(own)};
  assert.equal(cleared.fallbackUpkeep({...p, id: 7, fallback: null}), null, 'player cleared ours');
  const off = trainer(planner); off.autoFallback = false;
  assert.equal(off.fallbackUpkeep({...p, id: 7}), null);
  const assist = trainer(planner); assist.mode = 'assist';
  assert.equal(assist.fallbackUpkeep({...p, id: 7}), null);
});

test('the helper replaces its own fallback when a better choice appears', () => {
  const planner = makePlanner(), d = planner.data;
  const p = player(planner, {levels: {mining: 20}});
  const fish = gather(d, 'fishing');
  const old = {kind: 'job', siteId: d.sites.find(s => s.jobIds.includes(fish.id)).id, jobId: fish.id, onFull: 'bank', rarity: 0};
  const t = trainer(planner); t.fallbackOwned = {7: fallbackKey(old)};
  const plan = t.fallbackUpkeep({...p, id: 7, fallback: {task: old, onStorageFull: false}});
  assert.equal(d.jobs.find(j => j.id === plan.intent.fallback.task.jobId).skill, 'mining');
});

test('setFallback validation and confirmation', () => {
  const planner = makePlanner(), d = planner.data;
  const p = player(planner, {levels: {mining: 1}});
  const copper = gather(d, 'mining'), site = d.sites.find(s => s.jobIds.includes(copper.id));
  const task = {kind: 'job', siteId: site.id, jobId: copper.id, onFull: 'bank', rarity: 0};
  const ok = {t: 'setFallback', fallback: {task, onStorageFull: false}};
  assert.equal(validateIntent(d, p, ok, {planner}), true);
  assert.equal(validateIntent(d, p, {t: 'setFallback', fallback: null}, {planner}), false, 'never clears');
  assert.equal(validateIntent(d, p, {...ok, fallback: {task, onStorageFull: true}}, {planner}), false);
  const smelt = d.jobs.find(j => j.skill === 'smithing' && j.inputs.length);
  assert.equal(validateIntent(d, p, {...ok, fallback: {task: {...task, jobId: smelt.id}, onStorageFull: false}}, {planner}), false);
  const high = d.jobs.filter(j => j.skill === 'mining' && !j.inputs.length).sort((a, b) => b.levelReq - a.levelReq)[0];
  const highSite = d.sites.find(s => s.jobIds.includes(high.id));
  assert.equal(validateIntent(d, p, {...ok, fallback: {task: {...task, jobId: high.id, siteId: highSite.id}, onStorageFull: false}}, {planner}), false, 'level too low');
  assert.equal(acknowledged({}, {fallback: {task: {...task}, onStorageFull: false}}, ok), true);
  assert.equal(acknowledged({}, {fallback: null}, ok), false);
});
