import { CONFIG } from '../config';
import { emptyIntent, type Intent } from '../game/intent';

export type InputMethod = 'keyboardMouse' | 'touch' | 'gamepad';
export type UiAction = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back' | 'pause' | 'map' | 'tabL' | 'tabR';

export interface Stick {
  id: number;
  active: boolean;
  ox: number;
  oy: number;
  x: number;
  y: number;
  /** Normalised vector after deadzone. */
  vx: number;
  vy: number;
  mag: number;
  startT: number;
}

const newStick = (): Stick => ({ id: -1, active: false, ox: 0, oy: 0, x: 0, y: 0, vx: 0, vy: 0, mag: 0, startT: 0 });

/**
 * Unified input: Pointer Events (mouse + touch in one path), keyboard, and the
 * Gamepad API polled every frame. The active method switches live on the
 * first event from a device.
 */
export class Input {
  method: InputMethod;
  onMethodChange: ((m: InputMethod) => void) | null = null;
  onUi: ((a: UiAction) => boolean) | null = null;
  /** True while a menu owns input (gameplay intent is suppressed). */
  menuOpen = false;

  private keys = new Set<string>();
  mouseX = 0;
  mouseY = 0;
  private lmb = false;
  private latch = { ability: false, dash: false, interact: false };
  readonly move = newStick();
  readonly aim = newStick();
  stickRadius: number = CONFIG.stickRadiusCss;
  leftHanded = false;
  autoAim = false;
  aimAssist = true;
  private padPrev: boolean[] = [];
  private padAxes = [0, 0, 0, 0];
  private padIndex = -1;
  private uiRepeat = { dir: '' as UiAction | '', t: 0 };
  private readonly out: Intent = emptyIntent();
  private lastAimX = 1;
  private lastAimY = 0;
  vibrationEnabled = true;

  constructor(
    private surface: HTMLElement,
    initial: InputMethod,
  ) {
    this.method = initial;
    const opts = { passive: false } as AddEventListenerOptions;
    surface.addEventListener('pointerdown', this.onPointerDown, opts);
    window.addEventListener('pointermove', this.onPointerMove, opts);
    window.addEventListener('pointerup', this.onPointerUp, opts);
    window.addEventListener('pointercancel', this.onPointerUp, opts);
    surface.addEventListener('contextmenu', (e) => e.preventDefault());
    // Block scroll, pinch-zoom and pull-to-refresh inside the game.
    surface.addEventListener('touchstart', (e) => e.preventDefault(), opts);
    surface.addEventListener('touchmove', (e) => e.preventDefault(), opts);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.releaseAll());
    window.addEventListener('gamepadconnected', (e) => {
      this.padIndex = (e as GamepadEvent).gamepad.index;
    });
  }

  private setMethod(m: InputMethod): void {
    if (m === this.method) return;
    this.method = m;
    this.onMethodChange?.(m);
  }

  releaseAll(): void {
    this.keys.clear();
    this.lmb = false;
    this.move.active = this.aim.active = false;
    this.move.id = this.aim.id = -1;
    this.move.mag = this.aim.mag = 0;
  }

  // ── Pointer (mouse + touch) ──────────────────────────────────────────────

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') {
      this.setMethod('keyboardMouse');
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (e.button === 0) this.lmb = true;
      if (e.button === 2 && !this.menuOpen) this.latch.ability = true;
      return;
    }
    e.preventDefault();
    this.setMethod('touch');
    if (this.menuOpen) return;
    const leftZone = e.clientX < window.innerWidth / 2;
    const isMoveZone = this.leftHanded ? !leftZone : leftZone;
    const stick = isMoveZone ? this.move : this.aim;
    if (stick.active) return;
    stick.active = true;
    stick.id = e.pointerId;
    stick.ox = stick.x = e.clientX;
    stick.oy = stick.y = e.clientY;
    stick.vx = stick.vy = stick.mag = 0;
    stick.startT = performance.now();
    try {
      this.surface.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') {
      if (Math.abs(e.clientX - this.mouseX) + Math.abs(e.clientY - this.mouseY) > 2) this.setMethod('keyboardMouse');
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      return;
    }
    for (const s of [this.move, this.aim]) {
      if (!s.active || s.id !== e.pointerId) continue;
      e.preventDefault();
      s.x = e.clientX;
      s.y = e.clientY;
      let dx = s.x - s.ox;
      let dy = s.y - s.oy;
      const d = Math.hypot(dx, dy);
      const R = this.stickRadius;
      // Floating stick: drag the origin along when the thumb overshoots.
      if (d > R) {
        s.ox = s.x - (dx / d) * R;
        s.oy = s.y - (dy / d) * R;
        dx = s.x - s.ox;
        dy = s.y - s.oy;
      }
      const m = Math.min(1, Math.hypot(dx, dy) / R);
      if (m < CONFIG.stickDeadzone) {
        s.vx = s.vy = s.mag = 0;
      } else {
        const k = (m - CONFIG.stickDeadzone) / (1 - CONFIG.stickDeadzone) / (Math.hypot(dx, dy) || 1);
        s.vx = dx * k;
        s.vy = dy * k;
        s.mag = Math.hypot(s.vx, s.vy);
      }
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') {
      if (e.button === 0) this.lmb = false;
      return;
    }
    for (const s of [this.move, this.aim]) {
      if (s.id !== e.pointerId) continue;
      // Swipe on the move stick = dash.
      if (s === this.move) {
        const dt = performance.now() - s.startT;
        const dist = Math.hypot(s.x - s.ox, s.y - s.oy);
        if (dt < 200 && dist > this.stickRadius * 0.8) this.latch.dash = true;
      }
      s.active = false;
      s.id = -1;
      s.vx = s.vy = s.mag = 0;
    }
  };

  /** Touch buttons call these. */
  pressAbility(): void {
    this.latch.ability = true;
  }
  pressDash(): void {
    this.latch.dash = true;
  }
  pressInteract(): void {
    this.latch.interact = true;
  }

  // ── Keyboard ─────────────────────────────────────────────────────────────

  private onKeyDown = (e: KeyboardEvent): void => {
    this.setMethod('keyboardMouse');
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    const ui = (a: UiAction) => this.onUi?.(a) ?? false;
    if (this.menuOpen) {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') ui('up');
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') ui('down');
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') ui('left');
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') ui('right');
      else if (e.code === 'Enter' || e.code === 'Space') {
        if (ui('confirm')) e.preventDefault();
      } else if (e.code === 'Escape' || e.code === 'Backspace') ui('back');
      else if (e.code === 'KeyQ') ui('tabL');
      else if (e.code === 'KeyE') ui('tabR');
      else if (e.code === 'Tab' || e.code === 'KeyM') ui('map');
      return;
    }
    if (e.code === 'Escape' || e.code === 'KeyP') ui('pause');
    else if (e.code === 'Tab' || e.code === 'KeyM') ui('map');
    else if (e.code === 'Space') this.latch.ability = true;
    else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.latch.dash = true;
    else if (e.code === 'KeyE' || e.code === 'KeyF') this.latch.interact = true;
  };

  // ── Gamepad ──────────────────────────────────────────────────────────────

  pollGamepad(dt: number): void {
    const pads = navigator.getGamepads?.() ?? [];
    let gp: Gamepad | null = null;
    if (this.padIndex >= 0) gp = pads[this.padIndex] ?? null;
    if (!gp) for (const p of pads) if (p && p.connected) gp = p;
    if (!gp) return;
    this.padIndex = gp.index;
    const dz = CONFIG.gamepadDeadzone;
    const ax = (i: number) => {
      const v = gp!.axes[i] ?? 0;
      return Math.abs(v) < dz ? 0 : v;
    };
    this.padAxes[0] = ax(0);
    this.padAxes[1] = ax(1);
    this.padAxes[2] = ax(2);
    this.padAxes[3] = ax(3);
    const pressed = (i: number) => !!gp!.buttons[i]?.pressed || (gp!.buttons[i]?.value ?? 0) > 0.5;
    const edge = (i: number) => pressed(i) && !this.padPrev[i];
    let any = false;
    for (let i = 0; i < gp.buttons.length; i++) if (pressed(i)) any = true;
    if (any || this.padAxes.some((v) => Math.abs(v) > 0.4)) this.setMethod('gamepad');

    const ui = (a: UiAction) => this.onUi?.(a);
    if (this.menuOpen) {
      if (edge(0)) ui('confirm');
      if (edge(1)) ui('back');
      if (edge(9)) ui('back');
      if (edge(4)) ui('tabL');
      if (edge(5)) ui('tabR');
      if (edge(8)) ui('map');
      // D-pad / stick with auto-repeat.
      let dir: UiAction | '' = '';
      if (pressed(12) || this.padAxes[1] < -0.6) dir = 'up';
      else if (pressed(13) || this.padAxes[1] > 0.6) dir = 'down';
      else if (pressed(14) || this.padAxes[0] < -0.6) dir = 'left';
      else if (pressed(15) || this.padAxes[0] > 0.6) dir = 'right';
      if (dir !== this.uiRepeat.dir) {
        this.uiRepeat.dir = dir;
        this.uiRepeat.t = 0.38;
        if (dir) ui(dir);
      } else if (dir) {
        this.uiRepeat.t -= dt;
        if (this.uiRepeat.t <= 0) {
          this.uiRepeat.t = 0.12;
          ui(dir);
        }
      }
    } else {
      if (edge(0)) this.latch.ability = true;
      if (edge(1)) this.latch.dash = true;
      if (edge(2)) this.latch.interact = true;
      if (edge(9)) ui('pause');
      if (edge(8)) ui('map');
    }
    for (let i = 0; i < gp.buttons.length; i++) this.padPrev[i] = pressed(i);
    this.padFire = pressed(7) || pressed(5);
  }
  private padFire = false;

  rumble(strong: number, weak: number, ms: number): void {
    if (!this.vibrationEnabled) return;
    const pads = navigator.getGamepads?.() ?? [];
    const gp = this.padIndex >= 0 ? pads[this.padIndex] : null;
    const act = (gp as unknown as { vibrationActuator?: { playEffect?: (t: string, p: object) => Promise<unknown> } })?.vibrationActuator;
    act?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak })?.catch(() => {});
  }

  // ── Intent ───────────────────────────────────────────────────────────────

  /**
   * Build this tick's intent. `toWorld` converts CSS pixels to world units.
   * Edge-triggered actions are consumed by the first tick that reads them.
   */
  sample(px: number, py: number, toWorld: (sx: number, sy: number, out: Float32Array) => void, tmp: Float32Array): Intent {
    const o = this.out;
    o.ability = o.dash = o.interact = false;
    o.fire = false;
    o.hasAimPoint = false;
    o.aimAssist = false;
    o.autoAim = false;
    o.moveX = o.moveY = 0;
    if (this.menuOpen) return o;

    if (this.method === 'keyboardMouse') {
      const k = this.keys;
      o.moveX = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
      o.moveY = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
      toWorld(this.mouseX, this.mouseY, tmp);
      o.aimPointX = tmp[0];
      o.aimPointY = tmp[1];
      o.hasAimPoint = true;
      const dx = tmp[0] - px;
      const dy = tmp[1] - py;
      const d = Math.hypot(dx, dy) || 1;
      o.aimX = dx / d;
      o.aimY = dy / d;
      o.fire = this.lmb;
    } else if (this.method === 'gamepad') {
      o.moveX = this.padAxes[0];
      o.moveY = this.padAxes[1];
      const rx = this.padAxes[2];
      const ry = this.padAxes[3];
      const rm = Math.hypot(rx, ry);
      if (rm > 0.25) {
        this.lastAimX = rx / rm;
        this.lastAimY = ry / rm;
      } else if (Math.hypot(o.moveX, o.moveY) > 0.3) {
        const mm = Math.hypot(o.moveX, o.moveY);
        this.lastAimX = o.moveX / mm;
        this.lastAimY = o.moveY / mm;
      }
      o.aimX = this.lastAimX;
      o.aimY = this.lastAimY;
      o.fire = this.padFire || rm > 0.5;
      o.aimAssist = this.aimAssist;
      o.autoAim = this.autoAim;
    } else {
      o.moveX = this.move.vx;
      o.moveY = this.move.vy;
      if (this.aim.mag > 0) {
        this.lastAimX = this.aim.vx / this.aim.mag;
        this.lastAimY = this.aim.vy / this.aim.mag;
        o.fire = true; // auto-fire while the aim stick is held past the deadzone
      } else if (this.move.mag > 0.2) {
        this.lastAimX = this.move.vx / this.move.mag;
        this.lastAimY = this.move.vy / this.move.mag;
      }
      o.aimX = this.lastAimX;
      o.aimY = this.lastAimY;
      o.aimAssist = this.aimAssist;
      o.autoAim = this.autoAim;
    }
    o.ability = this.latch.ability;
    o.dash = this.latch.dash;
    o.interact = this.latch.interact;
    return o;
  }

  /** Called after a simulation tick consumed the intent. */
  consumeEdges(): void {
    this.latch.ability = this.latch.dash = this.latch.interact = false;
  }
}
