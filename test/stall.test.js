import test from 'node:test';
import assert from 'node:assert/strict';
import {Trainer} from '../src/runtime/trainer.js';
import {data} from './helpers.js';

// A crafting route the game left idle: no path, no work, no experience.
function harness() {
  const d = data();
  const job = d.jobs.find(j => j.skill === 'smithing' && j.inputs.length && !j.grow);
  let clock = 0;
  const t = Object.assign(Object.create(Trainer.prototype), {
    data: d, style: 'melee', now: () => clock, snapshotSequence: 0, syncAfter: 0, nextSync: 0, lastSync: 0,
    progress: null, stallCheck: null, failures: [], failureKey: null,
    goal: {skill: 'smithing', recipeId: job.id, target: 80}, deferred: {}, questDeferred: {}, blockedReasons: {},
    sent: [], issued: [], logs: [],
    send(m) { this.sent.push(m); }, log(m) { this.logs.push(m); }, pause(m) { this.paused = m; },
    issue(plan) { this.issued.push(plan.intent.t); },
  });
  const p = {x: 1, y: 1, path: null, route: {jobId: job.id, siteId: 1, phase: 'toWork'}, activity: 'idle',
    skills: Object.fromEntries(d.skills.map(s => [s, 1000]))};
  const advance = ms => { clock += ms; };
  return {t, p, advance};
}

function stallOnce(t, p, advance) {
  assert.equal(t.watchProgress(p), false, 'first sighting');
  advance(31000);
  assert.equal(t.watchProgress(p), true, 'idle route checked after 30 s');
  assert.deepEqual(t.sent.at(-1), {t: 'resync'});
  t.snapshotSequence++;
  assert.equal(t.watchProgress(p), true);
  assert.equal(t.issued.at(-1), 'clearRoute');
}

test('an idle crafting route is cleared after 30 s, and set aside when it stalls again', () => {
  const {t, p, advance} = harness();
  stallOnce(t, p, advance);
  assert.ok(t.goal, 'first stall: retry the same goal');
  // The planner sets the same route again; the game leaves it idle again.
  stallOnce(t, {...p, route: {...p.route, phase: 'toBank'}}, advance);
  assert.equal(t.goal, null, 'second stall: goal set aside');
  assert.ok(t.deferred.smithing > 0);
  assert.equal(t.paused, undefined);
});

test('real experience between stalls restarts the count', () => {
  const {t, p, advance} = harness();
  stallOnce(t, p, advance);
  t.watchProgress({...p, skills: {...p.skills, smithing: 1200}, route: {...p.route, phase: 'working'}, activity: 'working'});
  stallOnce(t, {...p, skills: {...p.skills, smithing: 1200}}, advance);
  assert.ok(t.goal, 'progress was made: not set aside');
});
