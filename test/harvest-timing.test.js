import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

function farm() {
  const planner = makePlanner(), d = planner.data;
  const top = Math.max(...d.farmUnlocks);
  const herbs = d.jobs.filter(j => j.grow && j.levelReq <= top).slice(0, 2);
  const fields = d.sites.filter(s => s.kind === 'field').sort((a, b) => a.id - b.id).slice(0, 3);
  const now = 100000;
  const plots = {
    [fields[0].id]: {seedItemId: herbs[0].inputs[0].itemId, plantedAt: now - herbs[0].grow - 10},
    [fields[1].id]: {seedItemId: herbs[0].inputs[0].itemId, plantedAt: now - herbs[0].grow - 10},
    [fields[2].id]: {seedItemId: herbs[1].inputs[0].itemId, plantedAt: now - Math.floor(herbs[1].grow / 2)},
  };
  const full = Object.fromEntries(d.jobs.filter(j => j.grow).map(j => [j.output.itemId, 100000]));
  full[herbs[0].inputs[0].itemId] = 10;
  const p = player(planner, {levels: {farming: top}, lastTick: now, plots, bank: full, hp: 100, activity: 'idle', path: null,
    houseCells: [], house: {}});
  return {planner, d, p};
}

test('harvest timing: every field ripe (default) or one same-seed group ripe', () => {
  const {planner, p} = farm();
  assert.equal(planner.harvest(p, null, null, 'melee', true), null, 'all mode: waits for the growing field');
  planner.automation = {harvestMode: 'seed'};
  assert.equal(planner.harvest(p, null, null, 'melee', true)?.intent?.errand, true, 'seed mode: the ripe pair is harvested');
});

test('a random harvest delay is drawn once per batch and then waited out', () => {
  const {planner, p, d} = farm();
  planner.automation = {harvestMode: 'seed', delayMin: 1, delayMax: 1};
  assert.equal(planner.harvest(p, null, null, 'melee', true), null);
  assert.match(planner.farmStatus(p).reason, /随机延迟/);
  const later = {...p, lastTick: p.lastTick + Math.ceil(60000 / d.tickMs)};
  assert.equal(planner.harvest(later, null, null, 'melee', true)?.intent?.errand, true, 'after the delay: harvest');
});
