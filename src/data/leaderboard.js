// src/data/leaderboard.js

const STORAGE_KEY = 'megadungeon_leaderboard_v1';
const MAX_ENTRIES = 100;

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} name           — character name
 * @property {string} characterClass — class key
 * @property {number} score          — computed score
 * @property {number} deepestDeath   — deepest level reached before final run
 * @property {number} runTimeMs      — milliseconds from new game to victory
 * @property {string} seed           — world seed for this run
 * @property {string} date           — ISO date string
 */

/**
 * Computes a score from run statistics.
 * Score = (level * 1000) + (gold * 2) + (monstersKilled * 50) - (deathCount * 500)
 */
export function computeScore({ level, gold, monstersKilled, deathCount }) {
  return Math.max(0,
    level          * 1000 +
    gold           * 2    +
    monstersKilled * 50   -
    deathCount     * 500
  );
}

/** Returns all entries sorted by score descending. */
export function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** Inserts a new entry, trims to MAX_ENTRIES, and saves. */
export function recordVictory(entry) {
  const board = getLeaderboard();
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Leaderboard save failed (storage full?):', e);
  }
  return trimmed;
}

/** Clears the leaderboard entirely. */
export function clearLeaderboard() {
  localStorage.removeItem(STORAGE_KEY);
}
