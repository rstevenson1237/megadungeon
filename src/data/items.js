
export const ITEMS = {
  // === WEAPONS ===
  short_sword: {
    key: 'short_sword', name: 'Short Sword', category: 'weapon',
    glyph: 0x29, color: '#aaaaaa', weight: 3, value: 10, stackable: false,
    weapon: { damage: [1, 6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false },
    description: 'A reliable single-edged blade. The mercenary\'s choice.',
  },
  dagger:       { key: 'dagger',       name: 'Dagger',         category: 'weapon',  glyph: 0x2D, color: '#aaaaaa', weight: 1, value: 2,  stackable: false, weapon: { damage: [1,4], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A short blade.' },
  long_sword:   { key: 'long_sword',   name: 'Long Sword',     category: 'weapon',  glyph: 0x2F, color: '#aaaaaa', weight: 5, value: 25, stackable: false, weapon: { damage: [1,8], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A knight\'s blade.' },
  mace:         { key: 'mace',         name: 'Mace',           category: 'weapon',  glyph: 0x21, color: '#888888', weight: 6, value: 12, stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A flanged head on a stout shaft.' },
  staff:        { key: 'staff',        name: 'Staff',          category: 'weapon',  glyph: 0x7C, color: '#885533', weight: 4, value: 5,  stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: true  }, description: 'A walking stick that doubles as a weapon.' },
  short_bow:    { key: 'short_bow',    name: 'Short Bow',      category: 'weapon',  glyph: 0x29, color: '#885533', weight: 4, value: 25, stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 8, twoHanded: true  }, description: 'A compact recurve bow.' },

  // === ARMOR ===
  chain_mail: {
    key: 'chain_mail', name: 'Chain Mail', category: 'armor',
    glyph: 0x28, color: '#888888', weight: 15, value: 75, stackable: false,
    armor: { acBonus: 4, slot: 'body', maxDexBonus: 3 },
    description: 'Interlocking iron rings. Deflects blades well, rattles conspicuously.',
  },
  leather_armor:{ key: 'leather_armor',name: 'Leather Armor',  category: 'armor',   glyph: 0x28, color: '#885533', weight: 8,  value: 20,  stackable: false, armor: { acBonus: 2, slot: 'body', maxDexBonus: 6 }, description: 'Hardened leather.' },
  plate_mail:   { key: 'plate_mail',   name: 'Plate Mail',     category: 'armor',   glyph: 0x28, color: '#cccccc', weight: 25, value: 400, stackable: false, armor: { acBonus: 6, slot: 'body', maxDexBonus: 1 }, description: 'Full plate armor.' },
  shield:       { key: 'shield',       name: 'Shield',         category: 'armor',   glyph: 0x5B, color: '#888888', weight: 6,  value: 15,  stackable: false, armor: { acBonus: 1, slot: 'offhand', maxDexBonus: 6 }, description: 'A wooden shield banded with iron.' },

  // === TOOLS / MISC ===
  torch: {
    key: 'torch', name: 'Torch', category: 'tool',
    glyph: 0x7E, color: '#ffaa00', weight: 1, value: 1, stackable: true,
    description: 'A wooden stick wrapped in oil-soaked cloth. Provides light.',
  },

  ration: {
    key: 'ration', name: 'Ration', category: 'food',
    glyph: 0x25, color: '#aa8844', weight: 2, value: 5, stackable: true,
    food: { nutrition: 500 },
    description: 'A portion of dried meat, hardtack, and nuts. Barely edible, but keeps you going.',
  },

  rope: {
    key: 'rope', name: '50ft of Rope', category: 'tool',
    glyph: 0x26, color: '#8b4513', weight: 5, value: 1, stackable: false,
    description: 'A coil of sturdy hemp rope. Never leave home without it.',
  },
  thieves_tools:{ key: 'thieves_tools',name: 'Thieves\' Tools', category: 'tool',   glyph: 0x2B, color: '#888844', weight: 1, value: 25, stackable: false, description: 'Lock picks, tension wrench, and assorted probes.' },
  holy_symbol:  { key: 'holy_symbol',  name: 'Holy Symbol',    category: 'tool',    glyph: 0x2B, color: '#ffff88', weight: 0, value: 10, stackable: false, tags: ['holy'], description: 'A wooden symbol of your deity.' },
  spellbook:    { key: 'spellbook',    name: 'Spellbook',      category: 'tool',    glyph: 0x3D, color: '#8844cc', weight: 3, value: 50, stackable: false, description: 'A leather-bound book of arcane formulae.' },
  inkpot:       { key: 'inkpot',       name: 'Inkpot',         category: 'tool',    glyph: 0x6F, color: '#222222', weight: 1, value: 2,  stackable: false, description: 'A small pot of black ink.' },
  arrows_20:    { key: 'arrows_20',    name: '20 Arrows',      category: 'tool',    glyph: 0x7C, color: '#885533', weight: 2, value: 5,  stackable: true,  description: 'A quiver of wooden arrows.' },
  gold_pile:    { key: 'gold_pile',    name: 'Gold Coins',     category: 'treasure',glyph: 0x24, color: '#ffcc00', weight: 1, value: 1,  stackable: true,  description: 'A handful of gold coins.' },

  // === POTIONS (unidentified until tested or ID'd) ===
  healing_potion: {
    key: 'healing_potion', name: 'Potion of Healing', genericName: 'Red Potion', category: 'potion',
    glyph: 0x21, color: '#ff4444', weight: 1, value: 50, stackable: true,
    potion: { effect: 'heal', magnitude: '2d4+2', duration: 0 },
    description: 'A warm, copper-tasting liquid that knits wounds with uncanny speed.',
  },

  potion_of_speed: {
    key: 'potion_of_speed', name: 'Potion of Speed', genericName: 'Silver Potion', category: 'potion',
    glyph: 0x21, color: '#aaaaff', weight: 1, value: 100, stackable: true,
    potion: { effect: 'haste', magnitude: 2, duration: 20 }, // 2× speed for 20 turns
    description: 'The world lurches into slow motion around you.',
  },

  // === SCROLLS ===
  scroll_magic_missile: {
    key: 'scroll_magic_missile', name: 'Scroll of Magic Missile', genericName: 'Rolled Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ccccff', weight: 0, value: 35, stackable: false,
    scroll: { spellKey: 'magic_missile', casterLevel: 3 },
    description: 'Barely legible runes flare as your eyes trace the words of power.',
  },

  // === MAGICAL ITEMS ===
  ring_of_protection: {
    key: 'ring_of_protection', name: 'Ring of Protection +1', genericName: 'Plain Ring',
    category: 'ring', glyph: 0xB0, color: '#ffcc44', weight: 0, value: 1000, stackable: false,
    effects: [{ type: 'ac', value: 1 }, { type: 'saves', value: 1 }],
    description: 'A faint shimmer plays over your skin when you wear it.',
  },

  amulet_of_life_protection: {
    key: 'amulet_of_life_protection', name: 'Amulet of Life Protection',
    category: 'amulet', glyph: 0x09, color: '#ffcc88', weight: 0, value: 5000, stackable: false,
    effects: [{ type: 'immune', value: 'energy_drain' }],
    description: 'A soul-gem that holds a tiny piece of your life force at all times — beyond reach of the undead.',
  },

  // === CURSED ITEMS ===
  sword_of_wounding: {
    key: 'sword_of_wounding', name: 'Long Sword -1', genericName: 'Fine Long Sword',
    category: 'weapon', glyph: 0x2F, color: '#ff6644', weight: 5, value: 0, stackable: false,
    cursed: true,
    weapon: { damage: [1, 8], attackBonus: -1, damageMod: -1, range: 1, twoHanded: false },
    curse: { type: 'cannot_unequip', displayedAs: 'Long Sword +0' },
    description: 'It feels right in your hand — too right. You don\'t want to let go.',
  },
};
