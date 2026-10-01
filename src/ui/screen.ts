// Browser glue: one canvas at native size, scaled to fit the window.

import { CanvasAtlas, fontMaskSource } from './atlas.ts';
import { NATIVE_H, NATIVE_W } from './grid.ts';
import { Renderer } from './renderer.ts';
import { fitScale } from './viewport.ts';

/** Create the canvas inside `parent`, keep it fitted to the window, and return a renderer for it. */
export function mountScreen(parent: HTMLElement, fontFamily: string): Renderer {
  const canvas = document.createElement('canvas');
  canvas.width = NATIVE_W;
  canvas.height = NATIVE_H;
  canvas.style.position = 'absolute';
  canvas.style.imageRendering = 'pixelated';
  parent.append(canvas);

  const fit = (): void => {
    const f = fitScale(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    canvas.style.width = `${f.width}px`;
    canvas.style.height = `${f.height}px`;
    canvas.style.left = `${f.left}px`;
    canvas.style.top = `${f.top}px`;
  };
  fit();
  window.addEventListener('resize', fit);

  const atlas = new CanvasAtlas((w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }, fontMaskSource(fontFamily));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return new Renderer(ctx, atlas);
}
