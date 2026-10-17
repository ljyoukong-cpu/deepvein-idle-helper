import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseHouseFuel, housePointsOf} from '../src/planner/housing.js';
import {saleProtectionReason} from '../src/planner/inventory.js';
import {COAL_ID, merchantPrice} from '../src/planner/items.js';
import {data} from './helpers.js';

const d = data(), R = d.rarityScale;
const id = name => Object.values(d.items).find(i => i.name === name).id;

test('house points follow the client: tier, x3 per quality, crafted depth bonus', () => {
  const copper = id('Copper');
  assert.deepEqual(housePointsOf(d, copper), {family: 'stone', each: 1});
  assert.equal(housePointsOf(d, copper + R).each, 3);
  assert.equal(housePointsOf(d, copper + 2 * R).each, 9);
  // Bronze bar = copper + tin (1 + 1 stone), one recipe deep: x1.5.
  assert.deepEqual(housePointsOf(d, id('Bronze bar')), {family: 'stone', each: 3});
  // Bronze blade = one bar, two recipes deep: (1 + 1) x 2.
  assert.equal(housePointsOf(d, id('Bronze blade')).each, 4);
  assert.equal(housePointsOf(d, id('Bronze blade') + d.plusScale), null, 'enhanced items cannot be converted');
});

test('fuel is the cheapest coins per point; common coal and legendary are never used', () => {
  const copper = id('Copper');
  const legendary = copper + (d.rarityMultipliers.length - 1) * R;
  const p = {bank: {[COAL_ID]: 5000, [COAL_ID + R]: 40, [copper]: 500, [copper + R]: 100, [legendary]: 50}, pack: []};
  const inventory = {items: [{itemId: copper, sellFromBank: 400}]};
  const fuel = chooseHouseFuel(d, {p, families: ['stone'], missing: 200, inventory, budget: {items: {}},
    unitValue: item => merchantPrice(d, item)});
  const used = fuel.conversions.map(c => c.itemId);
  assert.ok(!used.includes(COAL_ID), 'common coal is kept for smelting');
  assert.ok(!used.includes(legendary), 'legendary is the player\'s');
  assert.ok(fuel.donors.some(x => x.itemId === COAL_ID + R), 'uncommon coal is fuel');
  assert.equal(used[0], copper + R, 'uncommon copper: 3 points for the merchant price of 1');
  const order = fuel.donors.map(x => x.unit / x.each);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(fuel.remaining <= 0);
});

test('planned quality materials are kept out of the fuel', () => {
  const copper = id('Copper');
  const p = {bank: {[copper + R]: 100}, pack: []};
  const fuel = chooseHouseFuel(d, {p, families: ['stone'], missing: 1000, inventory: {items: []},
    budget: {items: {[copper + R]: 80}}, unitValue: item => merchantPrice(d, item)});
  assert.equal(fuel.donors[0].available, 20);
});

test('common coal is never sold', () => {
  assert.match(saleProtectionReason(d, COAL_ID), /煤炭/);
  assert.equal(d.jobs.filter(j => j.inputs.some(i => i.itemId === COAL_ID)).length > 0, true);
});

test('a conversion the game ignored (nothing changed) does not pause; that fuel is skipped for a while', async () => {
  const {Trainer} = await import('../src/runtime/trainer.js');
  const {makePlanner, player} = await import('./helpers.js');
  const planner = makePlanner(), d = planner.data, clock = 1e9;
  const refused = [];
  planner.refuseHouseFuel = (p, itemId) => refused.push(itemId);
  const t = new Trainer(d, planner, () => {}, () => clock);
  const p = player(planner, {bank: {3: 40}, housePoints: {stone: 10}});
  Object.assign(t, {active: true, compatible: true, player: p, received: clock, snapshotSequence: 2, syncAfter: 1, nextSync: clock + 60000,
    pending: {intent: {t: 'convertHouse', itemId: 3, qty: 20}, label: '准备矿井升级 · 转换 Iron × 20', before: p, sentAt: clock - 40000},
    resolution: {sequence: 1, reason: '操作未得到确认', code: null}});
  t.tick();
  assert.equal(t.pausedError ?? null, null, 'no pause');
  assert.equal(t.active, true);
  assert.deepEqual(refused, [3]);
  assert.match(t.history[0].message, /未生效/);
  // Something did change: the old guard against spending twice still applies.
  const spent = new Trainer(d, planner, () => {}, () => clock);
  Object.assign(spent, {active: true, compatible: true, player: {...p, bank: {3: 30}}, received: clock, snapshotSequence: 2, syncAfter: 1,
    nextSync: clock + 60000, pending: {intent: {t: 'convertHouse', itemId: 3, qty: 20}, label: 'x', before: p, sentAt: clock - 40000},
    resolution: {sequence: 1, reason: '操作未得到确认', code: null}});
  spent.tick();
  assert.ok(spent.pausedError, 'a partial change still pauses');
});

test('auto-housing off: no new house work, and a visit under way leaves home', async () => {
  const {makePlanner, player} = await import('./helpers.js');
  const planner = makePlanner(), d = planner.data;
  const p = player(planner, {houseCells: [d.houseRules.entrance], houseFurniture: {}, house: {}, housePoints: {}, houseUpgrades: {},
    path: null, route: null, activity: 'idle'});
  const portal = d.houseTravel.portals[0];
  const visiting = () => planner.housingRuntime({owner: p.id, visit: {phase: 'work', portalId: portal.id, resume: null}, retryAt: 0});
  visiting();
  assert.ok(planner.housingPlan(p, {skill: 'mining'}, 'melee', 'balanced')?.intent, 'enabled: the visit carries on toward home');
  visiting();
  planner.setHousingEnabled(false);
  assert.equal(planner.housingPlan(p, {skill: 'mining'}, 'melee', 'balanced'), null, 'outside home with nothing to resume');
  assert.equal(planner.housingRuntime().visit, null, 'the visit is over');
  assert.equal(planner.housingPlan(p, {skill: 'mining'}, 'melee', 'balanced'), null, 'and no new visit starts');
});
