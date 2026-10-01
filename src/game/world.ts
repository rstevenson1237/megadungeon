// Ties the content bundle to the run layout (Spec 02, "Run layout"): reads the tables the layout
// needs and gives a run its layout and level sizes.

import type { ContentBundle, Artifact, LevelTheme, VillageName } from '../core/schemas.ts';
import { generateRunLayout, type LayoutContent } from '../rules/world/run-layout.ts';
import type { RunOptions } from './run.ts';

export function layoutContentOf(bundle: ContentBundle): LayoutContent {
  const table = <T>(name: string): readonly T[] => (bundle.tables[name] ?? []) as T[];
  return {
    themes: table<LevelTheme>('level_themes'),
    artifacts: table<Artifact>('artifacts'),
    villageNames: table<VillageName>('village_names'),
  };
}

/** The layout for a seed, and the level size each theme calls for. */
export function runOptionsFor(bundle: ContentBundle, seed: number): RunOptions {
  const content = layoutContentOf(bundle);
  const layout = generateRunLayout(seed, content);
  const sizes = new Map(content.themes.map((t) => [t.id, t.size]));
  return {
    layout,
    sizeFor: (depth) => sizes.get(layout.themes[depth] ?? '') ?? 'medium',
  };
}
