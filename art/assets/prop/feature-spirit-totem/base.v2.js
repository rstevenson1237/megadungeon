// feature-spirit-totem base.v2 (r2) — from base.v1. One change, as the v1 roster asked: the three equal rectangular
// tiers (read as a chest of drawers) become three different carved figures with a varying, organic outline: a bear at
// the foot (round ears, a wide muzzle jutting out at both sides, a toothed jaw), a raven in the middle (big round eyes,
// a pale hooked beak that curls down over the bear's brow) and a thunderbird on top (wings spread wide past the pole and
// drooping at the tips, a pale beak hooked down). Only the thunderbird's eyes glow (the spirit); the lower faces are
// carved dark. Wing feathers are painted in cloth bands. Same stone footing, frame and placement as v1 (ground centre
// (16, 32), 1.8 m in the 32 x 40 frame). Role ramps only (R11): wood, stone, cloth, glow and the outline.
export const meta = { brief: 'feature-spirit-totem', pass: 'r2', notes: 'bear / raven / thunderbird carved figures with jutting muzzle, beak and spread wings', mirror: false };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const cx = w / 2, gy = h - 8, bot = gy + 2;
  // stone footing (a low iso slab)
  s.add({ type: 'path', name: 'footing', d: `M${cx - 7} ${bot - 2} L${cx} ${bot - 5} L${cx + 7} ${bot - 2} L${cx} ${bot + 1} Z`, mat: pal.stone, shade: 'bevel', underlay: true });
  // the pole behind the figures (shows between them as a slimmer neck)
  s.add({ type: 'rect', name: 'pole', x: cx - 4, y: 8, w: 8, h: bot - 10, mat: pal.wood, shade: 'cyl', axis: 'x', underlay: true });
  // 1. bear (y 20..31): round ears, a head the pole's width, jaw hinges jutting out at both sides, a toothed maw
  const b0 = 20;
  s.add({ type: 'circle', name: 'bearEarL', cx: cx - 4.5, cy: b0 + 1.5, r: 1.8, mat: pal.wood, shade: 'sphere', underlay: true });
  s.add({ type: 'circle', name: 'bearEarR', cx: cx + 4.5, cy: b0 + 1.5, r: 1.8, mat: pal.wood, shade: 'sphere', underlay: true });
  s.add({ type: 'path', name: 'bearHead', d: `M${cx - 5} ${b0 + 2} Q${cx} ${b0} ${cx + 5} ${b0 + 2} L${cx + 5} ${b0 + 5} L${cx + 7} ${b0 + 6} L${cx + 7} ${b0 + 8} L${cx + 5} ${b0 + 9} L${cx + 4} ${b0 + 11} L${cx - 4} ${b0 + 11} L${cx - 5} ${b0 + 9} L${cx - 7} ${b0 + 8} L${cx - 7} ${b0 + 6} L${cx - 5} ${b0 + 5} Z`, mat: pal.wood, shade: 'normal', round: 2, underlay: true });
  s.add({ type: 'rect', name: 'bearEyeL', x: cx - 4, y: b0 + 3, w: 2, h: 2, color: 'outline' });
  s.add({ type: 'rect', name: 'bearEyeR', x: cx + 2, y: b0 + 3, w: 2, h: 2, color: 'outline' });
  s.add({ type: 'rect', name: 'bearNose', x: cx - 1, y: b0 + 5, w: 2, h: 1, color: 'outline' });
  s.add({ type: 'rect', name: 'bearMaw', x: cx - 5, y: b0 + 7, w: 10, h: 2, color: 'outline' });
  for (const dx of [-4, -2, 1, 3]) s.add({ type: 'rect', name: 'bearTooth' + dx, x: cx + dx, y: b0 + 7, w: 1, h: 1, color: 'wood.0' });
  // 2. raven (y 12..20): a narrower head, big ringed eyes, a pale hooked beak that curls down over the bear's brow
  const r0 = 12;
  s.add({ type: 'path', name: 'ravenHead', d: `M${cx - 5} ${r0 + 2} Q${cx} ${r0 - 1} ${cx + 5} ${r0 + 2} L${cx + 5} ${r0 + 8} L${cx - 5} ${r0 + 8} Z`, mat: pal.wood, shade: 'normal', round: 2, underlay: true });
  s.add({ type: 'rect', name: 'ravenEyeL', x: cx - 4, y: r0 + 2, w: 3, h: 3, color: 'outline' });
  s.add({ type: 'rect', name: 'ravenEyeR', x: cx + 1, y: r0 + 2, w: 3, h: 3, color: 'outline' });
  s.add({ type: 'rect', name: 'ravenPupilL', x: cx - 3, y: r0 + 3, w: 1, h: 1, color: 'wood.0' });
  s.add({ type: 'rect', name: 'ravenPupilR', x: cx + 2, y: r0 + 3, w: 1, h: 1, color: 'wood.0' });
  s.add({ type: 'path', name: 'ravenBeak', d: `M${cx - 2} ${r0 + 5} L${cx + 2} ${r0 + 5} L${cx + 2} ${r0 + 8} L${cx + 1} ${r0 + 10} L${cx - 1} ${r0 + 11} L${cx - 1} ${r0 + 8} L${cx - 2} ${r0 + 7} Z`, mat: pal.wood, shade: 'flat', band: 0, underlay: true });
  // 3. thunderbird (y 2..12): spread wings drooping at the tips, painted feather bands, a beak hooked to the left
  const t0 = 4;
  s.add({ type: 'path', name: 'wingL', d: `M${cx - 3} ${t0 + 5} L${cx - 9} ${t0 + 3} L${cx - 14} ${t0 + 4} L${cx - 15} ${t0 + 8} L${cx - 12} ${t0 + 7} L${cx - 11} ${t0 + 9} L${cx - 8} ${t0 + 8} L${cx - 6} ${t0 + 10} L${cx - 3} ${t0 + 9} Z`, mat: pal.wood, shade: 'normal', round: 1, underlay: true });
  s.add({ type: 'path', name: 'wingR', d: `M${cx + 3} ${t0 + 5} L${cx + 9} ${t0 + 3} L${cx + 14} ${t0 + 4} L${cx + 15} ${t0 + 8} L${cx + 12} ${t0 + 7} L${cx + 11} ${t0 + 9} L${cx + 8} ${t0 + 8} L${cx + 6} ${t0 + 10} L${cx + 3} ${t0 + 9} Z`, mat: pal.wood, shade: 'normal', round: 1, underlay: true });
  s.add({ type: 'path', name: 'featherL', d: `M${cx - 13} ${t0 + 5} L${cx - 9} ${t0 + 4} L${cx - 5} ${t0 + 6} L${cx - 5} ${t0 + 7} L${cx - 9} ${t0 + 6} L${cx - 13} ${t0 + 7} Z`, mat: pal.cloth, shade: 'flat' });
  s.add({ type: 'path', name: 'featherR', d: `M${cx + 13} ${t0 + 5} L${cx + 9} ${t0 + 4} L${cx + 5} ${t0 + 6} L${cx + 5} ${t0 + 7} L${cx + 9} ${t0 + 6} L${cx + 13} ${t0 + 7} Z`, mat: pal.cloth, shade: 'flat' });
  s.add({ type: 'path', name: 'birdHead', d: `M${cx - 3} ${t0 + 2} Q${cx} ${t0 - 2} ${cx + 3} ${t0 + 2} L${cx + 3} ${t0 + 9} L${cx - 3} ${t0 + 9} Z`, mat: pal.wood, shade: 'normal', round: 2, underlay: true });
  s.add({ type: 'path', name: 'birdBeak', d: `M${cx - 2} ${t0 + 4} L${cx + 1} ${t0 + 5} L${cx + 1} ${t0 + 8} L${cx - 1} ${t0 + 10} L${cx - 2} ${t0 + 9} Z`, mat: pal.wood, shade: 'flat', band: 0, underlay: true });
  s.add({ type: 'rect', name: 'birdEye', x: cx, y: t0 + 3, w: 2, h: 1, color: 'glow.1' });
  s.add({ type: 'rect', name: 'birdEyeHot', x: cx, y: t0 + 3, w: 1, h: 1, color: 'glow.0' });
  return ctx.lib.proc(s).add('materialNoise', { part: 'pole', amount: 0.15 }).render();
}
