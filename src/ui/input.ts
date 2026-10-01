// The input layer (Spec 01, "Input and controls"): keyboard only. WASD and the
// arrow keys both move, in four directions; no other action uses W, A, S or D.

import type { Command } from '../game/commands.ts';

/** The parts of a browser KeyboardEvent the layer reads. */
export interface KeyInput {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

interface Binding {
  /** What the help screen shows in the key column. */
  keys: string;
  /** What the help screen shows in the action column (Spec 01 key table). */
  action: string;
  /** Each key (as `KeyboardEvent.key`, letters lower case) with an optional Shift requirement. */
  entries: { key: string; shift?: boolean; command: Command }[];
}

const move = (dx: number, dy: number): Command => ({ type: 'move', dx, dy });

/** The key map, in the order of the Spec 01 table. */
export const KEY_BINDINGS: readonly Binding[] = [
  {
    keys: 'W A S D / arrows',
    action: 'Move; moving into a monster attacks, into a door opens it',
    entries: [
      { key: 'w', command: move(0, -1) }, { key: 'arrowup', command: move(0, -1) },
      { key: 'a', command: move(-1, 0) }, { key: 'arrowleft', command: move(-1, 0) },
      { key: 's', command: move(0, 1) }, { key: 'arrowdown', command: move(0, 1) },
      { key: 'd', command: move(1, 0) }, { key: 'arrowright', command: move(1, 0) },
    ],
  },
  { keys: 'Space', action: 'Wait one round', entries: [{ key: ' ', command: { type: 'wait' } }] },
  {
    keys: 'Z',
    action: 'Wait until a Combat die returns (10 rounds) or something interrupts',
    entries: [{ key: 'z', command: { type: 'waitLong' } }],
  },
  {
    keys: 'E',
    action: 'Interact: stairs, teleporter, container, fountain, altar, sign, NPC, village service or lift',
    entries: [{ key: 'e', command: { type: 'interact' } }],
  },
  { keys: 'X', action: 'Search the surrounding cells (a check)', entries: [{ key: 'x', command: { type: 'search' } }] },
  { keys: 'G', action: 'Pick up', entries: [{ key: 'g', command: { type: 'pickup' } }] },
  { keys: 'F', action: 'Ranged attack (enters targeting)', entries: [{ key: 'f', command: { type: 'ranged' } }] },
  { keys: 'C', action: 'Cast a spell (choose, then targeting if needed)', entries: [{ key: 'c', command: { type: 'cast' } }] },
  { keys: 'Q', action: 'Use class ability', entries: [{ key: 'q', command: { type: 'ability' } }] },
  {
    keys: 'Tab / Shift+Tab',
    action: 'Next / previous target',
    entries: [
      { key: 'tab', shift: false, command: { type: 'nextTarget' } },
      { key: 'tab', shift: true, command: { type: 'prevTarget' } },
    ],
  },
  { keys: 'Enter', action: 'Confirm target or menu choice', entries: [{ key: 'enter', command: { type: 'confirm' } }] },
  {
    keys: 'Esc',
    action: 'Cancel; with nothing to cancel, opens the game menu (help, leaderboard, quit without saving)',
    entries: [{ key: 'escape', command: { type: 'cancel' } }],
  },
  { keys: 'I', action: 'Inventory', entries: [{ key: 'i', command: { type: 'inventory' } }] },
  { keys: 'L', action: 'Look: move a cursor to read any visible cell', entries: [{ key: 'l', command: { type: 'look' } }] },
  { keys: 'M', action: 'Message history', entries: [{ key: 'm', command: { type: 'history' } }] },
  { keys: '?', action: 'Help and key list', entries: [{ key: '?', command: { type: 'help' } }] },
  {
    keys: 'J',
    action: 'Journal: lore, rumours and quests seen, grouped by level',
    entries: [{ key: 'j', command: { type: 'journal' } }],
  },
];

/**
 * The command a key press stands for, or undefined if it is not in the key map.
 * Presses with Ctrl, Alt or Meta are left alone so browser shortcuts keep working.
 */
export function keyToCommand(e: KeyInput): Command | undefined {
  if (e.ctrlKey || e.altKey || e.metaKey) return undefined;
  const key = e.key.toLowerCase();
  const shift = e.shiftKey === true;
  for (const binding of KEY_BINDINGS) {
    for (const entry of binding.entries) {
      if (entry.key !== key) continue;
      // A required Shift state only matters where the map says so (Tab); letters may be typed with Caps Lock.
      if (entry.shift !== undefined && entry.shift !== shift) continue;
      return entry.command;
    }
  }
  return undefined;
}
