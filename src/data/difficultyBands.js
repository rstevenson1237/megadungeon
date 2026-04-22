// src/data/difficultyBands.js

/**
 * Each band covers a range of levels [minLevel, maxLevel] inclusive.
 * Fields:
 *   name          — display label (used in ambient messages and debug)
 *   minLevel      — first level in band
 *   maxLevel      — last level in band (use 99 for the last playable band)
 *   monsterHD     — [min, max] hit dice for monster spawns
 *   trapWeight    — additive weight bonus on top of RoomGen base trap weight
 *   lootTier      — string key used by item/loot tables
 *   specialRooms  — array of room category keys that are unlocked at this tier
 *   bossEvery     — if set, a boss room is guaranteed every N levels in this band
 */
export const DIFFICULTY_BANDS = [
  { name: 'Novice',     minLevel: 1,  maxLevel: 10, monsterHD: [1,3],  trapWeight: 0,  lootTier: 'common',       specialRooms: [],                bossEvery: null },
  { name: 'Perilous',   minLevel: 11, maxLevel: 20, monsterHD: [2,5],  trapWeight: 2,  lootTier: 'uncommon',     specialRooms: ['miniboss'],      bossEvery: 15   },
  { name: 'Deadly',     minLevel: 21, maxLevel: 30, monsterHD: [4,7],  trapWeight: 4,  lootTier: 'uncommon',     specialRooms: [],                bossEvery: null },
  { name: 'Harrowing',  minLevel: 31, maxLevel: 40, monsterHD: [6,9],  trapWeight: 6,  lootTier: 'rare',         specialRooms: ['named_unique'],  bossEvery: null },
  { name: 'Ruinous',    minLevel: 41, maxLevel: 50, monsterHD: [8,12], trapWeight: 8,  lootTier: 'rare',         specialRooms: [],                bossEvery: null },
  { name: 'Doomed',     minLevel: 51, maxLevel: 60, monsterHD: [10,14],trapWeight: 10, lootTier: 'legendary',    specialRooms: ['cursed_room'],   bossEvery: null },
  { name: 'Infernal',   minLevel: 61, maxLevel: 70, monsterHD: [12,18],trapWeight: 12, lootTier: 'legendary',    specialRooms: [],                bossEvery: null },
  { name: 'Abyssal',    minLevel: 71, maxLevel: 80, monsterHD: [15,22],trapWeight: 14, lootTier: 'artifact',     specialRooms: ['void_zone'],     bossEvery: null },
  { name: 'Void',       minLevel: 81, maxLevel: 90, monsterHD: [20,28],trapWeight: 16, lootTier: 'artifact',     specialRooms: [],                bossEvery: null },
  { name: 'Mythic',     minLevel: 91, maxLevel: 99, monsterHD: [25,35],trapWeight: 20, lootTier: 'artifact_plus',specialRooms: ['boss_gate'],     bossEvery: 95   },
];

/**
 * Returns the difficulty band object for a given level number.
 * Returns the last band if levelNumber exceeds all defined maxLevels.
 */
export function getBand(levelNumber) {
  return (
    DIFFICULTY_BANDS.find(b => levelNumber >= b.minLevel && levelNumber <= b.maxLevel)
    ?? DIFFICULTY_BANDS[DIFFICULTY_BANDS.length - 1]
  );
}
