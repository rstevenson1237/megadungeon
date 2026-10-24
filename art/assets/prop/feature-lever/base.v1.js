// feature-lever base.v1 (r1) — adapted from the iso chest template to the brief: a stone post (about 0.55 m, a small iso
// block) on the cell's floor diamond with an iron lever pivoting on its top. up: the handle stands near-vertical
// (about 1.0 m overall); pulled: the handle is thrown down toward the front right, knob low. 2D T2+ scene, no floor
// drawn. Stone ramp for the post, metal for the lever, accent for a small knob grip.
export const meta = { brief: 'feature-lever', pass: 'r1', notes: 'stone post, iron lever up or thrown down', mirror: false };

export const params = {};

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: true });
  const X = v => (v * w) / 32, cx = w / 2, cy = h - 8;          // the bottom diamond's centre
  const pulled = ctx.state === 'pulled';
  const hw = X(5), hd = hw / 2, ph = Math.round(X(8));          // post half width, half depth, height
  const top = cy - ph;
  // post: left face, right face, top face (iso block)
  s.add({ type: 'poly', name: 'post-left', pts: [[cx - hw, cy], [cx, cy + hd], [cx, top + hd], [cx - hw, top]], mat: pal.stone, shade: 'flat', band: 2 });
  s.add({ type: 'poly', name: 'post-right', pts: [[cx, cy + hd], [cx + hw, cy], [cx + hw, top], [cx, top + hd]], mat: pal.stone, shade: 'flat', band: 3 });
  s.add({ type: 'poly', name: 'post-top', pts: [[cx - hw, top], [cx, top - hd], [cx + hw, top], [cx, top + hd]], mat: pal.stone, shade: 'flat', band: 0, underlay: true });
  // iron pivot plate on the top
  const px = cx, py = top;
  s.add({ type: 'ellipse', name: 'pivot', cx: px, cy: py, rx: X(2), ry: X(1), mat: pal.metal, shade: 'flat', band: 2 });
  // handle: from the pivot to the knob
  const ex = pulled ? px + X(8) : px - X(2), ey = pulled ? py + X(5) : py - X(11);
  s.add({ type: 'tube', name: 'handle', pts: [[px, py], [ex, ey]], w: Math.max(2, X(2)), mat: pal.metal, shade: 'cyl', underlay: true });
  s.add({ type: 'circle', name: 'knob', cx: ex, cy: ey, r: Math.max(2, X(2.2)), mat: pal.accent, shade: 'sphere', underlay: true });
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}
