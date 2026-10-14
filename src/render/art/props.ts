import { THEME } from '../../theme';
import { INK, type Pen } from '../pen';

const C = THEME;

// ── Interactables ───────────────────────────────────────────────────────────

export function drawChest(p: Pen, open: boolean, trim: number): void {
  const c = p.ctx;
  // Base
  c.roundRect(-18, -18, 36, 18, 3);
  p.part(0x8a4f2a);
  c.rect(-18, -14, 36, 3);
  p.shade(0x5e3219);
  c.rect(-14, -18, 5, 18);
  p.part(trim, 2);
  c.rect(9, -18, 5, 18);
  p.part(trim, 2);
  if (open) {
    // Lid flipped back + glowing contents
    c.moveTo(-18, -18).lineTo(-16, -34).lineTo(16, -34).lineTo(18, -18).closePath();
    p.part(0x5e3219);
    c.ellipse(0, -18, 14, 4);
    p.shade(0xfff0a8, 0.9);
  } else {
    c.moveTo(-18, -18).quadraticCurveTo(0, -36, 18, -18).closePath();
    p.part(0xa8643a);
    c.moveTo(-12, -24).quadraticCurveTo(0, -30, 8, -26);
    p.line(0xd08a5a, 2.5, 0.8);
    c.roundRect(-5, -22, 10, 10, 2);
    p.part(trim, 2);
    c.circle(0, -17, 1.8);
    p.shade(INK);
  }
}

export function drawMerchant(p: Pen): void {
  const c = p.ctx;
  // Big backpack of wares
  c.roundRect(-30, -52, 24, 40, 8);
  p.part(0x7a4a2a);
  c.circle(-24, -54, 6);
  p.part(0xe8344e, 2);
  c.circle(-12, -56, 5);
  p.part(0x5ec8ff, 2);
  // Robe
  p.poly([-14, -40, 14, -40, 20, 0, -20, 0], 0x4a3a6a);
  c.moveTo(-12, -38).lineTo(-6, -38).lineTo(-12, -4).closePath();
  p.shade(0x6a5a8a, 0.8);
  // Hood with shadowed face and glinting eyes
  c.moveTo(-16, -38).quadraticCurveTo(-18, -66, 0, -66).quadraticCurveTo(18, -66, 16, -38).closePath();
  p.part(0x4a3a6a);
  c.ellipse(2, -46, 10, 8);
  p.part(0x120a18, 2);
  if (!p.white) {
    p.glowEye(-1, -47, 2, 0xffd76a);
    p.glowEye(6, -47, 2, 0xffd76a);
  }
  // Long nose (cartoon!)
  c.moveTo(4, -45).quadraticCurveTo(16, -42, 6, -40).closePath();
  p.part(0xe9a985, 2);
  // Lantern on a stick
  c.moveTo(14, -30).lineTo(28, -54);
  p.line(INK, 5);
  c.moveTo(14, -30).lineTo(28, -54);
  p.line(0x6b3b23, 2.5);
  c.roundRect(24, -54, 10, 13, 3);
  p.part(C.candle, 2);
}

export function drawAnvil(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-10, -14, 20, 14, 3);
  p.part(0x3a3a4a);
  p.poly([-24, -26, 18, -26, 26, -22, 18, -16, -18, -16], 0x5a5f72);
  c.rect(-20, -25, 30, 3);
  p.shade(0x9aa1b0);
  // Hammer resting on top
  c.moveTo(-6, -28).lineTo(12, -40);
  p.line(INK, 6);
  c.moveTo(-6, -28).lineTo(12, -40);
  p.line(0x8a5a32, 3);
  c.roundRect(6, -48, 14, 9, 2);
  p.part(C.steelShade, 2.5);
}

export function drawCampfireLogs(p: Pen): void {
  const c = p.ctx;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    c.circle(Math.cos(a) * 18, Math.sin(a) * 8 - 2, 5);
    p.part(0x6a6a7a, 2);
  }
  c.moveTo(-14, 2).lineTo(14, -8);
  p.line(INK, 9);
  c.moveTo(-14, 2).lineTo(14, -8);
  p.line(0x7a4a2a, 6);
  c.moveTo(-14, -8).lineTo(14, 2);
  p.line(INK, 9);
  c.moveTo(-14, -8).lineTo(14, 2);
  p.line(0x8a5a32, 6);
}

export function drawFlame(p: Pen, scale = 1): void {
  const c = p.ctx;
  const s = scale;
  c.moveTo(0, -30 * s).quadraticCurveTo(14 * s, -14 * s, 9 * s, -2 * s).quadraticCurveTo(0, 4 * s, -9 * s, -2 * s).quadraticCurveTo(-14 * s, -14 * s, 0, -30 * s);
  p.part(C['enemy.alt'], 2.5 * s);
  c.moveTo(0, -20 * s).quadraticCurveTo(7 * s, -9 * s, 4 * s, -2 * s).quadraticCurveTo(0, 0, -4 * s, -2 * s).quadraticCurveTo(-7 * s, -9 * s, 0, -20 * s);
  p.shade(C.candleHot);
}

export function drawAltar(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-24, -20, 48, 20, 4);
  p.part(0x4a3a5a);
  c.rect(-24, -20, 48, 5);
  p.shade(0x6a5a7a);
  c.roundRect(-28, -26, 56, 8, 3);
  p.part(0x5a4a6a);
  // Blood chalice
  c.moveTo(-8, -40).lineTo(8, -40).quadraticCurveTo(6, -30, 2, -30).lineTo(2, -28).lineTo(-2, -28).lineTo(-2, -30).quadraticCurveTo(-6, -30, -8, -40);
  p.part(C.gold, 2.5);
  c.ellipse(0, -40, 7, 2.5);
  p.shade(C.blood);
  // Candles
  for (const x of [-18, 18]) {
    c.roundRect(x - 3, -40, 6, 14, 2);
    p.part(0xf1e6cf, 2);
  }
}

export function drawShrine(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-16, -12, 32, 12, 3);
  p.part(0x4a4f5e);
  p.poly([-10, -12, 10, -12, 7, -56, 0, -64, -7, -56], 0x6f7685);
  c.moveTo(-4, -54).lineTo(-4, -18);
  p.line(0x9aa1b0, 3, 0.6);
  c.circle(0, -40, 6);
  p.part(C.blood, 2);
}

export function drawPortalFrame(p: Pen): void {
  const c = p.ctx;
  c.ellipse(0, 0, 54, 20);
  p.part(0x2a1d36);
  c.ellipse(0, 0, 44, 15);
  p.part(0x150a1e, 2);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    c.roundRect(Math.cos(a) * 49 - 5, Math.sin(a) * 17.5 - 4, 10, 8, 2);
    p.part(0x6a5a7a, 2);
  }
}

export function drawPortalSwirl(p: Pen): void {
  const c = p.ctx;
  for (let arm = 0; arm < 3; arm++) {
    const off = (arm * Math.PI * 2) / 3;
    c.moveTo(0, 0);
    for (let t = 0; t < 4; t += 0.25) c.lineTo(Math.cos(t + off) * t * 10, Math.sin(t + off) * t * 3.6);
    p.line(arm === 0 ? 0xff4f6e : arm === 1 ? 0xb05cff : 0xffc23d, 4);
  }
}

// ── Doors ───────────────────────────────────────────────────────────────────

/** Exit door on the east edge. Origin = door centre tile centre; spans 3 tiles. */
export function drawDoor(p: Pen, open: boolean, tile: number, sealed: boolean, trim: number): void {
  const c = p.ctx;
  const h = tile * 3;
  const w = tile;
  // Stone frame
  c.roundRect(-w / 2 - 6, -h / 2 - 8, w + 12, h + 16, 10);
  p.part(0x3a2b45);
  // Opening
  c.roundRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 8);
  p.part(open ? 0x0d0714 : 0x2a1418, 2);
  if (open) {
    c.roundRect(-w / 2 + 6, -h / 2 + 8, w - 12, h - 16, 6);
    p.shade(trim, 0.35);
  } else {
    // Portcullis bars
    for (let y = -h / 2 + 10; y < h / 2 - 4; y += 12) {
      c.moveTo(-w / 2 + 4, y).lineTo(w / 2 - 4, y);
    }
    p.line(INK, 6);
    for (let y = -h / 2 + 10; y < h / 2 - 4; y += 12) {
      c.moveTo(-w / 2 + 4, y).lineTo(w / 2 - 4, y);
    }
    p.line(sealed ? 0x6a5f72 : 0x9aa1b0, 3);
    c.moveTo(0, -h / 2 + 4).lineTo(0, h / 2 - 4);
    p.line(INK, 6);
    c.moveTo(0, -h / 2 + 4).lineTo(0, h / 2 - 4);
    p.line(sealed ? 0x6a5f72 : 0x9aa1b0, 3);
    if (!sealed) {
      c.circle(0, 0, 6);
      p.part(C.gold, 2);
    }
  }
}

// ── Node badges (shown above exit doors) ────────────────────────────────────

export function drawBadge(p: Pen, kind: string, ring: number): void {
  const c = p.ctx;
  c.circle(0, 0, 17);
  p.part(0x1c1226, 3.5);
  c.circle(0, 0, 17);
  p.line(ring, 3);
  switch (kind) {
    case 'combat':
      c.moveTo(-8, 8).lineTo(8, -8).moveTo(8, 8).lineTo(-8, -8);
      p.line(INK, 6);
      c.moveTo(-8, 8).lineTo(8, -8).moveTo(8, 8).lineTo(-8, -8);
      p.line(C.steel, 3);
      break;
    case 'elite':
      c.circle(0, -1, 8);
      p.part(C.bone, 2);
      c.circle(-3, -1, 2.2).circle(3, -1, 2.2);
      p.shade(INK);
      p.poly([-7, -6, -12, -14, -4, -8], C['enemy.alt'], 1.5);
      p.poly([7, -6, 12, -14, 4, -8], C['enemy.alt'], 1.5);
      break;
    case 'event':
      c.moveTo(-5, -6).quadraticCurveTo(-5, -11, 0, -11).quadraticCurveTo(6, -11, 6, -6).quadraticCurveTo(6, -2, 0, 0).lineTo(0, 3);
      p.line(C.arcane, 4);
      c.circle(0, 8, 2.2);
      p.shade(C.arcane);
      break;
    case 'shop':
      c.circle(0, 2, 9);
      p.part(C.gold, 2);
      c.moveTo(-3, -1).lineTo(3, -1).moveTo(0, -4).lineTo(0, 8);
      p.line(C.goldShade, 2);
      c.roundRect(-4, -11, 8, 4, 2);
      p.part(C.gold, 1.5);
      break;
    case 'rest':
      p.poly([-8, 8, 8, 8, 0, 4], 0x7a4a2a, 2);
      c.moveTo(0, -11).quadraticCurveTo(8, -3, 5, 4).quadraticCurveTo(0, 7, -5, 4).quadraticCurveTo(-8, -3, 0, -11);
      p.part(C['enemy.alt'], 2);
      break;
    case 'boss':
      p.poly([-10, 4, -10, -8, -5, -2, 0, -11, 5, -2, 10, -8, 10, 4], C.gold, 2);
      c.circle(0, -2, 2);
      p.shade(C.blood);
      break;
    default:
      c.circle(0, 0, 6);
      p.part(ring, 2);
  }
}

// ── Pickups, familiars & projectiles ────────────────────────────────────────

export function drawSoul(p: Pen): void {
  const c = p.ctx;
  c.moveTo(0, -12).quadraticCurveTo(8, -4, 5, 3).quadraticCurveTo(0, 7, -5, 3).quadraticCurveTo(-8, -4, 0, -12);
  p.part(0x3ddc84, 2);
  c.circle(0, 0, 3);
  p.shade(0xeafff2);
}

export function drawGem(p: Pen): void {
  p.poly([0, -10, 7, -3, 0, 8, -7, -3], 0x4fa8ff, 2.5);
  p.ctx.poly([0, -10, 7, -3, 0, -1], true);
  p.shade(0xbfe6ff);
}

export function drawHeart(p: Pen): void {
  const c = p.ctx;
  c.moveTo(0, 8).bezierCurveTo(-14, -2, -8, -14, 0, -6).bezierCurveTo(8, -14, 14, -2, 0, 8);
  p.part(0xe8344e, 2.5);
  c.ellipse(-4, -5, 2.5, 1.8);
  p.shade(0xffffff, 0.8);
}

/** Cute fire-imp familiar (inspired by the reference's flame pet). */
export function drawImp(p: Pen): void {
  const c = p.ctx;
  c.moveTo(0, -16).quadraticCurveTo(4, -10, 9, -12).quadraticCurveTo(12, -2, 6, 5).quadraticCurveTo(0, 8, -6, 5).quadraticCurveTo(-12, -2, -9, -12).quadraticCurveTo(-4, -10, 0, -16);
  p.part(C['enemy.alt'], 2.5);
  c.ellipse(0, 0, 5, 4);
  p.shade(C.candleHot);
  p.eye(-3, -4, 2.4, 0.2);
  p.eye(3, -4, 2.4, 0.2);
}

export function drawScythe(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-26, 0).lineTo(26, 0);
  p.line(INK, 8);
  c.moveTo(-26, 0).lineTo(26, 0);
  p.line(0x4a3a5a, 4);
  c.moveTo(22, -2).quadraticCurveTo(30, -30, 2, -38).quadraticCurveTo(20, -24, 16, -2).closePath();
  p.part(0xdfe8f5);
  c.moveTo(20, -6).quadraticCurveTo(24, -24, 8, -32);
  p.line(0xb05cff, 2);
}

export function drawCross(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-12, -4).lineTo(-4, -4).lineTo(-4, -12).lineTo(4, -12).lineTo(4, -4).lineTo(12, -4).lineTo(12, 4).lineTo(4, 4).lineTo(4, 12).lineTo(-4, 12).lineTo(-4, 4).lineTo(-12, 4).closePath();
  p.part(C.gold, 2.5);
  c.rect(-2, -10, 3, 20);
  p.shade(0xfff0a8, 0.8);
}

export function drawAxe(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-12, 0).lineTo(12, 0);
  p.line(INK, 7);
  c.moveTo(-12, 0).lineTo(12, 0);
  p.line(0x8a5a32, 3.5);
  c.moveTo(6, -2).quadraticCurveTo(22, -16, 18, 4).quadraticCurveTo(14, -2, 6, 3).closePath();
  p.part(C.steel, 2.5);
}

export function drawFlask(p: Pen): void {
  const c = p.ctx;
  c.circle(0, 2, 7);
  p.part(0x7fd6ff, 2.5);
  c.roundRect(-3, -9, 6, 6, 1);
  p.part(0xdfe8f5, 2);
  c.circle(-2, 0, 2);
  p.shade(0xffffff, 0.9);
}

export function drawDaggerProj(p: Pen): void {
  p.poly([-8, -2.5, 6, -2.5, 12, 0, 6, 2.5, -8, 2.5], 0xdfe8f5, 2);
  p.ctx.rect(-10, -4, 3, 8);
  p.part(C.gold, 1.5);
}

export function drawShard(p: Pen): void {
  p.poly([-6, 0, 0, -3, 7, 0, 0, 3], 0xd8a8ff, 1.5);
}

export function drawOrb(p: Pen): void {
  const c = p.ctx;
  c.circle(0, 0, 7);
  p.part(0xd06cff, 2.5);
  c.circle(-2, -2, 3);
  p.shade(0xffffff);
}

export function drawWave(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-4, -18).quadraticCurveTo(14, 0, -4, 18).quadraticCurveTo(4, 0, -4, -18);
  p.part(0xfff0d0, 2);
}

export function drawArrow(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-12, 0).lineTo(8, 0);
  p.line(INK, 5);
  c.moveTo(-12, 0).lineTo(8, 0);
  p.line(C.bone, 2.5);
  p.poly([6, -4, 13, 0, 6, 4], C['enemy.alt'], 1.5);
}

export function drawFireball(p: Pen): void {
  const c = p.ctx;
  c.moveTo(9, 0).quadraticCurveTo(4, -9, -12, -4).quadraticCurveTo(-6, 0, -12, 4).quadraticCurveTo(4, 9, 9, 0);
  p.part(C['enemy.alt'], 2.5);
  c.circle(3, 0, 4);
  p.shade(C.candleHot);
}

export function drawRuneBolt(p: Pen): void {
  p.poly([-8, 0, 0, -6, 8, 0, 0, 6], C.rune, 2.5);
  p.ctx.circle(0, 0, 2.5);
  p.shade(0xffffff);
}

export function drawBloodBullet(p: Pen): void {
  const c = p.ctx;
  c.circle(0, 0, 6);
  p.part(0xff2244, 2.5);
  c.circle(-1.5, -1.5, 2);
  p.shade(0xffc0c8);
}

export function drawBone(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-8, 0).lineTo(8, 0);
  p.line(INK, 6);
  c.moveTo(-8, 0).lineTo(8, 0);
  p.line(C.bone, 3);
  for (const x of [-8, 8]) {
    c.circle(x, -2, 2.8).circle(x, 2, 2.8);
    p.part(C.bone, 1.5);
  }
}
