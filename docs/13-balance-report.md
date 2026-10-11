# Megadungeon Balance Report (task 4.11)

Oct 4, 2026 · @Robert Stevenson

Task 4.11 measures depth pace, the economy and class parity on the real tables and rules, against the plan's gate: character level 10 lands near depth 50 to 55, and no class is far behind. The measurements are scripted runs (`tools/balance.ts`, `npm run balance`); `tests/balance.test.ts` repeats smaller, seeded runs on every change, so a content change that moves the balance out of its band fails CI.

No rule or number changed in this task. Everything measured passes the gate as the specs stand.

Task 5.8 (Intake Addendum B, Phase 5) adds a real-time balance pass: the class parity gauntlets played again in real time by a bot with a fixed reaction delay. It is a report only; no game number changed. See "Real time (task 5.8)" below.

## Summary

| Area | Gate | Result |
| --- | --- | --- |
| Depth pace | Level 10 near depth 50 to 55 | Passes. Median depth 52; all 100 seeds land within 50 to 55. |
| Economy | Not stated in the plan | Sound. Every subterranean village's trip costs less than one level below it pays. Two notes below. |
| Class parity | No class far behind | Passes, with "far behind" read as under half the median class (proposed below). The weakest class, the Alchemist, wins 62% of the median. |
| Real-time parity (task 5.8) | No class far behind (same reading) | Passes at every reaction delay measured. At 250 ms a class wins 85% of its turn-mode fights at the median; the weakest, the Alchemist, wins 68% of the real-time median. |

## How it is measured

- **Depth pace:** every level 1 to 99 of 100 seeds is generated with the real tables. A thorough player takes every container's and pile's treasure and does every quest. Coins count at face value; gems and jewelry at 90% of base, the mean of the appraiser's 60% to 120% (Spec 05). Sarcophagi, which add treasure, and rivals and bandits, which take some, are both left out.
- **Economy:** one trip's basket (a rest, a rumour, one identification and one long sword repair) at the middle of each village band, against the treasure of the level below that village.
- **Class parity:** each class is created on the creation path (its gear, spells and ability) and levelled to the level a thorough player has on arriving at a depth, with its minor ability draws in effect. Every class puts its new dice the same way, so every class ends level 10 with 6 Combat dice (`poolFor`). In an open arena it fights the ordinary monsters generated for that depth one after another, each placed 8 cells away as generated (asleep or unaware), waiting to full Combat between fights and with no village rest, until it dies or has won 20 fights (about one level's monsters). The play is the same simple policy for every class: use the class ability when it helps, drink a healing potion or cast Heal at one Combat die, cast the best damage spell, shoot when it has a ranged weapon, else close and fight in melee. Each cell is the mean of 100 gauntlets.

## Findings

1. **Pace is on target as specced.** The depth table's figures (Spec 02, "starting values for playtesting") hold: the levels deal their budget, and quest rewards add a few percent on top (about 6% by depth 55). No change proposed.
2. **Economy: identification is a luxury at the start.** At the surface one basket costs about 1.5 times a level 1 trip's treasure, almost all of it the 100 gp identification. Rests are always affordable (the bank starts at 20 gp, a rest is 10). This fits "every descent is a push-your-luck decision"; no change proposed.
3. **Economy: gold stops mattering past the second subterranean village.** Below depth 30 a basket is 2% or less of one level's treasure, and the deepest lift fare (about 1,260 gp from the surface to depth 90) is under 2% of a level there. XP, not gold, carries the late game, so this is by design; no change proposed, but noted for your playtest.
4. **Class parity: no class is far behind, but the Mage and the Knight are far ahead.** They win about 3.7 times the median's fights. The Mage's Arcane Bolt kills from range and keeps its die on 2 to 3; the Knight steps Combat at levels 4 and 7, wears chain, and Shield Wall ignores the first hit of every fight. The bottom six (Assassin, Shaman, Druid, Illusionist, Bard and Alchemist) sit at 62% to 80% of the median. Part of the gap is the measure: the Alchemist's brewed potions, the Shaman's faster recovery by the totem and the Necromancer's raised dead count for little or nothing in a timeless arena, and they would help in a real run.
5. **Deep levels are a wall on starting gear.** Past depth 60 every class wins one or two fights in a row with its starting gear, because monster modifiers of +4 to +6 outrun a d12. The arena leaves out found magic weapons, armour and items, which a real character at depth 60 carries, so this is a question for your playtest rather than a measured failure.

## Decisions for the owner

- **The meaning of "far behind":** proposed as a class winning fewer than half the fights of the median class in these runs (`FAR_BEHIND` in `tools/balance.ts`). Once approved, it is recorded in Spec 03.
- **Whether to trim the Mage and the Knight:** the gate does not ask for it. The recommendation is to leave every number as it is until your own playtest at the gate, since the deep-level wall (finding 5) depends on gear the arena does not model.

## Real time (task 5.8)

### How it is measured

The class parity gauntlets above are played again in real time (Spec 04, Addendum B), on the same characters, foes and seeds, by the same simple policy, now as a bot with a fixed reaction delay: what it sees reaches its keys that many ticks later. It chooses as late as the delay allows, the delay before its cooldown ends, and its command is held and carried out as the cooldown ends, as the one-command buffer lets a player do (Spec 01, Addendum B). It never chooses before it has seen its own last action happen, so a delay longer than the 10-tick cooldown slows it down. The creatures keep their own schedules throughout, and between fights the bot stands still, so each round counts as a waiting round (Spec 03, Addendum B). The full table uses 5 ticks (250 ms), a quick human reaction; the sweep compares 0, 5, 10 and 20 ticks (`REACTION_TICKS` and `REACTION_SWEEP` in `tools/balance.ts`). `tests/balance.test.ts` repeats a smaller run on every change.

### Findings

6. **The real-time rules match turn mode.** With no reaction delay the bot wins exactly as many fights as the turn-mode player at the median (100%). Only the timing of the two modes differs, as Addendum B intends, and this is the check that the harness plays both the same way.
7. **Hesitation is the cost of real time, and it is steady.** At 250 ms a class wins about 85% of its turn-mode fights at the median; at 500 ms (as slow as the cooldown) 75%; at one second, where the bot acts half as often as the creatures, 53%. A real player sits somewhere in this range, and pausing (P) moves them back toward turn mode, so the depth pace and economy above are unchanged.
8. **Melee classes lose the most; casters lose almost nothing.** At 250 ms the Warrior keeps 63% of its turn-mode fights, the Paladin 72%, the Assassin 74%, the Barbarian 75%; the Mage, Warlock, Sorcerer and Alchemist keep 92% to 101%. A ranged attack or a spell lands wherever the foe has moved; a step or a blow chosen 250 ms ago meets a foe that has moved, and skirmishers and casters, which keep their distance, gain the most from it. The Mage's lead over the median widens from 380% to 454%.
9. **No class is far behind at any delay.** The weakest class sits at 60% to 74% of the real-time median across the sweep.

### Decisions for the owner

- **The bot's reaction delay:** 5 ticks (250 ms) is proposed as the measuring default for real time. It is a harness setting, not a game rule.
- **Whether to retune anything for real time:** the recommendation is no. Real time is a separate mode marked on the leaderboard (decision D3), every class passes, and the gap the measure shows (melee classes losing more) is what a reaction game is; your real-time play at the gate "Real time playable" is the better test. If a change is wanted later, the candidates are real-time-only figures, such as a shorter cooldown for melee attacks, which would need a new Addendum B clarification.

## Measured results

The tables below are written by `npm run balance -- --write` (100 seeds, 100 gauntlets per cell). Rerun it after any change to the tables or rules.

<!-- balance:start (npm run balance -- --write) -->
## Depth pace

100 seeds, every level 1 to 99 generated. Character level 10 (512,000 XP) lands at a median of depth 52; 100 of 100 seeds land within 50 to 55. Earliest 50, latest 55.

| Depth | Spec 02 cumulative | Measured cumulative | Level on arrival |
| --- | --- | --- | --- |
| 1 | 60 | 94 | 1 |
| 10 | 4,350 | 5,026 | 2 |
| 20 | 29,700 | 32,249 | 5 |
| 40 | 223,400 | 235,213 | 8 |
| 50 | 431,750 | 459,227 | 9 |
| 55 | 572,550 | 608,618 | 10 |
| 60 | 741,100 | 784,931 | 10 |
| 80 | 1,742,800 | 1,833,865 | 10 |
| 99 | 3,288,450 | 3,564,773 | 10 |

## Economy

The bank starts at 20 gp. A trip's basket is one rest, one rumour, one identification and one long sword repair, against the treasure of the level below the village.

| Village | Depth | Rest | Rumour | Identify | Repair | Basket | Lift from surface | One level's treasure | Basket share |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 10 | 25 | 100 | 12 | 147 | 0 | 94 | 156% |
| 1 | 10 | 12 | 30 | 120 | 15 | 177 | 60 | 1,471 | 12% |
| 2 | 30 | 14 | 35 | 140 | 17 | 206 | 240 | 10,548 | 2% |
| 3 | 50 | 16 | 40 | 160 | 20 | 236 | 500 | 28,595 | 1% |
| 4 | 70 | 18 | 45 | 180 | 22 | 265 | 840 | 54,319 | 0% |
| 5 | 90 | 20 | 50 | 200 | 24 | 294 | 1,260 | 87,451 | 0% |

## Class parity

Fights won in a gauntlet of 20, mean of 100 gauntlets per cell. The level is a thorough player's on arriving at that depth. Median class mean: 2.1. Far behind (under 50% of the median): none.

| Class | 3 (L1) | 10 (L2) | 20 (L5) | 30 (L7) | 40 (L8) | 50 (L9) | 60 (L10) | 75 (L10) | 90 (L10) | 99 (L10) | Mean | Of median |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mage | 12.4 | 9.7 | 16.2 | 8.4 | 17.5 | 6.2 | 6.4 | 3.2 | 0.6 | 0.9 | 8.1 | 380% |
| Knight | 6.2 | 12.9 | 17.3 | 16.3 | 10.4 | 7.7 | 3.1 | 1.7 | 0.8 | 1.3 | 7.8 | 363% |
| Warrior | 2.7 | 5.7 | 12.7 | 12.1 | 5.8 | 4.0 | 1.9 | 1.2 | 0.5 | 1.0 | 4.8 | 222% |
| Paladin | 1.5 | 4.6 | 8.4 | 5.5 | 2.9 | 3.5 | 2.2 | 1.1 | 0.6 | 0.9 | 3.1 | 146% |
| Barbarian | 2.6 | 6.0 | 4.5 | 5.5 | 4.5 | 2.8 | 1.7 | 1.1 | 0.5 | 0.8 | 3.0 | 140% |
| Priest | 1.8 | 5.7 | 4.1 | 5.0 | 4.2 | 3.0 | 2.4 | 1.2 | 0.8 | 1.2 | 2.9 | 136% |
| Beastmaster | 4.0 | 5.9 | 3.6 | 3.9 | 2.8 | 1.8 | 1.5 | 1.0 | 0.3 | 0.5 | 2.5 | 118% |
| Witch Hunter | 3.3 | 4.3 | 5.0 | 4.5 | 3.2 | 1.7 | 1.5 | 0.7 | 0.1 | 0.2 | 2.5 | 115% |
| Sorcerer | 3.0 | 2.7 | 2.9 | 2.3 | 3.6 | 2.4 | 2.5 | 1.6 | 0.6 | 1.1 | 2.3 | 106% |
| Monk | 1.1 | 2.7 | 6.4 | 4.5 | 1.9 | 2.4 | 1.0 | 0.8 | 0.3 | 0.8 | 2.2 | 102% |
| Warlock | 2.9 | 2.8 | 2.2 | 2.4 | 3.3 | 1.9 | 2.1 | 1.7 | 0.5 | 1.2 | 2.1 | 98% |
| Ranger | 3.2 | 3.7 | 2.9 | 2.8 | 2.0 | 1.2 | 1.1 | 0.7 | 0.3 | 0.1 | 1.8 | 84% |
| Thief | 3.4 | 4.0 | 2.8 | 2.2 | 2.1 | 1.2 | 1.2 | 0.6 | 0.2 | 0.2 | 1.8 | 83% |
| Necromancer | 3.6 | 2.4 | 2.5 | 1.2 | 2.5 | 1.2 | 1.5 | 1.1 | 0.5 | 1.0 | 1.8 | 82% |
| Assassin | 2.0 | 3.5 | 3.1 | 2.0 | 1.7 | 1.9 | 1.1 | 0.9 | 0.3 | 0.7 | 1.7 | 80% |
| Shaman | 2.5 | 4.7 | 2.5 | 1.8 | 1.6 | 0.9 | 1.1 | 0.7 | 0.3 | 0.7 | 1.7 | 78% |
| Druid | 2.6 | 4.4 | 2.5 | 1.8 | 1.6 | 0.9 | 0.9 | 0.5 | 0.3 | 0.7 | 1.6 | 76% |
| Illusionist | 2.9 | 2.6 | 2.3 | 2.2 | 1.9 | 1.1 | 1.1 | 0.8 | 0.3 | 0.3 | 1.5 | 72% |
| Bard | 2.1 | 3.0 | 2.5 | 2.0 | 1.8 | 1.1 | 1.3 | 0.6 | 0.2 | 0.3 | 1.5 | 69% |
| Alchemist | 2.6 | 2.8 | 2.4 | 1.7 | 1.6 | 0.5 | 1.0 | 0.5 | 0.1 | 0.2 | 1.3 | 62% |

## Real-time class parity

The same gauntlets in real time, played by the same policy as a bot with a reaction delay of 5 ticks (250 ms), mean of 100 gauntlets per cell. Median class mean: 1.8, 85% of turn mode's. Far behind (under 50% of the real-time median): none. "Of turn mode" is the class's real-time mean against its own turn-mode mean.

| Class | 3 (L1) | 10 (L2) | 20 (L5) | 30 (L7) | 40 (L8) | 50 (L9) | 60 (L10) | 75 (L10) | 90 (L10) | 99 (L10) | Mean | Of median | Of turn mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mage | 12.4 | 10.0 | 16.1 | 8.5 | 16.8 | 7.0 | 6.8 | 3.2 | 0.7 | 0.9 | 8.2 | 454% | 101% |
| Knight | 6.7 | 11.4 | 10.8 | 13.4 | 7.8 | 6.7 | 3.4 | 1.6 | 0.8 | 1.1 | 6.4 | 351% | 82% |
| Warrior | 2.3 | 5.1 | 5.2 | 6.8 | 4.0 | 3.2 | 1.7 | 0.9 | 0.4 | 0.6 | 3.0 | 166% | 63% |
| Priest | 1.9 | 4.6 | 3.2 | 4.5 | 3.4 | 2.1 | 2.2 | 1.1 | 0.6 | 1.0 | 2.5 | 136% | 84% |
| Barbarian | 2.4 | 5.5 | 3.0 | 3.6 | 2.7 | 2.3 | 1.6 | 0.8 | 0.3 | 0.5 | 2.3 | 125% | 75% |
| Paladin | 1.8 | 3.6 | 3.6 | 4.4 | 2.1 | 3.1 | 1.7 | 1.0 | 0.5 | 0.7 | 2.2 | 124% | 72% |
| Sorcerer | 3.0 | 2.4 | 2.9 | 2.3 | 3.4 | 2.2 | 2.7 | 1.6 | 0.5 | 1.1 | 2.2 | 122% | 97% |
| Beastmaster | 4.0 | 4.2 | 3.2 | 3.1 | 2.6 | 1.8 | 1.5 | 0.8 | 0.3 | 0.2 | 2.2 | 121% | 87% |
| Warlock | 3.1 | 2.6 | 2.2 | 2.3 | 3.3 | 2.5 | 2.0 | 1.2 | 0.4 | 1.1 | 2.1 | 114% | 98% |
| Witch Hunter | 3.3 | 3.1 | 3.7 | 3.4 | 2.5 | 1.3 | 0.9 | 0.4 | 0.1 | 0.2 | 1.9 | 104% | 76% |
| Monk | 1.3 | 2.6 | 3.6 | 3.5 | 1.4 | 2.4 | 1.1 | 0.8 | 0.3 | 0.4 | 1.7 | 96% | 80% |
| Ranger | 3.4 | 2.5 | 2.8 | 2.5 | 1.9 | 1.3 | 1.0 | 0.7 | 0.1 | 0.2 | 1.6 | 90% | 91% |
| Necromancer | 3.0 | 2.4 | 2.3 | 1.5 | 2.0 | 1.0 | 1.6 | 1.0 | 0.4 | 0.8 | 1.6 | 88% | 91% |
| Thief | 3.4 | 2.7 | 2.8 | 1.9 | 1.8 | 1.2 | 1.2 | 0.6 | 0.1 | 0.1 | 1.6 | 87% | 89% |
| Illusionist | 3.0 | 2.3 | 2.4 | 1.8 | 1.7 | 1.1 | 1.0 | 0.7 | 0.2 | 0.3 | 1.4 | 80% | 93% |
| Druid | 2.3 | 3.9 | 2.2 | 1.5 | 1.3 | 0.7 | 0.9 | 0.5 | 0.3 | 0.4 | 1.4 | 78% | 86% |
| Shaman | 2.7 | 3.6 | 1.7 | 1.4 | 1.2 | 0.8 | 1.0 | 0.5 | 0.3 | 0.5 | 1.4 | 75% | 81% |
| Bard | 2.1 | 2.3 | 1.9 | 1.7 | 1.5 | 1.0 | 1.0 | 0.7 | 0.1 | 0.2 | 1.3 | 70% | 86% |
| Assassin | 2.1 | 2.8 | 2.1 | 1.4 | 1.0 | 1.2 | 0.9 | 0.5 | 0.2 | 0.3 | 1.3 | 70% | 74% |
| Alchemist | 2.8 | 2.1 | 2.5 | 1.4 | 1.5 | 0.5 | 0.9 | 0.4 | 0.1 | 0.1 | 1.2 | 68% | 92% |

## Reaction delay

Class parity in real time at each reaction delay, 100 gauntlets per cell. A delay of 0 is a bot that sees and acts in the same tick; the cooldown is 10 ticks.

| Reaction delay | Median class mean | Of turn mode | Best class | Worst class | Far behind |
| --- | --- | --- | --- | --- | --- |
| Turn mode | 2.1 | 100% | Mage 380% | Alchemist 62% | none |
| 0 ticks (0 ms) | 2.1 | 100% | Mage 389% | Alchemist 60% | none |
| 5 ticks (250 ms) | 1.8 | 85% | Mage 454% | Alchemist 68% | none |
| 10 ticks (500 ms) | 1.6 | 75% | Mage 505% | Assassin 64% | none |
| 20 ticks (1000 ms) | 1.1 | 53% | Mage 320% | Shaman 74% | none |
<!-- balance:end -->
