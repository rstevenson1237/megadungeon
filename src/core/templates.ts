// Text templates (Spec 08, "Text templates"): placeholders in braces, grammar helpers, and
// choosing a template only when the run layout holds a matching fact.

import { eligibleEntries, pickWeighted, type RollFilter, type Rollable } from './roller.ts';
import type { Rng } from './rng.ts';

export const PLACEHOLDERS = [
  'level',
  'village',
  'monster',
  'boss',
  'artifact',
  'rival',
  'item',
  'god',
  'direction',
] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];
export type PlaceholderValues = Partial<Record<Placeholder, string | number>>;

const isPlaceholder = (s: string): s is Placeholder => (PLACEHOLDERS as readonly string[]).includes(s);

export interface ParsedToken {
  name: Placeholder;
  /** `{a:monster}`: prefix "a" or "an". */
  article: boolean;
  /** `{Monster}`: capitalise the first letter. */
  capital: boolean;
  /** `{monsters}`: pluralise. */
  plural: boolean;
}

/** Read the inside of one `{...}`; undefined when it is not a known placeholder form. */
export function parseToken(raw: string): ParsedToken | undefined {
  let s = raw;
  const article = s.startsWith('a:');
  if (article) s = s.slice(2);
  const capital = /^[A-Z]/.test(s);
  if (capital) s = s[0]!.toLowerCase() + s.slice(1);
  if (isPlaceholder(s)) return { name: s, article, capital, plural: false };
  if (article) return undefined; // "a monsters" makes no sense
  for (const suffix of ['es', 's']) {
    if (!s.endsWith(suffix)) continue;
    const base = s.slice(0, -suffix.length);
    if (isPlaceholder(base)) return { name: base, article: false, capital, plural: true };
  }
  return undefined;
}

const TOKEN = /\{([^{}]*)\}/g;

/** The tokens of a template, in order. Unknown ones have `parsed` undefined. */
export function tokensOf(text: string): { raw: string; parsed: ParsedToken | undefined }[] {
  return [...text.matchAll(TOKEN)].map((m) => ({ raw: m[1]!, parsed: parseToken(m[1]!) }));
}

/** Build-time text check: unknown placeholders and stray braces. Empty when the text is fine. */
export function templateErrors(text: string): string[] {
  const errors: string[] = [];
  for (const t of tokensOf(text)) {
    if (!t.parsed) errors.push(`unknown placeholder "{${t.raw}}"`);
  }
  if (/[{}]/.test(text.replace(TOKEN, ''))) errors.push('unbalanced brace');
  return errors;
}

/** The placeholders a template needs values for. */
export function placeholdersOf(text: string): Placeholder[] {
  const names = new Set<Placeholder>();
  for (const t of tokensOf(text)) if (t.parsed) names.add(t.parsed.name);
  return [...names];
}

const IRREGULAR_PLURALS: Record<string, string> = {
  man: 'men',
  woman: 'women',
  child: 'children',
  mouse: 'mice',
  louse: 'lice',
  goose: 'geese',
  ox: 'oxen',
};

/** Pluralise the last word of a name using plain English rules and a few irregular words. */
export function pluralise(name: string): string {
  const i = name.lastIndexOf(' ') + 1;
  const head = name.slice(0, i);
  const word = name.slice(i);
  const lower = word.toLowerCase();
  const irregular = IRREGULAR_PLURALS[lower];
  if (irregular) return head + (word === upperFirst(word) ? upperFirst(irregular) : irregular);
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${head}${word}es`;
  if (/[^aeiou]y$/.test(lower)) return `${head}${word.slice(0, -1)}ies`;
  if (/(lf|fe)$/.test(lower)) return `${head}${word.replace(/fe?$/, '')}ves`;
  return `${head}${word}s`;
}

/** "a" or "an" for the word that follows, by its first sound as far as spelling shows it. */
export function articleFor(word: string): 'a' | 'an' {
  const w = word.trim().toLowerCase();
  if (/^(hour|honest|heir)/.test(w)) return 'an';
  if (/^(uni|use|usu|eu|one|once)/.test(w)) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}

const upperFirst = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

/** Placeholders in `text` that `values` has no value for. */
export function missingPlaceholders(text: string, values: PlaceholderValues): Placeholder[] {
  return placeholdersOf(text).filter((p) => values[p] === undefined);
}

/**
 * Fill every placeholder from `values`. Throws on an unknown placeholder or a missing value:
 * a placeholder is never filled with an invented value. Article and plural helpers need a
 * text value, not a number.
 */
export function fillTemplate(text: string, values: PlaceholderValues): string {
  return text.replace(TOKEN, (_all, raw: string) => {
    const t = parseToken(raw);
    if (!t) throw new Error(`unknown placeholder "{${raw}}"`);
    const value = values[t.name];
    if (value === undefined) throw new Error(`no value for placeholder "{${raw}}"`);
    let out = String(value);
    if (t.article || t.plural) {
      if (typeof value !== 'string') throw new Error(`"{${raw}}" needs a text value, got a number`);
      if (t.plural) out = pluralise(out);
      if (t.article) out = `${articleFor(out)} ${out}`;
    }
    return t.capital ? upperFirst(out) : out;
  });
}

/** A true statement from the run layout, e.g. { kind: 'vault', values: { level: 14 } }. */
export interface Fact {
  kind: string;
  values: PlaceholderValues;
}

/** A template table entry: shared fields, the fact kind it needs, and its phrasings. */
export interface TemplateEntry extends Rollable {
  needs?: string | undefined;
  text: readonly string[];
}

export interface TemplateChoice {
  template: TemplateEntry;
  /** The fact the text was filled from; undefined for a template that needs none. */
  fact: Fact | undefined;
  phrasing: number;
  /** Add this to the run's seen list so the phrasing is not repeated. */
  key: string;
  text: string;
}

export interface ChooseOptions {
  filter?: RollFilter;
  /** Keys of phrasings the player has already seen this run. */
  seen?: Iterable<string>;
}

/**
 * Pick one filled template, or undefined when no template has a matching fact.
 * A template is a candidate only if the layout holds a fact of the kind it needs, and a
 * phrasing is usable only if that fact supplies a value for every placeholder in it.
 * Unseen phrasings are preferred; once all are seen, a repeat is allowed.
 */
export function chooseTemplate(
  templates: readonly TemplateEntry[],
  facts: readonly Fact[],
  rng: Rng,
  options: ChooseOptions = {},
): TemplateChoice | undefined {
  const filter = options.filter ?? {};
  const seen = new Set(options.seen ?? []);

  interface Option {
    fact: Fact | undefined;
    phrasing: number;
  }
  const usable = new Map<TemplateEntry, Option[]>();
  for (const template of eligibleEntries(templates, filter)) {
    const found: Option[] = [];
    // A template that needs no fact can only use phrasings with no placeholders.
    const matching: (Fact | undefined)[] =
      template.needs === undefined ? [undefined] : facts.filter((f) => f.kind === template.needs);
    for (const fact of matching) {
      template.text.forEach((text, phrasing) => {
        if (missingPlaceholders(text, fact?.values ?? {}).length === 0) found.push({ fact, phrasing });
      });
    }
    if (found.length > 0) usable.set(template, found);
  }

  const template = pickWeighted([...usable.keys()], rng, filter.theme);
  if (!template) return undefined;
  const all = usable.get(template)!;
  const fresh = all.filter((o) => !seen.has(`${template.id}#${o.phrasing}`));
  const pool = fresh.length > 0 ? fresh : all;
  const chosen = pool[rng.int(0, pool.length - 1)]!;
  return {
    template,
    fact: chosen.fact,
    phrasing: chosen.phrasing,
    key: `${template.id}#${chosen.phrasing}`,
    text: fillTemplate(template.text[chosen.phrasing]!, chosen.fact?.values ?? {}),
  };
}
