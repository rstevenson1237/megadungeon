import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BRIEF_ID,
  FAMILY_HEIGHTS,
  PLAYER_HEIGHT,
  buildBriefs,
  briefsText,
  familyId,
  type ArtBrief,
} from '../tools/art-briefs.ts';
import { buildContent } from '../tools/content-build.ts';

const root = resolve(import.meta.dirname, '..');
const { bundle } = buildContent(resolve(root, 'content'));
const tables = bundle.tables as Record<string, Array<{ id: string; glyph?: string }>>;
const briefs = buildBriefs(tables);
const byId = new Map(briefs.map((b) => [b.id, b]));
const inBatch = (n: ArtBrief['batch']) => briefs.filter((b) => b.batch === n);

describe('art briefs (Spec 01b, Briefs)', () => {
  it('gives every brief a unique id that artgen accepts', () => {
    expect(new Set(briefs.map((b) => b.id)).size).toBe(briefs.length);
    for (const b of briefs) expect(b.id).toMatch(BRIEF_ID);
  });

  it('names a family brief for every monster and boss glyph, upper and lower case apart', () => {
    for (const row of [...tables['monsters']!, ...tables['bosses']!]) expect(byId.has(familyId(row.glyph!))).toBe(true);
    expect(familyId('h')).toBe('family-h');
    expect(familyId('H')).toBe('family-h-cap');
    expect(inBatch(2).filter((b) => b.id.startsWith('family-'))).toHaveLength(35);
  });

  it('follows the asset list: a player per class, the NPC roles, a unique sprite per boss', () => {
    for (const c of tables['classes']!) expect(byId.get(`class-${c.id.replace(/_/g, '-')}`)?.height).toBe(PLAYER_HEIGHT);
    for (const role of ['rival', 'trader', 'bandit', 'hermit', 'captive']) expect(byId.has(`npc-${role}`)).toBe(true);
    for (const b of tables['bosses']!) expect(byId.get(`boss-${b.id.replace(/_/g, '-')}`)?.size).toBe('large');
    expect(inBatch(1)).toHaveLength(10);
    expect(inBatch(4)).toHaveLength(tables['bosses']!.length + 1);
  });

  it('gives every character, creature and prop a real-world height, and every effect a drawable object', () => {
    for (const b of briefs) {
      if (b.kind === 'character' || b.kind === 'creature' || b.kind === 'prop') expect(b.height, b.id).toBeGreaterThan(0);
      if (b.kind === 'effect') expect(b.object, b.id).toMatch(/[a-z]{3}/);
    }
    // the spec's yardsticks: a rat below the knee, an ogre twice the player's height
    expect(FAMILY_HEIGHTS['r']!).toBeLessThan(PLAYER_HEIGHT / 3);
    expect(FAMILY_HEIGHTS['O']).toBe(PLAYER_HEIGHT * 2);
  });

  it('keeps the briefs runs in batch order', () => {
    const batches = [...briefs].sort((a, b) => a.priority - b.priority).map((b) => b.batch);
    expect(batches).toEqual([...batches].sort());
  });

  it('matches the committed art/briefs.yaml', () => {
    expect(readFileSync(resolve(root, 'art', 'briefs.yaml'), 'utf8')).toBe(briefsText(briefs));
  });
});
