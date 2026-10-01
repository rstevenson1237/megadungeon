# Megadungeon Spec 06: Features, Traps and Lore

Sep 30, 2026 · @Robert Stevenson

This spec defines how the player interacts with everything Spec 02 places on a level besides monsters and loose items. Approved September 30, 2026.

## Scope

This spec covers what happens when the player searches, opens, drinks from, reads or steps on something Spec 02 placed.

- **In scope:** searching, doors and locks, containers, fountains, altars, sarcophagi, runes, debris, floor and container traps, lore and the lore journal, and the negative-effect table for rolled 1s.
- **Out of scope:** where features are placed (Spec 02), item contents (Spec 05), spell effects (Spec 04), full effect and text tables (content tables).
- **Traces to intake:** Dungeon contents, Dice resolution (checks), Connective elements (Spec 02), and Spec 01's X, E and L keys.

## Searching and hidden things

Secret doors, hidden traps and small caches stay invisible until a search finds them.

- **Search (X):** one round. Makes a Skill check for each hidden thing in the 8 cells around the player. A 4 or more reveals it; a 1 triggers the check's negative effect (see the last table) once, not per hidden thing.
- **Passive notice:** the first time the player steps next to a hidden thing, it gets one free Skill check with disadvantage.
- **Buffs:** Keen Eye and similar give advantage on searches; the Detect spell reveals everything hidden within 8 cells with no roll.
- **Once found, always found:** revealed things stay revealed and are saved as a level delta (Spec 02).
- **Debris** can be searched like any cell: a success on a debris cell may turn up a few coins or a minor item from a small table.

## Doors and locks

A locked door or chest can be opened three ways, each trading certainty for cost or noise.

| Door or lock | How to open | Result |
| --- | --- | --- |
| Normal door | Move into it | Opens; costs the move |
| Secret door | Search to find it, then move into it | Behaves as a normal door once found |
| Locked, with a key | Move into it while carrying a key | Opens; the key is consumed (Spec 02) |
| Locked, picking | Interact (E) while carrying lockpicks: a Skill check | 4 or more opens; 2 to 3 fails, try again; 1 breaks one lockpick |
| Locked, forcing | Interact (E) with no key or lockpicks: a Combat check | 4 or more breaks it open; otherwise fails. Every attempt alerts unaware monsters within 6 cells |

- **Lockpicks** are a tool bought in shops (10 per slot, 5 gp each).
- **Forced doors** stay broken open and can no longer be closed.
- **Closing a door** is an interact action; closed doors block sight.
- **Sealed vault doors** (Spec 02 connective elements) open only with their named vault key; they cannot be picked or forced.

## Containers

Containers hold most of a level's treasure (Spec 02), and each kind has its own risk and reward.

| Container | Opening | Typical contents | Risks |
| --- | --- | --- | --- |
| Chest | Interact; some are locked (as doors) | The richest: coins, gems, jewelry, magic items | Often trapped |
| Sack | Interact | Coins, ammunition, lockpicks, minor items | Rarely trapped; bandits sometimes stash loot here |
| Pottery | Interact smashes it | Coins or a potion, often nothing | Noise alerts unaware monsters within 4 cells; may release vermin |
| Weapon rack | Interact | One or two weapons, usually crude or normal, sometimes fine or magic | Never trapped |

- **Looting:** opening shows a pick-up list in the main view (Spec 01); taking items costs no extra round.
- **Looted containers** show dimmed and stay empty; they never restock (Spec 02).
- **Rivals** loot containers on their way to the stairs, which is how treasure can vanish before the player arrives.

## Fixtures

Fixtures are gambles: each offers something useful with a chance of something bad, resolved by a check or a table roll.

| Fixture | Interact | Good outcomes | Bad outcomes | Limit |
| --- | --- | --- | --- | --- |
| Fountain | Drink: a roll on the fountain table | Restore a Combat, Skill or Magic die; cure poison; reveal the level map; coins in the basin | Poison; a water creature attacks; nothing | Dries up after 1 to 3 drinks |
| Altar | Offer gold (at least 10 gp times depth) or an item, then a Magic check | Blessed for the level; lift a curse; identify one item | On a 1, Cursed | One offering per altar |
| Sarcophagus | Lift the lid: a Combat check | Treasure, often jewelry; sometimes a named item | 1 in 3 chance an undead rises; on a 1, the lid crushes (lose a Combat die) | Once opened, stays open |
| Magical rune | Read a wall rune, or step on a floor rune: a Magic check | Learn a rune-word letter (Spec 02); a ward (Shield for 20 rounds) | On a 1, it discharges: fire (lose a Combat die) or teleport to a random cell | Spent after one success or discharge |

- **Shrine sets:** altars belong to gods; visiting all three altars of one god (Spec 02) grants its lasting buff when the third offering succeeds.
- **Theme weights** decide which fixtures appear where (intake level themes).

## Traps

Traps are hidden until found; a found trap can be walked around or disarmed.

| Floor trap | Effect when triggered |
| --- | --- |
| Dart | Lose one Combat die |
| Pit | Lose one Combat die |
| Poison gas | Poisoned (Spec 04) |
| Sleep gas | Asleep for 5 rounds |
| Net | Held for 3 rounds |
| Alarm | Every monster on the level becomes alert |
| Teleport | Moved to a random cell on the level |
| Collapse | Lose one Combat die; the cell becomes debris |
| Deep pit | Fall to the level below at a random cell and lose one Combat die. Never placed on level 99 or on the level above a village |

| Container trap | Effect when triggered |
| --- | --- |
| Poison needle | Poisoned |
| Fire burst | Lose one Combat die |
| Alarm | Every monster on the level becomes alert |
| Summoning | A monster from the depth table appears beside the container |

- **Stepping on a hidden floor trap:** a Skill check to avoid it. 4 or more jumps clear and reveals it; 2 to 3 or 1 triggers it.
- **Opening a trapped container** triggers its trap unless it was found (by searching next to it) and disarmed.
- **Disarming (E on a found trap):** a Skill check. 4 or more removes it; 2 to 3 fails safely; 1 triggers it.
- **Monsters** and NPCs never trigger traps; they always step around them, so traps only ever catch the player.
- **Depth:** below level 50, dart, fire and collapse traps cost two Combat dice instead of one.

## Lore

Lore turns the dungeon into a place with a history, and some of it is useful: every entry read is kept in a journal.

| Lore | Found as | Content |
| --- | --- | --- |
| Book | Item in a container or on a shelf | Flavour, history of the level's theme, a hint, a lore-chain entry, or rarely a spellbook (Spec 04) |
| Graffiti | Glyph on a wall | Short warnings or boasts from past delvers, some pointing at traps or secret doors nearby |
| Sign | Glyph on a wall or post | Place names and directions, often near stairs, vaults and boss rooms |

- **Reading:** interact (E) for signs and graffiti, or use a book from the pack; one round. The text shows in the main view and a summary line goes to the log.
- **Hints are true:** like rumours, a hint is never false but may be stale (the rival may already have taken the cache).
- **Journal:** every lore entry, rumour and quest the player has seen is kept in a journal overlay (J key), grouped by level, so lore chains (Spec 02) can be followed.
- **Books** take a pack slot until dropped; reading one adds it to the journal, so it can then be dropped or sold.

## Negative effects on a rolled 1

A 1 on a check always costs something, and the cost fits what the player was doing.

| Check | Negative effect on a 1 |
| --- | --- |
| Search | A wandering monster arrives (Spec 02) |
| Pick a lock | One lockpick breaks |
| Force a lock | Lose one Combat die (strain), and the noise alerts nearby monsters as usual |
| Avoid or disarm a trap | The trap triggers |
| Read a spellbook | The book is destroyed, and the reader is Cursed for 20 rounds |
| Altar offering | Cursed until lifted |
| Sarcophagus lid | The lid crushes: lose one Combat die |
| Magical rune | It discharges: fire or teleport |
| Any other check | A wandering monster arrives |

Skill uses, spells and ranged attacks already lose the die on a 1 (Spec 03) and do not also roll on this table.

## Acceptance criteria

- [ ] A search rolls once per hidden thing in the 8 surrounding cells and applies at most one negative effect.
- [ ] Passive notice fires once per hidden thing, with disadvantage.
- [ ] Every door and lock path in the doors table works, including key consumption, broken lockpicks and noise from forcing.
- [ ] Each container and fixture resolves as its table says and records its used state as a level delta.
- [ ] Every floor and container trap applies its effect; avoid and disarm checks follow the listed results.
- [ ] Deep pits never appear on level 99 or above a village, and landing always puts the player on a walkable cell.
- [ ] Every lore entry read appears in the journal, grouped by level.
- [ ] Each check type applies its own negative effect on a 1.

## Open questions

- [x] **Lockpicks:** a bought tool, 5 gp each, 10 per slot.
- [x] **Pits:** both kinds; pits cost a die, deep pits drop a level.
- [x] **Deep traps:** two Combat dice below level 50.
- [x] **Monsters and traps:** monsters and NPCs never trigger traps.
- [x] **Journal key:** J opens the journal.
