/**
 * Multi-pass dungeon level generator.
 * 
 * PIPELINE:
 *  1. Carve BSP rooms
 *  2. Connect rooms with corridors
 *  3. Select environmental theme
 *  4. Place stairs (up/down), entry marker
 *  5. Place mandatory content (boss room on boss floors)
 *  6. Populate rooms (monsters, items, traps, puzzles, lore)
 *  7. Apply theme dressing (flavor tiles, rubble, pools)
 */
export class LevelGen {
  static generate(levelNumber, rng) {
    const theme   = this._pickTheme(levelNumber, rng);
    const map     = new TileMap(MAP_W, MAP_H);
    const rooms   = this._carveRooms(map, rng, theme);
    this._connectRooms(map, rooms, rng);
    this._placeStairs(map, rooms, rng, levelNumber);
    this._applyThemeDressing(map, rooms, rng, theme);
    this._populateRooms(map, rooms, rng, levelNumber, theme);
    return map;
  }

  /** 
   * BSP room carving.
   * Recursively splits map into partitions, then carves a room
   * in each leaf partition. Guarantees no room overlap.
   */
  static _carveRooms(map, rng, theme) {
    const rooms = [];
    const partitions = BSP.split(
      { x: 1, y: 1, w: MAP_W - 2, h: MAP_H - 2 },
      rng,
      { minSize: 5, maxSize: 15, iterations: 5 }
    );
    for (const p of partitions) {
      const room = {
        x: p.x + rng.int(0, 2),
        y: p.y + rng.int(0, 2),
        w: rng.int(theme.minRoomW, Math.min(p.w - 2, theme.maxRoomW)),
        h: rng.int(theme.minRoomH, Math.min(p.h - 2, theme.maxRoomH)),
        type: 'normal',      // overwritten by special room logic
        content: null,       // set by _populateRooms
        explored: false,
        id: rooms.length
      };
      carveRoom(map, room, theme);
      rooms.push(room);
    }
    return rooms;
  }

  /**
   * Connect all rooms using a minimum spanning tree of corridors.
   * Guarantees full connectivity; adds ~20% extra corridors for loops.
   */
  static _connectRooms(map, rooms, rng) {
    const centers = rooms.map(r => ({ x: r.x + (r.w>>1), y: r.y + (r.h>>1), room: r }));
    const mst     = primMST(centers);
    for (const [a, b] of mst) {
      if (rng.chance(0.5)) carveLCorridor(map, a, b);
      else                  carveZCorridor(map, a, b);
    }
    // Extra loops
    const extras = Math.floor(rooms.length * 0.2);
    for (let i = 0; i < extras; i++) {
      const [a, b] = [rng.pick(centers), rng.pick(centers)];
      if (a !== b) carveLCorridor(map, a, b);
    }
  }

  static _pickTheme(levelNumber, rng) {
    const bands = [
      { min: 1,  max: 5,  pool: ['dungeon_cellar', 'goblin_warren', 'abandoned_mine'] },
      { min: 6,  max: 10, pool: ['catacomb', 'underhall', 'fungal_grotto'] },
      { min: 11, max: 15, pool: ['dwarven_deep', 'elemental_grotto', 'flooded_vault'] },
      { min: 16, max: 20, pool: ['demon_warren', 'void_passage', 'primordial_chaos'] },
    ];
    const band = bands.find(b => levelNumber >= b.min && levelNumber <= b.max);
    const key  = rng.pick(band.pool);
    return THEMES[key];
  }

  static _populateRooms(map, rooms, rng, levelNumber, theme) {
    const populator = new RoomGen(levelNumber, rng, theme);
    // First room is entry, last is farthest (often boss on boss floor)
    rooms[0].type = 'entry';
    if (levelNumber % 5 === 0) {
      const bossRoom = rooms[rooms.length - 1];
      bossRoom.type  = 'boss';
      populator.populateBossRoom(map, bossRoom);
    }
    for (const room of rooms) {
      if (room.type === 'entry' || room.type === 'boss') continue;
      populator.populate(map, room);
    }
  }
}
