import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

function smith(ore, extra = {}) {
  const planner = makePlanner(), d = planner.data;
  planner.watchMarket = () => {};
  const bar = d.jobs.find(j => j.skill === 'smithing' && j.name === 'Bronze bar');
  const [copper, tin] = bar.inputs.map(i => i.itemId), bank = d.banks[0];
  const quality = typeof extra === 'function' ? extra(copper, tin, d.rarityScale) : extra;
  // Top-tier legendary gear everywhere: nothing better to plan, so these tests
  // see the stage logic alone (gear-first is covered in gear-first.test.js).
  const melee = g => (!g.style || g.style === 'melee') && (g.slot !== 'weapon' || g.needs === 'melee' && !g.twoHanded);
  const top = Object.fromEntries([...new Set(d.gear.map(g => g.slot))].filter(slot => slot !== 'mount').map(slot =>
    [slot, d.gear.filter(g => g.slot === slot && melee(g)).sort((a, b) => (b.levelReq ?? 0) - (a.levelReq ?? 0))[0].itemId + 4 * d.rarityScale]));
  const p = player(planner, {levels: {smithing: 20, mining: 30}, x: bank.x, y: bank.y, bank: {[copper]: ore, [tin]: ore, ...quality},
    equipment: top,
    coins: 0, hp: 100, activity: 'idle', path: null, held: false, route: null});
  const goal = {skill: 'smithing', target: 25, development: true, growth: true, recipeId: bar.id, recipes: {smithing: bar.id},
    budget: {coins: 0, items: {}}};
  return {planner, d, p, goal, bar};
}

test('a development project gathers the whole stage before crafting', () => {
  const {planner, d, p, goal, bar} = smith(20);
  const plan = planner.plan(p, goal, 'melee');
  assert.notEqual(plan.intent?.jobId, bar.id, 'twenty ore do not start smelting');
  assert.equal(goal.craftPreparation?.jobId, bar.id);
  const xpPerBar = planner.estimateWork(p, bar).xp;
  const needed = Math.ceil((planner.thresholds[25] - p.skills.smithing) / xpPerBar);
  assert.ok(goal.craftPreparation.amount >= needed * .9, `${goal.craftPreparation.amount} bars for smithing 20 -> 25 (${needed})`);
});

test('while the current gathering load finishes, the stage progress stays in the message', () => {
  const {planner, d, p, goal, bar} = smith(20);
  planner.plan(p, goal, 'melee');
  const amount = goal.craftPreparation.amount, copper = bar.inputs[0].itemId;
  const ore = d.jobs.find(j => j.output.itemId === copper && !j.inputs.length);
  const site = d.sites.find(s => s.jobIds.includes(ore.id));
  const gathering = {...p, bank: {...p.bank, [copper]: 35}, x: site.x, y: site.y, activity: 'working',
    route: {jobId: ore.id, siteId: site.id, phase: 'working', limit: 100, onFull: 'bank'}};
  const plan = planner.plan(gathering, goal, 'melee');
  assert.equal(plan.intent, null);
  assert.match(plan.reason, /继续当前采集/);
  assert.ok(plan.reason.includes(`${d.items[copper].name} 35/${amount}`), plan.reason);
});

test('a goal picked mid-load previews its next step without changing the goal', () => {
  const {planner, d, p, goal, bar} = smith(20);
  const copper = bar.inputs[0].itemId, ore = d.jobs.find(j => j.output.itemId === copper && !j.inputs.length);
  const site = d.sites.find(s => s.jobIds.includes(ore.id));
  const gathering = {...p, x: site.x, y: site.y, activity: 'working',
    route: {jobId: ore.id, siteId: site.id, phase: 'working', limit: 100, onFull: 'bank'}};
  const plan = planner.plan(gathering, goal, 'melee');
  assert.match(plan.reason, /继续当前采集.*；之后：.*备料/, plan.reason);
  assert.equal(goal.craftPreparation, undefined, 'the preview ran on a copy');
});

test('with the stage in stock, crafting starts at once', () => {
  const {planner, p, goal, bar} = smith(5000);
  const plan = planner.plan(p, goal, 'melee');
  assert.equal(plan.intent?.jobId, bar.id);
});

const stageCrafts = (planner, p, bar) => Math.ceil((planner.thresholds[25] - p.skills.smithing) / planner.estimateWork(p, bar).xp);

test('quality materials count toward the stage total; only the rest is gathered as commons', () => {
  const {planner, p, goal, bar} = smith(20, (copper, tin, R) => ({[copper + R]: 300, [tin + R]: 300}));
  const plan = planner.plan(p, goal, 'melee');
  const needed = stageCrafts(planner, p, bar);
  assert.notEqual(plan.intent?.jobId, bar.id, 'not covered yet: no crafting');
  assert.equal(goal.craftPreparation?.jobId, bar.id);
  assert.ok(Math.abs(goal.craftPreparation.amount - (needed - 300)) <= 2,
    `${goal.craftPreparation.amount} commons to hold = ${needed} for the stage - 300 uncommon pairs`);
});

test('once all qualities together cover the stage, crafting starts with the higher quality', () => {
  const {planner, p, goal, bar} = smith(700, (copper, tin, R) => ({[copper + R]: 300, [tin + R]: 300}));
  assert.ok(700 + 300 >= stageCrafts(planner, p, bar));
  const plan = planner.plan(p, goal, 'melee');
  assert.ok(goal.recipeRarities.smithing > 0, 'a quality recipe first');
  assert.equal(plan.intent?.rarity, 1, JSON.stringify(plan.intent));
  assert.notEqual(goal.craftPreparation?.rarity ?? 1, 0, 'no common stage gathering pending');
});

test('pairs count, not loose quality ore: uncommon copper without uncommon tin adds nothing', () => {
  const {planner, p, goal, bar} = smith(20, (copper, tin, R) => ({[copper + R]: 300}));
  planner.plan(p, goal, 'melee');
  assert.ok(Math.abs(goal.craftPreparation.amount - stageCrafts(planner, p, bar)) <= 2);
});

test('quality drops found while preparing do not interrupt the stage', () => {
  const {planner, p, goal, bar} = smith(20, (copper, tin, R) => ({[copper + R]: 3, [tin + R]: 3}));
  goal.craftPreparation = {jobId: bar.id, amount: 912};
  const plan = planner.plan(p, goal, 'melee');
  assert.equal(goal.recipeRarities.smithing, 0);
  assert.notEqual(plan.intent?.rarity, 1);
});

test('gold per hour charges owned materials at what they would sell for', () => {
  const {planner, d, bar} = smith(0);
  const [copper, tin] = bar.inputs.map(i => i.itemId);
  const est = planner.routeEstimate(player(planner, {levels: {smithing: 20}, bank: {[copper]: 500, [tin]: 500}}), bar, 50, {});
  assert.ok(est.stockValue > 0);
  assert.ok(Math.abs(est.coins - (-est.stockValue)) < 1e-6, 'smelting earns no coins itself: net is minus the ore value');
  assert.ok(est.rate.coins < 0);
  assert.ok(est.budget.coins === 0, 'owned ore is not a purchase budget');
});
