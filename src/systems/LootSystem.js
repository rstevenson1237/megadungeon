// src/systems/LootSystem.js
import { Item } from '../entities/Item.js';

/**
 * Resolves monster loot tables into concrete drops.
 *
 * STANDARD TABLES (rank-and-file monsters):
 *   T1_none           — Pure animals: no treasure concept
 *   T2_beast          — Large beasts: body parts, nesting debris
 *   T3_goblinoid      — Weak chaotic humanoids: stolen trinkets
 *   T4_warrior        — Organized humanoid soldiers: pay and equipment
 *   T5_arcane         — Magic-using creatures: components and oddities
 *   T6_predator       — Large apex predators: accumulated lair debris
 *   T7_undead_mindless — Mindless undead: died with what they had
 *   T8_undead_aware   — Intelligent undead: hoarded wealth from life
 *   T9_undead_noble   — Aristocratic/ancient undead: once wealthy
 *
 * HOARD TABLES (boss encounters, chance: 1.0):
 *   H1_warchief       — Humanoid boss: tribute and trophies
 *   H2_undead_lord    — Powerful undead boss: ancient hoarded wealth
 *   H3_apex           — Dragon-tier: true hoard, guaranteed magic
 *
 * Each table returns an array of: { type: 'gold', amount } | { type: 'item', itemKey }
 *
 * Assignment in monsters.js:
 *   loot: { table: 'T4_warrior', chance: 0.55 }
 */
export class LootSystem {
  constructor(rng) {
    this.rng = rng;
  }

  /**
   * Roll loot for a dead monster.
   * @param {Object} monsterDef  The full monster definition from MONSTERS
   * @param {number} dungeonLevel
   * @returns {Array} of drop objects
   */
  rollDrops(monsterDef, dungeonLevel) {
    const loot = monsterDef.loot;
    if (!loot) return [];
    if (!this.rng.chance(loot.chance ?? 0.3)) return [];
    return this._resolveTable(loot.table ?? 'T4_warrior', dungeonLevel);
  }

  _resolveTable(tableName, level) {
    const lv = Math.max(1, level); // level multiplier base
    const drops = [];

    switch (tableName) {

      // ── T1: NONE ────────────────────────────────────────────────────
      // Pure animals. No concept of carrying treasure.
      // Extremely rare: a shiny coin stuck in their nesting material.
      case 'T1_none':
        if (this.rng.chance(0.08)) {
          drops.push({ type: 'gold', amount: this.rng.int(1, 3) });
        }
        break;

      // ── T2: BEAST ───────────────────────────────────────────────────
      // Large animals nest near dead prey. Occasionally something useful
      // is caught in their webs or lair, or their body parts have value.
      case 'T2_beast':
        if (this.rng.chance(0.30)) {
          // Mostly body parts / trophies — low gold or a vermin_trophy
          const roll = this.rng.float();
          if (roll < 0.6) {
            drops.push({ type: 'gold', amount: this.rng.int(1, 4) });
          } else {
            drops.push({ type: 'item', itemKey: 'vermin_trophy' });
          }
        }
        break;

      // ── T3: GOBLINOID ───────────────────────────────────────────────
      // Goblins steal everything but spend it on garbage. Pocket change,
      // stolen trinkets, the odd item pried from a corpse.
      case 'T3_goblinoid':
        // Gold: almost always some, but little
        drops.push({ type: 'gold', amount: this.rng.int(1, 6) * Math.ceil(lv / 2) });
        // 20% chance: a crude trinket or tattered satchel
        if (this.rng.chance(0.20)) {
          const items = ['crude_trinket', 'tattered_satchel', 'war_token'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        break;

      // ── T4: WARRIOR ─────────────────────────────────────────────────
      // Organized combatants. They draw pay, carry kit, and sometimes
      // have a better item lifted from a previous victim.
      case 'T4_warrior':
        // Solid gold from soldier's pay
        drops.push({ type: 'gold', amount: this.rng.int(2, 12) * lv });
        // 25% chance: war token, merchant seal, or better
        if (this.rng.chance(0.25)) {
          const items = ['war_token', 'merchant_seal', 'silver_candlestick'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        // Deeper levels: higher chance of a tier-2 item
        if (lv >= 5 && this.rng.chance(0.15)) {
          const items = ['ancient_coin_cache', 'jeweled_brooch', 'warrior_signet'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        break;

      // ── T5: ARCANE ──────────────────────────────────────────────────
      // Magic users carry components, ritual objects, and the occasional
      // scroll or wand. Less gold than warriors; more esoteric value.
      case 'T5_arcane':
        // Modest gold
        if (this.rng.chance(0.60)) {
          drops.push({ type: 'gold', amount: this.rng.int(1, 8) * lv });
        }
        // High chance of spell component pouch or ritual object
        if (this.rng.chance(0.50)) {
          const items = ['spell_component_pouch', 'crude_trinket', 'bone_holy_symbol'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        // Deeper levels: chance of enchanted or cursed item
        if (lv >= 4 && this.rng.chance(0.20)) {
          const items = ['enchanted_gem', 'cursed_idol', 'ancient_coin_cache'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        break;

      // ── T6: PREDATOR ────────────────────────────────────────────────
      // Large monsters — trolls, ogres, giants. Not intelligent hoarders
      // but their lairs accumulate the bones and possessions of past prey.
      case 'T6_predator':
        // Substantial gold — accumulated from victims
        drops.push({ type: 'gold', amount: this.rng.int(5, 30) * lv });
        // Guaranteed item from prey remains
        if (this.rng.chance(0.60)) {
          const tier1 = ['crude_trinket', 'war_token', 'tattered_satchel'];
          const tier2 = ['silver_candlestick', 'ancient_coin_cache', 'merchant_seal'];
          const pool = lv >= 5 ? [...tier1, ...tier2] : tier1;
          drops.push({ type: 'item', itemKey: this.rng.pick(pool) });
        }
        // Deep levels: occasional valuable
        if (lv >= 8 && this.rng.chance(0.25)) {
          drops.push({ type: 'item', itemKey: this.rng.pick(['golden_idol', 'jeweled_brooch']) });
        }
        break;

      // ── T7: UNDEAD MINDLESS ─────────────────────────────────────────
      // Skeletons and zombies. They died with what they had. Most was
      // taken long ago. A few still clutch an old coin or trinket.
      case 'T7_undead_mindless':
        if (this.rng.chance(0.20)) {
          drops.push({ type: 'gold', amount: this.rng.int(1, 6) });
        }
        // Small chance of something from their burial or life
        if (this.rng.chance(0.10)) {
          const items = ['crude_trinket', 'war_token', 'ancient_coin_cache'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        break;

      // ── T8: UNDEAD AWARE ────────────────────────────────────────────
      // Intelligent undead (ghouls, wraiths, wights). They remember
      // their former lives and sometimes hoarded wealth from before
      // their death or from decades of preying on the living.
      case 'T8_undead_aware':
        // Moderate gold — accumulated over their undead existence
        drops.push({ type: 'gold', amount: this.rng.int(3, 18) * lv });
        // Good chance of a grave good or personal effect
        if (this.rng.chance(0.45)) {
          const items = ['bone_holy_symbol', 'ancient_coin_cache', 'funeral_mask', 'warrior_signet'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        // Chance of enchanted item — from a powerful mage or noble they consumed
        if (lv >= 6 && this.rng.chance(0.20)) {
          const items = ['enchanted_gem', 'cursed_idol', 'jeweled_brooch'];
          drops.push({ type: 'item', itemKey: this.rng.pick(items) });
        }
        break;

      // ── T9: UNDEAD NOBLE ────────────────────────────────────────────
      // Vampire spawn, wights, and aristocratic undead. These were
      // wealthy or important in life. Their graves were stocked; their
      // lairs contain legacy wealth.
      case 'T9_undead_noble':
        // Strong gold
        drops.push({ type: 'gold', amount: this.rng.int(8, 40) * lv });
        // High chance of a quality item
        if (this.rng.chance(0.70)) {
          const tier2 = ['silver_candlestick', 'funeral_mask', 'warrior_signet', 'jeweled_brooch'];
          const tier3 = ['golden_idol', 'ancient_relic', 'enchanted_gem'];
          const pool = lv >= 8 ? [...tier2, ...tier3] : tier2;
          drops.push({ type: 'item', itemKey: this.rng.pick(pool) });
        }
        // Cursed item chance — noble undead often carry tainted objects
        if (this.rng.chance(0.25)) {
          drops.push({ type: 'item', itemKey: 'cursed_idol' });
        }
        break;

      // ── H1: WARCHIEF HOARD ──────────────────────────────────────────
      // An orc warchief, goblin king, hobgoblin captain. Tribute and
      // trophies from years of raiding. This is their personal hoard.
      case 'H1_warchief':
        // Substantial gold — tribute from underlings
        drops.push({ type: 'gold', amount: this.rng.int(20, 80) * lv });
        // 2–3 items guaranteed
        const warItems = ['silver_candlestick', 'merchant_seal', 'ancient_coin_cache',
                           'warrior_signet', 'jeweled_brooch', 'golden_idol'];
        const warCount = this.rng.int(2, 3);
        const usedWar = new Set();
        for (let i = 0; i < warCount; i++) {
          let key;
          do { key = this.rng.pick(warItems); } while (usedWar.has(key));
          usedWar.add(key);
          drops.push({ type: 'item', itemKey: key });
        }
        // 40% chance of a magical item — taken from a worthy opponent
        if (this.rng.chance(0.40)) {
          drops.push({ type: 'item', itemKey: this.rng.pick(['enchanted_gem', 'ancient_relic']) });
        }
        break;

      // ── H2: UNDEAD LORD HOARD ───────────────────────────────────────
      // Lich, death knight, powerful vampire. Ancient hoarded wealth from
      // centuries of existence. Magical items are common; curses possible.
      case 'H2_undead_lord':
        // Heavy gold — centuries of accumulation
        drops.push({ type: 'gold', amount: this.rng.int(40, 150) * lv });
        // 2–4 items, including at least one magical
        const undeadItems = ['funeral_mask', 'ancient_coin_cache', 'warrior_signet',
                              'golden_idol', 'ancient_relic', 'bone_holy_symbol'];
        const undeadCount = this.rng.int(2, 4);
        const usedUndead = new Set();
        for (let i = 0; i < undeadCount; i++) {
          let key;
          do { key = this.rng.pick(undeadItems); } while (usedUndead.has(key));
          usedUndead.add(key);
          drops.push({ type: 'item', itemKey: key });
        }
        // Guaranteed magical item
        drops.push({ type: 'item', itemKey: this.rng.pick(['enchanted_gem', 'ancient_relic']) });
        // High curse risk — lords often wield or guard cursed objects
        if (this.rng.chance(0.50)) {
          drops.push({ type: 'item', itemKey: 'cursed_idol' });
        }
        break;

      // ── H3: APEX HOARD ──────────────────────────────────────────────
      // Dragon, elder demon, ancient construct. A true hoard.
      // Gold is guaranteed and substantial. Multiple magical items.
      case 'H3_apex':
        // Massive gold
        drops.push({ type: 'gold', amount: this.rng.int(100, 400) * lv });
        // 3–5 items across all tiers
        const apexPool = [
          'silver_candlestick', 'ancient_coin_cache', 'golden_idol',
          'funeral_mask', 'jeweled_brooch', 'warrior_signet',
          'ancient_relic', 'dragon_scale'
        ];
        const apexCount = this.rng.int(3, 5);
        const usedApex = new Set();
        for (let i = 0; i < apexCount; i++) {
          let key;
          do { key = this.rng.pick(apexPool); } while (usedApex.has(key));
          usedApex.add(key);
          drops.push({ type: 'item', itemKey: key });
        }
        // Guaranteed 1–2 magical items
        const magicCount = this.rng.int(1, 2);
        const magicPool = ['enchanted_gem', 'ancient_relic', 'dragon_scale'];
        for (let i = 0; i < magicCount; i++) {
          drops.push({ type: 'item', itemKey: this.rng.pick(magicPool) });
        }
        break;

      // ── DEFAULT FALLBACK ─────────────────────────────────────────────
      default:
        console.warn(`LootSystem: Unknown table "${tableName}" — using T4_warrior fallback`);
        return this._resolveTable('T4_warrior', level);
    }

    return drops;
  }

  /**
   * Spawn drops onto the map at the monster's last position.
   * Gold is added directly to player.gold (caller's responsibility).
   * Items are placed as map entities at (x, y).
   *
   * @returns {{ goldGained: number, itemsDropped: string[] }}
   */
  spawnDrops(drops, map, x, y) {
    let goldGained = 0;
    const itemsDropped = [];

    for (const drop of drops) {
      if (drop.type === 'gold') {
        goldGained += drop.amount;
      } else if (drop.type === 'item') {
        try {
          const item = Item.create(drop.itemKey);
          item.x = x;
          item.y = y;
          map.addEntity(item);
          itemsDropped.push(item.name);
        } catch (e) {
          console.warn(`LootSystem: Could not create item "${drop.itemKey}":`, e.message);
        }
      }
    }

    return { goldGained, itemsDropped };
  }
}
