import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import { Run, SURFACE, stubSize } from '../src/game/run.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { MAX_DEPTH } from '../src/rules/world/level.ts';
import { levelFrom, monsterAt, press, screenText, shellOn, testPlayer } from './helpers.ts';
import { Shell } from '../src/ui/shell.ts';
import { testCharacter } from './helpers.ts';

// Two small hand-built levels joined by stairs: '<' up, '>' down.
const rows = ['###########', '#<..+..>..#', '###########'];
const run = (start = 1, runSeed = 1): Run => new Run(runSeed, testPlayer(), { startDepth: start, levelFor: () => levelFrom(rows) });
const newShell = (): Shell => {
  const shell = new Shell('', testCharacter());
  shell.setRun(new Run(7, testPlayer(), { levelFor: () => levelFrom(rows) }));
  return shell;
};

describe('run and stairs (Spec 02, Run layout; Spec 01, Villages)', () => {
  it('starts in the surface village, which has no map', () => {
    const r = new Run(1, testPlayer());
    expect(r.depth).toBe(SURFACE);
    expect(r.inVillage).toBe(true);
    expect(r.game).toBeNull();
    expect(r.title).toBe('Surface Village');
    expect(r.canTravel('up')).toBe(false);
    expect(r.canTravel('down')).toBe(true);
  });

  it('Go down arrives on level 1\'s up stair; the up stair of level 1 leads back to the village', () => {
    const r = new Run(1, testPlayer(), { levelFor: () => levelFrom(rows) });
    r.travel('down');
    expect(r.depth).toBe(1);
    expect(r.game!.state.map.player).toEqual({ x: 1, y: 1 });
    r.travel('up');
    expect(r.inVillage).toBe(true);
    expect(r.game).toBeNull();
  });

  it('descending arrives on the up stair and climbing arrives on the down stair', () => {
    const r = run(1);
    r.travel('down');
    expect(r.depth).toBe(2);
    expect(r.game!.state.map.player).toEqual({ x: 1, y: 1 }); // up stair
    r.travel('up');
    expect(r.depth).toBe(1);
    expect(r.game!.state.map.player).toEqual({ x: 7, y: 1 }); // down stair
  });

  it('refuses to go above the surface or below level 100', () => {
    expect(new Run(1, testPlayer()).travel('up')[0]!.text).toContain('nowhere');
    const deep = new Run(1, testPlayer(), { startDepth: MAX_DEPTH, levelFor: (d) => generateLevel(1, d, 'small') });
    expect(deep.canTravel('down')).toBe(false);
    const before = deep.depth;
    deep.travel('down');
    expect(deep.depth).toBe(before);
    expect(deep.game!.state.map.level.downStair).toBeNull();
  });

  it('keeps the player (the Combat pool) and counts rounds across levels and the village', () => {
    const r = run(1);
    r.player.combatDice = 1;
    const start = r.round;
    r.travel('down');
    r.travel('up');
    r.travel('up');
    expect(r.game).toBeNull();
    expect(r.player.combatDice).toBe(1);
    expect(r.round).toBeGreaterThan(start + 2);
  });

  it('generates the real levels of the run from the seed, so level N never needs another level', () => {
    const r = new Run(99, testPlayer(), { startDepth: 40 });
    expect(JSON.stringify(r.game!.state.map.level)).toBe(JSON.stringify(generateLevel(99, 40, stubSize(40))));
  });
});

describe('level deltas, in memory (Spec 02, Persistence): leaving and returning shows a level exactly as left', () => {
  it('replays opened doors, explored cells and dead and moved monsters', () => {
    const r = run(1);
    const game = r.game!;
    const a = monsterAt(8, 1, { dice: 2, maxDice: 2, alert: false });
    const b = monsterAt(9, 1, { modifier: -10, dice: 1 });
    game.state.monsters.push(a, b);
    for (let i = 0; i < 3; i++) game.act({ type: 'move', dx: 1, dy: 0 }); // x2, x3, then opens the door
    expect(game.state.map.openDoors).toHaveLength(1);
    // Fight: the weak monster dies; the other has been woken and moved.
    game.state.monsters = [a, monsterAt(5, 1, { id: 77, dice: 1, modifier: -10, alert: true })];
    for (let i = 0; i < 6 && game.state.monsters.length > 1; i++) game.act({ type: 'move', dx: 1, dy: 0 });
    const left = JSON.parse(JSON.stringify({
      explored: game.state.map.exploration.explored,
      openDoors: game.state.map.openDoors,
      monsters: game.state.monsters,
      tiles: game.state.map.level.tiles,
    }));

    r.travel('up');
    r.travel('down');
    const back = r.game!.state;
    expect(back.map.level.tiles).toEqual(left.tiles);
    expect(back.map.exploration.explored).toEqual(left.explored);
    expect(back.map.openDoors).toEqual(left.openDoors);
    expect(back.monsters).toEqual(left.monsters);
    // The door is still open in the derived terrain, so sight and movement agree with the delta.
    const door = left.openDoors[0] as number;
    expect(back.map.terrain[door]).toBe(1);
  });

  it('does a full round trip on real generated levels: explore, fight, leave, return, and nothing differs', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const r = new Run(seed, testPlayer({ combatDice: 6, combatMax: 6 }), { startDepth: 1 + seed * 5 });
      const game = r.game!;
      const rng = createRng(seed);
      for (let i = 0; i < 400 && !r.player.dead; i++) {
        const [dx, dy] = rng.pick([[0, -1], [1, 0], [0, 1], [-1, 0]] as const);
        game.act({ type: 'move', dx, dy });
      }
      const snapshot = JSON.parse(JSON.stringify(game.captureDelta()));
      const depth = r.depth;
      r.travel('down');
      expect(r.deltas[depth]).toEqual(snapshot); // what was kept is exactly what was left
      r.travel('up');
      expect(r.depth).toBe(depth);
      const now = r.game!.captureDelta();
      // Arriving on the stair also lets the player see around it, so explored can only grow.
      expect(now.explored.every((c, i) => c >= snapshot.explored[i])).toBe(true);
      expect(now.openDoors).toEqual(snapshot.openDoors);
      expect(now.monsters).toEqual(snapshot.monsters);
    }
  });

  it('a delta is plain data that survives a JSON round trip', () => {
    const r = run(1);
    r.game!.act({ type: 'move', dx: 1, dy: 0 });
    r.travel('up');
    expect(JSON.parse(JSON.stringify(r.deltas))).toEqual(r.deltas);
    expect(r.deltas[1]!.turnLeft).toBeGreaterThan(1);
  });

  it('monsters never follow through stairs: they stay where they were and do not act as the player leaves', () => {
    const r = run(1);
    const m = monsterAt(3, 1, { alert: true });
    r.game!.state.monsters.push(m);
    r.travel('up');
    r.travel('down');
    const back = r.game!.state.monsters[0]!;
    expect([back.x, back.y]).toEqual([3, 1]);
    expect(r.depth).toBe(1);
  });
});

describe('the village and the stairs in the shell (Spec 01, Overlays and screens)', () => {
  it('shows the village menu, with every surface service and Go down only', () => {
    const shell = newShell();
    const text = screenText(shell).join('\n');
    for (const name of ['Surface Village', 'Bank', 'Lodging', 'Lift', 'Shop', 'Appraiser', 'Smith', 'Tavern', 'Go down']) {
      expect(text).toContain(name);
    }
    expect(text).not.toContain('Go up');
    expect(text).not.toContain('Map goes here');
    expect(shell.game).toBeNull();
  });

  it('a service says it is not yet available and stays in the village', () => {
    const shell = newShell();
    press(shell, 'Enter'); // the first item, Bank
    expect(shell.log.lines(shell.turn).some((l) => l.text === 'Bank is not yet available.')).toBe(true);
    expect(shell.run!.inVillage).toBe(true);
  });

  it('Go down (W wraps to the last item, then Enter or E) enters level 1 on its up stair', () => {
    for (const confirm of ['Enter', 'e']) {
      const shell = newShell();
      press(shell, 'w');
      press(shell, confirm);
      expect(shell.run!.depth).toBe(1);
      expect(shell.village).toBeNull();
      expect(shell.title).toBe('Level 1');
      expect(shell.game!.state.map.player).toEqual({ x: 1, y: 1 });
      expect(screenText(shell)[0]).toContain('Level 1');
    }
  });

  it('E on the up stair of level 1 returns to the village; E on a down stair descends', () => {
    const shell = newShell();
    press(shell, 'w');
    press(shell, 'Enter');
    for (let i = 0; i < 6; i++) press(shell, 'd'); // x2, x3, opens the door, x4, x5, x6
    press(shell, 'd'); // x7, the down stair
    press(shell, 'e');
    expect(shell.run!.depth).toBe(2);
    expect(shell.title).toBe('Level 2');
    press(shell, 'e'); // standing on level 2's up stair
    expect(shell.run!.depth).toBe(1);
    expect(shell.game!.state.map.player).toEqual({ x: 7, y: 1 });
    expect(shell.log.lines(shell.turn).some((l) => l.text.includes('climb to level 1'))).toBe(true);
  });

  it('keys with no village action log not yet available; Esc opens the game menu', () => {
    const shell = newShell();
    press(shell, 'l');
    expect(shell.log.lines(shell.turn).some((l) => l.text.includes('not yet available'))).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(1);
    expect(shell.run!.inVillage).toBe(true);
  });

  it('a level in the shell shows the same remembered map after a trip to the village and back', () => {
    const shell = shellOn(levelFrom(rows));
    const before = screenText(shell).slice(1, 29).join('\n');
    expect(shell.game!.state.map.player).toEqual({ x: 1, y: 1 });
    press(shell, 'e'); // up stair of level 1: the village
    expect(shell.village).not.toBeNull();
    press(shell, 'Enter'); // Bank (not yet)
    press(shell, 'w');
    press(shell, 'Enter'); // Go down
    expect(shell.game).not.toBeNull();
    expect(screenText(shell).slice(1, 29).join('\n')).toBe(before);
  });
});
