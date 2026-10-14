import { POOLS } from '../config';
import { Slots } from '../core/pool';

// Structure-of-arrays component storage. Entities are slot indices.

export class EnemyStore {
  readonly slots = new Slots(POOLS.enemies);
  readonly x = new Float32Array(POOLS.enemies);
  readonly y = new Float32Array(POOLS.enemies);
  readonly px = new Float32Array(POOLS.enemies);
  readonly py = new Float32Array(POOLS.enemies);
  readonly vx = new Float32Array(POOLS.enemies);
  readonly vy = new Float32Array(POOLS.enemies);
  readonly kbx = new Float32Array(POOLS.enemies); // knockback velocity
  readonly kby = new Float32Array(POOLS.enemies);
  readonly hp = new Float32Array(POOLS.enemies);
  readonly maxHp = new Float32Array(POOLS.enemies);
  readonly dmg = new Float32Array(POOLS.enemies);
  readonly speed = new Float32Array(POOLS.enemies);
  readonly radius = new Float32Array(POOLS.enemies);
  readonly def = new Uint8Array(POOLS.enemies);
  readonly elite = new Uint8Array(POOLS.enemies);
  readonly state = new Uint8Array(POOLS.enemies);
  readonly t = new Float32Array(POOLS.enemies); // state timer
  readonly fireT = new Float32Array(POOLS.enemies);
  readonly stun = new Float32Array(POOLS.enemies);
  readonly flash = new Float32Array(POOLS.enemies);
  readonly burnDps = new Float32Array(POOLS.enemies);
  readonly burnT = new Float32Array(POOLS.enemies);
  readonly orbitHitT = new Float32Array(POOLS.enemies);
  readonly scytheHitT = new Float32Array(POOLS.enemies);
  readonly spawnT = new Float32Array(POOLS.enemies);
  readonly phase = new Float32Array(POOLS.enemies); // animation offset
  readonly facing = new Int8Array(POOLS.enemies);
  readonly dirX = new Float32Array(POOLS.enemies); // charge direction etc.
  readonly dirY = new Float32Array(POOLS.enemies);
  readonly aux = new Float32Array(POOLS.enemies);
  readonly hitStamp = new Int32Array(POOLS.enemies); // dedupe multi-hit sweeps

  reset(): void {
    this.slots.reset();
  }
}

export const PROJ = {
  ORB: 0,
  DAGGER: 1,
  SHARD: 2,
  CROSS: 3,
  AXE: 4,
  FLASK: 5,
  WAVE: 6,
  ARROW: 10,
  FIREBALL: 11,
  RUNE: 12,
  BLOOD: 13,
  BONE: 14,
} as const;

export const PF_SHARD = 1; // cannot fork again
export const PF_HOMING = 2;
export const PF_RETURN = 4; // boomerang
export const PF_WALLPASS = 8;
export const PF_FORCE_CRIT = 16;
export const PF_LOB = 32; // lands at target then bursts

export class ProjectileStore {
  readonly slots = new Slots(POOLS.projectiles);
  readonly x = new Float32Array(POOLS.projectiles);
  readonly y = new Float32Array(POOLS.projectiles);
  readonly px = new Float32Array(POOLS.projectiles);
  readonly py = new Float32Array(POOLS.projectiles);
  readonly vx = new Float32Array(POOLS.projectiles);
  readonly vy = new Float32Array(POOLS.projectiles);
  readonly life = new Float32Array(POOLS.projectiles);
  readonly age = new Float32Array(POOLS.projectiles);
  readonly dmg = new Float32Array(POOLS.projectiles);
  readonly radius = new Float32Array(POOLS.projectiles);
  readonly kind = new Uint8Array(POOLS.projectiles);
  readonly team = new Uint8Array(POOLS.projectiles); // 0 player, 1 enemy
  readonly pierce = new Int16Array(POOLS.projectiles);
  readonly flags = new Uint8Array(POOLS.projectiles);
  readonly lastHit = new Int16Array(POOLS.projectiles);
  readonly spin = new Float32Array(POOLS.projectiles);
  readonly tx = new Float32Array(POOLS.projectiles); // lob target / boomerang origin
  readonly ty = new Float32Array(POOLS.projectiles);

  reset(): void {
    this.slots.reset();
  }
}

export const PICK = { SOUL: 0, SCRAP: 1, HEART: 2 } as const;

export class PickupStore {
  readonly slots = new Slots(POOLS.pickups);
  readonly x = new Float32Array(POOLS.pickups);
  readonly y = new Float32Array(POOLS.pickups);
  readonly px = new Float32Array(POOLS.pickups);
  readonly py = new Float32Array(POOLS.pickups);
  readonly vx = new Float32Array(POOLS.pickups);
  readonly vy = new Float32Array(POOLS.pickups);
  readonly kind = new Uint8Array(POOLS.pickups);
  readonly value = new Float32Array(POOLS.pickups);
  readonly age = new Float32Array(POOLS.pickups);
  readonly magnet = new Uint8Array(POOLS.pickups);

  reset(): void {
    this.slots.reset();
  }
}

export const HAZ = {
  HOLYFIRE: 0, // player-owned burning ground
  WELL: 1, // singularity well
  TELEGRAPH: 2, // enemy AoE warning, detonates at end
  SPAWN: 3, // wave spawn pulse ring
  TRAIL: 4, // moonlit dash trail
  SHOCK: 5, // expanding enemy shock ring
} as const;

export class HazardStore {
  readonly slots = new Slots(POOLS.hazards);
  readonly x = new Float32Array(POOLS.hazards);
  readonly y = new Float32Array(POOLS.hazards);
  readonly radius = new Float32Array(POOLS.hazards);
  readonly life = new Float32Array(POOLS.hazards);
  readonly maxLife = new Float32Array(POOLS.hazards);
  readonly kind = new Uint8Array(POOLS.hazards);
  readonly dmg = new Float32Array(POOLS.hazards);
  readonly tick = new Float32Array(POOLS.hazards);
  readonly ref = new Int16Array(POOLS.hazards); // e.g. spawn entry index

  reset(): void {
    this.slots.reset();
  }
}
