// Player commands (Spec 01, "Input and controls"). The UI turns key presses
// into these; the game acts on them.

export type Command =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'wait' }
  | { type: 'waitLong' }
  | { type: 'interact' }
  | { type: 'search' }
  | { type: 'pickup' }
  | { type: 'ranged' }
  | { type: 'cast' }
  | { type: 'ability' }
  | { type: 'nextTarget' }
  | { type: 'prevTarget' }
  | { type: 'confirm' }
  | { type: 'cancel' }
  | { type: 'inventory' }
  | { type: 'look' }
  | { type: 'history' }
  | { type: 'help' }
  | { type: 'journal' };

export type CommandType = Command['type'];

/** Short names, used in "not yet available" log messages. */
export const COMMAND_NAMES: Record<CommandType, string> = {
  move: 'Moving',
  wait: 'Waiting',
  waitLong: 'Waiting until recovered',
  interact: 'Interacting',
  search: 'Searching',
  pickup: 'Picking up',
  ranged: 'Ranged attacks',
  cast: 'Casting',
  ability: 'Class abilities',
  nextTarget: 'Targeting',
  prevTarget: 'Targeting',
  confirm: 'Confirming',
  cancel: 'Cancelling',
  inventory: 'Inventory',
  look: 'Looking',
  history: 'Message history',
  help: 'Help',
  journal: 'Journal',
};
