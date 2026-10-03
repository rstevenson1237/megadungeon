import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';

// Task 4.7: the launch feature tables meet the minimums of Spec 06 and Spec 08, with nothing left as a stub.
const bundle = contentBundle as unknown as ContentBundle;
type Row = { id: string; name: string; effect?: string; letter?: string; blessing?: string; buff?: { effect: string }; weight?: number; tags?: string[] };
const table = (name: string): Row[] => bundle.tables[name] as unknown as Row[];

describe('launch feature tables', () => {
  it.each([['fountain_effects', 12], ['altar_gods', 8], ['runes', 10], ['traps', 12], ['debris_finds', 20]] as const)('%s has at least %i rows, unique ids, no stub', (name, minimum) => {
    const rows = table(name);
    expect(rows.length).toBeGreaterThanOrEqual(minimum);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) expect(r.tags ?? []).not.toContain('stub');
  });

  it('fountains can help, harm and do nothing', () => {
    const effects = new Set(table('fountain_effects').map((r) => r.effect));
    for (const e of ['restore_dice', 'cure_poison', 'reveal_map', 'coins', 'poison', 'water_creature', 'nothing']) expect(effects.has(e), e).toBe(true);
  });

  it('every god gives one of the three blessings, and the eight gods cover all three and differ in name and buff', () => {
    const gods = table('altar_gods');
    expect(new Set(gods.map((g) => g.blessing))).toEqual(new Set(['bless', 'lift_curse', 'identify']));
    expect(new Set(gods.map((g) => g.name)).size).toBe(gods.length);
    expect(new Set(gods.map((g) => JSON.stringify(g.buff))).size).toBe(gods.length);
  });

  it('there is a rune for every letter of the alphabet', () => {
    expect(table('runes').map((r) => r.letter).sort().join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });

  it('debris turns up coins and items both, so a search is worth making', () => {
    const rows = table('debris_finds') as (Row & { find: string })[];
    expect(rows.filter((r) => r.find === 'coins').length).toBeGreaterThanOrEqual(5);
    expect(rows.filter((r) => r.find === 'item').length).toBeGreaterThanOrEqual(8);
  });
});
