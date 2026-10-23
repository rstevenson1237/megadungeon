// feature-lever base.v4 (x1) — from base.v3 (best base, 7). One change, as the blind reviewer asked: the pulled state
// must read as a thrown lever on a stone post. The arm is now a dark outlined iron rod (metal band 2) that leaves a
// pivot slot set in an iron bracket on the post's top and runs down and out to the knob, instead of a light streak
// across the cap; the post keeps the stone ramp but gets block seams (two courses, staggered joints) and lit chips so it
// reads as cut stone, not smooth metal; the knob is a rounder 3 x 3 grip in the darker accent step; and both states use
// one fixed cast shadow under the post. Placement and the up state's pose unchanged.
// --- v3 header ---
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
export const meta = { brief: 'feature-lever', pass: 'x1', notes: 'dark iron rod from a pivot slot, seamed stone post, round dark knob, one shadow', mirror: false };

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
  // block seams: two courses across both faces, stone dark
  const course = k => {
      const sy = Math.round((ph * k) / 3);
    s.add({ type: 'poly', name: `seam-l${k}`, pts: [[cx - hw, cy - sy], [cx, cy + hd - sy], [cx, cy + hd - sy + 1], [cx - hw, cy - sy + 1]], color: 'stone.2' });
    s.add({ type: 'poly', name: `seam-r${k}`, pts: [[cx, cy + hd - sy], [cx + hw, cy - sy], [cx + hw, cy - sy + 1], [cx, cy + hd - sy + 1]], color: 'stone.2' });
  };
  course(1.5);
  // staggered vertical joints: one per course per face, shifted between courses
  const yAt = (x, k) => cy - Math.round((ph * k) / 3) + (x < cx ? (x - (cx - hw)) / 2 : (cx + hw - x) / 2);
  const joint = (name, x, k0, k1) => { const y0 = Math.round(yAt(x, k1)) + 1; s.add({ type: 'rect', name, x: Math.round(x), y: y0, w: 1, h: Math.max(1, Math.round(yAt(x, k0)) - y0), color: 'stone.2' }); };
  joint('joint-l0', cx - X(3), 0, 1.5); joint('joint-l1', cx - X(4.5), 1.5, 3);
  joint('joint-r0', cx + X(3.5), 0, 1.5); joint('joint-r1', cx + X(2), 1.5, 3);
  s.add({ type: 'rect', name: 'edge', x: cx, y: top + hd, w: 1, h: ph, color: 'stone.2' });
  // lit chips on the left face's block edges (light from the upper left)
  s.add({ type: 'rect', name: 'chip-1', x: cx - hw + 1, y: Math.round(top + 2), w: 1, h: 1, color: 'stone.0' });
  s.add({ type: 'rect', name: 'chip-2', x: cx - X(2), y: Math.round(yAt(cx - X(2), 1.5)) + 1, w: 1, h: 1, color: 'stone.0' });
  s.add({ type: 'poly', name: 'post-top', pts: [[cx - hw, top], [cx, top - hd], [cx + hw, top], [cx, top + hd]], mat: pal.stone, shade: 'flat', band: 0, underlay: true });
  // iron pivot bracket on the top: two cheeks around a dark slot running toward the throw (front right)
  const px = cx, py = top;
  s.add({ type: 'poly', name: 'bracket', pts: [[px - X(2.5), py], [px, py - X(1.25)], [px + X(2.5), py], [px, py + X(1.25)]], mat: pal.metal, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'poly', name: 'slot', pts: [[px - X(0.5), py - X(0.5)], [px + X(2), py + X(0.5)], [px + X(2), py + X(1.25)], [px - X(0.5), py + X(0.25)]], color: 'outline' });
  // handle: a dark iron rod from the pivot to the knob
  const ex = pulled ? px + X(11) : px - X(2), ey = pulled ? py + X(8) : py - X(11);
  s.add({ type: 'tube', name: 'rod', pts: [[px, py], [ex, ey]], w: Math.max(2, X(2)), mat: pal.metal, shade: 'flat', band: 2, underlay: true });
  // knob: a round 3 x 3 grip in the darker accent step, one lit pixel
  s.add({ type: 'circle', name: 'knob', cx: ex, cy: ey, r: X(2), mat: pal.accent, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'rect', name: 'knob-hi', x: Math.round(ex - X(1)), y: Math.round(ey - X(1.5)), w: 1, h: 1, color: 'accent.1' });
  return ctx.lib.proc(s).add('materialNoise', { part: 'post-right', amount: 0.15 })
    .add('groundShadow', { cx, cy, rx: hw + X(2) }).render();
}
