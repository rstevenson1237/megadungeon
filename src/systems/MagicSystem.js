import { SPELLS } from '../data/spells.js';
import { TurnUndeadTable } from '../data/tables.js';
import { rollDiceStr, rollDie, rollSave } from '../engine/rules.js';
import { StatusSystem } from './StatusSystem.js';

/**
 * Convert a spell duration string to a turn count.
 * Patterns: 'instant', 'permanent', 'concentration',
 *           'level_turns', 'level_minutes',
 *           '1d6+2_turns', '1d4+level_minutes', etc.
 * 1 minute = 10 turns.
 */
function parseDuration(durationStr, casterLevel) {
  if (!durationStr
    || durationStr === 'instant'
    || durationStr === 'permanent'
    || durationStr === 'concentration') return 0;

  const s = durationStr.replace('level', String(casterLevel));
  const turnMatch   = s.match(/^(.+)_turns$/);
  const minuteMatch = s.match(/^(.+)_minutes$/);
  const formula = turnMatch?.[1] ?? minuteMatch?.[1];
  if (!formula) return 0;
  const turns = /^\d+$/.test(formula) ? parseInt(formula, 10) : rollDiceStr(formula);
  return minuteMatch ? turns * 10 : turns;
}


/**
 * Resolves spell casting and effects.
 */
export class MagicSystem {
  constructor(eventBus, game) {
    this.bus = eventBus;
    this.game = game;
  }

  /**
   * Attempt to cast a spell. Validates MP, applies effects.
   * @returns {{ success, message, targets }}
   */
  cast(caster, spellKey, targetPos) {
    const spell = SPELLS[spellKey];
    if (!spell) return { success: false, message: 'Unknown spell.' };
    if (caster.mp < spell.mpCost) return { success: false, message: 'Not enough mana.' };

    const map = this.game.worldMap.getLevel(caster.depth);
    if (!this._inRange(caster, targetPos, spell.range, map)) {
        return { success: false, message: 'Out of range.' };
    }

    // Spell Mastery: free daily cast for chosen spells (Magic-User L4)
    const mastered = caster._masteredSpells?.includes(spellKey)
      && (caster._spellMasteryCharges?.[spellKey] ?? 0) > 0;
    if (mastered) {
      caster._spellMasteryCharges[spellKey]--;
      this.bus.emit('log:message', { text: `Spell Mastery: ${spell.name} cast for free!`, category: 'magic' });
    } else {
      caster.mp -= spell.mpCost;
    }

    // Spell Echo: 30% chance to refund MP after cast (Magic-User L10)
    if (!mastered && caster.hasAbility?.('spell_echo') && Math.random() < 0.3) {
      caster.mp = Math.min(caster.mp + spell.mpCost, caster.mpMax);
      this.bus.emit('log:message', { text: 'Spell Echo! The spell costs no mana.', category: 'magic' });
    }

    const targets = this._resolveTargets(caster, targetPos, spell, map);
    const results = targets.map(t => this._applyEffect(caster, t, spell, targetPos));

    // Summarise detect results now that all targets have been processed
    if (results.some(r => r?.effect === 'detect')) {
      const trapsResult = results.find(r => r?.trapsFound !== undefined);
      if (trapsResult) {
        const n = trapsResult.trapsFound;
        const msg = n > 0
          ? `You sense ${n} trap${n > 1 ? 's' : ''} nearby.`
          : 'You sense no traps nearby.';
        this.bus.emit('log:message', { text: msg });
      } else {
        const count = results.filter(r => r?.revealed).length;
        const msg = count > 0
          ? `You sense ${count} evil presence${count > 1 ? 's' : ''} nearby.`
          : 'You sense no evil nearby.';
        this.bus.emit('log:message', { text: msg });
      }
    }

    this.bus.emit('spell:cast', { caster, spell, targets, results });
    return { success: true, targets, results };
  }

  _inRange(caster, targetPos, rangeStr, map) {
      if (rangeStr === 'self') {
          return caster.x === targetPos.x && caster.y === targetPos.y;
      }
      if (rangeStr === 'touch') {
          return Math.abs(caster.x - targetPos.x) <= 1 && Math.abs(caster.y - targetPos.y) <= 1;
      }
      if (rangeStr === 'sight') {
          const targetTile = map.get(targetPos.x, targetPos.y);
          return targetTile && targetTile.visible;
      }
      const feet = parseInt(rangeStr, 10);
      if (isNaN(feet)) {
          console.warn(`MagicSystem: unrecognized range '${rangeStr}', defaulting to sight check`);
          const targetTile = map.get(targetPos.x, targetPos.y);
          return targetTile && targetTile.visible;
      }
      const dist = Math.hypot(caster.x - targetPos.x, caster.y - targetPos.y);
      return dist <= feet / 5;
  }

  _entitiesInRadius(pos, radius, map) {
      const entities = [];
      for(let y = pos.y - radius; y <= pos.y + radius; y++) {
          for(let x = pos.x - radius; x <= pos.x + radius; x++) {
              if (map.inBounds(x, y)) {
                  const dist = Math.hypot(pos.x - x, pos.y - y);
                  if (dist <= radius) {
                      entities.push(...map.getEntitiesAt(x, y));
                  }
              }
          }
      }
      return entities;
  }

  _resolveTargets(caster, pos, spell, map) {
    if (spell.area === 'self') return [caster];
    if (spell.area === 'single') return map.getEntitiesAt(pos.x, pos.y);
    if (spell.area === 'all_visible') {
      return [...map.entities.values()].flat().filter(e => {
        if (e === caster) return false;
        const tile = map.get(e.x, e.y);
        return tile && tile.visible;
      });
    }
    if (spell.area === 'all_enemies_visible') {
      return [...map.entities.values()].flat().filter(e => {
        if (e.type !== 'monster') return false;
        const tile = map.get(e.x, e.y);
        return tile && tile.visible;
      });
    }

    const alliesMatch = spell.area.match(/^all_allies_in_burst:(\d+)ft$/);
    if (alliesMatch) {
      const radius = parseInt(alliesMatch[1]) / 5;
      return this._entitiesInRadius(pos, radius, map).filter(e => e.alignment === caster.alignment);
    }

    const burstMatch = spell.area?.match(/^burst:(\d+)ft$/);
    if (burstMatch) {
      const radius = parseInt(burstMatch[1]) / 5;
      return this._entitiesInRadius(pos, radius, map);
    }

    console.warn(`MagicSystem: unhandled area type '${spell.area}' for spell '${spell.key}'`);
    return [];
  }

  _applyEffect(caster, target, spell, targetPos = null) {
    const effect = spell.effect;
    const saved  = spell.save !== 'none' && rollSave(target, spell.save);

    switch (effect.type) {
      case 'damage': {
        // Metamagic Empower: roll twice, take max (Magic-User L6)
        let dmg;
        if (caster._empowerNextSpell) {
          caster._empowerNextSpell = false;
          const r1 = rollDiceStr(effect.dice.replace('level', caster.level + ''));
          const r2 = rollDiceStr(effect.dice.replace('level', caster.level + ''));
          dmg = Math.max(r1, r2);
          this.bus.emit('log:message', { text: 'Metamagic Empower! Maximised spell damage.', category: 'magic' });
        } else {
          dmg = rollDiceStr(effect.dice.replace('level', caster.level + ''));
        }
        if (effect.extraMissilePerLevel) {
            const extraCount = Math.floor((caster.level - 1) / effect.extraMissilePerLevel);
            for (let i = 0; i < extraCount; i++) {
                dmg += rollDiceStr(effect.dice.replace('level', '1'));
            }
        }
        // Check elemental immunity/resistance (tag-based and status-based)
        if (effect.element) {
            if (target.hasTag?.(`immune_${effect.element}`) ||
                target.statuses?.some(s => s.key === `immune_${effect.element}`)) {
                return { target, effect: 'immune' };
            }
            if (target.hasTag?.(`resist_${effect.element}`) ||
                target.statuses?.some(s => s.key === `resist_${effect.element}`)) {
                dmg = Math.floor(dmg / 2);
            }
        }
        if (saved && spell.saveEffect === 'half') dmg = Math.floor(dmg / 2);
        if (!saved || spell.saveEffect !== 'negate') {
          target.hp = Math.max(0, target.hp - dmg);
          if (target.hp === 0) {
            this.bus.emit(target.type === 'player' ? 'player:death' : 'monster:death',
              { entity: target, cause: spell.name });
          }
          // Apply on-hit status (e.g., acid corroding, frost slowing)
          if (effect.onHitStatus && target.hp > 0) {
              StatusSystem.apply(target, effect.onHitStatus.key, effect.onHitStatus);
          }
        }
        return { target, effect: 'damage', value: dmg, saved };
      }
      case 'heal': {
        const healed = rollDiceStr(effect.dice);
        target.hp = Math.min(target.hp + healed, target.hpMax);
        return { target, effect: 'heal', value: healed };
      }
      case 'sleep': {
        if (target.tags?.has('undead') || target.tags?.has('construct')) return { target, effect: 'immune' };
        if (!saved) StatusSystem.apply(target, 'sleep', { duration: rollDiceStr('1d4+4') });
        return { target, effect: 'sleep', saved };
      }
      case 'turn': {
        const hd = target.def?.hd ?? 1;
        const turnResult = TurnUndeadTable[caster.level]?.[hd-1];
        if (turnResult === 'T') StatusSystem.apply(target, 'flee', { duration: 10 });
        if (turnResult === 'D') target.hp = 0; // Destroyed
        return { target, effect: 'turn', result: turnResult };
      }
      case 'light': {
          const fovBonus = Math.floor((effect.radius ?? 15) / 5);
          const duration = parseDuration(spell.duration, caster.level);
          StatusSystem.apply(target, 'light', { fovBonus, duration });
          const who = target === caster ? 'You are' : `${target.name} is`;
          this.bus.emit('log:message', { text: `${who} bathed in magical light (+${fovBonus} sight for ${duration} turns).` });
          return { target, effect: 'light', fovBonus };
      }
      case 'detect': {
          const map = this.game.worldMap.getLevel(caster.depth);
          if (effect.target === 'traps') {
              const radius = (effect.radius ?? 60) / 5;
              let trapsFound = 0;
              for (let dy = -radius; dy <= radius; dy++) {
                  for (let dx = -radius; dx <= radius; dx++) {
                      const tx = caster.x + dx, ty = caster.y + dy;
                      if (!map.inBounds(tx, ty) || Math.hypot(dx, dy) > radius) continue;
                      const tile = map.get(tx, ty);
                      if (tile.features?.trap && !tile.explored) {
                          tile.explored = true;
                          trapsFound++;
                      }
                  }
              }
              return { target, effect: 'detect', trapsFound };
          }
          const def  = target.def ?? {};
          const isEvil = def.alignment === 'chaotic'
              || def.tags?.includes('demon')
              || def.tags?.includes('undead');
          const revealed = effect.target === 'evil' ? isEvil : false;
          if (revealed && map.inBounds(target.x, target.y)) {
              map.get(target.x, target.y).explored = true;
          }
          return { target, effect: 'detect', revealed };
      }
      case 'buff': {
          const duration = parseDuration(spell.duration, caster.level);
          StatusSystem.apply(target, 'buff', { stat: effect.stat, value: effect.value, duration });
          this.bus.emit('log:message', { text: `${target.name} feels blessed!` });
          return { target, effect: 'buff', duration };
      }
      case 'fear': {
          if (target.tags?.has('undead') || target.tags?.has('construct')) return { target, effect: 'immune' };
          if (!saved) {
              const duration = parseDuration(spell.duration, caster.level);
              StatusSystem.apply(target, 'flee', { duration });
              this.bus.emit('log:message', { text: `${target.name} flees in terror!` });
          }
          return { target, effect: 'fear', saved };
      }
      case 'teleport': {
          const map = this.game.worldMap.getLevel(caster.depth);
          // dimension_door: teleport to cursor position; teleport: random location
          const dest = (effect.targeted && targetPos && map.isWalkable(targetPos.x, targetPos.y))
              ? targetPos
              : this._randomWalkableTile(map, target);
          if (dest) {
              map.moveEntity(target, dest.x, dest.y);
              this.bus.emit('entity:teleported', { entity: target, to: dest });
              this.bus.emit('log:message', { text: 'You are whisked away in a flash of light!' });
          }
          return { target, effect: 'teleport', to: dest };
      }
      case 'protection': {
          const duration = parseDuration(spell.duration, caster.level);
          StatusSystem.apply(target, effect.statusKey, { acMod: effect.acMod ?? 0, duration });
          const who = target === caster ? 'You are' : `${target.name} is`;
          this.bus.emit('log:message', { text: `${who} warded by divine protection.` });
          return { target, effect: 'protection', statusKey: effect.statusKey, duration };
      }
      case 'cure_status': {
          const had = StatusSystem.has(target, effect.statusKey);
          StatusSystem.remove(target, effect.statusKey);
          const who = target === caster ? 'Your' : `${target.name}'s`;
          const msg = had
              ? (effect.message ?? `${who} affliction is lifted.`)
              : `${who} condition seems unchanged.`;
          this.bus.emit('log:message', { text: msg });
          return { target, effect: 'cure_status', statusKey: effect.statusKey, had };
      }
      case 'dispel': {
          const count = target.statuses?.length ?? 0;
          target.statuses = [];
          const who = target === caster ? 'Your' : `${target.name}'s`;
          this.bus.emit('log:message', { text: `${who} magical effects are dispelled.` });
          return { target, effect: 'dispel', cleared: count };
      }
      case 'remove_curse': {
          StatusSystem.remove(target, 'cursed');
          let uncursed = 0;
          for (const item of Object.values(target.equipped ?? {})) {
              if (item?.cursed) { item.cursed = false; uncursed++; }
          }
          const who = target === caster ? 'You are' : `${target.name} is`;
          this.bus.emit('log:message', { text: `${who} freed from ${uncursed > 0 ? 'a curse' : 'any curse'}.` });
          return { target, effect: 'remove_curse', uncursed };
      }
      case 'debuff': {
          if (!saved) {
              const duration = parseDuration(spell.duration, caster.level);
              StatusSystem.apply(target, effect.statusKey, {
                  acMod: effect.acMod ?? 0,
                  attackMod: effect.attackMod ?? 0,
                  duration,
              });
              this.bus.emit('log:message', { text: `${target.name} is ${effect.statusKey.replace('_', ' ')}!` });
          }
          return { target, effect: 'debuff', statusKey: effect.statusKey, saved };
      }
      case 'paralysis': {
          if (effect.humanoidOnly && !target.hasTag?.('humanoid')) return { target, effect: 'immune' };
          if (target.tags?.has('undead') || target.tags?.has('construct')) return { target, effect: 'immune' };
          if (!saved) StatusSystem.apply(target, 'paralysis', { duration: rollDiceStr('1d4+2') });
          return { target, effect: 'paralysis', saved };
      }
      case 'vampiric': {
          const dice = effect.dice.replace('level', String(Math.floor(caster.level / 2)));
          const dmg = rollDiceStr(dice);
          target.hp = Math.max(0, target.hp - dmg);
          if (target.hp === 0) {
              this.bus.emit(target.type === 'player' ? 'player:death' : 'monster:death',
                  { entity: target, cause: spell.name });
          }
          const drained = Math.floor(dmg / 2);
          caster.hp = Math.min(caster.hp + drained, caster.hpMax);
          this.bus.emit('log:message', { text: `You drain ${dmg} life — absorbing ${drained} HP.` });
          return { target, effect: 'vampiric', damage: dmg, healed: drained };
      }
      default:
          console.warn(`MagicSystem: unhandled effect type '${effect.type}' for spell '${spell.key}'`);
          return { target, effect: effect.type };
    }
  }

  _randomWalkableTile(map, entity) {
      const candidates = [];
      for (let y = 0; y < map.h; y++) {
          for (let x = 0; x < map.w; x++) {
              if (map.isWalkable(x, y) && map.getEntitiesAt(x, y).length === 0) {
                  candidates.push({ x, y });
              }
          }
      }
      if (!candidates.length) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
