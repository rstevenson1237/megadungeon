# Megadungeon: Systems Closeout Audit

Oct 2, 2026 · Task 3.11

This audit lists every acceptance criterion of the nine specs, base and Addendum A, and says where each one stands at the end of Phase 3. Each criterion is in one of three states.

- **Built and tested:** the rule is in code, and the named tests prove it. They run on every change in CI.
- **Stubbed:** the system is built and tested on stub content. The named Phase 4 task supplies the real content, and the criterion then holds on that content too.
- **Phase 4:** the criterion can only be met by the named Phase 4 task.

Every criterion below has an owner. Test files are in `tests/`; the browser smoke test is `e2e/smoke.spec.ts`.

## Summary

| Spec | Criteria | Built and tested | Stubbed | Phase 4 |
| --- | --- | --- | --- | --- |
| 01 Rendering and UI shell | 14 | 14 | 0 | 0 |
| 02 Dungeon generation | 14 | 13 | 1 | 0 |
| 03 Character system | 12 | 11 | 1 | 0 |
| 04 Combat and magic | 11 | 11 | 0 | 0 |
| 05 Items, treasure and inventory | 9 | 9 | 0 | 0 |
| 06 Features, traps and lore | 8 | 8 | 0 | 0 |
| 07 Villages and economy | 9 | 9 | 0 | 0 |
| 08 Content tables | 6 | 5 | 0 | 1 |
| 09 Save, load and run | 9 | 9 | 0 | 0 |
| **Total** | **92** | **89** | **2** | **1** |

Beyond the criteria, the plan gives Phase 4 the following work, so it is owned and not left open:

- Content to launch minimums: tasks 4.2 to 4.9.
- The level 100 set piece and the real final boss: task 4.10.
- Balance: task 4.11.
- Chrome, Firefox and Safari checks: task 4.12.
- The release policy for saves across content changes: decided at the Content complete gate.

## Spec 01: Rendering and UI shell

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) Creation lists all 20 classes with their dice, ability and gear, takes a typed or random name, and starts and saves a run. | Built and tested | `creation.test.ts`; `class-scenarios.test.ts` (all 20 through the screen); `e2e/smoke.spec.ts` |
| (A) Z stops on each listed interruption and when a die returns, and refuses with nothing to wait for. | Built and tested | `wait-look.test.ts` |
| (A) L describes visible, remembered and unseen cells and costs no round. | Built and tested | `wait-look.test.ts` |
| The 100 x 40 grid fills the viewport with its aspect kept, and glyphs stay crisp at any window size. | Built and tested | `ui-grid.test.ts` (fitScale, integer scaling) |
| Every glyph in the core table renders with the correct CP437 code. | Built and tested | `ui-grid.test.ts` (core glyph table) |
| The three panes draw at the sizes in Screen grid and panes, with box-drawing borders. | Built and tested | `ui-panes.test.ts` (pane layout) |
| WASD and arrows move the player; every key in the key map does its action or logs "not yet available". | Built and tested | `ui-input.test.ts`; since task 3.9 every key acts and none logs "not yet available" |
| The camera follows the player and clamps at level edges on a level larger than the view. | Built and tested | `map-view.test.ts` (camera) |
| Unseen, remembered and visible cells draw in their three distinct styles. | Built and tested | `map-view.test.ts` (three cell states) |
| The character pane shows every block in order from test data. | Built and tested | `ui-panes.test.ts`; `character-state.test.ts` (real state); `e2e/smoke.spec.ts` (a Priest's pane in the browser) |
| The log colours by type, collapses repeats, wraps, and the history overlay scrolls 200 lines. | Built and tested | `ui-panes.test.ts` (message log); `ui-input.test.ts` (overlays) |
| Targeting selects the closest target, cycles both ways, cancels with no turn spent, and previews an area footprint. | Built and tested | `targeting.test.ts` |
| Each overlay opens, takes keyboard input, and closes with Esc. | Built and tested | `ui-input.test.ts` (overlays); `ui-items.test.ts`; `ui-features.test.ts`; `ui-town.test.ts` |
| A redraw after one move repaints only the changed cells. | Built and tested | `ui-grid.test.ts` (Renderer: repaints only the changed cells) |

## Spec 02: Dungeon generation

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) The generation criteria are checked over 10,000 seeds with one level each, plus every level 1 to 100 of 100 seeds. | Built and tested | `placement-sweep-1.test.ts` to `placement-sweep-4.test.ts`; `placement-every-level-1.test.ts` to `placement-every-level-4.test.ts` |
| (A) A change to one content table changes only the step that rolls it and the steps after it. | Built and tested | `determinism.test.ts` (monster, gem and graffiti rows) |
| (A) The named rival carries its loot between appearances and, once killed, drops it with its journal and never appears again. | Built and tested | `connective.test.ts` (task 3.10) |
| (A) Reading a weakness chain's last entry weakens its boss; each artifact carried removes one die from the final boss when it becomes alert. | Stubbed | `connective.test.ts` (task 3.10) proves both on the stub final boss. Task 4.10 replaces the stub with the level 100 set piece and the real final boss. |
| The same seed and level number always produce a byte-identical level. | Built and tested | `determinism.test.ts` (stored whole-level hashes, generators 3 to 5); `placement.test.ts` |
| Generating level N never requires generating any other level. | Built and tested | `placement.test.ts` (determinism and independence) |
| 100% of levels pass four-direction connectivity from the up stair to every walkable cell. | Built and tested | placement sweeps (`placement-checks.ts`); `world-rooms.test.ts`; `world-layouts.test.ts` |
| 100% of levels have both stairs (only an up stair on 100) and any teleporter on a path with no secret door, locked door, deep water or lava. | Built and tested | placement sweeps; `placement.test.ts` (validation) |
| Every locked door's key is reachable without passing through that door. | Built and tested | placement sweeps; `placement.test.ts` (keys) |
| Every run has exactly one village per band, teleporters in reflective pairs, and no artifact twice. | Built and tested | `run-layout.test.ts` (10,000 seeds) |
| Fewer than 1% of levels need the plain-rooms fallback. | Built and tested | placement sweeps; `world-fallback.test.ts` |
| A large level generates in under 50 ms on a mid-range laptop. | Built and tested | `placement.test.ts` (performance); `turn-budget.test.ts` |
| Visibility follows the sight rule: radius 8, walls and closed doors block, every visible cell becomes explored and stays explored. | Built and tested | `map-view.test.ts` (sight, explored cells) |
| Leaving and revisiting a level shows every delta exactly as left. | Built and tested | `run.test.ts` (level deltas); `save.test.ts` (save and reload) |

## Spec 03: Character system

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) Each of the 20 major abilities works as its row says, in a scripted arena test per class, and Q on a passive ability spends no round. | Built and tested | `major-abilities.test.ts`; `active-abilities.test.ts`; `allies.test.ts`; `class-scenarios.test.ts` (each class uses its ability with Q in an arena) |
| (A) Each example minor ability works as its row says, and a Pack Mule drawn at level up grows the pack at once. | Built and tested | `minor-abilities.test.ts`; `character-state.test.ts` |
| (A) A character created through the creation screen in each class plays to level 10 with its draws in effect. | Stubbed | `class-scenarios.test.ts`: all 20 classes are created on the screen and banked to level 10, and every draw is checked in effect. Only the Warrior, Mage, Thief and Priest have minor abilities yet (4 each, from the spec's examples), so the other 16 draw none. Task 4.4 writes the full pools of 12 for every class; the same test then covers them. |
| Each roll type resolves exactly as the Resolving rolls table says, over every face of every step, with and without advantage and disadvantage. | Built and tested | `character.test.ts` (roll resolution) |
| Melee ties hit both sides; a monster dies at zero dice; the player dies only when hit with no Combat dice left. | Built and tested | `character.test.ts` (melee and health); `combat-rules.test.ts` |
| Rolls from an empty pool use disadvantage and cost nothing further. | Built and tested | `character.test.ts` |
| Waiting 10 rounds restores one Combat die, and only an action or a move resets the count. | Built and tested | `character.test.ts`; `game-turns.test.ts`; `wait-look.test.ts` |
| Village rest restores every pool and saves. | Built and tested | `town-services.test.ts` (lodging); `app-lifecycle.test.ts`; `e2e/smoke.spec.ts` |
| Banking crosses thresholds at the listed totals and runs one level-up screen per level crossed. | Built and tested | `character.test.ts` (XP and leveling); `town-services.test.ts` (bank); `class-scenarios.test.ts` |
| No pool holds more than 6 dice or steps past d12, and every class's level 10 steps match the class table. | Built and tested | `classes.test.ts`; `creation.test.ts` |
| The same character on the same seed always draws the same minor abilities, repeating only stackable entries. | Built and tested | `character.test.ts` (minor abilities); `classes.test.ts` |
| All 20 classes can be created and played to level 10 in a scripted test. | Built and tested | `classes.test.ts`; `class-scenarios.test.ts` |

## Spec 04: Combat and magic

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) Each kind of ally follows the behaviour above in a scripted arena fight, and only the companion changes level. | Built and tested | `allies.test.ts` |
| Nothing on the level moves until the player spends an action; free actions cost no round. | Built and tested | `combat-arena.test.ts` (free actions); `game-turns.test.ts` |
| Fast, normal and slow creatures act 2, 1 and 0.5 times per round over a 100-round test. | Built and tested | `game-turns.test.ts`; `status.test.ts` (speed) |
| Notice rolls follow the awareness table, and combat within range wakes or alerts the right monsters. | Built and tested | `combat-rules.test.ts` (awareness rolls); `combat-arena.test.ts` (awareness) |
| All four attack kinds resolve as the attacks table says, including ties, unaware defenders and adjacent ranged disadvantage. | Built and tested | `combat-rules.test.ts` (the four attack kinds) |
| Each of the 15 spells works at every shape, and targeted area spells hit the previewed footprint while caster-centred ones spare the caster. | Built and tested | `magic.test.ts`; `ui-magic.test.ts` |
| Spellbook reading follows the check results, and retries wait for the next village rest. | Built and tested | `spellbooks.test.ts` |
| Each status effect applies, shows in the Status block, never stacks, and ends as listed. | Built and tested | `status.test.ts`; `ui-magic.test.ts` (the Status block) |
| Each behaviour is recognisable in a scripted arena fight; morale, bandit theft and rival looting work as written. | Built and tested | `combat-arena.test.ts` (behaviours, morale, bandits, rivals) |
| Ranged weapons spend one tracked ammunition per attack and cannot fire when out. | Built and tested | `combat-arena.test.ts`; `items-combat.test.ts` |
| No monster ever changes level through stairs. | Built and tested | `run.test.ts` (monsters never follow through stairs); `combat-arena.test.ts` (stairs and pursuit) |

## Spec 05: Items, treasure and inventory

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) Every class starts with its listed gear, worn where it can be and the rest in the pack. | Built and tested | `creation.test.ts`; `items-inventory.test.ts` (starting gear) |
| Equipped items use no pack slots; stacks follow the per-slot table; a full pack refuses pickups. | Built and tested | `items-inventory.test.ts` (slots); `ui-items.test.ts` |
| Break chances match the quality table over 100,000 simulated rolls, and broken gear gives no bonus until repaired. | Built and tested | `items-inventory.test.ts` (quality, breaking and repair); `items-combat.test.ts` |
| Weapon and armour modifiers apply only to the rolls named, and every trait works as written. | Built and tested | `items-combat.test.ts` |
| Ranged weapons respect range and spend one ammunition per shot; the crossbow fires every other round. | Built and tested | `items-combat.test.ts` (ranged weapons and ammunition) |
| Unappraised gems and jewelry cannot be banked; each appraisal is fixed once rolled. | Built and tested | `items-economy.test.ts` (appraisal and banking) |
| Disguised names are shuffled per seed and stay consistent within a run. | Built and tested | `items-magic.test.ts` (disguises) |
| Identification reveals true names and curses; cursed items cannot be unequipped until lifted. | Built and tested | `items-magic.test.ts` (identification, curses) |
| Prices follow the depth multiplier and the sell rate in every village. | Built and tested | `items-economy.test.ts`; `town-trade.test.ts` |

## Spec 06: Features, traps and lore

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| A search rolls once per hidden thing in the 8 surrounding cells and applies at most one negative effect. | Built and tested | `features-search.test.ts` |
| Passive notice fires once per hidden thing, with disadvantage. | Built and tested | `features-search.test.ts` (passive notice) |
| Every door and lock path in the doors table works, including key consumption, broken lockpicks and noise from forcing. | Built and tested | `features-doors.test.ts` |
| Each container and fixture resolves as its table says and records its used state as a level delta. | Built and tested | `features-containers.test.ts`; `features-fixtures.test.ts` |
| Every floor and container trap applies its effect; avoid and disarm checks follow the listed results. | Built and tested | `features-traps.test.ts`; `features-containers.test.ts` (trapped containers) |
| Deep pits never appear on level 99 or above a village, and landing always puts the player on a walkable cell. | Built and tested | `placement.test.ts`; placement sweeps; `features-traps.test.ts` |
| Every lore entry read appears in the journal, grouped by level. | Built and tested | `features-lore.test.ts`; `connective.test.ts` (the rival's journal and a weakness entry) |
| Each check type applies its own negative effect on a 1. | Built and tested | `features-search.test.ts`; `features-doors.test.ts`; `features-fixtures.test.ts`; `features-traps.test.ts`; `spellbooks.test.ts` |

## Spec 07: Villages and economy

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| Every subterranean village has bank, lodging and lift, and its other services match its seeded rolls. | Built and tested | `town-services.test.ts` |
| Every village price equals the surface price times the village multiplier. | Built and tested | `town-services.test.ts` (prices in a village) |
| Deposits convert only coins and appraised pieces, at 1 XP per gp; sales add gold with no XP. | Built and tested | `town-services.test.ts` (the bank); `town-trade.test.ts` |
| Any service the balance cannot cover is refused with a log message, and the balance never goes negative. | Built and tested | `town-services.test.ts`; `town-trade.test.ts` |
| Resting restores all pools, clears timed effects but not curses, saves, passes 200 turns and refreshes shops. | Built and tested | `town-services.test.ts` (lodging) |
| Lift fares follow the formula, match in both directions, and stay fixed per pair for the run. | Built and tested | `town-services.test.ts` (the lift) |
| Rumours only ever state things true in the current run's layout. | Built and tested | `templates.test.ts`; `town-tavern.test.ts` |
| Quests respect the active limit, pay into the bank as XP-earning treasure, and a dead captive fails its quest. | Built and tested | `town-tavern.test.ts` (quests); `town-people.test.ts` (captives) |
| Traders and hermits take carried coins only, and traders never buy. | Built and tested | `town-people.test.ts`; `ui-people.test.ts` |

## Spec 08: Content tables

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) A minor ability, artifact or shrine buff naming an effect not on the list, or missing that effect's fields, fails the build. | Built and tested | `minor-abilities.test.ts` |
| The build compiles every YAML table into one JSON bundle and fails on any schema, reference, uniqueness or placeholder error. | Built and tested | `content-build.test.ts`; `content-pipeline.test.ts` |
| One shared roller filters by depth, theme and tags, applies theme multipliers, follows nested rolls, and gives identical results for the same seed. | Built and tested | `roller.test.ts` |
| Templates are only chosen when the run layout holds a matching fact, and every filled rumour is true for that run. | Built and tested | `templates.test.ts` |
| The coverage report lists every table against its launch minimum and flags depth or theme gaps. | Built and tested | `content-pipeline.test.ts` (coverage report) |
| At launch, every table meets its minimum and the coverage report shows no gaps. | Phase 4 | Tasks 4.2 to 4.9 fill the tables; the Content complete gate checks the report. Today the report shows the stub tables short of their minimums, as planned. |

## Spec 09: Save, load and run

| Criterion | State | Evidence or owner |
| --- | --- | --- |
| (A) Before release, a save with a different content fingerprint is refused with the message above and changes nothing. | Built and tested | `save.test.ts`; `save-slot.test.ts` |
| Saving happens only on a village rest and on finishing creation, never anywhere else. | Built and tested | `app-lifecycle.test.ts`; `creation.test.ts` |
| Killing the browser mid-save leaves the previous save loadable. | Built and tested | `save-slot.test.ts` (crashes at each step of a safe write) |
| Continue after a quit or closed tab resumes at the last rest with nothing since kept. | Built and tested | `app-lifecycle.test.ts` (continue); `e2e/smoke.spec.ts` (a reload in the browser) |
| A saved and reloaded run is identical: every level delta, quest, identified kind and journal entry matches. | Built and tested | `save.test.ts` (save and reload); `connective.test.ts` (the rival and weaknesses) |
| Each death option works as its table row says, and the death is on the leaderboard before the choice. | Built and tested | `app-lifecycle.test.ts` (death); `gate-loop.test.ts` |
| Reaching level 100 and defeating the final boss each record on the leaderboard, and play continues. | Built and tested | `app-lifecycle.test.ts`; `connective.test.ts` (the generated stub final boss killed through the app) |
| A save from each earlier format version loads through its migrations; a newer-version save is refused cleanly. | Built and tested | `save.test.ts` (versions and migration, formats 1 to 6) |
| A full 100-level run's save stays under 1 MB. | Built and tested | `save.test.ts` (size) |

## Notes

- **The browser smoke test** runs in CI after the build. It serves the built page as GitHub Pages does and drives it in Chromium: it creates a Priest, steps, casts Heal, rests, reloads, and continues. It checks the pane shows the Priest's real dice, gear and ability, before and after the reload. It reads the screen's text through a read-only `window.megadungeon.screen()` hook, because the canvas holds no text.
- **Timing criteria** (50 ms per large level, the per-turn budget) are checked on the CI runner. Task 4.12 confirms them in the three browsers.
- **Not criteria, but owned:** the theme palettes and tile sets are stubs read by the renderer (task 4.2). The spell list grows from 15 toward 30 in task 4.6.
