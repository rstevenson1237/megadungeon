// Targeting (Spec 01, "Targeting"): starts on the closest valid target, Tab and Shift+Tab
// cycle, Enter confirms, Esc cancels with no turn spent. Targeting is a free action.

import { bearingFromNorth, distanceCells, distanceSq, lineCells, squareFootprint } from '../rules/world/geometry.ts';
import type { Point } from '../rules/world/level.ts';
import type { Game } from './game.ts';
import { isClear } from './map-state.ts';
import type { Monster } from './monsters.ts';

/** What a targeted action reaches: one creature, or a square footprint around the chosen cell. */
export type TargetShape = { kind: 'single' } | { kind: 'area'; size: 3 | 5 };

export interface TargetSpec {
  /** Range in cells, straight-line. */
  range: number;
  shape: TargetShape;
}

/**
 * Valid targets (Spec 01 and 04): visible, within range, with a clear line of fire (no wall,
 * closed door or other creature on the way; water and lava do not block it). Sorted by distance, ties broken clockwise from north.
 */
export function validTargets(game: Game, range: number, allow: (m: Monster) => boolean = () => true): Monster[] {
  const { map } = game.state;
  const from = map.player;
  const { width } = map.level;
  const clear = (m: Monster): boolean =>
    lineCells(from, m)
      .slice(0, -1)
      .every((c) => isClear(map, c.x, c.y) && !game.monsterAt(c.x, c.y));
  return game.state.monsters
    .filter((m) => map.visible[m.y * width + m.x] === 1 && distanceSq(from, m) <= range * range && allow(m) && clear(m))
    .sort((a, b) => distanceSq(from, a) - distanceSq(from, b) || bearingFromNorth(from, a) - bearingFromNorth(from, b));
}

export class Targeting {
  index = 0;

  constructor(
    private readonly game: Game,
    readonly spec: TargetSpec,
    readonly targets: Monster[],
  ) {}

  get selected(): Monster {
    return this.targets[this.index]!;
  }

  /** Tab: the next target, wrapping at the end. */
  next(): void {
    this.index = (this.index + 1) % this.targets.length;
  }

  /** Shift+Tab: the previous target, wrapping at the start. */
  prev(): void {
    this.index = (this.index - 1 + this.targets.length) % this.targets.length;
  }

  /** The path from the player to the selected target, drawn as dim dots: both ends left out. */
  path(): Point[] {
    return lineCells(this.game.state.map.player, this.selected).slice(0, -1);
  }

  /** Every cell of the area footprint around the selected target, or none for a single target. */
  footprint(): Point[] {
    if (this.spec.shape.kind !== 'area') return [];
    const { width, height } = this.game.state.map.level;
    return squareFootprint(this.selected, this.spec.shape.size).filter((c) => c.x >= 0 && c.y >= 0 && c.x < width && c.y < height);
  }

  /** Monsters inside the footprint, which the preview marks. Empty for a single target. */
  marked(): Monster[] {
    const cells = this.footprint();
    return this.game.state.monsters.filter((m) => cells.some((c) => c.x === m.x && c.y === m.y));
  }

  /** Whether the player stands in the footprint, so a targeted area spell would hit the caster too (Spec 04). */
  includesPlayer(): boolean {
    const p = this.game.state.map.player;
    return this.footprint().some((c) => c.x === p.x && c.y === p.y);
  }

  /** The Target block of the character pane (Spec 01). */
  paneTarget(rating: string): { name: string; rating: string; distance: number; index: number; count: number } {
    return {
      name: this.selected.name,
      rating,
      distance: distanceCells(this.game.state.map.player, this.selected),
      index: this.index + 1,
      count: this.targets.length,
    };
  }
}

/** Start targeting on the closest valid target, or null when there is none (the caller logs it; no turn is spent). */
export function startTargeting(game: Game, spec: TargetSpec, allow?: (m: Monster) => boolean): Targeting | null {
  const targets = validTargets(game, spec.range, allow);
  return targets.length === 0 ? null : new Targeting(game, spec, targets);
}

/**
 * Choosing a cell rather than a creature (Blink, Spec 04, task 2.8): a cursor that starts on the caster and
 * moves one cell at a time, with the cells that would be valid listed so the view can tint them.
 */
export class CellCursor {
  at: Point;

  constructor(
    private readonly game: Game,
    /** Whether a cell is a valid destination. */
    private readonly valid: (at: Point) => boolean,
    /** Every valid destination, for the preview. */
    readonly cells: readonly Point[],
  ) {
    this.at = { ...game.state.map.player };
  }

  /** Move the cursor one cell, staying on the map. */
  move(dx: number, dy: number): void {
    const { width, height } = this.game.state.map.level;
    this.at = { x: Math.max(0, Math.min(width - 1, this.at.x + dx)), y: Math.max(0, Math.min(height - 1, this.at.y + dy)) };
  }

  /** Whether the cursor stands on a valid destination. */
  get ok(): boolean {
    return this.valid(this.at);
  }
}
