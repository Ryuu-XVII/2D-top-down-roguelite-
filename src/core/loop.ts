import { CONFIG } from '../config';

export interface LoopHooks {
  update(dt: number): void;
  /** alpha = interpolation factor, frameDt = real seconds since last rendered frame */
  render(alpha: number, frameDt: number): void;
}

/**
 * Fixed-timestep simulation (120 Hz) decoupled from rendering. Rendering is
 * capped at `maxFps` (0 = uncapped, i.e. display refresh) and interpolates.
 */
export class GameLoop {
  private acc = 0;
  private last = 0;
  private lastRender = 0;
  private raf = 0;
  private running = false;
  maxFps = 0;
  /** When false the simulation is frozen but the scene still renders (menus). */
  simulate = true;
  timeScale = 1;

  constructor(private hooks: LoopHooks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.lastRender = this.last;
    this.acc = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  get isRunning(): boolean {
    return this.running;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);

    // Frame cap: never exceed the requested rate (with 1 ms slack for jitter).
    if (this.maxFps > 0) {
      const minInterval = 1000 / this.maxFps - 1;
      if (now - this.lastRender < minInterval) return;
    }

    const delta = Math.min((now - this.last) / 1000, CONFIG.maxFrameDelta);
    this.last = now;
    const dt = CONFIG.dt;
    if (this.simulate) {
      this.acc += delta * this.timeScale;
      // Hard bound on catch-up steps so a slow device degrades gracefully.
      let steps = 0;
      while (this.acc >= dt && steps < 30) {
        this.hooks.update(dt);
        this.acc -= dt;
        steps++;
      }
      if (steps >= 30) this.acc = 0;
    } else {
      this.acc = 0;
    }
    const frameDt = (now - this.lastRender) / 1000;
    this.lastRender = now;
    this.hooks.render(this.simulate ? this.acc / dt : 1, frameDt);
  };
}
