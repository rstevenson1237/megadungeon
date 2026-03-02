
/**
 * @typedef {Object} ClassDef
 * @property {string}   key
 * @property {string}   name
 * @property {string}   description
 * @property {string}   glyph           CP437 char code or literal
 * @property {string}   color
 * @property {number}   hitDie          d4, d6, d8, d10, d12
 * @property {boolean}  usesMP
 * @property {string}   castingStat     'int' | 'wis' | null
 * @property {number}   mpBase
 * @property {number[]} attackBonus     [0, per_level_bonus, ...]
 * @property {Object}   savingThrows    { death, wands, stone, breath, spells }
 * @property {string[]} armorAllowed    ['leather', 'chain', 'plate', 'shield']
 * @property {string[]} weaponsAllowed  ['simple', 'martial', 'all', 'bladed_only', ...]
 * @property {Object}   startingSkills  { skillKey: rank }
 * @property {string[]} startingSpells
 * @property {string[]} startingItems
 * @property {number}   startingGold
 * @property {number}   hpBonus
 * @property {Object}   abilitiesAtLevel { levelNum: [abilityKey, ...] }
 * @property {string[]} classFeatures   Descriptive list
 * @property {string[]} primeStat       Which stats are prime for this class
 */

export const CLASSES = {

  fighter: {
    key: 'fighter', name: 'Fighter', glyph: '@', color: '#cc4444',
    description: 'Masters of weapon and armor, fighters wade into any fray. Simple, deadly, and hard to kill.',
    hitDie: 10, usesMP: false, mpBase: 0, castingStat: null,
    attackBonus: [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10],
    savingThrows: { death: 12, wands: 13, stone: 14, breath: 15, spells: 16 },
    armorAllowed: ['leather', 'chain', 'plate', 'shield'],
    weaponsAllowed: ['all'],
    startingSkills: { athletics: 1, weapon_mastery: 1 },
    startingSpells: [],
    startingItems: ['short_sword', 'chain_mail', 'torch', 'ration', 'rope'],
    startingGold: 50,
    hpBonus: 2,
    abilitiesAtLevel: {
      2: ['combat_surge'],
      4: ['weapon_specialization'],
      6: ['extra_attack'],
      8: ['battle_cry'],
      10: ['legendary_strike'],
    },
    classFeatures: [
      'Combat Surge: Once per combat, deal double damage.',
      'Weapon Specialization: +2 attack and damage with chosen weapon type.',
      'Extra Attack: Attack twice per turn at level 6.',
      'Battle Cry: Inspire allies within 10 tiles, +1 to their attacks for 3 turns.',
      'Legendary Strike: Once per day, a guaranteed critical hit.',
    ],
    primeStat: ['str'],
  },

  thief: {
    key: 'thief', name: 'Thief', glyph: '@', color: '#888833',
    description: 'Nimble specialists in stealth, traps, and pilfering. Lethal from the shadows.',
    hitDie: 6, usesMP: false, mpBase: 0, castingStat: null,
    attackBonus: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
    savingThrows: { death: 13, wands: 14, stone: 13, breath: 16, spells: 15 },
    armorAllowed: ['leather', 'shield'],
    weaponsAllowed: ['simple', 'light_martial'],
    startingSkills: { stealth: 2, lockpicking: 2, trap_handling: 2, pickpocket: 1, climbing: 1 },
    startingSpells: [],
    startingItems: ['dagger', 'thieves_tools', 'leather_armor', 'torch', 'ration', 'rope'],
    startingGold: 40,
    hpBonus: 0,
    abilitiesAtLevel: {
      1: ['backstab'],
      3: ['evasion'],
      5: ['uncanny_dodge'],
      7: ['shadow_step'],
      9: ['master_of_shadows'],
    },
    classFeatures: [
      'Backstab: Attack from stealth for ×2 damage (increases every 4 levels, up to ×5).',
      'Evasion: When you pass a DEX saving throw, take no damage instead of half.',
      'Uncanny Dodge: Cannot be surprised; always act in first round of combat.',
      'Shadow Step: Teleport to any shadow within 20 tiles as a bonus action.',
      'Master of Shadows: Become invisible at will for up to 10 turns/day.',
    ],
    primeStat: ['dex'],
  },

  magic_user: {
    key: 'magic_user', name: 'Magic-User', glyph: '@', color: '#8844cc',
    description: 'Scholars of the arcane arts. Fragile but commanding forces beyond mortal reckoning.',
    hitDie: 4, usesMP: true, mpBase: 10, castingStat: 'int',
    attackBonus: [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6],
    savingThrows: { death: 13, wands: 14, stone: 13, breath: 16, spells: 15 },
    armorAllowed: [],
    weaponsAllowed: ['staff', 'dagger', 'dart'],
    startingSkills: { arcana: 2, scroll_use: 1 },
    startingSpells: ['magic_missile', 'light', 'sleep'],
    startingItems: ['staff', 'spellbook', 'inkpot', 'ration', 'torch'],
    startingGold: 25,
    hpBonus: -1,
    abilitiesAtLevel: {
      2: ['arcane_recovery'],
      4: ['spell_mastery'],
      6: ['metamagic_empower'],
      8: ['arcane_sight'],
      10: ['spell_echo'],
    },
    classFeatures: [
      'Arcane Recovery: Once per rest, recover up to half your MP.',
      'Spell Mastery: Choose two spells to cast without MP once per day each.',
      'Metamagic Empower: Spend extra MP to maximize a spell\'s damage dice.',
      'Arcane Sight: Permanently detect magic; see invisible creatures.',
      'Spell Echo: 30% chance a spell does not consume MP when cast.',
    ],
    primeStat: ['int'],
  },

  cleric: {
    key: 'cleric', name: 'Cleric', glyph: '@', color: '#cccc44',
    description: 'Champions of a divine power, balancing healing and warfare with holy authority.',
    hitDie: 8, usesMP: true, mpBase: 8, castingStat: 'wis',
    attackBonus: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9],
    savingThrows: { death: 11, wands: 12, stone: 14, breath: 16, spells: 15 },
    armorAllowed: ['leather', 'chain', 'plate', 'shield'],
    weaponsAllowed: ['blunt'], // Clerics use no edged weapons (BECMI rule)
    startingSkills: { divine_lore: 2, first_aid: 1 },
    startingSpells: ['cure_light_wounds', 'detect_evil', 'bless'],
    startingItems: ['mace', 'chain_mail', 'holy_symbol', 'torch', 'ration'],
    startingGold: 30,
    hpBonus: 1,
    abilitiesAtLevel: {
      1: ['turn_undead'],
      3: ['lay_on_hands'],
      5: ['divine_intervention'],
      7: ['aura_of_protection'],
      9: ['holy_word'],
    },
    classFeatures: [
      'Turn Undead: Force undead to flee or be destroyed by divine authority.',
      'Lay on Hands: Heal an ally or yourself for 2×level HP, once per combat.',
      'Divine Intervention: Once per day, call upon your deity for miraculous aid.',
      'Aura of Protection: Allies within 5 tiles gain +2 saving throws.',
      'Holy Word: Stun all non-believers within earshot for 3 turns.',
    ],
    primeStat: ['wis', 'str'],
  },

  ranger: {
    key: 'ranger', name: 'Ranger', glyph: '@', color: '#338833',
    description: 'Wilderness hunters equally at home in dungeon dark as in forest deep. Trackers and monster-slayers.',
    hitDie: 8, usesMP: false, mpBase: 0, castingStat: null,
    attackBonus: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10],
    savingThrows: { death: 12, wands: 13, stone: 14, breath: 15, spells: 16 },
    armorAllowed: ['leather', 'chain'],
    weaponsAllowed: ['all'],
    startingSkills: { tracking: 2, survival: 2, archery: 1, beast_lore: 1 },
    startingSpells: [],
    startingItems: ['short_bow', 'arrows_20', 'short_sword', 'leather_armor', 'torch', 'ration', 'rope'],
    startingGold: 40,
    hpBonus: 1,
    abilitiesAtLevel: {
      1: ['favored_enemy'],
      2: ['two_weapon_fighting'],
      4: ['woodland_stride'],
      6: ['quarry'],
      8: ['pinning_shot'],
      10: ['master_hunter'],
    },
    classFeatures: [
      'Favored Enemy: Choose a monster type; +2 attack/damage vs. them. Gain extra types at levels 5 and 10.',
      'Two-Weapon Fighting: Fight with two weapons, making two attacks per turn.',
      'Woodland Stride: Move at full speed through difficult terrain. Cannot be tracked.',
      'Quarry: Mark a target; gain advantage on attack rolls and tracking against them.',
      'Pinning Shot: Arrow can pin humanoids or flyers to surfaces, preventing movement.',
      'Master Hunter: Instantly identify any monster. Doubled XP from favored enemy kills.',
    ],
    primeStat: ['str', 'dex'],
  },

  paladin: {
    key: 'paladin', name: 'Paladin', glyph: '@', color: '#ffcc88',
    description: 'Holy warrior of absolute conviction. Powerful, but held to a sacred code of conduct.',
    hitDie: 10, usesMP: true, mpBase: 6, castingStat: 'wis',
    attackBonus: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10],
    savingThrows: { death: 10, wands: 11, stone: 12, breath: 13, spells: 14 },
    armorAllowed: ['leather', 'chain', 'plate', 'shield'],
    weaponsAllowed: ['all'],
    startingSkills: { divine_lore: 1, athletics: 1, persuasion: 1 },
    startingSpells: [],
    startingItems: ['long_sword', 'plate_mail', 'shield', 'holy_symbol', 'ration'],
    startingGold: 10, // Takes a vow of poverty — most gold given to temples
    hpBonus: 2,
    abilitiesAtLevel: {
      1: ['detect_evil', 'smite_evil'],
      3: ['divine_health', 'lay_on_hands'],
      5: ['holy_sword', 'aura_of_courage'],
      7: ['divine_spells'],
      9: ['holy_champion'],
    },
    classFeatures: [
      'Detect Evil: Sense evil creatures/objects within 60ft at will.',
      'Smite Evil: Spend MP to deal bonus holy damage on a successful attack.',
      'Divine Health: Immune to disease, fear, and charm effects.',
      'Lay on Hands: Heal HP equal to Paladin level, or cure one disease/poison.',
      'Aura of Courage: Allies within 10 tiles are immune to fear.',
      'Holy Champion: Once per day, become unkillable for 3 turns; any attack that would drop you to 0 HP leaves you at 1 HP instead.',
    ],
    primeStat: ['str', 'cha'],
    code: 'Paladins must remain lawful good. Breaking the code strips all class abilities until atonement at a temple.',
  },

  // Additional classes (all follow same structure):
  // druid, illusionist, bard, assassin, monk, warlock, necromancer, berserker
};
