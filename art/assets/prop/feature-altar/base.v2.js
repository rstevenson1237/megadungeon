// feature-altar base.v2 (r2) — from base.v1, acting on the v1 roster notes: (1) lower: the body is 5 units, not 8, so it
// stands near 1.1 m beside the fountain; (2) no waisted I-beam: a solid block under a slab top that overhangs it by one
// unit on the two faces we see (a lip, so the slab reads); (3) read apart from the sarcophagus: a dark red-brown (leather
// ramp) altar cloth lies along the slab and hangs down the front, so the altar is stone + cloth, not plain grey.
// Offered: two lit candles (glow: a real light) on the slab, one on the cloth; the v1 cup and lozenge are dropped (they did
// not read at 1x, and red-orange is kept for lights). 3D mode, role ramps only (R11); decoration is surface slabs (R5).
export const meta = { brief: 'feature-altar', pass: 'r2', notes: 'solid stone altar block, slab top, leather altar cloth; two lit candles when offered', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone'], default: 'stone' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, offered = ctx.state === 'offered', m = ctx.lib.t2.scene3d();
  const W = 6, D = 4, BH = 4, TH = 1, TOP = BH + TH;                 // 1 model unit = 2 px across
  m.add({ type: 'box', name: 'block', x: 0, y: 0, z: 0, w: W - 1, d: D - 1, h: BH, mat: P.body });
  m.add({ type: 'box', name: 'slab', x: 0, y: 0, z: BH, w: W, d: D, h: TH, mat: P.body, hi: 'stone.0' });
  // the altar cloth: across the slab top and down the short front face
  m.add({ type: 'slab', name: 'runner-top', x: 1, y: 0, z: TOP - 1, w: 2, d: D, h: 1, mat: 'leather' });
  m.add({ type: 'slab', name: 'runner-hang', x: 1, y: D - 1, z: BH, w: 2, d: 1, h: TH, mat: 'leather' });
  m.add({ type: 'slab', name: 'runner-fall', x: 1, y: D - 2, z: 1, w: 2, d: 1, h: BH - 1, mat: 'leather', add: true });
  if (offered) {
    for (const cx of [1, 4]) {
      m.add({ type: 'box', name: 'candle', x: cx, y: 1, z: TOP, w: 1, d: 1, h: 1, mat: 'wood' });
      m.add({ type: 'box', name: 'flame', x: cx, y: 1, z: TOP + 1, w: 1, d: 1, h: 1, mat: 'glow' });
    }
  }
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 8 - (W + D) / 2) });
}
