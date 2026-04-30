import { QUEST_TEMPLATES } from '../data/quests.js';
import { Item } from '../entities/Item.js';

/**
 * Quest types:
 *   kill     — kill N of a specific monster type
 *   bounty   — kill any N monsters on a specific level
 *   fetch    — recover a specific item
 *   tribute  — return to surface having earned N gold since accepting
 *   explore  — reach a target depth for the first time
 *   clear    — eliminate every monster on a target level
 *   rescue   — find the captive NPC spawned on the target level and return to surface
 */
export class QuestSystem {
  constructor(worldMap, rng) {
    this.world  = worldMap;
    this.rng    = rng;
    this.active    = [];
    this.completed = [];
  }

  generateQuestBoard(playerLevel) {
    const quests = [];
    const seen   = new Set();   // dedup key: type + '/' + target-or-depth
    let attempts = 0;
    while (quests.length < 6 && attempts < 40) {
      attempts++;
      const quest = this._generateQuest(playerLevel);
      if (!quest) continue;
      const key = `${quest.type}/${quest.target ?? quest.targetDepth ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      quests.push(quest);
    }
    this.world.townState.guild_board_quests = quests;
    return quests;
  }

  _generateQuest(playerLevel) {
    const type = this.rng.weightedPick([
      { value: 'kill',    weight: 25 },
      { value: 'bounty',  weight: 20 },
      { value: 'fetch',   weight: 15 },
      { value: 'explore', weight: 10 },
      { value: 'clear',   weight: 10 },
      { value: 'rescue',  weight: 10 },
      { value: 'tribute', weight: 10 },
    ]);
    const depth    = this.rng.int(Math.max(1, playerLevel), playerLevel + 3);
    const template = QUEST_TEMPLATES[type];
    return template ? template.generate(depth, this.rng) : null;
  }

  // Pass quest as 4th arg so completionConditions can reference self.field safely.
  checkCompletion(quest, player, worldState) {
    if (!quest) return false;
    return quest.completionCondition(quest.state, player, worldState, quest);
  }

  abandonQuest(quest) {
    this.active = this.active.filter(q => q !== quest);
  }

  completeQuest(quest, player) {
    if (!quest) return;
    player.gainXP(quest.reward.xp || 0);
    player.gold += quest.reward.gold || 0;
    if (quest.reward.item) player.addToInventory(Item.create(quest.reward.item));
    this.active = this.active.filter(q => q !== quest);
    this.completed.push({ ...quest, completedAt: Date.now() });
  }

  serialize() {
    return { active: this.active, completed: this.completed };
  }

  static deserialize(data, worldMap, rng) {
    const qs = new QuestSystem(worldMap, rng);
    qs.active    = (data?.active    ?? []).map(q => QuestSystem._hydrateQuest(q));
    qs.completed = (data?.completed ?? []).map(q => QuestSystem._hydrateQuest(q));
    return qs;
  }

  // Re-attach the completionCondition closure from stored quest data.
  // Uses top-level quest fields (self.count, self.required, etc.) so it doesn't
  // depend on re-running generate() with a fragile dummy RNG.
  static _hydrateQuest(q) {
    switch (q.type) {
      case 'kill':
        q.completionCondition = (s, _p, _w, self) => s.killed >= self.count;
        break;
      case 'bounty':
        q.completionCondition = (s, _p, _w, self) => s.killed >= self.count;
        break;
      case 'fetch':
        q.completionCondition = (s) => s.recovered;
        break;
      case 'tribute':
        q.completionCondition = (s, player, _w, self) =>
          s.baseGold !== null && (player.gold - s.baseGold) >= self.required;
        break;
      case 'explore':
        q.completionCondition = (_s, player, _w, self) => player.depth >= self.targetDepth;
        break;
      case 'clear':
        q.completionCondition = (_s, _p, world, self) => {
          const map = world.getLevel(self.targetDepth);
          if (!map) return false;
          return ![...map.entities.values()].flat().some(e => e.type === 'monster');
        };
        break;
      case 'rescue':
        q.completionCondition = (s) => s.returned;
        break;
      default:
        q.completionCondition = () => false;
    }
    return q;
  }
}
