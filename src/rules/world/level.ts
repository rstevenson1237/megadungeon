// The generated level (Spec 02, "Level sizes and layouts"): a plain, serialisable
// object. The rules layer returns it; only the UI layer draws it.

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
export const GENERATOR_VERSION = 1;

/** One character per map cell in `Level.tiles`. */
export const TILE = {
  wall: '#',
  floor: '.',
  stairsUp: '<',
  stairsDown: '>',
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

export interface Level {
  generatorVersion: number;
  runSeed: number;
  /** Level number, 1 to 100. */
  depth: number;
  size: SizeClass;
  width: number;
  height: number;
  /** `height` rows of `width` characters from `TILE`. */
  tiles: string[];
  rooms: Rect[];
  upStair: Point;
  /** Null on level 100. */
  downStair: Point | null;
  /** Generation tries used (1 to 20, or 20 when the fallback was needed). */
  attempts: number;
  /** True when 20 tries failed validation and the plain-rooms fallback was used. */
  fallback: boolean;
}
