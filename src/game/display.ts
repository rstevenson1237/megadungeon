// Display events (Spec 01b, Animation and effects; task 6.8): what each action and each real-time tick showed, for the
// isometric display to animate. The Game fills the list beside its state, never in it: nothing here is saved, the
// rules are unchanged, and the text display ignores it. Steps, deaths, dice lost, statuses, alerts and doors are read
// by comparing the level before and after; attacks and spells are told by the code that makes them, since a
// comparison cannot say who struck whom. Only what the player can see is kept.

import type { Spell } from '../core/schemas.ts';
import type { Point } from '../rules/world/level.ts';
import type { Monster } from './monsters.ts';

/** Who an event is about: the player, or a creature by its id. */
export type Who = 'player' | number;

/** The effect a spell shows (Spec 01b clarification, task 6.8): its row's `fx`, else one chosen by its shape and effect. */
export type SpellFx = 'bolt' | 'burst' | 'frost' | 'push' | 'aura';

export type DisplayEvent =
  | { type: 'step'; who: Who; from: Point; to: Point }
  | { type: 'attack'; who: Who; from: Point; target: Who; at: Point; ranged: boolean; hit: boolean; fx?: 'arrow' | 'bolt' }
  | { type: 'spell'; who: Who; from: Point; spell: string; fx: SpellFx; cells: Point[]; at?: Point }
  | { type: 'die-lost'; who: Who; at: Point }
  | { type: 'status'; who: Who; at: Point; status: string }
  | { type: 'death'; who: number; at: Point; creature: Monster }
  | { type: 'alert'; who: number; at: Point }
  | { type: 'door'; at: Point; open: boolean }
  | { type: 'arrive'; how: 'fall' | 'teleport'; at: Point };

/**
 * When an event happened. In turn mode, phase 0 is the player's action and phase 1 the creatures' round that
 * followed; in real time, the tick, and for a step the mover's interval in ticks, which its slide lasts.
 */
export type Stamped = DisplayEvent & { phase: 0 | 1; tick: number; ticks?: number };

/** The effect a spell shows: its row's `fx` key (Spec 08), else push for a push, aura for a self spell, burst for an area, bolt for a target. */
export function spellFx(spell: Pick<Spell, 'shape' | 'effect' | 'fx'>): SpellFx {
  if (spell.fx) return spell.fx;
  if (spell.effect === 'push') return 'push';
  if (spell.shape === 'self') return 'aura';
  return spell.shape === 'area' ? 'burst' : 'bolt';
}

/** What the comparison reads of the level: where each one stands and how they are. */
interface Snapshot {
  player: Point;
  dice: number;
  statuses: Set<string>;
  creatures: Map<number, { at: Point; dice: number; statuses: Set<string>; alert: boolean; creature: Monster }>;
  doors: Set<number>;
}

/** The parts of the Game the recorder reads: the state and the clock. */
export interface Recorded {
  readonly state: {
    map: { player: Point; openDoors: number[]; visible: Uint8Array; level: { width: number } };
    monsters: Monster[];
    player: { pools: Record<string, { dice: number }>; statuses: { id: string }[] };
  };
  readonly tick: number;
}

const playerDice = (g: Recorded): number => Object.values(g.state.player.pools).reduce((n, p) => n + p.dice, 0);

export class DisplayRecorder {
  private events: Stamped[] = [];
  private before: Snapshot;
  /** 0 until the creatures' round starts in turn mode. */
  private phase: 0 | 1 = 0;

  constructor(private readonly game: Recorded) {
    this.before = this.snap();
  }

  private snap(): Snapshot {
    const { state } = this.game;
    return {
      player: { ...state.map.player },
      dice: playerDice(this.game),
      statuses: new Set(state.player.statuses.map((s) => s.id)),
      creatures: new Map(state.monsters.map((m) => [m.id, { at: { x: m.x, y: m.y }, dice: m.dice, statuses: new Set(m.statuses.map((s) => s.id)), alert: m.awareness === 'alert', creature: m }])),
      doors: new Set(state.map.openDoors),
    };
  }

  private seen(p: Point): boolean {
    const { map } = this.game.state;
    return map.visible[p.y * map.level.width + p.x] === 1;
  }

  /** Keep an event when the player can see it: the player's own always, a creature's when a cell it names is visible. */
  add(event: DisplayEvent, extra: { ticks?: number } = {}): void {
    const cells: Point[] = [];
    if ('at' in event && event.at) cells.push(event.at);
    if ('from' in event) cells.push(event.from);
    if (event.type === 'step') cells.push(event.to);
    if (event.type === 'spell') cells.push(...event.cells);
    const own = 'who' in event && event.who === 'player';
    if (!own && event.type !== 'arrive' && !cells.some((c) => this.seen(c))) return;
    this.events.push({ ...event, phase: this.phase, tick: this.game.tick, ...extra });
  }

  /**
   * Compare the level with the last look and record what changed: steps (one cell; a longer move, such as Blink, is
   * not a step), dice lost, statuses gained, creatures alerted or gone, doors opened or shut. `interval` gives a
   * mover's step length in ticks in real time.
   */
  compare(interval?: (who: Who) => number): void {
    const was = this.before;
    const now = this.snap();
    const stepped = (a: Point, b: Point): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1 || (Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1);
    if (stepped(was.player, now.player)) this.add({ type: 'step', who: 'player', from: was.player, to: now.player }, interval ? { ticks: interval('player') } : {});
    if (now.dice < was.dice) this.add({ type: 'die-lost', who: 'player', at: now.player });
    for (const s of now.statuses) if (!was.statuses.has(s)) this.add({ type: 'status', who: 'player', at: now.player, status: s });
    for (const [id, c] of now.creatures) {
      const old = was.creatures.get(id);
      if (!old) continue;
      if (stepped(old.at, c.at)) this.add({ type: 'step', who: id, from: old.at, to: c.at }, interval ? { ticks: interval(id) } : {});
      if (c.dice < old.dice) this.add({ type: 'die-lost', who: id, at: c.at });
      for (const s of c.statuses) if (!old.statuses.has(s)) this.add({ type: 'status', who: id, at: c.at, status: s });
      if (c.alert && !old.alert) this.add({ type: 'alert', who: id, at: c.at });
    }
    for (const [id, old] of was.creatures) if (!now.creatures.has(id)) this.add({ type: 'death', who: id, at: old.at, creature: old.creature });
    const width = this.game.state.map.level.width;
    const door = (i: number, open: boolean): void => this.add({ type: 'door', at: { x: i % width, y: Math.floor(i / width) }, open });
    for (const i of now.doors) if (!was.doors.has(i)) door(i, true);
    for (const i of was.doors) if (!now.doors.has(i)) door(i, false);
    this.before = now;
  }

  /** Turn mode: the player's action is over and the creatures' round begins. */
  creaturesBegin(): void {
    this.compare();
    this.phase = 1;
  }

  /** Start afresh from the level as it is (a new level, a display switch), forgetting anything not yet taken. */
  reset(): void {
    this.events = [];
    this.phase = 0;
    this.before = this.snap();
  }

  /** The events since the last take, oldest first, after a last comparison; the next action starts at phase 0. */
  take(interval?: (who: Who) => number): Stamped[] {
    this.compare(interval);
    const out = this.events;
    this.events = [];
    this.phase = 0;
    return out;
  }
}
