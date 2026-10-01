import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '../src/core/rng.ts';
import { createCharacter, totalDice, type ClassDef } from '../src/rules/character/character.ts';
import {
  STEPS, classifyFace, rollFace, rollPool, stepUp, type Pool, type RollMode, type RollType, type Step,
} from '../src/rules/character/dice.ts';
import { hitCharacter, restAll, restoreDice, waitRound } from '../src/rules/character/health.ts';
import { drawMinor, eligibleMinors } from '../src/rules/character/minor.ts';
import {
  LEVEL_XP, bankTreasure, levelForXp, levelUp, levelsOwed, poolsWithRoom,
} from '../src/rules/character/progression.ts';
import { meleeOutcome } from '../src/rules/combat/melee.ts';
import { gameOn, room } from './helpers.ts';

// The four core classes of Spec 03, with a 12-entry minor pool each (one stackable: Pack Mule).
const pool12 = (prefix: string) => [
  { id: 'pack_mule', stackable: true },
  ...Array.from({ length: 11 }, (_, i) => ({ id: `${prefix}_${i + 1}` })),
];
const cls = (id: string, start: [Step, Step, Step], steps: ['combat' | 'skill' | 'magic', 'combat' | 'skill' | 'magic', 'combat' | 'skill' | 'magic']): ClassDef => ({
  id,
  start: { combat: start[0], skill: start[1], magic: start[2] },
  steps: { 4: steps[0], 7: steps[1], 9: steps[2] },
  minorAbilities: pool12(id),
});
const WARRIOR = cls('warrior', [8, 6, 4], ['combat', 'combat', 'skill']);
const MAGE = cls('mage', [4, 6, 8], ['magic', 'magic', 'skill']);
const THIEF = cls('thief', [6, 8, 4], ['skill', 'skill', 'combat']);
const PRIEST = cls('priest', [6, 6, 6], ['magic', 'combat', 'magic']);
const LEVEL_10: [typeof WARRIOR, Step[]][] = [
  [WARRIOR, [12, 8, 4]],
  [MAGE, [4, 8, 12]],
  [THIEF, [8, 12, 4]],
  [PRIEST, [8, 6, 10]],
];

/** A stand-in generator that deals the given faces in order. */
const dealer = (...faces: number[]): Rng => ({ int: () => faces.shift()! }) as unknown as Rng;
const pool = (step: Step, dice: number, max = 3): Pool => ({ step, dice, max });

/** Exact outcome shares of one d`sides` roll under a mode, by enumerating every face pair. */
function shares(sides: number, mode: RollMode, type: RollType) {
  const out = { success: 0, mid: 0, low: 0 };
  let n = 0;
  const kept: number[] = [];
  for (let a = 1; a <= sides; a++) {
    for (let b = 1; b <= (mode === 'normal' ? 1 : sides); b++) {
      kept.push(mode === 'normal' ? a : mode === 'advantage' ? Math.max(a, b) : Math.min(a, b));
    }
  }
  for (const face of kept) {
    const o = classifyFace(type, face);
    if (face >= 4) out.success++;
    else if (face >= 2) out.mid++;
    else out.low++;
    n++;
    expect(o.success).toBe(face >= 4 || (type !== 'check' && face >= 2));
  }
  return { success: out.success / n, mid: out.mid / n, low: out.low / n };
}

describe('Spec 03: roll resolution', () => {
  it('matches the success table for every step (normal)', () => {
    const expected: Record<number, [number, number, number]> = {
      4: [0.25, 0.5, 0.25], 6: [0.5, 1 / 3, 1 / 6], 8: [0.625, 0.25, 0.125], 10: [0.7, 0.2, 0.1], 12: [0.75, 1 / 6, 1 / 12],
    };
    for (const step of STEPS) {
      const s = shares(step, 'normal', 'check');
      expect(s.success).toBeCloseTo(expected[step]![0], 10);
      expect(s.mid).toBeCloseTo(expected[step]![1], 10);
      expect(s.low).toBeCloseTo(expected[step]![2], 10);
    }
  });

  it('classifies every face of every step for every roll type', () => {
    for (const step of STEPS) {
      for (let face = 1; face <= step; face++) {
        const check = classifyFace('check', face);
        expect(check).toEqual({ success: face >= 4, dieLost: false, negative: face === 1 });
        for (const type of ['skill', 'spell', 'ranged'] as const) {
          const o = classifyFace(type, face);
          expect(o).toEqual({ success: face >= 2, dieLost: face < 4, negative: false });
        }
      }
    }
  });

  it('advantage keeps the higher of two dice and disadvantage the lower', () => {
    expect(rollFace(dealer(2, 5), 6, 'advantage')).toBe(5);
    expect(rollFace(dealer(5, 2), 6, 'advantage')).toBe(5);
    expect(rollFace(dealer(2, 5), 6, 'disadvantage')).toBe(2);
    expect(rollFace(dealer(5, 2), 6, 'disadvantage')).toBe(2);
    expect(rollFace(dealer(3), 6)).toBe(3);
  });

  it('advantage improves and disadvantage worsens every step, with at most one die lost', () => {
    for (const step of STEPS) {
      const normal = shares(step, 'normal', 'spell').success;
      expect(shares(step, 'advantage', 'spell').success).toBeGreaterThan(normal);
      expect(shares(step, 'disadvantage', 'spell').success).toBeLessThan(normal);
      for (const mode of ['advantage', 'disadvantage'] as const) {
        const p = pool(step, 3);
        rollPool(createRng(7), p, 'spell', mode);
        expect(p.dice).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('a check never costs a die; a 1 adds a negative effect and 2 to 3 is a plain failure', () => {
    const p = pool(6, 3);
    expect(rollPool(dealer(1), p, 'check')).toMatchObject({ success: false, dieLost: false, negative: true });
    expect(rollPool(dealer(3), p, 'check')).toMatchObject({ success: false, dieLost: false, negative: false });
    expect(rollPool(dealer(4), p, 'check')).toMatchObject({ success: true, dieLost: false, negative: false });
    expect(p.dice).toBe(3);
  });

  it('skill uses, spells and ranged attacks lose the die on 2 to 3 (success) and on 1 (failure)', () => {
    for (const type of ['skill', 'spell', 'ranged'] as const) {
      const p = pool(8, 3);
      expect(rollPool(dealer(6), p, type)).toMatchObject({ success: true, dieLost: false });
      expect(p.dice).toBe(3);
      expect(rollPool(dealer(2), p, type)).toMatchObject({ success: true, dieLost: true });
      expect(p.dice).toBe(2);
      expect(rollPool(dealer(1), p, type)).toMatchObject({ success: false, dieLost: true });
      expect(p.dice).toBe(1);
    }
  });

  it('an empty pool rolls at disadvantage and loses nothing further', () => {
    const p = pool(6, 0);
    const r = rollPool(dealer(5, 2), p, 'spell', 'advantage'); // disadvantage wins over advantage
    expect(r).toMatchObject({ face: 2, fromEmpty: true, success: true, dieLost: false });
    expect(rollPool(dealer(4, 1), p, 'ranged')).toMatchObject({ face: 1, success: false, dieLost: false });
    expect(p.dice).toBe(0);
    // a check from an empty pool still earns the negative effect on a 1
    expect(rollPool(dealer(1, 1), p, 'check').negative).toBe(true);
  });

  it('draws faces of the right step from the seeded generator', () => {
    const rng = createRng(99);
    for (const step of STEPS) {
      for (let i = 0; i < 500; i++) {
        const f = rollFace(rng, step, i % 3 === 0 ? 'normal' : i % 3 === 1 ? 'advantage' : 'disadvantage');
        expect(f).toBeGreaterThanOrEqual(1);
        expect(f).toBeLessThanOrEqual(step);
      }
    }
  });

  it('steps up one at a time and never passes d12', () => {
    expect(STEPS.map(stepUp)).toEqual([6, 8, 10, 12, 12]);
  });
});

describe('Spec 03: melee and health', () => {
  it('a tie hits both sides; the higher total hits only the other', () => {
    expect(meleeOutcome(4, 4)).toEqual({ defenderHit: true, attackerHit: true });
    expect(meleeOutcome(5, 4)).toEqual({ defenderHit: true, attackerHit: false });
    expect(meleeOutcome(3, 4)).toEqual({ defenderHit: false, attackerHit: true });
  });

  it('a hit removes one Combat die and is fatal only when none are left', () => {
    const c = createCharacter('Hero', WARRIOR);
    c.pools.combat = pool(8, 2);
    expect(hitCharacter(c)).toBe('hit');
    expect(hitCharacter(c)).toBe('hit');
    expect(c.pools.combat.dice).toBe(0);
    expect(hitCharacter(c)).toBe('killed');
  });

  it('waiting 10 rounds restores one Combat die and starts the count again', () => {
    const combat = { dice: 0, max: 2 };
    let waited = 0;
    for (let i = 0; i < 9; i++) ({ waited } = waitRound(waited, combat));
    expect(combat.dice).toBe(0);
    const tenth = waitRound(waited, combat);
    expect(tenth).toEqual({ waited: 0, restored: true });
    expect(combat.dice).toBe(1);
  });

  it('waiting does not bank a count at full health and takes the interval as a parameter (Hardy: 8)', () => {
    const full = { dice: 2, max: 2 };
    expect(waitRound(5, full)).toEqual({ waited: 0, restored: false });
    const hurt = { dice: 0, max: 2 };
    let waited = 0;
    for (let i = 0; i < 7; i++) ({ waited } = waitRound(waited, hurt, 8));
    expect(waitRound(waited, hurt, 8).restored).toBe(true);
  });

  it('in the turn loop, 10 consecutive waits restore a die and an action or move resets the count', () => {
    const g = gameOn(room(6, 3, 1, 1), { combatDice: 0, combatMax: 2 });
    for (let i = 0; i < 9; i++) g.act({ type: 'wait' });
    expect(g.state.player.combatDice).toBe(0);
    g.act({ type: 'move', dx: 1, dy: 0 }); // a move resets the count
    expect(g.state.player.waited).toBe(0);
    for (let i = 0; i < 9; i++) g.act({ type: 'wait' });
    expect(g.state.player.combatDice).toBe(0);
    const last = g.act({ type: 'wait' });
    expect(g.state.player.combatDice).toBe(1);
    expect(last?.messages.some((m) => /strength/.test(m.text))).toBe(true);
    for (let i = 0; i < 10; i++) g.act({ type: 'wait' });
    expect(g.state.player.combatDice).toBe(2);
    for (let i = 0; i < 25; i++) g.act({ type: 'wait' }); // full: nothing banks
    expect(g.state.player.combatDice).toBe(2);
  });

  it('the count builds one round at a time while waiting', () => {
    const g = gameOn(room(6, 3, 1, 1), { combatDice: 0, combatMax: 2 });
    for (let i = 0; i < 5; i++) g.act({ type: 'wait' });
    expect(g.state.player.waited).toBe(5);
  });

  it('Skill and Magic dice do not recover by waiting; only restoreDice or a village rest returns them', () => {
    const c = createCharacter('Hero', MAGE);
    c.pools.magic = pool(8, 0, 3);
    for (let i = 0; i < 30; i++) c.waited = waitRound(c.waited, c.pools.combat).waited;
    expect(c.pools.magic.dice).toBe(0);
    expect(restoreDice(c.pools.magic, 5)).toBe(3);
    expect(c.pools.magic.dice).toBe(3);
  });

  it('village rest restores every die in every pool', () => {
    const c = createCharacter('Hero', WARRIOR);
    for (const p of Object.values(c.pools)) { p.max = 4; p.dice = 0; }
    c.waited = 6;
    restAll(c);
    for (const p of Object.values(c.pools)) expect(p.dice).toBe(4);
    expect(c.waited).toBe(0);
  });
});

describe('Spec 03: creation, XP and leveling', () => {
  it('starts at level 1 with one full die per pool at the class steps', () => {
    const c = createCharacter('Hero', MAGE);
    expect(c).toMatchObject({ level: 1, xp: 0, minorAbilities: [], waited: 0 });
    expect(c.pools.combat).toEqual({ step: 4, dice: 1, max: 1 });
    expect(c.pools.skill).toEqual({ step: 6, dice: 1, max: 1 });
    expect(c.pools.magic).toEqual({ step: 8, dice: 1, max: 1 });
    expect(totalDice(c)).toBe(3);
  });

  it('crosses each threshold at exactly the listed total', () => {
    expect(LEVEL_XP).toEqual([0, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000]);
    for (let level = 2; level <= 10; level++) {
      expect(levelForXp(LEVEL_XP[level - 1]! - 1)).toBe(level - 1);
      expect(levelForXp(LEVEL_XP[level - 1]!)).toBe(level);
    }
    expect(levelForXp(10_000_000)).toBe(10);
  });

  it('banking gives 1 XP per gp and owes one level-up per level crossed, run in order', () => {
    const c = createCharacter('Hero', WARRIOR);
    expect(bankTreasure(c, 1999)).toBe(1999);
    expect(levelsOwed(c)).toBe(0);
    expect(levelUp(1, c, WARRIOR, 'combat')).toBeNull(); // nothing owed
    bankTreasure(c, 1);
    expect(levelsOwed(c)).toBe(1);
    bankTreasure(c, 6000); // total 8000: levels 2, 3 and 4 in all
    expect(levelsOwed(c)).toBe(3);
    const levels: number[] = [];
    while (levelsOwed(c) > 0) levels.push(levelUp(1, c, WARRIOR, 'skill')!.level);
    expect(levels).toEqual([2, 3, 4]);
    expect(c.level).toBe(4);
  });

  it('a level up adds one full die to the chosen pool, a minor ability and any step change', () => {
    const c = createCharacter('Hero', WARRIOR);
    bankTreasure(c, 8000);
    const a = levelUp(5, c, WARRIOR, 'combat')!;
    expect(a).toMatchObject({ level: 2, pool: 'combat' });
    expect(c.pools.combat).toMatchObject({ dice: 2, max: 2 });
    expect(a.minor).toBeDefined();
    expect(a.stepped).toBeUndefined();
    levelUp(5, c, WARRIOR, 'combat');
    const d = levelUp(5, c, WARRIOR, 'skill')!;
    expect(d).toMatchObject({ level: 4, stepped: 'combat' });
    expect(c.pools.combat.step).toBe(10);
    expect(c.pools.skill).toMatchObject({ dice: 2, max: 2 });
    expect(c.minorAbilities).toHaveLength(3);
    expect(d.messages.length).toBeGreaterThan(1);
  });

  it('the new die arrives full even when the pool was hurt', () => {
    const c = createCharacter('Hero', WARRIOR);
    c.pools.combat.dice = 0;
    bankTreasure(c, 2000);
    levelUp(5, c, WARRIOR, 'combat');
    expect(c.pools.combat).toMatchObject({ dice: 1, max: 2 });
  });

  it('no pool holds more than 6 dice, and a full pool refuses the die', () => {
    const c = createCharacter('Hero', WARRIOR);
    c.pools.combat = pool(8, 6, 6);
    bankTreasure(c, 2000);
    expect(poolsWithRoom(c)).toEqual(['skill', 'magic']);
    expect(levelUp(5, c, WARRIOR, 'combat')).toBeNull();
    expect(c.level).toBe(1);
    expect(levelUp(5, c, WARRIOR, 'skill')).not.toBeNull();
  });

  it('XP keeps counting past level 10 and owes nothing more', () => {
    const c = createCharacter('Hero', WARRIOR);
    bankTreasure(c, 512_000);
    while (levelsOwed(c) > 0) levelUp(3, c, WARRIOR, poolsWithRoom(c)[0]!);
    expect(c.level).toBe(10);
    bankTreasure(c, 700_000);
    expect(c.xp).toBe(1_212_000);
    expect(levelsOwed(c)).toBe(0);
    expect(levelUp(3, c, WARRIOR, 'magic')).toBeNull();
  });

  it.each(LEVEL_10)('%s reaches level 10 with 12 dice and the class table steps', (def, steps) => {
    const c = createCharacter('Hero', def);
    bankTreasure(c, 512_000);
    const placed = ['combat', 'skill', 'magic'] as const;
    let i = 0;
    while (levelsOwed(c) > 0) {
      const room = poolsWithRoom(c);
      levelUp(11, c, def, room.includes(placed[i % 3]!) ? placed[i % 3]! : room[0]!);
      i++;
    }
    expect(c.level).toBe(10);
    expect(totalDice(c)).toBe(12);
    expect([c.pools.combat.step, c.pools.skill.step, c.pools.magic.step]).toEqual(steps);
    for (const p of Object.values(c.pools)) {
      expect(p.max).toBeLessThanOrEqual(6);
      expect(p.step).toBeLessThanOrEqual(12);
    }
    expect(c.minorAbilities).toHaveLength(9);
  });
});

describe('Spec 03: minor abilities', () => {
  const play = (seed: number, name: string, def = WARRIOR) => {
    const c = createCharacter(name, def);
    for (let level = 2; level <= 10; level++) {
      c.level = level - 1;
      c.xp = LEVEL_XP[level - 1]!;
      levelUp(seed, c, def, poolsWithRoom(c)[0]!);
    }
    return c.minorAbilities;
  };

  it('the same character on the same seed always draws the same abilities', () => {
    for (let seed = 0; seed < 20; seed++) expect(play(seed, 'Hero')).toEqual(play(seed, 'Hero'));
  });

  it('draws vary between seeds and between characters', () => {
    const base = play(1, 'Hero').join();
    const seeds = new Set(Array.from({ length: 30 }, (_, s) => play(s, 'Hero').join()));
    const names = new Set(['Ann', 'Bob', 'Cy', 'Di', 'Ed', 'Flo', 'Gus', 'Hal'].map((n) => play(1, n).join()));
    expect(seeds.size).toBeGreaterThan(20);
    expect(names.size).toBeGreaterThan(5);
    expect(base).toBeTruthy();
  });

  it('nine draws per character, repeating only stackable entries', () => {
    let packMuleRepeats = 0;
    for (let seed = 0; seed < 300; seed++) {
      const drawn = play(seed, `Hero${seed}`);
      expect(drawn).toHaveLength(9);
      const counts = new Map<string, number>();
      for (const id of drawn) counts.set(id, (counts.get(id) ?? 0) + 1);
      for (const [id, n] of counts) {
        if (id === 'pack_mule') packMuleRepeats += n > 1 ? 1 : 0;
        else expect(n).toBe(1);
      }
      for (const id of drawn) expect(WARRIOR.minorAbilities.some((a) => a.id === id)).toBe(true);
    }
    expect(packMuleRepeats).toBeGreaterThan(0); // stackable entries do repeat
  });

  it('level 1 and levels past 10 draw nothing; drawn single entries leave the eligible set', () => {
    const c = createCharacter('Hero', WARRIOR);
    expect(drawMinor(1, c, WARRIOR, 1)).toBeNull();
    expect(drawMinor(1, c, WARRIOR, 11)).toBeNull();
    const first = drawMinor(1, c, WARRIOR, 2)!;
    const left = eligibleMinors(c, WARRIOR).map((a) => a.id);
    expect(left.includes(first.id)).toBe(first.stackable === true);
    expect(left.length).toBe(first.stackable ? 12 : 11);
  });
});
