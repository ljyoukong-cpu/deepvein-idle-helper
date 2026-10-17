# Roadmap

`npm run build` regenerates the published userscripts from `src/`. `npm test` runs the unit tests. The engine tests also need a local copy of the public client: `DVI_CLIENT=path/to/index-XXXX.js npm test`. The game's code is never committed.

## Done in v0.8.0 (not yet tested on a live account)

| Area | What changed | Where |
|---|---|---|
| Build | Split into ES modules; parity with v0.7.17 verified by AST comparison, a Worker replay and a jsdom smoke test | `src/`, `scripts/build.mjs` |
| Engine | The game's tick engine is extracted at runtime by name-independent fingerprints, checked for purity and size, smoke-tested, cached per client build, and run in the planning Worker. Every monster and unlocked job is simulated for 1 h from the real character and fed into the existing calibration path. Real measurements win; a simulated death zeroes a route; any failure falls back to formulas | `src/engine/*`, `src/worker/planning.js` |
| Dailies | Mandatory: no time cap and no coin threshold; quickest first; applies in fixed-trade mode too; a hot window delays them only until urgent; input chains are priced so cheap market inputs beat long unlocks | `src/planner/quests.js`, `src/runtime/trainer.js` |
| Quest board | Free reroll only for an impossible, unstarted daily; quest points go to the perk with the best measured gain per point. Both are soft actions: a refusal disables them for 6 h | `src/planner/quests.js`, `src/planner/perks.js` |
| Mastery | Engine counts earned points and simulates the gain per point for each track; greedy allocation; offline hours are never bought | `src/engine/mastery*.js` |
| Boss | The helper's own walks yield to a Boss; `bossNext` is tracked, and no home trip starts within 5 min of a spawn | `src/runtime/world-boss.js` |
| Gear | Payback is judged over wear time (until the next tier, 30 min–24 h) instead of 30 min | `src/planner/planner.js` |
| Objectives | 经验优先 gains a profit floor; business income counts sellable monster drops | `src/planner/strategy.js`, `src/planner/specialization.js` |
| Fixes | Enhance chance now includes the Enhancing level factor | `src/planner/inventory.js` |

## Before release

- **Live test on a real account.** Watch three things:
  - the 数据 status line shows "引擎模拟已启用";
  - dailies finish, including one that needs a bought input;
  - one reroll, one perk purchase and one mastery allocation are each confirmed. Then check the 诊断 tab for refusals.
- **Boss loot log.** Client 1.0.1189 pays world-boss shares over 30 s. Check that 掉落 still records exactly one entry per kill (`src/ui/boss-loot.js`).
- **Distribution.** The update and download URLs still point to `ljyoukong-cpu/deepvein-idle-helper`. Decide where v0.8.0 is published before pushing.

## Open: decide what to include next

- **Upgrade recipes** (`{t:"upgrade", recipeId, itemId}`): Drakestring and Emberwood at Fletching 95, the Abyssweave set at Crafting 99, Colossus pieces. This needs the upgrade table extracted (the engine already contains it), planner support, and validation.
- **Crafting orders** (`order*`): tips as a new source of income and XP.
- **Gear resale value** in the upgrade cost; market buys of + / rarity variants priced with the engine.
- **Engine-based food and kill time.** Calibration currently replaces XP and gold rates only. Simulated seconds per kill and food per hour could also replace the formula's combat time and food logistics.
- **Profit profile everywhere.** Value combat drops in all modes, not only 主业经营 / the profit floor.
- **Hot-window planning.** The hot-skill schedule is deterministic (`hotSkill(tick)`), so batches could be scheduled into upcoming XP or rarity windows.
- **Drift alarm.** Hash each fingerprinted function and warn when a game update changes one, so the simulation gets re-checked.
