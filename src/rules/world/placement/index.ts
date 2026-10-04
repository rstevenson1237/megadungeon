// The placement pipeline (Spec 02, "Generation pipeline", steps 4 to 11): doors, keys, features, traps,
// monsters, treasure, NPCs and lore, and the specials the run layout assigned. Step 12, validation, is
// `findProblems` in validate.ts; a try that fails it, or leaves a required piece unplaced, moves to the
// next sub-seed (see generate.ts).

import type { Rng } from '../../../core/rng.ts';
import { emptyPlacements, type Placements, type Point, type Rect, type SizeClass } from '../level.ts';
import { Board, findEntrances } from './board.ts';
import {
  placeFeatures,
  placeLore,
  placeMonsters,
  placeNpcs,
  placeTraps,
  dealTreasure,
  type Ctx,
} from './contents.ts';
import { carveVault, pickBossRoom, placeDoors, placeKeys, sealVault } from './doors.ts';
import type { LevelContents } from './plan.ts';
import { placeSpecials, solidPieces, takesParcel, type Built } from './specials.ts';

export type { LevelContents, LevelPlan, PlacementContent, PlacementTheme } from './plan.ts';
export { planLevel } from './plan.ts';

const centreOfRoom = (r: Rect): Point => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });

export interface PlacementInput {
  /** The working cells, mutated: doors are written into them. */
  cells: Uint8Array;
  width: number;
  height: number;
  rooms: readonly Rect[];
  up: Point;
  down: Point | null;
  size: SizeClass;
  depth: number;
  /** False for layouts whose rooms are clearings in caves: they get no doors (Spec 02, task 2.4). */
  literalRooms: boolean;
  /** The set piece fixes the boss's room (an index into `rooms`) instead of leaving it to the farthest-room rule. */
  bossRoom?: number;
  contents: LevelContents;
  /** The stream for each placement step, by step number 4 to 11 (Spec 02, Addendum A). */
  steps: (step: number) => Rng;
  /** When set, a required piece that finds no place fails the try (returns null). */
  strict: boolean;
}

/**
 * Run steps 4 to 11 on a level whose cells hold walls, floor, liquids and stairs. Returns the placements and
 * the rooms (a bolted-on vault adds one), or null in strict mode when something required would not fit.
 */
export function placeContents(input: PlacementInput): { placements: Placements; rooms: Rect[] } | null {
  const { cells, width, height, steps, strict } = input;
  const { content, plan } = input.contents;
  const b = new Board(cells, width, height, input.rooms, input.up, input.down);
  if (input.bossRoom !== undefined) b.goal = centreOfRoom(b.rooms[input.bossRoom]!);
  const base = { b, plan, content, size: input.size, depth: input.depth };
  const at = (step: number): Ctx => ({ ...base, rng: steps(step) });
  const placements = emptyPlacements();
  let missing = 0;

  // Step 4: doors.
  if (input.literalRooms) {
    b.entrances = findEntrances(b);
    placements.doors = placeDoors(b, plan.theme, steps(4));
  }

  // The two rooms the generic steps leave alone. The vault is a special, so it draws from step 11's stream.
  const bossRoom = plan.boss ? (input.bossRoom ?? pickBossRoom(b)) : undefined;
  if (bossRoom !== undefined) b.reserved.add(bossRoom);
  let vaultRoom: number | undefined;
  if (plan.pieces.some((p) => p.kind === 'vault')) {
    vaultRoom = sealVault(b, placements.doors, bossRoom, steps(11)) ?? carveVault(b, placements.doors, steps(11));
    if (vaultRoom !== undefined) {
      b.reserved.add(vaultRoom);
      b.sealed.add(vaultRoom);
    }
  }
  placements.doors.sort((p, q) => p.y - q.y || p.x - q.x);

  // Step 5: keys.
  const keys = placeKeys(b, placements.doors, steps(5));
  missing += keys.missing;
  placements.piles.push(...keys.piles);

  const open = b.openDistances();
  const noSecret = b.noSecretDistances();

  // Hold the spots the blockers of step 11 will need, then run steps 6 to 10 around them.
  const held = b.hold(solidPieces(plan), steps(11), open);

  // Steps 6 to 10.
  const features = placeFeatures(at(6));
  placements.traps = placeTraps(at(7));
  placements.monsters = placeMonsters(at(8));
  const extraCount = plan.pieces.filter(takesParcel).length;
  const treasure = dealTreasure(at(9), features, open, extraCount);
  placements.piles.push(...treasure.piles);
  const people = at(10);
  placements.npcs = placeNpcs(people);
  const landmarks: Point[] = [input.up];
  if (input.down) landmarks.push(input.down);
  if (bossRoom !== undefined) landmarks.push({ x: b.rooms[bossRoom]!.x, y: b.rooms[bossRoom]!.y });
  const vaultDoor = placements.doors.find((d) => d.kind === 'sealed');
  if (vaultDoor) landmarks.push(vaultDoor);
  placements.lore = placeLore(people, landmarks);
  placements.features = features;

  // Step 11: specials.
  b.release(held);
  const built: Built = placements;
  missing += placeSpecials(at(11), built, { open, noSecret, bossRoom, vaultRoom, extras: treasure.extras });

  if (strict && missing > 0) return null;
  return { placements, rooms: b.rooms };
}
