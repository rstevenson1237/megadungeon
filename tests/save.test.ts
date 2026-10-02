import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { creature } from '../src/game/monsters.ts';
import { Run } from '../src/game/run.ts';
import { MIGRATIONS, SAVE_FORMAT, SaveError, SUPPORTED_GENERATORS, packMonster, packRuns, parseSave, restoreRun, serialise, toSave, unpackMonster, unpackRuns } from '../src/game/save.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { classById } from '../src/rules/character/classes.ts';
import { GENERATOR_VERSION } from '../src/rules/world/level.ts';
import { CONTENT, ITEMS, SPELLS, content, gear, magic, townRun } from './helpers.ts';

const meta = (save: ReturnType<typeof toSave>) => ({ ...save, savedAt: '' });
const rebuild = (run: Run, text: string): Run => {
  const save = parseSave(text);
  return restoreRun(save, runOptionsFor(content().bundle, save.seed), classById(content().bundle, 'thief'));
};

describe('Spec 09: packing', () => {
  it('explored cells pack to runs and unpack to the same cells', () => {
    for (const bits of [[], [0], [1], [0, 0, 1, 1, 1, 0, 1], [1, 1, 0, 0], Array.from({ length: 500 }, (_, i) => (i % 7 < 3 ? 1 : 0))]) {
      expect(unpackRuns(packRuns(bits))).toEqual(bits);
    }
    expect(packRuns(new Array<number>(6000).fill(1))).toEqual([0, 6000]);
  });

  it('a monster packs to what differs from a fresh one and unpacks to the same monster, wounds and all', () => {
    const m = creature({ id: 4, name: 'goblin', glyph: 'g', colour: 0x7fc75a, x: 5, y: 6, dice: 3, modifier: 1 });
    m.dice = 1;
    m.awareness = 'alert';
    m.fleeing = true;
    m.x = 9;
    m.statuses.push({ id: 'slowed', rounds: 3, clock: 0 });
    m.quest = 'quest_0_1';
    const packed = packMonster(m);
    expect(unpackMonster(JSON.parse(JSON.stringify(packed)))).toEqual(m);
    expect(Object.keys(packed).length).toBeLessThan(Object.keys(m).length);
    const plain = creature({ id: 1, name: 'rat', glyph: 'r', colour: 0, x: 2, y: 2, dice: 1, modifier: 0 });
    expect(Object.keys(packMonster(plain)).sort()).toEqual(['colour', 'dice', 'glyph', 'id', 'modifier', 'name', 'x', 'y']);
    expect(unpackMonster(packMonster(plain))).toEqual(plain);
  });
});

describe('Spec 09: what a save holds', () => {
  it('records the three versions, the seed, the village of the last rest, the character and what they own', () => {
    const run = townRun(77, { coins: 12, pack: [gear('mace', 'fine'), magic('potion_cure')] });
    run.player.town.bank = 345;
    run.player.known.push('potion_cure');
    run.player.journal.push({ depth: 3, kind: 'sign', id: 's', text: 'a sign' });
    const save = toSave({ run, contentVersion: 'abc123', now: new Date('2026-10-01T12:00:00Z') });
    expect(save).toMatchObject({ format: SAVE_FORMAT, generator: GENERATOR_VERSION, content: 'abc123', seed: 77, depth: 0, savedAt: '2026-10-01T12:00:00.000Z' });
    expect(save.player.name).toBe('Mara');
    expect(save).not.toHaveProperty('character');
    expect(save.player.town.bank).toBe(345);
    expect(save.player.known).toEqual(['potion_cure']);
    expect(save.player.journal).toHaveLength(1);
    expect(save.player.pack).toHaveLength(2);
    // The run layout, level geometry and disguise names are not stored.
    const text = serialise(save);
    expect(text).not.toContain('"tiles"');
    expect(text).not.toContain('disguise');
    expect(text).not.toContain('"layout"');
  });

  it('a game is saved only in a village', () => {
    const run = townRun(77);
    while (run.inVillage) run.travel('down');
    expect(run.inVillage).toBe(false);
    expect(() => toSave({ run, contentVersion: 'x' })).toThrow('only in a village');
  });

  it('a save is a snapshot: later play does not change it', () => {
    const run = townRun(77, { coins: 5 });
    const save = toSave({ run, contentVersion: 'x' });
    run.player.coins = 900;
    run.player.town.bank = 1;
    expect(save.player.coins).toBe(5);
    expect(save.player.town.bank).toBe(20);
  });
});

/** A run that has been played: levels visited with doors opened, monsters killed and hurt, chests looted, then rested in a village. */
function playedRun(): Run {
  const run = townRun(2024, { coins: 400 });
  run.player.town.bank = 5000;
  run.travel('down'); // level 1
  const game = run.game!;
  game.state.map.exploration.explored.fill(1);
  game.state.map.exploration.explored[3] = 0;
  const [first, second] = game.state.monsters;
  if (first) first.dice = Math.max(1, first.dice - 1);
  if (second) game.state.monsters.splice(game.state.monsters.indexOf(second), 1);
  game.state.looted.features.push(0);
  game.state.revealed.push(5);
  game.state.used.features[0] = { done: true, left: [] };
  run.player.known.push('potion_healing');
  run.player.journal.push({ depth: 1, kind: 'sign', id: 'x', text: 'Beware.' });
  run.player.statuses.push({ id: 'cursed', rounds: null, clock: 0 });
  run.travel('up');
  run.town.take(run.town.board()[0]!.quest.id);
  run.town.rumour();
  return run;
}

describe('Spec 09: save and reload', () => {
  it('a saved and reloaded run is identical: every delta, quest, identified kind and journal entry matches', () => {
    const run = playedRun();
    const save = toSave({ run, contentVersion: 'v' });
    const back = rebuild(run, serialise(save));
    expect(meta(toSave({ run: back, contentVersion: 'v' }))).toEqual(meta(save));
    expect(back.deltas[1]!.explored).toEqual(run.deltas[1]!.explored);
    expect(back.deltas[1]!.monsters).toEqual(run.deltas[1]!.monsters);
    expect(back.player.town.quests).toEqual(run.player.town.quests);
    expect(back.player.known).toEqual(['potion_healing']);
    expect(back.player.journal.map((e) => e.kind).sort()).toEqual(run.player.journal.map((e) => e.kind).sort());
    expect(back.depth).toBe(0);
    expect(back.inVillage).toBe(true);
    expect(back.round).toBe(run.round);
    expect(back.character.xp).toBe(run.character.xp);
  });

  it('the level the save returns to is rebuilt from the seed and replays its delta', () => {
    const run = playedRun();
    const back = rebuild(run, serialise(toSave({ run, contentVersion: 'v' })));
    back.travel('down');
    run.travel('down');
    expect(back.game!.state.monsters.map((m) => [m.id, m.dice, m.x, m.y])).toEqual(run.game!.state.monsters.map((m) => [m.id, m.dice, m.x, m.y]));
    expect(back.game!.state.map.exploration.explored).toEqual(run.game!.state.map.exploration.explored);
    expect(back.game!.state.looted.features).toEqual([0]);
    expect(back.game!.state.map.level.tiles).toEqual(run.game!.state.map.level.tiles);
  });

  it('the disguises of this run are the same after a reload, so an unidentified potion looks as it did', () => {
    const run = playedRun();
    const back = rebuild(run, serialise(toSave({ run, contentVersion: 'v' })));
    expect([...back.disguises]).toEqual([...run.disguises]);
  });

  it('an unreadable file is refused, not loaded', () => {
    expect(() => parseSave('not json')).toThrow(SaveError);
    expect(() => parseSave('{"hello": 1}')).toThrow('not a Megadungeon save');
    const damaged = JSON.stringify({ ...toSave({ run: townRun(1), contentVersion: 'v' }), player: undefined });
    expect(() => parseSave(damaged)).toThrow('no player');
  });
});

describe('Spec 09: versions and migration', () => {
  const save = () => toSave({ run: townRun(5), contentVersion: 'v' });

  it('a save from a newer game is refused with a clear message', () => {
    const text = JSON.stringify({ ...save(), format: SAVE_FORMAT + 1 });
    try {
      parseSave(text);
      throw new Error('should have been refused');
    } catch (error) {
      expect(error).toBeInstanceOf(SaveError);
      expect((error as SaveError).reason).toBe('newer');
      expect((error as SaveError).message).toContain('newer version of the game');
    }
  });

  it('a save built by a generator this build no longer has is refused', () => {
    expect(SUPPORTED_GENERATORS).toContain(GENERATOR_VERSION);
    const text = JSON.stringify({ ...save(), generator: Math.min(...SUPPORTED_GENERATORS) - 1 });
    expect(() => parseSave(text)).toThrow('no longer has');
  });

  it('a save from different content is refused before release, with a plain message and nothing changed (Addendum A)', () => {
    const text = JSON.stringify({ ...save(), content: 'old-tables' });
    try {
      parseSave(text, undefined, undefined, 'new-tables');
      throw new Error('should have been refused');
    } catch (error) {
      expect(error).toBeInstanceOf(SaveError);
      expect((error as SaveError).reason).toBe('content');
      expect((error as SaveError).message).toBe('This save was made with different game content and cannot be loaded by this version.');
    }
    expect(parseSave(text, undefined, undefined, 'old-tables').content).toBe('old-tables');
  });

  it('a format 1 save, with the character beside the player, loads as one record whose pools are the live ones', () => {
    const run = townRun(21, { combatStep: 8, combatDice: 1, combatMax: 3, skill: { step: 8, dice: 0, max: 2 }, magic: { step: 4, dice: 1, max: 1 } });
    run.player.xp = 4500;
    run.player.level = 3;
    run.player.minorAbilities.push('pack_mule', 'fence');
    run.player.waited = 4;
    const now = toSave({ run, contentVersion: 'v' });
    // Format 1 as task 2.13 wrote it: the player held the live pools, the wait count and the pack's size, and the
    // character beside it held level, XP, the minor abilities and a stale copy of the pools.
    const { pools, name, classId, level, xp, minorAbilities, waited, ...rest } = now.player;
    const v1 = {
      ...now,
      format: 1,
      character: { name, classId, level, xp, minorAbilities, waited: 0, pools: { combat: { step: 8, dice: 3, max: 3 }, skill: { step: 8, dice: 2, max: 2 }, magic: { step: 4, dice: 1, max: 1 } } },
      player: { ...rest, combatStep: 8, combatDice: 1, combatMax: 3, skill: pools.skill, magic: pools.magic, waited, packSlots: 16 },
    };
    const loaded = parseSave(JSON.stringify(v1));
    expect(loaded.format).toBe(SAVE_FORMAT);
    expect(loaded).not.toHaveProperty('character');
    expect(loaded.player).not.toHaveProperty('packSlots');
    expect(loaded.player).not.toHaveProperty('combatDice');
    expect(loaded.player.pools).toEqual({ combat: { step: 8, dice: 1, max: 3 }, skill: { step: 8, dice: 0, max: 2 }, magic: { step: 4, dice: 1, max: 1 } });
    expect([loaded.player.name, loaded.player.level, loaded.player.xp, loaded.player.minorAbilities, loaded.player.waited]).toEqual(['Mara', 3, 4500, ['pack_mule', 'fence'], 4]);
    expect(rebuild(run, JSON.stringify(v1)).player.pools.combat.dice).toBe(1);
  });

  it('a save from each earlier format version loads through its migrations, step by step', () => {
    // Pretend the format has moved on to 3: format 1 saves renamed a field at 2, and added one at 3.
    const steps: string[] = [];
    const migrations = {
      1: (d: Record<string, unknown>) => {
        steps.push('1->2');
        const { oldDepth, ...rest } = d as { oldDepth?: number } & Record<string, unknown>;
        return { ...rest, depth: oldDepth };
      },
      2: (d: Record<string, unknown>) => {
        steps.push('2->3');
        return { ...d, characterId: d.characterId ?? 'migrated' };
      },
    };
    const base = save();
    const v1 = { ...base, format: 1, oldDepth: 0, depth: undefined, characterId: undefined };
    const loaded = parseSave(JSON.stringify(v1), migrations, 3);
    expect(steps).toEqual(['1->2', '2->3']);
    expect(loaded.format).toBe(3);
    expect(loaded.depth).toBe(0);
    expect(loaded.characterId).toBe('migrated');
    const v2 = { ...base, format: 2, characterId: undefined };
    steps.length = 0;
    expect(parseSave(JSON.stringify(v2), migrations, 3).characterId).toBe('migrated');
    expect(steps).toEqual(['2->3']);
    expect(Object.keys(MIGRATIONS)).toEqual(['1', '2', '3', '4', '5']); // 1 to 2: one character record; 2 to 3: effects; 3 to 4: fights and Smite; 4 to 5: the companion; 5 to 6: the rival and weaknesses
  });

  it('a format 2 save: shrine buffs and artifacts keep a passive word, which becomes its effect (task 3.5)', () => {
    const run = townRun(77, { pack: [] });
    const now = toSave({ run, contentVersion: 'v' });
    const oldArtifact = { kind: 'artifact', uid: 9, id: 'stub_artifact_01', name: 'Stub Relic 01', value: 0, slot: 'ring', passive: 'search', cursed: false, identified: true };
    const { timed: _timed, ...player } = now.player;
    const v2 = {
      ...now,
      format: 2,
      player: { ...player, buffs: [{ passive: 'wait', amount: 8 }, { passive: 'stealth' }], equipment: { ring1: { ...oldArtifact, passive: 'melee', amount: 2 } }, pack: [oldArtifact] },
    };
    const loaded = parseSave(JSON.stringify(v2));
    expect(loaded.format).toBe(SAVE_FORMAT);
    expect(loaded.player.buffs).toEqual([{ effect: 'wait_rounds', amount: 8 }, { effect: 'stealth' }]);
    expect(loaded.player.equipment.ring1).toMatchObject({ kind: 'artifact', effect: { effect: 'melee', amount: 2 } });
    expect(loaded.player.equipment.ring1).not.toHaveProperty('passive');
    expect(loaded.player.pack[0]).toMatchObject({ effect: { effect: 'advantage', rolls: 'search' } });
    expect(loaded.player.timed).toEqual([]);
  });

  it('a format 3 save has no fight and no readied Smite, and loads with neither (task 3.6)', () => {
    const now = toSave({ run: townRun(77, { pack: [] }), contentVersion: 'v' });
    const { fight: _fight, smite: _smite, ...player } = now.player;
    const loaded = parseSave(JSON.stringify({ ...now, format: 3, player }));
    expect([loaded.format, loaded.player.fight, loaded.player.smite]).toEqual([SAVE_FORMAT, null, false]);
  });

  it('a format 4 save has no companion record, and loads with a living, unhurt one (task 3.8)', () => {
    const now = toSave({ run: townRun(77, { pack: [] }), contentVersion: 'v' });
    const { companion: _companion, ...player } = now.player;
    const loaded = parseSave(JSON.stringify({ ...now, format: 4, player }));
    expect([loaded.format, loaded.player.companion]).toEqual([SAVE_FORMAT, { hurt: 0, dead: false }]);
  });

  it('a format 5 save has no rival or weakness record, and loads with none (task 3.10)', () => {
    const now = toSave({ run: townRun(77, { pack: [] }), contentVersion: 'v' });
    const { rivals: _rivals, weaknesses: _weaknesses, ...player } = now.player;
    const loaded = parseSave(JSON.stringify({ ...now, format: 5, player }));
    expect([loaded.format, loaded.player.rivals, loaded.player.weaknesses]).toEqual([6, {}, []]);
  });

  it('a hurt or dead companion is kept by the save', () => {
    const run = townRun(77, { pack: [], abilities: ['companion'] });
    run.player.companion = { hurt: 1, dead: true };
    expect(parseSave(serialise(toSave({ run, contentVersion: 'v' }))).player.companion).toEqual({ hurt: 1, dead: true });
  });

  it('a format with a missing migration is refused rather than guessed at', () => {
    const v1 = { ...save(), format: 1 };
    expect(() => parseSave(JSON.stringify(v1), {}, 2)).toThrow('No way to upgrade');
  });
});

describe('Spec 09: size', () => {
  it('a full 100-level run, every level explored and every monster alive, stays under 1 MB', () => {
    const run = townRun(31337, {}, 0);
    for (let depth = 1; depth <= 100; depth++) {
      if (run.villages.includes(depth)) continue;
      const level = run.peek(depth);
      const game = new Game(run.runSeed, level, run.player, { spells: SPELLS, items: ITEMS, content: CONTENT });
      game.state.map.exploration.explored.fill(1);
      for (const m of game.state.monsters) {
        m.awareness = 'alert';
        m.dice = Math.max(1, m.dice - 1);
      }
      run.deltas[depth] = game.captureDelta();
    }
    const text = serialise(toSave({ run, contentVersion: 'v' }));
    expect(Object.keys(run.deltas).length).toBeGreaterThanOrEqual(94);
    expect(text.length).toBeLessThan(1_000_000);
    // And it reads back.
    expect(Object.keys(parseSave(text).deltas)).toHaveLength(Object.keys(run.deltas).length);
  }, 120_000);
});
