import { describe, expect, it } from 'vitest';
import { SaveError, serialise, toSave } from '../src/game/save.ts';
import { CURRENT, type KeyValueStore, MemoryStore, SaveSlot } from '../src/game/store.ts';
import { townRun } from './helpers.ts';

const saveOf = (seed: number, coins = 0) => toSave({ run: townRun(seed, { coins }), contentVersion: 'v', now: new Date('2026-10-01T00:00:00Z') });

/** A store that fails when told to, as a crash would: after N more successful operations of the kind. */
class Flaky extends MemoryStore implements KeyValueStore {
  failOn: { op: 'set' | 'delete'; key: RegExp } | undefined;
  override async set(key: string, value: string): Promise<void> {
    if (this.failOn?.op === 'set' && this.failOn.key.test(key)) throw new Error('crash');
    return super.set(key, value);
  }
  override async delete(key: string): Promise<void> {
    if (this.failOn?.op === 'delete' && this.failOn.key.test(key)) throw new Error('crash');
    return super.delete(key);
  }
}

describe('Spec 09: the one save slot and safe writes', () => {
  it('there is no save until one is written, and a written save reads back', async () => {
    const slot = new SaveSlot(new MemoryStore());
    expect(await slot.exists()).toBe(false);
    expect(await slot.read()).toBeUndefined();
    await slot.write(saveOf(1, 10));
    expect(await slot.exists()).toBe(true);
    expect((await slot.read())!.player.coins).toBe(10);
  });

  it('a new save replaces the old one: there is one slot, and the old record is removed', async () => {
    const store = new MemoryStore();
    const slot = new SaveSlot(store);
    await slot.write(saveOf(1, 1));
    await slot.write(saveOf(1, 2));
    await slot.write(saveOf(1, 3));
    expect((await slot.read())!.player.coins).toBe(3);
    expect([...store.data.keys()].filter((k) => k !== CURRENT)).toHaveLength(1);
  });

  it('a crash while writing the new record leaves the previous save loadable', async () => {
    const store = new Flaky();
    const slot = new SaveSlot(store);
    await slot.write(saveOf(1, 1));
    store.failOn = { op: 'set', key: /^save-/ };
    await expect(slot.write(saveOf(1, 2))).rejects.toThrow('crash');
    store.failOn = undefined;
    expect((await slot.read())!.player.coins).toBe(1);
  });

  it('a crash after the record is written but before it is marked current leaves the previous save current', async () => {
    const store = new Flaky();
    const slot = new SaveSlot(store);
    await slot.write(saveOf(1, 1));
    store.failOn = { op: 'set', key: new RegExp(`^${CURRENT}$`) };
    await expect(slot.write(saveOf(1, 2))).rejects.toThrow('crash');
    store.failOn = undefined;
    expect((await slot.read())!.player.coins).toBe(1);
    // The orphan is overwritten by the next write.
    await slot.write(saveOf(1, 3));
    expect((await slot.read())!.player.coins).toBe(3);
    expect([...store.data.keys()].filter((k) => k !== CURRENT)).toHaveLength(1);
  });

  it('a crash while removing the old record leaves the new save current', async () => {
    const store = new Flaky();
    const slot = new SaveSlot(store);
    await slot.write(saveOf(1, 1));
    store.failOn = { op: 'delete', key: /^save-/ };
    await expect(slot.write(saveOf(1, 2))).rejects.toThrow('crash');
    store.failOn = undefined;
    expect((await slot.read())!.player.coins).toBe(2);
  });

  it('the first write that crashes leaves no save at all, not a broken one', async () => {
    const store = new Flaky();
    const slot = new SaveSlot(store);
    store.failOn = { op: 'set', key: new RegExp(`^${CURRENT}$`) };
    await expect(slot.write(saveOf(1))).rejects.toThrow('crash');
    expect(await slot.exists()).toBe(false);
  });

  it('a corrupt current record is reported as unreadable rather than loaded', async () => {
    const store = new MemoryStore();
    const slot = new SaveSlot(store);
    await slot.write(saveOf(1));
    await store.set('save-1', '{"half a sa');
    await expect(slot.read()).rejects.toBeInstanceOf(SaveError);
  });

  it('clearing browser data removes the save', async () => {
    const slot = new SaveSlot(new MemoryStore());
    await slot.write(saveOf(1));
    await slot.clear();
    expect(await slot.exists()).toBe(false);
  });
});

describe('Spec 09: export and import', () => {
  it('the save exports as text and imports into another browser', async () => {
    const a = new SaveSlot(new MemoryStore());
    await a.write(saveOf(8, 77));
    const text = (await a.exportText())!;
    const b = new SaveSlot(new MemoryStore());
    const imported = await b.importText(text);
    expect(imported.player.coins).toBe(77);
    expect((await b.read())!.seed).toBe(8);
  });

  it('there is nothing to export before the first save', async () => {
    expect(await new SaveSlot(new MemoryStore()).exportText()).toBeUndefined();
  });

  it('an import that cannot be read, or comes from a newer game, is refused and the existing save is untouched', async () => {
    const slot = new SaveSlot(new MemoryStore());
    await slot.write(saveOf(1, 5));
    await expect(slot.importText('garbage')).rejects.toBeInstanceOf(SaveError);
    await expect(slot.importText(JSON.stringify({ ...saveOf(2), format: 99 }))).rejects.toThrow('newer version');
    expect((await slot.read())!.player.coins).toBe(5);
    expect(serialise(saveOf(1, 5)).length).toBeGreaterThan(0);
  });
});
