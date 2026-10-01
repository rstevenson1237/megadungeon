# Megadungeon Spec 04: Combat and Magic

Sep 30, 2026 · @Robert Stevenson

This spec builds on Spec 03's roll rules to define turns, awareness, attacks, spells, status effects and how monsters fight. Approved September 30, 2026.

## Scope

This spec turns Spec 03's roll rules into a working fight: who acts when, who notices whom, how every attack resolves, what spells exist, and how enemies behave.

- **In scope:** turn order, speed, awareness and stealth, melee and ranged for both sides, spell casting and learning, the starting spell list, status effects, monster and hostile NPC behaviour.
- **Out of scope:** weapon and armour numbers (items spec), individual monster entries (bestiary), traps (features spec).
- **Traces to intake:** Dice resolution, Melee, Magic shapes, Targeting (Spec 01), NPC behaviour, and Spec 03 in full.

## Turns and timing

The game is strictly turn-based: nothing moves until the player acts, and every action costs one round.

- **Round order:** the player acts, then every monster and NPC on the level acts in order of distance to the player, nearest first.
- **One action per round:** move one cell, attack, cast, use an ability, interact, pick up, or wait. Opening inventory, looking and targeting are free until confirmed.
- **Speed:** normal creatures act every round. Fast creatures act twice per round; slow creatures act every other round. Haste and Slow change the player's speed the same way.
- **Off-screen monsters** act too, so rivals really do race the player to the stairs, but at most 50 creatures are simulated per round, nearest first.

## Awareness and stealth

Monsters start asleep or unaware, which is what makes Backstab, Sleep and careful play pay off.

| State | Behaviour | Becomes alert when |
| --- | --- | --- |
| Asleep | Does not move | It rolls a 6 on a d6 each round the player is within 8 cells in its line of sight, or is attacked, or combat happens within 3 cells |
| Unaware | Wanders or guards | It rolls 4 or more on a d6 each round the player is within 8 cells in its line of sight, or is attacked, or combat happens within 6 cells |
| Alert | Hunts the player | Loses track after 20 rounds with the player out of sight, then returns to Unaware |

- **Unaware targets:** Backstab, Mark and similar abilities need an asleep or unaware target.
- **Stealth buffs** (from class abilities or items) give monsters disadvantage on their notice roll.
- **Rivals** ignore the player unless attacked; bandits are always alert once they see the player.

## Attacks

Every attack is one of four kinds, and each attack is its own exchange: if the player and a monster both attack in a round, two exchanges happen.

| Attack | Attacker rolls | Defender rolls | Result |
| --- | --- | --- | --- |
| Player melee | One Combat die (+ weapon modifiers) | Monster d6 + modifier | Higher hits; a tie hits both |
| Monster melee | Monster d6 + modifier | One Combat die (+ armour modifiers) | Higher hits; a tie hits both |
| Player ranged | One Skill die, as a skill use | Nothing | 4 or more hits; 2 to 3 hits but the die is lost; 1 misses and the die is lost |
| Monster ranged or spell | Monster d6 + modifier | One Skill die (ranged) or Magic die (spell), not spent | Monster higher: the player loses a Combat die; otherwise it misses |

- **Hits:** each hit removes one die from the target unless an ability or item says more.
- **Unaware defenders** roll with disadvantage in melee.
- **Ranged at an adjacent target:** the attacker has disadvantage.
- **Range and line of fire:** ranged attacks need a clear line (Spec 01 targeting) and stay within the weapon's range (items spec). Creatures in the line block it.
- **Rolling from an empty pool:** disadvantage, as in Spec 03, for attack and defence alike.
- **Ammunition:** tracked per type (arrows, bolts, sling stones) and bought in village shops. Each ranged attack spends one, and fired ammunition is gone for good; with none left, the weapon cannot fire.

## Spells

Any class can learn and cast spells, but magic-led classes start with more of them and roll better Magic dice.

- **Casting:** choose a spell (C), target it if needed (Spec 01), then roll one Magic die as a spell roll (Spec 03). Area spells roll once for the whole area.
- **Starting spells:** Mage 3 (Arcane Bolt plus 2 drawn from the list), Priest 2 (Heal plus 1), Sorcerer, Necromancer, Warlock, Druid, Shaman and Illusionist 2, Paladin and Bard 1, all other classes none.
- **Learning:** spellbooks are rare lore finds. Reading one is a Magic check: 4 or more learns the spell for good; 2 to 3 fails but can be retried after the next village rest; 1 destroys the book and triggers a negative effect.
- **Buying:** deeper village shops sometimes stock spellbooks.
- **Items:** wands, rods and staves cast a set spell from charges without rolling a Magic die (items spec).
- **No spell limit:** a character can know any number of spells.

## Starting spell list

Fifteen spells cover the three shapes at launch; more arrive through the content tables. Effects apply on a successful spell roll.

| Spell | Shape | Effect | Reach |
| --- | --- | --- | --- |
| Heal | Self | Restore one Combat die |  |
| Shield | Self | Ignore the next hit taken within 10 rounds |  |
| Haste | Self | Act twice per round for 3 rounds |  |
| Light | Self | Light the current room or 8 cells around you, revealing it | 8 cells |
| Detect | Self | Reveal traps and secret doors within range | 8 cells |
| Blink | Self | Move instantly to a visible cell within range | 5 cells |
| Arcane Bolt | Target | Remove one die from the target | 8 cells |
| Sleep | Target | An unaware or alert target falls asleep for d6 rounds | 6 cells |
| Hold | Target | The target cannot act for 3 rounds | 6 cells |
| Drain | Target | Remove one die from the target and restore one Combat die to you | 4 cells |
| Fear | Target | The target flees for 5 rounds | 6 cells |
| Fireball | Area | Remove one die from every creature in a 3 x 3 area | 8 cells |
| Blizzard | Area | Every creature in a 5 x 5 area is slowed for 5 rounds | 8 cells |
| Thunderclap | Area | Push every adjacent creature 2 cells away | Around you |
| Turn Undead | Area | Undead within range flee for 10 rounds | 6 cells |

Area spells centred on the caster (Thunderclap, Turn Undead) never hit the caster. Targeted area spells (Fireball, Blizzard) hit every creature in the footprint, the caster included if they stand in it, which the targeting preview shows (Spec 01).

## Status effects

Eight status effects apply to the player and monsters alike; each shows in the character pane's Status block with its remaining rounds.

| Effect | What it does | Ends |
| --- | --- | --- |
| Poisoned | Lose one Combat die every 20 rounds; waiting does not recover dice | Cure, hermit, village rest |
| Slowed | Act every other round | After its duration |
| Hasted | Act twice per round | After its duration |
| Asleep | Cannot act; melee against it has advantage | Its duration, or taking a hit |
| Held | Cannot act | After its duration |
| Frightened | Must move away from the source | After its duration |
| Blessed | Advantage on checks | After its duration |
| Cursed | Disadvantage on checks; comes from cursed items or altars | Remove Curse, hermit, removing the item if allowed |

The same effect never stacks; a new application resets its duration to the longer of the two.

## Monster and hostile NPC behaviour

Every monster uses one of six behaviours from the bestiary, and bandits and rivals follow their own rules.

| Behaviour | How it fights | Example |
| --- | --- | --- |
| Brute | Charges straight in and fights to the end | Ogre |
| Skirmisher | Keeps 3 to 5 cells away and attacks at range; closes in when out of ammunition or cornered | Goblin archer |
| Caster | Keeps distance, casts, and flees when the player is adjacent | Kobold shaman |
| Ambusher | Waits unaware in cover, gets advantage on its first attack | Giant spider |
| Pack | Moves as a group and tries to surround the player | Wolves |
| Coward | Flees when the player is near unless cornered | Rat swarm |

- **Morale:** a monster reduced to one die rolls a d6 each round; on 1 or 2 it flees. Undead, constructs and bosses never flee.
- **Bandits:** always hostile. A bandit hit removes a Combat die as usual and also steals 10% of carried treasure; after stealing twice the bandit flees. Killing it drops everything it stole.
- **Rivals:** head for the down stair, fighting monsters and looting on the way. They ignore the player unless attacked, then fight as skirmishers. A dead rival drops everything it looted.
- **Traders, hermits and captives** never fight; a captive follows the player once freed.
- **Bosses:** never flee, and are alert as soon as the player enters their room.
- **Stairs:** monsters never use stairs. Leaving a level always ends a pursuit, and the monsters stay where they were (subject to Spec 02 restocking).

## Clarifications (approved October 1, 2026, task 2.7)

All figures are starting values for playtesting.

**Awareness**

- **Starting state:** each monster rolls asleep or unaware, 1 in 2, from a seeded stream of its level (fixed by the run seed and level number) the first time the level is entered; the result is saved with the level. Ambushers start unaware. Bosses are alert as soon as the player is in their room. Bandits are unaware until the player is in their sight, then alert for good. Rivals never notice the player or wake from noise; they are peaceful until attacked.
- **"In its line of sight"** means the player and the creature can see each other (the same visibility the main view uses). **"Combat happens"** means any melee or ranged exchange between any two creatures, wherever it is: every other creature within the table's radius of the exchange is alerted.
- **Notice rolls** are made once per round per creature, before it acts, whether or not it acts that round. An asleep or unaware creature becomes alert at once and may act on that same round.
- **Unaware creatures wander:** on each action there is a 1 in 2 chance to step to a free orthogonal cell within 3 cells of where the creature was placed. Bosses and ambushers hold their ground.
- **Unaware or asleep defenders** roll with disadvantage in melee.

**Attacks and ranged reach**

- **Monster ranged reach:** skirmishers, casters and hostile rivals attack from a clear line up to 6 cells away, with one shot each. Adjacent creatures with a ranged attack do not shoot; they step away or, when cornered, fight in melee.
- **Monster ranged and spell attacks** that tie the player's defence roll miss.
- **Player ranged attack:** one Skill die as a skill use against an adjacent-disadvantage rule, then one shot of the readied weapon's ammunition is spent (a hit or a miss). With none left the weapon cannot fire. The weapon list and the crossbow's every-other-round rule come with the items task.
- **Ambusher:** there is no cover; it starts unaware and rolls its first attack with advantage.

**Behaviours**

- **Skirmishers** carry 6 shots; with none left they close in. Casters never run out.
- **Preferred distance** for skirmishers and casters is 3 to 5 cells. A skirmisher or caster that cannot step farther away (cornered) fights in melee.
- **Pack:** when one member of a group becomes alert the whole group does. Each member heads for a different free cell next to the player, so the pack closes in on all sides.
- **Coward:** with the player within 4 cells it steps away, or fights if cornered; beyond 6 cells it closes in; between the two it holds.
- **Fleeing** (morale, a bandit's second theft, a coward's retreat) means stepping to the neighbouring cell farthest by walking distance from the player; a fleeing creature that cannot get farther away and is next to the player fights. A creature that has been out of the player's sight for 20 rounds stops fleeing and is unaware again.
- **Morale:** a creature that has lost dice and is reduced to one rolls a d6 each round; on 1 or 2 it flees. Morale applies to every behaviour, a brute's included. Creatures that start with a single die never roll. Undead, constructs (monster rows tagged `undead` or `construct`) and bosses never flee.

**Bandits, rivals and NPCs**

- **Rating:** bandits and rivals have the level's rating ceiling in dice (1 + depth / 5, capped at 20), a modifier of depth / 15 (rounded down, capped at +6) and normal speed.
- **Theft:** a bandit that wins an exchange against the player removes a Combat die as usual and steals 10% of the carried gold, rounded up and at least 1 gp. A theft that finds no gold takes nothing and does not count. Gems and jewelry join the theft with the items task. After two thefts the bandit flees. A killed bandit drops everything it stole on its cell.
- **Rivals** walk to the down stair along the shortest path. They take the contents of any container or floor pile within 8 steps of their way (never a cross-level cache or stash) and fight every monster next to them, as an ordinary melee exchange in which both sides roll d6 plus modifier. A rival that reaches the down stair waits beside it; no creature ever uses stairs. Once attacked, a rival is hostile and fights as a skirmisher. A dead rival drops everything it looted on its cell.
- **Loot taken by rivals** is recorded in the level's delta so the player finds those containers empty (Spec 06 will read it).

## Clarifications (task 2.8, proposed October 1, 2026, awaiting approval)

All figures are starting values for playtesting. Where the spec above is silent these fill the gap so the build can proceed; any the owner changes goes back here first.

**Spell table and casting**

- **The 15 spells are rows of the `spells` table** (`content/magic/spells.yaml`). A row names an `effect` defined in code and carries its numbers (shape, reach, footprint, duration), so tuning and the target of 30 spells are content work (Spec 08).
- **Casting costs one round.** Rolling the spell is one Magic die as a spell roll (Spec 03): 4 or more works; 2 to 3 works and the die is lost; 1 does nothing and the die is lost; an empty pool rolls with disadvantage and loses nothing more. An area spell rolls once. Blessed and Cursed do not touch spell rolls (they apply to checks).
- **Choosing a spell is the confirmation for a self spell** and for a spell centred on the caster (Thunderclap, Turn Undead): it resolves at once, even with nothing near. Targeted and area-at-range spells enter targeting (Spec 01) with the spell's reach.
- **Blink** picks a cell, not a creature: a cursor starts on the caster, W A S D move it, Enter confirms, Esc cancels with no turn spent. The cell must be visible, within 5 cells, open floor (shallow water counts, deep water and lava do not) and free of creatures.
- **Targets** are creatures visible, in reach, with a clear line (Spec 01). Sleep skips creatures that are naturally asleep, as it needs an unaware or alert one.
- **Offensive spells count as attacks.** Every spell that affects creatures other than Sleep alerts the creature it hits (a rival turns hostile) and makes noise like any combat (Awareness, above). Sleep is quiet. A spell whose roll fails does none of this.
- **Adjacent** in Thunderclap means the 8 cells around the caster. Each creature is pushed 2 cells in a straight line directly away (diagonal for a diagonal neighbour) and stops early at a wall, closed door, liquid or other creature. Being pushed deals no damage.
- **Fear** does not affect creatures that never flee (undead, constructs, bosses); **Turn Undead** does affect undead, and only them.
- **Light** reveals (marks as explored) the room the caster stands in, with its walls and doors, or when not in a room every open cell connected to the caster within 8 cells, with the walls beside them. **Detect** reveals every floor trap, container trap and secret door within 8 cells in a straight line, through walls, and saves them as part of the level delta (Spec 06 reads them). A revealed secret door behaves as a normal door.
- **Shield** is a ward held in the character's own state, not one of the eight status effects: it absorbs the next hit within 10 rounds and shows in the Status block. A new Shield resets it to 10.
- **Arcane Bolt** for a Mage (major ability Arcane Bolt) loses no die on a 2 to 3.

**Starting and learned spells**

- **Starting spells** are drawn from the 15, seeded by the run seed, character name and class, with no repeats. A class's guaranteed spell (Mage Arcane Bolt, Priest Heal) is always in its draw and counts toward its number. The counts are in the class table (`spells`).
- **Spellbooks** hold one spell. Reading one is a Magic check (Spec 03): 4 or more learns it; 2 to 3 fails and the book cannot be tried again until the character has taken a village rest since; 1 destroys the book and leaves the reader Cursed for 20 rounds (Spec 06, negative effects). A spell already known is not learned again and the book is kept. Reading in the dungeon costs one round.

**Status effects**

- **Duration counts the round the effect starts.** Effects tick down once a round after every creature has acted, so Hold for 3 rounds costs the creature 3 turns. Poisoned has no duration, and Cursed has none unless its source gives one (a destroyed spellbook: 20 rounds). A new application of an effect already present keeps the longer duration (no duration is the longest) and never adds a second copy.
- **Speed:** Hasted acts twice a round, Slowed every other round, both together cancel to the creature's own speed. For the player, a hasted action takes half a round (the monsters act after every second action) and a slowed action takes two rounds.
- **Asleep:** the creature cannot act and melee against it has advantage; a hit on it ends the effect. **Held:** cannot act. **Frightened:** a monster flees from the player (as in Fleeing, above); the player may not step to a cell nearer to the source but may still fight.
- **Poisoned:** one Combat die is lost every 20 rounds, and waiting does not recover dice. A lost die with none left is fatal, as with any hit. Village rest ends it; Cure and the hermit arrive with items and villages.
- **Blessed and Cursed** give advantage and disadvantage on checks (Spec 03); together they cancel.
- **The Status block** lists each active effect with its remaining rounds, then Shield.

## Acceptance criteria

- [ ] Nothing on the level moves until the player spends an action; free actions (inventory, look, targeting) cost no round.
- [ ] Fast, normal and slow creatures act 2, 1 and 0.5 times per round over a 100-round test.
- [ ] Notice rolls follow the awareness table, and combat within range wakes or alerts the right monsters.
- [ ] All four attack kinds resolve as the attacks table says, including ties, unaware defenders and adjacent ranged disadvantage.
- [ ] Each of the 15 spells works at every shape, and targeted area spells hit everything in the previewed footprint while caster-centred ones spare the caster.
- [ ] Spellbook reading follows the check results, and retries wait for the next village rest.
- [ ] Each status effect applies, shows in the Status block, never stacks, and ends as listed.
- [ ] Each behaviour is recognisable in a scripted arena fight; morale, bandit theft and rival looting work as written.
- [ ] Ranged weapons spend one tracked ammunition per attack and cannot fire when out.
- [ ] No monster ever changes level through stairs.

## Open questions

- [x] **Stairs pursuit:** monsters never use stairs.
- [x] **Ammunition:** tracked, bought in shops.
- [x] **Spell limit:** none.
- [x] **Spellbooks in shops:** yes, in deeper villages.
- [x] **Bandit theft:** 10% of carried treasure per hit, flees after two thefts.
- [x] **Off-screen simulation:** 50 creatures per round.
- [x] **Friendly fire:** caster-centred area spells spare the caster; targeted area spells can hit them.
- [x] **Ammunition recovery:** none; fired ammunition is gone.
