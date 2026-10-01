import { describe, expect, it } from 'vitest';
import type { Atlas } from '../src/ui/atlas.ts';
import { glyphRects } from '../src/ui/boxdraw.ts';
import { CP437_TO_UNICODE, GLYPH, toCp437 } from '../src/ui/cp437.ts';
import { CELL_H, CELL_W, COLS, Grid, NATIVE_H, NATIVE_W, ROWS } from '../src/ui/grid.ts';
import { Renderer, type RenderContext } from '../src/ui/renderer.ts';
import { fitScale } from '../src/ui/viewport.ts';

describe('CP437 table', () => {
  it('has 256 distinct-or-blank entries, one per code', () => {
    expect(CP437_TO_UNICODE).toHaveLength(256);
    const nonBlank = CP437_TO_UNICODE.filter((c) => c !== '\u0000' && c !== ' ' && c !== ' ');
    expect(new Set(nonBlank).size).toBe(nonBlank.length);
  });

  it('keeps ASCII in place and the VGA symbols in codes 1-31', () => {
    for (let c = 32; c < 127; c++) expect(CP437_TO_UNICODE[c]).toBe(String.fromCharCode(c));
    expect(CP437_TO_UNICODE[1]).toBe('☺');
    expect(CP437_TO_UNICODE[127]).toBe('⌂');
    expect(CP437_TO_UNICODE[128]).toBe('Ç');
    expect(CP437_TO_UNICODE[176]).toBe('░');
    expect(CP437_TO_UNICODE[196]).toBe('─');
    expect(CP437_TO_UNICODE[219]).toBe('█');
    expect(CP437_TO_UNICODE[254]).toBe('■');
  });

  it('round-trips text to codes, with ? for anything outside the code page', () => {
    expect(toCp437('@')).toBe(64);
    expect(toCp437('┌')).toBe(218);
    expect(toCp437('€')).toBe(63);
  });
});

// Spec 01 core glyph table: every row, with the character and CP437 code the spec gives.
const SPEC_TABLE: [keyof typeof GLYPH, string, number][] = [
  ['player', '@', 64], ['floor', '·', 250], ['wall', '#', 35], ['wallBlock', '█', 219],
  ['wallShade', '▓', 178], ['doorClosed', '+', 43], ['doorOpen', "'", 39], ['doorLocked', '+', 43],
  ['stairsUp', '<', 60], ['stairsDown', '>', 62], ['teleporter', 'Ω', 234], ['water', '≈', 247],
  ['debris', '░', 176], ['chest', '■', 254], ['sack', 'δ', 235], ['pottery', '°', 248],
  ['weaponRack', '╫', 215], ['fountain', 'Θ', 233], ['altar', '╥', 210], ['sarcophagus', '∩', 239],
  ['rune', '☼', 15], ['trap', '^', 94], ['book', '?', 63], ['sign', '¶', 20], ['key', '⌐', 169],
  ['coins', '$', 36], ['gems', '♦', 4], ['jewelry', '"', 34], ['potion', '!', 33], ['ring', '=', 61],
  ['rod', '/', 47], ['weapon', ')', 41], ['armour', '[', 91], ['clothing', '(', 40], ['npc', '@', 64],
];

describe('core glyph table (Spec 01)', () => {
  it('covers every row of the spec table', () => {
    expect(Object.keys(GLYPH).sort()).toEqual(SPEC_TABLE.map(([k]) => k).sort());
  });
  it.each(SPEC_TABLE)('%s is %s at code %i', (name, ch, code) => {
    expect(GLYPH[name]).toBe(code);
    expect(CP437_TO_UNICODE[code]).toBe(ch);
  });
});

describe('Grid', () => {
  it('is 100 x 40 cells of 9 x 16 = 900 x 640 px', () => {
    expect([COLS, ROWS, CELL_W, CELL_H, NATIVE_W, NATIVE_H]).toEqual([100, 40, 9, 16, 900, 640]);
  });

  it('stores glyph and 24-bit colours, and ignores out-of-bounds writes', () => {
    const g = new Grid();
    g.set(3, 2, 64, 0xff8040, 0x102030);
    const i = 2 * COLS + 3;
    expect([g.glyph[i], g.fg[i], g.bg[i]]).toEqual([64, 0xff8040, 0x102030]);
    g.set(-1, 0, 1, 1, 1);
    g.set(COLS, 0, 1, 1, 1);
    g.set(0, ROWS, 1, 1, 1);
    expect(g.glyph.reduce((a, b) => a + b, 0)).toBe(64);
  });

  it('writes text as CP437 codes', () => {
    const g = new Grid();
    g.text(0, 0, 'A┌', 1, 2);
    expect([g.glyph[0], g.glyph[1]]).toEqual([65, 218]);
  });
});

describe('fitScale', () => {
  it('fills the limiting side and keeps the 900:640 aspect', () => {
    const wide = fitScale(1800, 1000);
    expect(wide.height).toBe(1000);
    expect(wide.width).toBe(Math.floor(900 * (1000 / 640)));
    expect(wide.top).toBe(0);
    expect(wide.left).toBe(Math.floor((1800 - wide.width) / 2));
    const tall = fitScale(900, 1000);
    expect(tall.width).toBe(900);
    expect(tall.left).toBe(0);
    expect(tall.top).toBe(Math.floor((1000 - 640) / 2));
  });

  it('is exactly native size at 900 x 640', () => {
    expect(fitScale(900, 640)).toEqual({ scale: 1, width: 900, height: 640, left: 0, top: 0 });
  });

  it('uses whole device pixels at any pixel ratio', () => {
    for (const [w, h, dpr] of [[1366, 768, 1], [1440, 900, 2], [777, 555, 1.5], [1920, 1080, 1.25]] as const) {
      const f = fitScale(w, h, dpr);
      for (const v of [f.width, f.height, f.left, f.top]) expect(Number.isInteger(v * dpr)).toBe(true);
      expect(f.width).toBeLessThanOrEqual(w);
      expect(f.height).toBeLessThanOrEqual(h);
    }
  });

  it('survives a tiny or empty viewport', () => {
    const f = fitScale(0, 0);
    expect(f.width).toBeGreaterThan(0);
    expect(Number.isFinite(f.scale)).toBe(true);
  });
});

describe('Renderer', () => {
  function harness() {
    const calls = { fills: [] as [number, number][], glyphs: [] as { code: number; fg: number; x: number; y: number }[] };
    const ctx: RenderContext = {
      fillStyle: '',
      fillRect: (x, y) => void calls.fills.push([x, y]),
      drawImage: () => undefined,
    };
    const atlas: Atlas = { draw: (_c, code, fg, x, y) => void calls.glyphs.push({ code, fg, x, y }) };
    const reset = () => {
      calls.fills.length = 0;
      calls.glyphs.length = 0;
    };
    return { calls, reset, renderer: new Renderer(ctx, atlas) };
  }

  it('paints every cell the first time, at the right pixel position', () => {
    const { renderer, calls } = harness();
    const g = new Grid();
    g.set(5, 3, 64, 0xffffff, 0x000000);
    expect(renderer.render(g)).toBe(COLS * ROWS);
    expect(calls.fills).toHaveLength(COLS * ROWS);
    expect(calls.glyphs).toEqual([{ code: 64, fg: 0xffffff, x: 5 * 9, y: 3 * 16 }]);
  });

  it('repaints nothing when nothing changed', () => {
    const { renderer, calls, reset } = harness();
    const g = new Grid();
    renderer.render(g);
    reset();
    expect(renderer.render(g)).toBe(0);
    expect(calls.fills).toHaveLength(0);
  });

  it('repaints only the changed cells after a move (Spec 01)', () => {
    const { renderer, calls, reset } = harness();
    const g = new Grid();
    g.set(10, 10, 64, 0xffffff, 0);
    renderer.render(g);
    reset();
    // The player steps one cell right: two cells change.
    g.set(10, 10, 250, 0x888888, 0);
    g.set(11, 10, 64, 0xffffff, 0);
    expect(renderer.render(g)).toBe(2);
    expect(calls.fills).toEqual([[90, 160], [99, 160]]);
    expect(calls.glyphs.map((c) => c.code)).toEqual([250, 64]);
  });

  it('repaints a cell whose colour alone changed, but ignores the colour of blank cells', () => {
    const { renderer, reset } = harness();
    const g = new Grid();
    g.set(1, 1, 65, 0xffffff, 0);
    renderer.render(g);
    reset();
    g.set(1, 1, 65, 0xff0000, 0);
    expect(renderer.render(g)).toBe(1);
    g.set(2, 2, 0, 0xff0000, 0); // a blank cell in a new foreground: nothing to see
    expect(renderer.render(g)).toBe(0);
    g.set(2, 2, 0, 0xff0000, 0x0000ff); // but a new background shows
    expect(renderer.render(g)).toBe(1);
  });
});

describe('procedural box drawing', () => {
  const covers = (code: number, px: number, py: number): boolean =>
    glyphRects(code)!.some(([x, y, w, h]) => px >= x && px < x + w && py >= y && py < y + h);

  it('only handles codes 176-223', () => {
    expect(glyphRects(65)).toBeUndefined();
    expect(glyphRects(175)).toBeUndefined();
    expect(glyphRects(224)).toBeUndefined();
    for (let c = 176; c <= 223; c++) expect(glyphRects(c)).toBeDefined();
  });

  it('keeps every rectangle inside the 9 x 16 cell', () => {
    for (let c = 176; c <= 223; c++) {
      for (const [x, y, w, h] of glyphRects(c)!) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(CELL_W);
        expect(y + h).toBeLessThanOrEqual(CELL_H);
      }
    }
  });

  it('joins lines across neighbouring cells', () => {
    // ─ reaches both side edges on one row; │ reaches both top and bottom edges on one column.
    const row = [...Array(CELL_H).keys()].find((y) => covers(196, 0, y))!;
    expect(covers(196, CELL_W - 1, row)).toBe(true);
    const col = [...Array(CELL_W).keys()].find((x) => covers(179, x, 0))!;
    expect(covers(179, col, CELL_H - 1)).toBe(true);
    // ┌ sends a line right on the same row as ─, and down on the same column as │.
    expect(covers(218, CELL_W - 1, row)).toBe(true);
    expect(covers(218, col, CELL_H - 1)).toBe(true);
    // ┘ sends a line left on that row and up on that column.
    expect(covers(217, 0, row)).toBe(true);
    expect(covers(217, col, 0)).toBe(true);
    // ═ and ║ do the same on their own two lines.
    expect(covers(205, 0, row - 1) && covers(205, CELL_W - 1, row + 1)).toBe(true);
    expect(covers(186, col - 1, 0) && covers(186, col + 1, CELL_H - 1)).toBe(true);
  });

  it('draws the full block solid and the shades in increasing density', () => {
    const area = (code: number) => glyphRects(code)!.reduce((a, [, , w, h]) => a + w * h, 0);
    expect(area(219)).toBe(CELL_W * CELL_H);
    expect(area(176)).toBeLessThan(area(177));
    expect(area(177)).toBeLessThan(area(178));
    expect(area(178)).toBeLessThan(area(219));
  });
});
