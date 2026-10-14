// Data-only enemy definitions (no rendering imports) so generation can use them.

export type EnemyAi = 'chase' | 'flutter' | 'ranged' | 'caster' | 'charger' | 'boss';

export interface EnemyDef {
  id: number;
  key: string;
  name: string;
  hp: number;
  speed: number;
  damage: number; // contact damage
  radius: number;
  xp: number;
  scrap: number;
  ai: EnemyAi;
  /** Spawn budget cost; 0 = never spawned from the table. */
  cost: number;
  minFloor: number;
  weight: number;
  /** Ranged attack interval (s) and projectile damage. */
  fireEvery?: number;
  shotDamage?: number;
  shotSpeed?: number;
  flying?: boolean;
  boss?: boolean;
}

export const ENEMY_DEFS: EnemyDef[] = [
  { id: 0, key: 'bat', name: 'Blood Bat', hp: 14, speed: 165, damage: 7, radius: 11, xp: 6, scrap: 1, ai: 'flutter', cost: 1, minFloor: 0, weight: 26, flying: true },
  { id: 1, key: 'skeleton', name: 'Skeleton', hp: 34, speed: 82, damage: 11, radius: 14, xp: 10, scrap: 1, ai: 'chase', cost: 2, minFloor: 0, weight: 34 },
  { id: 2, key: 'ghoul', name: 'Ghoul', hp: 82, speed: 52, damage: 17, radius: 17, xp: 16, scrap: 2, ai: 'chase', cost: 3, minFloor: 0, weight: 14 },
  { id: 3, key: 'archer', name: 'Bone Archer', hp: 28, speed: 78, damage: 8, radius: 14, xp: 14, scrap: 2, ai: 'ranged', cost: 3, minFloor: 0, weight: 14, fireEvery: 2.1, shotDamage: 10, shotSpeed: 260 },
  { id: 4, key: 'witch', name: 'Hex Witch', hp: 40, speed: 70, damage: 9, radius: 15, xp: 20, scrap: 3, ai: 'caster', cost: 4, minFloor: 1, weight: 12, fireEvery: 3.2, shotDamage: 12, shotSpeed: 170, flying: true },
  { id: 5, key: 'knight', name: 'Axe Armor', hp: 150, speed: 64, damage: 22, radius: 19, xp: 34, scrap: 5, ai: 'charger', cost: 6, minFloor: 1, weight: 8 },
  { id: 6, key: 'gargoyle', name: 'Gargoyle', hp: 95, speed: 92, damage: 15, radius: 17, xp: 28, scrap: 4, ai: 'ranged', cost: 5, minFloor: 2, weight: 10, fireEvery: 2.6, shotDamage: 13, shotSpeed: 230, flying: true },
  // Bosses (one per floor)
  { id: 7, key: 'ogre', name: 'Gorehorn, Twin Ogre', hp: 2400, speed: 70, damage: 26, radius: 46, xp: 400, scrap: 60, ai: 'boss', cost: 0, minFloor: 0, weight: 0, boss: true },
  { id: 8, key: 'golem', name: 'The Rune Colossus', hp: 4200, speed: 55, damage: 30, radius: 50, xp: 700, scrap: 90, ai: 'boss', cost: 0, minFloor: 1, weight: 0, boss: true },
  { id: 9, key: 'count', name: 'Count Vlador', hp: 6000, speed: 120, damage: 28, radius: 30, xp: 1200, scrap: 140, ai: 'boss', cost: 0, minFloor: 2, weight: 0, boss: true, flying: true },
];

export const ENEMY = Object.fromEntries(ENEMY_DEFS.map((d) => [d.key, d.id])) as Record<string, number>;

export const BOSS_FOR_FLOOR = [ENEMY.ogre, ENEMY.golem, ENEMY.count];

/** Floor scaling applied on top of the base definition. */
export const floorHpMul = (floor: number): number => 1 + 0.55 * floor;
export const floorDmgMul = (floor: number): number => 1 + 0.32 * floor;
export const ELITE = { hpMul: 3, dmgMul: 1.4, sizeMul: 1.3, xpMul: 3, scrapMul: 3, costMul: 3 } as const;
