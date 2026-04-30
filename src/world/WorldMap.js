/**
 * Represents the full dungeon as a stack of levels.
 * Levels are generated lazily (only when the player first visits).
 * 
 * Level 1–5:   Upper Dungeon (Goblin Warrens, Dungeon Cellars)
 * Level 6–10:  Middle Dungeon (Underhalls, Catacombs)
 * Level 11–15: Deep Dungeon (Dwarven Deeps, Elemental Grottos)
 * Level 16–20: The Mythic Underworld (Demon Warrens, Void Passages)
 */

import { createInitialTownState } from '../data/town.js';
import { isDungeonTownLevel } from '../data/dungeonTowns.js';
import { RNG } from '../engine/RNG.js';
import { LevelGen } from './LevelGen.js';
import { TileMap } from './TileMap.js';

export class WorldMap {
  constructor(masterSeed) {
    this.masterSeed = masterSeed;
    this.levels = new Map();       // levelNumber → TileMap
    this.townState = createInitialTownState();
    this.runeRegistry = new Map(); // destLevel → [{fromLevel}]
  }

  getLevel(n) {
    if (isDungeonTownLevel(n)) return null;
    if (!this.levels.has(n)) {
      const levelSeed = new RNG(this.masterSeed).fork(n * 997);
      const map = LevelGen.generate(n, levelSeed);
      this.levels.set(n, map);
      this._processRuneRegistrations(n, map);
    }
    return this.levels.get(n);
  }

  // After generating level n, wire up rune pairings in both directions.
  _processRuneRegistrations(n, map) {
    // Snapshot so injected return runes don't re-register themselves.
    const generated = [...(map.metadata.runes ?? [])];

    // Register each outgoing rune; if dest already exists, inject immediately.
    for (const rune of generated) {
      const dest = rune.destLevel;
      if (!this.runeRegistry.has(dest)) this.runeRegistry.set(dest, []);
      this.runeRegistry.get(dest).push({ fromLevel: n });
      if (this.levels.has(dest)) {
        const rng = new RNG(this.masterSeed).fork(dest * 997 + n * 1009);
        this._injectReturnRune(this.levels.get(dest), n, rng);
      }
    }

    // Apply any return runes that were waiting for this level to generate.
    for (const { fromLevel } of (this.runeRegistry.get(n) ?? [])) {
      const rng = new RNG(this.masterSeed).fork(n * 997 + fromLevel * 1009);
      this._injectReturnRune(map, fromLevel, rng);
    }
    this.runeRegistry.delete(n);
  }

  // Place a return rune on `map` pointing back to `backToLevel`, if not already present.
  _injectReturnRune(map, backToLevel, rng) {
    if ((map.metadata.runes ?? []).some(r => r.destLevel === backToLevel)) return;
    const pos = this._findRuneSlot(map, rng);
    if (!pos) return;
    const tile = map.get(pos.x, pos.y);
    tile.features.rune = { destLevel: backToLevel };
    tile.glyph = 0xF0;
    tile.fg    = '#8844cc';
    tile.solid = false;
    if (!map.metadata.runes) map.metadata.runes = [];
    map.metadata.runes.push({ x: pos.x, y: pos.y, destLevel: backToLevel });
  }

  _findRuneSlot(map, rng) {
    for (let a = 0; a < 100; a++) {
      const x = rng.int(1, map.w - 2);
      const y = rng.int(1, map.h - 2);
      const t = map.get(x, y);
      if (t && !t.solid && t.type === 'floor' && !t.features.dungeon && !t.features.rune) {
        return { x, y };
      }
    }
    return null;
  }

  serialize() {
    return {
      masterSeed: this.masterSeed,
      town: this.townState,
      levels: [...this.levels.entries()]
        .filter(([n]) => !isDungeonTownLevel(n))
        .map(([n, l]) => [n, l.serialize()]),
      runeRegistry: [...this.runeRegistry.entries()],
    };
  }

  static deserialize(data) {
    const wm = new WorldMap(data.masterSeed);
    wm.townState = data.town;
    for (const [n, lData] of data.levels) {
      wm.levels.set(n, TileMap.deserialize(lData));
    }
    for (const [dest, entries] of (data.runeRegistry ?? [])) {
      wm.runeRegistry.set(dest, entries);
    }
    return wm;
  }
}
