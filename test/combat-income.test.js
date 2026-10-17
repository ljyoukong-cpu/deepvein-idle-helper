import test from 'node:test';
import assert from 'node:assert/strict';
import {combatDrops, combatEstimate} from '../src/planner/estimates.js';
import {createSpecialization} from '../src/planner/specialization.js';
import {data, makePlanner, player} from './helpers.js';

test('combat drops cover every drop rarity, the bonus item and shards', () => {
  const d = data(), m = d.monsters.find(x => x.name === 'Ice wight');
  const drops = combatDrops(d, m, 0, .1);
  const normal = [0, 1, 2, 3, 4].reduce((n, t) => n + (drops[m.drop + t * d.rarityScale] ?? 0), 0);
  assert.ok(Math.abs(normal - m.dropChance) < 1e-12, 'all rarities of the normal drop sum to dropChance');
  assert.equal(drops[m.bonus.itemId], m.bonus.chance);
  assert.equal(drops[d.shardId], .1);
});

test('combatEstimate reports drops alongside gold', () => {
  const d = data(), m = d.monsters[0];
  const e = combatEstimate(d, m, {style: 'melee', level: 50, accuracy: 0, strength: 0, defence: 0, defenceLevel: 50, speed: 4});
  assert.ok(e.drops[m.drop] > 0);
  assert.equal(e.coins, (m.gold[0] + m.gold[1]) / 2);
});

test('business income counts sellable monster drops at bid, skips unquoted ones', () => {
  const planner = makePlanner(), d = planner.data;
  const m = d.monsters.find(x => x.dropChance == null);
  const asked = [];
  planner.marketOpportunity = (p, id, qty) => { asked.push(id); return id === m.drop ? {net: qty * 100, qty} : null; };
  const spec = createSpecialization(d, planner);
  const p = player(planner);
  const kills = 100;
  const candidate = {skill: 'melee', monsterId: m.id, kills, drops: combatDrops(d, m, 0, 0),
    estimate: {coins: 5000, seconds: 1000, xp: 1}, rate: {xp: .001, coins: 5}};
  const [choice] = spec.incomeChoices(p, [candidate], 'melee');
  const commonDrops = Math.floor(candidate.drops[m.drop] * kills);
  assert.equal(choice.marketProceeds, commonDrops * 100);
  assert.equal(choice.rate.coins, (5000 + commonDrops * 100) / 1000);
  assert.ok(asked.includes(m.drop));
});
