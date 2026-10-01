import { describe, expect, it } from 'vitest';
import { createRng, type Rng } from '../src/core/rng.ts';
import {
  NOTICE_TARGET, COMBAT_RADIUS, LOSE_TRACK_ROUNDS, alertedByCombat, noticeRoll,
} from '../src/rules/combat/awareness.ts';
import {
  THEFTS_BEFORE_FLEEING, creatureMelee, failsMorale, monsterMelee, monsterRanged, playerMelee, playerRanged, poolDie, theftAmount,
} from '../src/rules/combat/attacks.ts';
import type { Pool } from '../src/rules/character/dice.ts';
import { npcRating } from '../src/rules/world/depth.ts';

/** A stand-in generator that deals the given faces in order. */
const dealer = (...faces: number[]): Rng => ({ int: () => faces.shift()! }) as unknown as Rng;
const pool = (step: 4 | 6 | 8 | 10 | 12, dice: number): Pool => ({ step, dice, max: 3 });

describe('Spec 04: the four attack kinds', () => {
  describe('player melee: one Combat die against a monster d6 plus modifier', () => {
    it('the higher total hits; a tie hits both', () => {
      // player rolls 4, monster rolls 3 + 0
      expect(playerMelee(dealer(4, 3), pool(6, 2), { modifier: 0, unaware: false })).toMatchObject({ defenderHit: true, attackerHit: false });
      expect(playerMelee(dealer(2, 5), pool(6, 2), { modifier: 0, unaware: false })).toMatchObject({ defenderHit: false, attackerHit: true });
      expect(playerMelee(dealer(3, 3), pool(6, 2), { modifier: 0, unaware: false })).toMatchObject({ defenderHit: true, attackerHit: true });
    });

    it('the monster adds its modifier, which can turn a lower roll into a tie or a win', () => {
      expect(playerMelee(dealer(4, 2), pool(6, 2), { modifier: 2, unaware: false })).toMatchObject({ defender: 4, defenderHit: true, attackerHit: true });
      expect(playerMelee(dealer(4, 3), pool(6, 2), { modifier: 2, unaware: false })).toMatchObject({ defender: 5, defenderHit: false, attackerHit: true });
    });

    it('an unaware or asleep monster rolls with disadvantage: the lower of two dice', () => {
      // player 4; monster rolls 6 and 2 and keeps 2
      expect(playerMelee(dealer(4, 6, 2), pool(6, 2), { modifier: 0, unaware: true })).toMatchObject({ defender: 2, defenderHit: true, attackerHit: false });
    });

    it('rolling from an empty Combat pool is at disadvantage', () => {
      expect(playerMelee(dealer(6, 2, 4), pool(6, 0), { modifier: 0, unaware: false })).toMatchObject({ attacker: 2 });
      expect(poolDie(dealer(5, 1), pool(8, 0))).toBe(1);
      expect(poolDie(dealer(5), pool(8, 1))).toBe(5);
    });
  });

  describe('monster melee: d6 plus modifier against one Combat die', () => {
    it('the higher total hits; a tie hits both', () => {
      expect(monsterMelee(dealer(5, 3), { modifier: 0, ambush: false }, pool(6, 2))).toMatchObject({ defenderHit: true, attackerHit: false });
      expect(monsterMelee(dealer(3, 3), { modifier: 0, ambush: false }, pool(6, 2))).toMatchObject({ defenderHit: true, attackerHit: true });
      expect(monsterMelee(dealer(2, 6), { modifier: 1, ambush: false }, pool(6, 2))).toMatchObject({ defenderHit: false, attackerHit: true });
    });

    it('an ambusher\'s first attack has advantage: the higher of two dice', () => {
      expect(monsterMelee(dealer(2, 6, 3), { modifier: 0, ambush: true }, pool(6, 2))).toMatchObject({ attacker: 6, defenderHit: true });
    });

    it('rolling the defence from an empty pool is at disadvantage', () => {
      expect(monsterMelee(dealer(3, 6, 1), { modifier: 0, ambush: false }, pool(6, 0))).toMatchObject({ defender: 1 });
    });

    it('two creatures fight with d6 plus modifier each, an unaware one at disadvantage', () => {
      expect(creatureMelee(dealer(4, 3), { modifier: 0 }, { modifier: 0 })).toMatchObject({ defenderHit: true, attackerHit: false });
      expect(creatureMelee(dealer(4, 6, 2), { modifier: 0 }, { modifier: 0, unaware: true })).toMatchObject({ defender: 2 });
    });
  });

  describe('player ranged: one Skill die as a skill use', () => {
    it('4 or more hits; 2 to 3 hits and the die is lost; 1 misses and the die is lost', () => {
      const p = pool(8, 3);
      expect(playerRanged(dealer(4), p, false)).toMatchObject({ success: true, dieLost: false });
      expect(p.dice).toBe(3);
      expect(playerRanged(dealer(3), p, false)).toMatchObject({ success: true, dieLost: true });
      expect(p.dice).toBe(2);
      expect(playerRanged(dealer(1), p, false)).toMatchObject({ success: false, dieLost: true });
      expect(p.dice).toBe(1);
    });

    it('an adjacent target gives the attacker disadvantage', () => {
      expect(playerRanged(dealer(6, 2), pool(8, 3), true)).toMatchObject({ face: 2 });
      expect(playerRanged(dealer(6, 2), pool(8, 3), false)).toMatchObject({ face: 6 });
    });

    it('from an empty pool it rolls at disadvantage and costs nothing further', () => {
      const p = pool(6, 0);
      expect(playerRanged(dealer(3, 1), p, false)).toMatchObject({ success: false, dieLost: false });
      expect(p.dice).toBe(0);
    });
  });

  describe('monster ranged or spell: d6 plus modifier against an unspent defence die', () => {
    it('only a higher total hits; a tie misses', () => {
      expect(monsterRanged(dealer(5, 3), 0, pool(6, 2)).hit).toBe(true);
      expect(monsterRanged(dealer(3, 3), 0, pool(6, 2)).hit).toBe(false);
      expect(monsterRanged(dealer(2, 3), 1, pool(6, 2)).hit).toBe(false);
      expect(monsterRanged(dealer(2, 1), 1, pool(6, 2)).hit).toBe(true);
    });

    it('does not spend the defending die, and an empty pool defends at disadvantage', () => {
      const p = pool(6, 2);
      monsterRanged(dealer(1, 1), 0, p);
      expect(p.dice).toBe(2);
      expect(monsterRanged(dealer(4, 6, 2), 0, pool(6, 0))).toMatchObject({ defender: 2, hit: true });
    });
  });
});

describe('Spec 04: awareness rolls', () => {
  it('an asleep creature wakes on a 6 and an unaware one on 4 or more', () => {
    expect(NOTICE_TARGET).toEqual({ asleep: 6, unaware: 4 });
    for (let face = 1; face <= 6; face++) {
      expect(noticeRoll(dealer(face), 'asleep')).toBe(face === 6);
      expect(noticeRoll(dealer(face), 'unaware')).toBe(face >= 4);
    }
  });

  it('a stealth buff gives disadvantage on the notice roll', () => {
    expect(noticeRoll(dealer(6, 2), 'unaware', true)).toBe(false);
    expect(noticeRoll(dealer(6, 6), 'unaware', true)).toBe(true);
    expect(noticeRoll(dealer(6, 5), 'asleep', true)).toBe(false);
  });

  it('combat wakes sleepers within 3 cells and alerts the unaware within 6, and nobody further', () => {
    expect(COMBAT_RADIUS).toEqual({ asleep: 3, unaware: 6 });
    expect(alertedByCombat('asleep', 9)).toBe(true);
    expect(alertedByCombat('asleep', 10)).toBe(false);
    expect(alertedByCombat('unaware', 36)).toBe(true);
    expect(alertedByCombat('unaware', 37)).toBe(false);
    expect(alertedByCombat('alert', 1)).toBe(false);
  });

  it('an alert creature loses track after 20 rounds', () => {
    expect(LOSE_TRACK_ROUNDS).toBe(20);
  });
});

describe('Spec 04: morale, theft and NPC ratings', () => {
  it('a creature reduced to one die flees on a 1 or 2', () => {
    const c = { dice: 1, maxDice: 3, fearless: false };
    for (let face = 1; face <= 6; face++) expect(failsMorale(dealer(face), c)).toBe(face <= 2);
  });

  it('never rolls with two or more dice, with one die from the start, or when fearless', () => {
    expect(failsMorale(dealer(1), { dice: 2, maxDice: 3, fearless: false })).toBe(false);
    expect(failsMorale(dealer(1), { dice: 1, maxDice: 1, fearless: false })).toBe(false);
    expect(failsMorale(dealer(1), { dice: 1, maxDice: 3, fearless: true })).toBe(false);
  });

  it('theft takes 10% of the carried gold, rounded up, at least 1', () => {
    expect([0, 1, 9, 10, 11, 100, 250].map(theftAmount)).toEqual([0, 1, 1, 1, 2, 10, 25]);
    expect(THEFTS_BEFORE_FLEEING).toBe(2);
  });

  it('bandits and rivals take the level\'s rating ceiling and the depth modifier', () => {
    expect(npcRating(1)).toEqual({ dice: 1, modifier: 0 });
    expect(npcRating(50)).toEqual({ dice: 11, modifier: 3 });
    expect(npcRating(100)).toEqual({ dice: 20, modifier: 6 });
    expect(createRng(1)).toBeTruthy();
  });
});
