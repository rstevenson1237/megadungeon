// An independent checker for what the placement pipeline puts on a level (Spec 02, steps 4 to 11 and
// "Reachability and door rules"), written separately from the validator in src/rules/world/validate.ts:
// plain Sets and breadth-first searches over the tile rows and the level's lists.

import { resolve } from 'node:path';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { PLACEMENT_COUNTS, MONSTER_COUNTS, ratingCeiling, treasureBudget } from '../src/rules/world/depth.ts';
import type { Level, Loot, Point } from '../src/rules/world/level.ts';
import type { LevelPlan } from '../src/rules/world/placement/index.ts';
import { isVillageLevel } from '../src/rules/world/run-layout.ts';
import { buildContent } from '../tools/content-build.ts';

export const { bundle: BUNDLE, errors: CONTENT_ERRORS } = buildContent(resolve(import.meta.dirname, '..', 'content'));

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

/** Every cell reachable from `from` by orthogonal steps over cells for which `open` holds. */
function reach(level: Level, from: Point, open: (x: number, y: number) => boolean): Set<number> {
  const { width, height } = level;
  const seen = new Set<number>();
  if (!open(from.x, from.y)) return seen;
  const queue = [from.y * width + from.x];
  seen.add(queue[0]!);
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]!;
    const x = i % width;
    const y = (i - x) / width;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (!seen.has(n) && open(nx, ny)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return seen;
}

export const lootOf = (level: Level): { at: Point; loot: Loot }[] => [
  ...level.piles.flatMap((p) => p.contents.map((loot) => ({ at: p as Point, loot }))),
  ...level.features.flatMap((f) => (f.type === 'container' ? f.contents.map((loot) => ({ at: f as Point, loot })) : [])),
];

/** The worth of coins, gems and jewelry in a level, in gp at base value. */
export function treasureValue(level: Level): number {
  let total = 0;
  for (const { loot } of lootOf(level)) {
    if (loot.kind === 'coins') total += loot.amount;
    else if (loot.kind === 'gem' || loot.kind === 'jewelry') total += loot.value;
  }
  return total;
}

/**
 * The first rule the level breaks, or null. Checks doors, the critical path, keys, blockers, traps, monsters,
 * treasure and the counts of Spec 02's clarifications of task 2.4.
 */
export function checkPlacement(level: Level, plan: LevelPlan | undefined): string | null {
  const { width, tiles } = level;
  const k = (p: Point): number => p.y * width + p.x;
  const door = new Map(level.doors.map((d) => [k(d), d.kind]));
  const tile = (x: number, y: number): string => tiles[y]![x]!;
  const rock = (x: number, y: number): boolean => tile(x, y) === '#' && !door.has(y * width + x);
  const liquid = (x: number, y: number): boolean => tile(x, y) === '=' || tile(x, y) === '%';
  const everything = (x: number, y: number): boolean => !rock(x, y) && !liquid(x, y);
  const noSecret = (x: number, y: number): boolean => everything(x, y) && door.get(y * width + x) !== 'secret';
  const plain = (x: number, y: number): boolean => noSecret(x, y) && !['locked', 'sealed'].includes(door.get(y * width + x) ?? '');

  // Doors: one cell wide with wall on both sides, never side by side, drawn as the spec says.
  for (const d of level.doors) {
    const sides = (a: Point, b: Point): boolean => rock(a.x, a.y) && rock(b.x, b.y);
    const across = sides({ x: d.x - 1, y: d.y }, { x: d.x + 1, y: d.y }) || sides({ x: d.x, y: d.y - 1 }, { x: d.x, y: d.y + 1 });
    if (!across) return `${d.kind} door at ${d.x},${d.y} is not in a one-cell doorway`;
    if (tile(d.x, d.y) !== (d.kind === 'secret' ? '#' : '+')) return `${d.kind} door drawn as ${tile(d.x, d.y)}`;
    for (const [dx, dy] of DIRS) if (door.has(k({ x: d.x + dx, y: d.y + dy }))) return `doors side by side at ${d.x},${d.y}`;
  }
  if (level.layout === 'cellular_caves' && level.doors.some((d) => d.kind !== 'sealed')) return 'a cave level has an ordinary door';

  // The critical path: stairs, teleporters, the boss and any landing with no secret or locked door on the way.
  const open = reach(level, level.upStair, plain);
  const critical: [string, Point][] = [];
  if (level.downStair) critical.push(['down stair', level.downStair]);
  for (const s of level.specials) if (s.kind === 'teleporter' || s.kind === 'landing') critical.push([s.kind, s]);
  for (const m of level.monsters) if (m.role === 'boss') critical.push(['boss', m]);
  for (const [what, p] of critical) if (!open.has(k(p))) return `${what} is off the critical path`;

  // Keys: one per locked door, each reachable with every locked door shut (so never through its own).
  const locked = level.doors.filter((d) => d.kind === 'locked');
  const keys = lootOf(level).filter((l) => l.loot.kind === 'key');
  if (keys.length !== locked.length) return `${locked.length} locked doors, ${keys.length} keys`;
  for (const key of keys) if (!open.has(k(key.at))) return `a key at ${key.at.x},${key.at.y} is behind a locked door`;
  if (level.doors.some((d) => d.kind === 'sealed') !== (level.specials.some((s) => s.kind === 'vault'))) return 'sealed doors and the vault disagree';

  // Quest goals and link pieces: no secret door in the way.
  const noSecretReach = reach(level, level.upStair, noSecret);
  for (const { at, loot } of lootOf(level)) {
    if (['quest_item', 'vault_key', 'map_fragment'].includes(loot.kind) && !noSecretReach.has(k(at))) return `${loot.kind} behind a secret door`;
    if (['vault_key', 'map_fragment'].includes(loot.kind) && !open.has(k(at))) return `${loot.kind} behind a locked door`;
  }
  for (const n of level.npcs) if ((n.quest || n.link) && !noSecretReach.has(k(n))) return `${n.kind} ${n.name} behind a secret door`;
  for (const m of level.monsters) if (m.quest && !noSecretReach.has(k(m))) return `${m.name} of a quest behind a secret door`;

  // Blockers never block: with every container, fixture and NPC as a wall, every other cell is still reachable.
  const blockers = new Set<number>();
  for (const f of level.features) if (f.type !== 'debris') blockers.add(k(f));
  for (const n of level.npcs) blockers.add(k(n));
  const around = reach(level, level.upStair, (x, y) => everything(x, y) && !blockers.has(y * width + x));
  const walkable = reach(level, level.upStair, everything);
  if (around.size + blockers.size !== walkable.size) return 'a blocker cuts the level in two';
  for (const b of blockers) if (!walkable.has(b)) return 'a blocker stands off the map';

  // Traps: on plain floor, never on a stair, a door or a teleporter, never in a doorway.
  const teleporters = new Set(level.specials.filter((s) => s.kind === 'teleporter').map(k));
  for (const t of level.traps) {
    if (tile(t.x, t.y) !== '.' || teleporters.has(k(t))) return `trap at ${t.x},${t.y} is on a stair or door or teleporter`;
    // (Caves have clearings, not rooms with doorways, so only the other layouts are checked.)
    const wallsAround = (a: Point, b: Point): boolean => rock(a.x, a.y) && rock(b.x, b.y);
    const room = (p: Point): boolean => level.rooms.some((r) => p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h);
    const side = (a: Point, b: Point): boolean => everything(a.x, a.y) && everything(b.x, b.y) && (room(a) || room(b));
    const left = { x: t.x - 1, y: t.y };
    const right = { x: t.x + 1, y: t.y };
    const above = { x: t.x, y: t.y - 1 };
    const below = { x: t.x, y: t.y + 1 };
    const gap = (wallsAround(left, right) && side(above, below)) || (wallsAround(above, below) && side(left, right));
    if (level.layout !== 'cellular_caves' && gap && !room(t)) return `trap at ${t.x},${t.y} is in a doorway`;
    if (plan && t.id === 'trap_deep_pit' && (level.depth >= 99 || plan.villageBelow)) return 'a deep pit where none may open';
  }

  // Monsters: none within 8 cells of the up stair, and on floor.
  for (const m of level.monsters) {
    if ((m.x - level.upStair.x) ** 2 + (m.y - level.upStair.y) ** 2 <= 64) return `${m.name} within 8 cells of the up stair`;
    if (tile(m.x, m.y) !== '.') return `${m.name} is not on floor`;
  }

  // Nothing shares a cell.
  const cells = new Set<number>();
  const spots: Point[] = [
    ...level.features, ...level.piles, ...level.traps, ...level.monsters, ...level.npcs, ...level.lore,
    ...level.specials.filter((s) => s.kind === 'teleporter' || s.kind === 'landing' || s.kind === 'lever'),
  ];
  for (const p of spots) {
    if (cells.has(k(p))) return `two things at ${p.x},${p.y}`;
    cells.add(k(p));
  }
  for (const mark of level.lore) if (!rock(mark.x, mark.y)) return 'a lore mark is not on a wall';

  // Counts and treasure (Spec 02, clarifications of task 2.4).
  const theme = plan?.theme?.features;
  const containers = level.features.filter((f) => f.type === 'container' && !f.link).length;
  const fixtures = level.features.filter((f) => f.type === 'fixture' && !f.link).length;
  if (containers > Math.round(PLACEMENT_COUNTS.containers[level.size][1] * (theme?.containers ?? 1))) return `${containers} containers`;
  if (fixtures > PLACEMENT_COUNTS.fixtures[level.size][1]) return `${fixtures} fixtures`;
  if (level.traps.length > PLACEMENT_COUNTS.floorTraps[level.size][1]) return `${level.traps.length} traps`;
  const normal = level.monsters.filter((m) => m.role === 'normal').length;
  const [lo, hi] = MONSTER_COUNTS[level.size];
  if (normal < lo || normal > hi) return `${normal} monsters, not ${lo} to ${hi}`;
  const budget = treasureBudget(level.depth);
  const worth = treasureValue(level);
  if (worth < budget * 0.5 - 60 || worth > budget * 1.5 + 60) return `treasure ${worth} gp against a budget of ${budget}`;
  return null;
}

/** What the run layout assigned to the level must be on it (Spec 02, step 11). */
export function checkPlan(level: Level, plan: LevelPlan): string | null {
  const loot = lootOf(level).map((l) => l.loot);
  if (plan.teleporterTo !== undefined) {
    if (!level.specials.some((s) => s.kind === 'teleporter' && s.to === plan.teleporterTo)) return 'teleporter missing';
  } else if (level.specials.some((s) => s.kind === 'teleporter')) return 'a teleporter nobody assigned';
  const bosses = level.monsters.filter((m) => m.role === 'boss');
  if (plan.boss) {
    if (bosses.length !== 1) return `${bosses.length} bosses`;
    if (plan.boss.artifactId && bosses[0]!.artifact?.id !== plan.boss.artifactId) return 'boss without its artifact';
    if (Boolean(bosses[0]!.liftToken) !== plan.boss.liftToken) return 'lift token on the wrong boss';
  } else if (bosses.length > 0) return 'a boss nobody assigned';
  for (const { quest, item, person } of plan.quests) {
    if (quest.type === 'captive' && !level.npcs.some((n) => n.kind === 'captive' && n.quest === quest.id)) return `captive of ${quest.id} missing`;
    if (quest.type === 'captive' && person && level.npcs.find((n) => n.quest === quest.id)!.name !== person) return 'captive misnamed';
    if (quest.type === 'opponent') {
      const opp = level.monsters.find((m) => m.quest === quest.id && m.role === 'opponent');
      if (!opp) return `opponent of ${quest.id} missing`;
      if (opp.dice <= ratingCeiling(level.depth) && ratingCeiling(level.depth) < 20) return 'opponent not above the ceiling';
    }
    if ((quest.type === 'belonging' || quest.type === 'magic_item') && item) {
      if (!loot.some((l) => l.kind === 'quest_item' && l.quest === quest.id && l.id === item.id)) return `item of ${quest.id} missing`;
    }
  }
  const count = (p: (l: Loot) => boolean): number => loot.filter(p).length;
  for (const piece of plan.pieces) {
    const found: Record<string, boolean> = {
      vault_key: count((l) => l.kind === 'vault_key') > 0,
      vault: level.specials.some((s) => s.kind === 'vault'),
      map_fragment: count((l) => l.kind === 'map_fragment') > 0,
      lore_entry: level.lore.some((m) => m.link === piece.link && m.kind === 'graffiti'),
      lore_end: piece.kind === 'lore_end' && piece.end === 'cache' ? level.features.some((f) => f.type === 'container' && f.link === piece.link) : level.lore.some((m) => m.link === piece.link),
      rune_letter: level.lore.some((m) => m.kind === 'rune' && m.link === piece.link),
      rune_altar: level.specials.some((s) => s.kind === 'rune_altar'),
      specialist: level.npcs.some((n) => n.link === piece.link && n.service !== undefined),
      rival: level.npcs.some((n) => n.link === piece.link && n.kind === 'rival'),
      rival_stash: level.features.some((f) => f.type === 'container' && f.link === piece.link),
      shrine: level.features.some((f) => f.type === 'fixture' && f.link === piece.link && f.god !== undefined),
      lever: level.specials.some((s) => s.kind === 'lever'),
      landing: level.specials.some((s) => s.kind === 'landing'),
    };
    if (!found[piece.kind]) return `${piece.kind} of ${piece.link} missing`;
  }
  return null;
}

export interface SweepStats {
  levels: number;
  fallbacks: number;
  failures: string[];
}

/** One level per seed, the depth cycling over 1 to 99 (never a village), checked against every rule. */
export function sweep(from: number, to: number): SweepStats {
  const stats: SweepStats = { levels: 0, fallbacks: 0, failures: [] };
  for (let seed = from; seed < to; seed++) {
    const options = runOptionsFor(BUNDLE, seed);
    const layout = options.layout!;
    let depth = 1 + ((seed * 13 + 5) % 99);
    while (isVillageLevel(layout, depth)) depth = (depth % 99) + 1;
    const contents = options.contentsFor!(depth)!;
    const level = generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), contents);
    stats.levels++;
    if (level.fallback) stats.fallbacks++;
    const problem = checkPlacement(level, contents.plan) ?? checkPlan(level, contents.plan);
    if (problem) stats.failures.push(`seed ${seed} level ${depth}: ${problem}`);
  }
  return stats;
}
