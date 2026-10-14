import { CONFIG } from '../config';

export const ATTRS = ['str', 'agi', 'vit', 'int', 'foc'] as const;
export type Attr = (typeof ATTRS)[number];
export type Attributes = Record<Attr, number>;

export const ATTR_INFO: Record<Attr, { name: string; short: string; desc: string; color: string }> = {
  str: { name: 'Strength', short: 'STR', desc: '+2 damage, +1% armor', color: '#ff6b6b' },
  agi: { name: 'Agility', short: 'AGI', desc: '+1.5% move, +0.75% attack speed', color: '#7dff9a' },
  vit: { name: 'Vitality', short: 'VIT', desc: '+15 max HP, +0.5 HP regen/s', color: '#ff9ec7' },
  int: { name: 'Intelligence', short: 'INT', desc: '+1% cooldown reduction', color: '#9fc8ff' },
  foc: { name: 'Focus', short: 'FOC', desc: '+1% crit chance, +2.5% crit damage', color: '#ffd76a' },
};

export const zeroAttrs = (): Attributes => ({ str: 0, agi: 0, vit: 0, int: 0, foc: 0 });

/** Additive modifiers contributed by cards, equipment and meta unlocks. */
export const MOD_KEYS = [
  'dmg', // flat damage
  'dmgPct',
  'hp',
  'hpPct',
  'regen',
  'armor',
  'energy',
  'energyRegen',
  'cdr',
  'crit',
  'critDmg',
  'move',
  'atkSpd',
  'pickup',
  'projectiles',
  'orbitDmg',
  'orbitals',
  'lifesteal',
  'thorns',
  'dashCdr',
] as const;
export type ModKey = (typeof MOD_KEYS)[number];
export type Mods = Record<ModKey, number>;

export const zeroMods = (): Mods => {
  const m = {} as Mods;
  for (const k of MOD_KEYS) m[k] = 0;
  return m;
};

export function addMods(into: Mods, from: Partial<Mods>, scale = 1): void {
  for (const k in from) into[k as ModKey] += (from[k as ModKey] ?? 0) * scale;
}

/** XP required to advance from level L to L+1. */
export const xpReq = (level: number): number => Math.floor(CONFIG.xpBase * Math.pow(level, CONFIG.xpExp));

/** Diminishing-returns armor: never reaches immunity. */
export const armorReduce = (raw: number, armor: number): number => (raw * 100) / (100 + Math.max(0, armor));

/** stat_final = stat_base × (1 + 0.20 × (E_lvl − 1)) */
export const equipScale = (level: number): number => 1 + CONFIG.equipScalePerLevel * (level - 1);

/** cost(E_lvl) = floor(25 × 1.6^(E_lvl − 1)) scrap */
export const upgradeCost = (level: number): number =>
  Math.floor(CONFIG.upgradeCostBase * Math.pow(CONFIG.upgradeCostGrowth, level - 1));

export interface DerivedStats {
  maxHp: number;
  hpRegen: number;
  armor: number;
  dmgFlat: number;
  dmgMul: number;
  move: number;
  atkSpeed: number;
  cdr: number;
  crit: number;
  critDmg: number;
  maxEnergy: number;
  energyRegen: number;
  pickupRadius: number;
  projectiles: number;
  orbitDmg: number;
  orbitals: number;
  lifesteal: number;
  thorns: number;
  dashCooldown: number;
}

export interface ClassBase {
  maxHp: number;
  armor: number;
  moveSpeed: number;
  maxEnergy: number;
  energyRegen: number;
  crit: number;
  cdr: number;
}

export function deriveStats(base: ClassBase, a: Attributes, m: Mods): DerivedStats {
  const P = CONFIG.perPoint;
  const C = CONFIG.caps;
  const moveBonus = Math.min(C.moveBonus, a.agi * P.agiMove + m.move);
  return {
    maxHp: Math.round((base.maxHp + a.vit * P.vitHp + m.hp) * (1 + m.hpPct)),
    hpRegen: a.vit * P.vitRegen + m.regen,
    armor: (base.armor + m.armor) * (1 + a.str * P.strArmorPct),
    dmgFlat: a.str * P.strDamage + m.dmg,
    dmgMul: 1 + m.dmgPct,
    move: base.moveSpeed * (1 + moveBonus),
    atkSpeed: 1 + a.agi * P.agiAttackSpeed + m.atkSpd,
    cdr: Math.min(C.cdr, base.cdr + a.int * P.intCdr + m.cdr),
    crit: Math.min(C.crit, base.crit + a.foc * P.focCrit + m.crit),
    critDmg: CONFIG.baseCritDamage + a.foc * P.focCritDmg + m.critDmg,
    maxEnergy: base.maxEnergy + m.energy,
    energyRegen: base.energyRegen + m.energyRegen,
    pickupRadius: CONFIG.pickupRadius * (1 + m.pickup),
    projectiles: Math.round(m.projectiles),
    orbitDmg: m.orbitDmg,
    orbitals: Math.round(m.orbitals),
    lifesteal: m.lifesteal,
    thorns: m.thorns,
    dashCooldown: CONFIG.dash.cooldown * Math.max(0.3, 1 - m.dashCdr),
  };
}
