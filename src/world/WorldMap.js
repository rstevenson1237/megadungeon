/**
 * Represents the full dungeon as a stack of levels.
 * Levels are generated lazily (only when the player first visits).
 * 
 * Level 1–5:   Upper Dungeon (Goblin Warrens, Dungeon Cellars)
 * Level 6–10:  Middle Dungeon (Underhalls, Catacombs)
 * Level 11–15: Deep Dungeon (Dwarven Deeps, Elemental Grottos)
 * Level 16–20: The Mythic Underworld (Demon Warrens, Void Passages)
 */
export class WorldMap {
  constructor(masterSeed) {
    this.masterSeed = masterSeed;
    this.levels = new Map();   // levelNumber → TileMap
    this.townState = createInitialTownState();
  }

  getLevel(n) {
    if (!this.levels.has(n)) {
      const levelSeed = new RNG(this.masterSeed).fork(n * 997);
      this.levels.set(n, LevelGen.generate(n, levelSeed));
    }
    return this.levels.get(n);
  }

  serialize() {
    return {
      masterSeed: this.masterSeed,
      town: this.townState,
      levels: [...this.levels.entries()].map(([n, l]) => [n, l.serialize()])
    };
  }

  static deserialize(data) {
    const wm = new WorldMap(data.masterSeed);
    wm.townState = data.town;
    for (const [n, lData] of data.levels) {
      wm.levels.set(n, TileMap.deserialize(lData));
    }
    return wm;
  }
}
