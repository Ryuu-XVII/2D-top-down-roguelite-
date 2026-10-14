import type { Rng } from '../core/rng';
import type { Rarity } from '../gen/loot';
import { equipScale, type Mods } from './stats';

export type Slot = 'weapon' | 'core' | 'orbital' | 'subroutine';
export const SLOTS: Slot[] = ['weapon', 'core', 'orbital', 'subroutine'];

export const SLOT_INFO: Record<Slot, { name: string; flavor: string }> = {
  weapon: { name: 'Weapon', flavor: 'Blade, staff or knife' },
  core: { name: 'Core Reactor', flavor: 'A heart-relic that beats with power' },
  orbital: { name: 'Orbital Module', flavor: 'A charm that summons a familiar' },
  subroutine: { name: 'Sub-Routine', flavor: 'A rune etched with a hidden rite' },
};

export interface ItemDef {
  id: string;
  slot: Slot;
  name: string;
  rarity: Rarity;
  /** Base stats, scaled by equipment level. */
  stats: Partial<Mods>;
  glyph: string;
  starter?: boolean;
}

export const ITEMS: ItemDef[] = [
  // Weapons
  { id: 'crusader_blade', slot: 'weapon', name: 'Crusader Blade', rarity: 'common', stats: { dmg: 4 }, glyph: 'sword', starter: true },
  { id: 'moonstone_staff', slot: 'weapon', name: 'Moonstone Staff', rarity: 'common', stats: { dmg: 3, energy: 10 }, glyph: 'staff', starter: true },
  { id: 'silver_kris', slot: 'weapon', name: 'Silver Kris', rarity: 'common', stats: { dmg: 2, crit: 0.03 }, glyph: 'dagger', starter: true },
  { id: 'raven_fang', slot: 'weapon', name: 'Raven Fang', rarity: 'uncommon', stats: { dmg: 5, atkSpd: 0.08 }, glyph: 'dagger' },
  { id: 'holy_morningstar', slot: 'weapon', name: 'Holy Morning Star', rarity: 'rare', stats: { dmg: 7, critDmg: 0.12 }, glyph: 'mace' },
  { id: 'bloodforged', slot: 'weapon', name: 'Bloodforged Claymore', rarity: 'rare', stats: { dmg: 9, lifesteal: 0.01 }, glyph: 'sword' },
  { id: 'grim_sickle', slot: 'weapon', name: 'Grim Sickle', rarity: 'epic', stats: { dmg: 11, crit: 0.05 }, glyph: 'scythe' },
  // Core reactors (heart relics)
  { id: 'ember_heart', slot: 'core', name: 'Ember Heart', rarity: 'common', stats: { hp: 15 }, glyph: 'heart', starter: true },
  { id: 'moon_heart', slot: 'core', name: 'Moon Heart', rarity: 'common', stats: { energy: 25, energyRegen: 2 }, glyph: 'moon', starter: true },
  { id: 'vampire_heart', slot: 'core', name: 'Vampire Heart', rarity: 'uncommon', stats: { hp: 20, regen: 0.6 }, glyph: 'heart' },
  { id: 'obsidian_heart', slot: 'core', name: 'Obsidian Heart', rarity: 'rare', stats: { hp: 40, armor: 4 }, glyph: 'gem' },
  { id: 'abyss_heart', slot: 'core', name: 'Abyssal Heart', rarity: 'epic', stats: { hp: 35, dmgPct: 0.1, energyRegen: 2 }, glyph: 'gem' },
  // Orbital modules (familiar charms) — each grants one familiar.
  { id: 'wisp_lantern', slot: 'orbital', name: 'Wisp Lantern', rarity: 'common', stats: { orbitals: 1, orbitDmg: 6, pickup: 0.2 }, glyph: 'lantern' },
  { id: 'bat_charm', slot: 'orbital', name: 'Bat Charm', rarity: 'uncommon', stats: { orbitals: 1, orbitDmg: 9, move: 0.04 }, glyph: 'bat' },
  { id: 'saints_rosary', slot: 'orbital', name: "Saint's Rosary", rarity: 'rare', stats: { orbitals: 1, orbitDmg: 13, armor: 2 }, glyph: 'cross' },
  { id: 'imp_bell', slot: 'orbital', name: 'Imp Bell', rarity: 'epic', stats: { orbitals: 2, orbitDmg: 12 }, glyph: 'bell' },
  // Sub-routines (runes)
  { id: 'hourglass_rune', slot: 'subroutine', name: 'Hourglass Rune', rarity: 'common', stats: { cdr: 0.06 }, glyph: 'hourglass' },
  { id: 'raven_eye', slot: 'subroutine', name: 'Raven Eye', rarity: 'uncommon', stats: { crit: 0.05 }, glyph: 'eye' },
  { id: 'wolf_sigil', slot: 'subroutine', name: 'Wolf Sigil', rarity: 'uncommon', stats: { move: 0.08, atkSpd: 0.05 }, glyph: 'boot' },
  { id: 'crimson_grimoire', slot: 'subroutine', name: 'Crimson Grimoire', rarity: 'rare', stats: { critDmg: 0.2, cdr: 0.05 }, glyph: 'book' },
  { id: 'night_crown', slot: 'subroutine', name: 'Crown of Night', rarity: 'epic', stats: { cdr: 0.08, crit: 0.06, energy: 20 }, glyph: 'crown' },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export interface OwnedItem {
  id: string;
  level: number;
}

/** Final (level-scaled) stats of an owned item. Counts like orbitals are not scaled. */
export function itemStats(item: OwnedItem): Partial<Mods> {
  const def = ITEM_BY_ID[item.id];
  const k = equipScale(item.level);
  const out: Partial<Mods> = {};
  for (const key in def.stats) {
    const v = def.stats[key as keyof Mods]!;
    out[key as keyof Mods] = key === 'orbitals' ? v : v * k;
  }
  return out;
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic'];

/** Pick a random non-starter item of (at most) the given rarity. */
export function rollItem(rng: Rng, rarity: Rarity, slot?: Slot): ItemDef {
  const maxR = RARITY_ORDER.indexOf(rarity);
  let pool = ITEMS.filter((i) => !i.starter && (!slot || i.slot === slot) && RARITY_ORDER.indexOf(i.rarity) <= maxR);
  const exact = pool.filter((i) => i.rarity === rarity);
  if (exact.length && rng.chance(0.7)) pool = exact;
  if (!pool.length) pool = ITEMS.filter((i) => !i.starter);
  return rng.pick(pool);
}

const STAT_LABEL: Partial<Record<keyof Mods, [string, (v: number) => string]>> = {
  dmg: ['DMG', (v) => '+' + v.toFixed(1)],
  dmgPct: ['DMG', (v) => '+' + Math.round(v * 100) + '%'],
  hp: ['HP', (v) => '+' + Math.round(v)],
  regen: ['Regen', (v) => '+' + v.toFixed(1) + '/s'],
  armor: ['Armor', (v) => '+' + v.toFixed(1)],
  energy: ['Energy', (v) => '+' + Math.round(v)],
  energyRegen: ['Energy/s', (v) => '+' + v.toFixed(1)],
  cdr: ['CDR', (v) => '+' + (v * 100).toFixed(1) + '%'],
  crit: ['Crit', (v) => '+' + (v * 100).toFixed(1) + '%'],
  critDmg: ['Crit DMG', (v) => '+' + Math.round(v * 100) + '%'],
  move: ['Move', (v) => '+' + (v * 100).toFixed(1) + '%'],
  atkSpd: ['Atk Spd', (v) => '+' + (v * 100).toFixed(1) + '%'],
  pickup: ['Pickup', (v) => '+' + Math.round(v * 100) + '%'],
  orbitals: ['Familiars', (v) => '+' + v],
  orbitDmg: ['Familiar DMG', (v) => '+' + v.toFixed(1)],
  lifesteal: ['Life steal', (v) => '+' + (v * 100).toFixed(1) + '%'],
};

export function describeStats(stats: Partial<Mods>): string[] {
  const out: string[] = [];
  for (const k in stats) {
    const l = STAT_LABEL[k as keyof Mods];
    if (l) out.push(`${l[0]} ${l[1](stats[k as keyof Mods]!)}`);
  }
  return out;
}
