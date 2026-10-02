// Task 3.8: allies (Spec 04, Addendum A) and the three major abilities that make them, Raise, Decoy and Companion
// (Spec 03, Addendum A). Each kind of ally behaves as the addendum says in a scripted arena fight, and only the
// companion changes level.

import { describe, expect, it } from 'vitest';
import type { LogMessage } from '../src/core/log.ts';
import { PHANTOM_ROUNDS, RAISED_ROUNDS, allyOf, companionDice, decoy, decoyCells, placeCompanion, raise } from '../src/game/allies.ts';
import { playerAttacks } from '../src/game/combat.ts';
import type { Game } from '../src/game/game.ts';
import { castSpell } from '../src/game/magic.ts';
import { ALLY_COLOUR, type Monster } from '../src/game/monsters.ts';
import { migrate4to5 } from '../src/game/save.ts';
import { validTargets } from '../src/game/targeting.ts';
import type { StatusEffect } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { gameAt, monsterAt, press, rig, room, shellOn, spell, townRun } from './helpers.ts';

const said = (r: { messages: { text: string }[] } | LogMessage[]): string => ('messages' in r ? r.messages : r).map((m) => m.text).join(' | ');
const arena = (): Level => room(12, 7, 1, 1);
const held = (): StatusEffect[] => [{ id: 'held', rounds: 50, clock: 0 }];
/** A player at (4,3) with the given major ability. */
const hero = (ability: string, extra: Parameters<typeof gameAt>[3] = {}, level = arena(), x = 4, y = 3): Game => {
  const game = gameAt(level, x, y, { pack: [], equipment: {}, combatDice: 4, combatMax: 4, skill: { step: 6, dice: 2, max: 2 }, magic: { step: 6, dice: 2, max: 2 }, abilities: [ability], ...extra });
  placeCompanion(game); // beside where the test put the player
  return game;
};
const add = (game: Game, x: number, y: number, extra: Parameters<typeof monsterAt>[2] = {}): Monster => {
  const m = monsterAt(x, y, { alert: true, dice: 3, ...extra });
  game.state.monsters.push(m);
  return m;
};
const companion = (game: Game): Monster => allyOf(game, 'companion')!;
/** Free cells near the player, nearest first. */
const decoyCellsNear = (game: Game) => decoyCells(game);
const wait = (game: Game, n = 1): string => {
  let text = '';
  for (let i = 0; i < n; i++) text += said(game.act({ type: 'wait' })!);
  return text;
};

describe('Spec 03, Addendum A: Companion', () => {
  it('a Beastmaster arrives with an animal ally beside them: 1 die (d6+0), drawn as its letter in the ally colour', () => {
    const game = hero('companion');
    const c = companion(game);
    expect(c).toMatchObject({ x: 4, y: 2, dice: 1, maxDice: 1, modifier: 0, kind: 'ally', ally: 'companion', colour: ALLY_COLOUR, glyph: 'd' });
    expect(allyOf(hero('cleave'), 'companion')).toBeUndefined();
  });

  it('it gains a die at character levels 4, 7 and 10', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(companionDice)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4]);
    const seventh = hero('companion', { level: 7 });
    expect(companion(seventh).dice).toBe(3);
  });

  it('Q says it works by itself, and spends no round', () => {
    const shell = shellOn(arena(), [], { abilities: ['companion'] });
    const turn = shell.turn;
    press(shell, 'q');
    expect(shell.turn).toBe(turn);
    expect(shell.log.lines(shell.turn).at(-1)!.text).toBe('Your companion fights beside you by itself.');
  });
});

describe('Spec 04, Addendum A: how allies act', () => {
  it('an ally attacks an adjacent hostile creature, fewest dice first, as ordinary melee; its kills count', () => {
    const game = hero('companion');
    const north = add(game, 4, 1, { dice: 2, statuses: held() });
    const east = add(game, 5, 2, { dice: 1, id: 2, statuses: held() });
    const kills = game.state.player.stats.kills;
    rig(game, 6, 1); // the companion's d6 against the creature's
    expect(wait(game)).toContain('Your companion kills the goblin.');
    expect(game.state.monsters).not.toContain(east);
    expect(north.dice).toBe(2);
    expect(game.state.player.stats.kills).toBe(kills + 1);
    // The fight was combat for awareness: a sleeper beside it wakes.
    const sleeper = add(game, 2, 2, { alert: false, awareness: 'asleep', id: 3, statuses: held() });
    rig(game, 1, 1); // a tie: both hit
    wait(game);
    expect(sleeper.awareness).toBe('alert');
    expect(north.dice).toBe(1);
    expect(game.state.player.companion.dead).toBe(true); // its one die was gone
  });

  it('else it moves toward the nearest hostile creature in sight; else it keeps within 3 cells of the player', () => {
    const game = hero('companion');
    const c = companion(game);
    add(game, 10, 2, { statuses: held() });
    wait(game);
    expect(c).toMatchObject({ x: 5, y: 2 });
    game.state.monsters.splice(1, 1);
    c.x = 10;
    c.y = 3;
    wait(game);
    expect(c.x).toBe(9); // back toward the player
    c.x = 7;
    wait(game);
    expect(c.x).toBe(7); // within 3 cells, it stays
  });

  it('it never attacks a peaceful rival, and the rival does not fight it', () => {
    const game = hero('companion');
    const rival = add(game, 5, 2, { kind: 'rival', hostile: false, name: 'Corvin' });
    wait(game, 3);
    expect([rival.dice, companion(game).dice]).toEqual([3, 1]);
  });

  it('a hostile creature attacks an adjacent ally only when the player is not adjacent to it', () => {
    const game = hero('companion', { level: 4 });
    const c = companion(game);
    c.statuses = held();
    const m = add(game, 4, 1); // beside the companion, not the player
    rig(game, 6, 1);
    expect(wait(game)).toContain('The goblin hits your companion.');
    expect(c.dice).toBe(1);
    expect(game.state.player.companion.hurt).toBe(1);
    expect(game.state.player.fight).toBeNull(); // not an exchange involving the player
    game.state.monsters.splice(game.state.monsters.indexOf(m), 1);
    // Beside both: it attacks the player.
    c.x = 3;
    c.y = 2;
    add(game, 3, 3, { id: 2 });
    rig(game, 6, 1);
    wait(game);
    expect([c.dice, game.state.player.pools.combat.dice]).toEqual([1, 3]);
  });

  it("targeting never offers an ally, an ally in the line blocks it, and an area spell hits allies in its footprint but a caster-centred one spares them", () => {
    const game = hero('companion', { level: 10, spells: ['fireball', 'thunderclap'], magic: { step: 6, dice: 3, max: 3 } });
    const c = companion(game); // at (4,2), north of the player
    add(game, 4, 1, { statuses: held() }); // behind the companion
    const open = add(game, 7, 3, { id: 2, statuses: held() });
    expect(validTargets(game, 8)).toEqual([open]);
    rig(game, 5);
    castSpell(game, spell('thunderclap'), undefined, []);
    expect(c).toMatchObject({ x: 4, y: 2, dice: 4 });
    rig(game, 5);
    castSpell(game, spell('fireball'), { x: 4, y: 1 }, []);
    expect(c.dice).toBe(3);
  });

  it('walking into the companion trades places with it, as one move', () => {
    const game = hero('companion');
    const round = game.state.round;
    expect(game.act({ type: 'move', dx: 0, dy: -1 })).toMatchObject({ spent: true });
    expect(game.state.map.player).toEqual({ x: 4, y: 2 });
    expect(companion(game)).toMatchObject({ x: 4, y: 3 });
    expect(game.state.round).toBe(round + 1);
  });
});

describe('Spec 03, Addendum A: Raise', () => {
  const kill = (game: Game, extra: Parameters<typeof monsterAt>[2] = {}): Monster => {
    const m = add(game, 5, 3, { dice: 1, maxDice: 3, modifier: 1, glyph: 'o', name: 'orc', ...extra });
    rig(game, 6, 1);
    playerAttacks(game, m, []);
    expect(game.state.monsters).not.toContain(m);
    return m;
  };

  it('the most recent creature to die in sight rises on its cell with its starting dice and modifier, for 20 rounds, then crumbles', () => {
    const game = hero('raise');
    kill(game);
    rig(game, 5);
    const result = game.useMajor();
    expect(result.spent).toBe(true);
    expect(said(result)).toContain('The raised orc rises to fight beside you.');
    const r = allyOf(game, 'raised')!;
    expect(r).toMatchObject({ x: 5, y: 3, dice: 3, maxDice: 3, modifier: 1, glyph: 'o', colour: ALLY_COLOUR, kind: 'ally' });
    expect(wait(game, RAISED_ROUNDS - 2)).not.toContain('crumbles');
    expect(wait(game)).toContain('The raised orc crumbles to dust.');
    expect(allyOf(game, 'raised')).toBeUndefined();
  });

  it('only within the last 3 rounds, within 8 cells and in sight, and never a boss', () => {
    const late = hero('raise');
    kill(late);
    wait(late, 3);
    expect(late.useMajor()).toMatchObject({ spent: false, messages: [{ text: 'Nothing has fallen near enough to raise.' }] });
    const fresh = hero('raise');
    kill(fresh);
    wait(fresh, 2);
    rig(fresh, 5);
    expect(fresh.useMajor().spent).toBe(true);
    const boss = hero('raise');
    kill(boss, { role: 'boss' });
    expect(boss.useMajor().spent).toBe(false);
    const far = hero('raise', {}, room(16, 7, 1, 1));
    far.state.fallen.push({ creature: monsterAt(13, 3, { dice: 2 }), round: far.state.round });
    expect(far.useMajor().spent).toBe(false); // 9 cells away
    far.state.fallen.push({ creature: monsterAt(12, 3, { dice: 2 }), round: far.state.round });
    rig(far, 5);
    expect(far.useMajor().spent).toBe(true); // 8 cells
  });

  it('one raised ally at a time: raising another takes the first', () => {
    const game = hero('raise');
    kill(game);
    rig(game, 5);
    game.useMajor();
    const first = allyOf(game, 'raised')!;
    first.x = 3; // it moved off
    first.y = 3;
    game.state.fallen.push({ creature: monsterAt(4, 4, { dice: 2, name: 'rat' }), round: game.state.round });
    rig(game, 5);
    expect(said(game.useMajor())).toContain('The raised orc crumbles to dust.');
    expect(game.state.monsters.filter((m) => m.ally === 'raised').map((m) => m.name)).toEqual(['the raised rat']);
  });

  it('Q raises with no aim, as a skill use', () => {
    const shell = shellOn(arena(), [], { abilities: ['raise'], skill: { step: 6, dice: 1, max: 1 } });
    const game = shell.game!;
    game.state.fallen.push({ creature: monsterAt(3, 1, { dice: 2 }), round: game.state.round });
    rig(game, 5);
    press(shell, 'q');
    expect(allyOf(game, 'raised')).toMatchObject({ x: 3, y: 1, dice: 2 });
  });
});

describe('Spec 03 and 04, Addendum A: Decoy and the phantom', () => {
  it('a cursor as for Blink picks a visible free cell within 5; the phantom stands there for 5 rounds and does not act', () => {
    const shell = shellOn(arena(), [], { abilities: ['decoy'], skill: { step: 6, dice: 1, max: 1 } });
    const game = shell.game!; // the player stands on the up stair at (1,1)
    press(shell, 'q');
    expect(shell.cursor).not.toBeNull();
    for (let i = 0; i < 6; i++) press(shell, 'd'); // 6 cells: too far
    press(shell, 'Enter');
    expect(shell.log.lines(shell.turn).at(-1)!.text).toBe('You cannot place the phantom there.');
    press(shell, 'a');
    rig(game, 5);
    press(shell, 'Enter');
    const p = allyOf(game, 'phantom')!;
    expect(p).toMatchObject({ x: 6, y: 1, glyph: '@', colour: ALLY_COLOUR });
    expect(wait(game, PHANTOM_ROUNDS - 2)).not.toContain('fades');
    expect(p).toMatchObject({ x: 6, y: 1 });
    expect(wait(game)).toContain('The phantom fades away.');
    expect(allyOf(game, 'phantom')).toBeUndefined();
  });

  it('alert hostile creatures within 8 cells take it for the player: they leave the player and strike it harmlessly, with no exchange', () => {
    const game = hero('decoy');
    const m = add(game, 5, 3, { modifier: 10 }); // beside the player, and it would win
    decoy(game, { x: 7, y: 3 }, []);
    expect(wait(game)).not.toContain('hits you');
    expect(m).toMatchObject({ x: 6, y: 3 });
    expect(wait(game)).toContain('The goblin attacks the phantom, and the blow passes through it.');
    expect(game.state.player.pools.combat.dice).toBe(4);
    expect(game.state.player.fight).toBeNull();
  });

  it('a creature farther than 8 cells from it still hunts the player', () => {
    const level = room(20, 7, 1, 1);
    const near = hero('decoy', {}, level, 10, 1);
    decoy(near, { x: 10, y: 6 }, []);
    const lured = add(near, 18, 6);
    wait(near);
    expect(lured).toMatchObject({ x: 17, y: 6 }); // 8 cells: toward the phantom
    const far = hero('decoy', {}, level, 10, 1);
    decoy(far, { x: 10, y: 6 }, []);
    const hunter = add(far, 19, 6);
    wait(far);
    expect(hunter).toMatchObject({ x: 19, y: 5 }); // 9 cells: toward the player
  });

  it('nothing touches it: a fireball leaves it, and walking into it is blocked with no round spent', () => {
    const game = hero('decoy', { spells: ['fireball'], magic: { step: 6, dice: 2, max: 2 } });
    decoy(game, { x: 4, y: 4 }, []);
    rig(game, 5);
    castSpell(game, spell('fireball'), { x: 4, y: 5 }, []);
    expect(allyOf(game, 'phantom')).toMatchObject({ dice: 1 });
    expect(game.act({ type: 'move', dx: 0, dy: 1 })).toMatchObject({ spent: false, messages: [{ text: 'Your phantom stands in the way.' }] });
  });
});

describe('Spec 04, Addendum A: only the companion changes level', () => {
  it('a raised ally and a phantom stay behind and are gone; the companion arrives beside the player with its hurts, and waits in a village', () => {
    const run = townRun(777, { abilities: ['companion'], level: 4 });
    run.travel('down');
    const game = run.game!;
    const c = companion(game);
    const { player: at } = game.state.map;
    expect(Math.max(Math.abs(c.x - at.x), Math.abs(c.y - at.y))).toBe(1);
    // Hurt it, and stand a raised ally and a phantom on the level too.
    c.dice = 1;
    run.player.companion.hurt = 1;
    const free = decoyCellsNear(game);
    game.state.fallen.push({ creature: monsterAt(free[0]!.x, free[0]!.y, { dice: 2 }), round: game.state.round });
    raise(game, []);
    decoy(game, free[1]!, []);
    expect(game.state.monsters.filter((m) => m.kind === 'ally')).toHaveLength(3);
    run.travel('down');
    expect(run.game!.state.monsters.filter((m) => m.kind === 'ally').map((m) => m.ally)).toEqual(['companion']);
    expect(companion(run.game!).dice).toBe(1);
    // Nothing of the allies is kept in the level left behind.
    run.travel('up');
    expect(run.game!.state.monsters.filter((m) => m.kind === 'ally').map((m) => m.ally)).toEqual(['companion']);
    // Up to the village, where it is not drawn, and back.
    run.travel('up');
    expect(run.inVillage).toBe(true);
    expect(run.game).toBeNull();
    run.travel('down');
    expect(companion(run.game!).dice).toBe(1);
  });

  it('a killed companion is gone until the next village rest, which brings it back whole', () => {
    const run = townRun(778, { abilities: ['companion'], level: 7 });
    run.player.town.bank = 500;
    run.player.companion = { hurt: 3, dead: true };
    run.travel('down');
    expect(allyOf(run.game!, 'companion')).toBeUndefined();
    run.travel('up');
    run.town.rest();
    expect(run.player.companion).toEqual({ hurt: 0, dead: false });
    run.travel('down');
    expect(companion(run.game!).dice).toBe(3);
  });

  it('after a fall it lands beside the player again', () => {
    const game = hero('companion');
    game.landAnywhere();
    const c = companion(game);
    expect(Math.max(Math.abs(c.x - game.state.map.player.x), Math.abs(c.y - game.state.map.player.y))).toBe(1);
    expect(game.state.monsters.filter((m) => m.ally === 'companion')).toHaveLength(1);
  });

  it('save format 5 keeps the companion; a format 4 save gains a living, unhurt one', () => {
    expect(migrate4to5({ player: { name: 'Mara' } })).toEqual({ player: { name: 'Mara', companion: { hurt: 0, dead: false } } });
    expect(migrate4to5({ player: { companion: { hurt: 2, dead: true } } })).toEqual({ player: { companion: { hurt: 2, dead: true } } });
  });
});
