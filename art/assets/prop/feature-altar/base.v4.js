// feature-altar base.v4 (x1) — from base.v3 (6; blind re-score 5.5: "reads as a squat stone cube/crate"). One change, the
// blind reviewer's point: the shape is now an altar, not a block — a long, low mensa slab (10 x 4 units, 1 thick) overhanging
// a narrower stepped base (a dark plinth step inset one unit at each end, and a recessed pedestal inset again on every side),
// so light shows under the slab. The cloth is a clear runner: the cloth ramp (blue-grey, not the leather that read as rust)
// laid across the slab's short width and hanging free down the front as a fold in front of the recessed pedestal. Offered:
// two slim tall candles (wood.0 wax, glow flame) at the slab's ends and a small metal bowl between them, not square blocks.
// base.v3 notes follow.
// feature-altar base.v3 (r3) — from base.v2 (6, tied best; v2 kept as the base for its height and cloth). One change, as
// the r2 review asked ("reads as a crate/cube"): the body is stepped so the silhouette is an altar, not a box — a darker
// stone plinth at the foot (the stone ramp's mid and dark steps, from ctx.dir.pal), a narrower block above it set back
// one unit on the two faces we see, and the slab top overhanging that block by a unit on those faces, two units thick
// over the plinth's one. Total height stays v2's 5 units (drawn 22 px with the fuller plinth footprint: a height flag, +25 %; 4 units hid the step). Cloth, candles and placement are v2's.
// base.v2 notes follow.
// feature-altar base.v2 (r2) — from base.v1, acting on the v1 roster notes: (1) lower: the body is 5 units, not 8, so it
// stands near 1.1 m beside the fountain; (2) no waisted I-beam: a solid block under a slab top that overhangs it by one
// unit on the two faces we see (a lip, so the slab reads); (3) read apart from the sarcophagus: a dark red-brown (leather
// ramp) altar cloth lies along the slab and hangs down the front, so the altar is stone + cloth, not plain grey.
// Offered: two lit candles (glow: a real light) on the slab, one on the cloth; the v1 cup and lozenge are dropped (they did
// not read at 1x, and red-orange is kept for lights). 3D mode, role ramps only (R11); decoration is surface slabs (R5).
export const meta = { brief: 'feature-altar', pass: 'x1', notes: 'long low slab overhanging a stepped, recessed base; cloth runner hanging down the front; slim candles and a bowl when offered', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone'], default: 'stone' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, offered = ctx.state === 'offered', m = ctx.lib.t2.scene3d();
  const W = 10, D = 4, PH = 1, BH = 2, TH = 1, TOP = PH + BH + TH;   // 1 model unit = 2 px across
  const st = ctx.dir.pal[P.body], DARK = [st[1], st[2], st[2]];       // the plinth: the body ramp's darker steps
  m.add({ type: 'box', name: 'plinth', x: 1, y: 0, z: 0, w: W - 2, d: D, h: PH, mat: DARK });
  m.add({ type: 'box', name: 'pedestal', x: 2, y: 1, z: PH, w: W - 4, d: D - 2, h: BH, mat: P.body });
  m.add({ type: 'box', name: 'mensa', x: 0, y: 0, z: PH + BH, w: W, d: D, h: TH, mat: P.body, hi: 'stone.0' });
  // the cloth runner: across the slab's short width, then hanging free down the front in front of the pedestal
  const RX = 4, RW = 2, wd = ctx.dir.pal.wood, WAX = [wd[0], wd[0], wd[1]];
  m.add({ type: 'slab', name: 'runner-top', x: RX, y: 0, z: TOP - 1, w: RW, d: D, h: 1, mat: 'cloth' });
  m.add({ type: 'slab', name: 'runner-fold', x: RX, y: D - 1, z: PH, w: RW, d: 1, h: BH, mat: 'cloth', add: true });
  if (offered) {
    for (const cx of [1, W - 2]) {
      m.add({ type: 'box', name: 'candle', x: cx, y: 1, z: TOP, w: 1, d: 1, h: 2, mat: WAX });
      m.add({ type: 'box', name: 'flame', x: cx, y: 1, z: TOP + 2, w: 1, d: 1, h: 1, mat: 'glow' });
    }
    m.add({ type: 'box', name: 'bowl', x: 7, y: 2, z: TOP, w: 1, d: 1, h: 1, mat: 'metal' });
  }
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 8 - (W + D) / 2) });
}
