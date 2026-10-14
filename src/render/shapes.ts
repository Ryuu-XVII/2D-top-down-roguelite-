import type { GraphicsContext } from 'pixi.js';
import type { ClassId } from '../game/classes';
import { PROJ, PICK } from '../game/stores';
import { RARITY_COLORS } from '../theme';
import * as A from './art/characters';
import * as P from './art/props';
import { Pen, shadowCtx } from './pen';

export interface CharShapes {
  body: GraphicsContext;
  flash: GraphicsContext;
}

function both(draw: (p: Pen) => void): CharShapes {
  const n = new Pen('n');
  draw(n);
  const w = new Pen('w');
  draw(w);
  return { body: n.ctx, flash: w.ctx };
}

function one(draw: (p: Pen) => void): GraphicsContext {
  const p = new Pen('n');
  draw(p);
  return p.ctx;
}

/**
 * Every shape is built exactly once as a GraphicsContext and shared by all
 * instances; nothing is re-tessellated per frame.
 */
export class ShapeCache {
  readonly heroes: Record<ClassId, CharShapes & { weapon: GraphicsContext }>;
  readonly ring: GraphicsContext;
  readonly enemies: Record<string, CharShapes>;
  readonly batWing: CharShapes;
  readonly ogreClub: CharShapes;
  readonly golemRunes: GraphicsContext;
  readonly golemCracks: GraphicsContext;
  readonly shadows: Map<number, GraphicsContext> = new Map();
  readonly chest: Record<string, { open: GraphicsContext; closed: GraphicsContext }>;
  readonly props: Record<string, GraphicsContext>;
  readonly flame: GraphicsContext;
  readonly smallFlame: GraphicsContext;
  readonly doors: Record<'open' | 'locked' | 'sealed', GraphicsContext>;
  readonly badges: Record<string, GraphicsContext>;
  readonly pickups: GraphicsContext[];
  readonly projectiles: GraphicsContext[];
  readonly imp: GraphicsContext;
  readonly scythe: GraphicsContext;

  constructor(tile: number) {
    this.heroes = {
      vanguard: { ...both(A.drawVanguard), weapon: one(A.drawSword) },
      weaver: { ...both(A.drawWeaver), weapon: one(A.drawStaff) },
      phantom: { ...both(A.drawPhantom), weapon: one(A.drawDagger) },
    };
    this.ring = one(A.drawRuneRing);
    this.enemies = {
      bat: both(A.drawBatBody),
      skeleton: both(A.drawSkeleton),
      ghoul: both(A.drawGhoul),
      archer: both(A.drawArcher),
      witch: both(A.drawWitch),
      knight: both(A.drawKnight),
      gargoyle: both(A.drawGargoyle),
      ogre: both(A.drawOgre),
      golem: both(A.drawGolem),
      count: both(A.drawCount),
    };
    this.batWing = both(A.drawBatWing);
    this.ogreClub = both(A.drawOgreClub);
    this.golemRunes = one(A.drawGolemRunes);
    this.golemCracks = one(A.drawGolemCracks);

    this.chest = {};
    for (const r of Object.keys(RARITY_COLORS) as (keyof typeof RARITY_COLORS)[]) {
      const trim = r === 'common' ? 0xcfd8e6 : RARITY_COLORS[r].edge;
      this.chest[r] = { open: one((p) => P.drawChest(p, true, trim)), closed: one((p) => P.drawChest(p, false, trim)) };
    }
    this.props = {
      merchant: one(P.drawMerchant),
      anvil: one(P.drawAnvil),
      campfire: one(P.drawCampfireLogs),
      altar: one(P.drawAltar),
      shrine: one(P.drawShrine),
      portalFrame: one(P.drawPortalFrame),
      portalSwirl: one(P.drawPortalSwirl),
    };
    this.flame = one((p) => P.drawFlame(p, 1));
    this.smallFlame = one((p) => P.drawFlame(p, 0.45));
    this.doors = {
      open: one((p) => P.drawDoor(p, true, tile, false, 0xffc23d)),
      locked: one((p) => P.drawDoor(p, false, tile, false, 0xffc23d)),
      sealed: one((p) => P.drawDoor(p, false, tile, true, 0xffc23d)),
    };
    const badgeRing: Record<string, number> = {
      combat: 0xcfd8e6,
      elite: 0xff8a2a,
      event: 0xb05cff,
      shop: 0xffc23d,
      rest: 0x3ddc84,
      boss: 0xe8344e,
      start: 0x5ec8ff,
    };
    this.badges = {};
    for (const k in badgeRing) this.badges[k] = one((p) => P.drawBadge(p, k, badgeRing[k]));

    this.pickups = [];
    this.pickups[PICK.SOUL] = one(P.drawSoul);
    this.pickups[PICK.SCRAP] = one(P.drawGem);
    this.pickups[PICK.HEART] = one(P.drawHeart);

    this.projectiles = [];
    this.projectiles[PROJ.ORB] = one(P.drawOrb);
    this.projectiles[PROJ.DAGGER] = one(P.drawDaggerProj);
    this.projectiles[PROJ.SHARD] = one(P.drawShard);
    this.projectiles[PROJ.CROSS] = one(P.drawCross);
    this.projectiles[PROJ.AXE] = one(P.drawAxe);
    this.projectiles[PROJ.FLASK] = one(P.drawFlask);
    this.projectiles[PROJ.WAVE] = one(P.drawWave);
    this.projectiles[PROJ.ARROW] = one(P.drawArrow);
    this.projectiles[PROJ.FIREBALL] = one(P.drawFireball);
    this.projectiles[PROJ.RUNE] = one(P.drawRuneBolt);
    this.projectiles[PROJ.BLOOD] = one(P.drawBloodBullet);
    this.projectiles[PROJ.BONE] = one(P.drawBone);
    this.imp = one(P.drawImp);
    this.scythe = one(P.drawScythe);
  }

  shadow(rx: number): GraphicsContext {
    const key = Math.round(rx);
    let s = this.shadows.get(key);
    if (!s) {
      s = shadowCtx(key, key * 0.38);
      this.shadows.set(key, s);
    }
    return s;
  }
}

/** Glow tint per projectile kind (additive halo underneath). */
export const PROJ_GLOW: Record<number, number> = {
  [PROJ.ORB]: 0xb05cff,
  [PROJ.DAGGER]: 0x5ec8ff,
  [PROJ.SHARD]: 0xb05cff,
  [PROJ.CROSS]: 0xffc23d,
  [PROJ.AXE]: 0x9fb8ff,
  [PROJ.FLASK]: 0x7fd6ff,
  [PROJ.WAVE]: 0xffe0a0,
  [PROJ.ARROW]: 0xff8a2a,
  [PROJ.FIREBALL]: 0xff7a1a,
  [PROJ.RUNE]: 0x4fd8ff,
  [PROJ.BLOOD]: 0xff2244,
  [PROJ.BONE]: 0xfff0c8,
};
