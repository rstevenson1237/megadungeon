import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import { PALETTE_TOKENS, type ContentBundle } from '../src/core/schemas.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { findProblems } from '../src/rules/world/validate.ts';
import { mapLook } from '../src/ui/palette.ts';

// Task 4.2 (Spec 08, Addendum A): every one of the 13 level themes has a palette and tiles, and every
// theme generates and has a look the map can draw.
const bundle = contentBundle as unknown as ContentBundle;
interface Theme {
  id: string;
  depth?: [number, number];
  size: 'small' | 'medium' | 'large';
  palette?: Record<string, string>;
  tiles?: { wall: number; floor: number };
}
const themes = bundle.tables['level_themes'] as unknown as Theme[];

const rgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
/** Relative luminance (WCAG) of a #rrggbb colour. */
const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe('level theme looks', () => {
  it('has the 13 themes, each with all eight palette tokens and tiles', () => {
    expect(themes).toHaveLength(13);
    for (const t of themes) {
      expect(Object.keys(t.palette ?? {}).sort(), t.id).toEqual([...PALETTE_TOKENS].sort());
      expect(t.tiles, t.id).toBeDefined();
    }
  });

  it('gives every theme its own wall and floor colours', () => {
    const seen = new Set(themes.map((t) => `${t.palette!['wall']}${t.palette!['floor']}`));
    expect(seen.size).toBe(themes.length);
  });

  it('keeps every colour readable on the black map background, and walls brighter than floors', () => {
    for (const t of themes) {
      for (const [token, hex] of Object.entries(t.palette!)) {
        expect(luminance(hex), `${t.id} ${token}`).toBeGreaterThan(0.03);
      }
      expect(luminance(t.palette!['wall']!), t.id).toBeGreaterThan(luminance(t.palette!['floor']!));
    }
  });

  it('resolves to a look the map draws', () => {
    for (const t of themes) {
      const look = mapLook(t);
      expect(look.wallGlyph, t.id).toBe(t.tiles!.wall);
      expect(look.floorGlyph, t.id).toBe(t.tiles!.floor);
      expect(look.colours.wall.visible, t.id).toBe(parseInt(t.palette!['wall']!.slice(1), 16));
    }
  });

  it('generates a clean level of every theme', () => {
    const options = runOptionsFor(bundle, 1);
    for (const t of themes) {
      const depth = t.depth![0];
      const style = t.id === 'abyssal_throne' ? options.styleFor!(100) : (t as never);
      const level = generateLevel(7, depth, t.size, style);
      expect(findProblems(level), t.id).toEqual([]);
    }
  });
});
