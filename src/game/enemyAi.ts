import { TAU } from '../core/math';
import { ENEMY, ENEMY_DEFS } from './enemyDefs';
import { HAZ, PF_HOMING, PROJ } from './stores';
import type { World } from './world';

// Enemy states
const S_IDLE = 0;
const S_WINDUP = 1;
const S_CHARGE = 2;
const S_RECOVER = 3;

export function updateEnemies(w: World, dt: number): void {
  const E = w.enemies;
  const p = w.player;
  const decay = Math.exp(-7 * dt);
  for (let i = 0; i < E.slots.high; i++) {
    if (!E.slots.alive[i]) continue;
    const d = ENEMY_DEFS[E.def[i]];
    E.flash[i] = Math.max(0, E.flash[i] - dt);
    E.orbitHitT[i] -= dt;
    E.scytheHitT[i] -= dt;
    E.phase[i] += dt;

    if (E.burnT[i] > 0) {
      E.burnT[i] -= dt;
      E.hp[i] -= E.burnDps[i] * dt;
      p.damageDealt += E.burnDps[i] * dt;
      if (w.rng.next() < dt * 10) w.fx.particle(E.x[i] + w.rng.range(-8, 8), E.y[i] - 6, 0, -50, 0xff8a2a, 4, 0.45, 'ember');
      if (E.hp[i] <= 0) {
        w.killEnemy(i);
        continue;
      }
    }

    if (E.spawnT[i] > 0) {
      E.spawnT[i] -= dt;
      continue;
    }

    let dvx = 0;
    let dvy = 0;
    const dx = p.x - E.x[i];
    const dy = p.y - E.y[i];
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    if (E.stun[i] > 0) {
      E.stun[i] -= dt;
    } else if (!p.alive) {
      // Wander off once the hunter has fallen.
      dvx = Math.cos(E.phase[i]) * 30;
      dvy = Math.sin(E.phase[i]) * 30;
    } else {
      switch (d.ai) {
        case 'chase': {
          w.flowDir(E.x[i], E.y[i]);
          dvx = w.out[0] * E.speed[i];
          dvy = w.out[1] * E.speed[i];
          break;
        }
        case 'flutter': {
          // Sine-wave approach with periodic swoops.
          E.t[i] -= dt;
          let sp = E.speed[i];
          if (E.state[i] === S_CHARGE) {
            sp *= 1.9;
            if (E.t[i] <= 0) {
              E.state[i] = S_IDLE;
              E.t[i] = w.rng.range(1.8, 3.2);
            }
          } else if (E.t[i] <= 0 && dist < 260) {
            E.state[i] = S_CHARGE;
            E.t[i] = 0.45;
          }
          const wob = Math.sin(E.phase[i] * 6) * 0.9;
          dvx = (ux - uy * wob) * sp;
          dvy = (uy + ux * wob) * sp;
          break;
        }
        case 'ranged':
        case 'caster': {
          const caster = d.ai === 'caster';
          const lo = caster ? 190 : 170;
          const hi = caster ? 300 : 320;
          const sees = w.los(E.x[i], E.y[i], p.x, p.y);
          if (E.state[i] === S_WINDUP) {
            E.t[i] -= dt;
            if (E.t[i] <= 0) {
              E.state[i] = S_IDLE;
              fireRanged(w, i);
            }
            break;
          }
          if (dist > hi || !sees) {
            if (d.flying) {
              dvx = ux * E.speed[i];
              dvy = uy * E.speed[i];
            } else {
              w.flowDir(E.x[i], E.y[i]);
              dvx = w.out[0] * E.speed[i];
              dvy = w.out[1] * E.speed[i];
            }
          } else if (dist < lo) {
            dvx = -ux * E.speed[i];
            dvy = -uy * E.speed[i];
          } else {
            const dir = Math.sin(E.phase[i] * 0.7) > 0 ? 1 : -1;
            dvx = -uy * dir * E.speed[i] * 0.6;
            dvy = ux * dir * E.speed[i] * 0.6;
          }
          E.fireT[i] -= dt;
          if (E.fireT[i] <= 0 && sees && dist < 480) {
            E.state[i] = S_WINDUP;
            E.t[i] = caster ? 0.5 : 0.35;
            E.fireT[i] = (d.fireEvery ?? 2) * w.rng.range(0.85, 1.2);
          }
          break;
        }
        case 'charger': {
          E.t[i] -= dt;
          if (E.state[i] === S_IDLE) {
            w.flowDir(E.x[i], E.y[i]);
            dvx = w.out[0] * E.speed[i];
            dvy = w.out[1] * E.speed[i];
            if (E.t[i] <= 0 && dist < 300 && w.los(E.x[i], E.y[i], p.x, p.y)) {
              E.state[i] = S_WINDUP;
              E.t[i] = 0.55;
              E.dirX[i] = ux;
              E.dirY[i] = uy;
            }
          } else if (E.state[i] === S_WINDUP) {
            E.dirX[i] = ux;
            E.dirY[i] = uy;
            if (E.t[i] <= 0) {
              E.state[i] = S_CHARGE;
              E.t[i] = 0.7;
              w.fx.sfx('dash', E.x[i]);
            }
          } else if (E.state[i] === S_CHARGE) {
            dvx = E.dirX[i] * 440;
            dvy = E.dirY[i] * 440;
            if (w.rng.next() < 0.5) w.fx.particle(E.x[i], E.y[i] + 10, 0, 0, 0x5a4a3a, 9, 0.4, 'smoke');
            if (E.t[i] <= 0) {
              E.state[i] = S_RECOVER;
              E.t[i] = 0.8;
            }
          } else {
            if (E.t[i] <= 0) {
              E.state[i] = S_IDLE;
              E.t[i] = 1.5;
            }
          }
          break;
        }
        case 'boss':
          updateBoss(w, i, dt, dist, ux, uy);
          dvx = w.out[0];
          dvy = w.out[1];
          break;
      }
    }

    // Steering + knockback.
    const accel = Math.min(1, dt * 10);
    E.vx[i] += (dvx - E.vx[i]) * accel;
    E.vy[i] += (dvy - E.vy[i]) * accel;
    E.kbx[i] *= decay;
    E.kby[i] *= decay;

    // Separation from neighbours.
    const r = E.radius[i];
    const n = w.spatial.query(E.x[i], E.y[i], r + 40, w.queryBuf);
    let sx = 0;
    let sy = 0;
    for (let k = 0; k < n; k++) {
      const j = w.queryBuf[k];
      if (j === i || !E.slots.alive[j]) continue;
      const ox = E.x[i] - E.x[j];
      const oy = E.y[i] - E.y[j];
      const rr = r + E.radius[j];
      const d2 = ox * ox + oy * oy;
      if (d2 >= rr * rr || d2 < 0.0001) continue;
      const dd = Math.sqrt(d2);
      const push = (rr - dd) / rr;
      sx += (ox / dd) * push;
      sy += (oy / dd) * push;
    }
    const sep = d.boss ? 0 : d.flying ? 300 : 200;
    const mvx = (E.vx[i] + E.kbx[i] + sx * sep) * dt;
    const mvy = (E.vy[i] + E.kby[i] + sy * sep) * dt;
    const blocked = w.slide(E.x[i], E.y[i], r * 0.85, mvx, mvy);
    E.x[i] = w.out[0];
    E.y[i] = w.out[1];
    if (blocked && E.state[i] === S_CHARGE && (d.ai === 'charger' || d.ai === 'boss') && d.key !== 'count') {
      // Charging into a wall: stagger.
      E.state[i] = S_RECOVER;
      E.t[i] = d.boss ? 1.4 : 0.9;
      E.stun[i] = d.boss ? 1.1 : 0.7;
      w.fx.shake(d.boss ? 10 : 4);
      w.fx.burst(E.x[i], E.y[i], 0x8a7a6a, 14, 200, 6, 0.6, 'debris');
      if (d.key === 'ogre') rockfall(w, 5);
    }
    if (Math.abs(E.vx[i]) > 5) E.facing[i] = E.vx[i] > 0 ? 1 : -1;
    else E.facing[i] = p.x > E.x[i] ? 1 : -1;

    // Contact damage.
    if (p.alive) {
      const rr = r + p.radius - 4;
      const cx = p.x - E.x[i];
      const cy = p.y - E.y[i];
      if (cx * cx + cy * cy < rr * rr) w.hurtPlayer(E.dmg[i], E.x[i], E.y[i], i);
    }
  }
}

function fireRanged(w: World, i: number): void {
  const E = w.enemies;
  const p = w.player;
  const d = ENEMY_DEFS[E.def[i]];
  const a = Math.atan2(p.y - E.y[i], p.x - E.x[i]);
  const dmg = (d.shotDamage ?? 10) * (E.dmg[i] / d.damage);
  const sp = d.shotSpeed ?? 240;
  const elite = E.elite[i] === 1;
  if (d.key === 'archer') {
    w.enemyShot(PROJ.ARROW, E.x[i], E.y[i] - 6, a + w.rng.range(-0.05, 0.05), sp, dmg, 6, 2.5);
    if (elite) {
      w.enemyShot(PROJ.ARROW, E.x[i], E.y[i] - 6, a - 0.2, sp, dmg, 6, 2.5);
      w.enemyShot(PROJ.ARROW, E.x[i], E.y[i] - 6, a + 0.2, sp, dmg, 6, 2.5);
    }
  } else if (d.key === 'witch') {
    const n = elite ? 5 : 3;
    for (let k = 0; k < n; k++) w.enemyShot(PROJ.FIREBALL, E.x[i], E.y[i] - 10, a + (k - (n - 1) / 2) * 0.32, sp, dmg, 9, 3.2, PF_HOMING);
  } else {
    const n = elite ? 5 : 3;
    for (let k = 0; k < n; k++) w.enemyShot(PROJ.FIREBALL, E.x[i], E.y[i] - 8, a + (k - (n - 1) / 2) * 0.22, sp, dmg, 8, 2.6);
  }
  w.fx.sfx('enemy_shot', E.x[i]);
}

function rockfall(w: World, n: number): void {
  const p = w.player;
  for (let k = 0; k < n; k++) {
    const a = w.rng.next() * TAU;
    const r = w.rng.range(0, 150);
    const x = p.x + Math.cos(a) * r;
    const y = p.y + Math.sin(a) * r;
    if (w.solidAt(x, y)) continue;
    w.addHazard(HAZ.TELEGRAPH, x, y, 38, w.rng.range(0.8, 1.3), 18 * (1 + w.floor * 0.3));
  }
}

function radial(w: World, kind: number, x: number, y: number, n: number, offset: number, speed: number, dmg: number, r: number): void {
  for (let k = 0; k < n; k++) w.enemyShot(kind, x, y, offset + (k * TAU) / n, speed, dmg, r, 4);
}

function summon(w: World, defKey: string, count: number, x: number, y: number): void {
  for (let k = 0; k < count; k++) {
    const a = (k / count) * TAU + w.rng.next();
    const sx = x + Math.cos(a) * 90;
    const sy = y + Math.sin(a) * 90;
    if (w.collides(sx, sy, 14)) continue;
    w.spawnEnemy(ENEMY[defKey], sx, sy, false, 1, 0.6);
  }
}

/**
 * Boss brains. Writes desired velocity into w.out.
 * Bosses share states: 0 roam, 1 windup, 2 charge/attack, 3 recover, 4+ specials.
 */
function updateBoss(w: World, i: number, dt: number, dist: number, ux: number, uy: number): void {
  const E = w.enemies;
  const p = w.player;
  const d = ENEMY_DEFS[E.def[i]];
  const hpFrac = E.hp[i] / E.maxHp[i];
  const enraged = hpFrac < 0.4;
  const spd = E.speed[i] * (enraged ? 1.3 : 1);
  const x = E.x[i];
  const y = E.y[i];
  const dmgMul = E.dmg[i] / d.damage;
  E.t[i] -= dt;
  w.out[0] = 0;
  w.out[1] = 0;
  const st = E.state[i];

  if (d.key === 'ogre') {
    if (st === 0) {
      w.flowDir(x, y);
      w.out[0] *= spd;
      w.out[1] *= spd;
      if (E.t[i] <= 0) {
        const r = w.rng.next();
        if (hpFrac < 0.6 && E.aux[i] <= 0 && r < 0.25) {
          E.state[i] = 5;
          E.t[i] = 1.0;
          E.aux[i] = 1;
          w.fx.sfx('boss_roar');
          w.fx.shake(6);
        } else if (dist < 240 || r < 0.45) {
          E.state[i] = 1;
          E.t[i] = 0.85;
          w.addHazard(HAZ.TELEGRAPH, x, y, 135, 0.85, 26 * dmgMul);
        } else {
          E.state[i] = 4; // charge windup
          E.t[i] = 0.6;
          E.dirX[i] = ux;
          E.dirY[i] = uy;
        }
      }
    } else if (st === 1) {
      if (E.t[i] <= 0) {
        // Slam lands: shock ring + bone shrapnel.
        w.addHazard(HAZ.SHOCK, x, y, 380, 1.1, 20 * dmgMul);
        w.fx.ring(x, y, 0xffc23d, 380, 1.1, 8);
        radial(w, PROJ.BONE, x, y, enraged ? 18 : 12, w.rng.next(), 230, 14 * dmgMul, 8);
        E.state[i] = 3;
        E.t[i] = enraged ? 0.5 : 0.9;
      }
    } else if (st === 4) {
      E.dirX[i] = ux;
      E.dirY[i] = uy;
      if (E.t[i] <= 0) {
        E.state[i] = 2;
        E.t[i] = 0.95;
        w.fx.sfx('boss_roar');
      }
    } else if (st === 2) {
      w.out[0] = E.dirX[i] * 500;
      w.out[1] = E.dirY[i] * 500;
      if (w.rng.next() < 0.6) w.fx.particle(x, y + 30, 0, 0, 0x6a5a4a, 16, 0.5, 'smoke');
      if (E.t[i] <= 0) {
        E.state[i] = 3;
        E.t[i] = 0.7;
      }
    } else if (st === 5) {
      if (E.t[i] <= 0) {
        summon(w, 'skeleton', enraged ? 5 : 3, x, y);
        E.state[i] = 3;
        E.t[i] = 0.6;
        E.aux[i] = -6; // cooldown before the next summon is allowed
      }
    } else if (E.t[i] <= 0) {
      E.state[i] = 0;
      E.t[i] = enraged ? 1.0 : 1.8;
    }
    if (E.aux[i] < 0) E.aux[i] = Math.min(0, E.aux[i] + dt);
    return;
  }

  if (d.key === 'golem') {
    if (st === 0) {
      w.out[0] = ux * spd;
      w.out[1] = uy * spd;
      if (!w.los(x, y, p.x, p.y)) {
        w.flowDir(x, y);
        w.out[0] *= spd;
        w.out[1] *= spd;
      }
      if (E.t[i] <= 0) {
        const r = w.rng.next();
        E.fireT[i] = 0;
        E.aux[i] = 0;
        if (enraged && r < 0.3) {
          E.state[i] = 7; // spiral
          E.t[i] = 2.6;
        } else if (r < 0.5) {
          E.state[i] = 4; // rune burst volleys
          E.t[i] = 1.2;
        } else if (r < 0.8) {
          E.state[i] = 5; // ground spikes
          E.t[i] = 0.9;
        } else {
          E.state[i] = 6; // aimed fan
          E.t[i] = 0.9;
        }
        w.fx.ring(x, y, 0x4fd8ff, 90, 0.4, 5);
      }
    } else if (st === 4) {
      E.fireT[i] -= dt;
      if (E.fireT[i] <= 0) {
        E.fireT[i] = 0.38;
        radial(w, PROJ.RUNE, x, y - 20, enraged ? 18 : 14, E.aux[i] * 0.22, 190, 15 * dmgMul, 9);
        E.aux[i]++;
        w.fx.sfx('enemy_shot', x);
      }
      if (E.t[i] <= 0) {
        E.state[i] = 3;
        E.t[i] = 0.8;
      }
    } else if (st === 5) {
      E.fireT[i] -= dt;
      if (E.fireT[i] <= 0 && E.aux[i] < (enraged ? 8 : 5)) {
        E.fireT[i] = 0.16;
        const lead = E.aux[i] * 0.06;
        const tx = p.x + p.vx * lead + w.rng.range(-40, 40);
        const ty = p.y + p.vy * lead + w.rng.range(-40, 40);
        if (!w.solidAt(tx, ty)) w.addHazard(HAZ.TELEGRAPH, tx, ty, 48, 0.95, 24 * dmgMul);
        E.aux[i]++;
      }
      if (E.t[i] <= 0 && E.aux[i] >= (enraged ? 8 : 5)) {
        E.state[i] = 3;
        E.t[i] = 1.0;
      }
    } else if (st === 6) {
      if (E.t[i] <= 0.45 && E.aux[i] === 0) {
        E.aux[i] = 1;
        const a = Math.atan2(uy, ux);
        for (let k = 0; k < 7; k++) w.enemyShot(PROJ.RUNE, x, y - 20, a + (k - 3) * 0.13, 300, 16 * dmgMul, 9, 3);
        w.fx.sfx('enemy_shot', x);
      }
      if (E.t[i] <= 0) {
        E.state[i] = 3;
        E.t[i] = 0.7;
      }
    } else if (st === 7) {
      E.fireT[i] -= dt;
      if (E.fireT[i] <= 0) {
        E.fireT[i] = 0.07;
        E.aux[i] += 0.37;
        for (let arm = 0; arm < 3; arm++) w.enemyShot(PROJ.RUNE, x, y - 20, E.aux[i] + (arm * TAU) / 3, 170, 12 * dmgMul, 8, 4);
      }
      if (E.t[i] <= 0) {
        E.state[i] = 3;
        E.t[i] = 1.0;
      }
    } else if (E.t[i] <= 0) {
      E.state[i] = 0;
      E.t[i] = enraged ? 1.2 : 2.0;
    }
    return;
  }

  // Count Vlador — teleports, hellfire, blood spirals, bat swarms.
  if (st === 0) {
    const want = 230;
    const radialV = (dist - want) * 2;
    const dir = Math.sin(E.phase[i] * 0.8) > 0 ? 1 : -1;
    w.out[0] = ux * radialV - uy * dir * spd;
    w.out[1] = uy * radialV + ux * dir * spd;
    if (E.t[i] <= 0) {
      const r = w.rng.next();
      E.fireT[i] = 0;
      E.aux[i] = 0;
      if (r < 0.28) {
        E.state[i] = 4; // vanish
        E.t[i] = 0.5;
      } else if (r < 0.55) {
        E.state[i] = 5; // hellfire
        E.t[i] = 1.4;
      } else if (r < 0.8) {
        E.state[i] = 6; // blood spiral
        E.t[i] = enraged ? 3.2 : 2.4;
      } else {
        E.state[i] = 7; // bats
        E.t[i] = 0.8;
        w.fx.sfx('boss_roar');
      }
    }
  } else if (st === 4) {
    if (E.t[i] <= 0) {
      // Reappear somewhere around the player.
      for (let tries = 0; tries < 12; tries++) {
        const a = w.rng.next() * TAU;
        const nx = p.x + Math.cos(a) * 220;
        const ny = p.y + Math.sin(a) * 220;
        if (!w.collides(nx, ny, E.radius[i])) {
          w.fx.burst(x, y, 0x5c0820, 20, 200, 10, 0.6, 'smoke');
          E.x[i] = E.px[i] = nx;
          E.y[i] = E.py[i] = ny;
          w.fx.burst(nx, ny, 0xb3123a, 24, 240, 5, 0.6, 'blood');
          break;
        }
      }
      E.state[i] = 5;
      E.t[i] = 1.0;
    }
  } else if (st === 5) {
    E.fireT[i] -= dt;
    if (E.fireT[i] <= 0 && E.t[i] < 1.0) {
      E.fireT[i] = 0.45;
      const a = Math.atan2(uy, ux);
      const n = enraged ? 5 : 3;
      for (let k = 0; k < n; k++) w.enemyShot(PROJ.FIREBALL, x, y - 10, a + (k - (n - 1) / 2) * 0.28, 280, 18 * dmgMul, 13, 3);
      w.fx.sfx('enemy_shot', x);
    }
    if (E.t[i] <= 0) {
      E.state[i] = 3;
      E.t[i] = 0.6;
    }
  } else if (st === 6) {
    E.fireT[i] -= dt;
    if (E.fireT[i] <= 0) {
      E.fireT[i] = 0.085;
      E.aux[i] += 0.31;
      const arms = enraged ? 4 : 2;
      for (let arm = 0; arm < arms; arm++) w.enemyShot(PROJ.BLOOD, x, y - 10, E.aux[i] + (arm * TAU) / arms, 200, 12 * dmgMul, 7, 4);
    }
    if (E.t[i] <= 0) {
      E.state[i] = 3;
      E.t[i] = 0.8;
    }
  } else if (st === 7) {
    if (E.t[i] <= 0) {
      summon(w, 'bat', enraged ? 7 : 5, x, y);
      E.state[i] = 3;
      E.t[i] = 0.5;
    }
  } else if (E.t[i] <= 0) {
    E.state[i] = 0;
    E.t[i] = enraged ? 0.9 : 1.6;
  }
}
