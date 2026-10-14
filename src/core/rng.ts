// Deterministic hashing and seeded PRNG. Generation code must never call
// Math.random(); every stream is derived from the run seed.

/** 32-bit mixing (MurmurHash3 finalizer style). */
export function mix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function hashCombine(...parts: number[]): number {
  let h = 0x9e3779b9;
  for (const p of parts) h = mix32(h ^ (p + 0x9e3779b9 + (h << 6) + (h >>> 2)));
  return h >>> 0;
}

/** Hash an arbitrary string (e.g. a daily-challenge date) into a 32-bit seed. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return mix32(h >>> 0);
}

/** Small Fast Counter (sfc32) PRNG. */
export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    this.a = 0x9e3779b9;
    this.b = 0x243f6a88;
    this.c = 0xb7e15162;
    this.d = seed >>> 0;
    for (let i = 0; i < 15; i++) this.nextU32(); // warm up
  }

  nextU32(): number {
    let { a, b, c, d } = this;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return t >>> 0;
  }

  /** [0, 1) */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Pick a key from a weight table. */
  weighted<K extends string>(weights: Readonly<Record<K, number>>): K {
    let total = 0;
    for (const k in weights) total += weights[k];
    let r = this.next() * total;
    let last: K | undefined;
    for (const k in weights) {
      last = k;
      r -= weights[k];
      if (r < 0) return k;
    }
    return last as K;
  }

  /** Index into an array of weights. */
  weightedIndex(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
}

// Independent streams so changing the loot table never reshapes maps.
export const STREAM = { layout: 1, enemies: 2, loot: 3, cards: 4, events: 5, shop: 6 } as const;

export function streamRng(seed: number, stream: number): Rng {
  return new Rng(hashCombine(seed, stream));
}

export function floorSeed(runSeed: number, floorIndex: number, attemptCounter: number): number {
  return hashCombine(runSeed, floorIndex, attemptCounter);
}

export function roomSeed(fSeed: number, roomIndex: number): number {
  return hashCombine(fSeed, roomIndex);
}

/** Non-deterministic seed for brand-new runs (allowed outside generation). */
export function freshSeed(): number {
  const buf = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(buf);
  else buf[0] = (Math.random() * 4294967296) >>> 0;
  return buf[0];
}

export function seedToString(seed: number): string {
  return seed.toString(36).toUpperCase().padStart(7, '0');
}

export function seedFromString(s: string): number | null {
  const n = parseInt(s.trim().toLowerCase(), 36);
  return Number.isFinite(n) ? n >>> 0 : null;
}
