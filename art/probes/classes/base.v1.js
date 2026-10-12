// probe-classes base.v1 (r1) — a lineup of eight classes on one shared body, one state each, to show how far the
// silhouettes differ under the direction (the owner asked for more variety in character shapes, with
// art/refs/class-silhouettes-ref.jpg as the reference). Each class changes the outline first: what covers the body
// (plate, doublet, robe, pelt, cloak), what crowns the head (helm, feathered hat, bare scalp, bear head, hood, mask
// and feathers, loose hair) and what the hands hold. Frame 32 x 40; the figure stands about 29 px, the player's 1.8 m.
// Role ramps only (R11): skin hair cloth leather metal accent.
export const meta = { brief: 'probe-classes', pass: 'r1', notes: 'eight class silhouettes on one body' };

export function render(ctx) {
  const { pal } = ctx.dir, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h);
  const X = v => (v * w) / 32, Y = v => (v * h) / 40, cx = X(16);
  const foot = Y(38), knee = Y(31), waist = Y(25), shoulder = Y(17), headY = Y(12), headR = X(3.6);
  const add = n => s.add(n);
  const legs = (mat, gap = 1.2, width = 2.6) => add({ type: 'group', name: 'legs', underlay: true, mat, shade: 'bevel', children: [
    { type: 'rect', x: cx - X(gap) - X(width), y: waist, w: X(width), h: foot - waist },
    { type: 'rect', x: cx + X(gap), y: waist, w: X(width), h: foot - waist },
  ] });
  const boots = mat => add({ type: 'group', name: 'boots', mat, shade: 'flat', band: 2, children: [
    { type: 'rect', x: cx - X(4.2), y: foot - Y(3), w: X(3.2), h: Y(3) },
    { type: 'rect', x: cx + X(1), y: foot - Y(3), w: X(3.2), h: Y(3) },
  ] });
  const torso = (mat, top, bottom, flare = 0, name = 'torso') => add({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2),
    d: `M${cx - X(top)} ${shoulder} H${cx + X(top)} L${cx + X(bottom) + X(flare)} ${waist + Y(1)} H${cx - X(bottom) - X(flare)} Z` });
  const robe = (mat, top, hem, to = foot, name = 'robe') => add({ type: 'path', name, underlay: true, mat, shade: 'normal', round: X(2),
    d: `M${cx - X(top)} ${shoulder} H${cx + X(top)} L${cx + X(hem)} ${to} H${cx - X(hem)} Z` });
  const head = (mat = pal.skin) => add({ type: 'circle', name: 'head', cx, cy: headY, r: headR, mat, shade: 'sphere', underlay: true });
  const eyes = (color = 'outline', y = headY) => add({ type: 'rect', name: 'eye', x: cx - X(2), y, w: 1, h: 1, color, mirrorX: cx });
  const arm = (side, mat, hx, hy, r = 1.3) => add({ type: 'capsule', name: `arm-${side}`, underlay: true, mat, shade: 'cyl',
    a: [cx + side * X(5), shoulder + Y(1)], b: [hx, hy], r: X(r) });
  const hand = (hx, hy) => add({ type: 'circle', name: 'hand', cx: hx, cy: hy, r: X(1.2), mat: pal.skin, shade: 'flat', band: 0 });
  const pole = (mat, x0, y0, x1, y1, r = 0.7, name = 'pole') => add({ type: 'capsule', name, underlay: true, mat, shade: 'cyl', a: [x0, y0], b: [x1, y1], r: X(r) });
  const L = cx - X(8), R = cx + X(8); // the hands: right hand on the viewer's left, left hand on the viewer's right

  switch (ctx.state) {
    case 'paladin': { // bulky plate, great helm, flanged mace, kite shield
      legs(pal.metal, 1, 3); boots(pal.metal);
      torso(pal.metal, 6.5, 5, 0.5, 'plate');
      add({ type: 'rect', name: 'tabard', x: cx - X(2), y: shoulder + Y(2), w: X(4), h: knee - shoulder, mat: pal.cloth, shade: 'flat', band: 1 });
      add({ type: 'circle', name: 'pauldron', cx: cx - X(6.5), cy: shoulder + Y(1), r: X(2.6), mat: pal.metal, shade: 'sphere', mirrorX: cx, underlay: true });
      add({ type: 'rect', name: 'helm', x: cx - X(4), y: headY - Y(5), w: X(8), h: Y(9), r: X(2), mat: pal.metal, shade: 'cyl', underlay: true });
      add({ type: 'rect', name: 'visor', x: cx - X(3), y: headY, w: X(6), h: 1, color: 'outline' });
      arm(-1, pal.metal, L + X(1), waist - Y(1), 1.6);
      pole(pal.leather, L + X(1), waist, L - X(2), waist + Y(6), 0.6, 'haft');
      add({ type: 'star', name: 'mace', cx: L - X(2.5), cy: waist + Y(7), r: X(3), r2: X(1.6), n: 6, mat: pal.metal, shade: 'sphere', underlay: true });
      add({ type: 'path', name: 'shield', underlay: true, mat: pal.cloth, shade: 'normal', round: X(1.5),
        d: `M${R - X(4.5)} ${shoulder} H${R + X(4)} V${waist} L${R - X(0.25)} ${waist + Y(7)} L${R - X(4.5)} ${waist} Z` });
      add({ type: 'rect', name: 'cross', x: R - X(0.75), y: shoulder + Y(2), w: X(1.5), h: Y(10), mat: pal.metal, shade: 'flat', band: 0 });
      add({ type: 'rect', name: 'cross', x: R - X(3), y: shoulder + Y(5), w: X(6), h: Y(1.5), mat: pal.metal, shade: 'flat', band: 0 });
      break;
    }
    case 'bard': { // slim doublet, wide feathered hat, rapier, lute on the back
      add({ type: 'ellipse', name: 'lute', cx: R - X(2), cy: shoulder + Y(1), rx: X(3.5), ry: X(4.5), mat: pal.leather, shade: 'sphere', underlay: true });
      pole(pal.leather, R - X(3), shoulder - Y(2), R + X(4), shoulder - Y(10), 0.7, 'lute-neck');
      legs(pal.leather, 1, 2.2); boots(pal.leather);
      torso(pal.cloth, 4.5, 3.8, 1, 'doublet');
      add({ type: 'rect', name: 'slash', x: cx - X(0.5), y: shoulder + Y(1), w: X(1), h: waist - shoulder, mat: pal.accent, shade: 'flat', band: 1 });
      head(); eyes();
      add({ type: 'ellipse', name: 'brim', cx, cy: headY - Y(3), rx: X(7), ry: Y(1.8), mat: pal.cloth, shade: 'normal', round: X(1), underlay: true });
      add({ type: 'ellipse', name: 'crown', cx: cx + X(0.5), cy: headY - Y(5), rx: X(3.5), ry: Y(2.5), mat: pal.cloth, shade: 'sphere', underlay: true });
      add({ type: 'tube', name: 'feather', pts: [[cx + X(3), headY - Y(5)], [cx + X(6), headY - Y(9)], [cx + X(10), headY - Y(10)]], w: X(2), w1: X(0.6), mat: pal.accent, shade: 'flat', band: 0 });
      arm(-1, pal.cloth, L + X(2), waist, 1.2); hand(L + X(2), waist);
      pole(pal.metal, L + X(2), waist, L - X(5), foot - Y(1), 0.45, 'rapier');
      add({ type: 'arc', name: 'guard', cx: L + X(2), cy: waist, r: X(1.8), w: X(0.8), a0: 0, a1: 200, mat: pal.metal, shade: 'flat', band: 0 });
      arm(1, pal.cloth, R - X(2), waist - Y(1), 1.2); hand(R - X(2), waist - Y(1));
      break;
    }
    case 'monk': { // bare scalp, wrapped robe with a sash, long staff held across the body
      legs(pal.accent, 1.2, 2.8);
      add({ type: 'rect', name: 'wraps', x: cx - X(4.2), y: foot - Y(5), w: X(8.4), h: Y(3), mat: pal.cloth, shade: 'flat', band: 0 });
      boots(pal.leather);
      robe(pal.accent, 4.5, 5.5, knee, 'robe');
      add({ type: 'rect', name: 'sash', x: cx - X(5), y: waist - Y(1), w: X(10), h: Y(2), mat: pal.leather, shade: 'flat', band: 1 });
      head(); eyes();
      pole(pal.leather, L - X(4), foot - Y(4), R + X(5), shoulder - Y(9), 0.75, 'staff');
      arm(-1, pal.skin, cx - X(3), waist - Y(3), 1.3); hand(cx - X(3), waist - Y(3));
      arm(1, pal.skin, cx + X(5), shoulder + Y(2), 1.3); hand(cx + X(5), shoulder + Y(2));
      break;
    }
    case 'druid': { // bear-head hood and pelt to the ground, gnarled staff with a crystal
      robe(pal.hair, 6, 8, foot - Y(1), 'pelt');
      add({ type: 'path', name: 'leaf-wrap', underlay: true, mat: pal.leather, shade: 'normal', round: X(1),
        d: `M${cx - X(2.5)} ${shoulder + Y(2)} H${cx + X(2.5)} L${cx + X(1)} ${waist + Y(2)} H${cx - X(1)} Z` });
      add({ type: 'circle', name: 'face', cx, cy: headY + Y(1), r: X(2.8), mat: pal.skin, shade: 'sphere', underlay: true });
      eyes('outline', headY + Y(1));
      add({ type: 'path', name: 'bear-head', underlay: true, mat: pal.hair, shade: 'sphere',
        d: `M${cx - X(5.5)} ${headY + Y(3)} Q${cx - X(6)} ${headY - Y(7)} ${cx} ${headY - Y(7)} Q${cx + X(6)} ${headY - Y(7)} ${cx + X(5.5)} ${headY + Y(3)} L${cx + X(3)} ${headY} Q${cx} ${headY - Y(2.5)} ${cx - X(3)} ${headY} Z` });
      add({ type: 'circle', name: 'ear', cx: cx - X(4.5), cy: headY - Y(7), r: X(1.6), mat: pal.hair, shade: 'sphere', mirrorX: cx, underlay: true });
      add({ type: 'ellipse', name: 'snout', cx, cy: headY - Y(3.5), rx: X(2), ry: Y(1.2), mat: pal.hair, shade: 'flat', band: 0 });
      add({ type: 'rect', name: 'bear-eye', x: cx - X(3), y: headY - Y(5), w: 1, h: 1, color: 'outline', mirrorX: cx });
      pole(pal.leather, L, foot - Y(1), L - X(1), headY - Y(9), 0.8, 'staff');
      add({ type: 'circle', name: 'knot', cx: L - X(0.5), cy: headY - Y(3), r: X(1.3), mat: pal.leather, shade: 'sphere' });
      add({ type: 'star', name: 'crystal', cx: L - X(1), cy: headY - Y(10), r: X(2.4), r2: X(1.2), n: 4, mat: pal.accent, shade: 'sphere' });
      arm(-1, pal.hair, L + X(0.5), waist - Y(4), 1.6); hand(L + X(0.5), waist - Y(4));
      break;
    }
    case 'ranger': { // deep hood and long cloak, crossbow held across the front
      robe(pal.hair, 6, 8.5, knee + Y(2), 'cloak');
      legs(pal.leather, 1, 2.4); boots(pal.leather);
      torso(pal.leather, 4, 3.5, 0, 'jerkin');
      add({ type: 'rect', name: 'baldric', x: cx - X(4), y: shoulder + Y(1), w: X(8), h: Y(1.4), mat: pal.leather, shade: 'flat', band: 2, rotate: 30, origin: [cx, shoulder + Y(2)] });
      add({ type: 'circle', name: 'face', cx, cy: headY + Y(0.5), r: X(2.8), mat: pal.skin, shade: 'sphere', underlay: true });
      eyes('outline', headY + Y(0.5));
      add({ type: 'path', name: 'hood', underlay: true, mat: pal.hair, shade: 'sphere',
        d: `M${cx - X(5)} ${headY + Y(4)} Q${cx - X(5.5)} ${headY - Y(7)} ${cx + X(1)} ${headY - Y(7)} Q${cx + X(5.5)} ${headY - Y(5)} ${cx + X(5)} ${headY + Y(4)} L${cx + X(3)} ${headY - Y(1)} Q${cx} ${headY - Y(3)} ${cx - X(3)} ${headY - Y(1)} Z` });
      arm(-1, pal.leather, cx - X(3), waist - Y(1), 1.3); arm(1, pal.leather, cx + X(4), waist - Y(1), 1.3);
      add({ type: 'rect', name: 'stock', x: cx - X(8), y: waist - Y(2), w: X(13), h: Y(2), mat: pal.leather, shade: 'bevel', underlay: true });
      add({ type: 'rect', name: 'bow', x: cx - X(8.5), y: waist - Y(7), w: X(1.4), h: Y(12), r: X(0.7), mat: pal.metal, shade: 'cyl', underlay: true });
      break;
    }
    case 'necromancer': { // pointed deep hood, robe to the ground, a staff with an orb and an open book
      robe(pal.leather, 5, 7.5, foot, 'robe');
      add({ type: 'path', name: 'hood', underlay: true, mat: pal.leather, shade: 'sphere',
        d: `M${cx - X(5)} ${shoulder + Y(1)} Q${cx - X(5)} ${headY - Y(4)} ${cx + X(2)} ${headY - Y(8)} Q${cx + X(5)} ${headY - Y(2)} ${cx + X(5)} ${shoulder + Y(1)} Z` });
      add({ type: 'ellipse', name: 'shadow-face', cx, cy: headY + Y(0.5), rx: X(2.8), ry: Y(3), color: 'outline' });
      eyes('accent.0', headY);
      pole(pal.leather, L, foot - Y(1), L, headY - Y(7), 0.7, 'staff');
      add({ type: 'circle', name: 'orb', cx: L, cy: headY - Y(8), r: X(1.8), mat: pal.accent, shade: 'sphere' });
      arm(-1, pal.leather, L + X(1), waist - Y(3), 1.5);
      add({ type: 'rect', name: 'book', x: R - X(6), y: waist - Y(5), w: X(6), h: Y(5), mat: pal.leather, shade: 'bevel', underlay: true });
      add({ type: 'rect', name: 'page', x: R - X(5.5), y: waist - Y(4.5), w: X(5), h: Y(4), mat: pal.cloth, shade: 'flat', band: 0 });
      arm(1, pal.leather, R - X(4), waist - Y(2), 1.5);
      break;
    }
    case 'shaman': { // carved mask under a fan of feathers, fur shoulders, totem staff, flame in the open hand
      legs(pal.leather, 1.2, 2.6); boots(pal.leather);
      torso(pal.cloth, 4.5, 4.5, 1.5, 'tunic');
      add({ type: 'rect', name: 'apron', x: cx - X(3), y: waist, w: X(6), h: Y(6), mat: pal.accent, shade: 'flat', band: 1 });
      add({ type: 'ellipse', name: 'furs', cx, cy: shoulder + Y(0.5), rx: X(7), ry: Y(2.5), mat: pal.hair, shade: 'sphere', underlay: true });
      add({ type: 'star', name: 'feathers', cx, cy: headY - Y(4), r: X(7), r2: X(3), n: 7, rot: -90, mat: pal.accent, shade: 'flat', band: 1, underlay: true });
      add({ type: 'rect', name: 'mask', x: cx - X(3.5), y: headY - Y(4), w: X(7), h: Y(9), r: X(2), mat: pal.leather, shade: 'bevel', underlay: true });
      add({ type: 'rect', name: 'mask-eye', x: cx - X(2.5), y: headY - Y(1), w: X(1.5), h: Y(1.5), color: 'outline', mirrorX: cx });
      add({ type: 'rect', name: 'mask-mouth', x: cx - X(1.5), y: headY + Y(2), w: X(3), h: 1, color: 'outline' });
      pole(pal.leather, L, foot - Y(1), L, headY - Y(6), 0.7, 'totem');
      add({ type: 'rect', name: 'totem-head', x: L - X(1.8), y: headY - Y(9), w: X(3.6), h: Y(4), mat: pal.leather, shade: 'bevel' });
      arm(-1, pal.skin, L + X(1), waist - Y(4), 1.3);
      arm(1, pal.skin, R - X(1), waist - Y(3), 1.3); hand(R - X(1), waist - Y(3));
      add({ type: 'path', name: 'flame', mat: pal.accent, shade: 'flat', band: 0,
        d: `M${R - X(2.5)} ${waist - Y(5)} Q${R - X(1)} ${waist - Y(10)} ${R + X(0.5)} ${waist - Y(12)} Q${R + X(1)} ${waist - Y(8)} ${R + X(0.5)} ${waist - Y(5)} Z` });
      break;
    }
    case 'sorcerer': { // long robe with a high spiked collar, loose hair, an orb raised in the open hand
      robe(pal.accent, 4.5, 8, foot, 'robe');
      add({ type: 'rect', name: 'under-robe', x: cx - X(2), y: shoulder + Y(3), w: X(4), h: foot - shoulder - Y(3), mat: pal.cloth, shade: 'flat', band: 1 });
      add({ type: 'ellipse', name: 'hair', cx, cy: headY + Y(1.5), rx: X(3.8), ry: Y(5.5), mat: pal.hair, shade: 'sphere', underlay: true });
      add({ type: 'circle', name: 'face', cx, cy: headY + Y(0.5), r: X(2.8), mat: pal.skin, shade: 'sphere' });
      eyes('outline', headY + Y(0.5));
      add({ type: 'poly', name: 'collar', pts: [[cx - X(7.5), shoulder - Y(8)], [cx - X(3.5), shoulder + Y(1)], [cx - X(7), shoulder + Y(1)]], mat: pal.accent, shade: 'bevel', mirrorX: cx, underlay: true });
      arm(-1, pal.accent, L + X(1), waist, 1.6); hand(L + X(1), waist);
      arm(1, pal.accent, R, shoulder - Y(1), 1.6); hand(R, shoulder - Y(1));
      add({ type: 'circle', name: 'orb', cx: R + X(1), cy: shoulder - Y(4.5), r: X(2.6), mat: pal.accent, shade: 'sphere' });
      add({ type: 'ring', name: 'orb-halo', cx: R + X(1), cy: shoulder - Y(4.5), r: X(3.8), w: X(0.6), color: 'accent.0' });
      break;
    }
    default: head(); robe(pal.cloth, 4, 5);
  }
  return ctx.lib.proc(s).add('groundShadow', {}).render();
}
