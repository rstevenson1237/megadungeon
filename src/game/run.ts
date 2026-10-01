// The run (Spec 02, "Seeds, determinism and persistence"; Spec 09): one run seed, where the
// player is in the 100 levels, and the deltas of every level visited. A level regenerates from
// the seed on each visit and its delta is replayed on top, so only the player's changes are kept.
// Task 1.9 built the surface village stub and in-memory deltas; task 2.2 adds the run layout, which
// places the subterranean villages and picks each level's theme and size; task 2.3 passes the theme's layout
// algorithm on to the generator. Saving comes with task 2.13.

import type { LogMessage } from '../core/log.ts';
import type { Spell } from '../core/schemas.ts';
import { type ItemData, disguisesFor } from '../rules/items/magic.ts';
import { generateLevel, PLAIN_STYLE, type LevelStyle } from '../rules/world/generate.ts';
import { MAX_DEPTH, type Level, type Point, type SizeClass } from '../rules/world/level.ts';
import type { LevelContents } from '../rules/world/placement/index.ts';
import type { RunLayout } from '../rules/world/run-layout.ts';
import { Game, type LevelDelta, type PlayerState } from './game.ts';
import { endBound } from '../rules/magic/status.ts';
import type { GameContent } from './content.ts';
import type { ItemCtx } from './items.ts';

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
  /** What a dungeon level holds (Spec 02, steps 4 to 11); without it a level is bare walls, floor and stairs. */
  contentsFor?: (depth: number) => LevelContents | undefined;
  /** Depths that are villages instead of levels; the surface only, unless a layout is given. */
  villages?: number[];
  /** The spell table, so the spells the player knows can be cast (Spec 04). */
  spells?: readonly Spell[];
  /** The item tables, so loot can be made into items (Spec 05). */
  items?: ItemData;
  /** The tables features roll from: traps, fountains, debris, gods, books, monsters (Spec 06). */
  content?: GameContent;
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
  private readonly spells: readonly Spell[];
  private readonly items: ItemData | undefined;
  private readonly content: GameContent | undefined;
  /** This run's look for each unidentified magic item (Spec 05). Derived from the tables and the seed. */
  readonly disguises: ReadonlyMap<string, string>;

  constructor(
    readonly runSeed: number,
    readonly player: PlayerState,
    options: RunOptions = {},
  ) {
    this.layout = options.layout;
    this.spells = options.spells ?? [];
    this.items = options.items;
    this.content = options.content;
    this.disguises = options.items ? disguisesFor(runSeed, options.items.magic.values(), options.items.disguiseNames) : new Map();
    this.villages = options.villages ?? [SURFACE, ...(options.layout?.villages.map((v) => v.level) ?? [])];
    const sizeFor = options.sizeFor ?? stubSize;
    const styleFor = options.styleFor ?? (() => PLAIN_STYLE);
    this.levelFor = options.levelFor ?? ((d) => generateLevel(runSeed, d, sizeFor(d), styleFor(d), options.contentsFor?.(d)));
    this.depth = options.startDepth ?? SURFACE;
    this.arrive(this.depth, 'down');
  }

  /** What the item actions need, from the run alone: usable in a village, where there is no level. */
  ctx(): ItemCtx {
    return { player: this.player, knowledge: { known: this.player.known, disguises: this.disguises }, spells: new Map(this.spells.map((sp) => [sp.id, sp])) };
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

  /** Leave the level being played: keep its delta, carry the round, and end what was bound to the level (Spec 06). */
  private leave(): void {
    if (this.game) {
      this.deltas[this.depth] = this.game.captureDelta();
      this.round = this.game.state.round;
    }
    endBound(this.player.statuses);
    this.round++;
  }

  /**
   * Take the stairs, or Go up and Go down in a village. Leaving a level keeps its delta; the
   * neighbouring level or village is then built, arriving on the stair that joins them.
   * Using stairs costs one round but the monsters do not act, and they stay where they were (Spec 04).
   * Once a level's lever is pulled its down stair leads to the landing of the collapsed passage (Spec 02).
   */
  travel(direction: 'up' | 'down'): LogMessage[] {
    if (!this.canTravel(direction)) return [{ kind: 'system', text: 'There is nowhere further that way.' }];
    const lever = direction === 'down' && this.game?.state.used.lever ? this.game.state.map.level.specials.find((s) => s.kind === 'lever') : undefined;
    this.leave();
    if (lever?.kind === 'lever') {
      this.depth = lever.landingLevel;
      this.arrive(this.depth, 'down', 'landing');
      return [{ kind: 'discovery', text: `The stair drops you through the collapsed passage to level ${this.depth}.` }];
    }
    this.depth += direction === 'down' ? 1 : -1;
    // Going down arrives on the new level's up stair; going up arrives on its down stair.
    this.arrive(this.depth, direction);
    return [{ kind: 'discovery', text: this.inVillage ? `You arrive in ${this.title}.` : `You ${direction === 'down' ? 'descend to' : 'climb to'} level ${this.depth}.` }];
  }

  /** A teleporter takes the player to the paired level's teleporter (Spec 02, task 2.10). */
  teleport(to: number): LogMessage[] {
    this.leave();
    this.depth = to;
    this.arrive(this.depth, 'down', 'teleporter');
    return [{ kind: 'discovery', text: `You step out of a teleporter on level ${this.depth}.` }];
  }

  /** A deep pit drops the player to the level below, at a random walkable cell (Spec 06). */
  fall(): LogMessage[] {
    this.leave();
    this.depth = Math.min(MAX_DEPTH, this.depth + 1);
    this.arrive(this.depth, 'down');
    this.game?.landAnywhere();
    return [{ kind: 'warning', text: `You land hard on level ${this.depth}.` }];
  }

  private arrive(depth: number, direction: 'up' | 'down', at?: 'teleporter' | 'landing'): void {
    if (this.villages.includes(depth)) {
      this.game = null;
      return;
    }
    const level = this.levelFor(depth);
    // A teleporter or a collapsed passage lands the player on its own cell of the level.
    const special = at ? level.specials.find((sp) => sp.kind === at) : undefined;
    const where: Point | undefined = special ? { x: special.x, y: special.y } : undefined;
    this.game = new Game(this.runSeed, level, this.player, {
      ...(where ? { at: where } : {}),
      stair: direction === 'down' ? 'up' : 'down',
      delta: this.deltas[depth],
      round: this.round,
      spells: this.spells,
      ...(this.items ? { items: this.items } : {}),
      ...(this.content ? { content: this.content } : {}),
    });
  }
}
