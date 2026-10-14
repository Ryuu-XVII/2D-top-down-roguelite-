import { CONFIG, POOLS } from '../config';
import { hashCombine, Rng } from '../core/rng';
import { SpatialHash } from '../core/spatialHash';
import { TAU, angleDiff } from '../core/math';
import { TILE_DOOR, TILE_FLOOR, TILE_SEALED, TILE_WALL } from '../gen/grid';
import type { Rarity } from '../gen/loot';
import { rollRoomLoot } from '../gen/loot';
import type { RoomMap } from '../gen/room';
import { planSpawns, type SpawnEntry } from '../gen/spawner';
import { ELITE, ENEMY_DEFS, floorDmgMul, floorHpMul } from './enemyDefs';
import { updateEnemies } from './enemyAi';
import type { FxSink } from './fx';
import type { Intent } from './intent';
import type { Player } from './player';
import { updatePlayer } from './playerCombat';
import { armorReduce } from './stats';
import {
  EnemyStore,
  HAZ,
  HazardStore,
  PF_FORCE_CRIT,
  PF_HOMING,
  PF_LOB,
  PF_RETURN,
  PF_SHARD,
  PF_WALLPASS,
  PICK,
  PickupStore,
  PROJ,
  ProjectileStore,
} from './stores';

export type InteractKind = 'chest' | 'shrine' | 'merchant' | 'anvil' | 'campfire' | 'altar' | 'portal';

export interface Interactable {
  kind: InteractKind;
  x: number;
  y: number;
  used: boolean;
  rarity: Rarity;
  roll: number;
  /** Visual pop-in timer. */
  appear: number;
}

export type WorldEvent =
  | { type: 'levelup' }
  | { type: 'cleared' }
  | { type: 'died' }
  | { type: 'interact'; index: number }
  | { type: 'exit'; target: number }
  | { type: 'bossDefeated'; name: string }
  | { type: 'bossSpawned'; name: string };

const T = CONFIG.tile;
const NEIGH_X = [1, -1, 0, 0, 1, 1, -1, -1];
const NEIGH_Y = [0, 0, 1, -1, 1, -1, 1, -1];

/** The room-level simulation: entities, collisions, waves and loot. */
export class World {
  readonly enemies = new EnemyStore();
  readonly projectiles = new ProjectileStore();
  readonly pickups = new PickupStore();
  readonly hazards = new HazardStore();
  readonly spatial = new SpatialHash(T * 2, POOLS.enemies);
  readonly queryBuf = new Int32Array(256);
  readonly events: WorldEvent[] = [];
  interactables: Interactable[] = [];

  room!: RoomMap;
  tiles!: Uint8Array;
  w = 0;
  h = 0;
  worldW = 0;
  worldH = 0;
  floor = 0;
  time = 0;
  rng = new Rng(1);

  doorsLocked = false;
  cleared = false;
  hadEnemies = false;
  waves: SpawnEntry[][] = [];
  waveIdx = 0;
  waveTimer = 0;
  pendingSpawns: SpawnEntry[] = [];
  pendingCount = 0;
  bossIndex = -1;
  bossName = '';
  nearInteract = -1;

  // Flow field toward the player (BFS distance, 0xffff = unreachable).
  flow = new Uint16Array(1);
  private flowQueue = new Int32Array(1);
  private flowTimer = 0;
  private flowTile = -1;

  /** Monotonic counter used with EnemyStore.hitStamp to dedupe sweeps. */
  stamp = 1;
  /** Scratch output for slide(). */
  readonly out = new Float32Array(2);

  constructor(
    public fx: FxSink,
    public player: Player,
    public enemyCap: number,
  ) {}

  // ── Room setup ────────────────────────────────────────────────────────────

  loadRoom(room: RoomMap, floor: number, alreadyCleared: boolean): void {
    this.room = room;
    this.tiles = room.tiles.slice();
    this.w = room.w;
    this.h = room.h;
    this.worldW = room.w * T;
    this.worldH = room.h * T;
    this.floor = floor;
    this.time = 0;
    this.rng = new Rng(hashCombine(room.seed, 0xc0b4a7));
    this.enemies.reset();
    this.projectiles.reset();
    this.pickups.reset();
    this.hazards.reset();
    this.events.length = 0;
    this.spatial.resize(this.worldW, this.worldH);
    this.flow = new Uint16Array(this.w * this.h);
    this.flowQueue = new Int32Array(this.w * this.h);
    this.flowTile = -1;
    this.bossIndex = -1;
    this.interactables = [];
    this.pendingSpawns = [];
    this.pendingCount = 0;

    const p = this.player;
    p.x = p.px = (room.spawn.x + 0.5) * T;
    p.y = p.py = (room.spawn.y + 0.5) * T;
    p.vx = p.vy = 0;
    p.dashT = 0;
    p.abilityDashT = 0;
    p.invuln = 1;

    const combat = room.kind === 'combat' || room.kind === 'elite' || room.kind === 'boss';
    this.cleared = alreadyCleared || !combat;
    this.doorsLocked = !this.cleared;
    this.hadEnemies = false;
    this.waves = [];
    this.waveIdx = 0;
    this.waveTimer = 0;
    if (!this.cleared) {
      const plan = planSpawns(room, floor, this.enemyCap);
      this.waves = plan.waves;
      if (this.waves.length) {
        // First wave rises from the ground straight away.
        for (const e of this.waves[0]) this.spawnEnemy(e.def, e.x * T, e.y * T, e.elite, e.hpMul, 0.7);
        this.waveIdx = 1;
        this.hadEnemies = true;
      } else {
        this.cleared = true;
        this.doorsLocked = false;
      }
    }

    const f = room.feature;
    const fx = (f.x + 0.5) * T;
    const fy = (f.y + 0.5) * T;
    const add = (kind: InteractKind, x: number, y: number, rarity: Rarity = 'common', roll = 0) =>
      this.interactables.push({ kind, x, y, used: false, rarity, roll, appear: 0 });
    if (room.kind === 'shop') add('merchant', fx, fy);
    else if (room.kind === 'rest') {
      add('campfire', fx - T * 2.5, fy);
      add('anvil', fx + T * 2.5, fy);
    } else if (room.kind === 'event') add('altar', fx, fy, 'rare', this.rng.next());
    if (room.kind === 'boss' && alreadyCleared) add('portal', fx, fy);
  }

  // ── Tiles & collision ─────────────────────────────────────────────────────

  tileAt(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return TILE_WALL;
    return this.tiles[ty * this.w + tx];
  }

  solidTile(tx: number, ty: number): boolean {
    const t = this.tileAt(tx, ty);
    return t === TILE_WALL || t === TILE_SEALED || (t === TILE_DOOR && this.doorsLocked);
  }

  solidAt(x: number, y: number): boolean {
    return this.solidTile(Math.floor(x / T), Math.floor(y / T));
  }

  /** AABB-vs-tiles overlap test for a circle approximated by its bounding box. */
  collides(x: number, y: number, r: number): boolean {
    const x0 = Math.floor((x - r) / T);
    const x1 = Math.floor((x + r - 0.001) / T);
    const y0 = Math.floor((y - r) / T);
    const y1 = Math.floor((y + r - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solidTile(tx, ty)) return true;
    return false;
  }

  /** Axis-separated slide. Writes the result into this.out; returns true if blocked. */
  slide(x: number, y: number, r: number, dx: number, dy: number): boolean {
    let blocked = false;
    let nx = x + dx;
    if (this.collides(nx, y, r)) {
      blocked = true;
      if (dx > 0) nx = Math.floor((nx + r) / T) * T - r - 0.01;
      else if (dx < 0) nx = (Math.floor((nx - r) / T) + 1) * T + r + 0.01;
      if (this.collides(nx, y, r)) nx = x;
    }
    let ny = y + dy;
    if (this.collides(nx, ny, r)) {
      blocked = true;
      if (dy > 0) ny = Math.floor((ny + r) / T) * T - r - 0.01;
      else if (dy < 0) ny = (Math.floor((ny - r) / T) + 1) * T + r + 0.01;
      if (this.collides(nx, ny, r)) ny = y;
    }
    this.out[0] = nx;
    this.out[1] = ny;
    return blocked;
  }

  /** Coarse line-of-sight through tiles. */
  los(x0: number, y0: number, x1: number, y1: number): boolean {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.hypot(dx, dy);
    const steps = Math.ceil(d / (T * 0.4));
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const tx = Math.floor((x0 + dx * t) / T);
      const ty = Math.floor((y0 + dy * t) / T);
      const tile = this.tileAt(tx, ty);
      if (tile === TILE_WALL || tile === TILE_SEALED) return false;
    }
    return true;
  }

  // ── Flow field ────────────────────────────────────────────────────────────

  private updateFlow(dt: number): void {
    const p = this.player;
    const pt = Math.floor(p.y / T) * this.w + Math.floor(p.x / T);
    this.flowTimer -= dt;
    if (pt === this.flowTile && this.flowTimer > 0) return;
    this.flowTile = pt;
    this.flowTimer = 0.25;
    const f = this.flow;
    f.fill(0xffff);
    if (pt < 0 || pt >= f.length) return;
    const q = this.flowQueue;
    let head = 0;
    let tail = 0;
    q[tail++] = pt;
    f[pt] = 0;
    const w = this.w;
    while (head < tail) {
      const c = q[head++];
      const cx = c % w;
      const cy = (c / w) | 0;
      const nd = f[c] + 1;
      for (let d = 0; d < 4; d++) {
        const nx = cx + NEIGH_X[d];
        const ny = cy + NEIGH_Y[d];
        if (nx < 0 || ny < 0 || nx >= w || ny >= this.h) continue;
        const ni = ny * w + nx;
        if (f[ni] !== 0xffff || this.tiles[ni] !== TILE_FLOOR) continue;
        f[ni] = nd;
        q[tail++] = ni;
      }
    }
  }

  /** Direction (written to this.out) a ground unit at (x,y) should walk to reach the player. */
  flowDir(x: number, y: number): void {
    const p = this.player;
    const tx = Math.floor(x / T);
    const ty = Math.floor(y / T);
    const here = this.flow[ty * this.w + tx];
    if (here <= 1 || here === 0xffff) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      this.out[0] = dx / d;
      this.out[1] = dy / d;
      return;
    }
    let best = here;
    let bx = 0;
    let by = 0;
    for (let k = 0; k < 8; k++) {
      const nx = tx + NEIGH_X[k];
      const ny = ty + NEIGH_Y[k];
      if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
      // No corner cutting on diagonals.
      if (k >= 4 && (this.solidTile(tx + NEIGH_X[k], ty) || this.solidTile(tx, ty + NEIGH_Y[k]))) continue;
      const v = this.flow[ny * this.w + nx];
      if (v < best) {
        best = v;
        bx = NEIGH_X[k];
        by = NEIGH_Y[k];
      }
    }
    if (bx === 0 && by === 0) {
      this.out[0] = 0;
      this.out[1] = 0;
      return;
    }
    const gx = (tx + bx + 0.5) * T - x;
    const gy = (ty + by + 0.5) * T - y;
    const d = Math.hypot(gx, gy) || 1;
    this.out[0] = gx / d;
    this.out[1] = gy / d;
  }

  // ── Spawning ──────────────────────────────────────────────────────────────

  spawnEnemy(defId: number, x: number, y: number, elite: boolean, hpMul: number, spawnT: number): number {
    const E = this.enemies;
    const i = E.slots.alloc();
    if (i < 0) return -1;
    const d = ENEMY_DEFS[defId];
    const f = this.floor;
    const em = elite ? ELITE : null;
    E.def[i] = defId;
    E.elite[i] = elite ? 1 : 0;
    E.x[i] = E.px[i] = x;
    E.y[i] = E.py[i] = y;
    E.vx[i] = E.vy[i] = E.kbx[i] = E.kby[i] = 0;
    const hp = d.hp * (d.boss ? 1 : floorHpMul(f)) * (em ? em.hpMul : 1) * hpMul;
    E.hp[i] = E.maxHp[i] = hp;
    E.dmg[i] = d.damage * floorDmgMul(f) * (em ? em.dmgMul : 1);
    E.speed[i] = d.speed * (elite ? 1.08 : 1);
    E.radius[i] = d.radius * (em ? em.sizeMul : 1);
    E.state[i] = 0;
    E.t[i] = d.boss ? 1.6 : this.rng.range(0.2, 1.2);
    E.fireT[i] = (d.fireEvery ?? 2) * this.rng.range(0.5, 1.1);
    E.stun[i] = E.flash[i] = E.burnDps[i] = E.burnT[i] = E.orbitHitT[i] = E.scytheHitT[i] = 0;
    E.spawnT[i] = spawnT;
    E.phase[i] = this.rng.next() * TAU;
    E.facing[i] = x < this.player.x ? 1 : -1;
    E.dirX[i] = E.dirY[i] = E.aux[i] = 0;
    E.hitStamp[i] = 0;
    if (d.boss) {
      this.bossIndex = i;
      this.bossName = d.name;
      this.events.push({ type: 'bossSpawned', name: d.name });
    }
    if (spawnT > 0) this.fx.burst(x, y + 8, 0x3a2b45, 6, 60, 10, 0.6, 'smoke');
    return i;
  }

  private startWave(): void {
    const wave = this.waves[this.waveIdx++];
    this.waveTimer = 0;
    for (const e of wave) {
      const h = this.addHazard(HAZ.SPAWN, e.x * T, e.y * T, 26, CONFIG.waveTelegraph, 0);
      if (h < 0) {
        this.spawnEnemy(e.def, e.x * T, e.y * T, e.elite, e.hpMul, 0.4);
        continue;
      }
      this.hazards.ref[h] = this.pendingSpawns.length;
      this.pendingSpawns.push(e);
      this.pendingCount++;
    }
  }

  spawnProjectile(
    kind: number,
    team: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    dmg: number,
    radius: number,
    life: number,
    pierce: number,
    flags: number,
  ): number {
    const P = this.projectiles;
    const i = P.slots.alloc();
    if (i < 0) return -1;
    P.kind[i] = kind;
    P.team[i] = team;
    P.x[i] = P.px[i] = x;
    P.y[i] = P.py[i] = y;
    P.vx[i] = vx;
    P.vy[i] = vy;
    P.dmg[i] = dmg;
    P.radius[i] = radius;
    P.life[i] = life;
    P.age[i] = 0;
    P.pierce[i] = pierce;
    P.flags[i] = flags;
    P.lastHit[i] = -1;
    P.spin[i] = Math.atan2(vy, vx);
    P.tx[i] = x;
    P.ty[i] = y;
    return i;
  }

  enemyShot(kind: number, x: number, y: number, angle: number, speed: number, dmg: number, radius: number, life: number, flags = 0): void {
    this.spawnProjectile(kind, 1, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, dmg, radius, life, 0, flags);
  }

  addHazard(kind: number, x: number, y: number, radius: number, life: number, dmg: number): number {
    const H = this.hazards;
    const i = H.slots.alloc();
    if (i < 0) return -1;
    H.kind[i] = kind;
    H.x[i] = x;
    H.y[i] = y;
    H.radius[i] = radius;
    H.life[i] = H.maxLife[i] = life;
    H.dmg[i] = dmg;
    H.tick[i] = 0;
    H.ref[i] = -1;
    return i;
  }

  spawnPickup(kind: number, x: number, y: number, value: number): void {
    const K = this.pickups;
    const i = K.slots.alloc();
    if (i < 0) {
      // Pool full: credit directly so nothing is lost.
      this.collect(kind, value);
      return;
    }
    K.kind[i] = kind;
    K.x[i] = K.px[i] = x;
    K.y[i] = K.py[i] = y;
    const a = this.rng.next() * TAU;
    const s = this.rng.range(40, 160);
    K.vx[i] = Math.cos(a) * s;
    K.vy[i] = Math.sin(a) * s;
    K.value[i] = value;
    K.age[i] = 0;
    K.magnet[i] = 0;
  }

  // ── Damage ────────────────────────────────────────────────────────────────

  /** Player base damage for a given multiplier of the class attack. */
  baseDamage(): number {
    const p = this.player;
    return (p.cls.attack.damage + p.stats.dmgFlat) * p.stats.dmgMul;
  }

  /**
   * Damage enemy `i`. critMode: 0 roll, 1 force, 2 never. `procs` enables
   * on-hit card effects (burn, chain, singularity, life steal).
   */
  hitEnemy(i: number, amount: number, critMode: number, procs: boolean, kx: number, ky: number, kb: number): number {
    const E = this.enemies;
    if (!E.slots.alive[i]) return 0;
    const p = this.player;
    const d = ENEMY_DEFS[E.def[i]];
    let crit = false;
    if (critMode === 1) crit = true;
    else if (critMode === 0) {
      if (p.guaranteedCrit) {
        crit = true;
        p.guaranteedCrit = false;
      } else {
        const bonus = p.hooks.bloodlust && p.hp < p.stats.maxHp * 0.5 ? 0.2 : 0;
        crit = this.rng.next() < Math.min(CONFIG.caps.crit, p.stats.crit + bonus);
      }
    }
    let dmg = amount * (crit ? p.stats.critDmg : 1) * this.rng.range(0.92, 1.08);
    dmg = Math.max(1, Math.round(dmg));
    E.hp[i] -= dmg;
    E.flash[i] = 0.12;
    const kbScale = d.boss ? 0.08 : E.elite[i] ? 0.5 : 1;
    E.kbx[i] += kx * kb * kbScale;
    E.kby[i] += ky * kb * kbScale;
    p.damageDealt += dmg;
    const x = E.x[i];
    const y = E.y[i] - E.radius[i];
    this.fx.text(x, y, crit ? dmg + '!' : String(dmg), crit ? 0xffd23d : 0xffffff, crit);
    const bony = d.key === 'skeleton' || d.key === 'archer' || d.key === 'golem' || d.key === 'gargoyle';
    this.fx.burst(E.x[i], E.y[i], bony ? 0xf1e6cf : 0xe8344e, crit ? 7 : 3, crit ? 220 : 140, 3, 0.35, bony ? 'debris' : 'blood');
    this.fx.sfx(crit ? 'crit' : 'hit', x);
    if (procs) {
      if (p.stats.lifesteal > 0) p.hp = Math.min(p.stats.maxHp, p.hp + dmg * p.stats.lifesteal);
      if (p.hooks.burn) {
        E.burnDps[i] = Math.max(E.burnDps[i], 5 * p.hooks.burn);
        E.burnT[i] = 3;
      }
      if (crit && p.hooks.singularity) this.pullAround(E.x[i], E.y[i], 120, 260, i);
      if (p.hooks.chain && this.rng.next() < 0.2) this.chainFrom(i, dmg * 0.6);
    }
    if (E.hp[i] <= 0) this.killEnemy(i);
    return dmg;
  }

  private pullAround(x: number, y: number, r: number, strength: number, except: number): void {
    const E = this.enemies;
    const n = this.spatial.query(x, y, r, this.queryBuf);
    for (let k = 0; k < n; k++) {
      const j = this.queryBuf[k];
      if (j === except || !E.slots.alive[j] || ENEMY_DEFS[E.def[j]].boss) continue;
      const dx = x - E.x[j];
      const dy = y - E.y[j];
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1) continue;
      E.kbx[j] += (dx / d) * strength;
      E.kby[j] += (dy / d) * strength;
    }
    this.fx.ring(x, y, 0xb05cff, r, 0.35, 3);
  }

  private chainFrom(i: number, dmg: number): void {
    const E = this.enemies;
    let fromX = E.x[i];
    let fromY = E.y[i];
    const stamp = ++this.stamp;
    E.hitStamp[i] = stamp;
    for (let jump = 0; jump < 3; jump++) {
      const n = this.spatial.query(fromX, fromY, 170, this.queryBuf);
      let best = -1;
      let bd = 170 * 170;
      for (let k = 0; k < n; k++) {
        const j = this.queryBuf[k];
        if (!E.slots.alive[j] || E.hitStamp[j] === stamp) continue;
        const d = (E.x[j] - fromX) ** 2 + (E.y[j] - fromY) ** 2;
        if (d < bd) {
          bd = d;
          best = j;
        }
      }
      if (best < 0) break;
      E.hitStamp[best] = stamp;
      this.fx.lightning(fromX, fromY, E.x[best], E.y[best], 0x9fe0ff);
      fromX = E.x[best];
      fromY = E.y[best];
      this.hitEnemy(best, dmg, 2, false, 0, 0, 0);
    }
  }

  killEnemy(i: number): void {
    const E = this.enemies;
    if (!E.slots.alive[i]) return;
    const d = ENEMY_DEFS[E.def[i]];
    const x = E.x[i];
    const y = E.y[i];
    const elite = E.elite[i] === 1;
    E.slots.release(i);
    this.player.kills++;
    // Soul orbs (XP).
    const xp = d.xp * (elite ? ELITE.xpMul : 1) * (1 + this.floor * 0.25);
    const orbs = d.boss ? 18 : elite ? 5 : Math.min(3, 1 + Math.floor(xp / 12));
    for (let k = 0; k < orbs; k++) this.spawnPickup(PICK.SOUL, x, y, xp / orbs);
    if (this.rng.next() < (elite ? 1 : 0.3)) this.spawnPickup(PICK.SCRAP, x, y, Math.ceil(d.scrap * (elite ? ELITE.scrapMul : 1)));
    if (this.rng.next() < 0.03) this.spawnPickup(PICK.HEART, x, y, 1);

    const bony = d.key === 'skeleton' || d.key === 'archer';
    this.fx.burst(x, y, 0x2a1d36, 8, 90, 12, 0.6, 'smoke');
    this.fx.burst(x, y, bony ? 0xf1e6cf : d.key === 'golem' ? 0x4fd8ff : 0xb3123a, d.boss ? 60 : 10, d.boss ? 420 : 200, 4, 0.6, bony ? 'debris' : 'blood');
    this.fx.burst(x, y, 0x8dffb4, 4, 80, 6, 0.5, 'glow');
    this.fx.sfx('enemy_death', x);
    if (d.boss) {
      this.bossIndex = -1;
      this.fx.shake(14);
      this.fx.flash(0xffffff, 0.6);
      this.fx.sfx('explosion', x);
      this.fx.haptic('heavy');
      for (let r = 0; r < 4; r++) this.fx.ring(x, y, r % 2 ? 0xffc23d : 0xffffff, 120 + r * 70, 0.5 + r * 0.15, 6);
      // Everything else crumbles with its master.
      for (let j = 0; j < E.slots.high; j++) if (E.slots.alive[j]) this.killEnemy(j);
      this.events.push({ type: 'bossDefeated', name: d.name });
    } else {
      this.fx.shake(elite ? 5 : 1.5);
    }
  }

  hurtPlayer(raw: number, sx: number, sy: number, attacker: number): void {
    const p = this.player;
    if (!p.alive || p.invuln > 0 || p.dashT > 0 || p.abilityDashT > 0) return;
    const dmg = Math.max(1, Math.round(armorReduce(raw, p.stats.armor)));
    p.hp -= dmg;
    p.invuln = CONFIG.invulnAfterHit;
    p.hurtT = 0.3;
    const dx = p.x - sx;
    const dy = p.y - sy;
    const d = Math.hypot(dx, dy) || 1;
    p.vx += (dx / d) * 260;
    p.vy += (dy / d) * 260;
    this.fx.text(p.x, p.y - 26, '-' + dmg, 0xff4d6a, true);
    this.fx.burst(p.x, p.y, 0xe8344e, 10, 200, 4, 0.4, 'blood');
    this.fx.shake(6);
    this.fx.flash(0xb3123a, 0.18);
    this.fx.sfx('player_hurt');
    this.fx.haptic('hit');
    if (attacker >= 0 && p.stats.thorns > 0) this.hitEnemy(attacker, raw * p.stats.thorns, 2, false, -dx / d, -dy / d, 120);
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      this.fx.burst(p.x, p.y, 0xffffff, 30, 300, 5, 0.9, 'star');
      this.fx.shake(12);
      this.events.push({ type: 'died' });
    }
  }

  collect(kind: number, value: number): void {
    const p = this.player;
    if (kind === PICK.SOUL) {
      const lv = p.gainXp(value);
      if (lv > 0) {
        p.statPoints += lv * CONFIG.statPointsPerLevel;
        p.pendingLevelUps += lv;
        p.hp = Math.min(p.stats.maxHp, p.hp + p.stats.maxHp * 0.1);
        this.fx.sfx('level_up');
        this.fx.haptic('levelup');
        this.fx.ring(p.x, p.y, 0x8dffb4, 90, 0.6, 5);
        this.fx.burst(p.x, p.y, 0x8dffb4, 30, 260, 5, 0.8, 'star');
        this.events.push({ type: 'levelup' });
      }
    } else if (kind === PICK.SCRAP) {
      p.scrap += value;
      this.fx.sfx('coin');
    } else if (kind === PICK.HEART) {
      const heal = p.stats.maxHp * 0.15;
      p.hp = Math.min(p.stats.maxHp, p.hp + heal);
      this.fx.text(p.x, p.y - 30, '+' + Math.round(heal), 0x3ddc84, false);
      this.fx.sfx('heal');
    }
  }

  // ── Main tick ─────────────────────────────────────────────────────────────

  update(dt: number, intent: Intent): void {
    this.time += dt;
    const E = this.enemies;
    const P = this.projectiles;
    const K = this.pickups;
    for (let i = 0; i < E.slots.high; i++) {
      E.px[i] = E.x[i];
      E.py[i] = E.y[i];
    }
    for (let i = 0; i < P.slots.high; i++) {
      P.px[i] = P.x[i];
      P.py[i] = P.y[i];
    }
    for (let i = 0; i < K.slots.high; i++) {
      K.px[i] = K.x[i];
      K.py[i] = K.y[i];
    }
    const p = this.player;
    p.px = p.x;
    p.py = p.y;

    this.spatial.build(E.slots.high, E.x, E.y, E.slots.alive);
    if (p.alive) updatePlayer(this, intent, dt);
    this.updateFlow(dt);
    this.spatial.build(E.slots.high, E.x, E.y, E.slots.alive);
    updateEnemies(this, dt);
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updatePickups(dt);
    this.updateWaves(dt);
    this.updateInteractables(intent);
    this.checkExit();
  }

  private updateWaves(dt: number): void {
    if (this.cleared) return;
    this.waveTimer += dt;
    const alive = this.enemies.slots.count;
    if (this.waveIdx < this.waves.length && this.pendingCount === 0 && (alive <= 2 || this.waveTimer > 14)) {
      this.startWave();
    }
    if (this.waveIdx >= this.waves.length && this.pendingCount === 0 && alive === 0 && this.hadEnemies && this.room.kind !== 'boss') {
      this.onCleared();
    }
  }

  onCleared(): void {
    this.cleared = true;
    this.doorsLocked = false;
    this.player.roomsCleared++;
    const p = this.player;
    const drops = rollRoomLoot(this.room, this.floor, Math.floor(p.x / T), Math.floor(p.y / T));
    for (const d of drops) {
      const x = d.x * T;
      const y = d.y * T;
      if (d.kind === 'scrap') this.spawnPickup(PICK.SCRAP, x, y, d.amount);
      else if (d.kind === 'heart') this.spawnPickup(PICK.HEART, x, y, 1);
      else this.interactables.push({ kind: d.kind, x, y, used: false, rarity: d.rarity, roll: d.roll, appear: 0 });
    }
    this.fx.sfx('door_unlock');
    for (const e of this.room.exits) this.fx.burst((e.x + 0.5) * T, (e.y + 0.5) * T, 0xffc23d, 16, 160, 5, 0.7, 'star');
    this.events.push({ type: 'cleared' });
  }

  /** Called by the game when the boss dies: portal + reward chest. */
  spawnBossRewards(): void {
    const f = this.room.feature;
    this.cleared = true;
    this.doorsLocked = false;
    this.player.roomsCleared++;
    this.interactables.push({ kind: 'portal', x: (f.x + 0.5) * T, y: (f.y + 0.5) * T, used: false, rarity: 'epic', roll: 0, appear: 0 });
    const drops = rollRoomLoot(this.room, this.floor, f.x, f.y);
    for (const d of drops) {
      if (d.kind === 'scrap') this.spawnPickup(PICK.SCRAP, d.x * T, d.y * T, d.amount * 2);
      else if (d.kind === 'chest') this.interactables.push({ kind: 'chest', x: d.x * T, y: d.y * T, used: false, rarity: d.rarity, roll: d.roll, appear: 0 });
    }
  }

  private updateInteractables(intent: Intent): void {
    const p = this.player;
    this.nearInteract = -1;
    let bd = 76 * 76;
    for (let i = 0; i < this.interactables.length; i++) {
      const it = this.interactables[i];
      it.appear = Math.min(1, it.appear + CONFIG.dt * 2.5);
      const reusable = it.kind === 'merchant' || it.kind === 'anvil' || it.kind === 'portal';
      if (it.used && !reusable) continue;
      const d = (it.x - p.x) ** 2 + (it.y - p.y) ** 2;
      if (d < bd) {
        bd = d;
        this.nearInteract = i;
      }
    }
    if (intent.interact && this.nearInteract >= 0 && p.alive) {
      this.events.push({ type: 'interact', index: this.nearInteract });
    }
  }

  private checkExit(): void {
    if (this.doorsLocked || !this.player.alive) return;
    const p = this.player;
    if (p.x < (this.w - 1) * T + 2) return;
    const ty = Math.floor(p.y / T);
    for (const e of this.room.exits) {
      if (Math.abs(e.y - ty) <= 1) {
        this.events.push({ type: 'exit', target: e.target });
        this.doorsLocked = true; // prevent double-trigger while transitioning
        return;
      }
    }
  }

  // ── Projectiles ───────────────────────────────────────────────────────────

  private updateProjectiles(dt: number): void {
    const P = this.projectiles;
    const E = this.enemies;
    const p = this.player;
    for (let i = 0; i < P.slots.high; i++) {
      if (!P.slots.alive[i]) continue;
      P.age[i] += dt;
      P.life[i] -= dt;
      const kind = P.kind[i];
      const flags = P.flags[i];

      if (flags & PF_LOB) {
        // Lobbed flask: travels to its target point, then shatters.
        const t = P.age[i] / 0.45;
        P.x[i] = P.tx[i] + (P.vx[i] - P.tx[i]) * Math.min(1, t);
        P.y[i] = P.ty[i] + (P.vy[i] - P.ty[i]) * Math.min(1, t);
        P.spin[i] += dt * 14;
        if (t >= 1) {
          const n = p.hooks.holyWater;
          this.addHazard(HAZ.HOLYFIRE, P.x[i], P.y[i], 46 + 6 * n, 2.5, P.dmg[i]);
          this.fx.burst(P.x[i], P.y[i], 0x9fe0ff, 16, 180, 4, 0.5, 'spark');
          this.fx.sfx('explosion', P.x[i]);
          P.slots.release(i);
        }
        continue;
      }

      if (flags & PF_HOMING) {
        let tx = 0;
        let ty = 0;
        let found = false;
        if (P.team[i] === 1) {
          tx = p.x;
          ty = p.y;
          found = true;
        } else {
          let tgt = -1;
          let bd = 380 * 380;
          const n = this.spatial.query(P.x[i], P.y[i], 380, this.queryBuf);
          for (let k = 0; k < n; k++) {
            const j = this.queryBuf[k];
            if (!E.slots.alive[j] || j === P.lastHit[i]) continue;
            const d = (E.x[j] - P.x[i]) ** 2 + (E.y[j] - P.y[i]) ** 2;
            if (d < bd) {
              bd = d;
              tgt = j;
            }
          }
          if (tgt >= 0) {
            tx = E.x[tgt];
            ty = E.y[tgt];
            found = true;
          }
        }
        if (found) {
          const sp = Math.hypot(P.vx[i], P.vy[i]);
          const cur = Math.atan2(P.vy[i], P.vx[i]);
          const want = Math.atan2(ty - P.y[i], tx - P.x[i]);
          const turn = (P.team[i] === 1 ? 1.1 : 7) * dt;
          const da = angleDiff(cur, want);
          const na = cur + Math.max(-turn, Math.min(turn, da));
          P.vx[i] = Math.cos(na) * sp;
          P.vy[i] = Math.sin(na) * sp;
        }
      }

      if (flags & PF_RETURN) {
        // Boomerang: decelerate, then home back to the player.
        if (P.age[i] > 0.42) {
          const dx = p.x - P.x[i];
          const dy = p.y - P.y[i];
          const d = Math.hypot(dx, dy) || 1;
          const sp = Math.min(640, Math.hypot(P.vx[i], P.vy[i]) + 1400 * dt);
          const ax = (dx / d) * sp;
          const ay = (dy / d) * sp;
          P.vx[i] += (ax - P.vx[i]) * Math.min(1, dt * 7);
          P.vy[i] += (ay - P.vy[i]) * Math.min(1, dt * 7);
          if (d < 20 && P.age[i] > 0.6) {
            P.slots.release(i);
            continue;
          }
        }
        P.spin[i] += dt * 16;
      } else if (kind === PROJ.AXE) {
        // Arcing axe: rotate velocity for a curved throw.
        const a = 2.6 * dt;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const vx = P.vx[i];
        P.vx[i] = vx * c - P.vy[i] * s;
        P.vy[i] = vx * s + P.vy[i] * c;
        P.spin[i] += dt * 18;
      } else {
        P.spin[i] = Math.atan2(P.vy[i], P.vx[i]);
      }

      P.x[i] += P.vx[i] * dt;
      P.y[i] += P.vy[i] * dt;

      if (P.life[i] <= 0) {
        this.fx.burst(P.x[i], P.y[i], P.team[i] ? 0xff8a2a : 0x9fe0ff, 3, 60, 3, 0.25, 'spark');
        P.slots.release(i);
        continue;
      }
      if (!(flags & PF_WALLPASS) && this.solidAt(P.x[i], P.y[i])) {
        this.fx.burst(P.px[i], P.py[i], P.team[i] ? 0xff8a2a : 0xcfe8ff, 5, 120, 3, 0.3, 'spark');
        P.slots.release(i);
        continue;
      }
      if (P.x[i] < -64 || P.y[i] < -64 || P.x[i] > this.worldW + 64 || P.y[i] > this.worldH + 64) {
        P.slots.release(i);
        continue;
      }

      if (P.team[i] === 1) {
        const r = P.radius[i] + p.radius - 2;
        if (p.alive && (P.x[i] - p.x) ** 2 + (P.y[i] - p.y) ** 2 < r * r) {
          if (p.invuln <= 0 && p.dashT <= 0 && p.abilityDashT <= 0) {
            this.hurtPlayer(P.dmg[i], P.x[i], P.y[i], -1);
            P.slots.release(i);
          }
        }
        continue;
      }

      // Player projectile vs enemies.
      const n = this.spatial.query(P.x[i], P.y[i], P.radius[i] + 60, this.queryBuf);
      for (let k = 0; k < n; k++) {
        const j = this.queryBuf[k];
        if (!E.slots.alive[j] || j === P.lastHit[i]) continue;
        const r = P.radius[i] + E.radius[j];
        const dx = E.x[j] - P.x[i];
        const dy = E.y[j] - P.y[i];
        if (dx * dx + dy * dy > r * r) continue;
        const sp = Math.hypot(P.vx[i], P.vy[i]) || 1;
        const kb = kind === PROJ.AXE ? 160 : kind === PROJ.ORB ? 60 : 90;
        this.hitEnemy(j, P.dmg[i], flags & PF_FORCE_CRIT ? 1 : 0, true, P.vx[i] / sp, P.vy[i] / sp, kb);
        P.lastHit[i] = j;
        // Forked Vector: split into shards on hit.
        if (p.hooks.fork && !(flags & PF_SHARD)) this.forkAt(P.x[i], P.y[i], Math.atan2(P.vy[i], P.vx[i]), j);
        if (P.pierce[i]-- <= 0) {
          P.slots.release(i);
          break;
        }
      }
    }
  }

  forkAt(x: number, y: number, angle: number, exclude: number): void {
    const n = 2 * this.player.hooks.fork;
    const dmg = this.baseDamage() * 0.45;
    for (let s = 0; s < n; s++) {
      const a = angle + (s % 2 ? 1 : -1) * (0.5 + 0.25 * Math.floor(s / 2));
      const id = this.spawnProjectile(PROJ.SHARD, 0, x, y, Math.cos(a) * 520, Math.sin(a) * 520, dmg, 5, 0.4, 0, PF_SHARD);
      if (id >= 0) this.projectiles.lastHit[id] = exclude;
    }
  }

  // ── Hazards ───────────────────────────────────────────────────────────────

  private updateHazards(dt: number): void {
    const H = this.hazards;
    const E = this.enemies;
    const p = this.player;
    for (let i = 0; i < H.slots.high; i++) {
      if (!H.slots.alive[i]) continue;
      H.life[i] -= dt;
      const kind = H.kind[i];
      const x = H.x[i];
      const y = H.y[i];
      const r = H.radius[i];
      if (kind === HAZ.HOLYFIRE || kind === HAZ.TRAIL) {
        H.tick[i] -= dt;
        if (H.tick[i] <= 0) {
          H.tick[i] = 0.25;
          const n = this.spatial.query(x, y, r + 40, this.queryBuf);
          for (let k = 0; k < n; k++) {
            const j = this.queryBuf[k];
            if (!E.slots.alive[j]) continue;
            const rr = r + E.radius[j];
            if ((E.x[j] - x) ** 2 + (E.y[j] - y) ** 2 < rr * rr) this.hitEnemy(j, H.dmg[i] * 0.25, 2, false, 0, 0, 0);
          }
        }
        if (this.rng.next() < dt * 30) {
          const a = this.rng.next() * TAU;
          const d = this.rng.next() * r;
          this.fx.particle(x + Math.cos(a) * d, y + Math.sin(a) * d, 0, -40, kind === HAZ.TRAIL ? 0xa8c8ff : 0x7fd6ff, 4, 0.5, 'ember');
        }
      } else if (kind === HAZ.WELL) {
        const n = this.spatial.query(x, y, r, this.queryBuf);
        for (let k = 0; k < n; k++) {
          const j = this.queryBuf[k];
          if (!E.slots.alive[j] || ENEMY_DEFS[E.def[j]].boss) continue;
          const dx = x - E.x[j];
          const dy = y - E.y[j];
          const d = Math.hypot(dx, dy);
          if (d > r || d < 4) continue;
          const pull = 900 * dt * (1 - d / r + 0.3);
          E.kbx[j] += (dx / d) * pull;
          E.kby[j] += (dy / d) * pull;
        }
        if (this.rng.next() < dt * 60) {
          const a = this.rng.next() * TAU;
          this.fx.particle(x + Math.cos(a) * r, y + Math.sin(a) * r, -Math.cos(a) * r * 2, -Math.sin(a) * r * 2, 0xb05cff, 4, 0.5, 'spark');
        }
        if (H.life[i] <= 0) {
          // Detonation.
          const n2 = this.spatial.query(x, y, 150, this.queryBuf);
          for (let k = 0; k < n2; k++) {
            const j = this.queryBuf[k];
            if (!E.slots.alive[j]) continue;
            const dx = E.x[j] - x;
            const dy = E.y[j] - y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 150 + E.radius[j]) this.hitEnemy(j, H.dmg[i], 0, true, dx / d, dy / d, 380);
          }
          this.fx.ring(x, y, 0xb05cff, 160, 0.45, 8);
          this.fx.ring(x, y, 0xffffff, 110, 0.3, 4);
          this.fx.burst(x, y, 0xd8a8ff, 40, 380, 5, 0.7, 'star');
          this.fx.shake(8);
          this.fx.sfx('explosion', x);
        }
      } else if (kind === HAZ.TELEGRAPH) {
        if (H.life[i] <= 0) {
          if (p.alive && (p.x - x) ** 2 + (p.y - y) ** 2 < (r + p.radius) ** 2) this.hurtPlayer(H.dmg[i], x, y, -1);
          this.fx.burst(x, y, 0xff8a2a, 14, 220, 5, 0.5, 'ember');
          this.fx.burst(x, y, 0x5a4a3a, 8, 120, 10, 0.6, 'smoke');
          this.fx.ring(x, y, 0xffc23d, r, 0.25, 4);
          this.fx.shake(r > 80 ? 9 : 3);
          this.fx.sfx('explosion', x);
        }
      } else if (kind === HAZ.SHOCK) {
        const prog = 1 - H.life[i] / H.maxLife[i];
        const cur = r * prog;
        const d = Math.hypot(p.x - x, p.y - y);
        if (H.tick[i] === 0 && Math.abs(d - cur) < 16) {
          H.tick[i] = 1;
          this.hurtPlayer(H.dmg[i], x, y, -1);
        }
      } else if (kind === HAZ.SPAWN) {
        if (H.life[i] <= 0) {
          const e = this.pendingSpawns[H.ref[i]];
          if (e) this.spawnEnemy(e.def, e.x * T, e.y * T, e.elite, e.hpMul, 0.35);
          this.pendingCount--;
        }
      }
      if (H.life[i] <= 0) H.slots.release(i);
    }
  }

  // ── Pickups ───────────────────────────────────────────────────────────────

  private updatePickups(dt: number): void {
    const K = this.pickups;
    const p = this.player;
    const pr = p.stats.pickupRadius;
    const vacuum = this.cleared; // after a clear, everything flies to you
    for (let i = 0; i < K.slots.high; i++) {
      if (!K.slots.alive[i]) continue;
      K.age[i] += dt;
      const dx = p.x - K.x[i];
      const dy = p.y - K.y[i];
      const d = Math.hypot(dx, dy) || 1;
      if (!K.magnet[i] && K.age[i] > 0.35 && (d < pr || (vacuum && K.kind[i] !== PICK.HEART && K.age[i] > 0.8))) K.magnet[i] = 1;
      if (K.magnet[i] && p.alive) {
        const sp = CONFIG.magnetSpeed + K.age[i] * 200;
        K.vx[i] += ((dx / d) * sp - K.vx[i]) * Math.min(1, dt * 10);
        K.vy[i] += ((dy / d) * sp - K.vy[i]) * Math.min(1, dt * 10);
      } else {
        const f = Math.exp(-5 * dt);
        K.vx[i] *= f;
        K.vy[i] *= f;
      }
      const nx = K.x[i] + K.vx[i] * dt;
      const ny = K.y[i] + K.vy[i] * dt;
      if (K.magnet[i] || !this.solidAt(nx, ny)) {
        K.x[i] = nx;
        K.y[i] = ny;
      } else {
        K.vx[i] *= -0.5;
        K.vy[i] *= -0.5;
      }
      if (d < p.radius + 10 && p.alive && K.age[i] > 0.2) {
        this.collect(K.kind[i], K.value[i]);
        if (K.kind[i] === PICK.SOUL) this.fx.sfx('pickup');
        this.fx.burst(K.x[i], K.y[i], K.kind[i] === PICK.SOUL ? 0x8dffb4 : K.kind[i] === PICK.SCRAP ? 0xffc23d : 0xff6b8a, 3, 60, 4, 0.3, 'glow');
        K.slots.release(i);
      }
    }
  }

  /** Find a free, walkable point near (x, y) along the segment from (fx, fy). */
  safePointToward(fx: number, fy: number, x: number, y: number, r: number): void {
    const steps = 24;
    for (let s = 0; s <= steps; s++) {
      const t = 1 - s / steps;
      const cx = fx + (x - fx) * t;
      const cy = fy + (y - fy) * t;
      if (!this.collides(cx, cy, r)) {
        this.out[0] = cx;
        this.out[1] = cy;
        return;
      }
    }
    this.out[0] = fx;
    this.out[1] = fy;
  }
}
