// feature-chest base.v1 (r1) — adapted to the brief: iron-bound wooden chest, 0.7 m; looted = lid open and empty (dark hollow). Template: iso chest in T2+ 3D mode (one model gives every facing and state: closed/open).
// Decoration is a surface slab (R5): straps and the lock recolour the box surface instead of interpenetrating it.
// The model is sized from ctx.size; adapt it to the brief (barrel, crate, altar, door…). Role ramps only (R11).
export const meta = { brief: 'feature-chest', pass: 'r1', notes: 'template iso chest', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, open = ctx.state === 'open' || ctx.state === 'looted', looted = ctx.state === 'looted', m = ctx.lib.t2.scene3d();
  const W = 5, D = 3, H = 2; // footprint 5 x 3 units, body 2 units high
  m.add({ type: 'box', name: 'body', x: 0, y: 0, z: 0, w: W, d: D, h: H, mat: P.body });
  if (open) {
    if (looted) m.add({ type: 'slab', name: 'hollow', x: 1, y: 1, z: H - 1, w: W - 2, d: D - 2, h: 1, mat: [ctx.dir.pal.wood[2]] });
    else m.add({ type: 'slab', name: 'goods', x: 1, y: 1, z: H - 1, w: W - 2, d: D - 2, h: 1, mat: 'accent', hi: 'glow.0' });
    m.add({ type: 'box', name: 'lid', x: 0, y: -1, z: H, w: W, d: 1, h: D - 1, mat: P.body });
  } else m.add({ type: 'box', name: 'lid', x: 0, y: 0, z: H, w: W, d: D, h: 1, mat: P.body });
  for (const x of [1, W - 2]) m.add({ type: 'slab', name: 'strap', x, y: open ? -1 : 0, z: 0, w: 1, d: open ? D + 1 : D, h: open ? H + D - 1 : H + 1, mat: P.trim });
  m.add({ type: 'slab', name: 'lock', x: W >> 1, y: D - 1, z: H - 1, w: 1, d: 1, h: 1, mat: P.trim === 'accent' ? 'metal' : 'accent' });
  // screen origin: centre the model's footprint, bottom with room for the ground shadow
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 4 - (W + D)) });
}
