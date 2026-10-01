import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { ZodType } from 'zod';
import { tableSchemas, type ContentBundle } from '../src/core/schemas.ts';

export interface BuildResult {
  bundle: ContentBundle;
  errors: string[];
}

function yamlFiles(dir: string): string[] {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return yamlFiles(path);
      return ['.yaml', '.yml'].includes(extname(name)) ? [path] : [];
    });
}

/**
 * Reads every YAML table under `contentDir`, checks it, and returns the bundle
 * with a list of errors. One file per table; the file name is the table name.
 * Checks: schema (missing, mistyped and unknown fields) and id uniqueness
 * across the whole bundle (Spec 08, "Validation and coverage").
 */
export function buildContent(contentDir: string): BuildResult {
  const errors: string[] = [];
  const tables: Record<string, unknown[]> = {};
  const seenIds = new Map<string, string>();

  for (const file of yamlFiles(contentDir)) {
    const where = relative(contentDir, file);
    const table = basename(file, extname(file));
    const schema = (tableSchemas as Record<string, ZodType>)[table];
    if (!schema) {
      errors.push(`${where}: no schema for table "${table}"`);
      continue;
    }
    if (table in tables) {
      errors.push(`${where}: table "${table}" is defined in more than one file`);
      continue;
    }

    let data: unknown;
    try {
      data = parse(readFileSync(file, 'utf8'));
    } catch (err) {
      errors.push(`${where}: invalid YAML: ${(err as Error).message}`);
      continue;
    }
    if (!Array.isArray(data)) {
      errors.push(`${where}: a table file must be a list of entries`);
      continue;
    }

    const entries: unknown[] = [];
    data.forEach((raw, index) => {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path.length ? ` ${issue.path.join('.')}` : '';
          errors.push(`${where} entry ${index + 1}:${field} ${issue.message}`);
        }
        return;
      }
      const id = (parsed.data as { id: string }).id;
      const first = seenIds.get(id);
      if (first) {
        errors.push(`${where} entry ${index + 1}: duplicate id "${id}" (first used in ${first})`);
        return;
      }
      seenIds.set(id, where);
      entries.push(parsed.data);
    });
    tables[table] = entries;
  }

  return { bundle: { tables }, errors };
}

function main(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const checkOnly = process.argv.includes('--check');
  const { bundle, errors } = buildContent(join(root, 'content'));

  if (errors.length > 0) {
    console.error(`Content check failed with ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  const summary = Object.entries(bundle.tables)
    .map(([name, rows]) => `${name}: ${rows.length}`)
    .join(', ');
  if (checkOnly) {
    console.log(`Content check passed (${summary}).`);
    return;
  }
  const out = join(root, 'src', 'generated', 'content-bundle.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(bundle));
  console.log(`Content built to ${relative(root, out)} (${summary}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
