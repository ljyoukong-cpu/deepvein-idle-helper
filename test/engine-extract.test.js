// Runs only with a local copy of the public client:
//   DVI_CLIENT=path/to/index-XXXX.js npm test
// The game's code is never committed to this repository.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parsePublicClient} from '../src/vendor/acorn.js';
import {extractEngine} from '../src/engine/extract.js';
import {loadEngine, simulate} from '../src/engine/runtime.js';

const client = process.env.DVI_CLIENT;
const skip = !client || !fs.existsSync(client) ? 'set DVI_CLIENT to a local client bundle' : false;

test('extracts a pure engine from the live client', {skip}, () => {
  const result = extractEngine(fs.readFileSync(client, 'utf8'), parsePublicClient);
  assert.equal(result.ok, true, result.problems?.join('; '));
  assert.ok(result.stats.units > 300, `${result.stats.units} units`);
  const engine = loadEngine({id: 'test', factory: result.factory});
  assert.equal(engine.ok, true, engine.error);
  assert.ok(engine.api.world.zones.length > 0);
});

test('simulates combat and gathering with the extracted engine', {skip}, () => {
  const result = extractEngine(fs.readFileSync(client, 'utf8'), parsePublicClient);
  const {api} = loadEngine({id: 'test', factory: result.factory});
  const skills = Object.fromEntries(api.allSkills.map(s => [s, 0]));
  Object.assign(skills, {melee: api.levelXp(10), defence: api.levelXp(10), hitpoints: api.levelXp(10), mining: api.levelXp(1)});
  const you = {id: 1, skills, equipment: Object.fromEntries(api.equipmentSlots.map(s => [s, null])), lastTick: 5e6, x: 200, y: 82,
    bank: {}, pack: [], perks: {}, masteries: {}, house: {}, houseFurniture: {}, brews: {}, brewTier: {}, coins: 0, foodItemId: 64, eatAt: .5};
  const monster = api.monsters.find(m => m.id === 1);
  const fight = simulate(api, you, {monsterId: monster.id}, {hours: 1, seed: 1, foodItemId: 64});
  assert.ok(fight.kills > 50, `kills ${fight.kills}`);
  assert.equal(fight.deaths, 0);
  assert.ok(fight.xp > 0);
  const copper = api.world.sites.find(s => s.jobIds.length)?.jobIds[0];
  const mine = simulate(api, you, {jobId: copper}, {hours: 1, seed: 1});
  assert.ok(mine.xp > 0, JSON.stringify(mine).slice(0, 200));
});
