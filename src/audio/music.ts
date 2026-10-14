import type { Audio } from './sfx';

export type Mood = 'none' | 'title' | 'explore' | 'battle' | 'boss' | 'calm';

// Chords as semitone offsets from the key root (natural/harmonic minor).
const CH: Record<string, number[]> = {
  i: [0, 3, 7],
  bII: [1, 5, 8],
  III: [3, 7, 10],
  iv: [5, 8, 12],
  V: [7, 11, 14],
  VI: [8, 12, 15],
  VII: [10, 14, 17],
};

interface Style {
  bpm: number;
  prog: string[];
  arp: number[]; // indices into chord tones (3 = octave root)
  drums: boolean;
  pad: number;
  bassEvery: number;
}

const STYLES: Record<Exclude<Mood, 'none'>, Style> = {
  title: { bpm: 76, prog: ['i', 'VI', 'iv', 'V'], arp: [0, 1, 2, 3, 2, 1, 0, 1], drums: false, pad: 0.05, bassEvery: 8 },
  explore: { bpm: 104, prog: ['i', 'VI', 'III', 'VII'], arp: [0, 2, 1, 2, 3, 2, 1, 2], drums: false, pad: 0.035, bassEvery: 4 },
  calm: { bpm: 70, prog: ['i', 'iv', 'VI', 'V'], arp: [0, 1, 2, 1, 3, 1, 2, 1], drums: false, pad: 0.05, bassEvery: 8 },
  battle: { bpm: 138, prog: ['i', 'VI', 'iv', 'V'], arp: [0, 1, 2, 3, 0, 1, 2, 1], drums: true, pad: 0.025, bassEvery: 2 },
  boss: { bpm: 152, prog: ['i', 'bII', 'i', 'V'], arp: [0, 2, 1, 3, 2, 1, 3, 2], drums: true, pad: 0.03, bassEvery: 2 },
};

const KEY_ROOT = [50, 52, 48]; // D, E, C (MIDI) per floor

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Tiny procedural gothic-harpsichord sequencer (no audio files). */
export class Music {
  private mood: Mood = 'none';
  private floor = 0;
  private step = 0;
  private nextTime = 0;
  private noise: AudioBuffer | null = null;

  constructor(private audio: Audio) {}

  setMood(mood: Mood, floor = this.floor): void {
    if (mood === this.mood && floor === this.floor) return;
    this.mood = mood;
    this.floor = floor;
    this.step = 0;
    const ctx = this.audio.ctx;
    if (ctx) this.nextTime = ctx.currentTime + 0.12;
  }

  /** Call every frame; schedules notes ~0.25 s ahead. */
  tick(): void {
    const ctx = this.audio.ctx;
    if (!ctx || ctx.state !== 'running' || this.mood === 'none') return;
    const st = STYLES[this.mood];
    const stepDur = 60 / st.bpm / 4;
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(st, this.step, this.nextTime, stepDur);
      this.step = (this.step + 1) % (st.prog.length * 16);
      this.nextTime += stepDur;
    }
  }

  private playStep(st: Style, step: number, t: number, dur: number): void {
    const root = KEY_ROOT[this.floor % KEY_ROOT.length];
    const chord = CH[st.prog[Math.floor(step / 16)]];
    const s16 = step % 16;
    const tones = [chord[0], chord[1], chord[2], chord[0] + 12];
    // Harpsichord-like arpeggio (8th notes on slow moods, 16ths in combat).
    const every = st.drums ? 1 : 2;
    if (s16 % every === 0) {
      const idx = st.arp[(s16 / every) % st.arp.length];
      this.note(mtof(root + 12 + tones[idx]), t, dur * every * 0.9, 'square', 0.035, 2600);
    }
    // Bass
    if (s16 % st.bassEvery === 0) this.note(mtof(root - 12 + chord[0]), t, dur * st.bassEvery * 0.85, 'sawtooth', 0.06, 700);
    // Organ pad on the downbeat
    if (s16 === 0) for (const n of chord) this.note(mtof(root + n), t, dur * 16, 'triangle', st.pad, 1800, 0.25);
    // Drums
    if (st.drums) {
      if (s16 % 4 === 0) this.kick(t);
      if (s16 % 2 === 1) this.hat(t, s16 % 4 === 3 ? 0.05 : 0.025);
      if (s16 === 4 || s16 === 12) this.hat(t, 0.08, 0.12);
    }
  }

  private note(freq: number, t: number, len: number, type: OscillatorType, vol: number, cutoff: number, attack = 0.005): void {
    const ctx = this.audio.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(f).connect(g).connect(this.audio.musicBus);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  private kick(t: number): void {
    const ctx = this.audio.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(this.audio.musicBus);
    o.start(t);
    o.stop(t + 0.2);
  }

  private hat(t: number, vol: number, len = 0.04): void {
    const ctx = this.audio.ctx!;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f).connect(g).connect(this.audio.musicBus);
    s.start(t);
    s.stop(t + len + 0.02);
  }
}
