// Content checks that run after every table has passed its schema (Spec 08, "Validation and
// coverage"): references, roll cycles, theme ids, template text and single-line widths.

import { BEHAVIOURS, DISGUISED_KINDS, EFFECTS } from '../src/core/catalog.ts';
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
  /** `table`: the value names another table in the bundle. `ids`: the value is an id in the named table. Otherwise a code registry name. */
  target: 'table' | { ids: string } | { registry: keyof typeof REGISTRIES };
}

/** Each table's reference fields. A task that adds a table with `effect:` or `roll:` adds its rule here. */
export const REFERENCE_RULES: Record<string, readonly RefRule[]> = {
  monsters: [
    { field: 'behaviour', target: { registry: 'behaviours' } },
    { field: 'loot.roll', target: 'table' },
  ],
  bosses: [{ field: 'behaviour', target: { registry: 'behaviours' } }],
  spells: [{ field: 'effect', target: { registry: 'effects' } }],
  magic_items: [
    { field: 'effect', target: { registry: 'effects' } },
    { field: 'spell', target: { ids: 'spells' } },
    { field: 'base', target: { ids: 'equipment_bases' } },
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
  level_themes: ['name'],
  artifacts: ['name'],
  bosses: ['name'],
  traps: ['name'],
  altar_gods: ['name'],
  runes: ['name'],
  rivals: ['name'],
  npc_names: ['name'],
  vault_names: ['name'],
  gems_jewelry: ['name'],
  magic_items: ['name'],
  quest_items: ['name'],
  classes: ['name'],
  minor_abilities: ['name'],
  spells: ['name'],
  equipment_bases: ['name'],
  disguise_names: ['name'],
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
        } else if ('ids' in rule.target) {
          const known = new Set(entriesOf(bundle, rule.target.ids).map((e) => String(e.id)));
          if (!known.has(String(value))) errors.push(`${where} "${String(value)}" is not an id in ${rule.target.ids}`);
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
  errors.push(...checkThemeVariants(bundle));
  errors.push(...checkMinorAbilityClasses(bundle));
  errors.push(...checkClassSpells(bundle));
  errors.push(...checkItems(bundle));
  return errors;
}

/** A minor ability may only sit in the pool of a class that exists, once (Spec 03). */
function checkMinorAbilityClasses(bundle: ContentBundle): string[] {
  const known = new Set(entriesOf(bundle, 'classes').map((e) => String(e.id)));
  const errors: string[] = [];
  for (const entry of entriesOf(bundle, 'minor_abilities')) {
    const listed = entry.classes as string[];
    for (const cls of listed) {
      if (!known.has(cls)) errors.push(`minor_abilities "${String(entry.id)}": classes "${cls}" is not a class`);
    }
    if (new Set(listed).size !== listed.length) errors.push(`minor_abilities "${String(entry.id)}": a class is listed twice`);
  }
  return errors;
}

/** A class's guaranteed spell must exist, and must fit inside the number of spells it starts with (Spec 04). */
function checkClassSpells(bundle: ContentBundle): string[] {
  const known = new Set(entriesOf(bundle, 'spells').map((e) => String(e.id)));
  const errors: string[] = [];
  for (const entry of entriesOf(bundle, 'classes')) {
    const spells = entry.spells as { count: number; always?: string } | undefined;
    if (spells?.always !== undefined && !known.has(spells.always)) {
      errors.push(`classes "${String(entry.id)}": spells.always "${spells.always}" is not a spell`);
    }
    if (spells && spells.count > known.size) errors.push(`classes "${String(entry.id)}": starts with ${spells.count} spells but only ${known.size} exist`);
  }
  return errors;
}

/**
 * Items hold together (Spec 05): a magic weapon sits on a melee base, magic armour on an armour base (or a
 * shield for `off`), starting gear names real things, and every disguised kind has a name for each item.
 */
function checkItems(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const bases = new Map(entriesOf(bundle, 'equipment_bases').map((e) => [String(e.id), String(e.type)]));
  const magic = entriesOf(bundle, 'magic_items');
  for (const item of magic) {
    const where = `magic_items "${String(item.id)}"`;
    const base = item.base === undefined ? undefined : bases.get(String(item.base));
    if (base === undefined) continue;
    if (item.kind === 'weapon' && base !== 'melee') errors.push(`${where}: a magic weapon needs a melee base, not ${base}`);
    if (item.kind === 'armour' && base !== (item.off ? 'shield' : 'armour')) errors.push(`${where}: magic armour needs ${item.off ? 'a shield' : 'an armour'} base, not ${base}`);
    if (item.kind !== 'armour' && item.off) errors.push(`${where}: only magic armour can be \`off\``);
  }
  const known = new Set([...bases.keys(), ...magic.map((m) => String(m.id))]);
  for (const cls of entriesOf(bundle, 'classes')) {
    for (const g of (cls.gear ?? []) as { id: string }[]) {
      if (!known.has(g.id)) errors.push(`classes "${String(cls.id)}": gear "${g.id}" is not an equipment base or magic item`);
    }
  }
  if (bundle.tables.disguise_names) {
    for (const kind of DISGUISED_KINDS) {
      const items = magic.filter((m) => m.kind === kind).length;
      const names = entriesOf(bundle, 'disguise_names').filter((d) => d.kind === kind).length;
      if (names < items) errors.push(`disguise_names: ${names} ${kind} names for ${items} ${kind} magic items; each item needs its own`);
    }
  }
  return errors;
}

/** Layout variants of a theme (Spec 02, task 2.3) only mean something on the layout that reads them. */
function checkThemeVariants(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  for (const entry of entriesOf(bundle, THEME_TABLE)) {
    const where = `${THEME_TABLE} "${String(entry.id)}"`;
    const layout = String(entry.layout);
    if (entry.stamp !== undefined && layout !== 'cellular_caves') errors.push(`${where}: stamp needs the cellular_caves layout, not ${layout}`);
    if (entry.pillared !== undefined && layout !== 'rooms_and_corridors') errors.push(`${where}: pillared needs the rooms_and_corridors layout, not ${layout}`);
    const holdsLiquid = layout === 'cellular_caves' || layout === 'channel_grid';
    if (entry.liquid !== undefined && !holdsLiquid) errors.push(`${where}: liquid needs the cellular_caves or channel_grid layout, not ${layout}`);
    if (entry.liquid !== undefined && layout === 'cellular_caves' && entry.stamp === 'shafts') errors.push(`${where}: shafts hold no liquid`);
  }
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
