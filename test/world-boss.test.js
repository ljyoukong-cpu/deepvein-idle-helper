import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorldBoss} from '../src/runtime/world-boss.js';

const data = {tickMs: 600};
function setup() {
  let clock = 1_000_000;
  const boss = createWorldBoss(data, () => clock);
  const you = {id: 1, x: 100, y: 100, lastTick: 1000, route: null, queue: [], pack: [], bank: {}};
  boss.observe({tick: 1000, m: [{t: 'snapshot', you}]});
  return {boss, you, advance: ms => { clock += ms; }};
}
const rise = (boss, until = 1000 + 1000) => boss.observe({tick: 1001, m: [{t: 'bossRose', name: 'Vein colossus', x: 120, y: 100, until}]});

test('working on a route: Boss parks the task immediately (setAside)', () => {
  const {boss, you} = setup();
  rise(boss);
  const plan = boss.next({...you, route: {jobId: 1, siteId: 1}});
  assert.equal(plan.intent.t, 'setAside');
});

test("the helper's own walk is interrupted for a Boss", () => {
  const {boss, you} = setup();
  rise(boss);
  const walking = {...you, activity: 'walking', path: [{x: 101, y: 100}]};
  assert.equal(boss.next(walking), null, 'default: walking is not interrupted (assist mode)');
  const plan = boss.next(walking, {interruptWalk: true});
  assert.deepEqual(plan.intent, {t: 'walk', x: 117, y: 97}, 'a tile three steps from the Boss on our side, not its own tile');
});

test('a walk that finds no path tries another tile near the Boss instead of giving up', () => {
  const {boss, you, advance} = setup();
  rise(boss, 1000 + 100000);
  const tried = [];
  let p = {...you, activity: 'idle', path: null};
  for (let i = 0; i < 8; i++) {
    const plan = boss.next(p, {interruptWalk: true});
    assert.equal(plan.intent.t, 'walk', plan.reason);
    const {x, y} = plan.intent;
    assert.ok(Math.max(Math.abs(x - 120), Math.abs(y - 100)) <= 3 && (x !== 120 || y !== 100));
    tried.push(`${x},${y}`);
    boss.issued(plan.intent, p, plan.reason);
    // The game found no path: the player stays idle where it was.
    advance(6000); boss.observe({tick: 1002 + i, m: [{t: 'snapshot', you: p}]});
  }
  assert.equal(new Set(tried).size, 8, 'eight different tiles');
  assert.equal(boss.next(p, {interruptWalk: true}).intent.t, 'leaveWorldBoss', 'then the round is given up');
});

test('a player queue is still never overridden', () => {
  const {boss, you} = setup();
  rise(boss);
  assert.equal(boss.next({...you, queue: [{kind: 'quest'}]}, {interruptWalk: true}), null);
});

// Tag mode: reach the boss, land a confirmed hit, leave.
function tagRound(boss, you, until, tick) {
  boss.setParticipation('tag');
  boss.observe({tick, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until}]});
  const p = {...you, x: 100, y: 100};
  const join = boss.next(p, {interruptWalk: true});
  assert.equal(join.intent.t, 'attackWorldBoss');
  boss.issued(join.intent, p);
  boss.observe({tick: tick + 1, m: [{t: 'raidHit', damage: 5}]});
  const leave = boss.next(p, {interruptWalk: true});
  assert.equal(leave.intent.t, 'leaveWorldBoss');
  boss.issued(leave.intent, p, 'tagged');
  boss.next(p, {interruptWalk: true}); // run ends, no saved queue
  return p;
}

test('tag mode: a tagged round reports participation, not "skipped"', () => {
  const {boss, you} = setup();
  const p = tagRound(boss, you, 3000, 1001);
  const status = boss.status();
  assert.equal(status.skipped, false, 'not shown as skipped');
  assert.equal(status.participated, true);
  assert.equal(boss.next(p, {interruptWalk: true}), null, 'does not rejoin the same round');
});

test('tag mode: the next spawn is joined even if the boss entity id repeats', () => {
  const {boss, you} = setup();
  // Round 1 is first seen as an entity (no end time yet) and tagged before any announcement.
  boss.setParticipation('tag');
  boss.observe({tick: 1001, m: [{t: 'enter', player: {kind: 'boss', name: 'Vein colossus', x: 100, y: 100, id: 77, hpRemaining: 500}}]});
  boss.manualAction({t: 'leaveWorldBoss'}); // player left this round
  boss.observe({tick: 1002, m: [{t: 'bossGone'}]});
  // Round 2: same boss type, same entity id, then the announcement.
  boss.observe({tick: 5000, m: [{t: 'enter', player: {kind: 'boss', name: 'Vein colossus', x: 100, y: 100, id: 77, hpRemaining: 500}}]});
  boss.observe({tick: 5001, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until: 9000}]});
  assert.equal(boss.status().skipped, false);
  const plan = boss.next({...you, lastTick: 5001, x: 100, y: 100}, {interruptWalk: true});
  assert.equal(plan?.intent.t, 'attackWorldBoss', 'joins the new round');
});

test('a player-summoned boss right after a scheduled round is joined', () => {
  const {boss, you} = setup();
  const p = tagRound(boss, you, 3000, 1001); // scheduled round tagged and left
  // Same boss type, summoned by a player before the first one is even gone.
  boss.observe({tick: 1500, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until: 4200, sponsor: 'SomePlayer'}]});
  assert.equal(boss.status().skipped, false);
  assert.equal(boss.status().participated, false);
  assert.equal(boss.next({...p, lastTick: 1500}, {interruptWalk: true})?.intent.t, 'attackWorldBoss');
});

test('after a reload, the round already done stays done; the next one is joined', () => {
  const {boss, you} = setup();
  tagRound(boss, you, 3000, 1001);
  const saved = boss.save();
  const again = createWorldBoss(data, () => 2_000_000);
  again.restore(saved);
  again.observe({tick: 1100, m: [{t: 'snapshot', you: {...you, lastTick: 1100}}]});
  again.observe({tick: 1101, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until: 3000}]});
  assert.equal(again.next({...you, lastTick: 1101, x: 100, y: 100}, {interruptWalk: true}), null, 'same round: not rejoined');
  again.observe({tick: 3100, m: [{t: 'bossGone'}]});
  again.observe({tick: 5000, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until: 8000}]});
  assert.equal(again.next({...you, lastTick: 5000, x: 100, y: 100}, {interruptWalk: true})?.intent.t, 'attackWorldBoss');
});

test('a skipped round does not survive a page reload into the next spawn', () => {
  const {boss, you} = setup();
  tagRound(boss, you, 3000, 1001);
  const saved = boss.save();
  const fresh = createWorldBoss(data, () => 2_000_000);
  fresh.restore(saved);
  fresh.observe({tick: 6000, m: [{t: 'snapshot', you: {...you, lastTick: 6000}}]});
  fresh.observe({tick: 6001, m: [{t: 'bossRose', name: 'Vein colossus', x: 100, y: 100, until: 9000}]});
  const plan = fresh.next({...you, lastTick: 6001, x: 100, y: 100}, {interruptWalk: true});
  assert.equal(plan?.intent.t, 'attackWorldBoss');
});

test('bossNext is exposed as seconds until the next spawn', () => {
  const {boss} = setup();
  boss.observe({tick: 1002, m: [{t: 'bossNext', tick: 1002 + 500}]});
  assert.ok(Math.abs(boss.status().nextIn - 300) < 1, `${boss.status().nextIn}`);
  boss.observe({tick: 1600, m: []});
  assert.equal(boss.status().nextIn, null, 'past spawns report null');
});

test('changing task or walking before departure keeps the round open; a takeover mid-round skips it', () => {
  const {boss, you} = setup();
  rise(boss, 1000 + 100000);
  boss.manualAction({t: 'walk', x: 1, y: 1}, you);
  assert.equal(boss.status().skipped, false, 'not joined yet: still open');
  assert.ok(boss.next(you, {interruptWalk: true})?.intent, 'the helper still joins');
  boss.manualAction({t: 'setRoute', jobId: 1, siteId: 1}, {...you, raidHeld: true});
  assert.equal(boss.status().skipped, true, 'the player took over a round in progress');
});

test('a best-quality task saved for the Boss may come back at another quality', () => {
  const {boss, you} = setup();
  rise(boss, 1000 + 100000);
  const working = {...you, route: {zoneId: null, jobId: 5, siteId: 2, onFull: 'bank', limit: 40, best: true}, workRarity: 0};
  const plan = boss.next(working);
  assert.equal(plan.intent.t, 'setAside');
  boss.issued(plan.intent, working, plan.reason);
  const saved = {...you, route: null, held: true, raidHeld: true,
    queue: [{kind: 'job', siteId: 2, jobId: 5, onFull: 'bank', limit: 40, rarity: 2, best: true}]};
  boss.observe({tick: 1002, m: [{t: 'snapshot', you: saved}]});
  assert.notEqual(boss.next(saved)?.blocked, true);
  assert.equal(boss.ownsQueue(saved), true, 'native best banking changed the quality; the save is still ours');
});

test('the Boss is checked before ordinary waits: a pending walk does not delay joining', async () => {
  const {Trainer} = await import('../src/runtime/trainer.js');
  const {makePlanner, player} = await import('./helpers.js');
  const planner = makePlanner(), sent = [];
  let clock = 1_000_000;
  const t = new Trainer(planner.data, planner, intent => sent.push(intent), () => clock);
  const p = player(planner, {x: 100, y: 100, lastTick: 1000, route: null, queue: [], path: null, activity: 'idle'});
  Object.assign(t, {active: true, compatible: true, player: p, received: clock, awaitInitial: false,
    snapshotSequence: 1, syncAfter: 1, nextSync: clock + 60000, nextAction: clock + 4000,
    pending: {intent: {t: 'walk', x: 50, y: 50}, label: '回仓', before: p, sentAt: clock}});
  t.boss.observe({tick: 1000, m: [{t: 'snapshot', you: p}]});
  t.boss.observe({tick: 1001, m: [{t: 'bossRose', name: 'Vein colossus', x: 120, y: 100, until: 100000}]});
  t.tick();
  assert.equal(sent.at(-1)?.t, 'walk', JSON.stringify(sent));
  assert.notDeepEqual(sent.at(-1), {t: 'walk', x: 50, y: 50}, 'heading to the Boss, not the old walk');
  assert.equal(t.pending, null, 'the pending walk was replaced');
});

test('the player\'s time window and per-round skip chance gate joining; one draw per round', async () => {
  const {createWorldBoss} = await import('../src/runtime/world-boss.js');
  let clock = new Date(2026, 9, 17, 3, 0).getTime(), roll = 0.9;
  const boss = createWorldBoss(data, () => clock, {random: () => roll});
  const you = {id: 1, x: 120, y: 100, lastTick: 1000, route: null, queue: [], pack: [], bank: {}};
  boss.observe({tick: 1000, m: [{t: 'snapshot', you}]});
  boss.observe({tick: 1001, m: [{t: 'bossRose', name: 'Vein colossus', x: 120, y: 100, until: 1e9}]});
  boss.setAutomation({bossStart: '08:00', bossEnd: '24:00'});
  assert.equal(boss.next(you), null, '03:00 is outside 08:00–24:00');
  assert.match(boss.status().policyReason, /参战时段/);
  clock = new Date(2026, 9, 17, 9, 0).getTime();
  boss.setAutomation({bossStart: '08:00', bossEnd: '24:00', skipPercent: 50});
  assert.equal(boss.next(you)?.intent?.t, 'attackWorldBoss', 'a 0.9 roll is not below 50%: join');
  roll = 0.1;
  assert.equal(boss.next(you)?.intent?.t, 'attackWorldBoss', 'the same round keeps its first draw');
  const saved = createWorldBoss(data, () => clock, {random: () => 0.1});
  saved.restore(boss.save());
  saved.setAutomation({bossStart: '22:00', bossEnd: '02:00'});
  clock = new Date(2026, 9, 17, 1, 0).getTime();
  saved.observe({tick: 2000, m: [{t: 'snapshot', you}]});
  saved.observe({tick: 2001, m: [{t: 'bossRose', name: 'Vein colossus', x: 120, y: 100, until: 2e9}]});
  assert.equal(saved.next(you)?.intent?.t, 'attackWorldBoss', '01:00 is inside a window across midnight');
});
