// Step 11 of the pipeline, "Specials" (Spec 02): the teleporter, the boss, the quest goals and the pieces of
// the cross-level links that the run layout assigned to this level.

import { bossCeiling, ratingCeiling } from '../depth.ts';
import { FINAL_BOSS_RATING, type Feature, type Loot, type LoreMark, type Npc, type PlacedMonster, type Pile, type Point, type Special } from '../level.ts';
import type { Board } from './board.ts';
import { farFromUp, placedFrom, rollRow, withinCeiling, type Ctx } from './contents.ts';
import type { LevelPlan, Piece, QuestGoal } from './plan.ts';

/** Everything placed so far; step 11 adds to these lists. */
export interface Built {
  features: Feature[];
  piles: Pile[];
  monsters: PlacedMonster[];
  npcs: Npc[];
  lore: LoreMark[];
  specials: Special[];
}

/** What step 11 needs from the earlier steps. */
export interface SpecialsInput {
  /** Walking distance from the up stair with no locked, secret or sealed door; -1 elsewhere. */
  open: Int32Array;
  /** The same, but locked and sealed doors may be passed. */
  noSecret: Int32Array;
  bossRoom: number | undefined;
  vaultRoom: number | undefined;
  /** Parcels set aside for the vault, a rival's stash and a lore chain's cache, in piece order. */
  extras: Loot[][];
}

const nearestCentre = (b: Board, room: number): Point | undefined => {
  const r = b.rooms[room]!;
  const cx = r.x + (r.w >> 1);
  const cy = r.y + (r.h >> 1);
  let best: Point | undefined;
  for (const p of b.roomCells([room], false)) {
    if (!best || (p.x - cx) ** 2 + (p.y - cy) ** 2 < (best.x - cx) ** 2 + (best.y - cy) ** 2) best = p;
  }
  return best;
};

/** How many blockers (captives, altars, NPCs, levers, caches) step 11 will stand on the level. */
export const solidPieces = (plan: LevelPlan): number =>
  plan.quests.filter((g) => g.quest.type === 'captive').length +
  plan.pieces.filter((p) => ['rune_altar', 'specialist', 'rival', 'rival_stash', 'shrine', 'lever'].includes(p.kind) || (p.kind === 'lore_end' && p.end === 'cache')).length;

/** True for the pieces that carry one of the extra treasure parcels. */
export const takesParcel = (p: Piece): boolean =>
  p.kind === 'vault' || p.kind === 'rival_stash' || (p.kind === 'lore_end' && p.end === 'cache');

/**
 * Place the teleporter, boss, quest goals and link pieces. Returns how many of them found no place, which
 * makes a try fail (the next sub-seed gets another chance).
 */
export function placeSpecials(ctx: Ctx, built: Built, input: SpecialsInput): number {
  const { b, rng, plan, content, depth } = ctx;
  const { open, noSecret } = input;
  let missing = 0;
  let group = built.monsters.reduce((g, m) => Math.max(g, m.group + 1), 0);
  const inOpen = (p: Point): boolean => open[b.index(p)]! >= 0;
  const behindLocked = (p: Point): boolean => open[b.index(p)]! < 0 && noSecret[b.index(p)]! >= 0;

  /** A blocker's spot in a room of the open region (or of `where`), at least one cell in from its edge. */
  const stand = (where: (p: Point) => boolean = inOpen, far = false): Point | undefined => {
    for (const p of b.solidSpots(b.openRooms(), rng)) {
      if (where(p) && b.roomForSolid(p) && (!far || farFromUp(b, p))) return p;
    }
    return undefined;
  };
  const containersIn = (where: (p: Point) => boolean): Extract<Feature, { type: 'container' }>[] =>
    built.features.filter(
      (f): f is Extract<Feature, { type: 'container' }> => f.type === 'container' && f.kind !== 'rack' && where(f),
    );
  /** Put loot in a container of the region, or on the floor of a room of it. */
  const hostLoot = (loot: Loot[], where: (p: Point) => boolean = inOpen): boolean => {
    const pool = containersIn(where);
    if (pool.length > 0) {
      rng.pick(pool).contents.push(...loot);
      return true;
    }
    const spots = rng.shuffle(b.roomCells(b.openRooms(), false).filter(where));
    const at = spots[0];
    if (!at) return false;
    b.put(at);
    built.piles.push({ ...at, contents: loot });
    return true;
  };
  const wallMark = (kind: LoreMark['kind'], id: string, text: string, link?: string, index?: number): boolean => {
    const spots = rng.shuffle(
      b.wallSpots().filter((p) => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) => open[b.index({ x: p.x + dx!, y: p.y + dy! })]! >= 0)),
    );
    const at = spots[0];
    if (!at) return false;
    b.used[b.index(at)] = 1;
    const mark: LoreMark = { ...at, kind, id, text };
    if (link !== undefined) mark.link = link;
    if (index !== undefined) mark.index = index;
    built.lore.push(mark);
    return true;
  };
  const place = (ok: boolean): void => {
    if (!ok) missing++;
  };

  // The teleporter: a room cell of the open region, so it is on the critical path.
  if (plan.teleporterTo !== undefined) {
    const at = rng.shuffle(b.roomCells(b.openRooms(), true).filter(inOpen))[0];
    if (at) {
      b.put(at);
      built.specials.push({ ...at, kind: 'teleporter', to: plan.teleporterTo });
    } else missing++;
  }

  // The boss: in the farthest room of the open region, with its artifact and any lift token.
  // On level 100 it is the final boss: a row tagged `final`, rated 20d6+6, with no artifact (Spec 02, Addendum A).
  if (plan.boss) {
    const row = plan.boss.final ? rollRow(ctx, content.bosses, ['final']) : rollRow(ctx, withinCeiling(content.bosses, bossCeiling(depth)));
    const at = input.bossRoom === undefined ? undefined : nearestCentre(b, input.bossRoom);
    if (row && at) {
      b.put(at);
      const boss = placedFrom(row, at, group++, 'boss');
      if (plan.boss.final) Object.assign(boss, { ...FINAL_BOSS_RATING, final: true });
      if (plan.boss.artifactId && plan.boss.artifactName) boss.artifact = { id: plan.boss.artifactId, name: plan.boss.artifactName };
      if (plan.boss.liftToken) boss.liftToken = true;
      built.monsters.push(boss);
    } else if (!row) {
      // No boss row fits this depth: a content gap that the coverage report shows, not a generation failure.
    } else missing++;
  }

  for (const goal of plan.quests) place(questGoal(goal));

  function questGoal({ quest, item, person }: QuestGoal): boolean {
    switch (quest.type) {
      case 'captive': {
        const at = stand();
        if (!at) return false;
        b.put(at, true);
        built.npcs.push({ ...at, kind: 'captive', name: person ?? 'a captive', quest: quest.id });
        const rows = withinCeiling(content.monsters, ratingCeiling(depth));
        const row = rollRow(ctx, rows);
        if (row) {
          const room = b.roomOf[b.index(at)]!;
          const near = rng.shuffle(b.roomCells([room], false));
          for (let n = rng.int(1, 3); n > 0 && near.length > 0; n--) {
            const spot = near.pop()!;
            b.put(spot);
            const guard = placedFrom(row, spot, group, 'guard');
            guard.quest = quest.id;
            built.monsters.push(guard);
          }
          group++;
        }
        return true;
      }
      case 'belonging':
      case 'magic_item': {
        if (!item) return true; // no named item in the table yet: a content gap
        const loot: Loot[] = [{ kind: 'quest_item', quest: quest.id, id: item.id, name: item.name }];
        // A magic item is often behind a locked door (Spec 02, "Quest goals"); never behind a secret one.
        if (quest.type === 'magic_item' && rng.oneIn(2) && hostLoot(loot, behindLocked)) return true;
        return hostLoot(loot);
      }
      case 'opponent': {
        const rows = withinCeiling(content.monsters, ratingCeiling(depth));
        const row = rollRow(ctx, rows);
        if (!row) return true;
        const at = rng.shuffle(b.roomCells(b.openRooms(), false).filter((p) => inOpen(p) && farFromUp(b, p)))[0];
        if (!at) return false;
        b.put(at);
        const opp = placedFrom(row, at, group++, 'opponent');
        // Rated above the level's ceiling (Spec 02); at the cap of 20 dice the modifier carries the difference.
        const ceiling = ratingCeiling(depth);
        if (ceiling < 20) opp.dice = ceiling + 1;
        else opp.modifier = Math.min(6, opp.modifier + 1);
        opp.name = person ?? opp.name;
        opp.quest = quest.id;
        built.monsters.push(opp);
        return true;
      }
    }
  }

  const parcels = [...input.extras];
  for (const piece of plan.pieces) {
    switch (piece.kind) {
      case 'vault_key':
        place(hostLoot([{ kind: 'vault_key', link: piece.link }]));
        break;
      case 'vault': {
        const at = input.vaultRoom === undefined ? undefined : nearestCentre(b, input.vaultRoom);
        if (!at || input.vaultRoom === undefined) {
          missing++;
          break;
        }
        b.put(at, true);
        built.features.push({ ...at, type: 'container', kind: 'chest', contents: parcels.shift() ?? [], link: piece.link });
        built.specials.push({ ...at, kind: 'vault', link: piece.link, name: piece.name, room: b.rooms[input.vaultRoom]! });
        break;
      }
      case 'map_fragment':
        place(hostLoot([{ kind: 'map_fragment', link: piece.link, mappedLevel: piece.mappedLevel }]));
        break;
      case 'lore_entry':
        place(wallMark('graffiti', piece.link, piece.text, piece.link, piece.index));
        break;
      case 'lore_end':
        if (piece.end === 'boss_weakness') place(wallMark('graffiti', piece.link, piece.text, piece.link));
        else {
          // A hidden cache: preferably behind a locked door, else anywhere a chest fits.
          const at = stand(behindLocked) ?? stand();
          if (at) {
            b.put(at, true);
            built.features.push({ ...at, type: 'container', kind: 'chest', contents: parcels.shift() ?? [], link: piece.link });
          } else missing++;
        }
        break;
      case 'rune_letter':
        place(wallMark('rune', piece.runeId, piece.letter, piece.link, piece.index));
        break;
      case 'rune_altar': {
        const at = stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.features.push({ ...at, type: 'fixture', kind: 'altar', link: piece.link });
        built.specials.push({ ...at, kind: 'rune_altar', link: piece.link, word: piece.word });
        break;
      }
      case 'specialist': {
        const at = stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.npcs.push({ ...at, kind: 'captive', name: piece.name, link: piece.link, service: piece.service });
        break;
      }
      case 'rival': {
        const at = stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.npcs.push({ ...at, kind: 'rival', name: piece.name, link: piece.link });
        break;
      }
      case 'rival_stash': {
        const at = stand(behindLocked) ?? stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.features.push({ ...at, type: 'container', kind: 'chest', contents: parcels.shift() ?? [], link: piece.link });
        break;
      }
      case 'shrine': {
        const at = stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.features.push({ ...at, type: 'fixture', kind: 'altar', god: piece.god, link: piece.link });
        break;
      }
      case 'lever': {
        const at = stand();
        if (!at) {
          missing++;
          break;
        }
        b.put(at, true);
        built.specials.push({ ...at, kind: 'lever', link: piece.link, landingLevel: piece.landingLevel });
        break;
      }
      case 'landing': {
        const at = rng.shuffle(b.roomCells(b.openRooms(), true).filter(inOpen))[0];
        if (!at) {
          missing++;
          break;
        }
        b.put(at);
        built.specials.push({ ...at, kind: 'landing', link: piece.link });
        break;
      }
    }
  }
  return missing;
}
