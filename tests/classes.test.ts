import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContent } from '../tools/content-build.ts';
import { buildCoverage } from '../tools/coverage.ts';
import { createCharacter, totalDice, type ClassDef } from '../src/rules/character/character.ts';
import { classById, classesFrom } from '../src/rules/character/classes.ts';
import type { PoolName, Step } from '../src/rules/character/dice.ts';
import { bankTreasure, levelUp, levelsOwed, poolsWithRoom } from '../src/rules/character/progression.ts';

const built = buildContent(join(import.meta.dirname, '..', 'content'));
const classes = classesFrom(built.bundle);

// Spec 03, Classes table, typed in again here so the content is checked against the spec, not itself.
// name: [start C/S/M], [steps at 4/7/9], [level 10 C/S/M]
const SPEC: Record<string, [string, Step[], PoolName[], Step[]]> = {
  warrior: ['Cleave', [8, 6, 4], ['combat', 'combat', 'skill'], [12, 8, 4]],
  mage: ['Arcane Bolt', [4, 6, 8], ['magic', 'magic', 'skill'], [4, 8, 12]],
  thief: ['Backstab', [6, 8, 4], ['skill', 'skill', 'combat'], [8, 12, 4]],
  priest: ['Heal', [6, 6, 6], ['magic', 'combat', 'magic'], [8, 6, 10]],
  barbarian: ['Rage', [8, 6, 4], ['combat', 'skill', 'skill'], [10, 10, 4]],
  knight: ['Shield Wall', [8, 6, 4], ['combat', 'combat', 'magic'], [12, 6, 6]],
  paladin: ['Smite', [6, 6, 6], ['combat', 'magic', 'combat'], [10, 6, 8]],
  ranger: ['Volley', [6, 8, 4], ['skill', 'combat', 'magic'], [8, 10, 6]],
  monk: ['Flurry', [6, 6, 6], ['combat', 'skill', 'combat'], [10, 8, 6]],
  bard: ['Fascinate', [6, 6, 6], ['skill', 'magic', 'skill'], [6, 10, 8]],
  druid: ['Wild Shape', [6, 6, 6], ['magic', 'skill', 'magic'], [6, 8, 10]],
  necromancer: ['Raise', [4, 6, 8], ['magic', 'magic', 'skill'], [4, 8, 12]],
  sorcerer: ['Overchannel', [4, 6, 8], ['magic', 'magic', 'combat'], [6, 6, 12]],
  illusionist: ['Decoy', [4, 8, 6], ['skill', 'magic', 'magic'], [4, 10, 10]],
  warlock: ['Pact', [6, 4, 8], ['magic', 'magic', 'combat'], [8, 4, 12]],
  assassin: ['Mark', [6, 8, 4], ['skill', 'skill', 'combat'], [8, 12, 4]],
  alchemist: ['Brew', [4, 8, 6], ['skill', 'magic', 'skill'], [4, 12, 8]],
  shaman: ['Spirit Totem', [6, 4, 8], ['magic', 'skill', 'magic'], [6, 6, 12]],
  witch_hunter: ['Hex Breaker', [6, 8, 4], ['skill', 'combat', 'skill'], [8, 12, 4]],
  beastmaster: ['Companion', [6, 8, 4], ['skill', 'combat', 'magic'], [8, 10, 6]],
};

const POOLS: PoolName[] = ['combat', 'skill', 'magic'];
const stepsOf = (c: ReturnType<typeof createCharacter>) => POOLS.map((p) => c.pools[p].step);

/** Pad a pool to 12 with test entries where the content has fewer (the full pools arrive in task 4.4). */
const padded = (cls: ClassDef): ClassDef => ({
  ...cls,
  minorAbilities: [
    ...cls.minorAbilities,
    ...Array.from({ length: Math.max(0, 12 - cls.minorAbilities.length) }, (_, i) => ({ id: `${cls.id}_filler_${i + 1}` })),
  ],
});

describe('Spec 03: the 20 classes in the content tables', () => {
  it('builds without errors', () => {
    expect(built.errors).toEqual([]);
  });

  it('holds exactly the 20 classes of the spec, in the spec order', () => {
    expect(classes.map((c) => c.id)).toEqual(Object.keys(SPEC));
  });

  it.each(Object.entries(SPEC))('%s matches the class table', (id, [ability, start, steps]) => {
    const cls = classById(built.bundle, id);
    expect(cls.majorAbility.name).toBe(ability);
    expect(cls.majorAbility.text.length).toBeGreaterThan(0);
    expect(POOLS.map((p) => cls.start[p])).toEqual(start);
    expect([cls.steps[4], cls.steps[7], cls.steps[9]]).toEqual(steps);
  });

  it('uses only the two allowed starting arrays', () => {
    for (const cls of classes) {
      const sorted = POOLS.map((p) => cls.start[p]).sort((a, b) => a - b).join();
      expect(['6,6,6', '4,6,8']).toContain(sorted);
    }
  });

  it('meets its launch minimum of 20 classes and no coverage group is short in the classes table', () => {
    const report = buildCoverage(built.bundle);
    expect(report.tables.find((t) => t.table === 'classes')).toMatchObject({ count: 20, minimum: 20, ok: true });
  });

  it('refuses a class with a bad starting array, an unknown pool, or a minor ability for an unknown class', () => {
    const dirs: string[] = [];
    const build = (files: Record<string, string>) => {
      const dir = mkdtempSync(join(tmpdir(), 'classes-'));
      dirs.push(dir);
      for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
      return buildContent(dir).errors.join('\n');
    };
    const cls = (start: string, steps = '[combat, combat, skill]') =>
      `- id: x\n  name: X\n  start: ${start}\n  steps: ${steps}\n  ability: { id: y, name: Y, text: z }\n`;
    try {
      expect(build({ 'classes.yaml': cls('{ combat: 8, skill: 8, magic: 4 }') })).toMatch(/all d6, or one each/);
      expect(build({ 'classes.yaml': cls('{ combat: 8, skill: 6, magic: 4 }', '[combat, luck, skill]') })).toMatch(/steps/);
      expect(build({ 'classes.yaml': cls('{ combat: 8, skill: 6, magic: 4 }') })).toBe('');
      expect(
        build({
          'classes.yaml': cls('{ combat: 8, skill: 6, magic: 4 }'),
          'minor_abilities.yaml': '- id: m\n  name: M\n  text: t\n  classes: [x, ghost]\n',
        }),
      ).toMatch(/"ghost" is not a class/);
    } finally {
      for (const d of dirs) rmSync(d, { recursive: true, force: true });
    }
  });
});

describe('Spec 03: every class is created and played to level 10', () => {
  it.each(Object.entries(SPEC))('%s', (id, [, start, , level10]) => {
    const cls = padded(classById(built.bundle, id));
    const c = createCharacter(`Test ${id}`, cls);

    // Creation: level 1, one full die per pool at the starting steps.
    expect(c.level).toBe(1);
    expect(stepsOf(c)).toEqual(start);
    for (const p of POOLS) expect(c.pools[p]).toMatchObject({ dice: 1, max: 1 });

    // Bank enough for level 10 at once: nine level-ups, one per level, in order.
    bankTreasure(c, 512_000);
    expect(levelsOwed(c)).toBe(9);
    const levels: number[] = [];
    let i = 0;
    while (levelsOwed(c) > 0) {
      const room = poolsWithRoom(c);
      const want = POOLS[i++ % 3]!;
      const up = levelUp(2026, c, cls, room.includes(want) ? want : room[0]!);
      expect(up).not.toBeNull();
      levels.push(up!.level);
    }
    expect(levels).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(c.level).toBe(10);
    expect(totalDice(c)).toBe(12);
    expect(stepsOf(c)).toEqual(level10);
    for (const p of POOLS) {
      expect(c.pools[p].max).toBeLessThanOrEqual(6);
      expect(c.pools[p].dice).toBe(c.pools[p].max); // every die arrived full
    }
    expect(c.minorAbilities).toHaveLength(9);
    for (const drawn of c.minorAbilities) expect(cls.minorAbilities.some((a) => a.id === drawn)).toBe(true);
  });

  it('level by level, steps change only at levels 4, 7 and 9', () => {
    for (const [id, [, start, steps]] of Object.entries(SPEC)) {
      const cls = padded(classById(built.bundle, id));
      const c = createCharacter('Hero', cls);
      const expected = { combat: start[0]!, skill: start[1]!, magic: start[2]! } as Record<PoolName, number>;
      for (let level = 2; level <= 10; level++) {
        bankTreasure(c, 512_000);
        const up = levelUp(7, c, cls, poolsWithRoom(c)[0]!)!;
        const stepIndex = [4, 7, 9].indexOf(level);
        if (stepIndex >= 0) {
          expect(up.stepped, `${id} level ${level}`).toBe(steps[stepIndex]);
          expected[steps[stepIndex]!] = Math.min(12, expected[steps[stepIndex]!]! + 2);
        } else {
          expect(up.stepped).toBeUndefined();
        }
        expect(POOLS.map((p) => c.pools[p].step)).toEqual(POOLS.map((p) => expected[p]));
      }
    }
  });
});

describe('Spec 03: minor abilities from the content tables', () => {
  it('gives the four core classes the spec examples, with Pack Mule stackable', () => {
    const pool = (id: string) => classById(built.bundle, id).minorAbilities.map((a) => a.id);
    expect(pool('warrior')).toEqual(['hardy', 'weapon_master', 'pack_mule', 'second_wind']);
    expect(pool('mage')).toEqual(['focus', 'scholar', 'widen', 'mana_well']);
    expect(pool('thief')).toEqual(['keen_eye', 'light_step', 'fence', 'quick_hands']);
    expect(pool('priest')).toEqual(['blessed', 'sanctuary', 'tithe', 'purify']);
    expect(classById(built.bundle, 'warrior').minorAbilities.find((a) => a.id === 'pack_mule')?.stackable).toBe(true);
  });

  it('reports every class short of its 12 until task 4.4, and counts slots per class', () => {
    const report = buildCoverage(built.bundle).tables.find((t) => t.table === 'minor_abilities')!;
    expect(report).toMatchObject({ count: 16, minimum: 240, unit: 'slots', ok: false });
    expect(report.groups).toHaveLength(20);
    expect(report.groups.find((g) => g.label === 'class warrior')).toEqual({ label: 'class warrior', count: 4, minimum: 12 });
    expect(report.groups.find((g) => g.label === 'class bard')).toEqual({ label: 'class bard', count: 0, minimum: 12 });
  });
});
