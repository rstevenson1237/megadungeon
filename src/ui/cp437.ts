// Code page 437 (Spec 01, "Rendering"): glyph codes 0 to 255, their Unicode
// equivalents, and the codes of the core glyph table.

const LOW =
  '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼'; // codes 0-31 as the VGA draws them
const HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

let ascii = '';
for (let c = 32; c < 127; c++) ascii += String.fromCharCode(c);

/** Unicode character for each CP437 code (index 0 to 255). */
export const CP437_TO_UNICODE: readonly string[] = [...(LOW + ascii + '⌂' + HIGH)];

const UNICODE_TO_CP437 = new Map<string, number>();
CP437_TO_UNICODE.forEach((ch, code) => {
  // Space and NBSP both draw blank; the plain space wins, and NUL is never typed.
  if (code !== 0 && code !== 255 && !UNICODE_TO_CP437.has(ch)) UNICODE_TO_CP437.set(ch, code);
});

/** CP437 code for a character; anything not in the code page becomes "?". */
export function toCp437(ch: string): number {
  return UNICODE_TO_CP437.get(ch) ?? 63;
}

/** Truncation mark: CP437 has no ellipsis character. */
export const TRUNCATED = '»';

/** The core glyph table from Spec 01, by name. Codes are CP437. */
export const GLYPH = {
  player: 64,
  floor: 250,
  wall: 35,
  wallBlock: 219,
  wallShade: 178,
  doorClosed: 43,
  doorOpen: 39,
  doorLocked: 43,
  stairsUp: 60,
  stairsDown: 62,
  teleporter: 234,
  water: 247,
  debris: 176,
  chest: 254,
  sack: 235,
  pottery: 248,
  weaponRack: 215,
  fountain: 233,
  altar: 210,
  sarcophagus: 239,
  rune: 15,
  trap: 94,
  book: 63,
  sign: 20,
  key: 169,
  coins: 36,
  gems: 4,
  jewelry: 34,
  potion: 33,
  ring: 61,
  rod: 47,
  weapon: 41,
  armour: 91,
  clothing: 40,
  npc: 64,
} as const;
