import { describe, expect, it } from 'vitest';
import contentBundle from '../src/generated/content-bundle.json';
import { TERRAIN_BLOCKED, TERRAIN_LIQUID, TERRAIN_OPEN, buildTerrain } from '../src/game/map-state.ts';
import { Run, SURFACE } from '../src/game/run.ts';
import { validTargets } from '../src/game/targeting.ts';
import { runOptionsFor } from '../src/game/world.ts';
import type { ContentBundle } from '../src/core/schemas.ts';
import { Grid } from '../src/ui/grid.ts';
import { MAP } from '../src/ui/palette.ts';
import { checkLevel, gameOn, levelFrom, monsterAt, shellOn, testPlayer, walk } from './helpers.ts';

const bundle = contentBundle as unknown as ContentBundle;

describe('liquids in play (Spec 02, "Liquids"; Spec 01, targeting)', () => {
  it('terrain: walls and closed doors block everything, deep water and lava block only movement', () => {
    const level = levelFrom(['#<.~=%+#']);
    const t = buildTerrain(level, []);
    expect([...t]).toEqual([
      TERRAIN_BLOCKED,
      TERRAIN_OPEN,
      TERRAIN_OPEN,
      TERRAIN_OPEN, // shallow water
      TERRAIN_LIQUID,
      TERRAIN_LIQUID,
      TERRAIN_BLOCKED, // a closed door
      TERRAIN_BLOCKED,
    ]);
    expect(buildTerrain(level, [6])[6]).toBe(TERRAIN_OPEN);
  });

  it('the player wades through shallow water but cannot step into deep water or lava; the bump is free', () => {
    const game = gameOn(levelFrom(['########', '#<~=%..#', '########']));
    expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(true);
    expect(game.state.map.player).toEqual({ x: 2, y: 1 }); // shallow water
    const round = game.state.round;
    expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(false); // deep water
    expect(game.state.map.player).toEqual({ x: 2, y: 1 });
    expect(game.state.round).toBe(round);

    const lava = gameOn(levelFrom(['#####', '#<%.#', '#####']));
    expect(lava.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(false);
    expect(lava.state.map.player).toEqual({ x: 1, y: 1 });
  });

  it('sight passes over deep water and lava but not over a wall', () => {
    const lake = gameOn(levelFrom(['###############', '#<=%..........#', '###############']));
    const far = 1 * 15 + 7;
    expect(lake.state.map.visible[far]).toBe(1);
    const wall = gameOn(levelFrom(['###############', '#<#...........#', '###############']));
    expect(wall.state.map.visible[far]).toBe(0);
    // Everything the player sees stays explored, water included.
    expect(lake.state.map.exploration.explored[1 * 15 + 3]).toBe(1);
  });

  it('a clear line of fire crosses water and lava, but not a wall', () => {
    const lake = gameOn(levelFrom(['###########', '#<=%....m.#', '###########']));
    lake.state.monsters.push(monsterAt(8, 1));
    expect(validTargets(lake, 8)).toHaveLength(1);
    const wall = gameOn(levelFrom(['###########', '#<#.....m.#', '###########']));
    wall.state.monsters.push(monsterAt(8, 1));
    expect(validTargets(wall, 8)).toHaveLength(0);
  });

  it('a hunting monster wades shallow water but never crosses deep water or lava', () => {
    const wide = (mid: string): string[] => ['#########', `#<..${mid}...#`, `#...${mid}...#`, `#...${mid}...#`, '#########'];
    for (const [mid, crosses] of [['~', true], ['=', false], ['%', false]] as const) {
      const game = gameOn(levelFrom(wide(mid)));
      game.state.monsters.push(monsterAt(7, 2, { alert: true, speed: 'fast' }));
      // A monster that wades across reaches the player and dies in the exchange; otherwise it stays on its side.
      let reached = false;
      for (let i = 0; i < 12; i++) {
        game.act({ type: 'wait' });
        const m = game.state.monsters[0];
        if (!m || m.x < 4) reached = true;
      }
      expect(reached, `${mid}`).toBe(crosses);
      if (!crosses) expect(game.state.monsters[0]!.x).toBeGreaterThan(4);
    }
  });

  it('draws shallow water as ~ and deep water and lava as ≈, dimmed when remembered', () => {
    const shell = shellOn(levelFrom(['##########', '#<~=%....#', '##########']));
    const g = new Grid();
    shell.draw(g);
    // The three water cells sit side by side beside the player.
    const at = [...g.glyph].findIndex((glyph, i) => glyph === 126 && g.glyph[i + 1] === 247 && g.glyph[i + 2] === 247);
    expect(at).toBeGreaterThan(0);
    expect(g.glyph[at - 1]).toBe(64); // the player, standing on the up stair
    expect([g.fg[at], g.fg[at + 1], g.fg[at + 2]]).toEqual([MAP.shallowWater.visible, MAP.deepWater.visible, MAP.lava.visible]);

    // Walk away until the water is remembered, not visible: it dims.
    const far = shellOn(levelFrom(['#####################', '#<~=%...............#', '#####################']));
    const run = far.game!;
    walk(run, 'dddd');
    run.state.map.player = { x: 18, y: 1 };
    run.state.map.visible = new Uint8Array(run.state.map.level.width * run.state.map.level.height);
    const dim = new Grid();
    far.draw(dim);
    const dimAt = [...dim.glyph].findIndex((glyph, i) => glyph === 126 && dim.glyph[i + 1] === 247 && dim.glyph[i + 2] === 247);
    expect([dim.fg[dimAt], dim.fg[dimAt + 1], dim.fg[dimAt + 2]]).toEqual([MAP.shallowWater.remembered, MAP.deepWater.remembered, MAP.lava.remembered]);
  });
});

describe('themes pick the layout (Spec 02, task 2.3)', () => {
  it('a run builds each level with its theme\'s layout, and the layout it asks for is the one it gets', () => {
    const layoutOf = new Map((bundle.tables['level_themes'] as { id: string; layout: string }[]).map((t) => [t.id, t.layout]));
    const seen = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const options = runOptionsFor(bundle, seed);
      const layout = options.layout!;
      const run = new Run(seed, testPlayer(), options);
      for (let depth = 1; depth <= 100; depth++) {
        run.travel('down');
        if (run.inVillage) continue;
        const expected = layoutOf.get(layout.themes[depth]!);
        const level = run.game!.state.map.level;
        expect(level.layout, `seed ${seed} level ${depth}`).toBe(expected);
        expect(checkLevel(level), `seed ${seed} level ${depth}`).toBeNull();
        seen.add(level.layout);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(7); // every algorithm but, possibly, a rare theme
  }, 120_000);

  it('starts on the surface and uses plain rooms without a layout', () => {
    expect(new Run(1, testPlayer()).depth).toBe(SURFACE);
    const run = new Run(1, testPlayer(), { startDepth: 1 });
    expect(run.game!.state.map.level.layout).toBe('rooms_and_corridors');
  });
});
