import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';
import { DISGUISED_KINDS } from '../src/core/catalog.ts';

// Task 4.5: the launch item tables, counted as Spec 05 and Spec 08 ask.
const bundle = contentBundle as unknown as ContentBundle;
type Row = { id: string; name: string; kind?: string; value?: number; depth?: [number, number] };
const table = (name: string): Row[] => bundle.tables[name] as unknown as Row[];

describe('launch item tables', () => {
  it('has 130 magic items, 40 artifacts, 100 disguise names and 50 gems and jewelry, none left as a stub', () => {
    expect(table('magic_items')).toHaveLength(130);
    expect(table('artifacts')).toHaveLength(40);
    expect(table('disguise_names')).toHaveLength(100);
    expect(table('gems_jewelry')).toHaveLength(50);
    for (const name of ['magic_items', 'artifacts', 'disguise_names', 'gems_jewelry']) {
      const rows = table(name);
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
      for (const r of rows) expect(JSON.stringify(r)).not.toContain('stub');
    }
  });

  it('every disguised kind has a name for each of its items', () => {
    for (const kind of DISGUISED_KINDS) {
      const items = table('magic_items').filter((r) => r.kind === kind).length;
      const names = table('disguise_names').filter((r) => r.kind === kind).length;
      expect(names).toBeGreaterThanOrEqual(items);
    }
  });

  it('gems and jewelry run from the cheapest on the first level to the dearest at the bottom', () => {
    const rows = table('gems_jewelry');
    expect(rows.some((r) => r.depth![0] === 1 && r.value! <= 50)).toBe(true);
    expect(rows.some((r) => r.depth![1] === 100 && r.value! >= 10000)).toBe(true);
    for (const r of rows) expect(['gem', 'jewelry']).toContain(r.kind);
  });

  it('artifacts are spread over shallow, middle and deep ranges', () => {
    const rows = table('artifacts');
    expect(rows.filter((r) => r.depth![0] <= 5).length).toBeGreaterThanOrEqual(8);
    expect(rows.filter((r) => r.depth![0] >= 20 && r.depth![0] <= 40).length).toBeGreaterThanOrEqual(8);
    expect(rows.filter((r) => r.depth![0] >= 55).length).toBeGreaterThanOrEqual(8);
  });
});
