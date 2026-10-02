// The UI shell: owns the log, the overlay stack and the screen. Turns key
// presses into commands, gives them to the top overlay, or else to the game.

import type { Command, CommandType } from '../game/commands.ts';
import { describeCell, lookCreatures } from '../game/look.ts';
import { cameraOrigin } from './camera.ts';
import { MessageLog } from '../game/log.ts';
import { drawCharacterPane, type CharacterPaneData } from './character-pane.ts';
import type { Grid } from './grid.ts';
import { type KeyInput, keyToCommand } from './input.ts';
import { drawLog } from './log-pane.ts';
import { Menu, type Overlay, type OverlayResult } from './overlay.ts';
import { type GameMenuHost, HelpOverlay, HistoryOverlay, gameMenu } from './overlays.ts';
import { MAIN_PANE, drawPanes, inner } from './panes.ts';
import { UI, mapLook } from './palette.ts';
import { drawMap } from './map-view.ts';
import type { Game } from '../game/game.ts';
import type { Run } from '../game/run.ts';
import { VillageScreen, type TownHost } from './town.ts';
import { LevelUpMenu, levelUpMenu, talkMenu, type PeopleHost } from './people.ts';
import { LEVEL_XP, poolsWithRoom } from '../rules/character/progression.ts';
import type { LogMessage } from '../core/log.ts';
import { CellCursor, Targeting, startTargeting } from '../game/targeting.ts';
import { ratingText } from '../game/monsters.ts';
import { asCast, blinkCells, canBlinkTo, spellTargets, targetSpecOf } from '../game/magic.ts';
import type { Spell } from '../core/schemas.ts';
import { describeStatus } from '../rules/magic/status.ts';
import { InventoryOverlay, TextWindow, type InventoryHost } from './inventory.ts';
import { JournalOverlay, LootOverlay, type LootHost, type OfferHost, offerMenu } from './features.ts';
import { offeringCost } from '../game/features/index.ts';
import { spellMenu } from './spells.ts';
import { type ItemCtx, ctxOf, derivedFor, drinkPotion, equipItem, itemName, unequipSlot } from '../game/items.ts';
import type { ClassDef } from '../rules/character/character.ts';
import type { ActResult } from '../game/game.ts';
import { carriedEstimate } from '../rules/items/treasure.ts';
import { equipped, slotsUsed } from '../rules/items/inventory.ts';
import { BUILT_MAJORS, MAJOR_KINDS, activeAbilities, majorOf, packSizeOf, passiveNote, shieldWallReady } from '../game/abilities.ts';
import { isIdentified, displayName } from '../rules/items/magic.ts';
import { type Item } from '../rules/items/types.ts';
import { resolvesAtOnce, needsCell } from '../rules/magic/spells.ts';
import { fascinateTargets, markTargets, volleyProblem, volleyTargets, waitRoundsNow } from '../game/actives.ts';
import { canDecoyAt, decoyCells } from '../game/allies.ts';
import type { Monster } from '../game/monsters.ts';

export class Shell {
  readonly log = new MessageLog();
  readonly overlays: Overlay[] = [];
  /** The round, from the game once a level is loaded; messages from this round draw bright. */
  turn = 1;
  /** Called when the player quits from the game menu (returns to the title screen). */
  onQuit: (() => void) | null = null;
  /** Called when the player dies, arrives on level 100 or kills the final boss: the leaderboard moments (Spec 09). */
  onMilestone: ((kind: 'death' | 'win' | 'final_boss') => void) | null = null;
  /** What the game menu offers besides help and quitting (Spec 09). */
  menuHost: GameMenuHost = {};
  private announced = { death: false, win: false, final_boss: false };
  /** The run in progress; null until one starts (the title screen, task 1.10). */
  run: Run | null = null;
  /** The village menu, while the run is in a village (Spec 01: no village map). */
  village: VillageScreen | null = null;
  /** Set while the player is choosing a target (a free action: no round passes). */
  targeting: Targeting | null = null;
  /** The spell being aimed, while targeting or choosing a cell for it; null when the target is for the ranged weapon. */
  casting: Spell | null = null;
  /** The wand, rod or staff being aimed, when the spell is cast from its charges. */
  usingItem: Item | null = null;
  /** Set while the player is choosing the cell Blink goes to. */
  cursor: CellCursor | null = null;
  /** Set while looking (L): the cursor, and which visible creature Tab last jumped to. */
  looking: CellCursor | null = null;
  private lookIndex = -1;
  /** The active major ability being aimed (Fascinate, Mark, Volley), with Volley's first target once chosen. */
  aimingAbility: { id: string; first?: Monster } | null = null;

  constructor(
    public title: string,
    public character: CharacterPaneData,
  ) {}

  /** The level being played; null in a village or with no run. */
  get game(): Game | null {
    return this.run?.game ?? null;
  }

  /** Start showing a run: its level or its village, with the header and character pane in step. */
  setRun(run: Run): void {
    this.run = run;
    // A run loaded after it was won has already been recorded.
    this.announced = { death: false, win: run.player.stats.won, final_boss: run.player.stats.finalBoss };
    this.targeting = null;
    this.cursor = null;
    this.aimingAbility = null;
    this.casting = null;
    this.usingItem = null;
    this.arrived();
  }

  // After the run changes place: header, village menu, round counter and character pane.
  private arrived(): void {
    const run = this.run!;
    this.title = run.title;
    this.village = run.inVillage ? new VillageScreen(run, this.townHost()) : null;
    this.turn = run.game ? run.game.state.round : run.round;
    this.syncCharacter();
    this.character.target = undefined;
  }

  /** What the village screens call: leave, log, refresh and run level ups, and arrive by lift. */
  private townHost(): TownHost {
    return {
      go: (direction) => this.travel(direction),
      log: (messages) => this.say(messages),
      changed: () => this.refreshed(),
      moved: (messages) => this.moved(messages),
    };
  }

  private peopleHost(): PeopleHost {
    return {
      log: (messages) => this.say(messages),
      changed: () => this.refreshed(),
      free: (index) => this.applyResult(this.game!.free(index)),
    };
  }

  private say(messages: readonly LogMessage[]): void {
    for (const m of messages) this.log.add(m, this.game ? this.game.state.round : this.run?.round ?? this.turn);
  }

  /** The pane follows what the services did, and any level up owed is run, one screen per level (Spec 03). */
  private refreshed(): void {
    this.syncCharacter();
    const run = this.run;
    if (!run || run.levelsOwed <= 0 || poolsWithRoom(run.character).length === 0 || this.overlays.some((o) => o instanceof LevelUpMenu)) return;
    const menu = levelUpMenu(run, { log: (m) => this.say(m), changed: () => this.syncCharacter() });
    this.overlays.push(menu);
  }

  private travel(direction: 'up' | 'down'): void {
    this.moved(this.run!.travel(direction));
  }

  /** The run changed level or village (stairs, a teleporter, a fall): say so, and bring everything in line. */
  private moved(messages: readonly LogMessage[]): void {
    for (const m of messages) this.log.add(m, this.run!.round);
    this.stopAiming();
    this.arrived();
    this.refreshed();
  }

  /**
   * Show what an action did: its messages, a change of level if it asked for one, the pane, and whatever it opened
   * for the player to look at or choose from (a pick-up list, an altar's offering, text to read).
   */
  private applyResult(result: ActResult): void {
    for (const m of result.messages) this.log.add(m, this.game ? this.game.state.round : this.turn);
    if (result.stairs) return this.travel(result.stairs);
    if (result.teleport !== undefined) return this.moved(this.run!.teleport(result.teleport));
    if (result.fall) return this.moved(this.run!.fall());
    if (this.game) this.afterAction();
    else this.syncCharacter();
    const game = this.game;
    if (!game) return;
    if (result.opened !== undefined) this.overlays.push(new LootOverlay(game, result.opened, this.lootHost()));
    if (result.offer !== undefined) this.overlays.push(offerMenu(ctxOf(game), result.offer, offeringCost(game), this.offerHost()));
    if (result.read) this.overlays.push(new TextWindow(result.read.title, result.read.lines));
    if (result.npc !== undefined) {
      const talk = talkMenu(game, result.npc, this.peopleHost());
      if (talk) this.overlays.push(talk);
    }
  }

  private lootHost(): LootHost {
    return { take: (index, which) => this.applyResult(this.game!.take(index, which)) };
  }

  private offerHost(): OfferHost {
    return { offer: (index, what) => this.applyResult(this.game!.offerAt(index, what)) };
  }

  /** Handle a key press. Returns true if the key is in the key map, so the caller can stop the browser acting on it. */
  handleKey(e: KeyInput): boolean {
    const command = keyToCommand(e);
    if (!command) return false;
    const top = this.overlays[this.overlays.length - 1];
    if (top) this.apply(top.handle(command), top);
    else this.play(command);
    return true;
  }

  private apply(result: OverlayResult, from: Overlay): void {
    if (result.message) this.log.add(result.message, this.turn);
    if (result.messages) this.say(result.messages);
    if (result.close) this.overlays.splice(this.overlays.indexOf(from), 1);
    if (result.open) this.overlays.push(result.open);
  }

  // Commands with no open overlay. Those whose systems are not built yet say so in the log.
  private play(command: Command): void {
    if (this.targeting) {
      this.target(command);
      return;
    }
    if (this.cursor) {
      this.chooseCell(command);
      return;
    }
    if (this.looking) {
      this.look(command);
      return;
    }
    if (this.village && ['move', 'confirm', 'interact'].includes(command.type)) {
      this.applyVillage(this.village.handle(command));
      return;
    }
    switch (command.type) {
      case 'cancel':
        this.overlays.push(gameMenu(this.onQuit ?? undefined, this.menuHost));
        return;
      case 'history':
        this.overlays.push(new HistoryOverlay(this.log, this.turn));
        return;
      case 'help':
        this.overlays.push(new HelpOverlay());
        return;
      case 'ranged':
        if (this.game) {
          this.startTargeting();
          return;
        }
        break;
      case 'waitLong':
        if (this.game) {
          this.applyResult(this.game.waitUntilRecovered());
          return;
        }
        break;
      case 'look':
        if (this.game) {
          this.startLooking();
          return;
        }
        break;
      case 'cast':
        this.openSpells();
        return;
      case 'ability':
        this.openAbilities();
        return;
      case 'inventory':
        this.openInventory();
        return;
      case 'journal':
        this.overlays.push(
          new JournalOverlay(
            () => this.run?.player.journal ?? [],
            this.run ? { quests: () => this.run!.town.active().map((o) => ({ id: o.quest.id, text: o.text })), abandon: (id) => this.say(this.run!.town.abandon(id).messages) } : undefined,
          ),
        );
        return;
      default: {
        const result = this.game?.act(command);
        if (result) {
          this.applyResult(result);
          return;
        }
      }
    }
    this.log.add({ kind: 'system', text: nothingToDo(command.type, this.run ? (this.game ? 'dungeon' : 'village') : 'none') }, this.turn);
  }

  // --- L: look (Spec 01, Addendum A), a free action ---

  /** Start looking: a cursor on the player, kept within the main view. */
  private startLooking(): void {
    const game = this.game!;
    this.looking = new CellCursor(game, () => true, []);
    this.lookIndex = -1;
  }

  /** Keys while looking: W A S D move the cursor within the main view, Tab and Shift+Tab jump between visible creatures, Esc, Enter or L end it. */
  private look(command: Command): void {
    const cursor = this.looking!;
    const game = this.game!;
    switch (command.type) {
      case 'move': {
        const { x0, y0, x1, y1 } = this.viewBounds();
        cursor.at = { x: Math.min(x1, Math.max(x0, cursor.at.x + command.dx)), y: Math.min(y1, Math.max(y0, cursor.at.y + command.dy)) };
        return;
      }
      case 'nextTarget':
      case 'prevTarget': {
        const creatures = lookCreatures(game);
        if (creatures.length === 0) return;
        const next = command.type === 'nextTarget';
        // The first Tab goes to the nearest creature and the first Shift+Tab to the farthest; after that they cycle.
        if (this.lookIndex < 0) this.lookIndex = next ? 0 : creatures.length - 1;
        else this.lookIndex = (this.lookIndex + (next ? 1 : -1) + creatures.length) % creatures.length;
        const m = creatures[this.lookIndex]!;
        cursor.at = { x: m.x, y: m.y };
        return;
      }
      case 'confirm':
      case 'cancel':
      case 'look':
        this.looking = null;
        return;
      default:
        return;
    }
  }

  /** The level cells the main view shows now, as the camera places it. */
  private viewBounds(): { x0: number; y0: number; x1: number; y1: number } {
    const { level, player } = this.game!.state.map;
    const view = inner(MAIN_PANE);
    const origin = cameraOrigin(level.width, level.height, player, view.w, view.h);
    return { x0: Math.max(0, origin.x), y0: Math.max(0, origin.y), x1: Math.min(level.width, origin.x + view.w) - 1, y1: Math.min(level.height, origin.y + view.h) - 1 };
  }

  /** What look says of the cell under its cursor, for the bottom row of the main view. */
  lookText(): string | null {
    return this.looking && this.game ? describeCell(this.game, this.looking.at) : null;
  }

  private applyVillage(result: OverlayResult): void {
    if (result.message) this.log.add(result.message, this.turn);
    if (result.messages) this.say(result.messages);
    if (result.open) this.overlays.push(result.open);
  }

  /** Bring the round counter and the character pane's Combat pool in line with the game. */
  private afterAction(): void {
    this.turn = this.game!.state.round;
    this.syncCharacter();
  }

  private syncCharacter(): void {
    const player = this.run?.player;
    if (!player) return;
    // Everything below is read from the player, the one record of the character (Spec 03, Addendum A).
    const pools = { Combat: player.pools.combat, Skill: player.pools.skill, Magic: player.pools.magic } as const;
    for (const stat of this.character.stats) {
      stat.step = pools[stat.name].step;
      stat.current = pools[stat.name].dice;
      stat.max = pools[stat.name].max;
    }
    if (player.name) this.character.name = player.name;
    const classDef = this.run!.classDef;
    if (classDef) this.character.className = classDef.name;
    this.character.abilities = abilityLines(player.minorAbilities, classDef);
    // The wait recovery counter: rounds waited so far, and how many bring a Combat die back (Spec 01, Status).
    const minors = this.run!.gameContent.minors;
    this.character.wait = { rounds: player.waited, needed: this.game ? waitRoundsNow(this.game) : derivedFor(player, minors).waitRounds };
    // Active effects with their rounds left, then a Shield, then timed abilities such as Sanctuary (Spec 01, Status; Spec 04; Spec 03, Addendum A).
    this.character.status = [
      ...player.statuses.map(describeStatus),
      ...(player.shield > 0 ? [`Shield ${player.shield}`] : []),
      ...(player.timed ?? []).map((t) => `${t.name} ${t.rounds}`),
      // Trades and once-per-fight abilities that are ready (Spec 03, Addendum A: "the pane shows when it is ready").
      ...(player.smite ? ['Smite ready'] : []),
      ...(shieldWallReady(player) ? ['Shield Wall ready'] : []),
    ];
    // What is worn and wielded with its quality, the slots in use and the carried estimate (Spec 01, Spec 05).
    const ctx = this.itemCtx();
    if (ctx) {
      this.character.equipment = equipped(player.equipment).map(({ item }) => ({
        name: displayName(item, ctx.knowledge),
        quality: item.kind === 'weapon' || item.kind === 'ranged' || item.kind === 'armour' || item.kind === 'shield'
          ? item.broken ? 'Broken' : item.quality[0]!.toUpperCase() + item.quality.slice(1)
          : isIdentified(item, player.known) ? '' : 'Unknown',
      }));
    }
    this.character.inventory = { used: slotsUsed(player), total: packSizeOf(player, minors) };
    // The bank, XP and level come from the run (Spec 01, Spec 03, Spec 07).
    const run = this.run!;
    this.character.bank = player.town.bank;
    this.character.xp = run.character.xp;
    this.character.level = run.character.level;
    this.character.xpNext = LEVEL_XP[run.character.level] ?? null;
    this.checkMilestones();
    this.character.carried = carriedEstimate(player.coins, player.pack);
  }

  /** The leaderboard moments, each announced once: the final boss, level 100, death (Spec 09). */
  private checkMilestones(): void {
    const { stats, dead } = this.run!.player;
    for (const [kind, now] of [['final_boss', stats.finalBoss], ['win', stats.won], ['death', dead]] as const) {
      const key = kind === 'death' ? 'death' : kind === 'win' ? 'win' : 'final_boss';
      if (!now || this.announced[key]) continue;
      this.announced[key] = true;
      this.onMilestone?.(kind);
    }
  }

  /** What the item actions work from: the level's game, or in a village the run alone. */
  private itemCtx(): ItemCtx | null {
    return this.game ? ctxOf(this.game) : this.run ? this.run.ctx() : null;
  }

  /** I: the inventory, anywhere. Equipping and inspecting work in a village too; the rest need a level. */
  private openInventory(): void {
    const ctx = this.itemCtx();
    if (!ctx) {
      this.log.add({ kind: 'system', text: 'There is nothing to carry yet.' }, this.turn);
      return;
    }
    this.overlays.push(new InventoryOverlay(ctx, this.inventoryHost()));
  }

  /** Log what an action said and bring the pane and round counter in line. */
  private done(result: ActResult): void {
    this.applyResult(result);
  }

  /** In a village an item action takes no round: it just says what happened. */
  private free(run: (messages: LogMessage[]) => unknown): void {
    const messages: LogMessage[] = [];
    run(messages);
    this.done({ messages, spent: false });
  }

  private inventoryHost(): InventoryHost {
    return {
      equip: (item) => {
        const g = this.game;
        if (g) this.done(g.equip(item));
        else this.free((m) => equipItem(this.run!.ctx(), item, m));
      },
      unequip: (slot) => {
        const g = this.game;
        if (g) this.done(g.unequip(slot));
        else this.free((m) => unequipSlot(this.run!.ctx(), slot, m));
      },
      drop: (item) => {
        const g = this.game;
        if (g) this.done(g.drop(item));
        else this.free((m) => m.push({ kind: 'system', text: 'There is nowhere to drop that in a village.' }));
      },
      use: (item) => {
        const g = this.game;
        if (!g) {
          if (item.kind === 'potion') this.free((m) => drinkPotion(this.run!.ctx(), item, m));
          else this.free((m) => m.push({ kind: 'system', text: 'You cannot use that in a village.' }));
          return;
        }
        // A wand, rod or staff whose spell needs a creature or a cell is aimed first.
        const spell = item.kind === 'wand' || item.kind === 'rod' || item.kind === 'staff' ? g.spells.get(item.spell) : undefined;
        if (spell && !resolvesAtOnce(spell)) {
          this.overlays.length = 0;
          this.beginAim(spell, item);
          return;
        }
        this.done(g.use(item));
      },
    };
  }

  /** C: the spell list. Choosing a spell starts the cast. */
  private openSpells(): void {
    const game = this.game;
    if (!game) {
      this.log.add({ kind: 'system', text: 'There is nothing to cast at in a village.' }, this.turn);
      return;
    }
    const { player } = game.state;
    const known = player.spells.map((id) => game.spells.get(id)).filter((s): s is Spell => s !== undefined);
    if (known.length === 0) {
      this.log.add({ kind: 'system', text: 'You know no spells.' }, this.turn);
      return;
    }
    this.overlays.push(spellMenu(known, player.pools.magic, (spell) => this.beginCast(spell)));
  }

  /**
   * Q (Spec 03, Addendum A): the major ability, or, when minor abilities that are used (actives) are drawn too, a short
   * list with the major first, where Enter chooses. With one usable ability Q uses it at once.
   */
  private openAbilities(): void {
    const run = this.run;
    if (!run) {
      this.log.add({ kind: 'system', text: 'You have no ability to use.' }, this.turn);
      return;
    }
    const { player } = run;
    const content = run.gameContent;
    const major = majorOf(player);
    const entries: { name: string; use: () => void }[] = [];
    if (major) entries.push({ name: content.majorNames.get(major) ?? major, use: () => this.useMajor(major) });
    for (const id of activeAbilities(player, content.minors)) entries.push({ name: content.minorNames.get(id) ?? id, use: () => this.useMinor(id) });
    if (entries.length === 0) {
      this.log.add({ kind: 'system', text: 'You have no ability to use.' }, this.turn);
      return;
    }
    if (entries.length === 1) {
      entries[0]!.use();
      return;
    }
    this.overlays.push(new Menu('Abilities', entries.map((e) => ({ label: e.name, choose: (): OverlayResult => (e.use(), { close: true }) })), 'Enter uses, Esc closes.'));
  }

  /** Use the major ability: a spell is cast as C would; anything else goes to the game, or in a village is explained. */
  private useMajor(id: string): void {
    const game = this.game;
    const player = this.run!.player;
    const name = this.run!.gameContent.majorNames.get(id) ?? id;
    if (MAJOR_KINDS[id] === 'passive' && BUILT_MAJORS.includes(id)) {
      this.log.add({ kind: 'system', text: passiveNote(player, id, name) }, this.turn);
      return;
    }
    if (!game) {
      this.log.add({ kind: 'system', text: `You can use ${name} only in the dungeon.` }, this.turn);
      return;
    }
    if (MAJOR_KINDS[id] === 'spell') {
      const spell = game.spells.get(id);
      if (spell && player.spells.includes(id)) this.beginCast(spell);
      else this.log.add({ kind: 'system', text: `You do not know ${name}.` }, this.turn);
      return;
    }
    if (id === 'volley' || id === 'fascinate' || id === 'mark') return this.aimAbility(id);
    if (id === 'decoy') return this.placeDecoy();
    this.applyResult(game.useMajor());
  }

  /**
   * Aim an active major ability (Spec 03, Addendum A): Fascinate at any creature in sight and Mark at an asleep or
   * unaware one, with no range limit or line of fire; Volley at a first and then a second, different target of the
   * readied weapon's shot. Choosing is free; Enter confirms and Esc cancels, as in targeting (Spec 01).
   */
  private aimAbility(id: 'volley' | 'fascinate' | 'mark'): void {
    const game = this.game!;
    const problem = id === 'volley' ? volleyProblem(game) : undefined;
    if (problem) {
      this.log.add({ kind: 'system', text: problem }, this.turn);
      return;
    }
    const targets = id === 'volley' ? volleyTargets(game) : id === 'fascinate' ? fascinateTargets(game) : markTargets(game);
    if (targets.length === 0) {
      this.log.add({ kind: 'system', text: id === 'mark' ? 'There is no unaware creature in sight.' : id === 'fascinate' ? 'There is no creature in sight.' : 'There is no valid target.' }, this.turn);
      return;
    }
    const range = id === 'volley' ? game.ranged()!.range : Math.max(game.state.map.level.width, game.state.map.level.height);
    this.aimingAbility = { id };
    this.targeting = new Targeting(game, { range, shape: { kind: 'single' } }, targets);
    this.showTarget();
  }

  /** Decoy (Spec 03, Addendum A): a cursor as for Blink picks a visible free cell within 5 for the phantom. */
  private placeDecoy(): void {
    const game = this.game!;
    const cells = decoyCells(game);
    if (cells.length === 0) {
      this.log.add({ kind: 'system', text: 'There is nowhere to place the phantom.' }, this.turn);
      return;
    }
    this.aimingAbility = { id: 'decoy' };
    this.cursor = new CellCursor(game, (at) => canDecoyAt(game, at), cells);
  }

  /** Enter while aiming an ability: Volley's first choice asks for a second when there is one; anything else is used. */
  private confirmAbility(t: Targeting): ActResult | undefined {
    const { id, first } = this.aimingAbility!;
    if (id !== 'volley') return this.game!.useMajor(t.selected);
    if (first) return this.game!.useMajor([first, t.selected]);
    const rest = t.targets.filter((m) => m !== t.selected);
    if (rest.length === 0) return this.game!.useMajor([t.selected]);
    this.aimingAbility = { id, first: t.selected };
    this.targeting = new Targeting(this.game!, t.spec, rest);
    this.log.add({ kind: 'system', text: 'Choose a second target.' }, this.turn);
    return undefined;
  }

  /** Use an active minor ability (a skill use); only in the dungeon. */
  private useMinor(id: string): void {
    const game = this.game;
    if (!game) {
      this.log.add({ kind: 'system', text: `You can use ${this.run!.gameContent.minorNames.get(id) ?? id} only in the dungeon.` }, this.turn);
      return;
    }
    this.applyResult(game.useAbility(id));
  }

  /** A spell chosen from the list. */
  private beginCast(spell: Spell): void {
    this.beginAim(spell, null);
  }

  /**
   * A self spell, or one around the caster, resolves on choosing; the rest ask for a creature or a cell (Spec 01,
   * Targeting). `item` is the wand, rod or staff when the spell is cast from its charges.
   */
  private beginAim(spell: Spell, item: Item | null): void {
    const game = this.game!;
    const go = (aim?: Parameters<typeof game.cast>[1]) => (item ? game.use(item, aim) : game.cast(spell, aim));
    if (needsCell(spell)) {
      const cells = blinkCells(game, spell);
      if (cells.length === 0) {
        this.log.add({ kind: 'system', text: 'There is nowhere to blink to.' }, this.turn);
        return;
      }
      this.casting = spell;
      this.usingItem = item;
      this.cursor = new CellCursor(game, (at) => canBlinkTo(game, spell, at), cells);
      return;
    }
    if (resolvesAtOnce(spell)) return this.finishCast(go());
    const targets = spellTargets(game, spell);
    if (targets.length === 0) {
      this.log.add({ kind: 'system', text: 'There is no valid target.' }, this.turn);
      return;
    }
    this.casting = spell;
    this.usingItem = item;
    this.targeting = new Targeting(game, targetSpecOf(asCast(game, spell)), targets);
    this.showTarget();
  }

  private finishCast(result: ActResult): void {
    this.applyResult(result);
  }

  /** Forget what was being aimed. */
  private stopAiming(): void {
    this.looking = null;
    this.aimingAbility = null;
    this.targeting = null;
    this.cursor = null;
    this.casting = null;
    this.usingItem = null;
  }

  // Keys while choosing Blink's cell: W A S D move the cursor, Enter confirms, Esc cancels with no turn spent.
  private chooseCell(command: Command): void {
    const cursor = this.cursor!;
    switch (command.type) {
      case 'move':
        cursor.move(command.dx, command.dy);
        return;
      case 'confirm': {
        const decoy = this.aimingAbility?.id === 'decoy';
        if (!cursor.ok) {
          this.log.add({ kind: 'system', text: decoy ? 'You cannot place the phantom there.' : 'You cannot blink there.' }, this.turn);
          return;
        }
        if (decoy) {
          const at = { ...cursor.at };
          this.stopAiming();
          this.applyResult(this.game!.useMajor(at));
          return;
        }
        const spell = this.casting!;
        const item = this.usingItem;
        this.stopAiming();
        this.finishCast(item ? this.game!.use(item, { ...cursor.at }) : this.game!.cast(spell, { ...cursor.at }));
        return;
      }
      case 'cancel':
        this.stopAiming();
        return;
      default:
        return;
    }
  }

  private startTargeting(): void {
    const game = this.game!;
    const option = game.ranged();
    if (!option) {
      this.log.add({ kind: 'system', text: 'You have no ranged weapon readied.' }, this.turn);
      return;
    }
    if (option.problem) {
      this.log.add({ kind: 'system', text: option.problem }, this.turn);
      return;
    }
    const targeting = startTargeting(game, { range: option.range, shape: { kind: 'single' } });
    if (!targeting) {
      this.log.add({ kind: 'system', text: 'There is no valid target.' }, this.turn);
      return;
    }
    this.targeting = targeting;
    this.showTarget();
  }

  private showTarget(): void {
    const t = this.targeting;
    this.character.target = t ? t.paneTarget(ratingText(t.selected)) : undefined;
  }

  // Keys while choosing a target: Tab cycles, Enter confirms, Esc cancels. Nothing else acts.
  private target(command: Command): void {
    const t = this.targeting!;
    switch (command.type) {
      case 'nextTarget':
        t.next();
        break;
      case 'prevTarget':
        t.prev();
        break;
      case 'confirm':
      {
        if (this.aimingAbility) {
          const result = this.confirmAbility(t);
          if (result) {
            this.stopAiming();
            this.applyResult(result);
          }
          break;
        }
        const spell = this.casting;
        const item = this.usingItem;
        const result = item ? this.game!.use(item, t.selected) : spell ? this.game!.cast(spell, t.selected) : this.game!.fire(t.selected);
        this.stopAiming();
        this.applyResult(result);
        break;
      }
      case 'cancel':
        this.stopAiming();
        break;
      default:
        return;
    }
    this.showTarget();
  }

  /** Draw the whole screen: panes, character, log, then any overlay on top. */
  draw(grid: Grid): void {
    drawPanes(grid, this.title);
    if (this.game) {
      drawMap(grid, this.game.state, this.targeting, this.cursor ?? this.looking, mapLook(this.run?.theme));
      const text = this.lookText();
      if (text !== null) {
        const view = inner(MAIN_PANE);
        grid.text(view.x, view.y + view.h - 1, text.slice(0, view.w).padEnd(view.w), UI.value, UI.background);
      }
    }
    else if (this.village) this.village.draw(grid);
    else grid.text(inner(MAIN_PANE).x + 2, inner(MAIN_PANE).y + 1, 'No level loaded.', UI.label, UI.background);
    drawCharacterPane(grid, this.character);
    drawLog(grid, this.log, this.turn);
    for (const overlay of this.overlays) overlay.draw(grid, this.turn);
  }
}

/**
 * The Abilities block (Spec 01): the major ability first, then each minor ability drawn, by name, a stackable one
 * drawn more than once shown once with its count (Pack Mule x2). Without a class, the minor abilities by id.
 */
export function abilityLines(minors: readonly string[], classDef: ClassDef | undefined): string[] {
  const nameOf = (id: string): string => classDef?.minorAbilities.find((a) => a.id === id)?.name ?? id;
  const counts = new Map<string, number>();
  for (const id of minors) counts.set(id, (counts.get(id) ?? 0) + 1);
  const lines = [...counts].map(([id, n]) => (n > 1 ? `${nameOf(id)} x${n}` : nameOf(id)));
  return classDef ? [classDef.majorAbility.name, ...lines] : lines;
}

/**
 * What a key with nothing to act on says (Spec 01: every key acts), with no round spent: in a village, which has no map
 * and no rounds, and in the dungeon when there is nothing to target or confirm.
 */
export function nothingToDo(type: CommandType, where: 'dungeon' | 'village' | 'none'): string {
  if (where === 'none') return 'There is no game in progress.';
  switch (type) {
    case 'nextTarget':
    case 'prevTarget':
      return 'There is nothing to target.';
    case 'confirm':
      return 'There is nothing to confirm.';
    default:
      break;
  }
  if (where === 'dungeon') return 'There is nothing to do that with here.';
  switch (type) {
    case 'wait':
    case 'waitLong':
      return 'There is no waiting in a village; rest at the lodging to recover.';
    case 'search':
      return 'There is nothing to search in a village.';
    case 'pickup':
      return 'There is nothing to pick up in a village.';
    case 'ranged':
      return 'There is nothing to shoot at in a village.';
    case 'look':
      return 'There is no map to look at in a village.';
    default:
      return 'There is nothing to do that with in a village.';
  }
}
