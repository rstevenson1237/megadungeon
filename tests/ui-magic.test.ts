import { describe, expect, it } from 'vitest';
import { applyStatus } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { cameraOrigin } from '../src/ui/camera.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { caster, monsterAt, press, rig, room, screenText, shellOn } from './helpers.ts';

const harmless = { modifier: -6, dice: 30, maxDice: 30 };
const shown = (shell: ReturnType<typeof shellOn>, s: string): boolean => screenText(shell).some((l) => l.includes(s));
const lastLog = (shell: ReturnType<typeof shellOn>): string[] => shell.log.lines(shell.turn).map((l) => l.text);

describe('Spec 01 and 04: casting from the keyboard', () => {
  it('C with no known spell says so and spends no round', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: [] }));
    press(shell, 'c');
    expect(shell.overlays).toHaveLength(0);
    expect(lastLog(shell)).toContain('You know no spells.');
    expect(shell.game!.state.round).toBe(1);
  });

  it('C in a village has nothing to cast at', () => {
    const shell = shellOn(room(20, 5, 2, 3));
    shell.setRun(Object.assign(shell.run!, { game: null, depth: 0 }));
    press(shell, 'c');
    expect(lastLog(shell).some((l) => l.startsWith('There is nothing to cast'))).toBe(true);
  });

  it('opens the spell list with each spell\'s shape and reach and the Magic dice available, and Esc closes it for free', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['heal', 'arcane_bolt', 'fireball', 'thunderclap'] }));
    press(shell, 'c');
    expect(shell.overlays).toHaveLength(1);
    expect(shown(shell, 'Spells')).toBe(true);
    expect(shown(shell, 'Magic d6: 3 of 3 dice')).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Heal') && l.includes('self'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Arcane Bolt') && l.includes('target') && l.includes('8'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Fireball') && l.includes('area') && l.includes('8'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Thunderclap') && l.includes('around') && l.includes('1'))).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.state.round).toBe(1);
  });

  it('a self spell resolves on choosing it: one round, one die, the pane follows', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['heal'], combatDice: 1, combatMax: 3 }));
    rig(shell.game!, 3);
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.state.round).toBe(2);
    expect(shell.game!.state.player.pools.combat.dice).toBe(2);
    expect(shell.character.stats[0]).toMatchObject({ name: 'Combat', current: 2, max: 3 });
    expect(lastLog(shell)).toContain('You cast Heal.');
  });

  it('a targeted spell starts on the closest target, Tab cycles, Esc cancels with no round spent, Enter casts', () => {
    const near = monsterAt(5, 3, { alert: true, ...harmless });
    const far = monsterAt(9, 3, { alert: true, ...harmless });
    const shell = shellOn(room(20, 5, 2, 3), [near, far], caster({ spells: ['arcane_bolt'] }));
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.targeting!.selected).toBe(near);
    expect(shell.character.target).toMatchObject({ distance: 3, index: 1, count: 1 }); // `far` is behind `near`
    press(shell, 'Escape');
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.round).toBe(1);
    expect(shell.casting).toBeNull();
    press(shell, 'c');
    press(shell, 'Enter');
    rig(shell.game!, 6);
    press(shell, 'Enter');
    expect(near.dice).toBe(29);
    expect(shell.game!.state.round).toBe(2);
    expect(shell.targeting).toBeNull();
    expect(shell.character.target).toBeUndefined();
  });

  it('Tab cycles through the creatures a spell can reach, wrapping', () => {
    const a = monsterAt(5, 2, { alert: true, ...harmless });
    const b = monsterAt(7, 4, { alert: true, ...harmless });
    const shell = shellOn(room(20, 5, 2, 3), [a, b], caster({ spells: ['hold'] }));
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.targeting!.selected).toBe(a);
    press(shell, 'Tab');
    expect(shell.targeting!.selected).toBe(b);
    press(shell, 'Tab');
    expect(shell.targeting!.selected).toBe(a);
    press(shell, 'Tab', true);
    expect(shell.targeting!.selected).toBe(b);
  });

  it('with no creature in reach the log says so and no round passes', () => {
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(19, 3, { alert: true })], caster({ spells: ['arcane_bolt'] }));
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.targeting).toBeNull();
    expect(lastLog(shell)).toContain('There is no valid target.');
    expect(shell.game!.state.round).toBe(1);
  });

  it('Sleep cannot be aimed at a creature that is already asleep', () => {
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(5, 3, { awareness: 'asleep', ...harmless })], caster({ spells: ['sleep'] }));
    press(shell, 'c');
    press(shell, 'Enter');
    expect(lastLog(shell)).toContain('There is no valid target.');
  });

  it('an area spell previews its whole footprint, marks the creatures in it, and warns when the caster is inside', () => {
    const centre = monsterAt(8, 3, { alert: true, ...harmless });
    const beside = monsterAt(9, 4, { alert: true, ...harmless });
    const shell = shellOn(room(20, 5, 2, 3), [centre, beside], caster({ spells: ['fireball'] }));
    press(shell, 'c');
    press(shell, 'Enter');
    const t = shell.targeting!;
    expect(t.footprint()).toHaveLength(9);
    expect(t.marked()).toEqual([centre, beside]);
    expect(t.includesPlayer()).toBe(false);
    press(shell, 'Escape');

    const close = monsterAt(3, 3, { alert: true, ...harmless });
    const shell2 = shellOn(room(20, 5, 2, 3), [close], caster({ spells: ['fireball'] }));
    press(shell2, 'c');
    press(shell2, 'Enter');
    expect(shell2.targeting!.includesPlayer()).toBe(true);
  });

  it('a spell around the caster resolves on choosing even with nothing near', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['thunderclap'] }));
    rig(shell.game!, 6);
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.round).toBe(2);
  });

  describe('Blink asks for a cell', () => {
    it('a cursor starts on the caster; W A S D move it; Enter on a valid cell blinks there', () => {
      const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['blink'] }));
      rig(shell.game!, 6);
      press(shell, 'c');
      press(shell, 'Enter');
      const cursor = shell.cursor!;
      expect(cursor.at).toEqual({ x: 2, y: 3 });
      expect(cursor.ok).toBe(false); // the caster's own cell
      for (let i = 0; i < 4; i++) press(shell, 'd');
      expect(cursor.at).toEqual({ x: 6, y: 3 });
      expect(cursor.ok).toBe(true);
      press(shell, 'Enter');
      expect(shell.game!.state.map.player).toEqual({ x: 6, y: 3 });
      expect(shell.cursor).toBeNull();
      expect(shell.game!.state.round).toBe(2);
    });

    it('Enter on an invalid cell says so and keeps the cursor; Esc cancels with no turn spent', () => {
      const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['blink'] }));
      press(shell, 'c');
      press(shell, 'Enter');
      press(shell, 'Enter');
      expect(lastLog(shell)).toContain('You cannot blink there.');
      expect(shell.cursor).not.toBeNull();
      press(shell, 'Escape');
      expect(shell.cursor).toBeNull();
      expect(shell.game!.state.round).toBe(1);
      expect(shell.game!.state.map.player).toEqual({ x: 2, y: 3 });
    });

    it('the cursor stays on the map', () => {
      const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['blink'] }));
      press(shell, 'c');
      press(shell, 'Enter');
      for (let i = 0; i < 10; i++) press(shell, 'a');
      for (let i = 0; i < 10; i++) press(shell, 'w');
      expect(shell.cursor!.at).toEqual({ x: 0, y: 0 });
    });
  });
});

describe('Spec 01 and 04: the Status block and the Magic pool', () => {
  it('shows each active effect with its rounds left, then a Shield, and follows the Magic dice', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['haste', 'shield'], magic: { step: 6, dice: 3, max: 3 } }));
    rig(shell.game!, 6);
    press(shell, 'c');
    press(shell, 'Enter'); // Haste
    expect(shell.character.status).toEqual(['Hasted 3']);
    press(shell, 'c');
    press(shell, 's');
    press(shell, 'Enter'); // Shield
    // The Shield was the second action of the hasted round, so a round has passed: one less on each.
    expect(shell.character.status).toEqual(['Hasted 2', 'Shield 9']);
    expect(shown(shell, 'Hasted 2')).toBe(true);
    expect(shown(shell, 'Shield 9')).toBe(true);
  });

  it('lists poison, a curse and slowness while they last', () => {
    const shell = shellOn(room(20, 5, 2, 3));
    applyStatus(shell.game!.state.player.statuses, 'poisoned', null);
    applyStatus(shell.game!.state.player.statuses, 'slowed', 4);
    press(shell, ' ');
    expect(shell.character.status).toEqual(['Poisoned', 'Slowed 2']);
  });

  it('the Magic row drops when a die is spent', () => {
    const shell = shellOn(room(20, 5, 2, 3), [], caster({ spells: ['heal'], magic: { step: 6, dice: 3, max: 3 } }));
    shell.character.stats.push({ name: 'Magic', step: 6, current: 3, max: 3 });
    rig(shell.game!, 3);
    press(shell, 'c');
    press(shell, 'Enter');
    expect(shell.character.stats.find((s) => s.name === 'Magic')).toMatchObject({ current: 2, max: 3 });
  });
});

describe('Spec 04: what Detect reveals shows on the map', () => {
  it('draws a found trap as ^ and a found secret door as a door', () => {
    const base = room(12, 5, 2, 3);
    const level: Level = {
      ...base,
      traps: [{ x: 5, y: 3, id: 'trap_dart' }],
      doors: [{ x: 3, y: 0, kind: 'secret' }],
    };
    const shell = shellOn(level, [], caster({ spells: ['detect'] }));
    // The level is smaller than the window, so the camera centres it: find where level cell (x, y) lands.
    const cellAt = (x: number, y: number): string => {
      const view = inner(MAIN_PANE);
      const origin = cameraOrigin(level.width, level.height, shell.game!.state.map.player, view.w, view.h);
      return screenText(shell)[view.y + y - origin.y]![view.x + x - origin.x]!;
    };
    expect(cellAt(5, 3)).not.toBe('^');
    expect(cellAt(3, 0)).toBe('#');
    rig(shell.game!, 6);
    press(shell, 'c');
    press(shell, 'Enter');
    expect(cellAt(5, 3)).toBe('^');
    expect(cellAt(3, 0)).toBe('+');
  });
});
