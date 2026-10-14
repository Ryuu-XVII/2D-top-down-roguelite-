import { CONFIG, PRESET_ORDER, type QualityPreset } from '../config';

/**
 * Dynamic resolution scaling + thermal step-down.
 * - Avg frame time over 2 s > budget × 1.1 → render scale −0.1 (floor 0.5).
 * - 5 s of headroom → scale +0.1 back toward the preset's target.
 * - FPS dropping steadily for ~30 s → step down one preset (with a toast).
 */
export class PerfMonitor {
  private acc = 0;
  private frames = 0;
  private headroomT = 0;
  private fpsHistory: number[] = [];
  fps = 0;
  scale = 1;
  enabled = true;

  constructor(
    public targetFps: number,
    public maxScale: number,
    private onScale: (s: number) => void,
    private onStepDown: (p: QualityPreset) => void,
    public preset: QualityPreset,
    public autoPreset: boolean,
  ) {
    this.scale = maxScale;
  }

  reset(targetFps: number, maxScale: number, preset: QualityPreset, auto: boolean): void {
    this.targetFps = targetFps;
    this.maxScale = maxScale;
    this.preset = preset;
    this.autoPreset = auto;
    this.scale = maxScale;
    this.acc = this.frames = this.headroomT = 0;
    this.fpsHistory = [];
  }

  frame(dt: number): void {
    if (dt <= 0) return;
    // Very slow frames still count (clamped) so struggling devices scale down;
    // background tabs stop the loop entirely, so they never reach here.
    if (dt > 1) dt = 1;
    this.acc += dt;
    this.frames++;
    if (this.acc < CONFIG.dynResWindow) return;
    const avg = this.acc / this.frames;
    this.fps = 1 / avg;
    this.acc = 0;
    this.frames = 0;
    if (!this.enabled) return;
    const budget = 1 / this.targetFps;
    if (avg > budget * CONFIG.dynResOverBudget) {
      this.headroomT = 0;
      const ns = Math.max(CONFIG.dynResFloor, Math.round((this.scale - CONFIG.dynResStep) * 100) / 100);
      if (ns !== this.scale) {
        this.scale = ns;
        this.onScale(ns);
      }
    } else if (avg < budget * 0.85) {
      this.headroomT += CONFIG.dynResWindow;
      if (this.headroomT >= CONFIG.dynResRecoverAfter && this.scale < this.maxScale) {
        this.headroomT = 0;
        this.scale = Math.min(this.maxScale, Math.round((this.scale + CONFIG.dynResStep) * 100) / 100);
        this.onScale(this.scale);
      }
    } else this.headroomT = 0;

    // Thermal throttling: sustained decline while already at the scale floor.
    this.fpsHistory.push(this.fps);
    if (this.fpsHistory.length > CONFIG.thermalWindow / CONFIG.dynResWindow) this.fpsHistory.shift();
    const n = this.fpsHistory.length;
    if (this.autoPreset && n >= CONFIG.thermalWindow / CONFIG.dynResWindow && this.scale <= CONFIG.dynResFloor + 0.001) {
      const first = this.fpsHistory.slice(0, n / 3).reduce((a, b) => a + b, 0) / (n / 3);
      const last = this.fpsHistory.slice((2 * n) / 3).reduce((a, b) => a + b, 0) / (n / 3);
      if (last < first * 0.9 && last < this.targetFps * 0.9) {
        const idx = PRESET_ORDER.indexOf(this.preset);
        if (idx > 0) {
          this.preset = PRESET_ORDER[idx - 1];
          this.fpsHistory = [];
          this.onStepDown(this.preset);
        }
      }
    }
  }
}
