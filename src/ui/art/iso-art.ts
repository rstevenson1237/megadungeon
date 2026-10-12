// The isometric display's art (Spec 01b, Sprites and Loading; task 6.5): an exported artgen pack (`pack.json` and its
// atlases under `public/art/`) read through the vendored runtime's pack format, and drawn for the painter. Terrain is
// recoloured per theme (terrain-recolour.ts) and remembered cells are drawn at half brightness; each recoloured frame
// is cut from its atlas once and kept. Every terrain frame sits on its cell the same way: the cell's 32 x 16 diamond is
// the frame's bottom 16 rows, centred, so taller things (a wall, a rising stair, a heap) stand above it.

import type { IsoContext, SpriteSource } from '../iso-paint.ts';
import { TILE_H, type IsoDraw } from '../iso-view.ts';
import type { MapLook } from '../palette.ts';
import type { PackAsset, PackManifest } from './runtime/types.ts';
import { type MainSteps, mainSteps, terrainColourMap } from './terrain-recolour.ts';

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
    const index = frameIndex(asset, { state: d.frame, variant: d.variant, frame: 0 });
    if (index < 0) return false;
    const [, , , w, h] = asset.frames[index]!;
    // A new theme recolours everything again (the look is rebuilt each paint, so it is compared by its colours).
    const lookKey = Object.values(this.look.colours).map((c) => c.visible).join();
    if (this.cutLook !== lookKey) {
      this.cut.clear();
      this.cutLook = lookKey;
    }
    const key = `${d.asset}|${index}|${d.dim ? 1 : 0}`;
    let image = this.cut.get(key);
    if (!image) {
      image = this.makeImage(this.pixels(d.asset!, asset, index, d.dim));
      this.cut.set(key, image);
    }
    ctx.drawImage(image, d.x - Math.floor(w / 2), d.y + TILE_H / 2 - h);
    return true;
  }

  /** The asset's main step of each ramp (terrain-recolour.ts), counted over all its frames once. */
  private mainOf(id: string, asset: PackAsset): MainSteps {
    let main = this.mains.get(id);
    if (!main) {
      const atlases = this.atlases;
      main = mainSteps(id, (function* () {
        for (const [bin, x, y, w, h] of asset.frames) {
          const a = atlases[bin]!;
          for (let r = y; r < y + h; r++) {
            for (let c = x; c < x + w; c++) {
              const i = (r * a.width + c) * 4;
              if (a.data[i + 3]) yield (a.data[i]! << 16) | (a.data[i + 1]! << 8) | a.data[i + 2]!;
            }
          }
        }
      })());
      this.mains.set(id, main);
    }
    return main;
  }

  /** One frame's pixels, recoloured to the level's theme, at half brightness for a remembered cell. */
  private pixels(id: string, asset: PackAsset, index: number, dim: boolean): ArtImage {
    const [bin, x, y, w, h] = asset.frames[index]!;
    const atlas = this.atlases[bin]!;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let r = 0; r < h; r++) data.set(atlas.data.subarray(((y + r) * atlas.width + x) * 4, ((y + r) * atlas.width + x + w) * 4), r * w * 4);
    const map = terrainColourMap(id, this.look!, dim, this.mainOf(id, asset));
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
 * The index into an asset's frames for a selection, as the runtime's `Pack.frameIndex` picks it (facing 0; a missing
 * variant or frame falls back to the first), or -1 when the asset has no such state. An empty state is the first.
 */
export function frameIndex(asset: PackAsset, sel: Selection): number {
  const state = sel.state || Object.keys(asset.states)[0]!;
  if (!asset.states[state]) return -1;
  const params = asset.variants.length - Object.keys(asset.swaps ?? {}).length;
  const variant = sel.variant < params ? sel.variant : 0;
  let fallback = -1;
  for (let i = 0; i < asset.frames.length; i++) {
    const f = asset.frames[i]!;
    if (f[6] !== state || f[5] !== 0) continue;
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
