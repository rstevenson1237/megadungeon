// feature-spirit-totem base.v5 (x2) — from base.v4 (7; the slimmest silhouette yet). One change, as the v4 review
// asked: the carvings below the head. In v4 the raven's long beak and the bear's muzzle ran down the shaft as pale
// vertical strips, so the pole read as planks. v5 carves the raven and the bear the same way, as two faces stacked one
// above the other, each in horizontal bands: a lit forehead, a dark brow band right across the shaft (wood.2), two lit
// cheek rows holding a 2 x 2 dark eye pair, a dark mouth band and a lit chin. The raven keeps a short pale beak hooked
// over its mouth band, the bear its round ears. Silhouette, wings, red eye, thunderbird head and stone plinth unchanged.
// --- v4 header ---
// feature-spirit-totem base.v4 (x1) — from base.v3 (best base, 7.5). One change, as the blind reviewer asked: the
// silhouette. v3 read as a squat, near-full-width shield on a tiny base ring. v4 is a slim 1.8 m pole: a 10 px shaft
// (the bear's ears and the raven's beak are the only bumps), the thunderbird's wings kept to the top band (y 5..11),
// three clearly stacked faces each carved as its own block (bear, raven, thunderbird) with lit brow and nose planes
// (wood.0) and only eyes and a mouth in dark, and a wider stone plinth (an iso slab 18 px across) standing on the floor
// diamond. Same ramps (wood, stone, glow), the red eye on the thunderbird, ground centre (16, 32), 32 x 40 frame.
// --- v3 header ---
// feature-spirit-totem base.v3 (r3) — from base.v2 (best, 7). One change, as the v2 review asked: the thunderbird's
// wings. v2's wings spread 15 px each side with blue cloth feather bands, so they read wide, muddy and bat-like and the
// blue sat outside the totem's wood/stone carving. v3 shortens them (tips at 11 px from the axis, was 15, same drooping
// carved outline) and carves the feather band in dark wood (wood.2) instead of painted cloth. Bear, raven, head, eyes,
// footing, frame and placement unchanged.
// --- v2 header ---
// feature-spirit-totem base.v2 (r2) — from base.v1. One change, as the v1 roster asked: the three equal rectangular
// tiers (read as a chest of drawers) become three different carved figures with a varying, organic outline: a bear at
// the foot, a raven in the middle and a thunderbird on top. Only the thunderbird's eyes glow (the spirit).
export const meta = { brief: 'feature-spirit-totem', pass: 'x2', notes: 'two lower faces carved in horizontal bands: brow, eye pair, mouth; short raven beak', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const cx = w / 2, gy = h - 8;                                   // ground centre (16, 32)
  // stone plinth: an iso slab 18 px across, 3 px high, its base on the floor diamond
  const pw = 9, pd = 4.5, ph = 3, pt = gy - ph;
  s.add({ type: 'poly', name: 'plinthL', pts: [[cx - pw, gy], [cx, gy + pd], [cx, pt + pd], [cx - pw, pt]], mat: pal.stone, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'poly', name: 'plinthR', pts: [[cx, gy + pd], [cx + pw, gy], [cx + pw, pt], [cx, pt + pd]], mat: pal.stone, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'poly', name: 'plinthTop', pts: [[cx - pw, pt], [cx, pt - pd], [cx + pw, pt], [cx, pt + pd]], mat: pal.stone, shade: 'flat', band: 0, underlay: true });
  // the pole: 10 px wide, from the plinth's top up into the thunderbird
  s.add({ type: 'rect', name: 'pole', x: cx - 5, y: 8, w: 10, h: pt + 1 - 8, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  // the two lower faces share one carving: a lit forehead, a dark brow band right across, two lit cheek rows with a
  // 2 x 2 dark eye pair, a dark mouth band and a lit chin, so each reads at 1x as a face in horizontal bands, not vertical strips
  const face = (n, y0) => {
    s.add({ type: 'rect', name: `${n}Forehead`, x: cx - 4, y: y0 + 1, w: 8, h: 1, color: 'wood.0' });
    s.add({ type: 'rect', name: `${n}Brow`, x: cx - 5, y: y0 + 2, w: 10, h: 1, color: 'wood.2' });
    s.add({ type: 'rect', name: `${n}Cheeks`, x: cx - 4, y: y0 + 3, w: 8, h: 2, color: 'wood.0' });
    s.add({ type: 'rect', name: `${n}EyeL`, x: cx - 3, y: y0 + 3, w: 2, h: 2, color: 'outline' });
    s.add({ type: 'rect', name: `${n}EyeR`, x: cx + 1, y: y0 + 3, w: 2, h: 2, color: 'outline' });
    s.add({ type: 'rect', name: `${n}Mouth`, x: cx - 3, y: y0 + 5, w: 6, h: 1, color: 'outline' });
    s.add({ type: 'rect', name: `${n}Chin`, x: cx - 2, y: y0 + 6, w: 4, h: 1, color: 'wood.0' });
  };
  // 1. bear (y 21..28): its own block and round ears
  const b0 = 21;
  s.add({ type: 'circle', name: 'bearEarL', cx: cx - 5, cy: b0 + 1.5, r: 1.8, mat: pal.wood, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'circle', name: 'bearEarR', cx: cx + 5, cy: b0 + 1.5, r: 1.8, mat: pal.wood, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'rect', name: 'bearHead', x: cx - 5, y: b0, w: 10, h: 8, r: 1, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  face('bear', b0);
  // 2. raven (y 13..20): the same carving, with a short pale beak hooked down over its mouth band
  const r0 = 13;
  s.add({ type: 'rect', name: 'ravenHead', x: cx - 5, y: r0, w: 10, h: 8, r: 1, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  face('raven', r0);
  s.add({ type: 'path', name: 'ravenBeak', d: `M${cx - 1} ${r0 + 5} L${cx + 1} ${r0 + 5} L${cx + 1} ${r0 + 6} L${cx} ${r0 + 7} L${cx - 1} ${r0 + 6} Z`, color: 'wood.0' });
  // 3. thunderbird (y 4..12): head block, wings only in the top band, lit brow and beak, the red spirit eye
  const t0 = 4;
  s.add({ type: 'path', name: 'wingL', d: `M${cx - 3} ${t0 + 3} L${cx - 7} ${t0 + 1} L${cx - 10} ${t0 + 2} L${cx - 11} ${t0 + 6} L${cx - 9} ${t0 + 5} L${cx - 7} ${t0 + 7} L${cx - 5} ${t0 + 6} L${cx - 3} ${t0 + 7} Z`, mat: pal.wood, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'path', name: 'wingR', d: `M${cx + 3} ${t0 + 3} L${cx + 7} ${t0 + 1} L${cx + 10} ${t0 + 2} L${cx + 11} ${t0 + 6} L${cx + 9} ${t0 + 5} L${cx + 7} ${t0 + 7} L${cx + 5} ${t0 + 6} L${cx + 3} ${t0 + 7} Z`, mat: pal.wood, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'path', name: 'wingLitL', d: `M${cx - 4} ${t0 + 3} L${cx - 7} ${t0 + 2} L${cx - 10} ${t0 + 3} L${cx - 7} ${t0 + 3} Z`, color: 'wood.0' });
  s.add({ type: 'rect', name: 'birdHead', x: cx - 4, y: t0, w: 8, h: 9, r: 2, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  s.add({ type: 'rect', name: 'birdBrow', x: cx - 3, y: t0 + 2, w: 6, h: 1, color: 'wood.0' });
  s.add({ type: 'rect', name: 'birdEyeL', x: cx - 3, y: t0 + 3, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'birdEye', x: cx + 1, y: t0 + 3, w: 2, h: 1, color: 'glow.1' });
  s.add({ type: 'rect', name: 'birdEyeHot', x: cx + 1, y: t0 + 3, w: 1, h: 1, color: 'glow.0' });
  s.add({ type: 'path', name: 'birdBeak', d: `M${cx - 1} ${t0 + 4} L${cx + 1} ${t0 + 4} L${cx + 1} ${t0 + 7} L${cx} ${t0 + 9} L${cx - 1} ${t0 + 8} Z`, mat: pal.wood, shade: 'flat', band: 0, underlay: true });
  return ctx.lib.proc(s).add('materialNoise', { part: 'pole', amount: 0.1 }).add('groundShadow', { cx, cy: gy, rx: pw + 2 }).render();
}
