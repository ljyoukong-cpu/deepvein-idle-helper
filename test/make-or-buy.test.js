import test from 'node:test';
import assert from 'node:assert/strict';
import {MAKE_BIAS} from '../src/planner/crafting.js';
import {createMarket} from '../src/economy/market.js';
import {makePlanner, player} from './helpers.js';

function bars() {
  const planner = makePlanner(), d = planner.data;
  planner.coinRate = () => 10;
  const job = d.jobs.find(j => j.skill === 'smithing' && j.name === 'Bronze bar');
  const inputs = job.inputs.map(i => i.itemId);
  planner.marketUnitCost = (_p, id) => inputs.includes(id) ? 1 : Infinity; // 1 second of gold per ore
  const p = player(planner, {levels: {smithing: 20}});
  return {planner, d, job, p};
}

test('making from bought materials is weighed against buying, with a bias for the XP', () => {
  const {planner, job, p} = bars();
  const make = planner.crafting.fromBought(p, job.output.itemId, 10);
  assert.equal(make.job.id, job.id);
  assert.ok(Number.isFinite(make.seconds) && make.seconds > 20, 'ore for 10 bars plus the smelting time');
  assert.equal(planner.crafting.makeBeatsBuying(p, job.output.itemId, 10, make.seconds * 2), true, 'buying costs double: make');
  assert.equal(planner.crafting.makeBeatsBuying(p, job.output.itemId, 10, make.seconds / (MAKE_BIAS - .05)), true,
    'buying a little cheaper still loses to making (the XP)');
  assert.equal(planner.crafting.makeBeatsBuying(p, job.output.itemId, 10, make.seconds / 2), false, 'buying at half: buy');
  const training = planner.crafting.fromBought(p, job.output.itemId, 10, {skill: 'smithing', rate: {xp: 1}});
  assert.ok(training.seconds < make.seconds, 'the XP counts in full while smithing is the goal');
});

test('a direct purchase is declined when making it from bought materials is no dearer', () => {
  const planner = makePlanner(), d = planner.data;
  planner.coinRate = () => 10;
  let clock = 1_000_000_000;
  const market = createMarket(d, planner, {now: () => clock});
  market.configureProcurement({enabled: true});
  const bar = d.jobs.find(j => j.skill === 'smithing' && j.name === 'Bronze bar').output.itemId;
  const p = player(planner, {lastTick: 100000, coins: 1_000_000, levels: {smithing: 20}, x: d.banks[0].x, y: d.banks[0].y, path: null});
  market.receive({tick: 100000, m: [{t: 'welcome', you: p, orders: []}]});
  market.watch(p, [bar], bar);
  assert.deepEqual(market.query(p), {t: 'marketDepth', itemId: bar});
  market.receive({tick: 100001, m: [{t: 'marketDepth', itemId: bar, bids: [], asks: [{price: 50, qty: 500}], trades: []}]});
  planner.acquireEstimate = () => ({seconds: Infinity});
  const goal = {horizon: 36000, budget: {coins: 0, items: {}}};
  planner.crafting.makeBeatsBuying = () => true;
  assert.equal(market.purchase(p, bar, 10, goal, 'melee'), null, 'make it instead');
  planner.crafting.makeBeatsBuying = () => false;
  assert.equal(market.purchase(p, bar, 10, goal, 'melee')?.intent?.t, 'marketBuy');
});
