/**
 * Loot tables used by monster def.loot.table references.
 * Each table is an array of { key, weight } entries.
 * Weight is relative — higher = more likely.
 */
export const LOOT_TABLES = {
  vermin: [
    { key: 'gold_pile',      weight: 50 },
    { key: 'ration',         weight: 30 },
    { key: 'rope',           weight: 20 },
  ],
  beast: [
    { key: 'gold_pile',      weight: 40 },
    { key: 'ration',         weight: 40 },
    { key: 'healing_potion', weight: 20 },
  ],
  beast_large: [
    { key: 'gold_pile',      weight: 40 },
    { key: 'healing_potion', weight: 35 },
    { key: 'ration',         weight: 25 },
  ],
  beast_exotic: [
    { key: 'gold_pile',         weight: 30 },
    { key: 'healing_potion',    weight: 30 },
    { key: 'potion_of_speed',   weight: 20 },
    { key: 'rope',              weight: 20 },
  ],
  beast_planar: [
    { key: 'gold_pile',            weight: 25 },
    { key: 'healing_potion',       weight: 20 },
    { key: 'scroll_magic_missile', weight: 20 },
    { key: 'potion_of_speed',      weight: 20 },
    { key: 'void_shard',           weight: 15 },
  ],
  humanoid_poor: [
    { key: 'gold_pile',          weight: 50 },
    { key: 'crude_dagger',       weight: 25 },
    { key: 'torch',              weight: 15 },
    { key: 'stolen_coin_purse',  weight: 10 },
  ],
  humanoid: [
    { key: 'gold_pile',         weight: 40 },
    { key: 'dagger',            weight: 15 },
    { key: 'short_sword',       weight: 15 },
    { key: 'leather_armor',     weight: 10 },
    { key: 'stolen_coin_purse', weight: 10 },
    { key: 'mead_skin',         weight: 10 },
  ],
  humanoid_standard: [
    { key: 'gold_pile',      weight: 35 },
    { key: 'short_sword',    weight: 20 },
    { key: 'leather_armor',  weight: 15 },
    { key: 'healing_potion', weight: 15 },
    { key: 'iron_helm',      weight: 15 },
  ],
  humanoid_warrior: [
    { key: 'gold_pile',        weight: 25 },
    { key: 'short_sword',      weight: 15 },
    { key: 'chain_mail',       weight: 15 },
    { key: 'mace',             weight: 10 },
    { key: 'shield',           weight: 10 },
    { key: 'war_axe',          weight: 10 },
    { key: 'battle_axe',       weight: 10 },
    { key: 'studded_leather',  weight: 5  },
  ],
  humanoid_shamanistic: [
    { key: 'gold_pile',            weight: 25 },
    { key: 'scroll_magic_missile', weight: 20 },
    { key: 'old_scroll',           weight: 20 },
    { key: 'holy_symbol',          weight: 15 },
    { key: 'bone_holy_symbol',     weight: 10 },
    { key: 'healing_potion',       weight: 10 },
  ],
  humanoid_mage: [
    { key: 'scroll_magic_missile',  weight: 25 },
    { key: 'scroll_of_fireball',    weight: 15 },
    { key: 'scroll_of_sleep',       weight: 15 },
    { key: 'spellbook',             weight: 15 },
    { key: 'gold_pile',             weight: 15 },
    { key: 'ring_of_protection',    weight: 10 },
    { key: 'wand_of_magic_missile', weight: 5  },
  ],
  undead_common: [
    { key: 'gold_pile',     weight: 40 },
    { key: 'holy_symbol',   weight: 20 },
    { key: 'torch',         weight: 15 },
    { key: 'burial_urn',    weight: 15 },
    { key: 'ancient_coin',  weight: 10 },
  ],
  undead: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'holy_symbol',          weight: 20 },
    { key: 'scroll_magic_missile', weight: 15 },
    { key: 'scroll_of_turning',    weight: 15 },
    { key: 'burial_urn',           weight: 10 },
    { key: 'grave_dust',           weight: 10 },
  ],
  undead_ancient: [
    { key: 'gold_pile',                 weight: 25 },
    { key: 'holy_symbol',               weight: 15 },
    { key: 'amulet_of_life_protection', weight: 20 },
    { key: 'healing_potion',            weight: 15 },
    { key: 'antique_ring',              weight: 15 },
    { key: 'ancient_coin',              weight: 10 },
  ],
  undead_lord: [
    { key: 'gold_pile',                 weight: 20 },
    { key: 'amulet_of_life_protection', weight: 25 },
    { key: 'ring_of_protection',        weight: 20 },
    { key: 'healing_potion',            weight: 15 },
    { key: 'scroll_of_turning',         weight: 10 },
    { key: 'antique_ring',              weight: 10 },
  ],
  undead_void: [
    { key: 'gold_pile',            weight: 20 },
    { key: 'scroll_magic_missile', weight: 25 },
    { key: 'ring_of_protection',   weight: 25 },
    { key: 'void_shard',           weight: 20 },
    { key: 'shadow_essence',       weight: 10 },
  ],
  construct: [
    { key: 'gold_pile',      weight: 40 },
    { key: 'shield',         weight: 25 },
    { key: 'chain_mail',     weight: 25 },
    { key: 'iron_ingot',     weight: 10 },
  ],
  construct_magic: [
    { key: 'gold_pile',             weight: 20 },
    { key: 'ring_of_protection',    weight: 20 },
    { key: 'scroll_magic_missile',  weight: 20 },
    { key: 'potion_of_speed',       weight: 15 },
    { key: 'wand_of_magic_missile', weight: 15 },
    { key: 'mana_crystal',          weight: 10 },
  ],
  elemental: [
    { key: 'gold_pile',          weight: 20 },
    { key: 'scroll_magic_missile', weight: 20 },
    { key: 'potion_of_speed',    weight: 20 },
    { key: 'elemental_shard',    weight: 20 },
    { key: 'elemental_essence',  weight: 10 },
    { key: 'fire_opal',          weight: 5  },
    { key: 'aquamarine',         weight: 5  },
  ],
  elemental_minor: [
    { key: 'gold_pile',       weight: 40 },
    { key: 'healing_potion',  weight: 30 },
    { key: 'elemental_shard', weight: 30 },
  ],
  demon: [
    { key: 'gold_pile',            weight: 25 },
    { key: 'sword_of_wounding',    weight: 15 },
    { key: 'scroll_magic_missile', weight: 20 },
    { key: 'ring_of_protection',   weight: 15 },
    { key: 'wand_of_fear',         weight: 15 },
    { key: 'void_shard',           weight: 10 },
  ],
  demon_greater: [
    { key: 'gold_pile',                  weight: 15 },
    { key: 'sword_of_wounding',          weight: 20 },
    { key: 'ring_of_protection',         weight: 20 },
    { key: 'amulet_of_life_protection',  weight: 15 },
    { key: 'phase_blade',                weight: 10 },
    { key: 'dark_pearl',                 weight: 10 },
    { key: 'void_shard',                 weight: 10 },
  ],
  dragon_hoard: [
    { key: 'gold_pile',                  weight: 20 },
    { key: 'sword_of_wounding',          weight: 15 },
    { key: 'ring_of_protection',         weight: 15 },
    { key: 'amulet_of_life_protection',  weight: 15 },
    { key: 'plate_mail',                 weight: 10 },
    { key: 'great_sword',                weight: 10 },
    { key: 'deep_gem',                   weight: 8  },
    { key: 'mithral_shard',              weight: 7  },
  ],
  legendary: [
    { key: 'sword_of_wounding',          weight: 15 },
    { key: 'ring_of_protection',         weight: 15 },
    { key: 'amulet_of_life_protection',  weight: 15 },
    { key: 'plate_mail',                 weight: 15 },
    { key: 'phase_blade',                weight: 15 },
    { key: 'wand_of_lightning',          weight: 10 },
    { key: 'dark_pearl',                 weight: 8  },
    { key: 'mithral_shard',              weight: 7  },
  ],
  // Thematic tables for dwarven and goblin drops
  goblin: [
    { key: 'stolen_coin_purse', weight: 35 },
    { key: 'crude_dagger',      weight: 30 },
    { key: 'goblin_idol',       weight: 20 },
    { key: 'mead_skin',         weight: 15 },
  ],
  dwarven: [
    { key: 'dwarven_ale',    weight: 30 },
    { key: 'iron_ingot',     weight: 25 },
    { key: 'war_axe',        weight: 20 },
    { key: 'dwarven_bread',  weight: 15 },
    { key: 'deep_gem',       weight: 10 },
  ],
};

/**
 * Pick a weighted random item key from a loot table.
 * @param {string} tableName
 * @param {object} rng  — must have .int(min, max)
 * @returns {string|null}
 */
export function rollLootTable(tableName, rng) {
  const table = LOOT_TABLES[tableName];
  if (!table || table.length === 0) return null;
  const total = table.reduce((s, e) => s + e.weight, 0);
  let roll = rng.int(1, total);
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) return entry.key;
  }
  return table[table.length - 1].key;
}
