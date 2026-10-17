import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarket} from '../src/economy/market.js';
import {saleProtectionReason} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

function setup() {
  const planner = makePlanner(), d = planner.data;
  const item = d.jobs.map(j => j.output.itemId).find(id => id !== d.coinId && d.items[id]?.value >= 20 && !saleProtectionReason(d, id));
  planner.coinRate = () => 10;
  let clock = 1_000_000_000;
  const market = createMarket(d, planner, {now: () => clock});
  market.configureProcurement({enabled: true});
  const p = player(planner, {lastTick: 100000, coins: 100000, x: d.banks[0].x, y: d.banks[0].y, route: null, path: null});
  market.receive({tick: 100000, m: [{t: 'welcome', you: p, orders: []}]});
  const feed = rows => ({generatedAt: new Date(clock).toISOString(), refreshSeconds: 300, items: rows});
  return {market, p, item, d, feed, advance: ms => { clock += ms; }};
}
const net = (price, qty) => price * qty - Math.floor(price * qty * 200 / 10000);

test('without a live book, sales are valued at the feed bid its buyers can take', () => {
  const {market, p, item, d, feed} = setup();
  const merchant = Math.floor(d.items[item].value * .4) * 10;
  assert.equal(market.opportunity(p, item, 10).net, merchant, 'no feed: merchant');
  const bid = Math.floor(d.items[item].value * 2);
  assert.equal(market.setPriceFeed(feed({[item]: {lowestSell: bid * 2, sellQty: 50, highestBuy: bid, buyQty: 500}})), true);
  const value = market.opportunity(p, item, 10);
  assert.equal(value.net, net(bid, 10));
  assert.equal(value.feed, true);
  market.setPriceFeed(feed({[item]: {lowestSell: bid * 2, sellQty: 50, highestBuy: bid, buyQty: 5}}));
  assert.equal(market.opportunity(p, item, 10).net, merchant, 'buyers cannot take 10');
});

test('a stale or far-off feed is ignored', () => {
  const {market, p, item, d, feed, advance} = setup();
  const bid = Math.floor(d.items[item].value * 2);
  market.setPriceFeed(feed({[item]: {lowestSell: null, sellQty: 0, highestBuy: bid, buyQty: 500}}));
  advance(16 * 60000);
  assert.equal(market.opportunity(p, item, 10).feed, undefined, 'older than 15 minutes');
  assert.equal(market.setPriceFeed({generatedAt: '2020-01-01T00:00:00Z', items: {}}), false, 'an old cached copy');
});

test('buy-vs-make reads the feed ask, and an order still waits for the live book', () => {
  const {market, p, item, feed} = setup();
  assert.equal(market.marketUnitCost(p, item, 5), Infinity, 'unknown price');
  market.setPriceFeed(feed({[item]: {lowestSell: 300, sellQty: 50, highestBuy: null, buyQty: 0}}));
  assert.equal(market.marketUnitCost(p, item, 5), 30, 'ask / coin rate');
  assert.equal(market.marketUnitCost(p, item, 60), Infinity, 'not enough on sale');
  const plan = market.purchase(p, item, 5, {horizon: 3600, budget: {coins: 0, items: {}}});
  assert.notEqual(plan?.intent?.t, 'marketBuy', 'no order from feed prices alone');
  assert.deepEqual(market.query(p), {t: 'marketDepth', itemId: item}, 'the live book is requested first');
});

test('the equipment scan takes candidates from the feed without queuing book queries', () => {
  const {market, p, d, feed} = setup();
  const gear = d.gear.find(g => g.slot === 'helmet').itemId;
  market.setPriceFeed(feed({[gear]: {lowestSell: 5000, sellQty: 2, highestBuy: null, buyQty: 0}, [gear + d.rarityScale]: {lowestSell: null, sellQty: 0, highestBuy: 10, buyQty: 1}}));
  const found = market.watchPurchases(p, [gear, gear + d.rarityScale, gear + 2 * d.rarityScale]);
  assert.deepEqual(found.map(f => [f.itemId, f.ask]), [[gear, 5000]]);
  const q = market.query(p);
  assert.ok(!q || q.t !== 'marketBooks' || q.itemIds.every(id => id === gear + 2 * d.rarityScale), JSON.stringify(q));
});
