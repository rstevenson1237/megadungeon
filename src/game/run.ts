// The run (Spec 02, "Seeds, determinism and persistence"; Spec 09): one run seed, where the
// player is in the 100 levels, and the deltas of every level visited. A level regenerates from
// the seed on each visit and its delta is replayed on top, so only the player's changes are kept.
// Task 1.9 built the surface village stub and in-memory deltas; task 2.2 adds the run layout, which
// places the subterranean villages and picks each level's theme and size; task 2.3 passes the theme's layout
// algorithm on to the generator. Saving comes with task 2.13.

import type { LogMessage } from '../core/log.ts';
import { generateLevel, PLAIN_STYLE, type LevelStyle } from '../rules/world/generate.ts';
import { MAX_DEPTH, type Level, type SizeClass } from '../rules/world/level.ts';
import type { RunLayout } from '../rules/world/run-layout.ts';
import { Game, type LevelDelta, type PlayerState } from './game.ts';

/** The surface village sits above level 1. */
export const SURFACE = 0;

/** Stub: a theme picks the size class (Spec 02); until themes exist, sizes cycle with depth. */
export function stubSize(depth: number): SizeClass {
  return (['large', 'medium', 'small'] as const)[depth % 3]!;
}

export interface RunOptions {
  /** The run layout (Spec 02): its subterranean villages join the surface as the village depths. */
  layout?: RunLayout;
  /** Size class of a dungeon level, from its theme; without it sizes cycle with depth (stub). */
  sizeFor?: (depth: number) => SizeClass;
  /** Layout algorithm and variants of a dungeon level, from its theme; plain rooms and corridors when omitted. */
  styleFor?: (depth: number) => LevelStyle;
  /** Depths that are villages instead of levels; the surface only, unless a layout is given. */
  villages?: number[];
  /** Where the run starts: the surface village by default. */
  startDepth?: number;
  /** Supplies the level for a depth. Tests pass hand-built levels; the default generates from the seed. */
  levelFor?: (depth: number) => Level;
}

export class Run {
  readonly villages: readonly number[];
  readonly layout: RunLayout | undefined;
  readonly deltas: Record<number, LevelDelta> = {};
  depth: number;
  /** The level being played; null in a village, where there is no map (Spec 01). */
  game: Game | null = null;
  /** The run's round counter; a level's own counter takes over while it is being played. */
  round = 1;
  private readonly levelFor: (depth: number) => Level;

  constructor(
    readonly runSeed: number,
    readonly player: PlayerState,
    options: RunOptions = {},
  ) {
    this.layout = options.layout;
    this.villages = options.villages ?? [SURFACE, ...(options.layout?.villages.map((v) => v.level) ?? [])];
    const sizeFor = options.sizeFor ?? stubSize;
    const styleFor = options.styleFor ?? (() => PLAIN_STYLE);
    this.levelFor = options.levelFor ?? ((d) => generateLevel(runSeed, d, sizeFor(d), styleFor(d)));
    this.depth = options.startDepth ?? SURFACE;
    this.arrive(this.depth, 'down');
  }

  get inVillage(): boolean {
    return this.villages.includes(this.depth);
  }

  /** The main view's header (Spec 01): the village or the level and its depth. */
  get title(): string {
    if (this.depth === SURFACE) return 'Surface Village';
    if (!this.inVillage) return `Level ${this.depth}`;
    const name = this.layout?.villages.find((v) => v.level === this.depth)?.name;
    return name ? `${name}, Level ${this.depth}` : `Village, Level ${this.depth}`;
  }

  /** Whether the stairs or the village menu lead further in that direction. */
  canTravel(direction: 'up' | 'down'): boolean {
    return direction === 'up' ? this.depth > SURFACE : this.depth < MAX_DEPTH;
  }

  /**
   * Take the stairs, or Go up and Go down in a village. Leaving a level keeps its delta; the
   * neighbouring level or village is then built, arriving on the stair that joins them.
   * Using stairs costs one round but the monsters do not act, and they stay where they were (Spec 04).
   */
  travel(direction: 'up' | 'down'): LogMessage[] {
    if (!this.canTravel(direction)) return [{ kind: 'system', text: 'There is nowhere further that way.' }];
    if (this.game) {
      this.deltas[this.depth] = this.game.captureDelta();
      this.round = this.game.state.round;
    }
    this.round++;
    this.depth += direction === 'down' ? 1 : -1;
    // Going down arrives on the new level's up stair; going up arrives on its down stair.
    this.arrive(this.depth, direction);
    return [{ kind: 'discovery', text: this.inVillage ? `You arrive in ${this.title}.` : `You ${direction === 'down' ? 'descend to' : 'climb to'} level ${this.depth}.` }];
  }

  private arrive(depth: number, direction: 'up' | 'down'): void {
    if (this.villages.includes(depth)) {
      this.game = null;
      return;
    }
    this.game = new Game(this.runSeed, this.levelFor(depth), this.player, {
      stair: direction === 'down' ? 'up' : 'down',
      delta: this.deltas[depth],
      round: this.round,
    });
  }
}
