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
    loot: { table: 'vermin', chance: 0.1 },
    habitat: ['dungeon_cellar', 'goblin_warren', 'catacomb'],
    description: 'Knee-high rats with yellow teeth and matted fur. Individually contemptible; in packs, lethal.',
    ai: { type: 'pack', packRadius: 6, fleeThreshold: 0.3 },
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
    loot: { table: 'humanoid_poor', chance: 0.6 },
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
    loot: { table: 'undead_common', chance: 0.3 },
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
    loot: { table: 'undead_ancient', chance: 0.7 },
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
    loot: { table: 'dragon_hoard', chance: 1.0 },
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
    loot: { table: 'humanoid_standard', chance: 0.5 },
    habitat: ['dungeon_cellar', 'goblin_warren', 'abandoned_mine'],
    description: 'Brutish and cruel, these hulking humanoids live for battle and plunder. Their green-grey skin is thick and tough.',
    ai: { type: 'aggressive', packRadius: 5 },
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
    loot: { table: 'undead_common', chance: 0.1 },
    habitat: ['catacomb', 'dungeon_cellar'],
    description: 'A shambling corpse animated by foul necromancy. It moves with unnatural slowness and single-minded purpose.',
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
    loot: { table: 'humanoid_shamanistic', chance: 0.8 },
    habitat: ['goblin_warren'],
    description: 'Wiser and more cunning than their kin, these goblins wield crude but effective magic, often involving dung and bones.',
    ai: { type: 'cautious', fleeThreshold: 0.4, castChance: 0.5 },
  },

  // --- DWARVEN DEEP ---

  duergar: {
    key: 'duergar', name: 'Duergar', plural: 'Duergar',
    glyph: 0x64, color: '#886655', // 'd'
    hd: 2, hdType: 'd8', ac: 14, speed: 1,
    attacks: [{ name: 'war pick', numDice: 1, die: 8, dmgBonus: 1, special: null }],
    specials: ['immune_paralysis', 'immune_illusion', 'enlarge_self'],
    morale: 9, alignment: 'chaotic', size: 'medium',
    tags: ['humanoid', 'dwarven'],
    xpBase: 35, xpPerHD: 10,
    loot: { table: 'humanoid_standard', chance: 0.6 },
    habitat: ['dwarven_deep'],
    description: 'Grey-skinned dwarves twisted by millennia of deep enslavement to dark powers. Hateful of all surface kin.',
    ai: { type: 'aggressive', packRadius: 6 },
  },

  dark_dwarf_warrior: {
    key: 'dark_dwarf_warrior', name: 'Dark Dwarf Warrior', plural: 'Dark Dwarf Warriors',
    glyph: 0x44, color: '#776644', // 'D'
    hd: 3, hdType: 'd8', ac: 16, speed: 1,
    attacks: [
      { name: 'battle axe', numDice: 1, die: 10, dmgBonus: 2, special: null },
      { name: 'shield bash', numDice: 1, die: 4,  dmgBonus: 1, special: 'knockback' },
    ],
    specials: ['immune_paralysis', 'immune_illusion', 'battle_fury'],
    morale: 10, alignment: 'chaotic', size: 'medium',
    tags: ['humanoid', 'dwarven'],
    xpBase: 55, xpPerHD: 12,
    loot: { table: 'humanoid_warrior', chance: 0.7 },
    habitat: ['dwarven_deep'],
    description: 'Veteran soldiers clad in black-iron plate, these dwarves guard the deep halls with grim ferocity.',
    ai: { type: 'territorial', packRadius: 4 },
  },

  cave_troll: {
    key: 'cave_troll', name: 'Cave Troll', plural: 'Cave Trolls',
    glyph: 0x54, color: '#558855', // 'T'
    hd: 6, hdType: 'd8', ac: 14, speed: 1,
    attacks: [
      { name: 'claw', numDice: 1, die: 8, dmgBonus: 3, special: null },
      { name: 'claw', numDice: 1, die: 8, dmgBonus: 3, special: null },
    ],
    specials: ['regenerate_2', 'vulnerability_fire', 'vulnerability_acid'],
    morale: 9, alignment: 'chaotic', size: 'large',
    tags: ['beast', 'giant'],
    xpBase: 350, xpPerHD: 40,
    loot: { table: 'beast_large', chance: 0.3 },
    habitat: ['dwarven_deep'],
    description: 'Massive cave-dwelling trolls that regenerate from nearly any wound. Fire and acid are your friends here.',
    ai: { type: 'aggressive', fleeThreshold: 0.1 },
  },

  stone_golem: {
    key: 'stone_golem', name: 'Stone Golem', plural: 'Stone Golems',
    glyph: 0x47, color: '#888888', // 'G'
    hd: 8, hdType: 'd10', ac: 16, speed: 0.75,
    attacks: [{ name: 'stone fist', numDice: 2, die: 8, dmgBonus: 4, special: 'slow_on_hit' }],
    specials: ['immune_magic', 'immune_nonmagic_weapons', 'immune_sleep', 'immune_charm', 'immune_cold', 'immune_fire', 'immune_lightning'],
    morale: 12, alignment: 'neutral', size: 'large',
    tags: ['construct'],
    xpBase: 800, xpPerHD: 80,
    loot: { table: 'construct', chance: 0.2 },
    habitat: ['dwarven_deep'],
    description: 'An ancient dwarven guardian, still faithfully patrolling halls its makers abandoned centuries ago.',
    ai: { type: 'territorial', alertRadius: 8 },
  },

  iron_defender: {
    key: 'iron_defender', name: 'Iron Defender', plural: 'Iron Defenders',
    glyph: 0x49, color: '#999999', // 'I'
    hd: 4, hdType: 'd10', ac: 17, speed: 1,
    attacks: [{ name: 'iron jaw', numDice: 1, die: 8, dmgBonus: 3, special: null }],
    specials: ['immune_sleep', 'immune_charm', 'immune_poison', 'darkvision'],
    morale: 12, alignment: 'neutral', size: 'medium',
    tags: ['construct'],
    xpBase: 180, xpPerHD: 25,
    loot: { table: 'construct', chance: 0.3 },
    habitat: ['dwarven_deep'],
    description: 'A mechanical hound built from iron plates and clockwork, set to guard specific rooms against all intruders.',
    ai: { type: 'territorial', alertRadius: 6 },
  },

  duergar_sorcerer: {
    key: 'duergar_sorcerer', name: 'Duergar Sorcerer', plural: 'Duergar Sorcerers',
    glyph: 0x64, color: '#bb8866', // 'd'
    hd: 4, hdType: 'd6', ac: 12, speed: 1,
    attacks: [{ name: 'staff', numDice: 1, die: 6, dmgBonus: 0, special: null }],
    specials: ['immune_paralysis', 'immune_illusion', 'cast_darkness', 'cast_enlarge', 'cast_hold_person'],
    morale: 8, alignment: 'chaotic', size: 'medium',
    tags: ['humanoid', 'dwarven', 'magic_user'],
    xpBase: 120, xpPerHD: 20,
    loot: { table: 'humanoid_mage', chance: 0.9 },
    habitat: ['dwarven_deep'],
    description: 'Duergar who have delved into the same dark magic that warped their ancestors. Dangerous at range.',
    ai: { type: 'cautious', fleeThreshold: 0.35, castChance: 0.6 },
  },

  // --- ELEMENTAL GROTTO ---

  fire_elemental: {
    key: 'fire_elemental', name: 'Fire Elemental', plural: 'Fire Elementals',
    glyph: 0x45, color: '#ff6600', // 'E'
    hd: 8, hdType: 'd8', ac: 14, speed: 1.5,
    attacks: [{ name: 'burning touch', numDice: 2, die: 8, dmgBonus: 0, special: 'ignite' }],
    specials: ['immune_fire', 'vulnerability_cold', 'immune_nonmagic_weapons', 'immune_sleep', 'immune_charm'],
    morale: 11, alignment: 'neutral', size: 'large',
    tags: ['elemental', 'fire'],
    xpBase: 500, xpPerHD: 60,
    loot: { table: 'elemental', chance: 0.4 },
    habitat: ['elemental_grotto'],
    description: 'A roiling mass of living flame drawn through a planar rift. It burns with mindless hunger.',
    ai: { type: 'aggressive', fleeThreshold: 0.05 },
  },

  water_elemental: {
    key: 'water_elemental', name: 'Water Elemental', plural: 'Water Elementals',
    glyph: 0x45, color: '#4488ff', // 'E'
    hd: 8, hdType: 'd8', ac: 13, speed: 1,
    attacks: [{ name: 'crushing wave', numDice: 2, die: 8, dmgBonus: 0, special: 'knockback' }],
    specials: ['immune_cold', 'vulnerability_lightning', 'immune_nonmagic_weapons', 'immune_sleep', 'immune_charm'],
    morale: 11, alignment: 'neutral', size: 'large',
    tags: ['elemental', 'water'],
    xpBase: 500, xpPerHD: 60,
    loot: { table: 'elemental', chance: 0.4 },
    habitat: ['elemental_grotto'],
    description: 'A towering wave of animate water, crushing all that stands between it and stillness.',
    ai: { type: 'aggressive' },
  },

  earth_elemental: {
    key: 'earth_elemental', name: 'Earth Elemental', plural: 'Earth Elementals',
    glyph: 0x45, color: '#886644', // 'E'
    hd: 8, hdType: 'd10', ac: 17, speed: 0.75,
    attacks: [{ name: 'stone slam', numDice: 2, die: 10, dmgBonus: 5, special: null }],
    specials: ['immune_lightning', 'vulnerability_sonic', 'immune_nonmagic_weapons', 'immune_sleep', 'immune_charm'],
    morale: 12, alignment: 'neutral', size: 'huge',
    tags: ['elemental', 'earth'],
    xpBase: 600, xpPerHD: 65,
    loot: { table: 'elemental', chance: 0.4 },
    habitat: ['elemental_grotto'],
    description: 'A lumbering colossus of animate rock that strikes with the weight of mountains.',
    ai: { type: 'territorial', alertRadius: 5 },
  },

  magma_sprite: {
    key: 'magma_sprite', name: 'Magma Sprite', plural: 'Magma Sprites',
    glyph: 0x6D, color: '#ff4400', // 'm'
    hd: 3, hdType: 'd6', ac: 12, speed: 1.25,
    attacks: [{ name: 'magma spit', numDice: 1, die: 6, dmgBonus: 1, special: 'ignite' }],
    specials: ['immune_fire', 'vulnerability_cold'],
    morale: 8, alignment: 'neutral', size: 'small',
    tags: ['elemental', 'fire'],
    xpBase: 65, xpPerHD: 15,
    loot: { table: 'elemental_minor', chance: 0.3 },
    habitat: ['elemental_grotto'],
    description: 'Small, darting creatures of molten rock that spit burning globs and scatter when threatened.',
    ai: { type: 'pack', packRadius: 5, fleeThreshold: 0.4 },
  },

  crystal_golem: {
    key: 'crystal_golem', name: 'Crystal Golem', plural: 'Crystal Golems',
    glyph: 0x43, color: '#88ccff', // 'C'
    hd: 7, hdType: 'd10', ac: 15, speed: 0.75,
    attacks: [{ name: 'crystalline strike', numDice: 2, die: 6, dmgBonus: 2, special: 'prismatic_burst' }],
    specials: ['immune_sleep', 'immune_charm', 'immune_poison', 'reflect_magic_15', 'prismatic_aura'],
    morale: 12, alignment: 'neutral', size: 'large',
    tags: ['construct', 'elemental'],
    xpBase: 600, xpPerHD: 70,
    loot: { table: 'construct_magic', chance: 0.5 },
    habitat: ['elemental_grotto'],
    description: 'A humanoid form grown from elemental crystal. Its facets refract light into dazzling patterns — and deadly beams.',
    ai: { type: 'territorial', alertRadius: 8 },
  },

  storm_wisp: {
    key: 'storm_wisp', name: 'Storm Wisp', plural: 'Storm Wisps',
    glyph: 0x77, color: '#aaccff', // 'w'
    hd: 4, hdType: 'd6', ac: 13, speed: 1.5,
    attacks: [{ name: 'lightning arc', numDice: 1, die: 8, dmgBonus: 0, special: 'chain_lightning' }],
    specials: ['immune_lightning', 'immune_nonmagic_weapons', 'fly', 'phase'],
    morale: 7, alignment: 'neutral', size: 'tiny',
    tags: ['elemental', 'air', 'incorporeal'],
    xpBase: 120, xpPerHD: 20,
    loot: { table: 'elemental_minor', chance: 0.2 },
    habitat: ['elemental_grotto'],
    description: 'Flickering motes of electrical energy that dart between targets and arc unpredictably.',
    ai: { type: 'aggressive', fleeThreshold: 0.5 },
  },

  // --- VOID PASSAGE ---

  shadow_demon: {
    key: 'shadow_demon', name: 'Shadow Demon', plural: 'Shadow Demons',
    glyph: 0x26, color: '#440066', // '&'
    hd: 7, hdType: 'd8', ac: 13, speed: 1.25,
    attacks: [{ name: 'shadow claws', numDice: 2, die: 6, dmgBonus: 0, special: 'strength_drain' }],
    specials: ['immune_nonmagic_weapons', 'immune_cold', 'immune_lightning', 'immune_fire', 'vulnerability_holy', 'vulnerability_light', 'incorporeal'],
    morale: 10, alignment: 'chaotic', size: 'medium',
    tags: ['demon', 'undead', 'incorporeal'],
    xpBase: 700, xpPerHD: 75,
    loot: { table: 'demon', chance: 0.5 },
    habitat: ['void_passage'],
    description: 'A demon that has shed its physical form entirely, existing as living shadow. It feeds on the light it extinguishes.',
    ai: { type: 'cautious', ambush: true, fleeThreshold: 0.2 },
  },

  void_wraith: {
    key: 'void_wraith', name: 'Void Wraith', plural: 'Void Wraiths',
    glyph: 0x57, color: '#660099', // 'W'
    hd: 5, hdType: 'd8', ac: 14, speed: 1,
    attacks: [{ name: 'void touch', numDice: 1, die: 6, dmgBonus: 0, special: 'energy_drain_1' }],
    specials: ['energy_drain', 'immune_nonmagic_weapons', 'immune_cold', 'immune_sleep', 'immune_charm', 'incorporeal', 'fly'],
    morale: 11, alignment: 'chaotic', size: 'medium',
    tags: ['undead', 'incorporeal', 'void'],
    xpBase: 300, xpPerHD: 40,
    loot: { table: 'undead_void', chance: 0.4 },
    habitat: ['void_passage'],
    description: 'A wraith unmade by exposure to the void between planes. It no longer remembers what it was.',
    ai: { type: 'aggressive', turnable: false, seekLifeforce: true },
  },

  phase_spider: {
    key: 'phase_spider', name: 'Phase Spider', plural: 'Phase Spiders',
    glyph: 0x73, color: '#884488', // 's'
    hd: 5, hdType: 'd8', ac: 13, speed: 1.5,
    attacks: [{ name: 'phase bite', numDice: 1, die: 8, dmgBonus: 2, special: 'poison' }],
    specials: ['blink', 'poison', 'web'],
    morale: 8, alignment: 'neutral', size: 'large',
    tags: ['beast', 'planar'],
    xpBase: 250, xpPerHD: 30,
    loot: { table: 'beast_exotic', chance: 0.4 },
    habitat: ['void_passage'],
    description: 'A spider that can step between the material world and the ethereal plane, appearing without warning to attack.',
    ai: { type: 'ambush', fleeThreshold: 0.3, phaseOnDamage: true },
  },

  void_hound: {
    key: 'void_hound', name: 'Void Hound', plural: 'Void Hounds',
    glyph: 0x68, color: '#553377', // 'h'
    hd: 4, hdType: 'd8', ac: 14, speed: 1.5,
    attacks: [{ name: 'null bite', numDice: 1, die: 8, dmgBonus: 2, special: 'dispel_magic' }],
    specials: ['immune_magic', 'darkvision', 'null_howl'],
    morale: 10, alignment: 'chaotic', size: 'large',
    tags: ['beast', 'void', 'planar'],
    xpBase: 200, xpPerHD: 28,
    loot: { table: 'beast_planar', chance: 0.3 },
    habitat: ['void_passage'],
    description: 'A hound-like predator native to the void. Its bite dispels magical protections, and its howl can shatter enchantments.',
    ai: { type: 'pack', packRadius: 7, alertsAlliesOnSight: true },
  },

  rift_stalker: {
    key: 'rift_stalker', name: 'Rift Stalker', plural: 'Rift Stalkers',
    glyph: 0x52, color: '#772299', // 'R'
    hd: 9, hdType: 'd8', ac: 16, speed: 1.25,
    attacks: [
      { name: 'rift claw',   numDice: 2, die: 8, dmgBonus: 3, special: 'planar_rend' },
      { name: 'void breath', numDice: 1, die: 10, dmgBonus: 0, special: 'disintegrate_5' },
    ],
    specials: ['blink', 'immune_nonmagic_weapons', 'immune_cold', 'immune_lightning', 'planar_step', 'frightful_presence'],
    morale: 11, alignment: 'chaotic', size: 'huge',
    tags: ['demon', 'void', 'planar'],
    xpBase: 1500, xpPerHD: 150,
    loot: { table: 'demon_greater', chance: 0.8 },
    habitat: ['void_passage'],
    description: 'A predator that tears through the membrane between planes to hunt. Its very presence unravels the fabric of space.',
    ai: { type: 'aggressive', usesSpecial: true, specialCooldown: 4, hasBossPhases: false },
  },

  // +80 more monsters across all depth bands
  // boss_variants for each major monster type
  // unique named monsters (procedurally named with title system)
};
