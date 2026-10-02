# Megadungeon Spec 05: Items, Treasure and Inventory

Sep 30, 2026 · @Robert Stevenson

This spec defines every carried thing: equipment, durability, weapons, armour, treasure, magic items and what they cost. Approved September 30, 2026.

## Scope

This spec covers everything a character can carry, wear, sell or bank; where items appear is Spec 02, and what shops and services do beyond prices is the village spec.

- **In scope:** equipment slots, inventory and stacking, quality and durability, weapons, ammunition, armour and shields, treasure and appraisal, magic items, identification, curses, artifacts, prices and starting gear.
- **Out of scope:** item placement (Spec 02), spell effects (Spec 04), village service rules (village spec), full item tables (content tables).
- **Traces to intake:** Items and treasure, Durability, Inventory, Selling, Villages costs, and Spec 04's ammunition rules.

## Equipment slots and inventory

Worn and wielded items sit in equipment slots and do not use inventory slots; everything else competes for the 12-slot pack.

| Equipment slot | Holds |
| --- | --- |
| Main hand | A one- or two-handed weapon, or a staff |
| Off hand | A shield, or empty when a two-handed weapon is held |
| Ranged | A readied sling, bow or crossbow |
| Body | Armour |
| Cloak, Boots, Gloves, Hat | One clothing item each |
| Ring 1, Ring 2 | One ring each |

| Item | Per inventory slot |
| --- | --- |
| Coins or gems | 100 |
| Ammunition (one type) | 20 |
| Keys | 10 |
| Potions (same kind) | 5 |
| Jewelry | 1 |
| Most other items | 1 |
| Large items (two-handed weapons, plate armour) when carried unequipped | 2 |

The pack starts at 12 slots, and Pack Mule draws add 2 each (Spec 03). A full pack refuses new pickups; the log says so.

## Quality, durability and repair

Weapons and armour come in four qualities; cheaper gear breaks far more often.

| Quality | Break chance per roll | Value vs normal |
| --- | --- | --- |
| Crude | 15% | 50% |
| Normal | 3% | 100% |
| Fine | 1% | 300% |
| Artifact | Never | Priceless |

- **When it rolls:** a weapon rolls when it hits; armour and shields roll when the wearer is hit.
- **Broken gear** stays in its slot but gives nothing: a broken weapon fights as bare hands (-1), broken armour gives no bonus. The pane shows it as Broken.
- **Repair:** a village smith restores broken gear for about 30% of its value, more in deeper villages.
- **Magic weapons and armour** share their base quality's break chance; breaking suppresses the enchantment until repaired.

## Weapons and ammunition

Melee weapons add a small modifier to the Combat roll; ranged weapons set range and ammunition instead, so ranged rolls keep Spec 03's odds. Prices are for normal quality at the surface.

| Melee weapon | Hands | Melee modifier | Trait | Price |
| --- | --- | --- | --- | --- |
| Bare hands |  | -1 |  |  |
| Dagger | 1 | +0 | Light (allows Backstab); can be thrown 4 cells as a ranged attack | 5 gp |
| Short sword | 1 | +0 | Light | 15 gp |
| Mace | 1 | +1 | Stun: winning by 3 or more costs the target its next action | 30 gp |
| Long sword | 1 | +1 |  | 40 gp |
| Quarterstaff | 2 | +0 | +1 on defence rolls | 10 gp |
| Spear | 2 | +1 | Reach: attack from 2 cells away | 20 gp |
| Great axe | 2 | +2 |  | 60 gp |

| Ranged weapon | Range | Ammunition | Trait | Price |
| --- | --- | --- | --- | --- |
| Sling | 6 cells | Sling stones, 1 gp per 20 |  | 5 gp |
| Shortbow | 8 cells | Arrows, 5 gp per 20 |  | 30 gp |
| Longbow | 10 cells | Arrows, 5 gp per 20 |  | 75 gp |
| Crossbow | 8 cells | Bolts, 8 gp per 20 | Fires every other round; a hit removes 2 dice | 60 gp |

Fired ammunition is gone (Spec 04). A thrown dagger lands at or near its target and can be picked up.

## Armour and shields

Armour and shields add to the player's Combat roll when defending against melee; heavier armour trades stealth and spellcasting for that bonus.

| Item | Defence modifier | Drawback | Price |
| --- | --- | --- | --- |
| No armour | +0 |  |  |
| Leather | +1 |  | 20 gp |
| Chain | +2 | Monsters roll notice checks normally even against stealth buffs | 80 gp |
| Plate | +3 | Monsters notice with advantage; spell rolls have disadvantage | 250 gp |
| Shield | +1 | Needs the off hand | 10 gp |
| Tower shield | +2 | Needs the off hand; ranged attacks have disadvantage | 40 gp |

Defence modifiers apply to melee defence only; against monster ranged attacks and spells the player rolls Skill or Magic unmodified (Spec 04).

## Treasure and appraisal

Treasure only becomes XP in a bank, and gems and jewelry must be appraised first, which is where their final value is set.

- **Coins:** gold pieces only, worth face value, 100 per slot.
- **Gems:** drawn from a tiered gem table by depth (e.g. quartz near the surface, rubies and diamonds deep), 100 per slot.
- **Jewelry:** rings, circlets, brooches and chalices from a tiered table by depth, 1 per slot, usually worth the most per slot.
- **Budget split:** each level's treasure budget (Spec 02) is roughly 50% coins, 30% gems, 20% jewelry.
- **Carried estimate:** the character pane sums coins at face value and gems and jewelry at base value, shown with a \~ (Spec 01).
- **Appraisal:** the village appraiser values each gem or jewelry piece at 60% to 120% of base, rolled once per piece and fixed after. Appraisal is free, because it is the only way to bank those pieces.
- **Banking:** coins and appraised pieces deposit for XP at 1 XP per gp (Spec 03). Unappraised pieces cannot be banked.
- **Theft:** bandits take 10% of carried treasure value per theft, starting with coins (Spec 04).

## Magic items, identification and curses

Magic items appear under a disguised name until identified; the disguise for each kind is shuffled per seed, so a "cloudy blue potion" means something different each run.

| Kind | Slot | How it works | Examples |
| --- | --- | --- | --- |
| Potion | Pack (5 per slot) | Single use, one action | Healing (1 Combat die), Vigour (2 Combat dice), Focus (1 Skill die), Clarity (1 Magic die), Haste, Cure, Invisibility (no notice rolls for 10 rounds) |
| Ring | Ring | Always on | Advantage on search, stealth, +1 melee, faster wait recovery |
| Wand | Pack | Casts one targeted spell from 3 to 8 charges, no Magic die rolled | Wand of Arcane Bolt, Wand of Sleep |
| Rod | Pack | Casts one area spell from 2 to 5 charges | Rod of Fireball, Rod of Thunderclap |
| Staff | Main hand | Advantage on spell rolls of one shape, plus 3 to 6 charges of a spell | Staff of the Magus, Staff of Warding |
| Clothing | Cloak, Boots, Gloves, Hat | Always on | Cloak of Shadows (stealth), Boots of Speed (Haste once per level), Gloves of Finesse (advantage on lockpicking) |
| Magic weapon | Main hand | +1 or +2 melee, or a trait | Flame Blade (hits remove 2 dice from undead) |
| Magic armour | Body or off hand | +1 or +2 defence | Elven Chain (+3 with no stealth drawback) |
| Artifact | Any | Unique per run, never breaks, strong effect; each one carried weakens the final boss | Crown of the Deep King |

- **Identification:** a village identify service reveals an item's true name and any curse for about 100 gp, more in deeper villages. The Alchemist identifies potions on sight (Spec 03).
- **Identify by use:** drinking a potion or using a wand or rod reveals that kind for the rest of the run. Rings, clothing, weapons and armour need the service.
- **Empty wands and rods** crumble when their last charge is used; they cannot be recharged.
- **Curses:** about 10% of magic items are cursed. A cursed item cannot be unequipped, gives the Cursed status (Spec 04) and has a drawback of its own. A hermit, the Priest's Purify, or a Remove Curse potion lifts it.

## Prices, shops and starting gear

Shops buy at half value and sell at list price, and everything costs more the deeper the village.

- **Depth multiplier:** list prices apply at the surface and rise 20% per village below it, so the fifth village charges 200%.
- **Selling:** 50% of the item's value (Fence adds 20%). Crude items sell for half that.
- **Surface shop stock:** normal-quality weapons, armour and shields; all ammunition; Healing, Clarity and Cure potions. Deeper shops add fine items, more potion kinds and, sometimes, spellbooks (Spec 04). Stock is seeded per village and refreshes after each village rest.
- **Potion prices:** Healing 50 gp, Clarity 60 gp, Cure 40 gp.
- **Traders** in the dungeon sell a random stock that can include magic items, at 150% of value.

| Core class | Starting gear |
| --- | --- |
| Warrior | Long sword, shield, leather |
| Mage | Quarterstaff, one potion of Clarity |
| Thief | Short sword, dagger, sling with 20 stones, leather |
| Priest | Mace, shield, leather, one potion of Healing |

Every character also starts with 20 gp in the bank. Starting gear is normal quality; the other 16 classes' gear lives in the content tables.

## Clarifications (task 2.9, proposed October 1, 2026, awaiting approval)

All figures are starting values for playtesting. Where the spec above is silent these fill the gap so the build can proceed; any the owner changes goes back here first.

**Items as data**

- **Item instances copy the numbers they need** from their table row when they are created (as placed monsters do), so a saved item never needs the table. Table rows: `equipment_bases` (the 16 weapon, armour and shield bases of this spec plus the three ammunition types), `magic_items` (each row carries its effect fields; `value` in gp) and `disguise_names`. A class's starting gear is a `gear` list of ids.
- **The identity of a thing a level holds is rolled when it is picked up**, from a stream fixed by the run seed, the depth and where it lay, so a level generates exactly as before and the same pickup always gives the same item. A rack's weapon is a base drawn by depth with quality crude 25%, normal 60%, fine 15%.

**Inventory**

- **Slots:** coins fill slots by hundreds and gems fill slots by hundreds, separately; ammunition per type by twenties; keys (plain and vault keys together) by tens; potions per kind by fives; jewelry, books, spellbooks, quest items and map fragments one each; most gear one; two-handed weapons and plate two when carried unequipped.
- **A full pack refuses a pickup** and the log says so. A stack takes as much as fits, and the rest stays where it lay.
- **Actions:** pick up, equip, unequip, drop and use each cost one round; inspecting is free. A pickup costs one round however many things are taken.
- **Equipping:** a two-handed weapon and a shield displace each other (the off hand is empty while a two-handed weapon is held); whatever is displaced goes to the pack if there is room, else the equip is refused. A ring goes in the first empty ring slot and is refused when both are full. Staves are one-handed.
- **Pack size** is 12 plus 2 for each Pack Mule drawn.

**Quality, weapons and armour**

- **Breaking:** a roll of 1 to 100 at or under 15, 3 or 1 (crude, normal, fine). Ranged weapons roll when they hit, like other weapons; the body armour and the shield each roll when the wearer is hit. Broken gear gives no modifier, trait or enchantment, and a broken ranged weapon cannot fire.
- **Modifiers** add to the Combat die the player rolls: the weapon's to melee attack, armour and shield to melee defence only.
- **Mace, Stun:** a melee hit won by 3 or more costs the monster its next action.
- **Spear, Reach:** moving toward a creature exactly 2 cells away in a straight line, with the cell between free, attacks it instead of moving. Only the target can be hit by that exchange.
- **Dagger, thrown:** with no ranged weapon readied, F throws a spare dagger from the pack (else the wielded one) up to 4 cells, as a ranged attack with one Skill die. It lands on the target's cell or a free cell beside it and can be picked up.
- **Crossbow:** after firing it cannot fire again the next round (no round is spent trying), and a hit removes 2 dice.
- **Plate:** monsters notice with advantage whatever stealth buffs say, and the player's spell rolls have disadvantage. **Chain:** stealth buffs do not give monsters disadvantage. **Tower shield:** the player's ranged attacks have disadvantage (not twice over when the target is adjacent). **Quarterstaff:** +1 on defence rolls. **Light** only marks a weapon that allows Backstab (class abilities arrive later).

**Treasure**

- **Appraisal** is rolled once per piece from the run seed and the piece, at 60% to 120% of base, and kept on the piece.
- **Banking** takes coins and appraised pieces only.
- **Theft** takes 10% of the carried treasure value (coins at face value, pieces at appraised or base value), rounded up and at least 1: coins first, and when coins do not cover it the cheapest pieces until it is covered.

**Magic items**

- **Cursed items:** only a ring, clothing, weapon, armour or staff can be cursed (things that can be worn), 1 in 10 at creation. While equipped it gives the Cursed status with no duration, it cannot be removed or displaced, and its drawback is its own: a weapon or armour bonus becomes -1, a ring or clothing effect reverses (disadvantage on search, monsters notice with advantage, -1 melee, wait recovery every 15 rounds, disadvantage on lockpicking), a staff's advantage becomes disadvantage. Lifting the curse (Remove Curse potion, hermit, Purify) clears it and the status, and the item then works as its true self.
- **Identification:** potions, wands, rods and staves are identified by use, per kind for the rest of the run; rings, clothing, weapons and armour only by the service, per item. An unidentified item shows a disguise from `disguise_names` (potions, rings, wands, rods and staves; shuffled per run seed) or its plain base name with "(unknown)". Identifying shows the true name and any curse.
- **Charges** (wand 3 to 8, rod 2 to 5, staff 3 to 6) are rolled at creation. Using one casts the spell with no Magic die and no failure; a wand or rod that is spent crumbles, a staff stays. A staff also gives advantage on spell rolls of its shape while uncursed and unbroken.
- **Potions:** Healing, Vigour, Focus and Clarity restore dice; Haste lasts 5 rounds; Invisibility stops notice rolls against the player for 10 rounds; Cure ends Poisoned; Remove Curse lifts every curse worn. **Boots of Speed** give Haste for 3 rounds once per level, by using them.
- **Artifacts** never break and are never cursed. Their slot comes from the table (default ring), and a boss carries its artifact and drops it where it dies.

**Prices**

- **Buying** costs value times (1 + 0.2 for each village below the surface); **selling** pays 50% of value with no depth multiplier (Fence adds 20% of that); a crude item's value is already half a normal one's, so it sells for half. Artifacts are priceless and cannot be sold. **Identification** costs 100 gp and **repair** 30% of value, both times the same multiplier.

## Addendum A (proposed October 1, 2026, awaiting approval)

From Intake Addendum A (findings A1, B1): every class needs starting gear before Phase 4 so it can be created and played. These lists use the 16 bases above, are normal quality, and may be revised in task 4.4.

| Class | Starting gear |
| --- | --- |
| Barbarian | Great axe, leather |
| Knight | Long sword, shield, chain |
| Paladin | Mace, shield, leather |
| Ranger | Short sword, shortbow with 20 arrows, leather |
| Monk | Quarterstaff |
| Bard | Short sword, sling with 20 stones, leather |
| Druid | Quarterstaff, leather, one potion of Healing |
| Necromancer | Dagger, one potion of Clarity |
| Sorcerer | Dagger, one potion of Clarity |
| Illusionist | Dagger, sling with 20 stones |
| Warlock | Dagger, leather, one potion of Clarity |
| Assassin | Short sword, two daggers, leather |
| Alchemist | Dagger, sling with 20 stones, one potion each of Healing and Cure |
| Shaman | Spear, leather, one potion of Healing |
| Witch Hunter | Short sword, crossbow with 20 bolts, leather |
| Beastmaster | Spear, shortbow with 20 arrows, leather |

**Acceptance criteria added**

- [ ] Every class starts with its listed gear, worn where it can be and the rest in the pack.

## Acceptance criteria

- [ ] Equipped items use no pack slots; stacks follow the per-slot table; a full pack refuses pickups.
- [ ] Break chances match the quality table over 100,000 simulated rolls, and broken gear gives no bonus until repaired.
- [ ] Weapon and armour modifiers apply only to the rolls named, and every trait works as written.
- [ ] Ranged weapons respect range and spend one ammunition per shot; the crossbow fires every other round.
- [ ] Unappraised gems and jewelry cannot be banked; each appraisal is fixed once rolled.
- [ ] Disguised names are shuffled per seed and stay consistent within a run.
- [ ] Identification reveals true names and curses; cursed items cannot be unequipped until lifted.
- [ ] Prices follow the depth multiplier and the sell rate in every village.

## Open questions

- [x] **Starting money:** 20 gp in the bank.
- [x] **Equipped items and slots:** worn and wielded items use no pack slots.
- [x] **Identify by use:** potions, wands and rods reveal themselves on use; the rest need the service.
- [x] **Curses:** about 10% of magic items.
- [x] **Appraisal fee:** free.
- [x] **Treasure mix and prices:** 50 / 30 / 20 split and potion prices approved; prices rise 20% per village.
- [x] **Shop restock:** after each village rest.
- [x] **Spent wands:** crumble at zero charges.
