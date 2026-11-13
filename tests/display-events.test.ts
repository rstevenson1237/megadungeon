// Display events (Spec 01b, Animation and effects; task 6.8 clarification): the Game records what each action showed,
// beside the state and never in it, phased into the player's action and the creatures' round in turn mode and stamped
// with ticks in real time, and only what the player can see.

import { describe, expect, it } from 'vitest';
import type { Stamped } from '../src/game/display.ts';
import { spellFx } from '../src/game/display.ts';
import { cooldownTicks } from '../src/game/schedule.ts';
import { castingGame, gameOn, monsterAt, rig, room, spell, SPELLS } from './helpers.ts';

const types = (events: Stamped[]): string[] => events.map((e) => e.type);

describe('display events in turn mode', () => {
  it('a step is the player\'s, phase 0, from and to its cells; the creatures\' steps follow in phase 1', () => {
    const game = gameOn(room(20, 5, 2, 2));
    const m = monsterAt(10, 2, { alert: true, modifier: -6 });
    game.state.monsters.push(m);
    game.takeDisplay(); // the baseline, with the creature in it
    game.act({ type: 'move', dx: 1, dy: 0 });
    const events = game.takeDisplay();
    const mine = events.find((e) => e.type === 'step' && e.who === 'player')!;
    expect(mine).toMatchObject({ phase: 0, from: { x: 2, y: 2 }, to: { x: 3, y: 2 } });
    const theirs = events.find((e) => e.type === 'step' && e.who === m.id)!;
    expect(theirs).toMatchObject({ phase: 1, from: { x: 10, y: 2 }, to: { x: m.x, y: m.y } });
    expect(game.takeDisplay()).toEqual([]); // taken once
  });

  it('nothing in the events is saved: the state is the same with or without them', () => {
    const a = gameOn(room(20, 5, 2, 2));
    const b = gameOn(room(20, 5, 2, 2));
    a.act({ type: 'move', dx: 1, dy: 0 });
    b.act({ type: 'move', dx: 1, dy: 0 });
    a.takeDisplay();
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state));
    expect(JSON.stringify(a.state)).not.toContain('"phase"');
  });

  it('a melee attack names attacker, target and outcome; a kill is a death with the creature', () => {
    const game = gameOn(room(20, 5, 2, 2), { combatDice: 6, combatMax: 6 });
    const m = monsterAt(3, 2, { alert: true });
    game.state.monsters.push(m);
    game.takeDisplay();
    rig(game, 6, 1); // the player rolls 6, the goblin 1: a hit that kills its one die
    game.act({ type: 'move', dx: 1, dy: 0 });
    const events = game.takeDisplay();
    expect(events[0]).toMatchObject({ type: 'attack', who: 'player', target: m.id, at: { x: 3, y: 2 }, ranged: false, hit: true, phase: 0 });
    const death = events.find((e) => e.type === 'death')!;
    expect(death).toMatchObject({ who: m.id, at: { x: 3, y: 2 } });
    expect(death.type === 'death' && death.creature.name).toBe('goblin');
  });

  it('a creature\'s melee, a lost die and an alert are recorded', () => {
    const game = gameOn(room(20, 5, 2, 2), { combatDice: 6, combatMax: 6 });
    const m = monsterAt(3, 2, { alert: true, modifier: 3, dice: 9, maxDice: 9 });
    game.state.monsters.push(m);
    game.takeDisplay();
    rig(game, 6, 1); // the goblin's attack: it rolls 6, the player 1
    game.act({ type: 'wait' });
    const events = game.takeDisplay();
    expect(events.find((e) => e.type === 'attack')).toMatchObject({ who: m.id, target: 'player', hit: true, phase: 1 });
    expect(events.find((e) => e.type === 'die-lost')).toMatchObject({ who: 'player' });
    const sleeper = monsterAt(6, 2);
    game.state.monsters.push(sleeper);
    game.takeDisplay();
    sleeper.awareness = 'alert';
    expect(types(game.takeDisplay())).toContain('alert');
  });

  it('a shot flies an arrow from the player to the target', () => {
    const game = gameOn(room(20, 5, 2, 2));
    const m = monsterAt(8, 2, { alert: true, dice: 5, maxDice: 5, modifier: -6 });
    game.state.monsters.push(m);
    game.takeDisplay();
    game.fire(m);
    const shot = game.takeDisplay().find((e) => e.type === 'attack')!;
    expect(shot).toMatchObject({ who: 'player', ranged: true, fx: 'arrow', from: { x: 2, y: 2 }, at: { x: 8, y: 2 } });
  });

  it('a spell that works names its effect and the cells it touches', () => {
    const game = castingGame(room(20, 9, 2, 4));
    const m = monsterAt(8, 4, { alert: true, dice: 5, maxDice: 5, modifier: -6 });
    game.state.monsters.push(m);
    game.takeDisplay();
    rig(game, 6);
    game.cast(spell('fireball'), m);
    const fire = game.takeDisplay().find((e) => e.type === 'spell')!;
    expect(fire).toMatchObject({ who: 'player', spell: 'fireball', fx: 'burst' });
    expect(fire.type === 'spell' && fire.cells.length).toBe(9);
    rig(game, 6);
    game.cast(spell('heal'));
    expect(game.takeDisplay().find((e) => e.type === 'spell')).toMatchObject({ fx: 'aura', cells: [{ x: 2, y: 4 }] });
  });

  it('each spell shows its row\'s fx, else push, aura, burst or bolt by its shape and effect', () => {
    const fx = Object.fromEntries(SPELLS.map((s) => [s.id, spellFx(s)]));
    expect(fx).toMatchObject({ blizzard: 'frost', frost_nova: 'frost', thunderclap: 'push', fireball: 'burst', arcane_bolt: 'bolt', heal: 'aura', blink: 'aura' });
  });

  it('keeps only what the player can see', () => {
    const game = gameOn(room(40, 5, 2, 2));
    const far = monsterAt(36, 2, { alert: true, modifier: -6 });
    game.state.monsters.push(far);
    game.takeDisplay();
    game.state.map.visible.fill(0);
    game.state.map.visible[2 * 40 + 2] = 1;
    far.x--;
    game.display.creaturesBegin();
    expect(game.takeDisplay()).toEqual([]);
  });
});

describe('display events in real time', () => {
  it('stamps each event with its tick, and a step with its mover\'s interval', () => {
    const game = gameOn(room(20, 5, 2, 2), {}, { time: 'real' });
    game.takeDisplay();
    game.walk(1, 0);
    const [step] = game.takeDisplay();
    expect(step).toMatchObject({ type: 'step', who: 'player', tick: 0, ticks: cooldownTicks([]) });
    const m = monsterAt(12, 2, { alert: true, modifier: -6, speed: 'fast' });
    game.state.monsters.push(m);
    game.halt();
    game.takeDisplay();
    const seen: Stamped[] = [];
    for (let t = 0; t < 20; t++) {
      game.advance(1);
      seen.push(...game.takeDisplay());
    }
    const steps = seen.filter((e) => e.type === 'step' && e.who === m.id);
    expect(steps.length).toBeGreaterThan(1);
    for (const s of steps) expect(s.ticks).toBe(5);
    expect(new Set(steps.map((s) => s.tick)).size).toBe(steps.length);
  });
});
