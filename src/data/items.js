
export const ITEMS = {
  // === WEAPONS ===
  short_sword: {
    key: 'short_sword', name: 'Short Sword', category: 'weapon',
    glyph: 0x29, color: '#aaaaaa', weight: 3, value: 10, stackable: false,
    weapon: { damage: [1, 6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false },
    description: 'A reliable single-edged blade. The mercenary\'s choice.',
  },

  // === ARMOR ===
  chain_mail: {
    key: 'chain_mail', name: 'Chain Mail', category: 'armor',
    glyph: 0x28, color: '#888888', weight: 15, value: 75, stackable: false,
    armor: { acBonus: 4, slot: 'body', maxDexBonus: 3 },
    description: 'Interlocking iron rings. Deflects blades well, rattles conspicuously.',
  },

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
  }
};
