// finish.v1 (f) on base.v3 — the one direct-pixel pass (R2), on what review 7 asked, in its order, on all 10 states:
// 1. The stone round both arches takes terrain-wall finish.v1's treatment, so in a wall run the door is one more wall
//    block, not a grey cabinet: the bright cut-stone jamb strip is gone — the 1 px ring next to the door becomes a dark
//    reveal (the face's mortar value: stone dark on the lit south-west face, ink on the south-east face) and any jamb
//    stone beyond it continues its course row from the stone beside it; the south-west face gets the wall's thinner
//    lips (vertical lips beside joints back to stone mid, each course's lit lip cut to its first 4 px), left face
//    still lighter than the right; the top gets the wall's quiet capstone (crack and specks wiped, one short off-centre
//    joint and a nick in the lit rim; the cap gets the wall's 1 px lit rim inside its ink).
// 2. Closed, locked and sealed: the planks are repainted with two clean 1 px iron bands (one pixel per column, metal
//    mid with light strap ends and rivets on the lit face, metal mid with light strap ends on the shaded face, a dark
//    wood shadow row under each on the lit face); lock plate, chain and seal are redrawn over them. Their caps' strips get the two bands as full
//    metal-ramp columns (light on the lit row, dark at the edges), and the cap faces show the lower band.
// 3. broken-cap: the split through the strip is widened to a 5 px ink gap with pale splinters on both edges, carried
//    1 px into the stone above and below as a crack (the missing plank ends as before), so it reads apart from the
//    closed cap at 1x.
// Ramps: stone, wood, metal, accent (wax only) and the outline; colours are direction tokens (R11).
export const base = 'base.v3';
export const meta = { notes: 'wall-matched stone (dark reveal, no jamb strip, thin lips, quiet top); 1 px iron bands; wider broken-cap split' };

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const w = g.w, h = g.h, th = w / 2, half = w / 2, cx = half;
  const state = String(ctx.state || 'closed'), cap = state.endsWith('-cap'), kind = state.replace(/-cap$/, '');
  const height = cap ? Math.max(2, Math.round((h - th) / 6)) : h - th;
  const T = h - th - height;
  const cy = T + th / 2; // centre row of the top diamond
  const tok = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : px.tokenAt(g, [x, y]));
  const set = (x, y, t) => px.set(g, [x, y], t);

  // ---- geometry, as base.v3 draws it ----
  const inTop = (x, y) => {
    const sx = x + 0.5 - half, sy = y + 0.5 - T;
    const u = sx / w + sy / th, v = sy / th - sx / w;
    return u >= 0 && v >= 0 && u < 1 && v < 1;
  };
  const isRim = (x, y) => y < cy && (!inTop(x, y - 1) || !inTop(x - 1, y) || !inTop(x + 1, y));
  const isFront = (x, y) => y >= cy && (!inTop(x, y + 1) || !inTop(x - 1, y) || !inTop(x + 1, y));
  const inStrip = (x, y) => cap && Math.abs(y + 0.5 - cy) <= 2.6 && Math.abs(x + 0.5 - cx) <= 11.5;
  const u0 = 0.27, u1 = 0.77, um = (u0 + u1) / 2, rad = (u1 - u0) / 2, spring = 13;
  const archTop = u => spring + 4 * Math.sqrt(Math.max(0, 1 - ((u - um) / rad) ** 2));
  const inDoor = (u, z) => u >= u0 && u < u1 && z >= 0 && z < archTop(u);
  const onJamb = (u, z) => !inDoor(u, z) && u >= u0 - 1 / 16 && u < u1 + 1 / 16 && z >= 0 && z < archTop(Math.min(Math.max(u, u0), u1 - 0.001)) + 1.2;
  // a face pixel: which face, its course row vy, its u along the face and z up from the floor edge
  const face = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h || inTop(x, y)) return null;
    const pxc = x + 0.5, left = pxc < half;
    const edgeY = left ? T + th / 2 + (pxc / half) * (th / 2) : T + th - ((pxc - half) / half) * (th / 2);
    const dy = y + 0.5 - edgeY;
    if (dy < 0 || dy >= height) return null;
    const u = left ? pxc / half : (w - pxc) / half, z = height - dy;
    const door = inDoor(u, z), jamb = !door && onJamb(u, z) && Math.floor(dy) > 0;
    return { left, vy: Math.floor(dy), u, z, door, jamb };
  };

  const snap = [];
  for (let y = 0; y < h; y++) { snap.push([]); for (let x = 0; x < w; x++) snap[y].push(tok(x, y)); }
  const S = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : snap[y][x]);
  const isStone = t => t === 'stone.0' || t === 'stone.1' || t === 'stone.2';
  const fields = new Map(); // face pixel info, cached
  const F = (x, y) => { const k = y * w + x; if (!fields.has(k)) fields.set(k, face(x, y)); return fields.get(k); };

  // ---- 1a. top face: the wall's quiet capstone ----
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inTop(x, y) || isRim(x, y) || isFront(x, y) || inStrip(x, y)) continue;
    const t = S(x, y);
    if (t === 'stone.0' || t === 'stone.2') set(x, y, 'stone.1');
  }
  if (cap) {
    const rim = [];
    for (let y = T; y < cy; y++) for (let x = 0; x < w; x++)
      if (inTop(x, y) && !inStrip(x, y) && tok(x, y) === 'stone.1' && tok(x, y - 1) === 'outline') rim.push([x, y]);
    for (const p of rim) set(p[0], p[1], 'stone.0');
  }
  {
    const marks = cap
      ? { joint: [[cx - 3, cy + 4], [cx - 2, cy + 4], [cx - 1, cy + 5]], nick: [cx + 6, cy - 4] }
      : { joint: [[cx + 4, cy + 1], [cx + 5, cy + 1], [cx + 6, cy + 2]], nick: [cx - 7, cy - 4] };
    for (const p of marks.joint)
      if (inTop(p[0], p[1]) && !isRim(...p) && !isFront(...p) && !inStrip(...p)) { set(p[0], p[1], 'stone.2'); ctx.protect(p); }
    const [nx, ny] = marks.nick;
    let ry = ny;
    while (ry > T && inTop(nx, ry - 1)) ry--;
    if (tok(nx, ry) === 'stone.0') {
      set(nx, ry, 'stone.1'); ctx.protect([nx, ry]);
      if (inTop(nx, ry + 1) && !isFront(nx, ry + 1) && !inStrip(nx, ry + 1)) { set(nx, ry + 1, 'stone.2'); ctx.protect([nx, ry + 1]); }
    }
  }

  // ---- 1b. the jamb: a dark reveal next to the door, coursed stone beyond it ----
  const nearDoor = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const f = F(x + a, y + b); return f && f.door; });
  const sameRow = (x, y, f, step) => {
    // walk along the face (x by step) keeping the course row vy; return the first plain stone token found
    for (let k = 1; k <= 4; k++) {
      const xx = x + k * step;
      for (let yy = y - 3; yy <= y + 3; yy++) {
        const ff = F(xx, yy);
        if (ff && ff.left === f.left && ff.vy === f.vy && !ff.door && !ff.jamb && isStone(S(xx, yy))) return S(xx, yy);
      }
    }
    return null;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f = F(x, y);
    if (!f || !f.jamb) continue;
    const mortar = f.left ? 'stone.2' : 'outline', field = f.left ? 'stone.1' : 'stone.2';
    if (nearDoor(x, y)) { set(x, y, mortar); continue; }
    const out = (f.left ? f.u < um : f.u >= um) ? -1 : 1; // toward the face's outer corner, away from the door
    let t = f.z < spring ? sameRow(x, y, f, out) : null;
    if (t === 'stone.0') t = field;                          // no lit strip: lips come back only from the wall rule
    set(x, y, t || field);
  }

  // ---- 1c. south-west face: the wall's thinner, fewer lit lips ----
  {
    const snap2 = [];
    for (let y = 0; y < h; y++) { snap2.push([]); for (let x = 0; x < w; x++) snap2[y].push(tok(x, y)); }
    const S2 = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : snap2[y][x]);
    const dark = t => t === 'stone.2' || t === 'outline';
    for (let y = 0; y < h; y++) for (let x = 0; x < half - 1; x++) {
      if (inTop(x, y) || S2(x, y) !== 'stone.0') continue;
      if (!dark(S2(x, y - 1))) { set(x, y, 'stone.1'); continue; }
      let n = 0, ax = x, ay = y;
      for (;;) {
        if (S2(ax - 1, ay) === 'stone.0' && dark(S2(ax - 1, ay - 1))) ax--;
        else if (S2(ax - 1, ay - 1) === 'stone.0' && dark(S2(ax - 1, ay - 2))) { ax--; ay--; }
        else break;
        n++;
      }
      if (n >= 4) set(x, y, 'stone.1');
    }
  }

  // ---- 2. iron bands on closed, locked and sealed doors ----
  if (kind === 'closed' || kind === 'locked' || kind === 'sealed') {
    const plankAt = (u, z, light) => {
      const pu = (u - u0) / (u1 - u0), du = (u - u0) * 16, seam = (du % 2.7) / 2.7;
      const dc = Math.floor(du), zi = Math.floor(z);
      let c = seam < 0.37 ? 'wood.2' : seam < 0.74 && light ? 'wood.0' : 'wood.1';
      if (zi === 3 || zi === 10) c = light ? (pu < 0.1 || seam < 0.37 ? 'metal.0' : 'metal.1') : (pu < 0.1 ? 'metal.0' : 'metal.1');
      else if (light && (zi === 2 || zi === 9)) c = 'wood.2';                     // the band's shadow on the planks
      if (kind === 'locked' && dc >= 3 && dc <= 7 && zi >= 4 && zi <= 9) {
        const inner = dc >= 4 && dc <= 6 && zi >= 5 && zi <= 8;
        c = !inner ? 'outline' : dc === 5 && (zi === 6 || zi === 7) ? 'outline' : zi === 8 || dc === 4 ? 'metal.0' : 'metal.1';
      }
      if (kind === 'sealed') {
        for (const zc of [2 + dc * 1.4, 2 + (7 - dc) * 1.4]) {
          if (zi === Math.floor(zc)) c = dc % 2 ? 'metal.1' : 'metal.0';
          else if (zi === Math.floor(zc) - 1) c = 'outline';
        }
        if (dc >= 3 && dc <= 4 && zi >= 6 && zi <= 8) c = zi === 8 && dc === 3 ? 'accent.0' : zi === 6 ? 'accent.2' : 'accent.1';
      }
      return c;
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const f = F(x, y);
      if (!f || !f.door) continue;
      const t = S(x, y);                                                           // ink (plate ring, chain shadow, edge) stays
      if (!t || !(t.startsWith('wood') || t.startsWith('metal') || t.startsWith('accent'))) continue;
      set(x, y, plankAt(f.u, f.z, f.left));
    }
    if (cap) {
      // the bands on the cap's strip: a metal-ramp column at each band, lit row light, edges dark
      for (let y = 0; y < h; y++) for (const ix of [-7, 7]) {
        const x = cx + ix, iy = Math.floor(y + 0.5 - cy);
        if (iy < -2 || iy > 1 || !inTop(x, y)) continue;
        if (kind === 'sealed' && (iy === -1 || iy === 0)) continue;              // the chain lies over them
        set(x, y, iy === -1 ? 'metal.0' : iy === 0 ? 'metal.1' : 'metal.2');
        ctx.protect([x, y]);
      }
    }
  }

  // ---- 3. broken-cap: a wider, darker split ----
  if (state === 'broken-cap') {
    const zig = [1, -1, 2, 0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!inTop(x, y)) continue;
      const ix = Math.floor(x + 0.5 - cx), iy = Math.floor(y + 0.5 - cy);
      if (Math.abs(ix) > 11) continue;
      if (iy >= -2 && iy <= 1) {
        const zz = zig[iy + 2];
        if (ix >= zz - 2 && ix <= zz + 2) set(x, y, 'outline');
        else if (ix === zz - 3 || ix === zz + 3) set(x, y, 'wood.0');
        else if ((ix >= 5 && ix <= 8 && iy >= -1) || (ix <= -7 && ix >= -10 && iy < 0)) set(x, y, 'outline');
      } else if (iy === -3 || iy === 2) {
        // the split runs on into the stone of the cap as a crack
        const zz = iy === -3 ? 2 : -1;
        if (ix >= zz - 1 && ix <= zz + 1 && !isRim(x, y) && !isFront(x, y)) set(x, y, ix === zz ? 'outline' : 'stone.2');
      }
    }
  }

  return g;
}
