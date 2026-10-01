import { describe, expect, it } from 'vitest';
import { LOG_HISTORY, LOG_WIDTH, MessageLog, wrapText } from '../src/game/log.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { drawCharacterPane, type CharacterPaneData } from '../src/ui/character-pane.ts';
import { COLS, Grid, ROWS } from '../src/ui/grid.ts';
import { drawLog } from '../src/ui/log-pane.ts';
import { LOG_COLOURS, UI } from '../src/ui/palette.ts';
import { CHARACTER_PANE, LOG_PANE, MAIN_PANE, drawPanes, inner } from '../src/ui/panes.ts';

const at = (g: Grid, x: number, y: number): string => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]!;
const row = (g: Grid, x: number, y: number, w: number): string =>
  Array.from({ length: w }, (_, i) => at(g, x + i, y)).join('');
const fgAt = (g: Grid, x: number, y: number): number => g.fg[y * COLS + x]!;

describe('pane layout (Spec 01)', () => {
  it('uses the sizes from Screen grid and panes', () => {
    expect(MAIN_PANE).toEqual({ x: 0, y: 0, w: 72, h: 30 });
    expect(LOG_PANE).toEqual({ x: 0, y: 30, w: 72, h: 10 });
    expect(CHARACTER_PANE).toEqual({ x: 72, y: 0, w: 28, h: 40 });
    expect(inner(MAIN_PANE)).toEqual({ x: 1, y: 1, w: 70, h: 28 });
    expect(inner(LOG_PANE)).toEqual({ x: 1, y: 31, w: 70, h: 8 });
    expect(inner(CHARACTER_PANE)).toEqual({ x: 73, y: 1, w: 26, h: 38 });
  });

  it('tiles the whole 100 x 40 grid with no overlap', () => {
    const area = [MAIN_PANE, LOG_PANE, CHARACTER_PANE].reduce((a, r) => a + r.w * r.h, 0);
    expect(area).toBe(COLS * ROWS);
  });

  it('outlines each pane with single-line box characters', () => {
    const g = new Grid();
    drawPanes(g, 'Goblin Warrens, Level 7');
    for (const r of [MAIN_PANE, LOG_PANE, CHARACTER_PANE]) {
      expect(at(g, r.x, r.y)).toBe('┌');
      expect(at(g, r.x + r.w - 1, r.y)).toBe('┐');
      expect(at(g, r.x, r.y + r.h - 1)).toBe('└');
      expect(at(g, r.x + r.w - 1, r.y + r.h - 1)).toBe('┘');
      expect(at(g, r.x + r.w - 1, r.y + 3)).toBe('│');
      expect(at(g, r.x, r.y + r.h - 2)).toBe('│');
    }
    expect(row(g, 0, 39, 72)).toBe(`└${'─'.repeat(70)}┘`);
  });

  it('puts the level name and depth in the top border of the main view', () => {
    const g = new Grid();
    drawPanes(g, 'Goblin Warrens, Level 7');
    expect(row(g, 2, 0, 25)).toBe(' Goblin Warrens, Level 7 ');
    expect(row(g, 2, 30, 5)).toBe(' Log ');
    expect(row(g, 74, 0, 11)).toBe(' Character ');
  });

  it('shortens a title that does not fit', () => {
    const g = new Grid();
    drawPanes(g, 'x'.repeat(200));
    expect(at(g, 71, 0)).toBe('┐');
    expect(row(g, 2, 0, 69)).toContain('»');
  });
});

const mara: CharacterPaneData = {
  name: 'Mara',
  className: 'Thief',
  level: 3,
  xp: 5210,
  xpNext: 8000,
  bank: 1340,
  carried: 620,
  stats: [
    { name: 'Combat', step: 6, current: 1, max: 2 },
    { name: 'Skill', step: 8, current: 2, max: 2 },
    { name: 'Magic', step: 4, current: 1, max: 1 },
  ],
  equipment: [
    { name: 'Short sword', quality: 'Fine' },
    { name: 'Sling', quality: 'Normal' },
    { name: 'Leather', quality: 'Crude' },
    { name: 'Ring', quality: 'Unknown' },
  ],
  abilities: ['Backstab', 'Keen Eye', 'Light Step'],
  status: [],
  wait: { rounds: 3, needed: 10 },
  inventory: { used: 7, total: 12 },
  target: { name: 'Goblin', rating: 'd6', distance: 6, index: 1, count: 3 },
};

describe('character pane (Spec 01)', () => {
  const g = new Grid();
  drawPanes(g, 'Test');
  drawCharacterPane(g, mara);
  const line = (y: number): string => row(g, 74, y, 24).trimEnd();

  it('shows every block in the spec order, at the mockup rows', () => {
    expect(line(2)).toBe('Mara');
    expect(line(3)).toBe('Thief, Level 3');
    expect(line(5)).toBe('XP       5,210 / 8,000');
    expect(line(6)).toBe('Bank     1,340 gp');
    expect(line(7)).toBe('Carried  ~620 gp');
    expect(line(9)).toBe('STATS');
    expect(line(14)).toBe('EQUIPMENT');
    expect(line(15)).toBe('Short sword  Fine');
    expect(line(20)).toBe('ABILITIES');
    expect(line(21)).toBe('Backstab');
    expect(line(25)).toBe('STATUS');
    expect(line(26)).toBe('Rested 3/10');
    expect(line(28)).toBe('Slots 7/12');
    expect(line(30)).toBe('TARGET');
    expect(line(31)).toBe('Goblin       d6');
    expect(line(32)).toBe('Distance 6');
    expect(line(33)).toBe('Target 1 of 3');
  });

  it('shows each stat as step, pips and current / maximum dice', () => {
    expect(line(10)).toBe('Combat d6 ■■     1/2');
    expect(line(11)).toBe('Skill  d8 ■■     2/2');
    expect(line(12)).toBe('Magic  d4 ■      1/1');
    // Full pips in the stat colour, lost dice in its dim colour.
    expect(fgAt(g, 84, 10)).toBe(UI.statCombat);
    expect(fgAt(g, 85, 10)).toBe(UI.statCombatEmpty);
    expect(fgAt(g, 84, 11)).toBe(UI.statSkill);
    expect(fgAt(g, 84, 12)).toBe(UI.statMagic);
  });

  it('shows the target block only while targeting', () => {
    const g2 = new Grid();
    drawPanes(g2, 'Test');
    drawCharacterPane(g2, { ...mara, target: undefined });
    expect(row(g2, 74, 30, 24).trim()).toBe('');
  });

  it('shows active effects above the wait counter, and max level without a next threshold', () => {
    const g2 = new Grid();
    drawPanes(g2, 'Test');
    drawCharacterPane(g2, { ...mara, status: ['Poisoned', 'Blessed'], xpNext: null });
    expect(row(g2, 74, 5, 24).trimEnd()).toBe('XP       5,210 (max)');
    expect(row(g2, 74, 26, 24).trimEnd()).toBe('Poisoned');
    expect(row(g2, 74, 27, 24).trimEnd()).toBe('Blessed');
    expect(row(g2, 74, 28, 24).trimEnd()).toBe('Rested 3/10');
  });

  it('never draws outside the pane, even with too much to show', () => {
    const g2 = new Grid();
    drawPanes(g2, 'Test');
    const before = row(g2, 72, 39, 28);
    drawCharacterPane(g2, {
      ...mara,
      name: 'N'.repeat(60),
      abilities: Array.from({ length: 40 }, (_, i) => `Ability number ${i} with a long name`),
      equipment: [{ name: 'Extremely long item name', quality: 'Masterwork' }],
    });
    expect(row(g2, 72, 39, 28)).toBe(before);
    for (let y = 0; y < ROWS; y++) {
      expect(at(g2, 72, y)).toBe(y === 0 ? '┌' : y === 39 ? '└' : '│');
      expect(at(g2, 99, y)).toBe(y === 0 ? '┐' : y === 39 ? '┘' : '│');
    }
    expect(at(g2, 71, 5)).toBe('│');
  });
});

describe('message log (Spec 01)', () => {
  it('collapses the same message on consecutive turns into a count', () => {
    const log = new MessageLog();
    for (let turn = 1; turn <= 6; turn++) log.add({ kind: 'system', text: 'You wait.' }, turn);
    expect(log.lines(6).map((l) => l.text)).toEqual(['You wait. (x6)']);
  });

  it('does not collapse different messages, kinds, or messages many turns apart', () => {
    const log = new MessageLog();
    log.add({ kind: 'system', text: 'You wait.' }, 1);
    log.add({ kind: 'combat', text: 'You wait.' }, 2);
    log.add({ kind: 'combat', text: 'You hit.' }, 3);
    log.add({ kind: 'combat', text: 'You hit.' }, 9);
    expect(log.lines(9).map((l) => l.text)).toEqual(['You wait.', 'You wait.', 'You hit.', 'You hit.']);
  });

  it('wraps long lines within 70 cells', () => {
    expect(LOG_WIDTH).toBe(70);
    const text = 'word '.repeat(40).trim();
    const lines = wrapText(text, LOG_WIDTH);
    expect(lines.length).toBeGreaterThan(2);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(70);
    expect(lines.join(' ')).toBe(text);
    expect(wrapText('x'.repeat(150), 70).map((l) => l.length)).toEqual([70, 70, 10]);
    expect(wrapText('', 70)).toEqual(['']);
  });

  it('keeps 200 lines of history, dropping the oldest', () => {
    const log = new MessageLog();
    for (let i = 0; i < 300; i++) log.add({ kind: 'system', text: `message ${i}` }, i);
    const lines = log.lines(300);
    expect(lines).toHaveLength(LOG_HISTORY);
    expect(lines[0]!.text).toBe('message 100');
    expect(lines[199]!.text).toBe('message 299');
  });

  it('counts wrapped lines towards the 200', () => {
    const log = new MessageLog();
    for (let i = 0; i < 100; i++) log.add({ kind: 'system', text: `${i} ${'w'.repeat(100)}` }, i);
    expect(log.lines(100).length).toBeLessThanOrEqual(LOG_HISTORY);
    expect(log.lines(100).at(-1)!.text.length).toBeGreaterThan(0);
  });

  it('marks the current turn bright and older messages dim', () => {
    const log = new MessageLog();
    log.add({ kind: 'combat', text: 'old' }, 1);
    log.add({ kind: 'loot', text: 'new' }, 5);
    expect(log.lines(5).map((l) => l.current)).toEqual([false, true]);
  });

  it('draws the newest 8 lines in the log pane, colour by type, current turn bright', () => {
    const log = new MessageLog();
    log.add({ kind: 'discovery', text: 'You enter the Goblin Warrens.' }, 1);
    log.add({ kind: 'combat', text: 'You hit the kobold.' }, 2);
    log.add({ kind: 'loot', text: 'You pick up 42 gp.' }, 3);
    log.add({ kind: 'warning', text: 'A goblin sees you!' }, 4);
    log.add({ kind: 'rumour', text: 'You hear a rumour.' }, 4);
    const g = new Grid();
    drawPanes(g, 'Test');
    drawLog(g, log, 4);
    expect(row(g, 1, 31, 29)).toBe('You enter the Goblin Warrens.');
    expect(row(g, 1, 35, 18)).toBe('You hear a rumour.');
    expect(fgAt(g, 1, 31)).toBe(LOG_COLOURS.discovery.dim);
    expect(fgAt(g, 1, 32)).toBe(LOG_COLOURS.combat.dim);
    expect(fgAt(g, 1, 34)).toBe(LOG_COLOURS.warning.bright);
    expect(fgAt(g, 1, 35)).toBe(LOG_COLOURS.rumour.bright);
    // Border untouched.
    expect(at(g, 71, 31)).toBe('│');
    expect(at(g, 0, 31)).toBe('│');
  });

  it('shows only the last 8 lines once there are more', () => {
    const log = new MessageLog();
    for (let i = 0; i < 20; i++) log.add({ kind: 'system', text: `m${i}` }, i);
    const g = new Grid();
    drawPanes(g, 'Test');
    drawLog(g, log, 19);
    expect(row(g, 1, 31, 3).trim()).toBe('m12');
    expect(row(g, 1, 38, 3).trim()).toBe('m19');
  });
});
