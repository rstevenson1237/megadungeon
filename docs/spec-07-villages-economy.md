# Megadungeon Spec 07: Villages and Economy

Sep 30, 2026 · @Robert Stevenson

This spec defines every village service, the NPC services in the dungeon, and how gold moves through a run. Approved September 30, 2026.

## Scope

This spec covers what the player can do in a village and with dungeon NPCs who offer services, and checks that the gold economy holds together.

- **In scope:** which services each village has, the bank, lodging, lift fares, shops, appraisal, identification, repairs, rumours, quests, trader and hermit services, and the overall flow of gold.
- **Out of scope:** item prices and stock rules already set in Spec 05, quest goal placement (Spec 02), the menu screens (Spec 01).
- **Traces to intake:** Villages, Costs, NPC behaviour, and Specs 01, 02 and 05.

## Village structure

Every village is a menu (Spec 01): the services it has, plus Go up and Go down. The surface has everything; each subterranean village rolls its extras from the seed.

| Service | Surface | Subterranean |
| --- | --- | --- |
| Bank, Lodging, Lift | Yes | Always |
| Shop | Yes | 75% chance |
| Appraiser (appraisal and identification) | Yes | 60% chance |
| Smith (repairs) | Yes | 50% chance |
| Tavern (rumours and quests) | Yes | 75% chance |

- **Rescued specialists** (Spec 02) add a missing Shop, Appraiser or Smith to the village they are escorted to, permanently for the run.
- **Price multiplier:** every price in a village is its surface price times 1 + 0.2 per village below the surface (1.2 at the first subterranean village, 2.0 at the fifth).
- **Names:** each subterranean village gets a seeded name from the village name table.
- **Safety:** villages have no monsters, traps or restocking (Spec 02).

## Bank

The bank is where treasure becomes XP and where every village payment comes from; money only flows in.

- **Deposit:** all carried coins and appraised gems and jewelry go in with one choice; each gp earns 1 XP (Spec 03). Unappraised pieces are held back with a prompt to visit the appraiser.
- **One balance** shared by every village.
- **No withdrawals:** banked gold stays in the bank. Every village cost is deducted automatically; if the balance is short, the service is refused and the log says so.
- **Sales:** gold from selling items goes straight into the bank and earns no XP (Spec 05).
- **Dungeon payments:** traders and hermits are paid from carried coins, since the bank cannot be reached from the dungeon.
- **Death:** a new character on the same seed starts with 10% of the balance (Spec 03).

## Lodging

Resting is the only way to fully recover and the only way to save.

- **Cost:** 10 gp times the village price multiplier (10 gp at the surface, 20 gp at the fifth village).
- **Effects:** restores every die in every pool; clears Poisoned, Slowed, Blessed and other timed effects, but not curses; saves the game (single save).
- **Time:** a rest passes 200 turns, which counts as time away for level restocking (Spec 02).
- **Side effects:** shop stock refreshes (Spec 05) and spellbook retries become possible (Spec 04).
- **Level ups** already happened at deposit time, so resting has no XP role.

## Lift

The lift links every village the player has visited; fares are random per seed but always rise with distance and depth.

- **Fare:** 10 gp x levels travelled x (0.5 + deeper village's level / 100) x a seeded factor between 0.8 and 1.2, fixed for each pair of villages for the run. This averages about 10 gp per level, cheaper near the surface and dearer deep down.
- **Same both ways:** a trip costs the same up or down.
- **Paid from the bank**, like every village cost; the village price multiplier does not apply on top.
- **Lift tokens** (Spec 02) make trips free or cheaper for the rest of the run.

| Trip (factor 1.0) | Levels travelled | Fare |
| --- | --- | --- |
| Surface to level 17 | 17 | 114 gp |
| Level 17 to level 33 | 16 | 133 gp |
| Surface to level 33 | 33 | 274 gp |
| Level 70 to level 90 | 20 | 280 gp |
| Surface to level 90 | 90 | 1,260 gp |

## Shops, appraiser and smith

These services follow the item rules in Spec 05; this section only sets how they behave in the menu.

| Service | Actions | Cost |
| --- | --- | --- |
| Shop | Buy from stock; sell any carried item | Spec 05 prices times the village multiplier; sells at 50% of value |
| Appraiser: appraise | Values every carried gem and jewelry piece at once | Free |
| Appraiser: identify | Reveals one item's true name and any curse | About 100 gp times the village multiplier |
| Smith | Repairs one broken item | About 30% of the item's value times the village multiplier |

- **Shop stock** is seeded per village and refreshes after each rest; deeper shops add fine items, more potions, lockpicks, and sometimes spellbooks.
- **Selling unidentified items** pays as if they were a plain item of their kind, which rewards identifying first.
- **Cursed items** cannot be sold while equipped.

## Tavern

The tavern sells information and hands out work, both about the levels between this village and the next deeper one.

**Rumours**

- **Buying:** a rumour costs 25 gp times the village multiplier; one new rumour is available per rest, after which the barkeep repeats the last one.
- **Always true, not always valuable** (intake): a rumour can name a vault's level, a boss's level, a teleporter pair, a rival's stash, a trap-heavy level, or what a fountain does.
- **Seeded:** each tavern's rumour list comes from the run layout, so rumours match the real dungeon.
- **Journal:** every rumour heard is kept in the journal (Spec 06).

**Quests**

- **Board:** shows up to 3 open quests from the village's pre-rolled list (Spec 02); taking one reveals the next.
- **Active limit:** 3 quests at once; a quest can be abandoned from the journal.
- **Types and hand-in:** return a captive (to any village), find a lost belonging, collect a magical item, kill an opponent (Spec 02).
- **Rewards:** paid as treasure into the bank, so they earn XP, sized at about half a level's treasure budget at the target depth; sometimes an item as well.
- **Failure:** a captive who dies fails the quest; other quests never fail, only wait.

## Traders and hermits

Dungeon NPCs offer a few village services far from any village, paid from carried coins, and priced with the multiplier of the nearest village above.

| NPC | Service | Cost |
| --- | --- | --- |
| Trader | Sells a random stock of 3 to 6 items, which can include magic items | 150% of value |
| Hermit | Identify one item | About 100 gp |
| Hermit | Restore one Combat die | About 25 gp |
| Hermit | Lift a curse | About 100 gp |
| Hermit | One rumour about nearby levels | About 25 gp |

- **Traders do not buy.** If they did, selling loot to them for coins and banking those coins would turn gear into XP, which Spec 05 rules out.
- **Each hermit** offers each service once per visit to the level.
- **Captives** charge nothing: freeing one makes them follow the player (Spec 04).

## Economy summary

All gold passes through the bank: treasure and quest rewards arrive as XP, sales arrive as gold only, and every village cost is paid from the balance.

Gold flow (diagram as text):

- Sources into the Bank (one balance, no withdrawals): Dungeon treasure (coins, gems, jewelry) and Quest rewards (paid as treasure) earn XP; Item sales add gold only, no XP.
- Bank to XP and level ups: 1 XP per gp of treasure deposited.
- Bank pays out to: Lodging, Lift fares, Shops, Identification, Repairs, Tavern rumours.

Traders and hermits sit outside this loop: they take carried coins in the dungeon, which trades XP the player could have banked for help right now.

## Acceptance criteria

- [ ] Every subterranean village has bank, lodging and lift, and its other services match its seeded rolls.
- [ ] Every village price equals the surface price times the village multiplier.
- [ ] Deposits convert only coins and appraised pieces, at 1 XP per gp; sales add gold with no XP.
- [ ] Any service the balance cannot cover is refused with a log message, and the balance never goes negative.
- [ ] Resting restores all pools, clears timed effects but not curses, saves, passes 200 turns and refreshes shops.
- [ ] Lift fares follow the formula, match in both directions, and stay fixed per pair for the run.
- [ ] Rumours only ever state things true in the current run's layout.
- [ ] Quests respect the active limit, pay into the bank as XP-earning treasure, and a dead captive fails its quest.
- [ ] Traders and hermits take carried coins only, and traders never buy.

## Open questions

- [x] **Service odds:** shop 75%, appraiser 60%, smith 50%, tavern 75%.
- [x] **Rest time:** 200 turns.
- [x] **Lift fare formula:** averages 10 gp per level, rising with depth.
- [x] **Rumours:** 25 gp each, one new per rest.
- [x] **Quests:** 3 active; rewards as XP-earning treasure.
- [x] **Unidentified sales:** plain-item price.
- [x] **Traders:** sell, never buy.
