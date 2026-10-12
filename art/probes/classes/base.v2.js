// probe-classes base.v2 (r2) — from base.v1. The owner asked for more human heads and fewer square shapes, so:
// heads are egg-shaped with a narrower jaw, a neck and a nose shadow; every body, robe, cloak, helm, hood and shield
// is a smooth closed curve through mirrored points (no trapezoids or boxes); legs taper and arms bend at the elbow.
// Silhouettes per class are unchanged from v1. Frame 32 x 40; the figure stands about 29 px, the player's 1.8 m.
// Role ramps only (R11): skin hair cloth leather metal accent.
export const meta = { brief: 'probe-classes', pass: 'r2', notes: 'organic: egg heads, curved bodies, bent arms' };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const X = v => (v * w) / 32, Y = v => (v * h) / 40, cx = X(16);
  const foot = Y(38), knee = Y(31), waist = Y(25), shoulder = Y(17), headY = Y(11.5);
  const add = n => s.add(n);
  const L = cx - X(8), R = cx + X(8); // the hands: right hand on the viewer's left, left hand on the viewer's right

  // a smooth closed curve through the points (quadratics through the midpoints), so nothing has a hard corner
  const smooth = pts => {
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
    let d = `M${m(pts[n - 1], pts[0]).join(' ')}`;
    for (let i = 0; i < n; i++) d += ` Q${pts[i].join(' ')} ${m(pts[i], pts[(i + 1) % n]).join(' ')}`;
    return d + ' Z';
  };
  // a symmetric shape from its right side: [dx, y] from the top centre down to the bottom centre
  const sym = (side, ox = cx) => smooth([...side.map(([dx, y]) => [ox + X(dx), y]), ...side.slice().reverse().map(([dx, y]) => [ox - X(dx), y])]);
  const shape = (name, mat, side, extra = {}) => add({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2), d: sym(side), ...extra });

  const legs = (mat, spread = 2.4, thick = 1.6) => {
    for (const k of [-1, 1]) add({ type: 'capsule', name: 'leg', underlay: true, mat, shade: 'cyl', a: [cx + k * X(spread - 0.6), waist], b: [cx + k * X(spread), foot - Y(1.5)], r: X(thick), r1: X(thick * 0.75) });
  };
  const boots = mat => add({ type: 'ellipse', name: 'boot', cx: cx - X(2.8), cy: foot - Y(1), rx: X(2), ry: Y(1.4), mat, shade: 'sphere', mirrorX: cx });
  const neck = () => add({ type: 'capsule', name: 'neck', mat: pal.skin, shade: 'cyl', a: [cx, headY + Y(2)], b: [cx, shoulder], r: X(1.3) });
  // an egg-shaped head: round cranium, narrower jaw, a nose shadow and eyes set at mid-height
  const head = (y = headY, opts = {}) => {
    add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere',
      d: smooth([[cx, y - Y(4.6)], [cx + X(3.4), y - Y(4)], [cx + X(3.2), y + Y(1)], [cx + X(1.6), y + Y(3.8)], [cx, y + Y(4.4)], [cx - X(1.6), y + Y(3.8)], [cx - X(3.2), y + Y(1)], [cx - X(3.4), y - Y(4)]]) });
    if (opts.ears !== false) add({ type: 'ellipse', name: 'ear', cx: cx - X(3.3), cy: y + Y(0.5), rx: X(0.8), ry: Y(1.2), mat: pal.skin, shade: 'flat', band: 1, mirrorX: cx });
    add({ type: 'rect', name: 'eye', x: Math.round(cx - X(2)), y: Math.round(y), w: 1, h: 1, color: opts.eye ?? 'outline', mirrorX: cx });
    add({ type: 'rect', name: 'nose', x: Math.round(cx), y: Math.round(y + Y(1.5)), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
  };
  // an arm bent at the elbow, ending in a hand (or a gloved fist in mat)
  const arm = (side, mat, hx, hy, opts = {}) => {
    const sx = cx + side * X(opts.wide ?? 5), sy = shoulder + Y(1.2), ex = (sx + hx) / 2 + side * X(1.5), ey = (sy + hy) / 2 + Y(0.5), r = X(opts.r ?? 1.3);
    add({ type: 'capsule', name: 'upper-arm', underlay: true, mat, shade: 'cyl', a: [sx, sy], b: [ex, ey], r, r1: r * 0.9 });
    add({ type: 'capsule', name: 'forearm', underlay: true, mat, shade: 'cyl', a: [ex, ey], b: [hx, hy], r: r * 0.9, r1: r * 0.8 });
    if (opts.hand !== false) add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.1), mat: opts.glove ?? pal.skin, shade: 'sphere' });
  };
  const pole = (mat, x0, y0, x1, y1, r = 0.7, name = 'pole') => add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: [x0, y0], b: [x1, y1], r: X(r) });

  switch (ctx.state) {
    case 'paladin': { // rounded plate, a domed bascinet, flanged mace, curved kite shield
      legs(pal.metal, 2.4, 1.9); boots(pal.metal);
      shape('plate', pal.metal, [[0, shoulder - Y(1)], [6.5, shoulder], [7, shoulder + Y(3)], [5, waist - Y(2)], [5.5, waist + Y(2)], [0, waist + Y(2.5)]]);
      shape('tabard', pal.cloth, [[0, shoulder + Y(2)], [2, shoulder + Y(2)], [2.2, knee - Y(1)], [0, knee]], { shade: 'flat', band: 1 });
      add({ type: 'ellipse', name: 'pauldron', cx: cx - X(6), cy: shoulder + Y(1), rx: X(3), ry: Y(2.4), mat: pal.metal, shade: 'sphere', mirrorX: cx, underlay: true });
      add({ type: 'path', name: 'helm', underlay: true, mat: pal.metal, shade: 'sphere',
        d: smooth([[cx, headY - Y(6)], [cx + X(4.2), headY - Y(4)], [cx + X(4), headY + Y(3)], [cx, headY + Y(4.5)], [cx - X(4), headY + Y(3)], [cx - X(4.2), headY - Y(4)]]) });
      add({ type: 'path', name: 'visor', color: 'outline', d: `M${cx - X(3)} ${headY} Q${cx} ${headY + Y(1)} ${cx + X(3)} ${headY} V${headY + Y(1)} Q${cx} ${headY + Y(2)} ${cx - X(3)} ${headY + Y(1)} Z` });
      arm(-1, pal.metal, L + X(1), waist - Y(1), { r: 1.6, glove: pal.metal });
      pole(pal.leather, L + X(1), waist - Y(1), L - X(2), waist + Y(6), 0.6, 'haft');
      add({ type: 'star', name: 'mace', cx: L - X(2.5), cy: waist + Y(7), r: X(3), r2: X(1.8), n: 6, mat: pal.metal, shade: 'sphere', underlay: true });
      add({ type: 'path', name: 'shield', underlay: true, mat: pal.cloth, shade: 'sphere',
        d: smooth([[R, shoulder - Y(1)], [R + X(4.2), shoulder], [R + X(3.5), waist], [R, waist + Y(7)], [R - X(3.5), waist], [R - X(4.2), shoulder]]) });
      add({ type: 'rect', name: 'cross', x: R - X(0.75), y: shoulder + Y(2), w: X(1.5), h: Y(10), mat: pal.metal, shade: 'flat', band: 0 });
      add({ type: 'rect', name: 'cross', x: R - X(3), y: shoulder + Y(5), w: X(6), h: Y(1.5), mat: pal.metal, shade: 'flat', band: 0 });
      break;
    }
    case 'bard': { // slim doublet, wide feathered hat, rapier, lute on the back
      add({ type: 'ellipse', name: 'lute', cx: R - X(2), cy: shoulder + Y(1), rx: X(3.5), ry: X(4.5), mat: pal.leather, shade: 'sphere', underlay: true });
      pole(pal.leather, R - X(3), shoulder - Y(2), R + X(4), shoulder - Y(10), 0.7, 'lute-neck');
      legs(pal.leather, 2, 1.4); boots(pal.leather);
      neck();
      shape('doublet', pal.cloth, [[0, shoulder - Y(0.5)], [4.5, shoulder], [4.8, shoulder + Y(3)], [3.4, waist - Y(1)], [5, waist + Y(2)], [0, waist + Y(2.5)]]);
      add({ type: 'capsule', name: 'slash', a: [cx, shoulder + Y(1.5)], b: [cx, waist], r: X(0.6), mat: pal.accent, shade: 'flat', band: 1 });
      head();
      add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(3.5), rx: X(7), ry: Y(1.8), mat: pal.cloth, shade: 'normal', round: X(1), underlay: true });
      add({ type: 'ellipse', name: 'crown', cx: cx + X(0.5), cy: headY - Y(5.5), rx: X(3.5), ry: Y(2.5), mat: pal.cloth, shade: 'sphere', underlay: true });
      add({ type: 'tube', name: 'feather', pts: [[cx + X(3), headY - Y(5.5)], [cx + X(6), headY - Y(9.5)], [cx + X(10), headY - Y(10.5)]], w: X(2), w1: X(0.6), mat: pal.accent, shade: 'flat', band: 0 });
      arm(-1, pal.cloth, L + X(2), waist);
      pole(pal.metal, L + X(2), waist, L - X(5), foot - Y(1), 0.45, 'rapier');
      add({ type: 'arc', name: 'guard', cx: L + X(2), cy: waist, r: X(1.8), w: X(0.8), a0: 0, a1: 200, mat: pal.metal, shade: 'flat', band: 0 });
      arm(1, pal.cloth, R - X(2.5), waist - Y(1));
      break;
    }
    case 'monk': { // bare scalp, wrapped robe with a sash, long staff held across the body
      legs(pal.accent, 2.2, 1.7);
      add({ type: 'ellipse', name: 'wraps', cx: cx - X(2.6), cy: foot - Y(3.5), rx: X(1.8), ry: Y(1.6), mat: pal.cloth, shade: 'sphere', mirrorX: cx });
      boots(pal.leather);
      neck();
      shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.6, shoulder], [5, shoulder + Y(4)], [4.2, waist], [6, knee - Y(1)], [0, knee]]);
      add({ type: 'ellipse', name: 'sash', cx, cy: waist, rx: X(5), ry: Y(1.2), mat: pal.leather, shade: 'cyl', axis: 'x' });
      head();
      pole(pal.leather, L - X(4), foot - Y(4), R + X(5), shoulder - Y(9), 0.75, 'staff');
      arm(-1, pal.skin, cx - X(3), waist - Y(3));
      arm(1, pal.skin, cx + X(5), shoulder + Y(2));
      break;
    }
    case 'druid': { // bear-head hood and pelt to the ground, gnarled staff with a crystal
      shape('pelt', pal.hair, [[0, shoulder - Y(1)], [6, shoulder], [7, shoulder + Y(6)], [7.5, foot - Y(3)], [6, foot - Y(0.5)], [0, foot]]);
      shape('leaf-wrap', pal.leather, [[0, shoulder + Y(2)], [2.5, shoulder + Y(2)], [2, waist], [0, waist + Y(3)]]);
      head(headY + Y(1), { ears: false });
      add({ type: 'path', name: 'bear-head', underlay: true, mat: pal.hair, shade: 'sphere',
        d: `M${cx - X(5.5)} ${headY + Y(3)} Q${cx - X(6)} ${headY - Y(7)} ${cx} ${headY - Y(7)} Q${cx + X(6)} ${headY - Y(7)} ${cx + X(5.5)} ${headY + Y(3)} Q${cx + X(4)} ${headY - Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(2.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(4)} ${headY - Y(1)} ${cx - X(5.5)} ${headY + Y(3)} Z` });
      add({ type: 'circle', name: 'ear', cx: cx - X(4.5), cy: headY - Y(7), r: X(1.6), mat: pal.hair, shade: 'sphere', mirrorX: cx, underlay: true });
      add({ type: 'ellipse', name: 'snout', cx, cy: headY - Y(3.5), rx: X(2), ry: Y(1.2), mat: pal.hair, shade: 'sphere' });
      add({ type: 'rect', name: 'bear-eye', x: Math.round(cx - X(3)), y: Math.round(headY - Y(5)), w: 1, h: 1, color: 'outline', mirrorX: cx });
      add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.8), waist], [L - X(0.8), shoulder], [L - X(1), headY - Y(8)]], w: X(1.5), w1: X(1.1) });
      add({ type: 'star', name: 'crystal', cx: L - X(1), cy: headY - Y(10), r: X(2.4), r2: X(1.2), n: 4, mat: pal.accent, shade: 'sphere' });
      arm(-1, pal.hair, L + X(0.6), waist - Y(4), { r: 1.6 });
      break;
    }
    case 'ranger': { // deep hood and long cloak, crossbow held across the front
      shape('cloak', pal.hair, [[0, shoulder - Y(1)], [6, shoulder], [7.5, waist], [8, knee + Y(1)], [5, knee + Y(2.5)], [0, knee + Y(2)]]);
      legs(pal.leather, 2.2, 1.5); boots(pal.leather);
      shape('jerkin', pal.leather, [[0, shoulder], [4, shoulder + Y(0.5)], [3.6, waist - Y(1)], [4, waist + Y(2)], [0, waist + Y(2)]]);
      head(headY + Y(0.5), { ears: false });
      add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'sphere',
        d: `M${cx - X(5)} ${headY + Y(4)} Q${cx - X(5.5)} ${headY - Y(7)} ${cx + X(1)} ${headY - Y(7)} Q${cx + X(5.5)} ${headY - Y(5)} ${cx + X(5)} ${headY + Y(4)} Q${cx + X(3.5)} ${headY + Y(1)} ${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(3.5)} ${cx - X(3)} ${headY - Y(1)} Q${cx - X(3.5)} ${headY + Y(1)} ${cx - X(5)} ${headY + Y(4)} Z` });
      arm(-1, pal.leather, cx - X(3), waist - Y(1), { glove: pal.leather });
      arm(1, pal.leather, cx + X(4), waist - Y(1), { glove: pal.leather });
      add({ type: 'capsule', name: 'stock', underlay: true, mat: pal.leather, shade: 'cyl', axis: 'x', a: [cx - X(7.5), waist - Y(1)], b: [cx + X(5), waist - Y(1)], r: X(1), r1: X(0.8) });
      add({ type: 'arc', name: 'bow', underlay: true, cx: cx - X(4.5), cy: waist - Y(1), r: X(5), w: X(1.2), a0: 120, a1: 240, mat: pal.metal, shade: 'flat', band: 1 });
      break;
    }
    case 'necromancer': { // pointed deep hood, robe to the ground, a staff with an orb and an open book
      shape('robe', pal.leather, [[0, shoulder - Y(1)], [5, shoulder], [5.5, waist - Y(2)], [7.5, foot - Y(1.5)], [5, foot], [0, foot - Y(0.5)]]);
      add({ type: 'path', name: 'hood', underlay: true, mat: pal.leather, shade: 'sphere',
        d: `M${cx - X(5)} ${shoulder + Y(1)} Q${cx - X(5.5)} ${headY - Y(4)} ${cx + X(2)} ${headY - Y(8)} Q${cx + X(5.5)} ${headY - Y(2)} ${cx + X(5)} ${shoulder + Y(1)} Q${cx} ${shoulder + Y(2)} ${cx - X(5)} ${shoulder + Y(1)} Z` });
      add({ type: 'ellipse', name: 'shadow-face', cx, cy: headY + Y(0.8), rx: X(2.6), ry: Y(3.2), color: 'outline' });
      add({ type: 'rect', name: 'eye', x: Math.round(cx - X(2)), y: Math.round(headY), w: 1, h: 1, color: 'accent.0', mirrorX: cx });
      add({ type: 'tube', name: 'staff', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.5), waist], [L - X(0.5), headY - Y(6)]], w: X(1.3), w1: X(1) });
      add({ type: 'circle', name: 'orb', cx: L - X(0.5), cy: headY - Y(8), r: X(1.8), mat: pal.accent, shade: 'sphere' });
      arm(-1, pal.leather, L + X(1), waist - Y(3), { r: 1.5, hand: true });
      add({ type: 'path', name: 'book', underlay: true, mat: pal.leather, shade: 'bevel', d: smooth([[R - X(3), waist - Y(6)], [R, waist - Y(5)], [R, waist - Y(0.5)], [R - X(3), waist], [R - X(6), waist - Y(0.5)], [R - X(6), waist - Y(5)]]) });
      add({ type: 'path', name: 'page', mat: pal.cloth, shade: 'flat', band: 0, d: smooth([[R - X(3), waist - Y(5)], [R - X(0.8), waist - Y(4.4)], [R - X(0.8), waist - Y(1)], [R - X(3), waist - Y(0.8)], [R - X(5.2), waist - Y(1)], [R - X(5.2), waist - Y(4.4)]]) });
      arm(1, pal.leather, R - X(4), waist - Y(2), { r: 1.5 });
      break;
    }
    case 'shaman': { // carved oval mask under a fan of feathers, fur shoulders, totem staff, flame in the open hand
      legs(pal.leather, 2.4, 1.6); boots(pal.leather);
      shape('tunic', pal.cloth, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.8, shoulder + Y(4)], [4.4, waist], [6, waist + Y(2.5)], [0, waist + Y(3)]]);
      shape('apron', pal.accent, [[0, waist], [3, waist], [2.5, waist + Y(5)], [0, waist + Y(6.5)]], { shade: 'flat', band: 1 });
      add({ type: 'ellipse', name: 'furs', cx, cy: shoulder + Y(0.5), rx: X(7), ry: Y(2.5), mat: pal.hair, shade: 'sphere', underlay: true });
      add({ type: 'star', name: 'feathers', cx, cy: headY - Y(4), r: X(7), r2: X(3), n: 7, rot: -90, mat: pal.accent, shade: 'flat', band: 1, underlay: true });
      add({ type: 'ellipse', name: 'mask', cx, cy: headY + Y(0.5), rx: X(3.6), ry: Y(4.8), mat: pal.leather, shade: 'sphere', underlay: true });
      add({ type: 'ellipse', name: 'mask-eye', cx: cx - X(1.6), cy: headY - Y(0.5), rx: X(0.9), ry: Y(0.7), color: 'outline', mirrorX: cx });
      add({ type: 'path', name: 'mask-mouth', color: 'outline', d: `M${cx - X(1.8)} ${headY + Y(2.5)} Q${cx} ${headY + Y(3.8)} ${cx + X(1.8)} ${headY + Y(2.5)} Q${cx} ${headY + Y(3)} ${cx - X(1.8)} ${headY + Y(2.5)} Z` });
      add({ type: 'tube', name: 'totem', underlay: true, mat: pal.leather, shade: 'cyl', pts: [[L, foot - Y(1)], [L + X(0.4), waist], [L, headY - Y(6)]], w: X(1.4), w1: X(1.2) });
      add({ type: 'ellipse', name: 'totem-head', cx: L, cy: headY - Y(7.5), rx: X(1.9), ry: Y(2.4), mat: pal.leather, shade: 'sphere' });
      arm(-1, pal.skin, L + X(1), waist - Y(4));
      arm(1, pal.skin, R - X(1), waist - Y(3));
      add({ type: 'path', name: 'flame', mat: pal.accent, shade: 'flat', band: 0,
        d: `M${R - X(2.5)} ${waist - Y(5)} Q${R - X(1)} ${waist - Y(10)} ${R + X(0.5)} ${waist - Y(12)} Q${R + X(1)} ${waist - Y(8)} ${R + X(0.5)} ${waist - Y(5)} Z` });
      break;
    }
    case 'sorcerer': { // long flared robe with a high spiked collar, loose hair, an orb raised in the open hand
      shape('robe', pal.accent, [[0, shoulder - Y(0.5)], [4.6, shoulder], [4.6, waist - Y(2)], [7, foot - Y(2)], [7.5, foot - Y(0.5)], [0, foot]]);
      shape('under-robe', pal.cloth, [[0, shoulder + Y(3)], [1.5, shoulder + Y(3)], [2.5, foot - Y(1)], [0, foot - Y(0.5)]], { shade: 'flat', band: 1 });
      add({ type: 'ellipse', name: 'hair', cx, cy: headY + Y(1.5), rx: X(4), ry: Y(5.8), mat: pal.hair, shade: 'sphere', underlay: true });
      head(headY, { ears: false });
      add({ type: 'path', name: 'fringe', mat: pal.hair, shade: 'sphere', d: `M${cx - X(3.6)} ${headY - Y(1)} Q${cx - X(3)} ${headY - Y(5)} ${cx} ${headY - Y(5)} Q${cx + X(3)} ${headY - Y(5)} ${cx + X(3.6)} ${headY - Y(1)} Q${cx + X(1)} ${headY - Y(3)} ${cx - X(3.6)} ${headY - Y(1)} Z` });
      add({ type: 'path', name: 'collar', underlay: true, mat: pal.accent, shade: 'bevel', mirrorX: cx, d: `M${cx - X(3.5)} ${shoulder + Y(1)} Q${cx - X(7)} ${shoulder - Y(2)} ${cx - X(7.5)} ${shoulder - Y(8)} Q${cx - X(5)} ${shoulder - Y(3)} ${cx - X(3.5)} ${shoulder + Y(1)} Z` });
      arm(-1, pal.accent, L + X(1), waist, { r: 1.6 });
      arm(1, pal.accent, R, shoulder - Y(1), { r: 1.6 });
      add({ type: 'circle', name: 'orb', cx: R + X(1), cy: shoulder - Y(4.5), r: X(2.6), mat: pal.accent, shade: 'sphere' });
      add({ type: 'ring', name: 'orb-halo', cx: R + X(1), cy: shoulder - Y(4.5), r: X(3.8), w: X(0.6), color: 'accent.0' });
      break;
    }
    default: head();
  }
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}
