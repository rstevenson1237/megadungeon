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
- **Persistence:** a level generates on first visit. The save stores only deltas: explored cells, opened or broken doors, looted containers, taken items, dead monsters, where and how hurt the living monsters stand (they stay where they were when the player left, Spec 04), triggered or found traps, NPC state. Revisiting regenerates the level and replays its deltas.
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

**Clarifications (approved October 1, 2026, task 2.2).** All figures are starting values for playtesting.

- **Independent streams:** each element above (villages, teleporters, bosses, artifacts, themes, quests, each link type) draws from its own stream of the run seed, so changing one never moves another.
- **Villages:** each subterranean village takes a name from the village name table, without repeats unless the table runs out.
- **Teleporters:** each non-village level 1 to 99 rolls 10%. The chosen levels are shuffled and paired; if the count is odd, the leftover level gets no teleporter. A level has at most one.
- **Artifacts:** a boss draws from the artifact table by its level's depth, never an artifact already drawn. If no unused artifact fits the depth, any unused one is drawn; if none is left, the boss holds no artifact.
- **Themes:** a theme's unlock level is the first level of its `depth` range. For a level, every unlocked theme is a candidate; each theme in the newest unlock group weighs 3, each in the previous group 2, each in all older groups 1 (times its own `weight`). Village levels have no theme. Level 100 is the one theme whose range covers it.
- **Quests:** each village, the surface included, gets a list of 6. The goal level is any level strictly between the village and the next deeper village, or down to level 100 for the deepest; a village with no level between has no quests. The quest type is drawn evenly from the four types. The gold reward is half the nominal treasure budget (50 + 10 x depth squared) at the goal level, rounded; any item reward is left to the villages task.
- **Cross-level links** sit on non-village levels 1 to 99. Counts per run, and distances, are:

| Link | Per run | Pieces and distances |
| --- | --- | --- |
| Sealed vault | 3 | Key level, then the vault 2 to 5 levels deeper |
| Map fragment | 4 | Fragment level, then the mapped level 1 to 10 deeper |
| Lore chain | 3 | 4 to 6 entries, each 1 to 10 levels below the last; the end points to a cache or to a boss's weakness (a coin flip, boss only if one lies deeper), 1 to 10 levels below the last entry, or on that boss's level |
| Rune word | 1 | 4 to 6 letters, one per level, each 1 to 10 levels below the last; the altar 1 to 10 levels below the last letter |
| Rescued specialist | 3 | One each of smith, appraiser, trader, on any level |
| Named rival | 1 | 4 to 6 appearances, each 1 to 10 levels below the last; the stash 1 to 10 levels below the last appearance |
| Shrine set | 2 | Three altar levels, each 1 to 10 levels below the last |
| Lift token | 1 | Carried by one boss on levels 1 to 99; none if the run has no such boss |
| Collapsed passage | 2 | Lever level, then the landing level 4 to 6 deeper (the stair skips 3 to 5 levels) |
| Artifact seals | none | Follow the boss artifacts |

The god of a shrine set, the rival's name and the pieces' exact placement are chosen when levels are built (task 2.4).

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

**Clarifications (approved October 1, 2026, task 2.3).** All figures are starting values for playtesting.

- **Theme fields:** the theme table gains three optional fields. `stamp` (shafts, river or lake) says what a cellular-caves level stamps in; `liquid` (water or lava) says what its rivers, lakes and channels hold; `pillared` (true or false) adds pillars to a rooms-and-corridors level: in each room of 7 x 5 or more, a wall pillar on every second cell, at least two cells in from the room's edge, so pillars never touch each other or the edge and every floor cell stays four-way connected. Old Mine stamps shafts, Fungal Caverns a river, Underdark Lake a lake, Lava Forges a river with `liquid: lava`; Dwarven Hold is `pillared`. A theme without them gets shafts, water and no pillars.
- **Rooms:** `Level.rooms` lists the chambers a level is built around (monster groups, doors and the boss room use them in task 2.4). Layouts with literal rooms list them: a warren's blob room is listed as the rectangle that fits inside it. Cellular caves have none, so they list clearings: floor-only rectangles from 5 x 3 up to 11 x 7, found by scanning the finished level and kept 2 cells apart. A room's rectangle holds only plain floor, except in pillared halls, where pillars stand inside it.
- **Layouts:**
  - **Mirrored halls:** the left half is a rooms-and-corridors level; the right half is its mirror image; one to three straight corridors cross the centre, each joining a room nearest the centre to its mirror image.
  - **Warren tunnels:** several random walkers carve one-cell tunnels until about 22% of the level is floor; a walker that branches may leave an elliptical blob room (3 to 5 cells across, 2 to 3 tall) at the junction.
  - **Channel grid:** chambers 7 x 5 on a lattice 17 cells across and 11 down; most neighbours are joined by a three-cell channel, a walkway on each side of one row of deep water, or shallow water on one in four. Chambers hold a few puddles of shallow water.
  - **Cellular caves:** 45% random wall, five smoothing passes of the 4-5 rule (a wall stays wall with four or more wall neighbours among its eight; a floor cell turns wall with five or more), only the largest cave kept. Shafts are two to four straight one-cell passages through rock. A river is a meandering one- or two-cell band of deep water with shallow banks and two to four fords. A lake is an ellipse of deep water near the middle of the level, with radii of about an eighth of its width and a sixth of its height, and a two-cell shallow shore. For lava the banks and fords are plain floor.
  - **Maze with crypts:** a one-cell recursive-backtracker maze on odd cells; crypts of 5 or 7 by 3 or 5 cells are cut into it, aligned to the maze.
  - **Freeform chambers:** one chamber per 330 map cells, each an ellipse with one or two smaller ellipses attached, placed apart; the chambers are joined as a spanning tree of L-shaped corridors, plus a few extra links.
  - **Disjoint rooms:** one room in about 70% of the cells of a sparse grid (22 x 10 cells each), joined as a spanning tree plus extra links, all by long corridors. Doors, and so the secret ones, come with the placement pipeline (task 2.4), which may only make a door secret where another route keeps the critical path open.
  - **Set piece:** until the level 100 template (task 3.10) it uses rooms and corridors.
- **Joining regions:** a separate region is joined to the main one by an L-shaped corridor between the nearest pair of cells; where the corridor crosses deep water it is a ford of shallow water, and across lava, plain floor.
- **Stairs:** both stairs go in the interior of a room (a cell not on the rectangle's edge, and plain floor). In mazes, warrens and caves, where the far end of the level is often a dead end or a tunnel, a stair that finds no room cell far enough goes on any plain floor cell far enough instead.
- **Fallback:** after 20 failed tries a level tries rooms and corridors with 20 more sub-seeds, and only then two fixed rooms joined by one corridor.

**Clarifications (approved October 1, 2026, task 2.4).** All figures are starting values for playtesting. Steps 4 to 11 draw from the level's contents stream, so a change here never moves a wall.

- **Doors (step 4):** only layouts with literal rooms get doors, so cellular caves, whose rooms are clearings, get none. An entrance is a one-cell gap with wall on both sides that leads into a room. Each entrance rolls: no door 40, normal 40, locked 10, secret 10. A theme may replace any of these weights with a `doors` field (Dwarven Hold locked 25; Catacomb Labyrinth secret 25; Void Halls secret 40). A locked or secret door that would cut the down stair off from the up stair becomes a normal door.
- **Keys (step 5):** exactly one key per locked door, on plain room floor, reachable from the up stair with no locked, secret or sealed door on the way.
- **Features (step 6):** counts by size, small / medium / large. Containers 6 to 10 / 10 to 16 / 16 to 24, drawn chest 25, sack 35, pottery 30, weapon rack 10. Fixtures 2 to 4 / 3 to 6 / 5 to 9, drawn fountain 30, altar 25, sarcophagus 25, rune 20. Debris cells 4 to 8 / 6 to 12 / 10 to 18. A theme's `features` field multiplies the weight of a kind (the intake's feature bias: the first kind listed x3, the others x2), and its `containers` entry multiplies the number of containers (Underdark Lake x0.5). Containers, fixtures and NPCs stand only on room cells at least one cell in from the room's edge (any cell of a room too small to have one, such as a warren's), never next to one another, and only where the walkable cells around them stay in one piece, so they never block a corridor or doorway. Debris may lie on any plain floor.
- **Traps (step 7):** floor traps 3 to 6 / 5 to 10 / 8 to 16 on plain floor, never on a stair, a doorway or a teleporter, drawn from the trap table by depth and theme. A deep pit is never placed on level 99 or on the level above a village. Container traps: chest 40%, sack 10%, pottery 0%, weapon rack never.
- **Monsters (step 8):** the count is 8 to 12 / 14 to 20 / 22 to 30. Monsters come in groups of 1 to 4 in one room (3 to 6 for a monster tagged `pack`), none within 8 cells of the up stair, rolled from the monsters table by depth and theme. A level whose rooms run out of room fills the rest of the count with single monsters in the tunnels. A monster row's rating is exact; the rating ceiling (and for bosses the ceiling plus 3 dice, capped at 20) only limits which rows can appear at a depth. The modifier figures in Depth scaling are targets for the monsters table, not a roll at placement.
- **Treasure (step 9):** the level's budget is the Spec 02 figure varied by up to 50% either way, split 50% coins, 30% gems, 20% jewelry (Spec 05). It is dealt in parcels with random shares: 60% go in a container, 20% on the floor of a dead end, 20% in a room behind a locked or secret door (in a container if there is none). Each container also rolls a magic item at 10% + depth / 4 %, capped at 40%.
- **NPCs and lore (step 10):** each level rolls a trader 1 in 8, a hermit 1 in 8, a rival 1 in 6 and bandits 1 in 4 (then 1 or 2 of them). Captives come only from quests and rescued specialists. A level has 3 to 6 graffiti and 1 to 3 signs (at the stairs, the vault and the boss room first), and 1 or 2 books inside containers.
- **Specials (step 11):** a teleporter stands on a room cell in the open region, the part of the level reachable from the up stair with no locked, secret or sealed door. The boss sits in the room of the open region farthest from the up stair by walking distance, and holds its artifact and any lift token. A sealed vault is a room with no stair, boss room or key that can be shut at every entrance without cutting anything else off from the up stair: a dead end with one entrance where the layout has one, otherwise a crypt in a maze whose entrances are all sealed, and where no room fits (caves) a 5 x 3 room cut into solid rock behind a one-cell sealed doorway. It holds one chest with an extra treasure parcel, and nothing else is placed in it. A rival's stash and a lore chain's cache are a container with one extra parcel. Quest goals and link pieces sit in the open region, except that a quest's magic item is, in one case in two, behind a locked door when one exists. A shrine set's god, a rune word and a lore chain's text are chosen from the link's own seeded stream, so all of its levels agree.
- **Doors in data:** `Level.doors` lists every door with its kind (normal, locked, secret or sealed). A secret door is drawn as wall in the tiles and a locked or sealed one as a normal door; the game keeps locked and sealed doors shut until task 2.10.

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

## Visibility and explored cells

Spec 01 draws three cell states and leaves the rule for them to this spec. Approved October 1, 2026.

- **Sight:** a cell is visible if it lies within 8 cells of the player (straight-line distance, dx squared plus dy squared at most 64) and an unblocked line of sight reaches it. The player's own cell is always visible. The 8 cells match the awareness range in Spec 04.
- **Blocking:** walls block sight. Closed doors block sight; open doors do not. A secret door blocks sight because it is drawn as wall until found. Water, lava, features, items and creatures never block sight.
- **Walls are seen:** a wall that sight reaches is visible, so a room's boundary draws as soon as its floor does.
- **Explored cells:** every cell that is visible becomes explored and stays explored. Explored cells that are not currently visible are the remembered cells, drawn dimmed with no monsters or loose items. The explored set is the level's "explored cells" delta (see Persistence).
- **No light sources:** every level is equally lit; torches and darkness are out of scope for now.

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
- [ ] Visibility follows the sight rule: radius 8, walls and closed doors block, every visible cell becomes explored and stays explored.
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
