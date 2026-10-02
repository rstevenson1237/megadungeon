import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/core/rng.ts';
import type { Game } from '../src/game/game.ts';
import { blinkCells, canBlinkTo, spellTargets } from '../src/game/magic.ts';
import { Targeting } from '../src/game/targeting.ts';
import { STEPS, type Pool, type Step } from '../src/rules/character/dice.ts';
import { castRoll, needsCell, reachOf, resolvesAtOnce } from '../src/rules/magic/spells.ts';
import { hasStatus, statusOf } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { SPELLS, castingGame, levelFrom, monsterAt, rig, room, spell } from './helpers.ts';

/** A stand-in generator that deals the given faces in order. */
const dealer = (...faces: number[]): Rng => ({ int: () => faces.shift()! }) as unknown as Rng;
const magicPool = (step: Step, dice: number): Pool => ({ step, dice, max: 6 });
/** A creature that never wins a roll and has plenty of dice, so it never kills the test or dies by accident. */
const harmless = { modifier: -6, dice: 30, maxDice: 30 };
/** The same, but slow: it only acts on even rounds, so it keeps still through a spell cast in round 1. */
const inert = { ...harmless, speed: 'slow' as const };
const alertInert = (x: number, y: number) => monsterAt(x, y, { alert: true, ...inert });
const wait = (game: Game, n = 1): void => {
  for (let i = 0; i < n; i++) game.act({ type: 'wait' });
};
const cast = (game: Game, id: string, aim?: Parameters<Game['cast']>[1]) => game.cast(spell(id), aim);
const at = (game: Game) => ({ ...game.state.map.player });

describe('Spec 04: the 15 starting spells are table rows with the shapes and reach of the spec', () => {
  const rows: [string, string, number | undefined][] = [
    ['heal', 'self', undefined], ['shield', 'self', undefined], ['haste', 'self', undefined], ['light', 'self', 8],
    ['detect', 'self', 8], ['blink', 'self', 5], ['arcane_bolt', 'target', 8], ['sleep', 'target', 6],
    ['hold', 'target', 6], ['drain', 'target', 4], ['fear', 'target', 6], ['fireball', 'area', 8],
    ['blizzard', 'area', 8], ['thunderclap', 'area', 1], ['turn_undead', 'area', 6],
  ];

  it('lists exactly the spec spells, in the spec shapes and reach', () => {
    expect(SPELLS.map((s) => [s.id, s.shape, s.reach])).toEqual(rows);
  });

  it('knows which spells resolve on choosing and which need a creature or a cell', () => {
    expect(SPELLS.filter(resolvesAtOnce).map((s) => s.id)).toEqual(['heal', 'shield', 'haste', 'light', 'detect', 'thunderclap', 'turn_undead']);
    expect(SPELLS.filter(needsCell).map((s) => s.id)).toEqual(['blink']);
    expect(reachOf(spell('heal'))).toBe(0);
  });
});

describe('Spec 03 and 04: the spell roll uses one Magic die', () => {
  it('every face of every step: 4 or more works, 2 to 3 works and costs the die, 1 fails and costs the die', () => {
    for (const step of STEPS) {
      for (let face = 1; face <= step; face++) {
        const pool = magicPool(step, 2);
        const r = castRoll(dealer(face), pool);
        expect(r.success, `d${step} face ${face}`).toBe(face >= 2);
        expect(pool.dice, `d${step} face ${face}`).toBe(face >= 4 ? 2 : 1);
      }
    }
  });

  it('an empty pool rolls with disadvantage and loses nothing more', () => {
    const pool = magicPool(6, 0);
    expect(castRoll(dealer(6, 1), pool)).toMatchObject({ face: 1, success: false, fromEmpty: true });
    expect(pool.dice).toBe(0);
  });

  it("the Mage's Arcane Bolt keeps the die on a 2 to 3 but still loses it on a 1", () => {
    const pool = magicPool(6, 2);
    expect(castRoll(dealer(3), pool, true)).toMatchObject({ success: true, dieLost: false });
    expect(pool.dice).toBe(2);
    expect(castRoll(dealer(1), pool, true)).toMatchObject({ success: false, dieLost: true });
    expect(pool.dice).toBe(1);
  });
});

describe('Spec 04: casting takes a round and a Magic die', () => {
  it('a cast spends one round, the monsters act, and a 4 or more keeps the die', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const m = monsterAt(15, 3, { alert: true, ...harmless });
    game.state.monsters.push(m);
    rig(game, 6);
    const result = cast(game, 'heal');
    expect(result.spent).toBe(true);
    expect(game.state.round).toBe(2);
    expect(m.x).toBe(14); // it took a step
    expect(game.state.player.pools.magic.dice).toBe(3);
  });

  it('a 2 to 3 works but costs the die; a 1 fizzles and costs it too', () => {
    const game = castingGame(room(20, 5, 2, 3), { combatDice: 1 });
    rig(game, 3);
    cast(game, 'heal');
    expect(game.state.player.pools.combat.dice).toBe(2);
    expect(game.state.player.pools.magic.dice).toBe(2);
    rig(game, 1);
    const fizzle = cast(game, 'heal');
    expect(game.state.player.pools.combat.dice).toBe(2);
    expect(game.state.player.pools.magic.dice).toBe(1);
    expect(fizzle.messages.map((m) => m.text)).toContain('The spell fizzles.');
  });

  it('refuses a spell the player does not know, or a bad aim, with no round spent', () => {
    const only = castingGame(room(20, 5, 2, 3), { spells: ['heal'] });
    const target = monsterAt(5, 3, { alert: true });
    only.state.monsters.push(target);
    expect(cast(only, 'arcane_bolt', target)).toMatchObject({ spent: false });
    expect(only.state.round).toBe(1);

    const game = castingGame(room(20, 5, 2, 3));
    const far = monsterAt(15, 3, { alert: true });
    game.state.monsters.push(far);
    expect(cast(game, 'arcane_bolt').spent).toBe(false); // no aim
    expect(cast(game, 'arcane_bolt', far).spent).toBe(false); // 13 cells: out of reach
    expect(cast(game, 'blink', { x: 18, y: 3 }).spent).toBe(false);
    expect(game.state.round).toBe(1);
    expect(game.state.player.pools.magic.dice).toBe(3);
  });
});

describe('Spec 04: self spells', () => {
  it('Heal restores one Combat die, never past the maximum', () => {
    const game = castingGame(room(10, 5, 2, 3), { combatDice: 1, combatMax: 3 });
    for (const expected of [2, 3, 3]) {
      rig(game, 6);
      cast(game, 'heal');
      expect(game.state.player.pools.combat.dice).toBe(expected);
    }
  });

  it('Shield ignores the next hit within 10 rounds, once', () => {
    const game = castingGame(room(10, 5, 2, 3), { combatDice: 3, combatMax: 3 });
    rig(game, 6);
    cast(game, 'shield');
    expect(game.state.player.shield).toBe(9); // 10 rounds, counting the one it was cast in
    game.state.monsters.push(monsterAt(3, 3, { alert: true, modifier: 30, dice: 5, maxDice: 5, fearless: true }));
    wait(game);
    expect(game.state.player.pools.combat.dice).toBe(3); // the first hit was absorbed
    expect(game.state.player.shield).toBe(0);
    wait(game);
    expect(game.state.player.pools.combat.dice).toBe(2); // the next one lands
  });

  it('Shield fades after 10 rounds if nothing hits', () => {
    const game = castingGame(room(10, 5, 2, 3));
    rig(game, 6);
    cast(game, 'shield');
    wait(game, 8);
    expect(game.state.player.shield).toBe(1);
    wait(game);
    expect(game.state.player.shield).toBe(0);
  });

  it('Haste: two actions a round for 3 rounds, counting the round it is cast in', () => {
    const game = castingGame(room(30, 3, 1, 2));
    game.state.monsters.push(monsterAt(28, 2, { alert: true, ...harmless }));
    rig(game, 6);
    cast(game, 'haste');
    expect(statusOf(game.state.player.statuses, 'hasted')!.rounds).toBe(3);
    expect(game.state.round).toBe(1); // the cast was the first of the round's two actions: no time has passed
    let actions = 0;
    while (hasStatus(game.state.player.statuses, 'hasted') && actions < 20) {
      game.act({ type: 'wait' });
      actions++;
    }
    expect(actions).toBe(5); // the cast and five waits: six actions in three rounds
    expect(game.state.round).toBe(4);
  });

  it('Light reveals the whole room the caster stands in, even cells hidden behind a pillar', () => {
    const rows = ['###########', '#<...#....#', '#....#....#', '#.........#', '###########'];
    const level: Level = { ...levelFrom(rows), rooms: [{ x: 1, y: 1, w: 9, h: 3 }] };
    const game = castingGame(level);
    const explored = (x: number, y: number) => game.state.map.exploration.explored[y * level.width + x];
    expect(explored(8, 1)).toBe(0); // behind the pillar, unseen
    rig(game, 6);
    cast(game, 'light');
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) expect(explored(x, y), `${x},${y}`).toBe(1);
  });

  it('Light in a passage reveals what is open and connected within 8 cells, round a corner, and no farther', () => {
    const rows = ['########', '#<.....#', ...Array.from({ length: 13 }, () => '######.#'), '########'];
    const game = castingGame(levelFrom(rows));
    const lit = (x: number, y: number) => game.state.map.exploration.explored[y * 8 + x] === 1;
    expect(lit(6, 7)).toBe(false); // round the corner: unseen
    rig(game, 6);
    cast(game, 'light');
    expect(lit(6, 7)).toBe(true); // 5 across and 6 down: inside 8 cells
    expect(lit(6, 9)).toBe(false); // 8 down: outside
  });

  it('Light stops at a closed door', () => {
    const rows = ['#######', '#<....#', '######+', '######.', '######.', '######.', '#######'];
    const game = castingGame(levelFrom(rows));
    const lit = (x: number, y: number) => game.state.map.exploration.explored[y * 7 + x] === 1;
    rig(game, 6);
    cast(game, 'light');
    expect(lit(6, 2)).toBe(true); // the door itself
    expect(lit(6, 4)).toBe(false); // beyond it
  });

  describe('Detect', () => {
    const detectLevel = (): Level => ({
      ...room(24, 5, 2, 3),
      traps: [{ x: 6, y: 3, id: 'trap_dart' }, { x: 20, y: 3, id: 'trap_pit' }],
      features: [
        { type: 'container', kind: 'chest', x: 7, y: 1, contents: [], trap: 'trap_poison_needle' },
        { type: 'container', kind: 'sack', x: 8, y: 1, contents: [] },
      ],
      doors: [{ x: 10, y: 0, kind: 'secret' }, { x: 3, y: 0, kind: 'secret' }],
    });

    it('reveals floor traps, trapped containers and secret doors within 8 cells, with no roll to fail', () => {
      const level = detectLevel();
      const game = castingGame(level);
      const idx = (x: number, y: number) => y * level.width + x;
      rig(game, 6);
      cast(game, 'detect');
      // From (2,3): the dart trap, the trapped chest and the near secret door. The pit, the sack and the far door are not.
      expect(game.state.revealed.slice().sort((a, b) => a - b)).toEqual([idx(3, 0), idx(6, 3), idx(7, 1)].sort((a, b) => a - b));
    });

    it('keeps what it found as part of the level delta', () => {
      const level = detectLevel();
      const game = castingGame(level);
      rig(game, 6);
      cast(game, 'detect');
      const delta = game.captureDelta();
      expect(delta.revealed).toEqual(game.state.revealed);
      const back = new (game.constructor as typeof Game)(1, level, game.state.player, { delta, spells: SPELLS });
      expect(back.state.revealed).toEqual(game.state.revealed);
    });

    it('a found secret door behaves as a normal door: walking into it opens it', () => {
      const level: Level = { ...levelFrom(['#######', '#<.#..#', '#######']), doors: [{ x: 3, y: 1, kind: 'secret' }] };
      const game = castingGame(level);
      game.act({ type: 'move', dx: 1, dy: 0 });
      expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(false); // still a wall
      rig(game, 6);
      cast(game, 'detect');
      expect(game.state.revealed).toContain(1 * level.width + 3);
      game.act({ type: 'move', dx: 1, dy: 0 }); // opens it: costs the move
      expect(game.state.map.openDoors).toContain(1 * level.width + 3);
      expect(at(game)).toEqual({ x: 2, y: 1 });
      game.act({ type: 'move', dx: 1, dy: 0 });
      game.act({ type: 'move', dx: 1, dy: 0 });
      expect(at(game)).toEqual({ x: 4, y: 1 });
    });
  });

  describe('Blink', () => {
    it('moves the caster instantly to a visible free cell within 5 cells', () => {
      const game = castingGame(room(20, 5, 2, 3));
      rig(game, 6);
      const result = cast(game, 'blink', { x: 7, y: 3 });
      expect(result.spent).toBe(true);
      expect(at(game)).toEqual({ x: 7, y: 3 });
      expect(game.state.round).toBe(2);
    });

    it('refuses a cell that is occupied, a wall, the caster\'s own or not visible, with no round spent', () => {
      const game = castingGame(levelFrom(['###########', '#<..#.....#', '#...#..=..#', '###########']));
      const sp = spell('blink');
      game.state.monsters.push(monsterAt(3, 1, { alert: true }));
      expect(canBlinkTo(game, sp, { x: 3, y: 2 })).toBe(true);
      for (const to of [{ x: 3, y: 1 }, { x: 1, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }]) {
        expect(canBlinkTo(game, sp, to), `${to.x},${to.y}`).toBe(false); // a creature, the caster, a wall, beyond the wall
        expect(cast(game, 'blink', to).spent).toBe(false);
      }
      expect(game.state.round).toBe(1);
    });

    it('reaches 5 cells in a straight line and no farther, and every cell it offers is valid', () => {
      const game = castingGame(room(20, 5, 2, 3));
      const sp = spell('blink');
      expect(canBlinkTo(game, sp, { x: 7, y: 3 })).toBe(true);
      expect(canBlinkTo(game, sp, { x: 8, y: 3 })).toBe(false);
      const cells = blinkCells(game, sp);
      expect(cells.length).toBeGreaterThan(20);
      for (const c of cells) expect(canBlinkTo(game, sp, c)).toBe(true);
    });

    it('a fizzled Blink leaves the caster where they were', () => {
      const game = castingGame(room(20, 5, 2, 3));
      rig(game, 1);
      cast(game, 'blink', { x: 6, y: 3 });
      expect(at(game)).toEqual({ x: 2, y: 3 });
    });

    it('does not land in deep water or lava', () => {
      const game = castingGame(levelFrom(['#########', '#<..=%..#', '#########']));
      expect(canBlinkTo(game, spell('blink'), { x: 4, y: 1 })).toBe(false);
      expect(canBlinkTo(game, spell('blink'), { x: 5, y: 1 })).toBe(false);
      expect(canBlinkTo(game, spell('blink'), { x: 6, y: 1 })).toBe(true);
    });
  });
});

describe('Spec 04: targeted spells', () => {
  it('Arcane Bolt removes one die; at one die it kills', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const m = monsterAt(8, 3, { alert: true, dice: 2, maxDice: 2, modifier: -6 });
    game.state.monsters.push(m);
    rig(game, 6);
    cast(game, 'arcane_bolt', m);
    expect(m.dice).toBe(1);
    rig(game, 6);
    cast(game, 'arcane_bolt', m);
    expect(game.state.monsters).not.toContain(m);
  });

  it('reaches 8 cells and needs a clear line: a creature in the way blocks it', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const near = monsterAt(5, 3, { alert: true, ...harmless });
    const far = monsterAt(10, 3, { alert: true, ...harmless }); // exactly 8 cells
    const tooFar = monsterAt(11, 2, { alert: true, ...harmless }); // 9 cells
    game.state.monsters.push(near, far, tooFar);
    expect(spellTargets(game, spell('arcane_bolt'))).toEqual([near]); // `far` is behind `near`
    game.state.monsters.splice(game.state.monsters.indexOf(near), 1);
    expect(spellTargets(game, spell('arcane_bolt'))).toEqual([far]);
  });

  it("the Mage's Arcane Bolt ability saves the die on a 2 to 3; anyone else loses it", () => {
    const run = (abilities: string[]) => {
      const game = castingGame(room(20, 5, 2, 3), { abilities });
      const m = monsterAt(6, 3, { alert: true, ...harmless });
      game.state.monsters.push(m);
      rig(game, 3);
      cast(game, 'arcane_bolt', m);
      expect(m.dice).toBe(29); // a 2 to 3 still works
      return game.state.player.pools.magic.dice;
    };
    expect(run(['arcane_bolt'])).toBe(3);
    expect(run([])).toBe(2);
  });

  it('an Arcane Bolt that hits alerts its target, and the noise wakes sleepers within 3 cells of it', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const target = monsterAt(8, 3, { awareness: 'asleep', ...harmless });
    const next = monsterAt(10, 3, { awareness: 'asleep', ...harmless });
    const far = monsterAt(14, 3, { awareness: 'asleep', ...harmless });
    game.state.monsters.push(target, next, far);
    rig(game, 6, 1); // the far sleeper's notice roll this round fails
    cast(game, 'arcane_bolt', target);
    expect(target.awareness).toBe('alert');
    expect(next.awareness).toBe('alert');
    expect(far.awareness).toBe('asleep');
  });

  it('turns a peaceful rival hostile', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const rival = monsterAt(7, 3, { kind: 'rival', hostile: false, awareness: 'unaware', ...harmless });
    game.state.monsters.push(rival);
    rig(game, 6);
    cast(game, 'arcane_bolt', rival);
    expect(rival).toMatchObject({ hostile: true, awareness: 'alert' });
  });

  it('Sleep puts an alert or unaware target to sleep for d6 rounds, and skips creatures already asleep', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const awake = monsterAt(6, 3, { alert: true, ...harmless });
    game.state.monsters.push(awake);
    rig(game, 6, 4); // the spell roll, then 4 rounds
    cast(game, 'sleep', awake);
    expect(statusOf(awake.statuses, 'asleep')).toMatchObject({ rounds: 3 }); // 4, less the round it was cast in
    const dozing = monsterAt(9, 4, { awareness: 'asleep', ...harmless });
    const unaware = monsterAt(5, 5, { awareness: 'unaware', ...harmless });
    game.state.monsters.push(dozing, unaware);
    expect(spellTargets(game, spell('sleep'))).not.toContain(dozing);
    expect(spellTargets(game, spell('sleep'))).toContain(unaware);
    expect(spellTargets(game, spell('arcane_bolt'))).toContain(dozing);
  });

  it('Sleep is quiet: the target stays unaware and nothing near it is woken', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const target = monsterAt(7, 3, { awareness: 'unaware', ...harmless });
    const bystander = monsterAt(9, 3, { awareness: 'asleep', ...harmless });
    game.state.monsters.push(target, bystander);
    rig(game, 6, 6, 1, 1); // the spell, its duration, then both notice rolls fail
    cast(game, 'sleep', target);
    expect(hasStatus(target.statuses, 'asleep')).toBe(true);
    expect(target.awareness).toBe('unaware');
    expect(bystander.awareness).toBe('asleep');
  });

  it('Hold stops the target acting for 3 rounds, then it attacks again', () => {
    const game = castingGame(room(10, 5, 2, 3), { combatDice: 6, combatMax: 6 });
    const m = monsterAt(3, 3, { alert: true, modifier: 30, dice: 5, maxDice: 5, fearless: true });
    game.state.monsters.push(m);
    rig(game, 6);
    cast(game, 'hold', m);
    expect(game.state.player.pools.combat.dice).toBe(6); // held in round 1
    wait(game, 2);
    expect(game.state.player.pools.combat.dice).toBe(6); // and in rounds 2 and 3
    expect(hasStatus(m.statuses, 'held')).toBe(false);
    wait(game);
    expect(game.state.player.pools.combat.dice).toBe(5); // free in round 4
  });

  it('Drain removes a die and restores a Combat die to the caster, nothing past the maximum', () => {
    const game = castingGame(room(20, 5, 2, 3), { combatDice: 1, combatMax: 3 });
    const m = monsterAt(5, 3, { alert: true, dice: 4, maxDice: 4, modifier: -6 });
    game.state.monsters.push(m);
    for (const [dice, mine] of [[3, 2], [2, 3], [1, 3]] as const) {
      rig(game, 6);
      cast(game, 'drain', m);
      expect([m.dice, game.state.player.pools.combat.dice]).toEqual([dice, mine]);
    }
  });

  it('Drain reaches only 4 cells, where Hold reaches 6', () => {
    const game = castingGame(room(20, 5, 2, 3));
    game.state.monsters.push(monsterAt(7, 3, { alert: true, ...harmless }));
    expect(spellTargets(game, spell('drain'))).toEqual([]);
    expect(spellTargets(game, spell('hold'))).toHaveLength(1);
  });

  it('Fear makes the target flee for 5 rounds, and it comes back afterwards', () => {
    const game = castingGame(room(30, 3, 2, 2));
    const m = monsterAt(5, 2, { alert: true, ...harmless });
    game.state.monsters.push(m);
    rig(game, 6);
    cast(game, 'fear', m);
    const gap = (): number => m.x - game.state.map.player.x;
    expect(gap()).toBe(4); // it stepped away this round
    wait(game, 3);
    expect(gap()).toBe(7);
    wait(game, 2);
    expect(hasStatus(m.statuses, 'frightened')).toBe(false);
    const before = gap();
    wait(game, 3);
    expect(gap()).toBeLessThan(before); // charging again
  });

  it('Fear does nothing to a creature that never flees (a boss, undead or construct)', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const boss = monsterAt(5, 3, { alert: true, role: 'boss', fearless: true, ...harmless });
    game.state.monsters.push(boss);
    rig(game, 6);
    const result = cast(game, 'fear', boss);
    expect(hasStatus(boss.statuses, 'frightened')).toBe(false);
    expect(result.messages.map((m) => m.text).join(' ')).toContain('unmoved');
  });
});

describe('Spec 04: area spells', () => {
  /** A centre creature, four inside its 3 x 3 and two outside it, all keeping still through round 1. */
  const crowd = (game: Game) => {
    const centre = alertInert(8, 3);
    const inside = [alertInert(7, 2), alertInert(9, 4), alertInert(8, 4)];
    const outside = [alertInert(10, 3), alertInert(6, 6)];
    game.state.monsters.push(centre, ...inside, ...outside);
    return { centre, inside, outside };
  };

  it('Fireball removes one die from every creature in the 3 x 3, and the preview marks exactly those', () => {
    const game = castingGame(room(20, 7, 2, 4));
    const { centre, inside, outside } = crowd(game);
    const t = new Targeting(game, { range: 8, shape: { kind: 'area', size: 3 } }, spellTargets(game, spell('fireball')));
    t.index = t.targets.indexOf(centre);
    const marked = t.marked();
    rig(game, 6);
    cast(game, 'fireball', centre);
    for (const m of [centre, ...inside]) {
      expect(m.dice, `${m.x},${m.y}`).toBe(29);
      expect(marked).toContain(m);
    }
    for (const m of outside) {
      expect(m.dice).toBe(30);
      expect(marked).not.toContain(m);
    }
    expect(game.state.player.pools.combat.dice).toBe(3); // the caster stood outside it
  });

  it('rolls once for the whole area: one die is spent, not one per creature', () => {
    const game = castingGame(room(20, 7, 2, 4));
    const { centre } = crowd(game);
    rig(game, 3);
    cast(game, 'fireball', centre);
    expect(game.state.player.pools.magic.dice).toBe(2);
  });

  it('a targeted area hits the caster too when they stand in the footprint, as the preview shows', () => {
    const game = castingGame(room(20, 7, 2, 4), { combatDice: 3, combatMax: 3 });
    const adjacent = alertInert(3, 4);
    game.state.monsters.push(adjacent);
    const t = new Targeting(game, { range: 8, shape: { kind: 'area', size: 3 } }, spellTargets(game, spell('fireball')));
    expect(t.includesPlayer()).toBe(true);
    rig(game, 6);
    cast(game, 'fireball', adjacent);
    expect(game.state.player.pools.combat.dice).toBe(2);
    expect(adjacent.dice).toBe(29);
  });

  it('a Fireball that catches a caster with no Combat dice is fatal, as any hit is', () => {
    const game = castingGame(room(20, 7, 2, 4), { combatDice: 0, combatMax: 3 });
    const adjacent = alertInert(3, 4);
    game.state.monsters.push(adjacent);
    rig(game, 6);
    cast(game, 'fireball', adjacent);
    expect(game.state.player.dead).toBe(true);
  });

  it('a Shield absorbs a Fireball that catches the caster', () => {
    const game = castingGame(room(20, 7, 2, 4), { combatDice: 3, combatMax: 3, shield: 5 });
    const adjacent = alertInert(3, 4);
    game.state.monsters.push(adjacent);
    rig(game, 6);
    cast(game, 'fireball', adjacent);
    expect(game.state.player.pools.combat.dice).toBe(3);
    expect(game.state.player.shield).toBe(0);
  });

  it('Blizzard slows every creature in a 5 x 5 for 5 rounds, and spares the caster standing outside it', () => {
    const game = castingGame(room(20, 9, 2, 5));
    const centre = alertInert(7, 5);
    const corner = alertInert(5, 3); // 2 cells from the centre each way: inside the 5 x 5
    const edge = alertInert(9, 7);
    const outside = alertInert(10, 5); // 3 cells: outside
    game.state.monsters.push(centre, corner, edge, outside);
    rig(game, 6);
    cast(game, 'blizzard', centre);
    for (const m of [centre, corner, edge]) expect(statusOf(m.statuses, 'slowed'), `${m.x},${m.y}`).toMatchObject({ rounds: 4 }); // 5, less the round it was cast in
    expect(hasStatus(outside.statuses, 'slowed')).toBe(false);
    expect(hasStatus(game.state.player.statuses, 'slowed')).toBe(false);
  });

  it('Blizzard catches the caster when the centre is within 2 cells', () => {
    const game = castingGame(room(20, 9, 2, 5));
    const near = alertInert(4, 5);
    game.state.monsters.push(near);
    rig(game, 6);
    cast(game, 'blizzard', near);
    expect(hasStatus(game.state.player.statuses, 'slowed')).toBe(true);
    expect(hasStatus(near.statuses, 'slowed')).toBe(true);
  });

  it('Thunderclap pushes every adjacent creature 2 cells straight away and spares the caster', () => {
    const game = castingGame(room(20, 9, 5, 5), { combatDice: 3, combatMax: 3 });
    const north = alertInert(5, 4);
    const east = alertInert(6, 5);
    const southWest = alertInert(4, 6); // a diagonal neighbour
    const distant = alertInert(5, 7); // 2 cells away: not adjacent
    game.state.monsters.push(north, east, southWest, distant);
    rig(game, 6);
    expect(cast(game, 'thunderclap').spent).toBe(true);
    expect({ x: north.x, y: north.y }).toEqual({ x: 5, y: 2 });
    expect({ x: east.x, y: east.y }).toEqual({ x: 8, y: 5 });
    expect({ x: southWest.x, y: southWest.y }).toEqual({ x: 2, y: 8 });
    expect({ x: distant.x, y: distant.y }).toEqual({ x: 5, y: 7 });
    expect(game.state.player.pools.combat.dice).toBe(3);
    expect(at(game)).toEqual({ x: 5, y: 5 });
    for (const m of [north, east, southWest]) expect(m.dice).toBe(30); // pushed, not hurt
  });

  it('a pushed creature stops at a wall or another creature, and Thunderclap works with nothing near', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const againstWall = alertInert(1, 3);
    const adjacent = alertInert(3, 3);
    const blocker = alertInert(5, 3);
    game.state.monsters.push(againstWall, adjacent, blocker);
    rig(game, 6);
    cast(game, 'thunderclap');
    expect(againstWall.x).toBe(1); // nowhere to go
    expect(adjacent.x).toBe(4); // one cell: the next is taken
    expect(blocker.x).toBe(5); // not adjacent, so not pushed
    const empty = castingGame(room(20, 5, 2, 3));
    rig(empty, 6);
    expect(cast(empty, 'thunderclap').spent).toBe(true);
  });

  it('Turn Undead makes undead within 6 cells flee for 10 rounds, and leaves everything else alone', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const ghoul = monsterAt(6, 3, { alert: true, undead: true, fearless: true, ...harmless });
    const farGhoul = monsterAt(9, 3, { alert: true, undead: true, fearless: true, ...harmless }); // 7 cells
    const orc = monsterAt(5, 2, { alert: true, ...harmless });
    game.state.monsters.push(ghoul, farGhoul, orc);
    rig(game, 6);
    cast(game, 'turn_undead');
    expect(statusOf(ghoul.statuses, 'frightened')).toMatchObject({ rounds: 9 }); // 10, less the round it was cast in
    expect(hasStatus(farGhoul.statuses, 'frightened')).toBe(false);
    expect(hasStatus(orc.statuses, 'frightened')).toBe(false);
    expect(hasStatus(game.state.player.statuses, 'frightened')).toBe(false);
    const gap = ghoul.x - game.state.map.player.x;
    wait(game, 3);
    expect(ghoul.x - game.state.map.player.x).toBeGreaterThan(gap);
  });
});
