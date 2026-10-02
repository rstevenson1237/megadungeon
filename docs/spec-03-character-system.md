# Megadungeon Spec 03: Character System

Sep 30, 2026 · @Robert Stevenson

This spec defines stats, dice, rolls, health, leveling and the 20 classes, including the 16 additional classes. Approved September 30, 2026.

## Scope

This spec covers the character and the rules every roll follows; the effects of specific items, spells and monsters belong to later specs.

- **In scope:** stats, dice pools, roll resolution, melee, health and recovery, death, XP and leveling, the 20 classes, minor ability draws, character creation.
- **Out of scope:** weapon, armour and magic item effects (items spec), the spell list (magic spec), monster tables (bestiary), full minor ability pools (content tables).
- **Traces to intake:** Characters (stats, dice resolution, melee, health, classes, XP) and the class-names open question.

## Stats and dice pools

Each stat is a pool of identical dice: the step (d4 to d12) sets how good each roll is, and the count sets how many losses the character can absorb.

- **Combat:** melee attacks and defence; the pool is also health.
- **Skill:** checks such as searching, skill uses such as class abilities, and ranged attacks.
- **Magic:** spells and magical checks.
- **Pool size:** one die per stat at level 1, plus one die per level gained, each placed by the player. No pool holds more than 6 dice; a level 10 character has 12 in total.
- **Steps:** every die in a pool shares its step. The class sets starting steps and every later step change; no pool passes d12.
- **One die per roll:** a roll always uses a single die from the pool.
- **Advantage and disadvantage:** roll two dice of the pool's step and keep the higher (advantage) or the lower (disadvantage). At most one die is lost. Non-combat buffs grant advantage rather than a flat +1, so failure always stays possible.

| Step | Success (4 or more) | Success but die lost (2 to 3) | Failure (1) |
| --- | --- | --- | --- |
| d4 | 25% | 50% | 25% |
| d6 | 50% | 33% | 17% |
| d8 | 63% | 25% | 13% |
| d10 | 70% | 20% | 10% |
| d12 | 75% | 17% | 8% |

The middle column only costs a die on a skill use, spell or ranged attack; on a check, 2 to 3 is simply a failure.

## Resolving rolls

Every action falls into one of five roll types; only skill uses, spells and ranged attacks can cost the die rolled.

| Roll type | Stat | 4 or more | 2 to 3 | 1 |
| --- | --- | --- | --- | --- |
| Check (search, force a door, sense magic) | Skill, Combat or Magic, by action | Success | Failure | Failure plus a negative effect |
| Skill use (class abilities) | Skill | Success | Success, die lost | Failure, die lost |
| Spell | Magic | Success | Success, die lost | Failure, die lost |
| Ranged attack | Skill | Hit | Hit, die lost | Miss, die lost |
| Melee | Combat | Opposed roll, below |  |  |

**Melee:** the player rolls one Combat die; the monster rolls a d6 plus its modifier. The higher total hits, and a tie means both are hit. A hit on the player removes one Combat die, and a hit when none are left is fatal; a hit on a monster removes one of its dice, and it dies at zero. Each exchange takes one round.

**Ranged hits** remove one die from the target, which does not roll back.

**Empty pools:** any roll from a pool with no dice left is made at the stat's step with disadvantage. With no die to lose, a 2 to 3 or a 1 costs nothing further.

**Area spells** make one roll for the whole area.

**Negative effects on a 1** come from a table per check type: a wandering monster, a broken lockpick, a triggered trap, a lost turn.

**Equipment hooks:** weapons, armour and magic items can modify rolls, hits or dice lost; the items spec defines them.

## Health, recovery and death

Combat dice are health, Skill and Magic dice are fuel, and only a village fully restores them.

- **Health:** each hit taken removes one Combat die. At zero the character can still act, fighting with disadvantage, but the next hit kills.
- **Waiting:** 10 consecutive rounds of waiting restore one Combat die. Only taking an action or moving resets the count.
- **Skill and Magic dice** do not recover by waiting; potions, hermits and some abilities can restore them.
- **Village rest:** restores every die in every pool, costs about 10 gp (more in deeper villages) and saves the game.
- **Death:** the player chooses between returning to the last save, starting a new character on the same seed with 10% of the bank and one item from inventory, or starting a new seed. The leaderboard records the character either way.

## Experience and leveling

XP comes only from banking treasure, so level ups always happen in a village.

- **Earning XP:** 1 XP per 1 gp of treasure deposited in a bank. Coins count at face value; gems and jewelry at their appraised value. Selling gear earns gold, not XP.
- **Level up:** when a deposit crosses a threshold, the level-up screen opens. Crossing several thresholds at once runs it once per level, in order.
- **Each level up:** one new die, arriving full, in a pool the player chooses (up to 6 dice per pool), one minor ability drawn at random from the class pool, and any class step change for that level.
- **Beyond level 10:** XP keeps counting as the high score on the leaderboard.

| Level | Total XP | Class step change |
| --- | --- | --- |
| 2 | 2,000 |  |
| 3 | 4,000 |  |
| 4 | 8,000 | Yes |
| 5 | 16,000 |  |
| 6 | 32,000 |  |
| 7 | 64,000 | Yes |
| 8 | 128,000 |  |
| 9 | 256,000 | Yes |
| 10 | 512,000 |  |

## Classes

The four core classes come from the intake; the 16 additional classes below are drawn from classic fantasy tropes and approved. All 20 are available from the first run. Starting dice use the two allowed arrays (all d6, or one each of d4, d6 and d8), and each class steps one pool at levels 4, 7 and 9 (C = Combat, S = Skill, M = Magic).

| Class | Start C / S / M | Major ability | Steps at 4 / 7 / 9 | Level 10 C / S / M |
| --- | --- | --- | --- | --- |
| **Warrior** | d8 / d6 / d4 | Cleave: a melee hit that kills carries into an adjacent monster | C / C / S | d12 / d8 / d4 |
| **Mage** | d4 / d6 / d8 | Arcane Bolt: a targeted spell that loses no die on 2 to 3 | M / M / S | d4 / d8 / d12 |
| **Thief** | d6 / d8 / d4 | Backstab: a melee attack on an unaware monster hits and removes 2 dice | S / S / C | d8 / d12 / d4 |
| **Priest** | d6 / d6 / d6 | Heal: a spell that restores one Combat die | M / C / M | d8 / d6 / d10 |
| Barbarian | d8 / d6 / d4 | Rage: for 10 rounds, melee ties hit only the monster | C / S / S | d10 / d10 / d4 |
| Knight | d8 / d6 / d4 | Shield Wall: ignore the first hit taken in each fight | C / C / M | d12 / d6 / d6 |
| Paladin | d6 / d6 / d6 | Smite: after a melee hit, spend a Magic die to remove a second die | C / M / C | d10 / d6 / d8 |
| Ranger | d6 / d8 / d4 | Volley: one ranged roll strikes two targets | S / C / M | d8 / d10 / d6 |
| Monk | d6 / d6 / d6 | Flurry: winning a melee roll by 3 or more removes 2 dice | C / S / C | d10 / d8 / d6 |
| Bard | d6 / d6 / d6 | Fascinate: one visible monster cannot act for d6 rounds | S / M / S | d6 / d10 / d8 |
| Druid | d6 / d6 / d6 | Wild Shape: +1 Combat step for 20 rounds | M / S / M | d6 / d8 / d10 |
| Necromancer | d4 / d6 / d8 | Raise: a monster just killed fights beside you for 20 rounds | M / M / S | d4 / d8 / d12 |
| Sorcerer | d4 / d6 / d8 | Overchannel: spells lose no die on 2 to 3 once per fight | M / M / C | d6 / d6 / d12 |
| Illusionist | d4 / d8 / d6 | Decoy: monsters attack a phantom for 5 rounds | S / M / M | d4 / d10 / d10 |
| Warlock | d6 / d4 / d8 | Pact: trade one Combat die for one Magic die | M / M / C | d8 / d4 / d12 |
| Assassin | d6 / d8 / d4 | Mark: each of your hits on the marked monster removes 2 dice | S / S / C | d8 / d12 / d4 |
| Alchemist | d4 / d8 / d6 | Brew: identifies potions on sight and brews one potion per village rest | S / M / S | d4 / d12 / d8 |
| Shaman | d6 / d4 / d8 | Spirit Totem: waiting beside the totem restores a Combat die every 5 rounds | M / S / M | d6 / d6 / d12 |
| Witch Hunter | d6 / d8 / d4 | Hex Breaker: immune to rune and magic trap effects; ranged hits on casters remove 2 dice | S / C / S | d8 / d12 / d4 |
| Beastmaster | d6 / d8 / d4 | Companion: an animal ally (d6, gains a die every 3 levels) | S / C / M | d8 / d10 / d6 |

Ability numbers are starting values for playtesting.

## Minor abilities

Each class has a pool of 12 minor abilities; one is drawn at random at each level from 2 to 10, so every character ends with 9 draws and builds rarely match.

- **Draws are seeded** from the run seed and character, so they are fixed for a character but vary between characters and seeds.
- **Repeats:** pools may share entries across classes, and stackable entries (such as Pack Mule) can be drawn more than once; other entries are drawn at most once per character.
- **Kinds:** passive buffs (advantage on one non-combat roll type, +1 on melee, extra inventory slots), triggered effects (on a kill, on a 1), and new actives used as skill uses.
- **Inventory slots:** some pools include Pack Mule (+2 slots); this is how class progression raises the 12-slot start.
- **Full pools** for all 20 classes live in the content tables; the examples below set the tone.

| Class | Example minor abilities |
| --- | --- |
| Warrior | Hardy (waiting restores a Combat die in 8 rounds), Weapon Master (+1 on melee with one weapon type), Pack Mule, Second Wind (once per level, regain a Combat die when down to one) |
| Mage | Focus (advantage on spell rolls while not adjacent to a monster), Scholar (identify scrolls and books on sight), Widen (area spells reach one cell further), Mana Well (potions that restore Magic dice restore one extra) |
| Thief | Keen Eye (advantage on search checks), Light Step (floor traps trigger on a 1 only half the time), Fence (+20% when selling), Quick Hands (container traps trigger only on a 1) |
| Priest | Blessed (advantage on checks against undead), Sanctuary (monsters take -2 on melee rolls against you for 3 rounds), Tithe (village rest is free), Purify (remove one curse or poison as a skill use) |

## Character creation

Creation takes three choices and starts the character in the surface village.

1. **Seed:** random seed or seed of the day (title screen).
2. **Class:** from the class list, which shows each class's starting dice, major ability and level 10 dice.
3. **Name:** typed, or a random name from the name table.

The character starts at level 1 with one full die per pool at the class's steps, the class's starting equipment (items spec), 12 inventory slots, and 20 gp in the bank (Spec 05). A new character started on the same seed after a death also carries 10% of the previous bank and the one recovered item.

## Addendum A (approved October 2, 2026)

From Intake Addendum A (findings A2, A3, B3, B4). All figures are starting values for playtesting.

**Using abilities**

- **Q** uses the major ability. When the character also has minor abilities that are used (actives), Q opens a short list, major first, and Enter chooses; with one usable ability Q uses it at once.
- **Active abilities are skill uses:** a Skill die as in Resolving rolls (4 or more works; 2 to 3 works and the die is lost; 1 fails and the die is lost; an empty pool rolls with disadvantage and loses nothing more). One round unless stated.
- **No roll:** passive and triggered abilities work by themselves, and Q says so with no round spent. Pact and Smite need no roll either: they are trades.
- **Spells:** a major ability that is a spell (Arcane Bolt, Heal) is always known, and Q casts it as C would.
- **A fight** begins with the first exchange involving the player (melee, ranged, or a spell aimed at a creature). It ends after 10 rounds in a row with no exchange involving the player. "Once per fight" resets when a fight ends.
- **Extra dice add up:** an effect that makes a hit "remove 2 dice" adds one die to that hit, and several such effects add (Mark with a crossbow removes 3).
- **Timed abilities** (Rage, Wild Shape, Sanctuary) show in the Status block with their rounds left; they are not among the eight status effects.

**The 20 major abilities**

| Class | Ability | Kind | Rule |
| --- | --- | --- | --- |
| Warrior | Cleave | Passive | A player melee hit that kills makes one more melee exchange at once against another adjacent hostile creature (the first clockwise from north). No extra round, and it carries only once |
| Mage | Arcane Bolt | Spell | Always known; loses no die on 2 to 3 (built in task 2.8) |
| Thief | Backstab | Passive | A melee attack with a Light weapon on an asleep or unaware creature hits without an exchange (the creature does not roll) and removes 2 dice. Bare hands are not Light |
| Priest | Heal | Spell | Always known |
| Barbarian | Rage | Active | For 10 rounds, a melee tie hits only the monster |
| Knight | Shield Wall | Passive | The first hit taken in each fight is ignored; armour does not roll to break. The pane shows when it is ready |
| Paladin | Smite | Trade | Q readies it (no round; Q again cancels). The next melee hit spends one Magic die, with no roll, and removes one extra die. It cannot be readied with no Magic die |
| Ranger | Volley | Active | Needs a readied ranged weapon (not a thrown dagger). Q enters targeting; Enter picks a first and then a second, different target (with one valid target it fires at that one). One Skill roll as a ranged attack resolves both, spending one shot per target |
| Monk | Flurry | Passive | Winning a melee exchange by 3 or more removes one extra die |
| Bard | Fascinate | Active | Any creature in sight (no range limit, no line of fire needed) is Held for d6 rounds. It makes no noise and alerts no one |
| Druid | Wild Shape | Active | +1 Combat step for 20 rounds, never past d12 |
| Necromancer | Raise | Active | The most recent creature to die within 8 cells and in sight in the last 3 rounds, not a boss, rises on its cell as an ally (Spec 04) with its starting dice and modifier for 20 rounds, then crumbles. One raised ally at a time |
| Sorcerer | Overchannel | Passive | The first spell roll of 2 to 3 in each fight loses no die |
| Illusionist | Decoy | Active | A cursor as for Blink picks a visible free cell within 5; a phantom stands there for 5 rounds (Spec 04, Allies) |
| Warlock | Pact | Trade | One round, no roll: lose one Combat die and gain one Magic die. Needs a Combat die to give and a Magic die missing |
| Assassin | Mark | Active | Targets an asleep or unaware creature in sight. It stays marked until it dies or the player leaves the level, one mark at a time; each of the player's hits on it removes one extra die |
| Alchemist | Brew | Passive | Every potion shows its true kind once seen (in the pack, a shop, a trader's stock or on the floor in view). At each village rest one potion, drawn from the potion rows by the village's depth and seeded by the run seed and rest count, goes into the pack; with no room the log says so and it is lost |
| Shaman | Spirit Totem | Active | A totem on a free adjacent cell blocks movement but not sight, one at a time, until the player leaves the level. Waiting while next to it (any of the 8 cells) restores a Combat die every 5 rounds; with other wait effects the shortest wins |
| Witch Hunter | Hex Breaker | Passive | A magical rune never discharges on the player (a 1 simply fails); traps tagged `magic` do nothing when sprung; ranged hits on a creature with the caster behaviour remove one extra die |
| Beastmaster | Companion | Passive | An animal ally (Spec 04) with 1 die (d6+0), gaining a die at character levels 4, 7 and 10. It follows the player between levels and villages; if killed it returns at the next village rest |

**The example minor abilities** (Minor abilities table), as effects from the Spec 08 vocabulary

| Ability | Rule |
| --- | --- |
| Hardy | Waiting restores a Combat die in 8 rounds |
| Weapon Master | +1 on melee rolls with the weapon base wielded when drawn; drawn bare-handed, it attaches to the next weapon equipped |
| Pack Mule | +2 pack slots, stackable; the pack grows the moment it is drawn |
| Second Wind | Once per level visit: when a hit leaves the player with one Combat die, regain one |
| Focus | Advantage on spell rolls while no hostile creature is adjacent |
| Scholar | A spellbook shows its spell and a book its lore-chain place before reading; reading a spellbook learns it on 2 to 3 as well as on 4 or more (a decision in Intake Addendum A) |
| Widen | An area spell's footprint grows by one cell each way (3 x 3 to 5 x 5); a caster-centred spell reaches one cell further |
| Mana Well | Potions that restore Magic dice restore one extra |
| Keen Eye | Advantage on search checks and passive notice |
| Light Step | On the avoid check for a hidden floor trap, 2 to 3 jumps clear like a 4 or more, and a 1 springs it one time in two |
| Fence | +20% when selling (built) |
| Quick Hands | Opening a container whose trap is not found makes a Skill check: only a 1 springs it; otherwise the trap is found, not sprung |
| Hallowed (was Blessed) | Advantage on Combat checks and melee defence against creatures tagged `undead`. Renamed so it does not share a name with the Blessed status (a decision in Intake Addendum A) |
| Sanctuary | Active: for 3 rounds, monsters take -2 on melee rolls against the player |
| Tithe | Village rest is free |
| Purify | Active: lifts the curse of one worn cursed item (and the Cursed status if no curse is left), or else ends Poisoned |

**One owner for the dice**

- The character's rules state is the only record of the pools, the level, XP and the minor abilities. The game reads and changes it, and the pane only reads it. Anything derived from abilities (pack slots, wait rounds, sell bonus) is computed from it when needed, never copied.

**Acceptance criteria added**

- [ ] Each of the 20 major abilities works as its row says, in a scripted arena test per class, and Q on a passive ability spends no round.
- [ ] Each example minor ability works as its row says, and a Pack Mule drawn at level up grows the pack at once.
- [ ] A character created through the creation screen in each class plays to level 10 with its draws in effect.

## Acceptance criteria

- [ ] Each roll type resolves exactly as the Resolving rolls table says, verified by unit tests over every face of every step, with and without advantage and disadvantage.
- [ ] Melee ties hit both sides; a monster dies at zero dice; the player dies only when hit with no Combat dice left.
- [ ] Rolls from an empty pool use disadvantage and cost nothing further.
- [ ] Waiting 10 rounds restores one Combat die, and only an action or a move resets the count.
- [ ] Village rest restores every pool and saves.
- [ ] Banking crosses thresholds at the listed totals and runs one level-up screen per level crossed.
- [ ] No pool holds more than 6 dice or steps past d12, and every class's level 10 steps match the class table.
- [ ] The same character on the same seed always draws the same minor abilities, repeating only stackable entries.
- [ ] All 20 classes can be created and played to level 10 in a scripted test.

## Open questions

All questions are resolved.

- [x] **Class names:** the 16 proposed classes are approved.
- [x] **Class access:** all 20 available from the first run.
- [x] **Empty pools:** roll at the stat's step with disadvantage.
- [x] **Wait reset:** only an action or a move resets the count.
- [x] **Level-up die:** arrives full.
- [x] **Minor pools:** 12 per class, 9 drawn, shared and stackable entries allowed.
- [x] **Pool cap and death:** 6 dice per pool; death on a hit with no Combat dice left.
