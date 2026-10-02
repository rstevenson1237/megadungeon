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
 * taken from the mockup; themes arrive in task 4.2. Remembered cells use the dimmed colour.
 */
export const MAP = {
  floor: { visible: 0x6b5638, remembered: 0x33291c },
  wall: { visible: 0xa07a44, remembered: 0x4a3b26 },
  stairs: { visible: 0xf0e6c8, remembered: 0x6e6858 },
  door: { visible: 0xd0963c, remembered: 0x5e4520 },
  shallowWater: { visible: 0x4a8fd0, remembered: 0x21415e },
  deepWater: { visible: 0x2a5aa8, remembered: 0x162c52 },
  lava: { visible: 0xe05a20, remembered: 0x6a2a10 },
  trap: { visible: 0xe05a5a, remembered: 0x6a2e2e },
  container: { visible: 0xd0a458, remembered: 0x54442a },
  fixture: { visible: 0x78b8c8, remembered: 0x2c4a52 },
  debris: { visible: 0x8a7a5c, remembered: 0x3a3226 },
  sign: { visible: 0xd8d878, remembered: 0x58582e },
  rune: { visible: 0xc888e8, remembered: 0x502e5c },
  special: { visible: 0xe090ff, remembered: 0x58305e },
  player: 0xffffff,
  background: 0x000000,
} as const;

/** Traders, hermits and captives on the map (Spec 01 core glyph table, Spec 07): an @ coloured by role. */
export const NPC_LOOK: Readonly<Record<string, { glyph: string; colour: number }>> = {
  trader: { glyph: '@', colour: 0xf0c840 },
  hermit: { glyph: '@', colour: 0x9ad06a },
  captive: { glyph: '@', colour: 0xe8e8a0 },
};

/** Loose items on the floor (Spec 01 core glyph table): coins in gold, the rest plain. */
export const ITEM_COLOURS = { coins: 0xf0c840, other: 0xe0e0e0 } as const;

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

/** The terrain colours a theme's palette can set, as the map draws them: in sight and remembered. */
export type TerrainColours = Record<'wall' | 'floor' | 'door' | 'stairs' | 'shallowWater' | 'deepWater' | 'lava' | 'special', { visible: number; remembered: number }>;

/** How a level's map looks: its terrain colours and its wall and floor glyphs (Spec 01, Rendering; Spec 08, Addendum A). */
export interface MapLook {
  colours: TerrainColours;
  wallGlyph: number;
  floorGlyph: number;
}

/** What a theme row gives the look; a theme without them draws in the default set. */
export interface ThemeLook {
  palette?: Record<string, string> | undefined;
  tiles?: { wall: number; floor: number } | undefined;
}

/** The default look: the mockup's colours, # walls and · floor. */
export const DEFAULT_LOOK: MapLook = {
  colours: { wall: MAP.wall, floor: MAP.floor, door: MAP.door, stairs: MAP.stairs, shallowWater: MAP.shallowWater, deepWater: MAP.deepWater, lava: MAP.lava, special: MAP.special },
  wallGlyph: 35,
  floorGlyph: 250,
};

/** A remembered cell's colour: the colour at half brightness, as the default set's remembered colours are. */
export const dimmed = (colour: number): number => (((colour >> 17) & 0x7f) << 16) | (((colour >> 9) & 0x7f) << 8) | ((colour >> 1) & 0x7f);

/** Where each palette token lands on the map; the accent colours the specials (teleporters, levers). */
const TOKEN_TO_TERRAIN: Readonly<Record<string, keyof TerrainColours>> = {
  wall: 'wall', floor: 'floor', door: 'door', stairs: 'stairs', shallow_water: 'shallowWater', deep_water: 'deepWater', lava: 'lava', accent: 'special',
};

/** The look of a level of the given theme: its palette and tiles over the default set. */
export function mapLook(theme: ThemeLook | undefined): MapLook {
  if (!theme?.palette && !theme?.tiles) return DEFAULT_LOOK;
  const colours = { ...DEFAULT_LOOK.colours };
  for (const [token, hex] of Object.entries(theme.palette ?? {})) {
    const terrain = TOKEN_TO_TERRAIN[token];
    if (!terrain) continue;
    const visible = parseInt(hex.slice(1), 16);
    colours[terrain] = { visible, remembered: dimmed(visible) };
  }
  return { colours, wallGlyph: theme.tiles?.wall ?? DEFAULT_LOOK.wallGlyph, floorGlyph: theme.tiles?.floor ?? DEFAULT_LOOK.floorGlyph };
}
