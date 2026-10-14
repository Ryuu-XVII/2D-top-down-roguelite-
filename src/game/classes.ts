import type { ClassBase } from './stats';

export type ClassId = 'vanguard' | 'weaver' | 'phantom';
export type AttackKind = 'slash' | 'orb' | 'dagger';

export interface ClassDef extends ClassBase {
  id: ClassId;
  name: string;
  role: string;
  /** Geometric motif from the spec, worked into the character art. */
  geometry: 'Triangle' | 'Orbital ring' | 'Diamond';
  blurb: string;
  attack: {
    kind: AttackKind;
    name: string;
    damage: number;
    interval: number; // seconds between attacks at 1.0 attack speed
    range: number;
    speed: number; // projectile speed (0 for melee)
  };
  ability: {
    name: string;
    desc: string;
    cost: number;
    cooldown: number;
  };
  color: number;
  startWeapon: string;
  startCore: string;
}

export const CLASSES: Record<ClassId, ClassDef> = {
  vanguard: {
    id: 'vanguard',
    name: 'Vector Vanguard',
    role: 'Warrior',
    geometry: 'Triangle',
    blurb: 'A crusader in crimson plate. Cleaves everything in a wide arc and shrugs off blows.',
    maxHp: 120,
    armor: 10,
    moveSpeed: 200,
    maxEnergy: 80,
    energyRegen: 6,
    crit: 0.05,
    cdr: 0,
    attack: { kind: 'slash', name: 'Arc Slash', damage: 22, interval: 0.46, range: 78, speed: 0 },
    ability: {
      name: 'Shockwave Dash',
      desc: 'Charge forward, knocking back and stunning everything in your path.',
      cost: 30,
      cooldown: 4,
    },
    color: 0xe8344e,
    startWeapon: 'crusader_blade',
    startCore: 'ember_heart',
  },
  weaver: {
    id: 'weaver',
    name: 'Code Weaver',
    role: 'Mage',
    geometry: 'Orbital ring',
    blurb: 'A moon-witch wrapped in orbiting runes. Fires homing orbs and bends gravity itself.',
    maxHp: 70,
    armor: 2,
    moveSpeed: 220,
    maxEnergy: 150,
    energyRegen: 15,
    crit: 0.05,
    cdr: 0.1,
    attack: { kind: 'orb', name: 'Homing Orb', damage: 13, interval: 0.34, range: 520, speed: 430 },
    ability: {
      name: 'Singularity Pulse',
      desc: 'Open a gravity well that drags enemies in, then detonates.',
      cost: 50,
      cooldown: 6,
    },
    color: 0xb05cff,
    startWeapon: 'moonstone_staff',
    startCore: 'moon_heart',
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom Blade',
    role: 'Rogue',
    geometry: 'Diamond',
    blurb: 'A cloaked night-stalker. Hurls twin daggers and steps through shadow for a sure crit.',
    maxHp: 90,
    armor: 4,
    moveSpeed: 260,
    maxEnergy: 100,
    energyRegen: 9,
    crit: 0.15,
    cdr: 0,
    attack: { kind: 'dagger', name: 'Twin Daggers', damage: 9, interval: 0.26, range: 460, speed: 700 },
    ability: {
      name: 'Shadow Step',
      desc: 'Teleport to your aim point. Your next hit is a guaranteed critical.',
      cost: 35,
      cooldown: 3.5,
    },
    color: 0x5ec8ff,
    startWeapon: 'silver_kris',
    startCore: 'ember_heart',
  },
};

export const CLASS_ORDER: ClassId[] = ['vanguard', 'weaver', 'phantom'];
