import { Item } from '../entities/Item.js';

/**
 * Puzzles are stateful objects placed in rooms.
 * They expose an examine/interact interface and resolve when solved.
 */
export class PuzzleSystem {
  constructor(eventBus, game) { 
      this.bus = eventBus;
      this.game = game;
    }

  /** 
   * Called when player examines a puzzle tile.
   * Returns description and available interactions. 
   */
  examine(puzzle) {
    return {
      name: puzzle.def.name,
      description: puzzle.def.examineText(puzzle.state),
      interactions: puzzle.def.interactions.filter(i => i.available(puzzle.state))
    };
  }

  /** Attempt an interaction. Returns { success, message, sideEffects } */
  interact(puzzle, player, interactionKey, params = {}) {
    const interaction = puzzle.def.interactions.find(i => i.key === interactionKey);
    if (!interaction) return { success: false, message: 'You can\'t do that.' };

    const result = interaction.resolve(puzzle.state, player, params);
    Object.assign(puzzle.state, result.stateChanges ?? {});

    if (this._checkSolved(puzzle)) {
      this._onSolve(puzzle, player);
    }

    return result;
  }

  _checkSolved(puzzle) {
    return puzzle.def.solveCondition(puzzle.state) && !puzzle.solved;
  }

  _onSolve(puzzle, player) {
    puzzle.solved = true;
    const reward = puzzle.def.reward;
    this.bus.emit('puzzle:solved', { puzzle, solver: player, reward });
    // Rewards: XP, items, passage opens, lore reveals, stat bonuses
    if (reward.xp)     player.gainXP(reward.xp);
    if (reward.items)  reward.items.forEach(i => player.addToInventory(Item.create(i)));
    if (reward.openPassage) this._openPassage(puzzle, reward.openPassage);
  }

  _openPassage(puzzle, direction) {
      const map = this.game.worldMap.getLevel(puzzle.location.z);
      if(!map) return;

      let {x, y} = puzzle.location;
      
      // Super simple implementation: just open the wall tile in the given direction
      let wallX = x;
      let wallY = y;

      switch(direction) {
          case 'north': wallY--; break;
          case 'south': wallY++; break;
          case 'east':  wallX++; break;
          case 'west':  wallX--; break;
      }

      if(map.inBounds(wallX, wallY)) {
          const tile = map.get(wallX, wallY);
          if(!tile.solid) return; // Already open

          tile.solid = false;
          tile.opaque = false;
          tile.type = 'floor';
          // Use a generic floor look for now
          tile.glyph = 0x2E;
          tile.fg = '#5a5a5a';
          tile.bg = '#0a0a0a';
          this.bus.emit('log:message', { text: 'You hear a grinding sound as a wall slides away.', category: 'important' });
      }
  }
}
