import { CONFIG } from '../config';
import type { SfxName } from '../game/fx';
import { ZZFX_RATE, zzfxBuild } from './zzfx';

// Every sound is a ZzFX parameter array, synthesized once into an AudioBuffer.
// [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
//  slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation,
//  bitCrush, delay, sustainVolume, decay, tremolo, filter]
export const SFX: Record<SfxName, number[]> = {
  shoot_slash: [0.5, 0.1, 360, 0.01, 0.02, 0.09, 3, 1.4, -18, 0, 0, 0, 0, 1.6, 0, 0, 0, 0.7, 0.02, 0, 2400],
  shoot_orb: [0.35, 0.05, 520, 0.01, 0.03, 0.12, 0, 1.8, -4, 0, 0, 0, 0, 0, 12, 0, 0, 0.8, 0.02],
  shoot_dagger: [0.35, 0.1, 900, 0, 0.01, 0.05, 3, 0.5, -30, 0, 0, 0, 0, 0.8, 0, 0, 0, 0.6, 0.01],
  hit: [0.4, 0.1, 180, 0, 0.01, 0.06, 4, 1.2, -6, 0, 0, 0, 0, 2.4, 0, 0, 0, 0.6, 0.02],
  crit: [0.6, 0.05, 240, 0, 0.03, 0.12, 3, 1.6, -9, 0, 220, 0.02, 0, 1.8, 0, 0, 0, 0.6, 0.02],
  enemy_death: [0.55, 0.1, 140, 0.01, 0.06, 0.22, 4, 1.4, -4, 0, 0, 0, 0, 3, 0, 0.1, 0, 0.5, 0.05],
  player_hurt: [0.8, 0.05, 160, 0, 0.06, 0.2, 2, 2, -8, 0, 0, 0, 0, 1.2, 0, 0.2, 0, 0.6, 0.04],
  level_up: [0.6, 0, 440, 0.02, 0.18, 0.4, 0, 1.6, 0, 0, 220, 0.08, 0.1, 0, 0, 0, 0.06, 0.8, 0.04],
  card_pick: [0.5, 0, 660, 0.01, 0.08, 0.2, 1, 1.5, 0, 0, 330, 0.06, 0, 0, 0, 0, 0, 0.7, 0.02],
  door_unlock: [0.6, 0, 110, 0.02, 0.2, 0.4, 2, 1.2, 2, 0, 55, 0.12, 0, 0.6, 0, 0, 0.1, 0.6, 0.06],
  chest_open: [0.6, 0, 300, 0.01, 0.12, 0.3, 1, 1.3, 4, 0, 300, 0.05, 0.06, 0, 0, 0, 0, 0.7, 0.02],
  ui_tap: [0.25, 0, 900, 0, 0.01, 0.03, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0],
  pickup: [0.18, 0.1, 1100, 0, 0.01, 0.06, 0, 1.5, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0.01],
  dash: [0.35, 0.05, 260, 0.02, 0.03, 0.12, 4, 1, 6, 0, 0, 0, 0, 2.2, 0, 0, 0, 0.5, 0.02, 0, 1800],
  ability: [0.55, 0.05, 200, 0.02, 0.1, 0.3, 0, 2, 10, 0, 0, 0, 0, 0.4, 6, 0, 0.08, 0.7, 0.05],
  explosion: [0.8, 0.1, 70, 0.01, 0.12, 0.5, 4, 1.4, -2, 0, 0, 0, 0, 3.5, 0, 0.3, 0, 0.6, 0.08],
  enemy_shot: [0.25, 0.1, 420, 0.01, 0.02, 0.1, 1, 1.4, -12, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.6, 0.02],
  boss_roar: [0.9, 0.05, 70, 0.08, 0.4, 0.6, 2, 2.2, -1, 0, 0, 0, 0.04, 1.6, 4, 0.3, 0, 0.7, 0.1, 0.4],
  heal: [0.4, 0, 520, 0.02, 0.1, 0.3, 0, 1.2, 6, 0, 260, 0.06, 0, 0, 0, 0, 0, 0.7, 0.04],
  coin: [0.3, 0.05, 1400, 0, 0.02, 0.12, 1, 1.4, 0, 0, 700, 0.04, 0, 0, 0, 0, 0, 0.6, 0.01],
};

/**
 * Mixer: master → sfx/music buses. Max 8 simultaneous SFX voices; identical
 * sounds within 30 ms are merged so swarm deaths don't clip.
 */
export class Audio {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  sfxBus!: GainNode;
  musicBus!: GainNode;
  private buffers = new Map<SfxName, AudioBuffer>();
  private lastPlayed = new Map<SfxName, number>();
  private voices = 0;
  volumes = { master: 0.8, sfx: 0.8, music: 0.5 };

  /** Must be called from a user gesture (iOS Safari audio unlock). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      // Gentle limiter so stacked hits never clip harshly.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.ratio.value = 6;
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(comp).connect(this.ctx.destination);
      this.applyVolumes();
      for (const k of Object.keys(SFX) as SfxName[]) this.buffer(k);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.volumes.master;
    this.sfxBus.gain.value = this.volumes.sfx;
    this.musicBus.gain.value = this.volumes.music;
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend();
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private buffer(name: SfxName): AudioBuffer | null {
    if (!this.ctx) return null;
    let b = this.buffers.get(name);
    if (!b) {
      const p = SFX[name];
      const samples = zzfxBuild(...(p as Parameters<typeof zzfxBuild>));
      b = this.ctx.createBuffer(1, Math.max(1, samples.length), ZZFX_RATE);
      b.getChannelData(0).set(samples);
      this.buffers.set(name, b);
    }
    return b;
  }

  play(name: SfxName, pan = 0, volume = 1): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const now = performance.now();
    const last = this.lastPlayed.get(name) ?? -1e9;
    if (now - last < CONFIG.sfxMergeMs) return;
    if (this.voices >= CONFIG.maxVoices) return;
    this.lastPlayed.set(name, now);
    const buf = this.buffer(name);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const rnd = SFX[name][1] ?? 0.05;
    src.playbackRate.value = 1 + rnd * (Math.random() * 2 - 1);
    const g = ctx.createGain();
    g.gain.value = 0.3 * volume;
    let node: AudioNode = src;
    if (pan !== 0 && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node = src.connect(p);
    }
    node.connect(g).connect(this.sfxBus);
    this.voices++;
    src.onended = () => {
      this.voices--;
    };
    src.start();
  }
}
