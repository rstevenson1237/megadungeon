// Theme recolouring of the shared terrain art (Spec 01b, Sprites; Spec 08, Addendum B, Themes; task 6.5). Every
// terrain asset is drawn from a few of the art direction's ramps, each standing for one of the theme's eight palette
// tokens. A ramp is moved so the step the asset covers most (its main colour: a floor's flags, a pool's water) becomes
// the token's colour exactly, as the text display draws it; its other steps keep their distance in lightness from that
// one and take the token's hue and chroma. The
// outline and the ramps a piece keeps as drawn (iron, wax) are left alone. Remembered cells take the result at half
// brightness, as the text display's remembered colours are.

import { dimmed, type MapLook, type TerrainColours } from '../palette.ts';
import { DIRECTION_RAMPS } from './ramps.ts';

export type RampName = keyof typeof DIRECTION_RAMPS;
type Token = keyof TerrainColours;

/** Which theme token each terrain asset's ramps stand for; ramps not named are drawn as they are. */
export const TERRAIN_RAMPS: Readonly<Record<string, Partial<Record<RampName, Token>>>> = {
  'terrain-floor': { dirt: 'floor' },
  'terrain-wall': { stone: 'wall' },
  'terrain-door': { stone: 'wall', wood: 'door' },
  'terrain-stairs-up': { stone: 'stairs', dirt: 'floor' },
  'terrain-stairs-down': { stone: 'stairs', dirt: 'floor' },
  'terrain-water-shallow': { grass: 'shallowWater', dirt: 'floor' },
  'terrain-water-deep': { grass: 'deepWater' },
  'terrain-lava': { accent: 'lava', glow: 'lava' },
  'terrain-teleporter': { stone: 'wall', accent: 'special', glow: 'special' },
  'terrain-debris': { stone: 'wall', dirt: 'floor' },
};

/** A colour map for `recolor`: '#rrggbb' to '#rrggbb'. */
export type ColourMap = Record<string, string>;

/** Which step of each ramp is an asset's main colour, the one the token replaces; the middle step when not given. */
export type MainSteps = Partial<Record<RampName, number>>;

/**
 * The colour map that draws `asset` in a level of this look, lit or remembered; an empty map for an asset the theme
 * does not recolour.
 */
export function terrainColourMap(asset: string, look: MapLook, remembered: boolean, main: MainSteps = {}): ColourMap {
  const out: ColourMap = {};
  for (const [ramp, token] of Object.entries(TERRAIN_RAMPS[asset] ?? {}) as Array<[RampName, Token]>) {
    const colours: readonly string[] = DIRECTION_RAMPS[ramp];
    const target = look.colours[token].visible;
    const ref = parseHex(colours[main[ramp] ?? Math.floor(colours.length / 2)]!);
    colours.forEach((hex) => {
      const lit = shiftToward(parseHex(hex), ref, target);
      out[hex] = toHex(remembered ? dimmed(lit) : lit);
    });
  }
  return out;
}

/** The main step of each recoloured ramp in an asset: the step with the most pixels, from its pixel colours. */
export function mainSteps(asset: string, pixels: Iterable<number>): MainSteps {
  const counts = new Map<number, number>();
  for (const rgb of pixels) counts.set(rgb, (counts.get(rgb) ?? 0) + 1);
  const out: MainSteps = {};
  for (const ramp of Object.keys(TERRAIN_RAMPS[asset] ?? {}) as RampName[]) {
    const steps = DIRECTION_RAMPS[ramp].map((hex) => counts.get(parseHex(hex)) ?? 0);
    const best = steps.indexOf(Math.max(...steps));
    if (steps[best]! > 0) out[ramp] = best;
  }
  return out;
}

/** `colour` moved as `ref` is moved onto `target`: its lightness offset kept, the target's hue and chroma taken. */
export function shiftToward(colour: number, ref: number, target: number): number {
  if (colour === ref) return target;
  const c = toOklch(colour);
  const r = toOklch(ref);
  const t = toOklch(target);
  const L = Math.min(0.98, Math.max(0.03, c.L + t.L - r.L));
  return fromOklch(L, t.C, t.h);
}

const parseHex = (hex: string): number => parseInt(hex.slice(1, 7), 16);
const toHex = (rgb: number): string => `#${rgb.toString(16).padStart(6, '0')}`;

// OKLab (Björn Ottosson), for lightness steps that look even across hues.
const toLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function toOklch(rgb: number): { L: number; C: number; h: number } {
  const r = toLinear(((rgb >> 16) & 0xff) / 255);
  const g = toLinear(((rgb >> 8) & 0xff) / 255);
  const b = toLinear((rgb & 0xff) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, B), h: Math.atan2(B, A) };
}

/** Linear sRGB of an OKLab colour, possibly out of gamut. */
function oklabToLinear(L: number, A: number, B: number): [number, number, number] {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** The sRGB colour of an OKLCh colour, its chroma reduced until it fits the gamut. */
function fromOklch(L: number, C: number, h: number): number {
  const inGamut = (c: number): boolean => oklabToLinear(L, c * Math.cos(h), c * Math.sin(h)).every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  let lo = 0;
  let hi = C;
  if (!inGamut(hi)) {
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(mid)) lo = mid;
      else hi = mid;
    }
    hi = lo;
  }
  const [r, g, b] = oklabToLinear(L, hi * Math.cos(h), hi * Math.sin(h));
  const byte = (v: number): number => Math.round(Math.min(1, Math.max(0, fromLinear(Math.min(1, Math.max(0, v))))) * 255);
  return (byte(r) << 16) | (byte(g) << 8) | byte(b);
}
