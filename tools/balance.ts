// The balance runs of task 4.11 (plan, "Balance playtests"): scripted measurements of depth pace, the economy and
// class parity, played on the real tables and the real rules. Nothing here changes a rule; it measures them.
//
//   npm run balance            print the report
//   npm run balance -- --write write it to docs/13-balance-report.md
//
// Depth pace (Spec 02, "Depth scaling"): every level 1 to 99 of each seed is generated and its treasure counted, as a
// thorough player who takes everything and does every quest would bank it. Gems and jewelry count at 90% of base, the
// mean of the appraiser's 60% to 120% (Spec 05).
//
// Economy (Spec 07): what a trip's village costs come to against the treasure of the levels that village serves.
//
// Class parity (Spec 03): each class, at the level a thorough player has reached by a depth, fights the monsters
// generated for that depth one after another in an arena, waiting to full Combat between fights (Spec 03, "Waiting")
// with no village rest, until it dies or has won 20 fights (a level's worth). The measure is fights won.

import { resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRng } from '../src/core/rng.ts';
import type { ContentBundle, Spell } from '../src/core/schemas.ts';
import { MAJOR_KINDS, bindDrawn, majorOf } from '../src/game/abilities.ts';
import { decoyCells } from '../src/game/allies.ts';
import { gameContentOf, type GameContent } from '../src/game/content.ts';
import { Game, type ActResult, type PlayerState } from '../src/game/game.ts';
import { creationContentOf, startingPlayer } from '../src/game/lifecycle.ts';
import { isAlly, spawn, type Monster } from '../src/game/monsters.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { STARTING_BANK } from '../src/game/town-state.ts';
import type { ClassDef } from '../src/rules/character/character.ts';
import { classesFrom } from '../src/rules/character/classes.ts';
import { stepUp, type PoolName } from '../src/rules/character/dice.ts';
import { LEVEL_XP, MAX_LEVEL, levelForXp, levelUp } from '../src/rules/character/progression.ts';
import { itemDataFrom, type ItemData } from '../src/rules/items/magic.ts';
import { IDENTIFY_PRICE, REPAIR_RATE, villageMultiplier } from '../src/rules/items/prices.ts';
import { spellsFrom } from '../src/rules/magic/spells.ts';
import { lodgingPrice, rumourPrice } from '../src/rules/villages/economy.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { GENERATOR_VERSION, MAX_DEPTH, emptyPlacements, type Level, type Loot, type PlacedMonster } from '../src/rules/world/level.ts';
import { buildContent } from './content-build.ts';

/** The plan's gate for task 4.11: character level 10 near dungeon level 50 to 55 (Spec 02, Depth scaling). */
export const PACE_TARGET: readonly [number, number] = [50, 55];
/** The mean of the appraiser's 60% to 120% of base (Spec 05). */
export const APPRAISAL_MEAN = 0.9;
/** Fights in a gauntlet: about one level's worth of monsters (Spec 02, monster counts). */
export const GAUNTLET_FIGHTS = 20;
/** A class is "far behind" when it wins fewer than half the fights the median class wins. */
export const FAR_BEHIND = 0.5;
/** The depths class parity is measured at. */
export const PARITY_DEPTHS: readonly number[] = [3, 10, 20, 30, 40, 50, 60, 75, 90, 99];

const XP_FOR_TEN = LEVEL_XP[MAX_LEVEL - 1]!;

// --- Depth pace ---

/** What a thorough player banks from one loot list: coins at face value, gems and jewelry at the appraisal mean. */
export const lootValue = (loot: readonly Loot[]): number =>
  loot.reduce((n, l) => n + (l.kind === 'coins' ? l.amount : l.kind === 'gem' || l.kind === 'jewelry' ? l.value * APPRAISAL_MEAN : 0), 0);

/** Treasure a generated level holds: every container and every loose pile. */
export const levelTreasure = (level: Level): number =>
  level.features.reduce((n, f) => n + (f.type === 'container' ? lootValue(f.contents) : 0), 0) + level.piles.reduce((n, p) => n + lootValue(p.contents), 0);

export interface SeedPace {
  seed: number;
  /** Treasure banked by the end of each level, index 0 the surface; quest rewards count at their goal level. */
  cumulative: number[];
  /** The first level whose treasure takes the character to level 10; undefined if none does. */
  levelTen: number | undefined;
}

/** The pace of one run: every level 1 to 99 generated from the real tables. */
export function seedPace(bundle: ContentBundle, seed: number): SeedPace {
  const options = runOptionsFor(bundle, seed);
  const layout = options.layout!;
  const villages = new Set(layout.villages.map((v) => v.level));
  const cumulative = [0];
  let total = 0;
  let levelTen: number | undefined;
  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    if (!villages.has(depth) && depth < MAX_DEPTH) {
      total += levelTreasure(generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), options.contentsFor!(depth)));
    }
    for (const q of layout.quests) if (q.level === depth) total += q.reward;
    cumulative.push(total);
    if (levelTen === undefined && total >= XP_FOR_TEN) levelTen = depth;
  }
  return { seed, cumulative, levelTen };
}

export interface PaceReport {
  seeds: number;
  /** Mean treasure banked by the end of each level. */
  meanCumulative: number[];
  /** Levels where each seed reaches character level 10, sorted. */
  levelTen: number[];
  median: number;
  /** The character level a thorough player has on arriving at each depth (treasure of the levels above). */
  levelOnArrival: number[];
}

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export function measurePace(bundle: ContentBundle, seeds: readonly number[]): PaceReport {
  const runs = seeds.map((s) => seedPace(bundle, s));
  const meanCumulative = runs[0]!.cumulative.map((_, d) => runs.reduce((n, r) => n + r.cumulative[d]!, 0) / runs.length);
  const levelTen = runs.map((r) => r.levelTen ?? Infinity).sort((a, b) => a - b);
  const levelOnArrival = meanCumulative.map((_, d) => (d === 0 ? 1 : levelForXp(meanCumulative[d - 1]!)));
  return { seeds: seeds.length, meanCumulative, levelTen, median: median(levelTen), levelOnArrival };
}

// --- Economy ---

export interface VillageEconomy {
  /** Village number (0 is the surface) and a typical depth for it: the middle of its band. */
  number: number;
  depth: number;
  rest: number;
  rumour: number;
  identify: number;
  /** Repairing a long sword, the commonest starting weapon. */
  repair: number;
  /** The lift from the surface, at the mean fare factor. */
  liftFromSurface: number;
  /** One trip's basket: a rest, a rumour, one identification and one repair. */
  basket: number;
  /** Treasure of one level a typical trip from this village explores (the level below it). */
  levelIncome: number;
}

/** The middles of the village bands (Spec 02, Run layout), the surface first. */
export const TYPICAL_VILLAGE_DEPTHS: readonly number[] = [0, 10, 30, 50, 70, 90];

export function measureEconomy(pace: PaceReport, items: ItemData): VillageEconomy[] {
  const swordValue = items.bases.get('long_sword')?.price ?? 0;
  return TYPICAL_VILLAGE_DEPTHS.map((depth, number) => {
    const mult = villageMultiplier(number);
    const rest = lodgingPrice(number);
    const rumour = rumourPrice(number);
    const identify = Math.ceil(IDENTIFY_PRICE * mult);
    const repair = Math.ceil(swordValue * REPAIR_RATE * mult);
    // The mean fare factor is 1.0 (0.8 to 1.2): 10 gp a level times (0.5 + the deeper level / 100).
    const liftFromSurface = depth === 0 ? 0 : Math.round(10 * depth * (0.5 + depth / 100));
    const below = Math.min(MAX_DEPTH - 1, depth + 1);
    const levelIncome = pace.meanCumulative[below]! - pace.meanCumulative[below - 1]!;
    return { number, depth, rest, rumour, identify, repair, liftFromSurface, basket: rest + rumour + identify + repair, levelIncome };
  });
}

// --- Class parity ---

const ARENA_W = 30;
const ARENA_H = 7;

/** An open arena: a 28 x 5 room, the up stair at its west end. */
export function arena(depth: number): Level {
  const rows = Array.from({ length: ARENA_H }, (_, y) => (y === 0 || y === ARENA_H - 1 ? '#'.repeat(ARENA_W) : `#${'.'.repeat(ARENA_W - 2)}#`));
  rows[3] = `#<${rows[3]!.slice(2)}`;
  return {
    generatorVersion: GENERATOR_VERSION, runSeed: 0, depth, size: 'small', layout: 'rooms_and_corridors',
    width: ARENA_W, height: ARENA_H, tiles: rows, rooms: [], upStair: { x: 1, y: 3 }, downStair: null, attempts: 1, fallback: false,
    ...emptyPlacements(),
  };
}

/**
 * Where a level's new die goes: Combat to 3, then the class's better non-Combat pool at level 10 to 4 (when it
 * outranks Combat), Combat to 6, then that pool to 6, then anything with room. Every class ends level 10 with 6
 * Combat dice, so classes differ by their steps, abilities, spells and gear, not by this choice.
 */
export function poolFor(player: PlayerState, cls: ClassDef): PoolName {
  const ten = { ...cls.start };
  for (const level of [4, 7, 9] as const) ten[cls.steps[level]] = stepUp(ten[cls.steps[level]]);
  const prime: PoolName = ten.magic > ten.skill ? 'magic' : 'skill';
  const { combat } = player.pools;
  const second = player.pools[prime];
  if (combat.max < 3) return 'combat';
  if (second.max < 4 && ten[prime] >= ten.combat) return prime;
  if (combat.max < 6) return 'combat';
  if (second.max < 6) return prime;
  return (['combat', 'skill', 'magic'] as const).find((p) => player.pools[p].max < 6) ?? 'combat';
}

export interface ParityContent {
  bundle: ContentBundle;
  classes: ClassDef[];
  spells: Spell[];
  items: ItemData;
  content: GameContent;
}

export const parityContentOf = (bundle: ContentBundle): ParityContent => ({
  bundle,
  classes: classesFrom(bundle),
  spells: spellsFrom(bundle),
  items: itemDataFrom(bundle),
  content: gameContentOf(bundle),
});

/** A character of `cls` at `level`, made on the creation path and levelled up with its draws in effect. */
export function characterAt(pc: ParityContent, cls: ClassDef, level: number, seed: number): PlayerState {
  const player = startingPlayer(seed, 'Tester', cls, creationContentOf(pc.bundle));
  player.xp = LEVEL_XP[level - 1]!;
  for (let l = 2; l <= level; l++) {
    const result = levelUp(seed, player, cls, poolFor(player, cls));
    if (result?.minor) bindDrawn(player, result.minor, pc.content.minors);
  }
  return player;
}

/** The ordinary monsters generated for a depth on a few seeds: the foes a gauntlet draws from. */
export function foesFor(bundle: ContentBundle, depth: number, seeds: readonly number[] = [1001, 1002, 1003, 1004]): PlacedMonster[] {
  const foes: PlacedMonster[] = [];
  for (const seed of seeds) {
    const options = runOptionsFor(bundle, seed);
    const villages = new Set(options.layout!.villages.map((v) => v.level));
    const d = villages.has(depth) ? depth + 1 : depth;
    const level = generateLevel(seed, d, options.sizeFor!(d), options.styleFor!(d), options.contentsFor!(d));
    foes.push(...level.monsters.filter((m) => m.role === 'normal'));
  }
  return foes;
}

/** Damage spells the arena player casts, best first. */
const DAMAGE_SPELLS = ['lightning_bolt', 'arcane_bolt', 'life_tap', 'drain'];

const spent = (r: ActResult | undefined): boolean => r?.spent === true;

/**
 * One gauntlet: the character fights `foes` one at a time, each placed 8 cells away as generated (asleep or unaware),
 * waiting to full Combat between fights. The player's play is simple and the same for every class: use the class's
 * ability when it helps, drink a healing potion at one Combat die, cast Heal likewise, cast the best damage spell from
 * range (and in melee when its Magic step is at least its Combat step), shoot when it has a ranged weapon, else close
 * and fight in melee. Returns the fights won.
 */
export function gauntlet(pc: ParityContent, cls: ClassDef, level: number, depth: number, foes: readonly PlacedMonster[], seed: number, fights = GAUNTLET_FIGHTS): number {
  const player = characterAt(pc, cls, level, seed);
  const game = new Game(seed, arena(depth), player, { spells: pc.spells, items: pc.items, content: pc.content });
  const rng = createRng(seed * 7919 + depth);
  const known = player.spells.map((id) => game.spells.get(id)).filter((s): s is Spell => s !== undefined);
  const damage = DAMAGE_SPELLS.map((id) => known.find((s) => s.id === id)).filter((s): s is Spell => s !== undefined)[0];
  const heal = known.find((s) => s.id === 'heal');
  const major = majorOf(player) ?? '';
  const pools = player.pools;
  const potion = (id: string) => player.pack.find((i) => i.id === id);
  // Wandering monsters are cleared away, so every gauntlet meets the same foes (Spec 02 rolls them as usual).
  const onlyFoe = (foe?: Monster) => (game.state.monsters = game.state.monsters.filter((m) => m === foe || isAlly(m)));

  let won = 0;
  for (let rounds = 0; won < fights && !player.dead && rounds < 6000; ) {
    for (let i = 0; i < 200 && pools.combat.dice < pools.combat.max && !player.dead; i++, rounds++) {
      game.act({ type: 'wait' });
      onlyFoe();
    }
    if (player.dead) break;
    const at = game.state.map.player;
    const x = at.x + 8 < ARENA_W - 1 ? at.x + 8 : at.x - 8;
    const foe = spawn({ ...foes[rng.int(0, foes.length - 1)]!, x, y: at.y }, 1000 + won, rng);
    game.state.monsters.push(foe);
    let usedMajor = false;
    for (let r = 0; r < 300 && !player.dead && foe.dice > 0 && game.state.monsters.includes(foe); r++, rounds++) {
      onlyFoe(foe);
      const me = game.state.map.player;
      const dist = Math.max(Math.abs(foe.x - me.x), Math.abs(foe.y - me.y));
      const adjacent = dist <= 1;
      if (major === 'smite' && !player.smite && pools.magic.dice > 0) game.useMajor();
      if (!usedMajor && MAJOR_KINDS[major] === 'active' && !['raise', 'spirit_totem', 'volley'].includes(major)) {
        const aim = major === 'decoy' ? decoyCells(game)[0] : major === 'rage' || major === 'wild_shape' ? undefined : foe;
        if (dist <= 3 || major === 'mark' || major === 'fascinate') {
          usedMajor = major === 'mark'; // Mark only takes an unaware creature: one try per fight
          if (spent(game.useMajor(aim))) {
            usedMajor = true;
            continue;
          }
        }
      }
      const low = pools.combat.dice <= 1 && pools.combat.max > 1;
      const healing = potion('potion_healing');
      if (low && healing && spent(game.use(healing))) continue;
      const clarity = potion('potion_clarity');
      if (damage && pools.magic.dice === 0 && clarity && spent(game.use(clarity))) continue;
      if (low && heal && pools.magic.dice > 0 && spent(game.cast(heal))) continue;
      const casting = damage && pools.magic.dice > 0 && (!adjacent || pools.magic.step >= pools.combat.step);
      if (casting && spent(game.cast(damage, foe))) continue;
      if (!adjacent) {
        const option = game.ranged();
        if (option && !option.problem && pools.skill.dice > 0) {
          if (major === 'volley' && spent(game.useMajor([foe]))) continue;
          if (spent(game.fire(foe))) continue;
        }
      }
      const dx = Math.sign(foe.x - me.x);
      const dy = adjacent ? Math.sign(foe.y - me.y) : 0;
      if (!spent(game.act({ type: 'move', dx, dy }))) game.act({ type: 'wait' });
    }
    if (player.dead) break;
    won++;
    if (major === 'raise') game.useMajor(); // the creature just killed fights beside the Necromancer
  }
  return won;
}

export interface ParityRow {
  className: string;
  /** Mean fights won at each parity depth. */
  won: number[];
  mean: number;
}

export interface ParityReport {
  depths: readonly number[];
  levels: number[];
  trials: number;
  rows: ParityRow[];
  medianMean: number;
  /** Classes winning fewer than FAR_BEHIND times the median class's fights. */
  farBehind: string[];
}

export function measureParity(pc: ParityContent, levelOnArrival: readonly number[], trials: number, depths: readonly number[] = PARITY_DEPTHS): ParityReport {
  const levels = depths.map((d) => levelOnArrival[d]!);
  const foes = depths.map((d) => foesFor(pc.bundle, d));
  const rows = pc.classes.map((cls) => {
    const won = depths.map((d, i) => {
      let n = 0;
      for (let seed = 1; seed <= trials; seed++) n += gauntlet(pc, cls, levels[i]!, d, foes[i]!, seed);
      return n / trials;
    });
    return { className: cls.name, won, mean: won.reduce((a, b) => a + b, 0) / won.length };
  });
  const medianMean = median(rows.map((r) => r.mean));
  const farBehind = rows.filter((r) => r.mean < FAR_BEHIND * medianMean).map((r) => r.className);
  return { depths, levels, trials, rows, medianMean, farBehind };
}

// --- The report ---

const gp = (n: number): string => Math.round(n).toLocaleString('en-US');

export function renderReport(pace: PaceReport, economy: VillageEconomy[], parity: ParityReport): string {
  const out: string[] = [];
  const [lo, hi] = PACE_TARGET;
  const inTarget = pace.levelTen.filter((d) => d >= lo && d <= hi).length;
  out.push('## Depth pace', '');
  out.push(`${pace.seeds} seeds, every level 1 to 99 generated. Character level 10 (${gp(XP_FOR_TEN)} XP) lands at a median of depth ${pace.median}; ${inTarget} of ${pace.seeds} seeds land within ${lo} to ${hi}. Earliest ${pace.levelTen[0]}, latest ${pace.levelTen[pace.levelTen.length - 1]}.`, '');
  out.push('| Depth | Spec 02 cumulative | Measured cumulative | Level on arrival |', '| --- | --- | --- | --- |');
  for (const d of [1, 10, 20, 40, 50, 55, 60, 80, 99]) {
    let nominal = 0;
    for (let i = 1; i <= d; i++) nominal += 50 + 10 * i * i;
    out.push(`| ${d} | ${gp(nominal)} | ${gp(pace.meanCumulative[d]!)} | ${pace.levelOnArrival[d]} |`);
  }
  out.push('', '## Economy', '');
  out.push(`The bank starts at ${STARTING_BANK} gp. A trip's basket is one rest, one rumour, one identification and one long sword repair, against the treasure of the level below the village.`, '');
  out.push('| Village | Depth | Rest | Rumour | Identify | Repair | Basket | Lift from surface | One level\'s treasure | Basket share |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const v of economy) {
    out.push(`| ${v.number} | ${v.depth} | ${v.rest} | ${v.rumour} | ${v.identify} | ${v.repair} | ${v.basket} | ${gp(v.liftFromSurface)} | ${gp(v.levelIncome)} | ${Math.round((100 * v.basket) / v.levelIncome)}% |`);
  }
  out.push('', '## Class parity', '');
  out.push(`Fights won in a gauntlet of ${GAUNTLET_FIGHTS}, mean of ${parity.trials} gauntlets per cell. The level is a thorough player's on arriving at that depth. Median class mean: ${parity.medianMean.toFixed(1)}. Far behind (under ${FAR_BEHIND * 100}% of the median): ${parity.farBehind.length > 0 ? parity.farBehind.join(', ') : 'none'}.`, '');
  out.push(`| Class | ${parity.depths.map((d, i) => `${d} (L${parity.levels[i]})`).join(' | ')} | Mean | Of median |`);
  out.push(`| --- | ${parity.depths.map(() => '---').join(' | ')} | --- | --- |`);
  for (const r of [...parity.rows].sort((a, b) => b.mean - a.mean)) {
    out.push(`| ${r.className} | ${r.won.map((w) => w.toFixed(1)).join(' | ')} | ${r.mean.toFixed(1)} | ${Math.round((100 * r.mean) / parity.medianMean)}% |`);
  }
  return out.join('\n');
}

const START = '<!-- balance:start (npm run balance -- --write) -->';
const END = '<!-- balance:end -->';

function main(): void {
  const root = resolve(fileURLToPath(import.meta.url), '../..');
  const args = process.argv.slice(2);
  const num = (flag: string, fallback: number): number => {
    const i = args.indexOf(flag);
    return i >= 0 ? Number(args[i + 1]) : fallback;
  };
  const { bundle } = buildContent(resolve(root, 'content'));
  const seeds = Array.from({ length: num('--seeds', 100) }, (_, i) => i + 1);
  const pace = measurePace(bundle, seeds);
  const pc = parityContentOf(bundle);
  const economy = measureEconomy(pace, pc.items);
  const parity = measureParity(pc, pace.levelOnArrival, num('--trials', 100));
  const report = renderReport(pace, economy, parity);
  if (args.includes('--write')) {
    // The measured tables go between the markers; the findings written around them are kept.
    const path = resolve(root, 'docs/13-balance-report.md');
    const old = existsSync(path) ? readFileSync(path, 'utf8') : `${START}\n${END}\n`;
    const [before, rest] = old.split(START);
    const after = rest?.split(END)[1] ?? '\n';
    writeFileSync(path, `${before}${START}\n${report}\n${END}${after}`);
    console.log(`Balance report written to ${path}.`);
  } else console.log(report);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
