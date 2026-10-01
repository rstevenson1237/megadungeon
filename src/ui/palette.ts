// The fixed UI palette (Spec 01, "Rendering": the panes use one fixed palette).
// Values follow the approved mockup. Colours are 24-bit 0xRRGGBB.

import type { LogKind } from '../core/log.ts';

export const UI = {
  background: 0x000000,
  text: 0xa8a8a8,
  frame: 0x707070,
  title: 0xe8e8e8,
  label: 0x8a8a8a,
  value: 0xe0e0e0,
  bright: 0xffffff,
  gold: 0xf0c840,
  target: 0xe8c040,
  statCombat: 0xe06050,
  statCombatEmpty: 0x6a3a33,
  statSkill: 0x60c070,
  statSkillEmpty: 0x2f5a37,
  statMagic: 0x6090e0,
  statMagicEmpty: 0x2f4670,
} as const;

/** Log colours by type: bright for this turn's messages, dim for older ones. */
export const LOG_COLOURS: Record<LogKind, { bright: number; dim: number }> = {
  combat: { bright: 0xe05040, dim: 0x803a30 },
  loot: { bright: 0xf0c840, dim: 0x806a20 },
  discovery: { bright: 0x50d0d0, dim: 0x3f7f80 },
  rumour: { bright: 0x60d060, dim: 0x3a7a3a },
  warning: { bright: 0xf0d050, dim: 0x807028 },
  system: { bright: 0xc8c8c8, dim: 0x555555 },
};

/** Overlay windows and menus. */
export const OVERLAY = {
  frame: 0xe8e8e8,
  selectedFg: 0xf0d060,
  selectedBg: 0x3a3020,
  hint: 0x8a8a8a,
} as const;

/**
 * Map colours (Spec 01: each level theme supplies palette tokens). This is the default set,
 * taken from the mockup; themes arrive in task 3.2. Remembered cells use the dimmed colour.
 */
export const MAP = {
  floor: { visible: 0x6b5638, remembered: 0x33291c },
  wall: { visible: 0xa07a44, remembered: 0x4a3b26 },
  stairs: { visible: 0xf0e6c8, remembered: 0x6e6858 },
  door: { visible: 0xd0963c, remembered: 0x5e4520 },
  player: 0xffffff,
  background: 0x000000,
} as const;

/** Targeting overlay on the main view (Spec 01 "Targeting"), from the mockup. */
export const TARGET = {
  path: 0xe8c040,
  selectedFg: 0xffffff,
  selectedBg: 0x8a6a10,
  /** Tint for every cell an area footprint touches. */
  footprintBg: 0x3a2c0c,
  /** Background for monsters inside the footprint. */
  markedBg: 0x6a4a10,
} as const;
