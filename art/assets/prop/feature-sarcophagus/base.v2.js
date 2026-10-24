// feature-sarcophagus base.v2 (r2) — from base.v1, acting on the v1 roster note (plain grey box, no lid seam, twins the
// altar): (1) a long, low proportion (7 x 3 units, not 7 x 5); (2) a two-tone body that reads apart from the pale altar at
// 1x: the tub is pale stone and the lid dark stone (dirt ramp), so the lid seam is a clear colour break; (3) a carved
// effigy lies on the lid in pale stone (a head and a long body), the figure that says "tomb" at 1x.
// Open: the lid lies on the floor behind the tub (pushed off the far side; in front it read as steps), and the tub's
// top is a dark hollow inside a thin rim.
// 3D mode, role ramps only (R11); the effigy is raised surface trim (`slab` add: true, R5), not a solid.
export const meta = { brief: 'feature-sarcophagus', pass: 'r2', notes: 'long pale tub, dark lid with a pale carved effigy; lid on the floor behind when open', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const W = 7, D = 3, TH = 3, LH = 1;
  const hollow = [pal.stone[2], pal.stone[2], pal.stone[2]];             // the dark inside: stone's deepest step on every face
  const lid = (x0, y0, z) => {
    m.add({ type: 'box', name: 'lid', x: x0, y: y0, z, w: W, d: D, h: LH, mat: 'dirt' });
    m.add({ type: 'slab', name: 'effigy-head', x: x0 + 1, y: y0 + 1, z: z + LH, w: 1, d: 1, h: 1, mat: 'stone', add: true });
    m.add({ type: 'slab', name: 'effigy-body', x: x0 + 3, y: y0 + 1, z: z + LH, w: 3, d: 1, h: 1, mat: 'stone', add: true });
  };
  m.add({ type: 'box', name: 'tub', x: 0, y: 0, z: 0, w: W, d: D, h: TH, mat: 'stone' });
  if (open) {
    m.add({ type: 'slab', name: 'hollow', x: 1, y: 1, z: TH - 1, w: W - 2, d: D - 2, h: 1, mat: hollow });
    lid(1, -D, 0);
  } else {
    lid(0, 0, TH);
  }
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D) - (open ? D + 1 : 0)), // open: shift left for the lid behind
    oy: Math.round(h - 10 - (W + D) / 2) });
}
