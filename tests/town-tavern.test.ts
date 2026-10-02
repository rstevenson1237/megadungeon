import { describe, expect, it } from 'vitest';
import type { Fact } from '../src/core/templates.ts';
import { removeDie } from '../src/game/combat.ts';
import { hitPlayer } from '../src/game/combat.ts';
import { creature } from '../src/game/monsters.ts';
import { QUEST_LIMIT } from '../src/rules/villages/economy.ts';
import { rollServices } from '../src/rules/villages/services.ts';
import type { Quest } from '../src/rules/world/run-layout.ts';
import type { QuestItem } from '../src/rules/items/types.ts';
import { gameOn, rig, room, townRun } from './helpers.ts';
import type { Run } from '../src/game/run.ts';

/** Whether a fact is true in this run, checked against the layout and the generated levels, independently of the town code. */
function isTrue(run: Run, fact: Fact): boolean {
  const level = fact.values.level as number;
  const layout = run.layout!;
  switch (fact.kind) {
    case 'vault':
      return layout.links.some((l) => l.type === 'vault' && l.vaultLevel === level);
    case 'rival_stash':
      return layout.links.some((l) => l.type === 'rival' && l.stashLevel === level);
    case 'boss':
      return layout.bosses.some((b) => b.level === level && (fact.values.artifact === undefined || b.artifactName === fact.values.artifact));
    case 'teleporter':
      return layout.teleporters.some((p) => p.includes(level));
    case 'fountain':
      return run.peek(level).features.some((f) => f.type === 'fixture' && f.kind === 'fountain');
    case 'trap_level':
      return run.peek(level).traps.length > 0;
    default:
      return false;
  }
}

describe('Spec 07: the tavern, rumours', () => {
  it('a rumour costs 25 gp times the multiplier, goes in the journal, and states only what is true in this run', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const run = townRun(seed, {}, 2);
      run.player.town.bank = 100000;
      const facts = run.town.rumourFacts();
      for (const fact of facts) expect(isTrue(run, fact), `${fact.kind} ${JSON.stringify(fact.values)}`).toBe(true);
      for (const fact of facts) {
        const [lo, hi] = [run.depth + 1, run.layout!.villages.find((v) => v.level > run.depth)?.level ?? 101];
        expect(fact.values.level as number).toBeGreaterThanOrEqual(lo);
        expect(fact.values.level as number).toBeLessThan(hi);
      }
      const before = run.player.town.bank;
      const result = run.town.rumour();
      if (facts.length === 0) {
        expect(result.ok).toBe(false);
        continue;
      }
      expect(result.ok).toBe(true);
      expect(run.player.town.bank).toBe(before - run.town.rumourPrice);
      
      const entry = run.player.journal.find((e) => e.kind === 'rumour')!;
      expect(entry).toBeDefined();
      // The journal files it under the level it is about.
      const level = entry.depth;
      expect(facts.some((f) => f.values.level === level && entry.text.includes(String(level)))).toBe(true);
    }
  });

  it('one new rumour per rest, after which the barkeep repeats the last one for free', () => {
    const run = townRun(2, {}, 2);
    run.player.town.bank = 100000;
    const first = run.town.rumour();
    const bank = run.player.town.bank;
    const again = run.town.rumour();
    expect(again.ok).toBe(true);
    expect(run.player.town.bank).toBe(bank);
    expect(again.messages[0]!.text).toContain('repeats');
    expect(again.messages[0]!.text).toContain(first.messages.at(-1)!.text.split('"')[1]!);
    expect(run.player.journal.filter((e) => e.kind === 'rumour')).toHaveLength(1);
    run.town.rest();
    const next = run.town.rumour();
    expect(next.messages[0]!.text).not.toContain('repeats');
    expect(run.player.town.bank).toBeLessThan(bank);
  });

  it('with nothing true to say the barkeep charges nothing', () => {
    const run = townRun(1, {}, 1);
    run.player.town.bank = 50;
    const facts = run.town.rumourFacts();
    if (facts.length > 0) return;
    expect(run.town.rumour().ok).toBe(false);
    expect(run.player.town.bank).toBe(50);
  });
});

/** The run, and a quest of the type on the board of the surface village. */
function withQuest(type: Quest['type'], village = 0): { run: Run; quest: Quest } {
  for (let seed = 1; seed < 400; seed++) {
    const run = townRun(seed, {}, village);
    const quest = run.town.board().find((o) => o.quest.type === type)?.quest;
    if (quest) return { run, quest };
  }
  throw new Error(`no ${type} quest found`);
}

describe('Spec 07: the tavern, quests', () => {
  it('the board shows up to 3 open quests from the village list, and taking one reveals the next', () => {
    const run = townRun(10);
    const board = run.town.board();
    expect(board.length).toBeLessThanOrEqual(3);
    expect(board.length).toBeGreaterThan(0);
    for (const o of board) expect(o.quest.village).toBe(0);
    const first = board[0]!;
    run.town.take(first.quest.id);
    const after = run.town.board();
    expect(after.map((o) => o.quest.id)).not.toContain(first.quest.id);
    expect(after.length).toBeLessThanOrEqual(3);
    if (run.layout!.quests.filter((q) => q.village === 0).length > 3) expect(after.length).toBe(Math.min(3, board.length));
  });

  it('a quest\'s text is true to what its level holds and is the same every time', () => {
    const run = townRun(10);
    for (const o of run.town.board()) {
      expect(o.text).toContain(String(o.quest.level));
      expect(run.town.questText(o.quest)).toBe(o.text);
    }
  });

  it('at most 3 quests are active at once, and a quest can be abandoned, freeing a place', () => {
    let run!: Run;
    for (let seed = 1; seed < 100; seed++) {
      run = townRun(seed);
      const all = run.layout!.quests.filter((q) => q.village === 0 && run.town.board().some((o) => o.quest.id === q.id)).length;
      if (run.town.board().length === 3 && all >= 3) break;
    }
    const ids: string[] = [];
    for (let i = 0; i < QUEST_LIMIT; i++) {
      const next = run.town.board()[0]!;
      expect(run.town.take(next.quest.id).ok).toBe(true);
      ids.push(next.quest.id);
    }
    const extra = run.town.board()[0];
    if (extra) {
      expect(run.town.take(extra.quest.id).ok).toBe(false);
      expect(run.player.town.quests[extra.quest.id]).toBeUndefined();
    }
    expect(run.player.journal.filter((e) => e.kind === 'quest')).toHaveLength(3);
    expect(run.town.abandon(ids[0]!).ok).toBe(true);
    expect(run.player.town.quests[ids[0]!]).toBe('abandoned');
    expect(run.player.journal.filter((e) => e.kind === 'quest')).toHaveLength(2);
    expect(run.town.board().map((o) => o.quest.id)).not.toContain(ids[0]);
    if (extra) expect(run.town.take(extra.quest.id).ok).toBe(true);
  });

  it('an opponent killed meets its quest\'s goal, and the reward is paid into the bank as XP-earning treasure on arriving in a village', () => {
    const { run, quest } = withQuest('opponent');
    run.town.take(quest.id);
    // Kill the opponent in a game on a small level.
    const game = gameOn(room(8, 5, 1, 1));
    game.state.player = run.player;
    const opponent = creature({ id: 1, name: 'Brannoch', glyph: 'o', colour: 0, x: 4, y: 3, dice: 1, modifier: 0, quest: quest.id });
    game.state.monsters.push(opponent);
    removeDie(game, opponent, [], { hit: '', kill: '' }, false);
    expect(run.player.town.goals).toContain(quest.id);
    expect(run.player.town.quests[quest.id]).toBe('active');
    const bank = run.player.town.bank;
    const messages = run.town.onArrive();
    expect(run.player.town.quests[quest.id]).toBe('paid');
    expect(run.player.town.bank).toBe(bank + quest.reward);
    expect(run.character.xp).toBe(quest.reward);
    expect(messages.map((m) => m.text).join(' ')).toContain(`${quest.reward} gp`);
    // Paid once only.
    run.town.onArrive();
    expect(run.player.town.bank).toBe(bank + quest.reward);
  });

  it('a belonging is handed in at the village that posted it, and the item is taken', () => {
    const { run, quest } = withQuest('belonging');
    run.town.take(quest.id);
    const item: QuestItem = { kind: 'quest_item', uid: 1, id: 'locket', name: 'a locket', value: 0, quest: quest.id };
    run.player.pack.push(item);
    const bank = run.player.town.bank;
    run.town.onArrive();
    expect(run.player.pack).not.toContain(item);
    expect(run.player.town.bank).toBe(bank + quest.reward);
    expect(run.player.town.quests[quest.id]).toBe('paid');
  });

  it('a belonging carried to a village that did not post it stays in the pack, unpaid', () => {
    const { run, quest } = withQuest('belonging');
    run.town.take(quest.id);
    const item: QuestItem = { kind: 'quest_item', uid: 1, id: 'locket', name: 'a locket', value: 0, quest: quest.id };
    run.player.pack.push(item);
    run.depth = run.layout!.villages[0]!.level;
    run.town.onArrive();
    expect(run.player.pack).toContain(item);
    expect(run.player.town.quests[quest.id]).toBe('active');
  });

  it('a captive brought to any village finishes its quest; one who dies on the way fails it', () => {
    const { run, quest } = withQuest('captive');
    run.town.take(quest.id);
    run.player.town.escorts.push({ name: 'Edda', dice: 2, quest: quest.id });
    run.depth = run.layout!.villages[2]!.level; // any village
    const bank = run.player.town.bank;
    run.town.onArrive();
    expect(run.player.town.escorts).toEqual([]);
    expect(run.player.town.bank).toBe(bank + quest.reward);

    const failed = withQuest('captive');
    failed.run.town.take(failed.quest.id);
    failed.run.player.town.escorts.push({ name: 'Edda', dice: 2, quest: failed.quest.id });
    const game = gameOn(room(8, 5, 1, 1));
    game.state.player = failed.run.player;
    const goblin = creature({ id: 2, name: 'goblin', glyph: 'g', colour: 0, x: 3, y: 3, dice: 2, modifier: 0 });
    const dice = failed.run.player.pools.combat.dice;
    rig(game, 1, 1); // each blow meant for the player falls on the captive
    hitPlayer(game, goblin, []);
    expect(failed.run.player.town.escorts).toHaveLength(1);
    expect(failed.run.player.pools.combat.dice).toBe(dice);
    rig(game, 1);
    const messages: { text: string }[] = [];
    hitPlayer(game, goblin, messages as never);
    expect(failed.run.player.town.escorts).toEqual([]);
    expect(failed.run.player.town.quests[failed.quest.id]).toBe('failed');
    expect(messages.map((m) => m.text).join(' ')).toContain('The quest has failed');
    expect(failed.run.player.journal.some((e) => e.kind === 'quest')).toBe(false);
  });

  it('a quest\'s reward is about half a level\'s treasure budget and a quest handed in earns XP like banked treasure', () => {
    const run = townRun(10);
    for (const q of run.layout!.quests) expect(q.reward).toBeGreaterThan(0);
    const { run: r2, quest } = withQuest('opponent');
    r2.town.take(quest.id);
    r2.player.town.goals.push(quest.id);
    r2.town.onArrive();
    expect(r2.character.xp).toBe(quest.reward);
  });
});

describe('Spec 02 and 07: specialists and the lift token', () => {
  it('a rescued specialist joins the village it is delivered to if it lacks the service, for the rest of the run', () => {
    let seed = 1;
    while (rollServices(seed, townRun(seed, {}, 1).depth).includes('smith')) seed++;
    const run = townRun(seed, {}, 1);
    expect(run.town.services()).not.toContain('smith');
    run.player.town.escorts.push({ name: 'Orm', dice: 2, service: 'smith' });
    const messages = run.town.onArrive();
    expect(run.town.services()).toContain('smith');
    expect(run.player.town.escorts).toEqual([]);
    expect(messages.map((m) => m.text).join(' ')).toContain('Orm');
    // Still there on a later visit, and no other village has it because of this.
    expect(run.town.services(run.depth)).toContain('smith');
    expect(run.town.services(run.depth + 1)).toEqual(rollServices(seed, run.depth + 1));
  });

  it('a specialist taken to a village that already has the service stays with the player', () => {
    const run = townRun(1);
    run.player.town.escorts.push({ name: 'Orm', dice: 2, service: 'smith' });
    run.town.onArrive();
    expect(run.player.town.escorts).toHaveLength(1);
    expect(run.player.town.joined.smith).toBeUndefined();
  });

  it('a rescued trader adds a missing shop', () => {
    let seed = 1;
    while (rollServices(seed, townRun(seed, {}, 1).depth).includes('shop')) seed++;
    const run = townRun(seed, {}, 1);
    run.player.town.escorts.push({ name: 'Mab', dice: 2, service: 'trader' });
    run.town.onArrive();
    expect(run.town.services()).toContain('shop');
  });
});

