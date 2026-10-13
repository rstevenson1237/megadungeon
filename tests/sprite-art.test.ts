// Players, creatures and people in the isometric display (Spec 01b, Sprites, and its task 6.6 clarification): each is
// drawn in its facing, stands on the cell's centre by its frame's ground anchor, and a family sprite takes its row's
// colour on its body ramp only.

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { type ArtImage, checkPack, frameIndex, IsoArt } from '../src/ui/art/iso-art.ts';
import { artId, familyId } from '../src/ui/art-ids.ts';
import { buildContent } from '../tools/content-build.ts';
import { DIRECTION_RAMPS } from '../src/ui/art/ramps.ts';
import type { PackAsset, PackManifest } from '../src/ui/art/runtime/types.ts';
import { FAMILY_RAMPS, spriteColourMap } from '../src/ui/art/sprite-recolour.ts';
import type { IsoContext } from '../src/ui/iso-paint.ts';
import { buildIsoDraws, facingOf, type IsoDraw } from '../src/ui/iso-view.ts';
import { mapLook } from '../src/ui/palette.ts';
import { gameOn, monsterAt, room } from './helpers.ts';

const rgb = (hex: string): number => parseInt(hex.slice(1), 16);
const OUTLINE = '#101918';

/** Four 2 x 2 frames side by side, one per facing (s, w, n, e): skin's middle and light steps and the outline. */
function atlas(): ArtImage {
  const frame = (k: number): string[] => [DIRECTION_RAMPS.skin[1], DIRECTION_RAMPS.skin[1], DIRECTION_RAMPS.skin[k % 2 ? 0 : 1], OUTLINE];
  const frames = [0, 1, 2, 3].map(frame);
  const px: string[] = [];
  for (let r = 0; r < 2; r++) for (const f of frames) px.push(f[r * 2]!, f[r * 2 + 1]!);
  const data = new Uint8ClampedArray(px.length * 4);
  px.forEach((hex, i) => data.set([rgb(hex) >> 16, (rgb(hex) >> 8) & 255, rgb(hex) & 255, 255], i * 4));
  return { width: 8, height: 2, data };
}

const sprite = (): PackAsset => ({
  kind: 'creature', view: 'iso', size: [2, 2], anchor: [1, 1], directions: 4, facings: ['s', 'w', 'n', 'e'],
  states: { idle: { frames: 1, fps: 1, loop: true } },
  frames: [0, 1, 2, 3].map((f) => [0, f * 2, 0, 2, 2, f, 'idle', 0, 0]),
  anchors: { ground: [[1, 2], [0, 2], [1, 1], [0, 1]] },
  variants: ['base'], version: 'finish.v1', sourceHash: 'x',
});
const manifest: PackManifest = {
  format: 1, pack: 'main', generator: 'test', direction: { id: 'megadungeon', version: 1 }, runtime: '1.2.1', atlases: ['main-0.png'],
  assets: { 'family-g': sprite(), 'class-warrior': sprite() },
};

function recorder(): { ctx: IsoContext; drawn: Array<{ image: ArtImage; x: number; y: number }> } {
  const drawn: Array<{ image: ArtImage; x: number; y: number }> = [];
  const ctx = { drawImage: (image: ArtImage, x: number, y: number) => drawn.push({ image, x, y }) } as unknown as IsoContext;
  return { ctx, drawn };
}

const draw = (over: Partial<IsoDraw>): IsoDraw =>
  ({ asset: 'family-g', frame: 'idle', variant: 0, facing: 's', x: 100, y: 50, dim: false, tint: 0x3070c0, ...over }) as IsoDraw;
const pixel = (image: ArtImage, i: number): number => (image.data[i * 4]! << 16) | (image.data[i * 4 + 1]! << 8) | image.data[i * 4 + 2]!;

function art(): IsoArt {
  const a = new IsoArt(manifest, [atlas()], (image) => image as unknown as CanvasImageSource);
  a.look = mapLook({});
  return a;
}

describe('sprites in the isometric display (task 6.6)', () => {
  it('draws the frame of its facing and stands it on the cell centre by its ground anchor', () => {
    const a = art();
    const { ctx, drawn } = recorder();
    a.draw(ctx, draw({ facing: 's' }));
    a.draw(ctx, draw({ facing: 'w' }));
    a.draw(ctx, draw({ facing: 'e' }));
    expect(drawn.map((d) => [d.x, d.y])).toEqual([[99, 48], [100, 48], [100, 49]]);
    // Each facing has its own pixels: s and w differ in their third pixel.
    expect(pixel(drawn[0]!.image, 2)).not.toBe(pixel(drawn[1]!.image, 2));
  });

  it("recolours a family's body ramp to its row's colour, main step exactly, and keeps the outline", () => {
    const a = art();
    const { ctx, drawn } = recorder();
    a.draw(ctx, draw({}));
    expect(pixel(drawn[0]!.image, 0)).toBe(0x3070c0);
    expect(pixel(drawn[0]!.image, 2)).toBe(0x3070c0);
    expect(pixel(drawn[0]!.image, 3)).toBe(rgb(OUTLINE));
    // The light step stays lighter than the main one, in the new hue.
    a.draw(ctx, draw({ facing: 'w' }));
    const light = pixel(drawn[1]!.image, 2);
    expect(light).not.toBe(rgb(DIRECTION_RAMPS.skin[0]));
    expect((light & 0xff) > 0xc0).toBe(true);
  });

  it('keeps a recoloured frame per colour, and never recolours a class sprite', () => {
    let made = 0;
    const a = new IsoArt(manifest, [atlas()], (image) => (made++, image as unknown as CanvasImageSource));
    a.look = mapLook({});
    const { ctx, drawn } = recorder();
    a.draw(ctx, draw({}));
    a.draw(ctx, draw({}));
    a.draw(ctx, draw({ tint: 0xc03030 }));
    expect(made).toBe(2);
    expect(pixel(drawn[2]!.image, 0)).toBe(0xc03030);
    a.draw(ctx, draw({ asset: 'class-warrior', tint: 0xc03030 }));
    expect(pixel(drawn[3]!.image, 0)).toBe(rgb(DIRECTION_RAMPS.skin[1]));
  });

  it('maps every ramp step of a family and nothing else', () => {
    const map = spriteColourMap('family-q', 0x808080, 1);
    expect(Object.keys(map).sort()).toEqual([...DIRECTION_RAMPS.grass].sort());
    expect(map[DIRECTION_RAMPS.grass[1]]).toBe('#808080');
    expect(spriteColourMap('class-mage', 0x808080, 1)).toEqual({});
  });

  it("names each family's body ramp as its newest source does, for all 35 families", () => {
    const dir = 'art/assets/creature';
    const families = readdirSync(dir).filter((d) => d.startsWith('family-'));
    expect(families.length).toBe(35);
    expect(Object.keys(FAMILY_RAMPS).sort()).toEqual(families.sort());
    for (const id of families) {
      const bases = readdirSync(`${dir}/${id}`).filter((f) => /^base\.v\d+\.js$/.test(f));
      const newest = bases.sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0])).pop()!;
      const ramp = readFileSync(`${dir}/${id}/${newest}`, 'utf8').match(/recolour:\s*'(\w+)'/)?.[1];
      expect(ramp, `${id} ${newest}`).toBe(FAMILY_RAMPS[id]);
    }
  });
});

// The large families of the task 6.6 clarification, drawn in 64 x 80 frames.
const LARGE = new Set([...'ACDEFGHKOPTWjn'].map(familyId));

describe('the shipped pack (task 6.6)', () => {
  const pack = checkPack(JSON.parse(readFileSync('public/art/main/pack.json', 'utf8')));
  const tables = buildContent(resolve(import.meta.dirname, '..', 'content')).bundle.tables as Record<string, Array<{ id: string; glyph?: string }>>;
  const wanted = [
    ...tables['classes']!.map((c) => `class-${artId(c.id)}`),
    ...['rival', 'trader', 'bandit', 'hermit', 'captive'].map((role) => `npc-${role}`),
    ...new Set([...tables['monsters']!, ...tables['bosses']!].map((row) => familyId(row.glyph!))),
  ];

  it('has a sprite for every class, person and monster family', () => {
    expect(wanted).toHaveLength(60);
    for (const id of wanted) expect(pack.assets[id], id).toBeDefined();
  });

  it('draws each sprite idle in all four facings, standing on its ground anchor', () => {
    for (const id of wanted) {
      const asset = pack.assets[id]!;
      for (const facing of ['s', 'e', 'n', 'w'] as const) {
        const index = frameIndex(asset, { state: 'idle', variant: 0, frame: 0, facing });
        expect(index, `${id} ${facing}`).toBeGreaterThanOrEqual(0);
        expect(asset.anchors?.ground?.[index], `${id} ${facing} ground`).toBeDefined();
      }
      expect(asset.size, id).toEqual(LARGE.has(id) ? [64, 80] : [32, 40]);
    }
  });
});

describe('who faces where (task 6.6)', () => {
  it('takes the larger part of a direction, the vertical one on a tie', () => {
    expect(facingOf(0, 1)).toBe('s');
    expect(facingOf(1, 0)).toBe('e');
    expect(facingOf(0, -1)).toBe('n');
    expect(facingOf(-1, 0)).toBe('w');
    expect(facingOf(1, 1)).toBe('s');
    expect(facingOf(-1, -1)).toBe('n');
    expect(facingOf(-3, 1)).toBe('w');
    expect(facingOf(0, 0)).toBe('s');
  });

  it('turns the player to their last move and every other creature to the player', () => {
    const game = gameOn(room(12, 12, 6, 6));
    const { x, y } = game.state.map.player;
    game.state.monsters.push(monsterAt(x + 3, y), monsterAt(x, y + 2), monsterAt(x - 1, y - 4));
    game.state.player.facing = { dx: 1, dy: 0 };
    const draws = buildIsoDraws(game.state);
    const facing = (cx: number, cy: number): string | undefined => draws.find((d) => d.layer === 'creature' && d.cell.x === cx && d.cell.y === cy)?.facing;
    expect(facing(x, y)).toBe('e');
    expect(facing(x + 3, y)).toBe('w');
    expect(facing(x, y + 2)).toBe('n');
    expect(facing(x - 1, y - 4)).toBe('s');
  });
});
