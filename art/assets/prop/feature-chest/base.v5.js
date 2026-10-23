// feature-chest base.v5 (x2) — from base.v2 (7); v4 (5.5) regressed the form. Back to base.v2's clean box planes and
// straps, and the one change the reviews ask for: a closed chest that reads as a chest, not a crate.
// - Three planes: the lid top stays wood.1 (lit), the front (left, lit) face is lifted to leather.1 (a mid red-brown,
//   apart from both the top and the outline), the shadowed right face stays wood.2.
// - Lid seam: one straight 1 px dark line (wood.2 on the front, outline ink on the dark right face) where the lid meets
//   the body, pixel-patched after the render (a 3D unit is 2 px tall). base.v2's 2-unit seam slab is dropped.
// - Hasp: a 2 x 2 px bright-metal plate centred on the seam on the front face, between the two iron straps.
// - Open / looted keep base.v4's interiors: pale gold goods (glow.0 / accent.0) and a dark empty hollow (wood.2), with
//   base.v4's thin lid tilted back behind the box; the open hasp is the staple below the seam.
// base.v2 header: dark wood body, iron bands, no red-orange accent. Iron-bound wooden chest, 0.7 m. Decoration is a
// surface slab (R5). Role ramps only (R11).
export const meta = { brief: 'feature-chest', pass: 'x2', notes: 'v2 planes, lit lid top over a lifted front face, 1px seam, 2x2 hasp, v4 interiors', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, { pal } = ctx.dir, open = ctx.state === 'open' || ctx.state === 'looted', looted = ctx.state === 'looted', m = ctx.lib.t2.scene3d();
  const r = pal[P.body], t = pal[P.trim];
  const front = P.body === 'leather' ? pal.wood[1] : pal.leather[1];
  const body = [r[1], front, r[2]];                     // top lit, front (left) face lifted, right face dark
  const trim = [t[1], t[2]], bright = pal.metal[0];
  const gold = [pal.glow[0], pal.accent[0], pal.accent[0]];
  const W = 5, D = 3, H = 2; // footprint 5 x 3 units, body 2 units high
  m.add({ type: 'box', name: 'body', x: 0, y: 0, z: 0, w: W, d: D, h: H, mat: body });
  if (open) {
    // base.v4's lid: one board thick, standing behind the box and leaning back a step as it rises
    m.add({ type: 'box', name: 'lid', x: 0, y: -1, z: H, w: W, d: 1, h: 1, mat: body });
    m.add({ type: 'box', name: 'lid2', x: 0, y: -2, z: H + 1, w: W, d: 1, h: 1, mat: body });
    if (looted) m.add({ type: 'slab', name: 'hollow', x: 1, y: 0, z: H - 1, w: W - 2, d: D - 1, h: 1, mat: [r[2], r[2], r[2]] });
    else m.add({ type: 'slab', name: 'goods', x: 1, y: 0, z: H - 1, w: W - 2, d: D - 1, h: 1, mat: gold });
    for (const x of [1, W - 2]) m.add({ type: 'slab', name: 'strap', x, y: -2, z: 0, w: 1, d: D + 2, h: H + 2, mat: trim });
  } else {
    m.add({ type: 'box', name: 'lid', x: 0, y: 0, z: H, w: W, d: D, h: 1, mat: body });
    for (const x of [1, W - 2]) m.add({ type: 'slab', name: 'strap', x, y: 0, z: 0, w: 1, d: D, h: H + 1, mat: trim });
  }
  const o = { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 4 - (W + D)) };
  const g = m.render(w, h, o);

  // Lid seam, 1 px, and the hasp, in screen space from the render origin (1 unit = 2 px across, 1 px down; z 2 px):
  // the front (left) face starts 6 px left of ox and its body top row is oy + 2, falling 1 px every 2 px to the right;
  // the right face starts 4 px right of ox, level with the front's last column, and its body top row rises 1 px every 2 px. Only the box's own face pixels
  // and the iron straps are darkened (the lid opens, so the straps split too; never the outline): wood.2 on the lifted
  // front and the straps, outline ink on the dark right face.
  const ink = ctx.dir.outline, fr = front.toLowerCase(), dk = r[2].toLowerCase(), st = trim.map((c) => c.toLowerCase());
  const seamAt = (x, y) => { const c = g.get(x, y); if (c === fr || st.includes(c)) g.set(x, y, r[2]); else if (c === dk) g.set(x, y, ink); };
  const fx0 = o.ox - 6, fy0 = o.oy + 2;
  if (!open) {
    for (let i = 0; i < 2 * W; i++) seamAt(fx0 + i, fy0 + (i >> 1));
    for (let i = 0; i < 2 * D; i++) seamAt(fx0 + 2 * W + i, fy0 + W - 1 - (i >> 1));
  }
  // Hasp: 2 x 2 bright metal at the front face's centre, straddling the seam (closed) or under the rim (open, the staple).
  const hx = fx0 + W - 1, hy = fy0 + (W >> 1) - (open ? 0 : 1);
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (g.get(hx + dx, hy + dy)) g.set(hx + dx, hy + dy, bright);
  return g;
}
