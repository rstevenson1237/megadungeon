// Minor abilities and lasting buffs in play (Spec 03, Addendum A; Spec 08, Addendum A): the effects of what the
// character has drawn, read from the content table by id, and the active ones used as skill uses. Nothing derived
// from them is stored: the pack's size, the wait rounds and the sell bonus are worked out when they are needed.

import type { EffectSpec } from '../core/catalog.ts';
import type { LogMessage } from '../core/log.ts';
import type { Rng } from '../core/rng.ts';
import type { Character } from '../rules/character/character.ts';
import { type RollResult, type Step, rollPool, stepUp } from '../rules/character/dice.ts';
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
  /** What a minor ability does while it runs, with its numbers: copied from the row when it is used. A major one (Rage, Wild Shape) has none; its rule is in code. */
  effect?: EffectSpec;
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
  Math.max(0, ...(player.timed ?? []).filter((t) => t.effect?.effect === 'sanctuary').map((t) => t.effect!.amount ?? 0));

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

// --- Major abilities (Spec 03, Addendum A, "The 20 major abilities") ---

/** How each major ability is used (Spec 03, Addendum A): by itself, as a trade, as a spell, or as a skill use with Q. */
export type MajorKind = 'passive' | 'trade' | 'spell' | 'active';

export const MAJOR_KINDS: Readonly<Record<string, MajorKind>> = {
  cleave: 'passive',
  arcane_bolt: 'spell',
  backstab: 'passive',
  heal: 'spell',
  rage: 'active',
  shield_wall: 'passive',
  smite: 'trade',
  volley: 'active',
  flurry: 'passive',
  fascinate: 'active',
  wild_shape: 'active',
  raise: 'active',
  overchannel: 'passive',
  decoy: 'active',
  pact: 'trade',
  mark: 'active',
  brew: 'passive',
  spirit_totem: 'active',
  hex_breaker: 'passive',
  companion: 'passive',
};

/** The major abilities with a rule in code so far (tasks 3.6 and 3.7); Raise, Decoy and Companion come with task 3.8. */
export const BUILT_MAJORS: readonly string[] = [
  'cleave',
  'arcane_bolt',
  'backstab',
  'heal',
  'shield_wall',
  'smite',
  'flurry',
  'overchannel',
  'pact',
  'brew',
  'hex_breaker',
  'rage',
  'volley',
  'fascinate',
  'wild_shape',
  'mark',
  'spirit_totem',
];

/** Whether the player has a major ability, by id. */
export const hasMajor = (player: Pick<PlayerState, 'abilities'>, id: string): boolean => player.abilities.includes(id);

/** The player's major ability: the first in `abilities` (one per class). */
export const majorOf = (player: Pick<PlayerState, 'abilities'>): string | undefined => player.abilities[0];

// --- Timed major abilities (Spec 03, Addendum A: Rage and Wild Shape) ---

/** Rounds a Rage runs, and a Wild Shape (Spec 03, Addendum A). */
export const RAGE_ROUNDS = 10;
export const WILD_SHAPE_ROUNDS = 20;

/** Start a timed ability, or start it again: its rounds count the one it is used in, and two never add. */
export function startTimed(player: PlayerState, id: string, name: string, rounds: number): void {
  player.timed = [...(player.timed ?? []).filter((t) => t.id !== id), { id, name, rounds }];
}

/** Rage is running: a melee tie between the player and a creature hits only the creature (Spec 03, Addendum A). */
export const raging = (player: PlayerState): boolean => timedLeft(player, 'rage') > 0;

/** The step the player's Combat die rolls at: one step up while Wild Shape runs, never past d12 (Spec 03, Addendum A). */
export const combatStep = (player: PlayerState): Step => (timedLeft(player, 'wild_shape') > 0 ? stepUp(player.pools.combat.step) : player.pools.combat.step);

// --- Fights (Spec 03, Addendum A, "A fight") ---

/** Rounds in a row with no exchange involving the player that end a fight. */
export const FIGHT_QUIET_ROUNDS = 10;

/** A fight in progress: the round of the last exchange involving the player, and what was used once in it. */
export interface Fight {
  last: number;
  used: string[];
}

/**
 * An exchange involving the player (melee, ranged, or a spell aimed at a creature) in round `round`: it begins a
 * fight, or keeps the one going.
 */
export function joinFight(player: PlayerState, round: number): void {
  if (player.fight) player.fight.last = round;
  else player.fight = { last: round, used: [] };
}

/** True while a fight is on. */
export const inFight = (player: PlayerState): boolean => player.fight != null;

/** The end of round `round`: a fight with no exchange for 10 rounds in a row ends, and its once-per-fight uses come back. */
export function fightRoundEnds(player: PlayerState, round: number): void {
  if (player.fight && round - player.fight.last >= FIGHT_QUIET_ROUNDS) player.fight = null;
}

/** Whether a once-per-fight use is still to come in the fight now on (none outside a fight). */
export const fightReady = (player: PlayerState, key: string): boolean => player.fight != null && !player.fight.used.includes(key);

/** Spend a once-per-fight use: true when it was there to spend. */
export function useOncePerFight(player: PlayerState, key: string): boolean {
  if (!fightReady(player, key)) return false;
  player.fight!.used.push(key);
  return true;
}

/** Shield Wall is ready: the player has it and no hit has been ignored in this fight (Spec 03, Addendum A). */
export const shieldWallReady = (player: PlayerState): boolean => hasMajor(player, 'shield_wall') && !(player.fight?.used.includes('shield_wall') ?? false);

/** What Q says of a passive ability: it works by itself, with no round spent (Spec 03, Addendum A). */
export function passiveNote(player: PlayerState, id: string, name: string): string {
  if (id === 'shield_wall') return `Shield Wall works by itself: ${shieldWallReady(player) ? 'it is ready for the first hit of a fight' : 'it has turned a blow in this fight'}.`;
  return `${name} works by itself; there is nothing to use.`;
}

/**
 * Pact (Spec 03, Addendum A): a trade with no roll, one Combat die for one Magic die. Why it cannot be made now, or
 * undefined when it can.
 */
export function pactProblem(player: PlayerState): string | undefined {
  if (player.pools.combat.dice <= 0) return 'You have no Combat die to give.';
  if (player.pools.magic.dice >= player.pools.magic.max) return 'Your Magic dice are full.';
  return undefined;
}

export function makePact(player: PlayerState, messages: LogMessage[]): void {
  player.pools.combat.dice--;
  player.pools.magic.dice++;
  messages.push({ kind: 'system', text: 'You strike the pact: a Combat die for a Magic die.' });
}

/** Smite (Spec 03, Addendum A): Q readies it, Q again cancels; it cannot be readied with no Magic die. No round either way. */
export function toggleSmite(player: PlayerState, messages: LogMessage[]): void {
  if (player.smite) {
    player.smite = false;
    messages.push({ kind: 'system', text: 'You lower your guard: Smite is no longer readied.' });
    return;
  }
  if (player.pools.magic.dice <= 0) {
    messages.push({ kind: 'system', text: 'You need a Magic die to ready Smite.' });
    return;
  }
  player.smite = true;
  messages.push({ kind: 'system', text: 'Smite is readied: your next melee hit spends a Magic die.' });
}

/**
 * What the player knows of potions: an Alchemist's Brew shows every potion's true kind once seen (Spec 03, Addendum
 * A), and a potion shown to the player has been seen, so every potion kind counts as known to them.
 */
export function knownIds(player: Pick<PlayerState, 'abilities' | 'known'>, potions: Iterable<{ id: string; kind: string }>): string[] {
  if (!hasMajor(player, 'brew')) return player.known;
  return [...new Set([...player.known, ...[...potions].filter((r) => r.kind === 'potion').map((r) => r.id)])];
}
