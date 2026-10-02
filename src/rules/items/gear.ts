// Weapons, armour and shields (Spec 05, "Quality, durability and repair", "Weapons and ammunition" and
// "Armour and shields"): making gear from its base, breaking, and what a set of equipment does to the rolls.

import { type AdvantageRoll, type CreatureTag, type EffectSpec, type GearTrait, PASSIVE_EFFECTS, type SpellShape } from '../../core/catalog.ts';
import type { Rng } from '../../core/rng.ts';
import type { EquipmentBase } from '../../core/schemas.ts';
import { type RollMode, combineModes } from '../character/dice.ts';
import { WAIT_ROUNDS_PER_DIE } from '../character/health.ts';
import type { Enchant, Equipment, GearItem, Item, Quality } from './types.ts';

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
  const kind = base.type === 'melee' ? 'weapon' : base.type === 'ammo' || base.type === 'tool' ? undefined : base.type;
  if (!kind) throw new RangeError(`"${base.id}" is ammunition or a tool, not gear`);
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

/**
 * The numbers a set of equipment, the abilities drawn and the lasting buffs give the player (Spec 05; Spec 08,
 * Addendum A). Read by combat, searching, noticing, traps, spells, waiting, the pack and the village.
 */
export interface Derived {
  /** Added to the Combat die in melee attacks: the weapon's, an enchantment's, a ring's and an ability's. Bare hands are -1. */
  melee: number;
  /** Added to the Combat die when defending against melee only. */
  defence: number;
  /** Traits now active on the wielded weapon and on what is worn. */
  weaponTraits: GearTrait[];
  armourTraits: GearTrait[];
  /** How monsters' notice rolls go: a plate wearer or a cursed stealth item gives them advantage, a stealth buff disadvantage. */
  notice: RollMode;
  /** Advantage on searching and on lockpicking from rings, gloves, cloaks and abilities; a curse turns each to disadvantage. */
  search: RollMode;
  lockpick: RollMode;
  /** The player's own passive notice, disarming and the avoid check of a hidden floor trap (Spec 06), before Blessed and Cursed. */
  passiveNotice: RollMode;
  disarm: RollMode;
  avoidTrap: RollMode;
  /** Rounds of waiting that restore a Combat die. */
  waitRounds: number;
  /** The player's own ranged attacks (a tower shield gives disadvantage). */
  rangedMode: RollMode;
  /** The spell-roll mode of everything worn that touches spells: plate disadvantage; a staff advantage on its shape. */
  spellPenalty: boolean;
  staffShape?: string;
  staffCursed: boolean;
  /** Spell shapes rolled with advantage (`all` for every spell roll), and advantage while no hostile creature is adjacent. */
  spellAdvantage: (SpellShape | 'all')[];
  spellFocus: boolean;
  /** Cells an area spell's footprint grows each way, and a caster-centred spell's reach grows (Widen). */
  spellWiden: number;
  /** Creature tags the player fights with advantage on the Combat die (Hallowed). */
  against: CreatureTag[];
  /** Pack slots beyond the 12 of the start (Pack Mule). */
  packSlots: number;
  /** Percent added to what selling pays (Fence). */
  sellBonus: number;
  /** Percent of a village rest's price that is paid (Tithe makes it 0). */
  restCost: number;
  /** Extra Magic dice a potion that restores Magic dice gives (Mana Well). */
  potionMagic: number;
  /** Triggered effects that change one rule each (Scholar, Light Step, Quick Hands, Second Wind). */
  bookLore: boolean;
  sureFooting: boolean;
  carefulOpening: boolean;
  rally: boolean;
}

const BARE_HANDS = -1;

const worn = (e: Equipment) => Object.values(e).filter((i) => i !== undefined);

/** A lasting buff the player has earned, such as a completed shrine set's (Spec 06): an effect from the vocabulary. */
export type Buff = EffectSpec;

/** The effect a worn ring, piece of clothing or artifact gives, if any: its passive's effect, or an artifact's own. */
export function wornEffect(item: Item): EffectSpec | undefined {
  if (item.kind !== 'ring' && item.kind !== 'clothing' && item.kind !== 'artifact') return undefined;
  if (item.effect) return item.effect;
  return item.passive ? { ...PASSIVE_EFFECTS[item.passive], ...(item.amount !== undefined ? { amount: item.amount } : {}) } : undefined;
}

/** Wait rounds a cursed wait item imposes: recovery every 15 rounds (Spec 05). */
const CURSED_WAIT_ROUNDS = 15;

/**
 * Compute what the equipment and every other effect give; `stealthBuff` is any stealth from elsewhere, and `effects`
 * are the abilities drawn and the lasting buffs (never cursed). Pure: nothing is changed.
 */
export function derive(equipment: Equipment, stealthBuff = false, effects: readonly EffectSpec[] = []): Derived {
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
  const modes: Record<AdvantageRoll, RollMode> = { search: 'normal', notice: 'normal', lockpick: 'normal', disarm: 'normal', avoid_trap: 'normal', spell: 'normal' };
  const mode = (now: RollMode, cursed: boolean): RollMode => {
    const next: RollMode = cursed ? 'disadvantage' : 'advantage';
    return now === 'normal' || now === next ? next : 'normal';
  };
  const out = {
    waitRounds: WAIT_ROUNDS_PER_DIE,
    spellAdvantage: [] as (SpellShape | 'all')[],
    spellFocus: false,
    spellWiden: 0,
    against: [] as CreatureTag[],
    packSlots: 0,
    sellBonus: 0,
    restCost: 100,
    potionMagic: 0,
    bookLore: false,
    sureFooting: false,
    carefulOpening: false,
    rally: false,
  };
  const sources: { spec: EffectSpec; cursed: boolean }[] = [
    ...worn(equipment).flatMap((item) => {
      const spec = wornEffect(item);
      return spec ? [{ spec, cursed: 'cursed' in item && item.cursed === true }] : [];
    }),
    ...effects.map((spec) => ({ spec, cursed: false })),
  ];
  for (const { spec, cursed } of sources) {
    const amount = spec.amount ?? 1;
    switch (spec.effect) {
      case 'advantage':
        for (const roll of [spec.rolls ?? []].flat()) {
          if (roll === 'spell' && !cursed) out.spellAdvantage.push(spec.shape ?? 'all');
          else if (roll !== 'spell') modes[roll] = mode(modes[roll], cursed);
        }
        break;
      case 'spell_focus':
        out.spellFocus = true;
        break;
      case 'against_tag':
        if (spec.tag && !out.against.includes(spec.tag)) out.against.push(spec.tag);
        break;
      case 'melee':
      case 'weapon_melee':
        melee += cursed ? -amount : amount;
        break;
      case 'defence':
        defence += cursed ? -amount : amount;
        break;
      case 'stealth':
        if (cursed) cursedStealth = true;
        else stealth = true;
        break;
      case 'spell_widen':
        out.spellWiden += amount;
        break;
      case 'wait_rounds':
        out.waitRounds = cursed ? Math.max(out.waitRounds, CURSED_WAIT_ROUNDS) : Math.min(out.waitRounds, amount);
        break;
      case 'pack_slots':
        out.packSlots += amount;
        break;
      case 'sell_bonus':
        out.sellBonus += amount;
        break;
      case 'rest_cost':
        out.restCost = Math.min(out.restCost, amount);
        break;
      case 'potion_magic':
        out.potionMagic += amount;
        break;
      case 'book_lore':
        out.bookLore = true;
        break;
      case 'sure_footing':
        out.sureFooting = true;
        break;
      case 'careful_opening':
        out.carefulOpening = true;
        break;
      case 'rally':
        out.rally = true;
        break;
      case 'sanctuary':
      case 'purify':
        break; // actives do nothing until used (Spec 03, Addendum A)
      default: {
        // Every effect on the list has its code here or where it is used: a new one fails to compile until it does.
        const unhandled: never = spec.effect;
        throw new RangeError(`no code for effect "${String(unhandled)}"`);
      }
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
    search: modes.search,
    lockpick: modes.lockpick,
    passiveNotice: modes.notice,
    disarm: modes.disarm,
    avoidTrap: modes.avoid_trap,
    rangedMode: armourTraits.includes('ranged_penalty') ? 'disadvantage' : 'normal',
    spellPenalty: armourTraits.includes('spell_penalty'),
    ...(staff?.shape ? { staffShape: staff.shape } : {}),
    staffCursed: staff?.cursed === true,
    ...out,
  };
}

/**
 * The mode of a spell roll of the given shape: plate gives disadvantage, a staff of that shape advantage or, cursed,
 * disadvantage; an ability or artifact advantage on spell rolls (of that shape), and Focus while no hostile creature
 * is adjacent (`engaged` false). Any advantage with any disadvantage cancel (Spec 03).
 */
export function spellMode(d: Derived, shape: string, engaged = false): RollMode {
  const staff: RollMode = d.staffShape === shape ? (d.staffCursed ? 'disadvantage' : 'advantage') : 'normal';
  const plate: RollMode = d.spellPenalty ? 'disadvantage' : 'normal';
  const ability: RollMode = d.spellAdvantage.some((s) => s === 'all' || s === shape) || (d.spellFocus && !engaged) ? 'advantage' : 'normal';
  return combineModes(staff, plate, ability);
}
