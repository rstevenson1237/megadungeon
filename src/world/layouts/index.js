// src/world/layouts/index.js

/**
 * Layout registry. Add entries here as layout modules are implemented.
 *
 * Each entry:
 *   generate      — function(map, rng, theme, levelNumber) → Room[]
 *   defaultWeight — base selection weight when theme provides no override
 *   minDepth      — first level this layout is eligible on
 *   maxDepth      — last level this layout is eligible on (Infinity = no cap)
 *
 * Room shape returned by every generate():
 *   { x, y, w, h, type: 'normal', content: null, explored: false, id: number }
 *
 * @type {Object.<string, { generate: Function, defaultWeight: number, minDepth: number, maxDepth: number }>}
 */
export const LAYOUTS = {
  // Populated in subsequent steps (BSP, Arena, Linear, Cavern, …)
};

/**
 * Selects a layout generator for the given theme and level number.
 *
 * Selection weight for each candidate:
 *   theme.layoutWeights[key] if present, otherwise layout.defaultWeight.
 * Entries with weight 0 are excluded, allowing themes to suppress layouts.
 *
 * Falls back to the first registered layout if no entry is eligible for
 * levelNumber — logs a warning so depth-range gaps are visible in dev.
 *
 * @param {Object} theme        — full theme object (may contain layoutWeights)
 * @param {number} levelNumber
 * @param {RNG}    rng
 * @returns {Function}          — generate(map, rng, theme, levelNumber) → Room[]
 */
export function pickLayout(theme, levelNumber, rng) {
  const candidates = Object.entries(LAYOUTS)
    .filter(([, l]) => levelNumber >= l.minDepth && levelNumber <= l.maxDepth)
    .map(([key, l]) => ({
      value:  key,
      weight: theme.layoutWeights?.[key] ?? l.defaultWeight,
    }))
    .filter(c => c.weight > 0);

  if (candidates.length === 0) {
    const fallbackKey = Object.keys(LAYOUTS)[0];
    if (!fallbackKey) throw new Error('pickLayout: no layouts registered');
    console.warn(`pickLayout: no layout eligible for depth ${levelNumber}, falling back to '${fallbackKey}'`);
    return LAYOUTS[fallbackKey].generate;
  }

  const key = rng.weightedPick(candidates);
  return LAYOUTS[key].generate;
}
