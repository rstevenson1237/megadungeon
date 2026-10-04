// The layout algorithms of Spec 02, "Level sizes and layouts": step 1 of the pipeline, "Carve".

import type { LayoutAlgorithm } from '../../../core/catalog.ts';
import type { Rng } from '../../../core/rng.ts';
import { FLOOR, WALL } from '../grid.ts';
import type { Rect } from '../level.ts';
import { carveRoomsAndCorridors } from '../rooms-and-corridors.ts';
import { carveCaves } from './caves.ts';
import { carveChannelGrid } from './channel.ts';
import type { Carved, LayoutStyle } from './common.ts';
import { carveDisjoint } from './disjoint.ts';
import { carveFreeform } from './freeform.ts';
import { carveMaze } from './maze.ts';
import { carveMirrored } from './mirrored.ts';
import { carveThrone } from './throne.ts';
import { carveWarren } from './warren.ts';

export { DEFAULT_STYLE, type Carved, type LayoutStyle } from './common.ts';

/** Rooms from 7 x 5 up get pillars in a pillared hall; smaller rooms stay bare. */
const PILLAR_MIN_W = 7;
const PILLAR_MIN_H = 5;

/**
 * Pillared halls (Spec 02, clarifications of task 2.3): isolated wall pillars two cells apart inside a
 * room, never touching its edge or one another, so every floor cell stays four-way connected.
 */
export function addPillars(cells: Uint8Array, width: number, rooms: readonly Rect[]): void {
  for (const r of rooms) {
    if (r.w < PILLAR_MIN_W || r.h < PILLAR_MIN_H) continue;
    for (let y = r.y + 2; y <= r.y + r.h - 3; y += 2) {
      for (let x = r.x + 2; x <= r.x + r.w - 3; x += 2) if (cells[y * width + x] === FLOOR) cells[y * width + x] = WALL;
    }
  }
}

/**
 * Carve one level's walls and floor with the named layout. `cells` is all wall on entry. Null when this
 * try came out unusable (too few rooms, too little cave), which sends generation to the next sub-seed.
 * The set piece (level 100) is the hand-authored throne template; generator versions before 6 ask for rooms
 * and corridors instead (see `generate.ts`).
 */
export function carveLayout(
  layout: LayoutAlgorithm,
  cells: Uint8Array,
  width: number,
  height: number,
  rng: Rng,
  style: LayoutStyle,
): Carved | null {
  switch (layout) {
    case 'mirrored_halls':
      return carveMirrored(cells, width, height, rng);
    case 'warren_tunnels':
      return carveWarren(cells, width, height, rng);
    case 'channel_grid':
      return carveChannelGrid(cells, width, height, rng, style);
    case 'cellular_caves':
      return carveCaves(cells, width, height, rng, style);
    case 'maze_with_crypts':
      return carveMaze(cells, width, height, rng);
    case 'freeform_chambers':
      return carveFreeform(cells, width, height, rng);
    case 'disjoint_rooms':
      return carveDisjoint(cells, width, height, rng);
    case 'set_piece':
      return carveThrone(cells, width, height, rng);
    case 'rooms_and_corridors': {
      const rooms = carveRoomsAndCorridors(cells, width, height, rng);
      if (style.pillared) addPillars(cells, width, rooms);
      return { rooms, looseStairs: false };
    }
  }
}
