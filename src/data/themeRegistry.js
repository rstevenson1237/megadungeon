// src/data/themeRegistry.js
import { THEMES } from './themes.js';

/**
 * Returns a weighted-random theme for a given level number.
 * Any theme whose minDepth <= levelNumber <= maxDepth is eligible.
 * Falls back to the first registered theme if no match (should never happen
 * with correct minDepth/maxDepth values).
 *
 * @param {number} levelNumber
 * @param {RNG} rng
 * @returns {Object} theme object with .key set
 */
export function pickTheme(levelNumber, rng) {
  const eligible = Object.entries(THEMES)
    .filter(([, t]) => levelNumber >= t.minDepth && levelNumber <= t.maxDepth)
    .map(([key, t]) => ({ key, theme: t, weight: t.weight ?? 10 }));

  if (eligible.length === 0) {
    const fallbackKey = Object.keys(THEMES)[0];
    return { ...THEMES[fallbackKey], key: fallbackKey };
  }

  const picked = rng.weightedPick(eligible.map(e => ({ value: e, weight: e.weight })));
  return { ...picked.theme, key: picked.key };
}
