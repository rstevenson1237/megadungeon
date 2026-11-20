import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import bundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';
import { gameContentOf } from '../src/game/content.ts';
import { itemDataFrom } from '../src/rules/items/magic.ts';
import { spellsFrom } from '../src/rules/magic/spells.ts';
import { checkPack } from '../src/ui/art/iso-art.ts';
import { ISO_VIEW, buildIsoDraws } from '../src/ui/iso-view.ts';
import { IN_VIEW, crowdedView } from './iso-budget.ts';

// Task 6.10: the scene the frame budget is measured on (Spec 01b, Loading and performance) really is a large level
// with 80 creatures in view. The time itself is measured in the browsers (e2e/browser-checks.spec.ts), on the canvas.

const BUNDLE = bundle as ContentBundle;
const pack = new Set(Object.keys(checkPack(JSON.parse(readFileSync('public/art/main/pack.json', 'utf8'))).assets));

describe('Spec 01b: the frame budget scene', () => {
  const game = crowdedView({ levels: BUNDLE, spells: spellsFrom(BUNDLE), items: itemDataFrom(BUNDLE), content: gameContentOf(BUNDLE) });

  it('is a large level', () => {
    expect([game.state.map.level.width, game.state.map.level.height]).toEqual([140, 60]);
  });

  it('draws 80 creatures besides the player, each on screen and by its family sprite', () => {
    const draws = buildIsoDraws(game.state, { pack });
    const creatures = draws.filter((d) => d.layer === 'creature' && (d.cell.x !== game.state.map.player.x || d.cell.y !== game.state.map.player.y));
    expect(creatures).toHaveLength(IN_VIEW);
    for (const d of creatures) {
      expect(d.dim).toBe(false);
      expect(d.x).toBeGreaterThanOrEqual(ISO_VIEW.x);
      expect(d.x).toBeLessThan(ISO_VIEW.x + ISO_VIEW.w);
      expect(d.y).toBeGreaterThanOrEqual(ISO_VIEW.y);
      expect(d.y).toBeLessThan(ISO_VIEW.y + ISO_VIEW.h);
    }
    // Most families have their own sprite; the rest fall back to the glyph card, as the game draws them.
    expect(creatures.filter((d) => d.asset?.startsWith('family-')).length).toBeGreaterThan(IN_VIEW / 2);
  });
});
