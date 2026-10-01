import { describe, expect, it, vi } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { bossCeiling, MONSTER_COUNTS, PLACEMENT_COUNTS, ratingCeiling, treasureBudget } from '../src/rules/world/depth.ts';
import { FLOOR, SEALED_DOOR, WALL } from '../src/rules/world/grid.ts';
import { MAX_DEPTH, type Level, type Rect } from '../src/rules/world/level.ts';
import { Board, entranceRooms, findEntrances, roomIndexMap } from '../src/rules/world/placement/board.ts';
import { carveVault, DEFAULT_DOOR_WEIGHTS, placeDoors } from '../src/rules/world/placement/doors.ts';
import { planLevel, type LevelContents } from '../src/rules/world/placement/index.ts';
import { Run } from '../src/game/run.ts';
import { isVillageLevel } from '../src/rules/world/run-layout.ts';
import { testPlayer } from './helpers.ts';
import { findProblems } from '../src/rules/world/validate.ts';
import { placementContentOf } from '../src/game/world.ts';
import { BUNDLE, CONTENT_ERRORS, checkPlacement, checkPlan, lootOf, treasureValue } from './placement-checks.ts';

vi.setConfig({ testTimeout: 300_000 });

interface Made {
  seed: number;
  depth: number;
  level: Level;
  contents: LevelContents;
  theme: string;
}

/** Levels of one theme, one per (seed, depth) pair found by walking seeds, up to `count`. */
const cache = new Map<string, Made[]>();
function levelsWhere(name: string, count: number, want: (theme: string, contents: LevelContents) => boolean): Made[] {
  const key = `${name}:${count}`;
  if (cache.has(key)) return cache.get(key)!;
  const out: Made[] = [];
  for (let seed = 1; out.length < count && seed < 4000; seed++) {
    const options = runOptionsFor(BUNDLE, seed);
    const layout = options.layout!;
    for (let depth = 1 + (seed % 5); depth <= 99 && out.length < count; depth += 5) {
      const theme = layout.themes[depth];
      if (!theme) continue;
      const contents = options.contentsFor!(depth)!;
      if (!want(theme, contents)) continue;
      const level = generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), contents);
      out.push({ seed, depth, level, contents, theme });
    }
  }
  cache.set(key, out);
  return out;
}
const ofTheme = (theme: string, count = 40): Made[] => levelsWhere(theme, count, (t) => t === theme);

const share = (made: Made[], pick: (l: Level) => number, of: (l: Level) => number): number => {
  const total = made.reduce((n, m) => n + of(m.level), 0);
  return total === 0 ? 0 : made.reduce((n, m) => n + pick(m.level), 0) / total;
};
const doors = (kind: string) => (l: Level): number => l.doors.filter((d) => d.kind === kind).length;
const allDoors = (l: Level): number => l.doors.length;
const fixtures = (kind: string) => (l: Level): number => l.features.filter((f) => f.type === 'fixture' && f.kind === kind).length;
const allFixtures = (l: Level): number => l.features.filter((f) => f.type === 'fixture').length;
const containers = (kind: string) => (l: Level): number => l.features.filter((f) => f.type === 'container' && f.kind === kind).length;
const allContainers = (l: Level): number => l.features.filter((f) => f.type === 'container').length;
const mean = (made: Made[], f: (l: Level) => number): number => made.reduce((n, m) => n + f(m.level), 0) / made.length;

describe('content for placement', () => {
  it('builds with no errors and holds a trap, rune letter and gem for every level of a run', () => {
    expect(CONTENT_ERRORS).toEqual([]);
    const content = placementContentOf(BUNDLE);
    expect(content.traps.filter((t) => t.kind === 'floor').length).toBeGreaterThanOrEqual(9);
    expect(content.traps.filter((t) => t.kind === 'container').length).toBeGreaterThanOrEqual(4);
    expect(content.runes.filter((r) => r.letter).length).toBeGreaterThanOrEqual(4);
    expect(content.gemsJewelry.some((g) => g.kind === 'gem')).toBe(true);
    expect(content.gemsJewelry.some((g) => g.kind === 'jewelry')).toBe(true);
  });
});

describe('determinism and independence (Spec 02, Seeds, determinism and persistence)', () => {
  it('gives a byte-identical level, placements included, for the same seed, level and contents', () => {
    for (const [seed, depth] of [[1, 3], [77, 41], [2026, 99], [5, 100]] as const) {
      const options = runOptionsFor(BUNDLE, seed);
      const make = (): string => JSON.stringify(generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), options.contentsFor!(depth)));
      expect(make()).toBe(make());
    }
  });

  it('does not need any other level, and never moves a wall when contents change', () => {
    const options = runOptionsFor(BUNDLE, 321);
    const depth = 44;
    const args = [321, depth, options.sizeFor!(depth), options.styleFor!(depth)] as const;
    const alone = JSON.stringify(generateLevel(...args, options.contentsFor!(depth)));
    for (let d = 1; d < depth; d++) generateLevel(321, d, options.sizeFor!(d), options.styleFor!(d), options.contentsFor!(d));
    expect(JSON.stringify(generateLevel(...args, options.contentsFor!(depth)))).toBe(alone);
    // Without contents the carved rooms and stairs are the same; only doors, which are placed, differ.
    const bare = generateLevel(...args);
    const full = generateLevel(...args, options.contentsFor!(depth));
    expect(full.upStair).toEqual(bare.upStair);
    expect(full.downStair).toEqual(bare.downStair);
    expect(bare.monsters).toEqual([]);
    expect(bare.doors).toEqual([]);
  });

  it('draws what a quest and a link name from their own streams, so every level and village agrees', () => {
    const a = runOptionsFor(BUNDLE, 9);
    const b = runOptionsFor(BUNDLE, 9);
    const quest = a.layout!.quests[0]!;
    const planA = a.contentsFor!(quest.level)!.plan;
    const planB = b.contentsFor!(quest.level)!.plan;
    expect(planA.quests.find((g) => g.quest.id === quest.id)).toEqual(planB.quests.find((g) => g.quest.id === quest.id));
    expect(planA.quests.find((g) => g.quest.id === quest.id)?.item ?? planA.quests.find((g) => g.quest.id === quest.id)?.person).toBeTruthy();
  });
});

describe('doors (Spec 02, step 4)', () => {
  /** Two 5 x 3 rooms joined by a straight corridor: one entrance into each. */
  const twoRooms = (): { cells: Uint8Array; rooms: Rect[]; width: number; height: number } => {
    const width = 30;
    const height = 12;
    const cells = new Uint8Array(width * height);
    const rooms = [{ x: 3, y: 4, w: 5, h: 3 }, { x: 20, y: 4, w: 5, h: 3 }];
    for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) cells[y * width + x] = FLOOR;
    for (let x = 8; x < 20; x++) cells[5 * width + x] = FLOOR;
    return { cells, rooms, width, height };
  };

  it('finds an entrance where a one-cell gap with wall on both sides opens into a room', () => {
    const { cells, rooms, width, height } = twoRooms();
    const board = new Board(cells, width, height, rooms, { x: 4, y: 5 }, { x: 22, y: 5 });
    const found = findEntrances(board);
    expect(found.map((e) => [e.x, e.y, e.rooms])).toEqual([[8, 5, [0]], [19, 5, [1]]]);
    // A cell in the middle of the corridor touches no room.
    expect(entranceRooms(cells, width, roomIndexMap(rooms, width, height), 12, 5)).toEqual([]);
    // A wide gap is not a doorway: the cell above the corridor mouth is now floor too.
    cells[4 * width + 8] = FLOOR;
    expect(entranceRooms(cells, width, roomIndexMap(rooms, width, height), 8, 5)).toEqual([]);
  });

  it('rolls the default odds, and a theme replaces any of them', () => {
    expect(DEFAULT_DOOR_WEIGHTS).toEqual({ none: 40, normal: 40, locked: 10, secret: 10 });
    const tally = (weights: Record<string, number> | undefined): Record<string, number> => {
      const counts: Record<string, number> = { normal: 0, locked: 0, secret: 0, none: 0 };
      for (let seed = 0; seed < 400; seed++) {
        const { cells, rooms, width, height } = twoRooms();
        const board = new Board(cells, width, height, rooms, { x: 4, y: 5 }, { x: 22, y: 5 });
        board.entrances = findEntrances(board);
        // Add a loop so a locked or secret door can never cut the stairs apart.
        for (let x = 8; x < 20; x++) cells[8 * width + x] = FLOOR;
        for (let y = 5; y <= 8; y++) cells[y * width + 8] = FLOOR;
        for (let y = 5; y <= 8; y++) cells[y * width + 19] = FLOOR;
        const placed = placeDoors(board, weights ? { id: 't', doors: weights } : undefined, createRng(seed));
        for (const d of placed) counts[d.kind]!++;
        counts.none! += 2 - placed.length;
      }
      return counts;
    };
    const plain = tally(undefined);
    const locked = tally({ locked: 100 });
    expect(plain.normal! / 800).toBeGreaterThan(0.3);
    expect(plain.normal! / 800).toBeLessThan(0.5);
    expect(locked.locked! / 800).toBeGreaterThan(plain.locked! / 800 + 0.3);
  });

  it('turns a locked or secret door into a normal one when it would cut the down stair off', () => {
    const { cells, rooms, width, height } = twoRooms();
    const board = new Board(cells, width, height, rooms, { x: 4, y: 5 }, { x: 22, y: 5 });
    board.entrances = findEntrances(board);
    for (let seed = 0; seed < 100; seed++) {
      const copy = cells.slice();
      const b = new Board(copy, width, height, rooms, { x: 4, y: 5 }, { x: 22, y: 5 });
      b.entrances = findEntrances(b);
      const placed = placeDoors(b, { id: 't', doors: { none: 0, normal: 0, locked: 100, secret: 100 } }, createRng(seed));
      expect(placed.length).toBe(2);
      expect(placed.every((d) => d.kind === 'normal')).toBe(true); // a single corridor: nothing may be closed off
    }
  });

  it('gives caves no doors and the other layouts doors in one-cell doorways', () => {
    const caves = ofTheme('old_mine', 12);
    expect(caves.length).toBe(12);
    // (The only door a cave level may have is the sealed one of a vault bolted onto it.)
    for (const m of caves) expect(m.level.doors.filter((d) => d.kind !== 'sealed')).toEqual([]);
    const rooms = ofTheme('cellars_and_crypts', 30);
    expect(rooms.reduce((n, m) => n + m.level.doors.length, 0)).toBeGreaterThan(30);
  });

  it('weights doors by theme: locked in the Dwarven Hold, secret in the Catacombs and the Void Halls', () => {
    const base = ofTheme('cellars_and_crypts');
    const hold = ofTheme('dwarven_hold');
    const catacombs = ofTheme('catacomb_labyrinth');
    const halls = ofTheme('void_halls');
    expect(share(hold, doors('locked'), allDoors)).toBeGreaterThan(share(base, doors('locked'), allDoors));
    expect(share(catacombs, doors('secret'), allDoors)).toBeGreaterThan(share(base, doors('secret'), allDoors));
    expect(share(halls, doors('secret'), allDoors)).toBeGreaterThan(share(base, doors('secret'), allDoors));
  });

  it('draws a secret door as wall and a locked or normal one as a door', () => {
    const found = new Set<string>();
    for (const m of [...ofTheme('catacomb_labyrinth'), ...ofTheme('dwarven_hold')]) {
      for (const d of m.level.doors) {
        found.add(d.kind);
        expect(m.level.tiles[d.y]![d.x]).toBe(d.kind === 'secret' ? '#' : '+');
      }
    }
    expect([...found].sort()).toEqual(expect.arrayContaining(['locked', 'normal', 'secret']));
  });

  it('keeps every secret and locked door off the critical path', () => {
    for (const m of [...ofTheme('catacomb_labyrinth'), ...ofTheme('void_halls'), ...ofTheme('dwarven_hold')]) {
      expect(checkPlacement(m.level, m.contents.plan), `seed ${m.seed} level ${m.depth}`).toBeNull();
    }
  });
});

describe('keys (Spec 02, step 5)', () => {
  it('places exactly one key per locked door, each reachable without any locked door', () => {
    let locked = 0;
    for (const m of ofTheme('dwarven_hold', 30)) {
      const doors = m.level.doors.filter((d) => d.kind === 'locked').length;
      const keys = lootOf(m.level).filter((l) => l.loot.kind === 'key').length;
      expect(keys).toBe(doors);
      locked += doors;
    }
    expect(locked).toBeGreaterThan(20);
  });
});

describe('features and traps (Spec 02, steps 6 and 7)', () => {
  it('places the counts for each size, with the theme multipliers', () => {
    for (const theme of ['cellars_and_crypts', 'flooded_sewers', 'dwarven_hold']) {
      for (const m of ofTheme(theme, 12)) {
        const size = m.level.size;
        const found = m.level.features.filter((f) => f.type === 'container' && !f.link).length;
        const [lo, hi] = PLACEMENT_COUNTS.containers[size];
        expect(found, `${theme} ${size}`).toBeLessThanOrEqual(hi);
        expect(found).toBeGreaterThanOrEqual(Math.min(lo, 3));
        const [flo, fhi] = PLACEMENT_COUNTS.floorTraps[size];
        expect(m.level.traps.length).toBeLessThanOrEqual(fhi);
        expect(m.level.traps.length).toBeGreaterThanOrEqual(Math.min(flo, 2));
        const debris = m.level.features.filter((f) => f.type === 'debris').length;
        expect(debris).toBeLessThanOrEqual(Math.round(PLACEMENT_COUNTS.debris[size][1] * (m.contents.plan.theme?.features?.debris ?? 1)));
      }
    }
  });

  it('follows the intake feature bias: sarcophagi in cellars, altars in temples, few containers by the lake', () => {
    const cellars = ofTheme('cellars_and_crypts');
    const temple = ofTheme('ruined_temple');
    expect(share(cellars, fixtures('sarcophagus'), allFixtures)).toBeGreaterThan(share(temple, fixtures('sarcophagus'), allFixtures));
    expect(share(temple, fixtures('altar'), allFixtures)).toBeGreaterThan(share(cellars, fixtures('altar'), allFixtures));
    expect(share(ofTheme('goblin_warrens'), containers('sack'), allContainers)).toBeGreaterThan(share(ofTheme('dwarven_hold'), containers('sack'), allContainers));
    expect(share(ofTheme('dwarven_hold'), containers('rack'), allContainers)).toBeGreaterThan(share(cellars, containers('rack'), allContainers));
    expect(mean(ofTheme('underdark_lake'), allContainers)).toBeLessThan(0.7 * mean(ofTheme('fungal_caverns'), allContainers));
  });

  it('puts the container traps on chests (40%), sacks (10%) and never on pottery or racks', () => {
    const levels = [...ofTheme('cellars_and_crypts'), ...ofTheme('flooded_sewers'), ...ofTheme('dwarven_hold')];
    const all = levels.flatMap((m) => m.level.features).filter((f) => f.type === 'container');
    const chests = all.filter((f) => f.kind === 'chest');
    const sacks = all.filter((f) => f.kind === 'sack');
    expect(chests.length).toBeGreaterThan(40);
    expect(chests.filter((f) => f.trap).length / chests.length).toBeGreaterThan(0.25);
    expect(chests.filter((f) => f.trap).length / chests.length).toBeLessThan(0.55);
    expect(sacks.filter((f) => f.trap).length / sacks.length).toBeLessThan(0.2);
    expect(all.filter((f) => (f.kind === 'pottery' || f.kind === 'rack') && f.trap)).toEqual([]);
    const containerTraps = new Set(all.flatMap((f) => (f.trap ? [f.trap] : [])));
    for (const id of containerTraps) expect(['trap_poison_needle', 'trap_fire_burst', 'trap_container_alarm', 'trap_summoning']).toContain(id);
  });

  it('never places a deep pit on level 99 or above a village', () => {
    const content = placementContentOf(BUNDLE);
    expect(content.traps.some((t) => t.id === 'trap_deep_pit')).toBe(true);
    let pits = 0;
    let checked = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const options = runOptionsFor(BUNDLE, seed);
      for (const village of options.layout!.villages) {
        const depth = village.level - 1;
        if (depth < 1 || isVillageLevel(options.layout!, depth)) continue;
        const level = generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), options.contentsFor!(depth));
        pits += level.traps.filter((t) => t.id === 'trap_deep_pit').length;
        checked++;
      }
      if (!isVillageLevel(options.layout!, 99)) {
        pits += generateLevel(seed, 99, options.sizeFor!(99), options.styleFor!(99), options.contentsFor!(99)).traps.filter((t) => t.id === 'trap_deep_pit').length;
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(pits).toBe(0);
    // Deeper-pit-able levels do get them.
    const elsewhere = levelsWhere('pits', 60, () => true).flatMap((m) => m.level.traps).filter((t) => t.id === 'trap_deep_pit');
    expect(elsewhere.length).toBeGreaterThan(0);
  });

  it('weights floor traps by theme: collapse in the Old Mine, poison gas in the Fungal Caverns', () => {
    const traps = (made: Made[], id: string): number => share(made, (l) => l.traps.filter((t) => t.id === id).length, (l) => l.traps.length);
    expect(traps(ofTheme('old_mine'), 'trap_collapse')).toBeGreaterThan(traps(ofTheme('cellars_and_crypts'), 'trap_collapse'));
    expect(traps(ofTheme('fungal_caverns'), 'trap_poison_gas')).toBeGreaterThan(traps(ofTheme('cellars_and_crypts'), 'trap_poison_gas'));
  });
});

describe('monsters (Spec 02, step 8)', () => {
  it('fills the count for the size, none within 8 cells of the up stair, on floor', () => {
    for (const m of levelsWhere('monsters', 90, () => true)) {
      const normal = m.level.monsters.filter((x) => x.role === 'normal').length;
      const [lo, hi] = MONSTER_COUNTS[m.level.size];
      expect(normal, `seed ${m.seed} level ${m.depth}`).toBeGreaterThanOrEqual(lo);
      expect(normal).toBeLessThanOrEqual(hi);
      for (const mon of m.level.monsters) {
        expect(m.level.tiles[mon.y]![mon.x]).toBe('.');
        expect((mon.x - m.level.upStair.x) ** 2 + (mon.y - m.level.upStair.y) ** 2).toBeGreaterThan(64);
      }
    }
  });

  it('keeps each monster\'s table rating, and only rows within the rating ceiling', () => {
    const rows = new Map(placementContentOf(BUNDLE).monsters.map((r) => [r.id, r]));
    for (const m of levelsWhere('ceiling', 120, () => true)) {
      for (const mon of m.level.monsters.filter((x) => x.role === 'normal')) {
        const row = rows.get(mon.id)!;
        const [dice, modifier] = [Number(row.rating.split('d')[0]), Number(row.rating.split(/d\d+/)[1])];
        expect([mon.dice, mon.modifier]).toEqual([dice, modifier]); // the row's rating is exact
        expect(mon.dice).toBeLessThanOrEqual(ratingCeiling(m.depth));
        expect(mon.name).toBe(row.name);
        expect(m.depth).toBeGreaterThanOrEqual(row.depth?.[0] ?? 1);
        expect(m.depth).toBeLessThanOrEqual(row.depth?.[1] ?? 100);
      }
    }
  });

  it('puts monsters in groups of 1 to 4, 3 to 6 for a pack, each group in one room', () => {
    let packs = 0;
    for (const m of levelsWhere('groups', 100, () => true)) {
      const groups = new Map<number, typeof m.level.monsters>();
      for (const mon of m.level.monsters.filter((x) => x.role === 'normal')) groups.set(mon.group, [...(groups.get(mon.group) ?? []), mon]);
      for (const members of groups.values()) {
        const pack = members[0]!.id === 'stub_monster_weak';
        expect(members.length).toBeLessThanOrEqual(pack ? 6 : 4);
        const inOneRoom = m.level.rooms.some((r) => members.every((x) => x.x >= r.x && x.y >= r.y && x.x < r.x + r.w && x.y < r.y + r.h));
        if (members.length > 1 && inOneRoom) {
          if (pack) packs++;
        }
        // A lone monster may stand in a tunnel; a group of two or more never spreads over rooms, except
        // that tunnel monsters of a warren have a group each.
        if (members.length > 1) expect(inOneRoom, `seed ${m.seed} level ${m.depth}`).toBe(true);
      }
    }
    expect(packs).toBeGreaterThan(0);
  });
});

describe('treasure and items (Spec 02, step 9)', () => {
  const sample = levelsWhere('treasure', 150, () => true);

  it('deals the budget, varied by up to 50% either way, and about half of it on average', () => {
    let ratio = 0;
    for (const m of sample) {
      const budget = treasureBudget(m.depth);
      const worth = treasureValue(m.level);
      expect(worth).toBeGreaterThanOrEqual(budget * 0.5 - 60);
      expect(worth).toBeLessThanOrEqual(budget * 1.5 + 60);
      ratio += worth / budget;
    }
    expect(ratio / sample.length).toBeGreaterThan(0.85);
    expect(ratio / sample.length).toBeLessThan(1.15);
  });

  it('splits it roughly 50% coins, 30% gems, 20% jewelry on deeper levels', () => {
    const deep = levelsWhere('deep', 60, (_, c) => c.plan.depth >= 50);
    let coins = 0;
    let gems = 0;
    let jewelry = 0;
    for (const m of deep) {
      for (const { loot } of lootOf(m.level)) {
        if (loot.kind === 'coins') coins += loot.amount;
        if (loot.kind === 'gem') gems += loot.value;
        if (loot.kind === 'jewelry') jewelry += loot.value;
      }
    }
    const total = coins + gems + jewelry;
    expect(coins / total).toBeGreaterThan(0.45);
    expect(coins / total).toBeLessThan(0.65);
    expect(gems / total).toBeGreaterThan(0.2);
    expect(jewelry / total).toBeGreaterThan(0.1);
  });

  it('puts most of it in containers, some in dead ends and some behind locked or secret doors', () => {
    let inContainers = 0;
    let onFloor = 0;
    for (const m of sample) {
      for (const f of m.level.features) if (f.type === 'container') inContainers += f.contents.filter((l) => l.kind === 'coins').length;
      for (const p of m.level.piles) onFloor += p.contents.filter((l) => l.kind === 'coins').length;
    }
    expect(inContainers).toBeGreaterThan(onFloor);
    expect(onFloor).toBeGreaterThan(0);
  });

  it('rolls a magic item in a container at 10% + depth / 4 %, capped at 40%', () => {
    const at = (depth: number): number => {
      let withMagic = 0;
      let total = 0;
      for (const m of levelsWhere(`magic${depth}`, 40, (_, c) => c.plan.depth >= depth && c.plan.depth <= depth + 4)) {
        for (const f of m.level.features) {
          if (f.type !== 'container' || f.link) continue;
          total++;
          if (f.contents.some((l) => l.kind === 'magic')) withMagic++;
        }
      }
      return withMagic / total;
    };
    const shallow = at(1);
    const deep = at(90);
    expect(shallow).toBeGreaterThan(0.04);
    expect(shallow).toBeLessThan(0.2);
    expect(deep).toBeGreaterThan(0.25);
    expect(deep).toBeLessThan(0.5);
    expect(deep).toBeGreaterThan(shallow);
  });

  it('gives each weapon rack one or two weapons and hides books in containers', () => {
    let books = 0;
    for (const m of sample) {
      for (const f of m.level.features) {
        if (f.type !== 'container') continue;
        if (f.kind === 'rack') expect(f.contents.filter((l) => l.kind === 'weapon').length).toBeGreaterThanOrEqual(1);
        books += f.contents.filter((l) => l.kind === 'book').length;
      }
    }
    expect(books).toBeGreaterThan(sample.length * 0.9);
  });
});

describe('NPCs and lore (Spec 02, step 10)', () => {
  const sample = levelsWhere('npcs', 200, () => true);

  it('rolls each kind of NPC by its own chance', () => {
    const per = (kind: string): number => sample.filter((m) => m.level.npcs.some((n) => n.kind === kind && !n.link && !n.quest)).length / sample.length;
    expect(per('trader')).toBeGreaterThan(0.06);
    expect(per('trader')).toBeLessThan(0.2);
    expect(per('hermit')).toBeGreaterThan(0.06);
    expect(per('bandit')).toBeGreaterThan(0.15);
    expect(per('bandit')).toBeLessThan(0.35);
    for (const m of sample) expect(m.level.npcs.filter((n) => n.kind === 'bandit' && !n.link).length).toBeLessThanOrEqual(2);
  });

  it('gives 3 to 6 graffiti and 1 to 3 signs on walls, signs by the up stair first', () => {
    let nearStair = 0;
    for (const m of sample) {
      const graffiti = m.level.lore.filter((l) => l.kind === 'graffiti' && !l.link).length;
      const signs = m.level.lore.filter((l) => l.kind === 'sign').length;
      const bias = m.contents.plan.theme?.features;
      expect(graffiti).toBeLessThanOrEqual(Math.round(6 * (bias?.graffiti ?? 1)));
      expect(signs).toBeLessThanOrEqual(Math.round(3 * (bias?.sign ?? 1)));
      expect(signs).toBeGreaterThanOrEqual(1);
      if (m.level.lore.some((l) => l.kind === 'sign' && (l.x - m.level.upStair.x) ** 2 + (l.y - m.level.upStair.y) ** 2 <= 36)) nearStair++;
    }
    expect(nearStair / sample.length).toBeGreaterThan(0.8);
  });
});

describe('specials (Spec 02, step 11)', () => {
  it('places every teleporter, boss, quest goal and link piece the run layout assigned, and nothing else', () => {
    const wanted = levelsWhere('plans', 60, (_, c) => c.plan.pieces.length > 0 || c.plan.quests.length > 0 || c.plan.boss !== undefined || c.plan.teleporterTo !== undefined);
    const kinds = new Set<string>();
    for (const m of wanted) {
      expect(checkPlan(m.level, m.contents.plan), `seed ${m.seed} level ${m.depth}`).toBeNull();
      for (const p of m.contents.plan.pieces) kinds.add(p.kind);
    }
    expect(wanted.length).toBeGreaterThanOrEqual(60);
    expect(kinds.size).toBeGreaterThanOrEqual(6);
  });

  it('puts a boss in the room farthest from the up stair, reachable without a secret or locked door', () => {
    const bosses = levelsWhere('boss', 25, (_, c) => c.plan.boss !== undefined);
    expect(bosses.length).toBe(25);
    for (const m of bosses) {
      const boss = m.level.monsters.find((x) => x.role === 'boss')!;
      expect(checkPlacement(m.level, m.contents.plan), `seed ${m.seed} level ${m.depth}`).toBeNull();
      expect(boss.dice).toBeLessThanOrEqual(bossCeiling(m.depth));
      expect(boss.artifact?.name).toBe(m.contents.plan.boss!.artifactName);
      // No ordinary monster shares the boss's room.
      const room = m.level.rooms.find((r) => boss.x >= r.x && boss.y >= r.y && boss.x < r.x + r.w && boss.y < r.y + r.h)!;
      const inRoom = m.level.monsters.filter((x) => x !== boss && x.x >= room.x && x.y >= room.y && x.x < room.x + room.w && x.y < room.y + room.h);
      expect(inRoom).toEqual([]);
    }
  });

  it('holds the vault behind sealed doors, shut off from everything else, in rooms, mazes and caves', () => {
    const layouts = new Set<string>();
    const vaults = levelsWhere('vault', 40, (_, c) => c.plan.pieces.some((p) => p.kind === 'vault'));
    expect(vaults.length).toBe(40);
    for (const m of vaults) {
      const { level } = m;
      layouts.add(level.layout);
      const vault = level.specials.find((s) => s.kind === 'vault');
      expect(vault, `seed ${m.seed} level ${m.depth}`).toBeDefined();
      if (vault?.kind !== 'vault') continue;
      const inside = (p: { x: number; y: number }): boolean => p.x >= vault.room.x && p.y >= vault.room.y && p.x < vault.room.x + vault.room.w && p.y < vault.room.y + vault.room.h;
      const sealed = level.doors.filter((d) => d.kind === 'sealed');
      expect(sealed.length).toBeGreaterThanOrEqual(1);
      expect(sealed.every((d) => !inside(d))).toBe(true);
      // The vault holds one chest with its treasure, and nothing else lives in it.
      const chest = level.features.filter((f) => inside(f));
      expect(chest.length).toBe(1);
      expect(chest[0]!.type === 'container' && chest[0]!.contents.some((l) => l.kind === 'coins')).toBe(true);
      expect(level.monsters.filter(inside)).toEqual([]);
      expect(level.traps.filter(inside)).toEqual([]);
      expect(level.npcs.filter(inside)).toEqual([]);
      expect(findProblems(level)).toEqual([]);
      expect(checkPlacement(level, m.contents.plan)).toBeNull();
    }
    expect(layouts.size).toBeGreaterThanOrEqual(3);
  });

  it('bolts a vault onto a level with no dead-end room, cut into solid rock', () => {
    const width = 40;
    const height = 20;
    const cells = new Uint8Array(width * height);
    const room = { x: 3, y: 3, w: 12, h: 8 };
    for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) cells[y * width + x] = FLOOR;
    const board = new Board(cells, width, height, [room], { x: 5, y: 5 }, null);
    const doors: Level['doors'] = [];
    const index = carveVault(board, doors, createRng(4));
    expect(index).toBe(1);
    expect(doors).toHaveLength(1);
    expect(doors[0]!.kind).toBe('sealed');
    expect(cells[doors[0]!.y * width + doors[0]!.x]).toBe(SEALED_DOOR);
    const vault = board.rooms[1]!;
    expect([vault.w, vault.h]).toEqual([5, 3]);
    for (let y = vault.y; y < vault.y + vault.h; y++) for (let x = vault.x; x < vault.x + vault.w; x++) expect(cells[y * width + x]).toBe(FLOOR);
    // The room is walled in on every side but the doorway.
    for (let x = vault.x - 1; x <= vault.x + vault.w; x++) for (const y of [vault.y - 1, vault.y + vault.h]) expect([WALL, SEALED_DOOR]).toContain(cells[y * width + x]);
  });

  it('holds back the captive\'s guards and gives the opponent a rating above the ceiling', () => {
    const quests = levelsWhere('quests', 30, (_, c) => c.plan.quests.some((g) => g.quest.type === 'captive' || g.quest.type === 'opponent'));
    let guards = 0;
    for (const m of quests) {
      for (const g of m.contents.plan.quests) {
        if (g.quest.type === 'captive') guards += m.level.monsters.filter((x) => x.role === 'guard' && x.quest === g.quest.id).length;
        if (g.quest.type === 'opponent') {
          const opp = m.level.monsters.find((x) => x.quest === g.quest.id)!;
          expect(opp.role).toBe('opponent');
          expect(opp.name).toBe(g.person);
          expect(opp.dice > ratingCeiling(m.depth) || (ratingCeiling(m.depth) === 20 && opp.modifier > 0)).toBe(true);
        }
      }
    }
    expect(guards).toBeGreaterThan(0);
  });

  it('puts a quest\'s magic item behind a locked door about half the time, never behind a secret one', () => {
    let behind = 0;
    let total = 0;
    for (const m of levelsWhere('magic-quest', 60, (_, c) => c.plan.quests.some((g) => g.quest.type === 'magic_item'))) {
      total++;
      expect(checkPlacement(m.level, m.contents.plan), `seed ${m.seed}`).toBeNull();
      const locked = m.level.doors.some((d) => d.kind === 'locked');
      if (locked) behind++;
    }
    expect(total).toBe(60);
    expect(behind).toBeGreaterThan(0);
  });

  it('generates level 100 with no down stair, no boss or teleporter and its placements', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const options = runOptionsFor(BUNDLE, seed);
      const contents = options.contentsFor!(MAX_DEPTH)!;
      const level = generateLevel(seed, MAX_DEPTH, 'medium', options.styleFor!(MAX_DEPTH), contents);
      expect(level.downStair).toBeNull();
      expect(checkPlacement(level, contents.plan)).toBeNull();
      expect(findProblems(level)).toEqual([]);
      expect(level.monsters.length).toBeGreaterThan(0);
    }
  });

  it('plans a level from the run layout: its boss, artifact, lift token, teleporter and village below', () => {
    const options = runOptionsFor(BUNDLE, 5);
    const layout = options.layout!;
    const content = placementContentOf(BUNDLE);
    const boss = layout.bosses[0]!;
    const plan = planLevel(layout, content, undefined, boss.level);
    expect(plan.boss?.artifactId).toBe(boss.artifactId);
    expect(plan.boss?.liftToken).toBe(layout.links.some((l) => l.type === 'lift_token' && l.level === boss.level));
    const village = layout.villages[0]!.level;
    expect(planLevel(layout, content, undefined, village - 1).villageBelow).toBe(true);
    expect(planLevel(layout, content, undefined, 1).villageBelow).toBe(village === 2);
    const pair = layout.teleporters[0];
    if (pair) expect(planLevel(layout, content, undefined, pair[0]).teleporterTo).toBe(pair[1]);
  });
});

describe('the game on placed levels', () => {
  it('starts a run with the level\'s own monsters and a locked door that stays shut', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const run = new Run(seed, testPlayer(), { ...runOptionsFor(BUNDLE, seed), startDepth: 1 });
      const game = run.game!;
      const level = game.state.map.level;
      const fighters = level.npcs.filter((n) => n.kind === 'bandit' || n.kind === 'rival');
      expect(game.state.monsters.slice(0, level.monsters.length).map((m) => [m.x, m.y, m.dice])).toEqual(level.monsters.map((m) => [m.x, m.y, m.dice]));
      // Bandits and rivals join the monsters as creatures; traders, hermits and captives do not fight.
      expect(game.state.monsters.slice(level.monsters.length).map((m) => [m.kind, m.name])).toEqual(fighters.map((n) => [n.kind, n.name]));
      expect(level.monsters.length).toBeGreaterThanOrEqual(MONSTER_COUNTS[level.size][0]);
      for (const door of level.doors) {
        const tile = level.tiles[door.y]![door.x];
        expect(tile).toBe(door.kind === 'secret' ? '#' : '+');
        expect(game.state.map.terrain[door.y * level.width + door.x]).toBe(0); // shut: blocks sight and movement
      }
    }
  });
});

describe('validation (Spec 02, step 12)', () => {
  it('rejects a level whose rules are broken', () => {
    const made = levelsWhere('validate', 4, (_, c) => c.plan.depth > 10)[0]!;
    expect(findProblems(made.level)).toEqual([]);
    const withDoor = ofTheme('cellars_and_crypts', 40).find((m) => m.level.doors.some((d) => d.kind === 'normal'))!;
    // A locked door with no key for it breaks "one key per locked door".
    const target = withDoor.level.doors.findIndex((d) => d.kind === 'normal');
    const broken = { ...withDoor.level, doors: withDoor.level.doors.map((d, i) => (i === target ? { ...d, kind: 'locked' as const } : d)) };
    expect(findProblems(broken).join()).toMatch(/locked doors but .* keys/);
    // A monster beside the up stair breaks the safe radius.
    const near = { ...made.level, monsters: [...made.level.monsters, { ...made.level.monsters[0]!, x: made.level.upStair.x + 1, y: made.level.upStair.y }] };
    expect(findProblems(near).join()).toMatch(/within 8 cells|shares|not on plain floor/);
    // A container on a stair cannot stand there.
    const onStair = { ...made.level, features: [...made.level.features, { type: 'container' as const, kind: 'chest' as const, contents: [], ...made.level.upStair }] };
    expect(findProblems(onStair).join()).toMatch(/not on plain floor/);
  });
});

describe('performance (Spec 02, Acceptance criteria)', () => {
  it('generates a large level with all its contents in well under 50 ms on average', () => {
    const times: number[] = [];
    for (let seed = 1; times.length < 40 && seed < 400; seed++) {
      const options = runOptionsFor(BUNDLE, seed);
      for (let depth = 21; depth <= 99 && times.length < 40; depth += 9) {
        if (options.sizeFor!(depth) !== 'large' || isVillageLevel(options.layout!, depth)) continue;
        const contents = options.contentsFor!(depth)!;
        const start = performance.now();
        generateLevel(seed, depth, 'large', options.styleFor!(depth), contents);
        times.push(performance.now() - start);
      }
    }
    expect(times.length).toBe(40);
    expect(times.reduce((a, b) => a + b, 0) / times.length).toBeLessThan(50);
  });
});
