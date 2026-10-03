import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CATALOG, QUEST_TYPES, RUMOUR_KINDS } from '../src/core/catalog.ts';
import { tableSchemas, type ContentBundle } from '../src/core/schemas.ts';
import { CHARACTER_PANE, inner } from '../src/ui/panes.ts';
import { buildContent } from '../tools/content-build.ts';
import { NAME_MAX_WIDTH, checkContent } from '../tools/content-checks.ts';
import { buildCoverage, renderCoverageHtml } from '../tools/coverage.ts';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function contentDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'content-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, text);
  }
  return dir;
}

const monster = (extra = ''): string =>
  `- id: rat\n  name: rat\n  glyph: r\n  colour: moss\n  rating: 1d4+0\n  behaviour: coward\n${extra}`;
const real = buildContent(resolve(import.meta.dirname, '..', 'content'));

describe('reference check', () => {
  it('accepts a known behaviour and a loot roll that names a table', () => {
    const dir = contentDir({
      'creatures/monsters.yaml': monster('  loot: { roll: village_names }\n'),
      'world/village_names.yaml': '- id: a\n  name: A\n',
    });
    expect(buildContent(dir).errors).toEqual([]);
  });

  it('fails on a behaviour that is not defined in code', () => {
    const { errors } = buildContent(contentDir({ 'creatures/monsters.yaml': monster().replace('coward', 'dancer') }));
    expect(errors.join('\n')).toMatch(/monsters "rat": behaviour "dancer" is not a known behaviour/);
  });

  it('fails on a loot roll that names no table', () => {
    const { errors } = buildContent(contentDir({ 'creatures/monsters.yaml': monster('  loot: { roll: pocket_change }\n') }));
    expect(errors.join('\n')).toMatch(/loot\.roll "pocket_change" is not a table/);
  });

  it('fails on a roll cycle between tables', () => {
    const bundle: ContentBundle = { tables: { monsters: [{ id: 'rat', behaviour: 'brute', loot: { roll: 'monsters' } }] } };
    expect(checkContent(bundle).join('\n')).toMatch(/roll cycle: monsters -> monsters/);
  });

  it('checks themes: keys against the theme table once it exists, and not before', () => {
    const entry = { id: 'rat', name: 'rat', behaviour: 'brute', themes: { sewers: 2, nowhere: 2 } };
    expect(checkContent({ tables: { monsters: [entry] } })).toEqual([]);
    const withThemes: ContentBundle = { tables: { monsters: [entry], level_themes: [{ id: 'sewers' }] } };
    expect(checkContent(withThemes)).toEqual(['monsters "rat": themes names unknown theme "nowhere"']);
  });
});

describe('theme variants (Spec 02, task 2.3)', () => {
  const themes = (...rows: object[]): ContentBundle => ({ tables: { level_themes: rows as ContentBundle['tables'][string] } });

  it('accepts the variants on the layouts that read them', () => {
    expect(
      checkContent(
        themes(
          { id: 'a', layout: 'cellular_caves', stamp: 'river', liquid: 'lava' },
          { id: 'b', layout: 'rooms_and_corridors', pillared: true },
          { id: 'c', layout: 'channel_grid', liquid: 'water' },
        ),
      ),
    ).toEqual([]);
  });

  it('rejects a variant on a layout that ignores it, and shafts that hold a liquid', () => {
    const errors = checkContent(
      themes(
        { id: 'a', layout: 'warren_tunnels', stamp: 'lake' },
        { id: 'b', layout: 'maze_with_crypts', pillared: true },
        { id: 'c', layout: 'mirrored_halls', liquid: 'water' },
        { id: 'd', layout: 'cellular_caves', stamp: 'shafts', liquid: 'lava' },
      ),
    );
    expect(errors).toEqual([
      'level_themes "a": stamp needs the cellular_caves layout, not warren_tunnels',
      'level_themes "b": pillared needs the rooms_and_corridors layout, not maze_with_crypts',
      'level_themes "c": liquid needs the cellular_caves or channel_grid layout, not mirrored_halls',
      'level_themes "d": shafts hold no liquid',
    ]);
  });

  it('the real theme table sets them as approved', () => {
    const byId = new Map((real.bundle.tables['level_themes'] as Record<string, unknown>[]).map((t) => [t['id'], t]));
    expect(byId.get('old_mine')).toMatchObject({ stamp: 'shafts' });
    expect(byId.get('fungal_caverns')).toMatchObject({ stamp: 'river' });
    expect(byId.get('underdark_lake')).toMatchObject({ stamp: 'lake' });
    expect(byId.get('lava_forges')).toMatchObject({ stamp: 'river', liquid: 'lava' });
    expect(byId.get('dwarven_hold')).toMatchObject({ pillared: true });
  });
});

describe('text check', () => {
  it('fails on an unknown placeholder in a template', () => {
    const dir = contentDir({
      'lore/rumours.yaml': '- id: r\n  needs: vault\n  text:\n    - "A vault on level {lvl}."\n',
    });
    expect(buildContent(dir).errors.join('\n')).toMatch(/rumours "r": text\[0\] has unknown placeholder "\{lvl\}"/);
  });

  it('fails on a stray brace, and passes the grammar helpers', () => {
    const bad = contentDir({ 'lore/rumours.yaml': '- id: r\n  needs: vault\n  text: ["A vault on level {level"]\n' });
    expect(buildContent(bad).errors.join('\n')).toMatch(/unbalanced brace/);
    const good = contentDir({
      'lore/quest_templates.yaml': '- id: q\n  needs: captive\n  text: ["{Monsters} hold {a:item} on level {level}."]\n',
    });
    expect(buildContent(good).errors).toEqual([]);
  });

  it('fails on a rumour kind or quest type the code does not know', () => {
    expect(buildContent(contentDir({ 'lore/rumours.yaml': '- id: r\n  needs: gossip\n  text: ["x"]\n' })).errors.join('\n')).toMatch(/needs/);
    expect(buildContent(contentDir({ 'lore/quest_templates.yaml': '- id: q\n  needs: dance\n  text: ["x"]\n' })).errors.join('\n')).toMatch(/needs/);
  });

  it('fails on a template with no phrasing', () => {
    expect(buildContent(contentDir({ 'lore/rumours.yaml': '- id: r\n  needs: vault\n  text: []\n' })).errors.join('\n')).toMatch(/text/);
  });

  it('fails on a name wider than the character pane text area', () => {
    const ok = 'a'.repeat(NAME_MAX_WIDTH);
    expect(buildContent(contentDir({ 'world/village_names.yaml': `- id: a\n  name: ${ok}\n` })).errors).toEqual([]);
    const { errors } = buildContent(contentDir({ 'world/village_names.yaml': `- id: a\n  name: ${ok}b\n` }));
    expect(errors.join('\n')).toMatch(/name is 26 cells wide, the most is 25/);
  });

  it('keeps the name limit in step with the character pane', () => {
    // inner width of the pane less the one-cell margin the pane draws with
    expect(NAME_MAX_WIDTH).toBe(inner(CHARACTER_PANE).w - 1);
  });
});

describe('coverage report', () => {
  const report = buildCoverage(real.bundle);
  const byTable = (name: string) => report.tables.find((t) => t.table === name)!;

  it('lists every catalog table against its launch minimum', () => {
    expect(report.tables.map((t) => t.table)).toEqual(CATALOG.map((c) => c.table));
    expect(report.tables).toHaveLength(28);
    expect(byTable('monsters')).toMatchObject({ count: 150, minimum: 150, present: true, ok: true });
    expect(byTable('spells')).toMatchObject({ count: 30, minimum: 15, present: true, ok: true });
    expect(byTable('minor_abilities')).toMatchObject({ minimum: 240, unit: 'slots' });
    expect(byTable('rumours').minimum).toBe(60);
    expect(byTable('quest_templates').minimum).toBe(40);
  });

  it('gives every schema a catalog entry', () => {
    const names = new Set(CATALOG.map((c) => c.table));
    for (const table of Object.keys(tableSchemas)) expect(names.has(table), table).toBe(true);
  });

  it('finds no depth gap in the monsters and bosses (with the stub final boss), which cover every level a run places them on', () => {
    expect(byTable('monsters').depthGaps).toEqual([]);
    expect(byTable('bosses').depthGaps).toEqual([]);
    expect(byTable('bosses')).toMatchObject({ count: 41, minimum: 40, present: true, ok: true });
  });

  it('counts monsters per rating', () => {
    const groups = byTable('monsters').groups;
    expect(groups).toHaveLength(20);
    expect(groups[0]).toEqual({ label: 'rating 1', count: 8, minimum: 5 });
    expect(groups[7]).toEqual({ label: 'rating 8', count: 8, minimum: 5 });
    expect(groups[8]).toEqual({ label: 'rating 9', count: 8, minimum: 5 });
  });

  it('finds a template for every rumour kind and quest type in the stub content', () => {
    for (const g of byTable('rumours').groups) expect(g.count, g.label).toBeGreaterThanOrEqual(g.minimum);
    expect(byTable('rumours').groups.map((g) => g.label)).toEqual(RUMOUR_KINDS.map((k) => `kind ${k}`));
    const quest = byTable('quest_templates').groups;
    expect(quest.map((g) => g.label)).toEqual(QUEST_TYPES.map((t) => `type ${t}`));
    for (const g of quest) expect(g.count).toBeGreaterThanOrEqual(1);
  });

  it('flags a template kind with no template', () => {
    const { bundle } = buildContent(
      contentDir({ 'lore/rumours.yaml': '- id: r\n  needs: vault\n  text: ["Level {level}."]\n' }),
    );
    const groups = buildCoverage(bundle).tables.find((t) => t.table === 'rumours')!.groups;
    expect(groups.filter((g) => g.count === 0).map((g) => g.label)).toEqual([
      'kind boss',
      'kind teleporter',
      'kind rival_stash',
      'kind trap_level',
      'kind fountain',
    ]);
  });

  it('finds depth gaps per theme once themes exist', () => {
    const bundle: ContentBundle = {
      tables: {
        level_themes: [{ id: 'sewers' }, { id: 'mine' }],
        monsters: [{ id: 'a', rating: '1d4+0', depth: [1, 100] }],
        magic_items: [{ id: 'b', depth: [1, 40] }],
      },
    };
    const r = buildCoverage(bundle);
    expect(r.warnings).toEqual([]);
    expect(r.tables.find((t) => t.table === 'monsters')!.depthGaps).toEqual([]);
    // favour-only themes: the missing depths are missing in every theme, so no theme is singled out
    expect(r.tables.find((t) => t.table === 'magic_items')!.depthGaps).toEqual([{ from: 41, to: 100 }]);
  });

  it('warns that theme ids are unchecked only while there is no theme table', () => {
    expect(report.warnings).toEqual([]); // the real content has the 13 themes
    const bare = buildCoverage({ tables: { village_names: [] } });
    expect(bare.warnings.join(' ')).toMatch(/level_themes/);
  });

  it('shows the 13 themes covering every level, so the theme table has no gap', () => {
    expect(byTable('level_themes')).toMatchObject({ count: 13, minimum: 13, depthGaps: [], ok: true });
  });

  it('flags a text table with more than 20% in other styles', () => {
    const entry = (id: string, style?: string) => ({ id, name: id, ...(style ? { style } : {}) });
    const fine: ContentBundle = {
      tables: { village_names: [entry('a'), entry('b'), entry('c'), entry('d'), entry('e', 'grim')] },
    };
    const over: ContentBundle = {
      tables: { village_names: [entry('a'), entry('b'), entry('c', 'grim'), entry('d', 'archaic')] },
    };
    const style = (b: ContentBundle) => buildCoverage(b).tables.find((t) => t.table === 'village_names')!.style!;
    expect(style(fine)).toMatchObject({ total: 5, other: 1, flagged: false });
    expect(style(over)).toMatchObject({ total: 4, other: 2, flagged: true });
    expect(style({ tables: { village_names: [entry('a', 'baseline')] } }).other).toBe(0);
  });

  it('meets the launch bar only when minimums, groups and gaps are all clean', () => {
    const rows = (n: number, make: (i: number) => object) => Array.from({ length: n }, (_, i) => make(i));
    const bundle: ContentBundle = {
      tables: {
        village_names: rows(40, (i) => ({ id: `v${i}`, name: `V${i}` })),
        monsters: rows(150, (i) => ({ id: `m${i}`, rating: `${(i % 20) + 1}d6+0`, depth: [1, 100] })),
      },
    };
    const r = buildCoverage(bundle);
    expect(r.tables.find((t) => t.table === 'village_names')!.ok).toBe(true);
    expect(r.tables.find((t) => t.table === 'monsters')!.ok).toBe(true);
    expect(r.tables.find((t) => t.table === 'bosses')!.ok).toBe(false);
    expect(r.problems).toBeGreaterThan(0);
  });

  it('writes a page that names every table', () => {
    const html = renderCoverageHtml(report);
    for (const t of CATALOG) expect(html).toContain(t.table);
    expect(html).toContain('150 / 150 entries');
    expect(html).toContain('4 / 40 entries');
    expect(html.startsWith('<!doctype html>')).toBe(true);
  });

  it('escapes table text in the page', () => {
    const html = renderCoverageHtml({
      warnings: ['<script>alert(1)</script>'],
      problems: 1,
      tables: [],
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
