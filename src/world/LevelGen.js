// src/world/LevelGen.js - Stub for World Generation Step 2.2
import { TileMap } from './TileMap.js'; // Will be created as a stub next
import { THEMES } from '../data/themes.js'; // Will be created as a stub next
import { RNG } from '../engine/RNG.js'; // Already exists

export class LevelGen {
  static generate(levelNumber, rng) {
    console.log(`Stub LevelGen: Generating level ${levelNumber} with seed ${rng.seed}`);
    // Return a dummy TileMap for now
    return new TileMap(80, 40); // Placeholder dimensions
  }
}
