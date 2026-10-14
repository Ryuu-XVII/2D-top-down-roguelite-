import { describe, expect, it } from 'vitest';
import { floorSeed, hashCombine, roomSeed, Rng } from '../src/core/rng';
import { generateFloorGraph, reachableFrom } from '../src/gen/graph';
import { TILE_DOOR, TILE_FLOOR, Grid, isPassable } from '../src/gen/grid';
import { generateRoom, type RoomKind } from '../src/gen/room';
import { planSpawns } from '../src/gen/spawner';
import { rollRoomLoot } from '../src/gen/loot';
import { poissonDisc } from '../src/gen/poisson';
import { CONFIG } from '../src/config';

function floorFingerprint(runSeed: number, floor: number, attempt: number): string {
  const fs = floorSeed(runSeed, floor, attempt);
  const g = generateFloorGraph(fs);
  const parts = [g.nodes.map((n) => n.type[0] + n.next.join('.')).join('|')];
  for (const n of g.nodes.slice(0, 3)) {
    const r = generateRoom(roomSeed(fs, n.id), n.type, n.next, floor);
    let h = 0;
    for (let i = 0; i < r.tiles.length; i++) h = (Math.imul(h, 31) + r.tiles[i]) | 0;
    parts.push(String(h));
  }
  return parts.join('#');
}

describe('seeded rng & hashing', () => {
  it('is deterministic', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    for (let i = 0; i < 100; i++) expect(a.nextU32()).toBe(b.nextU32());
  });
  it('hashCombine separates floor/attempt permutations', () => {
    expect(hashCombine(7, 1, 2)).not.toBe(hashCombine(7, 2, 1));
    const seen = new Set<number>();
    for (let f = 0; f < 20; f++) for (let a = 0; a < 20; a++) seen.add(floorSeed(42, f, a));
    expect(seen.size).toBe(400);
  });
});

describe('floor graph', () => {
  it('satisfies all structural constraints across many seeds', () => {
    for (let s = 0; s < 600; s++) {
      const g = generateFloorGraph(hashCombine(s, 99));
      const cols = g.columns.length;
      expect(cols).toBeGreaterThanOrEqual(CONFIG.graphColumnsMin);
      expect(cols).toBeLessThanOrEqual(CONFIG.graphColumnsMax);
      for (let c = 1; c < cols - 1; c++) {
        expect(g.columns[c].length).toBeGreaterThanOrEqual(2);
        expect(g.columns[c].length).toBeLessThanOrEqual(3);
      }
      for (const id of g.columns[1]) expect(g.nodes[id].type).toBe('combat');
      expect(g.nodes.some((n) => n.type === 'shop')).toBe(true);
      expect(g.nodes.some((n) => n.type === 'rest')).toBe(true);
      expect(g.columns[cols - 2].some((id) => g.nodes[id].type === 'rest')).toBe(true);
      for (const n of g.nodes) {
        if (n.type === 'elite') for (const m of n.next) expect(g.nodes[m].type).not.toBe('elite');
        if (n.type !== 'start') expect(n.prev.length).toBeGreaterThan(0);
        if (n.type !== 'boss') expect(n.next.length).toBeGreaterThan(0);
      }
      expect(reachableFrom(g, g.startId).size).toBe(g.nodes.length);
    }
  }, 30_000);
});

describe('room generation', () => {
  const kinds: RoomKind[] = ['start', 'combat', 'elite', 'event', 'shop', 'rest', 'boss'];

  it('every room is fully connected from spawn to all exits', () => {
    for (let s = 0; s < 120; s++) {
      for (const kind of kinds) {
        const exits = kind === 'boss' ? [] : [1, 2, 3].slice(0, 1 + (s % 3));
        const r = generateRoom(hashCombine(s, kind.length), kind, exits, s % 3);
        const g = new Grid(r.w, r.h);
        g.tiles.set(r.tiles);
        const reach = g.floodFrom(r.spawn.x, r.spawn.y);
        for (let i = 0; i < r.tiles.length; i++) if (isPassable(r.tiles[i])) expect(reach[i]).toBe(1);
        expect(r.exits.length).toBe(exits.length);
        for (const e of r.exits) {
          expect(r.tiles[e.y * r.w + e.x]).toBe(TILE_DOOR);
          expect(reach[e.y * r.w + e.x]).toBe(1);
        }
        // Spawn has more than one tile of wall clearance.
        expect(g.clearance(r.spawn.x, r.spawn.y, 1)).toBe(true);
        expect(r.tiles[r.feature.y * r.w + r.feature.x]).toBe(TILE_FLOOR);
      }
    }
  }, 60_000);

  it('same seed reproduces the same floor; a new attempt changes it', () => {
    for (let s = 0; s < 25; s++) {
      expect(floorFingerprint(s, 0, 0)).toBe(floorFingerprint(s, 0, 0));
      expect(floorFingerprint(s, 1, 3)).toBe(floorFingerprint(s, 1, 3));
      expect(floorFingerprint(s, 0, 1)).not.toBe(floorFingerprint(s, 0, 0));
    }
  }, 60_000);
});

describe('spawning & loot', () => {
  it('places enemies on floor, away from the player spawn', () => {
    for (let s = 0; s < 80; s++) {
      const r = generateRoom(hashCombine(s, 5), s % 4 === 0 ? 'elite' : 'combat', [1, 2], s % 3);
      const plan = planSpawns(r, s % 3, 150);
      const all = plan.waves.flat();
      expect(all.length).toBeGreaterThan(0);
      for (const e of all) {
        const tx = Math.floor(e.x);
        const ty = Math.floor(e.y);
        expect(r.tiles[ty * r.w + tx]).toBe(TILE_FLOOR);
        const d = Math.hypot(e.x - (r.spawn.x + 0.5), e.y - (r.spawn.y + 0.5));
        // Jittered overflow points may drift slightly; poisson points honour the rule.
        expect(d).toBeGreaterThan(CONFIG.enemyMinDistFromSpawn - 0.6);
      }
    }
  });

  it('respects the enemy cap by folding surplus into toughness', () => {
    const r = generateRoom(77, 'combat', [1], 2);
    const plan = planSpawns(r, 2, 4);
    const all = plan.waves.flat();
    expect(all.length).toBeLessThanOrEqual(4);
    expect(all[0].hpMul).toBeGreaterThan(1);
  });

  it('poisson samples keep their minimum distance', () => {
    const pts = poissonDisc(new Rng(5), { x: 0, y: 0, w: 40, h: 30 }, 2, () => true);
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThanOrEqual(2 - 1e-9);
  });

  it('loot lands on floor tiles and is deterministic', () => {
    const r = generateRoom(1001, 'elite', [1], 1);
    const a = rollRoomLoot(r, 1, r.feature.x, r.feature.y);
    const b = rollRoomLoot(r, 1, r.feature.x, r.feature.y);
    expect(a).toEqual(b);
    expect(a.some((d) => d.kind === 'chest')).toBe(true);
    for (const d of a) expect(r.tiles[Math.floor(d.y) * r.w + Math.floor(d.x)]).toBe(TILE_FLOOR);
  });
});
