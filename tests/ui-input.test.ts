import { describe, expect, it } from 'vitest';
import type { CharacterPaneData } from '../src/ui/character-pane.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { KEY_BINDINGS, keyToCommand } from '../src/ui/input.ts';
import { Menu } from '../src/ui/overlay.ts';
import { Shell } from '../src/ui/shell.ts';

const text = (g: Grid, x: number, y: number, w: number): string =>
  Array.from({ length: w }, (_, i) => CP437_TO_UNICODE[g.glyph[y * COLS + x + i]!]).join('');
const screen = (shell: Shell): string[] => {
  const g = new Grid();
  shell.draw(g);
  return Array.from({ length: 40 }, (_, y) => text(g, 0, y, 100));
};
const hasText = (shell: Shell, s: string): boolean => screen(shell).some((l) => l.includes(s));

const character: CharacterPaneData = {
  name: 'Mara', className: 'Thief', level: 3, xp: 0, xpNext: 100, bank: 0, carried: 0,
  stats: [{ name: 'Combat', step: 6, current: 1, max: 2 }], equipment: [], abilities: ['Backstab'],
  status: [], wait: { rounds: 0, needed: 10 }, inventory: { used: 0, total: 12 },
};
const newShell = (): Shell => new Shell('Test Level, Level 1', character);
const press = (shell: Shell, key: string, shiftKey = false): boolean => shell.handleKey({ key, shiftKey });

describe('key map (Spec 01)', () => {
  it('maps WASD and the arrow keys to the four directions, in either case', () => {
    const dirs: [string, number, number][] = [
      ['w', 0, -1], ['ArrowUp', 0, -1], ['a', -1, 0], ['ArrowLeft', -1, 0],
      ['s', 0, 1], ['ArrowDown', 0, 1], ['d', 1, 0], ['ArrowRight', 1, 0], ['W', 0, -1], ['D', 1, 0],
    ];
    for (const [key, dx, dy] of dirs) expect(keyToCommand({ key })).toEqual({ type: 'move', dx, dy });
  });

  it('has only orthogonal moves: no diagonal key exists', () => {
    for (const b of KEY_BINDINGS) {
      for (const e of b.entries) {
        if (e.command.type === 'move') expect(Math.abs(e.command.dx) + Math.abs(e.command.dy)).toBe(1);
      }
    }
  });

  it('maps every other key in the table to its command', () => {
    const table: [string, string][] = [
      [' ', 'wait'], ['z', 'waitLong'], ['e', 'interact'], ['x', 'search'], ['g', 'pickup'], ['f', 'ranged'],
      ['c', 'cast'], ['q', 'ability'], ['Tab', 'nextTarget'], ['Enter', 'confirm'], ['Escape', 'cancel'],
      ['i', 'inventory'], ['l', 'look'], ['m', 'history'], ['?', 'help'], ['j', 'journal'],
    ];
    for (const [key, type] of table) expect(keyToCommand({ key })?.type).toBe(type);
    expect(keyToCommand({ key: 'Tab', shiftKey: true })?.type).toBe('prevTarget');
    expect(keyToCommand({ key: '?', shiftKey: true })?.type).toBe('help');
    expect(keyToCommand({ key: 'M', shiftKey: true })?.type).toBe('history');
  });

  it('lists exactly the keys of the spec table, and no other key is mapped', () => {
    expect(KEY_BINDINGS.map((b) => b.keys)).toEqual([
      'W A S D / arrows', 'Space', 'Z', 'E', 'X', 'G', 'F', 'C', 'Q', 'Tab / Shift+Tab', 'Enter', 'Esc', 'I', 'L', 'M', '?', 'J',
    ]);
    for (const key of ['b', 'h', 'k', 'n', 'p', 'r', 't', 'u', 'v', 'y', 'Home', 'F5', '1', 'Shift']) {
      expect(keyToCommand({ key })).toBeUndefined();
    }
  });

  it('leaves browser shortcuts alone', () => {
    expect(keyToCommand({ key: 'w', ctrlKey: true })).toBeUndefined();
    expect(keyToCommand({ key: 'm', metaKey: true })).toBeUndefined();
    expect(keyToCommand({ key: 'Tab', altKey: true })).toBeUndefined();
  });
});

describe('every key acts or logs "not yet available"', () => {
  const keys = KEY_BINDINGS.flatMap((b) => b.entries.map((e) => ({ key: e.key === 'tab' ? 'Tab' : e.key, shift: e.shift ?? false })));

  it.each(keys)('key "$key" (shift $shift)', ({ key, shift }) => {
    const shell = newShell();
    const handled = press(shell, key, shift);
    expect(handled).toBe(true);
    const acted = shell.overlays.length > 0;
    // Casting (task 2.8) and the inventory (task 2.9) act: with no run to act in they say so instead.
    const logged = shell.log.lines(shell.turn).some((l) => l.text.endsWith('is not yet available.') || l.text.startsWith('There is nothing to cast') || l.text.startsWith('There is nothing to carry'));
    expect(acted || logged).toBe(true);
  });

  it('names the missing feature in the message and spends no turn', () => {
    const shell = newShell();
    press(shell, 'j');
    expect(shell.log.lines(1).map((l) => l.text)).toEqual(['Journal is not yet available.']);
    expect(shell.turn).toBe(1);
  });

  it('returns false for keys outside the map so the browser can act on them', () => {
    expect(press(newShell(), 'F5')).toBe(false);
  });
});

describe('overlays', () => {
  it('opens the message history with M, and closes it with Esc', () => {
    const shell = newShell();
    shell.log.add({ kind: 'loot', text: 'You pick up 42 gp.' }, 1);
    press(shell, 'm');
    expect(shell.overlays).toHaveLength(1);
    expect(hasText(shell, 'Message History')).toBe(true);
    expect(hasText(shell, 'You pick up 42 gp.')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    expect(hasText(shell, 'Message History')).toBe(false);
    // Closing opened nothing else: the next Esc opens the game menu.
    expect(shell.overlays).toHaveLength(0);
  });

  it('keeps the character pane and log visible behind an overlay', () => {
    const shell = newShell();
    shell.log.add({ kind: 'loot', text: 'You pick up 42 gp.' }, 1);
    press(shell, '?');
    expect(hasText(shell, 'Thief, Level 3')).toBe(true);
    expect(hasText(shell, 'You pick up 42 gp.')).toBe(true);
    expect(hasText(shell, 'Help')).toBe(true);
  });

  it('shows the key list in help and closes with Esc', () => {
    const shell = newShell();
    press(shell, '?');
    for (const b of KEY_BINDINGS) expect(hasText(shell, b.keys)).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
  });

  it('scrolls 200 lines of history with W/S and the arrows', () => {
    const shell = newShell();
    for (let i = 1; i <= 250; i++) shell.log.add({ kind: 'system', text: `message ${i}` }, i);
    // Only the overlay's own area: the log pane behind it always shows the newest lines.
    const overlayHas = (s: string): boolean => screen(shell).slice(1, 29).some((l) => l.includes(s));
    press(shell, 'm');
    expect(overlayHas('message 250')).toBe(true);
    expect(overlayHas('Lines 174-200 of 200')).toBe(true);
    expect(overlayHas('message 51 ')).toBe(false); // 200 lines kept: messages 51 to 250
    for (let i = 0; i < 400; i++) press(shell, i % 2 ? 'w' : 'ArrowUp'); // far past the oldest line
    expect(overlayHas('message 51')).toBe(true);
    expect(overlayHas('message 50')).toBe(false);
    expect(overlayHas('message 250')).toBe(false);
    expect(overlayHas('Lines 1-27 of 200')).toBe(true);
    for (let i = 0; i < 400; i++) press(shell, 's');
    expect(overlayHas('message 250')).toBe(true);
    expect(overlayHas('Lines 174-200 of 200')).toBe(true);
  });

  it('opens the game menu with Esc when nothing is open, and Esc closes it', () => {
    const shell = newShell();
    press(shell, 'Escape');
    expect(hasText(shell, 'Game Menu')).toBe(true);
    for (const item of ['Help', 'Leaderboard', 'Quit without saving']) expect(hasText(shell, item)).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
  });

  it('navigates the game menu with arrows or W/S, wrapping, and Enter chooses', () => {
    const shell = newShell();
    press(shell, 'Escape');
    const menu = shell.overlays[0] as Menu;
    expect(menu.selected).toBe(0);
    press(shell, 's');
    expect(menu.selected).toBe(1);
    press(shell, 'ArrowDown');
    expect(menu.selected).toBe(2);
    press(shell, 's');
    expect(menu.selected).toBe(0); // wraps
    press(shell, 'w');
    expect(menu.selected).toBe(2);
    press(shell, 'a'); // sideways does nothing
    expect(menu.selected).toBe(2);
    press(shell, 'Enter'); // Quit: not yet available, menu closes
    expect(shell.overlays).toHaveLength(0);
    expect(shell.log.lines(1).at(-1)!.text).toBe('Quitting is not yet available.');
  });

  it('opens Help from the menu, replacing it, and Esc then returns to the map', () => {
    const shell = newShell();
    press(shell, 'Escape');
    press(shell, 'Enter');
    expect(shell.overlays).toHaveLength(1);
    expect(hasText(shell, 'Game Menu')).toBe(false);
    expect(hasText(shell, 'Wait one round')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
  });

  it('draws the selected menu item highlighted', () => {
    const shell = newShell();
    press(shell, 'Escape');
    const lines = screen(shell);
    expect(lines.some((l) => l.includes('> Help'))).toBe(true);
    press(shell, 's');
    expect(screen(shell).some((l) => l.includes('> Leaderboard'))).toBe(true);
    expect(screen(shell).some((l) => l.includes('> Help'))).toBe(false);
  });

  it('is modal: other commands do nothing while an overlay is open', () => {
    const shell = newShell();
    press(shell, 'm');
    press(shell, 'i');
    press(shell, ' ');
    expect(shell.log.lines(1)).toHaveLength(0);
    expect(shell.overlays).toHaveLength(1);
  });

  it('collapses repeated "not yet available" messages into a count', () => {
    const shell = newShell();
    for (let i = 0; i < 3; i++) press(shell, 'x');
    expect(shell.log.lines(1).map((l) => l.text)).toEqual(['Searching is not yet available. (x3)']);
  });

  it('keeps menus inside the main pane', () => {
    const shell = newShell();
    press(shell, 'Escape');
    const g = new Grid();
    shell.draw(g);
    expect(text(g, 72, 10, 1)).toBe('│');
    expect(text(g, 71, 10, 1)).toBe('│');
  });
});
