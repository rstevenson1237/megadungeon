// src/data/features.js

/**
 * Feature tiers:
 *   'dressing'    — cosmetic only, no player interaction
 *   'searchable'  — player can search (keypress) to reveal hidden content
 *   'interactive' — player triggers a menu/prompt with choices and consequences
 */

export const FEATURES = {

  // --- DRESSING (cosmetic) ---

  pillar: {
    key: 'pillar',
    glyph: 0x7C,   // |
    fg: '#888888',
    solid: true,
    opaque: true,
    tier: 'dressing',
    themes: ['dungeon_cellar', 'catacomb', 'dwarven_deep'],
    weight: 8,
    description: 'A stone pillar, load-bearing and ancient.',
  },

  rubble: {
    key: 'rubble',
    glyph: 0x2C,   // ,
    fg: '#666666',
    solid: false,
    opaque: false,
    tier: 'dressing',
    themes: ['dungeon_cellar', 'goblin_warren', 'catacomb'],
    weight: 10,
    description: 'Loose stones and broken masonry.',
  },

  torch_sconce: {
    key: 'torch_sconce',
    glyph: 0x21,   // !
    fg: '#ffaa00',
    solid: false,
    opaque: false,
    tier: 'dressing',
    themes: ['dungeon_cellar', 'dwarven_deep', 'goblin_warren'],
    weight: 12,
    description: 'A torch mounted in an iron sconce.',
  },

  crystal_formation: {
    key: 'crystal_formation',
    glyph: 0x2A,   // *
    fg: '#88aacc',
    solid: true,
    opaque: false,
    tier: 'dressing',
    themes: ['elemental_grotto', 'void_passage'],
    weight: 10,
    description: 'Jutting mineral crystals, cold to the touch.',
  },

  bone_pile: {
    key: 'bone_pile',
    glyph: 0x25,   // %
    fg: '#ccccaa',
    solid: false,
    opaque: false,
    tier: 'dressing',
    themes: ['catacomb', 'goblin_warren'],
    weight: 8,
    description: 'A heap of old bones.',
  },

  // --- SEARCHABLE (simple interactive) ---

  bookshelf: {
    key: 'bookshelf',
    name: 'Bookshelf',
    glyph: 0x3D,   // =
    fg: '#886644',
    solid: true,
    opaque: false,
    tier: 'searchable',
    themes: ['dungeon_cellar', 'catacomb', 'dwarven_deep'],
    weight: 6,
    description: 'Rows of mouldering tomes.',
    onSearch: {
      outcomes: [
        { weight: 50, result: 'lore',   message: 'You find a readable passage. {lore_entry}' },
        { weight: 30, result: 'item',   message: 'A scroll is wedged between the books.' },
        { weight: 15, result: 'empty',  message: 'Nothing of value remains.' },
        { weight: 5,  result: 'trap',   message: 'A spring-loaded needle jabs your hand!' },
      ],
    },
  },

  chest: {
    key: 'chest',
    name: 'Chest',
    glyph: 0x2B,   // +
    fg: '#aa8844',
    solid: false,
    opaque: false,
    tier: 'searchable',
    themes: ['*'],   // all themes
    weight: 5,
    description: 'A wooden chest, possibly locked.',
    onSearch: {
      requiresKey: true,  // picked lock (thief skill) or iron_key item
      outcomes: [
        { weight: 40, result: 'treasure', message: 'The chest contains {item}.' },
        { weight: 25, result: 'gold',     message: 'You find {gold} gold coins.' },
        { weight: 20, result: 'trap',     message: 'The chest was rigged! {trap_effect}' },
        { weight: 15, result: 'empty',    message: 'The chest is empty.' },
      ],
    },
  },

  sarcophagus: {
    key: 'sarcophagus',
    name: 'Sarcophagus',
    glyph: 0x5B,   // [
    fg: '#aaaaaa',
    solid: true,
    opaque: false,
    tier: 'searchable',
    themes: ['catacomb'],
    weight: 10,
    description: 'A stone burial casket, sealed with wax.',
    onSearch: {
      outcomes: [
        { weight: 35, result: 'item',    message: 'Buried with their belongings: {item}.' },
        { weight: 30, result: 'undead',  message: 'The occupant stirs! A {monster} rises!' },
        { weight: 25, result: 'lore',    message: 'An inscription on the lid reads: {lore_entry}' },
        { weight: 10, result: 'curse',   message: 'A dark energy washes over you.' },
      ],
    },
  },

  crate: {
    key: 'crate',
    name: 'Crate',
    glyph: 0x7B,   // {
    fg: '#885533',
    solid: false,
    opaque: false,
    tier: 'searchable',
    themes: ['dungeon_cellar', 'dwarven_deep', 'goblin_warren'],
    weight: 8,
    description: 'A splintered wooden crate.',
    onSearch: {
      outcomes: [
        { weight: 45, result: 'item',   message: 'You find {item} inside.' },
        { weight: 35, result: 'empty',  message: 'Just packing straw.' },
        { weight: 20, result: 'vermin', message: 'Giant rats burst out!' },
      ],
    },
  },

  // --- FULLY INTERACTIVE ---

  fountain: {
    key: 'fountain',
    name: 'Fountain',
    glyph: 0x7E,   // ~
    fg: '#4488cc',
    solid: false,
    opaque: false,
    tier: 'interactive',
    themes: ['dungeon_cellar', 'catacomb', 'dwarven_deep', 'elemental_grotto'],
    weight: 4,
    description: 'A stone fountain, water still flowing from some hidden source.',
    singleUse: false,
    continual: true,
    onInteract: {
      prompt: 'Drink from the fountain?',
      options: [
        { label: 'Drink',      action: 'drink_fountain' },
        { label: 'Fill flask', action: 'fill_flask' },
        { label: 'Leave it',   action: 'cancel' },
      ],
      // drink_fountain outcome table resolved at runtime:
      drinkOutcomes: [
        { weight: 30, effect: 'heal',            value: '2d6',    message: 'The water is cool and revitalizing. You feel refreshed.' },
        { weight: 20, effect: 'restore_mp',      value: '1d6',    message: 'Magic tingles on your tongue.' },
        { weight: 15, effect: 'poison',          value: 'mild',   message: 'The water tastes foul. Your stomach turns.' },
        { weight: 15, effect: 'status',          value: 'blessed', message: 'A faint glow surrounds you.' },
        { weight: 10, effect: 'random_teleport',                   message: 'The world spins — you are elsewhere.' },
        { weight: 10, effect: 'item',            consumable: true, message: 'As you drink, your hand brushes something at the bottom.' },
      ],
    },
  },

  altar: {
    key: 'altar',
    name: 'Altar',
    glyph: 0x5E,   // ^
    fg: '#ddddaa',
    solid: false,
    opaque: false,
    tier: 'interactive',
    themes: ['catacomb', 'dungeon_cellar', 'void_passage'],
    weight: 3,
    description: 'A stone altar stained with old offerings.',
    singleUse: false,  // can be used repeatedly but with diminishing returns
    onInteract: {
      prompt: 'What do you do at the altar?',
      options: [
        { label: 'Pray (free)',        action: 'pray_altar' },
        { label: 'Offer gold (50gp)',  action: 'offer_gold',  cost: { gold: 50 } },
        { label: 'Offer blood (5 HP)', action: 'offer_blood', cost: { hp: 5 } },
        { label: 'Defile it',          action: 'defile_altar' },
        { label: 'Leave',              action: 'cancel' },
      ],
      outcomes: {
        pray_altar:   [
          { weight: 50, effect: 'nothing', message: 'Silence. The gods do not answer.' },
          { weight: 30, effect: 'bless',   value: 3, message: 'A warmth fills the room. You feel watched over.' },
          { weight: 20, effect: 'curse',            message: 'Something notices you. It is not pleased.' },
        ],
        offer_gold:   [{ weight: 100, effect: 'bless',          value: 5,     message: 'The gold dissolves. A blessing settles on you.' }],
        offer_blood:  [{ weight: 100, effect: 'heal',           value: '3d6', message: 'Pain given freely returns as strength.' }],
        defile_altar: [{ weight: 100, effect: 'spawn_guardian',               message: 'The altar cracks. Something emerges from below.' }],
      },
    },
  },

  statue: {
    key: 'statue',
    name: 'Statue',
    glyph: 0x26,   // &
    fg: '#aaaaaa',
    solid: true,
    opaque: false,
    tier: 'interactive',
    themes: ['dungeon_cellar', 'catacomb', 'dwarven_deep'],
    weight: 4,
    description: 'A stone statue. The eyes seem to follow you.',
    onInteract: {
      prompt: 'Examine the statue?',
      options: [
        { label: 'Study it',  action: 'examine_statue' },
        { label: 'Touch it',  action: 'touch_statue' },
        { label: 'Walk past', action: 'cancel' },
      ],
      outcomes: {
        examine_statue: [
          { weight: 60, effect: 'lore',    message: '{statue_lore}' },
          { weight: 40, effect: 'nothing', message: 'Just stone. Very well-made stone.' },
        ],
        touch_statue: [
          { weight: 50, effect: 'nothing',  message: 'Cold stone. Nothing more.' },
          { weight: 30, effect: 'animate',  message: 'The statue shudders to life!', consumable: true },
          { weight: 20, effect: 'item',     message: 'Something shifts. A compartment opens.', consumable: true },
        ],
      },
    },
  },

  throne: {
    key: 'throne',
    name: 'Throne',
    glyph: 0x5C,   // \
    fg: '#cc9900',
    solid: true,
    opaque: false,
    tier: 'interactive',
    themes: ['dungeon_cellar', 'catacomb', 'dwarven_deep'],
    weight: 2,
    description: 'An ornate throne of stone and tarnished metal. Empty, or waiting.',
    singleUse: true,
    roomType: 'throne_room',  // forces the containing room to use throne_room ambient messages
    onInteract: {
      prompt: 'The throne awaits. Do you sit?',
      options: [
        { label: 'Sit on the throne', action: 'sit_throne' },
        { label: 'Leave it',          action: 'cancel' },
      ],
      outcomes: {
        sit_throne: [
          { weight: 40, effect: 'boon',           message: 'Power surges through you. You feel kingly.' },
          { weight: 35, effect: 'spawn_guardian', message: 'The seat of power calls its guardian!' },
          { weight: 25, effect: 'nothing',        message: 'An empty seat for an empty power.' },
        ],
      },
    },
  },

  transport_circle: {
    key: 'transport_circle',
    glyph: 0x30,   // 0
    fg: '#6644cc',
    solid: false,
    opaque: false,
    tier: 'interactive',
    themes: ['void_passage', 'elemental_grotto', 'catacomb'],
    weight: 3,
    description: 'A circle of runes etched into the floor. A faint hum rises from it.',
    // Circles are placed in pairs on a given floor. Each circle stores a pairedId.
    // Stepping onto an active circle auto-triggers transport (no prompt).
    autoTrigger: true,
    onInteract: {
      action: 'transport',
      safeGlow:   '#6644cc',  // color when paired destination exists and is safe
      unsafeGlow: '#cc2244',  // color when destination is random/unknown
    },
  },
};

/**
 * Returns features eligible for a given theme, as a weighted list.
 * @param {string} themeKey
 * @returns {Array<{value: Object, weight: number}>}
 */
export function getFeaturesForTheme(themeKey) {
  return Object.values(FEATURES)
    .filter(f => f.themes.includes(themeKey) || f.themes.includes('*'))
    .map(f => ({ value: f, weight: f.weight ?? 5 }));
}
