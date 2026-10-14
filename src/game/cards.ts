import { CONFIG } from '../config';
import type { Rng } from '../core/rng';
import type { Rarity } from '../gen/loot';
import type { Mods } from './stats';

export type CardTag = 'ARCANE' | 'KINETIC' | 'CRIT' | 'ORBIT' | 'HOLY' | 'BLOOD' | 'FLAME';

/** Effect hooks implemented by the combat code; everything else is pure stat mods. */
export type HookKey =
  | 'fork'
  | 'singularity'
  | 'satellites'
  | 'cross'
  | 'axe'
  | 'holyWater'
  | 'bloodlust'
  | 'burn'
  | 'chain'
  | 'moonDash'
  | 'scythe'
  | 'requiem';

export type UnlockPack = 'holy' | 'blood' | 'reaper';

export interface CardDef {
  id: string;
  name: string;
  rarity: Rarity;
  tier: 1 | 2 | 3;
  tags: CardTag[];
  icon: string;
  /** Text with {highlighted} spans. */
  desc: string;
  mods?: Partial<Mods>;
  hook?: HookKey;
  /** Requires a meta-progression unlock before it can appear. */
  pack?: UnlockPack;
}

export const CARDS: CardDef[] = [
  { id: 'forked_vector', name: 'Forked Vector', rarity: 'rare', tier: 2, tags: ['ARCANE'], icon: 'fork', hook: 'fork', desc: 'Hits split into {+2 shards} that deal {45%} base damage.' },
  { id: 'singularity_core', name: 'Singularity Core', rarity: 'epic', tier: 3, tags: ['KINETIC', 'CRIT'], icon: 'singularity', hook: 'singularity', mods: { critDmg: 0.15 }, desc: 'Critical hits pull enemies within {120} units and add {+15%} crit damage.' },
  { id: 'phase_satellites', name: 'Phase Satellites', rarity: 'uncommon', tier: 1, tags: ['ORBIT'], icon: 'orbit', hook: 'satellites', mods: { orbitals: 2, orbitDmg: 6 }, desc: 'Gain {+2} orbiting wisps. Angular speed {+25%} per [ORBIT] tag.' },
  { id: 'holy_cross', name: 'Holy Cross', rarity: 'rare', tier: 2, tags: ['HOLY', 'KINETIC'], icon: 'cross', hook: 'cross', desc: 'Every {2.4s} hurl a {boomerang cross} that pierces all foes.' },
  { id: 'thrown_axe', name: "Executioner's Axe", rarity: 'uncommon', tier: 1, tags: ['HOLY', 'KINETIC'], icon: 'axe', hook: 'axe', desc: 'Every {2s} throw a spinning axe for {300%} damage.' },
  { id: 'holy_water', name: 'Holy Water', rarity: 'uncommon', tier: 1, tags: ['HOLY', 'FLAME'], icon: 'flask', hook: 'holyWater', pack: 'holy', desc: 'Every {3s} a flask shatters on a foe, leaving {holy fire}.' },
  { id: 'vampiric_fang', name: 'Vampiric Fang', rarity: 'rare', tier: 2, tags: ['BLOOD'], icon: 'fang', mods: { lifesteal: 0.03 }, desc: 'Heal for {3%} of all damage dealt.' },
  { id: 'bloodlust', name: 'Bloodlust', rarity: 'uncommon', tier: 1, tags: ['BLOOD', 'CRIT'], icon: 'drop', hook: 'bloodlust', pack: 'blood', desc: 'Below {50%} HP: {+20%} crit chance and {+15%} attack speed.' },
  { id: 'iron_will', name: 'Iron Will', rarity: 'common', tier: 1, tags: [], icon: 'heart', mods: { hp: 25 }, desc: '{+25} max HP.' },
  { id: 'swift_greaves', name: 'Swift Greaves', rarity: 'common', tier: 1, tags: ['KINETIC'], icon: 'boot', mods: { move: 0.1 }, desc: '{+10%} movement speed.' },
  { id: 'whetstone', name: 'Whetstone', rarity: 'common', tier: 1, tags: ['KINETIC'], icon: 'sword', mods: { dmgPct: 0.15 }, desc: '{+15%} damage.' },
  { id: 'quickdraw', name: 'Quickdraw', rarity: 'common', tier: 1, tags: ['KINETIC'], icon: 'bolt', mods: { atkSpd: 0.12 }, desc: '{+12%} attack speed.' },
  { id: 'keen_edge', name: 'Keen Edge', rarity: 'common', tier: 1, tags: ['CRIT'], icon: 'eye', mods: { crit: 0.05 }, desc: '{+5%} critical chance.' },
  { id: 'headsman', name: "Headsman's Oath", rarity: 'rare', tier: 2, tags: ['CRIT'], icon: 'skull', mods: { critDmg: 0.35 }, desc: '{+35%} critical damage.' },
  { id: 'arcane_battery', name: 'Arcane Battery', rarity: 'uncommon', tier: 1, tags: ['ARCANE'], icon: 'battery', mods: { energy: 40, energyRegen: 3 }, desc: '{+40} max energy and {+3} energy per second.' },
  { id: 'chrono_sigil', name: 'Chrono Sigil', rarity: 'rare', tier: 2, tags: ['ARCANE'], icon: 'hourglass', mods: { cdr: 0.1 }, desc: '{+10%} cooldown reduction.' },
  { id: 'burning_hex', name: 'Burning Hex', rarity: 'uncommon', tier: 1, tags: ['FLAME'], icon: 'flame', hook: 'burn', desc: 'Hits ignite foes for {5 dmg/s} per stack over {3s}.' },
  { id: 'storm_chain', name: 'Storm Chain', rarity: 'rare', tier: 2, tags: ['ARCANE'], icon: 'lightning', hook: 'chain', desc: '{20%} chance on hit to arc to {3} foes for {60%} damage.' },
  { id: 'split_volley', name: 'Split Volley', rarity: 'rare', tier: 2, tags: ['KINETIC'], icon: 'multi', mods: { projectiles: 1 }, desc: '{+1} projectile. Vanguard: {+1} slash wave.' },
  { id: 'bat_familiar', name: 'Bat Familiar', rarity: 'uncommon', tier: 1, tags: ['ORBIT', 'BLOOD'], icon: 'bat', mods: { orbitals: 1, orbitDmg: 4, lifesteal: 0.01 }, desc: '{+1} orbiting familiar. {+1%} life steal.' },
  { id: 'guardian_aegis', name: 'Guardian Aegis', rarity: 'uncommon', tier: 1, tags: [], icon: 'shield', mods: { armor: 8 }, desc: '{+8} armor.' },
  { id: 'soul_magnet', name: 'Soul Magnet', rarity: 'common', tier: 1, tags: [], icon: 'magnet', mods: { pickup: 0.6 }, desc: '{+60%} pickup radius.' },
  { id: 'thorned_mail', name: 'Thorned Mail', rarity: 'uncommon', tier: 1, tags: ['BLOOD'], icon: 'thorns', mods: { thorns: 0.4, armor: 3 }, pack: 'blood', desc: 'Reflect {40%} of contact damage. {+3} armor.' },
  { id: 'moonlit_dash', name: 'Moonlit Dash', rarity: 'uncommon', tier: 1, tags: ['KINETIC'], icon: 'moon', hook: 'moonDash', mods: { dashCdr: 0.3 }, desc: 'Dash cooldown {-30%}. Dashing leaves a {burning trail}.' },
  { id: 'reaper_scythe', name: "Reaper's Scythe", rarity: 'epic', tier: 3, tags: ['CRIT', 'ORBIT'], icon: 'scythe', hook: 'scythe', mods: { orbitDmg: 4 }, pack: 'reaper', desc: 'A great scythe orbits you for {250%} damage. It {always crits}.' },
  { id: 'requiem', name: 'Requiem', rarity: 'epic', tier: 3, tags: ['HOLY'], icon: 'nova', hook: 'requiem', pack: 'holy', desc: 'Every {12s} a holy nova strikes {every foe} for {400%} damage.' },
  { id: 'vital_draught', name: 'Vital Draught', rarity: 'common', tier: 1, tags: [], icon: 'potion', mods: { regen: 1.2 }, desc: '{+1.2} HP regen per second.' },
];

export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

export const PACKS: Record<UnlockPack, { name: string; cost: number; desc: string }> = {
  holy: { name: 'Holy Relics', cost: 90, desc: 'Adds Holy Water and Requiem to the card pool.' },
  blood: { name: 'Blood Pact', cost: 90, desc: 'Adds Bloodlust and Thorned Mail to the card pool.' },
  reaper: { name: "Reaper's Bargain", cost: 160, desc: "Adds the Reaper's Scythe to the card pool." },
};

/**
 * Offer `count` distinct cards. Weight = rarity weight × (1 + 0.35 per tag the
 * player already owns), so builds snowball toward synergies.
 */
export function offerCards(
  rng: Rng,
  owned: ReadonlyMap<string, number>,
  unlocked: ReadonlySet<UnlockPack>,
  count = 3,
  minRarity?: Rarity,
): CardDef[] {
  const ownedTags = new Set<CardTag>();
  for (const id of owned.keys()) for (const t of CARD_BY_ID[id]?.tags ?? []) ownedTags.add(t);
  const order: Rarity[] = ['common', 'uncommon', 'rare', 'epic'];
  const pool = CARDS.filter(
    (c) => (!c.pack || unlocked.has(c.pack)) && (!minRarity || order.indexOf(c.rarity) >= order.indexOf(minRarity)),
  );
  const picks: CardDef[] = [];
  const avail = pool.slice();
  while (picks.length < count && avail.length) {
    const weights = avail.map((c) => {
      let match = 0;
      for (const t of c.tags) if (ownedTags.has(t)) match++;
      return CONFIG.rarityWeights[c.rarity] * (1 + CONFIG.cardTagBonus * match);
    });
    const i = rng.weightedIndex(weights);
    picks.push(avail[i]);
    avail.splice(i, 1);
  }
  return picks;
}

export const TIER_LABEL = ['', 'I', 'II', 'III'];
