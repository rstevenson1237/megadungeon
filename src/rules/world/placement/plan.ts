// What a level has to hold beyond the usual draw (Spec 02, step 11): the content tables placement
// rolls from, and the plan the run layout makes for one level: its teleporter, boss, quest goals and
// cross-level link pieces. Anything a link's levels must agree on (a shrine set's god, a rune word, a
// lore chain's text, a quest's named item) is chosen from a stream keyed by the link or quest, never
// by the level, so every level of the link, and the village that names the quest, draw the same value.

import type { DoorWeightKey, FeatureKey } from '../../../core/catalog.ts';
import { createRng, hash32, type Rng } from '../../../core/rng.ts';
import { eligibleEntries, pickWeighted, type Rollable } from '../../../core/roller.ts';
import type {
  Artifact,
  GemJewelry,
  LoreChain,
  MagicItem,
  Monster,
  QuestItem,
  Trap,
} from '../../../core/schemas.ts';
import { MAX_DEPTH } from '../level.ts';
import { isVillageLevel, teleporterPartner, type Quest, type RunLayout } from '../run-layout.ts';

type Named = Rollable & { name: string };
type Texted = Rollable & { text: string };

/** The content tables placement reads (Spec 02, steps 5 to 11). */
export interface PlacementContent {
  monsters: readonly Monster[];
  bosses: readonly Monster[];
  traps: readonly Trap[];
  altarGods: readonly Named[];
  runes: readonly (Named & { letter?: string | undefined })[];
  books: readonly Texted[];
  graffiti: readonly Texted[];
  signs: readonly Texted[];
  rivals: readonly Named[];
  npcNames: readonly Named[];
  vaultNames: readonly Named[];
  gemsJewelry: readonly GemJewelry[];
  magicItems: readonly MagicItem[];
  questItems: readonly QuestItem[];
  loreChains: readonly LoreChain[];
  artifacts: readonly Artifact[];
}

/** The theme fields placement reads. */
export interface PlacementTheme {
  id: string;
  doors?: Partial<Record<DoorWeightKey, number>> | undefined;
  features?: Partial<Record<FeatureKey, number>> | undefined;
}

export type Piece =
  | { kind: 'vault_key'; link: string }
  | { kind: 'vault'; link: string; name: string }
  | { kind: 'map_fragment'; link: string; mappedLevel: number }
  | { kind: 'lore_entry'; link: string; index: number; text: string }
  | { kind: 'lore_end'; link: string; end: 'cache' | 'boss_weakness'; text: string }
  | { kind: 'rune_letter'; link: string; index: number; letter: string; runeId: string }
  | { kind: 'rune_altar'; link: string; word: string }
  | { kind: 'specialist'; link: string; service: string; name: string }
  | { kind: 'rival'; link: string; index: number; name: string }
  | { kind: 'rival_stash'; link: string; name: string }
  | { kind: 'shrine'; link: string; index: number; god: { id: string; name: string }; name: string }
  | { kind: 'lever'; link: string; landingLevel: number }
  | { kind: 'landing'; link: string };

/** A quest goal with the names it needs, drawn from the quest's own stream. */
export interface QuestGoal {
  quest: Quest;
  /** The named item of a belonging or magic-item quest. */
  item?: { id: string; name: string };
  /** The name of the captive or the opponent. */
  person?: string;
}

export interface LevelPlan {
  runSeed: number;
  depth: number;
  theme: PlacementTheme | undefined;
  /** The level below is a village, so no deep pit may open here (Spec 06). */
  villageBelow: boolean;
  teleporterTo: number | undefined;
  boss: { artifactId: string | null; artifactName: string | null; liftToken: boolean } | undefined;
  quests: QuestGoal[];
  pieces: Piece[];
}

const keyed = (seed: number, what: string, id: string): Rng => createRng(hash32(what, seed >>> 0, id));

/** One weighted pick that respects depth; undefined when no row fits. */
function pickRow<T extends Rollable>(rows: readonly T[], rng: Rng, depth: number): T | undefined {
  return pickWeighted(eligibleEntries(rows, { depth }), rng);
}

function questGoal(seed: number, quest: Quest, content: PlacementContent): QuestGoal {
  const rng = keyed(seed, 'quest-goal', quest.id);
  const goal: QuestGoal = { quest };
  if (quest.type === 'belonging' || quest.type === 'magic_item') {
    const row = pickRow(
      content.questItems.filter((i) => i.needs === quest.type),
      rng,
      quest.level,
    );
    if (row) goal.item = { id: row.id, name: row.name };
  } else {
    const row = pickRow(content.npcNames, rng, quest.level);
    if (row) goal.person = row.name;
  }
  return goal;
}

/** The pieces of every cross-level link that sit on `depth`. */
function piecesOn(layout: RunLayout, content: PlacementContent, depth: number): Piece[] {
  const seed = layout.seed;
  const pieces: Piece[] = [];
  for (const link of layout.links) {
    const rng = keyed(seed, 'link-piece', link.id);
    switch (link.type) {
      case 'vault': {
        const name = pickRow(content.vaultNames, rng, depth)?.name ?? 'a vault';
        if (link.keyLevel === depth) pieces.push({ kind: 'vault_key', link: link.id });
        if (link.vaultLevel === depth) pieces.push({ kind: 'vault', link: link.id, name });
        break;
      }
      case 'map_fragment':
        if (link.level === depth) pieces.push({ kind: 'map_fragment', link: link.id, mappedLevel: link.mappedLevel });
        break;
      case 'lore_chain': {
        const chain = pickRow(content.loreChains, rng, depth);
        if (!chain) break;
        const count = link.levels.length;
        link.levels.forEach((level, index) => {
          if (level === depth) pieces.push({ kind: 'lore_entry', link: link.id, index, text: chain.entries[index]! });
        });
        if (link.end.level === depth) {
          const text = chain.entries[Math.min(count, chain.entries.length - 1)]!;
          pieces.push({ kind: 'lore_end', link: link.id, end: link.end.kind, text });
        }
        break;
      }
      case 'rune_word': {
        const letters = content.runes.filter((r) => r.letter !== undefined);
        if (letters.length === 0) break;
        const chosen = link.levels.map(() => rng.pick(letters));
        const word = chosen.map((r) => r.letter).join('');
        link.levels.forEach((level, index) => {
          if (level === depth) {
            const rune = chosen[index]!;
            pieces.push({ kind: 'rune_letter', link: link.id, index, letter: rune.letter!, runeId: rune.id });
          }
        });
        if (link.altarLevel === depth) pieces.push({ kind: 'rune_altar', link: link.id, word });
        break;
      }
      case 'specialist':
        if (link.level === depth) {
          const name = pickRow(content.npcNames, rng, depth)?.name ?? 'a stranger';
          pieces.push({ kind: 'specialist', link: link.id, service: link.service, name });
        }
        break;
      case 'rival': {
        const name = pickRow(content.rivals, rng, depth)?.name ?? 'a rival';
        link.levels.forEach((level, index) => {
          if (level === depth) pieces.push({ kind: 'rival', link: link.id, index, name });
        });
        if (link.stashLevel === depth) pieces.push({ kind: 'rival_stash', link: link.id, name });
        break;
      }
      case 'shrine_set': {
        const god = pickWeighted(content.altarGods, rng);
        if (!god) break;
        link.levels.forEach((level, index) => {
          if (level === depth) {
            const name = pickRow(content.vaultNames, rng, depth)?.name ?? god.name;
            pieces.push({ kind: 'shrine', link: link.id, index, god: { id: god.id, name: god.name }, name });
          }
        });
        break;
      }
      case 'collapsed_passage':
        if (link.level === depth) pieces.push({ kind: 'lever', link: link.id, landingLevel: link.landingLevel });
        if (link.landingLevel === depth) pieces.push({ kind: 'landing', link: link.id });
        break;
      case 'lift_token':
        break; // carried by the level's boss, see `boss.liftToken`
    }
  }
  return pieces;
}

/** The plan for one level of the run (Spec 02, "Run layout" and step 11). */
export function planLevel(
  layout: RunLayout,
  content: PlacementContent,
  theme: PlacementTheme | undefined,
  depth: number,
): LevelPlan {
  const boss = layout.bosses.find((b) => b.level === depth);
  return {
    runSeed: layout.seed,
    depth,
    theme,
    villageBelow: depth < MAX_DEPTH && isVillageLevel(layout, depth + 1),
    teleporterTo: teleporterPartner(layout, depth),
    boss: boss && {
      artifactId: boss.artifactId,
      artifactName: boss.artifactName,
      liftToken: layout.links.some((l) => l.type === 'lift_token' && l.level === depth),
    },
    quests: layout.quests.filter((q) => q.level === depth).map((q) => questGoal(layout.seed, q, content)),
    pieces: piecesOn(layout, content, depth),
  };
}

/** The input a level needs to be filled (Spec 02, steps 4 to 11). Without it a level is just walls, floor and stairs. */
export interface LevelContents {
  content: PlacementContent;
  plan: LevelPlan;
}
