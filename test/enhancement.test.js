import test from 'node:test';
import assert from 'node:assert/strict';
import {enhanceQuote} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

// Reference: client 1.0.1189
// min(1, max(.2, 1 - .06*plus) * (1 + lectern) * (1 + .002*(level - 1)) * (1 + .0025*mastery))
const reference = ({plus, level, lectern = 0, mastery = 0}) =>
  Math.min(1, Math.max(.2, 1 - .06 * plus) * (1 + .01 * lectern) * (1 + .002 * (level - 1)) * (1 + .0025 * mastery));

test('enhance chance includes the Enhancing level multiplier', () => {
  const planner = makePlanner();
  const d = planner.data;
  const base = d.gear.find(g => g.slot === 'weapon').itemId;
  for (const [plus, level, lectern, mastery] of [[0, 1, 0, 0], [3, 50, 0, 0], [4, 100, 5, 20], [8, 99, 10, 0]]) {
    const p = player(planner, {levels: {enhancing: level}, house: {lectern}, houseFurniture: lectern ? {lectern: {cell: 0, slot: 0}} : {}, masteries: {enhance: mastery}});
    const quote = enhanceQuote(d, planner, p, base + plus * d.plusScale);
    assert.equal(planner.levels(p).enhancing, level);
    assert.ok(Math.abs(quote.chance - reference({plus, level, lectern, mastery})) < 1e-12, `plus ${plus} level ${level}: ${quote.chance}`);
  }
});

test('level 100 raises +4 odds by about 20% over level 1', () => {
  const planner = makePlanner();
  const d = planner.data, base = d.gear.find(g => g.slot === 'weapon').itemId;
  const at = level => enhanceQuote(d, planner, player(planner, {levels: {enhancing: level}}), base + 4 * d.plusScale).chance;
  assert.ok(Math.abs(at(100) / at(1) - 1.198) < 1e-9);
});
