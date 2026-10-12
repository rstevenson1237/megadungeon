// The UI shell: owns the log, the overlay stack and the screen. Turns key
// presses into commands, gives them to the top overlay, or else to the game.

import type { Command, CommandType } from '../game/commands.ts';
import { describeCell, lookCreatures } from '../game/look.ts';
import { cameraOrigin } from './camera.ts';
import { MessageLog } from '../game/log.ts';
import { drawCharacterPane, type CharacterPaneData } from './character-pane.ts';
import type { Grid } from './grid.ts';
import { type KeyInput, keyToCommand, moveOf } from './input.ts';
import { FAST_TICK_MS, TICK_MS } from './frame-loop.ts';
import { WaitWatch } from '../game/fast-forward.ts';
import { drawLog } from './log-pane.ts';
import { Menu, type Overlay, type OverlayResult } from './overlay.ts';
import { type GameMenuHost, HelpOverlay, HistoryOverlay, gameMenu } from './overlays.ts';
import { MAIN_PANE, drawPanes, inner } from './panes.ts';
import { UI, mapLook } from './palette.ts';
import { drawMap } from './map-view.ts';
import type { DisplayMode } from './display.ts';
import { buildIsoDraws, isoOnScreen } from './iso-view.ts';
import type { IsoPicture } from './iso-paint.ts';
import type { IsoArt } from './art/iso-art.ts';
import type { Game } from '../game/game.ts';
import type { Run } from '../game/run.ts';
import { VillageScreen, type TownHost } from './town.ts';
import { LevelUpMenu, levelUpMenu, talkMenu, type PeopleHost } from './people.ts';
import { LEVEL_XP, poolsWithRoom } from '../rules/character/progression.ts';
import type { LogMessage } from '../core/log.ts';
import { CellCursor, Targeting, startTargeting, validTargets } from '../game/targeting.ts';
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

/** The map commands that spend an action, which real time carries out at once or holds during the cooldown (Spec 04, Addendum B). */
const ACTIONS: readonly CommandType[] = ['wait', 'interact', 'pickup', 'search'];

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
  /** Real time: the valid targets of what is being aimed, rebuilt every tick (Spec 01, Addendum B). */
  private retarget: (() => Monster[]) | null = null;
  /**
   * Real time: paused by P ('key'), or by the tab being hidden or the window losing focus ('focus'). Either way P or a
   * movement key resumes (Spec 01, Addendum B). Overlays pause too, without this being set.
   */
  paused: 'key' | 'focus' | null = null;
  /** Real time: Z is fast-forwarding, and this watches for what stops it. */
  private waiting: WaitWatch | null = null;
  /**
   * How the main view is drawn: text, or the isometric picture (Spec 01, Addendum B; Spec 01b). A browser preference,
   * never part of the run: switching it changes nothing in the game.
   */
  display: DisplayMode = 'text';
  /** Called when the game menu switches the display, so the choice is remembered. */
  onDisplay: ((display: DisplayMode) => void) | null = null;
  /** The loaded isometric art, if any; without it the picture draws with the glyph fallback (Spec 01b, Sprites). */
  art: IsoArt | null = null;
  /** The art is still loading: until it arrives the text display stays (Spec 01b, Loading). */
  artWaiting = false;

  constructor(
    public title: string,
    public character: CharacterPaneData,
  ) {}

  /** The level being played; null in a village or with no run. */
  get game(): Game | null {
    return this.run?.game ?? null;
  }

  /** Whether the run is played in real time (Spec 04, Addendum B). */
  get realTime(): boolean {
    return this.run?.time === 'real';
  }

  /**
   * Real time: whether ticks run now (Spec 01, Addendum B). They stop in a village, while paused by P or by a hidden tab
   * or lost focus, while any overlay is open, and once the player is dead. Targeting and look do not stop them.
   */
  get ticking(): boolean {
    const game = this.game;
    return !!game && game.time === 'real' && this.paused === null && this.overlays.length === 0 && !game.state.player.dead;
  }

  /** How long a tick lasts now: 50 ms, or 12.5 ms while Z fast-forwards. */
  get tickMs(): number {
    return this.waiting ? FAST_TICK_MS : TICK_MS;
  }

  /** Whether a fast-forward (Z in real time) is running. */
  get fastForwarding(): boolean {
    return this.waiting !== null;
  }

  /** Real time: messages less than 2 rounds old draw bright (Spec 01, Addendum B); in turn mode, this round's. */
  private get brightRounds(): number {
    return this.realTime ? 2 : 1;
  }

  /** The main view's header: the level's name, then "Paused" while a real-time level's clock is stopped. */
  get header(): string {
    const game = this.game;
    return game && game.time === 'real' && !game.state.player.dead && !this.ticking ? `${this.title} - Paused` : this.title;
  }

  /**
   * Real time: let `ticks` ticks pass, one at a time (the frame loop calls this). After each the shell shows what
   * happened: the log, a level change or a list a held command opened, the pane, and the target followed. It stops as
   * soon as time stops (a pause, an overlay, death, a new level) and at the tick a fast-forward stops.
   */
  advance(ticks: number): void {
    for (let n = 0; n < ticks && this.ticking; n++) {
      const game = this.game!;
      const messages = game.advance(1);
      // When Z stops, the rest of the frame's ticks, counted at four times speed, are not run.
      const stopped = !!this.waiting?.stops(messages);
      if (stopped) this.waiting = null;
      this.say(messages);
      const carried = game.carried();
      if (carried) this.applyResult(carried);
      else this.afterAction();
      if (this.game !== game) break;
      this.followTarget();
      if (stopped) break;
    }
    if (!this.ticking) this.waiting = null;
  }

  /**
   * Real time: the targets are rebuilt at each tick (Spec 01, Addendum B). The selection stays on its creature while it
   * is still valid, or moves to the nearest valid target; with none left, targeting ends and the log says so.
   */
  private followTarget(): void {
    const t = this.targeting;
    if (!t || !this.retarget) return;
    if (!t.retarget(this.retarget())) {
      this.stopAiming();
      this.log.add({ kind: 'system', text: 'Your target is gone.' }, this.turn);
    }
    this.showTarget();
  }

  /**
   * Real time: a movement key comes up (Spec 01, Addendum B), so a walk in its direction stops. A step already held
   * still happens.
   */
  keyUp(e: KeyInput): void {
    const game = this.game;
    const dir = moveOf(e);
    if (!game?.walking || !dir) return;
    if (game.walking.dx === dir.dx && game.walking.dy === dir.dy) game.halt();
  }

  /**
   * Real time: the tab is hidden or the window loses focus, which pauses the game until P or a movement key resumes it
   * (Spec 01, Addendum B). Held keys are dropped and a fast-forward stops.
   */
  loseFocus(): void {
    const game = this.game;
    if (!game || game.time !== 'real' || game.state.player.dead) return;
    if (this.paused !== 'key') this.paused = 'focus';
    this.waiting = null;
    game.halt();
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
    this.retarget = null;
    this.paused = null;
    this.waiting = null;
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
      free: (index) => this.applyResult(this.order(() => this.game!.free(index))),
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
    return { offer: (index, what) => this.applyResult(this.order(() => this.game!.offerAt(index, what))) };
  }

  /** Handle a key press. Returns true if the key is in the key map, so the caller can stop the browser acting on it. */
  handleKey(e: KeyInput): boolean {
    const command = keyToCommand(e);
    if (!command) return false;
    if (this.realTime && this.clockKey(command)) return true;
    const top = this.overlays[this.overlays.length - 1];
    if (top) this.apply(top.handle(command), top);
    else this.play(command);
    // While the clock is stopped, held keys are dropped (Spec 01, Addendum B).
    if (this.realTime && !this.ticking) this.game?.halt();
    return true;
  }

  /**
   * Real time: the keys about the clock, before anything else (Spec 01, Addendum B). Any key stops a fast-forward and
   * does nothing more; P pauses and resumes, over an overlay too; while paused, a movement key resumes and does nothing
   * more. Returns true when the key is used up.
   */
  private clockKey(command: Command): boolean {
    if (this.waiting) {
      this.waiting = null;
      return true;
    }
    const game = this.game;
    if (!game) return false; // a village has no clock: P says so in play()
    if (command.type === 'pause') {
      this.paused = this.paused ? null : 'key';
      game.halt();
      return true;
    }
    const modal = this.overlays.length > 0 || this.targeting || this.cursor || this.looking;
    if (this.paused && command.type === 'move' && !modal) {
      this.paused = null;
      return true;
    }
    return false;
  }

  /**
   * Carry out something that may spend an action (Spec 04, Addendum B): at once in turn mode, as ever; in real time at
   * once when the cooldown has ended, or else held until it ends. A command held from an overlay closes the overlays,
   * so the clock runs on to the end of the cooldown.
   */
  private order(run: () => ActResult): ActResult {
    const result = this.game!.command(run) ?? { messages: [], spent: false };
    if (result.held) this.overlays.length = 0;
    return result;
  }

  /** A map command from the key map: a real-time step starts a walk; the rest are carried out at once or held. */
  private act(command: Command): ActResult | undefined {
    const game = this.game;
    if (!game) return undefined;
    if (game.time === 'turn') return game.act(command);
    if (command.type === 'move') return game.walk(command.dx, command.dy);
    return ACTIONS.includes(command.type) ? game.command(() => game.act(command)) : undefined;
  }

  /** Z in real time (Spec 01, Addendum B): run at four times speed until a die returns or something interrupts. */
  private fastForward(): void {
    const game = this.game!;
    const watch = WaitWatch.start(game);
    if (typeof watch === 'string') {
      this.log.add({ kind: 'system', text: watch }, this.turn);
      return;
    }
    this.waiting = watch;
    this.paused = null;
    game.halt();
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
        this.overlays.push(gameMenu(this.onQuit ?? undefined, this.menuHost, { current: () => this.display, toggle: () => this.toggleDisplay() }));
        return;
      case 'history':
        this.overlays.push(new HistoryOverlay(this.log, this.turn, this.brightRounds));
        return;
      case 'pause':
        // A real-time level takes P before this; a village has no clock in either mode (Spec 04, Addendum B).
        if (!this.run) break;
        this.log.add({ kind: 'system', text: this.realTime ? 'There is no clock to pause in a village.' : 'There is no clock to pause in turn-based play.' }, this.turn);
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
          if (this.game.time === 'real') this.fastForward();
          else this.applyResult(this.game.waitUntilRecovered());
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
        const result = this.act(command);
        if (result) {
          this.applyResult(result);
          return;
        }
      }
    }
    this.log.add({ kind: 'system', text: nothingToDo(command.type, this.run ? (this.game ? 'dungeon' : 'village') : 'none') }, this.turn);
  }

  /** The game menu's display row: switch between text and isometric, with no round spent (Spec 01, Addendum B). */
  /** Whether the main view is drawn as the isometric picture now: chosen, and not waiting on its art. */
  get iso(): boolean {
    return this.display === 'iso' && !this.artWaiting;
  }

  private toggleDisplay(): void {
    this.display = this.display === 'text' ? 'iso' : 'text';
    this.onDisplay?.(this.display);
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
        if (this.iso) {
          // The isometric view is not a rectangle of cells: the cursor goes wherever its cell is still on screen.
          const next = { x: cursor.at.x + command.dx, y: cursor.at.y + command.dy };
          if (isoOnScreen(next, game.state.map.player)) cursor.at = next;
          return;
        }
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
        if (g) this.done(this.order(() => g.equip(item)));
        else this.free((m) => equipItem(this.run!.ctx(), item, m));
      },
      unequip: (slot) => {
        const g = this.game;
        if (g) this.done(this.order(() => g.unequip(slot)));
        else this.free((m) => unequipSlot(this.run!.ctx(), slot, m));
      },
      drop: (item) => {
        const g = this.game;
        if (g) this.done(this.order(() => g.drop(item)));
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
        this.done(this.order(() => g.use(item)));
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
    // Smite is readied or cancelled with no round, so it is never held (Spec 03, Addendum A).
    this.applyResult(id === 'smite' ? game.useMajor() : this.order(() => game.useMajor()));
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
    this.retarget = () => (id === 'volley' ? volleyTargets(game) : id === 'fascinate' ? fascinateTargets(game) : markTargets(game));
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
    const game = this.game!;
    const selected = t.selected;
    if (id !== 'volley') return this.order(() => game.useMajor(selected));
    if (first) return this.order(() => game.useMajor([first, selected]));
    const rest = t.targets.filter((m) => m !== selected);
    if (rest.length === 0) return this.order(() => game.useMajor([selected]));
    this.aimingAbility = { id, first: selected };
    this.retarget = () => volleyTargets(game).filter((m) => m !== selected);
    this.targeting = new Targeting(game, t.spec, rest);
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
    this.applyResult(this.order(() => game.useAbility(id)));
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
    if (resolvesAtOnce(spell)) return this.finishCast(this.order(() => go()));
    const targets = spellTargets(game, spell);
    if (targets.length === 0) {
      this.log.add({ kind: 'system', text: 'There is no valid target.' }, this.turn);
      return;
    }
    this.casting = spell;
    this.usingItem = item;
    this.retarget = () => spellTargets(game, spell);
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
    this.retarget = null;
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
          const game = this.game!;
          this.stopAiming();
          this.applyResult(this.order(() => game.useMajor(at)));
          return;
        }
        const spell = this.casting!;
        const item = this.usingItem;
        const at = { ...cursor.at };
        const game = this.game!;
        this.stopAiming();
        this.finishCast(this.order(() => (item ? game.use(item, at) : game.cast(spell, at))));
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
    const range = option.range;
    this.retarget = () => validTargets(game, range);
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
        const game = this.game!;
        const target = t.selected;
        // Real time resolves against the target where it stands at the tick the action happens, if it is still valid then.
        const valid = this.realTime ? this.retarget : null;
        const shoot = (): ActResult => (item ? game.use(item, target) : spell ? game.cast(spell, target) : game.fire(target));
        const result = this.order(() => (!valid || valid().includes(target) ? shoot() : { messages: [{ kind: 'system', text: 'Your target is gone.' }], spent: false }));
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

  /**
   * The isometric picture of the level, when the display is isometric and a level is on screen (Spec 01b): its draws,
   * with whatever is being aimed or looked at, and dimmed while an overlay is open. Null in a village or the text display.
   */
  picture(): IsoPicture | null {
    const game = this.game;
    if (!game || !this.iso) return null;
    const aim = { targeting: this.targeting, cursor: this.cursor, look: this.looking };
    const look = mapLook(this.run?.theme);
    if (this.art) this.art.look = look;
    return { draws: buildIsoDraws(game.state, { look, aim, pack: this.art?.ids ?? null }), dimmed: this.overlays.length > 0 };
  }

  /** Draw the whole screen: panes, character, log, then any overlay on top. */
  draw(grid: Grid): void {
    drawPanes(grid, this.header);
    if (this.game) {
      const view = inner(MAIN_PANE);
      // The isometric picture is on the canvas beneath: the view area's cells are left clear (Spec 01b, Layout).
      if (this.iso) grid.see(view.x, view.y, view.w, view.h);
      else drawMap(grid, this.game.state, this.targeting, this.cursor ?? this.looking, mapLook(this.run?.theme));
      const text = this.lookText();
      if (text !== null) {
        grid.text(view.x, view.y + view.h - 1, text.slice(0, view.w).padEnd(view.w), UI.value, UI.background);
      }
    }
    else if (this.village) this.village.draw(grid);
    else grid.text(inner(MAIN_PANE).x + 2, inner(MAIN_PANE).y + 1, 'No level loaded.', UI.label, UI.background);
    drawCharacterPane(grid, this.character);
    drawLog(grid, this.log, this.turn, this.brightRounds);
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
