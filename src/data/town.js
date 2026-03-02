/**
 * The town has a fixed set of locations with procedurally varying stock and NPCs.
 * Town state persists across dungeon runs within the same world seed.
 */
export const TOWN_LOCATIONS = {
  inn: {
    key: 'inn',
    name: 'The Stumbling Pilgrim Inn',
    glyph: 0x49, color: '#ffcc44',
    description: 'Low smoke-stained rafters, a fire that never quite seems to die, and the smell of salt pork.',
    services: ['rest', 'rumors', 'hire_henchman'],
    restCost: (playerLevel) => playerLevel * 5, // GP per night
    restEffect: 'full_restore',
    rumors: (worldState) => generateRumors(worldState), // Hint at dungeon content
  },

  general_store: {
    key: 'general_store',
    name: 'Aldric's Provisions',
    glyph: 0x24, color: '#ccaa44',
    services: ['buy', 'sell'],
    stock: ['torch', 'ration', 'rope', 'bandage', 'iron_spike', 'oil_flask',
            'thieves_tools', 'chalk', 'mirror_small', 'garlic', 'wolvesbane'],
    buyMarkup:  1.5,   // Sells at 150% list price
    sellMarkup: 0.3,   // Buys at 30% list price
  },

  temple: {
    key: 'temple',
    name: 'Temple of the Four Winds',
    glyph: 0x2B, color: '#ffffaa',
    services: ['cure_disease', 'remove_curse', 'raise_dead', 'identify', 'atonement'],
    costs: {
      cure_disease:  100,
      remove_curse:  300,
      raise_dead:    (playerLevel) => playerLevel * 500,
      identify:      50,
      atonement:     1000,
    },
  },

  arcane_shop: {
    key: 'arcane_shop',
    name: 'Mira's Curiosities & Curios',
    glyph: 0x2A, color: '#cc44cc',
    services: ['buy_spells', 'sell_scrolls', 'identify_magic', 'scribe_scroll'],
    spellsAvailable: (worldState, rng) => {
      const pool = Object.values(SPELLS).filter(s => s.type === 'arcane' && s.level <= 4);
      return rng.shuffle(pool).slice(0, 6);
    },
    identifyCost: 75,
  },

  weapon_smith: {
    key: 'weapon_smith',
    name: 'Gareth Ironhand, Smith',
    glyph: 0x21, color: '#cc4444',
    services: ['buy', 'sell', 'repair', 'enchant'],
    stock: ['short_sword', 'long_sword', 'hand_axe', 'battle_axe', 'spear',
            'short_bow', 'long_bow', 'dagger', 'mace', 'flail', 'warhammer'],
    repairCost: (item) => Math.floor(item.value * 0.2),
    enchantCost: (item, bonus) => item.value * (bonus * 10),
  },

  guild_board: {
    key: 'guild_board',
    name: 'Adventurer's Guild Board',
    glyph: 0x3F, color: '#88aacc',
    services: ['view_quests', 'accept_quest', 'turn_in_quest'],
    activeQuests: [], // populated by QuestSystem
  },
};
