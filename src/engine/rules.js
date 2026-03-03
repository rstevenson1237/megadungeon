
import { RNG } from './RNG.js';

// A default RNG for use when a seeded one is not available.
const rng = new RNG(Date.now());

/**
 * Rolls a single die with the given number of sides.
 * @param {number} sides The number of sides on the die.
 * @returns {number} A random number between 1 and sides.
 */
export function rollDie(sides) {
  return rng.int(1, sides);
}

/**
 * Calculates the D&D-style modifier for a given stat.
 * (stat - 10) / 2, rounded down.
 * @param {number} stat The stat value (e.g., 18).
 * @returns {number} The modifier (e.g., +4).
 */
export function statModifier(stat) {
  return Math.floor((stat - 10) / 2);
}

/**
 * Parses a dice string (e.g., '2d6+3') and returns the result.
 * @param {string} diceStr The dice string to roll.
 * @returns {number} The total result of the roll.
 */
export function rollDiceStr(diceStr) {
    const match = diceStr.match(/(\d+)?d(\d+)([+-]\d+)?/);
    if (!match) return 0;

    const numDice = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const mod = match[3] ? parseInt(match[3]) : 0;

    let total = 0;
    for (let i = 0; i < numDice; i++) {
        total += rollDie(sides);
    }
    return total + mod;
}

/**
 * The maximum level a player can attain.
 */
export const MAX_LEVEL = 20;

/**
 * XP required to reach the next level. Index is the current level.
 * e.g., XP_TABLE[1] is the XP needed to go from level 1 to 2.
 * Using a simple exponential growth for now.
 */
export const XP_TABLE = [
  0,       // Level 0
  0,       // Level 1 -> 2
  2000,    // Level 2 -> 3
  4000,    // Level 3 -> 4
  8000,    // Level 4 -> 5
  16000,   // Level 5 -> 6
  32000,   // Level 6 -> 7
  64000,   // Level 7 -> 8
  125000,  // Level 8 -> 9
  250000,  // Level 9 -> 10
  500000,  // Level 10 -> 11
  750000,  // Level 11 -> 12
  1000000, // Level 12 -> 13
  1250000, // Level 13 -> 14
  1500000, // Level 14 -> 15
  1750000, // Level 15 -> 16
  2000000, // Level 16 -> 17
  2250000, // Level 17 -> 18
  2500000, // Level 18 -> 19
  3000000, // Level 19 -> 20
];
