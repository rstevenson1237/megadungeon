import { describe, expect, it } from 'vitest';
import type { Game } from '../src/game/game.ts';
import { hasStatus, statusOf } from '../src/rules/magic/status.ts';
import { SPELLS, castingGame, monsterAt, rig, room, spell } from './helpers.ts';

// Task 4.6: the 15 spells added to reach the target of 30 (Spec 04, "Starting spell list"; Spec 08, catalog). Each runs on
// an effect already in code, so these check the rows: shape, numbers and what a cast does.
const harmless = { modifier: -6, dice: 30, maxDice: 30, speed: 'slow' as const };
const still = (x: number, y: number, extra = {}) => monsterAt(x, y, { alert: true, ...harmless, ...extra });
const cast = (game: Game, id: string, aim?: Parameters<Game['cast']>[1]) => game.cast(spell(id), aim);

const NEW = ['stoneskin', 'bless', 'quicken', 'daylight', 'farsight', 'shadow_step', 'slow', 'lightning_bolt', 'life_tap', 'stasis', 'dread', 'firestorm', 'frost_nova', 'slumber', 'banish'];

describe('the launch spell table', () => {
  it('holds 30 spells: the 15 of the starting list and the 15 added in task 4.6, five or more of each shape', () => {
    expect(SPELLS).toHaveLength(30);
    expect(new Set(SPELLS.map((s) => s.id)).size).toBe(30);
    expect(SPELLS.filter((s) => s.tags?.includes('starting'))).toHaveLength(15);
    expect(SPELLS.filter((s) => !s.tags?.includes('starting')).map((s) => s.id)).toEqual(NEW);
    for (const shape of ['self', 'target', 'area']) expect(SPELLS.filter((s) => s.shape === shape).length).toBeGreaterThanOrEqual(5);
    for (const s of SPELLS) expect(s.name.length).toBeLessThanOrEqual(25);
  });

  it('Stoneskin shields for 25 rounds and Bless and Quicken give their statuses', () => {
    const game = castingGame(room(20, 7, 2, 4));
    rig(game, 6);
    cast(game, 'stoneskin');
    expect(game.state.player.shield).toBeGreaterThan(10);
    rig(game, 6);
    cast(game, 'bless');
    expect(hasStatus(game.state.player.statuses, 'blessed')).toBe(true);
    rig(game, 6);
    cast(game, 'quicken');
    expect(statusOf(game.state.player.statuses, 'hasted')?.rounds).toBeGreaterThan(3);
  });

  it('Lightning Bolt removes a die, and its row reaches 10 cells', () => {
    const game = castingGame(room(20, 7, 2, 4));
    const m = still(10, 4);
    game.state.monsters.push(m);
    rig(game, 6);
    cast(game, 'lightning_bolt', m);
    expect(m.dice).toBe(29);
    expect(spell('lightning_bolt').reach).toBe(10);
  });

  it('Life Tap removes a die and restores one of yours', () => {
    const game = castingGame(room(20, 7, 2, 4), { combatDice: 2, combatMax: 3 });
    const m = still(6, 4);
    game.state.monsters.push(m);
    rig(game, 6);
    cast(game, 'life_tap', m);
    expect(m.dice).toBe(29);
    expect(game.state.player.pools.combat.dice).toBe(3);
  });

  it('Slow, Stasis and Dread put their status on the target', () => {
    for (const [id, status] of [['slow', 'slowed'], ['stasis', 'held'], ['dread', 'frightened']] as const) {
      const game = castingGame(room(20, 7, 2, 4));
      const m = still(5, 4);
      game.state.monsters.push(m);
      rig(game, 6);
      cast(game, id, m);
      expect(hasStatus(m.statuses, status), id).toBe(true);
    }
  });

  it('Firestorm removes a die from every creature in a 5 x 5', () => {
    const game = castingGame(room(20, 9, 2, 5));
    const near = [still(7, 5), still(9, 7), still(5, 3)];
    const out = still(10, 5);
    game.state.monsters.push(...near, out);
    rig(game, 6);
    cast(game, 'firestorm', near[0]);
    for (const m of near.slice(0, 2)) expect(m.dice).toBe(29);
    expect(out.dice).toBe(30);
  });

  it('Frost Nova slows what is within 3 cells and spares the caster; Slumber puts a 3 x 3 to sleep', () => {
    const game = castingGame(room(20, 9, 5, 5));
    const close = still(7, 5);
    const far = still(10, 5);
    game.state.monsters.push(close, far);
    rig(game, 6);
    cast(game, 'frost_nova');
    expect(hasStatus(close.statuses, 'slowed')).toBe(true);
    expect(hasStatus(far.statuses, 'slowed')).toBe(false);
    expect(hasStatus(game.state.player.statuses, 'slowed')).toBe(false);

    const g2 = castingGame(room(20, 9, 2, 5));
    const a = still(7, 5);
    const b = still(8, 6);
    const c = still(10, 5);
    g2.state.monsters.push(a, b, c);
    rig(g2, 6, 3);
    cast(g2, 'slumber', a);
    expect(hasStatus(a.statuses, 'asleep')).toBe(true);
    expect(hasStatus(b.statuses, 'asleep')).toBe(true);
    expect(hasStatus(c.statuses, 'asleep')).toBe(false);
  });

  it('Banish hurts only the undead within 6 cells', () => {
    const game = castingGame(room(20, 9, 5, 5));
    const dead = still(8, 5, { undead: true });
    const live = still(6, 5);
    game.state.monsters.push(dead, live);
    rig(game, 6);
    cast(game, 'banish');
    expect(dead.dice).toBe(29);
    expect(live.dice).toBe(30);
  });
});
