import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';

// Task 4.8: the launch lore tables, held to the counts of Spec 08 and the lengths of the style guide.
const bundle = contentBundle as unknown as ContentBundle;
type Row = { id: string; text?: string; entries?: string[]; style?: string; themes?: Record<string, number>; tags?: string[] };
const table = (name: string): Row[] => bundle.tables[name] as unknown as Row[];
const themeIds = new Set((bundle.tables['level_themes'] as { id: string }[]).map((t) => t.id));

describe.each([['books', 200, 220], ['graffiti', 300, 70], ['signs', 120, 40]] as const)('%s', (name, count, longest) => {
  const rows = table(name);
  it(`has ${count} rows with unique ids and texts, no stub`, () => {
    expect(rows).toHaveLength(count);
    expect(new Set(rows.map((r) => r.id)).size).toBe(count);
    expect(new Set(rows.map((r) => r.text)).size).toBe(count);
    for (const r of rows) expect(r.tags ?? []).not.toContain('stub');
  });
  it(`keeps each text to ${longest} plain ASCII characters, and braces out`, () => {
    for (const r of rows) {
      expect(r.text!.length, r.id).toBeLessThanOrEqual(longest);
      expect(r.text!, r.id).toMatch(/^[\x20-\x7e]+$/);
      expect(r.text!, r.id).not.toMatch(/[{}]/);
    }
  });
  it('tags no more than 20% as another style, and favours only real themes', () => {
    expect(rows.filter((r) => r.style).length / rows.length).toBeLessThanOrEqual(0.2);
    for (const r of rows) for (const t of Object.keys(r.themes ?? {})) expect(themeIds.has(t), `${r.id}: ${t}`).toBe(true);
  });
});

describe('lore chains', () => {
  const rows = table('lore_chains');
  it('has 25 chains of six entries, none repeated', () => {
    expect(rows).toHaveLength(25);
    const all = rows.flatMap((r) => r.entries!);
    expect(all).toHaveLength(150);
    expect(new Set(all).size).toBe(150);
    for (const e of all) expect(e).toMatch(/^[\x20-\x7e]+$/);
    for (const r of rows) expect(r.entries).toHaveLength(6);
  });
});
