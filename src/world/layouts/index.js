// src/world/layouts/index.js
import { generate as bspRooms }      from './BspRooms.js';
import { generate as caveNetwork }   from './CaveNetwork.js';
import { generate as labyrinth }     from './Labyrinth.js';
import { generate as townRuin }      from './TownRuin.js';
import { generate as greatHall }     from './GreatHall.js';
import { generate as vaultNetwork }  from './VaultNetwork.js';
import { generate as riverCrossing } from './RiverCrossing.js';
import { generate as cryptRows }     from './CryptRows.js';
import { generate as delveShaft }    from './DelveShaft.js';
import { generate as voidLattice }   from './VoidLattice.js';
import { generate as finalDescent }  from './FinalDescent.js';

/**
 * Layout registry.
 * Each entry:
 *   key        — unique identifier
 *   generate   — layout function
 *   themeWeights — { themeKey: weight }. Themes not listed get weight 0 (never selected).
 *                  Use '*' as a key for a default weight applied to all unlisted themes.
 */
export const LAYOUTS = [
  {
    key: 'bsp_rooms',
    generate: bspRooms,
    themeWeights: { '*': 10 },
  },
  {
    key: 'cave_network',
    generate: caveNetwork,
    themeWeights: { goblin_warren: 20, elemental_grotto: 18, '*': 3 },
  },
  {
    key: 'labyrinth',
    generate: labyrinth,
    themeWeights: { catacomb: 15, void_passage: 12, '*': 4 },
  },
  {
    key: 'town_ruin',
    generate: townRuin,
    themeWeights: { dungeon_cellar: 12, dwarven_deep: 8, '*': 2 },
  },
  {
    key: 'great_hall',
    generate: greatHall,
    themeWeights: { dwarven_deep: 14, dungeon_cellar: 8, '*': 3 },
  },
  {
    key: 'vault_network',
    generate: vaultNetwork,
    themeWeights: { dwarven_deep: 18, '*': 3 },
  },
  {
    key: 'river_crossing',
    generate: riverCrossing,
    themeWeights: { elemental_grotto: 14, goblin_warren: 6, '*': 3 },
  },
  {
    key: 'crypt_rows',
    generate: cryptRows,
    themeWeights: { catacomb: 22, '*': 2 },
  },
  {
    key: 'delve_shaft',
    generate: delveShaft,
    themeWeights: { dwarven_deep: 20, '*': 2 },
  },
  {
    key: 'void_lattice',
    generate: voidLattice,
    themeWeights: { void_passage: 25, '*': 0 },
  },
  {
    key: 'final_descent',
    generate: finalDescent,
    themeWeights: { final_descent: 999, '*': 0 },
  },
];

/**
 * Picks a layout for the given theme using per-theme weights.
 * Layouts with weight 0 for this theme (or '*' = 0) are excluded.
 *
 * @param {string} themeKey
 * @param {RNG} rng
 * @returns {Object} layout entry from LAYOUTS
 */
export function pickLayout(themeKey, rng) {
  const candidates = LAYOUTS
    .map(layout => {
      const w = layout.themeWeights[themeKey] ?? layout.themeWeights['*'] ?? 0;
      return { layout, weight: w };
    })
    .filter(c => c.weight > 0);

  if (candidates.length === 0) {
    return LAYOUTS[0]; // bsp_rooms as fallback
  }
  return rng.weightedPick(candidates.map(c => ({ value: c.layout, weight: c.weight }))) ?? LAYOUTS[0];
}
