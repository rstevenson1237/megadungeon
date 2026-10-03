import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/core/rng.ts';
import { takeRest } from '../src/game/game.ts';
import { STEPS, type Pool, type Step } from '../src/rules/character/dice.ts';
import { classesFrom } from '../src/rules/character/classes.ts';
import { BOOK_CURSE_ROUNDS, readSpellbook, type Reader, type Spellbook } from '../src/rules/magic/learning.ts';
import { spellsFrom, startingSpells } from '../src/rules/magic/spells.ts';
import { hasStatus, statusOf, applyStatus } from '../src/rules/magic/status.ts';
import { SPELLS, castingGame, content, rig, room } from './helpers.ts';

const dealer = (...faces: number[]): Rng => ({ int: () => faces.shift()! }) as unknown as Rng;
const reader = (step: Step, dice = 2, extra: Partial<Reader> = {}): Reader => ({ magic: { step, dice, max: 6 } as Pool, spells: [], rests: 0, mode: 'normal', ...extra });
const book = (spell = 'fireball'): Spellbook => ({ spell });

describe('Spec 04: reading a spellbook is a Magic check', () => {
  it('every face of every step: 4 or more learns the spell, 2 to 3 fails, 1 destroys the book; a check costs no die', () => {
    for (const step of STEPS) {
      for (let face = 1; face <= step; face++) {
        const r = reader(step);
        const b = book();
        const outcome = readSpellbook(dealer(face), b, r);
        expect(outcome.kind, `d${step} face ${face}`).toBe(face >= 4 ? 'learned' : face >= 2 ? 'failed' : 'destroyed');
        expect(r.spells, `d${step} face ${face}`).toEqual(face >= 4 ? ['fireball'] : []);
        expect(r.magic.dice).toBe(2);
      }
    }
  });

  it('a failed book cannot be tried again until the character has taken a village rest', () => {
    const r = reader(6);
    const b = book();
    expect(readSpellbook(dealer(3), b, r).kind).toBe('failed');
    const noRoll = { int: () => { throw new Error('rolled'); } } as unknown as Rng;
    expect(readSpellbook(noRoll, b, r).kind).toBe('wait');
    expect(readSpellbook(noRoll, b, r).kind).toBe('wait');
    r.rests++;
    expect(readSpellbook(dealer(5), b, r).kind).toBe('learned');
    expect(r.spells).toEqual(['fireball']);
  });

  it('a failure after one rest waits for the next rest, not the same one', () => {
    const r = reader(6, 2, { rests: 3 });
    const b = book();
    readSpellbook(dealer(2), b, r);
    expect(b.failedAtRest).toBe(3);
    r.rests = 4;
    expect(readSpellbook(dealer(2), b, r).kind).toBe('failed');
    expect(b.failedAtRest).toBe(4);
    expect(readSpellbook({ int: () => 6 } as unknown as Rng, b, r).kind).toBe('wait');
  });

  it('a spell already known is not rolled for and the book is kept', () => {
    const r = reader(6, 2, { spells: ['fireball'] });
    expect(readSpellbook({ int: () => { throw new Error('rolled'); } } as unknown as Rng, book(), r).kind).toBe('known');
  });

  it('an empty Magic pool rolls with disadvantage, and Blessed and Cursed apply to the check', () => {
    expect(readSpellbook(dealer(6, 1), book(), reader(6, 0)).kind).toBe('destroyed');
    expect(readSpellbook(dealer(2, 5), book(), reader(6, 2, { mode: 'advantage' })).kind).toBe('learned');
    expect(readSpellbook(dealer(2, 5), book(), reader(6, 2, { mode: 'disadvantage' })).kind).toBe('failed');
  });
});

describe('Spec 04: reading a spellbook in the game', () => {
  const newGame = () => castingGame(room(10, 3, 1, 2), { spells: ['heal'] });

  it('learning adds the spell for good, uses the book up and costs a round', () => {
    const game = newGame();
    rig(game, 6);
    const result = game.readBook(book('fireball'));
    expect(result).toMatchObject({ spent: true, used: true });
    expect(game.state.player.spells).toEqual(['heal', 'fireball']);
    expect(game.state.round).toBe(2);
    expect(result.messages.map((m) => m.text)).toContain('You learn Fireball.');
  });

  it('a 2 to 3 keeps the book and costs a round; the retry is free to refuse until a rest, then works', () => {
    const game = newGame();
    const b = book('fireball');
    rig(game, 3);
    expect(game.readBook(b)).toMatchObject({ spent: true, used: false });
    const refused = game.readBook(b);
    expect(refused).toMatchObject({ spent: false, used: false });
    expect(game.state.round).toBe(2);
    takeRest(game.state.player);
    rig(game, 6);
    expect(game.readBook(b)).toMatchObject({ spent: true, used: true });
    expect(game.state.player.spells).toContain('fireball');
  });

  it('a 1 destroys the book and leaves the reader Cursed for 20 rounds', () => {
    const game = newGame();
    rig(game, 1);
    expect(game.readBook(book('fireball'))).toMatchObject({ spent: true, used: true });
    expect(game.state.player.spells).toEqual(['heal']);
    expect(statusOf(game.state.player.statuses, 'cursed')!.rounds).toBe(BOOK_CURSE_ROUNDS - 1);
    for (let i = 0; i < 19; i++) game.act({ type: 'wait' });
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(false);
  });

  it('a spell already known is not read again', () => {
    const game = newGame();
    expect(game.readBook(book('heal'))).toMatchObject({ spent: false, used: false });
  });

  it('Cursed reads with disadvantage and Blessed with advantage', () => {
    const cursed = newGame();
    applyStatus(cursed.state.player.statuses, 'cursed', null);
    rig(cursed, 6, 2);
    expect(cursed.readBook(book('fireball')).used).toBe(false); // keeps the lower die: a 2
    const blessed = newGame();
    applyStatus(blessed.state.player.statuses, 'blessed', 9);
    rig(blessed, 2, 6);
    expect(blessed.readBook(book('fireball')).used).toBe(true);
  });

  it('a village rest restores every die and counts for the next retry', () => {
    const game = newGame();
    game.state.player.pools.magic.dice = 0;
    takeRest(game.state.player);
    expect(game.state.player.pools.magic.dice).toBe(3);
    expect(game.state.player.rests).toBe(1);
  });
});

describe('Spec 04: starting spells', () => {
  const classes = classesFrom(content().bundle);
  const byId = (id: string) => classes.find((c) => c.id === id)!;
  const draw = (id: string, seed = 7, name = 'Mara') => startingSpells(seed, { name, classId: id }, byId(id), spellsFrom(content().bundle));

  it('gives each class the number the spec lists, and none to the rest', () => {
    const expected: Record<string, number> = { mage: 3, priest: 2, sorcerer: 2, necromancer: 2, warlock: 2, druid: 2, shaman: 2, illusionist: 2, paladin: 1, bard: 1 };
    for (const c of classes) expect(draw(c.id), c.id).toHaveLength(expected[c.id] ?? 0);
  });

  it('a Mage always has Arcane Bolt and a Priest always has Heal, plus the rest drawn from the list with no repeats', () => {
    for (let seed = 0; seed < 200; seed++) {
      const mage = draw('mage', seed);
      expect(mage[0]).toBe('arcane_bolt');
      expect(new Set(mage).size).toBe(3);
      const priest = draw('priest', seed);
      expect(priest[0]).toBe('heal');
      expect(new Set(priest).size).toBe(2);
      for (const id of [...mage, ...priest]) expect(SPELLS.map((s) => s.id)).toContain(id);
    }
  });

  it('is fixed for a character and seed, and varies between characters, seeds and classes', () => {
    expect(draw('mage', 5, 'Mara')).toEqual(draw('mage', 5, 'Mara'));
    const seen = new Set<string>();
    for (let seed = 0; seed < 100; seed++) seen.add(draw('sorcerer', seed).join());
    expect(seen.size).toBeGreaterThan(20);
    const names = new Set(['Mara', 'Tomas', 'Ilse', 'Garrick', 'Wick', 'Sorrel'].map((n) => draw('mage', 5, n).join()));
    expect(names.size).toBeGreaterThan(2);
  });

  it('can reach every spell on the starting list across seeds, and none of the others', () => {
    const reached = new Set<string>();
    for (let seed = 0; seed < 300; seed++) for (const id of draw('mage', seed)) reached.add(id);
    const starting = SPELLS.filter((s) => s.tags?.includes('starting')).map((s) => s.id);
    expect(starting).toHaveLength(15);
    expect([...reached].sort()).toEqual([...starting].sort());
  });
});
