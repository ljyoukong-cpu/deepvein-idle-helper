import test from 'node:test';
import assert from 'node:assert/strict';
import {Trainer} from '../src/runtime/trainer.js';
import {makePlanner, player} from './helpers.js';

// After a market error the helper has stopped the route at the bank; the
// game's own fallback does not start after a stop, so the helper must.
function setup(extra = {}) {
  const planner = makePlanner(), d = planner.data, sent = [];
  const t = new Trainer(d, planner, intent => sent.push(intent), () => 5e9);
  t.compatible = true; t.active = true; t.mode = 'balanced'; t.style = 'melee';
  t.player = {...player(planner, {levels: {mining: 20}, route: null, path: null, activity: 'idle', held: false}), id: 1, ...extra};
  return {t, sent, d};
}

test('an error pause starts a gathering job when the character is idle', () => {
  const {t, sent, d} = setup();
  t.pauseError('服务器拒绝操作：market-price-step');
  assert.equal(t.active, false);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].t, 'setRoute');
  assert.equal(d.jobs.find(j => j.id === sent[0].jobId).skill, 'mining');
  assert.match(t.pausedError.reason, /market-price-step/);
  assert.ok(t.pausedError.backup);
});

test('no backup when the character is busy, for plain pauses, or inside the Worker', () => {
  const busy = setup({route: {jobId: 1, siteId: 1, phase: 'working'}});
  busy.t.pauseError('x');
  assert.equal(busy.sent.length, 0);
  assert.ok(busy.t.pausedError, 'the error is still shown');
  const plain = setup();
  plain.t.pause('已选择新职业');
  assert.equal(plain.sent.length, 0);
  assert.equal(plain.t.pausedError, null);
  const worker = setup();
  worker.t.inWorker = true;
  worker.t.pauseError('x');
  assert.equal(worker.sent.length, 0, 'the page starts it after applying the result');
  assert.equal(worker.t.pausedError.backup, null);
  worker.t.inWorker = false;
  worker.t.startBackup();
  assert.equal(worker.sent.length, 1);
});

test('starting again clears the error', () => {
  const {t} = setup();
  t.pauseError('x');
  t.awaitInitial = false;
  t.start?.();
  assert.equal(t.pausedError, null);
});
