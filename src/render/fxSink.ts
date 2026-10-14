import type { Audio } from '../audio/sfx';
import type { FxSink, HapticKind, ParticleKind, SfxName } from '../game/fx';
import type { Input } from '../platform/input';
import type { GameRenderer } from './renderer';

/** Bridges simulation effects to particles, audio and haptics. */
export class RenderFx implements FxSink {
  haptics = true;
  /** Player x, for stereo panning. */
  listenerX = 0;

  constructor(
    private r: GameRenderer,
    private audio: Audio,
    private input: Input,
  ) {}

  burst(x: number, y: number, color: number, count: number, speed: number, size: number, life: number, kind: ParticleKind): void {
    this.r.burst(x, y, color, count, speed, size, life, kind);
  }
  particle(x: number, y: number, vx: number, vy: number, color: number, size: number, life: number, kind: ParticleKind): void {
    this.r.particle(x, y, vx, vy, color, size, life, kind);
  }
  ring(x: number, y: number, color: number, radius: number, life: number): void {
    this.r.ring(x, y, color, radius, life);
  }
  slash(x: number, y: number, angle: number, radius: number, arc: number, color: number): void {
    this.r.slash(x, y, angle, radius, arc, color);
  }
  lightning(x1: number, y1: number, x2: number, y2: number, color: number): void {
    this.r.lightning(x1, y1, x2, y2, color);
  }
  text(x: number, y: number, str: string, color: number, big?: boolean): void {
    this.r.text(x, y, str, color, big);
  }
  shake(intensity: number): void {
    this.r.shake(intensity);
  }
  flash(color: number, alpha: number): void {
    this.r.flash(color, alpha);
  }
  sfx(name: SfxName, x?: number): void {
    const pan = x === undefined ? 0 : Math.max(-0.7, Math.min(0.7, (x - this.listenerX) / 500));
    this.audio.play(name, pan);
  }
  haptic(kind: HapticKind): void {
    if (!this.haptics) return;
    const ms = kind === 'heavy' ? 120 : kind === 'levelup' ? 60 : 30;
    if (this.input.method === 'gamepad') this.input.rumble(kind === 'hit' ? 0.4 : 0.8, 0.6, ms);
    else if (this.input.method === 'touch' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(kind === 'levelup' ? [30, 40, 30] : ms);
      } catch {
        /* unsupported */
      }
    }
  }
}
