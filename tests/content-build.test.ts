import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildContent } from '../tools/content-build.ts';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

function contentDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'content-'));
  dirs.push(dir);
  for (const [name, text] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, text);
  }
  return dir;
}

describe('content build', () => {
  it('compiles the real content folder with no errors', () => {
    const { bundle, errors } = buildContent(resolve(import.meta.dirname, '..', 'content'));
    expect(errors).toEqual([]);
    expect(Object.keys(bundle.tables).sort()).toEqual([
      'monsters',
      'quest_templates',
      'rumours',
      'village_names',
    ]);
  });

  it('compiles a valid table into the bundle', () => {
    const dir = contentDir({
      'world/village_names.yaml': '- id: a_town\n  name: A Town\n  depth: [1, 10]\n  weight: 5\n',
    });
    const { bundle, errors } = buildContent(dir);
    expect(errors).toEqual([]);
    expect(bundle.tables['village_names']).toEqual([
      { id: 'a_town', name: 'A Town', depth: [1, 10], weight: 5 },
    ]);
  });

  it('fails on a missing field', () => {
    const { errors } = buildContent(contentDir({ 'world/village_names.yaml': '- id: a_town\n' }));
    expect(errors.join('\n')).toMatch(/name/);
  });

  it('fails on a wrong type', () => {
    const dir = contentDir({ 'world/village_names.yaml': '- id: a_town\n  name: A\n  weight: heavy\n' });
    expect(buildContent(dir).errors.join('\n')).toMatch(/weight/);
  });

  it('fails on an unknown field', () => {
    const dir = contentDir({ 'world/village_names.yaml': '- id: a_town\n  name: A\n  colour: red\n' });
    expect(buildContent(dir).errors.join('\n')).toMatch(/colour/);
  });

  it('fails on a bad id', () => {
    const dir = contentDir({ 'world/village_names.yaml': '- id: Bad-Id\n  name: A\n' });
    expect(buildContent(dir).errors.join('\n')).toMatch(/id/);
  });

  it('fails on a reversed depth range', () => {
    const dir = contentDir({ 'world/village_names.yaml': '- id: a_town\n  name: A\n  depth: [9, 2]\n' });
    expect(buildContent(dir).errors.join('\n')).toMatch(/depth/);
  });

  it('fails on a duplicate id within a table', () => {
    const dir = contentDir({
      'world/village_names.yaml': '- id: a_town\n  name: A\n- id: a_town\n  name: B\n',
    });
    expect(buildContent(dir).errors.join('\n')).toMatch(/duplicate id "a_town"/);
  });

  it('fails on a duplicate id across tables', () => {
    const dir = contentDir({
      'world/village_names.yaml': '- id: shared\n  name: A\n',
      'creatures/monsters.yaml':
        '- id: shared\n  name: rat\n  glyph: r\n  colour: moss\n  rating: 1d4+0\n  behaviour: stub\n',
    });
    expect(buildContent(dir).errors.join('\n')).toMatch(/duplicate id "shared"/);
  });

  it('fails on a table with no schema', () => {
    const dir = contentDir({ 'world/mystery.yaml': '- id: x\n' });
    expect(buildContent(dir).errors.join('\n')).toMatch(/no schema for table "mystery"/);
  });

  it('fails on invalid YAML and on a non-list file', () => {
    expect(buildContent(contentDir({ 'world/village_names.yaml': 'a: [' })).errors.join('\n')).toMatch(
      /invalid YAML/,
    );
    expect(buildContent(contentDir({ 'world/village_names.yaml': 'a: 1' })).errors.join('\n')).toMatch(
      /must be a list/,
    );
  });
});
