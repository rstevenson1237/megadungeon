import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';
import { MONSTER_COLOURS } from '../src/game/monsters.ts';
import { bossCeiling, parseRating, ratingCeiling } from '../src/rules/world/depth.ts';

// Task 4.3 (Spec 08, Spec 02 "Depth scaling"): the launch monsters and bosses.
interface Row {
  id: string;
  name: string;
  glyph: string;
  colour: string;
  rating: string;
  behaviour: string;
  depth?: [number, number];
  tags?: string[];
}
const bundle = contentBundle as unknown as ContentBundle;
const monsters = (bundle.tables['monsters'] as unknown as Row[]).filter((m) => !m.tags?.includes('stub'));
const bosses = (bundle.tables['bosses'] as unknown as Row[]).filter((b) => !b.tags?.includes('final'));
const window = (r: Row): [number, number] => r.depth ?? [1, 100];

describe('launch monsters', () => {
  it('are 150 rows with at least 5 for each rating from 1 to 20', () => {
    expect(monsters).toHaveLength(150);
    for (let dice = 1; dice <= 20; dice++) {
      expect(monsters.filter((m) => parseRating(m.rating).dice === dice).length, `rating ${dice}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('only appear where their dice fit the depth ceiling', () => {
    for (const m of monsters) expect(parseRating(m.rating).dice, m.id).toBeLessThanOrEqual(ratingCeiling(window(m)[0]));
  });

  it('give every level from 1 to 100 something to place, and a creature for each feature that summons', () => {
    for (let depth = 1; depth <= 100; depth++) {
      const eligible = monsters.filter((m) => depth >= window(m)[0] && depth <= window(m)[1] && parseRating(m.rating).dice <= ratingCeiling(depth));
      expect(eligible.length, `depth ${depth}`).toBeGreaterThanOrEqual(8);
      for (const tag of ['aquatic', 'undead', 'vermin']) expect(eligible.some((m) => m.tags?.includes(tag)), `${tag} at depth ${depth}`).toBe(true);
    }
  });

  it('use a colour the game draws, a real behaviour and a glyph that is not the player, a bandit or a rival', () => {
    for (const m of [...monsters, ...bosses]) {
      expect(MONSTER_COLOURS[m.colour], `${m.id} colour ${m.colour}`).toBeDefined();
      expect(m.behaviour, m.id).not.toBe('stub');
      expect(m.glyph, m.id).toMatch(/^[A-Za-z]$/);
      expect(['B', 'R'], m.id).not.toContain(m.glyph);
    }
  });

  it('have unique names', () => {
    const names = [...monsters, ...bosses].map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('launch bosses', () => {
  it('are 40 rows rated at the ceiling plus 3 dice where they first appear', () => {
    expect(bosses).toHaveLength(40);
    for (const b of bosses) expect(parseRating(b.rating).dice, b.id).toBe(bossCeiling(window(b)[0]));
  });

  it('cover every level from 1 to 99 and never flee', () => {
    for (let depth = 1; depth <= 99; depth++) {
      expect(bosses.filter((b) => depth >= window(b)[0] && depth <= window(b)[1]).length, `depth ${depth}`).toBeGreaterThanOrEqual(2);
    }
    for (const b of bosses) expect(['coward', 'pack'], b.id).not.toContain(b.behaviour);
  });
});
