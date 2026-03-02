/**
 * Resolves spell casting and effects.
 */
export class MagicSystem {
  constructor(eventBus, tileMap) {
    this.bus = eventBus;
    this.map = tileMap;
  }

  /**
   * Attempt to cast a spell. Validates MP, applies effects.
   * @returns {{ success, message, targets }}
   */
  cast(caster, spellKey, targetPos) {
    const spell = SPELLS[spellKey];
    if (!spell) return { success: false, message: 'Unknown spell.' };
    if (caster.mp < spell.mpCost) return { success: false, message: 'Not enough mana.' };
    if (!this._inRange(caster, targetPos, spell.range)) return { success: false, message: 'Out of range.' };

    caster.mp -= spell.mpCost;
    const targets = this._resolveTargets(caster, targetPos, spell);
    const results = targets.map(t => this._applyEffect(caster, t, spell));

    this.bus.emit('spell:cast', { caster, spell, targets, results });
    return { success: true, targets, results };
  }

  _resolveTargets(caster, pos, spell) {
    switch (spell.area) {
      case 'single':
        return this.map.getEntitiesAt(pos.x, pos.y).filter(e => e !== caster);
      case 'burst:20ft': {
        const radius = 4; // 20ft ÷ 5ft per tile
        return this._entitiesInRadius(pos, radius).filter(e => e !== caster);
      }
      case 'all_visible':
        return [...this.map.entities.values()].flat().filter(e => e.visible && e !== caster);
      default:
        return [];
    }
  }

  _applyEffect(caster, target, spell) {
    const effect = spell.effect;
    const saved  = spell.save !== 'none' && rollSave(target, spell.save);

    switch (effect.type) {
      case 'damage': {
        let dmg = rollDiceStr(effect.dice.replace('level', caster.level + ''));
        if (saved && spell.saveEffect === 'half') dmg = Math.floor(dmg / 2);
        if (!saved || spell.saveEffect !== 'negate') {
          target.hp -= Math.max(0, dmg - (target.resistance?.[effect.element] ?? 0));
        }
        return { target, effect: 'damage', value: dmg, saved };
      }
      case 'heal': {
        const healed = rollDiceStr(effect.dice);
        target.hp = Math.min(target.hp + healed, target.hpMax);
        return { target, effect: 'heal', value: healed };
      }
      case 'sleep': {
        if (target.hasTag('undead') || target.hasTag('construct')) return { target, effect: 'immune' };
        if (!saved) StatusSystem.apply(target, 'sleep', { duration: rollDiceStr('1d4+4') });
        return { target, effect: 'sleep', saved };
      }
      case 'turn': {
        const turn = TurnUndeadTable[caster.level]?.[target.def?.hd ?? 1];
        if (turn === 'T') StatusSystem.apply(target, 'flee', { duration: 10 });
        if (turn === 'D') target.hp = 0; // Destroyed
        return { target, effect: 'turn', result: turn };
      }
      // ... additional effect types
    }
  }
}
