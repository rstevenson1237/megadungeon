// The main view's map (Spec 01, "Main view and camera"): unseen cells blank, remembered
// cells dimmed, visible cells in full colour. Draw order per cell: terrain, feature, item,
// monster or player, then the targeting overlay.

import type { GameState } from '../game/game.ts';
import type { Item } from '../rules/items/types.ts';
import type { Loot } from '../rules/world/level.ts';
import type { CellCursor, Targeting } from '../game/targeting.ts';
import { TILE } from '../rules/world/level.ts';
import { GLYPH, toCp437 } from './cp437.ts';
import { cameraOrigin } from './camera.ts';
import { COLS, type Grid } from './grid.ts';
import { ITEM_COLOURS, MAP, NPC_LOOK, TARGET } from './palette.ts';
import { MAIN_PANE, inner } from './panes.ts';

const GLYPH_PLAYER = 64;
const GLYPH_FLOOR = 250;
const GLYPH_WALL = 35;
const GLYPH_UP = 60;
const GLYPH_DOWN = 62;
const GLYPH_DOOR_CLOSED = 43;
const GLYPH_DOOR_OPEN = 39;
const GLYPH_SHALLOW = 126;
const GLYPH_LIQUID = 247;
const GLYPH_TRAP = 94; // ^

/** Glyph and colour pair for a terrain character in one of its two drawn states. */
function terrain(tile: string, visible: boolean, open: boolean): [number, number] {
  const state = visible ? 'visible' : 'remembered';
  switch (tile) {
    case TILE.wall:
      return [GLYPH_WALL, MAP.wall[state]];
    case TILE.stairsUp:
      return [GLYPH_UP, MAP.stairs[state]];
    case TILE.stairsDown:
      return [GLYPH_DOWN, MAP.stairs[state]];
    case TILE.door:
      return [open ? GLYPH_DOOR_OPEN : GLYPH_DOOR_CLOSED, MAP.door[state]];
    case TILE.shallowWater:
      return [GLYPH_SHALLOW, MAP.shallowWater[state]];
    case TILE.deepWater:
      return [GLYPH_LIQUID, MAP.deepWater[state]];
    case TILE.lava:
      return [GLYPH_LIQUID, MAP.lava[state]];
    default:
      return [GLYPH_FLOOR, MAP.floor[state]];
  }
}

export function drawMap(grid: Grid, state: GameState, targeting: Targeting | null = null, cursor: CellCursor | null = null): void {
  const view = inner(MAIN_PANE);
  const { level, exploration, visible, player, openDoors } = state.map;
  const origin = cameraOrigin(level.width, level.height, player, view.w, view.h);
  const open = new Set(openDoors);
  // Hidden things the player has found (Spec 04, Detect; Spec 06): secret doors draw as doors, traps as ^.
  const found = new Set(state.revealed);
  const secrets = new Set(level.doors.filter((d) => d.kind === 'secret' && found.has(d.y * level.width + d.x)).map((d) => d.y * level.width + d.x));
  // A found trap that is still there draws as ^ (disarmed and sprung ones are gone).
  const traps = new Set(
    [
      ...level.traps.filter((t) => !state.used.disarmed.includes(t.y * level.width + t.x)),
      ...level.features.filter((f, i) => f.type === 'container' && f.trap && !state.used.features[i]?.trapGone),
    ]
      .map((p) => p.y * level.width + p.x)
      .filter((i) => found.has(i)),
  );
  const things = featureGlyphs(state);
  const piles = pileGlyphs(state);
  // Level cell to screen cell, or null when off the window.
  const screen = (x: number, y: number): [number, number] | null => {
    const sx = x - origin.x;
    const sy = y - origin.y;
    return sx < 0 || sy < 0 || sx >= view.w || sy >= view.h ? null : [view.x + sx, view.y + sy];
  };

  for (let vy = 0; vy < view.h; vy++) {
    for (let vx = 0; vx < view.w; vx++) {
      const lx = origin.x + vx;
      const ly = origin.y + vy;
      if (lx < 0 || ly < 0 || lx >= level.width || ly >= level.height) continue;
      const i = ly * level.width + lx;
      if (!exploration.explored[i]) continue;
      // A secret door that was found draws as a door, closed or open.
      const tile = secrets.has(i) ? TILE.door : level.tiles[ly]![lx]!;
      const [glyph, fg] = terrain(tile, visible[i] === 1, open.has(i));
      grid.set(view.x + vx, view.y + vy, glyph, fg, MAP.background);
      if (traps.has(i)) grid.set(view.x + vx, view.y + vy, GLYPH_TRAP, MAP.trap[visible[i] === 1 ? 'visible' : 'remembered'], MAP.background);
      // Features, then loose items (visible cells only), under any monster (Spec 01, draw order).
      const thing = things.get(i);
      if (thing) {
        const light = visible[i] === 1 && !thing.dim ? 'visible' : 'remembered';
        grid.set(view.x + vx, view.y + vy, thing.glyph, thing.colour[light], MAP.background);
      }
      const pile = visible[i] === 1 ? piles.get(i) : undefined;
      if (pile) grid.set(view.x + vx, view.y + vy, pile.glyph, pile.colour, MAP.background);
    }
  }

  // People who do not fight: traders, hermits and captives not yet freed (Spec 04, Spec 07).
  level.npcs.forEach((npc, i) => {
    const look = NPC_LOOK[npc.kind];
    const at = screen(npc.x, npc.y);
    if (look && at && visible[npc.y * level.width + npc.x] && !state.used.npcs[i]?.freed) grid.set(at[0], at[1], toCp437(look.glyph), look.colour, MAP.background);
  });

  // Monsters show only on visible cells, never on remembered ones.
  for (const m of state.monsters) {
    const at = screen(m.x, m.y);
    if (at && visible[m.y * level.width + m.x]) grid.set(at[0], at[1], toCp437(m.glyph), m.colour, MAP.background);
  }
  const me = screen(player.x, player.y);
  if (me) grid.set(me[0], me[1], GLYPH_PLAYER, MAP.player, MAP.background);

  if (targeting) drawTargeting(grid, targeting, screen);
  if (cursor) drawCursor(grid, cursor, screen);
}

/** Blink's cell choice: every valid destination tinted, the cursor on top. */
function drawCursor(grid: Grid, c: CellCursor, screen: (x: number, y: number) => [number, number] | null): void {
  for (const p of c.cells) {
    const at = screen(p.x, p.y);
    if (at) grid.setBg(at[0], at[1], TARGET.footprintBg);
  }
  const at = screen(c.at.x, c.at.y);
  if (at) grid.setBg(at[0], at[1], c.ok ? TARGET.selectedBg : TARGET.markedBg);
}

function drawTargeting(grid: Grid, t: Targeting, screen: (x: number, y: number) => [number, number] | null): void {
  for (const c of t.footprint()) {
    const at = screen(c.x, c.y);
    if (at) grid.setBg(at[0], at[1], TARGET.footprintBg);
  }
  for (const c of t.path()) {
    const at = screen(c.x, c.y);
    if (at) grid.set(at[0], at[1], GLYPH_FLOOR, TARGET.path, grid.bg[at[1] * COLS + at[0]]!);
  }
  for (const m of t.marked()) {
    const at = screen(m.x, m.y);
    if (at) grid.setBg(at[0], at[1], TARGET.markedBg);
  }
  const sel = screen(t.selected.x, t.selected.y);
  if (sel) grid.set(sel[0], sel[1], toCp437(t.selected.glyph), TARGET.selectedFg, TARGET.selectedBg);
}

interface Thing {
  glyph: number;
  colour: { visible: number; remembered: number };
  /** Drawn dimmed even when seen: a looted container or a spent rune (Spec 06). */
  dim?: boolean;
}

const CONTAINER_GLYPH = { chest: GLYPH.chest, sack: GLYPH.sack, pottery: GLYPH.pottery, rack: GLYPH.weaponRack } as const;
const FIXTURE_GLYPH = { fountain: GLYPH.fountain, altar: GLYPH.altar, sarcophagus: GLYPH.sarcophagus, rune: GLYPH.rune } as const;

/** What stands on each cell of the level besides terrain: containers, fixtures, debris, wall marks and specials (Spec 01, core glyph table). */
function featureGlyphs(state: GameState): Map<number, Thing> {
  const { level } = state.map;
  const { looted, used } = state;
  const at = (p: { x: number; y: number }): number => p.y * level.width + p.x;
  const things = new Map<number, Thing>();
  for (const cell of used.collapsed) things.set(cell, { glyph: GLYPH.debris, colour: MAP.debris });
  level.features.forEach((f, i) => {
    if (f.type === 'debris') things.set(at(f), { glyph: GLYPH.debris, colour: MAP.debris });
    else if (f.type === 'container') things.set(at(f), { glyph: CONTAINER_GLYPH[f.kind], colour: MAP.container, dim: looted.features.includes(i) });
    else things.set(at(f), { glyph: FIXTURE_GLYPH[f.kind], colour: f.kind === 'rune' ? MAP.rune : MAP.fixture, dim: used.features[i]?.done === true });
  });
  for (const m of level.lore) things.set(at(m), { glyph: m.kind === 'rune' ? GLYPH.rune : GLYPH.sign, colour: m.kind === 'rune' ? MAP.rune : MAP.sign, dim: m.kind === 'rune' && used.marks.includes(level.lore.indexOf(m)) });
  for (const s of level.specials) {
    if (s.kind === 'teleporter') things.set(at(s), { glyph: GLYPH.teleporter, colour: MAP.special });
    else if (s.kind === 'lever') things.set(at(s), { glyph: GLYPH.rod, colour: MAP.special, dim: used.lever });
  }
  return things;
}

/** The glyph of an item on the floor, by what it is. */
function itemGlyph(item: Item): number {
  switch (item.kind) {
    case 'weapon':
    case 'ranged':
    case 'ammo':
      return GLYPH.weapon;
    case 'armour':
    case 'shield':
      return GLYPH.armour;
    case 'clothing':
      return GLYPH.clothing;
    case 'ring':
      return GLYPH.ring;
    case 'potion':
      return GLYPH.potion;
    case 'wand':
    case 'rod':
    case 'staff':
      return GLYPH.rod;
    case 'key':
    case 'vault_key':
      return GLYPH.key;
    case 'gem':
      return GLYPH.gems;
    case 'jewelry':
      return GLYPH.jewelry;
    case 'book':
    case 'spellbook':
    case 'map_fragment':
      return GLYPH.book;
    default:
      return 42; // *
  }
}

function lootGlyph(loot: Loot): number {
  switch (loot.kind) {
    case 'coins':
      return GLYPH.coins;
    case 'gem':
      return GLYPH.gems;
    case 'jewelry':
      return GLYPH.jewelry;
    case 'magic':
      return GLYPH.potion;
    case 'book':
    case 'map_fragment':
      return GLYPH.book;
    case 'weapon':
      return GLYPH.weapon;
    case 'key':
    case 'vault_key':
      return GLYPH.key;
    case 'item':
      return itemGlyph(loot.item);
    default:
      return 42;
  }
}

/** Loose piles on the floor: the level's own that nobody has emptied, and what was dropped, thrown or fell from the dead. */
function pileGlyphs(state: GameState): Map<number, { glyph: number; colour: number }> {
  const { level } = state.map;
  const piles = new Map<number, { glyph: number; colour: number }>();
  const add = (p: { x: number; y: number; contents: Loot[] }): void => {
    const first = p.contents[0];
    if (first) piles.set(p.y * level.width + p.x, { glyph: lootGlyph(first), colour: first.kind === 'coins' ? ITEM_COLOURS.coins : ITEM_COLOURS.other });
  };
  level.piles.forEach((p, i) => {
    if (!state.looted.piles.includes(i)) add(p);
  });
  for (const p of state.drops) add(p);
  return piles;
}
