import { CARD_BY_ID, type HookKey } from './cards';
import { CLASSES, type ClassDef, type ClassId } from './classes';
import { itemStats, SLOTS, type OwnedItem, type Slot } from './equipment';
import { addMods, deriveStats, xpReq, zeroAttrs, zeroMods, type Attributes, type DerivedStats } from './stats';

export const PLAYER_RADIUS = 12;

export type Hooks = Record<HookKey, number>;

const zeroHooks = (): Hooks => ({
  fork: 0,
  singularity: 0,
  satellites: 0,
  cross: 0,
  axe: 0,
  holyWater: 0,
  bloodlust: 0,
  burn: 0,
  chain: 0,
  moonDash: 0,
  scythe: 0,
  requiem: 0,
});

/** Persistent per-run player data (survives room transitions and saves). */
export interface PlayerSave {
  cls: ClassId;
  level: number;
  xp: number;
  statPoints: number;
  attrs: Attributes;
  cards: Array<[string, number]>;
  equipment: Partial<Record<Slot, OwnedItem>>;
  scrap: number;
  hpFrac: number;
  kills: number;
  damageDealt: number;
  roomsCleared: number;
}

export class Player {
  cls: ClassDef;
  // Transform
  x = 0;
  y = 0;
  px = 0;
  py = 0;
  vx = 0;
  vy = 0;
  radius = PLAYER_RADIUS;
  aimAngle = 0;
  facing = 1;

  // Vital
  hp = 1;
  energy = 0;
  level = 1;
  xp = 0;
  statPoints = 0;
  pendingLevelUps = 0;
  attrs: Attributes = zeroAttrs();
  metaAttrs: Attributes = zeroAttrs();
  cards = new Map<string, number>();
  equipment: Partial<Record<Slot, OwnedItem>> = {};
  scrap = 0;
  stats!: DerivedStats;
  hooks: Hooks = zeroHooks();
  orbitTagCount = 0;

  // Combat timers
  attackT = 0;
  abilityCd = 0;
  dashCd = 0;
  dashT = 0;
  dashDX = 0;
  dashDY = 0;
  abilityDashT = 0; // Vanguard shockwave dash
  invuln = 0;
  guaranteedCrit = false;
  regenAcc = 0;
  crossT = 1;
  axeT = 1;
  waterT = 1.5;
  requiemT = 6;
  orbitAngle = 0;
  trailAcc = 0;

  // Animation
  walkPhase = 0;
  hurtT = 0;
  swingT = 0;
  castT = 0;
  alive = true;

  // Run statistics
  kills = 0;
  damageDealt = 0;
  roomsCleared = 0;

  constructor(cls: ClassId) {
    this.cls = CLASSES[cls];
    this.equipment.weapon = { id: this.cls.startWeapon, level: 1 };
    this.equipment.core = { id: this.cls.startCore, level: 1 };
    this.recompute();
    this.hp = this.stats.maxHp;
    this.energy = this.stats.maxEnergy;
  }

  recompute(): void {
    const m = zeroMods();
    const tagCounts: Record<string, number> = {};
    const hooks = zeroHooks();
    for (const [id, stacks] of this.cards) {
      const c = CARD_BY_ID[id];
      if (!c) continue;
      if (c.mods) addMods(m, c.mods, stacks);
      if (c.hook) hooks[c.hook] += stacks;
      for (const t of c.tags) tagCounts[t] = (tagCounts[t] ?? 0) + stacks;
    }
    for (const s of SLOTS) {
      const it = this.equipment[s];
      if (it) addMods(m, itemStats(it));
    }
    const a = zeroAttrs();
    for (const k in a) a[k as keyof Attributes] = this.attrs[k as keyof Attributes] + this.metaAttrs[k as keyof Attributes];
    const prevMax = this.stats?.maxHp;
    this.stats = deriveStats(this.cls, a, m);
    this.hooks = hooks;
    this.orbitTagCount = tagCounts.ORBIT ?? 0;
    // Gaining max HP also heals by the gained amount.
    if (prevMax !== undefined && this.stats.maxHp > prevMax) this.hp += this.stats.maxHp - prevMax;
    this.hp = Math.min(this.hp, this.stats.maxHp);
    this.energy = Math.min(this.energy, this.stats.maxEnergy);
  }

  addCard(id: string): void {
    this.cards.set(id, (this.cards.get(id) ?? 0) + 1);
    this.recompute();
  }

  /** Returns number of levels gained. */
  gainXp(amount: number): number {
    this.xp += amount;
    let gained = 0;
    while (this.xp >= xpReq(this.level)) {
      this.xp -= xpReq(this.level);
      this.level++;
      gained++;
    }
    return gained;
  }

  get xpToNext(): number {
    return xpReq(this.level);
  }

  toSave(): PlayerSave {
    return {
      cls: this.cls.id,
      level: this.level,
      xp: this.xp,
      statPoints: this.statPoints,
      attrs: { ...this.attrs },
      cards: [...this.cards.entries()],
      equipment: JSON.parse(JSON.stringify(this.equipment)),
      scrap: this.scrap,
      hpFrac: this.hp / this.stats.maxHp,
      kills: this.kills,
      damageDealt: this.damageDealt,
      roomsCleared: this.roomsCleared,
    };
  }

  static fromSave(s: PlayerSave, meta: Attributes): Player {
    const p = new Player(s.cls);
    p.metaAttrs = { ...meta };
    p.level = s.level;
    p.xp = s.xp;
    p.statPoints = s.statPoints;
    p.attrs = { ...s.attrs };
    p.cards = new Map(s.cards);
    p.equipment = { ...s.equipment };
    p.scrap = s.scrap;
    p.kills = s.kills;
    p.damageDealt = s.damageDealt;
    p.roomsCleared = s.roomsCleared;
    p.recompute();
    p.hp = Math.max(1, Math.round(s.hpFrac * p.stats.maxHp));
    p.energy = p.stats.maxEnergy;
    return p;
  }
}
