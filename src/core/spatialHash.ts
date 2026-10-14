/**
 * Uniform-grid broad phase rebuilt every tick with a counting sort.
 * Zero allocations after construction / resize.
 */
export class SpatialHash {
  cols = 1;
  rows = 1;
  private cellStart: Int32Array = new Int32Array(2);
  private cellCount: Int32Array = new Int32Array(1);
  private cellOf: Int32Array;
  private items: Int32Array;

  constructor(
    readonly cellSize: number,
    readonly capacity: number,
  ) {
    this.cellOf = new Int32Array(capacity);
    this.items = new Int32Array(capacity);
  }

  resize(worldW: number, worldH: number): void {
    this.cols = Math.max(1, Math.ceil(worldW / this.cellSize));
    this.rows = Math.max(1, Math.ceil(worldH / this.cellSize));
    const n = this.cols * this.rows;
    if (this.cellCount.length < n) {
      this.cellCount = new Int32Array(n);
      this.cellStart = new Int32Array(n + 1);
    }
  }

  private cellIndex(x: number, y: number): number {
    let cx = (x / this.cellSize) | 0;
    let cy = (y / this.cellSize) | 0;
    if (cx < 0) cx = 0;
    else if (cx >= this.cols) cx = this.cols - 1;
    if (cy < 0) cy = 0;
    else if (cy >= this.rows) cy = this.rows - 1;
    return cy * this.cols + cx;
  }

  /** ids [0, count) where alive[id] !== 0 */
  build(count: number, xs: Float32Array, ys: Float32Array, alive: Uint8Array): void {
    const n = this.cols * this.rows;
    const cc = this.cellCount;
    const cs = this.cellStart;
    cc.fill(0, 0, n);
    for (let i = 0; i < count; i++) {
      if (!alive[i]) {
        this.cellOf[i] = -1;
        continue;
      }
      const c = this.cellIndex(xs[i], ys[i]);
      this.cellOf[i] = c;
      cc[c]++;
    }
    let sum = 0;
    for (let c = 0; c < n; c++) {
      cs[c] = sum;
      sum += cc[c];
      cc[c] = 0;
    }
    cs[n] = sum;
    for (let i = 0; i < count; i++) {
      const c = this.cellOf[i];
      if (c < 0) continue;
      this.items[cs[c] + cc[c]++] = i;
    }
  }

  /** Writes candidate ids overlapping the circle's AABB into `out`; returns count. */
  query(x: number, y: number, r: number, out: Int32Array): number {
    const cs = this.cellSize;
    let x0 = ((x - r) / cs) | 0;
    let y0 = ((y - r) / cs) | 0;
    let x1 = ((x + r) / cs) | 0;
    let y1 = ((y + r) / cs) | 0;
    if (x0 < 0) x0 = 0;
    if (y0 < 0) y0 = 0;
    if (x1 >= this.cols) x1 = this.cols - 1;
    if (y1 >= this.rows) y1 = this.rows - 1;
    let n = 0;
    const max = out.length;
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const c = cy * this.cols + cx;
        const end = this.cellStart[c + 1];
        for (let k = this.cellStart[c]; k < end && n < max; k++) out[n++] = this.items[k];
      }
    }
    return n;
  }
}
