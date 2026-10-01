// The coverage report (Spec 08, "Validation and coverage"): every catalog table against its launch
// minimum, depth and theme gaps, group floors (monsters per rating, templates per kind and type),
// and the style mix of text tables.

import {
  CATALOG,
  MAX_OTHER_STYLE_SHARE,
  MINOR_ABILITIES_PER_CLASS,
  MONSTERS_PER_RATING,
  QUEST_TEMPLATES_PER_TYPE,
  QUEST_TYPES,
  RATINGS,
  RUMOURS_PER_KIND,
  RUMOUR_KINDS,
  type CatalogEntry,
} from '../src/core/catalog.ts';
import { matchesFilter, type Rollable } from '../src/core/roller.ts';
import type { ContentBundle } from '../src/core/schemas.ts';
import { knownThemeIds } from './content-checks.ts';

export interface GroupCoverage {
  label: string;
  count: number;
  minimum: number;
}

export interface DepthGap {
  from: number;
  to: number;
  /** Themes with no eligible entry over this range; undefined means every theme. */
  themes?: string[];
}

export interface StyleMix {
  total: number;
  other: number;
  share: number;
  flagged: boolean;
}

export interface TableCoverage {
  table: string;
  label: string;
  area: string;
  readBy: string;
  unit: string;
  /** False when no file defines the table yet. */
  present: boolean;
  count: number;
  minimum: number;
  groups: GroupCoverage[];
  depthGaps: DepthGap[];
  style?: StyleMix;
  /** Meets its launch minimum with no short group and no gap. */
  ok: boolean;
}

export interface CoverageReport {
  tables: TableCoverage[];
  warnings: string[];
  /** Short tables, short groups, depth gaps and flagged styles. Zero is the launch bar. */
  problems: number;
}

type Entry = Rollable & Record<string, unknown>;

const ratingDice = (rating: unknown): number => Number(String(rating).split('d')[0]);

function countBy(entries: readonly Entry[], key: (e: Entry) => string | number | undefined): Map<string | number, number> {
  const counts = new Map<string | number, number>();
  for (const e of entries) {
    const k = key(e);
    if (k !== undefined) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function groupsFor(table: string, entries: readonly Entry[], bundle: ContentBundle): GroupCoverage[] {
  if (table === 'monsters') {
    const counts = countBy(entries, (e) => ratingDice(e.rating));
    return RATINGS.map((r) => ({ label: `rating ${r}`, count: counts.get(r) ?? 0, minimum: MONSTERS_PER_RATING }));
  }
  if (table === 'rumours') {
    const counts = countBy(entries, (e) => String(e.needs));
    return RUMOUR_KINDS.map((k) => ({ label: `kind ${k}`, count: counts.get(k) ?? 0, minimum: RUMOURS_PER_KIND }));
  }
  if (table === 'quest_templates') {
    const counts = countBy(entries, (e) => String(e.needs));
    return QUEST_TYPES.map((t) => ({ label: `type ${t}`, count: counts.get(t) ?? 0, minimum: QUEST_TEMPLATES_PER_TYPE }));
  }
  if (table === 'minor_abilities') {
    // 12 per class, shared entries counting once in every pool they sit in (Spec 03).
    const counts = new Map<string, number>();
    for (const e of entries) for (const c of e.classes as string[]) counts.set(c, (counts.get(c) ?? 0) + 1);
    const classes = ((bundle.tables.classes ?? []) as Entry[]).map((c) => String(c.id));
    return classes.map((c) => ({ label: `class ${c}`, count: counts.get(c) ?? 0, minimum: MINOR_ABILITIES_PER_CLASS }));
  }
  return [];
}

/**
 * Runs of levels where some theme has no eligible entry. Themes favour entries, they do not
 * restrict them, so today a gap is the same in every theme; the check still asks per theme so it
 * stays right if that rule ever changes.
 */
function depthGaps(entries: readonly Entry[], range: readonly [number, number], themes: readonly string[] | undefined): DepthGap[] {
  const themeList: (string | undefined)[] = themes && themes.length > 0 ? [...themes] : [undefined];
  const gaps: DepthGap[] = [];
  let runKey: string | undefined;
  let run: { from: number; to: number; empty: (string | undefined)[] } | undefined;

  const flush = (): void => {
    if (!run) return;
    const gap: DepthGap = { from: run.from, to: run.to };
    if (themes && run.empty.length < themeList.length) gap.themes = run.empty as string[];
    gaps.push(gap);
    run = undefined;
    runKey = undefined;
  };

  for (let depth = range[0]; depth <= range[1]; depth++) {
    const empty = themeList.filter((theme) => !entries.some((e) => matchesFilter(e, { depth, theme })));
    if (empty.length === 0) {
      flush();
      continue;
    }
    const key = empty.join('|');
    if (run && key === runKey) {
      run.to = depth;
    } else {
      flush();
      run = { from: depth, to: depth, empty };
      runKey = key;
    }
  }
  flush();
  return gaps;
}

function styleMix(entries: readonly Entry[]): StyleMix {
  const other = entries.filter((e) => e.style !== undefined && e.style !== 'baseline').length;
  const share = entries.length === 0 ? 0 : other / entries.length;
  return { total: entries.length, other, share, flagged: share > MAX_OTHER_STYLE_SHARE };
}

function coverFor(spec: CatalogEntry, bundle: ContentBundle, themes: readonly string[] | undefined): TableCoverage {
  const rows = bundle.tables[spec.table];
  const entries = (rows ?? []) as Entry[];
  const groups = groupsFor(spec.table, entries, bundle);
  // Minor ability slots: a shared entry fills a slot in every pool it sits in (Spec 03).
  const count = spec.unit === 'slots' ? entries.reduce((n, e) => n + (e.classes as string[]).length, 0) : entries.length;
  const gaps = spec.depthCoverage && rows ? depthGaps(entries, spec.depthCoverage, themes) : [];
  const cover: TableCoverage = {
    table: spec.table,
    label: spec.label,
    area: spec.area,
    readBy: spec.readBy,
    unit: spec.unit,
    present: rows !== undefined,
    count,
    minimum: spec.minimum,
    groups,
    depthGaps: gaps,
    ok: false,
  };
  if (spec.depthCoverage && !rows) {
    cover.depthGaps = [{ from: spec.depthCoverage[0], to: spec.depthCoverage[1] }];
  }
  if (spec.text && rows) cover.style = styleMix(entries);
  cover.ok =
    count >= spec.minimum &&
    groups.every((g) => g.count >= g.minimum) &&
    cover.depthGaps.length === 0 &&
    !cover.style?.flagged;
  return cover;
}

export function buildCoverage(bundle: ContentBundle): CoverageReport {
  const themes = knownThemeIds(bundle);
  const tables = CATALOG.map((spec) => coverFor(spec, bundle, themes && [...themes]));
  const warnings: string[] = [];
  if (!themes) {
    warnings.push(
      'Theme ids are not checked yet: the level_themes table does not exist, so gaps are reported per depth only.',
    );
  }
  const problems = tables.reduce(
    (n, t) =>
      n +
      (t.count < t.minimum ? 1 : 0) +
      t.groups.filter((g) => g.count < g.minimum).length +
      t.depthGaps.length +
      (t.style?.flagged ? 1 : 0),
    0,
  );
  return { tables, warnings, problems };
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rangeText = (g: DepthGap): string =>
  `${g.from === g.to ? `level ${g.from}` : `levels ${g.from} to ${g.to}`}${g.themes ? ` (${g.themes.join(', ')})` : ' (all themes)'}`;

/** One self-contained HTML page. */
export function renderCoverageHtml(report: CoverageReport): string {
  const rows = report.tables
    .map((t) => {
      const short = t.groups.filter((g) => g.count < g.minimum);
      const notes = [
        ...(t.present ? [] : ['no file yet']),
        ...short.map((g) => `${g.label}: ${g.count} of ${g.minimum}`),
        ...t.depthGaps.map((g) => `gap: ${rangeText(g)}`),
        ...(t.style
          ? [`style: ${Math.round(t.style.share * 100)}% other${t.style.flagged ? ' (above 20%)' : ''}`]
          : []),
      ];
      return `<tr class="${t.ok ? 'ok' : 'short'}"><td>${esc(t.area)}</td><td>${esc(t.label)}<br><small>${esc(t.table)} · ${esc(t.readBy)}</small></td><td class="n">${t.count} / ${t.minimum} ${esc(t.unit)}</td><td>${t.ok ? 'meets launch' : 'short'}</td><td>${notes.map(esc).join('<br>')}</td></tr>`;
    })
    .join('\n');
  const warnings = report.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Megadungeon content coverage</title>
<style>
:root{color-scheme:dark;--bg:#14110f;--fg:#e8e0d0;--dim:#9a9080;--ok:#8fbf6a;--bad:#d9824b;--line:#3a322a}
body{background:var(--bg);color:var(--fg);font:14px/1.4 ui-monospace,Menlo,Consolas,monospace;margin:16px}
table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
tr.ok td:nth-child(4){color:var(--ok)}tr.short td:nth-child(4){color:var(--bad)}
small{color:var(--dim)}.n{white-space:nowrap}.warn{color:var(--dim)}
</style></head><body>
<h1>Content coverage</h1>
<p>${report.problems === 0 ? 'No gaps: every table meets its launch minimum.' : `${report.problems} problem(s) before launch.`}</p>
${warnings}
<table><thead><tr><th>Area</th><th>Table</th><th>Size</th><th>Status</th><th>Gaps</th></tr></thead><tbody>
${rows}
</tbody></table></body></html>
`;
}
