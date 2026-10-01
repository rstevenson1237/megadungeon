// The generated level (Spec 02, "Level sizes and layouts"): a plain, serialisable
// object. The rules layer returns it; only the UI layer draws it.

import type { ContainerKind, FixtureKind, LayoutAlgorithm, NpcKind } from '../../core/catalog.ts';

export type SizeClass = 'small' | 'medium' | 'large';

/** Map cells per size class (Spec 02). */
export const LEVEL_SIZES: Record<SizeClass, { width: number; height: number }> = {
  small: { width: 70, height: 28 },
  medium: { width: 100, height: 44 },
  large: { width: 140, height: 60 },
};

/** Level 100 is the last level and has no down stair. */
export const MAX_DEPTH = 100;

/**
 * Version of the generator. Saved with the run so an older run keeps its old generator
 * (Spec 02). Bump it for any change that alters what a seed produces.
 */
export const GENERATOR_VERSION = 3;

/** One character per map cell in `Level.tiles`. */
export const TILE = {
  wall: '#',
  floor: '.',
  stairsUp: '<',
  stairsDown: '>',
  /** A normal door. Whether it is open is a level delta, not part of the generated tiles. */
  door: '+',
  /** Shallow water: walkable. */
  shallowWater: '~',
  /** Deep water: not walkable, never blocks sight; counts as wall for reachability. */
  deepWater: '=',
  /** Lava: not walkable, never blocks sight; counts as wall for reachability. */
  lava: '%',
} as const;

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Door kinds (Spec 02, step 4). A sealed door is a vault's: only its named key opens it (Spec 06). */
export type DoorKind = 'normal' | 'locked' | 'secret' | 'sealed';
export interface Door extends Point {
  kind: DoorKind;
}

/** What a container, a loose pile or a body holds (Spec 05, Spec 02 steps 5, 9 and 11). */
export type Loot =
  | { kind: 'coins'; amount: number }
  | { kind: 'gem' | 'jewelry'; id: string; name: string; value: number }
  | { kind: 'magic'; id: string; name: string }
  | { kind: 'book'; id: string }
  | { kind: 'weapon' }
  | { kind: 'key' }
  | { kind: 'vault_key'; link: string }
  | { kind: 'map_fragment'; link: string; mappedLevel: number }
  | { kind: 'quest_item'; quest: string; id: string; name: string };

/** Containers, fixtures and debris (Spec 02, step 6). */
export type Feature =
  | (Point & {
      type: 'container';
      kind: ContainerKind;
      contents: Loot[];
      /** Id of the container trap, hidden until found. */
      trap?: string;
      /** The cross-level link this container belongs to: a rival's stash or a lore chain's cache. */
      link?: string;
    })
  | (Point & { type: 'fixture'; kind: FixtureKind; god?: { id: string; name: string }; link?: string })
  | (Point & { type: 'debris' });

/** A loose pile on the floor (keys, dead-end treasure). */
export interface Pile extends Point {
  contents: Loot[];
}

/** A hidden floor trap (Spec 02, step 7). */
export interface FloorTrap extends Point {
  id: string;
}

export type MonsterRole = 'normal' | 'boss' | 'guard' | 'opponent';

/**
 * A monster as placed (Spec 02, step 8): everything the game needs to bring it to life, copied from its
 * table row, so a level never needs the content bundle to be played.
 */
export interface PlacedMonster extends Point {
  /** Table row id. */
  id: string;
  name: string;
  glyph: string;
  /** Colour name from the table. */
  colour: string;
  /** The rating's dice and modifier. */
  dice: number;
  modifier: number;
  speed: 'slow' | 'normal' | 'fast';
  behaviour: string;
  /** Monsters placed together share a group number. */
  group: number;
  role: MonsterRole;
  /** The quest whose goal this is (an opponent or a captive's guard). */
  quest?: string;
  /** A boss's artifact (Spec 02, Run layout) and whether it carries the lift token. */
  artifact?: { id: string; name: string };
  liftToken?: boolean;
}

export interface Npc extends Point {
  kind: NpcKind;
  name: string;
  quest?: string;
  link?: string;
  /** A rescued specialist's service (Spec 02, Connective elements). */
  service?: string;
}

/** Lore on a wall cell (Spec 02, step 10): graffiti, signs and rune-word letters. */
export interface LoreMark extends Point {
  kind: 'graffiti' | 'sign' | 'rune';
  /** Table row id. */
  id: string;
  text: string;
  link?: string;
  index?: number;
}

/** Things the run layout assigned to a level (Spec 02, step 11). */
export type Special =
  | (Point & { kind: 'teleporter'; to: number })
  | (Point & { kind: 'landing'; link: string })
  | (Point & { kind: 'lever'; link: string; landingLevel: number })
  | (Point & { kind: 'rune_altar'; link: string; word: string })
  | (Point & { kind: 'vault'; link: string; name: string; room: Rect });

/** Everything steps 4 to 11 of the pipeline place, as plain lists (Spec 02). */
export interface Placements {
  /** Every door, in scan order. */
  doors: Door[];
  features: Feature[];
  piles: Pile[];
  traps: FloorTrap[];
  monsters: PlacedMonster[];
  npcs: Npc[];
  lore: LoreMark[];
  specials: Special[];
}

export const emptyPlacements = (): Placements => ({
  doors: [],
  features: [],
  piles: [],
  traps: [],
  monsters: [],
  npcs: [],
  lore: [],
  specials: [],
});

export interface Level extends Placements {
  generatorVersion: number;
  runSeed: number;
  /** Level number, 1 to 100. */
  depth: number;
  size: SizeClass;
  /** The layout algorithm that carved it (the plain-rooms fallback reports rooms and corridors). */
  layout: LayoutAlgorithm;
  width: number;
  height: number;
  /** `height` rows of `width` characters from `TILE`. */
  tiles: string[];
  /** Rooms, or for layouts without literal rooms clearings of plain floor (Spec 02, task 2.3). */
  rooms: Rect[];
  upStair: Point;
  /** Null on level 100. */
  downStair: Point | null;
  /** Generation tries used (1 to 20, or 20 when the fallback was needed). */
  attempts: number;
  /** True when 20 tries failed validation and the plain-rooms fallback was used. */
  fallback: boolean;
}
