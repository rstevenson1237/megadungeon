// Steps 6 to 10 of the pipeline (Spec 02, clarifications of task 2.4): features, traps, monsters,
// treasure and magic items, NPCs and lore. Each step draws only from the level's contents stream.

import type { ContainerKind, FeatureKey, FixtureKind } from '../../../core/catalog.ts';
import type { Rng } from '../../../core/rng.ts';
import { eligibleEntries, pickWeighted, type Rollable } from '../../../core/roller.ts';
import type { GemJewelry, Monster } from '../../../core/schemas.ts';
import { PLACEMENT_COUNTS, MONSTER_COUNTS, bossCeiling, parseRating, ratingCeiling, treasureBudget } from '../depth.ts';
import { distanceSq } from '../geometry.ts';
import type {
  Feature,
  FloorTrap,
  Loot,
  LoreMark,
  Npc,
  PlacedMonster,
  Pile,
  Point,
  SizeClass,
} from '../level.ts';
import type { Board } from './board.ts';
import type { LevelPlan, PlacementContent } from './plan.ts';

/** Everything a step needs: the board, the contents stream and what the level is. */
export interface Ctx {
  b: Board;
  rng: Rng;
  plan: LevelPlan;
  content: PlacementContent;
  size: SizeClass;
  depth: number;
}

/** The monsters' safe radius around the up stair, in cells (Spec 02, step 8). */
export const STAIR_SAFE_RADIUS = 8;
export const farFromUp = (b: Board, p: Point): boolean => distanceSq(p, b.up) > STAIR_SAFE_RADIUS ** 2;

/** One weighted pick that respects the level's depth and theme; undefined when no row fits. */
export function rollRow<T extends Rollable>(ctx: Ctx, rows: readonly T[], tags?: readonly string[]): T | undefined {
  return pickWeighted(eligibleEntries(rows, { depth: ctx.depth, tags }), ctx.rng, ctx.plan.theme?.id);
}

const mult = (ctx: Ctx, key: FeatureKey): number => ctx.plan.theme?.features?.[key] ?? 1;
const between = (ctx: Ctx, [lo, hi]: readonly [number, number]): number => ctx.rng.int(lo, hi);
const weighted = <K extends string>(ctx: Ctx, base: Record<K, number>): K => {
  const rows = (Object.keys(base) as K[]).map((id) => ({ id, weight: base[id] * mult(ctx, id as FeatureKey) }));
  return pickWeighted(rows, ctx.rng)!.id;
};

const CONTAINER_WEIGHTS: Record<ContainerKind, number> = { chest: 25, sack: 35, pottery: 30, rack: 10 };
const FIXTURE_WEIGHTS: Record<FixtureKind, number> = { fountain: 30, altar: 25, sarcophagus: 25, rune: 20 };
/** Chance in percent that a container is trapped (Spec 02, clarifications of task 2.4). */
const CONTAINER_TRAP_PERCENT: Record<ContainerKind, number> = { chest: 40, sack: 10, pottery: 0, rack: 0 };

/** Step 6, "Features": containers, fixtures and debris. Containers may carry a container trap (step 7). */
export function placeFeatures(ctx: Ctx): Feature[] {
  const { b, rng, size, content } = ctx;
  const features: Feature[] = [];
  const spots = b.solidSpots(b.openRooms(), rng);
  const stand = (): Point | undefined => {
    while (spots.length > 0) {
      const p = spots.pop()!;
      if (b.free(p) && b.roomForSolid(p)) return p;
    }
    return undefined;
  };
  const containers = Math.round(between(ctx, PLACEMENT_COUNTS.containers[size]) * mult(ctx, 'containers'));
  const trapRows = content.traps.filter((t) => t.kind === 'container');
  for (let n = 0; n < containers; n++) {
    const at = stand();
    if (!at) break;
    const kind = weighted(ctx, CONTAINER_WEIGHTS);
    b.put(at, true);
    const feature: Feature = { ...at, type: 'container', kind, contents: [] };
    if (rng.int(1, 100) <= CONTAINER_TRAP_PERCENT[kind]) {
      const trap = rollRow(ctx, trapRows);
      if (trap) feature.trap = trap.id;
    }
    features.push(feature);
  }
  const fixtures = between(ctx, PLACEMENT_COUNTS.fixtures[size]);
  for (let n = 0; n < fixtures; n++) {
    const at = stand();
    if (!at) break;
    const kind = weighted(ctx, FIXTURE_WEIGHTS);
    b.put(at, true);
    const feature: Feature = { ...at, type: 'fixture', kind };
    if (kind === 'altar') {
      const god = rollRow(ctx, content.altarGods);
      if (god) feature.god = { id: god.id, name: god.name };
    }
    features.push(feature);
  }
  const debris = Math.round(between(ctx, PLACEMENT_COUNTS.debris[size]) * mult(ctx, 'debris'));
  const floor = rng.shuffle(b.floorCells());
  for (let n = 0; n < debris && n < floor.length; n++) {
    b.put(floor[n]!);
    features.push({ ...floor[n]!, type: 'debris' });
  }
  return features;
}

/** Step 7, "Traps": floor traps on plain floor, never on stairs, doorways or teleporters. */
export function placeTraps(ctx: Ctx): FloorTrap[] {
  const { b, rng, size, depth, plan, content } = ctx;
  const noDeepPit = depth >= 99 || plan.villageBelow;
  const rows = content.traps.filter((t) => t.kind === 'floor' && !(noDeepPit && t.tags?.includes('deep_pit')));
  const traps: FloorTrap[] = [];
  const floor = rng.shuffle(b.floorCells());
  const n = between(ctx, PLACEMENT_COUNTS.floorTraps[size]);
  for (let i = 0; i < n && i < floor.length; i++) {
    const row = rollRow(ctx, rows);
    if (!row) break;
    b.put(floor[i]!);
    traps.push({ ...floor[i]!, id: row.id });
  }
  return traps;
}

/** A monster table row as a placed monster. */
export function placedFrom(row: Monster, at: Point, group: number, role: PlacedMonster['role'] = 'normal'): PlacedMonster {
  const { dice, modifier } = parseRating(row.rating);
  return {
    ...at,
    id: row.id,
    name: row.name,
    glyph: row.glyph,
    colour: row.colour,
    dice,
    modifier,
    speed: row.speed ?? 'normal',
    behaviour: row.behaviour,
    ...(row.tags?.some((t) => t === 'undead' || t === 'construct') ? { fearless: true } : {}),
    group,
    role,
  };
}

/** Rows that may appear at this depth: their dice stay within `ceiling` (Spec 02, clarifications of task 2.4). */
export const withinCeiling = (rows: readonly Monster[], ceiling: number): Monster[] =>
  rows.filter((m) => parseRating(m.rating).dice <= ceiling);

/** Step 8, "Monsters": groups by room, none within 8 cells of the up stair. */
export function placeMonsters(ctx: Ctx): PlacedMonster[] {
  const { b, rng, size, depth, content } = ctx;
  const rows = withinCeiling(content.monsters, ratingCeiling(depth));
  const perRoom = new Map<number, Point[]>();
  for (const room of b.openRooms()) {
    const cells = b.roomCells([room], false).filter((p) => farFromUp(b, p));
    if (cells.length > 0) perRoom.set(room, rng.shuffle(cells));
  }
  const out: PlacedMonster[] = [];
  let target = between(ctx, MONSTER_COUNTS[size]);
  let group = 0;
  while (target > 0 && perRoom.size > 0) {
    const room = rng.pick([...perRoom.keys()]);
    const spots = perRoom.get(room)!;
    const row = rollRow(ctx, rows);
    if (!row) break;
    const wanted = row.tags?.includes('pack') ? rng.int(3, 6) : rng.int(1, 4);
    const count = Math.min(wanted, target, spots.length);
    for (let k = 0; k < count; k++) {
      const at = spots.pop()!;
      b.put(at);
      out.push(placedFrom(row, at, group));
    }
    if (spots.length === 0) perRoom.delete(room);
    target -= count;
    group++;
  }
  // Layouts with few or tiny rooms (a warren) fill the rest of the budget with single monsters in the tunnels.
  if (target > 0) {
    const tunnels = rng.shuffle(b.floorCells().filter((p) => farFromUp(b, p)));
    while (target > 0 && tunnels.length > 0) {
      const row = rollRow(ctx, rows);
      if (!row) break;
      const at = tunnels.pop()!;
      b.put(at);
      out.push(placedFrom(row, at, group++));
      target--;
    }
  }
  return out;
}

/** Coins, then gems and jewelry drawn from the tiered table by depth, as one parcel of treasure worth about `value`. */
function makeParcel(ctx: Ctx, value: number): Loot[] {
  const { rng, content, depth } = ctx;
  const loot: Loot[] = [];
  let coins = Math.round(value * 0.5);
  for (const [kind, share] of [['gem', 0.3], ['jewelry', 0.2]] as const) {
    let remaining = Math.round(value * share);
    const rows = eligibleEntries(content.gemsJewelry.filter((g) => g.kind === kind), { depth });
    for (let n = 0; n < 8; n++) {
      const fits: GemJewelry[] = rows.filter((g) => g.value <= remaining);
      const row = pickWeighted(fits, rng, ctx.plan.theme?.id);
      if (!row) break;
      loot.push({ kind, id: row.id, name: row.name, value: row.value });
      remaining -= row.value;
    }
    coins += remaining; // what no piece could be made of stays as coins, so the budget is kept
  }
  if (coins > 0) loot.unshift({ kind: 'coins', amount: coins });
  return loot;
}

const lootContainers = (features: readonly Feature[]): Extract<Feature, { type: 'container' }>[] =>
  features.filter((f): f is Extract<Feature, { type: 'container' }> => f.type === 'container' && f.kind !== 'rack');

/**
 * Step 9, "Treasure and items": deals the level's budget in parcels, rolls each container's magic item and
 * puts the books in containers. Returns the extra parcels for the vault, a rival's stash and a lore chain's
 * cache (step 11), which share the budget like any other parcel.
 */
export function dealTreasure(
  ctx: Ctx,
  features: Feature[],
  open: Int32Array,
  extraCount: number,
): { piles: Pile[]; extras: Loot[][] } {
  const { b, rng, depth, content } = ctx;
  const budget = Math.round(treasureBudget(depth) * (1 + rng.int(-50, 50) / 100));
  const holders = lootContainers(features);
  const count = Math.max(5, holders.length) + extraCount;
  const shares = Array.from({ length: count }, () => rng.int(1, 10));
  const total = shares.reduce((a, c) => a + c, 0);
  const parcels = shares.map((s) => makeParcel(ctx, Math.round((budget * s) / total)));
  const extras = parcels.splice(count - extraCount, extraCount);

  const piles: Pile[] = [];
  const deadEnds = rng.shuffle(b.deadEnds());
  const behind = rng.shuffle(b.roomCells(b.openRooms(), false).filter((p) => open[b.index(p)]! < 0));
  const pile = (spots: Point[], parcel: Loot[]): boolean => {
    while (spots.length > 0) {
      const at = spots.pop()!;
      if (!b.free(at)) continue;
      b.put(at);
      piles.push({ ...at, contents: parcel });
      return true;
    }
    return false;
  };
  const inContainer = (parcel: Loot[], where?: (c: Point) => boolean): boolean => {
    const pool = where ? holders.filter(where) : holders;
    if (pool.length === 0) return false;
    rng.pick(pool).contents.push(...parcel);
    return true;
  };
  const anywhere = (parcel: Loot[]): void => {
    if (inContainer(parcel)) return;
    pile(rng.shuffle(b.roomCells(b.openRooms(), false)), parcel);
  };
  for (const parcel of parcels) {
    const roll = rng.int(1, 100);
    if (roll <= 60) anywhere(parcel);
    else if (roll <= 80) pile(deadEnds, parcel) || anywhere(parcel);
    else inContainer(parcel, (c) => open[b.index(c)]! < 0) || pile(behind, parcel) || anywhere(parcel);
  }

  const magicPercent = Math.min(40, 10 + depth / 4);
  for (const f of features) {
    if (f.type !== 'container') continue;
    if (f.kind === 'rack') for (let n = rng.int(1, 2); n > 0; n--) f.contents.push({ kind: 'weapon' });
    if (rng.float() * 100 < magicPercent) {
      const item = rollRow(ctx, content.magicItems);
      if (item) f.contents.push({ kind: 'magic', id: item.id, name: item.name });
    }
  }
  const books = Math.round(rng.int(1, 2) * mult(ctx, 'book'));
  for (let n = 0; n < books && holders.length > 0; n++) {
    const book = rollRow(ctx, content.books);
    if (book) rng.pick(holders).contents.push({ kind: 'book', id: book.id });
  }
  return { piles, extras };
}

/** Step 10, "NPCs and lore", NPC half: a trader, hermit, rival and bandits, each by its own chance. */
export function placeNpcs(ctx: Ctx): Npc[] {
  const { b, rng, plan, content } = ctx;
  const spots = b.solidSpots(b.openRooms(), rng);
  const stand = (far: boolean): Point | undefined => {
    for (let i = spots.length - 1; i >= 0; i--) {
      const p = spots[i]!;
      if (!b.free(p) || !b.roomForSolid(p) || (far && !farFromUp(b, p))) continue;
      spots.splice(i, 1);
      return p;
    }
    return undefined;
  };
  const npcs: Npc[] = [];
  const add = (kind: Npc['kind'], far: boolean): void => {
    const at = stand(far);
    if (!at) return;
    b.put(at, true);
    npcs.push({ ...at, kind, name: rollRow(ctx, content.npcNames)?.name ?? kind });
  };
  if (rng.oneIn(8)) add('trader', false);
  if (rng.oneIn(8)) add('hermit', false);
  // The named rival of a link already stands here on its levels; one rival is enough.
  if (rng.oneIn(6) && !plan.pieces.some((p) => p.kind === 'rival')) add('rival', false);
  if (rng.oneIn(4)) for (let n = rng.int(1, 2); n > 0; n--) add('bandit', true);
  return npcs;
}

/** Step 10, lore half: graffiti and signs on walls (signs at the stairs, the vault and the boss room first). */
export function placeLore(ctx: Ctx, landmarks: readonly Point[]): LoreMark[] {
  const { b, rng, content } = ctx;
  const spots = rng.shuffle(b.wallSpots());
  const take = (near?: Point): Point | undefined => {
    let best = -1;
    for (let i = 0; i < spots.length; i++) {
      if (b.used[b.index(spots[i]!)] === 1) continue;
      if (!near) {
        best = i;
        break;
      }
      if (distanceSq(spots[i]!, near) <= 36 && (best < 0 || distanceSq(spots[i]!, near) < distanceSq(spots[best]!, near))) best = i;
    }
    if (best < 0) return undefined;
    const p = spots.splice(best, 1)[0]!;
    b.used[b.index(p)] = 1;
    return p;
  };
  const marks: LoreMark[] = [];
  const mark = (kind: 'graffiti' | 'sign', at: Point | undefined): void => {
    if (!at) return;
    const row = rollRow(ctx, kind === 'sign' ? content.signs : content.graffiti);
    if (row) marks.push({ ...at, kind, id: row.id, text: row.text });
  };
  const signs = Math.max(1, Math.round(rng.int(1, 3) * mult(ctx, 'sign')));
  for (let n = 0; n < signs; n++) mark('sign', take(landmarks[n]) ?? take());
  const graffiti = Math.round(rng.int(3, 6) * mult(ctx, 'graffiti'));
  for (let n = 0; n < graffiti; n++) mark('graffiti', take());
  return marks;
}
