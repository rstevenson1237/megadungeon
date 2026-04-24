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
 * @property {string[]} mapSizes         Allowed sizes: 'tiny'|'small'|'medium'|'large'|'huge'
 *                                       Matched to MAP_SIZES in LevelGen.js
 */

export const THEMES = {
  dungeon_cellar: {
    name: 'Dungeon Cellar',
    description: 'Stone-cut vaults beneath a keep, damp with mildew and old blood.',
    minDepth: 1, maxDepth: 25, weight: 10,
    mapSizes: ['small', 'medium'],
    floorGlyphs: [0x2E, 0x2C, 0xFA], // . , ·
    wallGlyph: 0x23,                  // #
    floorFg: '#7a6a50', floorBg: '#0d0a06',
    wallFg:  '#9a8060', wallBg:  '#130e08',
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
    minDepth: 1, maxDepth: 20, weight: 10,
    mapSizes: ['tiny', 'small'],
    floorGlyphs: [0x2E, 0x60, 0x27],
    wallGlyph: 0x25,
    floorFg: '#5a4828', floorBg: '#09080a',
    wallFg:  '#7a6840', wallBg:  '#12100a',
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
    minDepth: 10, maxDepth: 45, weight: 10,
    mapSizes: ['small', 'medium'],
    floorGlyphs: [0x2E, 0xF9, 0xFA],
    wallGlyph: 0xDB,
    floorFg: '#707080', floorBg: '#06060c',
    wallFg:  '#c0c0d0', wallBg:  '#0e0e18',
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

  dwarven_deep: {
    name: 'Dwarven Deep',
    description: 'Vast stonework halls carved by dwarven hands long since fled or slain — now haunted by their darker kin.',
    minDepth: 25, maxDepth: 65, weight: 10,
    mapSizes: ['medium', 'large'],
    floorGlyphs: [0x2E, 0xFA, 0xF9],  // . · ·
    wallGlyph: 0xFE,                   // ■
    floorFg: '#706050', floorBg: '#0a0804',
    wallFg:  '#908060', wallBg:  '#140e08',
    corridorFg: '#604a38', corridorBg: '#060402',
    minRoomW: 5, maxRoomW: 14, minRoomH: 4, maxRoomH: 10,
    monsterWeights: { duergar: 30, dark_dwarf_warrior: 25, cave_troll: 15, stone_golem: 10, iron_defender: 10, duergar_sorcerer: 10 },
    itemWeights: { dwarven_ale: 15, iron_ingot: 15, runic_chisel: 10, deep_gem: 10, forge_hammer: 10, mithral_shard: 5, dwarven_bread: 15, war_axe: 10, chain_mail: 10 },
    dressingFeatures: ['pillar', 'torch_sconce', 'statue', 'bookshelf', 'crate', 'throne', 'fountain', 'chest'],
    ambientMessages: [
      'Geometric carvings line every surface — dwarf-runes, worn but legible to those who know.',
      'The forges have long gone cold. You can still smell the old soot.',
      'Iron rails in the floor once guided ore carts. Something runs along them now.',
      'A great hall stretches ahead, its vaulted ceiling lost in shadow.',
      'The stonework is perfect. Not a single gap, not a single crack — until it was broken from within.',
    ]
  },

  elemental_grotto: {
    name: 'Elemental Grotto',
    description: 'A rift in natural law, where elemental forces leak through from the inner planes into glittering caverns.',
    minDepth: 40, maxDepth: 80, weight: 10,
    mapSizes: ['medium', 'large'],
    floorGlyphs: [0x2E, 0x2C, 0x60],  // . , `
    wallGlyph: 0xB1,                   // ▒
    floorFg: '#507878', floorBg: '#020e0e',
    wallFg:  '#60a0c0', wallBg:  '#041618',
    corridorFg: '#3a6060', corridorBg: '#010a0a',
    minRoomW: 5, maxRoomW: 13, minRoomH: 4, maxRoomH: 9,
    monsterWeights: { fire_elemental: 20, water_elemental: 20, earth_elemental: 15, magma_sprite: 20, crystal_golem: 15, storm_wisp: 10, dragon_young_red: 5 },
    itemWeights: { elemental_shard: 20, fire_opal: 10, mana_crystal: 15, elemental_essence: 10, aquamarine: 10, lodestone: 10, prismatic_flask: 10, earth_heart: 5, storm_rune: 10 },
    dressingFeatures: ['crystal_formation', 'fountain', 'transport_circle', 'chest'],
    ambientMessages: [
      'The air crackles with barely-contained energy. Your hair stands on end.',
      'Crystals pulse with an inner light that shifts from blue to orange to green.',
      'A rift in the stone weeps something that might be water — or might not be.',
      'The temperature swings wildly between ice-cold and scalding as you move.',
      'You hear singing. There are no voices — just the stone, vibrating at the edge of meaning.',
    ]
  },

  final_descent: {
    name: 'The Final Descent',
    description: 'The lowest point of all things. An arena at the bottom of the world.',
    mapSizes: ['huge'],
    floorGlyphs: [0x2E, 0xF9],
    wallGlyph: 0xDB,               // █
    floorFg: '#222222', floorBg: '#000000',
    wallFg:  '#cc0000', wallBg:  '#0a0000',
    corridorFg: '#1a1a1a', corridorBg: '#000000',
    minRoomW: 10, maxRoomW: 30, minRoomH: 8, maxRoomH: 20,
    minDepth: 100, maxDepth: 100, weight: 999,
    monsterWeights: { abyssal_throne: 100 },
    itemWeights: {},
    dressingFeatures: ['altar', 'statue'],
    ambientMessages: [
      'This is the end of the world.',
      'The air is perfectly still.',
      'You have come further than any before you.',
    ],
  },

  void_passage: {
    name: 'Void Passage',
    description: 'Corridors between worlds — extradimensional channels through which things that should not exist freely travel.',
    minDepth: 70, maxDepth: 99, weight: 10,
    mapSizes: ['large', 'huge'],
    floorGlyphs: [0xFA, 0xF9, 0x2E],  // · · .
    wallGlyph: 0xB0,                   // ░
    floorFg: '#503058', floorBg: '#040108',
    wallFg:  '#8855aa', wallBg:  '#0e0618',
    corridorFg: '#301830', corridorBg: '#020006',
    minRoomW: 4, maxRoomW: 11, minRoomH: 3, maxRoomH: 8,
    monsterWeights: { shadow_demon: 25, void_wraith: 25, phase_spider: 20, void_hound: 15, rift_stalker: 15 },
    itemWeights: { void_shard: 20, shadow_essence: 15, phase_blade: 5, dimensional_key: 10, null_stone: 10, rift_scroll: 15, planar_compass: 5, dark_pearl: 10, soul_candle: 10 },
    dressingFeatures: ['crystal_formation', 'altar', 'transport_circle', 'chest'],
    ambientMessages: [
      'The walls are not walls. They are the absence of something that was once here.',
      'Your footsteps make no sound. The silence is absolute and hungry.',
      'Something passes through you — cold, vast, and utterly indifferent.',
      'The runes on the floor spell words in no language, and yet you understand them: DO NOT STAY.',
      'A figure stands at the far end of the passage. When you blink, it has not moved — but it is closer.',
    ]
  },
};
