import test from 'node:test';
import assert from 'node:assert/strict';
import {Trainer} from '../src/runtime/trainer.js';
import {decisionFields} from '../src/worker/planning.js';
import {makePlanner} from './helpers.js';

// Each planning pass builds a fresh trainer in the Worker from these fields;
// without the timestamps the ten-minute note throttle restarts every second.
test('potion notes stay throttled across Worker passes', () => {
  assert.ok(decisionFields.includes('consumableLogAt'));
  const planner = makePlanner();
  let clock = 1e9, carried = {};
  const pass = message => {
    const t = new Trainer(planner.data, planner, () => {}, () => clock);
    Object.assign(t, carried);
    t.noteConsumable('potion:a', message);
    carried = Object.fromEntries(decisionFields.map(key => [key, t[key]]));
    return t.history.length;
  };
  assert.equal(pass('药水未喝：A'), 1);
  for (let i = 0; i < 5; i++) { clock += 1000; assert.equal(pass('药水未喝：A'), 1, 'not logged again'); }
  clock += 600000;
  assert.equal(pass('药水未喝：A'), 2, 'logged again after ten minutes');
});
