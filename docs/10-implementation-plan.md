# Megadungeon: Phased Implementation Plan

Sep 30, 2026 · @Robert Stevenson

This plan turns the nine approved specs into tasks across the build phases, each ending at a gate you approve. Approved September 30, 2026. Revised October 1, 2026 by Intake Addendum A (`docs/00a-intake-addendum.md`): a new Phase 3, Systems closeout, finishes what Phase 2 left open, and content moves to Phase 4. The revision is proposed and awaiting approval.

## Approach

The build follows the approved specs exactly; any change of rule goes back into its spec first, then into code.

- **Order:** build the thinnest playable loop first (Phase 1), then every system end to end with stub content (Phase 2), then close out what Phase 2 left open (Phase 3), then fill the tables (Phase 4). No content is written in bulk until the systems that read it are proven.
- **Traceability:** every task names the spec it implements, and it is done when that spec's acceptance criteria pass.
- **Tooling:** TypeScript, Vite, Vitest for tests, the YAML to JSON content build (Spec 08), and continuous integration running tests and the content checks on every change.
- **Deliverable per task:** working code, its tests, and a short note of anything that departed from the spec.
- **Review cadence:** you approve at each of the four gates; between gates, progress is visible in a playable build after every task.
- **No dates:** the plan orders work by dependency and milestone rather than calendar estimates.
- **Where:** built in Claude Code against a Git repository on GitHub, with these docs as the source of truth; every merged task deploys a playable build to GitHub Pages.

## Roadmap

Forty-six tasks across four phases, with a gate you approve at the start and at the end of each phase.

Roadmap (diagram as text):

| Gate / Phase | Contents |
| --- | --- |
| Gate: Plan approved | This document |
| Phase 1 (10 tasks): UI + proof of concept | Project setup and RNG; CP437 renderer and panes; input, overlays, targeting; basic generator and camera; village stub, title screen |
| Gate: Playable slice | Walk, descend, return |
| Phase 2 (13 tasks): Mechanics | Run layout, all generators; character, classes, combat; spells, items, features; villages and economy; save, load, leaderboard |
| Gate: Systems complete | Full loop, stub content (played October 1, 2026 with a test character) |
| Phase 3 (11 tasks): Systems closeout | Approvals; save and test hardening; one character state; creation; effect vocabulary; all 20 major abilities; allies; Z and L; connective elements and a stub final boss; class scenarios |
| Gate: Systems complete, replayed | Every class created, used and levelled |
| Phase 4 (12 tasks): Content | Style guide, then batches; themes, monsters, bosses; items, artifacts, spells; lore, rumours, quests; level 100, balance, polish |
| Gate: Content complete | Levels 1 to 100 playable |

Phase 4 also has an inner checkpoint: the style guide is approved before any bulk writing begins (Spec 08).

## Code architecture

The code is split into four layers so rules can be tested without a screen, and the screen can be built before most rules exist.

Code architecture (diagram as text). Each layer uses only the layers below it:

| Layer | Modules |
| --- | --- |
| UI | Renderer (CP437 canvas, cell diff); Panes and overlays (map, character, log, menus); Input and targeting (key map, target cycling) |
| Game | Turn loop (order, speed, time); Monster and NPC AI (awareness, behaviours); Save and leaderboard (IndexedDB, local storage) |
| Rules | World generation (run layout, levels, deltas); Character and combat (dice, classes, spells); Items, features, villages (inventory, traps, economy) |
| Core | Seeded RNG (sfc32, per-level streams); Content bundle (YAML built to JSON); Types and schemas (shared by code and content) |

- **Rules never draw:** the rules layer returns results and log messages; only the UI layer turns them into cells.
- **The game state is one plain object** that the save layer can write and read whole, which keeps saving simple (Spec 09).
- **Core has no game logic,** so the RNG, content loading and schemas can be finished and tested first.

## Phase 1: UI and proof of concept

Goal: a player can walk a generated level on the real screen, go down and back up, and stand in the surface village menu.

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 1.1 | Project setup: GitHub repository, Vite, TypeScript, Vitest, CI, GitHub Pages deploy, content build stub (YAML to JSON) | 08 |  | Build, tests and content check run in CI, and a page deploys to GitHub Pages |
| 1.2 | Seeded RNG, hashing, per-level streams | 02 | 1.1 | Same seed gives identical sequences in tests |
| 1.3 | CP437 glyph atlas and canvas grid renderer with cell diff and viewport scaling | 01 | 1.1 | Glyph and scaling criteria in Spec 01 pass |
| 1.4 | Three panes, borders, character pane from test data, log with colours, repeats, wrap and history | 01 | 1.3 | Pane, character and log criteria pass |
| 1.5 | Input layer, key map, menu navigation, overlay framework | 01 | 1.4 | Every key acts or logs "not yet available" |
| 1.6 | Rooms-and-corridors generator with four-direction connectivity and stairs | 02 | 1.2 | 10,000-seed connectivity test passes |
| 1.7 | Camera, visibility and remembered cells | 01, 02 | 1.4, 1.6 | Camera and three-state visibility criteria pass |
| 1.8 | Turn loop, movement, doors, stub monsters, targeting with cycling and area preview | 01, 04 | 1.5, 1.7 | Targeting criteria pass against stub monsters |
| 1.9 | Surface village menu stub, Go up and Go down, in-memory level deltas | 01, 02 | 1.8 | Leaving and returning shows a level exactly as left |
| 1.10 | Title screen with random seed and seed of the day | 01, 09 | 1.9 | Both seed options start a run |

**Gate: Playable slice.** You play the build: walk, fight a stub monster, descend several levels, return to the village.

## Phase 2: Mechanics

Goal: every system in Specs 02 to 09 works end to end with a few stub entries per table, so the full delve, bank and level loop can be played.

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 2.1 | Full content pipeline: schemas, reference checks, coverage report, template engine | 08 | 1.1 | Spec 08 criteria pass on stub content |
| 2.2 | Run layout: villages, teleporters, bosses, themes, quests and cross-level links | 02 | 1.2, 2.1 | Run layout criteria pass over 10,000 seeds |
| 2.3 | All eight layout algorithms, validation and fallback | 02 | 1.6 | Every Spec 02 generation criterion passes |
| 2.4 | Placement pipeline: doors, keys, features, traps, monsters, treasure, NPCs, lore, specials | 02 | 2.2, 2.3 | Reachability and placement criteria pass |
| 2.5 | Character system: pools, rolls, advantage, health, waiting, XP, level up, minor draws | 03 | 1.8 | Spec 03 criteria pass |
| 2.6 | All 20 classes: starting dice, step progression, major abilities | 03 | 2.5 | Each class reaches level 10 in a scripted test |
| 2.7 | Combat: turn order, speed, awareness, attacks, morale, behaviours, bandits, rivals | 04 | 2.5 | Combat and behaviour criteria pass in arena tests |
| 2.8 | Magic: casting, learning, the 15 spells, status effects | 04 | 2.7 | Spell and status criteria pass |
| 2.9 | Items: slots, stacking, quality, weapons, armour, ammunition, magic items, identification, curses | 05 | 2.5 | Spec 05 criteria pass |
| 2.10 | Features: searching, doors and locks, containers, fixtures, traps, lore journal, negative effects | 06 | 2.4, 2.9 | Spec 06 criteria pass |
| 2.11 | Villages and economy: bank, lodging, lift, shops, appraiser, smith, tavern, traders, hermits | 07 | 2.9 | Spec 07 criteria pass |
| 2.12 | Restocking and wandering monsters | 02 | 2.7, 2.11 | Restock numbers match Spec 02 over a scripted run |
| 2.13 | Save and load, safe writes, migrations, export and import, death options, leaderboard | 09 | 2.11 | Spec 09 criteria pass |

**Gate: Systems complete.** You play a full loop with stub content: delve, loot, bank, level up, rest, use the lift, die and try each death option.

## Phase 3: Systems closeout

Goal: every requirement of the intake and specs has working code, so content only ever fills tables that a system already reads. Added by Intake Addendum A; each task implements the "Addendum A" section of the specs it names.

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 3.1 | Approvals: you review the six pending clarification sections (tasks 2.8 to 2.13) and every Addendum A section; the outcomes go into the specs first, and any change you make to a built rule is fixed in code | All | Gate 2 | No section is left "awaiting approval", and the code matches every change |
| 3.2 | Save and test hardening: one stream per placement step (generator version 4), whole-level stored hashes against frozen test tables, refusing saves from other content, the revised 10,000-seed sweep, a per-turn time budget test, and the content build before tests on a fresh clone | 02, 09 | 3.1 | Addendum A determinism and save criteria pass; a test adding a monster row moves only the monster step |
| 3.3 | One character state and the pane: the rules character as the only record of pools, level, XP and abilities; the Abilities block and wait counter from real state; Pack Mule slots; the theme name in the header; theme palette and tile fields read by the renderer, with the default set as every theme's stub | 01, 03, 08 | 3.1 | The pane shows only real state; a drawn Pack Mule grows the pack; a theme with a palette renders in it |
| 3.4 | Character creation: class list, name typed or random, the `character_names` table with stub names, starting spells by class, starting gear for all 20 classes, the first save on finishing, and same-seed restarts through creation | 01, 03, 05, 08, 09 | 3.3 | A run of every class starts from the title screen with the right dice, spells and gear, and saves |
| 3.5 | Effect vocabulary: one list of effects in code, `effect` fields and their checks for minor abilities, artifacts and shrine buffs, and the 16 example minor abilities working | 03, 05, 08 | 3.3 | Every example minor ability passes its row; a row naming an unknown effect fails the build |
| 3.6 | Major abilities, passive and trades: Q and its list, the skill-use rule, fights, extra dice adding up; Cleave, Backstab, Shield Wall, Flurry, Overchannel, Hex Breaker, Brew, Smite, Pact, and Arcane Bolt and Heal from Q | 03, 04, 06 | 3.4, 3.5 | Each listed ability passes its arena test |
| 3.7 | Major abilities, active: Rage, Volley, Fascinate, Wild Shape, Mark, Spirit Totem | 03, 04 | 3.6 | Each listed ability passes its arena test |
| 3.8 | Allies: ally turns and behaviour; Raise, Decoy and Companion | 03, 04 | 3.7 | Each ally kind behaves as Spec 04 Addendum A in an arena test, and only the companion changes level |
| 3.9 | Z (wait until recovered) and L (look) | 01 | 3.3 | Every key in the key map acts; nothing logs "not yet available" |
| 3.10 | Connective elements and the final boss: the named rival arc and its journal, a lore chain's weakness, a stub final boss on level 100, artifact seals | 02, 06, 09 | 3.2, 3.6 | Addendum A connective criteria pass; defeating the stub final boss records on the leaderboard |
| 3.11 | Class scenarios: every class created through creation, using its ability in an arena, and played to level 10 with its draws in effect | 03 | 3.4 to 3.10 | Spec 03 Addendum A criteria pass for all 20 classes |

**Gate: Systems complete, replayed.** You play the full loop again with real classes: create any class, use its ability, delve, bank, level up with a minor draw in effect, rest, use the lift, die and try each death option.

## Phase 4: Content

Goal: every table reaches its Spec 08 launch minimum, the coverage report is clean, and all 100 levels play well.

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 4.1 | Style guide with sample entries | 08 | Gate 3 | You approve the voice (inner checkpoint) |
| 4.2 | 13 level themes: palettes, tile sets, layouts, feature weights (the renderer reads them from task 3.3) | 02, 08 | 4.1 | Every theme renders and generates cleanly |
| 4.3 | 150 monsters and 40 bosses | 04, 08 | 4.1 | At least 5 monsters per rating; no depth gaps |
| 4.4 | Minor ability pools (240 slots), and any revision of the 16 classes' starting gear | 03, 05, 08 | 4.1 | Every class has 12 entries, each naming an effect from the vocabulary |
| 4.5 | 130 magic items, 40 artifacts, 100 disguise names, 50 gems and jewelry | 05, 08 | 4.1 | Item tables meet their minimums |
| 4.6 | Spells up to the target of 30 (a spell needing a new effect gets its code in this task) | 04 | 4.1 | New spells pass the spell criteria |
| 4.7 | Fountain, altar god, rune, trap and debris tables | 06 | 4.1 | Feature tables meet their minimums |
| 4.8 | Lore: 200 books, 300 graffiti, 120 signs, 25 lore chains | 06, 08 | 4.1 | Lore tables meet their minimums; style mix within 20% |
| 4.9 | 60 rumour templates, quest templates and items, all name tables | 07, 08 | 4.1 | Every rumour kind and quest type has templates |
| 4.10 | Level 100 set piece and final boss, replacing the task 3.10 stub | 02, 04 | 4.2, 4.3 | Level 100 generates and the boss fight works, with artifact seals |
| 4.11 | Balance playtests: depth pace, economy, class parity | 02, 03, 07 | 4.2 to 4.10 | Level 10 lands near depth 50 to 55; no class far behind |
| 4.12 | Release polish: performance, browser checks, help screen | 01 | 4.11 | Every spec's criteria pass in Chrome, Firefox and Safari |

**Gate: Content complete.** Levels 1 to 100 are playable, the coverage report is clean, the release policy for saves across content changes is chosen (Spec 09, Addendum A), and you approve release.

## Testing strategy

Five kinds of test cover the specs' acceptance criteria; all but playtests run automatically on every change.

| Kind | Checks | Examples |
| --- | --- | --- |
| Unit tests | Single rules in isolation | Every face of every die step; advantage; break chances over 100,000 rolls |
| Seed sweeps | Generation across many seeds | 10,000 seeds for connectivity, reachability, village bands, teleporter pairs |
| Determinism checks | Same input, same output | A hash of each generated level matches a stored value for fixed seeds |
| Scripted scenarios | Systems working together | Arena fights per behaviour; each class to level 10; save, reload and compare |
| Playtests | Feel and balance | Your play at each gate; balance runs in task 3.11 |

The content build's schema, reference and coverage checks (Spec 08) run alongside the tests, so bad content fails the same way broken code does.

## Risks and mitigations

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Content volume | Over 2,000 entries must be written and reviewed | Style guide first, batches by area, coverage report sets priorities |
| Balance across 100 levels | Pace, economy and 20 classes interact | All numbers live in tables (Spec 08); scripted runs measure pace before playtests |
| Generator edge cases | Rare seeds could break reachability | 10,000-seed sweeps in CI, plus the plain-rooms fallback (Spec 02) |
| Off-screen simulation cost | Rivals and restocks run beyond the view | 50-creature cap (Spec 04) and a per-turn time budget test |
| Browser storage loss | Clearing site data deletes the save | Export and import (Spec 09) and a one-time warning |
| Save compatibility | Updates could break runs in progress | Versioned saves, migrations, retained old generators (Spec 09); one stream per placement step and refusing saves from other content until release (Addendum A) |
| Tasks closed short of their spec | Phase 2 closed task 2.6 on dice alone, leaving major abilities unowned | Each task's report lists every requirement of its spec rows as built, stubbed or moved, and nothing is left without an owning task |
| Scope creep | New ideas during the build | Changes go into a spec and get approved before any code |

## Open questions

- [x] **Who builds:** Claude Code against a GitHub repository.
- [x] **Hosting:** GitHub Pages, deployed from every merged task.
- [x] **Review between gates:** a playable build after every task.
- [x] **Task order:** approved as written.
- [ ] **Revision of October 1, 2026:** the Phase 3 Systems closeout and the move of content to Phase 4 (Intake Addendum A).
