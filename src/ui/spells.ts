// The spell list overlay (Spec 01, "Overlays and screens"): known spells with their shape and reach, and the
// Magic dice available. Choosing one starts the cast (Spec 04): the shell resolves a self spell at once and
// asks for a target or a cell otherwise.

import type { Spell } from '../core/schemas.ts';
import type { Pool } from '../rules/character/dice.ts';
import { reachOf } from '../rules/magic/spells.ts';
import { Menu, type OverlayResult } from './overlay.ts';

/** "Arcane Bolt   target  8": the name, then the shape, then the reach in cells (blank for a plain self spell). */
export function spellLabel(spell: Spell, width = 14): string {
  const reach = reachOf(spell);
  const shape = spell.centred ? 'around' : spell.shape;
  return `${spell.name.padEnd(width)}${shape.padEnd(8)}${reach > 0 ? String(reach) : ''}`;
}

/** The menu of known spells. `choose` is called with the spell picked, and the overlay closes. */
export function spellMenu(spells: readonly Spell[], magic: Pool, choose: (spell: Spell) => void): Menu {
  const width = Math.max(10, ...spells.map((s) => s.name.length)) + 2;
  return new Menu(
    'Spells',
    spells.map((spell) => ({
      label: spellLabel(spell, width),
      choose: (): OverlayResult => (choose(spell), { close: true }),
    })),
    `Magic d${magic.step}: ${magic.dice} of ${magic.max} dice. Enter casts, Esc closes.`,
  );
}
