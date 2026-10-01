// Viewport scaling (Spec 01, "Rendering"): the native 900 x 640 grid scales to
// fit the window with its aspect ratio kept, letterboxed, pixelated.

import { NATIVE_H, NATIVE_W } from './grid.ts';

export interface Fit {
  scale: number;
  /** Size and offset in CSS pixels. */
  width: number;
  height: number;
  left: number;
  top: number;
}

/**
 * Largest size that fits the viewport with the grid's aspect kept. Sizes are
 * whole device pixels, so a pixelated canvas never straddles a pixel edge.
 */
export function fitScale(viewW: number, viewH: number, dpr = 1): Fit {
  const devW = Math.max(0, Math.floor(viewW * dpr));
  const devH = Math.max(0, Math.floor(viewH * dpr));
  const scale = Math.min(devW / NATIVE_W, devH / NATIVE_H);
  const w = Math.max(1, Math.floor(NATIVE_W * scale));
  const h = Math.max(1, Math.floor(NATIVE_H * scale));
  return {
    scale: scale / dpr,
    width: w / dpr,
    height: h / dpr,
    left: Math.floor((devW - w) / 2) / dpr,
    top: Math.floor((devH - h) / 2) / dpr,
  };
}
