
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

    this.inventory = [];      // Item[]  (max 26 slots, indexed a–z)
    this.equipped  = {        // Slot → Item | null
      weapon: null, offhand: null, helmet: null,
      body: null, boots: null, ring1: null, ring2: null, amulet: null
    };
    this.spellbook = [];      // Known spell keys
    this.abilities = new Set(); // Unlocked ability keys
    this.favoredEnemies = [];   // Selected monster types (for Ranger)
    this.skills    = {};      // skillKey → rank (0–5)
    this.statuses  = [];      // Active StatusEffect[]
    this.scars     = [];      // Permanent negative effects from near-deaths

    this.hpMax     = this._rollHP();
    this.hp        = this.hpMax;
    this.hpMaxBase = this.hpMax; // Tracks undrained max HP for Restore Vitality
    this.mpMax  = this._rollMP();
    this.mp     = this.mpMax;
    this.ac     = this._computeAC();
    this.gold   = this.class.startingGold;
    this.depth  = 0;          // Deepest floor reached (for scoring)

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
    if (this.equipped.body)    ac -= this.equipped.body.armor?.acBonus    ?? 0;
    if (this.equipped.helmet)  ac -= this.equipped.helmet.armor?.acBonus  ?? 0;
    if (this.equipped.offhand) ac -= this.equipped.offhand.armor?.acBonus ?? 0;
    if (this.equipped.boots)   ac -= this.equipped.boots.armor?.acBonus   ?? 0;
    for (const slot of ['ring1', 'ring2', 'amulet']) {
      for (const eff of (this.equipped[slot]?.effects ?? [])) {
        if (eff.type === 'ac') ac -= eff.value;
      }
    }
    for (const status of this.statuses) ac += status.acMod ?? 0;
    return ac;
  }

  getEquippedEffectValue(type) {
    let total = 0;
    for (const slot of ['ring1', 'ring2', 'amulet']) {
      for (const eff of (this.equipped[slot]?.effects ?? [])) {
        if (eff.type === type) total += eff.value;
      }
    }
    return total;
  }

  _initClass() {
    const cls = this.class;
    this.spellbook = [...(cls.startingSpells ?? [])];
    for (const [skill, rank] of Object.entries(cls.startingSkills ?? {})) {
      this.skills[skill] = rank;
    }
    // Auto-equip logical starting gear
    const autoEquipMap = {
      weapon: ['sword', 'axe', 'mace', 'dagger', 'bow', 'staff', 'wand'],
      body:   ['mail', 'armor', 'robe', 'leather', 'plate'],
      offhand:['shield'],
      helmet: ['helm', 'cap', 'hat'],
    };
    for (const itemKey of cls.startingItems ?? []) {
      let item;
      try { item = Item.create(itemKey); } catch(e) { continue; }
      
      this.addToInventory(item);

      for (const [slot, keywords] of Object.entries(autoEquipMap)) {
        if (!this.equipped[slot] && keywords.some(kw => itemKey.includes(kw))) {
          this.equipped[slot] = item;
          break;
        }
      }
    }
    this.ac = this._computeAC(); // Recompute now that equipment is set

    // Grant starting level abilities
    const startingAbilities = cls.abilitiesAtLevel?.[1] ?? [];
    for (const ability of startingAbilities) {
      this._grantAbility(ability);
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
    this.abilities.add(abilityKey);
    // Passive stat bonuses applied immediately
    const passiveEffects = {
      weapon_specialization: () => { this._weaponSpecBonus = 2; },
      extra_attack:          () => { this._extraAttacks = 1; },
      woodland_stride:       () => { this._ignoreDifficultTerrain = true; },
      lore_mastery:          () => { this._loreMasteryActive = true; },
      // Fighter
      legendary_strike:      () => { this._legendaryStrikeReady = false; },
      // Thief
      uncanny_dodge:         () => { this._uncannyDodge = true; },
      // Magic-User
      arcane_sight:          () => { this._arcaneSightActive = true; },
      spell_echo:            () => { /* checked in MagicSystem.cast() */ },
      // Cleric
      aura_of_protection:    () => { this._saveBonus = (this._saveBonus ?? 0) + 2; },
      // Ranger
      master_hunter:         () => { this._masterHunterActive = true; },
      // Paladin
      divine_health:         () => { this._divineHealthActive = true; },
      aura_of_courage:       () => { this._fearImmune = true; },
      holy_champion:         () => { this._holyChampionAvailable = true; },
      divine_spells:         () => {
        const grants = ['cure_light_wounds', 'bless', 'cure_poison', 'hold_person'];
        for (const s of grants) {
          if (!this.spellbook.includes(s)) this.spellbook.push(s);
        }
      },
    };
    passiveEffects[abilityKey]?.();
    console.log(`${this.name} has gained ability: ${abilityKey}!`);
  }

  hasAbility(key) { return this.abilities.has(key); }

  addToInventory(item) {
    if (item.stackable) {
        const existing = this.inventory.find(i => i.itemKey === item.itemKey);
        if (existing) {
            existing.quantity = (existing.quantity ?? 1) + (item.quantity ?? 1);
            return true;
        }
    }
    if (this.inventory.length >= 26) return false;
    this.inventory.push(item);
    return true;
  }

  removeFromInventory(item) {
    const i = this.inventory.indexOf(item);
    if (i >= 0) this.inventory.splice(i, 1);
  }

    serialize() {
    return {
        classKey: this.class.key,
        name: this.name,
        level: this.level,
        xp: this.xp,
        stats: { ...this.stats },
        hp: this.hp, hpMax: this.hpMax, hpMaxBase: this.hpMaxBase,
        mp: this.mp, mpMax: this.mpMax,
        ac: this.ac,
        gold: this.gold,
        depth: this.depth,
        x: this.x, y: this.y,
        inventory: this.inventory.map(i => ({ key: i.itemKey, quantity: i.quantity })),
        equipped: Object.fromEntries(
            Object.entries(this.equipped).map(([slot, item]) => [slot, this.inventory.indexOf(item)])
        ),
        spellbook: [...this.spellbook],
        abilities: [...this.abilities],
        favoredEnemies: [...this.favoredEnemies],
        skills: { ...this.skills },
        statuses: (this.statuses ?? []).map(s => ({ ...s })),
        scars: [...this.scars],
    };
  }

  static deserialize(data) {
    const player = new Player(data.classKey, data.name, data.stats);
    player.level = data.level;
    player.xp = data.xp;
    player.hp = data.hp;
    player.hpMax = data.hpMax;
    player.hpMaxBase = data.hpMaxBase ?? data.hpMax;
    player.mp = data.mp;
    player.mpMax = data.mpMax;
    player.ac = data.ac;
    player.gold = data.gold;
    player.depth = data.depth;
    player.x = data.x;
    player.y = data.y;
    player.inventory = [];
    for (const d of data.inventory) {
        try { 
            const item = Item.create(typeof d === 'string' ? d : d.key);
            if (typeof d === 'object' && d.quantity !== undefined) item.quantity = d.quantity;
            player.inventory.push(item); 
        } catch(e) {}
    }
    for (const [slot, idx] of Object.entries(data.equipped)) {
        if (typeof idx === 'number' && idx !== -1 && player.inventory[idx]) {
            player.equipped[slot] = player.inventory[idx];
        } else if (typeof idx === 'string') {
            // Backward compatibility for old save files
            try { 
                const item = Item.create(idx);
                player.equipped[slot] = item;
            } catch(e) {}
        }
    }
    player.spellbook = data.spellbook;
    player.abilities = new Set(data.abilities ?? []);
    player.favoredEnemies = data.favoredEnemies ?? [];
    // Re-apply passive ability effects
    for (const ability of player.abilities) {
      player._grantAbility(ability);
    }
    player.skills = data.skills;
    player.statuses = data.statuses ?? [];
    player.scars = data.scars ?? [];
    return player;
  }
}
