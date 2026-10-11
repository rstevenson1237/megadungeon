# Megadungeon Intake Addendum B: Real Time and Isometric Display

Oct 11, 2026 · @Robert Stevenson

This addendum adds two optional ways to play the finished game: a real-time mode beside the turn-based one, and an isometric pixel-art display beside the CP437 text display. Both are runtime flags; the turn-based text game stays exactly as built and remains the default. Proposed and approved in full October 11, 2026, with every decision taken as recommended. Building starts after the Content complete gate.

## Why

On October 10, 2026 the owner asked what it would take to (1) make the game real time, "with a set time progression issuing a 'tick' for time based events but player and creature movement able to move independently of each other", keeping both code paths behind a runtime flag, and (2) present the game as an isometric pixel-art display. The evaluation (thread "Real-time and isometric evaluation") found both feasible:

- **Real time is a contained change to the Game layer.** `Game.endRound()` (`src/game/game.ts`) is the single clock: every spent action ends in it, and its `runRound()` runs the creatures (`creaturesAct`, `src/game/ai.ts`), wandering monsters, effect expiry and the round counter. Turn mode can keep that path untouched while a real-time path drives the same pieces from a tick.
- **Isometric is almost entirely the UI layer plus art.** Rules and Game never draw, so a second renderer can read the same state. The cost is the renderer (projection, depth sorting, wall cutaway) and the art: 13 themes of tiles, about 190 monsters and bosses, the classes, features, items and effects.
- **The art side uses `rstevenson1237/image_tools`.** Its artgen pipeline locks an art direction (`art/direction.json`), makes each sprite as a small code module through a make, review and approve loop that only the owner closes, and exports atlas packs with a 3.7 KB dependency-free TypeScript runtime that has a Canvas 2D adapter and 2:1 isometric helpers (`isoToScreen`, `screenToIso`, `depthKey`). Its iso-dungeon example is a working isometric crawler built this way.

## Requirements

From the owner's request, October 10 and 11, 2026:

- **R1:** a real-time mode in which game time advances by a fixed tick, timed events run on that tick, and the player and every creature act on their own schedules, independently of each other.
- **R2:** the turn-based mode stays, unchanged, and the mode is chosen at run time, not at build time.
- **R3:** an isometric pixel-art display of the running game.
- **R4:** the art is made with `rstevenson1237/image_tools` (artgen).
- **R5:** spec amendments first (this addendum); the implementation plan is iterated in later sessions.

Constraints carried over from the project brief: no runtime dependencies in the game, seeded randomness only, the four layers, one serialisable game state, the same seed always giving the same levels, and every merge deploying to GitHub Pages.

## Findings that shape the amendments

| # | Finding | Where it lands |
| --- | --- | --- |
| F1 | Spec 04 says the game is "strictly turn-based: nothing moves until the player acts" | Spec 04, Addendum B: that sentence and its acceptance criterion govern turn mode only |
| F2 | Every duration in the specs is in rounds (statuses, abilities, potions, poison, waiting, losing track, fights, restocking) | Spec 04, Addendum B: a round stays the unit of game time; in real time a round is 10 ticks, so no number in any spec changes |
| F3 | The dice streams are seeded per level and arrival round, and seed sweeps depend on generation only | Spec 02, Addendum B: generation is untouched; a real-time session is reproducible from the seed and its tick-stamped input log, because game time is counted in ticks, never milliseconds |
| F4 | Saves are made only at a village rest, and villages are menus with no clock | Spec 09, Addendum B: no tick or schedule state is ever saved; the save gains only the run's time mode |
| F5 | Balance (`docs/13-balance-report.md`) was measured turn-based | Plan, Phase 5: a real-time balance pass; no number changes without approval |
| F6 | The renderer is a CP437 grid; the panes and overlays are text | Spec 01b: only the map view becomes isometric; the shell, panes, log and overlays stay text |
| F7 | WASD move in the four map directions, which on a 2:1 isometric screen are the four diagonals | Spec 01b and decision D8 |
| F8 | artgen's calibration found self-scored art drifts about half a point high and that every asset tends to fill its frame, so sizes go wrong | Spec 01b, Art pipeline: blind review and a roster lineup at 1x before the owner approves |
| F9 | Monsters already carry a glyph letter and a colour token; 193 monsters and bosses use 35 letters | Spec 08, Addendum B: a sprite falls back to its letter family recoloured by its colour token, then to the glyph itself, so the display works before all art exists |

## New and changed requirements

Each line is written into the named spec as an "Addendum B" section, approved October 11, 2026.

- **Spec 01:** the two runtime flags (time mode, display); the real-time frame loop, held keys, a one-command buffer, pausing (P, overlays, a hidden tab); Z fast-forwards in real time; live targeting; pointer to Spec 01b.
- **Spec 01b (new):** the isometric display: layout, projection, camera, draw order, wall cutaway, visibility, sprites, animation, effects, targeting and look cursors, the art pipeline through artgen, the asset list and its acceptance criteria.
- **Spec 02:** time away and wandering count rounds in both modes; reproducibility from an input log; generation unchanged.
- **Spec 03:** in real time a round with no player action counts as a waiting round.
- **Spec 04:** the real-time mode: ticks and rounds, the player's cooldowns, each creature's own schedule, ordering within a tick, notice rolls, the 50-creature cap, round-boundary work, and its acceptance criteria.
- **Spec 08:** optional `sprite` fields, the sprite fallback chain, and the art checks in the content build.
- **Spec 09:** save format 7 carries the time mode; the leaderboard records and filters by it.

## Decisions for you

Each item had a recommended default; the amendments are written to it. All eleven were approved as recommended on October 11, 2026.

- [x] **D1 Tick and round length:** a tick is 50 ms and a round is 10 ticks, half a second, so a normal creature steps twice a second (recommended). Alternative: 100 ms ticks, a round per second, closer to the turn-based pace but slow for an action game.
- [x] **D2 Pausing:** menus and overlays (inventory, spells, level up, NPC talk, history, help, journal, game menu) pause; targeting and look do not, and P pauses at any time (recommended). Alternatives: targeting pauses too (safer, less real); or nothing pauses but P.
- [x] **D3 Mode per run:** chosen on the title screen before a new game, fixed for the run, saved with it, and marked on the leaderboard (recommended), because the two modes balance differently. Alternative: switchable at any village.
- [x] **D4 Waiting in real time:** a round in which the player takes no action counts as a waiting round, so standing still recovers as Space does (recommended).
- [x] **D5 Z in real time:** fast-forwards at four times speed until a Combat die returns, with the same stop rules as today (recommended).
- [x] **D6 Display switching:** the display can be switched at any time from the game menu, and the choice is a browser preference, not part of the save (recommended).
- [x] **D7 The artgen runtime:** vendor its core and only its Canvas 2D adapter into `src/ui/art/runtime/`, as in-tree source with no npm dependency, which keeps the "no runtime dependencies" rule (recommended). Alternative: write our own reader for artgen's `pack.json` and atlases. Note: `image_tools` has no licence file; as its owner you may wish to add one before its code is copied in.
- [x] **D8 Projection and keys:** a true 2:1 isometric view, with W A S D keeping their map directions (W moves up and to the right on screen) and a small compass drawn in a corner of the view (recommended, as asked). Alternative: a three-quarter oblique view, where map north is screen up and keys stay straight; artgen supports it, but it is not isometric.
- [x] **D9 Art scope first:** monsters by glyph family (35 sprites, recoloured per row by colour token), one tile shape set recoloured for the 13 themes from their existing palettes, then unique boss sprites in a later batch (recommended).
- [x] **D10 Input:** keyboard only in both displays, as Spec 01 says; no mouse (recommended).
- [x] **D11 Order:** after the Content complete gate, Phase 5 (real time) then Phase 6 (isometric), with Phase 6's art direction task allowed to run during Phase 5 because it touches no code (recommended).

## Changes to the build phases

Two phases are added after the Content complete gate. Task numbers continue the plan's style; each task is done when its spec's acceptance criteria pass with tests, one task at a time, one PR per task.

**Phase 5 (8 tasks): Real time**

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 5.1 | Approvals: done October 11, 2026, when the owner approved this addendum, every Addendum B section and every decision as recommended. Before 5.2 starts, the plan is iterated and any clarification it needs is approved | all | Content complete | Every decision above ticked (done) |
| 5.2 | Game clock: a tick counter and `advance(ticks)` on the Game; end-of-round work moved into one function both modes call; turn mode unchanged | 04 | 5.1 | Every existing test passes unchanged; a round in real time runs the same end-of-round work |
| 5.3 | Creature schedules: each creature's next-act tick from its speed, the stagger, ordering within a tick, the 50-creature cap, allies and the phantom | 04 | 5.2 | Speed and ordering criteria pass on a fake clock |
| 5.4 | Player cooldowns: cooldown by action and speed, the one-command buffer, held-key repeat, free actions | 01, 04 | 5.3 | Cooldown and buffer criteria pass |
| 5.5 | Frame loop and pausing: the scheduler in the UI, catch-up limit, P, overlays and a hidden tab pausing, Z fast-forward, live targeting, the log's bright window | 01 | 5.4 | Pause and targeting criteria pass in a browser check |
| 5.6 | The time-mode flag end to end: title option, `?time=` parameter, save format 7 with migration, leaderboard mode and filter | 01, 09 | 5.5 | A run of each mode saves, loads and records with its mode |
| 5.7 | Real-time tests and budget: scripted arena fights on a fake clock, input-log reproducibility, the tick time budget | 02, 04 | 5.6 | Same seed and input log give an identical state; budget holds |
| 5.8 | Real-time balance pass: the balance harness gains a real-time bot with a fixed reaction delay; report only | 13 report | 5.7 | Report in `docs/13-balance-report.md`; no game number changed without approval |

**Gate: Real time playable.** You play a real-time run from creation to a death and a return to the village.

**Phase 6 (10 tasks): Isometric display**

| # | Task | Spec | Needs | Done when |
| --- | --- | --- | --- | --- |
| 6.1 | Art direction: install artgen, generate briefs from the content, three directions; the owner locks one (inner checkpoint, stop) | 01b | 5.1 | `art/direction.json` locked by the owner |
| 6.2 | Scene model: one per-cell description of what the main view shows, read by both displays; text display rebuilt on it | 01b | 5.1 | Glyph golden and every UI test pass unchanged |
| 6.3 | Isometric renderer with no art: projection, camera, depth order, wall cutaway, visibility shading, glyph fallback | 01b | 6.2 | Draw-list criteria pass with the glyph fallback alone |
| 6.4 | Display flag and shell: game menu option, `?display=` parameter, overlays and the look row over the view, targeting and look cursors, compass | 01, 01b | 6.3 | Every overlay and both cursors work in the isometric display |
| 6.5 | Art batch 1: terrain tiles and theme recolours, doors, stairs, liquids, teleporters | 01b, 08 | 6.1, 6.3 | Approved by the owner; art checks pass |
| 6.6 | Art batch 2: the player for the 20 classes, the 35 monster families, NPC roles, allies | 01b, 08 | 6.5 | Approved; lineup at 1x passes review |
| 6.7 | Art batch 3: features and their states, floor items by kind, effects and status icons | 01b, 08 | 6.6 | Approved |
| 6.8 | Animation and events: the Game's display events, step and attack animation, effects, camera follow, in both time modes | 01b | 6.7, 5.5 | Animation never delays input in turn mode; criteria pass |
| 6.9 | Art batch 4: unique sprites for the 43 bosses and the level 100 set piece | 01b, 08 | 6.8 | Approved |
| 6.10 | Browser checks: the isometric smoke test in Chromium, Firefox and WebKit, the frame budget, pack loading on the Pages sub-path | 01b | 6.9 | e2e green in all three engines |

**Gate: Isometric complete.** You play levels in several themes in the isometric display, in both time modes, and switch displays mid-run.

## Risks

- **Two code paths:** every later rule must work in both modes. Mitigation: one end-of-round function and one action function per command, with only scheduling differing; every scenario test runs in both modes where it applies.
- **Real time changes the game's feel:** a dice-pool tactical game becomes partly a reaction game. Mitigation: pausing, the default turn mode, and a separate balance report.
- **Art volume and consistency:** about 150 assets for the full set. Mitigation: the glyph-family fallback, batches, blind review and lineup checks, and art that re-renders from one direction file if the direction changes.
- **Isometric readability:** walls hiding the player and items, and diagonal keys. Mitigation: wall cutaway, the compass, and decision D8.
- **Performance:** a large level with many creatures at 60 frames a second. Mitigation: frame budget tests, drawing only cells in view, and a cached terrain layer.

## Open questions

- [x] **Addendum approved (October 11, 2026):** the requirements, decisions D1 to D11, Phases 5 and 6, and the Addendum B sections in Specs 01, 02, 03, 04, 08 and 09 and the new Spec 01b.
