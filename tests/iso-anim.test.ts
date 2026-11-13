// Animation of the isometric display (Spec 01b, Animation and effects; task 6.8 clarification): slides, lunges and
// effects are timed on a clock the tests drive with plain numbers; a key press finishes them all at once, so input
// never waits; in real time a step slides over its mover's interval; and the picture draws what animates.

import { describe, expect, it } from 'vitest';
import type { Stamped } from '../src/game/display.ts';
import {
  ATTACK_FRAMES_MS, EFFECT_MS, FX_GLYPH, IsoAnimator, LUNGE_MS, STEP_MS,
} from '../src/ui/iso-anim.ts';
import { frameAt } from '../src/ui/art/iso-art.ts';
import type { PackAsset } from '../src/ui/art/runtime/types.ts';
import { buildIsoDraws, project } from '../src/ui/iso-view.ts';
import { gameOn, monsterAt, press, room, shellOn } from './helpers.ts';

const step = (who: 'player' | number, from: [number, number], to: [number, number], phase: 0 | 1 = 0, ticks?: number): Stamped =>
  ({ type: 'step', who, from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] }, phase, tick: 0, ...(ticks ? { ticks } : {}) }) as Stamped;

describe('turn-mode timing', () => {
  it('a step slides from the cell left to the cell it stands on over 100 ms, playing walk', () => {
    const anim = new IsoAnimator();
    anim.add([step('player', [2, 2], [3, 2])], 1000, { mode: 'turn' });
    expect(anim.motion(1000).actors.get('player')).toMatchObject({ dx: -1, dy: 0, state: 'walk' });
    expect(anim.motion(1050).actors.get('player')!.dx).toBeCloseTo(-0.5);
    expect(anim.running(1000 + STEP_MS - 1)).toBe(true);
    expect(anim.running(1000 + STEP_MS)).toBe(false);
    expect(anim.motion(1000 + STEP_MS).actors.has('player')).toBe(false);
  });

  it('the creatures\' round starts when the player\'s motion ends', () => {
    const anim = new IsoAnimator();
    anim.add([step('player', [2, 2], [3, 2], 0), step(7, [9, 2], [8, 2], 1)], 0, { mode: 'turn' });
    expect(anim.motion(50).actors.has(7)).toBe(false);
    expect(anim.motion(STEP_MS + 10).actors.get(7)).toMatchObject({ state: 'walk' });
  });

  it('a melee attack lunges toward its target over 120 ms, with its attack frames fitted to it, and a spark on a hit', () => {
    const anim = new IsoAnimator();
    anim.add([{ type: 'attack', who: 'player', from: { x: 2, y: 2 }, target: 5, at: { x: 3, y: 2 }, ranged: false, hit: true, phase: 0, tick: 0 }], 0, { mode: 'turn' });
    const mid = anim.motion(LUNGE_MS / 2);
    expect(mid.actors.get('player')).toMatchObject({ state: 'attack' });
    expect(mid.actors.get('player')!.dx).toBeGreaterThan(0.3);
    expect(mid.actors.get('player')!.t).toBeCloseTo(ATTACK_FRAMES_MS / 2);
    expect(mid.effects.map((e) => e.fx)).toEqual(['hit']);
    expect(mid.actors.get(5)).toMatchObject({ state: 'hurt' });
    expect(anim.running(LUNGE_MS / 2 + EFFECT_MS - 1)).toBe(true);
    expect(anim.running(LUNGE_MS / 2 + EFFECT_MS)).toBe(false);
  });

  it('a shot flies an arrow along the line, then a puff on a miss', () => {
    const anim = new IsoAnimator();
    anim.add([{ type: 'attack', who: 'player', from: { x: 0, y: 0 }, target: 5, at: { x: 2, y: 0 }, ranged: true, hit: false, fx: 'arrow', phase: 0, tick: 0 }], 0, { mode: 'turn' });
    const flying = anim.motion(100).effects.find((e) => e.fx === 'arrow')!;
    expect(flying.x).toBeCloseTo(1);
    expect(anim.motion(210).effects.map((e) => e.fx)).toEqual(['miss']);
  });

  it('effects last at most 300 ms; a spell bursts on every cell of its footprint', () => {
    const anim = new IsoAnimator();
    const cells = [{ x: 4, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 5 }];
    anim.add([{ type: 'spell', who: 'player', from: { x: 0, y: 0 }, spell: 'blizzard', fx: 'frost', cells, phase: 0, tick: 0 }], 0, { mode: 'turn' });
    expect(anim.motion(10).effects.filter((e) => e.fx === 'frost')).toHaveLength(3);
    expect(anim.running(EFFECT_MS)).toBe(false);
  });

  it('a key press finishes every animation at once', () => {
    const anim = new IsoAnimator();
    anim.add([step('player', [2, 2], [3, 2]), { type: 'alert', who: 3, at: { x: 5, y: 5 }, phase: 1, tick: 0 }], 0, { mode: 'turn' });
    anim.finish();
    expect(anim.running(0)).toBe(false);
    expect(anim.motion(0).actors.size).toBe(0);
  });

  it('remembers each creature\'s last step or attack direction for the visit, and forgets it on a new level', () => {
    const anim = new IsoAnimator();
    anim.add([step(4, [5, 5], [4, 5])], 0, { mode: 'turn' });
    expect(anim.motion(500).facings.get(4)).toBe('w');
    anim.add([{ type: 'attack', who: 4, from: { x: 4, y: 5 }, target: 'player', at: { x: 4, y: 6 }, ranged: false, hit: false, phase: 1, tick: 0 }], 600, { mode: 'turn' });
    expect(anim.motion(2000).facings.get(4)).toBe('s');
    anim.clear();
    expect(anim.motion(2000).facings.size).toBe(0);
  });

  it('a death leaves the creature fading on its cell over 300 ms', () => {
    const anim = new IsoAnimator();
    const goblin = monsterAt(6, 6);
    anim.add([{ type: 'death', who: goblin.id, at: { x: 6, y: 6 }, creature: goblin, phase: 0, tick: 0 }], 0, { mode: 'turn' });
    expect(anim.motion(150).ghosts[0]!.alpha).toBeCloseTo(0.5);
    expect(anim.motion(EFFECT_MS).ghosts).toHaveLength(0);
  });
});

describe('real-time timing', () => {
  it('a step slides over its mover\'s interval, so movement is continuous', () => {
    const anim = new IsoAnimator();
    anim.add([step(9, [1, 1], [2, 1], 0, 20)], 0, { mode: 'real', tickMs: 50 });
    expect(anim.running(999)).toBe(true);
    expect(anim.motion(500).actors.get(9)!.dx).toBeCloseTo(-0.5);
    // The next step starts where the last ended, with no pause between.
    anim.add([step(9, [2, 1], [3, 1], 0, 20)], 1000, { mode: 'real', tickMs: 50 });
    expect(anim.motion(1000).actors.get(9)!.dx).toBeCloseTo(-1);
  });

  it('an attack plays its full attack frames', () => {
    const anim = new IsoAnimator();
    anim.add([{ type: 'attack', who: 2, from: { x: 0, y: 0 }, target: 'player', at: { x: 1, y: 0 }, ranged: false, hit: false, phase: 0, tick: 0 }], 0, { mode: 'real' });
    expect(anim.motion(60).actors.get(2)!.t).toBeCloseTo(60);
  });
});

describe('frames by time', () => {
  const sprite = { states: { idle: { frames: 2, fps: 8, loop: true, durations: [600, 600] }, attack: { frames: 4, fps: 8, loop: false, durations: [80, 40, 120, 60] } } } as unknown as PackAsset;
  it('loops wrap and one-shots hold their last frame', () => {
    expect([0, 599, 600, 1199, 1200].map((t) => frameAt(sprite, 'idle', t))).toEqual([0, 0, 1, 1, 0]);
    expect([0, 79, 80, 119, 120, 240, 299, 5000].map((t) => frameAt(sprite, 'attack', t))).toEqual([0, 0, 1, 1, 2, 3, 3, 3]);
  });
});

describe('the picture while it animates', () => {
  it('draws a sliding creature between its cells, an effect as its glyph with no art, and the dying fading', () => {
    const game = gameOn(room(20, 9, 4, 4));
    const m = monsterAt(7, 4, { alert: true });
    game.state.monsters.push(m);
    const anim = new IsoAnimator();
    const ghost = monsterAt(5, 5);
    anim.add([
      step(m.id, [8, 4], [7, 4]),
      { type: 'alert', who: m.id, at: { x: 7, y: 4 }, phase: 0, tick: 0 },
      { type: 'death', who: ghost.id, at: { x: 5, y: 5 }, creature: ghost, phase: 0, tick: 0 },
    ], 0, { mode: 'turn' });
    const camera = game.state.map.player;
    const draws = buildIsoDraws(game.state, { motion: anim.motion(50), camera });
    const body = draws.find((d) => d.layer === 'creature' && d.cell.x === 7 && d.cell.y === 4)!;
    const half = project(7.5, 4, camera);
    expect([body.x, body.y]).toEqual([half.x, half.y]);
    expect(body.frame).toBe('walk');
    const alert = draws.find((d) => d.layer === 'effect' && d.shape === 'glyph')!;
    expect(alert.glyph).toBe(FX_GLYPH.alert);
    const dying = draws.find((d) => d.layer === 'creature' && d.cell.x === 5 && d.cell.y === 5)!;
    expect(dying.alpha).toBeCloseTo(1 - 50 / EFFECT_MS);
  });

  it('turns water and idle over on the clock', () => {
    const game = gameOn(room(10, 5, 2, 2));
    const draws = buildIsoDraws(game.state, { motion: new IsoAnimator().motion(1234) });
    expect(draws.find((d) => d.layer === 'creature')!).toMatchObject({ frame: 'idle', t: 1234 });
  });
});

describe('the shell: input never waits, and switching display changes nothing', () => {
  it('in turn mode a key press acts at once, finishing the last action\'s animation', () => {
    const shell = shellOn(room(20, 5, 2, 2));
    shell.display = 'iso';
    shell.picture(0);
    press(shell, 'ArrowRight');
    shell.picture(10);
    expect(shell.anim.running(10)).toBe(true);
    const before = shell.game!.state.map.player.x;
    press(shell, 'ArrowRight'); // 20 ms later, mid-slide
    expect(shell.game!.state.map.player.x).toBe(before + 1);
    expect(shell.anim.running(20)).toBe(false);
  });

  it('the text display takes the events and drops them; the game state is the same either way', () => {
    const text = shellOn(room(20, 5, 2, 2));
    const iso = shellOn(room(20, 5, 2, 2));
    iso.display = 'iso';
    for (const s of [text, iso]) {
      s.picture(0);
      press(s, 'ArrowRight');
      press(s, 'ArrowDown');
      s.picture(5);
    }
    expect(text.anim.running(5)).toBe(false);
    expect(JSON.stringify(text.game!.state)).toBe(JSON.stringify(iso.game!.state));
  });
});
