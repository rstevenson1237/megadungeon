// feature-sarcophagus base.v3 (r3) — from base.v2, acting on its review note (reads as a plain grey crate; open state
// weak): (1) the lid overhangs the tub by half a unit at both ends and the near side, a lip that marks the seam;
// (2) carved relief: two sunken dark panels on the tub's long side and one on its end (the effigy stays on the lid);
// (3) open: the lid stays up but is pushed back off the far side, a visibly offset slab, and the tub's top shows a
// dark hollow inside a pale rim.
// 3D mode, role ramps only (R11); the carving is surface trim (`slab`, R5), not solids.
export const meta = { brief: 'feature-sarcophagus', pass: 'r3', notes: 'overhanging dark lid with effigy, carved side panels; open = lid pushed back over a dark hollow', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const W = 7, D = 3, TH = 3, LH = 1, O = 0.5, SL = 0, SB = 3;               // open: the lid slides SL along and SB back
  const hollow = [pal.stone[2], pal.stone[2], pal.stone[2]];         // the dark inside: stone's deepest step on every face
  const carve = [pal.stone[2], pal.stone[2], pal.stone[2]];          // sunken relief panels: stone's deepest step
  m.add({ type: 'box', name: 'tub', x: 0, y: 0, z: 0, w: W, d: D, h: TH, mat: 'stone' });
  for (const px of [1, 4]) m.add({ type: 'slab', name: `side-panel-${px}`, x: px, y: D - 1, z: 1, w: 2, d: 1, h: 1, mat: carve });
  m.add({ type: 'slab', name: 'end-panel', x: W - 1, y: 1, z: 1, w: 1, d: 1, h: 1, mat: carve });
  const lx = open ? SL : 0, ly = open ? -SB : 0;
  if (open) m.add({ type: 'slab', name: 'hollow', x: 1, y: 1, z: TH - 1, w: W - 2, d: D - 2, h: 1, mat: hollow });
  m.add({ type: 'box', name: 'lid', x: lx - O, y: ly, z: TH, w: W + 2 * O, d: D + O, h: LH, mat: 'dirt' });
  m.add({ type: 'slab', name: 'effigy-head', x: lx + 1, y: ly + 1, z: TH + LH, w: 1, d: 1, h: 1, mat: 'stone', add: true });
  m.add({ type: 'slab', name: 'effigy-body', x: lx + 3, y: ly + 1, z: TH + LH, w: 3, d: 1, h: 1, mat: 'stone', add: true });
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D) - (open ? 4 : 0)), oy: Math.round(h - 10 - (W + D) / 2) });
}
