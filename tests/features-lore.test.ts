import { describe, expect, it } from 'vitest';
import type { Game } from '../src/game/game.ts';
import { addJournal, journalByLevel } from '../src/game/features/index.ts';
import type { BookItem } from '../src/rules/items/types.ts';
import type { Level, LoreMark } from '../src/rules/world/level.ts';
import { CONTENT, gameAt, rig, room, withThings } from './helpers.ts';

const mark = (kind: LoreMark['kind'], text: string, extra: Partial<LoreMark> = {}): LoreMark => ({ kind, id: `${kind}_stub_01`, text, x: 3, y: 3, ...extra });
const level = (m: LoreMark, depth = 4): Level => ({ ...withThings(room(12, 5, 1, 1), { lore: [m] }), depth });
const bare = { pack: [], equipment: {}, coins: 0, combatDice: 4, combatMax: 4, magic: { step: 6 as const, dice: 2, max: 2 } };
const standOn = (lvl: Level) => gameAt(lvl, 2, 3, bare);
const interact = (game: Game) => game.act({ type: 'interact' })!;
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');

describe('Spec 06: signs, graffiti and the journal', () => {
  it('E on a sign reads it for one round, shows a window and keeps it once in the journal', () => {
    const game = standOn(level(mark('sign', 'The stairs are farther than they look.')));
    const result = interact(game);
    expect(result).toMatchObject({ spent: true, read: { title: 'Sign' } });
    expect(result.read!.lines.join(' ')).toContain('farther than they look');
    expect(game.state.player.journal).toHaveLength(1);
    expect(game.state.player.journal[0]).toMatchObject({ depth: 4, kind: 'sign' });
    interact(game);
    expect(game.state.player.journal).toHaveLength(1);
  });

  it('graffiti is read the same way', () => {
    const game = standOn(level(mark('graffiti', 'KILROY WAS HERE')));
    expect(interact(game)).toMatchObject({ spent: true, read: { title: 'Graffiti' } });
    expect(game.state.player.journal[0]!.kind).toBe('graffiti');
  });

  it('a long text is wrapped for the window and shortened in the log', () => {
    const text = 'word '.repeat(40).trim();
    const result = interact(standOn(level(mark('sign', text))));
    expect(result.read!.lines.length).toBeGreaterThan(1);
    expect(Math.max(...result.read!.lines.map((l) => l.length))).toBeLessThanOrEqual(56);
    expect(said(result)).toContain('...');
  });

  it('a book in the pack is read for a round, kept in the journal, and stays in the pack', () => {
    const book: BookItem = { kind: 'book', uid: 900, id: 'book_001', name: 'old book', value: 5 };
    const game = gameAt(level(mark('sign', 'x', { x: 9, y: 3 })), 2, 3, { ...bare, pack: [book] });
    const text = CONTENT.books.get('book_001')!.text;
    const result = game.use(book);
    expect(result).toMatchObject({ spent: true, read: { title: 'Book' } });
    expect(game.state.player.journal).toEqual([expect.objectContaining({ depth: 4, kind: 'book', id: 'book_001', text })]);
    expect(game.state.player.pack).toContain(book);
    game.use(book);
    expect(game.state.player.journal).toHaveLength(1);
  });
});

describe('Spec 06: the journal grouping', () => {
  const entry = (depth: number, id: string, kind: 'sign' | 'book' = 'sign') => ({ depth, kind, id, text: id });
  it('adds an entry once and groups by level in reading order', () => {
    const game = standOn(level(mark('sign', 'x')));
    const { player } = game.state;
    expect(addJournal(player, entry(7, 'a'))).toBe(true);
    expect(addJournal(player, entry(2, 'b'))).toBe(true);
    expect(addJournal(player, entry(7, 'c'))).toBe(true);
    expect(addJournal(player, entry(7, 'a'))).toBe(false);
    expect(addJournal(player, entry(7, 'a', 'book'))).toBe(true);
    expect(journalByLevel(player.journal).map((g) => [g.depth, g.entries.map((e) => e.id)])).toEqual([
      [2, ['b']],
      [7, ['a', 'c', 'a']],
    ]);
  });
});

describe('Spec 06: wall runes', () => {
  const rune = (extra: Partial<LoreMark> = {}) => mark('rune', 'K', { link: 'rune_word_1', index: 0, ...extra });
  /** The player stands beside the mark (it is on a wall or the cell next to them). */
  const stand = (extra: Partial<LoreMark> = {}) => standOn(level(rune(extra)));

  it('a Magic check of 4 or more teaches the letter, spends the rune and writes the journal', () => {
    const game = stand();
    rig(game, 5, 5);
    const result = interact(game);
    expect(result.spent).toBe(true);
    expect(game.state.player.letters.rune_word_1).toEqual({ 0: 'K' });
    expect(game.state.used.marks).toEqual([0]);
    expect(game.state.player.journal[0]).toMatchObject({ kind: 'rune' });
    expect(interact(game)).toMatchObject({ spent: false });
  });

  it('a middling roll leaves the rune to be tried again', () => {
    const game = stand();
    rig(game, 3, 3);
    expect(said(interact(game))).toContain('glows faintly');
    expect(game.state.used.marks).toEqual([]);
    expect(game.state.player.letters.rune_word_1).toBeUndefined();
  });

  it('a 1 discharges the rune: it burns, or it throws the player elsewhere', () => {
    const game = stand();
    rig(game, 1, 1);
    const result = interact(game);
    expect(game.state.used.marks).toEqual([0]);
    expect(said(result)).toMatch(/flares and burns you|world lurches/);
  });
});
