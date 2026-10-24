// feature-lever base.v3 (r3) — from base.v2 (best, 7). One change, as the v2 review asked: the thrown lever. In v2 the
// pulled handle ended at the post's right edge, so handle and knob merged into the post as one blob at 1x. v3 throws it
// down to a long, clear diagonal well past the post (end 11 px right, 8 px down from the pivot, knob near floor level),
// so the pulled silhouette reads as a handle sticking out of the block. Post, up state, colours and placement unchanged.
// --- v2 header ---
// feature-lever base.v2 (r2) — from base.v1. One change, as the v1 roster asked: the stone post. v1's side faces used
// stone bands 2 and 3 (band 3 clamps to the darkest step), so the post was a thin near-black fill. v2 makes it a broader
// block (half width 6 px, was 5) with readable faces: top band 0, the lit left face band 1 (mid stone), the shaded right
// face band 1 darkened only by a stone-dark masonry seam and the outline, plus light material noise so it reads as cut
// stone. Lever, knob, states and placement unchanged.
// --- v1 header ---
// feature-lever base.v1 (r1) — adapted from the iso chest template to the brief: a stone post (about 0.55 m, a small iso
// block) on the cell's floor diamond with an iron lever pivoting on its top. up: the handle stands near-vertical
// (about 1.0 m overall); pulled: the handle is thrown down toward the front right, knob low. 2D T2+ scene, no floor
// drawn. Stone ramp for the post, metal for the lever, accent for a small knob grip.
export const meta = { brief: 'feature-lever', pass: 'r3', notes: 'pulled handle thrown to a long diagonal past the post; rest as v2', mirror: false };

export const params = {};

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: true });
  const X = v => (v * w) / 32, cx = w / 2, cy = h - 8;          // the bottom diamond's centre
  const pulled = ctx.state === 'pulled';
  const hw = X(6), hd = hw / 2, ph = Math.round(X(8));          // post half width, half depth, height
  const top = cy - ph;
  // post: left face, right face, top face (iso block)
  s.add({ type: 'poly', name: 'post-left', pts: [[cx - hw, cy], [cx, cy + hd], [cx, top + hd], [cx - hw, top]], mat: pal.stone, shade: 'flat', band: 1 });
  s.add({ type: 'poly', name: 'post-right', pts: [[cx, cy + hd], [cx + hw, cy], [cx + hw, top], [cx, top + hd]], mat: pal.stone, shade: 'flat', band: 1 });
  // masonry seam: one course line across both side faces, stone dark
  const sy = Math.round(ph / 2);
  s.add({ type: 'poly', name: 'seam-left', pts: [[cx - hw, cy - sy], [cx, cy + hd - sy], [cx, cy + hd - sy + 1], [cx - hw, cy - sy + 1]], color: 'stone.2' });
  s.add({ type: 'poly', name: 'seam-right', pts: [[cx, cy + hd - sy], [cx + hw, cy - sy], [cx + hw, cy - sy + 1], [cx, cy + hd - sy + 1]], color: 'stone.2' });
  s.add({ type: 'rect', name: 'edge', x: cx, y: top + hd, w: 1, h: ph, color: 'stone.2' });
  s.add({ type: 'poly', name: 'post-top', pts: [[cx - hw, top], [cx, top - hd], [cx + hw, top], [cx, top + hd]], mat: pal.stone, shade: 'flat', band: 0, underlay: true });
  // iron pivot plate on the top
  const px = cx, py = top;
  s.add({ type: 'ellipse', name: 'pivot', cx: px, cy: py, rx: X(2), ry: X(1), mat: pal.metal, shade: 'flat', band: 2 });
  // handle: from the pivot to the knob
  const ex = pulled ? px + X(11) : px - X(2), ey = pulled ? py + X(8) : py - X(11);
  s.add({ type: 'tube', name: 'handle', pts: [[px, py], [ex, ey]], w: Math.max(2, X(2)), mat: pal.metal, shade: 'cyl', underlay: true });
  s.add({ type: 'circle', name: 'knob', cx: ex, cy: ey, r: Math.max(2, X(2.2)), mat: pal.accent, shade: 'sphere', underlay: true });
  return ctx.lib.proc(s).add('materialNoise', { part: 'post-right', amount: 0.15 }).add('groundShadow', {}).render();
}
