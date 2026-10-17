import test from 'node:test';
import assert from 'node:assert/strict';
import {Trainer} from '../src/runtime/trainer.js';
import {validateIntent} from '../src/runtime/intents.js';
import {makePlanner, player} from './helpers.js';

test('a held queue the game does not show is named, and only the player clears it', () => {
  const planner = makePlanner(), d = planner.data, sent = [];
  const job = d.jobs.find(j => j.skill === 'mining' && !j.inputs.length);
  const t = new Trainer(d, planner, intent => sent.push(intent), () => 1e9);
  t.compatible = true;
  t.player = player(planner, {queue: [{kind: 'job', jobId: job.id, siteId: 1}], held: true, route: null});
  t.start();
  assert.equal(t.active, false, 'the queue is not overridden');
  assert.equal(t.queueBlocked, true);
  assert.match(t.history[0].message, new RegExp(`${job.name}（已搁置`));
  assert.equal(sent.length, 0, 'nothing is cleared on its own');
  assert.equal(t.clearGameQueue(), true);
  assert.deepEqual(sent, [{t: 'unqueue'}]);
  assert.equal(validateIntent(d, t.player, {t: 'unqueue'}), true);
  assert.equal(validateIntent(d, {...t.player, queue: []}, {t: 'unqueue'}), false);
  assert.equal(validateIntent(d, t.player, {t: 'unqueue', index: 0}), false, 'only the whole-queue form');
});
