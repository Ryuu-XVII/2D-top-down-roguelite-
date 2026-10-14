import { CONFIG } from '../config';
import type { UnlockPack } from './cards';
import type { ClassId } from './classes';
import { zeroAttrs, type Attr, type Attributes } from './stats';

export interface SeedRecord {
  seed: number;
  attempt: number;
  cls: ClassId;
  result: 'victory' | 'defeat' | 'abandoned';
  floor: number;
  date: number;
}

export interface MetaSave {
  version: 1;
  souls: number;
  classes: ClassId[];
  packs: UnlockPack[];
  statBonus: Attributes;
  runs: number;
  wins: number;
  bestFloor: number;
  history: SeedRecord[];
}

export const defaultMeta = (): MetaSave => ({
  version: 1,
  souls: 0,
  classes: ['vanguard'],
  packs: [],
  statBonus: zeroAttrs(),
  runs: 0,
  wins: 0,
  bestFloor: 0,
  history: [],
});

export const CLASS_COST: Record<ClassId, number> = { vanguard: 0, weaver: 60, phantom: 90 };
export const STAT_BONUS_MAX = 5;
export const statBonusCost = (current: number): number => 30 + current * 25;

/** Scrap converts to persistent souls at run end. */
export function soulsFromRun(scrap: number, floorReached: number, victory: boolean): number {
  return Math.floor(scrap * CONFIG.scrapToSouls) + floorReached * 10 + (victory ? 60 : 0);
}

export function canBuyStat(meta: MetaSave, a: Attr): boolean {
  return meta.statBonus[a] < STAT_BONUS_MAX && meta.souls >= statBonusCost(meta.statBonus[a]);
}

export function recordRun(meta: MetaSave, rec: SeedRecord, souls: number): void {
  meta.souls += souls;
  meta.runs++;
  if (rec.result === 'victory') meta.wins++;
  meta.bestFloor = Math.max(meta.bestFloor, rec.floor + 1);
  meta.history.unshift(rec);
  if (meta.history.length > 20) meta.history.length = 20;
}
