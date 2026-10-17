import test from 'node:test';
import assert from 'node:assert/strict';
import {BAND, combatNeed, laggingSuppliers} from '../src/planner/progression.js';
import {starterWeapon} from '../src/planner/professions.js';
import {makePlanner, player} from './helpers.js';

const develop = (planner, levels) => {
  planner.watchMarket = () => {};
  planner.resetDevelopment?.();
  const p = player(planner, {levels, coins: 1000, hp: 300, activity: 'idle', path: null, held: false});
  return {p, goal: planner.growthChooseGoal(p, {}, {}, 'melee')};
};

test('自主发展 never trains a skill more than the band above the lowest', () => {
  const planner = makePlanner(), d = planner.data;
  const levels = Object.fromEntries(d.skills.map(s => [s, 30]));
  Object.assign(levels, {crafting: 71, mining: 30, fishing: 32});
  const {p, goal} = develop(planner, levels);
  const lv = planner.levels(p);
  const trained = planner.trainedSkills('melee').filter(s => !['enhancing', 'defence', 'hitpoints'].includes(s) && s !== 'farming');
  const lowest = Math.min(...trained.map(s => lv[s]));
  assert.ok(goal, 'a project is chosen');
  assert.notEqual(goal.skill, 'crafting', 'the skill far ahead waits for the others');
  assert.ok(goal.target <= lowest + BAND || /原料技能/.test(goal.reason), goal.reason);
  assert.match(goal.reason, new RegExp(`最低 ${lowest} 级以上 ${BAND} 级以内`));
});

test('combat is a supplier: herblore\'s next potion needs a drop the fighter cannot farm safely yet', () => {
  const planner = makePlanner(), d = planner.data;
  const dust = Object.values(d.items).find(i => i.name === 'Wraith dust').id;
  const fighter = levels => player(planner, {levels, hp: 999, equipment: {weapon: starterWeapon('melee')}});
  const weak = fighter({melee: 10, defence: 10, hitpoints: 10});
  const need = combatNeed(d, planner, weak, 'melee', dust);
  assert.equal(need?.skill, 'melee', JSON.stringify(need));
  assert.ok(need.level > 10 && need.level <= 99);
  assert.equal(d.monsters.find(m => m.id === need.monsterId).drop, dust);
  // At that level the monster is in the planner's safe list; one below it is not.
  const at = l => fighter({melee: l, defence: l, hitpoints: l});
  const safe = (p, id) => planner.combatOptions(p, 'melee').some(o => o.monster.id === id);
  assert.ok(safe(at(need.level), need.monsterId));
  assert.ok(!safe(at(need.level - 1), need.monsterId));
  assert.equal(combatNeed(d, planner, at(need.level), 'melee', dust), null, 'already safe: nothing to train');
  // Herblore 49 -> 50 unlocks the potion that needs it: combat is the lagging supplier.
  const lv = {...planner.levels(weak), herblore: 49};
  const lagging = laggingSuppliers(d, lv, 'herblore', 49, 50, {combatNeed: id => combatNeed(d, planner, weak, 'melee', id)});
  assert.ok(lagging.some(s => s.skill === 'melee' && s.itemId === dust), JSON.stringify(lagging));
});

test('suppliers first: smithing\'s next bar needs ore the miner cannot mine yet', () => {
  const planner = makePlanner(), d = planner.data;
  const lv = Object.fromEntries(d.skills.map(s => [s, 40]));
  const bar = d.jobs.find(j => j.skill === 'smithing' && j.inputs.some(i => d.jobs.some(o => o.output.itemId === i.itemId && o.skill === 'mining' && o.levelReq > 40)));
  const ore = bar.inputs.map(i => d.jobs.find(o => o.output.itemId === i.itemId && o.skill === 'mining')).find(o => o && o.levelReq > 40);
  const lagging = laggingSuppliers(d, {...lv, smithing: bar.levelReq - 1}, 'smithing', bar.levelReq - 1, bar.levelReq);
  assert.ok(lagging.some(s => s.skill === 'mining' && s.level >= ore.levelReq), JSON.stringify(lagging));
  // Once mining is there, nothing lags.
  assert.deepEqual(laggingSuppliers(d, {...lv, smithing: bar.levelReq - 1, mining: 99}, 'smithing', bar.levelReq - 1, bar.levelReq)
    .filter(s => s.skill === 'mining'), []);
});
