import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';
import { placeholdersOf } from '../src/core/templates.ts';

// Task 4.9: rumour and quest templates for every kind, and the launch name tables.
const bundle = contentBundle as unknown as ContentBundle;
type Row = { id: string; name?: string; needs?: string; text?: string[]; style?: string; tags?: string[] };
const table = (name: string): Row[] => bundle.tables[name] as unknown as Row[];

describe('rumour templates', () => {
  const rows = table('rumours');
  it('has 10 for each of the six kinds, using only the placeholders the tavern supplies', () => {
    expect(rows).toHaveLength(60);
    for (const kind of ['vault', 'boss', 'teleporter', 'rival_stash', 'trap_level', 'fountain']) expect(rows.filter((r) => r.needs === kind), kind).toHaveLength(10);
    for (const r of rows) {
      const allowed = r.needs === 'boss' ? ['level', 'artifact'] : ['level'];
      for (const t of r.text!) for (const p of placeholdersOf(t)) expect(allowed, `${r.id}: ${p}`).toContain(p);
      if (r.needs === 'boss') expect(r.text!.some((t) => !t.includes('{artifact}')), r.id).toBe(true);
    }
  });
});

describe('quest templates and items', () => {
  it('has 10 templates for each quest type, with the placeholders its fact supplies', () => {
    const rows = table('quest_templates');
    expect(rows).toHaveLength(40);
    const extra: Record<string, string[]> = { captive: ['monster'], opponent: ['monster'], belonging: ['item'], magic_item: ['item'] };
    for (const [type, more] of Object.entries(extra)) {
      const of = rows.filter((r) => r.needs === type);
      expect(of, type).toHaveLength(10);
      for (const r of of) for (const t of r.text!) for (const p of placeholdersOf(t)) expect(['level', 'village', ...more], `${r.id}: ${p}`).toContain(p);
    }
  });

  it('has 30 belongings and 30 magic items, each at most 25 cells', () => {
    const rows = table('quest_items') as (Row & { needs: string })[];
    expect(rows).toHaveLength(60);
    expect(rows.filter((r) => r.needs === 'belonging')).toHaveLength(30);
    expect(rows.filter((r) => r.needs === 'magic_item')).toHaveLength(30);
    expect(new Set(rows.map((r) => r.name)).size).toBe(60);
    for (const r of rows) expect(r.name!.length, r.id).toBeLessThanOrEqual(25);
  });
});

describe('name tables', () => {
  it.each([['village_names', 40], ['npc_names', 300], ['rivals', 30], ['character_names', 150], ['vault_names', 30]] as const)('%s has %i unique names, none a stub, each within 25 cells', (name, count) => {
    const rows = table(name);
    expect(rows).toHaveLength(count);
    expect(new Set(rows.map((r) => r.id)).size).toBe(count);
    expect(new Set(rows.map((r) => r.name!.toLowerCase())).size).toBe(count);
    for (const r of rows) {
      expect(r.tags ?? []).not.toContain('stub');
      expect(r.id).not.toContain('stub');
      expect(r.name!.length, r.id).toBeLessThanOrEqual(25);
    }
  });

  it('character names are 1 to 16 letters, spaces, apostrophes or hyphens', () => {
    for (const r of table('character_names')) {
      expect(r.name!.length).toBeLessThanOrEqual(16);
      expect(r.name!).toMatch(/^[A-Za-z][A-Za-z' -]*$/);
    }
  });

  it('vault and shrine names start with a lowercase the', () => {
    for (const r of table('vault_names')) expect(r.name!, r.id).toMatch(/^the [A-Z]/);
  });
});
