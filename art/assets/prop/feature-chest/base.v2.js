// feature-chest base.v2 (r2) — from base.v1 (6). Roster fix, colour only: the body and lid are the dark half of the wood
// ramp (wood.1/wood.2, a brown chest, no longer the cream wood.0 that twinned with the sack), the bands are the dark half
// of the metal ramp (iron, not white), the lid gets a dark seam line just under it, and the lock and the goods drop the
// red-orange accent (kept for real magic and lights): the lock is bright metal, the goods a pale metal glint.
// Same model and states as base.v1: iron-bound wooden chest, 0.7 m; open = lid up; looted = lid up and empty (dark hollow).
// Decoration is a surface slab (R5): straps, seam and lock recolour the box surface. Role ramps only (R11).
export const meta = { brief: 'feature-chest', pass: 'r2', notes: 'dark wood body, iron bands, lid seam, no red accent', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, { pal } = ctx.dir, open = ctx.state === 'open' || ctx.state === 'looted', looted = ctx.state === 'looted', m = ctx.lib.t2.scene3d();
  const dark = (r) => [r[1], r[r.length - 1]];          // the dark half of a ramp
  const body = dark(pal[P.body]), trim = dark(pal[P.trim]), bright = [pal.metal[0], pal.metal[1]];
  const W = 5, D = 3, H = 2; // footprint 5 x 3 units, body 2 units high
  m.add({ type: 'box', name: 'body', x: 0, y: 0, z: 0, w: W, d: D, h: H, mat: body });
  if (open) {
    if (looted) m.add({ type: 'slab', name: 'hollow', x: 1, y: 1, z: H - 1, w: W - 2, d: D - 2, h: 1, mat: [pal.wood[2]] });
    else m.add({ type: 'slab', name: 'goods', x: 1, y: 1, z: H - 1, w: W - 2, d: D - 2, h: 1, mat: bright });
    m.add({ type: 'box', name: 'lid', x: 0, y: -1, z: H, w: W, d: 1, h: D - 1, mat: body });
  } else {
    m.add({ type: 'box', name: 'lid', x: 0, y: 0, z: H, w: W, d: D, h: 1, mat: body });
  }
  m.add({ type: 'slab', name: 'seam', x: 0, y: 0, z: H - 1, w: W, d: D, h: 1, mat: [pal.wood[2]] });
  for (const x of [1, W - 2]) m.add({ type: 'slab', name: 'strap', x, y: open ? -1 : 0, z: 0, w: 1, d: open ? D + 1 : D, h: open ? H + D - 1 : H + 1, mat: trim });
  m.add({ type: 'slab', name: 'lock', x: W >> 1, y: D - 1, z: H - 1, w: 1, d: 1, h: 1, mat: bright });
  // screen origin: centre the model's footprint, bottom with room for the ground shadow
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 4 - (W + D)) });
}
