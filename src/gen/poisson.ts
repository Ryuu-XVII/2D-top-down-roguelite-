import type { Rng } from '../core/rng';
import type { Point, Rect } from './grid';

/**
 * Bridson's Poisson-disc sampling inside `area` (continuous coordinates).
 * `accept` filters candidate points (e.g. must be on a clear floor tile).
 */
export function poissonDisc(
  rng: Rng,
  area: Rect,
  radius: number,
  accept: (x: number, y: number) => boolean,
  maxPoints = Infinity,
  k = 24,
): Point[] {
  const cell = radius / Math.SQRT2;
  const cols = Math.max(1, Math.ceil(area.w / cell));
  const rows = Math.max(1, Math.ceil(area.h / cell));
  const gridIdx = new Int32Array(cols * rows).fill(-1);
  const pts: Point[] = [];
  const active: number[] = [];
  const r2 = radius * radius;

  const fits = (x: number, y: number): boolean => {
    if (x < area.x || y < area.y || x >= area.x + area.w || y >= area.y + area.h) return false;
    const cx = Math.floor((x - area.x) / cell);
    const cy = Math.floor((y - area.y) / cell);
    for (let yy = Math.max(0, cy - 2); yy <= Math.min(rows - 1, cy + 2); yy++)
      for (let xx = Math.max(0, cx - 2); xx <= Math.min(cols - 1, cx + 2); xx++) {
        const pi = gridIdx[yy * cols + xx];
        if (pi < 0) continue;
        const dx = pts[pi].x - x;
        const dy = pts[pi].y - y;
        if (dx * dx + dy * dy < r2) return false;
      }
    return accept(x, y);
  };
  const add = (x: number, y: number): void => {
    const i = pts.length;
    pts.push({ x, y });
    active.push(i);
    gridIdx[Math.floor((y - area.y) / cell) * cols + Math.floor((x - area.x) / cell)] = i;
  };

  // Seed with several random starts so disconnected floor pockets get samples.
  for (let s = 0; s < 40 && pts.length < maxPoints; s++) {
    const x = area.x + rng.next() * area.w;
    const y = area.y + rng.next() * area.h;
    if (fits(x, y)) add(x, y);
    while (active.length && pts.length < maxPoints) {
      const ai = Math.floor(rng.next() * active.length);
      const p = pts[active[ai]];
      let found = false;
      for (let t = 0; t < k; t++) {
        const a = rng.next() * Math.PI * 2;
        const d = radius * (1 + rng.next());
        const nx = p.x + Math.cos(a) * d;
        const ny = p.y + Math.sin(a) * d;
        if (fits(nx, ny)) {
          add(nx, ny);
          found = true;
          break;
        }
      }
      if (!found) {
        active[ai] = active[active.length - 1];
        active.pop();
      }
    }
  }
  return pts;
}
