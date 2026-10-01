import { describe, expect, it } from 'vitest';
import type { Npc } from '../src/rules/world/level.ts';
import { Grid, COLS } from '../src/ui/grid.ts';
import { NPC_LOOK } from '../src/ui/palette.ts';
import { press, room, screenText, shellOn, withThings } from './helpers.ts';

const shown = (shell: ReturnType<typeof shellOn>, s: string): boolean => screenText(shell).some((l) => l.includes(s));
const logText = (shell: ReturnType<typeof shellOn>): string => shell.log.lines(shell.turn).map((l) => l.text).join(' | ');
const trader: Npc = { kind: 'trader', name: 'Odo', x: 3, y: 3 };
const hermit: Npc = { kind: 'hermit', name: 'Sela', x: 5, y: 3 };
const captive: Npc = { kind: 'captive', name: 'Edda', x: 7, y: 3 };

function on(...npcs: Npc[]) {
  return at(2, ...npcs);
}

/** A level with these people, the player standing at (x, 3). */
function at(x: number, ...npcs: Npc[]) {
  const shell = shellOn({ ...withThings(room(12, 5, 1, 1), { npcs }), depth: 14 }, [], { coins: 800, pack: [], equipment: {}, combatDice: 1, combatMax: 3 });
  shell.game!.state.map.player = { x, y: 3 };
  shell.game!.refreshSight();
  return shell;
}

describe('Spec 01 and 07: talking to people in the dungeon', () => {
  it('people are drawn as @ coloured by role, and a freed captive disappears', () => {
    const shell = on(trader, hermit, captive);
    const grid = new Grid();
    shell.draw(grid);
    const found = new Map<number, number>();
    for (let i = 0; i < grid.glyph.length; i++) if (grid.glyph[i] === 64 && grid.fg[i] !== 0xffffff) found.set(grid.fg[i]!, (found.get(grid.fg[i]!) ?? 0) + 1);
    expect([...found.keys()].sort()).toEqual([NPC_LOOK.trader!.colour, NPC_LOOK.hermit!.colour, NPC_LOOK.captive!.colour].sort());
    expect(COLS).toBe(100);
  });

  it('E at a trader opens the stock with prices from carried coins; Enter buys', () => {
    const shell = on(trader);
    press(shell, 'e');
    expect(shell.overlays).toHaveLength(1);
    expect(shown(shell, 'Odo, trader')).toBe(true);
    expect(shown(shell, 'You carry 800 gp. Traders sell and never buy.')).toBe(true);
    press(shell, 'Enter');
    expect(logText(shell)).toContain('You buy');
    expect(shell.game!.state.player.coins).toBeLessThan(800);
    expect(shell.character.carried).toBeLessThan(800);
  });

  it('E at a hermit lists four services with prices, and one used is marked done', () => {
    const shell = at(4, hermit);
    press(shell, 'e');
    for (const label of ['Identify one item', 'Restore one Combat die', 'Lift a curse', 'Hear a rumour of nearby levels']) expect(shown(shell, label), label).toBe(true);
    press(shell, 's');
    press(shell, 'Enter');
    expect(shell.game!.state.player.combatDice).toBe(2);
    expect(shown(shell, 'Restore one Combat die (done)')).toBe(true);
  });

  it('E at a captive offers to free them, which takes a round, and they follow', () => {
    const shell = on({ ...captive, x: 3 });
    press(shell, 'e');
    expect(shown(shell, 'Cut Edda free')).toBe(true);
    const round = shell.game!.state.round;
    press(shell, 'Enter');
    expect(shell.game!.state.round).toBe(round + 1);
    expect(shell.game!.state.player.town.escorts).toHaveLength(1);
    expect(shell.overlays).toHaveLength(0);
    expect(logText(shell)).toContain('They will follow you');
    const grid = new Grid();
    shell.draw(grid);
    expect([...grid.fg].filter((c, i) => grid.glyph[i] === 64 && c === NPC_LOOK.captive!.colour)).toHaveLength(0);
  });
});
