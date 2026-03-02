/**
 * @typedef {Object} SpellDef
 * @property {string}   key
 * @property {string}   name
 * @property {string}   school    'abjuration'|'conjuration'|'divination'|'enchantment'|'evocation'|'illusion'|'necromancy'|'transmutation'
 * @property {string}   type      'arcane'|'divine'
 * @property {number}   level     Spell level 1–9
 * @property {number}   mpCost
 * @property {string}   range     'self'|'touch'|'30ft'|'60ft'|'120ft'|'sight'
 * @property {string}   area      'single'|'cone'|'line'|'burst:radius'|'all_visible'
 * @property {string}   duration  'instant'|'1d6_turns'|'level_turns'|'concentration'|'permanent'
 * @property {string}   save      'none'|'death'|'spells'|'breath'|'wands'|'stone'
 * @property {string}   saveEffect 'negate'|'half'|'partial'
 * @property {Object}   effect    { type, magnitude, ... } — interpreted by MagicSystem
 * @property {string[]} classes   Which classes can learn this spell
 * @property {string}   description
 * @property {string}   flavorText
 */

export const SPELLS = {

  // === ARCANE LEVEL 1 ===
  magic_missile: {
    key: 'magic_missile', name: 'Magic Missile',
    school: 'evocation', type: 'arcane', level: 1, mpCost: 4,
    range: '120ft', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'damage', element: 'force', dice: '1d4+1', extraMissilePerLevel: 2 },
    classes: ['magic_user', 'illusionist'],
    description: 'A shimmering bolt of magical force strikes unerringly. Two missiles at level 3, three at level 5.',
    flavorText: '"Force given direction. The most honest magic there is." — Mordenkainen',
  },

  sleep: {
    key: 'sleep', name: 'Sleep',
    school: 'enchantment', type: 'arcane', level: 1, mpCost: 5,
    range: '60ft', area: 'burst:15ft', duration: '1d4+level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'sleep', hdLimit: '2d4', affectsUndead: false },
    classes: ['magic_user', 'illusionist', 'bard'],
    description: 'Targets up to 2d4 HD of creatures in the area, lowest HD first. Undead and constructs unaffected.',
    flavorText: '"Useful in proportion to the user's willingness to follow through."',
  },

  fireball: {
    key: 'fireball', name: 'Fireball',
    school: 'evocation', type: 'arcane', level: 3, mpCost: 12,
    range: '120ft', area: 'burst:20ft', duration: 'instant',
    save: 'breath', saveEffect: 'half',
    effect: { type: 'damage', element: 'fire', dice: 'level_d6' }, // 1d6 per caster level
    classes: ['magic_user'],
    description: 'A bead of fire that detonates in a 20-foot radius. Deals 1d6/level fire damage. Save for half.',
    flavorText: '"The ball always fills the space. Many a reckless mage has learned this at cost."',
  },

  // === DIVINE LEVEL 1 ===
  cure_light_wounds: {
    key: 'cure_light_wounds', name: 'Cure Light Wounds',
    school: 'conjuration', type: 'divine', level: 1, mpCost: 5,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'heal', dice: '1d8+1' },
    classes: ['cleric', 'paladin', 'druid'],
    description: 'Channels divine favor to close wounds and stop bleeding. Heals 1d8+1 HP.',
    flavorText: '"Even the gods have a price. This one is cheap."',
  },

  turn_undead: {
    key: 'turn_undead', name: 'Turn Undead',
    school: 'abjuration', type: 'divine', level: 1, mpCost: 0, // class ability, not MP
    range: 'self', area: 'burst:30ft', duration: '1d6+2_turns',
    save: 'death', saveEffect: 'negate',
    effect: { type: 'turn', hdTable: 'cleric_turn_table' },
    classes: ['cleric', 'paladin'],
    description: 'Invoke divine authority to drive off or destroy undead based on the cleric's level vs undead HD.',
    flavorText: '"Holy ground is wherever you stand."',
  },

  // +60 more spells across all schools and levels
};
