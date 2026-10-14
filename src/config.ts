// Every tunable number in the game lives here so balancing never touches logic.

export const CONFIG = {
  // ── Simulation ────────────────────────────────────────────────────────────
  dt: 1 / 120,
  maxFrameDelta: 0.25, // clamp to avoid the spiral of death

  // ── World & camera ────────────────────────────────────────────────────────
  tile: 32, // world units per tile
  viewTilesW: 24, // minimum visible area, in tiles
  viewTilesH: 13.5,
  maxBackbufferW: 3840,
  maxBackbufferH: 2160,

  // ── Input ─────────────────────────────────────────────────────────────────
  stickDeadzone: 0.1,
  stickRadiusCss: 64,
  stickOpacity: 0.55,
  aimAssistConeDeg: 12,
  aimAssistRange: 520,
  gamepadDeadzone: 0.18,

  // ── UI ────────────────────────────────────────────────────────────────────
  uiScaleBase: 720,
  uiScaleMin: 0.75,
  uiScaleMax: 2.0,
  minTouchTarget: 44,
  phoneShortEdge: 600,

  // ── Performance ───────────────────────────────────────────────────────────
  dynResWindow: 2, // seconds averaged
  dynResOverBudget: 1.1,
  dynResStep: 0.1,
  dynResFloor: 0.5,
  dynResRecoverAfter: 5,
  thermalWindow: 30,
  enemyCap: { ultra: 400, high: 300, medium: 150, low: 80 },

  // ── Run structure ─────────────────────────────────────────────────────────
  floors: 3,
  graphColumnsMin: 5,
  graphColumnsMax: 7,
  nodesPerColumnMin: 2,
  nodesPerColumnMax: 3,
  nodeWeights: { combat: 50, elite: 12, event: 13, shop: 10, rest: 15 },

  // ── Room generation ───────────────────────────────────────────────────────
  room: {
    combat: { w: 60, h: 40 },
    elite: { w: 52, h: 36 },
    small: { w: 34, h: 24 }, // shop / rest / event / start
    boss: { w: 46, h: 34 },
  },
  bspMinLeaf: 8,
  bspMaxDepth: 6,
  roomPadding: 1,
  roomMinSize: 5,
  corridorWidthMin: 2,
  corridorWidthMax: 3,
  astarWallCost: 12,
  astarFloorCost: 1,
  cavernFraction: 0.3,
  cavernFill: 0.45,
  cavernPasses: 5,
  spawnClearance: 2, // tiles of clearance (> 1 tile) around the player spawn

  // ── Spawning ──────────────────────────────────────────────────────────────
  baseBudget: 14,
  floorDifficulty: [1, 1.55, 2.2],
  roomTier: { combat: 1, elite: 1.25, boss: 1 },
  enemyMinDistFromSpawn: 6, // tiles
  poissonRadius: 2.2, // tiles
  wavesLargeRoom: [2, 3],
  waveTelegraph: 0.8,
  surplusToughness: 0.35, // extra HP fraction per surplus enemy folded in

  // ── Player & RPG ──────────────────────────────────────────────────────────
  baseCritDamage: 1.6,
  xpBase: 100,
  xpExp: 1.45,
  statPointsPerLevel: 3,
  perPoint: {
    strDamage: 2,
    strArmorPct: 0.01,
    agiMove: 0.015,
    agiAttackSpeed: 0.0075,
    vitHp: 15,
    vitRegen: 0.5,
    intCdr: 0.01,
    focCrit: 0.01,
    focCritDmg: 0.025,
  },
  caps: { cdr: 0.6, crit: 0.75, moveBonus: 1.0 },
  cardTagBonus: 0.35,
  rarityWeights: { common: 50, uncommon: 30, rare: 15, epic: 5 },
  invulnAfterHit: 0.55,
  dash: { distance: 150, time: 0.16, cooldown: 0.9, invuln: 0.22 },
  pickupRadius: 70,
  magnetSpeed: 620,

  // ── Equipment & economy ───────────────────────────────────────────────────
  equipScalePerLevel: 0.2,
  upgradeCostBase: 25,
  upgradeCostGrowth: 1.6,
  scrapToSouls: 0.5,
  restHealFraction: 0.35,

  // ── Audio ─────────────────────────────────────────────────────────────────
  maxVoices: 8,
  sfxMergeMs: 30,
} as const;

export type QualityPreset = 'ultra' | 'high' | 'medium' | 'low';

export interface PresetSpec {
  targetFps: number; // 0 = display max
  renderScale: number; // multiplier on dpr
  dprCap: number;
  maxParticles: number;
  glow: boolean;
  bloom: boolean;
  trails: number; // trail particles per projectile tick, 0..1
}

export const PRESETS: Record<QualityPreset, PresetSpec> = {
  ultra: { targetFps: 0, renderScale: 1, dprCap: 4, maxParticles: 8000, glow: true, bloom: true, trails: 1 },
  high: { targetFps: 0, renderScale: 1, dprCap: 2, maxParticles: 4000, glow: true, bloom: false, trails: 1 },
  medium: { targetFps: 60, renderScale: 0.75, dprCap: 2, maxParticles: 2000, glow: true, bloom: false, trails: 0.5 },
  low: { targetFps: 60, renderScale: 0.55, dprCap: 1.5, maxParticles: 800, glow: false, bloom: false, trails: 0 },
};

export const PRESET_ORDER: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];

// Pool capacities that do not depend on the preset.
export const POOLS = {
  enemies: 512,
  projectiles: 1024,
  pickups: 512,
  floatText: 96,
  hazards: 64,
} as const;
