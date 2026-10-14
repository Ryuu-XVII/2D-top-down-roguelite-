import { BitmapText, Container, Graphics, GraphicsContext, Sprite, type Texture } from 'pixi.js';
import { CONFIG } from '../config';
import { TILE_DOOR, TILE_FLOOR, TILE_SEALED, TILE_WALL } from '../gen/grid';
import type { FloorGraph } from '../gen/graph';
import type { Decor, RoomMap } from '../gen/room';
import { THEME, type FloorTheme } from '../theme';
import { INK, Pen } from './pen';
import type { ShapeCache } from './shapes';

const T = CONFIG.tile;

const hash2 = (x: number, y: number, s: number): number => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const NODE_LABEL: Record<string, string> = {
  combat: 'BATTLE',
  elite: 'ELITE',
  event: 'MYSTERY',
  shop: 'SHOP',
  rest: 'SANCTUARY',
  boss: 'BOSS',
};

interface Flicker {
  g: Container;
  base: number;
  phase: number;
}

/** Static castle geometry for one room, built once on room entry. */
export class RoomView {
  readonly root = new Container();
  /** Additive light layer (window beams, torch glows). */
  readonly lights = new Container();
  private flames: Flicker[] = [];
  private glows: Flicker[] = [];
  private exitDoors: Graphics[] = [];
  private badges: Container[] = [];
  private lockedState = true;
  private readonly statics: GraphicsContext[] = [];

  constructor(
    private room: RoomMap,
    private theme: FloorTheme,
    private shapes: ShapeCache,
    glowTex: Texture,
    graph: FloorGraph,
    locked: boolean,
    fontName: string,
  ) {
    this.lights.blendMode = 'add';
    const floorCtx = new GraphicsContext();
    const wallCtx = new GraphicsContext();
    const decorCtx = new GraphicsContext();
    const lightCtx = new GraphicsContext();
    this.statics.push(floorCtx, wallCtx, decorCtx, lightCtx);
    this.drawFloor(floorCtx);
    this.drawWalls(wallCtx);
    this.root.addChild(new Graphics(floorCtx), new Graphics(wallCtx), new Graphics(decorCtx));
    for (const d of room.decor) this.drawDecor(decorCtx, lightCtx, d, glowTex);
    const lightG = new Graphics(lightCtx);
    this.lights.addChild(lightG);

    // Doors
    if (room.entrance) {
      const g = new Graphics(shapes.doors.sealed);
      g.position.set(room.entrance.x * T + T / 2, room.entrance.y * T + T / 2);
      this.root.addChild(g);
    }
    for (const e of room.exits) {
      const g = new Graphics(locked ? shapes.doors.locked : shapes.doors.open);
      g.position.set(e.x * T + T / 2, e.y * T + T / 2);
      this.root.addChild(g);
      this.exitDoors.push(g);
      const kind = graph.nodes[e.target]?.type ?? 'combat';
      const badge = new Container();
      const b = new Graphics(shapes.badges[kind] ?? shapes.badges.combat);
      badge.addChild(b);
      const label = new BitmapText({ text: NODE_LABEL[kind] ?? kind.toUpperCase(), style: { fontFamily: fontName, fontSize: 11 } });
      label.anchor.set(0.5, 0);
      label.position.set(0, 20);
      badge.addChild(label);
      badge.position.set((e.x - 1.6) * T, e.y * T + T / 2);
      this.root.addChild(badge);
      this.badges.push(badge);
      const glow = new Sprite(glowTex);
      glow.anchor.set(0.5);
      glow.tint = 0xffc23d;
      glow.scale.set(3, 4);
      glow.alpha = 0;
      glow.position.set((e.x - 0.5) * T, e.y * T + T / 2);
      this.lights.addChild(glow);
      this.glows.push({ g: glow, base: locked ? 0 : 0.5, phase: Math.random() * 6 });
    }
    this.lockedState = locked;
  }

  setLocked(locked: boolean): void {
    if (locked === this.lockedState) return;
    this.lockedState = locked;
    for (const g of this.exitDoors) g.context = locked ? this.shapes.doors.locked : this.shapes.doors.open;
    for (let i = 0; i < this.room.exits.length; i++) {
      const glow = this.glows[this.glows.length - this.room.exits.length + i];
      if (glow) glow.base = locked ? 0 : 0.55;
    }
  }

  /** Flicker torches & bob badges. */
  update(time: number): void {
    for (const f of this.flames) {
      const s = f.base * (0.88 + 0.12 * Math.sin(time * 13 + f.phase) + 0.06 * Math.sin(time * 31 + f.phase * 2));
      f.g.scale.set(f.base * (0.95 + 0.05 * Math.sin(time * 9 + f.phase)), s);
    }
    for (const gl of this.glows) gl.g.alpha = gl.base * (0.85 + 0.15 * Math.sin(time * 7 + gl.phase));
    for (let i = 0; i < this.badges.length; i++) this.badges[i].y = this.room.exits[i].y * T + T / 2 - 46 + Math.sin(time * 3 + i) * 4;
  }

  destroy(): void {
    this.root.destroy({ children: true });
    this.lights.destroy({ children: true });
    for (const c of this.statics) c.destroy();
  }

  // ── Floor ────────────────────────────────────────────────────────────────

  private isFloorish(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.room.w || y >= this.room.h) return false;
    const t = this.room.tiles[y * this.room.w + x];
    return t === TILE_FLOOR || t === TILE_DOOR || t === TILE_SEALED;
  }

  private drawFloor(c: GraphicsContext): void {
    const { w, h, tiles, carpet } = this.room;
    const th = this.theme;
    const marble = th.name === 'Moonlit Throne';
    c.rect(-T * 20, -T * 20, (w + 40) * T, (h + 40) * T).fill({ color: th.void });
    // Base stones (batched by colour)
    let any = false;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y)) continue;
        const alt = marble ? (x + y) % 2 === 0 : hash2(x, y, 1) < 0.5;
        if (!alt) {
          c.rect(x * T, y * T, T, T);
          any = true;
        }
      }
    if (any) c.fill({ color: th.floorA });
    any = false;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y)) continue;
        const alt = marble ? (x + y) % 2 === 0 : hash2(x, y, 1) < 0.5;
        if (alt) {
          c.rect(x * T, y * T, T, T);
          any = true;
        }
      }
    if (any) c.fill({ color: th.floorB });
    // Bevel: light top-left, dark bottom-right, mortar grid.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y)) continue;
        c.moveTo(x * T + 3, (y + 1) * T - 4).lineTo(x * T + 3, y * T + 3).lineTo((x + 1) * T - 4, y * T + 3);
      }
    c.stroke({ color: 0xffffff, width: 2, alpha: 0.07 });
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y)) continue;
        c.rect(x * T, y * T, T, T);
      }
    c.stroke({ color: th.floorLine, width: 2, alpha: 0.9 });
    // Chips & specks
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y) || hash2(x, y, 7) > 0.18) continue;
        const r = hash2(x, y, 9);
        c.circle(x * T + 6 + r * 20, y * T + 8 + hash2(x, y, 3) * 16, 2 + r * 2);
      }
    c.fill({ color: th.floorLine, alpha: 0.6 });

    // Carpet runner with gold trim
    any = false;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!carpet[y * w + x] || tiles[y * w + x] !== TILE_FLOOR) continue;
        c.rect(x * T, y * T, T, T);
        any = true;
      }
    if (any) {
      c.fill({ color: th.carpet });
      const isC = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < w && y < h && carpet[y * w + x] === 1 && tiles[y * w + x] === TILE_FLOOR;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!isC(x, y)) continue;
          if (!isC(x, y - 1)) c.moveTo(x * T, y * T + 4).lineTo((x + 1) * T, y * T + 4);
          if (!isC(x, y + 1)) c.moveTo(x * T, (y + 1) * T - 4).lineTo((x + 1) * T, (y + 1) * T - 4);
          if (!isC(x - 1, y)) c.moveTo(x * T + 4, y * T).lineTo(x * T + 4, (y + 1) * T);
          if (!isC(x + 1, y)) c.moveTo((x + 1) * T - 4, y * T).lineTo((x + 1) * T - 4, (y + 1) * T);
        }
      c.stroke({ color: th.carpetTrim, width: 3 });
    }

    // Contact shadow under north walls
    for (let y = 1; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!this.isFloorish(x, y) || tiles[(y - 1) * w + x] !== TILE_WALL) continue;
        c.rect(x * T, y * T, T, 12);
      }
    c.fill({ color: 0x000000, alpha: 0.28 });
  }

  // ── Walls (3/4 view: caps + south-facing brick faces) ────────────────────

  private drawWalls(c: GraphicsContext): void {
    const { w, h, tiles } = this.room;
    const th = this.theme;
    const pillars = new Set(this.room.decor.filter((d) => d.kind === 'pillar').map((d) => d.y * w + d.x));
    const isWall = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || tiles[y * w + x] === TILE_WALL;
    const near = (x: number, y: number, r: number) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (this.isFloorish(x + dx, y + dy)) return true;
      return false;
    };
    // A wall tile is "visible" if within 2 tiles of floor; deeper walls are the void.
    const vis = (x: number, y: number) => isWall(x, y) && !pillars.has(y * w + x) && near(x, y, 1) && x >= 0 && y >= 0 && x < w && y < h;
    const face = (x: number, y: number) => isWall(x, y) && !isWall(x, y + 1) && !pillars.has(y * w + x);

    // Caps (tops of the walls)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (vis(x, y) && !face(x, y)) c.rect(x * T, y * T, T, T);
    c.fill({ color: th.wallTop });
    // Cap rim highlight on edges facing the room (reads as the lip of a tall wall)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!vis(x, y) || face(x, y)) continue;
        if (this.isFloorish(x, y + 1) || face(x, y + 1)) c.rect(x * T, (y + 1) * T - 5, T, 5);
        if (this.isFloorish(x - 1, y)) c.rect(x * T, y * T, 5, T);
        if (this.isFloorish(x + 1, y)) c.rect((x + 1) * T - 5, y * T, 5, T);
        if (this.isFloorish(x, y - 1)) c.rect(x * T, y * T, T, 5);
      }
    c.fill({ color: th.wallTrim, alpha: 0.45 });
    // Faces: full-height brick walls
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (face(x, y)) c.rect(x * T, y * T, T, T);
    c.fill({ color: th.wallFace });
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (!face(x, y)) continue;
        const top = y * T;
        const off = (x + y) % 2 ? T / 2 : 0;
        for (let row = 0; row < 3; row++) {
          const ry = top + 4 + row * 9.5;
          c.moveTo(x * T, ry + 9.5).lineTo((x + 1) * T, ry + 9.5);
          const vx = x * T + ((off + (row % 2) * (T / 2)) % T);
          if (vx > x * T + 1) c.moveTo(vx, ry).lineTo(vx, ry + 9.5);
        }
      }
    c.stroke({ color: th.wallFaceDark, width: 2.5 });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (face(x, y)) c.rect(x * T, y * T, T, 4);
    c.fill({ color: th.wallTrim, alpha: 0.85 });
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (face(x, y)) c.rect(x * T, (y + 1) * T - 6, T, 6);
    c.fill({ color: 0x000000, alpha: 0.3 });
    // Chunky ink outlines: wall/floor boundary + cap/void boundary.
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (this.isFloorish(x, y)) {
          if (isWall(x, y - 1)) c.moveTo(x * T, y * T).lineTo((x + 1) * T, y * T);
          if (isWall(x, y + 1)) c.moveTo(x * T, (y + 1) * T).lineTo((x + 1) * T, (y + 1) * T);
          if (isWall(x - 1, y)) c.moveTo(x * T, y * T).lineTo(x * T, (y + 1) * T);
          if (isWall(x + 1, y)) c.moveTo((x + 1) * T, y * T).lineTo((x + 1) * T, (y + 1) * T);
        } else if (vis(x, y) || face(x, y)) {
          const out = (xx: number, yy: number) => isWall(xx, yy) && !vis(xx, yy) && !face(xx, yy) && !pillars.has(yy * w + xx);
          if (out(x, y - 1)) c.moveTo(x * T, y * T).lineTo((x + 1) * T, y * T);
          if (out(x, y + 1)) c.moveTo(x * T, (y + 1) * T).lineTo((x + 1) * T, (y + 1) * T);
          if (out(x - 1, y)) c.moveTo(x * T, y * T).lineTo(x * T, (y + 1) * T);
          if (out(x + 1, y)) c.moveTo((x + 1) * T, y * T).lineTo((x + 1) * T, (y + 1) * T);
        }
      }
    c.stroke({ color: INK, width: 4, cap: 'round' });
    // Face top edge (where cap meets face)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (face(x, y)) c.moveTo(x * T, y * T).lineTo((x + 1) * T, y * T);
    c.stroke({ color: INK, width: 2.5, alpha: 0.8 });
    // Pillars: round columns
    for (const key of pillars) {
      const x = key % w;
      const y = Math.floor(key / w);
      const cx = x * T + T / 2;
      c.ellipse(cx, (y + 1) * T - 2, T * 0.6, T * 0.24).fill({ color: 0x000000, alpha: 0.35 });
      c.rect(cx - T * 0.38, y * T - T * 0.6, T * 0.76, T * 1.5).fill({ color: th.wallFace }).stroke({ color: INK, width: 3 });
      c.rect(cx - T * 0.28, y * T - T * 0.55, T * 0.14, T * 1.4).fill({ color: th.wallTrim, alpha: 0.4 });
      c.roundRect(cx - T * 0.54, y * T - T * 0.85, T * 1.08, T * 0.32, 5).fill({ color: th.wallTop }).stroke({ color: INK, width: 3 });
      c.roundRect(cx - T * 0.5, (y + 1) * T - T * 0.22, T, T * 0.26, 5).fill({ color: th.wallFaceDark }).stroke({ color: INK, width: 3 });
    }
  }

  // ── Decor ────────────────────────────────────────────────────────────────

  private addFlame(x: number, y: number, scale: number, glowTex: Texture, glowScale: number, glowDy = -6): void {
    const g = new Graphics(this.shapes.smallFlame);
    g.position.set(x, y);
    g.scale.set(scale);
    this.root.addChild(g);
    this.flames.push({ g, base: scale, phase: Math.random() * 10 });
    const glow = new Sprite(glowTex);
    glow.anchor.set(0.5);
    glow.position.set(x, y + glowDy);
    glow.tint = this.theme.light;
    glow.scale.set(glowScale);
    glow.alpha = 0.55;
    this.lights.addChild(glow);
    this.glows.push({ g: glow, base: 0.55, phase: Math.random() * 10 });
  }

  private drawDecor(c: GraphicsContext, light: GraphicsContext, d: Decor, glowTex: Texture): void {
    const th = this.theme;
    const x = d.x * T;
    const y = d.y * T;
    const p = new Pen('n', c);
    switch (d.kind) {
      case 'torch': {
        const cx = x + T / 2;
        const cy = y + T * 0.55;
        c.moveTo(cx, cy + 6).lineTo(cx, cy - 2);
        p.line(INK, 6);
        c.roundRect(cx - 6, cy - 6, 12, 6, 2);
        p.part(0x4a4a5a, 2.5);
        this.addFlame(cx, cy - 5, 1, glowTex, 2.8, T * 0.9);
        break;
      }
      case 'window': {
        const cx = x + T / 2;
        const top = y + T * 0.22;
        const bot = y + T - 4;
        c.moveTo(cx - 9, bot).lineTo(cx - 9, top + 8).quadraticCurveTo(cx, top - 6, cx + 9, top + 8).lineTo(cx + 9, bot).closePath();
        p.part(0x1d2a5a, 3);
        c.rect(cx - 7, top + 6, 6, 8);
        p.shade(0x4f6ad8);
        c.rect(cx + 1, top + 6, 6, 8);
        p.shade(0xb3123a);
        c.rect(cx - 7, top + 15, 14, bot - top - 17);
        p.shade(0x7a3cc8, 0.9);
        c.moveTo(cx, top + 2).lineTo(cx, bot).moveTo(cx - 9, top + 14).lineTo(cx + 9, top + 14);
        p.line(INK, 2);
        // Moonbeam onto the floor below
        light.poly([cx - 9, y + T, cx + 9, y + T, cx + 34, y + T * 4.2, cx - 10, y + T * 4.2]).fill({ color: THEME.moon, alpha: 0.09 });
        break;
      }
      case 'banner': {
        const cx = x + T / 2;
        const top = y + T * 0.12;
        c.rect(cx - 13, top - 2, 26, 4);
        p.part(0x6b3b23, 2);
        c.moveTo(cx - 10, top).lineTo(cx + 10, top).lineTo(cx + 10, top + 30).lineTo(cx, top + 24).lineTo(cx - 10, top + 30).closePath();
        p.part(th.carpet, 2.5);
        c.moveTo(cx - 7, top + 4).lineTo(cx - 7, top + 24).moveTo(cx + 7, top + 4).lineTo(cx + 7, top + 24);
        p.line(th.carpetTrim, 1.5);
        p.poly([cx, top + 6, cx + 4, top + 12, cx, top + 18, cx - 4, top + 12], th.carpetTrim, 1.5);
        break;
      }
      case 'chains': {
        for (const off of [-6, 6]) {
          for (let k = 0; k < 4; k++) {
            c.ellipse(x + T / 2 + off, y + T * 0.15 + k * 6, 2.5, 3.5);
          }
        }
        p.line(0x8a8f9e, 2);
        break;
      }
      case 'candelabra': {
        const cx = x + T / 2;
        const cy = y + T / 2;
        c.ellipse(cx, cy + 12, 12, 4);
        p.shade(0x000000, 0.3);
        c.moveTo(cx, cy + 12).lineTo(cx, cy - 14);
        c.moveTo(cx - 12, cy - 12).quadraticCurveTo(cx, cy - 2, cx + 12, cy - 12);
        p.line(INK, 6);
        c.moveTo(cx, cy + 12).lineTo(cx, cy - 14);
        c.moveTo(cx - 12, cy - 12).quadraticCurveTo(cx, cy - 2, cx + 12, cy - 12);
        p.line(THEME.gold, 3);
        for (const ox of [-12, 0, 12]) {
          c.roundRect(cx + ox - 2.5, cy - (ox === 0 ? 22 : 20), 5, 8, 1.5);
          p.part(0xf1e6cf, 1.5);
        }
        this.addFlame(cx - 12, cy - 20, 0.55, glowTex, 1.4);
        this.addFlame(cx, cy - 22, 0.6, glowTex, 1.8);
        this.addFlame(cx + 12, cy - 20, 0.55, glowTex, 1.4);
        break;
      }
      case 'bones': {
        const cx = x + 8 + d.v * 16;
        const cy = y + 10 + ((d.v * 7) % 1) * 12;
        c.moveTo(cx - 7, cy - 4).lineTo(cx + 7, cy + 4).moveTo(cx - 7, cy + 4).lineTo(cx + 7, cy - 4);
        p.line(INK, 5);
        c.moveTo(cx - 7, cy - 4).lineTo(cx + 7, cy + 4).moveTo(cx - 7, cy + 4).lineTo(cx + 7, cy - 4);
        p.line(THEME.bone, 2.5);
        break;
      }
      case 'skull': {
        const cx = x + 8 + d.v * 16;
        const cy = y + 14;
        c.circle(cx, cy, 6);
        p.part(THEME.bone, 2);
        c.circle(cx - 2, cy, 1.6).circle(cx + 2.4, cy, 1.6);
        p.shade(INK);
        break;
      }
      case 'cobweb': {
        const ox = d.v === 0 ? x : x + T;
        const dir = d.v === 0 ? 1 : -1;
        for (let k = 0; k < 4; k++) {
          const a = (k / 3) * (Math.PI / 2);
          c.moveTo(ox, y).lineTo(ox + Math.cos(a) * 22 * dir, y + Math.sin(a) * 22);
        }
        for (const r of [8, 15, 21]) {
          c.moveTo(ox + r * dir, y);
          for (let k = 1; k <= 6; k++) {
            const a = (k / 6) * (Math.PI / 2);
            c.lineTo(ox + Math.cos(a) * r * dir, y + Math.sin(a) * r);
          }
        }
        p.line(0xe9e2f2, 1.2, 0.45);
        break;
      }
      case 'crack': {
        const cx = x + 6 + d.v * 20;
        const cy = y + 8;
        c.moveTo(cx, cy).lineTo(cx + 5, cy + 6).lineTo(cx + 2, cy + 11).lineTo(cx + 8, cy + 17).moveTo(cx + 5, cy + 6).lineTo(cx + 11, cy + 8);
        p.line(th.floorLine, 2);
        break;
      }
      case 'coffin': {
        const cx = x + T / 2;
        const cy = y + T / 2;
        p.poly([cx - 7, cy - 14, cx + 7, cy - 14, cx + 11, cy - 6, cx + 7, cy + 16, cx - 7, cy + 16, cx - 11, cy - 6], 0x5e3219);
        c.moveTo(cx, cy - 8).lineTo(cx, cy + 8).moveTo(cx - 5, cy - 3).lineTo(cx + 5, cy - 3);
        p.line(THEME.gold, 2.5);
        break;
      }
      case 'puddle': {
        c.ellipse(x + T / 2, y + T / 2, 13, 6);
        p.part(0x2a3f6a, 2);
        c.ellipse(x + T / 2 - 4, y + T / 2 - 2, 5, 1.5);
        p.shade(0xa8c8ff, 0.6);
        break;
      }
      case 'pillar':
        break;
    }
  }
}
