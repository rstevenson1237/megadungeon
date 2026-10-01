# Megadungeon Roguelike: Project Intake

Sep 29, 2026 · @Robert Stevenson

## Vision and pillars

A browser-based, text-mode roguelike set in a 100-level megadungeon beneath a surface village, where treasure only counts once you haul it home. The game pairs procedural generation with large hand-written content tables so every run feels new but every room still feels authored.

**Design pillars**

- **Classic look, modern delivery:** CP437 glyphs in a three-pane terminal layout, running in any browser, built in TypeScript.
- **Delve and return:** XP comes from banking treasure in town, so every descent is a push-your-luck decision about when to turn back.
- **Depth as the progression axis:** 100 levels, themed zones, subterranean villages every 20 levels, and teleporters that reward exploration with shortcuts.
- **Simple dice, meaningful choices:** three stats rated d4 to d12, 20 classes, and a new ability or buff every level up to a cap of 10.
- **Crafted detail at scale:** large content tables for features, lore, items and rumours keep replayability high without losing texture.

## Development process

Work moves through four documents, and nothing advances until you approve the one before it. This intake is step 1.

1. **Intake (this doc):** capture every requirement and surface the open questions. Gate: you confirm scope and answer the open questions.
2. **Specs:** one spec per system, each traceable to intake sections, with rules, data shapes and acceptance criteria. Gate: you approve each spec.
3. **Mockups:** visual specs (main view, character pane, log, village screens, targeting overlay) get a rendered mockup before any code. Gate: you sign off on the look.
4. **Phased implementation plan:** tasks, dependencies and milestones mapped to the three build phases. Gate: you approve the plan, then build begins.

**Proposed spec breakdown**

- Rendering and UI shell (CP437 grid, panes, input, targeting)
- Dungeon generation and level themes
- World structure (villages, stairs, teleporters, persistence)
- Character system (stats, classes, abilities, XP)
- Combat and magic resolution
- Items, treasure and inventory
- Dungeon features, traps and lore
- Village services and economy
- Content tables and data format
- Save/load and run structure

## Platform and interface

The game runs in the browser, is written in TypeScript, and draws everything on a CP437 character grid split into three panes.

| Pane | Position | Contents |
| --- | --- | --- |
| Main view | Center / left, largest | Dungeon or village map, player, monsters, items, targeting reticle |
| Character view | Right side | Name, class, level, XP, Combat/Skill/Magic dice, health, equipment, abilities, status effects |
| Log | Bottom | Combat results, discoveries, rumours, system messages |

**Targeting:** ranged attacks and targeted magic auto-select the closest valid target. The player can cycle through all valid targets before confirming.

**Magic shapes:** self, single target, and area of effect. Area spells will need a visible footprint preview on the main view.

**Controls and display**

- Keyboard only: WASD or arrow keys to move, plus keys for waiting, target cycling and actions.
- Fixed-size screen that scales to fit the browser viewport.
- Desktop only at launch; no mobile support.

## World structure

The world is a surface village at level 0 above 100 procedurally generated dungeon levels, with subterranean villages and teleporters as the only shortcuts. Reaching level 100 wins, but there is enough content to play it as a sandbox.

- **Surface village (level 0):** the home base with the full set of services.
- **Seed:** the player picks a random seed or the seed of the day.
- **Dungeon levels 1 to 99:** procedurally generated from the seed and connected by stairs. Levels persist: the same seed always rebuilds the same level.
- **Level 100:** the final level, not a village, with a theme reserved for it alone.
- **Subterranean villages:** five, one on a random level within each 20-level band.
- **Lift:** connects villages for a price. A village joins the lift network once the player has visited it.
- **Teleporters:** two-way portals on about 10% of levels. Each links to a random level, possibly deeper than the player has been, and stays locked until the player reaches that destination on foot. Links are always reflective: the destination portal leads back.
- **Boss creatures:** each level has a 5% chance of a boss guarding an artifact. Artifacts are unique within a run.
- **Leaderboard:** kept in browser local storage, recording seed, character name, class and level, deepest level reached, and monsters killed.

**Level themes:** 12 themes, with more becoming available at deeper levels, plus the level 100 theme. Each theme varies:

- Overall level size
- Layout style (e.g. rooms and corridors, caverns, mazes)
- Color scheme and tile set
- Room size and shape tendencies
- Preferred features (which containers, altars, traps and lore appear most)

**Level themes (approved)**

Four themes are available from level 1 and two more unlock every 20 levels, matching the village spacing. Unlocked themes stay in the pool, weighted toward the newest, so shallow themes still appear deep but thin out.

| Theme | From level | Layout | Size | Palette | Feature bias |
| --- | --- | --- | --- | --- | --- |
| Cellars and Crypts | 1 | Small rooms, straight corridors | Small | Grey, brown | Sarcophagi, pottery, debris |
| Goblin Warrens | 1 | Winding tunnels, irregular rooms | Small | Brown, ochre | Sacks, graffiti, floor traps |
| Flooded Sewers | 1 | Grid of channels and junctions | Medium | Green, teal | Water tiles, sacks, grates |
| Old Mine | 1 | Shafts and rough caverns | Medium | Ochre, yellow | Debris, weapon racks, collapse traps |
| Ruined Temple | 20 | Symmetric halls, large rooms | Medium | White, gold | Altars, fountains, runes, books |
| Fungal Caverns | 20 | Open organic caves | Large | Purple, lime | Debris, pottery, spore traps |
| Dwarven Hold | 40 | Orthogonal pillared halls | Large | Steel blue, gold | Weapon racks, chests, locked doors, signs |
| Catacomb Labyrinth | 40 | Maze with small crypts | Medium | Bone, grey | Sarcophagi, secret doors, floor traps |
| Wizard's Sanctum | 60 | Odd-shaped rooms, round chambers | Medium | Violet, cyan | Runes, books, altars, container traps |
| Underdark Lake | 60 | Vast cavern around water and islands | Large | Deep blue, silver | Fountains, lore signs, few containers |
| Lava Forges | 80 | Caverns cut by lava channels | Large | Red, orange | Weapon racks, altars, runes, fire traps |
| Void Halls | 80 | Disjointed rooms, heavy secret doors | Medium | Black, magenta | Runes, secret doors, magic traps |
| The Abyssal Throne | 100 only | Single set-piece level | Large | Crimson, black | Final boss, artifacts, lore |

## Characters

Characters are built from three dice-rated stats, one of 20 classes, and a 10-level track where XP comes only from banked treasure.

**Stats**

- Three stats: **Combat**, **Skill**, **Magic**.
- Each stat is a pool of dice sharing one step, from d4 to d12; d6 is average. A step change applies to every die in the pool.
- A new character has one die in each stat. The class sets each stat's starting step (d6 / d6 / d6 or d4 / d6 / d8) and every step change at level gain. No stat can exceed d12.
- Each level up adds one die to a stat of the player's choice, up to 6 dice per stat.
- Only one die from a pool is rolled at a time.

**Dice resolution**

| Roll | Check | Skill use, spell or ranged attack |
| --- | --- | --- |
| 4 or more | Success | Success |
| 2 to 3 | Failure | Success, but the rolled die is lost |
| 1 | Failure plus a negative effect (wandering monster, lockpick breaks) | Failure, and the rolled die is lost |

Class abilities count as skill uses; checks cover actions like searching. An area spell makes one roll for the whole area.

**Melee:** attacker and defender each roll one Combat die. The higher roll hits; a tie means both are hit. Each hit costs the target one Combat die.

**Monsters:** rated 1 to 20, the number of d6s they have. A monster rolls a single d6 plus its modifier (-2 to +6), and each hit removes one of its dice, so a rating of n takes n hits to destroy.

| Monster | Rating | Roll | Hits to destroy |
| --- | --- | --- | --- |
| Kobold | d6-1 | d6 - 1 | 1 |
| Goblin | d6 | d6 | 1 |
| Orc | d6+1 | d6 + 1 | 1 |
| Hobgoblin | 2d6+1 | d6 + 1 | 2 |
| Ogre | 4d6+1 | d6 + 1 | 4 |

**Health and recovery**

- Combat dice are health; a hit taken with no Combat dice left kills.
- Waiting 10 rounds with no action restores one Combat die.
- Resting is possible only at village lodging. It restores every die in every stat and saves the game (single save slot).
- On death, the player chooses: return to the last save, start a new character on the same seed keeping 10% of banked gold and one item from inventory, or start fresh on a new seed.

**Classes**

- 4 core classes: **Warrior, Mage, Thief, Priest**.
- 16 additional classes drawn from classic fantasy role-playing tropes; names are proposed in the class spec.
- Each class has one **major ability** from level 1.
- Each level up grants one **minor ability or buff**, drawn at random from the class's pool (9 draws, levels 2 to 10).

**Experience and leveling**

- XP is earned only when treasure is deposited in a village bank, at 1 XP per 1 gp of value.
- 2,000 XP reaches level 2 and each threshold doubles; totals are cumulative; the cap is level 10.
- XP earned past level 10 counts toward a high score.

| Level | Total XP (cumulative) | Gains |
| --- | --- | --- |
| 1 | 0 | Major ability, starting dice |
| 2 | 2,000 | Extra die, minor ability/buff |
| 3 | 4,000 | Extra die, minor ability/buff |
| 4 | 8,000 | Extra die, minor ability/buff, class die step |
| 5 | 16,000 | Extra die, minor ability/buff |
| 6 | 32,000 | Extra die, minor ability/buff |
| 7 | 64,000 | Extra die, minor ability/buff, class die step |
| 8 | 128,000 | Extra die, minor ability/buff |
| 9 | 256,000 | Extra die, minor ability/buff, class die step |
| 10 | 512,000 | Extra die, minor ability/buff |

## Dungeon contents

Every level draws from one shared catalog of features, weighted by its theme.

| Category | Entries |
| --- | --- |
| Navigation | Stairs, teleporters |
| Doors | Normal, locked, secret |
| Containers | Chests, sacks, pottery, weapon racks |
| Fixtures | Fountains, altars, sarcophagi, magical runes |
| Traps | Floor traps, container traps |
| Clutter | Debris |
| Inhabitants | Monsters, boss creatures (about 5% of levels) |
| NPCs | Rivals, traders, bandits, hermits, captives |
| Pickups | Keys, treasure, magic items, artifacts (from bosses) |
| Lore | Books, graffiti, signs |

**NPC behaviour**

- **Rivals:** delvers heading for a stair, killing monsters and taking treasure on the way, so loot can be gone before the player arrives.
- **Bandits:** hostile; they attack the player and steal treasure.
- **Traders:** sell a random stock of goods.
- **Hermits:** offer identification, healing or rumours.
- **Captives:** the targets of rescue quests.

## Items and treasure

Treasure is the XP currency; magic items and weapons are the power curve.

- **Treasure:** coins, gems, jewelry. Coins count at face value; gems and jewelry are appraised in a village at 60% to 120% of base value.
- **Artifacts:** powerful prizes held by boss creatures. They never break.
- **Magic items:** potions, rings, rods, staves, wands, clothing, armour, weapons. Unidentified until identified in a village for a fee.
- **Weapons:** melee or ranged. Ranged attacks resolve as skill use and use auto-target and cycling.
- **Magic (spells and item effects):** self, single target, or area of effect.
- **Keys:** found in the dungeon; open locked doors (and possibly locked containers).

**Durability**

| Quality | Break chance |
| --- | --- |
| Crude | 15% |
| Normal | 3% |
| Fine | 1% |
| Artifact | Never |

Breaks are rolled for weapons and armour on a hit.

**Inventory:** 12 slots to start; class progression can add more. Most items take one slot, large items take more, small items may stack, and 100 coins or gems fit in one slot.

**Selling:** found gear and magic items sell for gold only; they earn no XP.

## Villages

Villages close the core loop: bank treasure for XP, recover, re-equip, and pick up leads for the next descent.

Villages are menu based: there is no village map, and services are chosen from a list.

| Service | Role in the loop | Surface | Subterranean |
| --- | --- | --- | --- |
| Bank | Deposit treasure for XP; one balance shared by every village; gold stays in the bank and pays town costs automatically | Yes | Always |
| Lodging | The only place to rest; restores all dice and saves the game | Yes | Always |
| Lift | Travel to any village already visited, for a price | Yes | Always |
| Appraisal and identification | Appraise gems and jewelry; identify magic items for a fee | Yes | Random |
| Shops | Buy and sell gear and consumables | Yes | Random |
| Repairs | Restore damaged equipment | Yes | Random |
| Rumours | Always true, not always valuable | Yes | Random |
| Quests | Return a captive, find a lost belonging, collect a magic item, kill an opponent | Yes | Random |

**Costs** (averages; prices rise with the depth of the village)

| Service | Average cost |
| --- | --- |
| Rest | 10 gp |
| Identification | 100 gp |
| Repair | 30% of item value |
| Lift | Random, always rising with distance travelled and depth |

## Build phases

The build runs in three phases, each closed by a gate you approve; the contents below are a proposed split for the phased plan to refine.

Build phases (diagram as text):

| Gate / Phase | Contents |
| --- | --- |
| Gate: Plan approved | Specs and mockups signed off |
| Phase 1: UI + proof of concept | CP437 grid renderer; three-pane layout; movement and input; basic level generator; stairs, surface village stub; targeting and cycling |
| Gate: Playable slice | Walk, descend, return |
| Phase 2: Mechanics | Stats, dice, classes, XP; combat and magic shapes; items, inventory, keys; traps, doors, containers; village services and bank; teleporters, save/load |
| Gate: Systems complete | Full loop: delve, bank, level |
| Phase 3: Content | Level themes and tile sets; 16 additional classes; monster and item tables; lore, rumours, quests; subterranean villages; balance to level 100 |
| Gate: Content complete | Levels 1 to 100 playable |

Phase 1 proves the look and feel on a thin slice, Phase 2 makes every system work end to end, and Phase 3 fills the tables that carry replayability.

## Open questions

Three rounds of answers are folded into the sections above. Only the class names remain, settled in the class spec. The intake is closed for specs.

- [x] **Themes:** approved as recommended in World structure.
- [ ] **Class names:** approve the 16 trope-based classes when the class spec proposes them.
