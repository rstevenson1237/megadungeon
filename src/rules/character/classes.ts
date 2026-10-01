// The 20 classes as the rules read them (Spec 03, "Classes"), built from the content bundle.

import type { ClassEntry, ContentBundle, MinorAbilityEntry } from '../../core/schemas.ts';
import type { ClassDef, MinorAbilityDef } from './character.ts';
import type { Step } from './dice.ts';

/** Every class in the bundle, in table order, each with its minor ability pool. */
export function classesFrom(bundle: ContentBundle): ClassDef[] {
  const minors = (bundle.tables.minor_abilities ?? []) as MinorAbilityEntry[];
  return ((bundle.tables.classes ?? []) as ClassEntry[]).map((c) => {
    const pool: MinorAbilityDef[] = minors
      .filter((m) => m.classes.includes(c.id))
      .map((m) => ({ id: m.id, name: m.name, ...(m.stackable ? { stackable: true } : {}) }));
    return {
      id: c.id,
      name: c.name,
      majorAbility: c.ability,
      start: { combat: c.start.combat as Step, skill: c.start.skill as Step, magic: c.start.magic as Step },
      steps: { 4: c.steps[0], 7: c.steps[1], 9: c.steps[2] },
      minorAbilities: pool,
    };
  });
}

/** One class by id; throws on an id the bundle does not hold. */
export function classById(bundle: ContentBundle, id: string): ClassDef {
  const found = classesFrom(bundle).find((c) => c.id === id);
  if (!found) throw new RangeError(`unknown class "${id}"`);
  return found;
}
