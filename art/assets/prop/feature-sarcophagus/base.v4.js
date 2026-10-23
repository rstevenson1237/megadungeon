// feature-sarcophagus base.v4 (x1) — from base.v3, one change, as the blind review asked: the shape reads as a
// sarcophagus, not a chest. (1) the body is a coffin: its plan (8 x 4 unit cells, drawn per column) has a straight far
// side and a near side that swells to the shoulders near the head end (x 0) and tapers to a narrow foot; (2) it stands
// on a banded plinth, its bottom course in the darker stone faces; (3) the lid follows the same coffin plan and
// carries a cross inlaid in light stone; (4) open: the tub is the same cells at the same origin in both states (only
// its top course is hollowed, its outer faces are pixel-identical), and the lid slides diagonally back along the depth
// axis (3 cells back, 1 toward the head so it fits the frame) so its near edge lies on the far rim, over a dark
// cavity floor (stone.2), with a stone.2 contact line on the lid's near face. Both states sit 1 px left of centre so
// the open lid stays inside the frame. 3D mode, role ramps only (R11); the cross and contact line are slabs (R5).
export const meta = { brief: 'feature-sarcophagus', pass: 'x1', notes: 'tapered coffin plan on a banded plinth, cross inlaid on the lid; open = lid slid back onto the far rim over a dark cavity, tub fixed', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const s = pal.stone, dk = s[s.length - 1];
  // coffin plan, head at x 0: per column x the body spans y in [0, Y[x]); the far side is straight, the near side
  // swells to the shoulders and tapers to the foot
  const Y = [3, 4, 4, 4, 3, 3, 2, 2];
  const L = Y.length, D = 4, TH = 3, SB = 3, SH = 1;    // TH: plinth (z 0) + body (z 1, 2); open: the lid slides SB back and SH toward the head
  const inPlan = (x, y) => x >= 0 && x < L && y >= 0 && y < Y[x];
  const cells = (pred, z) => { const out = []; for (let x = -SH; x < L; x++) for (let y = -SB; y < D; y++) if (pred(x, y)) out.push([x, y, z]); return out; };
  const inside = (x, y) => inPlan(x - 1, y) && inPlan(x + 1, y) && inPlan(x, y - 1) && inPlan(x, y + 1);

  // banded plinth: the bottom course in the darker stone faces
  m.add({ type: 'cells', name: 'plinth', cells: cells(inPlan, 0), mat: [s[1], s[2], s[2]] });
  // body: two courses; open hollows the top course inside a one-cell rim (the outer faces stay the same cells)
  m.add({ type: 'cells', name: 'body-low', cells: cells((x, y) => inPlan(x, y) && !(open && inside(x, y)), 1), mat: 'stone' });
  m.add({ type: 'cells', name: 'body-rim', cells: cells((x, y) => inPlan(x, y) && !(open && inside(x, y)), 2), mat: 'stone' });
  // the dark cavity: the hollow's floor, in the darkest stone (its own cells; the body leaves them out when open)
  if (open) m.add({ type: 'cells', name: 'cavity', cells: cells(inside, 1).map(([x, y]) => [x, y, 1]), mat: [dk, dk, dk] });
  // lid: the same coffin plan; open slides it SB back along the depth axis so its near edge lies on the far rim
  const ly = open ? -SB : 0, lx = open ? -SH : 0;
  m.add({ type: 'cells', name: 'lid', cells: cells((x, y) => inPlan(x - lx, y - ly), TH), mat: 'dirt' });
  // cross inlaid on the lid top in light stone: the long bar along the body, the crossbar near the head
  m.add({ type: 'slab', name: 'cross-bar', x: lx + 1, y: ly + 1, z: TH, w: 5, d: 1, h: 1, mat: 'stone' });
  m.add({ type: 'slab', name: 'cross-arm', x: lx + 2, y: ly, z: TH, w: 1, d: 3, h: 1, mat: 'stone' });
  // contact line: the lid's near face in the darkest stone where it rests on the rim
  if (open) m.add({ type: 'slab', name: 'contact', x: lx, y: ly + 3, z: TH, w: L, d: 2, h: 1, mat: [pal.dirt[0], dk, dk] });
  return m.render(w, h, { ox: Math.round(w / 2 - (L - D)) - 1, oy: Math.round(h - 10 - (L + D) / 2) });
}
