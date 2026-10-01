// Content checks that run after every table has passed its schema (Spec 08, "Validation and
// coverage"): references, roll cycles, theme ids, template text and single-line widths.

import { BEHAVIOURS, EFFECTS } from '../src/core/catalog.ts';
import type { ContentBundle } from '../src/core/schemas.ts';
import { templateErrors } from '../src/core/templates.ts';

type Entry = Record<string, unknown>;

/** Lists of ids that live in code, which table fields may name. */
export const REGISTRIES: Record<string, readonly string[]> = {
  behaviours: BEHAVIOURS,
  effects: EFFECTS,
};

/** A field that points at something else; the target must exist. */
export interface RefRule {
  /** Dotted path into the entry, e.g. `loot.roll`. */
  field: string;
  /** `table`: the value names another table in the bundle. Otherwise a code registry name. */
  target: 'table' | { registry: keyof typeof REGISTRIES };
}

/** Each table's reference fields. A task that adds a table with `effect:` or `roll:` adds its rule here. */
export const REFERENCE_RULES: Record<string, readonly RefRule[]> = {
  monsters: [
    { field: 'behaviour', target: { registry: 'behaviours' } },
    { field: 'loot.roll', target: 'table' },
  ],
};

/** The table that defines theme ids; `themes:` keys are checked against it once it exists. */
export const THEME_TABLE = 'level_themes';

/**
 * Template text fields per table, checked for unknown placeholders.
 * (Tables with `needs` and `text` are also the ones the template engine reads.)
 */
export const TEMPLATE_FIELDS: Record<string, readonly string[]> = {
  rumours: ['text'],
  quest_templates: ['text'],
};

/**
 * Widest a single-line name may be. Spec 01 sets no per-field widths, so this is the text area
 * of the narrowest pane that shows names, the character pane: 28 cells, less the border (2) and
 * the one-cell margin (1). A test keeps it in step with the pane geometry.
 */
export const NAME_MAX_WIDTH = 25;

/** Single-line fields per table. Longer text wraps and is not listed here. */
export const SINGLE_LINE_FIELDS: Record<string, readonly string[]> = {
  monsters: ['name'],
  village_names: ['name'],
};

function getPath(entry: Entry, path: string): unknown {
  let value: unknown = entry;
  for (const key of path.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Entry)[key];
  }
  return value;
}

const entriesOf = (bundle: ContentBundle, table: string): Entry[] => (bundle.tables[table] ?? []) as Entry[];

/** Every id a table points at must exist; roll cycles between tables are refused. */
export function checkReferences(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const edges = new Map<string, Set<string>>();

  for (const [table, rules] of Object.entries(REFERENCE_RULES)) {
    for (const entry of entriesOf(bundle, table)) {
      for (const rule of rules) {
        const value = getPath(entry, rule.field);
        if (value === undefined) continue;
        const where = `${table} "${String(entry.id)}": ${rule.field}`;
        if (rule.target === 'table') {
          const name = String(value);
          if (!(name in bundle.tables)) {
            errors.push(`${where} "${name}" is not a table`);
          } else {
            if (!edges.has(table)) edges.set(table, new Set());
            edges.get(table)!.add(name);
          }
        } else {
          const registry = REGISTRIES[rule.target.registry]!;
          if (!registry.includes(String(value))) {
            errors.push(`${where} "${String(value)}" is not a known ${rule.target.registry.replace(/s$/, '')}`);
          }
        }
      }
    }
  }

  errors.push(...checkRollCycles(edges));
  errors.push(...checkThemeIds(bundle));
  return errors;
}

function checkRollCycles(edges: Map<string, Set<string>>): string[] {
  const errors: string[] = [];
  const done = new Set<string>();
  const visit = (table: string, trail: string[]): void => {
    if (trail.includes(table)) {
      errors.push(`roll cycle: ${[...trail.slice(trail.indexOf(table)), table].join(' -> ')}`);
      return;
    }
    if (done.has(table)) return;
    for (const next of edges.get(table) ?? []) visit(next, [...trail, table]);
    done.add(table);
  };
  for (const table of edges.keys()) visit(table, []);
  return errors;
}

/** Theme ids named in `themes:` fields. Unchecked (undefined) until the theme table exists. */
export function knownThemeIds(bundle: ContentBundle): Set<string> | undefined {
  const table = bundle.tables[THEME_TABLE];
  return table ? new Set((table as Entry[]).map((e) => String(e.id))) : undefined;
}

function checkThemeIds(bundle: ContentBundle): string[] {
  const known = knownThemeIds(bundle);
  if (!known) return [];
  const errors: string[] = [];
  for (const [table, entries] of Object.entries(bundle.tables)) {
    for (const entry of entries as Entry[]) {
      const themes = entry.themes as Record<string, number> | undefined;
      for (const theme of Object.keys(themes ?? {})) {
        if (!known.has(theme)) errors.push(`${table} "${String(entry.id)}": themes names unknown theme "${theme}"`);
      }
    }
  }
  return errors;
}

/** Template placeholders must be known, and single-line fields must fit the screen. */
export function checkText(bundle: ContentBundle): string[] {
  const errors: string[] = [];

  for (const [table, fields] of Object.entries(TEMPLATE_FIELDS)) {
    for (const entry of entriesOf(bundle, table)) {
      for (const field of fields) {
        const value = entry[field];
        const lines = Array.isArray(value) ? value : [value];
        lines.forEach((line, i) => {
          for (const problem of templateErrors(String(line))) {
            errors.push(`${table} "${String(entry.id)}": ${field}[${i}] has ${problem}`);
          }
        });
      }
    }
  }

  for (const [table, fields] of Object.entries(SINGLE_LINE_FIELDS)) {
    for (const entry of entriesOf(bundle, table)) {
      for (const field of fields) {
        const text = String(entry[field] ?? '');
        if (text.length > NAME_MAX_WIDTH) {
          errors.push(
            `${table} "${String(entry.id)}": ${field} is ${text.length} cells wide, the most is ${NAME_MAX_WIDTH}`,
          );
        }
        if (/[\r\n]/.test(text)) errors.push(`${table} "${String(entry.id)}": ${field} must be one line`);
      }
    }
  }
  return errors;
}

export function checkContent(bundle: ContentBundle): string[] {
  return [...checkReferences(bundle), ...checkText(bundle)];
}
