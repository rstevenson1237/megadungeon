// Art asset ids (Spec 01b, clarification of task 6.1): how the isometric display names the sprite of each thing it
// draws, and how the briefs tool names the briefs, so the two never drift apart. Ids are lower case with hyphens.

/**
 * The monster family of a glyph letter. Lower case letters keep their letter (`family-h`); upper case ones add
 * `-cap` (`family-h-cap`), because artgen ids are lower case and both `h` and `H` are families (Spec 08, Addendum B).
 */
export const familyId = (glyph: string): string =>
  glyph >= 'A' && glyph <= 'Z' ? `family-${glyph.toLowerCase()}-cap` : `family-${glyph}`;

/** A content id as an artgen id: underscores written as hyphens. */
export const artId = (contentId: string): string => contentId.replace(/_/g, '-');
