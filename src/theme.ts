// Palette tokens. The spec's neon-on-dark tokens are kept by name but re-valued
// for a "chunky cartoon × gothic castle" look: thick ink outlines, saturated
// flat fills with one cel-shaded highlight, moonlit purples and candle golds.

export const THEME = {
  'bg.deep': 0x0b0610,
  'bg.base': 0x1c1226,
  grid: 0x2c1f3a,
  player: 0x5ec8ff,
  arcane: 0xb05cff,
  enemy: 0xe8344e,
  'enemy.alt': 0xff8a2a,
  elite: 0xffc23d,
  heal: 0x3ddc84,
  'heal.light': 0x8dffb4,
  'text.muted': 0xa99bb8,

  // Ink & lighting
  ink: 0x170b1c, // the thick cartoon outline colour
  inkSoft: 0x2a1733,
  white: 0xffffff,
  moon: 0xf6ecc8,
  candle: 0xffb43d,
  candleHot: 0xfff0a8,
  blood: 0xb3123a,
  bloodDark: 0x5c0820,
  shadow: 0x000000,

  // Character materials
  skin: 0xffd7b0,
  skinShade: 0xe9a985,
  bone: 0xf1e6cf,
  boneShade: 0xc7b79a,
  steel: 0xcfd8e6,
  steelShade: 0x8a96aa,
  gold: 0xffc23d,
  goldShade: 0xc98a12,
  ogre: 0x7ccf4a,
  ogreShade: 0x4f9a2c,
  golem: 0x3a4766,
  golemShade: 0x252f48,
  rune: 0x4fd8ff,
  crack: 0xff4fd8,
  vampire: 0xe9e2f2,
  cape: 0x9a0f2e,
  capeInner: 0x2a0612,
} as const;

export type ThemeKey = keyof typeof THEME;

export const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');

// Per-floor castle themes (Castlevania-style biomes).
export interface FloorTheme {
  name: string;
  subtitle: string;
  floorA: number;
  floorB: number;
  floorLine: number;
  wallTop: number;
  wallFace: number;
  wallFaceDark: number;
  wallTrim: number;
  carpet: number;
  carpetTrim: number;
  void: number;
  light: number; // colour of decorative light sources
  ambient: number; // vignette tint
  accent: number;
}

export const FLOOR_THEMES: FloorTheme[] = [
  {
    name: 'Castle Gate',
    subtitle: 'Torches gutter in the great hall',
    floorA: 0x6b4a3a,
    floorB: 0x5d3f31,
    floorLine: 0x3b2520,
    wallTop: 0x2b1a24,
    wallFace: 0x7a5a4a,
    wallFaceDark: 0x523a30,
    wallTrim: 0xb58a5a,
    carpet: 0x9a1630,
    carpetTrim: 0xffc23d,
    void: 0x120a10,
    light: 0xffb43d,
    ambient: 0x2a0d08,
    accent: 0xffb43d,
  },
  {
    name: 'Bone Catacombs',
    subtitle: 'The dead do not rest here',
    floorA: 0x4a5148,
    floorB: 0x3f463e,
    floorLine: 0x272c26,
    wallTop: 0x1a1f1b,
    wallFace: 0x5b6455,
    wallFaceDark: 0x3d443a,
    wallTrim: 0x9fae8a,
    carpet: 0x3b4f2a,
    carpetTrim: 0x8dffb4,
    void: 0x0a0d0b,
    light: 0x7dff9a,
    ambient: 0x06140a,
    accent: 0x7dff9a,
  },
  {
    name: 'Moonlit Throne',
    subtitle: 'The Count awaits beneath the blood moon',
    floorA: 0x4a3a66,
    floorB: 0x2e2442,
    floorLine: 0x1d1530,
    wallTop: 0x150f22,
    wallFace: 0x54447a,
    wallFaceDark: 0x392d58,
    wallTrim: 0xc9b7ff,
    carpet: 0x8a0f2c,
    carpetTrim: 0xe9e2f2,
    void: 0x09060f,
    light: 0xa8c8ff,
    ambient: 0x120626,
    accent: 0xff4f6e,
  },
];

// Rarity colours for upgrade cards & loot.
export const RARITY_COLORS = {
  common: { fill: 0x3a2c4a, edge: 0xc9bcd8, text: '#e9e0f2', label: 'COMMON' },
  uncommon: { fill: 0x163a2a, edge: 0x3ddc84, text: '#8dffb4', label: 'UNCOMMON' },
  rare: { fill: 0x15284a, edge: 0x5ec8ff, text: '#9fe0ff', label: 'RARE' },
  epic: { fill: 0x2e1248, edge: 0xb05cff, text: '#e2b8ff', label: 'EPIC' },
} as const;
