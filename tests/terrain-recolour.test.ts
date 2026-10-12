import { describe, expect, it } from 'vitest';
import { DIRECTION_RAMPS } from '../src/ui/art/ramps.ts';
import { mainSteps, shiftToward, TERRAIN_RAMPS, terrainColourMap } from '../src/ui/art/terrain-recolour.ts';
import { DEFAULT_LOOK, dimmed, mapLook } from '../src/ui/palette.ts';

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
const lum = (h: string): number => {
  const n = parseInt(h.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};
const cellars = mapLook({
  palette: { wall: '#8a8a96', floor: '#4e4e5c', door: '#b08040', stairs: '#e8e4d0', shallow_water: '#4a7ab0', deep_water: '#2a4a88', lava: '#e05a20', accent: '#b0a0d8' },
});

describe('theme recolouring of terrain (task 6.5)', () => {
  it("a ramp's middle colour becomes the theme token exactly", () => {
    const map = terrainColourMap('terrain-wall', cellars, false);
    expect(map[DIRECTION_RAMPS.stone[1]]).toBe('#8a8a96');
    expect(terrainColourMap('terrain-floor', cellars, false)[DIRECTION_RAMPS.dirt[1]]).toBe('#4e4e5c');
    expect(terrainColourMap('terrain-teleporter', cellars, false)[DIRECTION_RAMPS.accent[1]]).toBe('#b0a0d8');
  });

  it('keeps the ramp lightest first, so the art keeps its shading', () => {
    for (const asset of Object.keys(TERRAIN_RAMPS)) {
      const map = terrainColourMap(asset, cellars, false);
      for (const ramp of Object.keys(TERRAIN_RAMPS[asset]!) as Array<keyof typeof DIRECTION_RAMPS>) {
        const out = DIRECTION_RAMPS[ramp].map((c) => map[c]!);
        for (let i = 1; i < out.length; i++) expect(lum(out[i - 1]!)).toBeGreaterThanOrEqual(lum(out[i]!));
      }
    }
  });

  it('leaves the outline and the ramps a piece keeps as drawn', () => {
    const map = terrainColourMap('terrain-door', cellars, false);
    expect(map['#101918']).toBeUndefined();
    for (const c of DIRECTION_RAMPS.metal) expect(map[c]).toBeUndefined();
    expect(Object.keys(terrainColourMap('feature-chest', cellars, false))).toHaveLength(0);
  });

  it('draws remembered cells at half brightness', () => {
    const lit = terrainColourMap('terrain-wall', DEFAULT_LOOK, false);
    const dim = terrainColourMap('terrain-wall', DEFAULT_LOOK, true);
    for (const c of DIRECTION_RAMPS.stone) expect(dim[c]).toBe(hex(dimmed(parseInt(lit[c]!.slice(1), 16))));
  });

  it('a colour equal to its reference maps to the target, and others stay in gamut', () => {
    expect(shiftToward(0x636875, 0x636875, 0x123456)).toBe(0x123456);
    const out = shiftToward(0xbabec3, 0x636875, 0xe8e4d0);
    expect(out).toBeGreaterThanOrEqual(0);
    expect(out).toBeLessThanOrEqual(0xffffff);
  });
});

describe('the main step of a ramp (task 6.5)', () => {
  it('is the step an asset covers most, and that step becomes the token', () => {
    const deep = parseInt(DIRECTION_RAMPS.grass[2].slice(1), 16);
    const mid = parseInt(DIRECTION_RAMPS.grass[1].slice(1), 16);
    const main = mainSteps('terrain-water-deep', [deep, deep, deep, mid]);
    expect(main).toEqual({ grass: 2 });
    expect(terrainColourMap('terrain-water-deep', cellars, false, main)[DIRECTION_RAMPS.grass[2]]).toBe('#2a4a88');
  });
});
