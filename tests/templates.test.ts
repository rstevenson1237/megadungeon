import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import type { Rumour } from '../src/core/schemas.ts';
import {
  articleFor,
  chooseTemplate,
  fillTemplate,
  missingPlaceholders,
  parseToken,
  placeholdersOf,
  pluralise,
  templateErrors,
  type Fact,
  type TemplateEntry,
} from '../src/core/templates.ts';
import { buildContent } from '../tools/content-build.ts';

describe('placeholders and grammar helpers', () => {
  it('fills plain, capitalised, article and plural forms', () => {
    const v = { level: 14, monster: 'goblin archer', boss: 'the Hollow King' };
    expect(fillTemplate('Level {level}.', v)).toBe('Level 14.');
    expect(fillTemplate('{Monster} waits.', v)).toBe('Goblin archer waits.');
    expect(fillTemplate('You see {a:monster}.', v)).toBe('You see a goblin archer.');
    expect(fillTemplate('{Monsters} attack.', v)).toBe('Goblin archers attack.');
    expect(fillTemplate('{a:Monster}', v)).toBe('A goblin archer');
    expect(fillTemplate('{monsters}', { monster: 'wolf' })).toBe('wolves');
  });

  it('chooses a or an by the following word', () => {
    expect(articleFor('orc')).toBe('an');
    expect(articleFor('goblin')).toBe('a');
    expect(articleFor('ettin')).toBe('an');
    expect(articleFor('unicorn')).toBe('a');
    expect(articleFor('hour glass')).toBe('an');
    expect(fillTemplate('{a:monster}', { monster: 'owlbear' })).toBe('an owlbear');
  });

  it('pluralises the last word of a name', () => {
    expect(pluralise('goblin')).toBe('goblins');
    expect(pluralise('fox')).toBe('foxes');
    expect(pluralise('wolf')).toBe('wolves');
    expect(pluralise('harpy')).toBe('harpies');
    expect(pluralise('ray')).toBe('rays');
    expect(pluralise('giant rat')).toBe('giant rats');
    expect(pluralise('wasp swarm')).toBe('wasp swarms');
    expect(pluralise('dire mouse')).toBe('dire mice');
    expect(pluralise('ghoul')).toBe('ghouls');
    expect(pluralise('boss')).toBe('bosses');
  });

  it('reads placeholder forms', () => {
    expect(parseToken('boss')).toEqual({ name: 'boss', article: false, capital: false, plural: false });
    expect(parseToken('bosses')).toMatchObject({ name: 'boss', plural: true });
    expect(parseToken('villages')).toMatchObject({ name: 'village', plural: true });
    expect(parseToken('a:item')).toMatchObject({ name: 'item', article: true });
    expect(parseToken('Item')).toMatchObject({ name: 'item', capital: true });
    expect(parseToken('a:items')).toBeUndefined();
    expect(parseToken('wizard')).toBeUndefined();
    expect(parseToken('')).toBeUndefined();
  });

  it('lists the placeholders a text needs, once each', () => {
    expect(placeholdersOf('{Rival} stashed {a:item} on level {level}; {level} again, {monsters}.').sort()).toEqual([
      'item',
      'level',
      'monster',
      'rival',
    ]);
  });

  it('throws rather than invent a value', () => {
    expect(() => fillTemplate('{monster}', {})).toThrow(/no value/);
    expect(() => fillTemplate('{wizard}', { level: 1 })).toThrow(/unknown placeholder/);
    expect(() => fillTemplate('{monsters}', { monster: 4 })).toThrow(/text value/);
    expect(missingPlaceholders('{level} {monster}', { level: 3 })).toEqual(['monster']);
  });

  it('reports unknown placeholders and stray braces at build time', () => {
    expect(templateErrors('Level {level} has {Monsters}.')).toEqual([]);
    expect(templateErrors('Level {lvl}.')).toEqual(['unknown placeholder "{lvl}"']);
    expect(templateErrors('Level {level')).toEqual(['unbalanced brace']);
    expect(templateErrors('Level level}')).toEqual(['unbalanced brace']);
    expect(templateErrors('{a:levels}')).toEqual(['unknown placeholder "{a:levels}"']);
  });
});

const vault: TemplateEntry = {
  id: 'rumour_vault',
  needs: 'vault',
  text: ['A vault waits on level {level}.', 'A miner saw a vault door on level {level}.'],
};
const boss: TemplateEntry = { id: 'rumour_boss', needs: 'boss', text: ['{Boss} holds level {level}.'] };
const flavour: TemplateEntry = { id: 'rumour_flavour', text: ['The ale is weak.', 'Level {level} rings hollow.'] };

describe('choosing a template from the run layout', () => {
  it('chooses nothing when no fact matches', () => {
    const facts: Fact[] = [{ kind: 'fountain', values: { level: 3 } }];
    expect(chooseTemplate([vault, boss], facts, createRng(1))).toBeUndefined();
    expect(chooseTemplate([vault, boss], [], createRng(1))).toBeUndefined();
  });

  it('only picks a template whose needed fact exists', () => {
    const facts: Fact[] = [{ kind: 'boss', values: { level: 33, boss: 'the Hollow King' } }];
    for (let seed = 0; seed < 100; seed++) {
      const c = chooseTemplate([vault, boss], facts, createRng(seed))!;
      expect(c.template.id).toBe('rumour_boss');
      expect(c.text).toBe('The Hollow King holds level 33.');
    }
  });

  it('fills from the fact it matched, never from another', () => {
    const facts: Fact[] = [
      { kind: 'vault', values: { level: 14 } },
      { kind: 'vault', values: { level: 61 } },
    ];
    const levels = new Set<number>();
    for (let seed = 0; seed < 200; seed++) {
      const c = chooseTemplate([vault], facts, createRng(seed))!;
      const level = c.fact!.values.level as number;
      expect(c.text).toContain(`level ${level}.`);
      levels.add(level);
    }
    expect([...levels].sort()).toEqual([14, 61]);
  });

  it('skips a phrasing the fact cannot fill', () => {
    const t: TemplateEntry = { id: 't', needs: 'boss', text: ['{Boss} holds level {level}.', 'Beware {boss}.'] };
    const facts: Fact[] = [{ kind: 'boss', values: { level: 5 } }]; // no boss name
    expect(chooseTemplate([t], facts, createRng(1))).toBeUndefined();
    const named: Fact[] = [{ kind: 'boss', values: { boss: 'Ulm' } }]; // no level
    for (let seed = 0; seed < 50; seed++) expect(chooseTemplate([t], named, createRng(seed))!.text).toBe('Beware Ulm.');
  });

  it('lets a template with no needs run only on phrasings with no placeholders', () => {
    for (let seed = 0; seed < 50; seed++) {
      const c = chooseTemplate([flavour], [], createRng(seed))!;
      expect(c.text).toBe('The ale is weak.');
      expect(c.fact).toBeUndefined();
    }
  });

  it('avoids phrasings already seen, and repeats only when all are seen', () => {
    const facts: Fact[] = [{ kind: 'vault', values: { level: 14 } }];
    for (let seed = 0; seed < 50; seed++) {
      const c = chooseTemplate([vault], facts, createRng(seed), { seen: ['rumour_vault#0'] })!;
      expect(c.phrasing).toBe(1);
      expect(c.key).toBe('rumour_vault#1');
    }
    const all = chooseTemplate([vault], facts, createRng(1), { seen: ['rumour_vault#0', 'rumour_vault#1'] });
    expect(all).toBeDefined();
  });

  it('never repeats a phrasing until all are used when the caller records each key', () => {
    const facts: Fact[] = [{ kind: 'vault', values: { level: 14 } }];
    const rng = createRng(77);
    const seen: string[] = [];
    const got: string[] = [];
    for (let i = 0; i < 2; i++) {
      const c = chooseTemplate([vault], facts, rng, { seen })!;
      seen.push(c.key);
      got.push(c.key);
    }
    expect(new Set(got).size).toBe(2);
  });

  it('honours the depth filter and weights', () => {
    const deep: TemplateEntry = { id: 'deep', needs: 'vault', depth: [50, 60], text: ['Deep {level}.'] };
    const facts: Fact[] = [{ kind: 'vault', values: { level: 55 } }];
    for (let seed = 0; seed < 30; seed++) {
      expect(chooseTemplate([deep, vault], facts, createRng(seed), { filter: { depth: 5 } })!.template.id).toBe(
        'rumour_vault',
      );
    }
  });

  it('is deterministic for the same seed', () => {
    const facts: Fact[] = [
      { kind: 'vault', values: { level: 14 } },
      { kind: 'boss', values: { level: 33, boss: 'Ulm' } },
    ];
    const run = (seed: number): string[] => {
      const rng = createRng(seed);
      return Array.from({ length: 30 }, () => chooseTemplate([vault, boss], facts, rng)!.text);
    };
    expect(run(5)).toEqual(run(5));
  });
});

describe('stub rumours are true for the run', () => {
  const { bundle, errors } = buildContent(resolve(import.meta.dirname, '..', 'content'));
  const rumours = bundle.tables['rumours'] as Rumour[];

  it('loads', () => expect(errors).toEqual([]));

  it('every filled rumour names a level and name that come from a fact of its kind', () => {
    // A tiny run layout: one fact per rumour kind, each with its own distinct values.
    const facts: Fact[] = [
      { kind: 'vault', values: { level: 14 } },
      { kind: 'boss', values: { level: 33, boss: 'the Hollow King' } },
      { kind: 'teleporter', values: { level: 27 } },
      { kind: 'rival_stash', values: { level: 45, rival: 'Mara the Quick' } },
      { kind: 'trap_level', values: { level: 8 } },
      { kind: 'fountain', values: { level: 19 } },
    ];
    const kinds = new Set<string>();
    for (let seed = 0; seed < 500; seed++) {
      const c = chooseTemplate(rumours as TemplateEntry[], facts, createRng(seed))!;
      expect(c).toBeDefined();
      expect(c.fact!.kind).toBe(c.template.needs);
      kinds.add(c.fact!.kind);
      const level = String(c.fact!.values.level);
      expect(c.text.toLowerCase()).toContain(`level ${level}`);
      // no digits other than the fact's level can appear
      expect(c.text.match(/\d+/g) ?? []).toEqual([level]);
      if (c.fact!.values.boss) expect(c.text.toLowerCase()).toContain('the hollow king');
      if (c.fact!.values.rival) expect(c.text).toContain('Mara the Quick');
    }
    expect([...kinds].sort()).toEqual(['boss', 'fountain', 'rival_stash', 'teleporter', 'trap_level', 'vault']);
  });

  it('chooses no rumour of a kind the layout does not hold', () => {
    const facts: Fact[] = [{ kind: 'vault', values: { level: 14 } }];
    for (let seed = 0; seed < 100; seed++) {
      expect(chooseTemplate(rumours as TemplateEntry[], facts, createRng(seed))!.template.needs).toBe('vault');
    }
  });
});
