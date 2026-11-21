// feature-spirit-totem base.v6 (x1, art redo wave 2) — from base.v3 (best base, 7.5; finish.v1 7.5 / blind 5.5). The
// one redo revision, as the blind reviewer's note asked (art/redo.md): the silhouette and the faces.
// 1. shaft: v3 was a near-full-width shield (~20 px). v6 is a 12 px pole; the thunderbird's wings sit only in the top
//    band (y 8..13, tips 10 px from the axis), so below them the outline is a slim post.
// 2. faces: three different carved faces, each its own block parted by an ink seam, alternating tone so each tier reads
//    at 1x, and drawn with lit brow/nose planes instead of dark interior lines:
//    - thunderbird (top, lit): lit brow plane, the red spirit eye, a pale beak hooked down;
//    - raven (middle, narrow and dark): a heavy lit brow ridge, pale ringed eyes under it, a short pale beak (no long strip);
//    - bear (bottom, wide-jawed, mid tone): round ears, a lit muzzle plane with a dark nose, a round open mouth and fangs.
//    (v4/v5 tried a slim pole too, but carved both lower faces alike and read as stripes; v6 makes them differ in form.)
// 3. plinth: v3's tiny grey ring becomes a stone plinth 20 px across, a 3-tone iso slab whose base sits on the floor
//    diamond's bottom 16 rows (y 24..39), with a ground shadow.
// Ground centre (16, 32), 32 x 40 frame, one state (idle). Role ramps only (R11): wood, stone, glow and the outline.
export const meta = { brief: 'feature-spirit-totem', pass: 'x1', notes: 'redo: 12 px pole, wings only at the top, three distinct faces with lit planes, wide stone plinth', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const cx = w / 2, gy = h - 8;                                   // ground centre (16, 32)
  // stone plinth: an iso slab 20 px across, 3 px high, its base diamond on the floor
  const pw = 10, pd = 5, ph = 3, pt = gy - ph;
  s.add({ type: 'poly', name: 'plinthL', pts: [[cx - pw, gy], [cx, gy + pd], [cx, pt + pd], [cx - pw, pt]], mat: pal.stone, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'poly', name: 'plinthR', pts: [[cx, gy + pd], [cx + pw, gy], [cx + pw, pt], [cx, pt + pd]], mat: pal.stone, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'poly', name: 'plinthTop', pts: [[cx - pw, pt], [cx, pt - pd], [cx + pw, pt], [cx, pt + pd]], mat: pal.stone, shade: 'flat', band: 0, underlay: true });

  // the pole behind the faces: 12 px, from the plinth's top up into the thunderbird
  const L = cx - 6;
  s.add({ type: 'rect', name: 'pole', x: L, y: 8, w: 12, h: pt + 2 - 8, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });

  // 1. bear (y 20..28): wide-jawed, mid tone, round ears, a lit muzzle, round open mouth with fangs
  const b0 = 20;
  s.add({ type: 'circle', name: 'bearEarL', cx: cx - 5, cy: b0 + 0.5, r: 1.8, mat: pal.wood, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'circle', name: 'bearEarR', cx: cx + 5, cy: b0 + 0.5, r: 1.8, mat: pal.wood, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'path', name: 'bearHead', d: `M${L} ${b0 + 1} L${L + 12} ${b0 + 1} L${L + 12} ${b0 + 7} L${L + 10} ${b0 + 9} L${L + 2} ${b0 + 9} L${L} ${b0 + 7} Z`, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  s.add({ type: 'rect', name: 'bearBrow', x: L + 1, y: b0 + 2, w: 10, h: 1, color: 'wood.0' });
  s.add({ type: 'rect', name: 'bearEyeL', x: L + 2, y: b0 + 3, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'bearEyeR', x: L + 8, y: b0 + 3, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'bearMuzzle', x: L + 4, y: b0 + 3, w: 4, h: 3, color: 'wood.0' });
  s.add({ type: 'rect', name: 'bearNose', x: L + 5, y: b0 + 3, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'path', name: 'bearMouth', d: `M${L + 3} ${b0 + 6} L${L + 9} ${b0 + 6} L${L + 8} ${b0 + 8} L${L + 4} ${b0 + 8} Z`, color: 'outline' });
  s.add({ type: 'rect', name: 'bearFangL', x: L + 4, y: b0 + 6, w: 1, h: 2, color: 'wood.0' });
  s.add({ type: 'rect', name: 'bearFangR', x: L + 7, y: b0 + 6, w: 1, h: 2, color: 'wood.0' });

  // 2. raven (y 13..19): narrower and dark, a heavy lit brow ridge, small eyes, a short pale beak
  const r0 = 13;
  s.add({ type: 'rect', name: 'ravenHead', x: L + 1, y: r0, w: 10, h: 7, r: 1, mat: pal.wood, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'path', name: 'ravenBrow', d: `M${L + 1} ${r0 + 1} L${L + 11} ${r0 + 1} L${L + 11} ${r0 + 2} L${L + 7} ${r0 + 3} L${L + 5} ${r0 + 3} L${L + 1} ${r0 + 2} Z`, color: 'wood.0' });
  s.add({ type: 'rect', name: 'ravenEyeL', x: L + 2, y: r0 + 3, w: 2, h: 2, color: 'wood.0' });
  s.add({ type: 'rect', name: 'ravenEyeR', x: L + 8, y: r0 + 3, w: 2, h: 2, color: 'wood.0' });
  s.add({ type: 'rect', name: 'ravenPupilL', x: L + 3, y: r0 + 4, w: 1, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'ravenPupilR', x: L + 8, y: r0 + 4, w: 1, h: 1, color: 'outline' });
  s.add({ type: 'path', name: 'ravenBeak', d: `M${L + 4} ${r0 + 3} L${L + 8} ${r0 + 3} L${L + 7} ${r0 + 5} L${L + 6} ${r0 + 6} L${L + 5} ${r0 + 5} Z`, color: 'wood.0' });
  s.add({ type: 'rect', name: 'ravenBeakShade', x: L + 6, y: r0 + 4, w: 1, h: 2, color: 'wood.1' });

  // 3. thunderbird (y 5..13): wings only in the top band, a lit head with the red spirit eye and a hooked beak
  const t0 = 5;
  s.add({ type: 'path', name: 'wingL', d: `M${cx - 3} ${t0 + 4} L${cx - 7} ${t0 + 3} L${cx - 10} ${t0 + 4} L${cx - 10} ${t0 + 7} L${cx - 8} ${t0 + 6} L${cx - 7} ${t0 + 8} L${cx - 5} ${t0 + 7} L${cx - 3} ${t0 + 8} Z`, mat: pal.wood, shade: 'flat', band: 1, underlay: true });
  s.add({ type: 'path', name: 'wingR', d: `M${cx + 3} ${t0 + 4} L${cx + 7} ${t0 + 3} L${cx + 10} ${t0 + 4} L${cx + 10} ${t0 + 7} L${cx + 8} ${t0 + 6} L${cx + 7} ${t0 + 8} L${cx + 5} ${t0 + 7} L${cx + 3} ${t0 + 8} Z`, mat: pal.wood, shade: 'flat', band: 2, underlay: true });
  s.add({ type: 'path', name: 'wingLitL', d: `M${cx - 4} ${t0 + 4} L${cx - 7} ${t0 + 3} L${cx - 9} ${t0 + 4} L${cx - 7} ${t0 + 4} Z`, color: 'wood.0' });
  s.add({ type: 'rect', name: 'birdHead', x: cx - 4, y: t0, w: 8, h: 9, r: 2, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  s.add({ type: 'rect', name: 'birdBrow', x: cx - 3, y: t0 + 2, w: 6, h: 1, color: 'wood.0' });
  s.add({ type: 'rect', name: 'birdEyeL', x: cx - 3, y: t0 + 3, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'birdEye', x: cx + 1, y: t0 + 3, w: 2, h: 1, color: 'glow.1' });
  s.add({ type: 'rect', name: 'birdEyeHot', x: cx + 1, y: t0 + 3, w: 1, h: 1, color: 'glow.0' });
  s.add({ type: 'path', name: 'birdBeak', d: `M${cx - 1} ${t0 + 4} L${cx + 1} ${t0 + 4} L${cx + 1} ${t0 + 7} L${cx} ${t0 + 9} L${cx - 1} ${t0 + 8} Z`, mat: pal.wood, shade: 'flat', band: 0, underlay: true });
  return ctx.lib.proc(s).add('materialNoise', { part: 'pole', amount: 0.1 }).add('groundShadow', { cx, cy: gy, rx: pw + 2 }).render();
}
