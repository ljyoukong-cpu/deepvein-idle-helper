import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {rankCost, totalCost} from '../src/engine/mastery-rules.js';
import {validateIntent} from '../src/runtime/intents.js';
import {acknowledged} from '../src/runtime/trainer.js';
import {data} from './helpers.js';

const d = data();

test('mastery costs follow 38 + 2n per rank', () => {
  assert.equal(rankCost(1), 40);
  assert.equal(totalCost(1), 40);
  assert.equal(totalCost(3), 40 + 42 + 44);
  let sum = 0;
  for (let n = 1; n <= 250; n++) sum += rankCost(n);
  assert.equal(totalCost(250), sum);
});

test('masteryConfirm validation mirrors the server rules', () => {
  const p = {masteries: {xp: 3}};
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {xp: 4}}), true);
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {xp: 3, gather: 2}}), true);
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {gather: 2}}), false, 'existing track must stay listed');
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {xp: 2}}), false, 'cannot go below locked rank');
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {xp: 3}}), false, 'nothing new');
  assert.equal(validateIntent(d, p, {t: 'masteryConfirm', ranks: {xp: 4, bogus: 1}}), false);
});

test('masteryConfirm is confirmed when the snapshot shows the new ranks', () => {
  const intent = {t: 'masteryConfirm', ranks: {xp: 4, gather: 2}};
  assert.equal(acknowledged({masteries: {xp: 3}}, {masteries: {xp: 4, gather: 2}}, intent), true);
  assert.equal(acknowledged({masteries: {xp: 3}}, {masteries: {xp: 3}}, intent), false);
});

// The account in the screenshot: XP +23% (46), gather +12.5% (25), craft +4% (8), move +1% (2).
async function screenshot(free, usage) {
  const {chooseMastery} = await import('../src/engine/mastery.js');
  const {spentPoints} = await import('../src/engine/mastery-rules.js');
  const masteries = {xp: 46, gather: 25, craft: 8, move: 2};
  const api = {masteryTracks: ['xp', 'gather', 'craft', 'offline', 'move', 'hp', 'maxhit', 'accuracy', 'rare', 'enhance'].map(id => ({id})),
    masteryEarnedPoints: () => spentPoints(masteries) + free};
  const p = {id: 1, skills: {}, masteries};
  return chooseMastery(api, p, {skill: 'crafting', recipeId: 1}, {data: d, usage});
}
const job = skill => d.jobs.find(j => j.skill === skill && !j.grow).id;

test('crafting is a small share of the time: craft speed loses to gathering, walking and XP', async () => {
  const usage = {[`job:${job('mining')}`]: {seconds: 3000, travelSeconds: 1000}, [`job:${job('smithing')}`]: {seconds: 400, travelSeconds: 50}};
  const plan = await screenshot(98, usage);
  assert.equal(plan.intent.t, 'masteryConfirm');
  assert.equal(plan.intent.ranks.craft, 8, 'craft speed untouched');
  assert.ok(plan.intent.ranks.move > 2 || plan.intent.ranks.gather > 25 || plan.intent.ranks.xp > 46, JSON.stringify(plan.intent.ranks));
  assert.match(plan.reason, /采集 \d+%、制作 \d+%/);
});

test('points are saved for the best track instead of a cheaper weaker one', async () => {
  const usage = {[`job:${job('mining')}`]: {seconds: 3600, travelSeconds: 0}};
  const plan = await screenshot(60, usage);
  assert.equal(plan.intent, null, 'craft (56) is affordable but not worth it');
  assert.equal(plan.saving.id, 'gather');
  assert.equal(plan.saving.need, 90);
  const later = await screenshot(98, usage);
  assert.deepEqual(later.intent.ranks, {xp: 46, gather: 26, craft: 8, move: 2}, 'bought once enough is saved');
});

const client = process.env.DVI_CLIENT;
test('engine-backed mastery choice spends points on a measured gain', {skip: !client || !fs.existsSync(client) ? 'set DVI_CLIENT' : false}, async () => {
  const {parsePublicClient} = await import('../src/vendor/acorn.js');
  const {extractEngine} = await import('../src/engine/extract.js');
  const {loadEngine} = await import('../src/engine/runtime.js');
  const {chooseMastery} = await import('../src/engine/mastery.js');
  const ext = extractEngine(fs.readFileSync(client, 'utf8'), parsePublicClient);
  assert.ok(ext.found.masteryEarnedPoints && ext.found.masteryTracks, ext.problems.join('; '));
  const {api} = loadEngine({id: 't', factory: ext.factory});
  const skills = Object.fromEntries(api.allSkills.map(s => [s, api.levelXp(30)]));
  const p = {id: 1, skills, lastTick: 1e6, masteries: {}, collections: {}, forgeLog: {}};
  assert.equal(chooseMastery(api, p, {monsterId: 1}), null, 'no points earned: nothing to spend');
  // Pretend 2,000 points are available.
  const rich = {...api, masteryEarnedPoints: () => 2000};
  const plan = chooseMastery(rich, p, {monsterId: 1});
  assert.equal(plan.intent.t, 'masteryConfirm');
  const spent = Object.values(plan.intent.ranks).reduce((s, n) => s + totalCost(n), 0);
  assert.ok(spent <= 2000 && spent > 1500, `spent ${spent}`);
  assert.ok(!('offline' in plan.intent.ranks));
});
