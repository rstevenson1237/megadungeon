// What a village offers (Spec 07, "Village structure"): bank, lodging and lift always; the shop, appraiser, smith
// and tavern by seeded odds below the surface, and all of them on the surface. A rescued specialist adds a
// missing service for the rest of the run.

import { createRng, hash32 } from '../../core/rng.ts';
import type { SpecialistService } from '../world/run-layout.ts';

export const SERVICES = ['bank', 'lodging', 'lift', 'shop', 'appraiser', 'smith', 'tavern'] as const;
export type Service = (typeof SERVICES)[number];

/** The services every village has. */
export const ALWAYS: readonly Service[] = ['bank', 'lodging', 'lift'];

/** The chance in percent of each other service in a subterranean village (Spec 07). */
export const SERVICE_ODDS: Readonly<Record<'shop' | 'appraiser' | 'smith' | 'tavern', number>> = { shop: 75, appraiser: 60, smith: 50, tavern: 75 };

/** A rescued trader runs the shop; the others add their own service (Spec 02, Connective elements). */
export const SPECIALIST_SERVICE: Readonly<Record<SpecialistService, Service>> = { smith: 'smith', appraiser: 'appraiser', trader: 'shop' };

/** The village's own services, in menu order: everything on the surface, else the seeded rolls. */
export function rollServices(runSeed: number, depth: number): Service[] {
  if (depth === 0) return [...SERVICES];
  const rng = createRng(hash32('village-services', runSeed >>> 0, depth));
  const found = new Set<Service>(ALWAYS);
  for (const name of ['shop', 'appraiser', 'smith', 'tavern'] as const) if (rng.int(1, 100) <= SERVICE_ODDS[name]) found.add(name);
  return SERVICES.filter((s) => found.has(s));
}

/** The services of a village with the specialists that joined it: `joined` maps a service to the depths it was added at. */
export function servicesOf(runSeed: number, depth: number, joined: Readonly<Partial<Record<Service, number[]>>> = {}): Service[] {
  const found = new Set<Service>(rollServices(runSeed, depth));
  for (const [service, depths] of Object.entries(joined) as [Service, number[]][]) if (depths.includes(depth)) found.add(service);
  return SERVICES.filter((s) => found.has(s));
}
