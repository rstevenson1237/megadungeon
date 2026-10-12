// The display flag (Spec 01, Addendum B; Spec 01b): the main view drawn as text (the default) or as the isometric
// picture. It is a browser preference, switched from the game menu at any moment and never saved with the run.

/** How the main view is drawn. */
export type DisplayMode = 'text' | 'iso';

/** The display as last chosen in the game menu, kept in local storage. */
export const DISPLAY_KEY = 'megadungeon.display';

/** The game menu row's name for each display: "Display: Text" or "Display: Isometric". */
export const DISPLAY_NAME: Readonly<Record<DisplayMode, string>> = { text: 'Text', iso: 'Isometric' };

/**
 * The display the page parameter `?display=iso` or `?display=text` presets, if any. Like `?time=`, it holds for this
 * page load only and outranks the remembered choice, which it leaves as it was.
 */
export function displayParam(search: string): DisplayMode | undefined {
  const display = new URLSearchParams(search).get('display');
  return display === 'iso' || display === 'text' ? display : undefined;
}

/** The display a page opens with: the preset, else the remembered choice, else text. */
export function startingDisplay(preset: DisplayMode | undefined, stored: string | null | undefined): DisplayMode {
  return preset ?? (stored === 'iso' ? 'iso' : 'text');
}
