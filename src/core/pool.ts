/**
 * Stable-index slot allocator backing the structure-of-arrays pools.
 * Indices stay valid while alive so they can be referenced from the spatial
 * hash and from other entities (homing targets, chain lightning, …).
 */
export class Slots {
  readonly alive: Uint8Array;
  private readonly free: Int32Array;
  private freeTop = 0;
  /** One past the highest index ever handed out since the last reset. */
  high = 0;
  count = 0;

  constructor(readonly capacity: number) {
    this.alive = new Uint8Array(capacity);
    this.free = new Int32Array(capacity);
  }

  alloc(): number {
    let i: number;
    if (this.freeTop > 0) i = this.free[--this.freeTop];
    else if (this.high < this.capacity) i = this.high++;
    else return -1;
    this.alive[i] = 1;
    this.count++;
    return i;
  }

  release(i: number): void {
    if (!this.alive[i]) return;
    this.alive[i] = 0;
    this.free[this.freeTop++] = i;
    this.count--;
  }

  reset(): void {
    this.alive.fill(0);
    this.freeTop = 0;
    this.high = 0;
    this.count = 0;
  }
}
