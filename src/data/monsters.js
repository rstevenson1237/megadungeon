/**
 * @typedef {Object} MonsterDef
 * @property {string}   key
 * @property {string}   name
 * @property {string}   plural
 * @property {number}   glyph         CP437 char code
 * @property {string}   color
 * @property {number}   hd            Hit dice
 * @property {string}   hdType        'd4'|'d6'|'d8'|'d10'|'d12'
 * @property {number}   ac
 * @property {number}   speed         Tiles per turn (player = 1)
 * @property {Object[]} attacks       [ { name, numDice, die, dmgBonus, special } ]
 * @property {string[]} specials      Special abilities: 'paralyze','drain_level','poison',...
 * @property {number}   morale        2–12; below this, monster flees
 * @property {string}   alignment     'lawful'|'neutral'|'chaotic'
 * @property {string}   size          'tiny'|'small'|'medium'|'large'|'huge'|'gargantuan'
 * @property {string[]} tags          'undead','demon','beast','humanoid','construct',...
 * @property {number}   xpBase        Base XP reward
 * @property {number}   xpPerHD       Additional XP per HD
 * @property {Object}   loot          Treasure table reference or inline table
 * @property {string[]} habitat       Which themes it spawns in
 * @property {string}   description   Flavor text
 * @property {Object}   ai            { type: 'aggressive'|'cautious'|'pack'|'territorial'|'coward' }
 */

export const MONSTERS = {

  giant_rat: {
    key: 'giant_rat', name: 'Giant Rat', plural: 'Giant Rats',
    glyph: 0x72, color: '#885533', // 'r'
    hd: 1, hdType: 'd4', ac: 12, speed: 1.5,
    attacks: [{ name: 'bite', numDice: 1, die: 3, dmgBonus: 0, special: 'disease_5' }],
    specials: ['disease'],
    morale: 5, alignment: 'neutral', size: 'small',
    tags: ['beast', 'vermin'],
    xpBase: 5, xpPerHD: 5,
    loot: { table: 'T1_none', chance: 0.05 },
    habitat: ['dungeon_cellar', 'goblin_warren', 'catacomb'],
    description: 'Knee-high rats with yellow teeth and matted fur. Individually contemptible; in packs, lethal.',
    ai: { type: 'pack', packRadius: 6, fleeThreshold: 0.3 },
  },

  giant_spider: {
    key: 'giant_spider', name: 'Giant Spider', plural: 'Giant Spiders',
    glyph: 0x53, color: '#884488', // 'S'
    hd: 2, hdType: 'd8', ac: 14, speed: 1.2,
    attacks: [{ name: 'bite', numDice: 1, die: 8, dmgBonus: 0, special: 'poison_4' }],
    specials: ['poison', 'web'],
    morale: 7, alignment: 'neutral', size: 'medium',
    tags: ['beast', 'vermin'],
    xpBase: 35, xpPerHD: 10,
    loot: { table: 'T2_beast', chance: 0.35 },
    habitat: ['dungeon_cellar', 'catacomb'],
    description: 'A multi-legged horror that weaves sticky traps for the unwary.',
    ai: { type: 'territorial' },
  },

  warg: {
    key: 'warg', name: 'Warg', plural: 'Wargs',
    glyph: 0x77, color: '#666666', // 'w'
    hd: 3, hdType: 'd8', ac: 14, speed: 1.8,
    attacks: [{ name: 'bite', numDice: 2, die: 4, dmgBonus: 1, special: 'trip' }],
    specials: ['trip'],
    morale: 8, alignment: 'neutral', size: 'large',
    tags: ['beast'],
    xpBase: 50, xpPerHD: 12,
    loot: { table: 'T2_beast', chance: 0.30 },
    habitat: ['goblin_warren'],
    description: 'An oversized, intelligent wolf often used as a mount by goblinoids.',
    ai: { type: 'pack', packRadius: 8 },
  },

  goblin: {
    key: 'goblin', name: 'Goblin', plural: 'Goblins',
    glyph: 0x67, color: '#44aa44', // 'g'
    hd: 1, hdType: 'd6', ac: 13, speed: 1,
    attacks: [{ name: 'crude weapon', numDice: 1, die: 6, dmgBonus: -1, special: null }],
    specials: ['light_sensitivity'], // -2 to attack in bright light
    morale: 6, alignment: 'chaotic', size: 'small',
    tags: ['humanoid', 'goblinoid'],
    xpBase: 10, xpPerHD: 5,
    loot: { table: 'T3_goblinoid', chance: 0.60 },
    habitat: ['goblin_warren', 'dungeon_cellar'],
    description: 'Green-skinned cowards who cluster in warrens, brave only in numbers.',
    ai: { type: 'pack', packRadius: 8, alertsAlliesOnSight: true, fleeThreshold: 0.25 },
  },

  skeleton: {
    key: 'skeleton', name: 'Skeleton', plural: 'Skeletons',
    glyph: 0x73, color: '#cccccc', // 's'
    hd: 1, hdType: 'd8', ac: 13, speed: 1,
    attacks: [{ name: 'clawed hands', numDice: 1, die: 6, dmgBonus: 0, special: null }],
    specials: ['immune_sleep', 'immune_charm', 'half_damage_piercing'],
    morale: 12, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 10, xpPerHD: 3,
    loot: { table: 'T7_undead_mindless', chance: 0.25 },
    habitat: ['catacomb', 'dungeon_cellar'],
    description: 'Animated bones that fight without fear and feel no pain. Turn them if you can.',
    ai: { type: 'aggressive', turnable: true },
  },

  wight: {
    key: 'wight', name: 'Wight', plural: 'Wights',
    glyph: 0x57, color: '#445566', // 'W'
    hd: 3, hdType: 'd8', ac: 14, speed: 1,
    attacks: [{ name: 'draining touch', numDice: 1, die: 4, dmgBonus: 0, special: 'energy_drain_1' }],
    specials: ['energy_drain', 'immune_sleep', 'immune_charm', 'immune_cold', 'immune_nonmagic_weapons'],
    morale: 10, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 65, xpPerHD: 15,
    loot: { table: 'T9_undead_noble', chance: 0.75 },
    habitat: ['catacomb', 'underhall'],
    description: 'Drained of life, they crave to return the favor. Each touch steals a fragment of your vitality — permanently.',
    ai: { type: 'territorial', turnable: true, seekLifeforce: true },
  },

  dragon_young_red: {
    key: 'dragon_young_red', name: 'Young Red Dragon', plural: 'Young Red Dragons',
    glyph: 0x44, color: '#ff2200', // 'D'
    hd: 9, hdType: 'd12', ac: 17, speed: 1,
    attacks: [
      { name: 'bite',  numDice: 2, die: 8,  dmgBonus: 4, special: null },
      { name: 'claw',  numDice: 1, die: 8,  dmgBonus: 2, special: null },
      { name: 'claw',  numDice: 1, die: 8,  dmgBonus: 2, special: null },
    ],
    specials: ['breath_fire_9d6', 'immune_fire', 'frightful_presence', 'fly'],
    morale: 11, alignment: 'chaotic', size: 'large',
    tags: ['dragon', 'fire'],
    xpBase: 2000, xpPerHD: 200,
    loot: { table: 'H3_apex', chance: 1.00 },
    habitat: ['elemental_grotto', 'demon_warren', 'primordial_chaos'],
    description: 'Fire given scale and will. Even young, a red dragon is among the most dangerous things in the underworld.',
    ai: { type: 'aggressive', usesBreathWeapon: true, breathCooldown: 3, hasBossPhases: false },
  },

  orc: {
    key: 'orc', name: 'Orc', plural: 'Orcs',
    glyph: 0x6F, color: '#668866', // 'o'
    hd: 2, hdType: 'd8', ac: 14, speed: 1,
    attacks: [{ name: 'notched axe', numDice: 1, die: 8, dmgBonus: 1, special: null }],
    specials: [],
    morale: 8, alignment: 'chaotic', size: 'medium',
    tags: ['humanoid', 'orcish'],
    xpBase: 20, xpPerHD: 10,
    loot: { table: 'T4_warrior', chance: 0.55 },
    habitat: ['dungeon_cellar', 'goblin_warren', 'abandoned_mine'],
    description: 'Brutish and cruel, these hulking humanoids live for battle and plunder. Their green-grey skin is thick and tough.',
    ai: { type: 'aggressive', packRadius: 5 },
  },

  hobgoblin: {
    key: 'hobgoblin', name: 'Hobgoblin', plural: 'Hobgoblins',
    glyph: 0x68, color: '#aa4444', // 'h'
    hd: 2, hdType: 'd8', ac: 15, speed: 1,
    attacks: [{ name: 'longsword', numDice: 1, die: 8, dmgBonus: 1, special: null }],
    specials: ['martial_advantage'],
    morale: 9, alignment: 'lawful', size: 'medium',
    tags: ['humanoid'],
    xpBase: 25, xpPerHD: 10,
    loot: { table: 'T4_warrior', chance: 0.50 },
    habitat: ['goblin_warren'],
    description: 'Larger and more disciplined than goblins, hobgoblins are born for war.',
    ai: { type: 'aggressive', packRadius: 6 },
  },

  zombie: {
    key: 'zombie', name: 'Zombie', plural: 'Zombies',
    glyph: 0x7A, color: '#4a694a', // 'z'
    hd: 2, hdType: 'd8', ac: 11, speed: 0.5,
    attacks: [{ name: 'slam', numDice: 1, die: 6, dmgBonus: 0, special: 'disease_10' }],
    specials: ['immune_sleep', 'immune_charm'],
    morale: 12, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 25, xpPerHD: 5,
    loot: { table: 'T7_undead_mindless', chance: 0.10 },
    habitat: ['catacomb', 'dungeon_cellar'],
    description: 'A shambling corpse animated by foul necromancy. It moves with unnatural slowness and single-minded purpose.',
    ai: { type: 'aggressive', turnable: true },
  },

  ghoul: {
    key: 'ghoul', name: 'Ghoul', plural: 'Ghouls',
    glyph: 0x7A, color: '#aaeeaa', // 'z' (using 'z' color variant)
    hd: 2, hdType: 'd8', ac: 13, speed: 1.2,
    attacks: [
      { name: 'bite', numDice: 1, die: 6, dmgBonus: 0, special: 'paralyze_4' },
      { name: 'claws', numDice: 1, die: 4, dmgBonus: 0, special: 'paralyze_4' }
    ],
    specials: ['paralyze', 'immune_sleep', 'immune_charm'],
    morale: 9, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 45, xpPerHD: 10,
    loot: { table: 'T8_undead_aware',    chance: 0.55 },
    habitat: ['catacomb'],
    description: 'A flesh-eating undead that can paralyze victims with its touch.',
    ai: { type: 'aggressive', turnable: true },
  },

  wraith: {
    key: 'wraith', name: 'Wraith', plural: 'Wraiths',
    glyph: 0x57, color: '#666688', // 'W' variant
    hd: 4, hdType: 'd8', ac: 15, speed: 1.5,
    attacks: [{ name: 'life drain', numDice: 1, die: 8, dmgBonus: 0, special: 'energy_drain_1' }],
    specials: ['energy_drain', 'incorporeal', 'immune_sleep', 'immune_charm', 'immune_nonmagic_weapons'],
    morale: 11, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 120, xpPerHD: 20,
    loot: { table: 'T8_undead_aware',    chance: 0.65 },
    habitat: ['catacomb'],
    description: 'A malevolent spirit that hungers for the life force of the living.',
    ai: { type: 'aggressive', turnable: true },
  },

  vampire_spawn: {
    key: 'vampire_spawn', name: 'Vampire Spawn', plural: 'Vampire Spawns',
    glyph: 0x56, color: '#ff4444', // 'V'
    hd: 4, hdType: 'd12', ac: 15, speed: 1.3,
    attacks: [{ name: 'bite', numDice: 1, die: 6, dmgBonus: 2, special: 'blood_drain' }],
    specials: ['blood_drain', 'regeneration', 'immune_sleep', 'immune_charm'],
    morale: 10, alignment: 'chaotic', size: 'medium',
    tags: ['undead'],
    xpBase: 150, xpPerHD: 25,
    loot: { table: 'T9_undead_noble',    chance: 0.85 },
    habitat: ['catacomb'],
    description: 'A subservient vampire, still possessing deadly speed and hunger.',
    ai: { type: 'aggressive', turnable: true },
  },

  goblin_shaman: {
    key: 'goblin_shaman', name: 'Goblin Shaman', plural: 'Goblin Shamans',
    glyph: 0x67, color: '#88ee88', // 'g'
    hd: 2, hdType: 'd6', ac: 12, speed: 1,
    attacks: [{ name: 'ritual dagger', numDice: 1, die: 4, dmgBonus: 0, special: null }],
    specials: ['light_sensitivity', 'cast_curse', 'cast_heal_self'],
    morale: 7, alignment: 'chaotic', size: 'small',
    tags: ['humanoid', 'goblinoid', 'magic_user'],
    xpBase: 35, xpPerHD: 8,
    loot: { table: 'T5_arcane', chance: 0.80 },
    habitat: ['goblin_warren'],
    description: 'Wiser and more cunning than their kin, these goblins wield crude but effective magic, often involving dung and bones.',
    ai: { type: 'cautious', fleeThreshold: 0.4, castChance: 0.5 },
  },

  // +80 more monsters across all depth bands
  // boss_variants for each major monster type
  // unique named monsters (procedurally named with title system)
};
