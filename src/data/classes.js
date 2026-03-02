
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
};
