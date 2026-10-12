import { describe, expect, it } from 'vitest';
import { type ArtImage, IsoArt, checkPack, frameIndex } from '../src/ui/art/iso-art.ts';
import { DIRECTION_RAMPS } from '../src/ui/art/ramps.ts';
import type { PackAsset, PackManifest } from '../src/ui/art/runtime/types.ts';
import type { IsoContext } from '../src/ui/iso-paint.ts';
import type { IsoDraw } from '../src/ui/iso-view.ts';
import { mapLook } from '../src/ui/palette.ts';

const rgb = (hex: string): number => parseInt(hex.slice(1), 16);

/** A 4 x 2 atlas: a 2 x 2 wall frame of stone's middle and darkest steps, and a 2 x 2 frame of the outline beside it. */
function atlas(): ArtImage {
  const px = [DIRECTION_RAMPS.stone[1], DIRECTION_RAMPS.stone[2], '#101918', '#101918', DIRECTION_RAMPS.stone[1], DIRECTION_RAMPS.stone[1], '#101918', '#101918'];
  const data = new Uint8ClampedArray(px.length * 4);
  px.forEach((hex, i) => data.set([rgb(hex) >> 16, (rgb(hex) >> 8) & 255, rgb(hex) & 255, 255], i * 4));
  return { width: 4, height: 2, data };
}

const wall: PackAsset = {
  kind: 'tile', view: 'iso', size: [2, 2], anchor: [1, 1], directions: 1, facings: ['s'],
  states: { full: { frames: 1, fps: 1, loop: true }, cap: { frames: 1, fps: 1, loop: true } },
  frames: [[0, 0, 0, 2, 2, 0, 'full', 0, 0], [0, 2, 0, 2, 2, 0, 'cap', 0, 0]],
  variants: ['base'], version: 'finish.v1', sourceHash: 'x',
};
const manifest: PackManifest = {
  format: 1, pack: 'main', generator: 'test', direction: { id: 'megadungeon', version: 1 }, runtime: '1.2.1', atlases: ['main-0.png'],
  assets: { 'terrain-wall': wall },
};

/** A drawing context that records where each image went. */
function recorder(): { ctx: IsoContext; drawn: Array<{ image: ArtImage; x: number; y: number }> } {
  const drawn: Array<{ image: ArtImage; x: number; y: number }> = [];
  const ctx = { drawImage: (image: ArtImage, x: number, y: number) => drawn.push({ image, x, y }) } as unknown as IsoContext;
  return { ctx, drawn };
}

const draw = (over: Partial<IsoDraw>): IsoDraw => ({ asset: 'terrain-wall', frame: 'full', variant: 0, x: 100, y: 50, dim: false, ...over }) as IsoDraw;

const pixel = (image: ArtImage, i: number): number => (image.data[i * 4]! << 16) | (image.data[i * 4 + 1]! << 8) | image.data[i * 4 + 2]!;

describe('the isometric art (task 6.5)', () => {
  const cellars = mapLook({ palette: { wall: '#8a8a96' } });

  it('draws a frame with its bottom 16 rows on the cell, centred', () => {
    const art = new IsoArt(manifest, [atlas()], (image) => image as unknown as CanvasImageSource);
    art.look = cellars;
    const { ctx, drawn } = recorder();
    expect(art.draw(ctx, draw({}))).toBe(true);
    // x - floor(w / 2), y + 8 - h: the frame's bottom sits 8 px under the cell's centre, at the diamond's near corner.
    expect(drawn[0]).toMatchObject({ x: 99, y: 56 });
  });

  it("recolours the asset's main step to the theme token and leaves the outline", () => {
    const art = new IsoArt(manifest, [atlas()], (image) => image as unknown as CanvasImageSource);
    art.look = cellars;
    const { ctx, drawn } = recorder();
    art.draw(ctx, draw({}));
    art.draw(ctx, draw({ frame: 'cap' }));
    expect(pixel(drawn[0]!.image, 0)).toBe(0x8a8a96);
    expect(pixel(drawn[0]!.image, 1)).not.toBe(rgb(DIRECTION_RAMPS.stone[2]));
    expect(pixel(drawn[1]!.image, 0)).toBe(0x101918);
  });

  it('halves remembered cells, the outline too, and recolours again for a new theme', () => {
    let made = 0;
    const art = new IsoArt(manifest, [atlas()], (image) => (made++, image as unknown as CanvasImageSource));
    art.look = cellars;
    const { ctx, drawn } = recorder();
    art.draw(ctx, draw({}));
    art.draw(ctx, draw({}));
    expect(made).toBe(1);
    art.draw(ctx, draw({ frame: 'cap', dim: true }));
    expect(pixel(drawn[2]!.image, 0)).toBe(0x080c0c);
    art.look = mapLook({ palette: { wall: '#606040' } });
    art.draw(ctx, draw({}));
    expect(pixel(drawn[3]!.image, 0)).toBe(0x606040);
    expect(made).toBe(3);
  });

  it('declines what it cannot draw, so the glyph fallback draws it', () => {
    const art = new IsoArt(manifest, [atlas()], (image) => image as unknown as CanvasImageSource);
    const { ctx } = recorder();
    expect(art.draw(ctx, draw({}))).toBe(false);
    art.look = cellars;
    expect(art.draw(ctx, draw({ asset: 'terrain-lava' }))).toBe(false);
    expect(art.draw(ctx, draw({ frame: 'open' }))).toBe(false);
    expect([...art.ids]).toEqual(['terrain-wall']);
  });

  it('picks frames by state, falling back to the first variant and frame', () => {
    expect(frameIndex(wall, { state: 'cap', variant: 0, frame: 0 })).toBe(1);
    expect(frameIndex(wall, { state: '', variant: 0, frame: 0 })).toBe(0);
    expect(frameIndex(wall, { state: 'full', variant: 3, frame: 2 })).toBe(0);
    expect(frameIndex(wall, { state: 'gone', variant: 0, frame: 0 })).toBe(-1);
  });

  it('refuses a file that is not an artgen pack', () => {
    expect(() => checkPack({ format: 2 })).toThrow(/not an artgen pack/);
    expect(checkPack(manifest)).toBe(manifest);
  });
});
