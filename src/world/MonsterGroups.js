import { MONSTERS } from '../data/monsters.js';
import { getBand } from '../data/difficultyBands.js';

export class MonsterGroups {
  /**
   * Returns a monster group appropriate to the level and theme.
   * Group size scales with difficulty band.
   * Monster HD is constrained to the band's [monsterHD[0], monsterHD[1]] range.
   */
  static roll(levelNumber, theme, rng) {
    const band = getBand(levelNumber);
    const [minHD, maxHD] = band.monsterHD;

    // Filter theme's monsterWeights to monsters within HD range
    let eligible = Object.entries(theme.monsterWeights)
      .filter(([key]) => {
        const def = MONSTERS[key];
        if (!def) return false;
        return def.hd >= minHD && def.hd <= maxHD + 2;  // +2 tolerance
      });

    if (eligible.length === 0) {
      // Fallback: pick any monster from theme regardless of HD
      eligible = Object.entries(theme.monsterWeights);
    }

    const totalWeight = eligible.reduce((s, [, w]) => s + w, 0);
    let roll = rng.int(1, totalWeight);
    let chosenKey = eligible[0][0];
    for (const [key, w] of eligible) {
      roll -= w;
      if (roll <= 0) { chosenKey = key; break; }
    }

    // Group size: 1 at Novice, up to 5+ at Mythic
    const groupSize = rng.int(1, 1 + Math.floor(band.trapWeight / 3));
    const members = Array.from({ length: groupSize }, () => ({ type: chosenKey }));
    const treasureChance = 0.2 + (band.trapWeight * 0.02);

    return { members, treasureChance };
  }
}
