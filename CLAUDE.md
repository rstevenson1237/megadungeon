# Megadungeon: Project Brief for Claude Code

A browser-based, classic text-mode roguelike: a surface village above a 100-level procedurally generated megadungeon, drawn as a CP437 character grid in three panes, written in TypeScript. XP comes only from treasure banked in a village, so every descent is a push-your-luck decision.

## Source of truth

Everything is already designed and approved. The documents in `docs/` are the specification. Read the relevant ones before any task.

| File | Covers |
| --- | --- |
| `docs/00-intake.md` | Vision, pillars and every original requirement |
| `docs/00a-intake-addendum.md` | Addendum A: what Phases 1 and 2 left open, and the new Phase 3 Systems closeout |
| `docs/00b-intake-addendum.md` | Addendum B (approved October 11, 2026): real-time mode and the isometric display, Phases 5 and 6 |
| `docs/spec-01-rendering-ui-shell.md` | Screen grid, renderer, CP437 font, panes, key map, targeting, overlays |
| `docs/spec-01b-isometric-display.md` | Isometric pixel-art display and its artgen art pipeline (Addendum B) |
| `docs/spec-02-dungeon-generation.md` | Seeds, run layout, level sizes, layout algorithms, pipeline, reachability, depth scaling, restocking, quests, connective elements |
| `docs/spec-03-character-system.md` | Stats, dice pools, roll resolution, health, XP, the 20 classes, minor abilities |
| `docs/spec-04-combat-magic.md` | Turns, awareness, attacks, spells, status effects, monster and NPC behaviour |
| `docs/spec-05-items-treasure-inventory.md` | Slots, durability, weapons, armour, ammunition, treasure, magic items, prices |
| `docs/spec-06-features-traps-lore.md` | Searching, doors, containers, fixtures, traps, lore, negative effects |
| `docs/spec-07-villages-economy.md` | Village services, bank, lodging, lift, shops, tavern, traders, hermits |
| `docs/spec-08-content-tables.md` | YAML content format, rolling, table catalog, templates, validation |
| `docs/spec-09-save-load-run.md` | Run lifecycle, saves, death options, leaderboard, versioning |
| `docs/10-implementation-plan.md` | The 46 tasks in order, with dependencies, gates, testing and risks |
| `docs/11-closeout-audit.md` | Every acceptance criterion of every spec: built and tested, stubbed, or owned by a Phase 4 task (task 3.11) |
| `docs/13-balance-report.md` | Task 4.11's balance runs: depth pace, economy and class parity, measured on the real tables |
| `mockup/ui-mockup.html` | The approved UI mockup (open in a browser) |

## Rules for every task

- **The specs are law.** Implement exactly what they say. Do not invent rules, numbers or content.
- **When a spec is unclear, wrong or silent, stop and ask.** Propose the spec change in plain words; do not code around it. Approved changes are recorded in the spec file first, then implemented.
- **One task at a time,** in the order of `docs/10-implementation-plan.md`, only after the tasks it needs are done.
- **A task is done when** its spec's acceptance criteria pass, with tests that prove it.
- **Stop at every gate** (Playable slice, Systems complete, Systems complete replayed, Content complete) and wait for approval before starting the next phase. Phase 3 also stops after its approvals task (3.1), and Phase 4 after the style guide (task 4.1).
- **Specs carry "Addendum A" sections** from Intake Addendum A, and "Addendum B" sections from Intake Addendum B; each is part of the spec once approved. Addendum B was approved October 11, 2026.
- **After each task,** report briefly: what was built, which tests prove it, any departure from the spec, and the next task.

## Engineering rules

- **Stack:** TypeScript, Vite, Vitest, GitHub Actions, GitHub Pages. No UI framework, no runtime dependencies in the game.
- **Randomness:** only the seeded generators from Spec 02 (sfc32, per-level streams). Never `Math.random()` for game content.
- **Layers** (plan, Code architecture): UI, Game, Rules, Core. Each layer uses only the layers below it. Rules return results and log messages; only the UI draws.
- **Game state** is one plain, serialisable object (Spec 09).
- **Content is data:** YAML in `content/`, compiled to one JSON bundle, checked against TypeScript schemas (Spec 08). Content ids never change once released.
- **Determinism:** the same seed, level number and generator version always produce the same level.
- **Every merge to `main`** runs tests and content checks, then deploys a playable build to GitHub Pages.

## Proposed repository layout

```
/content          YAML tables, grouped by area (world, creatures, items, magic, lore, people)
/docs             the approved specs (this folder)
/mockup           the approved UI mockup
/src/core         seeded RNG, content loader, types and schemas
/src/rules        world generation, character and combat, items, features, villages
/src/game         turn loop, AI, save and leaderboard
/src/ui           renderer, panes and overlays, input and targeting
/tests            unit tests, seed sweeps, determinism checks, scenarios
/e2e              the browser smoke test (Playwright), run in CI on the built page
/tools            content build, coverage report
```

## Notes

- **Font:** IBM VGA 9x16 style, proposed as Px437 IBM VGA 9x16 from the Ultimate Oldschool PC Font Pack. Confirm its licence (believed CC BY-SA 4.0) and add the attribution before bundling it into a glyph atlas.
- **GitHub Pages** serves from a sub-path, so set Vite's `base` to the repository name.

## Where things stand

Phases 1 and 2 are built. Intake Addendum A (`docs/00a-intake-addendum.md`) adds Phase 3, Systems closeout, and moves content to Phase 4. Task 3.1 is done: on October 2, 2026 the owner approved every pending clarification section and every "Addendum A" section as written, so no built rule changed. Tasks 3.2 to 3.4 are done, with every clarification approved. Task 3.5 is done, with every clarification approved. Tasks 3.6 and 3.7 are done, with every clarification approved. Task 3.8 is done, with every clarification approved. Task 3.9 is done, with every clarification approved. Tasks 3.10 and 3.11 are done, with every clarification approved; the audit is `docs/11-closeout-audit.md`. Phase 3 is complete: next is the gate Systems complete, replayed, which waits for the owner's approval before Phase 4.

Intake Addendum B (`docs/00b-intake-addendum.md`, proposed October 11, 2026) adds a real-time mode and an isometric pixel-art display as runtime flags, in Phases 5 and 6 after the Content complete gate. The owner approved it, with every decision as recommended, on October 11, 2026 (task 5.1). Task 5.2 (the game clock) was started on October 11, 2026, before the Content complete gate, at the owner's request: the Game counts ticks, `advance(ticks)` runs real time, and one end-of-round function serves both modes, with turn mode unchanged. Task 5.3 (creature schedules) is built: in real time each creature acts at its own next-act tick, staggered on arrival, nearest first within a tick, with the 50 nearest chosen and their notice rolls made at each round boundary; its clarification in Spec 04 was approved on October 11, 2026. Task 5.4 (player cooldowns) is built: in real time an action happens at once and starts a cooldown of 10 ticks (5 Hasted, 20 Slowed), one command is held during it and carried out first in the tick it ends, a held movement key steps again each cooldown, and refused actions spend nothing; its clarification in Spec 04 was approved on October 11, 2026. Next is task 5.5, the frame loop and pausing.
