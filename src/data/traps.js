/**
 * @typedef {Object} TrapDef
 * @property {string}   key
 * @property {string}   name
 * @property {number}   glyph
 * @property {string}   color
 * @property {number}   detectDC       Difficulty class to notice (vs thief skill or INT check)
 * @property {number}   disarmDC
 * @property {number}   triggerChance  Base chance to trigger when walked over (0–1)
 * @property {Object}   effect         { type, damage, save, saveType, duration, special }
 * @property {string[]} habitat        Which themes/depths it appears in
 * @property {string}   description    Flavor
 * @property {string}   hint           Clue visible before triggering (if detected)
 */

export const TRAPS = {

  arrow_trap: {
    key: 'arrow_trap', name: 'Arrow Trap',
    glyph: 0xAF, color: '#885533', detectDC: 12, disarmDC: 14, triggerChance: 0.7,
    effect: { type: 'damage', damage: '1d6', save: 'breath', saveType: 'half', special: null },
    habitat: ['dungeon_cellar', 'goblin_warren'],
    description: 'A concealed crossbow bolt, pressure-plate triggered.',
    hint: 'A suspicious seam runs across the floor. Small holes are bored in the far wall.',
  },

  pit_trap: {
    key: 'pit_trap', name: 'Pit Trap',
    glyph: 0x5F, color: '#555555', detectDC: 14, disarmDC: 16, triggerChance: 0.8,
    effect: { type: 'fall', damage: '1d6_per_10ft', depth: '1d3*10', save: 'death', saveType: 'negate', special: 'trapped_until_climbed' },
    habitat: ['dungeon_cellar', 'underhall', 'dwarven_deep'],
    description: 'A false floor concealing a deep pit. May be spiked.',
    hint: 'The floor sounds slightly hollow when tapped.',
  },

  poison_needle: {
    key: 'poison_needle', name: 'Poison Needle',
    glyph: 0xAD, color: '#44aa44', detectDC: 16, disarmDC: 18, triggerChance: 1.0,
    effect: { type: 'poison', damage: '1d4', save: 'death', saveType: 'negate', duration: '10_turns', poisonType: 'paralytic' },
    habitat: ['dungeon_cellar', 'catacomb', 'underhall'],
    description: 'Hidden in a lock, book spine, or drawer. A classic assassin\'s tool.',
    hint: 'A faint greenish stain marks the keyhole.',
  },

  rune_of_fire: {
    key: 'rune_of_fire', name: 'Fire Rune',
    glyph: 0xF4, color: '#ff6600', detectDC: 18, disarmDC: 20, triggerChance: 1.0,
    effect: { type: 'damage', damage: '3d6', element: 'fire', save: 'breath', saveType: 'half', area: 'burst:10ft' },
    habitat: ['elemental_grotto', 'dwarven_deep', 'demon_warren'],
    description: 'A magical glyph inscribed on floor or object. Detonates on approach.',
    hint: 'Faintly glowing sigils are barely visible on the floor.',
  },

  gas_trap: {
    key: 'gas_trap', name: 'Poison Gas Trap',
    glyph: 0xB0, color: '#88cc88', detectDC: 15, disarmDC: 17, triggerChance: 0.9,
    effect: { type: 'poison', damage: '1d6_per_turn', save: 'breath', saveType: 'negate', duration: '3_turns', area: 'burst:10ft', cloud: true },
    habitat: ['catacomb', 'underhall', 'dwarven_deep'],
    description: 'Vents in the floor are ready to release a cloud of noxious vapor.',
    hint: 'The air smells faintly of almonds.',
  },

  teleport_trap: {
    key: 'teleport_trap', name: 'Teleportation Trap',
    glyph: 0xF9, color: '#8888ff', detectDC: 17, disarmDC: 19, triggerChance: 1.0,
    effect: { type: 'teleport', special: 'random_location' },
    habitat: ['elemental_grotto', 'void_passage', 'primordial_chaos'],
    description: 'A shimmering instability in the air that yanks you through space.',
    hint: 'The air ahead seems to waver and distort.',
  },

  // +20 more trap types
};
