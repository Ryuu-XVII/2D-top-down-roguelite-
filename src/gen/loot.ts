import { STREAM, hashCombine, Rng } from '../core/rng';
import { TILE_FLOOR } from './grid';
import { poissonDisc } from './poisson';
import type { RoomMap } from './room';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type LootKind = 'chest' | 'scrap' | 'shrine' | 'heart';

export interface LootDrop {
  kind: LootKind;
  /** Tile-space position. */
  x: number;
  y: number;
  amount: number;
  rarity: Rarity;
  /** Deterministic roll used to choose chest contents. */
  roll: number;
}

export function rollRarity(rng: Rng, luck = 0): Rarity {
  const r = rng.next() - luck;
  if (r < 0.05) return 'epic';
  if (r < 0.2) return 'rare';
  if (r < 0.5) return 'uncommon';
  return 'common';
}

/** Roll the drop table for a cleared room and place drops with Poisson spacing. */
export function rollRoomLoot(room: RoomMap, floor: number, clearX: number, clearY: number): LootDrop[] {
  const rng = new Rng(hashCombine(room.seed, STREAM.loot));
  const drops: Omit<LootDrop, 'x' | 'y'>[] = [];
  const elite = room.kind === 'elite';
  if (elite || room.kind === 'boss' || rng.chance(0.3)) {
    drops.push({ kind: 'chest', amount: 1, rarity: rollRarity(rng, elite ? 0.15 : room.kind === 'boss' ? 0.3 : 0), roll: rng.next() });
  }
  const piles = rng.int(2, 4) + floor + (elite ? 2 : 0);
  for (let i = 0; i < piles; i++) drops.push({ kind: 'scrap', amount: rng.int(2, 5) + floor * 2, rarity: 'common', roll: 0 });
  if (room.kind === 'combat' && rng.chance(0.1)) drops.push({ kind: 'shrine', amount: 1, rarity: 'rare', roll: rng.next() });
  if (rng.chance(0.3)) drops.push({ kind: 'heart', amount: 1, rarity: 'common', roll: 0 });

  const R = 8;
  const area = { x: Math.max(1, clearX - R), y: Math.max(1, clearY - R), w: R * 2, h: R * 2 };
  const ok = (x: number, y: number): boolean => {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = tx + dx;
        const yy = ty + dy;
        if (xx < 0 || yy < 0 || xx >= room.w || yy >= room.h || room.tiles[yy * room.w + xx] !== TILE_FLOOR) return false;
      }
    return true;
  };
  let pts = poissonDisc(rng, area, 1.7, ok, drops.length);
  if (pts.length < drops.length) {
    // Fall back to the whole room if the clear point is cramped.
    pts = pts.concat(poissonDisc(rng, { x: 1, y: 1, w: room.w - 2, h: room.h - 2 }, 1.7, ok, drops.length - pts.length));
  }
  const out: LootDrop[] = [];
  drops.forEach((d, i) => {
    const p = pts[i] ?? { x: clearX + 0.5, y: clearY + 0.5 };
    out.push({ ...d, x: p.x, y: p.y });
  });
  return out;
}
