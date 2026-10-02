// Magic items, identification and curses (Spec 05, "Magic items, identification and curses" and the
// clarifications of task 2.9): making an item from its table row, the disguises, what the player is told, and
// lifting a curse. Rolls come from a seeded generator the caller supplies.

import { DISGUISED_KINDS, type EffectSpec } from '../../core/catalog.ts';
import { createRng, hash32, type Rng } from '../../core/rng.ts';
import type { Artifact, ContentBundle, DisguiseName, EquipmentBase, MagicItem } from '../../core/schemas.ts';
import { makeGear, rollQuality } from './gear.ts';
import type { AmmoItem, Equipment, GearItem, Item, LockpickItem, WornItem } from './types.ts';

/** Roughly one magic item in ten that can be worn is cursed (Spec 05). */
export const CURSE_ONE_IN = 10;

/** The tables items are made from. Built once from the bundle. */
export interface ItemData {
  bases: ReadonlyMap<string, EquipmentBase>;
  magic: ReadonlyMap<string, MagicItem>;
  artifacts: ReadonlyMap<string, Artifact>;
  disguiseNames: readonly DisguiseName[];
}

export function itemDataFrom(bundle: ContentBundle): ItemData {
  const rows = <T extends { id: string }>(name: string): T[] => (bundle.tables[name] ?? []) as T[];
  return {
    bases: new Map(rows<EquipmentBase>('equipment_bases').map((b) => [b.id, b])),
    magic: new Map(rows<MagicItem>('magic_items').map((m) => [m.id, m])),
    artifacts: new Map(rows<Artifact>('artifacts').map((a) => [a.id, a])),
    disguiseNames: rows<DisguiseName>('disguise_names'),
  };
}

/** A stack of ammunition from its base row. */
export function makeAmmo(base: EquipmentBase, uid: number, count: number): AmmoItem {
  if (base.type !== 'ammo' || !base.ammo || !base.per) throw new RangeError(`"${base.id}" is not ammunition`);
  return { kind: 'ammo', uid, id: base.id, name: base.name, value: base.price, ammo: base.ammo, per: base.per, count };
}

/** A bundle of lockpicks from the tool's base row (Spec 06). */
export function makeLockpicks(base: EquipmentBase, uid: number, count: number): LockpickItem {
  if (base.type !== 'tool') throw new RangeError(`"${base.id}" is not a tool`);
  return { kind: 'lockpicks', uid, id: base.id, name: base.name, value: base.price, count };
}

/**
 * A magic item from its table row: charges are rolled, and anything that can be worn is cursed 1 time in 10
 * (Spec 05, task 2.9). Throws for a row whose base is missing; content checks make that impossible in a build.
 */
export function makeMagicItem(row: MagicItem, uid: number, rng: Rng, data: ItemData): Item {
  const common = { uid, id: row.id, name: row.name, value: row.value };
  const cursedRoll = (): boolean => rng.oneIn(CURSE_ONE_IN);
  switch (row.kind) {
    case 'potion':
      return {
        kind: 'potion',
        ...common,
        count: 1,
        effect: row.effect!,
        ...(row.pool ? { pool: row.pool } : {}),
        ...(row.dice ? { dice: row.dice } : {}),
        ...(row.status ? { status: row.status } : {}),
        ...(row.rounds ? { rounds: row.rounds } : {}),
      };
    case 'ring':
    case 'clothing':
      return {
        kind: row.kind,
        ...common,
        slot: row.kind === 'ring' ? 'ring' : row.slot!,
        ...(row.passive ? { passive: row.passive } : {}),
        ...(row.amount ? { amount: row.amount } : {}),
        ...(row.effect === 'grant_status' ? { power: { status: row.status!, rounds: row.rounds!, oncePerLevel: row.oncePerLevel === true } } : {}),
        cursed: cursedRoll(),
        identified: false,
      };
    case 'wand':
    case 'rod':
    case 'staff': {
      const [lo, hi] = row.charges!;
      return {
        kind: row.kind,
        ...common,
        spell: row.spell!,
        charges: rng.int(lo, hi),
        ...(row.shape ? { shape: row.shape } : {}),
        // A wand or rod is carried, not worn, so only a staff can hold a curse.
        cursed: row.kind === 'staff' ? cursedRoll() : false,
        identified: false,
      };
    }
    case 'weapon':
    case 'armour': {
      const base = data.bases.get(row.base!);
      if (!base) throw new RangeError(`magic item "${row.id}": no base "${row.base}"`);
      const gear: GearItem = makeGear(base, uid, rollQuality(rng));
      gear.value = row.value;
      gear.enchant = {
        id: row.id,
        name: row.name,
        bonus: row.bonus ?? 0,
        ...(row.trait ? { trait: row.trait } : {}),
        ...(row.unburdened ? { unburdened: true } : {}),
      };
      gear.cursed = cursedRoll();
      return gear;
    }
  }
}

/** The effect a row names and its fields, as an item or a buff keeps it (Spec 08, Addendum A). */
export function effectOf(row: EffectSpec): EffectSpec {
  const { effect, amount, rolls, tag, shape, rounds } = row;
  return {
    effect,
    ...(amount !== undefined ? { amount } : {}),
    ...(rolls !== undefined ? { rolls: structuredClone(rolls) } : {}),
    ...(tag !== undefined ? { tag } : {}),
    ...(shape !== undefined ? { shape } : {}),
    ...(rounds !== undefined ? { rounds } : {}),
  };
}

/** An artifact: never breaks, never cursed, always known for what it is (Spec 05). */
export function makeArtifact(row: Artifact, uid: number): WornItem {
  return {
    kind: 'artifact',
    uid,
    id: row.id,
    name: row.name,
    value: 0,
    slot: row.slot ?? 'ring',
    effect: effectOf(row),
    cursed: false,
    identified: true,
  };
}

// --- Disguises and identification ---

/**
 * The look of each disguised magic item for a run: names of its kind, shuffled by the run seed and dealt out in
 * table order, so a "cloudy blue potion" means one thing in a run and something else in another (Spec 05).
 */
export function disguisesFor(runSeed: number, magic: Iterable<MagicItem>, names: readonly DisguiseName[]): Map<string, string> {
  const map = new Map<string, string>();
  const rows = [...magic];
  for (const kind of DISGUISED_KINDS) {
    const pool = createRng(hash32('disguise', runSeed >>> 0, kind)).shuffle(names.filter((n) => n.kind === kind));
    rows.filter((m) => m.kind === kind).forEach((m, i) => map.set(m.id, pool.length > 0 ? pool[i % pool.length]!.name : 'unmarked'));
  }
  return map;
}

/** What the player knows: kinds found out by use, and the disguises of this run. */
export interface Knowledge {
  /** Ids of potions, wands, rods and staves identified by use (Spec 05). */
  known: readonly string[];
  disguises: ReadonlyMap<string, string>;
}

/** Whether the player knows what an item really is. Gems, keys, ammunition and mundane gear are never in doubt. */
export function isIdentified(item: Item, known: readonly string[]): boolean {
  switch (item.kind) {
    case 'potion':
      return known.includes(item.id);
    case 'wand':
    case 'rod':
    case 'staff':
      return item.identified || known.includes(item.id);
    case 'ring':
    case 'clothing':
    case 'artifact':
      return item.identified;
    case 'weapon':
    case 'armour':
    case 'shield':
      return !item.enchant || item.identified;
    default:
      return true;
  }
}

/** Items that need the service rather than use to be identified. */
export const needsService = (item: Item): boolean => item.kind === 'ring' || item.kind === 'clothing' || ((item.kind === 'weapon' || item.kind === 'armour' || item.kind === 'shield') && item.enchant !== undefined);

/** The name the player sees: the true name once identified, otherwise a disguise or the plain base name. */
export function displayName(item: Item, k: Knowledge): string {
  if (isIdentified(item, k.known)) return item.kind === 'weapon' || item.kind === 'armour' || item.kind === 'shield' ? item.enchant?.name ?? item.name : item.name;
  switch (item.kind) {
    case 'potion':
    case 'ring':
    case 'wand':
    case 'rod':
    case 'staff':
      return `${k.disguises.get(item.id) ?? 'unmarked'} ${item.kind}`;
    case 'clothing':
      return item.slot;
    default:
      return item.name; // an enchanted weapon or armour looks like its base until identified
  }
}

/** A line for the pack list: count or charges, and what the player knows of a curse. */
export function describeItem(item: Item, k: Knowledge): string {
  const name = displayName(item, k);
  const known = isIdentified(item, k.known);
  switch (item.kind) {
    case 'potion':
      return item.count > 1 ? `${item.count} ${name}s` : name;
    case 'ammo':
      return `${name} (${item.count})`;
    case 'key':
    case 'lockpicks':
      return item.count > 1 ? `${name} (${item.count})` : name;
    case 'wand':
    case 'rod':
    case 'staff':
      return known ? `${name} [${item.charges}]${item.cursed ? ' (cursed)' : ''}` : name;
    case 'ring':
    case 'clothing':
    case 'artifact':
      return known && item.cursed ? `${name} (cursed)` : name;
    case 'weapon':
    case 'armour':
    case 'shield':
      return known && item.cursed ? `${name} (cursed)` : name;
    case 'gem':
    case 'jewelry':
      return item.appraised !== undefined ? `${name} (${item.appraised} gp)` : name;
    default:
      return name;
  }
}

/** Mark an item as identified by the service: a potion's kind becomes known; anything else is marked itself. Returns the ids now known. */
export function identify(item: Item, known: string[]): void {
  if (item.kind === 'potion' || item.kind === 'wand' || item.kind === 'rod' || item.kind === 'staff') {
    if (!known.includes(item.id)) known.push(item.id);
  }
  if ('identified' in item) item.identified = true;
}

/** Using a potion, wand or rod reveals that kind for the rest of the run (Spec 05, "Identify by use"). */
export function revealByUse(item: Item, known: string[]): boolean {
  if (item.kind !== 'potion' && item.kind !== 'wand' && item.kind !== 'rod' && item.kind !== 'staff') return false;
  if (known.includes(item.id)) return false;
  known.push(item.id);
  return true;
}

// --- Curses ---

/** Every cursed thing worn, wielded or carried. */
export function cursedItems(equipment: Equipment, pack: readonly Item[]): Item[] {
  return [...Object.values(equipment), ...pack].filter((i): i is Item => i !== undefined && 'cursed' in i && i.cursed);
}

/** Lift the curse on one item; true if it was cursed. The item then works as its true self (Spec 05). */
export function liftCurse(item: Item): boolean {
  if (!('cursed' in item) || !item.cursed) return false;
  item.cursed = false;
  return true;
}

/** A Remove Curse potion lifts every curse worn or carried. Returns how many were lifted. */
export function liftAllCurses(equipment: Equipment, pack: readonly Item[]): number {
  let n = 0;
  for (const item of cursedItems(equipment, pack)) if (liftCurse(item)) n++;
  return n;
}
