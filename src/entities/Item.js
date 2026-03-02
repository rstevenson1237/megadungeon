
import { Entity } from './Entity.js';
import { ITEMS } from '../data/items.js';

/**
 * Represents an item in the game, which could be in an inventory or on the ground.
 */
export class Item extends Entity {
  constructor(itemKey, itemData) {
    // Items in inventory don't have a map position, so we use (-1, -1).
    super('item', -1, -1);
    this.itemKey = itemKey;

    // Copy all properties from the data definition to this object
    for (const [key, value] of Object.entries(itemData)) {
      this[key] = value;
    }
  }

  /**
   * Creates a new Item instance from a key.
   * @param {string} itemKey The key of the item in the ITEMS data library.
   * @returns {Item}
   */
  static create(itemKey) {
    const itemData = ITEMS[itemKey];
    if (!itemData) {
      throw new Error(`Unknown item key: ${itemKey}`);
    }
    return new Item(itemKey, itemData);
  }
}
