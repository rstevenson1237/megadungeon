/**
 * Manages status effects on entities.
 */
export class StatusSystem {
  /**
   * Apply a status effect to an entity.
   * @param {Entity} entity The entity to affect.
   * @param {string} statusKey The key of the status effect to apply.
   * @param {Object} options Options for the status effect (e.g., duration).
   */
  static apply(entity, statusKey, options = {}) {
    // Stub: In a full implementation, this would add the status
    // to the entity's statuses array and handle timers.
    console.log(`Applying status ${statusKey} to ${entity.name} with options:`, options);
  }
}
