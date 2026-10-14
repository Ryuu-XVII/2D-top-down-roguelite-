import { DX4, DY4, Grid, TILE_WALL } from './grid';

/** Min-heap keyed by float priority, storing integer node ids. */
class Heap {
  private ids: Int32Array;
  private keys: Float64Array;
  size = 0;
  constructor(cap: number) {
    this.ids = new Int32Array(cap);
    this.keys = new Float64Array(cap);
  }
  push(id: number, key: number): void {
    if (this.size >= this.ids.length) {
      const ni = new Int32Array(this.ids.length * 2);
      ni.set(this.ids);
      this.ids = ni;
      const nk = new Float64Array(this.keys.length * 2);
      nk.set(this.keys);
      this.keys = nk;
    }
    let i = this.size++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= key) break;
      this.ids[i] = this.ids[p];
      this.keys[i] = this.keys[p];
      i = p;
    }
    this.ids[i] = id;
    this.keys[i] = key;
  }
  pop(): number {
    const top = this.ids[0];
    const lastId = this.ids[--this.size];
    const lastKey = this.keys[this.size];
    let i = 0;
    for (;;) {
      let c = i * 2 + 1;
      if (c >= this.size) break;
      if (c + 1 < this.size && this.keys[c + 1] < this.keys[c]) c++;
      if (this.keys[c] >= lastKey) break;
      this.ids[i] = this.ids[c];
      this.keys[i] = this.keys[c];
      i = c;
    }
    this.ids[i] = lastId;
    this.keys[i] = lastKey;
    return top;
  }
}

export interface AStarCosts {
  wall: number;
  floor: number;
}

/**
 * A* over a weighted cost grid: solid wall = high cost, existing floor = low
 * cost, so corridors reuse open space instead of tunnelling in parallel.
 * The outermost ring of tiles is never entered. Returns tile indices from
 * start to goal (inclusive), or null.
 */
export function astar(
  grid: Grid,
  sx: number,
  sy: number,
  gx: number,
  gy: number,
  costs: AStarCosts,
  allowBorder = false,
): number[] | null {
  const { w, h } = grid;
  const n = w * h;
  const g = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new Heap(256);
  const start = sy * w + sx;
  const goal = gy * w + gx;
  g[start] = 0;
  heap.push(start, 0);
  while (heap.size) {
    const cur = heap.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % w;
    const cy = (cur / w) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DX4[d];
      const ny = cy + DY4[d];
      const isGoal = nx === gx && ny === gy;
      if (!allowBorder && !isGoal && (nx <= 0 || ny <= 0 || nx >= w - 1 || ny >= h - 1)) continue;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (closed[ni]) continue;
      const step = grid.tiles[ni] === TILE_WALL ? costs.wall : costs.floor;
      const ng = g[cur] + step;
      if (ng < g[ni]) {
        g[ni] = ng;
        from[ni] = cur;
        const hx = Math.abs(nx - gx) + Math.abs(ny - gy);
        heap.push(ni, ng + hx * costs.floor);
      }
    }
  }
  if (from[goal] < 0 && goal !== start) return null;
  const path: number[] = [];
  for (let c = goal; c !== -1; c = from[c]) {
    path.push(c);
    if (c === start) break;
  }
  return path.reverse();
}

/** Carve a path with a square brush of the given width. */
export function carvePath(grid: Grid, path: number[], width: number, value: number, mark?: Uint8Array): void {
  const lo = -Math.floor((width - 1) / 2);
  const hi = lo + width - 1;
  for (const i of path) {
    const x = i % grid.w;
    const y = (i / grid.w) | 0;
    for (let dy = lo; dy <= hi; dy++)
      for (let dx = lo; dx <= hi; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px <= 0 || py <= 0 || px >= grid.w - 1 || py >= grid.h - 1) continue;
        const t = grid.get(px, py);
        if (t === TILE_WALL) grid.set(px, py, value);
        if (mark) mark[py * grid.w + px] = 1;
      }
  }
}
