import test from 'node:test';
import assert from 'node:assert/strict';
import {planView, profitFrontier} from '../src/planner/plan-view.js';
import {makePlanner, player} from './helpers.js';

test('profit frontier keeps only the best XP for each gold level', () => {
  const rows = [
    {label: 'A', xpH: 10000, coinsH: 0},
    {label: 'B', xpH: 9000, coinsH: 3000},
    {label: 'C', xpH: 9500, coinsH: 2000},
    {label: 'D', xpH: 8000, coinsH: 1000}, // dominated by C
    {label: 'E', xpH: 5000, coinsH: 12000},
  ];
  const f = profitFrontier(rows);
  assert.deepEqual(f.map(p => p.label), ['A', 'C', 'B', 'E']);
  assert.equal(f[0].floor, 0);
  assert.equal(f[0].loss, 0);
  assert.equal(f[1].floor, 2000);
  assert.ok(Math.abs(f[3].loss - .5) < 1e-9);
  for (const p of f) assert.ok(rows.find(r => r.label === p.label).coinsH >= p.floor, 'every suggestion meets its own floor');
});

test('frontier is thinned to the requested number of suggestions', () => {
  const rows = Array.from({length: 12}, (_, i) => ({label: `T${i}`, xpH: 12000 - i * 500, coinsH: i * 1000}));
  const f = profitFrontier(rows, 5);
  assert.ok(f.length <= 5 && f.length >= 4);
  assert.equal(f[0].label, 'T0');
  assert.equal(f.at(-1).label, 'T11');
});

test('plan view explains the layer, candidates and points', () => {
  const planner = makePlanner(), d = planner.data;
  planner.watchMarket = () => {};
  const p = player(planner, {levels: {mining: 20, melee: 20, hitpoints: 20, defence: 20, thieving: 15}, coins: 100, hp: 200,
    activity: 'idle', path: null, held: false, questPoints: 7});
  const mining = d.jobs.find(j => j.skill === 'mining' && j.levelReq <= 20 && !j.inputs.length);
  const trainer = {goal: {skill: 'mining', recipeId: mining.id, target: 21, reason: 'test reason'}, style: 'melee', mode: 'experience',
    plan: {label: 'Mining', reason: 'why'}, deferred: {}, itemTarget: null};
  const view = planView(d, planner, trainer, p);
  assert.equal(view.layer, '经验优先');
  assert.equal(view.goal.reason, 'test reason');
  // 经验优先 compares XP across all skills.
  assert.equal(view.xpAcross, true);
  assert.ok(new Set(view.xpCandidates.map(c => c.skill)).size > 1);
  assert.ok(view.xpCandidates.some(c => c.chosen), 'current goal is marked');
  // Other modes compare XP only within the goal's skill.
  const balanced = planView(d, planner, {...trainer, mode: 'balanced'}, p);
  assert.equal(balanced.xpAcross, false);
  assert.equal(balanced.xpSkill, 'mining');
  assert.ok(balanced.xpCandidates.length > 0 && balanced.xpCandidates.every(c => c.skill === 'mining'));
  assert.ok(new Set(view.goldCandidates.map(c => c.skill)).size > 1, 'gold is compared across skills');
  assert.ok(view.goldCandidates.every((c, i, list) => i === 0 || list[i - 1].coinsH >= c.coinsH || c.chosen));
  assert.ok([...view.xpCandidates, ...view.goldCandidates].every(c => ['formula', 'simulated', 'measured'].includes(c.source)));
  assert.ok(view.frontier.length > 0 && view.frontier[0].floor === 0);
  assert.equal(view.perks.points, 7);
  const daily = planView(d, planner, {...trainer, goal: {...trainer.goal, quest: {period: 'daily', id: 'd1:x'}}}, p);
  assert.equal(daily.layer, '每日任务（必做）');
});

test('a level goal is labelled by its skill, with the recipe as the means', () => {
  const planner = makePlanner(), d = planner.data;
  planner.watchMarket = () => {};
  const amulet = d.jobs.find(j => j.skill === 'crafting' && d.items[j.output.itemId]?.name === 'Gold amulet');
  const p = player(planner, {levels: {crafting: 71}, hp: 100, activity: 'idle', path: null, held: false});
  const trainer = {goal: {skill: 'crafting', recipeId: amulet.id, target: 75, development: true, reason: '发展计划'},
    style: 'melee', mode: 'balanced', plan: null, deferred: {}, itemTarget: null};
  const view = planView(d, planner, trainer, p);
  assert.equal(view.goal.label, '制作');
  assert.equal(view.goal.target, 75);
  assert.equal(view.goal.via, 'Gold amulet');
});
