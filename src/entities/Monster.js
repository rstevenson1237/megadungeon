import { Entity } from './Entity.js';
import { MONSTERS } from '../data/monsters.js';

export class Monster extends Entity {
  constructor(defKey, x, y) {
    super('monster', x, y);
    this.defKey = defKey;
    this.def    = MONSTERS[defKey];

    if (!this.def) throw new Error(`Unknown monster key: ${defKey}`);

    // Initialize HP from hit dice
    this.hpMax = this._rollHP();
    this.hp    = this.hpMax;
    this.ac    = this.def.ac;
    this.name  = this.def.name;

    // AI state
    this.aiState  = 'idle';   // 'idle' | 'alert' | 'pursuing' | 'fleeing'
    this.targetId = null;     // Entity ID of current target

    // Copy tags from definition
    for (const tag of this.def.tags ?? []) this.tags.add(tag);
  }

  _rollHP() {
    const hd = this.def.hd;
    const dieSize = parseInt(this.def.hdType.replace('d', ''));
    let total = 0;
    for (let i = 0; i < hd; i++) {
      total += Math.floor(Math.random() * dieSize) + 1;
    }
    return Math.max(1, total);
  }

  /**
   * Static factory method.
   * @param {string} defKey  Key in MONSTERS data
   * @param {number} x
   * @param {number} y
   * @param {number} level   Dungeon level (for future scaling, ignored for now)
   */
  static create(defKey, x, y, level = 1) {
    // If the key doesn't exist in MONSTERS, fall back to goblin
    const key = MONSTERS[defKey] ? defKey : 'goblin';
    return new Monster(key, x, y);
  }

  /**
   * Returns the monster's primary attack definition.
   */
  getPrimaryAttack() {
    return this.def.attacks?.[0] ?? { name: 'claw', numDice: 1, die: 4, dmgBonus: 0 };
  }

  /**
   * Roll damage for a given attack definition.
   */
  rollDamage(attack) {
    let dmg = 0;
    for (let i = 0; i < attack.numDice; i++) {
      dmg += Math.floor(Math.random() * attack.die) + 1;
    }
    return Math.max(0, dmg + (attack.dmgBonus ?? 0));
  }
}
