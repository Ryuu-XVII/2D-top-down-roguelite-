import { CONFIG } from '../config';
import { TAU, angleDiff } from '../core/math';
import { ENEMY_DEFS } from './enemyDefs';
import type { Intent } from './intent';
import { HAZ, PF_HOMING, PF_LOB, PF_RETURN, PF_WALLPASS, PROJ } from './stores';
import type { World } from './world';

const SHOCK_DASH = { time: 0.26, distance: 240 };

/** Nearest living enemy within `range` (optionally requiring line of sight). */
function nearestEnemy(w: World, x: number, y: number, range: number, needLos: boolean): number {
  const E = w.enemies;
  const n = w.spatial.query(x, y, range, w.queryBuf);
  let best = -1;
  let bd = range * range;
  for (let k = 0; k < n; k++) {
    const j = w.queryBuf[k];
    if (!E.slots.alive[j] || E.spawnT[j] > 0.2) continue;
    const d = (E.x[j] - x) ** 2 + (E.y[j] - y) ** 2;
    if (d < bd && (!needLos || w.los(x, y, E.x[j], E.y[j]))) {
      bd = d;
      best = j;
    }
  }
  return best;
}

/** Enemies orbit-hit by familiars: index list query around a point. */
function orbitHits(w: World, x: number, y: number, r: number, dmg: number, scythe: boolean): void {
  const E = w.enemies;
  const n = w.spatial.query(x, y, r + 40, w.queryBuf);
  for (let k = 0; k < n; k++) {
    const j = w.queryBuf[k];
    if (!E.slots.alive[j]) continue;
    const timer = scythe ? E.scytheHitT : E.orbitHitT;
    if (timer[j] > 0) continue;
    const rr = r + E.radius[j];
    const dx = E.x[j] - x;
    const dy = E.y[j] - y;
    if (dx * dx + dy * dy > rr * rr) continue;
    timer[j] = scythe ? 0.45 : 0.3;
    const d = Math.hypot(dx, dy) || 1;
    w.hitEnemy(j, dmg, scythe ? 1 : 0, !scythe, dx / d, dy / d, scythe ? 200 : 70);
  }
}

export function orbitRadius(): number {
  return 58;
}

export function updatePlayer(w: World, intent: Intent, dt: number): void {
  const p = w.player;
  const s = p.stats;
  const E = w.enemies;

  // ── Timers & regeneration ──
  p.invuln = Math.max(0, p.invuln - dt);
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.swingT = Math.max(0, p.swingT - dt);
  p.castT = Math.max(0, p.castT - dt);
  p.attackT -= dt;
  p.abilityCd = Math.max(0, p.abilityCd - dt);
  p.dashCd = Math.max(0, p.dashCd - dt);
  p.energy = Math.min(s.maxEnergy, p.energy + s.energyRegen * dt);
  if (s.hpRegen > 0) p.hp = Math.min(s.maxHp, p.hp + s.hpRegen * dt);

  // ── Aim ──
  let ax = intent.aimX;
  let ay = intent.aimY;
  if (intent.hasAimPoint) {
    const dx = intent.aimPointX - p.x;
    const dy = intent.aimPointY - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 1) {
      ax = dx / d;
      ay = dy / d;
    }
  }
  let autoFire = false;
  if (intent.autoAim) {
    const t = nearestEnemy(w, p.x, p.y, 520, true);
    if (t >= 0) {
      const dx = E.x[t] - p.x;
      const dy = E.y[t] - p.y;
      const d = Math.hypot(dx, dy) || 1;
      ax = dx / d;
      ay = dy / d;
      autoFire = true;
    }
  } else if (intent.aimAssist && (ax !== 0 || ay !== 0)) {
    // Soft snap toward the nearest enemy inside a narrow cone.
    const cone = (CONFIG.aimAssistConeDeg * Math.PI) / 180;
    const base = Math.atan2(ay, ax);
    const n = w.spatial.query(p.x, p.y, CONFIG.aimAssistRange, w.queryBuf);
    let best = -1;
    let bd = Infinity;
    for (let k = 0; k < n; k++) {
      const j = w.queryBuf[k];
      if (!E.slots.alive[j]) continue;
      const dx = E.x[j] - p.x;
      const dy = E.y[j] - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > CONFIG.aimAssistRange ** 2) continue;
      if (Math.abs(angleDiff(base, Math.atan2(dy, dx))) > cone) continue;
      if (d2 < bd) {
        bd = d2;
        best = j;
      }
    }
    if (best >= 0) {
      const a = Math.atan2(E.y[best] - p.y, E.x[best] - p.x);
      ax = Math.cos(a);
      ay = Math.sin(a);
    }
  }
  p.aimAngle = Math.atan2(ay, ax);

  // ── Movement ──
  let mx = intent.moveX;
  let my = intent.moveY;
  const ml = Math.hypot(mx, my);
  if (ml > 1) {
    mx /= ml;
    my /= ml;
  }
  if (p.abilityDashT > 0) {
    p.abilityDashT -= dt;
    const sp = SHOCK_DASH.distance / SHOCK_DASH.time;
    p.vx = p.dashDX * sp;
    p.vy = p.dashDY * sp;
    shockwaveSweep(w);
  } else if (p.dashT > 0) {
    p.dashT -= dt;
    const sp = CONFIG.dash.distance / CONFIG.dash.time;
    p.vx = p.dashDX * sp;
    p.vy = p.dashDY * sp;
    if (Math.random() < 0.8) w.fx.particle(p.x, p.y, -p.vx * 0.1, -p.vy * 0.1, p.cls.color, 7, 0.3, 'glow');
    if (p.hooks.moonDash) {
      p.trailAcc += sp * dt;
      if (p.trailAcc > 18) {
        p.trailAcc = 0;
        w.addHazard(HAZ.TRAIL, p.x, p.y, 20, 1.2, w.baseDamage() * 0.8 * p.hooks.moonDash);
      }
    }
  } else {
    const tx = mx * s.move;
    const ty = my * s.move;
    const k = Math.min(1, dt * 16);
    p.vx += (tx - p.vx) * k;
    p.vy += (ty - p.vy) * k;
  }
  if (w.slide(p.x, p.y, p.radius, p.vx * dt, p.vy * dt)) {
    if (p.abilityDashT > 0) p.abilityDashT = Math.min(p.abilityDashT, 0.02);
  }
  p.x = w.out[0];
  p.y = w.out[1];
  const speed = Math.hypot(p.vx, p.vy);
  p.walkPhase += speed * dt * 0.06;
  if (intent.fire || autoFire) p.facing = ax >= 0 ? 1 : -1;
  else if (Math.abs(p.vx) > 10) p.facing = p.vx > 0 ? 1 : -1;

  // ── Dash ──
  if (intent.dash && p.dashCd <= 0 && p.dashT <= 0 && p.abilityDashT <= 0) {
    let dx = mx;
    let dy = my;
    if (Math.hypot(dx, dy) < 0.1) {
      dx = ax;
      dy = ay;
    }
    const d = Math.hypot(dx, dy) || 1;
    p.dashDX = dx / d;
    p.dashDY = dy / d;
    p.dashT = CONFIG.dash.time;
    p.dashCd = s.dashCooldown;
    p.invuln = Math.max(p.invuln, CONFIG.dash.invuln);
    w.fx.burst(p.x, p.y, 0xffffff, 8, 120, 8, 0.35, 'smoke');
    w.fx.sfx('dash');
  }

  // ── Class ability ──
  const ab = p.cls.ability;
  if (intent.ability && p.abilityCd <= 0 && p.energy >= ab.cost) {
    p.energy -= ab.cost;
    p.abilityCd = ab.cooldown * (1 - s.cdr);
    p.castT = 0.35;
    w.fx.sfx('ability');
    const range = p.cls.id === 'weaver' ? 280 : 260;
    let tx = p.x + ax * 200;
    let ty = p.y + ay * 200;
    if (intent.hasAimPoint) {
      const dx = intent.aimPointX - p.x;
      const dy = intent.aimPointY - p.y;
      const d = Math.hypot(dx, dy);
      const c = Math.min(d, range) / (d || 1);
      tx = p.x + dx * c;
      ty = p.y + dy * c;
    } else if (intent.autoAim || intent.aimAssist) {
      const t = nearestEnemy(w, p.x, p.y, range, false);
      if (t >= 0) {
        tx = E.x[t];
        ty = E.y[t];
      }
    }
    if (p.cls.id === 'vanguard') {
      p.dashDX = ax;
      p.dashDY = ay;
      p.abilityDashT = SHOCK_DASH.time;
      p.invuln = Math.max(p.invuln, SHOCK_DASH.time + 0.1);
      w.stamp++;
      w.fx.ring(p.x, p.y, 0xffc23d, 70, 0.3, 6);
      w.fx.shake(5);
    } else if (p.cls.id === 'weaver') {
      w.addHazard(HAZ.WELL, tx, ty, 160, 1.4, 80 + w.baseDamage() * 3);
      w.fx.ring(tx, ty, 0xb05cff, 160, 0.4, 5);
    } else {
      w.fx.burst(p.x, p.y, 0x2a1d36, 14, 120, 12, 0.5, 'smoke');
      w.safePointToward(p.x, p.y, tx, ty, p.radius);
      p.x = p.px = w.out[0];
      p.y = p.py = w.out[1];
      p.guaranteedCrit = true;
      p.invuln = Math.max(p.invuln, 0.3);
      w.fx.burst(p.x, p.y, 0x5ec8ff, 18, 200, 5, 0.5, 'star');
      w.fx.burst(p.x, p.y, 0x2a1d36, 10, 100, 12, 0.5, 'smoke');
    }
  }

  // ── Basic attack ──
  if ((intent.fire || autoFire) && p.attackT <= 0) {
    const bl = p.hooks.bloodlust && p.hp < s.maxHp * 0.5 ? 0.15 : 0;
    p.attackT = p.cls.attack.interval / (s.atkSpeed + bl);
    basicAttack(w, ax, ay);
  }
  if (p.attackT < -0.5) p.attackT = 0;

  updateFamiliars(w, dt);
  updateSubWeapons(w, dt, ax, ay);
}

function basicAttack(w: World, ax: number, ay: number): void {
  const p = w.player;
  const atk = p.cls.attack;
  const base = w.baseDamage();
  const extra = p.stats.projectiles;
  const angle = Math.atan2(ay, ax);
  if (atk.kind === 'slash') {
    p.swingT = 0.22;
    const arc = (110 + extra * 15) * (Math.PI / 180);
    const range = atk.range;
    w.fx.slash(p.x, p.y, angle, range, arc, 0xfff0d0);
    w.fx.sfx('shoot_slash', p.x);
    const E = w.enemies;
    const n = w.spatial.query(p.x, p.y, range + 50, w.queryBuf);
    let forked = false;
    for (let k = 0; k < n; k++) {
      const j = w.queryBuf[k];
      if (!E.slots.alive[j]) continue;
      const dx = E.x[j] - p.x;
      const dy = E.y[j] - p.y;
      const d = Math.hypot(dx, dy);
      if (d > range + E.radius[j]) continue;
      if (d > E.radius[j] && Math.abs(angleDiff(angle, Math.atan2(dy, dx))) > arc / 2) continue;
      const ex = E.x[j];
      const ey = E.y[j];
      w.hitEnemy(j, base, 0, true, dx / (d || 1), dy / (d || 1), 150);
      if (!forked && p.hooks.fork) {
        w.forkAt(ex, ey, angle, j);
        forked = true;
      }
    }
    for (let e = 0; e < extra; e++) {
      const a = angle + (e % 2 ? 1 : -1) * 0.18 * Math.ceil(e / 2);
      w.spawnProjectile(PROJ.WAVE, 0, p.x + ax * 20, p.y + ay * 20, Math.cos(a) * 520, Math.sin(a) * 520, base * 0.6, 16, 0.45, 99, 0);
    }
  } else if (atk.kind === 'orb') {
    p.castT = 0.15;
    const count = 1 + extra;
    for (let c = 0; c < count; c++) {
      const a = angle + (c - (count - 1) / 2) * 0.22;
      w.spawnProjectile(PROJ.ORB, 0, p.x + ax * 16, p.y + ay * 16 - 6, Math.cos(a) * atk.speed, Math.sin(a) * atk.speed, base, 8, 1.6, 0, PF_HOMING);
    }
    w.fx.sfx('shoot_orb', p.x);
  } else {
    p.swingT = 0.12;
    const count = 2 + extra;
    const px = -ay;
    const py = ax;
    for (let c = 0; c < count; c++) {
      const off = (c - (count - 1) / 2) * 9;
      const a = angle + (c - (count - 1) / 2) * 0.05;
      w.spawnProjectile(PROJ.DAGGER, 0, p.x + px * off + ax * 10, p.y + py * off + ay * 10, Math.cos(a) * atk.speed, Math.sin(a) * atk.speed, base, 6, 0.7, 1, 0);
    }
    w.fx.sfx('shoot_dagger', p.x);
  }
}

/** Vanguard's Shockwave Dash: hits each enemy in the path once, with knockback + stun. */
function shockwaveSweep(w: World): void {
  const p = w.player;
  const E = w.enemies;
  const n = w.spatial.query(p.x, p.y, 70, w.queryBuf);
  const dmg = 35 + w.baseDamage() * 1.5;
  for (let k = 0; k < n; k++) {
    const j = w.queryBuf[k];
    if (!E.slots.alive[j] || E.hitStamp[j] === w.stamp) continue;
    const dx = E.x[j] - p.x;
    const dy = E.y[j] - p.y;
    if (dx * dx + dy * dy > (36 + E.radius[j]) ** 2) continue;
    E.hitStamp[j] = w.stamp;
    // Knock sideways out of the path.
    const side = dx * -p.dashDY + dy * p.dashDX >= 0 ? 1 : -1;
    const kx = -p.dashDY * side * 0.8 + p.dashDX * 0.6;
    const ky = p.dashDX * side * 0.8 + p.dashDY * 0.6;
    if (!ENEMY_DEFS[E.def[j]].boss) E.stun[j] = 1.2;
    w.hitEnemy(j, dmg, 0, true, kx, ky, 520);
    w.fx.burst(E.x[j], E.y[j], 0xffc23d, 10, 240, 4, 0.4, 'star');
  }
  if (Math.random() < 0.9) w.fx.particle(p.x, p.y, -p.vx * 0.2, -p.vy * 0.2, 0xffc23d, 10, 0.35, 'glow');
}

function updateFamiliars(w: World, dt: number): void {
  const p = w.player;
  const n = p.stats.orbitals;
  const speedMul = p.hooks.satellites ? 1 + 0.25 * p.orbitTagCount : 1;
  p.orbitAngle = (p.orbitAngle + dt * 2.6 * speedMul) % TAU;
  if (n > 0) {
    const r = orbitRadius();
    const dmg = p.stats.orbitDmg + w.baseDamage() * 0.3;
    for (let k = 0; k < n; k++) {
      const a = p.orbitAngle + (k * TAU) / n;
      orbitHits(w, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.8, 12, dmg, false);
    }
  }
  const sc = p.hooks.scythe;
  if (sc > 0) {
    const dmg = w.baseDamage() * 2.5 + p.stats.orbitDmg;
    for (let k = 0; k < sc; k++) {
      const a = -p.orbitAngle * 0.6 + (k * TAU) / sc;
      orbitHits(w, p.x + Math.cos(a) * 92, p.y + Math.sin(a) * 92 * 0.8, 22, dmg, true);
    }
  }
}

function updateSubWeapons(w: World, dt: number, ax: number, ay: number): void {
  const p = w.player;
  const E = w.enemies;
  const base = w.baseDamage();
  const any = E.slots.count > 0;
  const h = p.hooks;
  const rate = (n: number) => 1 + 0.25 * (n - 1);

  if (h.cross) {
    p.crossT -= dt;
    if (p.crossT <= 0 && any) {
      p.crossT = 2.4 / rate(h.cross);
      const t = nearestEnemy(w, p.x, p.y, 420, false);
      const a = t >= 0 ? Math.atan2(E.y[t] - p.y, E.x[t] - p.x) : Math.atan2(ay, ax);
      w.spawnProjectile(PROJ.CROSS, 0, p.x, p.y, Math.cos(a) * 560, Math.sin(a) * 560, base * 1.4, 16, 3, 999, PF_RETURN | PF_WALLPASS);
      w.fx.sfx('shoot_dagger', p.x);
    }
  }
  if (h.axe) {
    p.axeT -= dt;
    if (p.axeT <= 0 && any) {
      p.axeT = 2.0 / rate(h.axe);
      const a = Math.atan2(ay, ax) - 0.6;
      w.spawnProjectile(PROJ.AXE, 0, p.x, p.y - 10, Math.cos(a) * 430, Math.sin(a) * 430, base * 3, 15, 1.1, 3, PF_WALLPASS);
      w.fx.sfx('shoot_slash', p.x);
    }
  }
  if (h.holyWater) {
    p.waterT -= dt;
    if (p.waterT <= 0 && any) {
      p.waterT = 3 / rate(h.holyWater);
      const t = nearestEnemy(w, p.x, p.y, 340, false);
      if (t >= 0) {
        // Lob: start point stored in tx/ty, target in vx/vy (see PF_LOB).
        const id = w.spawnProjectile(PROJ.FLASK, 0, p.x, p.y, E.x[t], E.y[t], base * 1.2 * h.holyWater, 8, 2, 0, PF_LOB | PF_WALLPASS);
        if (id >= 0) {
          w.projectiles.tx[id] = p.x;
          w.projectiles.ty[id] = p.y;
        }
      }
    }
  }
  if (h.requiem) {
    p.requiemT -= dt;
    if (p.requiemT <= 0 && any) {
      p.requiemT = 12 / (1 + 0.3 * (h.requiem - 1));
      w.fx.flash(0xfff6d0, 0.5);
      w.fx.ring(p.x, p.y, 0xfff0a8, 600, 0.7, 10);
      w.fx.sfx('explosion');
      w.fx.shake(6);
      for (let j = 0; j < E.slots.high; j++) {
        if (!E.slots.alive[j]) continue;
        w.fx.burst(E.x[j], E.y[j], 0xfff0a8, 6, 160, 5, 0.5, 'star');
        w.hitEnemy(j, base * 4, 0, false, 0, 0, 0);
      }
    }
  }
}
