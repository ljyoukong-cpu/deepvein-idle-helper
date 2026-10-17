import test from 'node:test';
import assert from 'node:assert/strict';
import {PAYBACK_MARGIN, expectedEnhancement, payback, secondsSaved} from '../src/planner/investment.js';
import {planEnhancement} from '../src/planner/enhancement.js';
import {makePlanner, player} from './helpers.js';

function fighter(coins = 20000) {
  const planner = makePlanner(), d = planner.data;
  planner.watchMarket = () => {};
  const find = (slot, name) => d.gear.find(g => g.slot === slot && d.items[g.itemId].name.startsWith(name)).itemId;
  const p = player(planner, {levels: {melee: 62, defence: 60, hitpoints: 62, mining: 55, smithing: 62, thieving: 50}, coins, hp: 600,
    equipment: {weapon: find('weapon', 'Cobalt blade'), helmet: find('helmet', 'Cobalt helm'), pickaxe: find('pickaxe', 'Cobalt')},
    activity: 'idle', path: null, held: false});
  return {planner, d, p};
}

test('expected enhancement cost counts the reset to +0 on failure', () => {
  const {planner, d, p} = fighter();
  const blade = p.equipment.weapon;
  const full = expectedEnhancement(d, planner, p, blade, 5).gold;
  assert.ok(Math.abs(full - 72862) < 2, `cobalt blade 0 -> +5: ${full}`);
  // Steps: 3k, 6k, 9k, 12k, 15k at 100/94/88/82/76%: well above the 45k sum.
  assert.ok(full > 45000);
  const fromTwo = expectedEnhancement(d, planner, p, blade + 2 * d.plusScale, 5).gold;
  assert.ok(Math.abs(fromTwo - (full - expectedEnhancement(d, planner, p, blade, 2).gold)) < 1e-6);
});

test('payback: gold becomes time at the gold rate; time saved over the use period', () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} vs ${b}`);
  near(secondsSaved(1, 1.25, 100 * 3600), 20 * 3600); // 25% faster saves a fifth of the time
  const ok = payback({gold: 3600, coinRate: 1, before: 1, after: 1.25, useSeconds: 10 * 3600});
  near(ok.paid, 3600);
  near(ok.saved, 2 * 3600);
  assert.equal(ok.worth, true);
  const thin = payback({gold: 3600, coinRate: 1, before: 1, after: 1.25, useSeconds: 3600 * PAYBACK_MARGIN * 5 - 1});
  assert.equal(thin.worth, false, 'must beat the cost by the margin');
  assert.equal(payback({gold: 1, coinRate: 0, before: 1, after: 2, useSeconds: 3600}).worth, false, 'no gold income: unknown');
});

test('options: one cheapest worthwhile route per slot; small gains are not worth it', () => {
  const {planner, p} = fighter();
  const rows = planner.investmentOptions(p, 'melee', null);
  const weapon = rows.find(r => r.slot === 'weapon' && r.kind === 'enhance');
  assert.ok(weapon?.worth, JSON.stringify(weapon));
  assert.ok(weapon.toPlus >= 1 && weapon.toPlus <= 5);
  assert.equal(weapon.affordable, false, '20k gold does not cover it');
  const helmet = rows.find(r => r.slot === 'helmet');
  assert.ok(!helmet || !helmet.worth, 'a 0.3% gain does not pay back');
  for (const slot of new Set(rows.map(r => r.slot)))
    assert.ok(rows.filter(r => r.slot === slot && r.cheapest).length <= 1);
  assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].net >= r.net), 'best first');
});

test('funding: a worthwhile unaffordable step is funded on the best gold job, capped, then set aside if short', () => {
  const {planner, d, p} = fighter();
  const goal = planner.fundingGoal(p, 'melee', {}, null);
  assert.ok(goal?.funding, 'funding goal');
  assert.ok(goal.funding.gold > p.coins);
  assert.ok(goal.rate.coins > 0, 'a gold job');
  assert.equal(goal.funding.until - p.lastTick, Math.ceil(3600 * 1000 / d.tickMs), 'one hour at most');
  assert.ok(goal.target > 99, 'ends on gold or time, not on a level');
  // Ending short sets that improvement aside; the next one may be funded instead.
  planner.fundingEnded(p, goal);
  const next = planner.fundingGoal(p, 'melee', {}, null);
  assert.notEqual(next?.funding.key, goal.funding.key);
  // Rich enough: nothing to fund.
  const rich = fighter(5_000_000);
  assert.equal(rich.planner.fundingGoal(rich.p, 'melee', {}, null), null);
});

test('enhancement runs only on the worthwhile route, up to its stopping point', () => {
  const {planner, d, p} = fighter(5_000_000);
  p.bank[d.shardId] = 10000;
  const result = planEnhancement(d, planner, p, 'melee', null);
  const rows = planner.investmentOptions(p, 'melee', null);
  const chosen = rows.find(r => r.kind === 'enhance' && r.current === result.enhancement?.itemId);
  assert.ok(chosen?.worth && chosen.cheapest, JSON.stringify(result));
  assert.notEqual(result.enhancement.slot, 'helmet');
});
