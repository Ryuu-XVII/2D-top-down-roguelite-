import { CONFIG } from '../config';
import { Rng, STREAM, hashCombine } from '../core/rng';
import { astar, carvePath } from './astar';
import { bspLeaves, buildBsp, carveRoomRect, type BspNode } from './bsp';
import { cavernize } from './cellular';
import { DX4, DY4, Grid, Point, Rect, TILE_DOOR, TILE_FLOOR, TILE_SEALED, TILE_WALL, isPassable } from './grid';
import type { NodeType } from './graph';

export type RoomKind = NodeType;

export interface DoorInfo {
  /** Door centre tile (on the room edge). */
  x: number;
  y: number;
  side: 'W' | 'E';
  /** Graph node this door leads to (-1 for the sealed entrance). */
  target: number;
}

export type DecorKind =
  | 'torch'
  | 'window'
  | 'banner'
  | 'chains'
  | 'candelabra'
  | 'bones'
  | 'skull'
  | 'cobweb'
  | 'crack'
  | 'pillar'
  | 'coffin'
  | 'puddle';

export interface Decor {
  kind: DecorKind;
  x: number; // tile coords
  y: number;
  v: number; // variant 0..1
}

export interface RoomMap {
  kind: RoomKind;
  seed: number;
  w: number;
  h: number;
  tiles: Uint8Array;
  carpet: Uint8Array;
  spawn: Point;
  entrance: DoorInfo | null;
  exits: DoorInfo[];
  /** Feature point for NPCs, shrines, the boss and the floor portal. */
  feature: Point;
  decor: Decor[];
}

function sizeFor(kind: RoomKind): { w: number; h: number } {
  switch (kind) {
    case 'combat':
      return CONFIG.room.combat;
    case 'elite':
      return CONFIG.room.elite;
    case 'boss':
      return CONFIG.room.boss;
    default:
      return CONFIG.room.small;
  }
}

/** Nearest floor tile to (x, y) within `r` (ring search). */
function nearestFloor(grid: Grid, x: number, y: number, r = 40): Point | null {
  if (grid.get(x, y) === TILE_FLOOR) return { x, y };
  for (let d = 1; d <= r; d++) {
    for (let dy = -d; dy <= d; dy++)
      for (let dx = -d; dx <= d; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
        if (grid.get(x + dx, y + dy) === TILE_FLOOR) return { x: x + dx, y: y + dy };
      }
  }
  return null;
}

/** Label connected floor regions; returns labels (0 = none) and region sizes. */
function labelRegions(grid: Grid): { labels: Int32Array; sizes: number[]; seeds: number[] } {
  const { w, h } = grid;
  const labels = new Int32Array(w * h);
  const sizes: number[] = [0];
  const seeds: number[] = [-1];
  const stack = new Int32Array(w * h);
  let next = 1;
  for (let i = 0; i < w * h; i++) {
    if (labels[i] || !isPassable(grid.tiles[i])) continue;
    let top = 0;
    stack[top++] = i;
    labels[i] = next;
    let size = 0;
    while (top) {
      const c = stack[--top];
      size++;
      const cx = c % w;
      const cy = (c / w) | 0;
      for (let d = 0; d < 4; d++) {
        const nx = cx + DX4[d];
        const ny = cy + DY4[d];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (labels[ni] || !isPassable(grid.tiles[ni])) continue;
        labels[ni] = next;
        stack[top++] = ni;
      }
    }
    sizes.push(size);
    seeds.push(i);
    next++;
  }
  return { labels, sizes, seeds };
}

const COSTS = { wall: CONFIG.astarWallCost, floor: CONFIG.astarFloorCost };

function connectSubtrees(grid: Grid, rng: Rng, node: BspNode, anchors: Map<BspNode, Point>): Point[] {
  if (!node.left || !node.right) {
    const a = anchors.get(node);
    return a ? [a] : [];
  }
  const L = connectSubtrees(grid, rng, node.left, anchors);
  const R = connectSubtrees(grid, rng, node.right, anchors);
  if (L.length && R.length) {
    // Join the closest pair of anchors so corridors stay short and natural.
    let best: [Point, Point] = [L[0], R[0]];
    let bd = Infinity;
    for (const a of L)
      for (const b of R) {
        const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (d < bd) {
          bd = d;
          best = [a, b];
        }
      }
    const path = astar(grid, best[0].x, best[0].y, best[1].x, best[1].y, COSTS);
    if (path) carvePath(grid, path, rng.int(CONFIG.corridorWidthMin, CONFIG.corridorWidthMax), TILE_FLOOR);
  }
  return L.concat(R);
}

function pickSpawn(grid: Grid, rng: Rng, maxX: number): Point {
  for (const r of [CONFIG.spawnClearance, 1]) {
    const cands: Point[] = [];
    for (let y = 2; y < grid.h - 2; y++)
      for (let x = 2; x < maxX; x++) if (grid.clearance(x, y, r)) cands.push({ x, y });
    if (cands.length) return rng.pick(cands);
  }
  // Last resort: carve a clearing on the left side.
  const c = { x: Math.min(5, grid.w - 4), y: grid.h >> 1 };
  grid.fillRect({ x: c.x - 2, y: c.y - 2, w: 5, h: 5 }, TILE_FLOOR);
  return c;
}

/** Ensure every floor region connects to the spawn region (connect or fill). */
function validateConnectivity(grid: Grid, spawn: Point): void {
  for (let iter = 0; iter < 64; iter++) {
    const { labels, sizes, seeds } = labelRegions(grid);
    const main = labels[spawn.y * grid.w + spawn.x];
    let changed = false;
    for (let r = 1; r < sizes.length; r++) {
      if (r === main) continue;
      changed = true;
      if (sizes[r] < 10) {
        for (let i = 0; i < labels.length; i++) if (labels[i] === r) grid.tiles[i] = TILE_WALL;
        continue;
      }
      const s = seeds[r];
      const path = astar(grid, s % grid.w, (s / grid.w) | 0, spawn.x, spawn.y, COSTS);
      if (path) carvePath(grid, path, 2, TILE_FLOOR);
      else for (let i = 0; i < labels.length; i++) if (labels[i] === r) grid.tiles[i] = TILE_WALL;
      break; // relabel after each carve
    }
    if (!changed) return;
  }
}

function placeDoor(grid: Grid, side: 'W' | 'E', y: number, spawn: Point, carpet: Uint8Array, target: number): DoorInfo {
  const x = side === 'W' ? 0 : grid.w - 1;
  const inner = side === 'W' ? 1 : grid.w - 2;
  const path = astar(grid, inner, y, spawn.x, spawn.y, COSTS);
  if (path) {
    carvePath(grid, path, 3, TILE_FLOOR);
    carvePath(grid, path, 1, TILE_FLOOR, carpet);
  }
  for (let dy = -1; dy <= 1; dy++) {
    grid.set(x, y + dy, side === 'W' ? TILE_SEALED : TILE_DOOR);
    grid.set(inner, y + dy, TILE_FLOOR);
  }
  return { x, y, side, target };
}

function decorate(grid: Grid, rng: Rng, carpet: Uint8Array, kind: RoomKind, floorIndex: number): Decor[] {
  const out: Decor[] = [];
  const { w, h } = grid;
  let sinceTorch = 3;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const t = grid.get(x, y);
      if (t === TILE_WALL && grid.get(x, y + 1) === TILE_FLOOR) {
        // North wall face: torches, gothic windows, banners, chains.
        sinceTorch++;
        const wide = grid.get(x - 1, y) === TILE_WALL && grid.get(x + 1, y) === TILE_WALL;
        if (sinceTorch >= 5 && rng.chance(0.55)) {
          out.push({ kind: 'torch', x, y, v: rng.next() });
          sinceTorch = 0;
        } else if (wide && rng.chance(0.07)) out.push({ kind: 'window', x, y, v: rng.next() });
        else if (wide && rng.chance(0.05)) out.push({ kind: 'banner', x, y, v: rng.next() });
        else if (rng.chance(0.03)) out.push({ kind: 'chains', x, y, v: rng.next() });
      } else if (t === TILE_WALL && grid.get(x, y + 1) !== TILE_FLOOR) {
        sinceTorch = 3;
      }
      if (t !== TILE_FLOOR) continue;
      const onCarpet = carpet[y * w + x] === 1;
      const n = grid.get(x, y - 1) === TILE_WALL;
      const wl = grid.get(x - 1, y) === TILE_WALL;
      const e = grid.get(x + 1, y) === TILE_WALL;
      if (n && (wl || e) && rng.chance(0.45)) out.push({ kind: 'cobweb', x, y, v: wl ? 0 : 1 });
      else if (!onCarpet && rng.chance(0.025)) out.push({ kind: floorIndex === 1 ? 'skull' : 'bones', x, y, v: rng.next() });
      else if (!onCarpet && rng.chance(0.02)) out.push({ kind: 'crack', x, y, v: rng.next() });
      else if (!onCarpet && floorIndex === 1 && rng.chance(0.006) && grid.clearance(x, y, 1))
        out.push({ kind: 'coffin', x, y, v: rng.next() });
      else if (!onCarpet && floorIndex !== 1 && rng.chance(0.004) && grid.clearance(x, y, 1))
        out.push({ kind: 'puddle', x, y, v: rng.next() });
      else if (!onCarpet && kind !== 'boss' && rng.chance(0.006) && grid.clearance(x, y, 2))
        out.push({ kind: 'candelabra', x, y, v: rng.next() });
    }
  }
  return out;
}

/** Add free-standing pillars inside large open areas (keeps connectivity). */
function addPillars(grid: Grid, rng: Rng, rects: Rect[], carpet: Uint8Array, decor: Decor[], spawn: Point): void {
  for (const r of rects) {
    if (r.w < 11 || r.h < 9 || !rng.chance(0.6)) continue;
    const px = [r.x + 2, r.x + r.w - 3];
    const py = [r.y + 2, r.y + r.h - 3];
    for (const x of px)
      for (const y of py) {
        if (carpet[y * grid.w + x] || !grid.clearance(x, y, 1)) continue;
        if (Math.abs(x - spawn.x) <= 3 && Math.abs(y - spawn.y) <= 3) continue;
        grid.set(x, y, TILE_WALL);
        decor.push({ kind: 'pillar', x, y, v: rng.next() });
      }
  }
}

export function generateRoom(seed: number, kind: RoomKind, exitTargets: number[], floorIndex: number): RoomMap {
  const rng = new Rng(hashCombine(seed, STREAM.layout));
  const { w, h } = sizeFor(kind);
  const grid = new Grid(w, h, TILE_WALL);
  const carpet = new Uint8Array(w * h);
  const decorExtra: Decor[] = [];
  let feature: Point;
  let spawn: Point;
  const openRects: Rect[] = [];

  if (kind === 'boss') {
    // Grand octagonal arena with four pillars for cover.
    const m = 3;
    for (let y = m; y < h - m; y++)
      for (let x = m; x < w - m; x++) {
        const cx = Math.min(x - m, w - m - 1 - x);
        const cy = Math.min(y - m, h - m - 1 - y);
        if (cx + cy >= 5) grid.set(x, y, TILE_FLOOR);
      }
    feature = { x: (w * 0.6) | 0, y: h >> 1 };
    const pil = [
      [0.33, 0.3],
      [0.67, 0.3],
      [0.33, 0.7],
      [0.67, 0.7],
    ];
    for (const [fx, fy] of pil) {
      const x = Math.round(w * fx);
      const y = Math.round(h * fy);
      grid.fillRect({ x, y, w: 2, h: 2 }, TILE_WALL);
      decorExtra.push({ kind: 'pillar', x, y, v: rng.next() });
    }
    spawn = { x: 6, y: h >> 1 };
    grid.fillRect({ x: 4, y: spawn.y - 2, w: 5, h: 5 }, TILE_FLOOR);
  } else {
    // 1. Space division (BSP) + 3. cavern sectors.
    const root = buildBsp(rng, { x: 1, y: 1, w: w - 2, h: h - 2 }, CONFIG.bspMinLeaf, CONFIG.bspMaxDepth);
    const leaves = bspLeaves(root);
    const anchors = new Map<BspNode, Point>();
    for (const leaf of leaves) {
      const cavern = leaves.length > 1 && rng.chance(CONFIG.cavernFraction);
      leaf.cavern = cavern;
      if (cavern) {
        cavernize(grid, rng, leaf.rect, CONFIG.cavernFill, CONFIG.cavernPasses);
        const c = { x: leaf.rect.x + (leaf.rect.w >> 1), y: leaf.rect.y + (leaf.rect.h >> 1) };
        let a = nearestFloor(grid, c.x, c.y, Math.max(leaf.rect.w, leaf.rect.h));
        if (!a || a.x < leaf.rect.x || a.y < leaf.rect.y || a.x >= leaf.rect.x + leaf.rect.w || a.y >= leaf.rect.y + leaf.rect.h) {
          grid.fillRect({ x: c.x - 1, y: c.y - 1, w: 3, h: 3 }, TILE_FLOOR);
          a = c;
        }
        anchors.set(leaf, a);
      } else {
        const r = carveRoomRect(rng, leaf.rect, CONFIG.roomMinSize, CONFIG.roomPadding);
        leaf.room = r;
        grid.fillRect(r, TILE_FLOOR);
        openRects.push(r);
        anchors.set(leaf, { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });
      }
    }
    // 2. Corridor connectivity, bottom-up through the tree.
    connectSubtrees(grid, rng, root, anchors);

    // Small utility rooms get a central hub chamber for the NPC / shrine.
    if (kind !== 'combat' && kind !== 'elite') {
      const hub: Rect = { x: (w >> 1) - 6, y: (h >> 1) - 4, w: 12, h: 8 };
      grid.fillRect(hub, TILE_FLOOR);
      feature = { x: w >> 1, y: h >> 1 };
    } else {
      feature = { x: w >> 1, y: h >> 1 };
    }
    spawn = pickSpawn(grid, rng, Math.max(6, Math.floor(w * 0.3)));
  }

  // 4. Connectivity validation from the spawn tile.
  validateConnectivity(grid, spawn);

  // 5. Exits: sealed entrance on the west, one door per outgoing edge on the east.
  const entrance =
    kind === 'start' ? null : placeDoor(grid, 'W', Math.min(h - 4, Math.max(3, spawn.y)), spawn, carpet, -1);
  const exits: DoorInfo[] = [];
  const n = exitTargets.length;
  for (let i = 0; i < n; i++) {
    const y = Math.min(h - 4, Math.max(3, Math.round(((i + 1) * h) / (n + 1))));
    exits.push(placeDoor(grid, 'E', y, spawn, carpet, exitTargets[i]));
  }
  if (kind !== 'combat' && kind !== 'elite' && kind !== 'boss') {
    const p = astar(grid, spawn.x, spawn.y, feature.x, feature.y, COSTS);
    if (p) carvePath(grid, p, 1, TILE_FLOOR, carpet);
  }

  // Final guarantee: everything passable is reachable from spawn.
  const reach = grid.floodFrom(spawn.x, spawn.y);
  for (let i = 0; i < grid.tiles.length; i++) {
    if (grid.tiles[i] === TILE_FLOOR && !reach[i]) grid.tiles[i] = TILE_WALL;
  }

  if (kind === 'combat' || kind === 'elite') addPillars(grid, rng, openRects, carpet, decorExtra, spawn);
  const decor = decorExtra.concat(decorate(grid, rng, carpet, kind, floorIndex));
  // Keep the feature point on a walkable tile.
  const f = nearestFloor(grid, feature.x, feature.y) ?? spawn;

  return { kind, seed, w, h, tiles: grid.tiles, carpet, spawn, entrance, exits, feature: f, decor };
}

/** Rebuild a Grid view over a RoomMap's tiles (shares the buffer). */
export function gridOf(room: RoomMap): Grid {
  const g = new Grid(room.w, room.h);
  g.tiles.set(room.tiles);
  return g;
}
