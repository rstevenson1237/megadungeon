// The shared table roller (Spec 08, "Table format and rolling"): filter by depth, theme and tags,
// multiply weights by theme multipliers, pick one entry with a seeded generator, and follow
// nested `roll:` entries into other tables.

import type { Rng } from './rng.ts';

/** The shared fields every table entry has, plus the optional nested roll. */
export interface Rollable {
  id: string;
  weight?: number | undefined;
  depth?: readonly [number, number] | undefined;
  themes?: Readonly<Record<string, number>> | undefined;
  tags?: readonly string[] | undefined;
  /** Name of another table to roll when this entry is picked. */
  roll?: string | undefined;
}

export interface RollFilter {
  depth?: number | undefined;
  theme?: string | undefined;
  /** An entry matches only if it carries every one of these tags. */
  tags?: readonly string[] | undefined;
}

/** Looks a table up by name; undefined when there is no such table. */
export type TableLookup = (name: string) => readonly Rollable[] | undefined;

export const DEFAULT_WEIGHT = 10;

/** Themes favour an entry: a listed theme multiplies the weight, any other theme is x1. */
export function themeMultiplier(entry: Rollable, theme: string | undefined): number {
  if (theme === undefined || !entry.themes || !Object.hasOwn(entry.themes, theme)) return 1;
  return entry.themes[theme]!;
}

export function weightOf(entry: Rollable, theme?: string): number {
  return (entry.weight ?? DEFAULT_WEIGHT) * themeMultiplier(entry, theme);
}

/** Depth and tag filter. A filter with no depth skips the depth check. */
export function matchesFilter(entry: Rollable, filter: RollFilter): boolean {
  if (filter.depth !== undefined && entry.depth) {
    if (filter.depth < entry.depth[0] || filter.depth > entry.depth[1]) return false;
  }
  if (filter.tags && filter.tags.length > 0) {
    const have = entry.tags ?? [];
    if (!filter.tags.every((t) => have.includes(t))) return false;
  }
  return true;
}

/** The entries that pass the filter, in table order. */
export function eligibleEntries<T extends Rollable>(entries: readonly T[], filter: RollFilter): T[] {
  return entries.filter((e) => matchesFilter(e, filter));
}

/** One weighted pick from already-filtered entries; undefined when there are none. */
export function pickWeighted<T extends Rollable>(
  entries: readonly T[],
  rng: Rng,
  theme?: string,
): T | undefined {
  if (entries.length === 0) return undefined;
  const weights = entries.map((e) => weightOf(e, theme));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng.float() * total;
  for (let i = 0; i < entries.length; i++) {
    x -= weights[i]!;
    if (x < 0) return entries[i]!;
  }
  return entries[entries.length - 1]!;
}

/**
 * Entries of `name` the roller may pick: they pass the filter, and any nested roll leads to a
 * table that has an eligible entry of its own. Nested tables get the caller's depth and theme
 * but not its tags.
 */
function candidates(
  lookup: TableLookup,
  name: string,
  filter: RollFilter,
  trail: readonly string[],
): Rollable[] {
  if (trail.includes(name)) throw new RangeError(`roll cycle: ${[...trail, name].join(' -> ')}`);
  const table = lookup(name);
  if (!table) throw new RangeError(`unknown table "${name}"`);
  const nested: RollFilter = { depth: filter.depth, theme: filter.theme };
  return eligibleEntries(table, filter).filter(
    (e) => !e.roll || candidates(lookup, e.roll, nested, [...trail, name]).length > 0,
  );
}

/**
 * Roll table `name`: filter, weight, pick, and follow nested rolls until an entry with no `roll`
 * is reached. Returns that final entry, or undefined when nothing is eligible.
 * The same seed and the same tables always give the same entry.
 */
export function rollTable(
  lookup: TableLookup,
  name: string,
  rng: Rng,
  filter: RollFilter = {},
): Rollable | undefined {
  const nested: RollFilter = { depth: filter.depth, theme: filter.theme };
  let current = name;
  let currentFilter = filter;
  const trail: string[] = [];
  for (;;) {
    const pool = candidates(lookup, current, currentFilter, trail);
    const picked = pickWeighted(pool, rng, filter.theme);
    if (!picked || !picked.roll) return picked;
    trail.push(current);
    current = picked.roll;
    currentFilter = nested;
  }
}
