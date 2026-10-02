// Lore and the journal (Spec 06, "Lore", and the clarifications of task 2.10): reading signs, graffiti, wall runes
// and books, and the journal that keeps every entry once, grouped by level.

import type { LogMessage } from '../../core/log.ts';
import type { BookItem } from '../../rules/items/types.ts';
import type { Game, JournalEntry, PlayerState } from '../game.ts';
import { wrapText } from '../log.ts';
import { check, depthOf } from './common.ts';
import { negative } from './hidden.ts';
import { hasMajor } from '../abilities.ts';
import { weaknessOf } from '../connective.ts';

/** The width a text window wraps its lines to. */
export const READ_WIDTH = 56;

/** Add an entry to the journal unless the same one is there: one per level, kind and id (Spec 06). True when it is new. */
export function addJournal(player: PlayerState, entry: JournalEntry): boolean {
  if (player.journal.some((e) => e.depth === entry.depth && e.kind === entry.kind && e.id === entry.id)) return false;
  player.journal.push(entry);
  return true;
}

/** The journal grouped by level, the shallowest first, each level's entries in the order they were read (Spec 06). */
export function journalByLevel(journal: readonly JournalEntry[]): { depth: number; entries: JournalEntry[] }[] {
  const depths = [...new Set(journal.map((e) => e.depth))].sort((a, b) => a - b);
  return depths.map((depth) => ({ depth, entries: journal.filter((e) => e.depth === depth) }));
}

/** Index of the wall mark on a cell, or -1. */
export const markAt = (game: Game, x: number, y: number): number => game.state.map.level.lore.findIndex((m) => m.x === x && m.y === y);

/** Show text in a window and put a summary line in the log. */
function show(game: Game, title: string, text: string, kind: LogMessage['kind'], messages: LogMessage[], verb: string): void {
  const summary = text.length > 48 ? `${text.slice(0, 47)}...` : text;
  messages.push({ kind, text: `You ${verb}: "${summary}"` });
  game.pending.read = { title, lines: wrapText(text, READ_WIDTH) };
}

/**
 * E at a wall mark (Spec 06): a sign or graffiti is read and kept; a rune is a Magic check, 4 or more teaching its
 * letter, a 1 discharging it, either spending it. Returns whether a round was spent.
 */
export function readMark(game: Game, index: number, messages: LogMessage[]): boolean {
  const { player, used, map } = game.state;
  const mark = map.level.lore[index]!;
  const depth = depthOf(game);
  const where = `${mark.id}@${mark.x},${mark.y}`;
  if (mark.kind === 'sign' || mark.kind === 'graffiti') {
    // A lore chain's last entry that is a boss's weakness names the boss's level, and reading it weakens that boss (Spec 02, Addendum A).
    const boss = mark.link !== undefined && mark.index === undefined ? weaknessOf(game.links, mark.link) : undefined;
    const text = boss === undefined ? mark.text : `${mark.text} It tells of the weakness of the boss of level ${boss}.`;
    addJournal(player, { depth, kind: mark.kind, id: where, text });
    show(game, mark.kind === 'sign' ? 'Sign' : 'Graffiti', text, 'discovery', messages, mark.kind === 'sign' ? 'read a sign' : 'read the graffiti');
    if (boss !== undefined && !player.weaknesses.includes(boss)) {
      player.weaknesses.push(boss);
      messages.push({ kind: 'discovery', text: `You know the weakness of the boss of level ${boss}.` });
    }
    return true;
  }
  if (used.marks.includes(index)) {
    messages.push({ kind: 'system', text: 'The rune is spent.' });
    return false;
  }
  const roll = check(game, 'magic');
  if (roll.success) {
    used.marks.push(index);
    if (mark.link !== undefined && mark.index !== undefined) (player.letters[mark.link] ??= {})[mark.index] = mark.text;
    addJournal(player, { depth, kind: 'rune', id: where, text: `A rune of ${mark.text}.` });
    messages.push({ kind: 'discovery', text: `The rune burns itself into your mind: ${mark.text}.` });
  } else if (roll.negative && !hasMajor(player, 'hex_breaker')) {
    used.marks.push(index);
    negative(game, 'rune', messages);
  } else messages.push({ kind: 'system', text: 'The rune glows faintly, then dims.' }); // for a Hex Breaker a 1 simply fails (Spec 06, Addendum A)
  return true;
}

/** Read a book from the pack (Spec 06): one round, kept in the journal, and the book stays so it can be dropped or sold. */
export function readLoreBook(game: Game, book: BookItem, messages: LogMessage[]): boolean {
  const text = book.text ?? game.content.books.get(book.id)?.text ?? 'The pages are blank, or too faded to read.';
  addJournal(game.state.player, { depth: depthOf(game), kind: 'book', id: book.id, text });
  show(game, 'Book', text, 'discovery', messages, 'read a book');
  return true;
}
