// fx-bolt base.v3 (x1) — from base.v1 (best, 7), fixing the blind reviewer's points (one budgeted revision):
// - the cold (cloth) motes above and below the head are gone: they read as rocket fins;
// - the head is a pointed light core (glow.0 inside, glow.1 rim) with a 1 px flicker ring around it that
//   pulses over f1-f4 (full ring, nose only, brighter full ring, off), kept within the head's height so no fins;
// - the tail breaks up on alternate frames: a whole ember taper on even frames, a short stub plus 3 trailing sparks
//   on odd frames;
// - the tail is one pixel thin past its root and ends in accent.0, not the dark accent.2, so its ink is a clean line.
export const meta = { brief: 'fx-bolt', pass: 'x1', notes: 'no fins, pointed glow core + pulsing flicker ring, tail breaks into sparks, less tail ink' };

export function render(ctx) {
  const [w, h] = ctx.size, { fx } = ctx.lib, pal = ctx.dir.pal;
  const g = fx.particles([], { w, h, t: ctx.t, duration: 1000 });
  const f = Math.round(ctx.t * 4) % 4, ox = f - 2, cy = 12;
  const put = (grid, x, y, c) => grid.set(x + ox, y, c);
  const head = new Set();
  // head: a pointed lozenge, 5 rows at its widest, sharp nose at screen right
  for (let x = 13; x <= 19; x++) {
    const half = x < 15 ? 1 : x < 17 ? 2 : x < 19 ? 1 : 0;
    for (let y = -half; y <= half; y++) {
      const rim = (Math.abs(y) === half && half > 0) || x === 13;
      put(g, x, cy + y, rim ? pal.glow[1] : pal.glow[0]);
      head.add(`${x},${y}`);
    }
  }
  // tail root: 3 rows
  for (const x of [12, 11]) for (let y = -1; y <= 1; y++) put(g, x, cy + y, y === 0 ? pal.glow[0] : pal.glow[1]);
  // flicker ring: one pixel around the head's front, never above or below it, never over the tail
  const ring = [];
  for (let x = 13; x <= 22; x++) for (let y = -4; y <= 4; y++) {
    if (head.has(`${x},${y}`)) continue;
    let d = 9;
    for (const k of head) {
      const [hx, hy] = k.split(',').map(Number);
      d = Math.min(d, Math.abs(hx - x) + Math.abs(hy - y));
    }
    if (d === 1 && x >= 15 && Math.abs(y) <= 2) ring.push([x, y]);
  }
  // pulse: f1 full ring, f2 nose only, f3 full ring brighter, f4 off
  const ringCol = [pal.accent[1], pal.accent[1], pal.accent[0], null][f];
  if (ringCol) ring.forEach(([x, y]) => { if (f !== 1 || x >= 19) put(g, x, cy + y, ringCol); });
  // thin tail: a whole ember taper on even frames, a stub and three sparks on odd frames
  if (f % 2 === 0) {
    for (let i = 0; i < 6; i++) put(g, 10 - i, cy, i < 2 ? pal.glow[1] : i < 4 ? pal.accent[1] : pal.accent[0]);
  } else {
    for (let i = 0; i < 2; i++) put(g, 10 - i, cy, pal.glow[1]);
    const sparks = f === 1 ? [[6, 0], [3, -1], [0, 1]] : [[6, 1], [3, 0], [0, -1]];
    sparks.forEach(([x, y], i) => put(g, x, cy + y, i === 0 ? pal.accent[1] : pal.accent[0]));
  }
  return fx.line(g);
}
