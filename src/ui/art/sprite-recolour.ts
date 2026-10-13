// Row recolouring of the monster family sprites (Spec 01b, Sprites, and its task 6.6 clarification). A family sprite
// draws its body in one ramp of the art direction, named in its source as `meta.recolour`; a row drawn by its
// family's sprite takes its own colour token there. That ramp's main step (the one the sprite covers most) becomes the
// row's colour exactly, and its other steps keep their lightness offset from it, by the rule the theme recolour of the
// terrain uses (terrain-recolour.ts). The outline and every other ramp (eyes, teeth, steel) are drawn as they are.

import { DIRECTION_RAMPS } from './ramps.ts';
import { type ColourMap, type RampName, shiftToward } from './terrain-recolour.ts';

/** The body ramp of each family sprite, as its source names it (`meta.recolour`; checked by tests/iso-art.test.ts). */
export const FAMILY_RAMPS: Readonly<Record<string, RampName>> = {
  'family-a': 'leather',
  'family-a-cap': 'skin',
  'family-b': 'leather',
  'family-c': 'accent',
  'family-c-cap': 'cloth',
  'family-d-cap': 'accent',
  'family-e': 'grass',
  'family-e-cap': 'accent',
  'family-f': 'skin',
  'family-f-cap': 'skin',
  'family-g': 'skin',
  'family-g-cap': 'leather',
  'family-h': 'cloth',
  'family-h-cap': 'grass',
  'family-i-cap': 'accent',
  'family-j': 'grass',
  'family-k': 'skin',
  'family-k-cap': 'cloth',
  'family-l': 'grass',
  'family-l-cap': 'leather',
  'family-m-cap': 'cloth',
  'family-n': 'cloth',
  'family-o': 'skin',
  'family-o-cap': 'skin',
  'family-p-cap': 'accent',
  'family-q': 'grass',
  'family-r': 'hair',
  'family-s': 'cloth',
  'family-s-cap': 'grass',
  'family-t-cap': 'grass',
  'family-v-cap': 'leather',
  'family-w': 'skin',
  'family-w-cap': 'grass',
  'family-y-cap': 'leather',
  'family-z': 'skin',
};

/** The step of `ramp` a sprite covers most, from its pixel colours; the middle step when it covers none. */
export function mainStep(ramp: RampName, pixels: Iterable<number>): number {
  const steps = DIRECTION_RAMPS[ramp].map((hex) => parseInt(hex.slice(1, 7), 16));
  const counts = steps.map(() => 0);
  for (const rgb of pixels) {
    const i = steps.indexOf(rgb);
    if (i >= 0) counts[i]!++;
  }
  const best = counts.indexOf(Math.max(...counts));
  return counts[best]! > 0 ? best : Math.floor(steps.length / 2);
}

/** The colour map that draws family sprite `asset` in colour `tint`; empty for a sprite that is not recoloured. */
export function spriteColourMap(asset: string, tint: number, main: number): ColourMap {
  const ramp = FAMILY_RAMPS[asset];
  if (!ramp) return {};
  const colours: readonly string[] = DIRECTION_RAMPS[ramp];
  const ref = parseInt(colours[main]!.slice(1, 7), 16);
  const out: ColourMap = {};
  for (const hex of colours) out[hex] = `#${shiftToward(parseInt(hex.slice(1, 7), 16), ref, tint).toString(16).padStart(6, '0')}`;
  return out;
}
