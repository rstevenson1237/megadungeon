// Depth scaling figures (Spec 02, "Depth scaling"). Starting values for playtesting.

/** Nominal treasure budget of a level, in gp, before the up-to-50% variation: 50 + 10 x depth squared. */
export const treasureBudget = (depth: number): number => 50 + 10 * depth * depth;
