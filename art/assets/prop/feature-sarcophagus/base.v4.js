// feature-sarcophagus base.v4 (x1) — from base.v3, one change, as the blind review asked: the shape reads as a
// sarcophagus, not a chest. (1) the body is a coffin: its plan tapers from broad shoulders near the head end (x 0)
// to a narrow foot, drawn as unit cells per column; (2) it stands on a banded plinth one course high, a step wider
// than the body, in the darker stone faces, with a dark carved band round the body; (3) the lid follows the same
// coffin plan and carries a raised cross in relief; (4) open: the tub is the same cells at the same origin in both
// states (no shift, only its top course is hollowed), and the lid is slid back along the depth axis so its near edge
// rests on the far rim, over a dark cavity, with a stone.2 contact line along the lid's underside edge.
// 3D mode, role ramps only (R11); carving and the cross are surface trim (`slab`), not solids (R5).
export const meta = { brief: 'feature-sarcophagus', pass: 'x1', notes: 'tapered coffin plan on a banded plinth, cross relief on the lid; open = lid slid back onto the far rim over a dark cavity, tub fixed', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const s = pal.stone, dk = s[s.length - 1];
  // coffin plan, head at x 0: per column x, the body spans y in [y0, y1)
  const PLAN = [[1, 3], [0, 4], [0, 4], [0, 4], [0, 3], [1, 3], [1, 3], [1, 2]];
  const L = PLAN.length, TH = 3, SB = 3;                 // TH: plinth (z 0) + body (z 1, 2); open: the lid slides SB back
  const inPlan = (x, y, grow = 0) => x >= -grow && x < L + grow && PLAN.some(([a, b], i) => Math.abs(i - x) <= grow && y >= a - grow && y < b + grow);
  const cells = (pred, z) => { const out = []; for (let x = -1; x <= L; x++) for (let y = -1; y <= 4; y++) if (pred(x, y)) out.push([x, y, z]); return out; };
  const inside = (x, y) => inPlan(x, y) && inPlan(x - 1, y) && inPlan(x + 1, y) && inPlan(x, y - 1) && inPlan(x, y + 1);

  // banded plinth: one course, a step wider than the body, darker faces
  m.add({ type: 'cells', name: 'plinth', cells: cells((x, y) => inPlan(x, y, 1) && x >= 0 && x < L + 1, 0), mat: [s[1], s[2], s[2]] });
  // body: two courses; open hollows the top course inside a one-cell rim
  m.add({ type: 'cells', name: 'body-low', cells: cells((x, y) => inPlan(x, y), 1), mat: 'stone' });
  m.add({ type: 'cells', name: 'body-rim', cells: cells((x, y) => inPlan(x, y) && !(open && inside(x, y)), 2), mat: 'stone' });
  // carved band round the body's lower course
  m.add({ type: 'slab', name: 'band', x: -1, y: -1, z: 1, w: L + 2, d: 6, h: 1, mat: [s[1], dk, dk] });
  if (open) m.add({ type: 'slab', name: 'cavity', x: 1, y: 1, z: 1, w: L - 2, d: 2, h: 1, mat: [dk, dk, dk] });
  // lid: the same coffin plan; open slides it SB back along the depth axis onto the far rim
  const ly = open ? -SB : 0;
  m.add({ type: 'cells', name: 'lid', cells: cells((x, y) => inPlan(x, y - ly), TH), mat: 'dirt' });
  // raised cross on the lid: the long bar along the body, the crossbar near the head
  m.add({ type: 'slab', name: 'cross-bar', x: 1, y: ly + 1, z: TH + 1, w: 5, d: 1, h: 1, mat: 'stone', add: true });
  m.add({ type: 'slab', name: 'cross-arm', x: 2, y: ly, z: TH + 1, w: 1, d: 3, h: 1, mat: 'stone', add: true });
  if (open) m.add({ type: 'slab', name: 'contact', x: 0, y: ly + 3, z: TH, w: L, d: 1, h: 1, mat: [s[1], dk, dk] });
  return m.render(w, h, { ox: Math.round(w / 2 - (L - 4)), oy: Math.round(h - 10 - (L + 4) / 2) });
}
