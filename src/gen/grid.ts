export const TILE_WALL = 0;
export const TILE_FLOOR = 1;
export const TILE_DOOR = 2; // exit door (passable once unlocked)
export const TILE_SEALED = 3; // entrance door, sealed behind the player

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export class Grid {
  readonly tiles: Uint8Array;
  constructor(
    readonly w: number,
    readonly h: number,
    fill = TILE_WALL,
  ) {
    this.tiles = new Uint8Array(w * h).fill(fill);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): number {
    return this.inBounds(x, y) ? this.tiles[y * this.w + x] : TILE_WALL;
  }

  set(x: number, y: number, v: number): void {
    if (this.inBounds(x, y)) this.tiles[y * this.w + x] = v;
  }

  isFloor(x: number, y: number): boolean {
    const t = this.get(x, y);
    return t === TILE_FLOOR || t === TILE_DOOR;
  }

  fillRect(r: Rect, v: number): void {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) this.set(x, y, v);
  }

  /** True when every tile within Chebyshev radius `r` is floor. */
  clearance(x: number, y: number, r: number): boolean {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) if (this.get(x + dx, y + dy) !== TILE_FLOOR) return false;
    return true;
  }

  /** Flood fill over passable tiles. Returns region labels (-1 = wall). */
  floodFrom(sx: number, sy: number, passable: (t: number) => boolean = isPassable): Uint8Array {
    const seen = new Uint8Array(this.w * this.h);
    if (!passable(this.get(sx, sy))) return seen;
    const stack = new Int32Array(this.w * this.h);
    let top = 0;
    stack[top++] = sy * this.w + sx;
    seen[sy * this.w + sx] = 1;
    while (top) {
      const i = stack[--top];
      const x = i % this.w;
      const y = (i / this.w) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = x + DX4[d];
        const ny = y + DY4[d];
        if (!this.inBounds(nx, ny)) continue;
        const ni = ny * this.w + nx;
        if (seen[ni] || !passable(this.tiles[ni])) continue;
        seen[ni] = 1;
        stack[top++] = ni;
      }
    }
    return seen;
  }
}

export const DX4 = [1, -1, 0, 0];
export const DY4 = [0, 0, 1, -1];

export const isPassable = (t: number): boolean => t === TILE_FLOOR || t === TILE_DOOR;
