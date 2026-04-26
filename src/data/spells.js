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
    flavorText: '"Useful in proportion to the user\'s willingness to follow through."',
  },

  light: {
    key: 'light', name: 'Light',
    school: 'evocation', type: 'arcane', level: 1, mpCost: 3,
    range: 'touch', area: 'single', duration: 'level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'light', radius: 15, color: '#ffffaa' },
    classes: ['magic_user', 'cleric', 'paladin'],
    description: 'Causes an object to glow like a torch for a number of minutes equal to your level.',
    flavorText: '"The smallest candle is a star against the dark."',
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

  detect_evil: {
    key: 'detect_evil', name: 'Detect Evil',
    school: 'divination', type: 'divine', level: 1, mpCost: 4,
    range: 'self', area: 'burst:60ft', duration: 'concentration',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'detect', target: 'evil' },
    classes: ['cleric', 'paladin'],
    description: 'For the duration, you sense the presence and location of any evil creature or object within range.',
    flavorText: '"You can\'t hide from the light."',
  },

  bless: {
    key: 'bless', name: 'Bless',
    school: 'enchantment', type: 'divine', level: 1, mpCost: 6,
    range: '30ft', area: 'all_allies_in_burst:15ft', duration: 'level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'buff', stat: 'attack', value: 1 },
    classes: ['cleric', 'paladin'],
    description: 'Allies in the area of effect gain a +1 bonus to their attack rolls for the duration.',
    flavorText: '"May your sword strike true."',
  },

  turn_undead: {
    key: 'turn_undead', name: 'Turn Undead',
    school: 'abjuration', type: 'divine', level: 1, mpCost: 0, // class ability, not MP
    range: 'self', area: 'burst:30ft', duration: '1d6+2_turns',
    save: 'death', saveEffect: 'negate',
    effect: { type: 'turn', hdTable: 'cleric_turn_table' },
    classes: ['cleric', 'paladin'],
    description: 'Invoke divine authority to drive off or destroy undead based on the cleric\'s level vs undead HD.',
    flavorText: '"Holy ground is wherever you stand."',
  },

  // === ARCANE LEVEL 1 (continued) ===
  color_spray: {
    key: 'color_spray', name: 'Color Spray',
    school: 'illusion', type: 'arcane', level: 1, mpCost: 4,
    range: '30ft', area: 'burst:10ft', duration: 'instant',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'sleep' },
    classes: ['magic_user', 'illusionist'],
    description: 'A spray of clashing colors overwhelms nearby creatures. Save vs. spells or fall unconscious.',
    flavorText: '"The eye is the fastest way to the mind."',
  },

  enlarge_person: {
    key: 'enlarge_person', name: 'Enlarge Person',
    school: 'transmutation', type: 'arcane', level: 1, mpCost: 4,
    range: 'touch', area: 'single', duration: 'level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'buff', stat: 'attack', value: 1, attackMod: 1 },
    classes: ['magic_user'],
    description: 'The target grows in stature, gaining +1 to attack rolls for the duration.',
    flavorText: '"Size is a state of mind. Mostly."',
  },

  fear: {
    key: 'fear', name: 'Fear',
    school: 'necromancy', type: 'arcane', level: 1, mpCost: 5,
    range: '60ft', area: 'single', duration: '1d6+2_turns',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'fear' },
    classes: ['magic_user', 'necromancer', 'illusionist'],
    description: 'The target is overcome with supernatural terror and flees in panic. Save vs. spells negates.',
    flavorText: '"The mind breaks long before the body."',
  },

  frost_bolt: {
    key: 'frost_bolt', name: 'Frost Bolt',
    school: 'evocation', type: 'arcane', level: 1, mpCost: 5,
    range: '60ft', area: 'single', duration: 'instant',
    save: 'breath', saveEffect: 'half',
    effect: { type: 'damage', element: 'cold', dice: '1d8' },
    classes: ['magic_user', 'illusionist'],
    description: 'A shard of magical ice that deals 1d8 cold damage. Save for half.',
    flavorText: '"Still as the grave."',
  },

  // === ARCANE LEVEL 2 ===
  slow: {
    key: 'slow', name: 'Slow',
    school: 'transmutation', type: 'arcane', level: 2, mpCost: 6,
    range: '60ft', area: 'single', duration: '1d6+2_turns',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'debuff', statusKey: 'slow', acMod: 2 },
    classes: ['magic_user', 'illusionist'],
    description: 'Reduces the target to half speed. Enemies become easier to hit (+2 to effective AC). Save vs. spells negates.',
    flavorText: '"Time is a river. You have just dammed it."',
  },

  acid_arrow: {
    key: 'acid_arrow', name: "Melf's Acid Arrow",
    school: 'evocation', type: 'arcane', level: 2, mpCost: 7,
    range: '120ft', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: {
      type: 'damage', element: 'acid', dice: '2d4',
      onHitStatus: { key: 'corroding', duration: 2, damagePerTurn: 2 },
    },
    classes: ['magic_user'],
    description: 'A bolt of acid deals 2d4 damage and continues to corrode for 2 turns (2 damage/turn). No save.',
    flavorText: '"It keeps working after impact. Quite persistently."',
  },

  web: {
    key: 'web', name: 'Web',
    school: 'conjuration', type: 'arcane', level: 2, mpCost: 7,
    range: '60ft', area: 'burst:15ft', duration: '2d4_turns',
    save: 'breath', saveEffect: 'negate',
    effect: { type: 'paralysis', humanoidOnly: false },
    classes: ['magic_user'],
    description: 'Fills the area with thick webs. All creatures in range are paralyzed unless they save vs. breath.',
    flavorText: '"The spider does not run. It waits."',
  },

  hypnotic_pattern: {
    key: 'hypnotic_pattern', name: 'Hypnotic Pattern',
    school: 'illusion', type: 'arcane', level: 2, mpCost: 7,
    range: '60ft', area: 'burst:15ft', duration: 'concentration',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'sleep' },
    classes: ['magic_user', 'illusionist', 'bard'],
    description: 'A weaving pattern of colors fascinates nearby creatures. Save vs. spells or fall into a stupor.',
    flavorText: '"Watch the light. Only the light."',
  },

  // === DIVINE LEVEL 2 ===
  cure_poison: {
    key: 'cure_poison', name: 'Cure Poison',
    school: 'conjuration', type: 'divine', level: 2, mpCost: 5,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'cure_status', statusKey: 'poison', message: "The poison clears from {name}'s blood." },
    classes: ['cleric', 'druid', 'paladin'],
    description: 'Neutralizes poison in the target\'s blood immediately, ending all poison effects.',
    flavorText: '"The divine does not negotiate with venom."',
  },

  hold_person: {
    key: 'hold_person', name: 'Hold Person',
    school: 'enchantment', type: 'divine', level: 2, mpCost: 7,
    range: '60ft', area: 'single', duration: '1d4+2_turns',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'paralysis', humanoidOnly: true },
    classes: ['cleric', 'magic_user'],
    description: 'Freezes a humanoid target in place. Only affects humanoids. Save vs. spells negates.',
    flavorText: '"Stay. I insist."',
  },

  resist_fire: {
    key: 'resist_fire', name: 'Resist Fire',
    school: 'abjuration', type: 'divine', level: 2, mpCost: 5,
    range: 'touch', area: 'single', duration: 'level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'protection', statusKey: 'resist_fire', acMod: 0 },
    classes: ['cleric', 'druid'],
    description: 'The target takes half damage from all fire sources — spells, traps, and breath weapons.',
    flavorText: '"The flame knows you. It simply cannot touch you."',
  },

  // === ARCANE LEVEL 3 (continued) ===
  lightning_bolt: {
    key: 'lightning_bolt', name: 'Lightning Bolt',
    school: 'evocation', type: 'arcane', level: 3, mpCost: 12,
    range: '120ft', area: 'burst:20ft', duration: 'instant',
    save: 'breath', saveEffect: 'half',
    effect: { type: 'damage', element: 'lightning', dice: 'level_d6' },
    classes: ['magic_user'],
    description: 'A crackling bolt of lightning detonates in a 20-foot area. Deals 1d6/level lightning damage. Save for half.',
    flavorText: '"The storm does not negotiate."',
  },

  // === ARCANE LEVEL 3 (continued) ===
  dispel_magic: {
    key: 'dispel_magic', name: 'Dispel Magic',
    school: 'abjuration', type: 'arcane', level: 3, mpCost: 10,
    range: '120ft', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'dispel' },
    classes: ['magic_user', 'cleric'],
    description: 'Strips all active magical effects from the target — beneficial and harmful alike.',
    flavorText: '"There is no spell that cannot be unwritten."',
  },

  vampiric_touch: {
    key: 'vampiric_touch', name: 'Vampiric Touch',
    school: 'necromancy', type: 'arcane', level: 3, mpCost: 10,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'vampiric', dice: 'level_d6' },
    classes: ['magic_user', 'necromancer'],
    description: 'Drain 1d6 HP per two caster levels from the target. The caster absorbs half as healing.',
    flavorText: '"Something flows from you to me. I find I prefer it this way."',
  },

  // === DIVINE LEVEL 3 ===
  cure_serious_wounds: {
    key: 'cure_serious_wounds', name: 'Cure Serious Wounds',
    school: 'conjuration', type: 'divine', level: 3, mpCost: 10,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'heal', dice: '2d8+3' },
    classes: ['cleric', 'druid', 'paladin'],
    description: 'Channels a surge of divine energy to heal 2d8+3 HP.',
    flavorText: '"The wound remembers being whole."',
  },

  remove_curse: {
    key: 'remove_curse', name: 'Remove Curse',
    school: 'abjuration', type: 'divine', level: 3, mpCost: 10,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'remove_curse' },
    classes: ['cleric', 'magic_user', 'paladin'],
    description: 'Lifts curses from the target and frees them from any cursed items they are bound to.',
    flavorText: '"The hex was always weaker than the will to undo it."',
  },

  remove_paralysis: {
    key: 'remove_paralysis', name: 'Remove Paralysis',
    school: 'conjuration', type: 'divine', level: 3, mpCost: 6,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'cure_status', statusKey: 'paralysis', message: '{name} can move again.' },
    classes: ['cleric', 'paladin'],
    description: 'Instantly ends paralysis affecting the target.',
    flavorText: '"Move. The battle is not over."',
  },

  prayer: {
    key: 'prayer', name: 'Prayer',
    school: 'enchantment', type: 'divine', level: 3, mpCost: 10,
    range: 'self', area: 'all_enemies_visible', duration: 'level_turns',
    save: 'spells', saveEffect: 'negate',
    effect: { type: 'debuff', statusKey: 'weakened', attackMod: -1 },
    classes: ['cleric'],
    description: 'Your prayer saps the resolve of all visible enemies. They suffer -1 to attack rolls. Save negates.',
    flavorText: '"Not a petition. A commandment."',
  },

  // === ARCANE LEVEL 4 ===
  ice_storm: {
    key: 'ice_storm', name: 'Ice Storm',
    school: 'evocation', type: 'arcane', level: 4, mpCost: 16,
    range: '120ft', area: 'burst:20ft', duration: 'instant',
    save: 'breath', saveEffect: 'half',
    effect: { type: 'damage', element: 'cold', dice: '3d10' },
    classes: ['magic_user'],
    description: 'Drives down a pelting hail of ice crystals dealing 3d10 cold damage. Save vs. breath for half.',
    flavorText: '"The sky has opinions about you specifically."',
  },

  dimension_door: {
    key: 'dimension_door', name: 'Dimension Door',
    school: 'transmutation', type: 'arcane', level: 4, mpCost: 16,
    range: 'sight', area: 'self', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'teleport', targeted: true },
    classes: ['magic_user'],
    description: 'Step through a short-range dimensional rift to appear at the targeted visible location.',
    flavorText: '"Distance is a suggestion for the appropriately educated."',
  },

  // === ARCANE LEVEL 5 ===
  teleport: {
    key: 'teleport', name: 'Teleport',
    school: 'transmutation', type: 'arcane', level: 5, mpCost: 20,
    range: 'self', area: 'self', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'teleport' },
    classes: ['magic_user'],
    description: 'Instantly transports the caster to a random location on the current dungeon level.',
    flavorText: '"You are somewhere else. You hope somewhere better."',
  },

  // === DIVINE LEVEL 5 ===
  flame_strike: {
    key: 'flame_strike', name: 'Flame Strike',
    school: 'evocation', type: 'divine', level: 5, mpCost: 20,
    range: '60ft', area: 'burst:15ft', duration: 'instant',
    save: 'breath', saveEffect: 'half',
    effect: { type: 'damage', element: 'fire', dice: '6d8' },
    classes: ['cleric', 'druid'],
    description: 'A pillar of divine fire roars down from above, dealing 6d8 fire damage. Save vs. breath for half.',
    flavorText: '"Not from me. From above me."',
  },

  // === ARCANE LEVEL 6 ===
  disintegrate: {
    key: 'disintegrate', name: 'Disintegrate',
    school: 'transmutation', type: 'arcane', level: 6, mpCost: 25,
    range: '60ft', area: 'single', duration: 'instant',
    save: 'death', saveEffect: 'negate',
    effect: { type: 'damage', element: 'force', dice: '10d6+40' },
    classes: ['magic_user'],
    description: 'A thin green ray reduces the target to dust. Save vs. death negates all damage.',
    flavorText: '"The body simply... stops disagreeing."',
  },

  // === DIVINE LEVEL 1 (continued) ===
  cause_light_wounds: {
    key: 'cause_light_wounds', name: 'Cause Light Wounds',
    school: 'necromancy', type: 'divine', level: 1, mpCost: 5,
    range: 'touch', area: 'single', duration: 'instant',
    save: 'death', saveEffect: 'half',
    effect: { type: 'damage', element: 'negative_energy', dice: '1d8+1' },
    classes: ['cleric'],
    description: 'Channels negative energy through touch to inflict 1d8+1 damage. Save vs. death for half.',
    flavorText: '"The same hand that heals can wound."',
  },

  protection_from_evil: {
    key: 'protection_from_evil', name: 'Protection from Evil',
    school: 'abjuration', type: 'divine', level: 1, mpCost: 4,
    range: 'touch', area: 'single', duration: 'level_minutes',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'protection', statusKey: 'protected', acMod: -2 },
    classes: ['cleric', 'paladin'],
    description: 'Surrounds the target with holy ward. Attackers suffer a -2 penalty to AC (harder to hit target).',
    flavorText: '"Stand in the light and let evil break upon you."',
  },

  detect_traps: {
    key: 'detect_traps', name: 'Detect Traps',
    school: 'divination', type: 'divine', level: 1, mpCost: 4,
    range: 'self', area: 'self', duration: 'instant',
    save: 'none', saveEffect: 'negate',
    effect: { type: 'detect', target: 'traps', radius: 60 },
    classes: ['cleric'],
    description: 'Reveals the location of all hidden traps within 60 feet.',
    flavorText: '"The floor is not to be trusted."',
  },

  // +55 more spells across all schools and levels
};
