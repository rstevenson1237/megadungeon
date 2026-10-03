import { describe, expect, it } from 'vitest';
import { derivedFor, isActive, activeAbilities } from '../src/game/abilities.ts';
import type { PlayerState } from '../src/game/game.ts';
import { classById } from '../src/rules/character/classes.ts';
import { CONTENT, testPlayer } from './helpers.ts';
import contentBundle from '../src/generated/content-bundle.json';
import type { ContentBundle } from '../src/core/schemas.ts';

// Task 4.4: the launch pools. Every draw must change something, whatever else the character has drawn: a pool never
// holds two entries where one makes the other do nothing (two ways to wait faster, two advantages on the same roll).
const bundle = contentBundle as unknown as ContentBundle;
const classes = (bundle.tables['classes'] as { id: string }[]).map((c) => c.id);

describe('minor ability pools', () => {
  it.each(classes)('%s: 12 entries, and each does something with all the others drawn', (id) => {
    const pool = classById(bundle, id).minorAbilities;
    expect(pool).toHaveLength(12);
    expect(new Set(pool.map((a) => a.id)).size).toBe(12);
    const minors = CONTENT.minors;
    const player = (ids: string[]): PlayerState => ({ ...testPlayer({}), minorAbilities: ids });
    const all = pool.map((a) => a.id);
    for (const a of pool) {
      const spec = minors.get(a.id)!;
      // Weapon Master binds to a wielded weapon, which this player has none of; its own test covers it.
      if (a.id === 'weapon_master') continue;
      if (isActive(spec)) {
        expect(activeAbilities(player(all), minors), a.id).toContain(a.id);
        continue;
      }
      const without = all.filter((x) => x !== a.id);
      expect(JSON.stringify(derivedFor(player(all), minors)), `${id}: ${a.id} is redundant`).not.toBe(JSON.stringify(derivedFor(player(without), minors)));
    }
  });
});
