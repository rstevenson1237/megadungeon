
import { Entity } from './Entity.js';
import { Item } from './Item.js';
import { CLASSES } from '../data/classes.js';
import { rollDie, statModifier, XP_TABLE, MAX_LEVEL } from '../engine/rules.js';

/**
 * @typedef {Object} PlayerStats
 * @property {number} str  Strength      — melee damage, carry weight
 * @property {number} dex  Dexterity     — AC, ranged attack, thief skills
 * @property {number} con  Constitution  — HP bonus, poison resistance
 * @property {number} int  Intelligence  — number of spells, lore checks
 * @property {number} wis  Wisdom        — cleric spells, saving throws
 * @property {number} cha  Charisma      — NPC reaction, followers
 */

export class Player extends Entity {
  constructor(classKey, name, stats) {
    super('player', 0, 0);

    this.name   = name;
    this.class  = CLASSES[classKey];
    this.level  = 1;
    this.xp     = 0;
    this.stats  = { ...stats };
    this.hpMax  = this._rollHP();
    this.hp     = this.hpMax;
    this.mpMax  = this._rollMP();
    this.mp     = this.mpMax;
    this.ac     = this._computeAC();
    this.gold   = this.class.startingGold;
    this.depth  = 0;          // Deepest floor reached (for scoring)

    this.inventory = [];      // Item[]  (max 26 slots, indexed a–z)
    this.equipped  = {        // Slot → Item | null
      weapon: null, offhand: null, helmet: null,
      body: null, boots: null, ring1: null, ring2: null, amulet: null
    };
    this.spellbook = [];      // Known spell keys
    this.skills    = {};      // skillKey → rank (0–5)
    this.statuses  = [];      // Active StatusEffect[]
    this.scars     = [];      // Permanent negative effects from near-deaths

    this._initClass();
  }

  _rollHP() {
    const base = this.class.hitDie;
    const conMod = statModifier(this.stats.con);
    return Math.max(1, rollDie(base) + conMod + this.class.hpBonus);
  }

  _rollMP() {
    if (!this.class.usesMP) return 0;
    const castStat = this.class.castingStat; // 'int' or 'wis'
    return this.class.mpBase + statModifier(this.stats[castStat]) * 2;
  }

  _computeAC() {
    let ac = 10;
    ac -= statModifier(this.stats.dex);
    if (this.equipped.body)   ac -= this.equipped.body.armor?.acBonus   ?? 0;
    if (this.equipped.helmet) ac -= this.equipped.helmet.armor?.acBonus ?? 0;
    if (this.equipped.boots)  ac -= this.equipped.boots.armor?.acBonus  ?? 0;
    for (const status of this.statuses) ac += status.acMod ?? 0;
    return ac;
  }

  _initClass() {
    const cls = this.class;
    this.spellbook = [...(cls.startingSpells ?? [])];
    for (const [skill, rank] of Object.entries(cls.startingSkills ?? {})) {
      this.skills[skill] = rank;
    }
    for (const itemKey of cls.startingItems ?? []) {
      this.addToInventory(Item.create(itemKey));
    }
  }

  /**
   * Attempt to gain XP and level up.
   * Returns { leveled: bool, hpGained: number, newAbilities: string[] }
   */
  gainXP(amount) {
    this.xp += amount;
    const threshold = XP_TABLE[this.level];
    if (this.xp >= threshold && this.level < MAX_LEVEL) {
      return this._levelUp();
    }
    return { leveled: false };
  }

  _levelUp() {
    this.level++;
    const hpGain = Math.max(1, rollDie(this.class.hitDie) + statModifier(this.stats.con));
    this.hpMax += hpGain;
    this.hp = Math.min(this.hp + hpGain, this.hpMax);
    this.mpMax = this._rollMP();

    const newAbilities = this.class.abilitiesAtLevel?.[this.level] ?? [];
    for (const ability of newAbilities) this._grantAbility(ability);

    return { leveled: true, hpGained: hpGain, newAbilities };
  }

  _grantAbility(abilityKey) {
    // Stub for a future system to handle learning new abilities.
    console.log(`${this.name} has gained ability: ${abilityKey}!`);
  }

  /** Attack roll: d20 + THAC0-based modifier vs target AC */
  rollAttack(target) {
    const roll = rollDie(20) + this._attackBonus();
    const hit  = roll >= (20 - target.ac); // THAC0 system
    const dmg  = hit ? this._rollDamage() : 0;
    return { hit, roll, dmg, critical: roll === 20 };
  }

  _attackBonus() {
    const base  = this.class.attackBonus[this.level] ?? 0;
    const strMod = statModifier(this.stats.str);
    const wpnMod = this.equipped.weapon?.attackBonus ?? 0;
    return base + strMod + wpnMod;
  }

  _rollDamage() {
    const weapon = this.equipped.weapon;
    const [num, die] = weapon ? weapon.weapon.damage : [1, 4]; // unarmed = 1d4
    let dmg = 0;
    for (let i = 0; i < num; i++) dmg += rollDie(die);
    dmg += statModifier(this.stats.str) + (weapon?.damageMod ?? 0);
    return Math.max(1, dmg);
  }

  addToInventory(item) {
    if (this.inventory.length >= 26) return false;
    this.inventory.push(item);
    return true;
  }

  removeFromInventory(item) {
    const i = this.inventory.indexOf(item);
    if (i >= 0) this.inventory.splice(i, 1);
  }

  serialize() { /* JSON-safe snapshot */ }
  static deserialize(data) { /* reconstruct */ }
}
