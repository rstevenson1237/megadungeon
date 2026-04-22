import { SPELLS } from './spells.js';

/**
 * The town has a fixed set of locations with procedurally varying stock and NPCs.
 * Town state persists across dungeon runs within the same world seed.
 */
function generateRumors(worldState) {
    const depth = worldState?.deepestLevel ?? 1;
    const quests = worldState?.guild_board_quests ?? [];
    const pool = [
      `They say level ${depth + 1} is crawling with something worse than goblins. Go prepared.`,
      `A merchant was lost near level ${Math.max(1, depth - 1)}. Brave soul.`,
      `The deeper you go, the more the walls whisper.`,
      `Old Kern found a cache of gold on level ${depth}. Didn't make it back.`,
      `Whatever you do, don't split the party.`,
      `I heard trolls regenerate unless you hit them with fire or acid.`,
      `The void levels — they say the walls breathe there.`,
      `A wight's touch drains the very life from your body. Permanently.`,
      `Golems don't sleep and don't feel pain. Magic mostly bounces right off 'em.`,
      `Someone claimed level ${Math.min(depth + 2, 100)} has a dragon. I didn't believe them either.`,
      `There's a smith in town who can make your blade sharper than it ever was. Worth the coin.`,
      `The temple priests can restore what the undead take from you. Costs a fortune, but it works.`,
      `You can learn spells at Mira's shop. She charges through the nose, but they're real.`,
      `Never fight a ghost with an iron blade. You may as well spit at it.`,
      `I saw a survivor come back from level ${depth}. She didn't speak for three days.`,
      `Hire yourself a henchman at the inn before you go down. Cheap insurance.`,
      `Poison from a giant spider lingers. The temple can fix it, but not for free.`,
      `Skeletons feel no fear. Don't bother trying to scare them off.`,
      `The barkeep says someone brought back a map to level ${Math.max(1, depth - 2)}. Sold it for a hundred gold.`,
      `If you can't see it, it can still see you. The dark things down there have other senses.`,
    ];
    if (quests.length > 0) {
      pool.push(`The guild is offering good coin for clearing level ${quests[0]?.targetDepth ?? depth}.`);
    }
    return pool;
}

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
    name: 'Aldric\'s Provisions',
    glyph: 0x24, color: '#ccaa44',
    services: ['buy', 'sell'],
    stock: ['torch', 'ration', 'rope', 'arrows_20', 'thieves_tools', 'inkpot'],
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
    name: 'Mira\'s Curiosities & Curios',
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
    stock: ['short_sword', 'long_sword', 'dagger', 'mace', 'staff', 'short_bow'],
    buyMarkup:  1.5,
    sellMarkup: 0.4,
    repairCost: (item) => Math.floor(item.value * 0.2),
    enchantCost: (item, bonus) => item.value * (bonus * 10),
  },

  guild_board: {
    key: 'guild_board',
    name: 'Adventurer\'s Guild Board',
    glyph: 0x3F, color: '#88aacc',
    services: ['view_quests', 'accept_quest', 'turn_in_quest'],
    activeQuests: [], // populated by QuestSystem
  },
};

export const createInitialTownState = () => {
    return {
        name: "Homestead",
        locations: Object.keys(TOWN_LOCATIONS),
        // Future: Add state for merchants, quests etc. that can change
    };
};
