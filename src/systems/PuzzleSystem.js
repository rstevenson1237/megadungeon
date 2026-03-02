/**
 * Puzzles are stateful objects placed in rooms.
 * They expose an examine/interact interface and resolve when solved.
 * 
 * PUZZLE ARCHETYPES:
 *   'combination_lock'  — Discover combination from room clues, enter it
 *   'elemental_altar'   — Place correct item types on altar to unlock passage
 *   'inscription_riddle'— Read inscription, answer riddle via menu
 *   'lever_sequence'    — Flip levers in correct order (clues in room)
 *   'statue_offering'   — Offer correct item to statue for reward
 *   'water_basin'       — Fill basin, drain, manipulate water flow
 *   'mural_alignment'   — Rotate mural panels to form coherent image
 *   'magic_rune_trace'  — Trace rune pattern on floor using movement
 *   'mirror_redirect'   — Orient mirrors to redirect magical beam to target
 *   'weight_scale'      — Balance scale with correct item weights
 */
export class PuzzleSystem {
  constructor(eventBus) { this.bus = eventBus; }

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
    if (!interaction) return { success: false, message: 'You can't do that.' };

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
    if (reward.openPassage) this._openPassage(puzzle.location, reward.openPassage);
  }
}
