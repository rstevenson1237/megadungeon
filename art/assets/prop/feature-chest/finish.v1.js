// finish.v1 (f) on base.v2 — the one direct-pixel pass (R2). Review notes acted on (base.v2 and base.v3 scores):
// open and looted were the same pixels. Open now shows goods heaped in the box's well (pale metal and pale wood coin
// highlights over metal.1 shade, peaking above the rim); looted shows the same well empty: a dark hollow floor
// (leather.2) with the far inner walls in wood.2 and a lit front rim (wood.1). Both patches sit at the box's interior,
// in front of the raised lid. Colours are direction tokens (R11).
export const base = 'base.v2';
export const meta = { notes: 'open = goods heaped in the well; looted = empty dark hollow in the well' };

// The well: an iso diamond on the box top, in front of the raised lid. Top-left corner of the map at WELL.
const WELL = [9, 18];
// k outline, r lit rim, w far inner wall, h hollow floor
const HOLLOW = [
  '.....kk......',
  '...kkwwkk....',
  '.kkwwwwwwkk..',
  'kwwhhhhhhwwk.',
  '.rrhhhhhhrr..',
  '...rrhhrr....',
  '.....rr......',
];
// k outline, r lit rim, m metal.1 shade, s metal.0 coin, g wood.0 coin
const GOODS = [
  '.....kk......',
  '...kksgkk....',
  '.kkmgsmskk...',
  'kmsgmsgmgmk..',
  '.rrmsgmsrr...',
  '...rrmmrr....',
  '.....rr......',
];

export function finish(g, ctx) {
  const { px } = ctx.lib;
  if (ctx.state === 'looted') {
    px.patch(g, WELL, HOLLOW, { k: 'outline', r: 'wood.1', w: 'wood.2', h: 'leather.2' }, { anchor: 'topleft' });
  } else if (ctx.state === 'open') {
    px.patch(g, WELL, GOODS, { k: 'outline', r: 'wood.1', m: 'metal.1', s: 'metal.0', g: 'wood.0' }, { anchor: 'topleft' });
  }
  return g;
}
