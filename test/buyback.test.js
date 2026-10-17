import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarket} from '../src/economy/market.js';
import {saleProtectionReason} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

const pickItem = d => d.jobs.map(j => j.output.itemId).find(id => id !== d.coinId && d.items[id]?.value >= 50 && !saleProtectionReason(d, id));
const DAY = 86400000 / 600;

function setup({book = () => ({bids: [], asks: [], trades: []}), ratio = 1.13, boughtQty = 50000} = {}) {
  const planner = makePlanner(), d = planner.data, item = pickItem(d);
  const merchant = Math.max(1, Math.floor(d.items[item].value * .4));
  let clock = 1_000_000;
  const market = createMarket(d, planner, {autoSell: true, now: () => clock});
  const p = player(planner, {lastTick: 100000, coins: 1000, x: d.banks[0].x, y: d.banks[0].y, route: null, path: null});
  market.receive({tick: 100000, m: [{t: 'welcome', you: p, orders: []}]});
  // Last run happened at tick 90000 and bought this item (plus one other).
  const other = d.jobs.map(j => j.output.itemId).find(id => id !== item && d.items[id]?.value > 0);
  const otherMerchant = Math.max(1, Math.floor(d.items[other].value * .4));
  market.setBuyback({purse: 1e8, last: {tick: 90000, coins: Math.round((boughtQty * merchant + 10 * otherMerchant) * ratio),
    items: [{itemId: item, qty: boughtQty}, {itemId: other, qty: 10}]}});
  market.watch(p, [item], item);
  market.query(p);
  market.receive({tick: 100001, m: [{t: 'marketDepth', itemId: item, ...book(merchant)}]});
  return {market, planner, d, item, merchant, p, advance: ms => { clock += ms; }};
}
const net = (price, qty, bp = 200) => price * qty - Math.floor(price * qty * bp / 10000);

test('buyback items are valued at the observed average, within half the daily volume', () => {
  const {market, item, merchant, p} = setup();
  const value = market.opportunity(p, item, 100);
  assert.equal(value.buyback, true);
  assert.equal(value.net, net(Math.round(merchant * 1.13), 100));
  assert.equal(market.opportunity(p, item, 30000).buyback, undefined, 'more than half the daily volume: not counted');
});

test('sale lists under the 1.5x cap and holds until just after the next run', () => {
  const {market, item, merchant, p, d} = setup({book: m => ({bids: [], asks: [{price: m * 3, qty: 50}], trades: []})});
  const floor = merchant;
  const atBank = {...p, bank: {[item]: 300}};
  const plan = market.sale(atBank, {intent: {t: 'marketDump', itemId: item, qty: 300, floor}, label: 'x', reason: 'y'});
  assert.equal(plan.intent.t, 'marketSell');
  assert.equal(plan.intent.price, Math.floor(merchant * 1.5), 'capped at 1.5x merchant');
  assert.equal(plan.buyback.holdUntilTick, 90000 + DAY + 6000, 'next run plus an hour');
  // A cheaper competing ask under the cap: undercut it by one.
  const cheap = setup({book: m => ({bids: [], asks: [{price: m + 5, qty: 50}], trades: []})});
  const plan2 = cheap.market.sale({...cheap.p, bank: {[cheap.item]: 300}}, {intent: {t: 'marketDump', itemId: cheap.item, qty: 300, floor: cheap.merchant}, label: 'x', reason: 'y'});
  assert.equal(plan2.intent.price, cheap.merchant + 4, 'undercuts a cheaper ask below the cap');
});

test('a bid above the buyback average is taken instead', () => {
  const {market, item, merchant, p} = setup({book: m => ({bids: [{price: m * 2, qty: 1000}], asks: [], trades: []})});
  const plan = market.sale({...p, bank: {[item]: 300}}, {intent: {t: 'marketDump', itemId: item, qty: 300, floor: merchant}, label: 'x', reason: 'y'});
  assert.equal(plan.intent.price, merchant * 2);
  assert.equal(plan.buyback, undefined);
});

test('a buyback listing is not re-priced before the run, then released', () => {
  const {market, item, merchant, p, advance} = setup();
  const atBank = {...p, bank: {[item]: 300}};
  const plan = market.sale(atBank, {intent: {t: 'marketDump', itemId: item, qty: 300, floor: merchant}, label: 'x', reason: 'y'});
  market.issued(atBank, plan.intent, plan);
  // The server confirms a new sell order.
  const order = {id: 501, itemId: item, side: 'sell', price: plan.intent.price, qtyTotal: 300, qtyRemaining: 300};
  market.receive({tick: 100010, m: [{t: 'snapshot', you: {...atBank, bank: {}, lastTick: 100010}, orders: [order]}]});
  market.next({...atBank, bank: {}, lastTick: 100010});
  advance(3 * 3600000); // well past the 30-minute review
  const held = market.next({...atBank, bank: {}, lastTick: 100010 + 18000});
  assert.equal(held, null, 'held through the wait');
  const after = market.next({...atBank, bank: {}, lastTick: plan.buyback.holdUntilTick + 1});
  assert.equal(after?.intent?.t, 'marketCancel', 'reviewed after the run');
});

test('an unsold buyback batch goes to the merchant next', () => {
  const {market, item, merchant, p} = setup();
  // Simulate the review record left after an unfilled buyback listing.
  const runtime = market.runtime();
  runtime.saved.players[p.id].sales[item] = {qty: 300, stock: 300, price: Math.floor(merchant * 1.5), listedMs: 9e7, rounds: 1, buyback: true};
  market.runtime(runtime);
  const plan = market.sale({...p, bank: {[item]: 300}}, {intent: {t: 'marketDump', itemId: item, qty: 300, floor: merchant}, label: 'x', reason: 'y'});
  assert.equal(plan.intent.t, 'marketDump');
  assert.match(plan.label, /回购未成交/);
});
