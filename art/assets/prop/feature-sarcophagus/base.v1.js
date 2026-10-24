// feature-sarcophagus base.v1 (r1) — adapted from the iso chest template to the brief: a carved stone sarcophagus, 0.9 m
// (a long stone coffin: tub with a slightly narrower, heavy lid, a carved band along the lid and one at the foot).
// closed: the lid sits on the tub; open: the lid is pushed aside and rests on the floor beside the tub, the tub shows a dark hollow.
// 3D mode, stone ramp only (R11); carving is surface slabs (R5), not solids.
export const meta = { brief: 'feature-sarcophagus', pass: 'r1', notes: 'stone tub + lid, lid slid aside when open', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const W = 7, D = 5, TH = 4, LH = 2;
  m.add({ type: 'box', name: 'tub', x: 0, y: 0, z: 0, w: W, d: D, h: TH, mat: 'stone' });
  if (open) {
    m.add({ type: 'slab', name: 'hollow', x: 1, y: 1, z: TH, w: W - 2, d: D - 2, h: 1, mat: 'dirt' });
    m.add({ type: 'box', name: 'lid', x: 1, y: D, z: 0, w: W - 2, d: 3, h: LH, mat: 'stone' });
    m.add({ type: 'slab', name: 'lid-carve', x: 2, y: D + 1, z: LH, w: W - 4, d: 1, h: 1, mat: 'dirt' });
  } else {
    m.add({ type: 'box', name: 'lid', x: 0, y: 1, z: TH, w: W, d: D - 2, h: LH, mat: 'stone' });
    m.add({ type: 'slab', name: 'lid-carve', x: 2, y: 2, z: TH + LH, w: W - 3, d: 1, h: 1, mat: 'dirt' });
  }
  m.add({ type: 'slab', name: 'band', x: W - 2, y: 0, z: 1, w: 1, d: D, h: TH - 1, mat: 'dirt' });
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(20 - (W + D) / 2) });
}
