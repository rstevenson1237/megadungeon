// The isometric display's draw list (Spec 01b; task 6.3): from the scene model, every draw of the main view in paint
// order, each with its asset, frame, screen position, layer and tint, and the glyph shape to draw when the asset is
// not loaded. It is pure: the tests check it without pixels, and `paintIso` (iso-paint.ts) puts it on a canvas.
//
// Projection: a fixed 2:1 view; cell (x, y) has its centre at ((x - y) x 16, (x + y) x 8) from the camera, so map
// north is screen up and right. Depth: cells back to front by x + y, then x; within a cell floor, floor marks, wall
// or door, feature, item, marker, creature, effects. Walls whose far side is open and known are cut to a low cap.
// Aiming and looking (task 6.4) add diamonds: footprints and the line of fire lie on the floor, and the cursors and
// the outlines of creatures in a footprint are drawn last, over everything.

import type { GameState } from '../game/game.ts';
import { ALLY_COLOUR } from '../game/monsters.ts';
import type { CellCursor, Targeting } from '../game/targeting.ts';
import type { StatusEffect } from '../rules/magic/status.ts';
import type { Point, Rect } from '../rules/world/level.ts';
import { artId, familyId } from './art-ids.ts';
import { CELL_H, CELL_W } from './grid.ts';
import { DEFAULT_LOOK, ISO, type MapLook } from './palette.ts';
import { MAIN_PANE, inner } from './panes.ts';
import { buildScene, sceneAt, type FeatureKind, type Scene, type SceneCell, type SceneOccupant, type TerrainKind } from './scene.ts';

/** A floor cell's diamond, in native pixels (Spec 01b, Projection and camera). */
export const TILE_W = 32;
export const TILE_H = 16;
/** A full wall stands this high above the floor (Spec 01b, Walls; art/direction.json); a cut wall is a low cap. */
export const WALL_H = 24;
export const CAP_H = 4;

/** The inside of the main view's border on the 900 x 640 screen: 70 x 28 cells, 630 x 448 px at (9, 16). */
const VIEW_CELLS = inner(MAIN_PANE);
export const ISO_VIEW: Rect = { x: VIEW_CELLS.x * CELL_W, y: VIEW_CELLS.y * CELL_H, w: VIEW_CELLS.w * CELL_W, h: VIEW_CELLS.h * CELL_H };
/** Where the player's drawn position sits in the view area: a little below the middle, so standing sprites have room. */
export const CAMERA_ANCHOR: Point = { x: 315, y: 260 };

/**
 * Sprite frame sizes (art/direction.json, scale), used to know what a standing thing covers once its art is loaded, so
 * a sprite reaching into the view from a cell outside it is still drawn.
 */
const FRAME = { character: [32, 40], prop: [32, 32], large: [64, 80] } as const;
/** The glyph card: a 9 x 16 glyph on an 11 x 18 card whose bottom edge stands 2 px below the cell's centre. */
export const CARD_W = CELL_W + 2;
export const CARD_H = CELL_H + 2;
/** Status icons above a head: at most three, this far apart, this high over the feet (Spec 01b, Markers). */
const ICONS_MAX = 3;
const ICON_GAP = 10;
/** A status icon's art is a 9 x 9 frame (art/briefs.yaml), drawn by the painter with its bottom edge at y + 8. */
const ICON_SIZE = 9;
const ICON_RISE = FRAME.character[1] + 6;

/**
 * What part of a cell a draw belongs to; the order here is the paint order within one cell. 'aim' is a footprint or
 * the line of fire on the floor; 'cursor' draws (a cursor, an outline) come after every cell, on top of the picture.
 */
export const ISO_LAYERS = ['floor', 'mark', 'aim', 'wall', 'feature', 'item', 'marker', 'creature', 'effect', 'cursor'] as const;
export type IsoLayer = (typeof ISO_LAYERS)[number];

/**
 * How a draw looks with no art for it (Spec 01b clarification, task 6.3): floors, stairs and liquids as flat diamonds
 * with their glyph on top, walls and doors as shaded blocks, everything else as its glyph on a standing card. A ring
 * marks an ally or a person; an icon has no glyph, so it is left out until its art is loaded.
 */
export type IsoShape = 'diamond' | 'block' | 'card' | 'ring' | 'none' | IsoAimShape;

/**
 * How aiming and looking draw (Spec 01b, Targeting and look; task 6.4): a tinted diamond (a footprint cell, a cell
 * Blink can reach), a small diamond (the line of fire), a diamond outline (the selected target, a cursor), and a
 * frame around a creature inside a footprint.
 */
export type IsoAimShape = 'tint' | 'dot' | 'outline' | 'frame';

/** What is being aimed or looked at, drawn over the picture (Spec 01b, Targeting and look). */
export interface IsoAim {
  /** Choosing a target for a shot, a spell or an ability. */
  targeting?: Targeting | null;
  /** Choosing a cell: Blink's destination or Decoy's phantom. */
  cursor?: CellCursor | null;
  /** Look's cursor (L). */
  look?: CellCursor | null;
}

/** A footprint's tint and the line of fire's small diamonds are see-through, so the floor stays readable. */
export const TINT_ALPHA = 0.3;
export const DOT_ALPHA = 0.5;
/** A cell cursor on a cell it cannot choose (out of reach, not free) draws dimmed. */
export const REFUSED_ALPHA = 0.5;

export interface IsoDraw {
  /** The level cell it belongs to. */
  cell: Point;
  layer: IsoLayer;
  /** Screen anchor in native pixels, rounded: a tile's centre, or the feet of a thing standing on the cell. */
  x: number;
  y: number;
  /** The artgen asset to draw, when the loaded pack has one for it (Spec 08, Addendum B, fallback steps 1 and 2). */
  asset: string | null;
  /** The asset's state or animation: a wall's full or cap, a door's or feature's state, a creature's idle. */
  frame: string;
  /** Which of a tile's variants (floors have four), chosen by the cell so it never flickers. */
  variant: number;
  /** The map direction a player, creature or person faces (task 6.6); terrain and things are drawn as 's'. */
  facing: IsoFacing;
  /** The colour a family sprite or shared terrain is recoloured to, and the fallback's colour. */
  tint: number;
  /** Fallback step 3: the glyph and its colour, already chosen for the cell's light. */
  shape: IsoShape;
  glyph: number;
  fg: number;
  /** A block's height above the floor. */
  height: number;
  /** 1, or 0.5 for the phantom. */
  alpha: number;
  /** Remembered: art draws at half brightness, as the text display's remembered colours are. */
  dim: boolean;
  /** Bosses use the art direction's large size. */
  large: boolean;
  /** The screen box it may cover, with art or without; draws whose box misses the view are left out. */
  box: Rect;
}

/**
 * The four map directions a sprite can face (Spec 01b, Sprites, task 6.6 clarification). Map south is toward the
 * viewer's lower left and shows the front drawing, east its mirror; west, toward the upper left, shows the back drawing,
 * north its mirror.
 */
export type IsoFacing = 's' | 'e' | 'n' | 'w';

/** The facing of a direction: its larger part, the vertical one on a tie; south for no direction. */
export function facingOf(dx: number, dy: number): IsoFacing {
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? 'n' : 's';
  return dx < 0 ? 'w' : 'e';
}

/** The camera: the level position, in cells, that the player's drawn position is (fractional while a step slides). */
export type IsoCamera = Point;

/** Cell (x, y)'s centre on the 900 x 640 screen, in whole native pixels. */
export function project(x: number, y: number, camera: IsoCamera): Point {
  const dx = x - camera.x;
  const dy = y - camera.y;
  return {
    x: Math.round(ISO_VIEW.x + CAMERA_ANCHOR.x + (dx - dy) * (TILE_W / 2)),
    y: Math.round(ISO_VIEW.y + CAMERA_ANCHOR.y + (dx + dy) * (TILE_H / 2)),
  };
}

/**
 * The level cells whose draws can touch the view, with room for the tallest sprite: a square of cells around the
 * camera, wide enough for every screen corner (the culling of each draw does the rest).
 */
export function isoArea(camera: IsoCamera): Rect {
  const halfW = Math.ceil(CAMERA_ANCHOR.x / (TILE_W / 2)) + 2; // columns of diamonds to the side edges
  const up = Math.ceil((CAMERA_ANCHOR.y + FRAME.large[1]) / (TILE_H / 2)) + 2; // rows above, tallest sprite included
  const down = Math.ceil((ISO_VIEW.h - CAMERA_ANCHOR.y) / (TILE_H / 2)) + 2;
  // x + y spans [-up, down] and x - y spans [-halfW, halfW] around the camera.
  const lo = Math.floor((-up - halfW) / 2);
  const hi = Math.ceil((down + halfW) / 2);
  const cx = Math.floor(camera.x);
  const cy = Math.floor(camera.y);
  return { x: cx + lo, y: cy + lo, w: hi - lo + 1, h: hi - lo + 1 };
}

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Is this neighbour open floor the wall would hide: known (visible or remembered), and not a wall or a door? */
function isOpen(scene: Scene, x: number, y: number): boolean {
  const kind = sceneAt(scene, x, y)?.terrain?.kind;
  return kind !== undefined && kind !== 'wall' && kind !== 'door';
}

/**
 * The cutaway (Spec 01b, Walls and doors, and the task 6.3 clarification): a wall or door is cut to a low cap when the
 * cell directly north, west or north-west of it is open and known, so a room's far walls stand and its near walls,
 * near corner included, are cut wherever the player stands.
 */
export function isCut(scene: Scene, x: number, y: number): boolean {
  return isOpen(scene, x, y - 1) || isOpen(scene, x - 1, y) || isOpen(scene, x - 1, y - 1);
}

const TERRAIN_ASSET: Readonly<Record<TerrainKind, string>> = {
  floor: 'terrain-floor',
  wall: 'terrain-wall',
  door: 'terrain-door',
  stairsUp: 'terrain-stairs-up',
  stairsDown: 'terrain-stairs-down',
  shallowWater: 'terrain-water-shallow',
  deepWater: 'terrain-water-deep',
  lava: 'terrain-lava',
};

/** Features that lie flat on the floor (debris, a floor rune, a teleporter), drawn with the floor marks. */
const FLOOR_MARKS: ReadonlySet<FeatureKind> = new Set(['debris', 'rune', 'teleporter']);

const FEATURE_ASSET: Readonly<Record<FeatureKind, string>> = {
  chest: 'feature-chest',
  sack: 'feature-sack',
  pottery: 'feature-pottery',
  rack: 'feature-weapon-rack',
  fountain: 'feature-fountain',
  altar: 'feature-altar',
  sarcophagus: 'feature-sarcophagus',
  rune: 'feature-rune',
  sign: 'feature-sign',
  graffiti: 'feature-sign',
  debris: 'terrain-debris',
  teleporter: 'terrain-teleporter',
  lever: 'feature-lever',
  totem: 'feature-spirit-totem',
};

/** The loaded pack's asset ids; null or empty when no art is loaded, so every draw takes its glyph shape. */
export type IsoPack = ReadonlySet<string> | null;

/** The fallback chain (Spec 08, Addendum B): the first of the candidate ids the pack has, else null for the glyph. */
export function resolveAsset(chain: readonly string[], pack: IsoPack): string | null {
  if (!pack) return null;
  for (const id of chain) if (pack.has(id)) return id;
  return null;
}

/** The sprites to try for whoever stands on a cell, best first (Spec 01b, Sprites; Spec 08, Addendum B). */
export function occupantChain(o: SceneOccupant, classId: string): string[] {
  const family = (glyph: string): string[] => (/^[a-zA-Z]$/.test(glyph) ? [familyId(glyph)] : []);
  switch (o.kind) {
    case 'player':
      return classId ? [`class-${artId(classId)}`] : [];
    case 'npc':
      return [`npc-${o.role}`];
    case 'creature':
      if (o.role === 'phantom') return classId ? [`class-${artId(classId)}`] : [];
      if (o.role === 'rival' || o.role === 'bandit') return [`npc-${o.role}`, ...family(o.creature.glyph)];
      return family(o.creature.glyph);
  }
}

/** Status effects shown over a head, in the Status block's order (Spec 01, Status): effects, then a Shield. */
function icons(statuses: readonly StatusEffect[], shield = 0): string[] {
  return [...statuses.map((s) => `icon-${s.id}`), ...(shield > 0 ? ['icon-shield'] : [])].slice(0, ICONS_MAX);
}

/**
 * A floor cell's variant: a stable hash of its position, so it never changes as the camera moves, taken from the hash's
 * high bits so the four variants never fall into a grid.
 */
const variantOf = (x: number, y: number): number => {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 30;
};

export interface IsoOptions {
  /** The level theme's colours and tiles (Spec 01, Rendering); the default set when omitted. */
  look?: MapLook;
  /** The loaded art pack's asset ids; none in task 6.3, so every draw takes its glyph shape. */
  pack?: IsoPack;
  /** The camera; the player's cell when omitted. */
  camera?: IsoCamera;
  /** Targeting, a cell cursor or look, when one is open. */
  aim?: IsoAim;
}

/** Every draw of the isometric main view, in paint order (back to front), culled to the view area. */
export function buildIsoDraws(state: GameState, options: IsoOptions = {}): IsoDraw[] {
  const camera = options.camera ?? state.map.player;
  const pack = options.pack ?? null;
  const scene = buildScene(state, isoArea(camera), options.look ?? DEFAULT_LOOK);
  const classId = state.player.classId;
  const known = scene.cells.filter((c): c is SceneCell => c !== null);

  const draws: IsoDraw[] = [];
  for (const cell of known) {
    const at = project(cell.x, cell.y, camera);
    const dim = cell.light === 'remembered';
    const base = { cell: { x: cell.x, y: cell.y }, x: at.x, y: at.y, variant: 0, facing: 's' as IsoFacing, height: 0, alpha: 1, dim, large: false };
    const diamondBox: Rect = { x: at.x - TILE_W / 2, y: at.y - TILE_H / 2, w: TILE_W, h: TILE_H };
    const standing = (size: readonly [number, number]): Rect => {
      const w = Math.max(size[0], CARD_W);
      const h = Math.max(size[1], CARD_H);
      return { x: at.x - Math.floor(w / 2), y: at.y + 2 - h, w, h };
    };

    const t = cell.terrain;
    if (t) {
      if (t.kind === 'wall' || t.kind === 'door') {
        const height = isCut(scene, cell.x, cell.y) ? CAP_H : WALL_H;
        // A door cut low draws its state's cap (art/briefs.yaml: closed-cap, open-cap...), as a wall draws its cap.
        const frame = t.kind === 'door' ? (height === CAP_H ? `${t.door!}-cap` : t.door!) : height === CAP_H ? 'cap' : 'full';
        draws.push({
          ...base, layer: 'wall', asset: resolveAsset([TERRAIN_ASSET[t.kind]], pack), frame, tint: t.fg,
          shape: 'block', glyph: t.glyph, fg: t.fg, height,
          box: { x: diamondBox.x, y: diamondBox.y - Math.max(height, t.kind === 'door' ? CELL_H : 0), w: TILE_W, h: TILE_H + Math.max(height, t.kind === 'door' ? CELL_H : 0) },
        });
      } else {
        const liquid = t.kind === 'shallowWater' || t.kind === 'deepWater' || t.kind === 'lava';
        const asset = resolveAsset([TERRAIN_ASSET[t.kind]], pack);
        // The rising stair's art stands on the floor, as a feature does: the floor's art is drawn under it first.
        if (t.kind === 'stairsUp' && asset && pack?.has(TERRAIN_ASSET.floor)) {
          draws.push({
            ...base, layer: 'floor', asset: TERRAIN_ASSET.floor, frame: '', variant: variantOf(cell.x, cell.y), tint: t.fg,
            shape: 'none', glyph: 0, fg: t.fg, box: diamondBox,
          });
        }
        draws.push({
          ...base, layer: 'floor', asset, frame: liquid ? 'idle' : '',
          variant: t.kind === 'floor' ? variantOf(cell.x, cell.y) : 0, tint: t.fg, shape: 'diamond', glyph: t.glyph, fg: t.fg, box: diamondBox,
        });
      }
    }
    if (cell.trap) {
      draws.push({ ...base, layer: 'mark', asset: resolveAsset(['feature-trap'], pack), frame: 'armed', tint: cell.trap.fg, shape: 'card', glyph: cell.trap.glyph, fg: cell.trap.fg, box: standing(FRAME.prop) });
    }
    const f = cell.feature;
    if (f && t?.kind === 'wall') {
      // A mark on a wall (a sign, graffiti, a rune carved in it; Spec 06) is drawn over the wall block, on the face it
      // is read from, or on the top of the wall's cap when the wall is cut (task 6.7).
      const face = isCut(scene, cell.x, cell.y) ? 'cap' : isOpen(scene, cell.x, cell.y + 1) || !isOpen(scene, cell.x + 1, cell.y) ? 'left' : 'right';
      const rune = f.kind === 'rune';
      draws.push({
        ...base, layer: 'feature', asset: resolveAsset([rune ? 'feature-wall-rune' : 'feature-sign'], pack), frame: rune && f.state === 'spent' ? `${face}-spent` : face,
        tint: f.fg, shape: 'card', glyph: f.glyph, fg: f.fg, box: { x: diamondBox.x, y: diamondBox.y - WALL_H, w: TILE_W, h: TILE_H + WALL_H },
      });
    } else if (f) {
      // Debris and the teleporter are terrain art of one state (task 6.5): searched or spent, they draw the same.
      const oneState = FEATURE_ASSET[f.kind].startsWith('terrain-');
      draws.push({
        ...base, layer: FLOOR_MARKS.has(f.kind) ? 'mark' : 'feature', asset: resolveAsset([FEATURE_ASSET[f.kind]], pack), frame: oneState ? '' : f.state ?? '',
        tint: f.fg, shape: 'card', glyph: f.glyph, fg: f.fg, box: standing(FRAME.prop),
      });
    }
    if (cell.item) {
      const it = cell.item;
      draws.push({ ...base, layer: 'item', asset: resolveAsset(it.cls ? [`family-${it.cls}`] : [], pack), frame: '', tint: it.fg, shape: 'card', glyph: it.glyph, fg: it.fg, box: standing(FRAME.prop) });
    }
    const o = cell.occupant;
    if (o) {
      const large = o.kind === 'creature' && o.role === 'boss';
      const size = large ? FRAME.large : FRAME.character;
      // A ring under an ally (the ally colour) or a person (their role colour), Spec 01b, Markers.
      const ringColour = o.kind === 'npc' ? o.fg : o.kind === 'creature' && o.role === 'ally' ? ALLY_COLOUR : o.kind === 'creature' && (o.role === 'rival' || o.role === 'bandit') ? o.fg : null;
      if (ringColour !== null) {
        draws.push({ ...base, layer: 'marker', asset: null, frame: '', tint: ringColour, shape: 'ring', glyph: 0, fg: ringColour, box: { x: at.x - 12, y: at.y - 6, w: 24, h: 12 } });
      }
      // The player faces their last move or attack; until task 6.8 tracks every last step, others face the player.
      const me = state.map.player;
      const facing = o.kind === 'player' ? facingOf(state.player.facing.dx, state.player.facing.dy) : facingOf(me.x - cell.x, me.y - cell.y);
      const asset = resolveAsset(occupantChain(o, classId), pack);
      // A family's sprite may be drawn in the large frame (a giant, a dragon), so its box allows for it.
      const box = standing(asset?.startsWith('family-') ? FRAME.large : size);
      draws.push({
        ...base, layer: 'creature', asset, frame: 'idle', facing, tint: o.fg,
        shape: 'card', glyph: o.glyph, fg: o.fg, alpha: o.kind === 'creature' && o.role === 'phantom' ? 0.5 : 1, large, box,
      });
      const shown = o.kind === 'player' ? icons(state.player.statuses, state.player.shield) : o.kind === 'creature' ? icons(o.creature.statuses) : [];
      shown.forEach((id, i) => {
        const ix = at.x + Math.round((i - (shown.length - 1) / 2) * ICON_GAP);
        const iy = at.y - (large ? FRAME.large[1] + 6 : ICON_RISE);
        draws.push({ ...base, x: ix, y: iy, layer: 'effect', asset: resolveAsset([id], pack), frame: '', tint: 0xffffff, shape: 'none', glyph: 0, fg: 0xffffff, box: { x: ix - 4, y: iy - 1, w: ICON_SIZE, h: ICON_SIZE } });
      });
    }
  }
  const aim = options.aim ?? {};
  draws.push(...floorAim(aim, camera));
  // Back to front by cell, then by layer within a cell (the sort is stable, so a cell's draws keep their order otherwise).
  const order = new Map(ISO_LAYERS.map((l, i) => [l, i]));
  draws.sort((a, b) => a.cell.x + a.cell.y - (b.cell.x + b.cell.y) || a.cell.x - b.cell.x || order.get(a.layer)! - order.get(b.layer)!);
  draws.push(...cursorDraws(aim, camera, draws));
  return draws.filter((d) => overlaps(d.box, ISO_VIEW));
}

/** One aiming draw on cell `p`: a diamond-sized box, no asset and no glyph. */
function aimDraw(p: { x: number; y: number }, camera: IsoCamera, layer: IsoLayer, shape: IsoAimShape, colour: number, alpha: number): IsoDraw {
  const at = project(p.x, p.y, camera);
  return {
    cell: { x: p.x, y: p.y }, layer, x: at.x, y: at.y, asset: null, frame: '', variant: 0, facing: 's', tint: colour, shape, glyph: 0, fg: colour,
    height: 0, alpha, dim: false, large: false, box: { x: at.x - TILE_W / 2, y: at.y - TILE_H / 2, w: TILE_W, h: TILE_H },
  };
}

/**
 * What aiming lays on the floor (Spec 01b, Targeting): an area footprint as tinted diamonds and the line of fire as
 * small dim diamonds, both ends left out; Blink's and Decoy's reachable cells tinted as a footprint is.
 */
function floorAim(aim: IsoAim, camera: IsoCamera): IsoDraw[] {
  const out: IsoDraw[] = [];
  const t = aim.targeting;
  if (t) {
    for (const c of t.footprint()) out.push(aimDraw(c, camera, 'aim', 'tint', ISO.target, TINT_ALPHA));
    for (const c of t.path()) out.push(aimDraw(c, camera, 'aim', 'dot', ISO.target, DOT_ALPHA));
  }
  for (const c of aim.cursor?.cells ?? []) out.push(aimDraw(c, camera, 'aim', 'tint', ISO.target, TINT_ALPHA));
  return out;
}

/**
 * What is drawn over the whole picture: the creatures inside a footprint framed, the selected target's diamond
 * outline in the targeting colour, a cell cursor's outline (dimmed where it cannot choose), and look's outline in the
 * look colour. `drawn` is the picture so far, for the boxes of the creatures to frame.
 */
function cursorDraws(aim: IsoAim, camera: IsoCamera, drawn: readonly IsoDraw[]): IsoDraw[] {
  const out: IsoDraw[] = [];
  const t = aim.targeting;
  if (t) {
    for (const m of t.marked()) {
      const body = drawn.find((d) => d.layer === 'creature' && d.cell.x === m.x && d.cell.y === m.y);
      if (body) out.push({ ...aimDraw(m, camera, 'cursor', 'frame', ISO.target, 1), box: body.box });
    }
    out.push(aimDraw(t.selected, camera, 'cursor', 'outline', ISO.target, 1));
  }
  const c = aim.cursor;
  if (c) out.push(aimDraw(c.at, camera, 'cursor', 'outline', ISO.target, c.ok ? 1 : REFUSED_ALPHA));
  if (aim.look) out.push(aimDraw(aim.look.at, camera, 'cursor', 'outline', ISO.look, 1));
  return out;
}

/**
 * Whether a cell's centre is on screen, above the bottom row that look's description takes: where look's cursor may
 * go in the isometric display, as the text display keeps it within the main view (Spec 01, Addendum A).
 */
export function isoOnScreen(p: Point, camera: IsoCamera): boolean {
  const at = project(p.x, p.y, camera);
  return at.x >= ISO_VIEW.x && at.x < ISO_VIEW.x + ISO_VIEW.w && at.y >= ISO_VIEW.y && at.y < ISO_VIEW.y + ISO_VIEW.h - CELL_H;
}
