// Painting the isometric draw list (Spec 01b; task 6.3) on the picture's canvas, which sits under the text canvas at
// the same native size. Each draw takes its art when a sprite source can draw it, else its glyph shape: a flat
// diamond with its glyph, a shaded block, a ring, or the glyph on a small dark standing card. Shapes are filled in
// whole-pixel spans, never anti-aliased paths, so they stay crisp when the screen scales. `paintPicture` (task 6.4)
// adds the compass and, while an overlay is open, dims the picture to 40%.

import type { Atlas } from './atlas.ts';
import { cssColor } from './atlas.ts';
import { CELL_H, CELL_W } from './grid.ts';
import { CARD_H, CARD_W, ISO_VIEW, TILE_H, TILE_W, type IsoDraw } from './iso-view.ts';
import { ISO } from './palette.ts';

/** The slice of CanvasRenderingContext2D the painter uses. */
export interface IsoContext {
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage: CanvasDrawImage['drawImage'];
  save(): void;
  restore(): void;
  beginPath(): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
}

/** Draws loaded art (tasks 6.5 to 6.9); returns false when it cannot, and the glyph shape is drawn instead. */
export interface SpriteSource {
  draw(ctx: IsoContext, draw: IsoDraw): boolean;
  /** Whether this draw's art lies flat in its cell's diamond, so nothing drawn later can be behind it (task 6.10). */
  flat?(draw: IsoDraw): boolean;
  /** What the art's look is now (the theme it is recoloured to), so the floor layer is painted again when it changes. */
  readonly key?: string;
}

/** A canvas the floor layer is kept on: the picture's native size, transparent. */
export interface LayerCanvas {
  image: CanvasImageSource;
  ctx: IsoContext & { clearRect(x: number, y: number, w: number, h: number): void };
}

/**
 * The cached floor layer (task 6.10; plan, Risks: "a cached terrain layer"): the flat floor tiles that do not animate,
 * painted once on a canvas of their own and copied under the rest of the picture, until a tile, the camera or the theme
 * changes. A flat tile lies inside its own diamond, and diamonds do not overlap, so painting every one of them before
 * anything that stands up gives the same picture as painting them in depth order.
 */
export class FloorLayer {
  private layer: LayerCanvas | null = null;
  private key = '';
  /** How many times the layer was painted afresh, for the tests. */
  repaints = 0;

  constructor(private readonly make: () => LayerCanvas) {}

  /** Paint the flat draws on the layer if they changed, and return it. */
  layerFor(flat: readonly IsoDraw[], atlas: Atlas, sprites: SpriteSource | undefined): CanvasImageSource {
    let key = sprites?.key ?? '';
    for (const d of flat) key += `|${d.x},${d.y},${d.asset},${d.frame},${d.variant},${d.dim ? 1 : 0},${d.tint},${d.glyph},${d.fg}`;
    if (!this.layer) this.layer = this.make();
    if (key !== this.key) {
      this.key = key;
      this.repaints++;
      const { ctx } = this.layer;
      ctx.clearRect(ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
      ctx.clip();
      for (const d of flat) paintDraw(ctx, d, atlas, sprites);
      ctx.restore();
    }
    return this.layer.image;
  }
}

/** Does this draw lie flat in its diamond and stay still, so it can go on the floor layer? */
function isFlat(d: IsoDraw, sprites: SpriteSource | undefined): boolean {
  if (d.layer !== 'floor' || d.t !== 0 || d.alpha !== 1) return false;
  if (d.asset && sprites) return sprites.flat?.(d) ?? false;
  return d.shape === 'diamond' || d.shape === 'none';
}

/** A colour scaled toward black: `k` of its brightness. */
export const shade = (rgb: number, k: number): number =>
  (Math.round(((rgb >> 16) & 0xff) * k) << 16) | (Math.round(((rgb >> 8) & 0xff) * k) << 8) | Math.round((rgb & 0xff) * k);

/** Flat floor diamonds are this much of their glyph's colour, so floors stay low in contrast (art/direction.json). */
const FLOOR_FILL = 0.35;
/** A block's faces: the top in its colour, the side faces darker, lit from the north-west (art/direction.json light). */
const LEFT_FACE = 0.7;
const RIGHT_FACE = 0.5;
/** A door's block is this much of its glyph's colour. */
const DOOR_BLOCK = 0.45;
const RING_W = 24;
const RING_H = 12;

/** Walls draw full or cap; a door's frame is its state. */
const isDoor = (d: IsoDraw): boolean => d.frame !== 'full' && d.frame !== 'cap';

/** Half the width of row `r` of a 2:1 diamond `h` rows high: 2 at the tips, `h` across the middle. */
const halfWidth = (r: number, h = TILE_H): number => (r < h / 2 ? 2 * (r + 1) : 2 * (h - r));

/** A filled 2:1 diamond centred on (x, y), `h` rows high: a floor tile, or a smaller one. */
function diamond(ctx: IsoContext, x: number, y: number, colour: number, h = TILE_H): void {
  ctx.fillStyle = cssColor(colour);
  for (let r = 0; r < h; r++) {
    const hw = halfWidth(r, h);
    ctx.fillRect(x - hw, y - h / 2 + r, hw * 2, 1);
  }
}

/** The line of fire's small diamond: a quarter of a tile. */
const DOT_H = TILE_H / 4;

/** A tile's diamond outline: two pixels at each end of every row, so its 2:1 edges join up. */
function outline(ctx: IsoContext, x: number, y: number, colour: number): void {
  ctx.fillStyle = cssColor(colour);
  for (let r = 0; r < TILE_H; r++) {
    const hw = halfWidth(r);
    ctx.fillRect(x - hw, y - TILE_H / 2 + r, 2, 1);
    ctx.fillRect(x + hw - 2, y - TILE_H / 2 + r, 2, 1);
  }
}

/** A one-pixel frame around a box: a creature inside a footprint. */
function frame(ctx: IsoContext, box: { x: number; y: number; w: number; h: number }, colour: number): void {
  ctx.fillStyle = cssColor(colour);
  ctx.fillRect(box.x - 1, box.y - 1, box.w + 2, 1);
  ctx.fillRect(box.x - 1, box.y + box.h, box.w + 2, 1);
  ctx.fillRect(box.x - 1, box.y, 1, box.h);
  ctx.fillRect(box.x + box.w, box.y, 1, box.h);
}

/** A block one cell wide and `h` px high on the diamond centred at (x, y): two side faces, then the top. */
function block(ctx: IsoContext, x: number, y: number, h: number, colour: number): void {
  const half = TILE_W / 2;
  ctx.fillStyle = cssColor(shade(colour, LEFT_FACE));
  for (let k = 0; k < half; k++) {
    const bottom = y + (k >> 1);
    ctx.fillRect(x - half + k, bottom - h, 1, h + 1);
  }
  ctx.fillStyle = cssColor(shade(colour, RIGHT_FACE));
  for (let j = 0; j < half; j++) {
    const bottom = y + ((half - 1 - j) >> 1);
    ctx.fillRect(x + j, bottom - h, 1, h + 1);
  }
  diamond(ctx, x, y - h, colour);
}

/** An ellipse outline around the feet, one pixel wide. */
function ring(ctx: IsoContext, x: number, y: number, colour: number): void {
  ctx.fillStyle = cssColor(colour);
  const a = RING_W / 2;
  const b = RING_H / 2;
  const width = (dy: number): number => Math.round(a * Math.sqrt(1 - (dy / b) ** 2));
  for (let dy = -b; dy <= b; dy++) {
    const w = width(Math.abs(dy));
    if (Math.abs(dy) === b) {
      ctx.fillRect(x - w, y + dy, 2 * w, 1);
      continue;
    }
    // The arc on this row runs from the next row out's width to this row's.
    const s = Math.max(1, w - width(Math.abs(dy) + 1));
    ctx.fillRect(x - w, y + dy, s, 1);
    ctx.fillRect(x + w - s, y + dy, s, 1);
  }
}

/** The glyph on a small dark upright card standing on the cell, its bottom edge 2 px below the feet. */
function card(ctx: IsoContext, atlas: Atlas, x: number, y: number, glyph: number, fg: number): void {
  const left = x - Math.floor(CARD_W / 2);
  const top = y + 2 - CARD_H;
  ctx.fillStyle = cssColor(ISO.card);
  ctx.fillRect(left, top, CARD_W, CARD_H);
  atlas.draw(ctx, glyph, fg, left + 1, top + 1);
}

/** A glyph laid flat on a tile, centred on (x, y): a floor's dot, a stair, a door on its block. */
const flatGlyph = (ctx: IsoContext, atlas: Atlas, x: number, y: number, glyph: number, fg: number): void =>
  atlas.draw(ctx, glyph, fg, x - Math.floor(CELL_W / 2), y - CELL_H / 2);

/**
 * Paint the draw list into the view area: the background, then every draw back to front, clipped to the view. With a
 * floor layer, the flat still floor tiles come from it, painted once, and only the rest is drawn each frame.
 */
export function paintIso(ctx: IsoContext, draws: readonly IsoDraw[], atlas: Atlas, sprites?: SpriteSource, floor?: FloorLayer): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
  ctx.clip();
  ctx.fillStyle = cssColor(ISO.background);
  ctx.fillRect(ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
  let rest = draws;
  if (floor) {
    const flat = draws.filter((d) => isFlat(d, sprites));
    ctx.globalAlpha = 1;
    ctx.drawImage(floor.layerFor(flat, atlas, sprites), ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h, ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
    rest = draws.filter((d) => !isFlat(d, sprites));
  }
  for (const d of rest) paintDraw(ctx, d, atlas, sprites);
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** Paint one draw: its art when the sprite source can draw it, else its glyph shape. */
function paintDraw(ctx: IsoContext, d: IsoDraw, atlas: Atlas, sprites: SpriteSource | undefined): void {
  ctx.globalAlpha = d.alpha;
  if (d.asset && sprites?.draw(ctx, d)) return;
  switch (d.shape) {
    case 'diamond':
      diamond(ctx, d.x, d.y, shade(d.fg, FLOOR_FILL));
      flatGlyph(ctx, atlas, d.x, d.y, d.glyph, d.fg);
      break;
    case 'block':
      if (isDoor(d)) {
        // A door's block is darker, so its glyph (closed or open) reads on its top.
        block(ctx, d.x, d.y, d.height, shade(d.fg, DOOR_BLOCK));
        flatGlyph(ctx, atlas, d.x, d.y - d.height, d.glyph, d.fg);
      } else block(ctx, d.x, d.y, d.height, d.fg);
      break;
    case 'ring':
      ring(ctx, d.x, d.y, d.fg);
      break;
    case 'card':
      card(ctx, atlas, d.x, d.y, d.glyph, d.fg);
      break;
    case 'glyph':
      // An effect with no art yet: its glyph centred on its point, with no card (task 6.8).
      atlas.draw(ctx, d.glyph, d.fg, d.x - Math.floor(CELL_W / 2), d.y - CELL_H / 2);
      break;
    case 'tint':
      diamond(ctx, d.x, d.y, d.fg);
      break;
    case 'dot':
      diamond(ctx, d.x, d.y, d.fg, DOT_H);
      break;
    case 'outline':
      outline(ctx, d.x, d.y, d.fg);
      break;
    case 'frame':
      frame(ctx, d.box, d.fg);
      break;
    case 'none':
      break;
  }
}

/** What the picture canvas shows of a level: its draw list, and whether an overlay is open over it. */
export interface IsoPicture {
  draws: readonly IsoDraw[];
  /** An overlay is open: the picture stays, dimmed to 40% (Spec 01b, Layout). */
  dimmed: boolean;
}

/** The compass's base, in the view area's top right corner, and its arrow's length along the 2:1 slope. */
const COMPASS_LEN = 12;
export const COMPASS_BASE = { x: ISO_VIEW.x + ISO_VIEW.w - 28, y: ISO_VIEW.y + 26 } as const;
const GLYPH_N = 78;

/**
 * The compass (Spec 01b, Layout): a small arrow pointing to map north, up and to the right on screen along a
 * diamond's edge, with an N past its tip.
 */
function compass(ctx: IsoContext, atlas: Atlas): void {
  const { x, y } = COMPASS_BASE;
  ctx.fillStyle = cssColor(ISO.compass);
  for (let k = 0; k <= COMPASS_LEN; k++) ctx.fillRect(x + k, y - (k >> 1), 1, 1);
  const tip = { x: x + COMPASS_LEN, y: y - (COMPASS_LEN >> 1) };
  // The head: a short stroke back to the left and one down from the tip.
  ctx.fillRect(tip.x - 4, tip.y, 4, 1);
  ctx.fillRect(tip.x, tip.y + 1, 1, 3);
  atlas.draw(ctx, GLYPH_N, ISO.compass, tip.x + 2, tip.y - CELL_H + 2);
}

/** Paint a level's picture: the draw list, the compass, and the dimming while an overlay is open. */
export function paintPicture(ctx: IsoContext, picture: IsoPicture, atlas: Atlas, sprites?: SpriteSource, floor?: FloorLayer): void {
  paintIso(ctx, picture.draws, atlas, sprites, floor);
  compass(ctx, atlas);
  if (!picture.dimmed) return;
  ctx.globalAlpha = ISO.dim;
  ctx.fillStyle = cssColor(0x000000);
  ctx.fillRect(ISO_VIEW.x, ISO_VIEW.y, ISO_VIEW.w, ISO_VIEW.h);
  ctx.globalAlpha = 1;
}
