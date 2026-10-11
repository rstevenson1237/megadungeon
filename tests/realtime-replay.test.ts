import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRng, type Rng } from '../src/core/rng.ts';
import { Game } from '../src/game/game.ts';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';
import { Run } from '../src/game/run.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { App } from '../src/ui/app.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { FrameLoop } from '../src/ui/frame-loop.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { content, isBlocking, testPlayer } from './helpers.ts';

// Task 5.7, input-log reproducibility (Spec 02, Addendum B): game time is counted in ticks, so a real-time session is
// fully determined by its seed and its input log, each input stamped with the tick it was given on. A scripted player
// plays a real-time run through the whole UI, its frames arriving at uneven times as a browser's do, and every input
// is logged with the number of ticks run so far. Replaying the log one tick at a time on a fresh game, with no frames
// at all, must end in an identical game state. The game does not store such logs; only the tests do.

/** One input of a session: a key going down or coming up, or the window losing focus, at a tick of the session. */
interface Input {
  tick: number;
  kind: 'down' | 'up' | 'blur';
  key?: string;
}

/** The ticks the game has run, all levels together: each tick is one `Game.advance(1)` from the shell. */
let ticksRun = 0;

afterEach(() => vi.restoreAllMocks());

const ADVANCE = Game.prototype.advance;

function countTicks(): void {
  ticksRun = 0;
  const real = ADVANCE;
  vi.spyOn(Game.prototype, 'advance').mockImplementation(function (this: Game, ticks: number) {
    ticksRun += ticks;
    return real.call(this, ticks);
  });
}

/** The run seed of the next new game. */
let runSeed = 0;

/** A fresh app on which a new game plays `runSeed` in real time. */
function newApp(): App {
  return new App({
    creation: creationContentOf(content().bundle),
    randomSeed: () => runSeed,
    now: () => new Date('2026-10-11T12:00:00Z'),
    runOptions: (seed) => runOptionsFor(content().bundle, seed),
    saves: new SaveSlot(new MemoryStore()),
    board: new Leaderboard(new MemoryStorage()),
    flags: new MemoryStorage(),
    contentVersion: 'test',
    time: 'real',
  });
}

function screen(app: App): string[] {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join(''));
}

/** Everything a session leaves behind: the run's state on every level, the game's clock, the log and the screen. */
function snapshot(app: App): string {
  const shell = app.shell!;
  const run = shell.run!;
  const game = run.game;
  return JSON.stringify({
    depth: run.depth,
    player: run.player,
    deltas: run.deltas,
    state: game?.state ?? null,
    tick: game?.tick ?? null,
    readyAt: game?.readyAt ?? null,
    log: shell.log,
    screen: screen(app),
  });
}

/**
 * The scripted player. It records every input it gives, stamped with the ticks run so far. It plays as a careless
 * person would: it walks toward the down stair holding the key, attacks what stands next to it, takes the stairs,
 * goes down from villages, and now and then waits, picks up, pauses, opens the inventory or loses focus.
 */
class Player {
  readonly log: Input[] = [];
  private held: string | null = null;
  private stuck = 0;
  private last = '';

  constructor(private readonly app: App, private readonly rng: Rng) {}

  down(key: string): void {
    this.log.push({ tick: ticksRun, kind: 'down', key });
    this.app.handleKey({ key });
  }

  up(key: string): void {
    this.log.push({ tick: ticksRun, kind: 'up', key });
    this.app.handleKeyUp({ key });
  }

  blur(): void {
    this.log.push({ tick: ticksRun, kind: 'blur' });
    this.app.loseFocus();
  }

  press(key: string): void {
    this.down(key);
    this.up(key);
  }

  /** Hold a movement key, letting go of any other first. */
  private hold(key: string): void {
    if (this.held === key) return;
    if (this.held) this.up(this.held);
    this.held = key;
    this.down(key);
  }

  private letGo(): void {
    if (this.held) this.up(this.held);
    this.held = null;
  }

  /** From the title: a new random-seed game. */
  begin(): void {
    this.choose('New game: random seed');
    this.create();
  }

  /** On the creation screen: a Fighter called Ada. */
  private create(): void {
    const creation = this.app.creation!;
    for (let i = 0; i < 20 && creation.card.cls.name !== 'Fighter'; i++) this.press('s');
    this.press('Enter');
    for (const ch of 'Ada') this.press(ch);
    this.press('Enter');
  }

  /** Choose a row of the open list by its text; false when it is not there. */
  private choose(label: string): boolean {
    for (let i = 0; i < 30; i++) {
      if (screen(this.app).some((l) => l.includes(`> ${label}`))) {
        this.press('Enter');
        return true;
      }
      this.press('s');
    }
    return false;
  }

  /** What the player does between two frames. After a death it plays on with a new character on the same seed. */
  think(): void {
    if (this.app.death) {
      this.held = null;
      if (screen(this.app).some((l) => l.includes('Choose one item to keep'))) return this.press('Enter');
      if (!this.choose('New character, same seed')) throw new Error('no new character on the death screen');
      return;
    }
    if (this.app.creation) return this.create();
    const shell = this.app.clock;
    if (!shell) return;
    const game = shell.game;
    if (!game) {
      // A village: no clock. Go down.
      this.letGo();
      if (!this.choose('Go down')) this.press('Escape');
      return;
    }
    if (shell.overlays.length > 0) {
      this.letGo();
      this.press(this.rng.int(1, 3) === 1 ? 'Enter' : 'Escape');
      return;
    }
    if (shell.paused) {
      this.press('p');
      return;
    }
    const { pools } = game.state.player;
    const near = game.hostilesInView().length > 0;
    if (!near && pools.combat.dice < pools.combat.max && this.rng.int(1, 4) === 1) return void (this.letGo(), this.press('z'));
    const roll = this.rng.int(1, 100);
    if (roll <= 2) return this.blur();
    if (roll <= 4) return this.press('p');
    if (roll <= 7) return void (this.letGo(), this.press(' '));
    if (roll <= 9) return this.press('g');
    if (roll === 10) return this.press('i');
    if (roll === 11) return this.press('x');
    if (roll === 12) return this.press('z');
    const { player, level } = game.state.map;
    const here = `${player.x},${player.y}`;
    this.stuck = here === this.last ? this.stuck + 1 : 0;
    this.last = here;
    const foe = game.state.monsters.find((m) => m.hostile !== false && Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1);
    if (foe) return this.hold(keyFor(foe.x - player.x, foe.y - player.y));
    if (level.tiles[player.y]![player.x] === '>') return void (this.letGo(), this.press('e'));
    if (this.stuck > 40) {
      this.stuck = 0;
      return this.hold(['w', 'a', 's', 'd'][this.rng.int(0, 3)]!);
    }
    const step = towardDownStair(game);
    if (step) this.hold(keyFor(step.dx, step.dy));
    else this.letGo();
  }
}

const keyFor = (dx: number, dy: number): string => (dx === 1 ? 'd' : dx === -1 ? 'a' : dy === 1 ? 's' : 'w');

/** The first step of a shortest walk to the down stair over every cell that is not wall, or null if none is known. */
function towardDownStair(game: Game): { dx: number; dy: number } | null {
  const { level, player } = game.state.map;
  const goal = level.downStair;
  if (!goal) return null;
  const w = level.width;
  const from = new Int32Array(w * level.height).fill(-1);
  const start = player.y * w + player.x;
  from[start] = start;
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i]!;
    if (at === goal.y * w + goal.x) {
      let cell = at;
      while (from[cell] !== start) cell = from[cell]!;
      return { dx: (cell % w) - player.x, dy: Math.floor(cell / w) - player.y };
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x: number = (at % w) + dx;
      const y: number = Math.floor(at / w) + dy;
      if (x < 0 || y < 0 || x >= w || y >= level.height || isBlocking(level.tiles[y]![x]!)) continue;
      const next = y * w + x;
      if (from[next] !== -1) continue;
      from[next] = at;
      queue.push(next);
    }
  }
  return null;
}

/**
 * Play a session of run `seed` for `ticks` ticks, the player's choices and the frame times drawn from `script`; returns
 * its input log, its end, its ticks, the deepest level it reached and its deaths.
 */
function record(seed: number, script: number, ticks: number): { log: Input[]; end: string; ticks: number; deepest: number; deaths: number } {
  countTicks();
  runSeed = seed;
  const app = newApp();
  const rng = createRng(script);
  const player = new Player(app, rng);
  player.begin();
  const loop = new FrameLoop(() => app.clock, () => undefined);
  let now = 0;
  let deepest = 0;
  let deaths = 0;
  let wasDead = false;
  for (let frame = 0; frame < 200_000 && ticksRun < ticks; frame++) {
    deepest = Math.max(deepest, app.clock?.run?.depth ?? 0);
    if (app.death && !wasDead) deaths++;
    wasDead = !!app.death;
    // Frames 5 to 40 ms apart, as a busy browser gives them, and now and then a stall of a third of a second.
    now += rng.int(1, 60) === 1 ? 330 : rng.int(5, 40);
    loop.frame(now);
    if (rng.int(1, 3) === 1) player.think();
  }
  return { log: player.log, end: snapshot(app), ticks: ticksRun, deepest, deaths };
}

/**
 * Replay a log on a fresh game, one tick at a time with no frames, then run on to `ticks`; returns its end. A replay
 * that is not `strict` gives each input as soon as it can when time has stopped before its tick (a changed log).
 */
function replay(log: readonly Input[], ticks: number, strict = true): string {
  countTicks();
  const app = newApp();
  const runTo = (tick: number): void => {
    while (ticksRun < tick) {
      const shell = app.clock;
      if (!shell?.ticking) {
        if (strict) throw new Error(`time is stopped at tick ${ticksRun}, before tick ${tick}`);
        return;
      }
      shell.advance(1);
    }
  };
  for (const input of log) {
    runTo(input.tick);
    if (input.kind === 'down') app.handleKey({ key: input.key! });
    else if (input.kind === 'up') app.handleKeyUp({ key: input.key! });
    else app.loseFocus();
  }
  if (app.clock?.ticking) runTo(ticks);
  return snapshot(app);
}

describe('Spec 02, Addendum B: reproducibility in real time', () => {
  it('a real-time session replayed from its seed and tick-stamped input log ends in an identical game state', () => {
    const session = record(115, 1, 3000);
    // A full session: 3000 ticks (300 rounds) of fights, pauses, focus lost, overlays, a death, a new character on the
    // same seed, and stairs down to level 2, in over a thousand inputs.
    expect(session.ticks).toBeGreaterThanOrEqual(3000);
    expect(session.log.length).toBeGreaterThan(1000);
    expect(session.deepest).toBe(2);
    expect(session.deaths).toBe(1);
    expect(replay(session.log, session.ticks)).toBe(session.end);
  }, 120_000);

  it('other runs and scripts replay identically too, and the same log moved by one tick does not', () => {
    for (const [seed, script] of [[109, 2], [112, 1], [126, 2]] as const) {
      const session = record(seed, script, 1500);
      expect(replay(session.log, session.ticks)).toBe(session.end);
      // The stamps matter: from the first movement key on, the same inputs a tick later make another session.
      const first = session.log.findIndex((i) => i.kind === 'down' && 'wasd'.includes(i.key!) && i.tick > 0);
      const moved = session.log.map((i, n) => (n >= first ? { ...i, tick: i.tick + 1 } : i));
      expect(replay(moved, session.ticks + 1, false)).not.toBe(session.end);
    }
  }, 120_000);
});

describe('Spec 02, Addendum B: generation is untouched by the time mode', () => {
  it('a level generated in real-time mode is identical to the same level generated in turn mode', () => {
    for (const seed of [11, 12345, 0x5eed_0007]) {
      const options = runOptionsFor(content().bundle, seed);
      const runs = (['turn', 'real'] as const).map((time) => new Run(seed, testPlayer(), { ...options, time }));
      for (let depth = 1; depth <= 100; depth++) {
        if (runs[0]!.villages.includes(depth)) continue;
        expect(JSON.stringify(runs[1]!.peek(depth)), `seed ${seed}, level ${depth}`).toBe(JSON.stringify(runs[0]!.peek(depth)));
      }
      // And the level as first entered: its creatures, their awareness and everything else, before the clock starts.
      for (const run of runs) run.travel('down');
      expect(runs[1]!.game!.time).toBe('real');
      expect(JSON.stringify(runs[1]!.game!.state)).toBe(JSON.stringify(runs[0]!.game!.state));
    }
  }, 120_000);
});
