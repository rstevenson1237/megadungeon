import { describe, expect, it } from 'vitest';
import { TICKS_PER_ROUND } from '../src/game/game.ts';
import { MessageLog } from '../src/game/log.ts';
import { type Clocked, FAST_TICK_MS, FrameLoop, MAX_TICKS_PER_FRAME, TICK_MS } from '../src/ui/frame-loop.ts';
import type { Shell } from '../src/ui/shell.ts';
import { monsterAt, press, room, screenText, shellOn } from './helpers.ts';

// Task 5.5, the frame loop and pausing (Spec 01, Addendum B): the UI turns elapsed time into ticks, at most 4 a frame;
// P, the overlays, a hidden tab and lost focus stop the ticks, while targeting and look do not; Z fast-forwards; the
// target follows the creatures tick by tick; the log's bright window is 2 rounds. The fake clock is `Shell.advance`
// and, for the loop itself, the frame times given to `FrameLoop.frame`.

/** A real-time shell in an empty 30 x 5 room, the player on the stair at (2, 3). */
const realShell = (...args: Parameters<typeof shellOn> extends [unknown, ...infer R] ? R : never): Shell =>
  shellOn(room(30, 5, 2, 3), args[0] ?? [], args[1] ?? {}, { time: 'real', ...args[2] });

const at = (shell: Shell) => ({ ...shell.game!.state.map.player });
const logText = (shell: Shell): string[] => shell.log.lines(shell.turn).map((l) => l.text);

/** A stand-in for the shell: counts the ticks it is given. */
class FakeClock implements Clocked {
  ticking = true;
  tickMs = TICK_MS;
  ticks = 0;
  advance(ticks: number): void {
    this.ticks += ticks;
  }
}

describe('Spec 01, Addendum B: the frame loop (task 5.5)', () => {
  it('turns elapsed time into ticks of 50 ms, carrying the remainder to the next frame', () => {
    const clock = new FakeClock();
    let draws = 0;
    const loop = new FrameLoop(() => clock, () => draws++);
    expect(loop.frame(1000)).toBe(0); // the first frame only starts the count
    expect(loop.frame(1016)).toBe(0);
    expect(loop.frame(1033)).toBe(0);
    expect(loop.frame(1050)).toBe(1);
    expect(loop.frame(1125)).toBe(1); // 75 ms more: one tick, 25 ms owed
    expect(loop.frame(1150)).toBe(1);
    expect(clock.ticks).toBe(3);
    expect(draws).toBe(3); // a redraw only after a frame in which a tick ran
  });

  it('runs at most 4 ticks a frame and drops the rest, so a stalled frame slows the game rather than jumping it ahead', () => {
    const clock = new FakeClock();
    const loop = new FrameLoop(() => clock, () => undefined);
    loop.frame(0);
    expect(loop.frame(5000)).toBe(MAX_TICKS_PER_FRAME);
    expect(loop.frame(5016)).toBe(0); // nothing of the stall is caught up later
    expect(clock.ticks).toBe(4);
  });

  it('runs no tick while time is stopped, and does not count the pause once it resumes', () => {
    const clock = new FakeClock();
    let draws = 0;
    const loop = new FrameLoop(() => clock, () => draws++);
    loop.frame(0);
    loop.frame(40);
    clock.ticking = false;
    expect(loop.frame(10_000)).toBe(0);
    expect(loop.frame(20_000)).toBe(0);
    clock.ticking = true;
    expect(loop.frame(30_000)).toBe(0); // the first frame after the pause starts the count again
    expect(loop.frame(30_049)).toBe(0);
    expect(loop.frame(30_050)).toBe(1);
    expect(draws).toBe(1);
  });

  it('runs no tick with no run on screen, and turn mode draws nothing of its own', () => {
    let draws = 0;
    const none = new FrameLoop(() => null, () => draws++);
    for (let t = 0; t < 1000; t += 16) none.frame(t);
    const turn = shellOn(room(30, 5, 2, 3));
    expect(turn.ticking).toBe(false);
    const loop = new FrameLoop(() => turn, () => draws++);
    for (let t = 0; t < 1000; t += 16) loop.frame(t);
    expect(draws).toBe(0);
    expect(turn.game!.tick).toBe(0);
  });

  it('drives a real-time shell: a second of frames is 20 ticks, two rounds', () => {
    const shell = realShell();
    const loop = new FrameLoop(() => shell, () => undefined);
    for (let t = 0; t <= 1000; t += 10) loop.frame(t);
    expect(shell.game!.tick).toBe(20);
    expect(shell.game!.state.round).toBe(3);
    expect(shell.turn).toBe(3);
  });

  it('Z runs ticks of 12.5 ms, four times as fast, still at most 4 a frame', () => {
    const clock = new FakeClock();
    clock.tickMs = FAST_TICK_MS;
    const loop = new FrameLoop(() => clock, () => undefined);
    loop.frame(0);
    expect(loop.frame(50)).toBe(4);
    expect(loop.frame(100)).toBe(4);
    expect(loop.frame(200)).toBe(4);
  });
});

describe('Spec 01, Addendum B: held keys in the shell (task 5.5)', () => {
  it('holding a movement key walks one cell per cooldown, and letting it go stops the walk', () => {
    const shell = realShell();
    press(shell, 'd');
    expect(at(shell)).toEqual({ x: 3, y: 3 }); // at once
    shell.advance(9);
    expect(at(shell)).toEqual({ x: 3, y: 3 });
    shell.advance(1);
    expect(at(shell)).toEqual({ x: 4, y: 3 });
    shell.advance(10);
    expect(at(shell)).toEqual({ x: 5, y: 3 });
    shell.keyUp({ key: 'd' });
    shell.advance(30);
    expect(at(shell)).toEqual({ x: 5, y: 3 });
  });

  it('a key pressed during the cooldown is held, and only the newest is kept', () => {
    const shell = realShell();
    press(shell, 'd');
    shell.keyUp({ key: 'd' });
    press(shell, 'w');
    shell.keyUp({ key: 'w' });
    press(shell, 'a'); // replaces the step north
    shell.keyUp({ key: 'a' });
    expect(at(shell)).toEqual({ x: 3, y: 3 });
    shell.advance(10);
    expect(at(shell)).toEqual({ x: 2, y: 3 });
    shell.advance(20);
    expect(at(shell)).toEqual({ x: 2, y: 3 });
  });

  it('a key let go of another direction does not stop the walk', () => {
    const shell = realShell();
    press(shell, 'd');
    shell.keyUp({ key: 's' });
    shell.advance(10);
    expect(at(shell)).toEqual({ x: 4, y: 3 });
  });

  it('turn mode moves once per press, as ever', () => {
    const shell = shellOn(room(30, 5, 2, 3));
    press(shell, 'd');
    press(shell, 'd');
    expect(at(shell)).toEqual({ x: 4, y: 3 });
    expect(shell.game!.tick).toBe(0);
  });
});

describe('Spec 01, Addendum B: pausing (task 5.5)', () => {
  it('P pauses and resumes; while paused no tick runs, held keys are dropped and the header says Paused', () => {
    const shell = realShell();
    press(shell, 'd');
    expect(shell.ticking).toBe(true);
    press(shell, 'p');
    expect(shell.ticking).toBe(false);
    expect(shell.paused).toBe('key');
    expect(screenText(shell)[0]).toContain('Level 1 - Paused');
    shell.advance(50);
    expect(shell.game!.tick).toBe(0);
    press(shell, 'p');
    expect(shell.ticking).toBe(true);
    expect(screenText(shell)[0]).not.toContain('Paused');
    shell.advance(30);
    expect(at(shell)).toEqual({ x: 3, y: 3 }); // the held key was dropped by the pause
  });

  it('in turn mode P says there is no clock and spends nothing', () => {
    const shell = shellOn(room(30, 5, 2, 3));
    press(shell, 'p');
    expect(logText(shell)).toContain('There is no clock to pause in turn-based play.');
    expect(shell.game!.state.round).toBe(1);
    expect(screenText(shell)[0]).not.toContain('Paused');
  });

  it.each([
    ['inventory', 'i'],
    ['message history', 'm'],
    ['help', '?'],
    ['journal', 'j'],
    ['game menu', 'Escape'],
  ])('the %s overlay stops the ticks until it closes', (_name, key) => {
    const shell = realShell();
    press(shell, key);
    expect(shell.overlays.length).toBe(1);
    expect(shell.ticking).toBe(false);
    expect(shell.header).toMatch(/ - Paused$/);
    shell.advance(20);
    expect(shell.game!.tick).toBe(0);
    press(shell, 'Escape');
    expect(shell.overlays.length).toBe(0);
    shell.advance(20);
    expect(shell.game!.tick).toBe(20);
  });

  it('the spell list stops the ticks too', () => {
    const shell = realShell([], { magic: { step: 6, dice: 3, max: 3 }, spells: ['heal'] });
    press(shell, 'c');
    expect(shell.overlays.length).toBe(1);
    expect(shell.ticking).toBe(false);
  });

  it('a hidden tab or lost focus stops the ticks, and only P or a movement key resumes', () => {
    const shell = realShell();
    press(shell, 'd');
    shell.loseFocus();
    expect(shell.paused).toBe('focus');
    expect(shell.ticking).toBe(false);
    shell.advance(20);
    expect(shell.game!.tick).toBe(0);
    press(shell, 'm'); // another key acts, but does not resume
    press(shell, 'Escape');
    expect(shell.ticking).toBe(false);
    press(shell, 's'); // a movement key resumes, and does nothing more
    expect(shell.ticking).toBe(true);
    expect(at(shell)).toEqual({ x: 3, y: 3 });
    shell.advance(30);
    expect(at(shell)).toEqual({ x: 3, y: 3 }); // the held key was dropped
    shell.loseFocus();
    press(shell, 'p');
    expect(shell.ticking).toBe(true);
  });

  it('targeting and look do not stop the ticks', () => {
    const shell = realShell([monsterAt(6, 3)]);
    press(shell, 'f');
    expect(shell.targeting).not.toBeNull();
    expect(shell.ticking).toBe(true);
    press(shell, 'Escape');
    press(shell, 'l');
    expect(shell.looking).not.toBeNull();
    expect(shell.ticking).toBe(true);
    shell.advance(5);
    expect(shell.game!.tick).toBe(5);
  });

  it('the death screen stops the ticks: a dead player has no clock', () => {
    const shell = realShell();
    shell.game!.state.player.dead = true;
    expect(shell.ticking).toBe(false);
  });
});

describe('Spec 04, Addendum B: what a held command leaves for the shell (task 5.5)', () => {
  it('a held command that takes the stairs moves the run at the tick it happens, and the village has no clock', () => {
    const shell = realShell();
    press(shell, 'x'); // search: starts the cooldown
    press(shell, 'e'); // the stair the player stands on: held
    expect(shell.run!.inVillage).toBe(false);
    shell.advance(10);
    expect(shell.run!.inVillage).toBe(true);
    expect(shell.village).not.toBeNull();
    expect(shell.ticking).toBe(false);
    press(shell, 'p');
    expect(logText(shell)).toContain('There is no clock to pause in a village.');
  });

  it('an action chosen in an overlay during the cooldown is held, and the overlays close so time runs on to it', () => {
    const shell = realShell();
    press(shell, 'x');
    const pack = shell.game!.state.player.pack.length;
    press(shell, 'i');
    press(shell, 'w'); // up from the first slot wraps to the last line of the pack
    press(shell, 'Enter'); // its actions
    for (let n = 0; n < 6 && !screenText(shell).some((l) => l.includes('> Drop')); n++) press(shell, 's');
    press(shell, 'Enter');
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.held).not.toBeNull();
    expect(shell.game!.state.player.pack.length).toBe(pack);
    shell.advance(10);
    expect(shell.game!.state.player.pack.length).toBe(pack - 1);
  });
});

describe('Spec 01, Addendum B: targeting in real time (task 5.5)', () => {
  it('the selection stays on its creature while it is valid, even as the order changes', () => {
    // Within the sling's range of 6, each with a clear line of fire.
    const near = monsterAt(4, 3);
    const far = monsterAt(5, 1);
    const shell = realShell([near, far]);
    press(shell, 'f');
    press(shell, 'Tab');
    expect(shell.targeting!.selected).toBe(far);
    // The far one comes closest: it is still the one selected.
    far.x = 3;
    far.y = 2;
    shell.advance(1);
    expect(shell.targeting!.selected).toBe(far);
    expect(shell.targeting!.targets[0]).toBe(far);
  });

  it('a selected target that dies moves the selection to the nearest valid target', () => {
    const near = monsterAt(4, 3);
    const middle = monsterAt(1, 1);
    const far = monsterAt(5, 1);
    const shell = realShell([near, middle, far]);
    press(shell, 'f');
    press(shell, 'Tab');
    press(shell, 'Tab');
    expect(shell.targeting!.selected).toBe(far);
    const monsters = shell.game!.state.monsters;
    monsters.splice(monsters.indexOf(far), 1);
    shell.advance(1);
    expect(shell.targeting!.selected).toBe(near);
    expect(shell.character.target?.count).toBe(2);
  });

  it('with no valid target left targeting ends and the log says "Your target is gone."', () => {
    const goblin = monsterAt(6, 3);
    const shell = realShell([goblin]);
    press(shell, 'f');
    goblin.x = 25; // out of the sling's range
    shell.advance(1);
    expect(shell.targeting).toBeNull();
    expect(shell.character.target).toBeUndefined();
    expect(logText(shell)).toContain('Your target is gone.');
  });

  it('Enter during the cooldown is held, and resolves against the target where it stands at that tick', () => {
    const goblin = monsterAt(6, 3, { dice: 3 });
    const shell = realShell([goblin]);
    press(shell, 'x'); // search: starts the cooldown
    press(shell, 'f');
    press(shell, 'Enter');
    expect(shell.targeting).toBeNull();
    const stones = shell.game!.state.player.pack.length;
    expect(shell.game!.held).not.toBeNull();
    // Before the cooldown ends the goblin goes out of range: the held shot finds no target and spends nothing.
    goblin.x = 25;
    shell.advance(10);
    expect(logText(shell)).toContain('Your target is gone.');
    expect(shell.game!.state.player.pack.length).toBe(stones);
    expect(shell.game!.ready).toBe(true);
  });

  it('look keeps its cursor on its cell as creatures move, and describes the cell as it is now', () => {
    const goblin = monsterAt(6, 3);
    const shell = realShell([goblin]);
    press(shell, 'l');
    press(shell, 'Tab');
    expect(shell.looking!.at).toEqual({ x: 6, y: 3 });
    const before = shell.lookText();
    goblin.x = 7;
    shell.advance(1);
    expect(shell.looking!.at).toEqual({ x: 6, y: 3 });
    expect(shell.lookText()).not.toBe(before);
  });
});

describe('Spec 01, Addendum B: Z in real time (task 5.5)', () => {
  const tired = { combatDice: 1, combatMax: 2 };

  it('runs four times as fast until a Combat die returns, with no action spent', () => {
    const shell = realShell([], tired);
    press(shell, 'z');
    expect(shell.fastForwarding).toBe(true);
    expect(shell.tickMs).toBe(FAST_TICK_MS);
    for (let n = 0; n < 200 && shell.fastForwarding; n++) shell.advance(4);
    expect(shell.fastForwarding).toBe(false);
    expect(shell.game!.state.player.pools.combat.dice).toBe(2);
    expect(shell.tickMs).toBe(TICK_MS);
    // It took the waiting rounds, counted at round boundaries: it stopped at the boundary the die came back.
    expect(shell.game!.tick % TICKS_PER_ROUND).toBe(0);
    expect(logText(shell)).toContain('You feel your strength return.');
  });

  it('any key stops it, and does nothing more', () => {
    const shell = realShell([], tired);
    press(shell, 'z');
    shell.advance(4);
    press(shell, 'd');
    expect(shell.fastForwarding).toBe(false);
    expect(at(shell)).toEqual({ x: 2, y: 3 });
  });

  it('stops when a creature not in view at the start comes into view', () => {
    const shell = realShell([], tired);
    press(shell, 'z');
    shell.advance(2);
    shell.game!.state.monsters.push(monsterAt(8, 3)); // arrives in view
    shell.advance(4);
    expect(shell.fastForwarding).toBe(false);
    expect(shell.game!.tick).toBe(3);
    expect(logText(shell)).toContain('You stop waiting: the goblin comes into view.');
  });

  it('has the same refusals as in turn mode', () => {
    const full = realShell();
    press(full, 'z');
    expect(full.fastForwarding).toBe(false);
    expect(logText(full)).toContain('You are already at full strength.');
  });
});

describe('Spec 01, Addendum B: the message log (task 5.5)', () => {
  it('in real time, messages less than 2 rounds old draw bright', () => {
    const log = new MessageLog();
    log.add({ kind: 'system', text: 'three rounds ago' }, 7);
    log.add({ kind: 'system', text: 'last round' }, 9);
    log.add({ kind: 'system', text: 'this round' }, 10);
    expect(log.lines(10, 2).map((l) => l.current)).toEqual([false, true, true]);
    expect(log.lines(10).map((l) => l.current)).toEqual([false, false, true]); // turn mode: this round only
  });

  it('a real-time shell draws with the 2-round window, a turn-mode one with its round only', () => {
    const shell = realShell();
    expect((shell as unknown as { brightRounds: number }).brightRounds).toBe(2);
    expect((shellOn(room(30, 5, 2, 3)) as unknown as { brightRounds: number }).brightRounds).toBe(1);
  });
});
