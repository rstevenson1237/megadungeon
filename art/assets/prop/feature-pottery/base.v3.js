// feature-pottery base.v3 (r3) — from base.v2 (5.5). Review fix, clay colour and shading: base.v2's full leather ramp
// went muddy maroon-brown with a noisy three-step dither. The clay is now the light half of the leather ramp
// (leather.0/leather.1, a mid terracotta, not red-orange, and lighter than the chest's dark red-brown), shaded toon in
// those two steps only (no dither), with the flared lip in the lightest step as a rim highlight; the shoulder band
// stays the dark half. The shards take the same two-step clay so they read against the floor. Same model as base.v2.
// base.v2 header follows.
// feature-pottery base.v2 (r2) — from base.v1 (5.5). Roster fix: the urn was painted in the red-orange accent (it read
// as a brazier, against the light hierarchy) and had no urn outline (it read as a basket or a rock). Now the clay is the
// leather ramp (a dull fired-clay brown), the shoulder band its dark half (no accent at all), and the lathe profile is
// an urn: a narrow foot, a belly that turns in sharply at the shoulder, a three-layer narrow neck and a flared lip on the
// top layer (base.v1's lip sat above the 10-layer height and never drew). The shards take the same leather clay.
// base.v1 header follows.
// feature-pottery base.v1 (r1) — adapted from the iso chest template: a clay urn, 0.6 m (about 10 px), standing on the
// cell's floor diamond centre (pixel 16, h-8). One fine-voxel model (k = 2) in T2+ 3D mode, raster renderer, grid-aligned:
// closed is a lathed jar (foot, round belly, narrow neck, flared lip with a dark mouth, a band of darker clay round the
// shoulder); smashed is a low ring of broken shards (1-2 voxels high) round an empty centre, a few loose chips outside.
// Clay is the accent ramp (terracotta; the dirt ramp is a dull grey), the mouth and the shard insides take the stone dark.
// Role ramps only (R11). ctx.state picks closed / smashed; ctx.variant seeds the shard ring.
export const meta = { brief: 'feature-pottery', pass: 'r3', notes: 'mid terracotta two-step toon clay, rim highlight', mirror: false };

export function render(ctx) {
  const [w, h] = ctx.size, { pal } = ctx.dir, smashed = ctx.state === 'smashed';
  const K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const U = w / 4, N = U * K, c = N / 2;
  let a = 0x2f6b1d53 ^ Math.imul(((ctx.variant | 0) % 3 + 3) % 3 + 1, 2654435761);
  const r = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const H = Math.round((ctx.brief?.height ?? 0.6) * ctx.dir.scale.metre); // 10 fine voxels
  const cells = { clay: [], band: [], mouth: [], inner: [], rim: [] };
  const disc = (z, rad, list, inner = 0) => {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      if (d <= rad && d >= inner) list.push([x, y, z]);
    }
  };
  if (!smashed) {
    // radius per layer, bottom to top: foot, belly, shoulder, neck, flared lip
    const prof = [1.7, 2.6, 3.2, 3.4, 3.2, 2.4, 1.2, 1.2, 1.2, 2.3];
    for (let z = 0; z < Math.min(H, prof.length); z++) {
      const top = z === H - 1 || z === prof.length - 1;
      if (top) { disc(z, prof[z], cells.rim, 0.9); disc(z, 0.9, cells.mouth); }
      else disc(z, prof[z], z === 4 ? cells.band : cells.clay);
    }
  } else {
    // ring of shards: curved wall pieces of uneven height round an empty, dusty centre
    const shards = 9;
    for (let i = 0; i < shards; i++) {
      const ang = (i / shards) * Math.PI * 2 + (r() - 0.5) * 0.3, span = 0.45 + r() * 0.25, hh = 1 + Math.round(r() * 1.4), rad = 3.6 + r() * 1.2;
      for (let z = 0; z < hh; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy);
        let da = Math.abs(Math.atan2(dy, dx) - ang); da = Math.min(da, Math.PI * 2 - da);
        if (d <= rad && d >= rad - 1.3 && da < span / 2 + (hh - z) * 0.08) cells[z === hh - 1 && hh > 1 ? 'band' : 'clay'].push([x, y, z]);
      }
    }
    // loose chips on the floor outside the ring
    for (let i = 0; i < 4; i++) {
      const ang = r() * Math.PI * 2, rad = 5 + r() * 1.2, x = Math.floor(c + Math.cos(ang) * rad), y = Math.floor(c + Math.sin(ang) * rad);
      if (x > 0 && y > 0 && x < N - 1 && y < N - 1) cells.clay.push([x, y, 0]);
    }
    disc(0, 2.4, cells.inner); // dusty floor of clay dust inside the ring
  }
  const seen = new Set();
  const uniq = (l) => l.filter(([x, y, z]) => { const k = `${x},${y},${z}`; if (seen.has(k)) return false; seen.add(k); return true; });
  const clay = pal.leather, terra = [clay[0], clay[1]], dark = pal.stone[pal.stone.length - 1];
  if (!smashed) {
    m.add({ type: 'cells', name: 'urn', cells: uniq(cells.clay), mat: terra, shade: 'toon' });
    m.add({ type: 'cells', name: 'rim', cells: uniq(cells.rim), mat: [clay[0]], shade: 'toon' });
    m.add({ type: 'cells', name: 'band', cells: uniq(cells.band), mat: [clay[1], clay[2]], shade: 'toon' });
    m.add({ type: 'cells', name: 'mouth', cells: uniq(cells.mouth), mat: [dark], shade: 'toon' });
  } else {
    m.add({ type: 'cells', name: 'shards', cells: uniq(cells.clay), mat: terra, shade: 'toon' });
    if (cells.band.length) m.add({ type: 'cells', name: 'edges', cells: uniq(cells.band), mat: terra, shade: 'toon' });
  }
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [U / 2, U / 2, 0], at: [w / 2, h - 8], shadow: false, inner: 'parts' });
}
