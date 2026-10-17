import test from 'node:test';
import assert from 'node:assert/strict';
import {Trainer} from '../src/runtime/trainer.js';
import {makePlanner, player} from './helpers.js';

// A mandatory quest whose herbs are still growing must step aside: other work
// runs until the crop is ripe, instead of re-picking the same quest each attempt.
test('a quest waiting for its crop is set aside and other work runs meanwhile', () => {
  const planner = makePlanner(), d = planner.data, now = 1e9;
  const p = player(planner, {levels: {herblore: 53, farming: 60, mining: 50}, activity: 'idle', path: null, route: null,
    held: false, queue: [], coins: 0, hp: 100});
  const quest = {key: 'daily:herb', id: 1, period: 'daily', stamp: 1, kind: 'job'};
  planner.questRead = () => [{key: quest.key, period: 'daily', claimed: false, remaining: 3}];
  planner.questChooseGoal = (_p, _base, _style, deferred) => deferred[quest.key] ? null :
    {skill: 'herblore', target: 54, growth: true, quest, mandatory: true, budget: {coins: 0, items: {}}};
  planner.harvest = () => null;
  const plan = planner.plan;
  planner.plan = (state, goal, ...rest) => goal?.quest ?
    {intent: null, label: '等待整批作物成熟', reason: '为炼药 54 级目标补 Nightshade：等全部成熟后一起收菜', deferUntilTick: state.lastTick + 900} :
    plan(state, goal, ...rest);
  const t = new Trainer(d, planner, () => {}, () => now);
  Object.assign(t, {mode: 'balanced', style: 'melee', active: true, compatible: true, player: p, autoFallback: false});
  t.issue = next => { t.plan = next; t.issued = next; };
  t.advance();
  assert.ok(t.questDeferred[quest.key] > now, 'the quest waits for its crop');
  assert.equal(t.history.filter(h => /Nightshade/.test(h.message)).length, 1, 'the wait is logged once');
  assert.notEqual(t.message, '当前候选任务均在等待条件变化');
  assert.ok(t.issued?.intent, `other work starts: ${t.message}`);
});
