// feature-chest base.v4 (x1) — from base.v2 (7). Blind reviewer's fix: the closed chest read as a banded crate and its
// side faces sat near the outline. Changes: fine voxels (k = 2) so the lid seam is one dark row just under the lid and a
// 1 x 1.5 unit (2 x 3 px) bright-metal hasp is centred on the front (left, lit) face; the lit left face is lifted one wood
// step (wood.1, the shadowed right face stays wood.2); the two front iron straps become one band wrapping front to back so the front shows the seam and hasp; open: the lid is thinner (half a unit) and tilted back, and the
// goods are the warm pale accent/glow ("gold") steps, not pale grey metal; looted keeps the empty dark hollow.
// base.v2 header: dark wood body, iron bands, no red-orange accent. Iron-bound wooden chest, 0.7 m; open = lid up;
// looted = lid up and empty. Decoration is a surface slab (R5). Role ramps only (R11).
export const meta = { brief: 'feature-chest', pass: 'x1', notes: 'lid seam, centred hasp, lit left face, gold goods, thin tilted lid', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, { pal } = ctx.dir, open = ctx.state === 'open' || ctx.state === 'looted', looted = ctx.state === 'looted', m = ctx.lib.t2.scene3d();
  const r = pal[P.body], t = pal[P.trim];
  const body = [r[1], r[1], r[2]];                     // top and lit left face one step up, shadowed right face dark
  const trim = [t[1], t[1], t[2]], bright = [pal.metal[0], pal.metal[0], pal.metal[1]];
  const gold = [pal.glow[0], pal.accent[0], pal.accent[0]];
  const seam = [r[2], r[2], r[2]];
  const W = 5, D = 3, H = 2; // footprint 5 x 3 units, body 2 units high
  m.add({ type: 'box', name: 'body', x: 0, y: 0, z: 0, w: W, d: D, h: H, mat: body });
  if (open) {
    // lid tilted back: one board thick, standing behind the box and leaning back a step as it rises
    m.add({ type: 'box', name: 'lid', x: 0, y: -1, z: H, w: W, d: 1, h: 1, mat: body });
    m.add({ type: 'box', name: 'lid2', x: 0, y: -2, z: H + 1, w: W, d: 1, h: 1, mat: body });
  } else m.add({ type: 'box', name: 'lid', x: 0, y: 0, z: H, w: W, d: D, h: 1, mat: body });
  // surface slabs (R5), after the solids so they recolour them. One iron band wraps the chest front to back (over the
  // lid and down both ends), so the front face stays clear wood for the seam and the hasp; the open lid has two straps.
  m.add({ type: 'slab', name: 'band', x: 0, y: 1, z: 0, w: W, d: 1, h: H + 1, mat: trim });
  if (open) for (const x of [1, W - 2]) m.add({ type: 'slab', name: 'strap', x, y: -2, z: H, w: 1, d: 2, h: 2, mat: trim });
  if (!open) m.add({ type: 'slab', name: 'seam', x: 0, y: 0, z: H - 1, w: W, d: D, h: 1, mat: seam });
  else if (looted) m.add({ type: 'slab', name: 'hollow', x: 1, y: 0, z: H - 1, w: W - 2, d: D - 1, h: 1, mat: seam });
  else m.add({ type: 'slab', name: 'goods', x: 1, y: 0, z: H - 1, w: W - 2, d: D - 1, h: 1, mat: gold });
  // hasp centred on the front (lit left) face, across the seam: two rows closed, one (the staple) when open
  m.add({ type: 'slab', name: 'hasp', x: W >> 1, y: D - 1, z: H - 1, w: 1, d: 1, h: open ? 1 : 2, mat: bright });
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 4 - (W + D)) });
}
