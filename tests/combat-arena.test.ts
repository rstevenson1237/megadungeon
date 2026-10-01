import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { creature, spawn, spawnAll, type Monster } from '../src/game/monsters.ts';
import { Run } from '../src/game/run.ts';
import { distanceSq } from '../src/rules/world/geometry.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import type { Level, PlacedMonster } from '../src/rules/world/level.ts';
import { gameOn, levelFrom, monsterAt, press, room, shellOn, testPlayer } from './helpers.ts';

const wait = (game: Game, n = 1): void => {
  for (let i = 0; i < n; i++) game.act({ type: 'wait' });
};
const dist = (game: Game, m: Monster): number => Math.sqrt(distanceSq(m, game.state.map.player));
const sturdy = { combatDice: 6, combatMax: 6 };
/** A creature that can never win a roll and has plenty of dice, so a fight never kills the test. */
const harmless = { modifier: -6, dice: 30, maxDice: 30 };

describe('Spec 04: free actions cost no round and nothing moves', () => {
  it('looking, the inventory and targeting leave every creature where it is', () => {
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(8, 3, { alert: true })]);
    const before = JSON.stringify(shell.game!.state.monsters);
    const round = shell.game!.state.round;
    for (const key of ['l', 'i', 'f']) press(shell, key);
    press(shell, 'Escape');
    for (const type of ['look', 'inventory', 'help', 'journal'] as const) expect(shell.game!.act({ type })).toBeUndefined();
    expect(shell.game!.state.round).toBe(round);
    expect(JSON.stringify(shell.game!.state.monsters)).toBe(before);
  });

  it('every spent action runs the creatures once, and nothing moves in between', () => {
    const game = gameOn(room(20, 5, 2, 3));
    const m = monsterAt(15, 3, { alert: true });
    game.state.monsters.push(m);
    expect(game.act({ type: 'move', dx: 0, dy: -1 })!.spent).toBe(true);
    expect(Math.abs(m.x - 15) + Math.abs(m.y - 3)).toBe(1); // it took exactly one step
  });
});

describe('Spec 04: awareness (arena)', () => {
  /** Share of fresh games in which a monster is alert after one round, over many seeds. */
  function alertShare(setup: (level: Level) => Monster, trials = 1500, level = room(20, 5, 1, 3)): number {
    let alert = 0;
    for (let seed = 0; seed < trials; seed++) {
      const game = new Game(seed, level, testPlayer(sturdy));
      const m = setup(level);
      game.state.monsters.push(m);
      wait(game);
      if (m.awareness === 'alert') alert++;
    }
    return alert / trials;
  }

  it('a sleeper in sight within 8 cells wakes about 1 round in 6, an unaware creature about 1 in 2', () => {
    expect(alertShare(() => monsterAt(6, 3, { awareness: 'asleep' }))).toBeCloseTo(1 / 6, 1);
    expect(alertShare(() => monsterAt(6, 3, { awareness: 'unaware' }))).toBeCloseTo(1 / 2, 1);
  });

  it('a stealth buff cuts those to about 1 in 36 and 1 in 4', () => {
    const level = room(20, 5, 1, 3);
    const stealthy = (awareness: 'asleep' | 'unaware') => {
      let alert = 0;
      const trials = 2000;
      for (let seed = 0; seed < trials; seed++) {
        const game = new Game(seed, level, testPlayer({ ...sturdy, stealth: true }));
        const m = monsterAt(6, 3, { awareness });
        game.state.monsters.push(m);
        wait(game);
        if (m.awareness === 'alert') alert++;
      }
      return alert / trials;
    };
    expect(stealthy('asleep')).toBeLessThan(0.06);
    expect(stealthy('unaware')).toBeCloseTo(1 / 4, 1);
  });

  it('nothing is noticed beyond 8 cells or out of sight', () => {
    expect(alertShare(() => monsterAt(10, 3, { awareness: 'unaware' }), 400)).toBe(0); // 9 cells away
    expect(alertShare(() => monsterAt(9, 3, { awareness: 'unaware' }), 400)).toBeGreaterThan(0.3); // 8 cells away
    const walled = levelFrom(['###########', '#<..#.....#', '###########']);
    expect(alertShare(() => monsterAt(6, 1, { awareness: 'unaware' }), 400, walled)).toBe(0);
  });

  it('combat wakes sleepers within 3 cells and alerts the unaware within 6, and nobody further', () => {
    // A wall column hides the far creatures from the player, so only the fight can reach them.
    const rows = Array.from({ length: 9 }, (_, y) => (y === 0 || y === 8 ? '#'.repeat(30) : `#${'.'.repeat(15)}#${'.'.repeat(12)}#`));
    rows[4] = '#' + '.'.repeat(11) + '<' + '.'.repeat(3) + '#' + '.'.repeat(12) + '#'; // player at (12,4)
    const game = gameOn(levelFrom(rows), sturdy);
    const target = monsterAt(13, 4, { awareness: 'alert', ...harmless }); // the fight is at (13,4)
    const at = (x: number, y: number, awareness: 'asleep' | 'unaware') => monsterAt(x, y, { awareness, ...harmless });
    const near3 = at(13, 1, 'asleep'); // 3 cells from the fight: wakes
    const sleeper4 = at(17, 4, 'asleep'); // 4 cells, behind the wall column at x=16
    const unaware6 = at(19, 4, 'unaware'); // 6 cells, behind the wall
    const unaware7 = at(20, 4, 'unaware'); // 7 cells, behind the wall
    game.state.monsters.push(target, near3, sleeper4, unaware6, unaware7);
    game.act({ type: 'move', dx: 1, dy: 0 }); // the player attacks the target at (13,4)
    expect(target.awareness).toBe('alert');
    expect(near3.awareness).toBe('alert');
    expect(unaware6.awareness).toBe('alert');
    expect(sleeper4.awareness).toBe('asleep');
    expect(unaware7.awareness).toBe('unaware');
  });

  it('attacking a creature alerts it, and a rival turns hostile', () => {
    const game = gameOn(room(10, 3, 1, 2));
    const m = monsterAt(2, 2, { awareness: 'asleep', ...harmless });
    game.state.monsters.push(m);
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(m.awareness).toBe('alert');
    const other = gameOn(room(10, 3, 1, 2));
    const rival = creature({ id: 9, name: 'Corvin', glyph: 'R', colour: 1, x: 2, y: 2, dice: 30, modifier: -6, kind: 'rival', hostile: false });
    other.state.monsters.push(rival);
    other.act({ type: 'move', dx: 1, dy: 0 });
    expect(rival).toMatchObject({ hostile: true, awareness: 'alert' });
  });

  it('an alert creature loses track after 20 rounds out of sight and goes back to unaware', () => {
    const game = gameOn(levelFrom(['###########', '#<..#.....#', '###########']), sturdy);
    const m = monsterAt(7, 1, { alert: true });
    game.state.monsters.push(m);
    wait(game, 19);
    expect(m.awareness).toBe('alert');
    wait(game);
    expect(m.awareness).toBe('unaware');
  });

  it('a boss is alert as soon as the player enters its room; bandits once they see the player', () => {
    const base = levelFrom(['#################', '#<..#...........#', '#...+...........#', '#################']);
    const level: Level = { ...base, rooms: [{ x: 1, y: 1, w: 3, h: 2 }, { x: 5, y: 1, w: 11, h: 2 }] };
    const game = gameOn(level, sturdy);
    const boss = monsterAt(14, 1, { role: 'boss', fearless: true });
    const bandit = monsterAt(7, 2, { kind: 'bandit' });
    game.state.monsters.push(boss, bandit);
    wait(game, 5);
    expect(boss.awareness).toBe('unaware'); // the door is shut: the player is not in its room
    expect(bandit.awareness).toBe('unaware'); // and has not been seen
    game.act({ type: 'move', dx: 0, dy: 1 }); // to (1,2)
    for (let i = 0; i < 3; i++) game.act({ type: 'move', dx: 1, dy: 0 }); // (2,2), (3,2), then opens the door
    expect(bandit.awareness).toBe('alert'); // the open door shows the bandit
    game.state.monsters = [boss]; // out of the way of the doorway
    expect(boss.awareness).toBe('unaware'); // 11 cells away, and not in its room
    game.act({ type: 'move', dx: 1, dy: 0 }); // (4,2): the doorway, in neither room
    expect(boss.awareness).toBe('unaware');
    game.act({ type: 'move', dx: 1, dy: 0 }); // (5,2): inside the boss room
    expect(boss.awareness).toBe('alert');
  });

  it('the starting state is a seeded 50/50 that is fixed for the level, with ambushers unaware and bosses fearless', () => {
    const placed: PlacedMonster[] = Array.from({ length: 400 }, (_, i) => ({
      x: 1, y: 1, id: 'm', name: 'goblin', glyph: 'g', colour: 'moss', dice: 1, modifier: 0, speed: 'normal',
      behaviour: 'brute', group: i, role: 'normal',
    }));
    const level: Level = { ...room(5, 5, 3, 3), monsters: placed };
    const asleep = (g: Game) => g.state.monsters.map((m) => m.awareness);
    const a = asleep(new Game(5, level, testPlayer()));
    expect(a).toEqual(asleep(new Game(5, level, testPlayer())));
    expect(a).not.toEqual(asleep(new Game(6, level, testPlayer())));
    const share = a.filter((s) => s === 'asleep').length / a.length;
    expect(share).toBeGreaterThan(0.4);
    expect(share).toBeLessThan(0.6);
    expect(a.every((s) => s !== 'alert')).toBe(true);
    // Ambushers always start unaware; bosses and fearless rows are marked.
    const amb = spawn({ ...placed[0]!, behaviour: 'ambusher' }, 0);
    expect(amb).toMatchObject({ awareness: 'unaware', ambush: true });
    expect(spawn({ ...placed[0]!, role: 'boss' }, 0)).toMatchObject({ fearless: true, awareness: 'unaware' });
    expect(spawn({ ...placed[0]!, fearless: true }, 0).fearless).toBe(true);
  });
});

describe('Spec 04: behaviours, each recognisable in a scripted arena fight', () => {
  it('brute: charges straight in and fights to the end', () => {
    const game = gameOn(room(20, 3, 1, 2), sturdy);
    const m = monsterAt(10, 2, { alert: true, dice: 3, maxDice: 3, behaviour: 'brute', modifier: -6, fearless: true });
    game.state.monsters.push(m);
    wait(game, 9);
    expect(m.x).toBe(2); // 8 moves to the cell beside the player
    wait(game);
    expect(game.state.monsters).toContain(m); // it keeps attacking
    wait(game, 5);
    expect(m.x).toBe(2); // and never backs off
    expect(game.state.monsters.includes(m)).toBe(false); // it fought until it died: -6 loses every exchange
  });

  it('skirmisher: closes to its range, shoots from 3 to 6 cells, and closes in once its 6 shots are gone', () => {
    const game = gameOn(room(28, 5, 1, 3), sturdy);
    const m = monsterAt(14, 3, { alert: true, behaviour: 'skirmisher', ...harmless });
    game.state.monsters.push(m);
    const distances: number[] = [];
    const shots: number[] = [];
    for (let i = 0; i < 40 && !(m.shots === 0 && dist(game, m) <= 1.01); i++) {
      wait(game);
      distances.push(dist(game, m));
      shots.push(m.shots);
    }
    const shooting = distances.filter((_, i) => shots[i]! > 0 && shots[i]! < 6);
    expect(shooting.length).toBeGreaterThan(0);
    for (const d of shooting) {
      expect(d).toBeGreaterThanOrEqual(3);
      expect(d).toBeLessThanOrEqual(6);
    }
    expect(m.shots).toBe(0);
    expect(dist(game, m)).toBeLessThanOrEqual(1.01); // out of ammunition: it closes in
  });

  it('skirmisher: backs away from a player who closes in', () => {
    const game = gameOn(room(28, 5, 1, 3), sturdy);
    const m = monsterAt(8, 3, { alert: true, behaviour: 'skirmisher', ...harmless });
    game.state.monsters.push(m);
    for (let i = 0; i < 6; i++) game.act({ type: 'move', dx: 1, dy: 0 });
    expect(dist(game, m)).toBeGreaterThanOrEqual(3);
    expect(m.x).toBeGreaterThan(8);
  });

  it('skirmisher: cornered, it fights in melee', () => {
    const game = gameOn(levelFrom(['#####', '#<..#', '#####']), sturdy);
    const m = monsterAt(3, 1, { alert: true, behaviour: 'skirmisher', ...harmless });
    game.state.monsters.push(m);
    game.act({ type: 'move', dx: 1, dy: 0 });
    const out = game.act({ type: 'wait' })!;
    expect(out.messages.some((x) => /hits you/.test(x.text)) || m.dice < 30).toBe(true);
    expect(m.x).toBe(3);
  });

  it('caster: keeps its distance and never runs out of spells; flees when the player is adjacent', () => {
    const game = gameOn(room(28, 5, 1, 3), sturdy);
    const m = monsterAt(3, 3, { alert: true, behaviour: 'caster', ...harmless });
    game.state.monsters.push(m);
    wait(game, 3);
    expect(dist(game, m)).toBeGreaterThanOrEqual(3); // stepped away from the adjacent player
    const spelled: string[] = [];
    for (let i = 0; i < 20; i++) spelled.push(...game.act({ type: 'wait' })!.messages.map((x) => x.text));
    expect(spelled.filter((t) => /casts at you/.test(t)).length).toBeGreaterThan(10);
    expect(m.shots).toBe(6); // spells use no ammunition
    expect(dist(game, m)).toBeLessThanOrEqual(6);
  });

  it('caster: a spell that beats the Magic die removes a Combat die', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 6, combatMax: 6 });
    game.state.player.magic = { step: 6, dice: 0, max: 1 }; // defends at disadvantage
    const m = monsterAt(5, 2, { alert: true, behaviour: 'caster', modifier: 6, dice: 3, maxDice: 3 });
    game.state.monsters.push(m);
    const before = game.state.player.combatDice;
    const out = game.act({ type: 'wait' })!;
    expect(game.state.player.combatDice).toBe(before - 1);
    expect(out.messages.map((x) => x.text)).toContain('The goblin blasts you.');
    expect(game.state.player.magic.dice).toBe(0);
  });

  it('skirmisher shots are defended with the Skill die, not spent', () => {
    const game = gameOn(room(10, 3, 1, 2), sturdy);
    game.state.player.skill = { step: 6, dice: 1, max: 1 };
    game.state.monsters.push(monsterAt(5, 2, { alert: true, behaviour: 'skirmisher', modifier: -6 }));
    wait(game, 3);
    expect(game.state.player.skill.dice).toBe(1);
  });

  it('ambusher: waits unaware where it stands, then its first attack has advantage and only its first', () => {
    const game = gameOn(room(10, 3, 1, 2), sturdy);
    const m = monsterAt(10, 2, { behaviour: 'ambusher', ambush: true, awareness: 'unaware', ...harmless });
    game.state.monsters.push(m);
    const start = { x: m.x, y: m.y };
    // out of notice range: it holds its ground however long the player stays
    wait(game, 30);
    expect(m).toMatchObject(start);
    m.awareness = 'alert';
    wait(game, 8);
    expect(m.ambush).toBe(true); // still closing in
    wait(game, 4);
    expect(m.ambush).toBe(false); // spent on the first attack
  });

  it('pack: the whole group wakes together and closes in on all four sides of the player', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const level = room(15, 9, 7, 5);
      const game = new Game(seed, level, testPlayer(sturdy));
      const wolves = [[2, 2], [12, 2], [2, 8], [12, 8]].map(([x, y], i) =>
        monsterAt(x!, y!, { id: 100 + i, behaviour: 'pack', group: 7, awareness: 'unaware', ...harmless }),
      );
      game.state.monsters.push(...wolves);
      let rounds = 0;
      while (wolves.every((w) => w.awareness !== 'alert') && rounds++ < 40) wait(game);
      expect(wolves.map((w) => w.awareness)).toEqual(['alert', 'alert', 'alert', 'alert']);
      wait(game, 14);
      const p = game.state.map.player;
      const around = new Set(wolves.map((w) => `${w.x - p.x},${w.y - p.y}`));
      expect([...around].sort()).toEqual(['-1,0', '0,-1', '0,1', '1,0']);
    }
  });

  it('coward: keeps away from a near player, closes in from afar, and fights only when cornered', () => {
    const game = gameOn(room(30, 5, 1, 3), sturdy);
    const m = monsterAt(4, 3, { alert: true, behaviour: 'coward', ...harmless });
    game.state.monsters.push(m);
    wait(game, 8);
    expect(dist(game, m)).toBeGreaterThan(4);
    expect(game.state.monsters.find((x) => x === m)!.dice).toBe(30); // never fought
    const far = monsterAt(20, 1, { alert: true, behaviour: 'coward', ...harmless });
    game.state.monsters.push(far);
    wait(game, 18);
    expect(dist(game, far)).toBeLessThanOrEqual(6.1);

    const dead = gameOn(levelFrom(['#####', '#<.c#', '#####']), sturdy);
    const cornered = monsterAt(3, 1, { alert: true, behaviour: 'coward', ...harmless });
    dead.state.monsters.push(cornered);
    dead.act({ type: 'move', dx: 1, dy: 0 }); // the player steps beside it
    wait(dead, 2);
    expect(cornered.dice).toBeLessThan(30); // cornered, it fought
    expect(cornered.x).toBe(3);
  });
});

describe('Spec 04: morale', () => {
  it('a creature reduced to one die flees about 1 round in 3', () => {
    let fleeing = 0;
    const trials = 1500;
    for (let seed = 0; seed < trials; seed++) {
      const game = new Game(seed, room(20, 5, 1, 3), testPlayer(sturdy));
      const m = monsterAt(12, 3, { alert: true, dice: 1, maxDice: 3 });
      game.state.monsters.push(m);
      wait(game);
      if (m.fleeing) fleeing++;
    }
    expect(fleeing / trials).toBeCloseTo(1 / 3, 1);
  });

  it('undead, constructs, bosses and one-die creatures never flee, and a fleeing creature runs from the player', () => {
    for (const extra of [{ fearless: true }, { maxDice: 1 }] as const) {
      for (let seed = 0; seed < 150; seed++) {
        const game = new Game(seed, room(20, 5, 1, 3), testPlayer(sturdy));
        const m = monsterAt(12, 3, { alert: true, dice: 1, maxDice: 3, ...extra });
        game.state.monsters.push(m);
        wait(game);
        expect(m.fleeing).toBe(false);
      }
    }
    const game = gameOn(room(20, 5, 1, 3), sturdy);
    const m = monsterAt(5, 3, { alert: true, dice: 1, maxDice: 3, fleeing: true });
    game.state.monsters.push(m);
    wait(game, 5);
    expect(dist(game, m)).toBeGreaterThanOrEqual(7);
  });

  it('a creature that has fled out of sight for 20 rounds calms down', () => {
    const game = gameOn(levelFrom(['###########', '#<..#.....#', '###########']), sturdy);
    const m = monsterAt(7, 1, { alert: true, fleeing: true });
    game.state.monsters.push(m);
    wait(game, 20);
    expect(m).toMatchObject({ fleeing: false, awareness: 'unaware' });
  });
});

describe('Spec 04: bandits', () => {
  const bandit = (x: number, y: number, extra: Partial<Monster> = {}) =>
    monsterAt(x, y, { kind: 'bandit', name: 'Bram', alert: true, modifier: 6, dice: 3, maxDice: 3, ...extra });

  it('a bandit hit removes a Combat die and steals 10% of the carried gold; killing it drops the loot', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, coins: 100 });
    const b = bandit(2, 2, { modifier: -6, dice: 1, maxDice: 1 }); // placeholder replaced below
    game.state.monsters = [];
    b.modifier = 6;
    b.dice = 5;
    b.maxDice = 5;
    game.state.monsters.push(b);
    const first = game.act({ type: 'wait' })!;
    expect(game.state.player.combatDice).toBe(5);
    expect(game.state.player.coins).toBe(90);
    expect(b.carried).toEqual([{ kind: 'coins', amount: 10 }]);
    expect(first.messages.map((m) => m.text)).toContain('Bram steals 10 gp.');
    // Kill it: it drops what it stole where it falls.
    b.modifier = -6;
    while (game.state.monsters.includes(b)) game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.drops).toEqual([{ x: 2, y: 2, contents: [{ kind: 'coins', amount: 10 }] }]);
  });

  it('after stealing twice the bandit flees', () => {
    const game = gameOn(room(12, 3, 1, 2), { ...sturdy, coins: 100 });
    const b = bandit(2, 2);
    game.state.monsters.push(b);
    const texts: string[] = [];
    texts.push(...game.act({ type: 'wait' })!.messages.map((m) => m.text));
    expect(b.fleeing).toBe(false);
    texts.push(...game.act({ type: 'wait' })!.messages.map((m) => m.text));
    expect(b.thefts).toBe(2);
    expect(b.carried).toEqual([{ kind: 'coins', amount: 19 }]); // 10, then 10% of 90 = 9
    expect(game.state.player.coins).toBe(81);
    expect(b.fleeing).toBe(true);
    expect(texts).toContain('Bram turns to flee.');
    wait(game, 4);
    expect(dist(game, b)).toBeGreaterThanOrEqual(5);
  });

  it('a theft that finds no gold takes nothing and does not count', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, coins: 0 });
    const b = bandit(2, 2);
    game.state.monsters.push(b);
    wait(game, 3);
    expect(game.state.player.combatDice).toBe(3);
    expect(b).toMatchObject({ thefts: 0, carried: [], fleeing: false });
  });

  it('a hit that kills the player steals nothing', () => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 0, combatMax: 2, coins: 50 });
    game.state.monsters.push(bandit(2, 2));
    wait(game);
    expect(game.state.player.dead).toBe(true);
    expect(game.state.player.coins).toBe(50);
  });

  it('bandits and rivals come from the level\'s NPC list, rated at the ceiling for the depth', () => {
    const level: Level = {
      ...room(10, 3, 1, 2), depth: 50,
      npcs: [
        { x: 4, y: 2, kind: 'bandit', name: 'Bram' },
        { x: 6, y: 2, kind: 'rival', name: 'Corvin the Bold' },
        { x: 8, y: 2, kind: 'trader', name: 'Mara' },
      ],
    };
    const all = spawnAll(level);
    expect(all.map((m) => [m.kind, m.name, m.dice, m.modifier, m.hostile])).toEqual([
      ['bandit', 'Bram', 11, 3, true],
      ['rival', 'Corvin the Bold', 11, 3, false],
    ]);
    expect(new Set(all.map((m) => m.id)).size).toBe(2);
  });
});

describe('Spec 04: rivals', () => {
  /** A 3-row hall with the up stair at the left and the down stair at the right. */
  const hall = (): Level => {
    const wall = '#'.repeat(26);
    const mid = (first: string, last: string) => `#${first}${'.'.repeat(22)}${last}#`;
    return levelFrom([wall, mid('<', '>'), mid('.', '.'), mid('.', '.'), wall]);
  };
  const rival = (x: number, y: number, extra: Partial<Monster> = {}) =>
    creature({ id: 50, name: 'Corvin', glyph: 'R', colour: 1, x, y, dice: 5, maxDice: 5, modifier: 0, kind: 'rival', behaviour: 'skirmisher', hostile: false, ...extra });

  it('heads for the down stair, ignoring the player, and waits beside it', () => {
    const game = gameOn(hall(), sturdy);
    const r = rival(3, 3);
    game.state.monsters.push(r);
    wait(game, 60);
    expect(Math.abs(r.x - 24) + Math.abs(r.y - 1)).toBeLessThanOrEqual(1);
    expect(game.state.map.level.tiles[r.y]![r.x]).not.toBe('>'); // beside the stair, never on it
    expect(game.state.player.combatDice).toBe(6);
    expect(r.hostile).toBe(false);
  });

  it('ignores a player standing next to it, however long they stand there', () => {
    const game = gameOn(hall(), sturdy);
    const r = rival(2, 1);
    game.state.monsters.push(r);
    wait(game, 20);
    expect(game.state.player.combatDice).toBe(6);
    expect(r.hostile).toBe(false);
  });

  it('takes the contents of containers and piles on its way, and leaves cross-level caches', () => {
    const base = hall();
    const level: Level = {
      ...base,
      features: [
        { type: 'container', kind: 'chest', x: 8, y: 3, contents: [{ kind: 'coins', amount: 40 }] },
        { type: 'container', kind: 'sack', x: 15, y: 2, contents: [{ kind: 'coins', amount: 25 }], link: 'cache' },
        { type: 'container', kind: 'chest', x: 18, y: 1, contents: [{ kind: 'coins', amount: 5 }, { kind: 'key' }] },
      ],
      piles: [{ x: 12, y: 3, contents: [{ kind: 'coins', amount: 7 }] }],
    };
    const game = gameOn(level, sturdy);
    const r = rival(3, 2);
    game.state.monsters.push(r);
    wait(game, 40);
    expect(game.state.looted.features.sort()).toEqual([0, 2]);
    expect(game.state.looted.piles).toEqual([0]);
    expect(r.carried).toEqual([{ kind: 'coins', amount: 52 }, { kind: 'key' }]);
  });

  it('fights monsters next to it; a dead rival drops everything it looted', () => {
    const game = gameOn(hall(), sturdy);
    const r = rival(5, 3, { dice: 1, maxDice: 1, carried: [{ kind: 'coins', amount: 30 }] });
    const strong = monsterAt(6, 3, { modifier: 6, dice: 4, maxDice: 4, awareness: 'asleep' });
    game.state.monsters.push(r, strong);
    const out = game.act({ type: 'wait' })!;
    expect(game.state.monsters).not.toContain(r);
    expect(game.state.drops).toEqual([{ x: 5, y: 3, contents: [{ kind: 'coins', amount: 30 }] }]);
    expect(out.messages.map((m) => m.text)).toContain('The goblin kills Corvin.');
    expect(strong.awareness).toBe('alert'); // the fight woke it
  });

  it('kills a weak monster in its way and carries on', () => {
    const game = gameOn(hall(), sturdy);
    const r = rival(5, 3, { dice: 9, maxDice: 9, modifier: 6 });
    game.state.monsters.push(r, monsterAt(6, 3, { modifier: -6, dice: 1, awareness: 'asleep' }));
    const out = game.act({ type: 'wait' })!;
    expect(game.state.monsters).toEqual([r]);
    expect(out.messages.map((m) => m.text)).toContain('Corvin kills the goblin.');
  });

  it('once attacked it is hostile and fights as a skirmisher', () => {
    const game = gameOn(hall(), sturdy);
    const r = rival(2, 1, { dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(r);
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(r).toMatchObject({ hostile: true, awareness: 'alert' });
    wait(game, 14);
    expect(r.shots).toBeLessThan(6);
    expect(dist(game, r)).toBeGreaterThanOrEqual(1);
    expect(r.x).toBeLessThan(24); // it stopped walking to the stairs
  });

  it('acts even when the player cannot see it', () => {
    const level = levelFrom(['#############', '#<..#.......#', '#...+......>#', '#############']);
    const game = gameOn({ ...level, doors: [{ x: 4, y: 2, kind: 'normal' }] }, sturdy);
    const r = rival(6, 2);
    game.state.monsters.push(r);
    wait(game, 12);
    expect(r.x).toBeGreaterThan(8); // out of sight behind the shut door, it still walked
  });

  it('opens a normal door on its way and cannot pass a locked one', () => {
    const level = levelFrom(['###########', '#<.R.+...>#', '###########']);
    const normal = gameOn({ ...level, doors: [{ x: 5, y: 1, kind: 'normal' }] }, sturdy);
    normal.state.monsters.push(rival(3, 1));
    wait(normal, 12);
    expect(normal.state.map.openDoors).toContain(1 * 11 + 5);
    expect(normal.state.monsters[0]!.x).toBeGreaterThanOrEqual(7);
    const locked = gameOn({ ...level, doors: [{ x: 5, y: 1, kind: 'locked' }] }, sturdy);
    locked.state.monsters.push(rival(3, 1));
    wait(locked, 12);
    expect(locked.state.monsters[0]!.x).toBeLessThan(5);
  });
});

describe('Spec 04: ranged weapons spend ammunition', () => {
  it('each shot, hit or miss, spends one; with none left the weapon cannot fire and no round passes', () => {
    const game = gameOn(room(12, 3, 1, 2), { ranged: { name: 'Sling', range: 6, ammo: 3 }, ...sturdy });
    const m = monsterAt(7, 2, { ...harmless, awareness: 'unaware' });
    game.state.monsters.push(m);
    for (let left = 2; left >= 0; left--) {
      expect(game.fire(m).spent).toBe(true);
      expect(game.state.player.ranged!.ammo).toBe(left);
    }
    const round = game.state.round;
    const dry = game.fire(m);
    expect(dry.spent).toBe(false);
    expect(dry.messages[0]!.text).toContain('out of ammunition');
    expect(game.state.round).toBe(round);
    expect(game.state.player.ranged!.ammo).toBe(0);
  });

  it('a shot costs a Skill die on a 2 to 3 or a 1, a hit removes one die, and a shot alerts its target', () => {
    let hits = 0;
    let lost = 0;
    for (let seed = 0; seed < 1500; seed++) {
      const game = new Game(seed, room(12, 3, 1, 2), testPlayer({ ...sturdy, skill: { step: 6, dice: 3, max: 3 }, ranged: { name: 'Sling', range: 6, ammo: 5 } }));
      const m = monsterAt(7, 2, { ...harmless, awareness: 'asleep' });
      game.state.monsters.push(m);
      game.fire(m);
      expect(m.awareness).toBe('alert');
      if (m.dice < 30) hits++;
      lost += 3 - game.state.player.skill.dice;
    }
    // d6: hits on 2 or more (5 in 6), die lost on 1 to 3 (half)
    expect(hits / 1500).toBeCloseTo(5 / 6, 1);
    expect(lost / 1500).toBeCloseTo(0.5, 1);
  });

  it('there is no shot without a weapon', () => {
    const game = gameOn(room(8, 3, 1, 2), { ranged: null });
    const m = monsterAt(5, 2);
    game.state.monsters.push(m);
    expect(game.fire(m)).toMatchObject({ spent: false });
  });

  it('a target next to the player is shot at disadvantage', () => {
    // Over many seeds the adjacent miss rate (disadvantage on a d6: 11/36 faces of 1 or 2... hits need 2+) exceeds the plain one.
    const missRate = (x: number) => {
      let miss = 0;
      for (let seed = 0; seed < 600; seed++) {
        const game = new Game(seed, room(12, 3, 1, 2), testPlayer({ ...sturdy, skill: { step: 6, dice: 3, max: 3 }, ranged: { name: 'Sling', range: 6, ammo: 5 } }));
        const m = monsterAt(x, 2, { ...harmless, awareness: 'alert', behaviour: 'brute', speed: 'slow' }); // a slow creature does not act in round 1
        game.state.monsters.push(m);
        game.fire(m);
        if (m.dice === 30) miss++;
      }
      return miss / 600;
    };
    expect(missRate(2)).toBeCloseTo(11 / 36, 1); // P(min of two d6 = 1)
    expect(missRate(6)).toBeCloseTo(1 / 6, 1);
  });
});

describe('Spec 04: stairs and pursuit', () => {
  it('no monster ever changes level: hunters stay where they stood when the player leaves, and arrive nowhere', () => {
    const rows = ['###########', '#<.......>#', '###########'];
    const r = new Run(1, testPlayer(sturdy), { startDepth: 1, levelFor: () => levelFrom(rows) });
    const game = r.game!;
    const hunter = monsterAt(4, 1, { alert: true, ...harmless });
    game.state.monsters.push(hunter);
    const adjacent = monsterAt(2, 1, { alert: true, ...harmless, id: 8 });
    game.state.monsters.push(adjacent);
    const depth = r.depth;
    r.travel('up');
    expect(r.depth).toBe(depth - 1);
    expect(r.game).toBeNull(); // the village: no creature came with the player
    r.travel('down');
    expect(r.game!.state.monsters.map((m) => [m.id, m.x, m.y])).toEqual([[hunter.id, 4, 1], [8, 2, 1]]);
    // and into the next level none of them appear
    r.game!.state.map.player = { x: 9, y: 1 };
    r.travel('down');
    expect(r.depth).toBe(2);
    expect(r.game!.state.monsters).toEqual([]);
  });

  it('a level delta keeps the full awareness state of each creature as plain data', () => {
    const r = new Run(1, testPlayer(sturdy), { startDepth: 1, levelFor: () => levelFrom(['###########', '#<.......>#', '###########']) });
    const m = monsterAt(4, 1, { alert: true, carried: [{ kind: 'coins', amount: 3 }], fleeing: true, ...harmless });
    r.game!.state.monsters.push(m);
    r.game!.state.drops.push({ x: 5, y: 1, contents: [{ kind: 'coins', amount: 2 }] });
    r.game!.state.looted.features.push(3);
    r.travel('up');
    const delta = JSON.parse(JSON.stringify(r.deltas[1]));
    expect(delta.monsters[0]).toMatchObject({ awareness: 'alert', fleeing: true, carried: [{ kind: 'coins', amount: 3 }] });
    r.travel('down');
    expect(r.game!.state.drops).toEqual([{ x: 5, y: 1, contents: [{ kind: 'coins', amount: 2 }] }]);
    expect(r.game!.state.looted.features).toEqual([3]);
    expect(r.game!.state.monsters[0]).toEqual(m);
  });
});

describe('Spec 04: simulation cost', () => {
  it('a round with 50 hunting creatures on a large level stays well inside a frame budget', () => {
    const level = generateLevel(7, 30, 'large');
    const game = new Game(7, level, testPlayer(sturdy));
    const open: { x: number; y: number }[] = [];
    for (let y = 0; y < level.height; y++) for (let x = 0; x < level.width; x++) if (level.tiles[y]![x] === '.') open.push({ x, y });
    const kinds = ['brute', 'pack', 'skirmisher', 'caster', 'coward'];
    for (let i = 0; i < 60; i++) {
      const at = open[(i * 977) % open.length]!;
      game.state.monsters.push(monsterAt(at.x, at.y, { id: i, alert: true, behaviour: kinds[i % kinds.length]!, group: i % 4, ...harmless }));
    }
    const start = performance.now();
    for (let i = 0; i < 20; i++) game.act({ type: 'wait' });
    const perRound = (performance.now() - start) / 20;
    expect(perRound).toBeLessThan(100);
  });
});
