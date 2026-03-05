import { QUEST_TEMPLATES } from '../data/quests.js';
import { Item } from '../entities/Item.js';

/**
 * Procedurally generates quests and tracks completion.
 * Quest types:
 *   'fetch'      — Retrieve specific item from specific level
 *   'kill'       — Kill N of monster type
 *   'clear'      — Clear all monsters from target level
 *   'explore'    — Reach target depth for first time
 *   'rescue'     — Find and return NPC captive
 *   'escort'     — Escort NPC from town to level without them dying
 */
export class QuestSystem {
  constructor(worldMap, rng) {
    this.world = worldMap;
    this.rng   = rng;
    this.active = [];
    this.completed = [];
  }

  generateQuestBoard(playerLevel) {
    const quests = [];
    for (let i = 0; i < 6; i++) {
      const quest = this._generateQuest(playerLevel);
      if(quest) quests.push(quest);
    }
    // For now, just assign to the guild board in town data
    this.world.townState.guild_board_quests = quests;
    return quests;
  }

  _generateQuest(playerLevel) {
    const type = this.rng.weightedPick([
      { value: 'kill',    weight: 30 },
      { value: 'fetch',   weight: 25 },
      { value: 'explore', weight: 20 },
      { value: 'clear',   weight: 15 },
      { value: 'rescue',  weight: 10 },
    ]);
    const depth    = this.rng.int(playerLevel, playerLevel + 3);
    const template = QUEST_TEMPLATES[type];
    if(template) {
        return template.generate(depth, this.rng);
    }
    return null;
  }

  checkCompletion(quest, player, worldState) {
    if(!quest) return false;
    return quest.completionCondition(quest.state, player, worldState);
  }

  completeQuest(quest, player) {
    if(!quest) return;
    player.gainXP(quest.reward.xp || 0);
    player.gold += quest.reward.gold || 0;
    if (quest.reward.item) player.addToInventory(Item.create(quest.reward.item));
    this.active = this.active.filter(q => q !== quest);
    this.completed.push({ ...quest, completedAt: Date.now() });
  }

  serialize() {
    return {
      active: this.active,
      completed: this.completed,
    };
  }

  static deserialize(data, worldMap, rng) {
    const qs = new QuestSystem(worldMap, rng);
    qs.active    = data?.active    ?? [];
    qs.completed = data?.completed ?? [];
    return qs;
  }
}
