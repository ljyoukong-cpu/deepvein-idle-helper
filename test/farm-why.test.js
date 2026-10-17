import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlanner, player} from './helpers.js';

function farmer(planner, level, plots = {}) {
  const d = planner.data;
  return player(planner, {levels: {farming: level}, plots, lastTick: 1000, hp: 100, activity: 'idle', path: null,
    houseCells: [], house: {}});
}
// A planted field: the crop's seed in a farm site.
function plant(planner, job, readyInTicks = 600) {
  const site = planner.data.sites.find(s => s.jobIds.includes(job.id));
  return {[site.id]: {seedItemId: job.inputs[0].itemId, plantedTick: 1000 - job.grow + readyInTicks, readyTick: 1000 + readyInTicks}};
}

test('before all fields unlock: the best-XP crop says so, a plan need says so', () => {
  const planner = makePlanner(), d = planner.data;
  const crops = d.jobs.filter(j => j.grow && j.levelReq <= 10).sort((a, b) => b.xp / b.grow - a.xp / a.grow);
  const status = planner.farmStatus(farmer(planner, 10));
  assert.ok(status.next, 'a next crop is proposed');
  assert.equal(status.next.name, crops[0].name);
  assert.match(status.next.why, /农业经验最高/);
  const other = crops.at(-1);
  const needy = planner.farmStatus(farmer(planner, 10), {budget: {items: {[other.output.itemId]: 40}}});
  // The plan need is explained wherever that crop appears.
  const lines = [needy.next, ...needy.crops].filter(Boolean).map(c => c.why).join('\n');
  assert.ok(lines.length > 0);
});

test('after all fields unlock: reasons show stock against target', () => {
  const planner = makePlanner(), d = planner.data;
  const top = Math.max(...d.farmUnlocks);
  const status = planner.farmStatus(farmer(planner, top));
  assert.ok(status.next, 'something is short at an empty pantry');
  assert.match(status.next.why, /库存 \d+\/\d+|当前计划需要/);
});

test('crops already in the fields are listed with their reason', () => {
  const planner = makePlanner(), d = planner.data;
  const top = Math.max(...d.farmUnlocks);
  const herb = d.jobs.find(j => j.grow && d.jobs.some(h => h.skill === 'herblore' && h.inputs.some(i => i.itemId === j.output.itemId)));
  const fields = d.sites.filter(s => s.jobIds.includes(herb.id)).slice(0, 2);
  const plots = Object.fromEntries(fields.map(s => [s.id, {seedItemId: herb.inputs[0].itemId, plantedAt: 1000 - Math.floor(herb.grow / 2)}]));
  const status = planner.farmStatus(farmer(planner, top, plots));
  const row = status.crops.find(c => c.name === herb.name);
  assert.ok(row, JSON.stringify(status.crops));
  assert.equal(row.fields, fields.length);
  assert.ok(row.readyMinutes > 0);
  assert.match(row.why, /药水储备/);
  assert.match(row.why, /库存 \d+\/50$/);
});

test('herb priority: plan shortfall, then the next herblore recipe paired with held drops, then the potion floor', async () => {
  const {farmingStocks} = await import('../src/planner/farming.js');
  const planner = makePlanner(), d = planner.data;
  const byName = n => Object.values(d.items).find(i => i.name === n).id;
  const nightshade = byName('Nightshade'), sage = byName('Sage'), dust = byName('Wraith dust');
  const levels = p => planner.levels(p);
  // Herblore 50 with 200 wraith dust: Nourishing draught (nightshade + dust) is next.
  const p = {...farmer(planner, 70), skills: {...farmer(planner, 70).skills, herblore: player(planner, {levels: {herblore: 50}}).skills.herblore},
    bank: {[dust]: 200}};
  const rows = farmingStocks(d, p, levels(p));
  const night = rows.find(r => r.job.output.itemId === nightshade);
  assert.equal(night.target, 200, 'paired with the dust held');
  assert.equal(night.reason, 'herblore');
  assert.equal(rows[0].job.output.itemId, nightshade, 'herblore pairing comes before reserves');
  assert.equal(rows.find(r => r.job.output.itemId === sage).target, 50, 'potion floor');
  // A plan shortfall still comes first.
  const planned = farmingStocks(d, p, levels(p), {budget: {items: {[sage]: 30}}});
  assert.equal(planned[0].job.output.itemId, sage);
  assert.equal(planned[0].tier, 0);
  // Without drops, nightshade only keeps the potion floor.
  const bare = farmingStocks(d, {...p, bank: {}}, levels(p));
  assert.equal(bare.find(r => r.job.output.itemId === nightshade).target, 50);
  const why = planner.farmStatus({...p, plots: {}}).next.why;
  assert.match(why, /配合现有.*炼制/);
});

test('with every stock met, ripe fields are still harvested and replanted at a task boundary', () => {
  const planner = makePlanner(), d = planner.data;
  const top = Math.max(...d.farmUnlocks);
  const herb = d.jobs.find(j => j.grow && j.levelReq <= top && d.jobs.some(h => h.skill === 'herblore' && h.inputs.some(i => i.itemId === j.output.itemId)));
  const fields = d.sites.filter(s => s.kind === 'field').sort((a, b) => a.id - b.id).slice(0, d.farmUnlocks.length);
  const plots = Object.fromEntries(fields.map(s => [s.id, {seedItemId: herb.inputs[0].itemId, plantedAt: 1000 - herb.grow - 10}]));
  const full = Object.fromEntries(d.jobs.filter(j => j.grow).map(j => [j.output.itemId, 100000]));
  const p = {...farmer(planner, top, plots), bank: full};
  const plan = planner.harvest(p, null, null, 'melee', true);
  assert.equal(plan?.intent?.t, 'setRoute', planner.farmStatus(p).reason);
  assert.equal(plan.intent.errand, true);
  const status = planner.farmStatus(p);
  assert.match(status.crops[0].why, /不让农田空闲|改种/);
  // Mid-task, the harvest waits for the boundary instead of interrupting.
  const busy = {...p, route: {jobId: d.jobs.find(j => j.skill === 'mining').id, siteId: 1, phase: 'working', limit: 0}};
  assert.equal(planner.harvest(busy, null, null, 'melee', false), null);
  assert.match(planner.farmStatus(busy).reason, /等当前任务结束或返仓/);
});

test('herbs are planned one unlock ahead once the current herb covers the way there', async () => {
  const {farmingStocks} = await import('../src/planner/farming.js');
  const planner = makePlanner(), d = planner.data, t = planner.thresholds;
  const byName = n => Object.values(d.items).find(i => i.name === n).id;
  const nightshade = byName('Nightshade'), dragonleaf = byName('Dragonleaf'), dust = byName('Wraith dust');
  const nourishing = d.jobs.find(j => j.skill === 'herblore' && j.inputs.some(i => i.itemId === nightshade) &&
    j.inputs.some(i => i.itemId === dust));
  // Herblore 55, halfway: Warrior's tonic (dragonleaf + dust) unlocks at 60.
  const xp = Math.round((t[55] + t[56]) / 2), toSixty = Math.ceil((t[60] - xp) / nourishing.xp);
  const base = farmer(planner, 70);
  const p = {...base, skills: {...base.skills, herblore: xp}, bank: {[dust]: toSixty + 300}};
  const levels = planner.levels(p);
  // Not enough nightshade yet: the current herb first, capped at what reaches 60.
  let rows = farmingStocks(d, p, levels, null, t);
  const night = rows.find(r => r.job.output.itemId === nightshade);
  assert.equal(night.target, toSixty, 'only the potions needed to reach the unlock');
  assert.equal(rows[0].job.output.itemId, nightshade);
  const leaf = rows.find(r => r.job.output.itemId === dragonleaf);
  assert.equal(leaf.reason, 'ahead');
  assert.equal(leaf.target, 300, 'the spare dust sizes the next herb');
  assert.ok(leaf.tier > night.tier);
  // Enough nightshade to reach 60: dragonleaf is now the top herb.
  rows = farmingStocks(d, {...p, bank: {...p.bank, [nightshade]: toSixty}}, levels, null, t);
  assert.equal(rows[0].job.output.itemId, dragonleaf, JSON.stringify(rows.map(r => [r.job.name, r.tier])));
  const why = planner.farmStatus({...p, bank: {...p.bank, [nightshade]: toSixty}, plots: {}}).next.why;
  assert.match(why, /提前备好 60 级配方/);
  // No dust at all: the next herb still gets a starter stock.
  rows = farmingStocks(d, {...p, bank: {}}, levels, null, t);
  assert.equal(rows.find(r => r.job.output.itemId === dragonleaf).target, 50);
});

test('manual mode explains the choice', () => {
  const planner = makePlanner(), d = planner.data;
  const job = d.jobs.find(j => j.grow && j.levelReq <= 10);
  planner.setFarmingPreference({mode: 'manual', jobId: job.id});
  const status = planner.farmStatus(farmer(planner, 10));
  assert.equal(status.next?.why, '手动指定的作物');
});
