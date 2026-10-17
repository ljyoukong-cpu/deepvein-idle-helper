import test from 'node:test';
import assert from 'node:assert/strict';
import {createEconomy} from '../src/economy/economy.js';
import {reviewInventory} from '../src/planner/inventory.js';
import {makePlanner, player} from './helpers.js';

function setup() {
  const planner = makePlanner(), d = planner.data;
  const copper = d.jobs.find(j => j.skill === 'mining' && j.levelReq === 1 && !j.inputs.length);
  const ore = copper.output.itemId;
  const sold = [];
  planner.marketSale = (p, vendor) => { sold.push(vendor); return vendor; };
  const economy = createEconomy(d, planner, {autoSell: false, capacitySales: true});
  const bank = d.banks[0];
  const p = player(planner, {levels: {mining: 10}, x: bank.x, y: bank.y, bank: {[ore]: 400}, coins: 100, hp: 100,
    activity: 'idle', path: null, held: false});
  return {economy, p, copper, ore, sold};
}

test('everyday selling off: the profit task output is still sold', () => {
  const {economy, p, copper, ore, sold} = setup();
  const goal = {skill: 'mining', recipeId: copper.id, target: 11, budget: {items: {}, coins: 0}, saleItems: [ore]};
  const plan = economy.maintenance(p, goal, 'melee', 'business');
  assert.ok(sold.length > 0, 'a sale was considered');
  assert.equal(sold[0].intent.itemId, ore);
  assert.equal(sold[0].profitSale, true);
  assert.ok(sold[0].intent.qty <= 400 - 50, 'working stock kept');
  assert.equal(plan?.profitSale, true);
});

test('crafted surplus is sold by default; higher rarities and gathered goods are kept', () => {
  const planner = makePlanner(), d = planner.data;
  const smelt = d.jobs.find(j => j.skill === 'smithing' && j.levelReq === 1 && j.inputs.length);
  const bar = smelt.output.itemId, rareBar = bar + 2 * d.rarityScale;
  const ore = smelt.inputs[0].itemId;
  const sold = [];
  planner.marketSale = (p, vendor) => { sold.push(vendor); return vendor; };
  const bank = d.banks[0];
  const p = player(planner, {levels: {smithing: 10, mining: 10}, x: bank.x, y: bank.y,
    bank: {[bar]: 400, [rareBar]: 30, [ore]: 400}, coins: 100, hp: 100, activity: 'idle', path: null, held: false});
  const goal = {skill: 'smithing', recipeId: smelt.id, target: 11, budget: {items: {}, coins: 0}};
  createEconomy(d, planner, {autoSell: false}).maintenance(p, goal, 'melee', 'balanced');
  assert.equal(sold.length, 1, JSON.stringify(sold.map(s => s.intent)));
  assert.equal(sold[0].intent.itemId, bar, 'common crafted bars are sold');
  assert.ok(sold[0].intent.qty <= 350, 'working stock kept');
  assert.equal(sold[0].profitSale, true);
  // Turned off: nothing is sold.
  const none = [];
  planner.marketSale = (p2, vendor) => { none.push(vendor); return vendor; };
  createEconomy(d, planner, {autoSell: false, sellCrafted: false}).maintenance(p, goal, 'melee', 'balanced');
  assert.equal(none.length, 0);
});

test('crafted gear: only one copy of the highest rarity that could be an upgrade is kept', () => {
  const planner = makePlanner(), d = planner.data, R = d.rarityScale;
  const piece = d.gear.find(g => g.slot === 'helmet' && (!g.style || g.style === 'melee') &&
    d.jobs.some(j => j.skill === 'smithing' && j.output.itemId === g.itemId));
  const id = piece.itemId, bank = d.banks[0];
  const p = player(planner, {levels: {smithing: 1, defence: 1}, x: bank.x, y: bank.y,
    bank: {[id]: 3, [id + R]: 2, [id + 2 * R]: 2}, coins: 100, hp: 100, activity: 'idle', path: null, held: false});
  const rows = Object.fromEntries(reviewInventory(d, planner, p, null, 'melee').items.map(r => [r.itemId, r]));
  assert.equal(rows[id + 2 * R].keep, 1, 'one copy of the best rarity');
  assert.equal(rows[id + 2 * R].sell, 1, 'its duplicate is surplus');
  assert.equal(rows[id + R].sell, 2, 'lower rarity is surplus');
  assert.equal(rows[id].sell, 3, 'common is surplus');
  // Every style keeps its own best piece, and the wearable-now lower-level
  // piece is kept beside a higher one that cannot be worn yet.
  const helmets = d.gear.filter(g => g.slot === 'helmet' && g.style === 'melee' &&
    d.jobs.some(j => j.skill === 'smithing' && j.output.itemId === g.itemId)).sort((a, b) => a.levelReq - b.levelReq);
  const low = helmets[0], high = helmets.at(-1);
  const magic = d.gear.find(g => g.slot === 'helmet' && g.style === 'magic');
  const mixed = Object.fromEntries(reviewInventory(d, planner, {...p, bank: {[low.itemId]: 2, [high.itemId]: 2, [magic.itemId]: 2}},
    null, 'melee').items.map(r => [r.itemId, r]));
  assert.equal(mixed[low.itemId].keep, 1, 'wearable lower-level piece kept');
  assert.equal(mixed[high.itemId].keep, 1, 'highest piece kept for later');
  assert.equal(mixed[magic.itemId].keep, 1, 'other style keeps its own best');
  const levelled = Object.fromEntries(reviewInventory(d, planner,
    {...p, skills: {...p.skills, melee: player(planner, {levels: {melee: 99}}).skills.melee},
      bank: {[low.itemId]: 2, [high.itemId]: 2}}, null, 'melee').items.map(r => [r.itemId, r]));
  assert.equal(levelled[low.itemId].keep, 0, 'once the better piece can be worn, the old one is surplus');
  // A legendary copy outranks everything and is itself never sold.
  const legendary = id + (d.rarityMultipliers.length - 1) * R;
  const withLegendary = reviewInventory(d, planner, {...p, bank: {...p.bank, [legendary]: 1}}, null, 'melee').items;
  assert.equal(withLegendary.find(r => r.itemId === legendary).sell, 0);
  assert.equal(withLegendary.find(r => r.itemId === id + 2 * R).sell, 2);
  // The economy sells the rarity copies through the market-only path.
  const sold = [];
  planner.marketSale = (q, vendor) => { sold.push(vendor); return vendor; };
  const rareOnly = {...p, bank: {[id + R]: 2, [id + 2 * R]: 1}};
  createEconomy(d, planner, {autoSell: false}).maintenance(rareOnly, {skill: 'smithing', target: 2, budget: {items: {}, coins: 0}}, 'melee', 'balanced');
  assert.ok(sold.some(s => s.intent.itemId === id + R && s.profitSale), JSON.stringify(sold.map(s => s.intent)));
});

test('everyday selling off and no profit goal: nothing is sold', () => {
  const {economy, p, copper, sold} = setup();
  const goal = {skill: 'mining', recipeId: copper.id, target: 11, budget: {items: {}, coins: 0}};
  economy.maintenance(p, goal, 'melee', 'experience');
  assert.equal(sold.length, 0);
});
