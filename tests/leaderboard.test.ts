import { describe, expect, it } from 'vitest';
import { BOARD_KEY, BOARD_SIZE, type BoardEntry, Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { boardEntry, nextBank, recoverableItems } from '../src/game/lifecycle.ts';
import { gear, magic, townRun } from './helpers.ts';

const entry = (id: string, deepest: number, score: number, extra: Partial<BoardEntry> = {}): BoardEntry => ({
  id, seed: 1, name: id, className: 'Thief', level: 3, deepest, kills: 4, score, outcome: 'died', cause: 'The goblin kills you.', diedAtLevel: deepest, date: '2026-10-01T00:00:00.000Z', ...extra,
});

describe('Spec 09: the leaderboard', () => {
  it('sorts by deepest level, then score', () => {
    const board = new Leaderboard(new MemoryStorage());
    board.record(entry('a', 5, 100));
    board.record(entry('b', 9, 10));
    board.record(entry('c', 5, 500));
    board.record(entry('d', 9, 20));
    expect(board.view().map((e) => e.id)).toEqual(['d', 'b', 'c', 'a']);
  });

  it('keeps the best 100 entries', () => {
    const board = new Leaderboard(new MemoryStorage());
    for (let i = 0; i < 130; i++) board.record(entry(`c${i}`, 1 + (i % 40), i));
    const all = board.all();
    expect(all).toHaveLength(BOARD_SIZE);
    expect(Math.min(...all.map((e) => e.deepest))).toBeGreaterThanOrEqual(3);
  });

  it('shows all runs, or only the seed of the day for a date', () => {
    const board = new Leaderboard(new MemoryStorage());
    board.record(entry('plain', 4, 10));
    board.record(entry('today', 3, 10, { daily: '2026-10-01' }));
    board.record(entry('yesterday', 8, 10, { daily: '2026-09-30' }));
    expect(board.view().map((e) => e.id)).toEqual(['yesterday', 'plain', 'today']);
    expect(board.view({ daily: '2026-10-01' }).map((e) => e.id)).toEqual(['today']);
    expect(board.view({ daily: '2026-01-01' })).toEqual([]);
  });

  it('is kept in local storage and survives a reload; a damaged value reads as empty', () => {
    const storage = new MemoryStorage();
    new Leaderboard(storage).record(entry('a', 2, 1));
    expect(new Leaderboard(storage).all()).toHaveLength(1);
    storage.setItem(BOARD_KEY, '{not json');
    expect(new Leaderboard(storage).all()).toEqual([]);
    storage.setItem(BOARD_KEY, '{"a":1}');
    expect(new Leaderboard(storage).all()).toEqual([]);
  });

  it('a character who dies after winning updates their entry rather than adding a second one, and keeps the win', () => {
    const board = new Leaderboard(new MemoryStorage());
    board.record(entry('hero', 100, 9000, { outcome: 'reached_100', cause: undefined, diedAtLevel: undefined } as Partial<BoardEntry>));
    board.record(entry('hero', 100, 9500, { outcome: 'final_boss', cause: undefined } as Partial<BoardEntry>));
    expect(board.all()).toHaveLength(1);
    expect(board.all()[0]!.outcome).toBe('final_boss');
    board.record(entry('hero', 100, 9800, { outcome: 'died', cause: 'The poison kills you.', diedAtLevel: 100 }));
    const [only, ...rest] = board.all();
    expect(rest).toEqual([]);
    expect(only).toMatchObject({ outcome: 'final_boss', score: 9800, cause: 'The poison kills you.', diedAtLevel: 100 });
  });
});

describe('Spec 09: what goes on the board and what a new character keeps', () => {
  it('an entry holds the seed, character, deepest level, kills, score and outcome', () => {
    const run = townRun(99, {}, 0, { characterId: 'mara-1', daily: '2026-10-01' });
    run.character.xp = 1234;
    run.character.level = 2;
    run.player.stats.deepest = 7;
    run.player.stats.kills = 12;
    run.player.dead = true;
    run.player.deathCause = 'The goblin kills you.';
    const e = boardEntry(run, 'died', new Date('2026-10-01T10:00:00Z'));
    expect(e).toEqual({
      id: 'mara-1', seed: 99, daily: '2026-10-01', name: 'Mara', className: 'Thief', level: 2, deepest: 7, kills: 12, score: 1234,
      outcome: 'died', cause: 'The goblin kills you.', diedAtLevel: 0, date: '2026-10-01T10:00:00.000Z',
    });
  });

  it('a living character\'s entry (a win) has no cause of death', () => {
    const run = townRun(99);
    expect(boardEntry(run, 'reached_100').cause).toBeUndefined();
  });

  it('a new character on the same seed starts with 20 gp plus 10% of the old bank, rounded down', () => {
    expect(nextBank(0)).toBe(20);
    expect(nextBank(99)).toBe(29);
    expect(nextBank(1000)).toBe(120);
    expect(nextBank(1239)).toBe(143);
  });

  it('any carried or worn item can be recovered, an artifact included', () => {
    const artifact = magic('ring_might', false);
    const run = townRun(1, { pack: [gear('dagger', 'normal')], equipment: { ring1: artifact, main: gear('mace', 'fine') } });
    const items = recoverableItems(run.player);
    expect(items).toHaveLength(3);
    expect(items).toContain(artifact);
  });
});
