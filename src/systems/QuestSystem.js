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
      quests.push(this._generateQuest(playerLevel));
    }
    return quests;
  }

  _generateQuest(playerLevel) {
    const type     = this.rng.weightedPick([
      { value: 'kill',    weight: 30 },
      { value: 'fetch',   weight: 25 },
      { value: 'explore', weight: 20 },
      { value: 'clear',   weight: 15 },
      { value: 'rescue',  weight: 10 },
    ]);
    const depth    = this.rng.int(playerLevel, playerLevel + 3);
    const template = QUEST_TEMPLATES[type];
    return template.generate(depth, this.rng);
  }

  checkCompletion(quest, player, worldState) {
    return quest.completionCondition(quest.state, player, worldState);
  }

  completeQuest(quest, player) {
    player.gainXP(quest.reward.xp);
    player.gold += quest.reward.gold;
    if (quest.reward.item) player.addToInventory(Item.create(quest.reward.item));
    this.active = this.active.filter(q => q !== quest);
    this.completed.push({ ...quest, completedAt: Date.now() });
  }
}
