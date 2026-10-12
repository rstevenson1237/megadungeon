// The display flag and shell of the isometric display (Spec 01, Addendum B; Spec 01b; task 6.4): the game menu's
// display row and `?display=`, the text grid leaving the view area clear over the picture, every overlay over the
// dimmed picture, look's row, the targeting, cell and look cursors as diamonds, and the compass.

import { describe, expect, it } from 'vitest';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';
import { toSave } from '../src/game/save.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { App } from '../src/ui/app.ts';
import type { IsoArt } from '../src/ui/art/iso-art.ts';
import type { Atlas } from '../src/ui/atlas.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { DISPLAY_KEY, displayParam, startingDisplay } from '../src/ui/display.ts';
import { COLS, Grid, TRANSPARENT } from '../src/ui/grid.ts';
import { COMPASS_BASE, paintPicture, type IsoContext } from '../src/ui/iso-paint.ts';
import { DOT_ALPHA, ISO_VIEW, REFUSED_ALPHA, TINT_ALPHA, isoOnScreen, project, type IsoDraw } from '../src/ui/iso-view.ts';
import { ISO_KEYS } from '../src/ui/overlays.ts';
import { ISO } from '../src/ui/palette.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { Renderer, type RenderContext } from '../src/ui/renderer.ts';
import type { Shell } from '../src/ui/shell.ts';
import { SPELLS, caster, content, createAs, monsterAt, press, room, screenText, shellOn } from './helpers.ts';

const VIEW = inner(MAIN_PANE);

/** A shell on a big room, its player at (10, 10), in the isometric display. */
function isoShell(monsters = [monsterAt(14, 10), monsterAt(15, 11)], player = caster()): Shell {
  const shell = shellOn(room(30, 24, 10, 10), monsters, player);
  shell.game!.refreshSight();
  shell.display = 'iso';
  return shell;
}

const drawGrid = (shell: Shell): Grid => {
  const g = new Grid();
  shell.draw(g);
  return g;
};
const bgAt = (g: Grid, x: number, y: number): number => g.bg[y * COLS + x]!;
const rowText = (g: Grid, y: number): string => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join('');
const aims = (shell: Shell, shape: IsoDraw['shape']): IsoDraw[] => shell.picture()!.draws.filter((d) => d.shape === shape);
/** The game state as plain data, to show switching the display changes none of it. */
const snapshot = (shell: Shell): unknown => structuredClone({ state: shell.game!.state, tick: shell.game!.tick });

/** Open the spell list and choose `id` (every spell is known, in table order). */
function cast(shell: Shell, id: string): void {
  press(shell, 'c');
  for (let i = SPELLS.findIndex((s) => s.id === id); i > 0; i--) press(shell, 's');
  press(shell, 'Enter');
}

describe('the display flag (Spec 01, Addendum B)', () => {
  it('reads ?display=iso and ?display=text, and ignores anything else', () => {
    expect(displayParam('?display=iso')).toBe('iso');
    expect(displayParam('?seed=4&display=text')).toBe('text');
    expect(displayParam('?display=3d')).toBeUndefined();
    expect(displayParam('')).toBeUndefined();
  });

  it('starts with the preset, else the remembered choice, else text', () => {
    expect(startingDisplay(undefined, null)).toBe('text');
    expect(startingDisplay(undefined, 'iso')).toBe('iso');
    expect(startingDisplay('text', 'iso')).toBe('text');
    expect(startingDisplay('iso', 'text')).toBe('iso');
  });

  it('switches from the game menu with no round spent and nothing in the game changed', () => {
    const shell = isoShell();
    shell.display = 'text';
    const before = snapshot(shell);
    press(shell, 'Escape');
    expect(screenText(shell).some((l) => l.includes('Display: Text'))).toBe(true);
    for (let i = 0; i < 4; i++) press(shell, 's');
    press(shell, 'Enter');
    expect(shell.display).toBe('iso');
    // The menu stays open with the row's new name, over the dimmed picture.
    expect(shell.overlays).toHaveLength(1);
    expect(screenText(shell).some((l) => l.includes('Display: Isometric'))).toBe(true);
    expect(shell.picture()!.dimmed).toBe(true);
    press(shell, 'Enter');
    expect(shell.display).toBe('text');
    press(shell, 'Enter');
    press(shell, 'Escape');
    expect(shell.display).toBe('iso');
    expect(shell.picture()!.dimmed).toBe(false);
    expect(snapshot(shell)).toEqual(before);
  });

  it('switches in a real-time run too, with no tick run', () => {
    const shell = shellOn(room(20, 12, 5, 5), [], {}, { time: 'real' });
    const tick = shell.game!.tick;
    press(shell, 'Escape');
    for (let i = 0; i < 4; i++) press(shell, 's');
    press(shell, 'Enter');
    expect(shell.display).toBe('iso');
    expect(shell.game!.tick).toBe(tick);
  });

  describe('in the app', () => {
    function app(options: { display?: 'iso' | 'text'; flags?: MemoryStorage; loadArt?: () => Promise<IsoArt> } = {}): { app: App; flags: MemoryStorage } {
      const flags = options.flags ?? new MemoryStorage();
      const a = new App({
        creation: creationContentOf(content().bundle),
        randomSeed: () => 0x1234abcd,
        now: () => new Date('2026-10-01T12:00:00Z'),
        runOptions: (seed) => runOptionsFor(content().bundle, seed),
        saves: new SaveSlot(new MemoryStore()),
        board: new Leaderboard(new MemoryStorage()),
        flags,
        contentVersion: 'test',
        ...(options.display ? { display: options.display } : {}),
        ...(options.loadArt ? { loadArt: options.loadArt } : {}),
      });
      return { app: a, flags };
    }
    /** From the title, a new random-seed game with a Thief. */
    const begin = (a: App, name: string): void => {
      a.handleKey({ key: 'Enter' });
      createAs(a, 'Thief', name);
    };

    it('remembers the choice made in the game menu, and a preset outranks it without being remembered', () => {
      const { app: first, flags } = app();
      expect(first.display).toBe('text');
      begin(first, 'Ada');
      expect(first.shell!.display).toBe('text');
      first.handleKey({ key: 'Escape' });
      for (let i = 0; i < 4; i++) first.handleKey({ key: 's' });
      first.handleKey({ key: 'Enter' });
      expect(first.display).toBe('iso');
      expect(flags.getItem(DISPLAY_KEY)).toBe('iso');

      // A new page remembers it; a preset outranks it and leaves it as it was.
      expect(app({ flags }).app.display).toBe('iso');
      const preset = app({ flags, display: 'text' }).app;
      expect(preset.display).toBe('text');
      expect(flags.getItem(DISPLAY_KEY)).toBe('iso');
      begin(preset, 'Bo');
      expect(preset.shell!.display).toBe('text');
    });

    it('never saves the display with the run', () => {
      const { app: a } = app({ display: 'iso' });
      begin(a, 'Ada');
      const save = JSON.stringify(toSave({ run: a.shell!.run!, contentVersion: 'test', now: new Date('2026-10-01T12:00:00Z') }));
      expect(save).not.toMatch(/display|"iso"/);
    });

    it('loads the art the first time isometric is chosen, keeping the text display until it arrives (Spec 01b, Loading)', async () => {
      let loads = 0;
      let arrive: (art: IsoArt) => void = () => undefined;
      const { app: a } = app({ loadArt: () => (loads++, new Promise((resolve) => (arrive = resolve))) });
      begin(a, 'Ada');
      expect(loads).toBe(0);
      a.shell!.display = 'iso';
      a.shell!.onDisplay!('iso');
      a.shell!.onDisplay!('iso');
      expect(loads).toBe(1);
      expect(a.shell!.iso).toBe(false);
      const art = { ids: new Set<string>() } as unknown as IsoArt;
      arrive(art);
      await Promise.resolve();
      expect(a.art).toBe(art);
      expect(a.shell!.art).toBe(art);
      expect(a.shell!.iso).toBe(true);
    });

    it('says why in the log and stays in text when the art fails to load, and tries again when chosen again', async () => {
      let loads = 0;
      const { app: a } = app({ display: 'iso', loadArt: () => (loads++, Promise.reject(new Error('HTTP 404'))) });
      begin(a, 'Ada');
      expect(loads).toBe(1);
      await Promise.resolve();
      await Promise.resolve();
      expect(a.shell!.display).toBe('text');
      expect(a.display).toBe('text');
      expect(screenText(a.shell!).join('\n')).toContain('isometric art could not be loaded (HTTP 404)');
      a.shell!.display = 'iso';
      a.shell!.onDisplay!('iso');
      expect(loads).toBe(2);
    });

    it('shows no picture in a village, where the menu is text in both displays', () => {
      const { app: a } = app({ display: 'iso' });
      begin(a, 'Ada');
      expect(a.shell!.village).not.toBeNull();
      expect(a.picture()).toBeNull();
    });
  });
});

describe('the shell over the picture (Spec 01b, Layout)', () => {
  it('leaves the view area clear and keeps the border, header, character pane and log as text', () => {
    const shell = isoShell();
    const g = drawGrid(shell);
    for (const [x, y] of [[VIEW.x, VIEW.y], [VIEW.x + VIEW.w - 1, VIEW.y + VIEW.h - 1], [VIEW.x + 30, VIEW.y + 12]] as const) {
      expect(bgAt(g, x, y)).toBe(TRANSPARENT);
    }
    expect(bgAt(g, MAIN_PANE.x, MAIN_PANE.y)).not.toBe(TRANSPARENT); // the border
    expect(rowText(g, 0)).toContain('Level 1');
    expect(screenText(shell).join('\n')).toContain('Mara');
    // The text display draws the map in the same cells.
    shell.display = 'text';
    expect(bgAt(drawGrid(shell), VIEW.x + 30, VIEW.y + 12)).not.toBe(TRANSPARENT);
  });

  it('opens every overlay over the dimmed picture, which stays', () => {
    const shell = isoShell();
    expect(shell.picture()!.dimmed).toBe(false);
    for (const [key, title] of [['?', 'Help'], ['m', 'Message History'], ['i', 'Inventory'], ['j', 'Journal'], ['c', 'Heal'], ['Escape', 'Game Menu']] as const) {
      press(shell, key);
      expect(shell.overlays.length, title).toBe(1);
      expect(screenText(shell).join('\n'), title).toContain(title);
      const picture = shell.picture()!;
      expect(picture.dimmed, title).toBe(true);
      expect(picture.draws.length, title).toBeGreaterThan(100);
      press(shell, 'Escape');
      expect(shell.overlays, title).toHaveLength(0);
      expect(shell.picture()!.dimmed, title).toBe(false);
    }
  });

  it('keeps the picture visible beside a small window: only the window\'s cells turn opaque', () => {
    const shell = isoShell();
    press(shell, 'Escape');
    const g = drawGrid(shell);
    expect(bgAt(g, VIEW.x, VIEW.y)).toBe(TRANSPARENT);
    expect(bgAt(g, VIEW.x + Math.floor(VIEW.w / 2), VIEW.y + Math.floor(VIEW.h / 2))).not.toBe(TRANSPARENT);
  });

  it('writes look\'s description on the bottom row of the view area', () => {
    const shell = isoShell();
    press(shell, 'l');
    press(shell, 'd');
    const g = drawGrid(shell);
    const row = VIEW.y + VIEW.h - 1;
    expect(bgAt(g, VIEW.x, row)).not.toBe(TRANSPARENT);
    expect(rowText(g, row).slice(VIEW.x, VIEW.x + VIEW.w).trim()).toBe(shell.lookText());
    expect(bgAt(g, VIEW.x, row - 1)).toBe(TRANSPARENT);
  });

  it('says in the help that W A S D keep their map directions', () => {
    const shell = isoShell();
    press(shell, '?');
    expect(screenText(shell).join('\n')).toContain(ISO_KEYS);
  });
});

describe('cursors as diamonds (Spec 01b, Targeting and look)', () => {
  it('outlines the selected target and draws the line of fire as small dim diamonds, both ends left out', () => {
    const shell = isoShell([monsterAt(14, 10)]);
    press(shell, 'f');
    expect(shell.targeting).not.toBeNull();
    const [outline] = aims(shell, 'outline');
    expect(outline).toMatchObject({ cell: { x: 14, y: 10 }, layer: 'cursor', fg: ISO.target, alpha: 1 });
    expect(outline).toMatchObject(project(14, 10, { x: 10, y: 10 }));
    const dots = aims(shell, 'dot');
    expect(dots.map((d) => d.cell)).toEqual([{ x: 11, y: 10 }, { x: 12, y: 10 }, { x: 13, y: 10 }]);
    expect(dots.every((d) => d.layer === 'aim' && d.alpha === DOT_ALPHA && d.fg === ISO.target)).toBe(true);
    // The cursor is drawn last, over every cell.
    const draws = shell.picture()!.draws;
    expect(draws.at(-1)).toEqual(outline);
    // Tab moves it as in the text display; Esc ends it with nothing drawn.
    press(shell, 'Escape');
    expect(aims(shell, 'outline')).toHaveLength(0);
    expect(aims(shell, 'dot')).toHaveLength(0);
  });

  it('cycles the selection with Tab, as the text display does', () => {
    const shell = isoShell();
    press(shell, 'f');
    const first = aims(shell, 'outline')[0]!.cell;
    press(shell, 'Tab');
    const second = aims(shell, 'outline')[0]!.cell;
    expect(second).not.toEqual(first);
    expect([first, second]).toEqual(expect.arrayContaining([{ x: 14, y: 10 }, { x: 15, y: 11 }]));
  });

  it('tints an area footprint and frames the creatures inside it', () => {
    const shell = isoShell();
    cast(shell, 'fireball');
    const t = shell.targeting!;
    expect(t).not.toBeNull();
    const tints = aims(shell, 'tint');
    expect(tints.map((d) => d.cell).sort((a, b) => a.y - b.y || a.x - b.x)).toEqual(t.footprint().sort((a, b) => a.y - b.y || a.x - b.x));
    expect(tints.every((d) => d.layer === 'aim' && d.alpha === TINT_ALPHA)).toBe(true);
    const frames = aims(shell, 'frame');
    expect(frames.map((d) => d.cell)).toEqual(expect.arrayContaining(t.marked().map((m) => ({ x: m.x, y: m.y }))));
    expect(frames).toHaveLength(t.marked().length);
    // A frame fits around the creature's card.
    for (const f of frames) {
      const body = shell.picture()!.draws.find((d) => d.layer === 'creature' && d.cell.x === f.cell.x && d.cell.y === f.cell.y)!;
      expect(f.box).toEqual(body.box);
    }
  });

  it('draws Blink\'s reachable cells tinted and its cursor outlined, dimmed where it cannot go', () => {
    const shell = isoShell([]);
    cast(shell, 'blink');
    const cursor = shell.cursor!;
    expect(cursor).not.toBeNull();
    expect(aims(shell, 'tint')).toHaveLength(cursor.cells.length);
    expect(aims(shell, 'outline')[0]).toMatchObject({ cell: cursor.at, alpha: cursor.ok ? 1 : REFUSED_ALPHA });
    press(shell, 'd');
    expect(aims(shell, 'outline')[0]).toMatchObject({ cell: { x: 11, y: 10 }, alpha: 1 });
  });

  it('draws look\'s cursor as a diamond in the look colour, moved by the same keys', () => {
    const shell = isoShell();
    press(shell, 'l');
    expect(aims(shell, 'outline')).toEqual([expect.objectContaining({ cell: { x: 10, y: 10 }, fg: ISO.look, layer: 'cursor' })]);
    press(shell, 'w');
    press(shell, 'd');
    expect(aims(shell, 'outline')[0]!.cell).toEqual({ x: 11, y: 9 });
    press(shell, 'Tab'); // to the nearest creature
    expect(aims(shell, 'outline')[0]!.cell).toEqual({ x: 14, y: 10 });
    press(shell, 'Escape');
    expect(aims(shell, 'outline')).toHaveLength(0);
  });

  it('keeps look\'s cursor on screen, above the look row', () => {
    const shell = isoShell([]);
    press(shell, 'l');
    // South is down and left on screen: the cursor stops where its cell would leave the view.
    for (let i = 0; i < 40; i++) press(shell, 's');
    const at = shell.looking!.at;
    expect(isoOnScreen(at, { x: 10, y: 10 })).toBe(true);
    expect(isoOnScreen({ x: at.x, y: at.y + 1 }, { x: 10, y: 10 })).toBe(false);
    const p = project(at.x, at.y, { x: 10, y: 10 });
    expect(p.y).toBeLessThan(ISO_VIEW.y + ISO_VIEW.h - 16);
  });
});

describe('painting the picture (Spec 01b, Layout)', () => {
  function recorder() {
    const calls: string[] = [];
    const ctx: IsoContext = {
      fillStyle: '',
      globalAlpha: 1,
      fillRect: (x, y, w, h) => void calls.push(`rect ${String(ctx.fillStyle)} ${x},${y} ${w}x${h} a${ctx.globalAlpha}`),
      drawImage: () => undefined,
      save: () => undefined,
      restore: () => undefined,
      beginPath: () => undefined,
      rect: () => undefined,
      clip: () => undefined,
    };
    const glyphs: string[] = [];
    const atlas: Atlas = { draw: (_c, code, fg, dx, dy) => void glyphs.push(`${code} ${fg.toString(16)} ${dx},${dy}`) };
    return { ctx, calls, glyphs, atlas };
  }

  it('draws the compass in the top right of the view area: an arrow up and to the right, marked N', () => {
    const { ctx, calls, glyphs, atlas } = recorder();
    paintPicture(ctx, { draws: [], dimmed: false }, atlas);
    const n = glyphs.find((g) => g.startsWith('78 '))!;
    expect(n).toBeDefined();
    const [x, y] = n.split(' ')[2]!.split(',').map(Number) as [number, number];
    expect(x).toBeGreaterThan(ISO_VIEW.x + ISO_VIEW.w / 2);
    expect(x + 9).toBeLessThanOrEqual(ISO_VIEW.x + ISO_VIEW.w);
    expect(y).toBeGreaterThanOrEqual(ISO_VIEW.y);
    expect(y).toBeLessThan(ISO_VIEW.y + 32);
    // The shaft climbs one pixel for every two to the right: map north on screen.
    const colour = `#${ISO.compass.toString(16).padStart(6, '0')}`;
    const shaft = calls.filter((c) => c.startsWith(`rect ${colour}`) && c.includes(' 1x1 '));
    const points = shaft.map((c) => c.split(' ')[2]!.split(',').map(Number) as [number, number]);
    expect(points[0]).toEqual([COMPASS_BASE.x, COMPASS_BASE.y]);
    expect(points.at(-1)).toEqual([COMPASS_BASE.x + 12, COMPASS_BASE.y - 6]);
  });

  it('dims the picture to 40% while an overlay is open, and only then', () => {
    const dimRect = `rect #000000 ${ISO_VIEW.x},${ISO_VIEW.y} ${ISO_VIEW.w}x${ISO_VIEW.h} a${ISO.dim}`;
    const open = recorder();
    paintPicture(open.ctx, { draws: [], dimmed: true }, open.atlas);
    expect(open.calls.at(-1)).toBe(dimRect);
    expect(ISO.dim).toBe(0.6);
    const closed = recorder();
    paintPicture(closed.ctx, { draws: [], dimmed: false }, closed.atlas);
    expect(closed.calls).not.toContain(dimRect);
  });

  it('paints the aiming shapes in whole-pixel spans in the targeting colour', () => {
    const shell = isoShell([monsterAt(14, 10)]);
    cast(shell, 'fireball');
    const { ctx, calls, atlas } = recorder();
    paintPicture(ctx, shell.picture()!, atlas);
    const target = `#${ISO.target.toString(16).padStart(6, '0')}`;
    expect(calls.some((c) => c.startsWith(`rect ${target}`) && c.endsWith(`a${TINT_ALPHA}`))).toBe(true); // footprint
    expect(calls.some((c) => c.startsWith(`rect ${target}`) && c.endsWith(`a${DOT_ALPHA}`))).toBe(true); // line of fire
    expect(calls.some((c) => c.startsWith(`rect ${target}`) && c.endsWith('a1'))).toBe(true); // outline and frame
    for (const c of calls) {
      const [x, y, w, h] = c.split(' ').slice(2, 4).join('x').split(/[,x]/).map(Number);
      expect([x, y, w, h].every(Number.isInteger)).toBe(true);
    }
  });
});

describe('the text canvas over the picture', () => {
  it('clears transparent cells instead of filling them, and repaints them when the text display returns', () => {
    const clears: [number, number][] = [];
    const fills: [number, number][] = [];
    const ctx: RenderContext = {
      fillStyle: '',
      fillRect: (x, y) => void fills.push([x, y]),
      clearRect: (x, y) => void clears.push([x, y]),
      drawImage: () => undefined,
    };
    const renderer = new Renderer(ctx, { draw: () => undefined });
    const g = new Grid();
    g.see(1, 1, 2, 1);
    renderer.render(g);
    expect(clears).toEqual([[9, 16], [18, 16]]);
    expect(fills).not.toContainEqual([9, 16]);
    clears.length = 0;
    fills.length = 0;
    expect(renderer.render(g)).toBe(0);
    g.set(1, 1, 64, 0xffffff, 0);
    expect(renderer.render(g)).toBe(1);
    expect(fills).toEqual([[9, 16]]);
    expect(clears).toHaveLength(0);
  });
});
