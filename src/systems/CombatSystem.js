import { rollDie, statModifier } from '../engine/rules.js';
import { RNG } from '../engine/RNG.js';

// Local RNG for fumble resolution (not seeded — that's acceptable for fumble flavor)
const rng = new RNG(Date.now());

// Stub for rollSave — implement properly in Phase 5
function rollSave(entity, saveType) {
  const threshold = entity.class?.savingThrows?.[saveType]
    ?? entity.def?.savingThrows?.[saveType]
    ?? 15;
  return rollDie(20) >= threshold;
}

// Stub for chebyshevDistance
function chebyshevDistance(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Handles all combat resolution. No game objects; operates on entity data.
 * Turn order uses initiative (d6 + DEX mod), resolved per turn.
 */
export class CombatSystem {
  constructor(eventBus) { this.bus = eventBus; }

  /** Roll initiative for all participants */
  rollInitiative(combatants) {
    return combatants
      .map(e => ({ entity: e, init: rollDie(6) + statModifier(e.stats?.dex ?? 10) }))
      .sort((a, b) => b.init - a.init);
  }

  /**
   * Resolve a melee attack.
   * @returns {{ hit, critical, damage, effects, message }}
   */
  resolveAttack(attacker, defender, weapon = null) {
    const atkBonus = this._getAttackBonus(attacker, weapon, defender);
    const roll     = rollDie(20);
    const total    = roll + atkBonus;
    const critical = roll === 20;
    const fumble   = roll === 1;

    if (fumble) {
      return this._resolveFumble(attacker, weapon);
    }

    const targetAC = this._getAC(defender);
    const hit = critical || total >= (20 - targetAC); // THAC0

    if (!hit) {
      this.bus.emit('player:attack', { attacker, defender, hit: false, roll });
      return { hit: false, damage: 0, message: `${attacker.name} misses.` };
    }

    let damage = this._rollDamage(attacker, weapon, critical);
    damage     = this._applyResistances(damage, weapon, defender);
    damage     = Math.max(1, damage);

    const effects = this._resolveWeaponSpecials(weapon, defender);
    this._applyDamage(defender, damage);

    const msg = critical
      ? `${attacker.name} CRITICALLY HITS ${defender.name} for ${damage} damage!`
      : `${attacker.name} hits ${defender.name} for ${damage} damage.`;

    this.bus.emit('player:attack', { attacker, defender, hit: true, damage, critical });
    return { hit: true, critical, damage, effects, message: msg };
  }

  _applyDamage(entity, damage) {
    entity.hp = Math.max(0, entity.hp - damage);
    if (entity.hp === 0) {
      this.bus.emit(entity.type === 'player' ? 'player:death' : 'monster:death', { entity });
    }
  }

  _getAttackBonus(attacker, weapon, defender) {
    let bonus = attacker.class?.attackBonus[attacker.level] ?? 0;
    bonus += statModifier(attacker.stats?.str ?? 10);
    bonus += weapon?.weapon?.attackBonus ?? 0;
    // Situational: flanking, high ground, darkness, status effects
    if (attacker.statuses?.some(s => s.key === 'blessed')) bonus += 1;
    if (attacker.statuses?.some(s => s.key === 'cursed'))  bonus -= 1;
    if (defender.statuses?.some(s => s.key === 'prone'))   bonus += 2;
    return bonus;
  }

  _getAC(entity) {
    let ac = entity.ac ?? 10;
    // Apply temporary modifiers from statuses
    for (const status of entity.statuses ?? []) ac += status.acMod ?? 0;
    return ac;
  }

  _rollDamage(attacker, weapon, critical) {
    const [num, die] = weapon?.weapon?.damage ?? [1, 4];
    let dmg = 0;
    const rolls = critical ? num * 2 : num; // Double dice on crit
    for (let i = 0; i < rolls; i++) dmg += rollDie(die);
    dmg += statModifier(attacker.stats?.str ?? 10);
    dmg += weapon?.weapon?.damageMod ?? 0;
    return dmg;
  }

  _applyResistances(damage, weapon, defender) {
    // Check immunity, resistance, vulnerability
    const element = weapon?.element ?? 'physical';
    if (defender.hasTag?.(`immune_${element}`)) return 0;
    if (defender.hasTag?.(`resist_${element}`)) return Math.floor(damage / 2);
    if (defender.hasTag?.(`vuln_${element}`))   return damage * 2;
    // Non-magical weapon immunity
    if (defender.hasTag?.('immune_nonmagic_weapons') && !(weapon?.magical)) return 0;
    return damage;
  }

  _resolveWeaponSpecials(weapon, defender) {
    const effects = [];
    for (const special of weapon?.specials ?? []) {
      const [type, param] = special.split('_');
      if (type === 'poison' && !rollSave(defender, 'death')) {
        effects.push({ type: 'poison', severity: param });
      }
      if (type === 'paralyze' && !rollSave(defender, 'stone')) {
        effects.push({ type: 'paralysis', duration: parseInt(param) || 4 });
      }
    }
    return effects;
  }

  _resolveFumble(attacker, weapon) {
    const outcomes = [
      { msg: `${attacker.name} stumbles!`, effect: { type: 'prone', duration: 1 } },
      { msg: `${attacker.name}'s weapon slips!`, effect: { type: 'disarmed' } },
      { msg: `${attacker.name} is off-balance.`, effect: { type: 'ac_penalty', value: 2, duration: 1 } },
    ];
    const outcome = rng.pick(outcomes);
    return { hit: false, fumble: true, damage: 0, message: outcome.msg, effect: outcome.effect };
  }

  /** Ranged attack: adds range penalty, cover modifiers */
  resolveRangedAttack(attacker, defender, weapon) {
    // TODO Phase 5: implement range penalty
    return this.resolveAttack(attacker, defender, weapon);
  }

  /** Morale check for monsters — do they flee? */
  checkMorale(monster) {
    const roll = rollDie(6) + rollDie(6);
    return roll <= monster.def.morale;
  }
}
