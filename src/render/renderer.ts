import {
  Application,
  BitmapFont,
  BitmapText,
  BlurFilter,
  Container,
  Graphics,
  GraphicsContext,
  Particle,
  ParticleContainer,
  Sprite,
  Texture,
} from 'pixi.js';
import { CONFIG, PRESETS, type PresetSpec, type QualityPreset } from '../config';
import { TAU, damp } from '../core/math';
import type { FloorGraph } from '../gen/graph';
import type { ClassId } from '../game/classes';
import { ENEMY_DEFS } from '../game/enemyDefs';
import type { ParticleKind } from '../game/fx';
import { orbitRadius } from '../game/playerCombat';
import { HAZ, PROJ } from '../game/stores';
import type { World } from '../game/world';
import { FLOOR_THEMES, THEME } from '../theme';
import { FRAME, ParticlePool, buildParticleAtlas, isAdditive } from './particles';
import { RoomView } from './roomView';
import { PROJ_GLOW, ShapeCache } from './shapes';

const T = CONFIG.tile;
/** Characters are drawn a touch larger than their hitboxes for the chunky cartoon look. */
const VIS = 1.15;
export const FONT = 'CK-Display';

interface EnemyView {
  root: Container;
  shadow: Graphics;
  aura: Graphics;
  bodyWrap: Container;
  body: Graphics;
  flash: Graphics;
  extraA: Graphics | null; // wing / club / runes
  extraB: Graphics | null; // second wing / cracks
  hp: Container;
  hpFill: Graphics;
  def: number;
}

interface FloatText {
  t: BitmapText;
  life: number;
  vy: number;
  big: boolean;
}

interface Bolt {
  g: Graphics;
  life: number;
}

/** Visual height of each enemy (feet to top), used to place health bars. */
const ENEMY_HEIGHT: Record<string, number> = { bat: 46, skeleton: 52, ghoul: 48, archer: 54, witch: 76, knight: 68, gargoyle: 58, ogre: 175, golem: 175, count: 110 };

const BAR = new GraphicsContext().roundRect(-16, 0, 32, 6, 3).fill({ color: THEME.ink }).roundRect(-15, 1, 30, 4, 2).fill({ color: 0x3a2030 });
const BAR_FILL = new GraphicsContext().roundRect(0, 0, 30, 4, 2).fill({ color: 0xffffff });

/** Small additive batch rebuilt every frame (projectile & pickup halos). */
class GlowBatch {
  readonly container: ParticleContainer;
  private proxies: Particle[] = [];
  private n = 0;
  constructor(tex: Texture, cap: number) {
    this.container = new ParticleContainer({ dynamicProperties: { position: true, vertex: true, color: true, rotation: false, uvs: false }, texture: tex });
    this.container.blendMode = 'add';
    for (let i = 0; i < cap; i++) this.proxies.push(new Particle({ texture: tex, anchorX: 0.5, anchorY: 0.5 }));
  }
  begin(): void {
    this.n = 0;
  }
  add(x: number, y: number, size: number, tint: number, alpha: number): void {
    if (this.n >= this.proxies.length) return;
    const p = this.proxies[this.n];
    p.x = x;
    p.y = y;
    p.scaleX = p.scaleY = size / 32;
    p.tint = tint;
    p.alpha = alpha;
    this.container.particleChildren[this.n++] = p;
  }
  end(): void {
    this.container.particleChildren.length = this.n;
    this.container.update();
  }
}

export class GameRenderer {
  readonly app = new Application();
  shapes!: ShapeCache;
  frames!: Texture[];
  readonly world = new Container();
  private readonly roomLayer = new Container();
  private readonly groundLayer = new Container();
  private readonly pickupLayer = new Container();
  private readonly actorLayer = new Container();
  private readonly projLayer = new Container();
  private readonly fxNormalLayer = new Container();
  private readonly fxAddLayer = new Container();
  private readonly lightLayer = new Container();
  private readonly textLayer = new Container();
  private readonly screen = new Container();
  private vignette!: Sprite;
  private flashRect = new Graphics();
  private flashAlpha = 0;
  private flashColor = 0xffffff;

  addPool!: ParticlePool;
  normPool!: ParticlePool;
  private glow!: GlowBatch;
  private bloomBatch: GlowBatch | null = null;
  private bloomLayer = new Container();

  private roomView: RoomView | null = null;
  private enemyViews: (EnemyView | undefined)[] = [];
  private projViews: (Graphics | undefined)[] = [];
  private projKind: Int16Array = new Int16Array(1024).fill(-1);
  private pickupViews: (Graphics | undefined)[] = [];
  private hazardViews: (Container | undefined)[] = [];
  private hazardCtx: Record<string, GraphicsContext> = {};
  private interactViews: Container[] = [];
  private playerView!: Container;
  private playerBodyWrap!: Container;
  private playerBody!: Graphics;
  private playerFlash!: Graphics;
  private playerWeapon!: Graphics;
  private playerRing: Container | null = null;
  private playerShadow!: Graphics;
  private playerCls: ClassId | null = null;
  private familiars: Graphics[] = [];
  private scythes: Graphics[] = [];
  private prompt!: Graphics;
  private texts: FloatText[] = [];
  private bolts: Bolt[] = [];

  // Camera
  camX = 0;
  camY = 0;
  zoom = 1;
  private shakeAmt = 0;
  shakeEnabled = true;
  private lookX = 0;
  private lookY = 0;
  cssW = 1;
  cssH = 1;
  renderScale = 1;
  preset: PresetSpec = PRESETS.high;
  isCanvas = false;
  private time = 0;

  async init(canvas: HTMLCanvasElement, preset: QualityPreset): Promise<void> {
    this.preset = PRESETS[preset];
    await this.app.init({
      canvas,
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: preset !== 'low',
      autoDensity: true,
      resolution: 1,
      background: THEME['bg.deep'],
      preference: ['webgl', 'webgpu', 'canvas'],
      powerPreference: 'high-performance',
      autoStart: false,
      sharedTicker: false,
    });
    this.app.ticker?.stop();
    this.isCanvas = this.app.renderer.name === 'canvas';
    this.shapes = new ShapeCache(T);
    this.frames = buildParticleAtlas(this.app.renderer);
    const glowTex = this.frames[FRAME.glow];

    this.addPool = new ParticlePool(this.frames, PRESETS.ultra.maxParticles * 0.7, true);
    this.normPool = new ParticlePool(this.frames, PRESETS.ultra.maxParticles * 0.3, false);
    this.glow = new GlowBatch(glowTex, 1600);
    this.fxNormalLayer.addChild(this.normPool.container);
    this.fxAddLayer.addChild(this.glow.container, this.addPool.container);
    this.fxAddLayer.blendMode = 'add';
    this.lightLayer.blendMode = 'add';
    this.actorLayer.sortableChildren = true;

    BitmapFont.install({
      name: FONT,
      style: {
        fontFamily: "'Arial Black', 'Segoe UI Black', 'Helvetica Neue', Impact, system-ui, sans-serif",
        fontSize: 40,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: THEME.ink, width: 8, join: 'round' },
      },
      chars: [[' ', '~']],
      resolution: 2,
      padding: 6,
    });

    this.world.addChild(
      this.roomLayer,
      this.groundLayer,
      this.pickupLayer,
      this.actorLayer,
      this.fxNormalLayer,
      this.projLayer,
      this.lightLayer,
      this.bloomLayer,
      this.fxAddLayer,
      this.textLayer,
    );
    this.app.stage.addChild(this.world, this.screen);

    // Vignette (runtime gradient, no image file).
    const vc = document.createElement('canvas');
    vc.width = vc.height = 256;
    const g2 = vc.getContext('2d')!;
    const grad = g2.createRadialGradient(128, 128, 60, 128, 128, 182);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.7, 'rgba(10,4,16,0.35)');
    grad.addColorStop(1, 'rgba(6,2,10,0.85)');
    g2.fillStyle = grad;
    g2.fillRect(0, 0, 256, 256);
    this.vignette = new Sprite(Texture.from(vc));
    this.screen.addChild(this.vignette, this.flashRect);

    // Hazard contexts.
    // Built at radius 100 (smooth tessellation) and scaled by radius/100 at draw time.
    const R = 100;
    this.hazardCtx = {
      tele: new GraphicsContext().circle(0, 0, R).fill({ color: 0xff3b2a, alpha: 0.18 }).circle(0, 0, R).stroke({ color: 0xff6a3a, width: 5, alpha: 0.9 }),
      teleFill: new GraphicsContext().circle(0, 0, R).fill({ color: 0xff8a2a, alpha: 0.35 }),
      fire: new GraphicsContext().circle(0, 0, R).fill({ color: 0x3a8cff, alpha: 0.28 }).circle(0, 0, R * 0.7).fill({ color: 0x9fe0ff, alpha: 0.25 }),
      trail: new GraphicsContext().circle(0, 0, R).fill({ color: 0xa8c8ff, alpha: 0.25 }),
      well: new GraphicsContext().circle(0, 0, R).fill({ color: 0x2a0a4a, alpha: 0.55 }).circle(0, 0, R).stroke({ color: 0xb05cff, width: 4 }).circle(0, 0, R * 0.25).fill({ color: 0x000000 }),
      spawn: new GraphicsContext().circle(0, 0, R).stroke({ color: 0xff4f6e, width: 12 }).circle(0, 0, R * 0.6).fill({ color: 0xb3123a, alpha: 0.35 }),
      shock: new GraphicsContext().circle(0, 0, R).stroke({ color: 0xffc23d, width: 4 }),
    };
    this.prompt = new Graphics(
      new GraphicsContext().poly([-8, 0, 8, 0, 0, 10]).fill({ color: 0xffc23d }).stroke({ color: THEME.ink, width: 3, join: 'round' }),
    );
    this.prompt.visible = false;
    this.actorLayer.addChild(this.prompt);
    this.prompt.zIndex = 1e6;
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  setPreset(p: QualityPreset): void {
    this.preset = PRESETS[p];
    this.addPool.setBudget(this.preset.maxParticles * 0.7);
    this.normPool.setBudget(this.preset.maxParticles * 0.3);
    this.fxAddLayer.visible = true;
    this.lightLayer.visible = this.preset.glow;
    this.setupBloom(this.preset.bloom && !this.isCanvas);
  }

  private setupBloom(on: boolean): void {
    if (on && !this.bloomBatch) {
      this.bloomBatch = new GlowBatch(this.frames[FRAME.glow], 1200);
      this.bloomLayer.addChild(this.bloomBatch.container);
      const blur = new BlurFilter({ strength: 10, quality: 2, resolution: 0.25 });
      this.bloomLayer.filters = [blur];
      this.bloomLayer.blendMode = 'add';
    } else if (!on && this.bloomBatch) {
      this.bloomLayer.filters = [];
      this.bloomLayer.removeChildren();
      this.bloomBatch = null;
    }
  }

  /** CSS size + internal render scale; caps the backbuffer at 4K. */
  resize(cssW: number, cssH: number, dpr: number, renderScale: number): void {
    this.cssW = cssW;
    this.cssH = cssH;
    this.renderScale = renderScale;
    let res = Math.min(dpr, this.preset.dprCap) * renderScale;
    res = Math.min(res, CONFIG.maxBackbufferW / cssW, CONFIG.maxBackbufferH / cssH);
    this.app.renderer.resize(cssW, cssH, Math.max(0.25, res));
    // Show at least viewTilesW × viewTilesH; wider/taller screens see more.
    this.zoom = Math.min(cssW / (CONFIG.viewTilesW * T), cssH / (CONFIG.viewTilesH * T));
    this.vignette.width = cssW;
    this.vignette.height = cssH;
    this.flashRect.clear().rect(0, 0, cssW, cssH).fill({ color: 0xffffff });
    this.flashRect.alpha = 0;
  }

  get resolution(): number {
    return this.app.renderer.resolution;
  }

  // ── Room lifecycle ────────────────────────────────────────────────────────

  enterRoom(w: World, graph: FloorGraph): void {
    this.roomView?.destroy();
    for (const v of this.interactViews) v.destroy({ children: true });
    this.interactViews = [];
    this.addPool.clear();
    this.normPool.clear();
    for (const t of this.texts) t.t.visible = false;
    const theme = FLOOR_THEMES[Math.min(w.floor, FLOOR_THEMES.length - 1)];
    this.roomView = new RoomView(w.room, theme, this.shapes, this.frames[FRAME.glow], graph, w.doorsLocked, FONT);
    this.roomLayer.addChild(this.roomView.root);
    this.lightLayer.addChild(this.roomView.lights);
    this.app.renderer.background.color = theme.void;
    this.vignette.tint = 0xffffff;
    this.camX = w.player.x;
    this.camY = w.player.y;
    this.syncPlayerClass(w.player.cls.id);
  }

  private syncPlayerClass(cls: ClassId): void {
    if (this.playerCls === cls) return;
    this.playerView?.destroy({ children: true });
    const s = this.shapes.heroes[cls];
    this.playerView = new Container();
    this.playerShadow = new Graphics(this.shapes.shadow(15));
    this.playerBodyWrap = new Container();
    this.playerBody = new Graphics(s.body);
    this.playerFlash = new Graphics(s.flash);
    this.playerFlash.alpha = 0;
    this.playerWeapon = new Graphics(s.weapon);
    this.playerBodyWrap.addChild(this.playerBody, this.playerFlash, this.playerWeapon);
    this.playerView.addChild(this.playerShadow);
    if (cls === 'weaver') {
      const ring = new Container();
      ring.scale.set(1, 0.38);
      const rg = new Graphics(this.shapes.ring);
      ring.addChild(rg);
      ring.y = -20;
      this.playerRing = ring;
      this.playerView.addChild(ring);
    } else this.playerRing = null;
    this.playerView.addChild(this.playerBodyWrap);
    this.actorLayer.addChild(this.playerView);
    this.playerCls = cls;
  }

  // ── Per-frame sync ────────────────────────────────────────────────────────

  render(w: World, alpha: number, frameDt: number, simulating: boolean): void {
    const dt = Math.min(frameDt, 0.1);
    this.time += dt;
    const lerp = (a: number, b: number) => a + (b - a) * alpha;
    const p = w.player;
    const px = lerp(p.px, p.x);
    const py = lerp(p.py, p.y);

    // Camera with slight aim look-ahead.
    const lookAmt = 40;
    this.lookX = damp(this.lookX, Math.cos(p.aimAngle) * lookAmt, 4, dt);
    this.lookY = damp(this.lookY, Math.sin(p.aimAngle) * lookAmt, 4, dt);
    const tx = px + this.lookX;
    const ty = py + this.lookY;
    this.camX = damp(this.camX, tx, 9, dt);
    this.camY = damp(this.camY, ty, 9, dt);
    const halfW = this.cssW / 2 / this.zoom;
    const halfH = this.cssH / 2 / this.zoom;
    let cx = this.camX;
    let cy = this.camY;
    if (w.worldW > halfW * 2) cx = Math.max(halfW - T, Math.min(w.worldW - halfW + T, cx));
    else cx = w.worldW / 2;
    if (w.worldH > halfH * 2) cy = Math.max(halfH - T, Math.min(w.worldH - halfH + T, cy));
    else cy = w.worldH / 2;
    this.shakeAmt = damp(this.shakeAmt, 0, 10, dt);
    const sh = this.shakeEnabled ? this.shakeAmt : 0;
    const sx = (Math.random() - 0.5) * sh;
    const sy = (Math.random() - 0.5) * sh;
    this.world.scale.set(this.zoom);
    this.world.position.set(this.cssW / 2 - (cx + sx) * this.zoom, this.cssH / 2 - (cy + sy) * this.zoom);
    const viewL = cx - halfW - 96;
    const viewR = cx + halfW + 96;
    const viewT = cy - halfH - 140;
    const viewB = cy + halfH + 96;

    this.glow.begin();
    this.bloomBatch?.begin();
    this.roomView?.setLocked(w.doorsLocked);
    this.roomView?.update(this.time);

    this.syncPlayer(w, px, py, dt);
    this.syncEnemies(w, alpha, viewL, viewR, viewT, viewB);
    this.syncProjectiles(w, alpha, viewL, viewR, viewT, viewB);
    this.syncPickups(w, alpha);
    this.syncHazards(w);
    this.syncInteractables(w, dt);

    if (simulating) {
      this.addPool.update(dt);
      this.normPool.update(dt);
    } else {
      this.addPool.update(0);
      this.normPool.update(0);
    }
    this.updateTexts(simulating ? dt : 0);
    this.updateBolts(dt);
    this.glow.end();
    this.bloomBatch?.end();

    this.flashAlpha = damp(this.flashAlpha, 0, 7, dt);
    this.flashRect.alpha = this.flashAlpha;
    this.flashRect.tint = this.flashColor;
    // Low HP: crimson vignette pulse.
    const low = p.hp / p.stats.maxHp;
    this.vignette.tint = low < 0.3 && p.alive ? 0xff6070 : 0xffffff;
    this.vignette.alpha = low < 0.3 && p.alive ? 0.9 + 0.1 * Math.sin(this.time * 6) : 0.85;

    this.app.renderer.render(this.app.stage);
  }

  private syncPlayer(w: World, x: number, y: number, dt: number): void {
    const p = w.player;
    this.syncPlayerClass(p.cls.id);
    const v = this.playerView;
    v.position.set(x, y + p.radius * 0.6);
    v.zIndex = y;
    const moving = Math.hypot(p.vx, p.vy) > 20;
    const bob = moving ? Math.abs(Math.sin(p.walkPhase)) * 2.5 : Math.sin(this.time * 3) * 0.8;
    const dashing = p.dashT > 0 || p.abilityDashT > 0;
    const sq = dashing ? 0.85 : 1 + (moving ? Math.sin(p.walkPhase * 2) * 0.03 : Math.sin(this.time * 3) * 0.02);
    this.playerBodyWrap.scale.set(p.facing * (dashing ? 1.15 : 1) * VIS, sq * VIS);
    this.playerBodyWrap.y = -bob;
    this.playerBodyWrap.rotation = moving ? Math.sin(p.walkPhase) * 0.04 : 0;
    this.playerFlash.alpha = p.hurtT > 0 ? p.hurtT / 0.3 : 0;
    this.playerFlash.tint = 0xffffff;
    const blink = p.invuln > 0 && !dashing && Math.floor(this.time * 20) % 2 === 0;
    v.alpha = p.alive ? (blink ? 0.45 : 1) : Math.max(0, v.alpha - dt);
    if (!p.alive) this.playerBodyWrap.rotation = p.facing * 1.4;

    // Weapon: hand pivot, rotated toward aim (mirrored when facing left).
    const wpn = this.playerWeapon;
    wpn.position.set(8, -19);
    let a = p.aimAngle;
    if (p.cls.attack.kind === 'slash' && p.swingT > 0) {
      const t = 1 - p.swingT / 0.22;
      a += (-1.2 + t * 2.4) * (p.facing > 0 ? 1 : -1);
    } else if (p.cls.attack.kind === 'dagger' && p.swingT > 0) {
      wpn.position.x += Math.sin((p.swingT / 0.12) * Math.PI) * 8;
    }
    wpn.rotation = p.facing > 0 ? a : Math.PI - a;
    if (p.cls.attack.kind === 'orb') {
      // Staff held more upright.
      wpn.rotation = (p.facing > 0 ? a : Math.PI - a) * 0.5 - 0.6;
      if (p.castT > 0) this.glow.add(x + Math.cos(p.aimAngle) * 30, y - 30, 30, 0xd06cff, 0.6);
    }
    if (this.playerRing) {
      this.playerRing.children[0].rotation = this.time * 1.6;
      this.glow.add(x, y - 20, 50, THEME.arcane, 0.25);
    }
    // Player light
    this.glow.add(x, y - 16, 120, 0xffe2b0, 0.12);
    if (dashing) this.glow.add(x, y - 18, 40, p.cls.color, 0.5);

    // Familiars (orbit wisps) and reaper scythes.
    const n = p.stats.orbitals;
    while (this.familiars.length < n) {
      const g = new Graphics(this.shapes.imp);
      this.actorLayer.addChild(g);
      this.familiars.push(g);
    }
    const r = orbitRadius();
    for (let k = 0; k < this.familiars.length; k++) {
      const g = this.familiars[k];
      g.visible = k < n && p.alive;
      if (!g.visible) continue;
      const ang = p.orbitAngle + (k * TAU) / n;
      const fx = x + Math.cos(ang) * r;
      const fy = y + Math.sin(ang) * r * 0.8;
      g.position.set(fx, fy - 14 + Math.sin(this.time * 6 + k) * 3);
      g.zIndex = fy;
      g.scale.set(Math.cos(ang) > 0 ? 1 : -1, 1);
      this.glow.add(fx, fy - 18, 34, 0xff8a2a, 0.45);
    }
    const sc = p.hooks.scythe;
    while (this.scythes.length < sc) {
      const g = new Graphics(this.shapes.scythe);
      this.actorLayer.addChild(g);
      this.scythes.push(g);
    }
    for (let k = 0; k < this.scythes.length; k++) {
      const g = this.scythes[k];
      g.visible = k < sc && p.alive;
      if (!g.visible) continue;
      const ang = -p.orbitAngle * 0.6 + (k * TAU) / sc;
      const fx = x + Math.cos(ang) * 92;
      const fy = y + Math.sin(ang) * 92 * 0.8;
      g.position.set(fx, fy - 18);
      g.rotation = this.time * 9;
      g.zIndex = fy;
      this.glow.add(fx, fy - 18, 50, 0xb05cff, 0.35);
    }
  }

  private makeEnemyView(def: number): EnemyView {
    const d = ENEMY_DEFS[def];
    const s = this.shapes.enemies[d.key];
    const root = new Container();
    const shadow = new Graphics(this.shapes.shadow(d.radius * (d.boss ? 1.1 : 1.05)));
    const aura = new Graphics(new GraphicsContext().ellipse(0, 0, 1, 0.4).stroke({ color: THEME.elite, width: 0.12 }).ellipse(0, 0, 1, 0.4).fill({ color: THEME.elite, alpha: 0.15 }));
    const bodyWrap = new Container();
    const body = new Graphics(s.body);
    const flash = new Graphics(s.flash);
    flash.alpha = 0;
    let extraA: Graphics | null = null;
    let extraB: Graphics | null = null;
    if (d.key === 'bat') {
      extraA = new Graphics(this.shapes.batWing.body);
      extraB = new Graphics(this.shapes.batWing.body);
      extraB.scale.x = -1;
      bodyWrap.addChild(extraA, extraB, body, flash);
    } else if (d.key === 'ogre') {
      extraA = new Graphics(this.shapes.ogreClub.body);
      extraA.position.set(44, -100);
      bodyWrap.addChild(body, flash, extraA);
    } else if (d.key === 'golem') {
      extraA = new Graphics(this.shapes.golemRunes);
      extraB = new Graphics(this.shapes.golemCracks);
      bodyWrap.addChild(body, extraA, extraB, flash);
    } else bodyWrap.addChild(body, flash);
    const hp = new Container();
    const hpFill = new Graphics(BAR_FILL);
    hpFill.position.set(-15, 1);
    hp.addChild(new Graphics(BAR), hpFill);
    root.addChild(shadow, aura, bodyWrap, hp);
    this.actorLayer.addChild(root);
    return { root, shadow, aura, bodyWrap, body, flash, extraA, extraB, hp, hpFill, def };
  }

  private syncEnemies(w: World, alpha: number, l: number, r: number, t: number, b: number): void {
    const E = w.enemies;
    const high = E.slots.high;
    for (let i = 0; i < Math.max(high, this.enemyViews.length); i++) {
      let v = this.enemyViews[i];
      if (i >= high || !E.slots.alive[i]) {
        if (v) v.root.visible = false;
        continue;
      }
      const x = E.px[i] + (E.x[i] - E.px[i]) * alpha;
      const y = E.py[i] + (E.y[i] - E.py[i]) * alpha;
      if (x < l || x > r || y < t || y > b) {
        if (v) v.root.visible = false;
        continue;
      }
      const def = E.def[i];
      if (!v || v.def !== def) {
        v?.root.destroy({ children: true });
        v = this.makeEnemyView(def);
        this.enemyViews[i] = v;
      }
      const d = ENEMY_DEFS[def];
      const rad = E.radius[i];
      const sizeMul = rad / d.radius;
      v.root.visible = true;
      v.root.position.set(x, y + rad * 0.5);
      v.root.zIndex = y;
      const ph = E.phase[i];
      const fly = d.flying ? -6 + Math.sin(ph * 3) * 4 : 0;
      const moving = Math.abs(E.vx[i]) + Math.abs(E.vy[i]) > 10;
      const bob = d.flying ? fly : moving ? -Math.abs(Math.sin(ph * 9)) * 2.5 : 0;
      const spawn = E.spawnT[i] > 0 ? Math.min(1, E.spawnT[i] / 0.7) : 0;
      const fl = E.flash[i] > 0 ? E.flash[i] / 0.12 : 0;
      const windup = E.state[i] === 1 && d.ai !== 'flutter';
      const sqx = 1 + fl * 0.12 + (windup ? Math.sin(this.time * 40) * 0.04 : 0);
      const sqy = 1 - fl * 0.1 + (moving && !d.flying ? Math.sin(ph * 18) * 0.03 : 0);
      v.bodyWrap.scale.set(E.facing[i] * sizeMul * sqx * VIS, sizeMul * sqy * VIS);
      v.bodyWrap.y = bob + spawn * 26;
      v.bodyWrap.alpha = 1 - spawn;
      v.shadow.scale.set(d.flying ? 0.8 : 1);
      v.flash.alpha = Math.max(fl, windup ? 0.35 + 0.35 * Math.sin(this.time * 30) : 0);
      v.flash.tint = windup ? 0xff8a2a : 0xffffff;
      v.aura.visible = E.elite[i] === 1;
      if (v.aura.visible) {
        v.aura.scale.set(rad * 1.5);
        v.aura.alpha = 0.6 + 0.3 * Math.sin(this.time * 5 + ph);
        this.glow.add(x, y - rad, rad * 4, THEME.elite, 0.18);
      }
      if (d.key === 'bat' && v.extraA && v.extraB) {
        const flap = 0.55 + Math.abs(Math.sin(ph * 16)) * 0.6;
        v.extraA.scale.y = flap;
        v.extraB.scale.y = flap;
        v.extraA.y = (1 - flap) * -28;
        v.extraB.y = (1 - flap) * -28;
      } else if (d.key === 'ogre' && v.extraA) {
        const st = E.state[i];
        v.extraA.rotation = st === 1 ? -1.6 + (1 - E.t[i] / 0.85) * -0.4 : st === 3 ? 0.5 : -0.3 + Math.sin(ph * 2) * 0.15;
      } else if (d.key === 'golem' && v.extraA && v.extraB) {
        const enr = E.hp[i] / E.maxHp[i] < 0.4;
        v.extraA.alpha = 0.7 + 0.3 * Math.sin(this.time * 4);
        v.extraB.visible = enr;
        v.extraB.alpha = 0.6 + 0.4 * Math.sin(this.time * 10);
        this.glow.add(x, y - 86 * sizeMul, 70, THEME.rune, 0.16 * v.extraA.alpha);
        if (enr) this.glow.add(x, y - 100, 120, THEME.crack, 0.14);
      } else if (d.key === 'count') {
        const st = E.state[i];
        v.bodyWrap.alpha = st === 4 ? Math.max(0.1, E.t[i] / 0.5) : 1;
        this.glow.add(x, y - 86, 40, 0xff2244, 0.3);
      } else if (d.key === 'witch' || d.key === 'gargoyle') {
        this.glow.add(x, y - 24, 30, 0xff8a2a, 0.25);
      }
      if (E.burnT[i] > 0) this.glow.add(x, y - rad, rad * 3, 0xff8a2a, 0.25);
      const frac = E.hp[i] / E.maxHp[i];
      v.hp.visible = !d.boss && (frac < 0.999 || E.elite[i] === 1) && spawn === 0;
      if (v.hp.visible) {
        v.hp.y = -((ENEMY_HEIGHT[d.key] ?? 50) * VIS + (d.flying ? 12 : 4)) * sizeMul;
        v.hpFill.scale.x = Math.max(0, frac);
        v.hpFill.tint = E.elite[i] ? THEME.elite : frac > 0.5 ? 0xe8344e : 0xff6a3a;
      }
    }
  }

  private syncProjectiles(w: World, alpha: number, l: number, r: number, t: number, b: number): void {
    const P = w.projectiles;
    const high = P.slots.high;
    for (let i = 0; i < Math.max(high, this.projViews.length); i++) {
      let g = this.projViews[i];
      if (i >= high || !P.slots.alive[i]) {
        if (g) g.visible = false;
        continue;
      }
      const x = P.px[i] + (P.x[i] - P.px[i]) * alpha;
      const y = P.py[i] + (P.y[i] - P.py[i]) * alpha;
      if (x < l || x > r || y < t || y > b) {
        if (g) g.visible = false;
        continue;
      }
      const kind = P.kind[i];
      if (!g) {
        g = new Graphics(this.shapes.projectiles[kind]);
        this.projLayer.addChild(g);
        this.projViews[i] = g;
        this.projKind[i] = kind;
      } else if (this.projKind[i] !== kind) {
        g.context = this.shapes.projectiles[kind];
        this.projKind[i] = kind;
      }
      g.visible = true;
      let yy = y;
      if (kind === PROJ.FLASK) yy -= Math.sin(Math.min(1, P.age[i] / 0.45) * Math.PI) * 50;
      g.position.set(x, yy - (P.team[i] === 0 && kind !== PROJ.FLASK ? 10 : 8));
      g.rotation = P.spin[i];
      const sc = kind === PROJ.FIREBALL && P.radius[i] > 10 ? 1.5 : kind === PROJ.WAVE ? 1.1 : 1;
      g.scale.set(sc);
      const glowC = PROJ_GLOW[kind] ?? 0xffffff;
      const enemy = P.team[i] === 1;
      this.glow.add(x, yy - 8, enemy ? 26 + P.radius[i] * 1.6 : 22 + P.radius[i] * 2, glowC, enemy ? 0.42 : 0.5);
      this.bloomBatch?.add(x, yy - 8, 40, glowC, 0.6);
      // Trails
      if (this.preset.trails > 0 && Math.random() < this.preset.trails * 0.5 && (kind === PROJ.ORB || kind === PROJ.FIREBALL || kind === PROJ.RUNE || kind === PROJ.BLOOD || kind === PROJ.DAGGER)) {
        this.addPool.spawn(x, yy - 8, 0, 0, 0.25, enemy ? 10 : 8, 2, glowC, FRAME.glow, 0, 0, 0.7);
      }
    }
  }

  private syncPickups(w: World, alpha: number): void {
    const K = w.pickups;
    const high = K.slots.high;
    for (let i = 0; i < Math.max(high, this.pickupViews.length); i++) {
      let g = this.pickupViews[i];
      if (i >= high || !K.slots.alive[i]) {
        if (g) g.visible = false;
        continue;
      }
      const kind = K.kind[i];
      if (!g) {
        g = new Graphics(this.shapes.pickups[kind]);
        this.pickupLayer.addChild(g);
        this.pickupViews[i] = g;
      }
      g.context = this.shapes.pickups[kind];
      g.visible = true;
      const x = K.px[i] + (K.x[i] - K.px[i]) * alpha;
      const y = K.py[i] + (K.y[i] - K.py[i]) * alpha;
      const bob = Math.sin(this.time * 5 + i) * 3;
      g.position.set(x, y - 8 + bob);
      const pop = Math.min(1, K.age[i] / 0.15);
      g.scale.set(pop * (kind === 0 ? 0.9 : 1));
      const tint = kind === 0 ? 0x3ddc84 : kind === 1 ? 0x4fa8ff : 0xff4d6a;
      this.glow.add(x, y - 8 + bob, 30, tint, 0.45);
    }
  }

  private syncHazards(w: World): void {
    const H = w.hazards;
    const high = H.slots.high;
    for (let i = 0; i < Math.max(high, this.hazardViews.length); i++) {
      let v = this.hazardViews[i];
      if (i >= high || !H.slots.alive[i]) {
        if (v) v.visible = false;
        continue;
      }
      if (!v) {
        v = new Container();
        v.addChild(new Graphics(this.hazardCtx.tele), new Graphics(this.hazardCtx.teleFill));
        this.groundLayer.addChild(v);
        this.hazardViews[i] = v;
      }
      const [a, bFill] = v.children as [Graphics, Graphics];
      v.visible = true;
      v.position.set(H.x[i], H.y[i]);
      const kind = H.kind[i];
      const r = H.radius[i];
      const prog = 1 - H.life[i] / H.maxLife[i];
      bFill.visible = false;
      const k = r / 100;
      a.scale.set(k, k * 0.6);
      a.alpha = 1;
      if (kind === HAZ.TELEGRAPH) {
        a.context = this.hazardCtx.tele;
        bFill.visible = true;
        bFill.scale.set(k * prog, k * prog * 0.6);
        a.alpha = 0.7 + 0.3 * Math.sin(this.time * 30);
      } else if (kind === HAZ.HOLYFIRE || kind === HAZ.TRAIL) {
        a.context = kind === HAZ.TRAIL ? this.hazardCtx.trail : this.hazardCtx.fire;
        a.alpha = Math.min(1, H.life[i] * 2);
        this.glow.add(H.x[i], H.y[i], r * 2.2, kind === HAZ.TRAIL ? 0xa8c8ff : 0x4fa8ff, 0.3 * a.alpha);
      } else if (kind === HAZ.WELL) {
        a.context = this.hazardCtx.well;
        const pulse = 0.85 + 0.15 * Math.sin(this.time * 20);
        a.scale.set(k * pulse, k * 0.6 * pulse);
        this.glow.add(H.x[i], H.y[i], r * 1.6, THEME.arcane, 0.4);
      } else if (kind === HAZ.SPAWN) {
        a.context = this.hazardCtx.spawn;
        const s = 0.5 + prog * 0.7;
        a.scale.set(k * s, k * s * 0.6);
        a.alpha = 0.5 + 0.5 * Math.sin(this.time * 25);
        this.glow.add(H.x[i], H.y[i], 50, 0xff2244, 0.4);
      } else if (kind === HAZ.SHOCK) {
        a.context = this.hazardCtx.shock;
        a.scale.set(Math.max(0.01, k * prog), Math.max(0.01, k * prog * 0.6));
        a.alpha = 1 - prog;
      }
    }
  }

  private syncInteractables(w: World, dt: number): void {
    const list = w.interactables;
    while (this.interactViews.length < list.length) {
      const it = list[this.interactViews.length];
      const c = new Container();
      const shadowR = it.kind === 'portal' ? 0 : it.kind === 'merchant' ? 22 : 20;
      if (shadowR) c.addChild(new Graphics(this.shapes.shadow(shadowR)));
      const S = this.shapes;
      switch (it.kind) {
        case 'chest':
          c.addChild(new Graphics(S.chest[it.rarity].closed));
          break;
        case 'merchant':
          c.addChild(new Graphics(S.props.merchant));
          break;
        case 'anvil':
          c.addChild(new Graphics(S.props.anvil));
          break;
        case 'campfire': {
          c.addChild(new Graphics(S.props.campfire));
          const f = new Graphics(S.flame);
          f.y = -4;
          c.addChild(f);
          break;
        }
        case 'altar':
          c.addChild(new Graphics(S.props.altar));
          break;
        case 'shrine':
          c.addChild(new Graphics(S.props.shrine));
          break;
        case 'portal': {
          c.addChild(new Graphics(S.props.portalFrame));
          const sw = new Graphics(S.props.portalSwirl);
          sw.scale.set(1, 1);
          c.addChild(sw);
          break;
        }
      }
      this.actorLayer.addChild(c);
      this.interactViews.push(c);
    }
    let promptAt = -1;
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const c = this.interactViews[i];
      c.position.set(it.x, it.y + 10);
      c.zIndex = it.y;
      const pop = it.appear < 1 ? 1 + Math.sin(it.appear * Math.PI) * 0.3 : 1;
      c.scale.set(Math.min(1, it.appear * 3) * pop);
      const top = c.children[c.children.length - 1] as Graphics;
      if (it.kind === 'chest') {
        top.context = it.used ? this.shapes.chest[it.rarity].open : this.shapes.chest[it.rarity].closed;
        if (!it.used) this.glow.add(it.x, it.y, 60, it.rarity === 'common' ? 0xffd76a : it.rarity === 'uncommon' ? 0x3ddc84 : it.rarity === 'rare' ? 0x5ec8ff : 0xb05cff, 0.35);
      } else if (it.kind === 'campfire') {
        top.scale.set(0.9 + 0.1 * Math.sin(this.time * 14), 0.9 + 0.15 * Math.sin(this.time * 11));
        this.glow.add(it.x, it.y - 10, 160, 0xff8a2a, it.used ? 0.25 : 0.5);
        if (Math.random() < dt * 12) this.addPool.spawnKind('ember', it.x + (Math.random() - 0.5) * 16, it.y - 16, (Math.random() - 0.5) * 20, -60, 0xffb43d, 4, 0.9);
      } else if (it.kind === 'portal') {
        top.rotation = this.time * 2.5;
        top.scale.set(1 + 0.08 * Math.sin(this.time * 6), 0.38);
        this.glow.add(it.x, it.y + 10, 160, 0xb05cff, 0.5);
        this.glow.add(it.x, it.y + 10, 80, 0xff4f6e, 0.5);
      } else if (it.kind === 'altar' || it.kind === 'shrine') {
        if (!it.used) this.glow.add(it.x, it.y - 30, 70, THEME.blood, 0.45);
      } else if (it.kind === 'merchant') {
        top.y = Math.sin(this.time * 2) * 1.5;
        this.glow.add(it.x + 28, it.y - 38, 60, THEME.candle, 0.5);
      }
      if (i === w.nearInteract) promptAt = i;
    }
    this.prompt.visible = promptAt >= 0;
    if (promptAt >= 0) {
      const it = list[promptAt];
      this.prompt.position.set(it.x, it.y - (it.kind === 'merchant' ? 84 : it.kind === 'portal' ? 40 : 58) + Math.sin(this.time * 6) * 4);
    }
  }

  // ── FX primitives (called by the FxSink implementation) ──────────────────

  burst(x: number, y: number, color: number, count: number, speed: number, size: number, life: number, kind: ParticleKind): void {
    const pool = isAdditive(kind) ? this.addPool : this.normPool;
    if (!this.preset.glow && isAdditive(kind)) count = Math.ceil(count / 2);
    for (let k = 0; k < count; k++) {
      const a = Math.random() * TAU;
      const s = speed * (0.35 + Math.random() * 0.65);
      pool.spawnKind(kind, x, y, Math.cos(a) * s, Math.sin(a) * s, color, size * (0.7 + Math.random() * 0.6), life * (0.7 + Math.random() * 0.5));
    }
  }

  particle(x: number, y: number, vx: number, vy: number, color: number, size: number, life: number, kind: ParticleKind): void {
    (isAdditive(kind) ? this.addPool : this.normPool).spawnKind(kind, x, y, vx, vy, color, size, life);
  }

  ring(x: number, y: number, color: number, radius: number, life: number): void {
    // Size lerps from size0 (spawn) to size1 (death); the ring texture's radius is 28/32 of its half-size.
    this.addPool.spawn(x, y, 0, 0, life, radius * 0.25, radius * 1.15, color, FRAME.ring, 0, 0, 1);
  }

  slash(x: number, y: number, angle: number, radius: number, _arc: number, color: number): void {
    const ox = Math.cos(angle) * radius * 0.45;
    const oy = Math.sin(angle) * radius * 0.45;
    this.addPool.spawn(x + ox, y - 14 + oy, Math.cos(angle) * 50, Math.sin(angle) * 50, 0.18, radius * 0.75, radius * 0.95, 0xffc23d, FRAME.slash, 2, 0, 0.9, angle);
    this.normPool.spawn(x + ox, y - 14 + oy, Math.cos(angle) * 40, Math.sin(angle) * 40, 0.13, radius * 0.65, radius * 0.85, color, FRAME.slash, 0, 0, 1, angle);
  }

  lightning(x1: number, y1: number, x2: number, y2: number, color: number): void {
    let b = this.bolts.find((q) => q.life <= 0);
    if (!b) {
      if (this.bolts.length >= 16) return;
      b = { g: new Graphics(), life: 0 };
      b.g.blendMode = 'add';
      this.fxAddLayer.addChild(b.g);
      this.bolts.push(b);
    }
    const g = b.g;
    g.clear();
    const segs = 6;
    g.moveTo(x1, y1 - 12);
    for (let s = 1; s < segs; s++) {
      const t = s / segs;
      g.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18, y1 + (y2 - y1) * t - 12 + (Math.random() - 0.5) * 18);
    }
    g.lineTo(x2, y2 - 12);
    g.stroke({ color, width: 4, alpha: 0.9, join: 'round' });
    b.life = 0.18;
    g.visible = true;
  }

  private updateBolts(dt: number): void {
    for (const b of this.bolts) {
      if (b.life <= 0) continue;
      b.life -= dt;
      b.g.alpha = Math.max(0, b.life / 0.18);
      if (b.life <= 0) b.g.visible = false;
    }
  }

  text(x: number, y: number, str: string, color: number, big = false): void {
    let ft = this.texts.find((q) => q.life <= 0);
    if (!ft) {
      if (this.texts.length >= 96) ft = this.texts.reduce((a, q) => (q.life < a.life ? q : a));
      else {
        const t = new BitmapText({ text: '', style: { fontFamily: FONT, fontSize: 16 } });
        t.anchor.set(0.5);
        this.textLayer.addChild(t);
        ft = { t, life: 0, vy: 0, big: false };
        this.texts.push(ft);
      }
    }
    ft.t.text = str;
    ft.t.tint = color;
    ft.t.position.set(x + (Math.random() - 0.5) * 14, y);
    ft.t.visible = true;
    ft.t.alpha = 1;
    ft.life = big ? 0.9 : 0.7;
    ft.vy = big ? -70 : -55;
    ft.big = big;
  }

  private updateTexts(dt: number): void {
    for (const f of this.texts) {
      if (f.life <= 0) continue;
      f.life -= dt;
      f.t.y += f.vy * dt;
      f.vy *= Math.exp(-3 * dt);
      const max = f.big ? 0.9 : 0.7;
      const age = max - f.life;
      const pop = age < 0.1 ? 1 + (1 - age / 0.1) * 0.6 : 1;
      const base = f.big ? 22 : 15;
      f.t.scale.set((base / 16) * pop);
      f.t.alpha = f.life < 0.25 ? f.life / 0.25 : 1;
      if (f.life <= 0) f.t.visible = false;
    }
  }

  shake(amount: number): void {
    this.shakeAmt = Math.min(24, this.shakeAmt + amount);
  }

  flash(color: number, alpha: number): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  /** Render a character to a canvas (for DOM portraits) — still code-drawn. */
  portrait(cls: ClassId, size: number): HTMLCanvasElement {
    const c = new Container();
    const s = this.shapes.heroes[cls];
    c.addChild(new Graphics(this.shapes.shadow(16)));
    const body = new Graphics(s.body);
    const wpn = new Graphics(s.weapon);
    wpn.position.set(8, -19);
    wpn.rotation = cls === 'weaver' ? -1.0 : -0.5;
    c.addChild(body, wpn);
    if (cls === 'weaver') {
      const ring = new Container();
      ring.scale.set(1, 0.38);
      ring.y = -20;
      ring.addChild(new Graphics(this.shapes.ring));
      c.addChildAt(ring, 1);
    }
    c.scale.set(size / 70);
    const canvas = this.app.renderer.extract.canvas({ target: c, resolution: 2, antialias: true }) as HTMLCanvasElement;
    c.destroy({ children: true });
    return canvas;
  }
}
