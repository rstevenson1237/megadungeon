// Ties the content bundle to the run layout (Spec 02, "Run layout"): reads the tables the layout
// and the placement pipeline need and gives a run its layout, level sizes and level contents.

import type {
  ContentBundle,
  Artifact,
  GemJewelry,
  LevelTheme,
  LoreChain,
  MagicItem,
  Monster,
  QuestItem,
  Trap,
  VillageName,
} from '../core/schemas.ts';
import { gameContentOf } from './content.ts';
import { itemDataFrom } from '../rules/items/magic.ts';
import { spellsFrom } from '../rules/magic/spells.ts';
import { PLAIN_STYLE } from '../rules/world/generate.ts';
import { planLevel, type PlacementContent } from '../rules/world/placement/index.ts';
import { generateRunLayout, type LayoutContent, type ThemeRow } from '../rules/world/run-layout.ts';
import type { RunOptions } from './run.ts';

const tableOf =
  (bundle: ContentBundle) =>
  <T>(name: string): readonly T[] =>
    (bundle.tables[name] ?? []) as T[];

export function layoutContentOf(bundle: ContentBundle): LayoutContent {
  const table = tableOf(bundle);
  return {
    themes: table<LevelTheme>('level_themes'),
    artifacts: table<Artifact>('artifacts'),
    villageNames: table<VillageName>('village_names'),
  };
}

/** The tables the placement pipeline rolls from (Spec 02, steps 5 to 11). */
export function placementContentOf(bundle: ContentBundle): PlacementContent {
  const table = tableOf(bundle);
  type Named = { id: string; name: string };
  type Texted = { id: string; text: string };
  return {
    monsters: table<Monster>('monsters'),
    bosses: table<Monster>('bosses'),
    traps: table<Trap>('traps'),
    altarGods: table<Named>('altar_gods'),
    runes: table<Named & { letter?: string }>('runes'),
    books: table<Texted>('books'),
    graffiti: table<Texted>('graffiti'),
    signs: table<Texted>('signs'),
    rivals: table<Named>('rivals'),
    npcNames: table<Named>('npc_names'),
    vaultNames: table<Named>('vault_names'),
    gemsJewelry: table<GemJewelry>('gems_jewelry'),
    magicItems: table<MagicItem>('magic_items'),
    questItems: table<QuestItem>('quest_items'),
    loreChains: table<LoreChain>('lore_chains'),
    artifacts: table<Artifact>('artifacts'),
  } as PlacementContent;
}

/** The layout for a seed, and the level size, layout algorithm and contents each level calls for. */
export function runOptionsFor(bundle: ContentBundle, seed: number): RunOptions {
  const content = layoutContentOf(bundle);
  const layout = generateRunLayout(seed, content);
  const placement = placementContentOf(bundle);
  const themes = new Map(content.themes.map((t) => [t.id, t]));
  const themeAt = (depth: number): ThemeRow | undefined => themes.get(layout.themes[depth] ?? '');
  return {
    layout,
    spells: spellsFrom(bundle),
    items: itemDataFrom(bundle),
    content: gameContentOf(bundle),
    sizeFor: (depth) => themeAt(depth)?.size ?? 'medium',
    styleFor: (depth) => themeAt(depth) ?? PLAIN_STYLE,
    contentsFor: (depth) => {
      const theme = themeAt(depth);
      return { content: placement, plan: planLevel(layout, placement, theme && { id: theme.id, doors: theme.doors, features: theme.features }, depth) };
    },
  };
}
