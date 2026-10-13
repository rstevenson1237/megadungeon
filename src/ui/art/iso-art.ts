// The isometric display's art (Spec 01b, Sprites and Loading; task 6.5): an exported artgen pack (`pack.json` and its
// atlases under `public/art/`) read through the vendored runtime's pack format, and drawn for the painter. Terrain is
// recoloured per theme (terrain-recolour.ts) and remembered cells are drawn at half brightness; each recoloured frame
// is cut from its atlas once and kept. Every terrain frame sits on its cell the same way: the cell's 32 x 16 diamond is
// the frame's bottom 16 rows, centred, so taller things (a wall, a rising stair, a heap) stand above it. Players,
// creatures and people (task 6.6) are drawn in their facing and stand on the cell's centre by their frame's `ground`
// anchor; a family sprite is recoloured to its row's colour (sprite-recolour.ts).

import type { IsoContext, SpriteSource } from '../iso-paint.ts';
import { TILE_H, type IsoDraw } from '../iso-view.ts';
import type { MapLook } from '../palette.ts';
import type { PackAsset, PackManifest } from './runtime/types.ts';
import { FAMILY_RAMPS, mainStep, spriteColourMap } from './sprite-recolour.ts';
import { type ColourMap, type MainSteps, mainSteps, terrainColourMap } from './terrain-recolour.ts';

/** Decoded atlas pixels: straight-alpha RGBA, rows top to bottom. */
export interface ArtImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Turns recoloured pixels into something the canvas can draw (a canvas in the browser, a stand-in in tests). */
export type MakeImage = (image: ArtImage) => CanvasImageSource;

/** The frames of an asset for one selection: its state (a wall's full or cap, a door's state), variant and frame. */
interface Selection {
  state: string;
  variant: number;
  frame: number;
  /** The facing's name (s, e, n or w); the asset's first facing when it has no such facing or none is asked. */
  facing?: string;
}

/** The pack format this reader knows (artgen pack.json format 1). */
export function checkPack(json: unknown): PackManifest {
  const p = json as PackManifest;
  if (!p || typeof p !== 'object' || p.format !== 1 || !Array.isArray(p.atlases) || typeof p.assets !== 'object') {
    throw new Error('not an artgen pack (pack.json format 1)');
  }
  return p;
}

export class IsoArt implements SpriteSource {
  /** The asset ids the pack has, for the draw list's fallback chain (Spec 08, Addendum B). */
  readonly ids: ReadonlySet<string>;
  /** The level's look, which the terrain is recoloured to; set by the shell before each paint. */
  look: MapLook | null = null;
  private readonly cut = new Map<string, CanvasImageSource>();
  private cutLook = '';
  private readonly mains = new Map<string, MainSteps>();

  constructor(
    private readonly manifest: PackManifest,
    private readonly atlases: readonly ArtImage[],
    private readonly makeImage: MakeImage,
  ) {
    this.ids = new Set(Object.keys(manifest.assets));
  }

  draw(ctx: IsoContext, d: IsoDraw): boolean {
    const asset = d.asset ? this.manifest.assets[d.asset] : undefined;
    if (!asset || !this.look) return false;
    const index = frameIndex(asset, { state: d.frame, variant: d.variant, frame: 0, facing: d.facing });
    if (index < 0) return false;
    const [, , , w, h] = asset.frames[index]!;
    const family = FAMILY_RAMPS[d.asset!] !== undefined;
    // A new theme recolours everything again (the look is rebuilt each paint, so it is compared by its colours).
    const lookKey = Object.values(this.look.colours).map((c) => c.visible).join();
    if (this.cutLook !== lookKey) {
      this.cut.clear();
      this.cutLook = lookKey;
    }
    const key = `${d.asset}|${index}|${d.dim ? 1 : 0}|${family ? d.tint : ''}`;
    let image = this.cut.get(key);
    if (!image) {
      const map = family
        ? spriteColourMap(d.asset!, d.tint, this.familyMain(d.asset!, asset))
        : terrainColourMap(d.asset!, this.look, d.dim, this.mainOf(d.asset!, asset));
      image = this.makeImage(this.pixels(asset, index, map, d.dim));
      this.cut.set(key, image);
    }
    // A sprite stands on the cell's centre by the point between its feet; terrain sits its diamond on the cell.
    const ground = asset.anchors?.ground?.[index];
    if (ground) ctx.drawImage(image, d.x - ground[0], d.y - ground[1]);
    else ctx.drawImage(image, d.x - Math.floor(w / 2), d.y + TILE_H / 2 - h);
    return true;
  }

  /** The asset's main step of each ramp (terrain-recolour.ts), counted over all its frames once. */
  private mainOf(id: string, asset: PackAsset): MainSteps {
    let main = this.mains.get(id);
    if (!main) {
      main = mainSteps(id, this.colours(asset));
      this.mains.set(id, main);
    }
    return main;
  }

  /** A family sprite's main step of its body ramp, counted over all its frames once. */
  private familyMain(id: string, asset: PackAsset): number {
    const ramp = FAMILY_RAMPS[id]!;
    let main = this.mains.get(id);
    if (!main) {
      main = { [ramp]: mainStep(ramp, this.colours(asset)) };
      this.mains.set(id, main);
    }
    return main[ramp]!;
  }

  /** Every opaque pixel's colour over all of an asset's frames. */
  private *colours(asset: PackAsset): Generator<number> {
    for (const [bin, x, y, w, h] of asset.frames) {
      const a = this.atlases[bin]!;
      for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
          const i = (r * a.width + c) * 4;
          if (a.data[i + 3]) yield (a.data[i]! << 16) | (a.data[i + 1]! << 8) | a.data[i + 2]!;
        }
      }
    }
  }

  /** One frame's pixels through a colour map, at half brightness for a remembered cell. */
  private pixels(asset: PackAsset, index: number, map: ColourMap, dim: boolean): ArtImage {
    const [bin, x, y, w, h] = asset.frames[index]!;
    const atlas = this.atlases[bin]!;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let r = 0; r < h; r++) data.set(atlas.data.subarray(((y + r) * atlas.width + x) * 4, ((y + r) * atlas.width + x + w) * 4), r * w * 4);
    const to = new Map(Object.entries(map).map(([from, hex]) => [parseInt(from.slice(1), 16), parseInt(hex.slice(1), 16)]));
    for (let i = 0; i < data.length; i += 4) {
      if (!data[i + 3]) continue;
      const rgb = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
      // A colour the theme does not move (the outline, iron) still dims with a remembered cell.
      const out = to.get(rgb) ?? (dim ? halve(rgb) : rgb);
      data[i] = out >> 16;
      data[i + 1] = (out >> 8) & 0xff;
      data[i + 2] = out & 0xff;
    }
    return { width: w, height: h, data };
  }
}

const halve = (rgb: number): number => (((rgb >> 17) & 0x7f) << 16) | (((rgb >> 9) & 0x7f) << 8) | ((rgb >> 1) & 0x7f);

/**
 * The index into an asset's frames for a selection, as the runtime's `Pack.frameIndex` picks it (a missing facing,
 * variant or frame falls back to the first), or -1 when the asset has no such state. An empty state is the first.
 */
export function frameIndex(asset: PackAsset, sel: Selection): number {
  const state = sel.state || Object.keys(asset.states)[0]!;
  if (!asset.states[state]) return -1;
  const params = asset.variants.length - Object.keys(asset.swaps ?? {}).length;
  const variant = sel.variant < params ? sel.variant : 0;
  const facing = Math.max(0, sel.facing ? asset.facings.indexOf(sel.facing) : 0);
  let fallback = -1;
  for (let i = 0; i < asset.frames.length; i++) {
    const f = asset.frames[i]!;
    if (f[6] !== state || f[5] !== facing) continue;
    if (f[8] === variant && f[7] === sel.frame) return i;
    if (fallback < 0 && f[8] === 0 && f[7] === 0) fallback = i;
  }
  return fallback;
}

/** Load the pack at `url` (its pack.json; the atlases beside it) and decode its atlases in the browser. */
export async function loadIsoArt(url: string): Promise<IsoArt> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const manifest = checkPack(await res.json());
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const atlases = await Promise.all(manifest.atlases.map((name) => decode(base + name)));
  return new IsoArt(manifest, atlases, canvasImage);
}

async function decode(url: string): Promise<ArtImage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width, height, data };
}

function canvasImage(image: ArtImage): CanvasImageSource {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(image.data), image.width, image.height), 0, 0);
  return canvas;
}
