# Megadungeon Spec 02: Dungeon Generation

Sep 30, 2026 · @Robert Stevenson

This spec defines how a seed becomes 100 persistent, fully reachable levels. Approved September 30, 2026.

## Scope

This spec covers how levels are laid out and populated; what the things placed on them do belongs to later specs.

- **In scope:** seeds, run-wide layout (villages, teleporters, bosses, themes), level geometry, placement of stairs, doors, features, traps, monsters, NPCs, treasure and lore, reachability rules, persistence.
- **Out of scope:** combat and check resolution, item and monster stats, NPC behaviour, village services, the content tables themselves.
- **Traces to intake:** World structure, Level themes, Dungeon contents, NPC behaviour, and Spec 01's four-direction reachability requirement.

## Seeds, determinism and persistence

One 32-bit run seed determines every level, so a level can always be rebuilt and only the player's changes need saving.

- **Seed of the day:** a hash of the UTC date (e.g. 2026-09-30), identical for every player that day.
- **Random seed:** drawn from the browser's crypto random source and shown on the title and death screens.
- **Per-level seed:** hash(run seed, level number), so generating level 40 never depends on having generated level 39.
- **Separate streams:** layout, contents and runtime (combat, wandering monsters) each get their own seeded generator, so a rules change to combat never shifts where walls fall.
- **Generator:** a small, fast, seedable PRNG (proposed: sfc32). JavaScript's built-in Math.random is never used for game content.
- **Persistence:** a level generates on first visit. The save stores only deltas: explored cells, opened or broken doors, looted containers, taken items, dead monsters, triggered or found traps, NPC state. Revisiting regenerates the level and replays its deltas.
- **Generator version:** saved with the run. A save made with an older generator keeps using it, so a code update never reshapes a level mid-run.

## Run layout

When a run starts, one pass over the seed fixes where the villages, teleporters, bosses and themes fall across all 100 levels.

| Element | Rule | Result per run |
| --- | --- | --- |
| Subterranean villages | One random level in each band: 1 to 20, 21 to 40, 41 to 60, 61 to 80, 81 to 99 | 5 villages |
| Teleporters | 10% of non-village levels from 1 to 99, joined in reflective pairs; a pair may link any two levels | About 10 levels, 5 pairs |
| Bosses | 5% chance on each non-village level from 1 to 99; level 100 always holds the final boss | About 5, plus the final boss |
| Artifacts | Each boss draws a different artifact from the artifact table | Unique within the run |
| Themes | Drawn per level from the unlocked pool (intake: 4 at level 1, 2 more at 20, 40, 60, 80), weighted 3 : 2 : 1 for the newest, previous and older unlocks | One theme per level; level 100 always The Abyssal Throne |
| Quests | Each village's quest board is pre-rolled, and each quest names a target level below that village | A fixed quest list per village |
| Cross-level links | Each link has a source piece on one level and a target on the same or a deeper level (see Connective elements) | Count set per element type |

**Village levels:** a village replaces its dungeon level. Stairs from the level above or below arrive at the village menu, which offers Go up and Go down to the neighbouring dungeon levels.

## Level sizes and layouts

Each theme picks a size class and one of eight layout algorithms; the theme's palette and feature weights come from the content tables.

| Size | Map cells | Fits on screen |
| --- | --- | --- |
| Small | 70 x 28 | Exactly one main view |
| Medium | 100 x 44 | Scrolls both ways |
| Large | 140 x 60 | Scrolls both ways |

| Layout algorithm | How it builds | Themes |
| --- | --- | --- |
| Rooms and corridors | Binary space partition into rooms, joined by straight or L-shaped corridors | Cellars and Crypts, Dwarven Hold (pillared halls) |
| Mirrored halls | Rooms and corridors generated on one half, mirrored across the centre | Ruined Temple |
| Warren tunnels | Random-walk tunnels with small blob rooms at junctions | Goblin Warrens |
| Channel grid | Regular grid of channels and junction chambers, with walkways beside water | Flooded Sewers |
| Cellular caves | Cellular automata smoothing, then shafts, rivers or a central lake stamped in | Old Mine, Fungal Caverns, Underdark Lake, Lava Forges |
| Maze with crypts | Recursive-backtracker maze with small rooms cut into it | Catacomb Labyrinth |
| Freeform chambers | Round and odd-shaped chambers placed apart, joined by corridors | Wizard's Sanctum |
| Disjoint rooms | Isolated rooms on a sparse grid, linked by long corridors and many secret doors | Void Halls |
| Set piece | A hand-authored template with seeded variation | The Abyssal Throne (level 100) |

**Liquids:** shallow water is walkable; deep water and lava are not, and count as walls for reachability.

## Generation pipeline

Each level is built in twelve fixed steps; if validation fails, the level retries with the next sub-seed, so the result is still deterministic.

1. **Carve:** run the theme's layout algorithm at its size.
2. **Connect:** flood-fill in four directions; join every separate region to the main one with a corridor, and widen any diagonal-only touch into a real passage.
3. **Stairs:** place the up stair, then the down stair at least 60% of the level's longest walkable distance away (none down on level 100).
4. **Doors:** place doors at room entrances, choosing normal, locked or secret by theme weights.
5. **Keys:** place about one key per locked door, each reachable from the up stair without passing any locked door. Keys are generic: consumed on use and valid on any level.
6. **Features:** fixtures (fountains, altars, sarcophagi, runes) and containers (chests, sacks, pottery, weapon racks) by theme weights.
7. **Traps:** floor traps in corridors and room cells, container traps on some containers; never on stairs, doorways or teleporters.
8. **Monsters:** fill the level's monster budget from the depth table, in groups by room; none within 8 cells of the up stair.
9. **Treasure and items:** fill the treasure budget, biased into containers, dead ends and behind locked or secret doors; roll magic items by depth.
10. **NPCs and lore:** rivals, traders, bandits, hermits and captives by theme and depth; books, graffiti and signs from the lore tables.
11. **Specials:** a teleporter or boss if the run layout assigned one (the boss sits in the room farthest from the up stair), plus any quest goals and cross-level link pieces the run layout assigned to this level.
12. **Validate:** check every rule in Reachability and door rules; on failure, retry from step 1 with the next sub-seed (up to 20 tries, then fall back to plain rooms and corridors).

## Reachability and door rules

Every level must be finishable by a player who moves in four directions and never finds a secret door.

- **Four-direction connectivity:** every walkable cell connects to the up stair through orthogonal steps. Two floor cells that touch only at a corner never count as connected.
- **Critical path:** the up stair, down stair and any teleporter are reachable without passing a secret door, a locked door, deep water or lava.
- **Secret doors** only lead to optional areas: side rooms, treasure caches, shortcuts.
- **Locked doors** may guard optional areas or a shortcut, never the only route on the critical path.
- **Keys** are generic, consumed on use and valid on any level. Because locked doors never block the critical path, spending keys elsewhere can never trap the player.
- **Quest goals and link targets** are reachable without secret doors; they may sit behind a locked door.
- **Doorways** are always one cell wide, with wall on both sides, so a door never sits in a diagonal gap.
- **Blocking features:** containers, fixtures and NPCs never block a one-cell corridor or doorway.
- **Boss room:** always reachable without secret or locked doors.

## Depth scaling

Difficulty and reward both climb with depth, tuned so a thorough player reaches character level 10 around dungeon level 50 to 55. All figures below are starting values for playtesting.

- **Monster rating ceiling:** 1 + depth / 5 dice (rounded down), capped at 20. Most monsters on a level roll between half the ceiling and the ceiling.
- **Monster modifier:** depth / 15 (rounded down, capped at +6), varied by up to 2 either way, within -2 to +6.
- **Bosses:** the ceiling plus 3 dice, capped at 20. The final boss is 20d6+6.
- **Monster count:** small levels 8 to 12, medium 14 to 20, large 22 to 30.
- **Treasure budget:** 50 + 10 x depth squared gp per level, varied by up to 50% either way. Rivals may take some of it before the player arrives.
- **Magic items:** each container rolls 10% + depth / 4 %, capped at 40%.

| Depth | Rating ceiling | Typical modifier | Treasure budget | Cumulative treasure to here |
| --- | --- | --- | --- | --- |
| 1 | d6 | +0 | 60 gp | 60 gp |
| 10 | 3d6 | +0 | 1,050 gp | 4,350 gp |
| 20 | 5d6 | +1 | 4,050 gp | 29,700 gp |
| 40 | 9d6 | +2 | 16,050 gp | 223,400 gp |
| 55 | 12d6 | +3 | 30,300 gp | 572,550 gp |
| 80 | 17d6 | +5 | 64,050 gp | 1.74 million gp |
| 99 | 20d6 | +6 | 98,060 gp | 3.29 million gp |

The XP needed for level 10 is 512,000, which the cumulative treasure passes near depth 55, before rivals, bandits and missed caches take their share.

## Restocking and wandering monsters

Cleared levels refill over time, and wandering monsters keep any level from feeling safe. Figures are starting values.

- **Restock on revisit:** a level gains new monsters for the time the player was away: 10% of its original monster budget per 500 turns away, capped at 50%. They appear out of sight of the arrival stair and are drawn from the depth table as it stands.
- **Treasure does not restock**: only monsters return, so each level's treasure budget is finite.
- **Wandering monsters:** a 1 in 200 chance each turn on a dungeon level, plus the wandering monster result on a rolled 1 for a check. They enter from out of sight, never adjacent to the player.
- **Villages** never restock or spawn wandering monsters.

## Quest goals

Every quest is rolled when the run starts, so its goal is placed whenever its target level generates, whether or not the player has taken the quest yet.

| Quest type | Goal placed on the target level | Completes when |
| --- | --- | --- |
| Return a captive | A captive NPC, guarded by a monster group | The captive is escorted to any village |
| Find a lost belonging | A named item in a container or on a dead delver | The item is handed in at the quest's village |
| Collect a magical item | A named magic item, often behind a locked door | The item is handed in at the quest's village |
| Kill an opponent | A named monster or bandit leader, rated above the level's ceiling | The opponent dies |

Target levels lie anywhere below the quest's village and above the next deeper village; for the deepest village, down to level 100. A quest taken after its target level was visited still finds its goal there, because the goal was part of that level from the start.

## Connective elements

These cross-level links make finds on one level matter on another. Each has a source on one level and a target on the same or a deeper level, both set in the run layout. All ten are approved.

| Element | Found | Unlocks |
| --- | --- | --- |
| Sealed vaults | A named vault key | A sealed vault of treasure a few levels deeper; generic keys cannot open it |
| Map fragments | A torn map on a body or in a book | Reveals the layout, secret doors or vault of a named deeper level |
| Lore chains | A series of books or graffiti across several levels | The last entry points to a hidden cache or a boss's weakness |
| Rune words | Runes on walls, one letter per level | Speaking the full word at a marked altar grants a blessing or opens a sealed room |
| Rescued specialists | A captive smith, appraiser or trader | Joins a village that lacks that service, adding it to the menu |
| Named rival | The same rival reappearing across levels | Defeating them recovers everything they looted; their journal leads to their stash |
| Shrine sets | Three altars of one god on different levels | Visiting all three grants a lasting buff |
| Lift tokens | A lift keeper's token from a boss | Free or reduced lift fares for the rest of the run |
| Artifact seals | Artifacts from bosses | Each artifact carried weakens the final boss on level 100 |
| Collapsed passages | A lever or charge on one level | Opens a shortcut stair that skips several levels down |

## Acceptance criteria

The generator is done when an automated test run over 10,000 seeds (every level of each) passes all of these.

- [ ] The same seed and level number always produce a byte-identical level.
- [ ] Generating level N never requires generating any other level.
- [ ] 100% of levels pass four-direction connectivity from the up stair to every walkable cell.
- [ ] 100% of levels have both stairs (only an up stair on 100) and any teleporter on a path with no secret door, locked door, deep water or lava.
- [ ] Every locked door's key is reachable without passing through that door.
- [ ] Every run has exactly one village per band, teleporters in reflective pairs, and no artifact twice.
- [ ] Fewer than 1% of levels need the plain-rooms fallback.
- [ ] A large level generates in under 50 ms on a mid-range laptop.
- [ ] Leaving and revisiting a level shows every delta (opened doors, looted chests, dead monsters) exactly as left.

## Open questions

- [x] **Village levels:** a village replaces its level, with Go up and Go down.
- [x] **Stairs:** one up and one down per level.
- [x] **Keys:** consumed on use, valid on any level.
- [x] **Level sizes:** approved pending playtest.
- [x] **Progress pace:** character level 10 around depth 50 to 55.
- [x] **Restocking:** 10% of budget per 500 turns away (cap 50%), a 1 in 200 wandering chance per turn, no treasure restock.
- [x] **Connective elements:** all ten kept.
- [x] **Quest range:** anywhere between the quest's village and the next deeper village (or level 100).
