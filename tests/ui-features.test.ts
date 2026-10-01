import { describe, expect, it } from 'vitest';
import type { Feature, Level, LoreMark } from '../src/rules/world/level.ts';
import { journalLines } from '../src/ui/features.ts';
import { press, room, screenText, shellOn, withThings } from './helpers.ts';

const shown = (shell: ReturnType<typeof shellOn>, s: string): boolean => screenText(shell).some((l) => l.includes(s));
const bare = { pack: [], equipment: {}, coins: 100, combatDice: 4, combatMax: 4, magic: { step: 6 as const, dice: 2, max: 2 } };

/** A shell on a room with the given things, the player at (2,3) beside whatever is at (3,3). */
function on(things: { features?: Feature[]; lore?: LoreMark[] }) {
  const level: Level = { ...withThings(room(12, 5, 1, 1), things), depth: 3 };
  const shell = shellOn(level, [], bare);
  shell.game!.state.map.player = { x: 2, y: 3 };
  shell.game!.refreshSight();
  return shell;
}

const chest: Feature = { type: 'container', kind: 'chest', x: 3, y: 3, contents: [{ kind: 'coins', amount: 50 }, { kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 }] };
const altar: Feature = { type: 'fixture', kind: 'altar', x: 3, y: 3, god: { id: 'god_stub_01', name: 'the Pale Lantern' } };

describe('Spec 01 and 06: container, altar, sign and journal screens', () => {
  it('E at a chest opens the pick-up list; Enter takes the line, Down and Enter takes the rest; Esc closes', () => {
    const shell = on({ features: [chest] });
    press(shell, 'e');
    expect(shell.overlays).toHaveLength(1);
    expect(shown(shell, 'Chest')).toBe(true);
    expect(shown(shell, '50 gp')).toBe(true);
    expect(shown(shell, 'ruby')).toBe(true);
    expect(shown(shell, 'Take all')).toBe(true);
    press(shell, 'Enter');
    expect(shell.game!.state.player.coins).toBe(150);
    expect(shown(shell, 'ruby')).toBe(true);
    press(shell, 'Enter');
    expect(shell.game!.state.player.pack.map((i) => i.kind)).toEqual(['gem']);
    expect(shell.overlays).toHaveLength(0);
  });

  it('Esc closes the list and leaves the contents', () => {
    const shell = on({ features: [chest] });
    press(shell, 'e');
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    press(shell, 'e');
    expect(shown(shell, 'ruby')).toBe(true);
  });

  it('E at an altar asks for an offering: the gold it asks, each pack item, or leave', () => {
    const shell = on({ features: [altar] });
    press(shell, 'e');
    expect(shown(shell, 'Altar')).toBe(true);
    expect(shown(shell, 'Offer 30 gp')).toBe(true);
    expect(shown(shell, 'Leave')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.state.player.coins).toBe(100);
  });

  it('choosing the gold offering pays it and uses the altar up', () => {
    const shell = on({ features: [altar] });
    press(shell, 'e');
    press(shell, 'Enter');
    expect(shell.game!.state.player.coins).toBe(70);
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.state.used.features[0]!.done).toBe(true);
  });

  it('E at a sign shows its text in a window; the journal (J) then lists it under its level', () => {
    const sign: LoreMark = { kind: 'sign', id: 'sign_stub_01', text: 'Beware the third stair.', x: 3, y: 3 };
    const shell = on({ lore: [sign] });
    press(shell, 'e');
    expect(shown(shell, 'Sign')).toBe(true);
    expect(shown(shell, 'Beware the third stair.')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    press(shell, 'j');
    expect(shown(shell, 'Journal')).toBe(true);
    expect(shown(shell, 'Level 3')).toBe(true);
    expect(shown(shell, 'Sign: Beware the third stair.')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
  });

  it('an empty journal says so', () => {
    const shell = on({});
    press(shell, 'j');
    expect(shown(shell, 'Nothing read yet')).toBe(true);
  });

  it('the journal lines run shallowest level first, with long entries wrapped and indented', () => {
    const lines = journalLines(
      [
        { depth: 5, kind: 'book', id: 'b', text: 'word '.repeat(30).trim() },
        { depth: 0, kind: 'rumour', id: 'r', text: 'A short one.' },
      ],
      40,
    );
    expect(lines[0]).toEqual({ text: 'Surface', header: true });
    expect(lines[1]!.text).toBe('Rumour: A short one.');
    expect(lines[2]).toEqual({ text: 'Level 5', header: true });
    expect(lines.slice(3).length).toBeGreaterThan(1);
    expect(lines[4]!.text.startsWith('  ')).toBe(true);
  });
});
