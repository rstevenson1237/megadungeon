import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { QUEST_TYPES } from '../src/core/catalog.ts';
import { createRng } from '../src/core/rng.ts';
import { chooseTemplate, type TemplateEntry } from '../src/core/templates.ts';
import { runOptionsFor, layoutContentOf } from '../src/game/world.ts';
import { Run, SURFACE } from '../src/game/run.ts';
import { LEVEL_SIZES } from '../src/rules/world/level.ts';
import { treasureBudget } from '../src/rules/world/depth.ts';
import {
  BOSS_ONE_IN,
  LINK_COUNTS,
  QUESTS_PER_VILLAGE,
  VILLAGE_BANDS,
  factsServedBy,
  generateRunLayout,
  isVillageLevel,
  layoutFacts,
  levelsServedBy,
  teleporterPartner,
  type Link,
  type RunLayout,
} from '../src/rules/world/run-layout.ts';
import { buildContent } from '../tools/content-build.ts';
import { testPlayer } from './helpers.ts';

const { bundle, errors } = buildContent(resolve(import.meta.dirname, '..', 'content'));
const content = layoutContentOf(bundle);
vi.setConfig({ testTimeout: 60_000 });
const SEEDS = 10_000;
const layouts: RunLayout[] = [];
for (let seed = 1; seed <= SEEDS; seed++) layouts.push(generateRunLayout(seed, content));

const link = <T extends Link['type']>(l: RunLayout, type: T): Extract<Link, { type: T }>[] =>
  l.links.filter((x): x is Extract<Link, { type: T }> => x.type === type);
const ascending = (levels: number[], min: number, max: number): boolean =>
  levels.every((l, i) => i === 0 || (l - levels[i - 1]! >= min && l - levels[i - 1]! <= max));

describe('run layout over 10,000 seeds (Spec 02, Run layout)', () => {
  it('uses valid content', () => expect(errors).toEqual([]));

  it('has exactly one village per band, none on level 100, each with a distinct name', () => {
    for (const l of layouts) {
      expect(l.villages).toHaveLength(5);
      l.villages.forEach((v, i) => {
        const [lo, hi] = VILLAGE_BANDS[i]!;
        expect(v.level).toBeGreaterThanOrEqual(lo);
        expect(v.level).toBeLessThanOrEqual(hi);
      });
      expect(new Set(l.villages.map((v) => v.nameId)).size).toBe(5);
    }
  });

  it('places villages uniformly within their bands', () => {
    const counts = new Map<number, number>();
    for (const l of layouts) counts.set(l.villages[0]!.level, (counts.get(l.villages[0]!.level) ?? 0) + 1);
    expect(counts.size).toBe(20);
    for (const n of counts.values()) expect(n / SEEDS).toBeGreaterThan(0.03); // 1/20 = 0.05
  });

  it('joins teleporters in reflective pairs on distinct open levels', () => {
    let levels = 0;
    for (const l of layouts) {
      const seen = new Set<number>();
      for (const [a, b] of l.teleporters) {
        expect(a).toBeLessThan(b);
        for (const x of [a, b]) {
          expect(x).toBeGreaterThanOrEqual(1);
          expect(x).toBeLessThanOrEqual(99);
          expect(isVillageLevel(l, x)).toBe(false);
          expect(seen.has(x)).toBe(false);
          seen.add(x);
        }
        expect(teleporterPartner(l, a)).toBe(b);
        expect(teleporterPartner(l, b)).toBe(a);
      }
      levels += seen.size;
      expect(seen.size % 2).toBe(0);
    }
    // 10% of about 94 open levels is 9.4, less the odd one out half the time: about 9 levels, 4.5 pairs
    expect(levels / SEEDS).toBeGreaterThan(8.7);
    expect(levels / SEEDS).toBeLessThan(9.5);
  });

  it('gives bosses distinct artifacts and puts none on villages or level 100', () => {
    let bosses = 0;
    for (const l of layouts) {
      const ids = l.bosses.map((b) => b.artifactId).filter((x): x is string => x !== null);
      expect(new Set(ids).size).toBe(ids.length); // no artifact twice
      for (const b of l.bosses) {
        expect(b.level).toBeGreaterThanOrEqual(1);
        expect(b.level).toBeLessThanOrEqual(99);
        expect(isVillageLevel(l, b.level)).toBe(false);
        expect(b.artifactId === null).toBe(b.artifactName === null);
      }
      // the stub table has 20 artifacts; a boss goes without only once they are all drawn
      if (l.bosses.length <= 20) expect(ids).toHaveLength(l.bosses.length);
      bosses += l.bosses.length;
    }
    expect(bosses / SEEDS).toBeGreaterThan(94 / BOSS_ONE_IN - 0.2);
    expect(bosses / SEEDS).toBeLessThan(94 / BOSS_ONE_IN + 0.2);
  });

  it('gives every level but villages an unlocked theme, level 100 the Abyssal Throne', () => {
    const rows = new Map(content.themes.map((t) => [t.id, t]));
    const problems: string[] = [];
    for (const l of layouts) {
      if (l.themes.length !== 101 || l.themes[0] !== null) problems.push(`seed ${l.seed}: bad shape`);
      for (let level = 1; level <= 100; level++) {
        const id = l.themes[level];
        const t = id === null || id === undefined ? undefined : rows.get(id);
        if (isVillageLevel(l, level)) {
          if (id !== null) problems.push(`seed ${l.seed}: village level ${level} has a theme`);
        } else if (!t || level < t.depth![0] || level > t.depth![1]) {
          problems.push(`seed ${l.seed}: level ${level} has theme ${String(id)}`);
        }
      }
      if (l.themes[100] !== 'abyssal_throne') problems.push(`seed ${l.seed}: level 100`);
    }
    expect(problems).toEqual([]);
  });

  it('weights themes 3 : 2 : 1 for the newest, previous and older unlocks', () => {
    const count = (level: number, id: string): [number, number] => {
      let hit = 0;
      let total = 0;
      for (const l of layouts) {
        if (l.themes[level] === null) continue;
        total++;
        if (l.themes[level] === id) hit++;
      }
      return [hit, total];
    };
    const share = (level: number, id: string): number => count(level, id)[0] / count(level, id)[1];
    // level 10: four themes of equal weight
    expect(share(10, 'old_mine')).toBeCloseTo(1 / 4, 1);
    // level 30: two new themes weigh 3, four old ones weigh 2: 14 in all
    expect(share(30, 'ruined_temple')).toBeCloseTo(3 / 14, 1);
    expect(share(30, 'goblin_warrens')).toBeCloseTo(2 / 14, 1);
    // level 70: unlocks 60 (3), 40 (2), then 20 and 1 (1 each); 6 + 4 + 6 = 16
    expect(share(70, 'wizards_sanctum')).toBeCloseTo(3 / 16, 1);
    expect(share(70, 'dwarven_hold')).toBeCloseTo(2 / 16, 1);
    expect(share(70, 'ruined_temple')).toBeCloseTo(1 / 16, 1);
    expect(share(70, 'cellars_and_crypts')).toBeCloseTo(1 / 16, 1);
    // nothing unlocks early
    expect(count(19, 'ruined_temple')[0]).toBe(0);
    expect(count(79, 'lava_forges')[0]).toBe(0);
  });

  it('pre-rolls 6 quests per village with goals between it and the next deeper village', () => {
    let rooms = 0;
    const problems: string[] = [];
    for (const l of layouts) {
      const boards = [0, ...l.villages.map((v) => v.level)];
      for (const village of boards) {
        const [lo, hi] = levelsServedBy(l, village);
        const list = l.quests.filter((q) => q.village === village);
        if (list.length !== (lo <= hi ? QUESTS_PER_VILLAGE : 0)) problems.push(`seed ${l.seed}: village ${village} has ${list.length} quests`);
        if (lo <= hi) rooms++;
        for (const q of list) {
          if (q.level < lo || q.level > hi || isVillageLevel(l, q.level)) problems.push(`seed ${l.seed}: ${q.id} level ${q.level}`);
          if (!QUEST_TYPES.includes(q.type)) problems.push(`seed ${l.seed}: ${q.id} type ${q.type}`);
          if (q.reward !== Math.round(treasureBudget(q.level) / 2)) problems.push(`seed ${l.seed}: ${q.id} reward`);
        }
      }
      if (new Set(l.quests.map((q) => q.id)).size !== l.quests.length) problems.push(`seed ${l.seed}: duplicate quest ids`);
    }
    expect(problems).toEqual([]);
    expect(rooms).toBeGreaterThan(SEEDS * 5.9); // adjacent villages with no level between are rare
  });

  it('lets the deepest village hold goals down to level 100', () => {
    const deepest = layouts.flatMap((l) => l.quests.filter((q) => q.village === l.villages[4]!.level));
    expect(Math.max(...deepest.map((q) => q.level))).toBe(100);
  });

  it('places every cross-level link as agreed, on open levels, in order', () => {
    for (const l of layouts) {
      const open = (x: number): boolean => x >= 1 && x <= 99 && !isVillageLevel(l, x);
      const all = (levels: number[]): boolean => levels.every(open);
      const vaults = link(l, 'vault');
      expect(vaults).toHaveLength(LINK_COUNTS.vault);
      for (const v of vaults) {
        expect(all([v.keyLevel, v.vaultLevel])).toBe(true);
        expect(ascending([v.keyLevel, v.vaultLevel], 2, 5)).toBe(true);
      }
      const maps = link(l, 'map_fragment');
      expect(maps).toHaveLength(LINK_COUNTS.map_fragment);
      for (const m of maps) expect(ascending([m.level, m.mappedLevel], 1, 10) && all([m.level, m.mappedLevel])).toBe(true);

      const chains = link(l, 'lore_chain');
      expect(chains).toHaveLength(LINK_COUNTS.lore_chain);
      for (const c of chains) {
        expect(c.levels.length).toBeGreaterThanOrEqual(4);
        expect(c.levels.length).toBeLessThanOrEqual(6);
        expect(ascending(c.levels, 1, 10) && all(c.levels)).toBe(true);
        const last = c.levels[c.levels.length - 1]!;
        if (c.end.kind === 'cache') {
          expect(ascending([last, c.end.level], 1, 10) && open(c.end.level)).toBe(true);
        } else {
          expect(l.bosses.some((b) => b.level === c.end.level)).toBe(true);
          expect(c.end.level).toBeGreaterThan(last);
        }
      }
      const runes = link(l, 'rune_word');
      expect(runes).toHaveLength(LINK_COUNTS.rune_word);
      for (const r of runes) {
        expect(r.levels.length).toBeGreaterThanOrEqual(4);
        expect(r.levels.length).toBeLessThanOrEqual(6);
        const all2 = [...r.levels, r.altarLevel];
        expect(ascending(all2, 1, 10) && all(all2)).toBe(true);
      }
      expect(link(l, 'specialist').map((s) => s.service)).toEqual(['smith', 'appraiser', 'trader']);
      for (const s of link(l, 'specialist')) expect(open(s.level)).toBe(true);

      const rivals = link(l, 'rival');
      expect(rivals).toHaveLength(1);
      expect(rivals[0]!.levels.length).toBeGreaterThanOrEqual(4);
      expect(rivals[0]!.levels.length).toBeLessThanOrEqual(6);
      const rv = [...rivals[0]!.levels, rivals[0]!.stashLevel];
      expect(ascending(rv, 1, 10) && all(rv)).toBe(true);

      const shrines = link(l, 'shrine_set');
      expect(shrines).toHaveLength(LINK_COUNTS.shrine_set);
      for (const s of shrines) expect(ascending(s.levels, 1, 10) && all(s.levels)).toBe(true);

      const tokens = link(l, 'lift_token');
      expect(tokens).toHaveLength(l.bosses.length > 0 ? 1 : 0);
      for (const t of tokens) expect(l.bosses.some((b) => b.level === t.level)).toBe(true);

      const passages = link(l, 'collapsed_passage');
      expect(passages).toHaveLength(LINK_COUNTS.collapsed_passage);
      for (const p of passages) {
        expect(ascending([p.level, p.landingLevel], 4, 6)).toBe(true);
        expect(all([p.level, p.landingLevel])).toBe(true);
      }
      expect(new Set(l.links.map((x) => x.id)).size).toBe(l.links.length);
    }
  });
});

describe('run layout determinism', () => {
  it('gives the same layout for the same seed, as plain serialisable data', () => {
    for (const seed of [0, 1, 99, 123456, 0xffffffff]) {
      const a = generateRunLayout(seed, content);
      expect(generateRunLayout(seed, content)).toEqual(a);
      expect(JSON.parse(JSON.stringify(a))).toEqual(a);
    }
  });

  it('gives different layouts for different seeds', () => {
    const keys = new Set(layouts.slice(0, 200).map((l) => JSON.stringify(l.villages.map((v) => v.level)) + JSON.stringify(l.teleporters)));
    expect(keys.size).toBeGreaterThan(190);
  });

  it('does not shift one element when another changes (separate streams)', () => {
    const fewer = { ...content, artifacts: content.artifacts.slice(0, 3), villageNames: content.villageNames.slice(0, 5) };
    for (let seed = 1; seed <= 200; seed++) {
      const a = layouts[seed - 1]!;
      const b = generateRunLayout(seed, fewer);
      expect(b.villages.map((v) => v.level)).toEqual(a.villages.map((v) => v.level));
      expect(b.teleporters).toEqual(a.teleporters);
      expect(b.bosses.map((x) => x.level)).toEqual(a.bosses.map((x) => x.level));
      expect(b.themes).toEqual(a.themes);
      expect(b.quests).toEqual(a.quests);
      expect(b.links).toEqual(a.links.map((x) => x)); // lore chains read boss levels only, which match
    }
  });

  it('leaves a boss without an artifact only when the table runs out', () => {
    const tiny = { ...content, artifacts: content.artifacts.slice(0, 1) };
    const l = generateRunLayout(1, tiny);
    const withBoss = [...Array(500).keys()].map((s) => generateRunLayout(s + 1, tiny)).find((x) => x.bosses.length >= 2)!;
    expect(l.bosses.filter((b) => b.artifactId).length).toBeLessThanOrEqual(1);
    expect(withBoss.bosses.filter((b) => b.artifactId === null).length).toBe(withBoss.bosses.length - 1);
  });

  it('throws if there is no theme for a level or no village name', () => {
    expect(() => generateRunLayout(1, { ...content, themes: [] })).toThrow(/no theme covers level/);
    expect(() => generateRunLayout(1, { ...content, villageNames: [] })).toThrow(/village name table is empty/);
  });
});

describe('layout facts and rumours', () => {
  it('serves each village the levels down to the next deeper village', () => {
    const l = layouts[0]!;
    const [v1, v2] = [l.villages[0]!.level, l.villages[1]!.level];
    expect(levelsServedBy(l, 0)).toEqual([1, v1 - 1]);
    expect(levelsServedBy(l, v1)).toEqual([v1 + 1, v2 - 1]);
    expect(levelsServedBy(l, l.villages[4]!.level)).toEqual([l.villages[4]!.level + 1, 100]);
  });

  it('states only what the layout holds', () => {
    for (const l of layouts.slice(0, 500)) {
      for (const f of layoutFacts(l)) {
        const level = f.values.level as number;
        if (f.kind === 'vault') expect(link(l, 'vault').some((v) => v.vaultLevel === level)).toBe(true);
        if (f.kind === 'rival_stash') expect(link(l, 'rival')[0]!.stashLevel).toBe(level);
        if (f.kind === 'teleporter') expect(teleporterPartner(l, level)).toBeDefined();
        if (f.kind === 'boss') {
          const boss = l.bosses.find((b) => b.level === level)!;
          expect(boss).toBeDefined();
          if (f.values.artifact) expect(f.values.artifact).toBe(boss.artifactName);
        }
      }
    }
  });

  it('gives a tavern facts only about its own levels, and every filled rumour is true', () => {
    const rumours = bundle.tables['rumours'] as TemplateEntry[];
    let filled = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const l = layouts[seed - 1]!;
      for (const village of [0, ...l.villages.map((v) => v.level)]) {
        const [lo, hi] = levelsServedBy(l, village);
        const facts = factsServedBy(l, village);
        for (const f of facts) {
          expect(f.values.level).toBeGreaterThanOrEqual(lo);
          expect(f.values.level).toBeLessThanOrEqual(hi);
        }
        const c = chooseTemplate(rumours, facts, createRng(seed * 7 + village));
        if (!c) continue;
        filled++;
        // an artifact name has digits in the stub content, so take it out before looking for the level
        const bare = c.fact?.values.artifact ? c.text.replace(String(c.fact.values.artifact), '') : c.text;
        const level = Number(bare.match(/\d+/)![0]);
        expect(bare.match(/\d+/g)).toEqual([String(level)]);
        // the level it names holds a fact of the kind the template needed
        expect(facts.some((f) => f.kind === c.template.needs && f.values.level === level)).toBe(true);
        if (c.template.needs === 'boss') {
          const boss = l.bosses.find((b) => b.level === level)!;
          expect(c.text).toContain(boss.artifactName!);
        }
      }
    }
    expect(filled).toBeGreaterThan(100);
  });
});

describe('run with a layout', () => {
  it('treats the layout villages as villages, named in the header', () => {
    const seed = 5;
    const options = runOptionsFor(bundle, seed);
    const village = options.layout!.villages[2]!;
    const run = new Run(seed, testPlayer(), { ...options, startDepth: village.level });
    expect(run.villages).toEqual([SURFACE, ...options.layout!.villages.map((v) => v.level)]);
    expect(run.inVillage).toBe(true);
    expect(run.game).toBeNull();
    expect(run.title).toBe(`${village.name}, Level ${village.level}`);
  });

  it('builds each level at the size its theme calls for', () => {
    const seed = 11;
    const options = runOptionsFor(bundle, seed);
    const sizes = new Map(content.themes.map((t) => [t.id, t.size]));
    let checked = 0;
    for (let depth = 1; depth <= 99 && checked < 12; depth += 7) {
      if (options.layout!.themes[depth] === null) continue;
      const run = new Run(seed, testPlayer(), { ...options, startDepth: depth });
      const size = LEVEL_SIZES[sizes.get(options.layout!.themes[depth]!)!];
      expect(run.game!.state.map.level.width).toBe(size.width);
      expect(run.game!.state.map.level.height).toBe(size.height);
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('can walk from the surface down to a village by stairs', () => {
    const options = runOptionsFor(bundle, 3);
    const first = options.layout!.villages[0]!.level;
    const run = new Run(3, testPlayer(), { ...options, levelFor: undefined });
    for (let i = 0; i < first; i++) run.travel('down');
    expect(run.depth).toBe(first);
    expect(run.inVillage).toBe(true);
  });
});
