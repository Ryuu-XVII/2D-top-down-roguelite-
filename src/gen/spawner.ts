import { CONFIG } from '../config';
import { STREAM, streamRng } from '../core/rng';
import { BOSS_FOR_FLOOR, ELITE, ENEMY_DEFS } from '../game/enemyDefs';
import { TILE_FLOOR } from './grid';
import { poissonDisc } from './poisson';
import type { RoomMap } from './room';

export interface SpawnEntry {
  /** Tile-space position (continuous). */
  x: number;
  y: number;
  def: number;
  elite: boolean;
  hpMul: number;
}

export interface SpawnPlan {
  waves: SpawnEntry[][];
  budget: number;
}

function clearAt(room: RoomMap, tx: number, ty: number, r: number): boolean {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const x = tx + dx;
      const y = ty + dy;
      if (x < 0 || y < 0 || x >= room.w || y >= room.h) return false;
      if (room.tiles[y * room.w + x] !== TILE_FLOOR) return false;
    }
  return true;
}

/**
 * Spend the room's enemy budget on the floor's spawn table and place enemies
 * with Poisson-disc sampling, at least `enemyMinDistFromSpawn` tiles away.
 */
export function planSpawns(room: RoomMap, floor: number, enemyCap: number): SpawnPlan {
  const rng = streamRng(room.seed, STREAM.enemies);
  if (room.kind === 'boss') {
    return {
      budget: 0,
      waves: [[{ x: room.feature.x + 0.5, y: room.feature.y + 0.5, def: BOSS_FOR_FLOOR[Math.min(floor, 2)], elite: false, hpMul: 1 }]],
    };
  }
  if (room.kind !== 'combat' && room.kind !== 'elite') return { budget: 0, waves: [] };

  const tier = room.kind === 'elite' ? CONFIG.roomTier.elite : CONFIG.roomTier.combat;
  const diff = CONFIG.floorDifficulty[Math.min(floor, CONFIG.floorDifficulty.length - 1)];
  const budget = CONFIG.baseBudget * diff * tier;
  const table = ENEMY_DEFS.filter((d) => d.cost > 0 && d.minFloor <= floor);
  const entries: Array<{ def: number; elite: boolean; cost: number }> = [];
  let left = budget;

  // Elite rooms lead with one or two elites.
  if (room.kind === 'elite') {
    const n = floor >= 1 ? 2 : 1;
    const strong = table.filter((d) => d.key !== 'bat');
    for (let i = 0; i < n; i++) {
      const d = strong[rng.weightedIndex(strong.map((s) => s.weight))];
      entries.push({ def: d.id, elite: true, cost: d.cost * ELITE.costMul });
      left -= d.cost * ELITE.costMul;
    }
  } else if (room.kind === 'combat' && floor >= 1 && rng.chance(0.15)) {
    const strong = table.filter((d) => d.key !== 'bat');
    const d = rng.pick(strong);
    entries.push({ def: d.id, elite: true, cost: d.cost * ELITE.costMul });
    left -= d.cost * ELITE.costMul;
  }
  for (let guard = 0; guard < 400; guard++) {
    const afford = table.filter((d) => d.cost <= left);
    if (!afford.length) break;
    const d = afford[rng.weightedIndex(afford.map((a) => a.weight))];
    // Bats come in flocks.
    const flock = d.key === 'bat' ? rng.int(2, 4) : 1;
    for (let f = 0; f < flock && d.cost <= left; f++) {
      entries.push({ def: d.id, elite: false, cost: d.cost });
      left -= d.cost;
    }
  }

  // Mobile cap: fold surplus enemies into tougher survivors.
  let hpMul = 1;
  if (entries.length > enemyCap) {
    entries.sort((a, b) => b.cost - a.cost);
    const removed = entries.splice(enemyCap);
    const removedCost = removed.reduce((s, e) => s + e.cost, 0);
    const keptCost = entries.reduce((s, e) => s + e.cost, 0);
    hpMul = 1 + (removedCost / Math.max(1, keptCost)) * (1 + CONFIG.surplusToughness);
  }
  rng.shuffle(entries);
  // Elites always arrive in the first wave (stable sort keeps the shuffle otherwise).
  entries.sort((a, b) => Number(b.elite) - Number(a.elite));

  // Placement.
  const minD = CONFIG.enemyMinDistFromSpawn;
  const pts = poissonDisc(
    rng,
    { x: 1, y: 1, w: room.w - 2, h: room.h - 2 },
    CONFIG.poissonRadius,
    (x, y) => {
      const tx = Math.floor(x);
      const ty = Math.floor(y);
      if (!clearAt(room, tx, ty, 1)) return false;
      const dx = x - (room.spawn.x + 0.5);
      const dy = y - (room.spawn.y + 0.5);
      return dx * dx + dy * dy >= minD * minD;
    },
    Math.max(entries.length * 2, 8),
  );
  rng.shuffle(pts);

  const waveCount =
    room.kind === 'combat'
      ? rng.int(CONFIG.wavesLargeRoom[0], CONFIG.wavesLargeRoom[1])
      : room.kind === 'elite'
        ? 2
        : 1;
  const waves: SpawnEntry[][] = [];
  for (let i = 0; i < waveCount; i++) waves.push([]);
  // First wave is the largest; later waves trickle in.
  const shares = waveCount === 1 ? [1] : waveCount === 2 ? [0.6, 0.4] : [0.45, 0.3, 0.25];
  let wi = 0;
  let inWave = 0;
  entries.forEach((e, i) => {
    while (wi < waveCount - 1 && inWave >= Math.ceil(entries.length * shares[wi])) {
      wi++;
      inWave = 0;
    }
    const p = pts.length ? pts[i % pts.length] : { x: room.feature.x + 0.5, y: room.feature.y + 0.5 };
    const jitter = i >= pts.length ? 0.4 : 0;
    waves[wi].push({
      x: p.x + rng.range(-jitter, jitter),
      y: p.y + rng.range(-jitter, jitter),
      def: e.def,
      elite: e.elite,
      hpMul,
    });
    inWave++;
  });
  return { budget, waves: waves.filter((w) => w.length > 0) };
}
