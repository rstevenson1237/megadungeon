// Animation of the isometric display (Spec 01b, Animation and effects; task 6.8 clarification). The Game's display
// events become timed animations: slides, lunges, hurt flashes, effects and the fading of the dead. Animation shows
// what happened and never changes or delays the game: the state has already moved, so a slide draws a creature
// between the cell it left and the cell it stands on, and finishing every animation at once loses nothing.
//
// It is pure and keyed to a clock in ms that the shell owns (stopped under an overlay or a pause), so the tests drive
// it with plain numbers. `motion(now)` says what to draw at that moment; buildIsoDraws (iso-view.ts) draws it.

import type { Stamped, Who } from '../game/display.ts';
import type { Monster } from '../game/monsters.ts';
import type { Point } from '../rules/world/level.ts';
import { facingOf, type IsoFacing } from './iso-view.ts';

/** Turn mode (Spec 01b): a step slides over 100 ms, an attack lunges over 120 ms, an effect lasts at most 300 ms. */
export const STEP_MS = 100;
export const LUNGE_MS = 120;
export const EFFECT_MS = 300;
/** A sprite's attack frames last 300 ms (task 6.6: 80, 40, 120, 60); its hurt frames 200 ms. */
export const ATTACK_FRAMES_MS = 300;
export const HURT_MS = 200;
/** A lunge reaches this far toward the target, in cells (about 6 px on screen), and comes back. */
export const LUNGE_REACH = 0.35;
/** A missile flies 10 cells a second, taking at least 60 ms and at most 300 ms. */
export const FLIGHT_CELLS_PER_S = 10;
export const FLIGHT_MIN_MS = 60;
/** How high above the feet a head effect starts: the character frame's height, and how far a lost die drops. */
export const HEAD_RISE = 40;
export const DIE_DROP = 12;

/** The effects of Spec 01b, by their asset's id without `fx-`. */
export type FxName = 'hit' | 'miss' | 'arrow' | 'bolt' | 'burst' | 'frost' | 'push' | 'aura' | 'die-lost' | 'alert';

/**
 * The CP437 glyph an effect draws as while it has no approved art (task 6.8 clarification): miss, bolt, push and the
 * lost die are on the redo list; the rest draw this way only when no art is loaded at all.
 */
export const FX_GLYPH: Readonly<Record<FxName, number>> = {
  hit: 15, // ☼
  miss: 250, // ∙
  arrow: 7, // •
  bolt: 42, // *
  burst: 15, // ☼
  frost: 4, // ♦
  push: 41, // )
  aura: 9, // ○
  'die-lost': 254, // ■
  alert: 33, // !
};

/** How a sprite is drawn at a moment: its offset from its cell in cells, its state, how far into it, and its facing. */
export interface ActorMotion {
  dx: number;
  dy: number;
  state: 'walk' | 'attack' | 'hurt';
  t: number;
}

/** An effect at a moment: where (a level position, in cells, fractional while it flies), how high above it, how far in. */
export interface FxMotion {
  fx: FxName;
  x: number;
  y: number;
  rise: number;
  t: number;
}

/** A creature that died, still drawn on its cell while it fades. */
export interface GhostMotion {
  creature: Monster;
  at: Point;
  alpha: number;
  facing: IsoFacing;
}

/** What the animations add to the picture at one moment. */
export interface IsoMotion {
  /** The clock, for looping art (water, lava, the teleporter, idle). */
  clock: number;
  actors: ReadonlyMap<Who, ActorMotion>;
  effects: readonly FxMotion[];
  ghosts: readonly GhostMotion[];
  /** The direction each creature last stepped or attacked in, this level visit. */
  facings: ReadonlyMap<number, IsoFacing>;
}

type Anim =
  | { kind: 'slide'; who: Who; from: Point; to: Point; start: number; dur: number }
  | { kind: 'lunge'; who: Who; toward: Point; start: number; dur: number; frames: number }
  | { kind: 'hurt'; who: Who; start: number; dur: number }
  | { kind: 'fx'; fx: FxName; from: Point; to?: Point; start: number; dur: number; rise: number; drop?: number }
  | { kind: 'ghost'; creature: Monster; at: Point; start: number; dur: number; facing: IsoFacing };

const end = (a: Anim): number => a.start + a.dur;
const unit = (from: Point, to: Point): Point => {
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
};
const flightMs = (from: Point, to: Point): number =>
  Math.min(EFFECT_MS, Math.max(FLIGHT_MIN_MS, (Math.hypot(to.x - from.x, to.y - from.y) / FLIGHT_CELLS_PER_S) * 1000));

export interface AddOptions {
  /** Turn-based or real time: in real time a step slides over its mover's interval and attacks play their full frames. */
  mode: 'turn' | 'real';
  /** Real time: how long a tick lasts now (50 ms, or 12.5 ms while Z fast-forwards). */
  tickMs?: number;
}

export class IsoAnimator {
  private anims: Anim[] = [];
  private readonly faced = new Map<number, IsoFacing>();

  /**
   * Start the animations for a batch of events at `now`. In turn mode the player's (phase 0) start at once and the
   * creatures' (phase 1) when the player's motions end; in real time every event starts now, as its tick is drawn.
   */
  add(events: readonly Stamped[], now: number, options: AddOptions): void {
    const real = options.mode === 'real';
    const tickMs = options.tickMs ?? 50;
    let phaseOne = now;
    for (const phase of [0, 1] as const) {
      const start = phase === 0 || real ? now : phaseOne;
      for (const e of events) {
        if (!real && e.phase !== phase) continue;
        if (real && phase === 1) continue;
        const motionEnd = this.start(e, start, real, tickMs);
        if (phase === 0) phaseOne = Math.max(phaseOne, motionEnd);
      }
    }
  }

  /** One event's animations from `start`; returns when its motion (a slide, a lunge, a missile's flight) ends. */
  private start(e: Stamped, start: number, real: boolean, tickMs: number): number {
    const push = (a: Anim): void => void this.anims.push(a);
    const facing = (who: Who, from: Point, to: Point): void => {
      if (who !== 'player' && (from.x !== to.x || from.y !== to.y)) this.faced.set(who, facingOf(to.x - from.x, to.y - from.y));
    };
    switch (e.type) {
      case 'step': {
        // Any earlier slide of the same mover ends where it is: its new slide starts from the cell it was going to.
        this.anims = this.anims.filter((a) => !(a.kind === 'slide' && a.who === e.who));
        const dur = real ? (e.ticks ?? 10) * tickMs : STEP_MS;
        push({ kind: 'slide', who: e.who, from: e.from, to: e.to, start, dur });
        facing(e.who, e.from, e.to);
        return start + dur;
      }
      case 'attack': {
        facing(e.who, e.from, e.at);
        if (!e.ranged) {
          push({ kind: 'lunge', who: e.who, toward: unit(e.from, e.at), start, dur: LUNGE_MS, frames: real ? ATTACK_FRAMES_MS : LUNGE_MS });
          push({ kind: 'fx', fx: e.hit ? 'hit' : 'miss', from: e.at, start: start + LUNGE_MS / 2, dur: EFFECT_MS, rise: HEAD_RISE / 2 });
          if (e.hit) push({ kind: 'hurt', who: e.target, start: start + LUNGE_MS / 2, dur: HURT_MS });
          return start + LUNGE_MS;
        }
        const flight = flightMs(e.from, e.at);
        push({ kind: 'lunge', who: e.who, toward: { x: 0, y: 0 }, start, dur: real ? ATTACK_FRAMES_MS : LUNGE_MS, frames: real ? ATTACK_FRAMES_MS : LUNGE_MS });
        push({ kind: 'fx', fx: e.fx ?? 'arrow', from: e.from, to: e.at, start, dur: flight, rise: HEAD_RISE / 2 });
        push({ kind: 'fx', fx: e.hit ? 'hit' : 'miss', from: e.at, start: start + flight, dur: EFFECT_MS, rise: HEAD_RISE / 2 });
        if (e.hit) push({ kind: 'hurt', who: e.target, start: start + flight, dur: HURT_MS });
        return start + flight;
      }
      case 'spell': {
        if (e.fx === 'bolt') {
          const to = e.at ?? e.cells[0] ?? e.from;
          const flight = flightMs(e.from, to);
          push({ kind: 'fx', fx: 'bolt', from: e.from, to, start, dur: flight, rise: HEAD_RISE / 2 });
          return start + flight;
        }
        for (const c of e.cells) push({ kind: 'fx', fx: e.fx, from: c, start, dur: EFFECT_MS, rise: e.fx === 'aura' ? 0 : 4 });
        return start;
      }
      case 'die-lost':
        push({ kind: 'fx', fx: 'die-lost', from: e.at, start, dur: EFFECT_MS, rise: HEAD_RISE, drop: DIE_DROP });
        return start;
      case 'alert':
        push({ kind: 'fx', fx: 'alert', from: e.at, start, dur: EFFECT_MS, rise: HEAD_RISE + 6 });
        return start;
      case 'death':
        push({ kind: 'ghost', creature: e.creature, at: e.at, start, dur: EFFECT_MS, facing: this.faced.get(e.who) ?? 's' });
        this.faced.delete(e.who);
        return start;
      case 'arrive':
        if (e.how === 'teleport') push({ kind: 'fx', fx: 'aura', from: e.at, start, dur: EFFECT_MS, rise: 0 });
        return start;
      case 'status':
      case 'door':
        return start; // drawn by the state itself: the icon appears, the door changes (task 6.8 clarification)
    }
  }

  /** Whether any animation is still running (or waiting to start) at `now`. */
  running(now: number): boolean {
    return this.anims.some((a) => end(a) > now);
  }

  /** Turn mode: a key press finishes every animation at once (Spec 01b), so input never waits. */
  finish(): void {
    this.anims = [];
  }

  /** A new level or a switch to text: drop the animations and forget who faced where. */
  clear(): void {
    this.anims = [];
    this.faced.clear();
  }

  /** What to draw at `now`. Finished animations are dropped. */
  motion(now: number): IsoMotion {
    this.anims = this.anims.filter((a) => end(a) > now);
    const actors = new Map<Who, ActorMotion>();
    const effects: FxMotion[] = [];
    const ghosts: GhostMotion[] = [];
    for (const a of this.anims) {
      if (a.start > now) continue;
      const t = now - a.start;
      const p = Math.min(1, t / a.dur);
      switch (a.kind) {
        case 'slide': {
          // The mover stands on `to` in the state; it is drawn back toward `from` until the slide ends.
          const prev = actors.get(a.who);
          actors.set(a.who, { dx: (a.from.x - a.to.x) * (1 - p), dy: (a.from.y - a.to.y) * (1 - p), state: prev?.state === 'attack' ? 'attack' : 'walk', t: prev?.state === 'attack' ? prev.t : t });
          break;
        }
        case 'lunge': {
          const reach = LUNGE_REACH * Math.sin(Math.PI * Math.min(1, t / LUNGE_MS));
          const prev = actors.get(a.who);
          // In turn mode the attack frames are fitted to the lunge; in real time they play out at their own length.
          actors.set(a.who, { dx: (prev?.dx ?? 0) + a.toward.x * reach, dy: (prev?.dy ?? 0) + a.toward.y * reach, state: 'attack', t: (t * ATTACK_FRAMES_MS) / a.frames });
          break;
        }
        case 'hurt': {
          const prev = actors.get(a.who);
          if (!prev) actors.set(a.who, { dx: 0, dy: 0, state: 'hurt', t });
          break;
        }
        case 'fx': {
          const at = a.to ? { x: a.from.x + (a.to.x - a.from.x) * p, y: a.from.y + (a.to.y - a.from.y) * p } : a.from;
          effects.push({ fx: a.fx, x: at.x, y: at.y, rise: a.rise - (a.drop ?? 0) * p, t });
          break;
        }
        case 'ghost':
          ghosts.push({ creature: a.creature, at: a.at, alpha: 1 - p, facing: a.facing });
          break;
      }
    }
    return { clock: now, actors, effects, ghosts, facings: this.faced };
  }
}
