import test from 'node:test';
import assert from 'node:assert/strict';
import {finishTaskReason} from '../src/planner/crafting.js';
import {makePlanner, player} from './helpers.js';

test('the game\'s fallback activity is replaced at once, not finished like the helper\'s own trips', () => {
  const planner = makePlanner(), d = planner.data;
  const ore = d.jobs.find(j => j.skill === 'mining' && !j.inputs.length && !d.items[j.output.itemId]?.stackable);
  const site = d.sites.find(s => s.jobIds.includes(ore.id));
  const route = {jobId: ore.id, siteId: site.id, phase: 'toWork', limit: null};
  const own = player(planner, {levels: {mining: 99}, route, pack: [], activity: 'walking'});
  assert.match(finishTaskReason(d, own) ?? '', /背包满/, 'an own open-ended trip is finished first');
  assert.equal(planner.taskBoundary(own), false);
  const filler = {...own, route: {...route, fallback: true}};
  assert.equal(finishTaskReason(d, filler), null);
  assert.equal(planner.taskBoundary(filler), true, 'the plan may switch right away');
  // Without the flag: the saved fallback task running with no limit.
  const unflagged = {...own, fallback: {task: {kind: 'job', jobId: ore.id, siteId: site.id}}};
  assert.equal(finishTaskReason(d, unflagged), null);
  // The helper's own unlimited trip (limit 0 is never treated as filler, even on the same job).
  assert.match(finishTaskReason(d, {...unflagged, route: {...route, limit: 1000}}) ?? '', /背包满/);
});
