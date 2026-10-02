# Megadungeon Intake Addendum A: Systems Closeout

Oct 1, 2026 · @Robert Stevenson

This addendum records what a review of Phases 1 and 2 found missing or unfinished against the intake and the nine specs, and adds a new Phase 3 (Systems closeout) to finish it before any content is written in bulk. Content creation moves to Phase 4. Proposed October 1, 2026, awaiting approval.

## Why

Phase 2 closed with every task's tests passing (1,098 tests, typecheck clean, no `Math.random`, no layer imports a layer above it). The rules that exist are sound. But a review against the intake and the specs found requirements that no task built and no later task owns, and a live build that does not exercise the class system. Writing 2,000 entries of content on top of that would bake the gaps in: 240 minor abilities and 40 artifacts would be text with no effect, and every content change would quietly corrupt saves.

## Findings

Each finding traces to the intake or spec it comes from, and to where this addendum resolves it.

### A. Requirements with no owning task

| # | Requirement | Source | State at review | Resolved in |
| --- | --- | --- | --- | --- |
| A1 | Character creation: class list, name typed or random | Intake Characters; Spec 01 Overlays; Spec 03 Character creation | No screen. Every run is the test character "Mara the Thief". No `character_names` table or schema | Spec 01, 03, 08, 09 addenda; task 3.4 |
| A2 | Major abilities for all 20 classes, used with Q | Intake Classes; Spec 03 Classes; Spec 01 key map | Q logs "not yet available". Only Arcane Bolt has a rule, and the live build never grants it | Spec 03, 04 addenda; tasks 3.6 to 3.8 |
| A3 | Minor ability effects | Intake Classes; Spec 03 Minor abilities | Draws work. Only Fence has an effect in play; Pack Mule only sizes the starting pack. The table has no effect field, so content task 3.4 would write text only | Spec 03, 08 addenda; task 3.5 |
| A4 | Z: wait until a Combat die returns | Spec 01 key map; Spec 03 Waiting | Logs "not yet available" | Spec 01 addendum; task 3.9 |
| A5 | L: look at any visible cell | Spec 01 key map | Logs "not yet available" | Spec 01 addendum; task 3.9 |
| A6 | Artifact seals: each artifact carried weakens the final boss | Intake World structure; Spec 02 Connective elements | Not built. Level 100 has no final boss yet | Spec 02 addendum; task 3.10 |
| A7 | Named rival arc: defeating them recovers their loot; their journal leads to the stash | Spec 02 Connective elements | The rival appears and the stash is placed, but nothing links them | Spec 02 addendum; task 3.10 |
| A8 | A lore chain that ends in a boss's weakness | Spec 02 Connective elements | Placed, but reading it does nothing | Spec 02 addendum; task 3.10 |
| A9 | Artifacts with real effects | Intake Items; Spec 05 Magic items | Only a passive from a five-word list (search, stealth, melee, wait, lockpick) | Spec 08 addendum (effect vocabulary); task 3.5 |
| A10 | Theme palettes and tile sets | Intake Level themes; Spec 01 Rendering | No palette fields; one fixed map palette. Old task 3.2 was code as well as content | Spec 08 addendum; task 3.3 |

### B. Live build defects

| # | Defect | Source | Resolved in |
| --- | --- | --- | --- |
| B1 | The test character knows all 15 spells and gets the Thief's kit whatever is chosen | Spec 04 Spells | Task 3.4 |
| B2 | The pane's Abilities block always shows "Backstab, Keen Eye, Light Step"; the wait counter always shows "Rested 3/10" | Spec 01 Character pane | Task 3.3 |
| B3 | A Pack Mule drawn at level up never adds pack slots | Spec 03; Spec 05 | Task 3.3 |
| B4 | The rules character and the in-game player each hold the dice pools, kept in step by hand | Brief: one game state | Task 3.3 |
| B5 | The map header says "Level 7", not "Goblin Warrens, Level 7" | Spec 01 Main view | Task 3.3 |
| B6 | On a fresh clone `npm test` fails until the content build has run | Brief: CI and tests | Task 3.2 |

### C. Process and test gaps

| # | Gap | Source | Resolved in |
| --- | --- | --- | --- |
| C1 | Six clarification sections were built on while still "awaiting approval": Spec 04 (task 2.8), Spec 05 (2.9), Spec 06 (2.10), Spec 07 (2.11), Spec 02 restocking (2.12), Spec 09 (2.13). Some set new rules rather than fill gaps: a following captive takes 1 blow in 3; the lift token halves fares; 1 in 4 plain chests is locked | Brief: the specs are law | Task 3.1 |
| C2 | Level contents are rolled from the content tables, but the stored level hashes cover tiles only. Every content edit reshuffles visited levels' contents, and Spec 09 says the content version never blocks a load, so old saves replay deltas onto different levels | Spec 02 Determinism; Spec 09 Versioning | Spec 02, 09 addenda; task 3.2 |
| C3 | The placement sweep runs 10,000 seeds with one level each; Spec 02 asks for every level of each | Spec 02 Acceptance criteria | Spec 02 addendum; task 3.2 |
| C4 | No per-turn time budget test for off-screen simulation | Plan Risks | Task 3.2 |

### D. Accepted as built

- **Game state shape (brief: "one plain, serialisable object"):** the state is plain data (the character, the player, the level deltas, the town state) held by the `Run` and `Game` classes, and the save writes that data whole. This is accepted, read as "plain serialisable data with one owner per fact"; B4 removes the one duplicated fact.
- **Large level time:** measured at about 8 ms typical and 42 ms worst, under the 50 ms limit.

## New and changed requirements

Each line below is written into the named spec as an "Addendum A" section, proposed and awaiting approval.

- **Spec 01:** the character creation screen; Z waits until a die returns or something interrupts; L moves a look cursor over visible and remembered cells; the header names the theme.
- **Spec 02:** each placement step rolls from its own stream; the named rival arc, the lore chain's weakness, artifact seals and a stub final boss on level 100; the sweep criterion.
- **Spec 03:** the rule for using abilities (active ones are skill uses with Q, passive ones need no roll); what a "fight" is; how "removes 2 dice" effects add up; a rule-level reading of all 20 major abilities; the 16 example minor abilities as effects; one owner for the dice pools.
- **Spec 04:** allies (raised dead, the decoy and the companion).
- **Spec 05:** starting gear for the 16 additional classes, so every class can be played before Phase 4.
- **Spec 06:** a pointer list of the abilities that change searching, traps, runes and books.
- **Spec 08:** one effect vocabulary in code shared by minor abilities, artifacts and shrine buffs; the `character_names` table; theme palette and tile fields.
- **Spec 09:** before release, a save whose content fingerprint differs from the build's is refused; creation finishing is the first save.

## Decisions for you

The addendum proposes a default for each; mark the box to approve it, or note the change.

- [ ] **Approve the six pending clarification sections** (C1) as written, or list changes. Of note: the captive taking 1 blow in 3 (Spec 07), the lift token halving fares instead of making them free (Spec 07), 1 in 4 plain chests locked (Spec 06), Cleave-style numbers being starting values.
- [ ] **Saves across content changes (C2):** before release, refuse a save from different content with a plain message (recommended: simple, honest, and only playtest saves are affected). Before the Content complete gate, choose the release policy: either store each visited level's generated contents in the save (robust; adds roughly 3 to 8 KB per visited level), or freeze rolled tables at release so later updates only append retired-safe rows.
- [ ] **Abilities as skill uses:** active abilities (Q) roll a Skill die as a skill use; passive and triggered ones (Cleave, Backstab, Shield Wall, Flurry, Overchannel, Hex Breaker, Brew, Companion) need no roll, and neither do the two trades, Pact and Smite. The intake says "class abilities count as skill uses"; this reads it as covering the ones the player chooses to use.
- [ ] **Two minor abilities need a ruling:** Scholar ("identify scrolls and books on sight") when the game has no scrolls, and the minor ability Blessed ("advantage on checks against undead"), which shares a name with the Blessed status. Proposed: Scholar shows a spellbook's spell and a book's lore-chain place before reading, and learns a spellbook on 2 to 3 as well as 4 or more; Blessed is renamed Hallowed, giving advantage on Combat checks and melee defence against creatures tagged `undead`.
- [ ] **Allies:** a third kind of creature that fights for the player (Raise, Decoy, Companion), as set out in the Spec 04 addendum.
- [ ] **Stub starting gear** for the 16 additional classes, as listed in the Spec 05 addendum, final unless Phase 4 changes it.

## Changes to the build phases

The plan gains a Phase 3 of eleven tasks; the twelve content tasks move to Phase 4 unchanged in scope, except that starting gear moves into Phase 3 and theme palettes' code moves into task 3.3.

| Gate / Phase | Contents |
| --- | --- |
| Gate: Systems complete (played October 1, 2026) | Full loop with stub content and a test character |
| Phase 3 (11 tasks): Systems closeout | Approvals; save and test hardening; one character state and pane; creation; effect vocabulary; all 20 major abilities; allies; Z and L; connective elements and a stub final boss; class scenarios |
| Gate: Systems complete, replayed | Create any class, use its ability, level it, die, try each death option |
| Phase 4 (12 tasks): Content | Style guide (inner checkpoint), then the content batches, level 100, balance and polish |
| Gate: Content complete | Levels 1 to 100 playable |

## Open questions

- [ ] **Addendum approved:** the findings, the new Phase 3 and the spec addenda.
