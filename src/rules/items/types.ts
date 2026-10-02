// The things a character carries (Spec 05). Every item is plain, serialisable data that copies the numbers it
// needs from its table row when it is made (Spec 05, clarifications of task 2.9), so a saved item never needs
// the table.

import type { AmmoType, EffectSpec, GearTrait, ItemEffect, Passive, SpellShape, WornSlot } from '../../core/catalog.ts';
import type { StatusId } from '../magic/status.ts';

/** Weapons and armour come in four qualities (Spec 05, "Quality, durability and repair"). */
export type Quality = 'crude' | 'normal' | 'fine' | 'artifact';

/** The ten equipment slots (Spec 05, "Equipment slots and inventory"). */
export const EQUIP_SLOTS = ['main', 'off', 'ranged', 'body', 'cloak', 'boots', 'gloves', 'hat', 'ring1', 'ring2'] as const;
export type EquipSlot = (typeof EQUIP_SLOTS)[number];

/** What is worn and wielded; none of it uses pack slots. */
export type Equipment = Partial<Record<EquipSlot, Item>>;

interface Base {
  /** Seeds what has to be rolled for this one thing (an appraisal, a charge count): fixed when it is made. */
  uid: number;
  /** The table row's id. */
  id: string;
  /** The true name. What the player sees depends on identification (see `displayName`). */
  name: string;
  /** Worth in gp at normal quality, before the depth multiplier. */
  value: number;
}

/** A magic weapon's or armour's enchantment: a bonus to the base modifier, or a trait, or no stealth drawback. */
export interface Enchant {
  id: string;
  name: string;
  bonus: number;
  trait?: GearTrait;
  unburdened?: boolean;
}

/** A weapon, ranged weapon, armour or shield, mundane or magic. */
export interface GearItem extends Base {
  kind: 'weapon' | 'ranged' | 'armour' | 'shield';
  quality: Quality;
  broken: boolean;
  /** The base's melee modifier (weapons) or defence modifier (armour and shields). */
  mod: number;
  hands?: 1 | 2;
  traits: GearTrait[];
  range?: number;
  ammo?: AmmoType;
  large?: boolean;
  enchant?: Enchant;
  cursed: boolean;
  /** The service has shown what it is. */
  identified: boolean;
}

export interface AmmoItem extends Base {
  kind: 'ammo';
  ammo: AmmoType;
  count: number;
  /** Price in gp for `per` pieces, which is what `value` holds. */
  per: number;
}

export interface PotionItem extends Base {
  kind: 'potion';
  count: number;
  effect: ItemEffect;
  pool?: 'combat' | 'skill' | 'magic';
  dice?: number;
  status?: StatusId;
  rounds?: number;
}

/** A ring, a piece of clothing or an artifact: worn, with an always-on effect and sometimes a power. */
export interface WornItem extends Base {
  kind: 'ring' | 'clothing' | 'artifact';
  slot: WornSlot;
  /** A ring's or clothing's always-on effect, a word for an effect of the vocabulary (Spec 05), with its number. */
  passive?: Passive;
  amount?: number;
  /** An artifact's effect, copied from its row (Spec 08, Addendum A). */
  effect?: EffectSpec;
  /** A worn power used from the pack screen, such as Boots of Speed. */
  power?: { status: StatusId; rounds: number; oncePerLevel: boolean };
  /** The level a once-a-level power was last used on. */
  usedDepth?: number;
  cursed: boolean;
  identified: boolean;
}

/** A wand, rod or staff: casts its spell from charges. */
export interface ChargedItem extends Base {
  kind: 'wand' | 'rod' | 'staff';
  spell: string;
  charges: number;
  /** A staff gives advantage on spell rolls of this shape. */
  shape?: SpellShape;
  cursed: boolean;
  identified: boolean;
}

export interface KeyItem extends Base {
  kind: 'key';
  count: number;
}

export interface VaultKeyItem extends Base {
  kind: 'vault_key';
  /** The vault this key opens (Spec 02). */
  link: string;
}

export interface LockpickItem extends Base {
  kind: 'lockpicks';
  count: number;
}

/** A gem or a piece of jewelry; its value is set by the appraiser (Spec 05, "Treasure and appraisal"). */
export interface TreasureItem extends Base {
  kind: 'gem' | 'jewelry';
  /** Set once the appraiser has valued it, and never changed. */
  appraised?: number;
}

export interface BookItem extends Base {
  kind: 'book';
}

export interface SpellbookItem extends Base {
  kind: 'spellbook';
  spell: string;
  /** The village rest count at which reading it last failed (Spec 04). */
  failedAtRest?: number;
}

export interface QuestItem extends Base {
  kind: 'quest_item';
  quest: string;
}

export interface MapFragmentItem extends Base {
  kind: 'map_fragment';
  link: string;
  mappedLevel: number;
}

export type Item =
  | GearItem
  | AmmoItem
  | PotionItem
  | WornItem
  | ChargedItem
  | KeyItem
  | VaultKeyItem
  | LockpickItem
  | TreasureItem
  | BookItem
  | SpellbookItem
  | QuestItem
  | MapFragmentItem;

export type ItemKind = Item['kind'];

/** Things that can carry a curse: whatever is worn or wielded (Spec 05, clarifications of task 2.9). */
export const isWearable = (item: Item): item is GearItem | WornItem | ChargedItem =>
  item.kind === 'weapon' || item.kind === 'armour' || item.kind === 'shield' || item.kind === 'ring' || item.kind === 'clothing' || item.kind === 'staff' || item.kind === 'artifact';

/** True when the item is cursed and so cannot be taken off or displaced. */
export const isCursed = (item: Item | undefined): boolean => !!item && 'cursed' in item && item.cursed === true;
