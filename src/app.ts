import { Music, type Mood } from './audio/music';
import { Audio } from './audio/sfx';
import { CONFIG, PRESETS, type QualityPreset } from './config';
import { GameLoop } from './core/loop';
import { freshSeed, hashCombine, hashString, Rng, seedFromString, STREAM } from './core/rng';
import type { Rarity } from './gen/loot';
import { offerCards, type CardDef, type UnlockPack } from './game/cards';
import type { ClassId } from './game/classes';
import { pickEvent, shopStock, type EventEffect, type ShopEntry } from './game/economy';
import { rollItem, type ItemDef } from './game/equipment';
import { CLASS_COST, canBuyStat, defaultMeta, recordRun, soulsFromRun, statBonusCost, type MetaSave } from './game/meta';
import { Player } from './game/player';
import { Run, type RunSave } from './game/run';
import type { Attr } from './game/stats';
import { World, type Interactable } from './game/world';
import { choosePreset, classifyGpu, detectDevice, getWebglRendererString, measureRefreshRate, uiScaleFor, type DeviceProfile } from './platform/device';
import { Input, type InputMethod, type UiAction } from './platform/input';
import { defaultSettings, type Settings } from './platform/settings';
import { RenderFx } from './render/fxSink';
import { PerfMonitor } from './render/perf';
import { GameRenderer } from './render/renderer';
import { dbDelete, dbGet, dbSet } from './save/db';
import { FLOOR_THEMES } from './theme';
import { h } from './ui/dom';
import { Hud } from './ui/hud';
import { NODE_NAME } from './ui/icons';
import { Nav } from './ui/nav';
import * as S from './ui/screens';

type State = 'boot' | 'title' | 'menu' | 'play' | 'modal' | 'over' | 'transition';

export class App {
  device!: DeviceProfile;
  settings!: Settings;
  meta!: MetaSave;
  preset: QualityPreset = 'high';
  autoPreset: QualityPreset = 'high';
  readonly renderer = new GameRenderer();
  readonly audio = new Audio();
  readonly music = new Music(this.audio);
  input!: Input;
  hud!: Hud;
  ui!: S.UI;
  readonly nav = new Nav();
  fx!: RenderFx;
  perf!: PerfMonitor;
  loop!: GameLoop;
  run: Run | null = null;
  player: Player | null = null;
  world: World | null = null;
  state: State = 'boot';
  private savedRun: RunSave | null = null;
  private rotate!: HTMLElement;
  private fade!: HTMLElement;
  private deathT = -1;
  private slowT = 0;
  private shopCache = new Map<number, ShopEntry[]>();
  private readonly tmp = new Float32Array(2);
  private params = new URLSearchParams(location.search);

  async boot(): Promise<void> {
    this.device = detectDevice();
    this.settings = { ...defaultSettings(this.device.formFactor === 'phone'), ...((await dbGet<Settings>('settings')) ?? {}) };
    this.meta = { ...defaultMeta(), ...((await dbGet<MetaSave>('meta')) ?? {}) };
    this.savedRun = (await dbGet<RunSave>('run')) ?? null;

    const gameEl = document.getElementById('game')!;
    const canvas = document.createElement('canvas');
    gameEl.appendChild(canvas);
    const glString = getWebglRendererString(document.createElement('canvas'));
    await this.renderer.init(canvas, 'high');
    this.device.refreshRateHz = await measureRefreshRate(30);
    const bench = this.benchmark();
    this.device.gpuTier = classifyGpu(glString, bench, this.renderer.isCanvas);
    this.autoPreset = choosePreset(this.device, this.renderer.isCanvas);
    const qp = this.params.get('quality') as QualityPreset | null;
    this.preset = qp && qp in PRESETS ? qp : this.settings.quality === 'auto' ? this.autoPreset : this.settings.quality;
    if (this.renderer.isCanvas) this.preset = 'low';

    this.input = new Input(gameEl, this.device.primaryInput);
    this.fx = new RenderFx(this.renderer, this.audio, this.input);
    const uiRoot = document.getElementById('ui')!;
    this.hud = new Hud(uiRoot, this.input);
    this.hud.setVisible(false);
    this.hud.onPause = () => this.openPause();
    this.hud.onMap = () => this.openMap();
    this.ui = new S.UI(uiRoot, this.nav, () => this.audio.play('ui_tap'));
    this.rotate = S.rotateOverlay();
    this.fade = h('div', { style: 'position:fixed;inset:0;background:#0b0610;opacity:0;pointer-events:none;transition:opacity .22s;z-index:30' });
    document.body.append(this.rotate, this.fade);

    this.input.onMethodChange = (m) => this.onMethodChange(m);
    this.input.onUi = (a) => this.onUi(a);
    this.hud.setMethod(this.input.method);
    this.nav.setShowFocus(this.input.method === 'gamepad');

    this.perf = new PerfMonitor(
      this.targetFps(),
      PRESETS[this.preset].renderScale,
      () => this.resize(),
      (p) => {
        this.applyPreset(p);
        this.hud.toast(`Quality lowered to ${p.toUpperCase()} to keep things smooth`);
      },
      this.preset,
      this.settings.quality === 'auto',
    );
    this.applySettings();
    this.applyPreset(this.preset);

    this.loop = new GameLoop({ update: (dt) => this.update(dt), render: (a, fdt) => this.render(a, fdt) });
    this.loop.simulate = false;
    this.loop.maxFps = this.targetFps();
    this.loop.start();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 150));
    window.visualViewport?.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => this.onVisibility());
    window.addEventListener('pagehide', () => this.saveRun());
    this.resize();

    if (this.params.get('debug')) (window as unknown as { __ck: App }).__ck = this;
    const auto = this.params.get('autostart') as ClassId | null;
    if (auto) {
      this.state = 'menu';
      const seed = this.params.get('seed');
      this.startRun(auto, seed ? (seedFromString(seed) ?? 1) : freshSeed(), 0, false);
    } else this.showTitle();
  }

  /** Short GPU benchmark: draw a heavy particle field and time it with gl.finish(). */
  private benchmark(): number {
    const r = this.renderer;
    if (r.isCanvas) return 30;
    const gl = (r.app.renderer as unknown as { gl?: WebGL2RenderingContext }).gl;
    r.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, 1);
    for (let i = 0; i < 3000; i++) r.addPool.spawn(Math.random() * 900, Math.random() * 500, 0, 0, 5, 30, 30, 0xffffff, 0, 0, 0, 0.3);
    r.addPool.update(0);
    r.app.renderer.render(r.app.stage);
    gl?.finish();
    const t0 = performance.now();
    for (let k = 0; k < 6; k++) r.app.renderer.render(r.app.stage);
    gl?.finish();
    const ms = (performance.now() - t0) / 6;
    r.addPool.clear();
    r.addPool.update(0);
    return ms;
  }

  // ── Settings / quality ────────────────────────────────────────────────────

  private targetFps(): number {
    const p = PRESETS[this.preset];
    let fps = p.targetFps || this.device.refreshRateHz;
    if (this.settings.batterySaver) fps = Math.min(fps, 60);
    return Math.min(fps, this.device.refreshRateHz || fps);
  }

  applyPreset(p: QualityPreset): void {
    this.preset = p;
    this.renderer.setPreset(p);
    this.perf?.reset(this.targetFps(), PRESETS[p].renderScale, p, this.settings.quality === 'auto');
    if (this.loop) this.loop.maxFps = this.targetFps();
    if (this.world) this.world.enemyCap = CONFIG.enemyCap[p];
    this.resize();
  }

  applySettings(): void {
    const s = this.settings;
    this.audio.volumes = { master: s.volMaster, sfx: s.volSfx, music: s.volMusic };
    this.audio.applyVolumes();
    this.renderer.shakeEnabled = s.screenShake;
    this.fx.haptics = s.haptics;
    this.input.vibrationEnabled = s.haptics;
    this.input.autoAim = s.autoAim;
    this.input.aimAssist = s.aimAssist;
    this.input.leftHanded = s.leftHanded;
    this.hud.setStickStyle(s.stickSize, s.stickOpacity);
    this.hud.layoutTouch(s.leftHanded);
    this.hud.setFpsVisible(s.showFps);
    document.documentElement.style.fontSize = `${16 * uiScaleFor(s.uiScaleAdj)}px`;
    if (this.loop) this.loop.maxFps = this.targetFps();
  }

  private onSettingsChanged = (s: Settings): void => {
    const prevQ = this.preset;
    this.settings = s;
    this.applySettings();
    const want = s.quality === 'auto' ? this.autoPreset : s.quality;
    if (want !== prevQ && !this.renderer.isCanvas) this.applyPreset(want);
    void dbSet('settings', s);
  };

  private settingsPanel = (): HTMLElement => S.settingsPanel(this.settings, this.onSettingsChanged, () => this.toggleFullscreen());

  private toggleFullscreen(): void {
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement || d.webkitFullscreenElement) {
      (document.exitFullscreen?.() ?? d.webkitExitFullscreen?.())?.catch?.(() => {});
    } else {
      const p = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.();
      (p as Promise<void> | undefined)?.then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {})).catch?.(() => {});
    }
  }

  resize(): void {
    const w = window.visualViewport?.width ?? window.innerWidth;
    const hgt = window.visualViewport?.height ?? window.innerHeight;
    const scale = (this.perf?.scale ?? PRESETS[this.preset].renderScale);
    this.renderer.resize(Math.round(w), Math.round(hgt), window.devicePixelRatio || 1, scale);
    document.documentElement.style.fontSize = `${16 * uiScaleFor(this.settings?.uiScaleAdj ?? 0)}px`;
    const portraitPhone = this.device?.formFactor === 'phone' && hgt > w;
    this.rotate?.classList.toggle('hidden', !portraitPhone);
    if (portraitPhone && this.state === 'play') this.openPause();
  }

  private onVisibility(): void {
    if (document.hidden) {
      if (this.state === 'play') this.openPause();
      this.saveRun();
      this.audio.suspend();
      this.loop.stop();
    } else {
      this.audio.resume();
      this.loop.start();
    }
  }

  private onMethodChange(m: InputMethod): void {
    this.hud.setMethod(m);
    this.nav.setShowFocus(m === 'gamepad');
    if (m === 'touch') this.input.releaseAll();
  }

  private onUi(a: UiAction): boolean {
    if (this.ui.isOpen) {
      if (a === 'map' && this.state === 'modal') return this.nav.handle('back');
      return this.nav.handle(a);
    }
    if (this.state !== 'play') return false;
    if (a === 'pause') this.openPause();
    else if (a === 'map') this.openMap();
    return true;
  }

  // ── Menus ─────────────────────────────────────────────────────────────────

  private showTitle(): void {
    this.state = 'title';
    this.hud.setVisible(false);
    this.input.menuOpen = true;
    this.ui.open(
      S.titleScreen(() => {
        this.audio.unlock();
        this.music.setMood('title');
        this.showMenu();
      }),
    );
  }

  private showMenu(): void {
    this.state = 'menu';
    this.loop.simulate = false;
    this.hud.setVisible(false);
    this.input.menuOpen = true;
    this.music.setMood('title');
    this.ui.open(
      S.mainMenu({
        hasSave: !!this.savedRun,
        meta: this.meta,
        onContinue: () => this.continueRun(),
        onNew: () => this.showClassSelect(freshSeed(), false),
        onDaily: () => {
          const d = new Date();
          const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
          this.showClassSelect(hashString('daily:' + key), true);
        },
        onSeed: () =>
          this.ui.open(
            S.seedScreen(
              (s) => this.showClassSelect(seedFromString(s) ?? hashString(s), false),
              () => this.showMenu(),
            ),
            () => this.showMenu(),
          ),
        onUnlocks: () => this.showUnlocks(),
        onSettings: () => this.ui.open(S.settingsScreen(this.settingsPanel(), () => this.showMenu()), () => this.showMenu()),
      }),
    );
  }

  private showClassSelect(seed: number, daily: boolean): void {
    this.ui.open(
      S.classSelect(
        this.meta,
        (c) => this.renderer.portrait(c, 140),
        (c) => this.startRun(c, seed, 0, daily),
        () => this.showMenu(),
      ),
      () => this.showMenu(),
    );
  }

  private showUnlocks(): void {
    this.ui.open(
      S.unlocksScreen(
        this.meta,
        (kind, id) => {
          const m = this.meta;
          if (kind === 'class') {
            const c = id as ClassId;
            if (m.souls >= CLASS_COST[c] && !m.classes.includes(c)) {
              m.souls -= CLASS_COST[c];
              m.classes.push(c);
            }
          } else if (kind === 'pack') {
            const pk = id as UnlockPack;
            const cost = { holy: 90, blood: 90, reaper: 160 }[pk];
            if (m.souls >= cost && !m.packs.includes(pk)) {
              m.souls -= cost;
              m.packs.push(pk);
            }
          } else {
            const a = id as Attr;
            if (canBuyStat(m, a)) {
              m.souls -= statBonusCost(m.statBonus[a]);
              m.statBonus[a]++;
            }
          }
          this.audio.play('coin');
          void dbSet('meta', m);
          this.showUnlocks();
        },
        () => this.showMenu(),
      ),
      () => this.showMenu(),
    );
  }

  // ── Run lifecycle ─────────────────────────────────────────────────────────

  startRun(cls: ClassId, seed: number, attempt: number, daily: boolean): void {
    this.run = new Run(seed, attempt, daily);
    this.run.enterFloor(0);
    const p = new Player(cls);
    p.metaAttrs = { ...this.meta.statBonus };
    p.recompute();
    p.hp = p.stats.maxHp;
    p.energy = p.stats.maxEnergy;
    this.player = p;
    this.world = new World(this.fx, p, CONFIG.enemyCap[this.preset]);
    this.shopCache.clear();
    this.hud.setClass(cls);
    this.enterRoom(false);
    this.hud.banner(FLOOR_THEMES[0].name, FLOOR_THEMES[0].subtitle);
  }

  private continueRun(): void {
    const s = this.savedRun;
    if (!s) return;
    this.run = Run.fromSave(s);
    this.player = Player.fromSave(s.player, this.meta.statBonus);
    this.world = new World(this.fx, this.player, CONFIG.enemyCap[this.preset]);
    this.hud.setClass(this.player.cls.id);
    this.enterRoom(s.roomCleared);
  }

  private enterRoom(cleared: boolean): void {
    const run = this.run!;
    const w = this.world!;
    const room = run.currentRoom();
    w.loadRoom(room, run.floor, cleared);
    this.renderer.enterRoom(w, run.graph);
    this.hud.buildMinimap(w);
    this.hud.setRoomLabel(`Floor ${run.floor + 1} · ${NODE_NAME[room.kind]} ${run.roomNumber}/${run.roomsOnFloor}`);
    const firstRoom = run.floor === 0 && room.kind === 'start';
    this.hud.showHints(firstRoom);
    if (firstRoom) {
      const node = run.nodeId;
      setTimeout(() => this.run === run && run.nodeId === node && this.hud.showHints(false), 15000);
    }
    this.hud.setVisible(true);
    this.ui.close();
    this.input.menuOpen = false;
    this.state = 'play';
    this.loop.simulate = true;
    this.loop.timeScale = 1;
    this.deathT = -1;
    this.setMoodForRoom();
    if (room.kind === 'shop') this.hud.toast('A merchant hums by his lantern...');
    else if (room.kind === 'rest') this.hud.toast('A sanctuary. The fire is warm.');
    else if (room.kind === 'event') this.hud.toast('Something strange lies ahead...');
    else if (room.kind === 'elite') this.hud.toast('An elite foe guards this hall!');
    this.saveRun();
  }

  private setMoodForRoom(): void {
    const w = this.world!;
    const kind = w.room.kind;
    let mood: Mood = 'explore';
    if (kind === 'boss' && !w.cleared) mood = 'boss';
    else if (!w.cleared && (kind === 'combat' || kind === 'elite')) mood = 'battle';
    else if (kind === 'rest' || kind === 'shop') mood = 'calm';
    this.music.setMood(mood, this.run!.floor);
  }

  private saveRun(): void {
    if (!this.run || !this.player || !this.world || !this.player.alive) return;
    const s = this.run.toSave(this.player.toSave(), this.world.cleared);
    this.savedRun = s;
    void dbSet('run', s);
  }

  private endRun(victory: boolean): void {
    const run = this.run!;
    const p = this.player!;
    this.state = 'over';
    this.loop.simulate = false;
    this.input.menuOpen = true;
    const souls = soulsFromRun(p.scrap, run.floor, victory);
    recordRun(this.meta, { seed: run.runSeed, attempt: run.attempt, cls: p.cls.id, result: victory ? 'victory' : 'defeat', floor: run.floor, date: Date.now() }, souls);
    void dbSet('meta', this.meta);
    void dbDelete('run');
    this.savedRun = null;
    this.music.setMood(victory ? 'calm' : 'title');
    this.hud.setVisible(false);
    const cls = p.cls.id;
    this.ui.open(
      S.endScreen(
        { victory, cls, level: p.level, floor: run.floor, rooms: p.roomsCleared, kills: p.kills, damage: p.damageDealt, time: run.elapsed, souls, seed: run.seedLabel },
        () => this.startRun(cls, run.runSeed, run.attempt + 1, run.daily),
        () => this.showClassSelect(freshSeed(), false),
        () => this.showMenu(),
      ),
    );
  }

  // ── Loop hooks ────────────────────────────────────────────────────────────

  private toWorld = (sx: number, sy: number, out: Float32Array): void => {
    const wc = this.renderer.world;
    out[0] = (sx - wc.position.x) / wc.scale.x;
    out[1] = (sy - wc.position.y) / wc.scale.y;
  };

  private update(dt: number): void {
    const w = this.world;
    if (!w || this.state !== 'play') return;
    const p = this.player!;
    const intent = this.input.sample(p.x, p.y, this.toWorld, this.tmp);
    w.update(dt, intent);
    this.input.consumeEdges();
    this.run!.elapsed += dt;
    if (w.events.length) this.handleEvents();
    if (this.deathT >= 0) {
      this.deathT -= dt / Math.max(0.05, this.loop.timeScale);
      if (this.deathT < 0) this.endRun(false);
    }
    if (this.slowT > 0) {
      this.slowT -= dt / Math.max(0.05, this.loop.timeScale);
      if (this.slowT <= 0) this.loop.timeScale = 1;
    }
  }

  private render(alpha: number, frameDt: number): void {
    this.input.pollGamepad(frameDt);
    const w = this.world;
    if (w) {
      this.fx.listenerX = w.player.x;
      this.renderer.render(w, alpha, frameDt, this.loop.simulate);
      this.hud.update(w, frameDt, w.player.cls.ability.cost);
    } else {
      this.renderer.app.renderer.render(this.renderer.app.stage);
    }
    this.music.tick();
    this.perf.frame(frameDt);
    if (this.settings.showFps) {
      this.hud.setFps(`${Math.round(this.perf.fps)} fps · ${this.preset} · res ${this.renderer.resolution.toFixed(2)} · ${this.input.method}`);
    }
  }

  // ── World events ──────────────────────────────────────────────────────────

  private handleEvents(): void {
    const w = this.world!;
    const events = w.events.splice(0);
    for (const e of events) {
      switch (e.type) {
        case 'levelup':
          this.hud.toast(`Level ${this.player!.level}!`);
          break;
        case 'cleared':
          this.hud.toast('Room cleared! The doors unseal.');
          this.setMoodForRoom();
          this.saveRun();
          void dbSet('meta', this.meta);
          break;
        case 'died':
          this.deathT = 1.6;
          this.loop.timeScale = 0.35;
          void dbDelete('run');
          break;
        case 'bossSpawned':
          this.hud.banner(e.name, 'BOSS');
          this.audio.play('boss_roar');
          break;
        case 'bossDefeated':
          this.hud.banner('BOSS DEFEATED!', e.name);
          w.spawnBossRewards();
          this.loop.timeScale = 0.3;
          this.slowT = 1.2;
          this.setMoodForRoom();
          this.saveRun();
          break;
        case 'interact':
          this.onInteract(w.interactables[e.index]);
          break;
        case 'exit':
          this.transitionTo(e.target);
          break;
      }
    }
    // Level-up choice pauses the game (after the tick's other events).
    if (this.state === 'play' && this.player!.pendingLevelUps > 0 && this.player!.alive) this.openLevelUp();
  }

  private transitionTo(target: number): void {
    this.state = 'transition';
    this.loop.simulate = false;
    this.fade.style.opacity = '1';
    setTimeout(() => {
      this.run!.moveTo(target);
      this.enterRoom(false);
      this.fade.style.opacity = '0';
    }, 240);
  }

  private openModal(el: HTMLElement, onBack: (() => void) | null = null): void {
    this.state = 'modal';
    this.loop.simulate = false;
    this.input.menuOpen = true;
    this.input.releaseAll();
    this.ui.open(el, onBack);
  }

  private resume = (): void => {
    this.ui.close();
    this.input.menuOpen = false;
    this.input.releaseAll();
    this.state = 'play';
    this.loop.simulate = true;
    if (this.player!.pendingLevelUps > 0) this.openLevelUp();
  };

  openPause(tab = 'character'): void {
    if (this.state !== 'play' || !this.run) return;
    this.saveRun();
    const run = this.run;
    const show = (t: string) =>
      this.openModal(
        S.pauseScreen(
          {
            player: this.player!,
            seed: run.seedLabel,
            graph: run.graph,
            current: run.nodeId,
            visited: run.visited,
            floorName: `Floor ${run.floor + 1}: ${FLOOR_THEMES[run.floor].name}`,
            settings: this.settingsPanel,
            onResume: this.resume,
            onAbandon: () =>
              this.ui.open(
                S.confirmScreen(
                  'Abandon this run?',
                  'Abandon',
                  () => {
                    this.player!.alive = false;
                    this.endRun(false);
                  },
                  () => {
                    this.state = 'play';
                    show(t);
                  },
                ),
              ),
            onChange: () => this.saveRun(),
          },
          t,
        ),
        this.resume,
      );
    show(tab);
  }

  openMap(): void {
    if (this.state !== 'play' || !this.run) return;
    const run = this.run;
    this.openModal(S.mapScreen(run.graph, run.nodeId, run.visited, `Floor ${run.floor + 1}: ${FLOOR_THEMES[run.floor].name}`, this.resume), this.resume);
  }

  private cardRng(salt: number): Rng {
    const run = this.run!;
    return new Rng(hashCombine(run.runSeed, run.attempt, run.floor, this.player!.level, this.player!.cards.size, salt, STREAM.cards));
  }

  private packs(): Set<UnlockPack> {
    return new Set(this.meta.packs);
  }

  private openLevelUp(): void {
    const p = this.player!;
    const offers = offerCards(this.cardRng(p.pendingLevelUps), p.cards, this.packs());
    this.openModal(
      S.levelUpScreen(p, offers, (c) => {
        p.addCard(c.id);
        p.pendingLevelUps--;
        this.audio.play('card_pick');
        this.hud.toast(`${c.name} acquired`);
        if (p.pendingLevelUps > 0) this.openLevelUp();
        else if (p.statPoints > 0) this.openStats();
        else this.resume();
      }, `LEVEL ${p.level}!`, `Choose 1 of 3 upgrades · +${CONFIG.statPointsPerLevel} stat points`),
    );
  }

  private openStats(): void {
    const p = this.player!;
    const panel = S.statPanel(p, () => this.saveRun(), () => this.resume());
    this.openModal(h('div', { class: 'screen' }, h('h2', { class: 'ol' }, 'Allocate stats'), h('div', { class: 'sub' }, 'Spend now or later from the pause menu'), panel), this.resume);
  }

  private cardChoice(rarity: Rarity, title: string, sub: string): void {
    const p = this.player!;
    const offers = offerCards(this.cardRng(77), p.cards, this.packs(), 3, rarity);
    this.openModal(
      S.levelUpScreen(p, offers, (c: CardDef) => {
        p.addCard(c.id);
        this.audio.play('card_pick');
        this.resume();
      }, title, sub),
    );
  }

  private onInteract(it: Interactable): void {
    const p = this.player!;
    const w = this.world!;
    switch (it.kind) {
      case 'chest': {
        if (it.used) return;
        it.used = true;
        this.audio.play('chest_open');
        this.fx.burst(it.x, it.y - 16, 0xffd76a, 30, 260, 5, 0.8, 'star');
        if (it.roll < 0.55) {
          const rng = new Rng(hashCombine(w.room.seed, Math.floor(it.roll * 1e6)));
          this.offerItem(rollItem(rng, it.rarity));
        } else this.cardChoice(it.rarity, 'TREASURE!', `A ${it.rarity} relic glimmers inside`);
        break;
      }
      case 'shrine':
        if (it.used) return;
        this.openModal(
          S.choiceScreen('Blood Shrine', 'A weeping statue offers a gift for a sip of your blood.', 'drop', [
            {
              label: 'Offer blood (−20% HP)',
              detail: 'Choose a rare upgrade card',
              onPick: () => {
                it.used = true;
                p.hp = Math.max(1, p.hp - p.stats.maxHp * 0.2);
                this.cardChoice('rare', 'BLOOD PACT', 'The shrine accepts your offering');
              },
            },
            { label: 'Leave', detail: 'Keep your blood', onPick: this.resume },
          ]),
          this.resume,
        );
        break;
      case 'merchant': {
        const seed = w.room.seed;
        if (!this.shopCache.has(seed)) this.shopCache.set(seed, shopStock(seed, this.run!.floor, p.cards, this.packs()));
        const stock = this.shopCache.get(seed)!;
        const show = () =>
          this.openModal(
            S.shopScreen(p, stock, (e) => {
              if (p.scrap < e.price || e.sold) return;
              p.scrap -= e.price;
              e.sold = true;
              this.audio.play('coin');
              if (e.kind === 'card') {
                p.addCard(e.card.id);
                this.hud.toast(`${e.card.name} acquired`);
              } else if (e.kind === 'item') {
                this.offerItem(e.item, show);
                return;
              } else if (e.kind === 'potion') {
                p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.4);
                this.audio.play('heal');
              } else p.statPoints++;
              show();
            }, this.resume),
            this.resume,
          );
        show();
        break;
      }
      case 'anvil': {
        const show = () =>
          this.openModal(
            S.forgeScreen(p, (slot) => {
              const item = p.equipment[slot]!;
              const cost = Math.floor(CONFIG.upgradeCostBase * Math.pow(CONFIG.upgradeCostGrowth, item.level - 1));
              if (p.scrap < cost) return;
              p.scrap -= cost;
              item.level++;
              p.recompute();
              this.audio.play('chest_open');
              this.fx.burst(it.x, it.y - 20, 0xffc23d, 24, 220, 4, 0.6, 'spark');
              show();
            }, this.resume),
            this.resume,
          );
        show();
        break;
      }
      case 'campfire':
        if (it.used) return;
        this.openModal(
          S.choiceScreen('Sanctuary Fire', 'Warm light pushes back the dark. You could rest here a while.', 'campfire', [
            {
              label: `Rest (+${Math.round(CONFIG.restHealFraction * 100)}% HP)`,
              detail: 'The fire burns low afterwards',
              onPick: () => {
                it.used = true;
                p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * CONFIG.restHealFraction);
                this.audio.play('heal');
                this.fx.burst(p.x, p.y, 0x3ddc84, 30, 160, 5, 0.8, 'glow');
                this.resume();
              },
            },
            { label: 'Not yet', detail: 'Use the forge first, perhaps', onPick: this.resume },
          ]),
          this.resume,
        );
        break;
      case 'altar': {
        if (it.used) return;
        const ev = pickEvent(w.room.seed);
        this.openModal(
          S.eventScreen(
            ev,
            (cost) => p.scrap >= cost,
            (i) => {
              it.used = true;
              this.applyEvent(ev.choices[i].effect);
            },
          ),
          this.resume,
        );
        break;
      }
      case 'portal':
        this.nextFloor();
        break;
    }
  }

  private offerItem(item: ItemDef, after: () => void = this.resume): void {
    const p = this.player!;
    const salvage = { common: 8, uncommon: 14, rare: 24, epic: 40 }[item.rarity];
    this.openModal(
      S.itemFoundScreen(
        item,
        p.equipment[item.slot],
        () => {
          const old = p.equipment[item.slot];
          // Keep forge progress when swapping: new item inherits half the levels.
          const level = old ? Math.max(1, Math.ceil(old.level / 2)) : 1;
          p.equipment[item.slot] = { id: item.id, level };
          p.recompute();
          this.audio.play('card_pick');
          this.hud.toast(`Equipped ${item.name}`);
          after();
        },
        () => {
          p.scrap += salvage;
          this.audio.play('coin');
          after();
        },
        salvage,
      ),
    );
  }

  private applyEvent(e: EventEffect): void {
    const p = this.player!;
    const rng = this.cardRng(91);
    switch (e.type) {
      case 'hpCostCard':
        p.hp = Math.max(1, p.hp - p.stats.maxHp * e.hpPct);
        this.cardChoice(e.rarity, 'BLOOD PACT', 'Power, paid in blood');
        return;
      case 'scrapHeal':
        p.scrap -= e.cost;
        p.hp = p.stats.maxHp;
        this.audio.play('heal');
        break;
      case 'gamble':
        p.scrap -= e.cost;
        if (rng.chance(0.5)) {
          p.scrap += e.cost * 2;
          this.hud.toast(`The skull cackles: +${e.cost * 2} gems!`);
          this.audio.play('coin');
        } else this.hud.toast('The skull swallows your gems...');
        break;
      case 'vision':
        this.cardChoice('common', 'A VISION', 'The skull shows you three futures');
        return;
      case 'cursedItem': {
        const it = rollItem(rng, e.rarity);
        p.metaAttrs.vit -= Math.ceil(e.hp / CONFIG.perPoint.vitHp);
        p.recompute();
        this.offerItem(it);
        return;
      }
      case 'statPoints':
        p.statPoints += e.amount;
        this.hud.toast(`+${e.amount} stat points`);
        break;
      case 'xp': {
        const lv = p.gainXp(e.amount);
        if (lv > 0) {
          p.statPoints += lv * CONFIG.statPointsPerLevel;
          p.pendingLevelUps += lv;
        }
        break;
      }
      case 'healPct':
        p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * e.pct);
        this.audio.play('heal');
        break;
      case 'card':
        p.addCard(e.id);
        this.hud.toast('Card acquired');
        break;
      case 'leave':
        break;
    }
    this.resume();
  }

  private nextFloor(): void {
    const run = this.run!;
    if (run.isFinalFloor) {
      this.endRun(true);
      return;
    }
    this.state = 'transition';
    this.loop.simulate = false;
    this.fade.style.opacity = '1';
    setTimeout(() => {
      run.enterFloor(run.floor + 1);
      this.player!.hp = Math.min(this.player!.stats.maxHp, this.player!.hp + this.player!.stats.maxHp * 0.25);
      this.enterRoom(false);
      const t = FLOOR_THEMES[run.floor];
      this.hud.banner(t.name, t.subtitle);
      this.fade.style.opacity = '0';
    }, 400);
  }
}

