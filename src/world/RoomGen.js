/**
 * Populates a room with content based on level depth, theme, and room type.
 * Uses a weighted random system to determine content category, then
 * instantiates specific content within the room boundaries.
 * 
 * ROOM CONTENT CATEGORIES (one chosen per room):
 *   'empty'        — Purely atmospheric, maybe dressing
 *   'monsters'     — Monster group + possible treasure
 *   'treasure'     — Guarded or unguarded loot cache
 *   'trap'         — One or more traps, possibly treasure bait
 *   'puzzle'       — An environmental puzzle
 *   'lore'         — Inscription, library, shrine with story content
 *   'shop'         — Rare wandering merchant room (deep levels)
 *   'shrine'       — Altar: boon or curse
 *   'hazard'       — Environmental danger (lava, gas, collapsing floor)
 */
export class RoomGen {
  constructor(levelNumber, rng, theme) {
    this.level = levelNumber;
    this.rng   = rng;
    this.theme = theme;
    this.difficulty = this._computeDifficulty(levelNumber);
  }

  populate(map, room) {
    const category = this._rollCategory(room);
    room.content = category;
    switch (category) {
      case 'empty':    this._dressRoom(map, room); break;
      case 'monsters': this._placeMonsterGroup(map, room); break;
      case 'treasure': this._placeTreasure(map, room); break;
      case 'trap':     this._placeTrap(map, room); break;
      case 'puzzle':   this._placePuzzle(map, room); break;
      case 'lore':     this._placeLore(map, room); break;
      case 'shrine':   this._placeShrine(map, room); break;
      case 'hazard':   this._placeHazard(map, room); break;
    }
  }

  _rollCategory(room) {
    // Weights shift with depth: more traps/hazards deeper, more lore/puzzles mid-range
    const weights = [
      { value: 'empty',    weight: 20 },
      { value: 'monsters', weight: 35 },
      { value: 'treasure', weight: 15 },
      { value: 'trap',     weight: 10 + this.difficulty * 2 },
      { value: 'puzzle',   weight: 8 },
      { value: 'lore',     weight: 7 },
      { value: 'shrine',   weight: 3 },
      { value: 'hazard',   weight: 2 + this.difficulty },
    ];
    return this.rng.weightedPick(weights);
  }

  _placeMonsterGroup(map, room) {
    const groupTemplate = MonsterGroups.roll(this.level, this.theme, this.rng);
    for (const entry of groupTemplate.members) {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
        const monster = Monster.create(entry.type, pos.x, pos.y, this.level);
        map.addEntity(monster);
      }
    }
    // Roll for incidental treasure
    if (this.rng.chance(groupTemplate.treasureChance)) {
      this._placeTreasure(map, room, 'small');
    }
  }

  // ... _placeTreasure, _placeTrap, _placePuzzle, _placeLore, _placeShrine, _placeHazard
  // Each follows the same pattern: consult data library, instantiate entities, place on map
}
