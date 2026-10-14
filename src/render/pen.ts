import { GraphicsContext } from 'pixi.js';
import { THEME } from '../theme';

export const INK = THEME.ink;
export const OUTLINE = 3;

/**
 * Drawing helper for the chunky-cartoon style: every part gets a flat fill and
 * a thick ink outline. In silhouette mode ('w') everything is solid white so
 * the same code builds the hit-flash overlay.
 */
export class Pen {
  readonly ctx: GraphicsContext;
  constructor(
    readonly mode: 'n' | 'w' = 'n',
    ctx?: GraphicsContext,
  ) {
    this.ctx = ctx ?? new GraphicsContext();
  }

  get white(): boolean {
    return this.mode === 'w';
  }

  /** Fill + outline the current path. */
  part(color: number, outline = OUTLINE, alpha = 1): this {
    this.ctx.fill({ color: this.white ? 0xffffff : color, alpha });
    if (outline > 0) this.ctx.stroke({ width: outline, color: this.white ? 0xffffff : INK, join: 'round', cap: 'round' });
    return this;
  }

  /** Fill only (cel-shade highlights, shadows, details). Skipped in silhouette mode. */
  shade(color: number, alpha = 1): this {
    if (this.white) {
      this.ctx.beginPath(); // discard the detail path; the silhouette is solid anyway
      return this;
    }
    this.ctx.fill({ color, alpha });
    return this;
  }

  /** Stroke only. */
  line(color: number, width = OUTLINE, alpha = 1): this {
    this.ctx.stroke({ width, color: this.white ? 0xffffff : color, alpha, join: 'round', cap: 'round' });
    return this;
  }

  /** Cartoon eye: white sclera, big pupil, glint. */
  eye(x: number, y: number, r: number, look = 0.3, pupil = INK, sclera = 0xffffff): this {
    const c = this.ctx;
    c.ellipse(x, y, r * 0.85, r);
    this.part(sclera, 2);
    c.circle(x + r * look, y + r * 0.1, r * 0.55);
    this.shade(pupil);
    c.circle(x + r * look + r * 0.18, y - r * 0.2, r * 0.2);
    this.shade(0xffffff);
    return this;
  }

  /** Glowing slit / pinpoint eye (for undead and monsters). */
  glowEye(x: number, y: number, r: number, color: number): this {
    const c = this.ctx;
    c.circle(x, y, r * 1.6);
    this.shade(color, 0.25);
    c.circle(x, y, r);
    this.shade(color);
    c.circle(x - r * 0.3, y - r * 0.3, r * 0.35);
    this.shade(0xffffff, 0.9);
    return this;
  }

  poly(points: number[], color: number, outline = OUTLINE): this {
    this.ctx.poly(points, true);
    return this.part(color, outline);
  }
}

/** Shared ground shadow. */
export function shadowCtx(rx: number, ry: number): GraphicsContext {
  return new GraphicsContext().ellipse(0, 0, rx, ry).fill({ color: 0x000000, alpha: 0.32 });
}
