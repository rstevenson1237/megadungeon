// Weapons, armour and shields (Spec 05, "Quality, durability and repair", "Weapons and ammunition" and
// "Armour and shields"): making gear from its base, breaking, and what a set of equipment does to the rolls.

import type { GearTrait } from '../../core/catalog.ts';
import type { Rng } from '../../core/rng.ts';
import type { EquipmentBase } from '../../core/schemas.ts';
import type { RollMode } from '../character/dice.ts';
import { WAIT_ROUNDS_PER_DIE } from '../character/health.ts';
import type { Enchant, Equipment, GearItem, Quality } from './types.ts';

/** Break chance per roll, in percent (Spec 05). An artifact never breaks. */
export const BREAK_PERCENT: Readonly<Record<Quality, number>> = { crude: 15, normal: 3, fine: 1, artifact: 0 };

/** Value against normal quality (Spec 05). An artifact is priceless: it has no value to sell for. */
export const QUALITY_VALUE: Readonly<Record<Exclude<Quality, 'artifact'>, number>> = { crude: 0.5, normal: 1, fine: 3 };

/** Quality of gear found rather than bought: usually crude or normal, sometimes fine (starting values, Spec 05 task 2.9). */
export const FOUND_QUALITY: readonly { quality: Exclude<Quality, 'artifact'>; weight: number }[] = [
  { quality: 'crude', weight: 25 },
  { quality: 'normal', weight: 60 },
  { quality: 'fine', weight: 15 },
];

/** Roll a found item's quality. */
export function rollQuality(rng: Rng): Exclude<Quality, 'artifact'> {
  let roll = rng.int(1, FOUND_QUALITY.reduce((n, q) => n + q.weight, 0));
  for (const q of FOUND_QUALITY) {
    if (roll <= q.weight) return q.quality;
    roll -= q.weight;
  }
  return 'normal';
}

/** A piece of gear from its base row, unbroken, not cursed and not magic. */
export function makeGear(base: EquipmentBase, uid: number, quality: Quality = 'normal'): GearItem {
  const kind = base.type === 'melee' ? 'weapon' : base.type === 'ammo' ? undefined : base.type;
  if (!kind) throw new RangeError(`"${base.id}" is ammunition, not gear`);
  return {
    kind,
    uid,
    id: base.id,
    name: base.name,
    value: base.price,
    quality,
    broken: false,
    mod: base.modifier ?? 0,
    ...(base.hands ? { hands: base.hands } : {}),
    traits: [...(base.traits ?? [])],
    ...(base.range ? { range: base.range } : {}),
    ...(base.ammo ? { ammo: base.ammo } : {}),
    ...(base.large ? { large: true } : {}),
    cursed: false,
    identified: false,
  };
}

/** True once a roll of 1 to 100 comes in at or under the quality's break chance. */
export const breaks = (rng: Rng, quality: Quality): boolean => BREAK_PERCENT[quality] > 0 && rng.int(1, 100) <= BREAK_PERCENT[quality];

/** Whether the gear gives anything: broken gear does not, and nor does its enchantment (Spec 05). */
export const works = (g: GearItem | undefined): g is GearItem => g !== undefined && !g.broken;

/** The enchantment as it acts: a curse turns a bonus into -1 and takes away the trait and the unburdened benefit. */
export function effectiveEnchant(g: GearItem): { bonus: number; trait?: GearTrait; unburdened: boolean } | undefined {
  const e: Enchant | undefined = g.enchant;
  if (!e || g.broken) return undefined;
  if (g.cursed) return { bonus: -1, unburdened: false };
  return { bonus: e.bonus, ...(e.trait ? { trait: e.trait } : {}), unburdened: e.unburdened === true };
}

/** The traits that are drawbacks of heavy armour: an Elven Chain's enchantment leaves them behind. */
const DRAWBACKS: readonly GearTrait[] = ['no_stealth_buff', 'notice_advantage', 'spell_penalty', 'ranged_penalty'];

/** Every trait a piece of gear has now: its base's, and a magic weapon's. Broken gear has none. */
export function activeTraits(g: GearItem | undefined): GearTrait[] {
  if (!works(g)) return [];
  const magic = effectiveEnchant(g);
  const base = magic?.unburdened ? g.traits.filter((t) => !DRAWBACKS.includes(t)) : g.traits;
  return [...base, ...(magic?.trait ? [magic.trait] : [])];
}

/** The numbers a set of equipment gives the player (Spec 05). Read by combat, searching, noticing and waiting. */
export interface Derived {
  /** Added to the Combat die in melee attacks: the weapon's, an enchantment's and a ring's. Bare hands are -1. */
  melee: number;
  /** Added to the Combat die when defending against melee only. */
  defence: number;
  /** Traits now active on the wielded weapon and on what is worn. */
  weaponTraits: GearTrait[];
  armourTraits: GearTrait[];
  /** How monsters' notice rolls go: a plate wearer or a cursed stealth item gives them advantage, a stealth buff disadvantage. */
  notice: RollMode;
  /** Advantage on searching and on lockpicking from rings, gloves and cloaks; a curse turns each to disadvantage. */
  search: RollMode;
  lockpick: RollMode;
  /** Rounds of waiting that restore a Combat die. */
  waitRounds: number;
  /** The player's own ranged attacks (a tower shield gives disadvantage). */
  rangedMode: RollMode;
  /** The spell-roll mode of everything worn that touches spells: plate disadvantage; a staff advantage on its shape. */
  spellPenalty: boolean;
  staffShape?: string;
  staffCursed: boolean;
}

const BARE_HANDS = -1;

const worn = (e: Equipment) => Object.values(e).filter((i) => i !== undefined);

/** Compute what the equipment gives; `stealthBuff` is any stealth the character has from elsewhere. Pure: nothing is changed. */
export function derive(equipment: Equipment, stealthBuff = false): Derived {
  const main = equipment.main;
  const weapon = main?.kind === 'weapon' && works(main) ? main : undefined;
  let melee = BARE_HANDS;
  if (weapon) {
    const e = effectiveEnchant(weapon);
    melee = weapon.mod + (e?.bonus ?? 0);
  }
  const weaponTraits = activeTraits(weapon);

  const body = equipment.body?.kind === 'armour' ? equipment.body : undefined;
  const off = equipment.off?.kind === 'shield' ? equipment.off : undefined;
  let defence = 0;
  for (const piece of [body, off]) {
    if (!works(piece)) continue;
    defence += piece.mod + (effectiveEnchant(piece)?.bonus ?? 0);
  }
  if (weaponTraits.includes('defence')) defence += 1;
  const armourTraits = [...activeTraits(body), ...activeTraits(off)];

  let stealth = stealthBuff;
  let cursedStealth = false;
  let search: RollMode = 'normal';
  let lockpick: RollMode = 'normal';
  let waitRounds = WAIT_ROUNDS_PER_DIE;
  const mode = (now: RollMode, cursed: boolean): RollMode => {
    const next: RollMode = cursed ? 'disadvantage' : 'advantage';
    return now === 'normal' || now === next ? next : 'normal';
  };
  for (const item of worn(equipment)) {
    if (item.kind !== 'ring' && item.kind !== 'clothing' && item.kind !== 'artifact') continue;
    const cursed = item.cursed;
    switch (item.passive) {
      case 'melee':
        melee += cursed ? -(item.amount ?? 1) : item.amount ?? 1;
        break;
      case 'stealth':
        if (cursed) cursedStealth = true;
        else stealth = true;
        break;
      case 'search':
        search = mode(search, cursed);
        break;
      case 'lockpick':
        lockpick = mode(lockpick, cursed);
        break;
      case 'wait':
        waitRounds = cursed ? Math.max(waitRounds, 15) : Math.min(waitRounds, item.amount ?? waitRounds);
        break;
    }
  }

  // A plate wearer, or one with a cursed stealth item, is noticed with advantage; a stealth buff gives disadvantage unless chain is worn.
  let notice: RollMode = 'normal';
  if (armourTraits.includes('notice_advantage') || cursedStealth) notice = 'advantage';
  else if (stealth && !armourTraits.includes('no_stealth_buff')) notice = 'disadvantage';

  const staff = equipment.main?.kind === 'staff' ? equipment.main : undefined;
  return {
    melee,
    defence,
    weaponTraits,
    armourTraits,
    notice,
    search,
    lockpick,
    waitRounds,
    rangedMode: armourTraits.includes('ranged_penalty') ? 'disadvantage' : 'normal',
    spellPenalty: armourTraits.includes('spell_penalty'),
    ...(staff?.shape ? { staffShape: staff.shape } : {}),
    staffCursed: staff?.cursed === true,
  };
}

/** The mode of a spell roll of the given shape: plate gives disadvantage, a staff of that shape advantage or, cursed, disadvantage; they cancel. */
export function spellMode(d: Derived, shape: string): RollMode {
  const staff: RollMode = d.staffShape === shape ? (d.staffCursed ? 'disadvantage' : 'advantage') : 'normal';
  const plate: RollMode = d.spellPenalty ? 'disadvantage' : 'normal';
  if (staff === 'normal') return plate;
  if (plate === 'normal' || plate === staff) return staff;
  return 'normal';
}
