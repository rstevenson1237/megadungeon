// src/data/dungeonTowns.js
// Dungeon towns appear at the end of each difficulty band (every 10 levels).
// They are pure menu states — no TileMap is generated for these levels.

export const DUNGEON_TOWN_LEVELS = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90]);

export function isDungeonTownLevel(n) {
  return DUNGEON_TOWN_LEVELS.has(n);
}

function scaleTemple(baseCosts, factor) {
  return {
    cure_disease: Math.ceil(baseCosts.cure_disease * factor),
    remove_curse: Math.ceil(baseCosts.remove_curse * factor),
    raise_dead:   (lvl) => Math.ceil(lvl * 500 * factor),
    identify:     Math.ceil(baseCosts.identify * factor),
    atonement:    Math.ceil(baseCosts.atonement * factor),
  };
}

const BASE_TEMPLE_COSTS = { cure_disease: 100, remove_curse: 300, identify: 50, atonement: 1000 };

function dungeonRumors(depth) {
  return (worldState) => {
    const deepest = worldState?.deepestLevel ?? depth;
    return [
      `The lift operator says someone paid triple just to skip level ${depth + 5}. Didn't say why.`,
      `Strange lights on level ${depth - 3}. Nobody's gone back to look.`,
      `I heard the stones around level ${depth + 2} bleed. Probably just rust water.`,
      `A courier from deeper down said the monsters at ${depth + 8} hunt in packs now.`,
      `They keep the good supplies here. Below ${depth} you're on your own.`,
      `The last group that went past level ${Math.min(deepest + 1, depth + 15)} never came back up.`,
      `Deeper towns are real. I know somebody who visited level ${depth + 10}. Wouldn't talk about it.`,
      `The walls change past level ${depth + 4}. Not in the stone — in something else.`,
      `Best rest you'll get until level ${depth + 10}. Spend the gold, save the life.`,
      `You look like you've seen things. The dark does that. Drink something.`,
    ];
  };
}

export const DUNGEON_TOWNS = {
  10: {
    key:       'crossroads_refuge',
    name:      'The Crossroads Refuge',
    depth:     10,
    theme:     'dungeon_cellar',
    color:     '#ccaa44',
    ambience:  'A torchlit alcove hacked into solid rock. Pitch and sawdust on the floor.',
    asciiArt: [
      '  ,-----------------------------------------,  ',
      '  |  [===]  WAYFARERS POST  |  SUPPLY CACHE  |  ',
      '  |   INN   bed & rumors   |   goods & gear  |  ',
      '  |-----------------------------------------|  ',
      '  |       rough-cut stone passage            |  ',
      '  `-----------------------------------------\'  ',
    ],
    inn: {
      key:      'inn',
      name:     "Wayfarers' Post",
      restCost: (lvl) => Math.ceil(lvl * 6),
      rumors:   dungeonRumors(10),
    },
    shops: [
      {
        key:        'general_store',
        name:       "Scavenger's Cache",
        stock:      ['torch', 'ration', 'rope', 'arrows_20', 'antidote', 'mead_skin', 'iron_key', 'dwarven_bread', 'thieves_tools'],
        buyMarkup:  1.6,
        sellMarkup: 0.25,
      },
    ],
    lifts: [],
  },

  20: {
    key:       'pilgrims_rest',
    name:      "The Pilgrim's Rest",
    depth:     20,
    theme:     'catacomb',
    color:     '#cccc88',
    ambience:  'Bone-niched walls. Candle wax everywhere. The smell of incense and old stone.',
    asciiArt: [
      '  ,--------------------------------------------,  ',
      '  |  [~]  THE HOLLOW INN  |  [+] BONE SHRINE   |  ',
      '  |  rest amid the dead   |  cure & remove curse|  ',
      '  |  [S] BONE MARKET WARES                      |  ',
      '  |       general goods & sundries               |  ',
      '  `--------------------------------------------\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Hollow Inn',
      restCost: (lvl) => Math.ceil(lvl * 7),
      rumors:   dungeonRumors(20),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Bone Market Wares',
        stock:      ['torch', 'ration', 'rope', 'arrows_20', 'antidote', 'mead_skin', 'iron_key', 'dwarven_bread', 'thieves_tools', 'healing_potion', 'bone_holy_symbol', 'soul_candle'],
        buyMarkup:  1.6,
        sellMarkup: 0.25,
      },
      {
        key:      'temple',
        name:     'Bone Shrine',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 1.5),
      },
    ],
    lifts: [],
  },

  30: {
    key:       'bone_market',
    name:      'The Bone Market',
    depth:     30,
    theme:     'catacomb',
    color:     '#cc88cc',
    ambience:  'A crossroads of carved catacombs. Bone traders, grave robbers, and survivors.',
    asciiArt: [
      '  ,----------------------------------------------,  ',
      '  | [~] RESTING SLAB | [+] TEMPLE OF PITY        |  ',
      '  |  sleep with dead |   full restoration         |  ',
      '  | [S] TRADE STALLS | [!] EDGE & STEEL           |  ',
      '  |  general goods   |   buy and sell arms        |  ',
      '  `----------------------------------------------\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Resting Slab',
      restCost: (lvl) => Math.ceil(lvl * 8),
      rumors:   dungeonRumors(30),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Trade Stalls',
        stock:      ['torch', 'ration', 'rope', 'arrows_20', 'antidote', 'mead_skin', 'iron_key', 'dwarven_bread', 'thieves_tools', 'healing_potion', 'bone_holy_symbol', 'soul_candle', 'embalming_kit', 'grave_dust'],
        buyMarkup:  1.6,
        sellMarkup: 0.3,
      },
      {
        key:      'temple',
        name:     'Temple of Pity',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 2.0),
      },
      {
        key:        'weapon_smith',
        name:       'Edge & Steel',
        stock:      ['dagger', 'short_sword', 'long_sword', 'mace', 'staff', 'short_bow', 'leather_armor', 'chain_mail', 'shield', 'iron_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.35,
        enchantCost: (item, level) => item.value * (level * 8),
      },
    ],
    lifts: [],
  },

  40: {
    key:       'underhold_station',
    name:      'Underhold Station',
    depth:     40,
    theme:     'dwarven_deep',
    color:     '#cc8844',
    ambience:  'Cut stone and forgelight. The clang of hammers echoes from deep shafts.',
    asciiArt: [
      '  ,================================================,  ',
      '  |[~]BEDROCK TAP | [!]FORGEMASTER | [+]DEEP TEMPLE|  ',
      '  | rest & hire   |  full smithing  |  all services |  ',
      '  |[S]DWARVEN KIT |  [*]ARCANE CACHE| [L]LIFT SHAFT |  ',
      '  | outfitters    |  scrolls+potions| to level 30   |  ',
      '  `================================================\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Bedrock Taproom',
      restCost: (lvl) => Math.ceil(lvl * 9),
      rumors:   dungeonRumors(40),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Dwarven Outfitters',
        stock:      ['torch', 'ration', 'rope', 'arrows_20', 'antidote', 'dwarven_bread', 'dwarven_ale', 'iron_key', 'runic_chisel', 'lodestone', 'healing_potion', 'thieves_tools', 'holy_symbol'],
        buyMarkup:  1.6,
        sellMarkup: 0.3,
      },
      {
        key:        'weapon_smith',
        name:       'Forgemaster Bruk',
        stock:      ['long_sword', 'war_axe', 'forge_hammer', 'battle_axe', 'great_sword', 'short_bow', 'hand_crossbow', 'chain_mail', 'plate_mail', 'half_plate', 'shield', 'great_helm', 'iron_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.4,
        enchantCost: (item, level) => item.value * (level * 10),
      },
      {
        key:      'temple',
        name:     'Temple of the Deep',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 3.0),
      },
      {
        key:        'general_store',
        name:       'Arcane Cache',
        stock:      ['healing_potion', 'potion_of_speed', 'antidote', 'potion_of_fire_resist', 'scroll_magic_missile', 'scroll_of_sleep', 'scroll_of_fireball', 'scroll_of_detect_traps', 'wand_of_magic_missile', 'wand_of_healing'],
        buyMarkup:  2.0,
        sellMarkup: 0.4,
      },
    ],
    lifts: [
      { target: 30, direction: 'up',   cost: 250 },
      { target: 50, direction: 'down', cost: 250 },
    ],
  },

  50: {
    key:       'forge_hall',
    name:      'Forge Hall',
    depth:     50,
    theme:     'dwarven_deep',
    color:     '#cc6622',
    ambience:  'Vast stone vaults lit by forge-fires. The air smells of coal, hot metal, and deep ale.',
    asciiArt: [
      '  ,=================================================,  ',
      '  | [~] SLAG & SUDS  | [!] MASTER SMITH TORVEN     |  ',
      '  |  rest & hire     |  rare weapons + enchanting   |  ',
      '  | [S] DEEP SUPPLY  | [*] MYSTICAL ORES            |  ',
      '  |  provisions      |  arcane stock                |  ',
      '  | [+] SANCTUM OF STONE   | [L] LIFT: 40 / 60      |  ',
      '  `=================================================\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Slag & Suds',
      restCost: (lvl) => Math.ceil(lvl * 10),
      rumors:   dungeonRumors(50),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Deep Provisions',
        stock:      ['torch', 'ration', 'rope', 'arrows_20', 'dwarven_bread', 'dwarven_ale', 'healing_potion', 'antidote', 'potion_of_fire_resist', 'iron_key', 'runic_chisel', 'lodestone', 'elemental_shard', 'holy_symbol'],
        buyMarkup:  1.6,
        sellMarkup: 0.3,
      },
      {
        key:        'weapon_smith',
        name:       'Master Smith Torven',
        stock:      ['long_sword', 'war_axe', 'forge_hammer', 'battle_axe', 'great_sword', 'short_bow', 'hand_crossbow', 'plate_mail', 'half_plate', 'chain_mail', 'shield', 'great_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.4,
        enchantCost: (item, level) => item.value * (level * 10),
      },
      {
        key:      'temple',
        name:     'Sanctum of Stone',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 4.0),
      },
      {
        key:        'general_store',
        name:       'Mystical Ores',
        stock:      ['healing_potion', 'potion_of_speed', 'potion_of_strength', 'antidote', 'potion_of_fire_resist', 'scroll_magic_missile', 'scroll_of_fireball', 'scroll_of_sleep', 'scroll_of_turning', 'wand_of_magic_missile', 'wand_of_healing', 'wand_of_frost'],
        buyMarkup:  2.0,
        sellMarkup: 0.4,
      },
    ],
    lifts: [
      { target: 40, direction: 'up',   cost: 250 },
      { target: 60, direction: 'down', cost: 250 },
    ],
  },

  60: {
    key:       'ember_bazaar',
    name:      'The Ember Bazaar',
    depth:     60,
    theme:     'elemental_grotto',
    color:     '#ff6622',
    ambience:  'Heat haze and crackling static. Elemental traders work amid crystal formations.',
    asciiArt: [
      '  ,~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~,  ',
      '  | [~] HOT SPRINGS INN | [!] EMBER ARMS          |  ',
      '  |  rest & hire        |  enchanted weapons       |  ',
      '  | [S] ELEMENTAL TRADE | [*] ARCANE CONVERGENCE   |  ',
      '  |  exotic supplies    |  elemental scrolls+wands |  ',
      '  | [+] ELEMENTAL TEMPLE| [L] LIFT: 50 / 70        |  ',
      '  `~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'Hot Springs Inn',
      restCost: (lvl) => Math.ceil(lvl * 11),
      rumors:   dungeonRumors(60),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Elemental Traders',
        stock:      ['ration', 'rope', 'healing_potion', 'antidote', 'potion_of_fire_resist', 'potion_of_speed', 'mana_crystal', 'elemental_shard', 'elemental_essence', 'prismatic_flask', 'iron_key'],
        buyMarkup:  1.7,
        sellMarkup: 0.3,
      },
      {
        key:        'weapon_smith',
        name:       'Ember Arms',
        stock:      ['long_sword', 'battle_axe', 'great_sword', 'war_axe', 'hand_crossbow', 'plate_mail', 'half_plate', 'chain_mail', 'shield', 'great_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.4,
        enchantCost: (item, level) => item.value * (level * 12),
      },
      {
        key:      'temple',
        name:     'Temple of the Elements',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 5.0),
      },
      {
        key:        'general_store',
        name:       'Arcane Convergence',
        stock:      ['healing_potion', 'potion_of_speed', 'potion_of_strength', 'potion_of_invisibility', 'potion_of_fire_resist', 'scroll_of_fireball', 'scroll_of_sleep', 'scroll_of_turning', 'storm_rune', 'wand_of_magic_missile', 'wand_of_frost', 'wand_of_lightning', 'wand_of_healing'],
        buyMarkup:  2.0,
        sellMarkup: 0.4,
      },
    ],
    lifts: [
      { target: 50, direction: 'up',   cost: 250 },
      { target: 70, direction: 'down', cost: 250 },
    ],
  },

  70: {
    key:       'rift_crossing',
    name:      'The Rift Crossing',
    depth:     70,
    theme:     'elemental_grotto',
    color:     '#aa44cc',
    ambience:  'Reality bends here. Dimensional rifts pulse in the walls. Travellers pass through quickly.',
    asciiArt: [
      '  ,*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*,  ',
      '  | [~] VOIDS EDGE INN  | [!] PHASE-IRON ARMS    |  ',
      '  |   rest & hire       |  planar weapons         |  ',
      '  | [S] PLANAR EXPORTS  | [*] PORTAL SHOP         |  ',
      '  |  exotic supplies    |  high-level arcane      |  ',
      '  | [+] SANCTUARY       | [L] LIFT: 60 / 80       |  ',
      '  `*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*\'  ',
    ],
    inn: {
      key:      'inn',
      name:     "The Void's Edge Inn",
      restCost: (lvl) => Math.ceil(lvl * 12),
      rumors:   dungeonRumors(70),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Planar Exports',
        stock:      ['ration', 'rope', 'healing_potion', 'antidote', 'potion_of_speed', 'potion_of_invisibility', 'potion_of_fire_resist', 'elemental_essence', 'mana_crystal', 'shadow_essence', 'planar_compass', 'dimensional_key'],
        buyMarkup:  1.7,
        sellMarkup: 0.3,
      },
      {
        key:        'weapon_smith',
        name:       'Phase-Iron Arms',
        stock:      ['long_sword', 'battle_axe', 'great_sword', 'phase_blade', 'hand_crossbow', 'plate_mail', 'half_plate', 'shield', 'great_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.45,
        enchantCost: (item, level) => item.value * (level * 12),
      },
      {
        key:      'temple',
        name:     'Dimensional Sanctuary',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 6.0),
      },
      {
        key:        'general_store',
        name:       'Portal Shop',
        stock:      ['healing_potion', 'potion_of_speed', 'potion_of_strength', 'potion_of_invisibility', 'potion_of_fire_resist', 'scroll_of_fireball', 'storm_rune', 'scroll_of_teleport', 'rift_scroll', 'wand_of_magic_missile', 'wand_of_frost', 'wand_of_lightning', 'wand_of_fear', 'wand_of_healing'],
        buyMarkup:  2.0,
        sellMarkup: 0.4,
      },
    ],
    lifts: [
      { target: 60, direction: 'up',   cost: 250 },
      { target: 80, direction: 'down', cost: 250 },
    ],
  },

  80: {
    key:       'shadowport',
    name:      'The Shadowport',
    depth:     80,
    theme:     'void_passage',
    color:     '#8844cc',
    ambience:  'Darkness that light seems to avoid. Shadow-traders move in whispers.',
    asciiArt: [
      '  ,::::::::::::::::::::::::::::::::::::::::::::::,  ',
      '  | [~] THE NULL REST   | [!] VOID-FORGED ARMS   |  ',
      '  |   rest & hire       |  legendary weapons      |  ',
      '  | [S] SHADOW MARKET   | [*] RIFT MAGE EMPORIUM  |  ',
      '  |  void supplies      |  artifact scrolls+wands |  ',
      '  | [+] SHADOW SHRINE   | [L] LIFT: 70 / 90       |  ',
      '  `::::::::::::::::::::::::::::::::::::::::::::::\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Null Rest',
      restCost: (lvl) => Math.ceil(lvl * 13),
      rumors:   dungeonRumors(80),
    },
    shops: [
      {
        key:        'general_store',
        name:       'Shadow Market',
        stock:      ['ration', 'rope', 'healing_potion', 'antidote', 'potion_of_speed', 'potion_of_invisibility', 'potion_of_fire_resist', 'shadow_essence', 'null_stone', 'soul_candle', 'dimensional_key', 'planar_compass'],
        buyMarkup:  1.8,
        sellMarkup: 0.35,
      },
      {
        key:        'weapon_smith',
        name:       'Void-Forged Arms',
        stock:      ['long_sword', 'battle_axe', 'great_sword', 'phase_blade', 'hand_crossbow', 'plate_mail', 'half_plate', 'shield', 'great_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.45,
        enchantCost: (item, level) => item.value * (level * 15),
      },
      {
        key:      'temple',
        name:     'Shadow Shrine',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 7.0),
      },
      {
        key:        'general_store',
        name:       "Rift Mage's Emporium",
        stock:      ['healing_potion', 'potion_of_speed', 'potion_of_strength', 'potion_of_invisibility', 'potion_of_fire_resist', 'scroll_of_fireball', 'storm_rune', 'scroll_of_teleport', 'rift_scroll', 'wand_of_magic_missile', 'wand_of_frost', 'wand_of_lightning', 'wand_of_fear', 'wand_of_healing'],
        buyMarkup:  2.0,
        sellMarkup: 0.45,
      },
    ],
    lifts: [
      { target: 70, direction: 'up',   cost: 250 },
      { target: 90, direction: 'down', cost: 250 },
    ],
  },

  90: {
    key:       'last_threshold',
    name:      'The Last Threshold',
    depth:     90,
    theme:     'void_passage',
    color:     '#cc44cc',
    ambience:  'The final sanctuary before the abyss. Everything here costs a fortune. Nothing is guaranteed.',
    asciiArt: [
      '  ,########################################################,  ',
      '  | [~] THE FINAL REFUGE | [!] ARMS MASTER (legendary)     |  ',
      '  |   rest & hire        |  best weapons + max enchanting   |  ',
      '  | [S] THE LAST SUPPLY  | [*] THE VOID ARCHIVE             |  ',
      '  |  all supplies        |  highest arcane stock            |  ',
      '  | [+] PANTHEON SHRINE  | [L] LIFT: 80 (no route deeper)   |  ',
      '  `########################################################\'  ',
    ],
    inn: {
      key:      'inn',
      name:     'The Final Refuge',
      restCost: (lvl) => Math.ceil(lvl * 14),
      rumors:   dungeonRumors(90),
    },
    shops: [
      {
        key:        'general_store',
        name:       'The Last Supply',
        stock:      ['ration', 'rope', 'healing_potion', 'antidote', 'potion_of_speed', 'potion_of_strength', 'potion_of_invisibility', 'potion_of_fire_resist', 'shadow_essence', 'null_stone', 'soul_candle', 'dimensional_key', 'planar_compass', 'mana_crystal'],
        buyMarkup:  1.8,
        sellMarkup: 0.35,
      },
      {
        key:        'weapon_smith',
        name:       'Arms Master',
        stock:      ['long_sword', 'battle_axe', 'great_sword', 'phase_blade', 'hand_crossbow', 'plate_mail', 'half_plate', 'shield', 'great_helm'],
        buyMarkup:  1.5,
        sellMarkup: 0.5,
        enchantCost: (item, level) => item.value * (level * 15),
      },
      {
        key:      'temple',
        name:     'Pantheon Shrine',
        costs:    scaleTemple(BASE_TEMPLE_COSTS, 8.0),
      },
      {
        key:        'general_store',
        name:       'The Void Archive',
        stock:      ['healing_potion', 'potion_of_speed', 'potion_of_strength', 'potion_of_invisibility', 'potion_of_fire_resist', 'scroll_of_fireball', 'storm_rune', 'scroll_of_teleport', 'rift_scroll', 'wand_of_magic_missile', 'wand_of_frost', 'wand_of_lightning', 'wand_of_fear', 'wand_of_healing'],
        buyMarkup:  2.0,
        sellMarkup: 0.5,
      },
    ],
    lifts: [
      { target: 80, direction: 'up', cost: 250 },
      // No downward lift — level 100 is the final descent
    ],
  },
};
