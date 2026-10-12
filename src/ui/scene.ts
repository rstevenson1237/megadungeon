// The scene model (Spec 01b, Tests; task 6.2): one description of what the main view shows on each cell, read by
// both displays. A cell lists its light (visible or remembered), its terrain with a door's state, a found trap, its
// feature with its state, the top loose item and whoever stands on it, each layer with what it is (for the
// isometric display's sprites) and the glyph and colour the text display draws it in. Unseen cells are left out.
// Remembered cells carry no creatures or loose items (Spec 01, "Main view and camera").

import type { GameState } from '../game/game.ts';
import type { Monster } from '../game/monsters.ts';
import type { Item } from '../rules/items/types.ts';
import { TILE, type Loot, type Rect } from '../rules/world/level.ts';
import { GLYPH, toCp437 } from './cp437.ts';
import { DEFAULT_LOOK, ITEM_COLOURS, MAP, NPC_LOOK, type MapLook } from './palette.ts';

/** How a known cell is lit: in sight now, or remembered from before. */
export type Light = 'visible' | 'remembered';

/** A layer as the text display draws it: a CP437 glyph and its colour, already chosen for the cell's light. */
export interface Drawn {
  glyph: number;
  fg: number;
}

export type TerrainKind = 'floor' | 'wall' | 'door' | 'stairsUp' | 'stairsDown' | 'shallowWater' | 'deepWater' | 'lava';
/** A door as look names it (Spec 01, Addendum A; Spec 01b, Walls and doors); a forced one is broken. */
export type DoorState = 'closed' | 'open' | 'locked' | 'sealed' | 'broken';

export interface SceneTerrain extends Drawn {
  kind: TerrainKind;
  door?: DoorState;
}

/** What stands on a cell besides terrain: containers, fixtures, wall marks, debris, specials and the Spirit Totem. */
export type FeatureKind =
  | 'chest' | 'sack' | 'pottery' | 'rack'
  | 'fountain' | 'altar' | 'sarcophagus' | 'rune'
  | 'sign' | 'graffiti' | 'debris' | 'teleporter' | 'lever' | 'totem';

export interface SceneFeature extends Drawn {
  kind: FeatureKind;
  /** Its state as the look description names it (Spec 01, Addendum A): open, looted, smashed, dry, offered, spent, pulled. */
  state?: string;
  /** Drawn dimmed even when seen: a looted container, a used fixture, a spent rune, a pulled lever (Spec 06). */
  dim: boolean;
}

/**
 * Floor item glyph classes (Spec 01 core glyph table; Spec 08, Addendum B, fallback step 2), named as the art's
 * family ids are (`family-potion`). A thing with no class (an artifact, the lift token) draws by its glyph alone.
 */
export type ItemClass =
  | 'coins' | 'gems' | 'jewelry' | 'potion' | 'ring' | 'rod' | 'weapon'
  | 'armour' | 'clothing' | 'book' | 'key' | 'ammunition' | 'quest-item';

export interface SceneItem extends Drawn {
  /** The top thing of the pile, as the text display draws only that one. */
  loot: Loot;
  cls?: ItemClass;
}

/** A creature's place in the scene, for its marker (Spec 01b, Sprites): an ally's ring, the phantom, a boss's size. */
export type CreatureRole = 'monster' | 'boss' | 'bandit' | 'rival' | 'ally' | 'phantom';

export type SceneOccupant =
  | (Drawn & { kind: 'player' })
  | (Drawn & { kind: 'creature'; creature: Monster; role: CreatureRole })
  | (Drawn & { kind: 'npc'; role: 'trader' | 'hermit' | 'captive'; index: number });

export interface SceneCell {
  x: number;
  y: number;
  light: Light;
  /** Absent only on the player's own cell if it was never explored, which never happens in play. */
  terrain?: SceneTerrain;
  /** A found trap still armed (Spec 06), on the floor or on a container. */
  trap?: Drawn;
  feature?: SceneFeature;
  /** Visible cells only. */
  item?: SceneItem;
  /** Visible cells only, except the player, who is always there. */
  occupant?: SceneOccupant;
}

/** The scene over a window of level cells, row by row; null where a cell is unseen or off the level. */
export interface Scene {
  area: Rect;
  cells: (SceneCell | null)[];
}

/** The cell at level (x, y), or null when it is unseen or outside the scene's window. */
export function sceneAt(scene: Scene, x: number, y: number): SceneCell | null {
  const { area } = scene;
  const sx = x - area.x;
  const sy = y - area.y;
  if (sx < 0 || sy < 0 || sx >= area.w || sy >= area.h) return null;
  return scene.cells[sy * area.w + sx] ?? null;
}

const TERRAIN_KIND: Readonly<Record<string, TerrainKind>> = {
  [TILE.wall]: 'wall',
  [TILE.stairsUp]: 'stairsUp',
  [TILE.stairsDown]: 'stairsDown',
  [TILE.door]: 'door',
  [TILE.shallowWater]: 'shallowWater',
  [TILE.deepWater]: 'deepWater',
  [TILE.lava]: 'lava',
};

const GLYPH_PLAYER = 64;
const GLYPH_UP = 60;
const GLYPH_DOWN = 62;
const GLYPH_DOOR_CLOSED = 43;
const GLYPH_DOOR_OPEN = 39;
const GLYPH_SHALLOW = 126;
const GLYPH_LIQUID = 247;
const GLYPH_TRAP = 94; // ^
/** A Shaman's Spirit Totem (Spec 03, Addendum A), not in the core glyph table: Φ, proposed in task 3.7's clarification. */
const TOTEM_GLYPH = 232;

/** Glyph and colour for a terrain kind in one of its two lights; a door shows open (broken counts) or closed. */
function terrainDrawn(kind: TerrainKind, light: Light, open: boolean, look: MapLook): Drawn {
  const c = look.colours;
  switch (kind) {
    case 'wall':
      return { glyph: look.wallGlyph, fg: c.wall[light] };
    case 'stairsUp':
      return { glyph: GLYPH_UP, fg: c.stairs[light] };
    case 'stairsDown':
      return { glyph: GLYPH_DOWN, fg: c.stairs[light] };
    case 'door':
      return { glyph: open ? GLYPH_DOOR_OPEN : GLYPH_DOOR_CLOSED, fg: c.door[light] };
    case 'shallowWater':
      return { glyph: GLYPH_SHALLOW, fg: c.shallowWater[light] };
    case 'deepWater':
      return { glyph: GLYPH_LIQUID, fg: c.deepWater[light] };
    case 'lava':
      return { glyph: GLYPH_LIQUID, fg: c.lava[light] };
    default:
      return { glyph: look.floorGlyph, fg: c.floor[light] };
  }
}

/** A feature before its cell's light is known: both colours, and whether it is dimmed regardless. */
interface Thing {
  kind: FeatureKind;
  state?: string;
  glyph: number;
  colour: { visible: number; remembered: number };
  dim: boolean;
}

const CONTAINER_GLYPH = { chest: GLYPH.chest, sack: GLYPH.sack, pottery: GLYPH.pottery, rack: GLYPH.weaponRack } as const;
const FIXTURE_GLYPH = { fountain: GLYPH.fountain, altar: GLYPH.altar, sarcophagus: GLYPH.sarcophagus, rune: GLYPH.rune } as const;

/** What stands on each cell of the level besides terrain (Spec 01, core glyph table); a later entry covers an earlier one. */
function features(state: GameState, look: MapLook): Map<number, Thing> {
  const { map, looted, used } = state;
  const { level } = map;
  const at = (p: { x: number; y: number }): number => p.y * level.width + p.x;
  const debris = (cell: number): Thing => ({ kind: 'debris', state: used.searched.includes(cell) ? 'searched' : undefined, glyph: GLYPH.debris, colour: MAP.debris, dim: false });
  const things = new Map<number, Thing>();
  for (const cell of used.collapsed) things.set(cell, debris(cell));
  level.features.forEach((f, i) => {
    const cell = at(f);
    const done = used.features[i]?.done === true;
    if (f.type === 'debris') things.set(cell, debris(cell));
    else if (f.type === 'container') {
      const left = used.features[i]?.left;
      const lootedNow = looted.features.includes(i);
      const s = map.cleared.includes(cell) ? 'smashed' : lootedNow || left?.length === 0 ? 'looted' : left !== undefined ? 'open' : 'closed';
      things.set(cell, { kind: f.kind, state: s, glyph: CONTAINER_GLYPH[f.kind], colour: MAP.container, dim: lootedNow });
    } else {
      const fs = used.features[i];
      const s =
        f.kind === 'fountain' ? (fs?.limit !== undefined && (fs.drinks ?? 0) >= fs.limit ? 'dry' : 'flowing')
        : f.kind === 'altar' ? (done ? 'offered' : 'idle')
        : f.kind === 'sarcophagus' ? (done ? 'open' : 'closed')
        : done ? 'spent' : 'dormant';
      things.set(cell, { kind: f.kind, state: s, glyph: FIXTURE_GLYPH[f.kind], colour: f.kind === 'rune' ? MAP.rune : MAP.fixture, dim: done });
    }
  });
  level.lore.forEach((m, i) => {
    const spent = m.kind === 'rune' && used.marks.includes(i);
    const rune = m.kind === 'rune';
    things.set(at(m), { kind: m.kind, state: rune ? (spent ? 'spent' : 'dormant') : undefined, glyph: rune ? GLYPH.rune : GLYPH.sign, colour: rune ? MAP.rune : MAP.sign, dim: spent });
  });
  for (const s of level.specials) {
    if (s.kind === 'teleporter') things.set(at(s), { kind: 'teleporter', glyph: GLYPH.teleporter, colour: look.colours.special, dim: false });
    else if (s.kind === 'lever') things.set(at(s), { kind: 'lever', state: used.lever ? 'pulled' : 'up', glyph: GLYPH.rod, colour: look.colours.special, dim: used.lever });
  }
  if (map.totem) things.set(at(map.totem), { kind: 'totem', glyph: TOTEM_GLYPH, colour: MAP.fixture, dim: false });
  return things;
}

/** The glyph and class of an item on the floor, by what it is. */
function itemLook(item: Item): [number, ItemClass | undefined] {
  switch (item.kind) {
    case 'weapon':
    case 'ranged':
      return [GLYPH.weapon, 'weapon'];
    case 'ammo':
      return [GLYPH.weapon, 'ammunition'];
    case 'armour':
    case 'shield':
      return [GLYPH.armour, 'armour'];
    case 'clothing':
      return [GLYPH.clothing, 'clothing'];
    case 'ring':
      return [GLYPH.ring, 'ring'];
    case 'potion':
      return [GLYPH.potion, 'potion'];
    case 'wand':
    case 'rod':
    case 'staff':
      return [GLYPH.rod, 'rod'];
    case 'key':
    case 'vault_key':
      return [GLYPH.key, 'key'];
    case 'gem':
      return [GLYPH.gems, 'gems'];
    case 'jewelry':
      return [GLYPH.jewelry, 'jewelry'];
    case 'book':
    case 'spellbook':
    case 'map_fragment':
      return [GLYPH.book, 'book'];
    case 'quest_item':
      return [42, 'quest-item'];
    default:
      return [42, undefined]; // *
  }
}

function lootLook(loot: Loot): [number, ItemClass | undefined] {
  switch (loot.kind) {
    case 'coins':
      return [GLYPH.coins, 'coins'];
    case 'gem':
      return [GLYPH.gems, 'gems'];
    case 'jewelry':
      return [GLYPH.jewelry, 'jewelry'];
    case 'magic':
      return [GLYPH.potion, 'potion'];
    case 'book':
    case 'map_fragment':
      return [GLYPH.book, 'book'];
    case 'weapon':
      return [GLYPH.weapon, 'weapon'];
    case 'key':
    case 'vault_key':
      return [GLYPH.key, 'key'];
    case 'quest_item':
      return [42, 'quest-item'];
    case 'item':
      return itemLook(loot.item);
    default:
      return [42, undefined];
  }
}

/** Loose piles on the floor: the level's own that nobody has emptied, and what was dropped, thrown or fell from the dead. */
function piles(state: GameState): Map<number, SceneItem> {
  const { level } = state.map;
  const out = new Map<number, SceneItem>();
  const add = (p: { x: number; y: number; contents: Loot[] }): void => {
    const first = p.contents[0];
    if (!first) return;
    const [glyph, cls] = lootLook(first);
    out.set(p.y * level.width + p.x, { loot: first, glyph, fg: first.kind === 'coins' ? ITEM_COLOURS.coins : ITEM_COLOURS.other, ...(cls ? { cls } : {}) });
  };
  level.piles.forEach((p, i) => {
    if (!state.looted.piles.includes(i)) add(p);
  });
  for (const p of state.drops) add(p);
  return out;
}

function roleOf(m: Monster): CreatureRole {
  if (m.kind === 'ally') return m.ally === 'phantom' ? 'phantom' : 'ally';
  if (m.kind === 'bandit' || m.kind === 'rival') return m.kind;
  return m.role === 'boss' ? 'boss' : 'monster';
}

/**
 * The scene over `area` (level cells; it may reach past the level's edges): every known cell's layers. `look` is
 * the level theme's colours and tiles (Spec 01, Rendering), the default set when omitted.
 */
export function buildScene(state: GameState, area: Rect, look: MapLook = DEFAULT_LOOK): Scene {
  const { level, exploration, visible, player, openDoors } = state.map;
  const { used, revealed } = state;
  const cellAt = (x: number, y: number): number => y * level.width + x;
  const open = new Set(openDoors);
  const broken = new Set(used.broken);
  // Hidden things the player has found (Spec 04, Detect; Spec 06): secret doors draw as doors, traps as ^.
  const found = new Set(revealed);
  const doors = new Map(level.doors.map((d) => [cellAt(d.x, d.y), d]));
  // A found trap that is still there (disarmed and sprung ones are gone).
  const traps = new Set(
    [
      ...level.traps.filter((t) => !used.disarmed.includes(cellAt(t.x, t.y))),
      ...level.features.filter((f, i) => f.type === 'container' && f.trap && !used.features[i]?.trapGone),
    ]
      .map((p) => cellAt(p.x, p.y))
      .filter((i) => found.has(i)),
  );
  const things = features(state, look);
  const loose = piles(state);

  const cells: (SceneCell | null)[] = new Array<SceneCell | null>(area.w * area.h).fill(null);
  const inLevel = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < level.width && y < level.height;
  const slot = (x: number, y: number): number => {
    const sx = x - area.x;
    const sy = y - area.y;
    return sx < 0 || sy < 0 || sx >= area.w || sy >= area.h ? -1 : sy * area.w + sx;
  };

  for (let sy = 0; sy < area.h; sy++) {
    for (let sx = 0; sx < area.w; sx++) {
      const x = area.x + sx;
      const y = area.y + sy;
      if (!inLevel(x, y)) continue;
      const i = cellAt(x, y);
      if (!exploration.explored[i]) continue;
      const light: Light = visible[i] === 1 ? 'visible' : 'remembered';
      const tile = level.tiles[y]![x]!;
      const door = doors.get(i);
      // A secret door draws as wall until found, then as a door, closed or open.
      const kind: TerrainKind = door?.kind === 'secret' && found.has(i) ? 'door' : (TERRAIN_KIND[tile] ?? 'floor');
      const terrain: SceneTerrain = { kind, ...terrainDrawn(kind, light, open.has(i), look) };
      if (kind === 'door') {
        terrain.door = broken.has(i) ? 'broken' : open.has(i) ? 'open' : door?.kind === 'locked' ? 'locked' : door?.kind === 'sealed' ? 'sealed' : 'closed';
      }
      const cell: SceneCell = { x, y, light, terrain };
      if (traps.has(i)) cell.trap = { glyph: GLYPH_TRAP, fg: MAP.trap[light] };
      const thing = things.get(i);
      if (thing) {
        const shade: Light = light === 'visible' && !thing.dim ? 'visible' : 'remembered';
        cell.feature = { kind: thing.kind, glyph: thing.glyph, fg: thing.colour[shade], dim: thing.dim, ...(thing.state ? { state: thing.state } : {}) };
      }
      if (light === 'visible') {
        const pile = loose.get(i);
        if (pile) cell.item = pile;
      }
      cells[sy * area.w + sx] = cell;
    }
  }

  // Whoever stands on a visible cell; a later one covers an earlier one, and the player covers all.
  const stand = (x: number, y: number, occupant: SceneOccupant): void => {
    const s = slot(x, y);
    const cell = s < 0 ? null : cells[s];
    if (cell && cell.light === 'visible') cell.occupant = occupant;
  };
  // People who do not fight: traders, hermits and captives not yet freed (Spec 04, Spec 07).
  level.npcs.forEach((npc, index) => {
    const npcLook = NPC_LOOK[npc.kind];
    if (npcLook && !used.npcs[index]?.freed) stand(npc.x, npc.y, { kind: 'npc', role: npc.kind as 'trader' | 'hermit' | 'captive', index, glyph: toCp437(npcLook.glyph), fg: npcLook.colour });
  });
  for (const m of state.monsters) stand(m.x, m.y, { kind: 'creature', creature: m, role: roleOf(m), glyph: toCp437(m.glyph), fg: m.colour });
  const me = slot(player.x, player.y);
  if (me >= 0 && inLevel(player.x, player.y)) {
    cells[me] ??= { x: player.x, y: player.y, light: visible[cellAt(player.x, player.y)] === 1 ? 'visible' : 'remembered' };
    cells[me]!.occupant = { kind: 'player', glyph: GLYPH_PLAYER, fg: MAP.player };
  }
  return { area, cells };
}
