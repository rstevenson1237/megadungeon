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
    { key: 'gold_pile',         weight: 30 },
    { key: 'healing_potion',    weight: 25 },
    { key: 'scroll_magic_missile', weight: 25 },
    { key: 'potion_of_speed',   weight: 20 },
  ],
  humanoid_poor: [
    { key: 'gold_pile',      weight: 60 },
    { key: 'dagger',         weight: 20 },
    { key: 'torch',          weight: 20 },
  ],
  humanoid: [
    { key: 'gold_pile',      weight: 50 },
    { key: 'dagger',         weight: 20 },
    { key: 'short_sword',    weight: 15 },
    { key: 'leather_armor',  weight: 15 },
  ],
  humanoid_standard: [
    { key: 'gold_pile',      weight: 40 },
    { key: 'short_sword',    weight: 20 },
    { key: 'leather_armor',  weight: 20 },
    { key: 'healing_potion', weight: 20 },
  ],
  humanoid_warrior: [
    { key: 'gold_pile',      weight: 30 },
    { key: 'short_sword',    weight: 20 },
    { key: 'chain_mail',     weight: 20 },
    { key: 'mace',           weight: 15 },
    { key: 'shield',         weight: 15 },
  ],
  humanoid_shamanistic: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'scroll_magic_missile', weight: 30 },
    { key: 'holy_symbol',          weight: 20 },
    { key: 'healing_potion',       weight: 20 },
  ],
  humanoid_mage: [
    { key: 'scroll_magic_missile', weight: 35 },
    { key: 'spellbook',            weight: 25 },
    { key: 'gold_pile',            weight: 25 },
    { key: 'ring_of_protection',   weight: 15 },
  ],
  undead_common: [
    { key: 'gold_pile',      weight: 50 },
    { key: 'holy_symbol',    weight: 30 },
    { key: 'torch',          weight: 20 },
  ],
  undead: [
    { key: 'gold_pile',            weight: 40 },
    { key: 'holy_symbol',          weight: 30 },
    { key: 'scroll_magic_missile', weight: 30 },
  ],
  undead_ancient: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'holy_symbol',          weight: 25 },
    { key: 'amulet_of_life_protection', weight: 25 },
    { key: 'healing_potion',       weight: 20 },
  ],
  undead_lord: [
    { key: 'gold_pile',                 weight: 25 },
    { key: 'amulet_of_life_protection', weight: 30 },
    { key: 'ring_of_protection',        weight: 25 },
    { key: 'healing_potion',            weight: 20 },
  ],
  undead_void: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'scroll_magic_missile', weight: 35 },
    { key: 'ring_of_protection',   weight: 35 },
  ],
  construct: [
    { key: 'gold_pile',      weight: 40 },
    { key: 'shield',         weight: 30 },
    { key: 'chain_mail',     weight: 30 },
  ],
  construct_magic: [
    { key: 'gold_pile',            weight: 25 },
    { key: 'ring_of_protection',   weight: 30 },
    { key: 'scroll_magic_missile', weight: 25 },
    { key: 'potion_of_speed',      weight: 20 },
  ],
  elemental: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'scroll_magic_missile', weight: 30 },
    { key: 'potion_of_speed',      weight: 40 },
  ],
  elemental_minor: [
    { key: 'gold_pile',      weight: 50 },
    { key: 'healing_potion', weight: 50 },
  ],
  demon: [
    { key: 'gold_pile',            weight: 30 },
    { key: 'sword_of_wounding',    weight: 20 },
    { key: 'scroll_magic_missile', weight: 25 },
    { key: 'ring_of_protection',   weight: 25 },
  ],
  demon_greater: [
    { key: 'gold_pile',            weight: 20 },
    { key: 'sword_of_wounding',    weight: 30 },
    { key: 'ring_of_protection',   weight: 25 },
    { key: 'amulet_of_life_protection', weight: 25 },
  ],
  dragon_hoard: [
    { key: 'gold_pile',                 weight: 25 },
    { key: 'sword_of_wounding',         weight: 20 },
    { key: 'ring_of_protection',        weight: 20 },
    { key: 'amulet_of_life_protection', weight: 20 },
    { key: 'plate_mail',                weight: 15 },
  ],
  legendary: [
    { key: 'sword_of_wounding',         weight: 25 },
    { key: 'ring_of_protection',        weight: 25 },
    { key: 'amulet_of_life_protection', weight: 25 },
    { key: 'plate_mail',                weight: 25 },
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
