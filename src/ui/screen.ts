// Browser glue: two canvases at native size, scaled to fit the window. The text canvas is on top; the isometric
// picture's canvas lies beneath it, at the same size and scaling, and shows through the cells the text leaves clear
// (Spec 01b, Layout).

import { type Atlas, CanvasAtlas, fontMaskSource } from './atlas.ts';
import { CELL_H, NATIVE_H, NATIVE_W } from './grid.ts';
import { Renderer } from './renderer.ts';
import { fitScale } from './viewport.ts';

/** What the page draws with: the text renderer, the picture canvas's context, and the glyph atlas both use. */
export interface Screen {
  renderer: Renderer;
  picture: CanvasRenderingContext2D;
  atlas: Atlas;
}

/**
 * Create the canvases inside `parent`, keep them fitted to the window, and return what draws on them. Waits for the
 * font so the atlas is baked from the real glyphs.
 */
export async function mountScreen(parent: HTMLElement, fontFamily: string): Promise<Screen> {
  await document.fonts.load(`${CELL_H}px "${fontFamily}"`);
  if (!document.fonts.check(`${CELL_H}px "${fontFamily}"`)) throw new Error(`Font not available: ${fontFamily}`);

  const canvas = (id: string): HTMLCanvasElement => {
    const c = document.createElement('canvas');
    c.id = id;
    c.width = NATIVE_W;
    c.height = NATIVE_H;
    c.style.position = 'absolute';
    c.style.imageRendering = 'pixelated';
    parent.append(c);
    return c;
  };
  const pictureCanvas = canvas('picture');
  const textCanvas = canvas('screen');

  const fit = (): void => {
    const f = fitScale(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
    for (const c of [pictureCanvas, textCanvas]) {
      c.style.width = `${f.width}px`;
      c.style.height = `${f.height}px`;
      c.style.left = `${f.left}px`;
      c.style.top = `${f.top}px`;
    }
  };
  fit();
  window.addEventListener('resize', fit);

  const atlas = new CanvasAtlas((w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }, fontMaskSource(`"${fontFamily}"`));
  const ctx = textCanvas.getContext('2d');
  const picture = pictureCanvas.getContext('2d');
  if (!ctx || !picture) throw new Error('2D canvas is not available');
  return { renderer: new Renderer(ctx, atlas), picture, atlas };
}
