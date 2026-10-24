// feature-weapon-rack base.v1 (r1) — adapted from the iso chest template: a 1.6 m wooden weapon rack in T2+ 3D mode.
// Two posts, a plinth, a low and a high rail; weapons (blades, a spear, an axe) stand in the slots between the rails.
// States: closed = every slot full; open = a gap (two weapons missing, one leans askew); looted = bare rack.
// Weapons are boxes in metal with a wood/leather grip; role ramps only (R11).
export const meta = { brief: 'feature-weapon-rack', pass: 'r1', notes: 'wooden rack, weapons in slots; gap / bare by state', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'stone', 'leather'], default: 'wood' },
  trim: { type: 'swap', options: ['metal', 'accent'], default: 'metal' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, st = ctx.state, m = ctx.lib.t2.scene3d();
  const H = 9; // post height in px (1 unit = 1 px high); the iso view adds the rest, ~26 px drawn = 1.6 m
  const W = 7, D = 2;                                  // 16 px wide along the diagonal, 4 px deep
  // frame: plinth, two posts, low and high rail
  m.add({ type: 'box', name: 'plinth', x: 0, y: 0, z: 0, w: W, d: D, h: 2, mat: P.body });
  for (const x of [0, W - 1]) m.add({ type: 'box', name: 'post' + x, x, y: 0, z: 2, w: 1, d: D, h: H - 2, mat: P.body });
  m.add({ type: 'box', name: 'railLow', x: 1, y: 0, z: Math.round(H * 0.3), w: W - 2, d: 1, h: 2, mat: P.body });
  m.add({ type: 'box', name: 'railHigh', x: 1, y: 0, z: Math.round(H * 0.68), w: W - 2, d: 1, h: 2, mat: P.body });
  // weapons: [slot x, length, kind]
  const slots = [[1, 0.85, 'sword'], [2, 1.0, 'spear'], [3, 0.8, 'axe'], [4, 0.9, 'sword'], [5, 0.75, 'mace']];
  const present = st === 'looted' ? [] : st === 'open' ? [0, 3] : [0, 1, 2, 3, 4];
  const z0 = 3;
  for (const i of present) {
    const [x, f, kind] = slots[i], len = Math.round(H * f), grip = Math.max(3, Math.round(len * 0.28));
    m.add({ type: 'box', name: 'w' + i + 'g', x, y: 1, z: z0, w: 1, d: 1, h: grip, mat: kind === 'spear' ? 'wood' : 'leather' });
    m.add({ type: 'box', name: 'w' + i + 'b', x, y: 1, z: z0 + grip, w: 1, d: 1, h: len - grip, mat: P.trim });
    if (kind === 'axe' || kind === 'mace') m.add({ type: 'box', name: 'w' + i + 'h', x: x, y: 1, z: z0 + len - 5, w: 1, d: 1, h: 4, mat: P.trim });
  }
  if (st === 'open') m.add({ type: 'box', name: 'fallen', x: 2, y: 1, z: 2, w: 3, d: 1, h: 1, mat: P.trim });
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 10 - (W + D) / 2) });
}
