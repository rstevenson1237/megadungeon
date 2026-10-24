// feature-spirit-totem base.v1 (r1) — adapted from the iso chest template, rebuilt as a flat T2+ scene: a 1.8 m carved
// spirit totem pole standing on the cell's floor diamond centre (16, h - 8). Three stacked carved faces (brow, glowing
// eyes, nose, mouth) in a wooden post on a small stone footing, a horned crown on top. Drawn at its full 1.8 m (about 29 px) in the 32 x 40 frame. Role ramps only (R11).
export const meta = { brief: 'feature-spirit-totem', pass: 'r1', notes: 'stacked carved faces totem pole', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const cx = w / 2, gy = h - 8, bot = gy + 2, seg = 8, pw = 10; // ground centre, base line, head height, post width
  const x0 = cx - pw / 2;
  // stone footing (a low iso slab)
  s.add({ type: 'path', name: 'footing', d: `M${cx - 8} ${bot - 2} L${cx} ${bot - 6} L${cx + 8} ${bot - 2} L${cx} ${bot + 2} Z`, mat: pal.stone, shade: 'bevel', underlay: true });
  // heads, bottom to top
  for (let i = 0; i < 3; i++) {
    const y1 = bot - 3 - i * seg, y0 = y1 - seg, ww = i === 2 ? pw + 2 : pw, xx = cx - ww / 2;
    s.add({ type: 'rect', name: 'head' + i, x: xx, y: y0, w: ww, h: seg, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
    s.add({ type: 'rect', name: 'brow' + i, x: xx, y: y0 + 1, w: ww, h: 1, color: 'wood.2' });
    s.add({ type: 'rect', name: 'eyeL' + i, x: cx - 3, y: y0 + 3, w: 2, h: 2, color: 'glow.0' });
    s.add({ type: 'rect', name: 'eyeR' + i, x: cx + 1, y: y0 + 3, w: 2, h: 2, color: 'glow.0' });
    s.add({ type: 'rect', name: 'nose' + i, x: cx - 0.5, y: y0 + 5, w: 1, h: 1, color: 'wood.2' });
    s.add({ type: 'rect', name: 'mouth' + i, x: cx - 2, y: y0 + 6, w: 4, h: 1, color: 'outline' });
  }
  // horns on the crown
  const yt = bot - 3 - 3 * seg;
  s.add({ type: 'poly', name: 'hornL', pts: [[cx - 5, yt + 1], [cx - 6, yt - 3], [cx - 3, yt]], mat: pal.stone, shade: 'flat', underlay: true });
  s.add({ type: 'poly', name: 'hornR', pts: [[cx + 5, yt + 1], [cx + 6, yt - 3], [cx + 3, yt]], mat: pal.stone, shade: 'flat', underlay: true });
  return ctx.lib.proc(s).add('materialNoise', { part: 'head0', amount: 0.15 }).render();
}
