/**
 * This file contains various data tables used by the game systems.
 */

/**
 * Table for turning undead.
 * Rows are Cleric level, columns are monster HD.
 * 'T' = Turn, 'D' = Destroy, number = roll needed on 2d6.
 */
export const TurnUndeadTable = {
  // Level:  HD1  HD2  HD3  HD4  HD5  HD6  HD7+
  1:  ['T',  'T',  'T',  9,   11,  '-', '-'],
  2:  ['D',  'T',  'T',  7,   9,   11,  '-'],
  3:  ['D',  'D',  'T',  'T', 7,   9,   11 ],
  4:  ['D',  'D',  'D',  'T', 'T', 7,   9  ],
  5:  ['D',  'D',  'D',  'D', 'T', 'T', 7  ],
  6:  ['D',  'D',  'D',  'D', 'D', 'T', 'T'],
  7:  ['D',  'D',  'D',  'D', 'D', 'D', 'T'],
  8:  ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  9:  ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  10: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  11: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  12: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  13: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  14: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  15: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  16: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  17: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  18: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  19: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
  20: ['D',  'D',  'D',  'D', 'D', 'D', 'D'],
};
