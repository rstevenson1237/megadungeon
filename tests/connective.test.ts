import { describe, expect, it } from 'vitest';
import { creatureMelee, monsterRanged } from '../src/rules/combat/attacks.ts';
import type { Rng } from '../src/core/rng.ts';
import { artifactsCarried, weakMode } from '../src/game/connective.ts';
import { alert } from '../src/game/combat.ts';
import type { Game } from '../src/game/game.ts';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';
import { creature, type Monster } from '../src/game/monsters.ts';
import { Run } from '../src/game/run.ts';
import { parseSave, restoreRun, serialise, toSave } from '../src/game/save.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { makeArtifact } from '../src/rules/items/magic.ts';
import type { BookItem, Item } from '../src/rules/items/types.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { FINAL_BOSS_RATING, MAX_DEPTH, type Level, type Loot, type LoreMark, type Npc } from '../src/rules/world/level.ts';
import type { Link, RunLayout } from '../src/rules/world/run-layout.ts';
import { App } from '../src/ui/app.ts';
import { ITEMS, SPELLS, CONTENT, content, createAs, gameAt, levelFrom, rig, room, testPlayer, townRun, withThings } from './helpers.ts';

// Task 3.10 (Spec 02, Addendum A): the named rival arc and its journal, a lore chain's weakness, the stub final boss on
// level 100, and the artifact seals.

const bundle = content().bundle;
const artifact = (n: number): Item => makeArtifact(ITEMS.artifacts.get(['art_pale_lantern', 'art_tallow_ring', 'art_goblin_purse', 'art_hollow_abbot_ring', 'art_stone_mothers_band'][n - 1]!)!, 7000 + n);
const said = (messages: { text: string }[]): string => messages.map((m) => m.text).join(' | ');

/** Level 100 of a seed, built from the real content as a run builds it. */
function level100(seed: number, version?: number): Level {
  const o = runOptionsFor(bundle, seed);
  return generateLevel(seed, MAX_DEPTH, o.sizeFor!(MAX_DEPTH), o.styleFor!(MAX_DEPTH), o.contentsFor!(MAX_DEPTH), version);
}

describe('Spec 02, Addendum A: the stub final boss on level 100', () => {
  it('level 100 is a rooms-and-corridors level of The Abyssal Throne theme', () => {
    for (const seed of [1, 2, 3, 42, 777]) {
      const o = runOptionsFor(bundle, seed);
      expect(o.layout!.themes[MAX_DEPTH]).toBe('abyssal_throne');
      expect(level100(seed).layout).toBe('rooms_and_corridors');
    }
  });

  it('places one boss drawn from the rows tagged final, rated 20d6+6, holding no artifact, in the room farthest from the up stair', () => {
    const finals = (bundle.tables.bosses as { id: string; tags?: string[] }[]).filter((b) => b.tags?.includes('final')).map((b) => b.id);
    expect(finals.length).toBeGreaterThan(0);
    for (const seed of [1, 2, 3, 42, 777, 9001]) {
      const level = level100(seed);
      const bosses = level.monsters.filter((m) => m.role === 'boss');
      expect(bosses).toHaveLength(1);
      const boss = bosses[0]!;
      expect(finals).toContain(boss.id);
      expect([boss.dice, boss.modifier, boss.final]).toEqual([FINAL_BOSS_RATING.dice, FINAL_BOSS_RATING.modifier, true]);
      expect(boss.artifact).toBeUndefined();
      expect(boss.liftToken).toBeUndefined();
      // In the room farthest from the up stair: no other room's nearest walk from the stair is longer.
      const inRoom = (r: Level['rooms'][number], p: { x: number; y: number }) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
      const bossRoom = level.rooms.find((r) => inRoom(r, boss))!;
      expect(bossRoom).toBeDefined();
      expect(inRoom(bossRoom, level.upStair)).toBe(false);
    }
  });

  it('a level 100 built by generator version 4 keeps no final boss, so an older save keeps its levels', () => {
    const level = level100(1, 4);
    expect(level.monsters.some((m) => m.role === 'boss')).toBe(false);
  });

  it('in play it never flees, and is alert once the player is in its room', () => {
    const game = new Run(1, testPlayer(), { ...runOptionsFor(bundle, 1), startDepth: MAX_DEPTH }).game!;
    const boss = game.state.monsters.find((m) => m.final)!;
    expect(boss).toMatchObject({ fearless: true, role: 'boss', awareness: 'unaware', dice: 20, modifier: 6, carried: [] });
    const room = game.state.map.level.rooms.find((r) => boss.x >= r.x && boss.x < r.x + r.w && boss.y >= r.y && boss.y < r.y + r.h)!;
    // Step into its room (any free cell of it), then let a round pass.
    const spot = { x: room.x + (boss.x === room.x ? 1 : 0), y: room.y };
    game.state.map.player = spot;
    game.refreshSight();
    game.act({ type: 'wait' });
    expect(boss.awareness).toBe('alert');
  });
});

/** A room with the final boss in it, the player standing at (2, 2). */
function throneRoom(extra: { pack?: Item[]; equipment?: Game['state']['player']['equipment'] } = {}, dice = 20): { game: Game; boss: Monster } {
  const level: Level = { ...room(12, 5, 1, 1), depth: MAX_DEPTH, rooms: [{ x: 1, y: 1, w: 12, h: 5 }] };
  const game = gameAt(level, 2, 2, { pack: extra.pack ?? [], equipment: extra.equipment ?? {}, combatDice: 4, combatMax: 4 });
  const boss = creature({ id: 50, name: 'stub abyssal king', glyph: 'K', colour: 0, x: 9, y: 3, dice, modifier: 6, role: 'boss', fearless: true, final: true });
  game.state.monsters.push(boss);
  return { game, boss };
}

describe('Spec 02, Addendum A: artifact seals', () => {
  it('counts every artifact carried or worn', () => {
    const player = testPlayer({ pack: [artifact(1), artifact(2)], equipment: { ring1: artifact(3) } });
    expect(artifactsCarried(player)).toBe(3);
  });

  it('when the final boss first becomes alert it loses one die per artifact, and the log says so', () => {
    const { game, boss } = throneRoom({ pack: [artifact(1), artifact(2)], equipment: { ring1: artifact(3) } });
    const result = game.act({ type: 'wait' })!; // the player is in its room, so it wakes this round
    expect(boss.awareness).toBe('alert');
    expect(boss.dice).toBe(17);
    expect(said(result.messages)).toContain('The seals of your 3 artifacts burn against the stub abyssal king: it loses 3 dice.');
  });

  it('the count is made once: artifacts gained later, or a second alert, change nothing', () => {
    const { game, boss } = throneRoom({ pack: [artifact(1)] });
    game.act({ type: 'wait' });
    expect(boss.dice).toBe(19);
    game.state.player.pack.push(artifact(2), artifact(3));
    boss.awareness = 'unaware';
    alert(game, boss);
    expect(boss.dice).toBe(19);
  });

  it('never takes it below one die', () => {
    const { game, boss } = throneRoom({ pack: [1, 2, 3, 4, 5].map(artifact) }, 3);
    const result = game.act({ type: 'wait' })!;
    expect(boss.dice).toBe(1);
    expect(said(result.messages)).toContain('it loses 2 dice');
  });

  it('with no artifact it loses nothing and nothing is logged; another boss is never sealed', () => {
    const { game, boss } = throneRoom();
    const result = game.act({ type: 'wait' })!;
    expect([boss.dice, boss.sealed]).toEqual([20, true]);
    expect(said(result.messages)).not.toContain('seals');
    const other = throneRoom({ pack: [artifact(1)] });
    other.boss.final = undefined;
    other.game.act({ type: 'wait' });
    expect(other.boss.dice).toBe(20);
  });
});

describe('Spec 09: defeating the stub final boss records on the leaderboard', () => {
  it('a character created at level 100 who kills the generated final boss gets a final_boss entry', async () => {
    const board = new Leaderboard(new MemoryStorage());
    const app = new App({
      creation: creationContentOf(bundle),
      randomSeed: () => 4242,
      now: () => new Date('2026-10-02T12:00:00Z'),
      runOptions: (seed) => ({ ...runOptionsFor(bundle, seed), startDepth: MAX_DEPTH }),
      board,
      flags: new MemoryStorage(),
      contentVersion: 'test',
    });
    app.handleKey({ key: 'Enter' });
    createAs(app, 'Warrior', 'Brom');
    const game = app.shell!.game!;
    const boss = game.state.monsters.find((m) => m.final)!;
    expect(boss).toBeDefined();
    boss.dice = 1;
    game.state.map.player = { x: boss.x - 1, y: boss.y };
    game.refreshSight();
    rig(game, 6, 1, 1); // the player's 6 against the boss's worse of two (it is unaware): a hit
    app.handleKey({ key: 'd' });
    expect(game.state.monsters).not.toContain(boss);
    expect(app.shell!.run!.player.stats.finalBoss).toBe(true);
    expect(board.all().find((e) => e.outcome === 'final_boss')).toMatchObject({ name: 'Brom', deepest: MAX_DEPTH });
  });
});

/** A level with a lore chain's last entry on the wall beside (2, 3), and the boss of that level standing at (6, 3). */
function weaknessLevel(depth: number, links: Link[], markLink = 'lore_chain_1'): { game: Game; boss: Monster } {
  const mark: LoreMark = { kind: 'graffiti', id: markLink, text: 'Look where the dead are many.', x: 2, y: 4, link: markLink };
  const level: Level = { ...withThings(room(12, 5, 1, 1), { lore: [mark] }), depth };
  // The row below the player is wall; the mark sits on it.
  const game = gameAt(level, 2, 3, { pack: [], equipment: {}, combatDice: 4, combatMax: 4 }, { links });
  game.state.player.facing = { dx: 0, dy: 1 };
  const boss = creature({ id: 51, name: 'stub warlord', glyph: 'B', colour: 0, x: 6, y: 3, dice: 6, modifier: 0, role: 'boss', fearless: true, awareness: 'alert' });
  game.state.monsters.push(boss);
  return { game, boss };
}
const chainTo = (level: number): Link => ({ id: 'lore_chain_1', type: 'lore_chain', levels: [1, 2, 3, 4], end: { kind: 'boss_weakness', level } });

describe("Spec 02, Addendum A: a lore chain's weakness", () => {
  it("reading the chain's last entry names the boss's level, keeps it in the journal and weakens that boss", () => {
    const { game, boss } = weaknessLevel(9, [chainTo(9)]);
    const result = game.act({ type: 'interact' })!;
    expect(result.read!.lines.join(' ')).toContain('the boss of level 9');
    expect(said(result.messages)).toContain('You know the weakness of the boss of level 9.');
    expect(game.state.player.weaknesses).toEqual([9]);
    expect(game.state.player.journal[0]!.text).toContain('the boss of level 9');
    expect(weakMode(game, boss)).toBe('disadvantage');
  });

  it('a chain that ends in a cache, or an ordinary graffiti, weakens nothing', () => {
    const cache: Link = { id: 'lore_chain_1', type: 'lore_chain', levels: [1, 2, 3, 4], end: { kind: 'cache', level: 9 } };
    const { game, boss } = weaknessLevel(9, [cache]);
    game.act({ type: 'interact' });
    expect(game.state.player.weaknesses).toEqual([]);
    expect(weakMode(game, boss)).toBe('normal');
  });

  it("only that level's boss is weakened, and only a boss", () => {
    const { game, boss } = weaknessLevel(9, [chainTo(9)]);
    game.state.player.weaknesses = [12];
    expect(weakMode(game, boss)).toBe('normal');
    game.state.player.weaknesses = [9];
    const goblin = creature({ id: 52, name: 'goblin', glyph: 'g', colour: 0, x: 8, y: 3, dice: 1, modifier: 0 });
    expect(weakMode(game, goblin)).toBe('normal');
  });

  it('the weakened boss defends with disadvantage against the player', () => {
    const fight = (weak: boolean) => {
      const { game, boss } = weaknessLevel(9, [chainTo(9)]);
      if (weak) game.state.player.weaknesses = [9];
      game.state.map.player = { x: 5, y: 3 };
      game.refreshSight();
      boss.stunned = true; // it loses its own action this round, so only the player's exchange is rolled
      rig(game, 3, 6, 1); // the player rolls 3; the boss rolls 6, and 1 as the worse of two when weak
      game.act({ type: 'move', dx: 1, dy: 0 });
      return { boss: boss.dice, player: game.state.player.pools.combat.dice };
    };
    expect(fight(false)).toEqual({ boss: 6, player: 3 }); // 6 beats 3: the player is hit
    expect(fight(true)).toEqual({ boss: 5, player: 4 }); // 1 loses to 3: the boss is hit
  });

  it('the weakened boss attacks with disadvantage', () => {
    const fight = (weak: boolean) => {
      const { game, boss } = weaknessLevel(9, [chainTo(9)]);
      if (weak) game.state.player.weaknesses = [9];
      boss.x = 3;
      game.refreshSight();
      rig(game, 6, 1, 3); // the boss rolls 6 (and 1 as the worse of two when weak); the player defends with 3
      game.act({ type: 'wait' });
      return { boss: boss.dice, player: game.state.player.pools.combat.dice };
    };
    expect(fight(false)).toEqual({ boss: 6, player: 3 });
    expect(fight(true)).toEqual({ boss: 5, player: 4 });
  });

  it('a ranged roll made with disadvantage keeps the worse die', () => {
    const faces = [6, 1, 3];
    const rng = { int: () => faces.shift()! } as unknown as Rng;
    expect(monsterRanged(rng, 0, { step: 6, dice: 1 }, 'disadvantage')).toMatchObject({ attacker: 1, defender: 3, hit: false });
    // Creatures fighting each other are untouched by a weakness against the player.
    const again = [4, 2];
    expect(creatureMelee({ int: () => again.shift()! } as unknown as Rng, { modifier: 0 }, { modifier: 0 })).toMatchObject({ attacker: 4, defender: 2 });
  });
});

// --- The named rival ---

const RIVAL: Link = { id: 'rival_1', type: 'rival', levels: [2, 3, 5], stashLevel: 7 };
const layoutWith = (links: Link[]): RunLayout => ({ version: 1, seed: 1, villages: [], teleporters: [], bosses: [], themes: [], quests: [], links });
const rivalNpc = (x: number): Npc => ({ x, y: 1, kind: 'rival', name: 'Corvin the Bold', link: 'rival_1' });
/** Levels 1 to 8 of a corridor; the rival's appearances (2, 3 and 5) hold it at x = 4. */
function rivalRun(): Run {
  const rows = ['############', '#<........>#', '############'];
  return new Run(1, testPlayer({ pack: [], equipment: {} }), {
    layout: layoutWith([RIVAL]),
    villages: [0],
    startDepth: 2,
    spells: SPELLS,
    items: ITEMS,
    content: CONTENT,
    levelFor: (depth) => ({ ...withThings(levelFrom(rows), { npcs: RIVAL.type === 'rival' && [2, 3, 5].includes(depth) ? [rivalNpc(4)] : [] }), depth }),
  });
}
const rivalOn = (run: Run): Monster | undefined => run.game!.state.monsters.find((m) => m.kind === 'rival');
const gem: Loot = { kind: 'gem', id: 'gem_stub', name: 'garnet', value: 50 };

describe('Spec 02, Addendum A: the named rival arc', () => {
  it('each appearance is the same rival, known by its link', () => {
    const run = rivalRun();
    expect(rivalOn(run)).toMatchObject({ name: 'Corvin the Bold', link: 'rival_1', hostile: false });
  });

  it('what it carries when the player leaves goes with it to its next appearance, and not twice', () => {
    const run = rivalRun();
    rivalOn(run)!.carried.push({ kind: 'coins', amount: 40 }, gem);
    run.travel('down'); // to level 3, its next appearance
    expect(rivalOn(run)!.carried).toEqual([{ kind: 'coins', amount: 40 }, gem]);
    expect(run.deltas[2]!.monsters.find((m) => m.kind === 'rival')!.carried).toEqual([]);
    expect(run.player.rivals.rival_1!.carried).toEqual([]);
    // What it picks up here is added to what it brought.
    rivalOn(run)!.carried.push({ kind: 'coins', amount: 10 });
    run.travel('down');
    run.travel('down'); // level 5
    expect(rivalOn(run)!.carried).toEqual([{ kind: 'coins', amount: 50 }, gem]);
  });

  it('a rival the player attacked is hostile at its later appearances', () => {
    const run = rivalRun();
    rivalOn(run)!.hostile = true;
    run.travel('down');
    expect(rivalOn(run)!.hostile).toBe(true);
  });

  it('killed, it drops everything it carries with its journal, which names the stash level; it never appears again', () => {
    const run = rivalRun();
    const game = run.game!;
    const rival = rivalOn(run)!;
    rival.carried.push({ kind: 'coins', amount: 40 }, gem);
    rival.dice = 1;
    game.state.map.player = { x: 3, y: 1 };
    game.refreshSight();
    rig(game, 6, 1); // the player's 6 against its 1
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.monsters).not.toContain(rival);
    const drop = game.state.drops.find((p) => p.x === 4 && p.y === 1)!;
    expect(drop.contents.slice(0, 2)).toEqual([{ kind: 'coins', amount: 40 }, gem]);
    const journal = drop.contents[2]!;
    expect(journal).toMatchObject({ kind: 'item', item: { kind: 'book', name: "Corvin the Bold's journal" } });
    expect(run.player.rivals.rival_1!.dead).toBe(true);

    // Reading the journal adds an entry that names the stash's level.
    const book = (journal as { item: BookItem }).item;
    game.state.player.pack.push(book);
    const read = game.use(book);
    expect(read.read!.lines.join(' ')).toContain('level 7');
    expect(game.state.player.journal.at(-1)).toMatchObject({ kind: 'book', id: 'rival_journal_rival_1' });
    expect(game.state.player.journal.at(-1)!.text).toContain('level 7');

    run.travel('down');
    expect(rivalOn(run)).toBeUndefined();
    run.travel('down');
    run.travel('down');
    expect(run.depth).toBe(5);
    expect(rivalOn(run)).toBeUndefined();
  });

  it('a rival killed on a later appearance is gone from a level already visited', () => {
    const run = rivalRun();
    run.travel('down');
    const game = run.game!;
    const rival = rivalOn(run)!;
    rival.dice = 1;
    game.state.map.player = { x: 3, y: 1 };
    game.refreshSight();
    rig(game, 6, 1);
    game.act({ type: 'move', dx: 1, dy: 0 });
    run.travel('up');
    expect(run.depth).toBe(2);
    expect(rivalOn(run)).toBeUndefined();
  });

  it('on a generated run each appearance holds the rival with its link, and the stash chest sits on the stash level', () => {
    const o = runOptionsFor(bundle, 5);
    const link = o.layout!.links.find((l) => l.type === 'rival')!;
    expect(link.type).toBe('rival');
    if (link.type !== 'rival') return;
    const run = new Run(5, testPlayer(), { ...o, startDepth: link.levels[0]! });
    expect(rivalOn(run)).toMatchObject({ link: link.id });
    const stash = run.peek(link.stashLevel);
    expect(stash.features.some((f) => f.type === 'container' && f.link === link.id)).toBe(true);
  });
});

describe('Spec 09: the rival and the weaknesses are saved', () => {
  it('a saved and reloaded run keeps the rival arc and the bosses weakened', () => {
    const run = townRun(77, { pack: [] });
    run.player.rivals = { rival_1: { carried: [{ kind: 'coins', amount: 12 }], hostile: true, dead: false } };
    run.player.weaknesses = [33];
    const save = parseSave(serialise(toSave({ run, contentVersion: 'v' })));
    const back = restoreRun(save, runOptionsFor(bundle, 77));
    expect(back.player.rivals).toEqual(run.player.rivals);
    expect(back.player.weaknesses).toEqual([33]);
  });
});
