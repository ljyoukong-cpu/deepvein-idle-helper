import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';
import {validateGameData} from '../src/data/public-tables.js';

test('fields gated by another skill are farmed once that skill reaches its level', () => {
  const planner = makePlanner(), d = planner.data;
  assert.equal(planner.farmFieldCount, 10);
  const base = player(planner, {levels: {farming: 60}});
  assert.equal(planner.farmFields(base).length, 6, 'the six farming-level fields');
  const gated = player(planner, {levels: {farming: 60, woodcutting: 75, fishing: 75, fletching: 70, mining: 85}});
  const ids = planner.farmFields(gated).map(s => s.id);
  assert.equal(ids.length, 10);
  for (const id of [387, 389, 391, 393]) assert.ok(ids.includes(id), `field ${id}`);
  const almost = player(planner, {levels: {farming: 60, mining: 84}});
  assert.ok(!planner.farmFields(almost).some(s => s.id === 393), 'mining 84 is not enough');
  assert.equal(validateGameData(d), true);
  assert.equal(validateGameData({...d, farmGates: {...d.farmGates, 999: {skill: 'mining', level: 1}}}), false, 'unknown field');
});

test('a field set to "不使用" in the game is left alone: not counted, not replanted, never re-enabled', async () => {
  const {validateIntent} = await import('../src/runtime/intents.js');
  const planner = makePlanner(), d = planner.data;
  const fields = d.sites.filter(s => s.kind === 'field').sort((a, b) => a.id - b.id);
  const p = player(planner, {levels: {farming: 60}, plotChoice: {[fields[1].id]: 0}});
  const ids = planner.farmFields(p).map(s => s.id);
  assert.equal(ids.length, 5);
  assert.ok(!ids.includes(fields[1].id));
  assert.equal(validateIntent(d, p, {t: 'plotChoice', siteId: fields[1].id, seed: null}), false, 'the helper never clears "不使用"');
});
