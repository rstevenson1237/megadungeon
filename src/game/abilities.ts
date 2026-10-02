// Minor abilities and lasting buffs in play (Spec 03, Addendum A; Spec 08, Addendum A): the effects of what the
// character has drawn, read from the content table by id, and the active ones used as skill uses. Nothing derived
// from them is stored: the pack's size, the wait rounds and the sell bonus are worked out when they are needed.

import type { EffectSpec } from '../core/catalog.ts';
import type { LogMessage } from '../core/log.ts';
import type { Rng } from '../core/rng.ts';
import type { Character } from '../rules/character/character.ts';
import { type RollResult, rollPool } from '../rules/character/dice.ts';
import { type Derived, derive } from '../rules/items/gear.ts';
import { packCapacity } from '../rules/items/inventory.ts';
import { liftCurse } from '../rules/items/magic.ts';
import { EQUIP_SLOTS, type Equipment, type Item } from '../rules/items/types.ts';
import { hasStatus, removeStatus } from '../rules/magic/status.ts';
import type { PlayerState } from './game.ts';

/** Each minor ability's effect, by the ability's id: built from the content (Spec 08), so never saved. */
export type MinorEffects = ReadonlyMap<string, EffectSpec>;

/** A timed ability running on the player (Spec 03, Addendum A, "Timed abilities"), shown in the Status block. */
export interface TimedAbility {
  /** The ability's id and name, for the Status block. */
  id: string;
  name: string;
  /** What it does while it runs, with its numbers: copied from the row when it is used. */
  effect: EffectSpec;
  rounds: number;
}

/** The weapon base a bound effect such as Weapon Master's names: the one wielded, or none when bare-handed. */
const wieldedBase = (equipment: Equipment): string | null => (equipment.main?.kind === 'weapon' ? equipment.main.id : null);

/**
 * The effects of the abilities drawn (once per draw, so stackable ones add up) and of the lasting buffs. A bound
 * effect counts only while its weapon base is wielded (Spec 03, Addendum A, Weapon Master).
 */
export function abilityEffects(player: PlayerState, minors: MinorEffects): EffectSpec[] {
  const out: EffectSpec[] = [];
  for (const id of player.minorAbilities) {
    const spec = minors.get(id);
    if (!spec) continue;
    if (spec.effect === 'weapon_melee') {
      const bound = player.bindings?.[id];
      if (!bound || wieldedBase(player.equipment) !== bound) continue;
    }
    out.push(spec);
  }
  return [...out, ...player.buffs];
}

/** What the player's equipment, abilities and lasting buffs give (Spec 05; Spec 08, Addendum A). */
export const derivedFor = (player: PlayerState, minors: MinorEffects): Derived => derive(player.equipment, player.stealth, abilityEffects(player, minors));

/** The pack's size: 12 slots and whatever `pack_slots` effects add (Pack Mule), computed when needed (Spec 03, Addendum A). */
export const packSizeOf = (player: PlayerState, minors: MinorEffects): number => packCapacity(derivedFor(player, minors).packSlots);

/**
 * A bound ability just drawn takes the weapon base wielded now, or waits for the next weapon wielded when drawn
 * bare-handed (Spec 03, Addendum A, Weapon Master).
 */
export function bindDrawn(character: Character & { equipment: Equipment }, id: string, minors: MinorEffects): void {
  if (minors.get(id)?.effect !== 'weapon_melee') return;
  (character.bindings ??= {})[id] = wieldedBase(character.equipment);
}

/** A weapon has just been wielded: any bound ability still waiting for one takes its base. */
export function bindWielded(character: Character, item: Item): void {
  if (item.kind !== 'weapon' || !character.bindings) return;
  for (const [id, base] of Object.entries(character.bindings)) if (base === null) character.bindings[id] = item.id;
}

/** True for an effect used with Q as a skill use (Spec 08, Addendum A, "an active"). */
export const isActive = (spec: EffectSpec | undefined): boolean => spec?.effect === 'sanctuary' || spec?.effect === 'purify';

/** Why an active ability cannot be used now, with no round spent, or undefined when it can. */
export function cannotUse(player: PlayerState, id: string, minors: MinorEffects): string | undefined {
  const spec = minors.get(id);
  if (!player.minorAbilities.includes(id) || !isActive(spec)) return 'You have no such ability to use.';
  if (spec!.effect === 'purify' && !wornCurse(player.equipment) && !hasStatus(player.statuses, 'poisoned')) return 'There is no curse or poison to cleanse.';
  return undefined;
}

/** The first worn or wielded cursed item, in slot order. */
const wornCurse = (equipment: Equipment): Item | undefined =>
  EQUIP_SLOTS.map((slot) => equipment[slot]).find((i): i is Item => i !== undefined && 'cursed' in i && i.cursed);

/** Minor abilities that are used with Q (actives), each once, in the order drawn (Spec 03, Addendum A). */
export function activeAbilities(player: PlayerState, minors: MinorEffects): string[] {
  return [...new Set(player.minorAbilities)].filter((id) => isActive(minors.get(id)));
}

/** Rounds left of a timed ability, or 0. */
export const timedLeft = (player: PlayerState, id: string): number => player.timed?.find((t) => t.id === id)?.rounds ?? 0;

/** What monsters' melee rolls against the player lose while a Sanctuary runs (Spec 03, Addendum A); several do not add. */
export const monsterMeleePenalty = (player: PlayerState): number =>
  Math.max(0, ...(player.timed ?? []).filter((t) => t.effect.effect === 'sanctuary').map((t) => t.effect.amount ?? 0));

/** A round has ended: every timed ability loses one, and those that end are named. */
export function tickTimed(player: PlayerState): string[] {
  const ended: string[] = [];
  if (!player.timed) return ended;
  for (const t of player.timed) if (--t.rounds <= 0) ended.push(t.name);
  player.timed = player.timed.filter((t) => t.rounds > 0);
  return ended;
}

/** The outcome of using an active ability as a skill use (Spec 03, Addendum A). */
export interface AbilityUse {
  roll: RollResult;
  /** It took effect: 4 or more, or 2 to 3 with the die lost. */
  worked: boolean;
}

/**
 * Use an active minor ability (Spec 03, Addendum A, "Active abilities are skill uses"): one Skill die rolled as a
 * skill use, 4 or more works, 2 to 3 works and the die is lost, 1 fails and the die is lost; an empty pool rolls with
 * disadvantage and loses nothing more. Blessed and Cursed touch checks only, not skill uses (Spec 04).
 */
export function useActive(player: PlayerState, id: string, name: string, minors: MinorEffects, rng: Rng, messages: LogMessage[]): AbilityUse {
  const spec = minors.get(id)!;
  const roll = rollPool(rng, player.pools.skill, 'skill');
  if (!roll.success) {
    messages.push({ kind: 'warning', text: `You try ${name}, but it fails.` });
    if (roll.dieLost) messages.push({ kind: 'warning', text: 'You lose a Skill die.' });
    return { roll, worked: false };
  }
  if (spec.effect === 'sanctuary') {
    const rounds = spec.rounds ?? 1;
    player.timed = [...(player.timed ?? []).filter((t) => t.id !== id), { id, name, effect: { ...spec }, rounds }];
    messages.push({ kind: 'system', text: `${name}: a calm settles around you for ${rounds} rounds.` });
  } else purify(player, messages);
  if (roll.dieLost) messages.push({ kind: 'warning', text: 'You lose a Skill die.' });
  return { roll, worked: true };
}

/**
 * Purify (Spec 03, Addendum A): lifts the curse of one worn cursed item, the first in slot order, and the Cursed
 * status too if no worn curse is left; with no worn curse, it ends Poisoned.
 */
function purify(player: PlayerState, messages: LogMessage[]): void {
  const cursed = wornCurse(player.equipment);
  if (cursed) {
    liftCurse(cursed);
    if (!wornCurse(player.equipment)) removeStatus(player.statuses, 'cursed');
    messages.push({ kind: 'discovery', text: `The curse on your ${cursed.name} lifts.` });
    return;
  }
  removeStatus(player.statuses, 'poisoned');
  messages.push({ kind: 'discovery', text: 'The poison leaves you.' });
}
