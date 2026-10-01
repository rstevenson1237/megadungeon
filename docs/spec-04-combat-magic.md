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
