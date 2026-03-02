/**
 * Theme definition structure.
 * @typedef {Object} Theme
 * @property {string}   name
 * @property {string}   description
 * @property {number[]} floorGlyphs      CP437 codes (randomly picked per tile)
 * @property {number}   wallGlyph
 * @property {string}   floorFg / floorBg / wallFg / wallBg
 * @property {number}   minRoomW / maxRoomW / minRoomH / maxRoomH
 * @property {Object}   monsterWeights   { monsterTag: weight }
 * @property {Object}   itemWeights
 * @property {string[]} dressingFeatures ['pool','pillar','rubble','torch','altar',...]
 * @property {string[]} ambientMessages  Flavor messages shown when entering
 */

export const THEMES = {
  dungeon_cellar: {
    name: 'Dungeon Cellar',
    description: 'Stone-cut vaults beneath a keep, damp with mildew and old blood.',
    floorGlyphs: [0x2E, 0x2C, 0xFA], // . , ·
    wallGlyph: 0x23,                  // #
    floorFg: '#5a5a5a', floorBg: '#0a0a0a',
    wallFg: '#888888',  wallBg: '#111111',
    minRoomW: 4, maxRoomW: 10, minRoomH: 3, maxRoomH: 8,
    monsterWeights: { giant_rat: 30, goblin: 25, orc: 15, zombie: 15, skeleton: 10, giant_spider: 5 },
    itemWeights: { torch: 20, ration: 15, iron_key: 10, healing_potion: 15, short_sword: 10, leather_armor: 10, old_scroll: 20 },
    dressingFeatures: ['torch', 'barrel', 'rubble', 'stain', 'crack'],
    ambientMessages: [
      'The air reeks of rot and old torch-smoke.',
      'Water drips somewhere in the darkness.',
      'You hear scratching in the walls.',
      'A rusted iron ring is bolted to the wall — chains hang from it.',
    ]
  },

  goblin_warren: {
    name: 'Goblin Warren',
    description: 'Cramped tunnels dug by many hands, reeking of offal and cookfires.',
    floorGlyphs: [0x2E, 0x60, 0x27],
    wallGlyph: 0x25,
    floorFg: '#4a3a1a', floorBg: '#080800',
    wallFg: '#6b5a3a',  wallBg: '#100e00',
    minRoomW: 3, maxRoomW: 7, minRoomH: 3, maxRoomH: 6,
    monsterWeights: { goblin: 45, goblin_shaman: 15, hobgoblin: 20, warg: 10, orc: 10 },
    itemWeights: { stolen_coin_purse: 20, crude_dagger: 15, goblin_idol: 10, mead_skin: 10, net: 10, torch: 20, bone_wand: 5, ration: 10 },
    dressingFeatures: ['bone_pile', 'crude_idol', 'cook_fire', 'filth', 'cage'],
    ambientMessages: [
      'Crude pictographs cover the walls in dark pigment.',
      'You smell roasting meat — not a pleasant thought.',
      'Tiny claw-marks line the floor.',
      'A low, guttural chanting echoes from deeper in.',
    ]
  },

  catacomb: {
    name: 'Catacomb',
    description: 'Miles of bone-lined passages, the honored dead disturbed from their rest.',
    floorGlyphs: [0x2E, 0xF9, 0xFA],
    wallGlyph: 0xDB,
    floorFg: '#3a3a4a', floorBg: '#05050a',
    wallFg: '#aaaacc',  wallBg: '#0a0a14',
    minRoomW: 4, maxRoomW: 9, minRoomH: 3, maxRoomH: 7,
    monsterWeights: { skeleton: 30, zombie: 25, ghoul: 20, wight: 10, wraith: 10, vampire_spawn: 5 },
    itemWeights: { burial_urn: 20, ancient_coin: 15, bone_holy_symbol: 15, scroll_of_turning: 10, grave_dust: 10, embalming_kit: 5, unholy_water: 10, antique_ring: 15 },
    dressingFeatures: ['niche', 'sarcophagus', 'candle', 'inscription', 'bone_pile'],
    ambientMessages: [
      'The dead are stacked ten deep in the niches above.',
      'An inscription reads: HERE LIE THE FORGOTTEN.',
      'Candles burn without wax melting. They have burned forever.',
      'Something moves behind the sealed sarcophagi.',
    ]
  },
};
