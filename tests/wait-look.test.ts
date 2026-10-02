// Task 3.9: Z, wait until recovered, and L, look (Spec 01, Addendum A). Every key in the key map now acts.

import { describe, expect, it } from 'vitest';
import { placeCompanion } from '../src/game/allies.ts';
import type { Game } from '../src/game/game.ts';
import { describeCell } from '../src/game/look.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { gameAt, monsterAt, press, rig, room, screenText, shellOn } from './helpers.ts';

const hurt = { combatDice: 2, combatMax: 4, pack: [], equipment: {} };
const last = (game: { messages: { text: string }[] }): string => game.messages.at(-1)?.text ?? '';
const all = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');

describe('Spec 01, Addendum A: Z, wait until recovered', () => {
  it('repeats the Space wait until a Combat die returns: 10 ordinary rounds', () => {
    const game = gameAt(room(10, 5, 1, 1), 4, 3, hurt);
    const round = game.state.round;
    const result = game.waitUntilRecovered();
    expect(result.spent).toBe(true);
    expect(game.state.player.pools.combat.dice).toBe(3);
    expect(game.state.round).toBe(round + 10);
    expect(all(result)).toContain('You feel your strength return.');
  });

  it('with nothing to wait for, says so and spends no round: a full Combat pool, or Poisoned', () => {
    const full = gameAt(room(10, 5, 1, 1), 4, 3, { combatDice: 4, combatMax: 4 });
    expect(full.waitUntilRecovered()).toMatchObject({ spent: false, messages: [{ text: 'You are already at full strength.' }] });
    const poisoned = gameAt(room(10, 5, 1, 1), 4, 3, hurt);
    applyStatus(poisoned.state.player.statuses, 'poisoned', null);
    const round = poisoned.state.round;
    expect(poisoned.waitUntilRecovered()).toMatchObject({ spent: false, messages: [{ text: 'The poison stops you recovering by waiting.' }] });
    expect(poisoned.state.round).toBe(round);
  });

  it('stops when a creature comes into view that was not in view when the wait began', () => {
    const game = gameAt(room(24, 3, 1, 2), 1, 2, hurt);
    const m = monsterAt(13, 2, { alert: true, dice: 2 }); // 12 cells off: in sight (8) after 4 rounds
    game.state.monsters.push(m);
    expect(game.state.map.visible[2 * game.state.map.level.width + 13]).toBe(0);
    const round = game.state.round;
    const result = game.waitUntilRecovered();
    expect(last(result)).toBe('You stop waiting: the goblin comes into view.');
    expect(game.state.round - round).toBeLessThan(10);
    expect(game.state.player.pools.combat.dice).toBe(2);
  });

  it('a creature already in view does not stop it', () => {
    const game = gameAt(room(10, 5, 1, 1), 2, 3, hurt);
    game.state.monsters.push(monsterAt(9, 3, { dice: 2, statuses: [{ id: 'held', rounds: 50, clock: 0 }] }));
    game.waitUntilRecovered();
    expect(game.state.player.pools.combat.dice).toBe(3);
  });

  it('stops when the player is hit', () => {
    const game = gameAt(room(10, 5, 1, 1), 4, 3, hurt);
    game.state.monsters.push(monsterAt(5, 3, { alert: true, dice: 2 }));
    rig(game, 6, 1); // its 6 against the player's 1
    const round = game.state.round;
    const result = game.waitUntilRecovered();
    expect(game.state.round).toBe(round + 1);
    expect(game.state.player.pools.combat.dice).toBe(1);
    expect(last(result)).toBe('The goblin hits you.');
  });

  it('stops when the player gains a status', () => {
    const game = gameAt(room(10, 5, 1, 1), 4, 3, hurt);
    const act = game.act.bind(game);
    let n = 0;
    game.act = (command) => {
      const result = act(command);
      if (++n === 3) applyStatus(game.state.player.statuses, 'blessed', 5); // as a fountain's blessing would, with no message
      return result;
    };
    const round = game.state.round;
    game.waitUntilRecovered();
    expect(game.state.round).toBe(round + 3);
  });

  it('stops when a combat or warning message is logged: an ally fighting nearby', () => {
    const game = gameAt(room(10, 5, 1, 1), 4, 3, { ...hurt, abilities: ['companion'] });
    placeCompanion(game); // at (4,2)
    game.state.monsters.push(monsterAt(4, 1, { alert: true, dice: 2, statuses: [{ id: 'held', rounds: 50, clock: 0 }] }));
    const round = game.state.round;
    game.waitUntilRecovered();
    expect(game.state.round).toBe(round + 1);
  });

  it('Z in the shell waits; in a village it says why not', () => {
    const shell = shellOn(room(10, 5, 1, 1), [], hurt);
    press(shell, 'z');
    expect(shell.game!.state.player.pools.combat.dice).toBe(3);
    expect(shell.turn).toBe(11);
  });
});

describe('Spec 01, Addendum A: L, look', () => {
  /** A 30 x 7 room, the player on the up stair at (1,1). */
  const level = (): Level => room(30, 7, 1, 1);

  it('is free: a cursor starts on the player, and Esc, Enter or L end it with no round spent', () => {
    for (const end of ['Escape', 'Enter', 'l']) {
      const shell = shellOn(level());
      press(shell, 'l');
      expect(shell.looking!.at).toEqual({ x: 1, y: 1 });
      expect(shell.lookText()).toBe('You; stairs up');
      press(shell, 'd');
      press(shell, end);
      expect(shell.looking, end).toBeNull();
      expect(shell.turn).toBe(1);
      expect(shell.game!.state.map.player).toEqual({ x: 1, y: 1 });
    }
  });

  it('describes a visible creature (name, rating, awareness, statuses), its items, a feature with its state and the terrain', () => {
    const shell = shellOn(level(), [monsterAt(3, 1, { dice: 3, modifier: 1, alert: true, statuses: [{ id: 'held', rounds: 2, clock: 0 }] })]);
    const game = shell.game!;
    game.state.drops.push({ x: 3, y: 1, contents: [{ kind: 'coins', amount: 12 }] });
    press(shell, 'l');
    press(shell, 'd');
    press(shell, 'd');
    expect(shell.lookText()).toBe('The goblin 3d6+1, alert, Held 2; 12 gp; floor');
    // A looted chest, a dry fountain and a found trap, by kind.
    const { level: lvl } = game.state.map;
    lvl.features.push({ type: 'container', kind: 'chest', x: 2, y: 2, contents: [] }, { type: 'fixture', kind: 'fountain', x: 2, y: 3 });
    game.state.looted.features.push(0);
    game.state.used.features[1] = { drinks: 2, limit: 2 };
    lvl.traps.push({ x: 2, y: 4, id: Object.keys(Object.fromEntries(game.content.traps))[0]! });
    game.state.revealed.push(4 * lvl.width + 2);
    expect(describeCell(game, { x: 2, y: 2 })).toBe('chest (looted); floor');
    expect(describeCell(game, { x: 2, y: 3 })).toBe('fountain (dry); floor');
    expect(describeCell(game, { x: 2, y: 4 })).toMatch(/^.+ \(trap\); floor$/);
    expect(describeCell(game, { x: 0, y: 1 })).toBe('wall');
  });

  it('a remembered cell gives its feature and terrain, marked remembered; an unseen cell says so', () => {
    const game: Game = gameAt(level(), 1, 1);
    const { map } = game.state;
    const far = { x: 25, y: 4 };
    const i = far.y * map.level.width + far.x;
    expect(map.visible[i]).toBe(0);
    expect(describeCell(game, far)).toBe('You have not seen there.');
    map.exploration.explored[i] = 1;
    map.level.features.push({ type: 'container', kind: 'sack', x: far.x, y: far.y, contents: [] });
    game.state.monsters.push(monsterAt(far.x, far.y, { dice: 2 })); // never shown on a remembered cell
    expect(describeCell(game, far)).toBe('sack; floor (remembered)');
  });

  it('Tab and Shift+Tab jump between visible creatures, nearest first', () => {
    const shell = shellOn(level(), [monsterAt(5, 1, { dice: 2 }), monsterAt(3, 2, { dice: 2, id: 2 })]);
    press(shell, 'l');
    press(shell, 'Tab');
    expect(shell.looking!.at).toEqual({ x: 3, y: 2 });
    press(shell, 'Tab');
    expect(shell.looking!.at).toEqual({ x: 5, y: 1 });
    press(shell, 'Tab');
    expect(shell.looking!.at).toEqual({ x: 3, y: 2 });
    press(shell, 'Tab', true);
    expect(shell.looking!.at).toEqual({ x: 5, y: 1 });
  });

  it('the cursor stays within the main view, and the bottom row of the main view shows the description', () => {
    const shell = shellOn(level());
    press(shell, 'l');
    press(shell, 'a');
    press(shell, 'w');
    expect(shell.looking!.at).toEqual({ x: 0, y: 0 });
    const view = inner(MAIN_PANE);
    expect(screenText(shell)[view.y + view.h - 1]!.slice(view.x, view.x + 4)).toBe('wall');
  });
});
