import type { Rng } from '../core/rng';
import { Grid, Rect, TILE_FLOOR, TILE_WALL } from './grid';

/**
 * Organic cavern smoothing inside `area` (border ring of the area stays wall):
 * random fill, then the 4/5 rule — a cell becomes wall if ≥5 of its 8
 * neighbours are walls, becomes floor if ≤3, otherwise unchanged.
 */
export function cavernize(grid: Grid, rng: Rng, area: Rect, fill: number, passes: number): void {
  const x0 = area.x + 1;
  const y0 = area.y + 1;
  const x1 = area.x + area.w - 2;
  const y1 = area.y + area.h - 2;
  if (x1 - x0 < 3 || y1 - y0 < 3) return;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid.set(x, y, rng.chance(fill) ? TILE_WALL : TILE_FLOOR);

  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const buf = new Uint8Array(w * h);
  for (let p = 0; p < passes; p++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            // Outside the area counts as wall so caverns close off cleanly.
            if (nx < x0 || ny < y0 || nx > x1 || ny > y1) walls++;
            else if (grid.get(nx, ny) === TILE_WALL) walls++;
          }
        const cur = grid.get(x, y);
        buf[(y - y0) * w + (x - x0)] = walls >= 5 ? TILE_WALL : walls <= 3 ? TILE_FLOOR : cur;
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) grid.set(x0 + x, y0 + y, buf[y * w + x]);
  }
}
