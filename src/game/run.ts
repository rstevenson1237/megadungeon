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
import { GENERATOR_VERSION, MAX_DEPTH, type Level, type Point, type SizeClass } from '../rules/world/level.ts';
import type { LevelContents } from '../rules/world/placement/index.ts';
import type { RunLayout } from '../rules/world/run-layout.ts';
import { Game, type LevelDelta, type PlayerState } from './game.ts';
import { endBound } from '../rules/magic/status.ts';
import { type Character, type ClassDef } from '../rules/character/character.ts';
import type { PoolName, Step } from '../rules/character/dice.ts';
import { levelUp, levelsOwed, type LevelUp } from '../rules/character/progression.ts';
import { type GameContent, noContent } from './content.ts';
import type { ItemCtx } from './items.ts';
import { Town } from './town.ts';
import { bindDrawn, knownIds } from './abilities.ts';
import { rivalsLeave } from './connective.ts';

/** The surface village sits above level 1. */
export const SURFACE = 0;

/** Stub: a theme picks the size class (Spec 02); until themes exist, sizes cycle with depth. */
export function stubSize(depth: number): SizeClass {
  return (['large', 'medium', 'small'] as const)[depth % 3]!;
}

/** What a level's theme gives the screen: its name, and the palette and tiles its map draws in. */
export interface RunTheme {
  name: string;
  palette?: Record<string, string> | undefined;
  tiles?: { wall: number; floor: number } | undefined;
}

export interface RunOptions {
  /** The run layout (Spec 02): its subterranean villages join the surface as the village depths. */
  layout?: RunLayout;
  /** Size class of a dungeon level, from its theme; without it sizes cycle with depth (stub). */
  sizeFor?: (depth: number) => SizeClass;
  /** The theme of a dungeon level: its name for the header, and its palette and tiles for the map (Spec 01, Spec 08). */
  themeFor?: (depth: number) => RunTheme | undefined;
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
  /** The character's class, so deposits can level the player up (Spec 03); without it XP is not tracked. */
  classDef?: ClassDef;
  /** Where the run starts: the surface village by default. */
  startDepth?: number;
  /** A saved run's level deltas and round counter (Spec 09). */
  deltas?: Record<number, LevelDelta>;
  round?: number;
  /** Who is playing and whether the seed is the seed of the day (a date), for the leaderboard (Spec 09). */
  characterId?: string;
  daily?: string;
  /** The generator version the run's levels are built with: the current one for a new run, the saved one on a load (Spec 02). */
  generator?: number;
  /** Supplies the level for a depth. Tests pass hand-built levels; the default generates from the seed. */
  levelFor?: (depth: number) => Level;
}

export class Run {
  readonly villages: readonly number[];
  readonly layout: RunLayout | undefined;
  readonly deltas: Record<number, LevelDelta>;
  /** The id the leaderboard knows this character by, and the date if the seed is the seed of the day. */
  readonly characterId: string;
  readonly daily: string | undefined;
  /** The generator version this run's levels are built with, kept for the whole run (Spec 02). */
  readonly generator: number;
  depth: number;
  /** The level being played; null in a village, where there is no map (Spec 01). */
  game: Game | null = null;
  /** The run's round counter; a level's own counter takes over while it is being played. */
  round = 1;
  private readonly levelFor: (depth: number) => Level;
  private readonly spells: readonly Spell[];
  private readonly items: ItemData | undefined;
  private readonly content: GameContent | undefined;
  private readonly themeFor: ((depth: number) => RunTheme | undefined) | undefined;
  private readonly contentsFor: ((depth: number) => LevelContents | undefined) | undefined;
  private readonly peeked = new Map<number, Level>();
  /** What the villages did on arrival, until the shell has shown it. */
  private arrivals: LogMessage[] = [];
  readonly classDef: ClassDef | undefined;
  /** The village services, shops, quests and the lift (Spec 07). */
  readonly town: Town;
  /** Called after a village rest, the only time the game is saved (Spec 09). */
  onRest: (() => void) | undefined;
  /** This run's look for each unidentified magic item (Spec 05). Derived from the tables and the seed. */
  readonly disguises: ReadonlyMap<string, string>;

  constructor(
    readonly runSeed: number,
    readonly player: PlayerState,
    options: RunOptions = {},
  ) {
    this.deltas = options.deltas ?? {};
    this.round = options.round ?? 1;
    this.characterId = options.characterId ?? `${runSeed >>> 0}`;
    this.daily = options.daily;
    this.generator = options.generator ?? GENERATOR_VERSION;
    this.layout = options.layout;
    this.contentsFor = options.contentsFor;
    this.themeFor = options.themeFor;
    this.spells = options.spells ?? [];
    this.items = options.items;
    this.content = options.content;
    this.disguises = options.items ? disguisesFor(runSeed, options.items.magic.values(), options.items.disguiseNames) : new Map();
    this.villages = options.villages ?? [SURFACE, ...(options.layout?.villages.map((v) => v.level) ?? [])];
    const sizeFor = options.sizeFor ?? stubSize;
    const styleFor = options.styleFor ?? (() => PLAIN_STYLE);
    this.levelFor = options.levelFor ?? ((d) => generateLevel(runSeed, d, sizeFor(d), styleFor(d), options.contentsFor?.(d), this.generator));
    this.depth = options.startDepth ?? SURFACE;
    this.classDef = options.classDef;
    this.town = new Town(this);
    this.arrive(this.depth, 'down');
  }

  get spellList(): readonly Spell[] {
    return this.spells;
  }

  get itemData(): ItemData | undefined {
    return this.items;
  }

  get gameContent(): GameContent {
    return this.content ?? noContent();
  }

  /** What a level of the run holds, generated once for the questions the villages ask (quests, rumours); never the level being played. */
  peek(depth: number): Level {
    let level = this.peeked.get(depth);
    if (!level) this.peeked.set(depth, (level = this.levelFor(depth)));
    return level;
  }

  /** The plan the run layout made for a level: its quest goals and pieces (Spec 02). */
  planOf(depth: number): LevelContents['plan'] | undefined {
    return this.contentsFor?.(depth)?.plan;
  }

  /** What the villages said on arriving, taken once. */
  takeArrivals(): LogMessage[] {
    const out = this.arrivals;
    this.arrivals = [];
    return out;
  }

  /** Level ups owed after banking: one screen per level crossed (Spec 03). Zero when the run has no class. */
  get levelsOwed(): number {
    return this.classDef ? levelsOwed(this.character) : 0;
  }

  /** The character's rules state (Spec 03): the player itself, the one record of pools, level, XP and abilities. */
  get character(): Character {
    return this.player;
  }

  /** Apply the next level up with the new die going to `pool` (Spec 03). A Pack Mule drawn grows the pack at once, as its size is computed. */
  levelUp(pool: PoolName): LevelUp | null {
    if (!this.classDef) return null;
    const result = levelUp(this.runSeed, this.player, this.classDef, pool);
    // A Weapon Master drawn takes the weapon wielded now, or the next one wielded (Spec 03, Addendum A).
    if (result?.minor) bindDrawn(this.player, result.minor, this.gameContent.minors);
    return result;
  }

  /** What the item actions need, from the run alone: usable in a village, where there is no level. */
  ctx(): ItemCtx {
    return {
      player: this.player,
      knowledge: { known: knownIds(this.player, this.items?.magic.values() ?? []), disguises: this.disguises },
      spells: new Map(this.spells.map((sp) => [sp.id, sp])),
      minors: this.gameContent.minors,
    };
  }

  get inVillage(): boolean {
    return this.villages.includes(this.depth);
  }

  /** The theme of the level being played; none in a village. */
  get theme(): RunTheme | undefined {
    return this.inVillage ? undefined : this.themeFor?.(this.depth);
  }

  /** The main view's header (Spec 01): the level's theme and depth ("Goblin Warrens, Level 7"), or the village and its depth. */
  get title(): string {
    if (this.depth === SURFACE) return 'Surface Village';
    if (!this.inVillage) {
      const theme = this.theme;
      return theme ? `${theme.name}, Level ${this.depth}` : `Level ${this.depth}`;
    }
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
      rivalsLeave(this.game); // the named rival takes what it carries on to its next appearance (Spec 02, Addendum A)
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
    return [{ kind: 'discovery', text: this.inVillage ? `You arrive in ${this.title}.` : `You ${direction === 'down' ? 'descend to' : 'climb to'} level ${this.depth}.` }, ...this.takeArrivals()];
  }

  /** The lift takes the player to another visited village (Spec 07); the town has taken the fare. */
  lift(to: number): LogMessage[] {
    this.leave();
    this.depth = to;
    this.arrive(this.depth, 'down');
    return [{ kind: 'discovery', text: `The lift stops. You arrive in ${this.title}.` }];
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
      this.arrivals.push(...this.town.onArrive());
      return;
    }
    const level = this.levelFor(depth);
    // The deepest level reached and arriving on level 100 are kept for the leaderboard (Spec 09).
    const { stats } = this.player;
    stats.deepest = Math.max(stats.deepest, depth);
    if (depth === MAX_DEPTH) stats.won = true;
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
      links: this.layout?.links ?? [],
      above: { villagesAbove: this.town.number(depth), facts: () => this.town.rumourFacts(Math.max(0, ...this.villages.filter((v) => v < depth))) },
    });
  }
}
