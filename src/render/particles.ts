import { Graphics, Particle, ParticleContainer, Rectangle, Texture, type Renderer } from 'pixi.js';
import type { ParticleKind } from '../game/fx';
import { INK } from './pen';

export const FRAME = {
  glow: 0,
  spark: 1,
  star: 2,
  smoke: 3,
  debris: 4,
  blood: 5,
  ember: 6,
  ring: 7,
  slash: 8,
} as const;
const CELL = 64;
const COLS = 3;

/** Runtime-generated particle atlas (drawn with primitives, no image files). */
export function buildParticleAtlas(renderer: Renderer): Texture[] {
  const g = new Graphics();
  const cell = (i: number) => [(i % COLS) * CELL + CELL / 2, Math.floor(i / COLS) * CELL + CELL / 2] as const;
  // glow: soft radial falloff from stacked low-alpha discs
  {
    const [x, y] = cell(FRAME.glow);
    for (let r = 30; r > 1; r -= 2) g.circle(x, y, r).fill({ color: 0xffffff, alpha: 0.06 + (1 - r / 30) * 0.05 });
  }
  {
    const [x, y] = cell(FRAME.spark);
    g.poly([x - 28, y, x, y - 5, x + 28, y, x, y + 5]).fill({ color: 0xffffff, alpha: 0.5 });
    g.poly([x - 24, y, x, y - 2.5, x + 24, y, x, y + 2.5]).fill({ color: 0xffffff });
  }
  {
    const [x, y] = cell(FRAME.star);
    g.star(x, y, 4, 26, 7).fill({ color: 0xffffff });
    g.circle(x, y, 9).fill({ color: 0xffffff, alpha: 0.6 });
  }
  {
    const [x, y] = cell(FRAME.smoke);
    g.circle(x - 9, y + 4, 15).circle(x + 10, y + 3, 14).circle(x, y - 8, 17).fill({ color: 0xffffff });
    g.circle(x - 9, y + 4, 15).circle(x + 10, y + 3, 14).circle(x, y - 8, 17).stroke({ color: INK, width: 3, alpha: 0.6 });
    g.circle(x - 5, y - 12, 6).fill({ color: 0xffffff, alpha: 0.8 });
  }
  {
    const [x, y] = cell(FRAME.debris);
    g.poly([x - 16, y + 10, x - 4, y - 16, x + 16, y - 4, x + 8, y + 14]).fill({ color: 0xffffff }).stroke({ color: INK, width: 4 });
  }
  {
    const [x, y] = cell(FRAME.blood);
    g.moveTo(x, y - 22).quadraticCurveTo(x + 16, y + 2, x, y + 16).quadraticCurveTo(x - 16, y + 2, x, y - 22).fill({ color: 0xffffff }).stroke({ color: INK, width: 3 });
  }
  {
    const [x, y] = cell(FRAME.ember);
    g.circle(x, y, 16).fill({ color: 0xffffff, alpha: 0.35 });
    g.circle(x, y, 9).fill({ color: 0xffffff });
  }
  {
    const [x, y] = cell(FRAME.ring);
    g.circle(x, y, 28).stroke({ color: 0xffffff, width: 4 });
    g.circle(x, y, 26).stroke({ color: 0xffffff, width: 4, alpha: 0.35 });
  }
  {
    const [x, y] = cell(FRAME.slash);
    // Crescent facing +x
    g.moveTo(x - 6, y - 28).quadraticCurveTo(x + 40, y, x - 6, y + 28).quadraticCurveTo(x + 18, y, x - 6, y - 28).fill({ color: 0xffffff });
  }
  const rows = Math.ceil(9 / COLS);
  const tex = renderer.generateTexture({ target: g, resolution: 2, frame: new Rectangle(0, 0, COLS * CELL, rows * CELL), antialias: true });
  g.destroy();
  const frames: Texture[] = [];
  for (let i = 0; i < 9; i++) {
    frames.push(new Texture({ source: tex.source, frame: new Rectangle((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL) }));
  }
  return frames;
}

const KIND_FRAME: Record<ParticleKind, number> = {
  glow: FRAME.glow,
  spark: FRAME.spark,
  star: FRAME.star,
  smoke: FRAME.smoke,
  debris: FRAME.debris,
  blood: FRAME.blood,
  ember: FRAME.ember,
};

export const isAdditive = (k: ParticleKind): boolean => k === 'glow' || k === 'spark' || k === 'star' || k === 'ember';

/** Dense structure-of-arrays particle pool rendered through one ParticleContainer. */
export class ParticlePool {
  readonly container: ParticleContainer;
  private readonly proxies: Particle[] = [];
  private n = 0;
  private x: Float32Array;
  private y: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private s0: Float32Array;
  private s1: Float32Array;
  private rot: Float32Array;
  private vrot: Float32Array;
  private drag: Float32Array;
  private grav: Float32Array;
  private a0: Float32Array;
  private color: Uint32Array;
  private frame: Uint8Array;
  private align: Uint8Array; // rotate to velocity

  constructor(
    private frames: Texture[],
    public capacity: number,
    additive: boolean,
  ) {
    this.container = new ParticleContainer({
      dynamicProperties: { position: true, rotation: true, vertex: true, color: true, uvs: true },
      texture: frames[0],
    });
    if (additive) this.container.blendMode = 'add';
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.s0 = new Float32Array(capacity);
    this.s1 = new Float32Array(capacity);
    this.rot = new Float32Array(capacity);
    this.vrot = new Float32Array(capacity);
    this.drag = new Float32Array(capacity);
    this.grav = new Float32Array(capacity);
    this.a0 = new Float32Array(capacity);
    this.color = new Uint32Array(capacity);
    this.frame = new Uint8Array(capacity);
    this.align = new Uint8Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.proxies.push(new Particle({ texture: frames[0], anchorX: 0.5, anchorY: 0.5 }));
    }
  }

  get count(): number {
    return this.n;
  }

  /** Shrink/grow the live budget (quality preset changes). */
  setBudget(cap: number): void {
    this.capacity = Math.min(cap, this.proxies.length);
    if (this.n > this.capacity) this.n = this.capacity;
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size0: number,
    size1: number,
    color: number,
    frame: number,
    drag = 3,
    grav = 0,
    alpha = 1,
    rot = 0,
    vrot = 0,
    align = false,
  ): void {
    if (this.n >= this.capacity) return;
    const i = this.n++;
    this.x[i] = x;
    this.y[i] = y;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.life[i] = this.maxLife[i] = life;
    this.s0[i] = size0;
    this.s1[i] = size1;
    this.color[i] = color;
    this.frame[i] = frame;
    this.drag[i] = drag;
    this.grav[i] = grav;
    this.a0[i] = alpha;
    this.rot[i] = rot;
    this.vrot[i] = vrot;
    this.align[i] = align ? 1 : 0;
  }

  spawnKind(kind: ParticleKind, x: number, y: number, vx: number, vy: number, color: number, size: number, life: number): void {
    switch (kind) {
      case 'smoke':
        this.spawn(x, y, vx, vy - 20, life, size * 0.5, size * 1.3, color, FRAME.smoke, 4, -30, 0.85, Math.random() * 6, (Math.random() - 0.5) * 2);
        break;
      case 'debris':
        this.spawn(x, y, vx, vy - 120, life, size, size * 0.6, color, FRAME.debris, 1.5, 520, 1, Math.random() * 6, (Math.random() - 0.5) * 16);
        break;
      case 'blood':
        this.spawn(x, y, vx, vy - 80, life, size, size * 0.4, color, FRAME.blood, 2, 480, 1, 0, 0, true);
        break;
      case 'spark':
        this.spawn(x, y, vx, vy, life, size, size * 0.3, color, FRAME.spark, 4, 0, 1, 0, 0, true);
        break;
      case 'star':
        this.spawn(x, y, vx, vy, life, size, 0, color, FRAME.star, 3.5, 0, 1, Math.random() * 6, (Math.random() - 0.5) * 8);
        break;
      case 'ember':
        this.spawn(x, y, vx, vy, life, size, size * 0.2, color, FRAME.ember, 1.5, -60, 1);
        break;
      default:
        this.spawn(x, y, vx, vy, life, size, size * 0.2, color, KIND_FRAME[kind], 4, 0, 0.9);
    }
  }

  update(dt: number): void {
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.swapRemove(i);
        continue;
      }
      const f = Math.exp(-this.drag[i] * dt);
      this.vx[i] *= f;
      this.vy[i] = this.vy[i] * f + this.grav[i] * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.rot[i] += this.vrot[i] * dt;
      i++;
    }
    const pc = this.container;
    const kids = pc.particleChildren;
    for (let k = 0; k < this.n; k++) {
      const p = this.proxies[k];
      const t = this.life[k] / this.maxLife[k];
      const s = (this.s1[k] + (this.s0[k] - this.s1[k]) * t) / 32;
      p.x = this.x[k];
      p.y = this.y[k];
      p.scaleX = this.align[k] ? s * 1.4 : s;
      p.scaleY = s;
      p.rotation = this.align[k] ? Math.atan2(this.vy[k], this.vx[k]) : this.rot[k];
      p.tint = this.color[k];
      p.alpha = this.a0[k] * (t < 0.6 ? t / 0.6 : 1);
      p.texture = this.frames[this.frame[k]];
      kids[k] = p;
    }
    if (kids.length !== this.n) {
      kids.length = this.n;
    }
    pc.update();
  }

  clear(): void {
    this.n = 0;
  }

  private swapRemove(i: number): void {
    const j = --this.n;
    if (i === j) return;
    this.x[i] = this.x[j];
    this.y[i] = this.y[j];
    this.vx[i] = this.vx[j];
    this.vy[i] = this.vy[j];
    this.life[i] = this.life[j];
    this.maxLife[i] = this.maxLife[j];
    this.s0[i] = this.s0[j];
    this.s1[i] = this.s1[j];
    this.rot[i] = this.rot[j];
    this.vrot[i] = this.vrot[j];
    this.drag[i] = this.drag[j];
    this.grav[i] = this.grav[j];
    this.a0[i] = this.a0[j];
    this.color[i] = this.color[j];
    this.frame[i] = this.frame[j];
    this.align[i] = this.align[j];
  }
}
