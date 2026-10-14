import { THEME } from '../../theme';
import { INK, type Pen } from '../pen';

// All characters face right, feet at (0, 0), body extending upward (−y).
// Style: chibi proportions, thick ink outline, flat fill + one cel highlight.

const C = THEME;

// ── Heroes ──────────────────────────────────────────────────────────────────

export function drawVanguard(p: Pen): void {
  const c = p.ctx;
  // Kite shield on the back arm (Triangle motif).
  p.poly([-24, -34, -6, -34, -6, -18, -15, -4, -24, -18], C.steel);
  c.poly([-21, -31, -9, -31, -9, -19, -15, -9, -21, -19], true);
  p.shade(0xc8283c);
  p.poly([-15, -28, -11, -18, -19, -18], C.gold, 2);
  // Legs
  c.roundRect(-9, -12, 7, 12, 3);
  p.part(C.steelShade);
  c.roundRect(2, -12, 7, 12, 3);
  p.part(C.steelShade);
  // Torso: crimson plate with gold belt
  c.roundRect(-12, -28, 24, 19, 7);
  p.part(0xc8283c);
  c.roundRect(-9, -26, 8, 10, 4);
  p.shade(0xff6a7a, 0.6);
  c.rect(-12, -14, 24, 4);
  p.part(C.gold, 2);
  // Chest triangle emblem
  p.poly([-5, -25, 5, -25, 0, -17], C.gold, 2);
  // Crusader crest (big red plume arcing over the helmet)
  c.moveTo(-16, -44).quadraticCurveTo(-14, -66, 4, -64).quadraticCurveTo(16, -62, 14, -52).quadraticCurveTo(6, -58, -2, -56).quadraticCurveTo(-10, -54, -10, -44).closePath();
  p.part(0xe8344e);
  c.moveTo(-12, -50).quadraticCurveTo(-10, -60, 0, -61);
  p.line(0xff8a9a, 2.5);
  // Helmet
  c.circle(0, -40, 14.5);
  p.part(0xb4c0d4);
  c.ellipse(-6, -47, 5, 3.5);
  p.shade(0xffffff, 0.6);
  // T-shaped visor opening showing the face
  c.moveTo(-3, -44).lineTo(13, -44).lineTo(13, -36).lineTo(8, -36).lineTo(8, -30).lineTo(1, -30).lineTo(1, -36).lineTo(-3, -36).closePath();
  p.part(C.skin, 2.5);
  p.eye(4, -40, 2.8, 0.4);
  p.eye(10, -40, 2.6, 0.4);
  // Helmet rivets + cheek guard line
  if (!p.white) {
    c.circle(-8, -36, 1.4).circle(-10, -42, 1.4);
    p.shade(C.steelShade);
  }
  // Front hand
  c.circle(8, -18, 4.5);
  p.part(C.steelShade, 2);
}

export function drawSword(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-6, -2.5, 9, 5, 2);
  p.part(0x6b3b23, 2);
  c.roundRect(2, -7, 4, 14, 2);
  p.part(C.gold, 2);
  c.moveTo(6, -4).lineTo(32, -3).lineTo(38, 0).lineTo(32, 3).lineTo(6, 4).closePath();
  p.part(C.steel);
  c.moveTo(8, -1.5).lineTo(32, -1).lineTo(34, 0).lineTo(8, 0).closePath();
  p.shade(0xffffff, 0.8);
}

export function drawWeaver(p: Pen): void {
  const c = p.ctx;
  // Ponytail behind the head (white hair, like a moon-elf witch)
  c.moveTo(-8, -46).quadraticCurveTo(-26, -44, -24, -26).quadraticCurveTo(-20, -32, -14, -30).quadraticCurveTo(-18, -38, -6, -40).closePath();
  p.part(0xf2eefa);
  // Legs
  c.roundRect(-7, -12, 5, 12, 2);
  p.part(0x3a1f5c);
  c.roundRect(2, -12, 5, 12, 2);
  p.part(0x3a1f5c);
  // Robe skirt
  p.poly([-12, -24, 12, -24, 15, -8, -15, -8], 0x7a3cc8);
  c.rect(-15, -11, 30, 3);
  p.shade(C.gold);
  // Torso + red sash
  c.roundRect(-10, -30, 20, 12, 5);
  p.part(0x8f4ee0);
  c.moveTo(-10, -27).lineTo(10, -21).lineTo(10, -18).lineTo(-10, -24).closePath();
  p.shade(0xe8344e);
  // Head
  c.circle(0, -40, 13);
  p.part(C.skin);
  // Pointed elf ear
  p.poly([-10, -42, -22, -50, -11, -36], C.skin, 2.5);
  // Eyes
  p.eye(3, -39, 3.6, 0.35);
  p.eye(10, -39, 3.2, 0.35);
  if (!p.white) {
    c.circle(1, -33, 2);
    p.shade(0xff9eb0, 0.7);
  }
  // White hair bangs
  c.moveTo(-13, -40).quadraticCurveTo(-14, -56, 2, -55).quadraticCurveTo(14, -54, 14, -44).lineTo(9, -47).lineTo(6, -43).lineTo(2, -48).lineTo(-3, -44).lineTo(-6, -48).lineTo(-10, -38).closePath();
  p.part(0xf2eefa);
  c.ellipse(-2, -51, 6, 2.5);
  p.shade(0xffffff, 0.9);
  // Circlet gem
  c.circle(5, -49, 2.6);
  p.part(0xe8344e, 1.5);
  // Front hand
  c.circle(8, -20, 4);
  p.part(C.skin, 2);
}

export function drawStaff(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-10, -2.5, 46, 5, 2.5);
  p.part(0x6b3b23, 2.5);
  // Crescent moon head
  c.moveTo(36, -12).quadraticCurveTo(50, -8, 48, 4).quadraticCurveTo(46, -4, 38, -4).closePath();
  p.part(C.gold, 2);
  c.circle(41, 0, 5);
  p.part(0xd06cff, 2);
  c.circle(40, -1.5, 1.8);
  p.shade(0xffffff);
}

/** Orbital rune ring around the Weaver (Orbital ring motif). */
export function drawRuneRing(p: Pen): void {
  const c = p.ctx;
  c.circle(0, 0, 24);
  p.line(C.arcane, 2.5, 0.85);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const x = Math.cos(a) * 24;
    const y = Math.sin(a) * 24;
    p.poly([x, y - 5, x + 3.5, y, x, y + 5, x - 3.5, y], 0xd8a8ff, 1.5);
  }
}

export function drawPhantom(p: Pen): void {
  const c = p.ctx;
  // Scarf tail flowing behind
  c.moveTo(-6, -32).quadraticCurveTo(-22, -34, -30, -24).lineTo(-24, -26).lineTo(-26, -18).quadraticCurveTo(-16, -28, -4, -26).closePath();
  p.part(0xd8203c);
  // Legs
  c.roundRect(-7, -11, 6, 11, 2);
  p.part(0x283040);
  c.roundRect(2, -11, 6, 11, 2);
  p.part(0x283040);
  // Tattered cloak
  p.poly([-12, -32, 12, -32, 15, -12, 10, -8, 6, -12, 1, -7, -4, -12, -9, -8, -15, -12], 0x1f5068);
  c.moveTo(-10, -30).lineTo(-4, -30).lineTo(-8, -14).lineTo(-12, -14).closePath();
  p.shade(0x3f86a8, 0.6);
  // Diamond clasp (Diamond motif)
  p.poly([0, -31, 4, -26, 0, -21, -4, -26], 0x5ec8ff, 2);
  // Scarf wrap
  c.roundRect(-11, -35, 22, 6, 3);
  p.part(0xd8203c, 2.5);
  // Hood
  c.moveTo(-14, -36).quadraticCurveTo(-16, -58, 2, -57).quadraticCurveTo(16, -56, 15, -36).closePath();
  p.part(0x1f5068);
  c.moveTo(-10, -50).quadraticCurveTo(-6, -56, 2, -55);
  p.line(0x3f86a8, 2.5, 0.8);
  // Face shadow with glowing eyes
  c.ellipse(4, -42, 9, 7);
  p.part(0x0b1420, 2);
  if (!p.white) {
    p.glowEye(2, -42, 2.2, 0x5ec8ff);
    p.glowEye(8, -42, 2.2, 0x5ec8ff);
  }
  // Hand
  c.circle(8, -20, 4);
  p.part(0x283040, 2);
}

export function drawDagger(p: Pen): void {
  const c = p.ctx;
  c.roundRect(-5, -2, 8, 4, 2);
  p.part(0x283040, 2);
  c.roundRect(2, -5, 3, 10, 1.5);
  p.part(C.gold, 1.5);
  c.moveTo(5, -3).quadraticCurveTo(18, -5, 24, 0).quadraticCurveTo(16, 1, 5, 3).closePath();
  p.part(0xdfe8f5, 2.5);
  c.moveTo(7, -1).quadraticCurveTo(16, -2.5, 21, -0.5);
  p.line(0x5ec8ff, 1.5);
}

// ── Monsters ────────────────────────────────────────────────────────────────

export function drawBatBody(p: Pen): void {
  const c = p.ctx;
  p.poly([-6, -32, -9, -42, -2, -35], 0x4a2766, 2.5);
  p.poly([6, -32, 9, -42, 2, -35], 0x4a2766, 2.5);
  c.circle(0, -26, 10);
  p.part(0x4a2766);
  c.ellipse(-3, -30, 4, 3);
  p.shade(0x7a4ea0, 0.8);
  if (!p.white) {
    p.glowEye(-3.5, -27, 2.4, 0xff3355);
    p.glowEye(3.5, -27, 2.4, 0xff3355);
  }
  p.poly([-3, -21, -1, -21, -2, -17], 0xffffff, 1.2);
  p.poly([1, -21, 3, -21, 2, -17], 0xffffff, 1.2);
}

/** Left wing; the right wing is the same context mirrored. */
export function drawBatWing(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-6, -28).lineTo(-20, -40).lineTo(-30, -34).lineTo(-26, -26).lineTo(-21, -29).lineTo(-17, -22).lineTo(-12, -26).lineTo(-8, -21).closePath();
  p.part(0x3a1f52);
  c.moveTo(-8, -26).lineTo(-21, -36);
  p.line(0x6a3f8a, 1.5);
}

function skull(p: Pen, x: number, y: number, r: number, eye = 0xff3355): void {
  const c = p.ctx;
  c.circle(x, y, r);
  p.part(C.bone);
  c.roundRect(x - r * 0.45, y + r * 0.55, r * 0.95, r * 0.55, 2);
  p.part(C.bone, 2.5);
  c.ellipse(x - r * 0.35, y - r * 0.35, r * 0.35, r * 0.22);
  p.shade(0xffffff, 0.7);
  c.ellipse(x - r * 0.05, y + r * 0.05, r * 0.3, r * 0.34);
  p.shade(INK);
  c.ellipse(x + r * 0.55, y + r * 0.05, r * 0.26, r * 0.32);
  p.shade(INK);
  if (!p.white) {
    p.glowEye(x - r * 0.05, y + r * 0.08, r * 0.12, eye);
    p.glowEye(x + r * 0.55, y + r * 0.08, r * 0.11, eye);
  }
  c.moveTo(x - r * 0.1, y + r * 0.62).lineTo(x - r * 0.1, y + r * 1.05);
  c.moveTo(x + r * 0.2, y + r * 0.62).lineTo(x + r * 0.2, y + r * 1.05);
  p.line(INK, 1.5);
}

export function drawSkeleton(p: Pen): void {
  const c = p.ctx;
  // Legs
  c.moveTo(-4, -14).lineTo(-6, 0);
  c.moveTo(4, -14).lineTo(5, 0);
  p.line(INK, 6);
  c.moveTo(-4, -14).lineTo(-6, 0);
  c.moveTo(4, -14).lineTo(5, 0);
  p.line(C.bone, 3);
  // Rib cage
  c.roundRect(-8, -27, 16, 14, 5);
  p.part(C.bone);
  c.moveTo(-6, -23).lineTo(6, -23).moveTo(-6, -19).lineTo(6, -19);
  p.line(C.boneShade, 2);
  // Back arm
  c.moveTo(-6, -24).lineTo(-12, -14);
  p.line(INK, 6);
  c.moveTo(-6, -24).lineTo(-12, -14);
  p.line(C.bone, 3);
  skull(p, 1, -36, 12);
  // Rusty sword in front hand
  c.moveTo(8, -20).lineTo(24, -30);
  p.line(INK, 7);
  c.moveTo(8, -20).lineTo(24, -30);
  p.line(0xb98a6a, 4);
  c.circle(7, -19, 3.5);
  p.part(C.bone, 2);
}

export function drawGhoul(p: Pen): void {
  const c = p.ctx;
  // Back arm hanging
  c.moveTo(-10, -26).quadraticCurveTo(-16, -14, -12, -4);
  p.line(INK, 9);
  c.moveTo(-10, -26).quadraticCurveTo(-16, -14, -12, -4);
  p.line(0x6f8a5c, 5);
  // Legs
  c.roundRect(-9, -10, 7, 10, 3);
  p.part(0x5b6f4c);
  c.roundRect(3, -10, 7, 10, 3);
  p.part(0x5b6f4c);
  // Hunched body
  c.ellipse(0, -22, 15, 15);
  p.part(0x7f9a6a);
  c.ellipse(-5, -28, 6, 5);
  p.shade(0xa9c48f, 0.7);
  // Rags
  p.poly([-15, -26, 14, -30, 16, -16, 10, -20, 6, -13, 0, -19, -6, -12, -10, -19, -15, -14], 0x5c2d6e);
  // Head jutting forward
  c.circle(9, -34, 10);
  p.part(0x8fae78);
  p.eye(12, -36, 4.2, 0.2, INK, 0xfff27a);
  c.moveTo(6, -28).lineTo(16, -28);
  p.line(INK, 2);
  c.moveTo(8, -30).lineTo(8, -26).moveTo(11, -30).lineTo(11, -26).moveTo(14, -30).lineTo(14, -26);
  p.line(INK, 1.2);
  // Front claw arm
  c.moveTo(10, -22).quadraticCurveTo(20, -14, 18, -4);
  p.line(INK, 9);
  c.moveTo(10, -22).quadraticCurveTo(20, -14, 18, -4);
  p.line(0x8fae78, 5);
}

export function drawArcher(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-4, -14).lineTo(-6, 0).moveTo(4, -14).lineTo(5, 0);
  p.line(INK, 6);
  c.moveTo(-4, -14).lineTo(-6, 0).moveTo(4, -14).lineTo(5, 0);
  p.line(C.bone, 3);
  c.roundRect(-8, -27, 16, 14, 5);
  p.part(C.bone);
  // Orange hood & cape
  p.poly([-12, -44, 6, -50, 14, -36, 10, -24, -10, -12, -14, -24], C['enemy.alt']);
  skull(p, 2, -36, 10, 0xffb43d);
  p.poly([-10, -42, 2, -51, 12, -42, 2, -46], 0xd9661a, 2);
  // Bow
  c.moveTo(14, -44).quadraticCurveTo(28, -28, 14, -10);
  p.line(INK, 6);
  c.moveTo(14, -44).quadraticCurveTo(28, -28, 14, -10);
  p.line(0x8a5a32, 3);
  c.moveTo(14, -44).lineTo(14, -10);
  p.line(0xf1e6cf, 1.2);
}

export function drawWitch(p: Pen): void {
  const c = p.ctx;
  // Tattered floating robe
  p.poly([-14, -30, 14, -30, 18, -8, 12, -12, 8, -4, 2, -10, -4, -3, -8, -10, -14, -5, -18, -12], 0x3a1f52);
  c.moveTo(-10, -28).lineTo(-4, -28).lineTo(-10, -12).closePath();
  p.shade(0x5c3a7a, 0.8);
  // Head
  c.circle(0, -38, 11);
  p.part(0x8fd06a);
  c.moveTo(9, -38).lineTo(15, -35).lineTo(9, -34).closePath();
  p.part(0x8fd06a, 2);
  p.eye(2, -39, 3.2, 0.3, INK, 0xfff27a);
  p.eye(8, -39, 2.8, 0.3, INK, 0xfff27a);
  c.moveTo(1, -32).quadraticCurveTo(5, -30, 9, -32);
  p.line(INK, 1.5);
  // Big pointy hat
  c.ellipse(0, -46, 17, 5);
  p.part(0x5c2d8a);
  p.poly([-10, -48, 10, -48, -2, -72, -12, -64], 0x5c2d8a);
  c.rect(-9, -51, 18, 4);
  p.shade(0xff8a2a);
  // Fireball in hand
  c.circle(15, -22, 6);
  p.part(0xff8a2a, 2);
  c.circle(14, -23, 3);
  p.shade(0xfff0a8);
}

export function drawKnight(p: Pen): void {
  const c = p.ctx;
  // Legs
  c.roundRect(-12, -14, 10, 14, 3);
  p.part(C.steelShade);
  c.roundRect(3, -14, 10, 14, 3);
  p.part(C.steelShade);
  // Bulky torso
  c.roundRect(-17, -40, 34, 28, 10);
  p.part(C.steel);
  c.roundRect(-13, -37, 10, 12, 5);
  p.shade(0xffffff, 0.45);
  c.rect(-17, -18, 34, 5);
  p.part(0x6b3b23, 2);
  // Pauldrons
  c.circle(-17, -38, 8);
  p.part(C.steelShade);
  c.circle(17, -38, 8);
  p.part(C.steelShade);
  // Helmet with horns
  p.poly([-14, -52, -24, -64, -18, -50], C.bone, 2.5);
  p.poly([14, -52, 24, -64, 18, -50], C.bone, 2.5);
  c.roundRect(-13, -62, 26, 22, 9);
  p.part(C.steel);
  c.rect(-8, -54, 18, 4);
  p.shade(INK);
  if (!p.white) {
    c.rect(-6, -53, 14, 2);
    p.shade(0xff3355);
  }
  // Great axe
  c.moveTo(14, -10).lineTo(26, -58);
  p.line(INK, 8);
  c.moveTo(14, -10).lineTo(26, -58);
  p.line(0x6b3b23, 4);
  c.moveTo(24, -58).quadraticCurveTo(44, -60, 40, -40).quadraticCurveTo(32, -46, 22, -44).closePath();
  p.part(C.steel);
}

export function drawGargoyle(p: Pen): void {
  const c = p.ctx;
  const stone = 0x6f7685;
  // Wings
  c.moveTo(-6, -34).lineTo(-30, -50).lineTo(-34, -30).lineTo(-26, -34).lineTo(-24, -24).lineTo(-16, -30).lineTo(-8, -24).closePath();
  p.part(0x4f5566);
  c.moveTo(6, -34).lineTo(28, -52).lineTo(34, -32).lineTo(26, -35).lineTo(24, -25).lineTo(16, -30).lineTo(8, -24).closePath();
  p.part(0x4f5566);
  // Crouched body
  c.ellipse(0, -22, 14, 13);
  p.part(stone);
  c.ellipse(-4, -27, 6, 4);
  p.shade(0x9aa1b0, 0.8);
  // Head with horns
  p.poly([-8, -40, -12, -54, -3, -43], C.bone, 2.5);
  p.poly([8, -40, 12, -54, 3, -43], C.bone, 2.5);
  c.circle(2, -38, 11);
  p.part(stone);
  if (!p.white) {
    p.glowEye(-2, -38, 2.4, 0xff8a2a);
    p.glowEye(6, -38, 2.4, 0xff8a2a);
  }
  c.moveTo(-3, -31).lineTo(7, -31);
  p.line(INK, 2);
  // Claws
  c.circle(-10, -10, 5);
  p.part(stone, 2.5);
  c.circle(10, -10, 5);
  p.part(stone, 2.5);
}

// ── Bosses ──────────────────────────────────────────────────────────────────

export function drawOgre(p: Pen): void {
  const c = p.ctx;
  const g = C.ogre;
  const gs = C.ogreShade;
  // Legs
  c.roundRect(-34, -34, 26, 34, 10);
  p.part(gs);
  c.roundRect(8, -34, 26, 34, 10);
  p.part(gs);
  // Spiked anklets
  c.roundRect(-36, -12, 30, 8, 3);
  p.part(0x5a3a2a, 2.5);
  c.roundRect(6, -12, 30, 8, 3);
  p.part(0x5a3a2a, 2.5);
  // Back arm
  c.circle(-50, -70, 16);
  p.part(gs);
  // Belly
  c.ellipse(0, -72, 52, 46);
  p.part(g);
  c.ellipse(-16, -92, 20, 12);
  p.shade(0xb0f07a, 0.6);
  c.ellipse(4, -56, 30, 18);
  p.shade(gs, 0.6);
  // Loincloth
  p.poly([-30, -38, 30, -38, 22, -14, 6, -22, -8, -14, -24, -22], 0x7a4a2a);
  c.rect(-36, -44, 72, 8);
  p.part(0x5a3a2a, 2.5);
  // Spiked shoulder pads
  for (const sx of [-40, 40]) {
    c.ellipse(sx, -104, 22, 14);
    p.part(0x4a4f5e);
    for (let k = -1; k <= 1; k++) p.poly([sx + k * 12 - 4, -112, sx + k * 12, -132, sx + k * 12 + 4, -112], C.steel, 2.5);
  }
  // Left head (horned)
  c.circle(-24, -124, 24);
  p.part(g);
  p.poly([-34, -142, -44, -170, -26, -146], 0xfff0c8, 3);
  p.eye(-28, -128, 6.5, 0.5, INK, 0xfff27a);
  p.eye(-14, -128, 6, 0.5, INK, 0xfff27a);
  c.moveTo(-36, -138).lineTo(-24, -134);
  p.line(INK, 4);
  c.moveTo(-32, -112).quadraticCurveTo(-21, -106, -10, -112);
  p.line(INK, 3);
  p.poly([-30, -112, -28, -120, -25, -112], 0xffffff, 2);
  p.poly([-16, -112, -14, -120, -11, -112], 0xffffff, 2);
  // Right head (topknot)
  c.circle(22, -122, 22);
  p.part(g);
  c.moveTo(18, -142).quadraticCurveTo(34, -160, 26, -170).quadraticCurveTo(22, -156, 12, -146).closePath();
  p.part(0x2a1a14);
  p.eye(20, -124, 5.8, 0.6, INK, 0xfff27a);
  p.eye(33, -124, 5.4, 0.6, INK, 0xfff27a);
  c.moveTo(26, -136).lineTo(38, -132);
  p.line(INK, 4);
  c.moveTo(16, -110).lineTo(36, -110);
  p.line(INK, 3);
  // Skull necklace
  for (let k = -2; k <= 2; k++) {
    c.circle(k * 11, -96 + Math.abs(k) * -3, 5);
    p.part(C.bone, 2);
  }
}

export function drawOgreClub(p: Pen): void {
  const c = p.ctx;
  // Pivot at the shoulder, pointing +x.
  c.circle(0, 0, 15);
  p.part(C.ogreShade);
  c.roundRect(6, -8, 40, 16, 8);
  p.part(C.ogre);
  c.moveTo(40, -10).lineTo(98, -18).lineTo(102, 18).lineTo(40, 10).closePath();
  p.part(0x8a5a32);
  c.moveTo(48, -6).lineTo(94, -10);
  p.line(0xb57a4a, 3);
  for (let k = 0; k < 4; k++) {
    const x = 56 + k * 13;
    p.poly([x - 4, -12 - k, x, -26 - k * 1.5, x + 4, -12 - k], C.steel, 2);
    p.poly([x - 4, 12 + k, x, 26 + k * 1.5, x + 4, 12 + k], C.steel, 2);
  }
}

export function drawGolem(p: Pen): void {
  const c = p.ctx;
  const s = C.golem;
  const sd = C.golemShade;
  const hi = 0x56648a;
  // Legs (boulders)
  c.roundRect(-40, -40, 30, 40, 12);
  p.part(sd);
  c.roundRect(10, -40, 30, 40, 12);
  p.part(sd);
  // Arms (huge boulder fists)
  c.roundRect(-74, -118, 30, 52, 14);
  p.part(s);
  c.circle(-60, -58, 20);
  p.part(sd);
  c.roundRect(44, -118, 30, 52, 14);
  p.part(s);
  c.circle(60, -58, 20);
  p.part(sd);
  // Torso
  c.moveTo(-50, -130).lineTo(50, -130).lineTo(44, -40).lineTo(-44, -40).closePath();
  p.part(s);
  c.moveTo(-44, -126).lineTo(-6, -126).lineTo(-12, -100).lineTo(-42, -96).closePath();
  p.shade(hi, 0.8);
  // Head block
  c.roundRect(-26, -170, 52, 42, 12);
  p.part(s);
  c.roundRect(-22, -166, 18, 10, 5);
  p.shade(hi, 0.8);
  c.roundRect(-18, -154, 36, 12, 5);
  p.part(INK, 2);
  if (!p.white) {
    c.roundRect(-14, -151, 10, 6, 3);
    p.shade(0xff2244);
    c.roundRect(4, -151, 10, 6, 3);
    p.shade(0xff2244);
  }
  // Shoulder plates
  c.roundRect(-62, -138, 34, 22, 9);
  p.part(sd);
  c.roundRect(28, -138, 34, 22, 9);
  p.part(sd);
}

/** The blue spiral rune on the golem's chest + arm runes (drawn on the glow layer). */
export function drawGolemRunes(p: Pen): void {
  const c = p.ctx;
  // Spiral
  c.moveTo(0, -86);
  for (let t = 0; t < 10.5; t += 0.35) {
    const r = 2 + t * 2.4;
    c.lineTo(Math.cos(t) * r, -86 + Math.sin(t) * r);
  }
  p.line(C.rune, 6);
  c.moveTo(-64, -104).lineTo(-56, -94).lineTo(-64, -84);
  c.moveTo(64, -104).lineTo(56, -94).lineTo(64, -84);
  p.line(C.rune, 4);
}

export function drawGolemCracks(p: Pen): void {
  const c = p.ctx;
  c.moveTo(-30, -124).lineTo(-20, -110).lineTo(-28, -96).lineTo(-16, -80);
  c.moveTo(34, -60).lineTo(22, -70).lineTo(30, -84);
  c.moveTo(-36, -60).lineTo(-24, -52).lineTo(-30, -44);
  c.moveTo(-6, -168).lineTo(2, -160).lineTo(-2, -150);
  p.line(C.crack, 4);
}

export function drawCount(p: Pen): void {
  const c = p.ctx;
  // Cape (behind)
  c.moveTo(-14, -78).quadraticCurveTo(-58, -40, -46, 0).lineTo(-30, -8).lineTo(-18, 2).lineTo(0, -6).lineTo(18, 2).lineTo(30, -8).lineTo(46, 0).quadraticCurveTo(58, -40, 14, -78).closePath();
  p.part(C.capeInner);
  c.moveTo(-14, -76).quadraticCurveTo(-48, -40, -38, -4).lineTo(-26, -10).quadraticCurveTo(-30, -50, -10, -72).closePath();
  p.shade(C.cape);
  // Legs
  c.roundRect(-10, -26, 8, 26, 3);
  p.part(0x1a1420);
  c.roundRect(3, -26, 8, 26, 3);
  p.part(0x1a1420);
  // Suit body
  p.poly([-16, -70, 16, -70, 13, -24, -13, -24], 0x1a1420);
  p.poly([-7, -70, 7, -70, 4, -36, -4, -36], 0x9a0f2e, 2);
  c.moveTo(-3, -66).lineTo(3, -66).lineTo(0, -58).closePath();
  p.shade(0xffffff);
  // High collar
  p.poly([-16, -70, -30, -96, -12, -78], C.cape, 3);
  p.poly([16, -70, 30, -96, 12, -78], C.cape, 3);
  // Head
  c.ellipse(0, -86, 13, 15);
  p.part(C.vampire);
  // Slick black hair with widow's peak
  c.moveTo(-14, -88).quadraticCurveTo(-16, -106, 0, -104).quadraticCurveTo(16, -106, 14, -88).lineTo(8, -96).lineTo(0, -88).lineTo(-8, -96).closePath();
  p.part(0x120a18);
  if (!p.white) {
    p.glowEye(-5, -86, 2.6, 0xff2244);
    p.glowEye(5, -86, 2.6, 0xff2244);
  }
  c.moveTo(-5, -77).quadraticCurveTo(0, -75, 5, -77);
  p.line(INK, 1.8);
  p.poly([-3, -77, -2, -73, -1, -77], 0xffffff, 1);
  p.poly([1, -77, 2, -73, 3, -77], 0xffffff, 1);
  // Medallion
  c.circle(0, -54, 5);
  p.part(C.gold, 2);
  c.circle(0, -54, 2.2);
  p.shade(0xe8344e);
  // Hands
  c.circle(-18, -40, 4.5);
  p.part(C.vampire, 2);
  c.circle(18, -40, 4.5);
  p.part(C.vampire, 2);
}
