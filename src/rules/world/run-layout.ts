// The run layout (Spec 02, "Run layout"): one pass over the run seed fixes where the villages,
// teleporters, bosses, themes, quests and cross-level links fall across all 100 levels.
// A plain, serialisable object. Each element draws from its own stream of the seed, so changing
// one never moves another. Where a figure is not in the spec text it comes from the approved
// clarifications beside the Run layout table.

import { QUEST_TYPES, type QuestType } from '../../core/catalog.ts';
import { createRng, hash32, type Rng } from '../../core/rng.ts';
import { pickWeighted, rollTable, type Rollable } from '../../core/roller.ts';
import type { Fact } from '../../core/templates.ts';
import { treasureBudget } from './depth.ts';
import { MAX_DEPTH, type SizeClass } from './level.ts';

/** Bump for any change that alters the layout a seed produces. */
export const LAYOUT_VERSION = 1;

/** One subterranean village per band, on a random level of the band (the last band stops at 99). */
export const VILLAGE_BANDS: readonly (readonly [number, number])[] = [
  [1, 20],
  [21, 40],
  [41, 60],
  [61, 80],
  [81, 99],
];

/** Each non-village level 1 to 99 holds a teleporter with chance 1 in 10, and a boss with 1 in 20. */
export const TELEPORTER_ONE_IN = 10;
export const BOSS_ONE_IN = 20;
export const QUESTS_PER_VILLAGE = 6;
/** The last level that can hold a village, teleporter, boss or link piece; level 100 is the set piece. */
export const LAST_PLAIN_LEVEL = MAX_DEPTH - 1;

/** Links per run (Spec 02, "Run layout", clarifications). */
export const LINK_COUNTS = {
  vault: 3,
  map_fragment: 4,
  lore_chain: 3,
  rune_word: 1,
  shrine_set: 2,
  collapsed_passage: 2,
} as const;
export const SPECIALIST_SERVICES = ['smith', 'appraiser', 'trader'] as const;
export type SpecialistService = (typeof SPECIALIST_SERVICES)[number];

export interface ThemeRow extends Rollable {
  name: string;
  size: SizeClass;
}
export interface NamedRow extends Rollable {
  name: string;
}

/** The content tables the layout reads. */
export interface LayoutContent {
  themes: readonly ThemeRow[];
  artifacts: readonly NamedRow[];
  villageNames: readonly NamedRow[];
}

export interface VillagePlacement {
  level: number;
  nameId: string;
  name: string;
}

export interface BossPlacement {
  level: number;
  /** The artifact it guards; null only if the artifact table ran out. */
  artifactId: string | null;
  artifactName: string | null;
}

export interface Quest {
  id: string;
  /** The village whose board lists it: 0 for the surface, else its level. */
  village: number;
  type: QuestType;
  /** The level where the goal is placed. */
  level: number;
  /** Gold paid into the bank on hand-in. */
  reward: number;
}

interface LinkBase {
  id: string;
}
export type Link =
  | (LinkBase & { type: 'vault'; keyLevel: number; vaultLevel: number })
  | (LinkBase & { type: 'map_fragment'; level: number; mappedLevel: number })
  | (LinkBase & {
      type: 'lore_chain';
      levels: number[];
      end: { kind: 'cache' | 'boss_weakness'; level: number };
    })
  | (LinkBase & { type: 'rune_word'; levels: number[]; altarLevel: number })
  | (LinkBase & { type: 'specialist'; service: SpecialistService; level: number })
  | (LinkBase & { type: 'rival'; levels: number[]; stashLevel: number })
  | (LinkBase & { type: 'shrine_set'; levels: [number, number, number] })
  | (LinkBase & { type: 'lift_token'; level: number })
  | (LinkBase & { type: 'collapsed_passage'; level: number; landingLevel: number });

export interface RunLayout {
  version: number;
  seed: number;
  /** The five subterranean villages, shallowest first. The surface is level 0 and is not listed. */
  villages: VillagePlacement[];
  /** Reflective pairs of levels, each with the shallower level first. */
  teleporters: [number, number][];
  /** Bosses on levels 1 to 99. Level 100 always holds the final boss. */
  bosses: BossPlacement[];
  /** Theme id by level (index 0 is the surface); null on village levels. */
  themes: (string | null)[];
  quests: Quest[];
  links: Link[];
}

const stream = (seed: number, element: string): Rng => createRng(hash32('run-layout', seed >>> 0, element));

/** Draw one entry the roller likes, preferring unused ones; repeats only when `allowRepeat`. */
function drawUnused(
  entries: readonly NamedRow[],
  used: ReadonlySet<string>,
  rng: Rng,
  depth: number,
  allowRepeat: boolean,
): NamedRow | undefined {
  const unused = entries.filter((e) => !used.has(e.id));
  const byDepth = rollTable((n) => (n === 't' ? unused : undefined), 't', rng, { depth });
  if (byDepth) return byDepth as NamedRow;
  return pickWeighted(unused, rng) ?? (allowRepeat ? pickWeighted(entries, rng) : undefined);
}

/**
 * Candidate themes for a level with their draw weights: every theme whose range covers the level,
 * 3 for the newest unlock group, 2 for the previous, 1 for older, times the theme's own weight.
 */
function themeWeights(themes: readonly ThemeRow[], level: number): ThemeRow[] {
  const open = themes.filter((t) => !t.depth || (level >= t.depth[0] && level <= t.depth[1]));
  const unlock = (t: ThemeRow): number => t.depth?.[0] ?? 1;
  const groups = [...new Set(open.map(unlock))].sort((a, b) => b - a);
  return open.map((t) => {
    const rank = groups.indexOf(unlock(t));
    const tier = rank === 0 ? 3 : rank === 1 ? 2 : 1;
    return { ...t, weight: (t.weight ?? 10) * tier };
  });
}

/** A random open level 1 to 99 chain: a first level, then each next one `min` to `max` deeper. */
function chain(rng: Rng, open: readonly number[], isOpen: (l: number) => boolean, count: number, min: number, max: number): number[] | undefined {
  for (let attempt = 0; attempt < 500; attempt++) {
    const levels = [rng.pick(open)];
    while (levels.length < count) {
      const from = levels[levels.length - 1]!;
      const options: number[] = [];
      for (let l = from + min; l <= from + max; l++) if (isOpen(l)) options.push(l);
      if (options.length === 0) break;
      levels.push(rng.pick(options));
    }
    if (levels.length === count) return levels;
  }
  return undefined;
}

export function generateRunLayout(seed: number, content: LayoutContent): RunLayout {
  // Villages: one random level in each band, each with its own seeded name.
  const villageRng = stream(seed, 'villages');
  const usedNames = new Set<string>();
  const villages: VillagePlacement[] = VILLAGE_BANDS.map(([lo, hi]) => {
    const level = villageRng.int(lo, hi);
    const row = drawUnused(content.villageNames, usedNames, villageRng, level, true);
    if (!row) throw new Error('run layout: the village name table is empty');
    usedNames.add(row.id);
    return { level, nameId: row.id, name: row.name };
  });
  const villageLevels = new Set(villages.map((v) => v.level));
  const isOpen = (l: number): boolean => l >= 1 && l <= LAST_PLAIN_LEVEL && !villageLevels.has(l);
  const open: number[] = [];
  for (let l = 1; l <= LAST_PLAIN_LEVEL; l++) if (isOpen(l)) open.push(l);

  // Teleporters: 1 in 10 of the open levels, shuffled and paired; an odd one out gets none.
  const tpRng = stream(seed, 'teleporters');
  const chosen = tpRng.shuffle(open.filter(() => tpRng.oneIn(TELEPORTER_ONE_IN)));
  const teleporters: [number, number][] = [];
  for (let i = 0; i + 1 < chosen.length; i += 2) {
    const [a, b] = [chosen[i]!, chosen[i + 1]!];
    teleporters.push(a < b ? [a, b] : [b, a]);
  }
  teleporters.sort((p, q) => p[0] - q[0]);

  // Bosses: 1 in 20 of the open levels, each drawing an artifact no other boss holds.
  const bossRng = stream(seed, 'bosses');
  const artifactRng = stream(seed, 'artifacts');
  const usedArtifacts = new Set<string>();
  const bosses: BossPlacement[] = open
    .filter(() => bossRng.oneIn(BOSS_ONE_IN))
    .map((level) => {
      const row = drawUnused(content.artifacts, usedArtifacts, artifactRng, level, false);
      if (row) usedArtifacts.add(row.id);
      return { level, artifactId: row?.id ?? null, artifactName: row?.name ?? null };
    });

  // Themes: weighted by unlock group; none on villages; level 100 takes the theme that covers it.
  const themeRng = stream(seed, 'themes');
  const themes: (string | null)[] = [null];
  for (let level = 1; level <= MAX_DEPTH; level++) {
    if (villageLevels.has(level)) {
      themes.push(null);
      continue;
    }
    const pick = pickWeighted(themeWeights(content.themes, level), themeRng);
    if (!pick) throw new Error(`run layout: no theme covers level ${level}`);
    themes.push(pick.id);
  }

  // Quests: a list of 6 per village, with goals strictly between it and the next deeper village.
  const questRng = stream(seed, 'quests');
  const boards = [0, ...villages.map((v) => v.level)];
  const quests: Quest[] = [];
  boards.forEach((village, i) => {
    const lo = village + 1;
    const hi = (boards[i + 1] ?? MAX_DEPTH + 1) - 1;
    if (lo > hi) return;
    for (let n = 1; n <= QUESTS_PER_VILLAGE; n++) {
      const type = questRng.pick(QUEST_TYPES);
      const level = questRng.int(lo, hi);
      quests.push({
        id: `quest_${village}_${n}`,
        village,
        type,
        level,
        reward: Math.round(treasureBudget(level) / 2),
      });
    }
  });

  const links = layoutLinks(seed, open, isOpen, bosses);
  return { version: LAYOUT_VERSION, seed: seed >>> 0, villages, teleporters, bosses, themes, quests, links };
}

function layoutLinks(seed: number, open: number[], isOpen: (l: number) => boolean, bosses: BossPlacement[]): Link[] {
  const links: Link[] = [];
  const add = (link: Link | undefined): void => {
    if (link) links.push(link);
  };

  const vaultRng = stream(seed, 'link:vault');
  for (let i = 1; i <= LINK_COUNTS.vault; i++) {
    const levels = chain(vaultRng, open, isOpen, 2, 2, 5);
    add(levels && { id: `vault_${i}`, type: 'vault', keyLevel: levels[0]!, vaultLevel: levels[1]! });
  }

  const mapRng = stream(seed, 'link:map_fragment');
  for (let i = 1; i <= LINK_COUNTS.map_fragment; i++) {
    const levels = chain(mapRng, open, isOpen, 2, 1, 10);
    add(levels && { id: `map_fragment_${i}`, type: 'map_fragment', level: levels[0]!, mappedLevel: levels[1]! });
  }

  const loreRng = stream(seed, 'link:lore_chain');
  for (let i = 1; i <= LINK_COUNTS.lore_chain; i++) {
    const entries = loreRng.int(4, 6);
    // A boss's weakness only if a boss lies deeper than the last entry; otherwise a cache.
    const wantBoss = loreRng.oneIn(2);
    const levels = chain(loreRng, open, isOpen, entries + 1, 1, 10); // the last is the cache, if used
    if (!levels) continue;
    const entryLevels = levels.slice(0, entries);
    const deeper = bosses.filter((b) => b.level > entryLevels[entries - 1]!);
    const end =
      wantBoss && deeper.length > 0
        ? { kind: 'boss_weakness' as const, level: loreRng.pick(deeper).level }
        : { kind: 'cache' as const, level: levels[entries]! };
    add({ id: `lore_chain_${i}`, type: 'lore_chain', levels: entryLevels, end });
  }

  const runeRng = stream(seed, 'link:rune_word');
  for (let i = 1; i <= LINK_COUNTS.rune_word; i++) {
    const letters = runeRng.int(4, 6);
    const levels = chain(runeRng, open, isOpen, letters + 1, 1, 10);
    add(levels && { id: `rune_word_${i}`, type: 'rune_word', levels: levels.slice(0, letters), altarLevel: levels[letters]! });
  }

  const specRng = stream(seed, 'link:specialist');
  SPECIALIST_SERVICES.forEach((service, i) => {
    add({ id: `specialist_${i + 1}`, type: 'specialist', service, level: specRng.pick(open) });
  });

  const rivalRng = stream(seed, 'link:rival');
  const appearances = rivalRng.int(4, 6);
  const rivalLevels = chain(rivalRng, open, isOpen, appearances + 1, 1, 10);
  add(
    rivalLevels && {
      id: 'rival_1',
      type: 'rival',
      levels: rivalLevels.slice(0, appearances),
      stashLevel: rivalLevels[appearances]!,
    },
  );

  const shrineRng = stream(seed, 'link:shrine_set');
  for (let i = 1; i <= LINK_COUNTS.shrine_set; i++) {
    const levels = chain(shrineRng, open, isOpen, 3, 1, 10);
    add(levels && { id: `shrine_set_${i}`, type: 'shrine_set', levels: [levels[0]!, levels[1]!, levels[2]!] });
  }

  const tokenRng = stream(seed, 'link:lift_token');
  if (bosses.length > 0) add({ id: 'lift_token_1', type: 'lift_token', level: tokenRng.pick(bosses).level });

  const passageRng = stream(seed, 'link:collapsed_passage');
  for (let i = 1; i <= LINK_COUNTS.collapsed_passage; i++) {
    const levels = chain(passageRng, open, isOpen, 2, 4, 6);
    add(levels && { id: `collapsed_passage_${i}`, type: 'collapsed_passage', level: levels[0]!, landingLevel: levels[1]! });
  }
  return links;
}

/** Whether `level` is a subterranean village (the surface, level 0, is not listed in the layout). */
export const isVillageLevel = (layout: RunLayout, level: number): boolean =>
  layout.villages.some((v) => v.level === level);

/** The level a teleporter on `level` leads to, if it holds one. */
export function teleporterPartner(layout: RunLayout, level: number): number | undefined {
  for (const [a, b] of layout.teleporters) {
    if (a === level) return b;
    if (b === level) return a;
  }
  return undefined;
}

/**
 * The levels a village serves: its tavern's rumours and its quests are about the levels between
 * it and the next deeper village, or down to level 100 for the deepest (Spec 07, Tavern).
 */
export function levelsServedBy(layout: RunLayout, village: number): [number, number] {
  const next = layout.villages.map((v) => v.level).filter((l) => l > village).sort((a, b) => a - b)[0];
  return [village + 1, (next ?? MAX_DEPTH + 1) - 1];
}

/**
 * True statements the layout holds, for the template engine (Spec 08, "Text templates"): a vault,
 * a boss and the artifact it guards, a teleporter, a rival's stash. Later tasks add facts the layout
 * does not know, such as trap-heavy levels and what a fountain does.
 */
export function layoutFacts(layout: RunLayout): Fact[] {
  const facts: Fact[] = [];
  for (const link of layout.links) {
    if (link.type === 'vault') facts.push({ kind: 'vault', values: { level: link.vaultLevel } });
    if (link.type === 'rival') facts.push({ kind: 'rival_stash', values: { level: link.stashLevel } });
  }
  for (const boss of layout.bosses) {
    facts.push({ kind: 'boss', values: boss.artifactName ? { level: boss.level, artifact: boss.artifactName } : { level: boss.level } });
  }
  for (const [a, b] of layout.teleporters) {
    facts.push({ kind: 'teleporter', values: { level: a } }, { kind: 'teleporter', values: { level: b } });
  }
  return facts;
}

/** The facts a village's tavern may use: only those about the levels it serves. */
export function factsServedBy(layout: RunLayout, village: number): Fact[] {
  const [lo, hi] = levelsServedBy(layout, village);
  return layoutFacts(layout).filter((f) => {
    const level = f.values.level;
    return typeof level === 'number' && level >= lo && level <= hi;
  });
}
