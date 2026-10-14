// Code-drawn SVG icons in the chunky cartoon style (thick ink outline, flat
// fill, one highlight). viewBox is always 0 0 32 32.

const INK = '#170b1c';
const sw = (w: number) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const S = sw(2.6);

const ICONS: Record<string, string> = {
  heart: `<path d="M16 27C6 20 3 14 6 9.5 8.5 6 13 6.5 16 10.5 19 6.5 23.5 6 26 9.5 29 14 26 20 16 27Z" fill="#e8344e" ${S}/><ellipse cx="10.5" cy="11" rx="2.6" ry="1.8" fill="#fff" opacity=".8"/>`,
  sword: `<path d="M7 25l3-3M9 27l-4-4" ${S} fill="none"/><path d="M10 22L24 6l3 0 0 3L12 24Z" fill="#cfd8e6" ${S}/><path d="M7 19l6 6" stroke="#ffc23d" stroke-width="4" stroke-linecap="round"/><path d="M7 19l6 6" fill="none" ${sw(1.2)}/><path d="M13 20L24.5 8" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  shield: `<path d="M16 4l10 4v7c0 7-5 11-10 13C11 26 6 22 6 15V8Z" fill="#3c7dff" ${S}/><path d="M16 7v18c4-2 7-5 7-10V10Z" fill="#7fb2ff"/><path d="M9.5 10l6.5-2.6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
  gem: `<path d="M16 3l9 8-9 18-9-18Z" fill="#4fa8ff" ${S}/><path d="M16 3l9 8h-18Z" fill="#bfe6ff"/><path d="M16 3l9 8-9 18-9-18Z" fill="none" ${S}/>`,
  soul: `<path d="M16 3c5 6 9 9 7 16-1.5 5-12.5 5-14 0-2-7 2-10 7-16Z" fill="#b05cff" ${S}/><circle cx="16" cy="18" r="4" fill="#f3e8ff"/>`,
  gear: `<path d="M16 5l2.5 3 3.8-1 .8 3.8 3.6 1.5-1.5 3.6 2 3.1-3.3 2 .1 3.9-3.8.2-1.8 3.4-3.4-1.8-3.4 1.8-1.8-3.4-3.8-.2.1-3.9-3.3-2 2-3.1-1.5-3.6 3.6-1.5.8-3.8 3.8 1Z" fill="#9aa1b0" ${S}/><circle cx="16" cy="16" r="4.5" fill="#3a2b45" ${S}/>`,
  pause: `<rect x="8" y="7" width="5.5" height="18" rx="2" fill="#f2eefa" ${S}/><rect x="18.5" y="7" width="5.5" height="18" rx="2" fill="#f2eefa" ${S}/>`,
  map: `<path d="M4 8l7-3 10 3 7-3v19l-7 3-10-3-7 3Z" fill="#e9d8a6" ${S}/><path d="M11 5v19M21 8v19" ${S} fill="none"/><path d="M14 13l3 3m0-3l-3 3" stroke="#e8344e" stroke-width="2.4" stroke-linecap="round"/>`,
  dash: `<path d="M5 20h9M3 14h9M7 8h7" stroke="#f2eefa" stroke-width="3" stroke-linecap="round"/><path d="M14 6l13 10-13 10 3-10Z" fill="#5ec8ff" ${S}/>`,
  hand: `<path d="M10 28c-3-4-6-8-5-10 1-1.5 3-1 4 .5l2 3V7c0-2 3-2 3 0v8-10c0-2 3-2 3 0v10-8c0-2 3-2 3 0v9-5c0-2 3-2 3 0v11c0 5-3 9-6 9Z" fill="#ffd7b0" ${S}/>`,
  skull: `<path d="M16 4C9 4 5 9 5 15c0 4 2 6 4 7v4h14v-4c2-1 4-3 4-7 0-6-4-11-11-11Z" fill="#f1e6cf" ${S}/><circle cx="11.5" cy="15" r="3.2" fill="${INK}"/><circle cx="20.5" cy="15" r="3.2" fill="${INK}"/><path d="M14 26v-3M18 26v-3" ${S}/>`,
  crown: `<path d="M5 24l-1-14 6 6 6-10 6 10 6-6-1 14Z" fill="#ffc23d" ${S}/><circle cx="16" cy="18" r="2.5" fill="#e8344e" ${sw(1.5)}/>`,
  castle: `<path d="M5 28V12h4v3h3v-6h8v6h3v-3h4v16Z" fill="#6a5a7a" ${S}/><path d="M14 28v-6a2 2 0 014 0v6" fill="${INK}"/><path d="M16 9V3l5 2-5 2" fill="#e8344e" ${sw(1.6)}/>`,
  swords: `<path d="M6 26L22 10M26 26L10 10" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M6 26L22 10M26 26L10 10" stroke="#cfd8e6" stroke-width="3.5" stroke-linecap="round"/><path d="M4 22l6 6M22 28l6-6" stroke="#ffc23d" stroke-width="3.5" stroke-linecap="round"/>`,
  horned: `<path d="M8 10L3 3l9 5M24 10l5-7-9 5" fill="#ff8a2a" ${S}/><path d="M16 7c-6 0-9 4-9 9 0 3 1.5 5 3.5 6v4h11v-4c2-1 3.5-3 3.5-6 0-5-3-9-9-9Z" fill="#f1e6cf" ${S}/><circle cx="12.5" cy="16" r="2.6" fill="#e8344e"/><circle cx="19.5" cy="16" r="2.6" fill="#e8344e"/>`,
  question: `<circle cx="16" cy="16" r="12" fill="#7a3cc8" ${S}/><path d="M12 12.5a4 4 0 118 0c0 3-4 3-4 6" fill="none" stroke="#f3e8ff" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="23" r="1.9" fill="#f3e8ff"/>`,
  coins: `<ellipse cx="13" cy="21" rx="8" ry="5" fill="#c98a12" ${S}/><ellipse cx="13" cy="18" rx="8" ry="5" fill="#ffc23d" ${S}/><ellipse cx="20" cy="13" rx="8" ry="5" fill="#ffc23d" ${S}/><path d="M17 12h6" stroke="#c98a12" stroke-width="2" stroke-linecap="round"/>`,
  campfire: `<path d="M6 27l20-5M6 22l20 5" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M6 27l20-5M6 22l20 5" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/><path d="M16 3c5 6 8 9 6 15-1 3-11 3-12 0-2-6 1-9 6-15Z" fill="#ff8a2a" ${S}/><path d="M16 10c2 3 3.5 5 2.5 8-.5 1.5-4.5 1.5-5 0-1-3 .5-5 2.5-8Z" fill="#fff0a8"/>`,
  anvil: `<path d="M4 10h18c3 0 6 2 6 4h-8l-2 4h3v5H11v-5h3l-2-4H6c-1 0-2-1-2-2Z" fill="#6a6f82" ${S}/><path d="M6 12h14" stroke="#b8bfcf" stroke-width="2" stroke-linecap="round"/>`,
  chest: `<path d="M4 15h24v12H4Z" fill="#8a4f2a" ${S}/><path d="M4 15c0-6 4-9 12-9s12 3 12 9Z" fill="#a8643a" ${S}/><rect x="13" y="13" width="6" height="7" rx="1.5" fill="#ffc23d" ${sw(1.8)}/>`,
  bolt: `<path d="M18 3L7 18h7l-3 11 13-16h-7Z" fill="#ffd23d" ${S}/>`,
  fork: `<path d="M16 28V16M16 16L8 6M16 16l8-10M16 16V5" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M16 28V16M16 16L8 6M16 16l8-10M16 16V5" stroke="#d8a8ff" stroke-width="3" stroke-linecap="round"/>`,
  singularity: `<circle cx="16" cy="16" r="11" fill="#2a0a4a" ${S}/><path d="M16 5a11 11 0 0111 11M16 27A11 11 0 015 16" stroke="#d06cff" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="16" r="4" fill="#e879f9" ${sw(1.8)}/>`,
  orbit: `<ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="${INK}" stroke-width="5"/><ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="#3ddc84" stroke-width="2.2"/><circle cx="16" cy="16" r="4.5" fill="#8dffb4" ${S}/><circle cx="27" cy="15" r="3" fill="#3ddc84" ${sw(1.8)}/><circle cx="6" cy="18" r="3" fill="#3ddc84" ${sw(1.8)}/>`,
  cross: `<path d="M12 4h8v8h8v8h-8v8h-8v-8H4v-8h8Z" fill="#ffc23d" ${S}/><path d="M14.5 6v20" stroke="#fff0a8" stroke-width="2" stroke-linecap="round"/>`,
  axe: `<path d="M8 27L22 9" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M8 27L22 9" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/><path d="M18 5c6-1 10 3 9 9-3-1-6-1-8 1l-4-4c2-2 3-4 3-6Z" fill="#cfd8e6" ${S}/>`,
  flask: `<path d="M12 4h8M13 4v7l-6 12c-1 2 0 5 3 5h12c3 0 4-3 3-5l-6-12V4" fill="#7fd6ff" ${S}/><path d="M9 21h14" stroke="#fff" stroke-width="2" opacity=".7"/>`,
  fang: `<path d="M5 6h22c0 6-3 9-6 9l-2 12-3-11-3 11-2-12c-3 0-6-3-6-9Z" fill="#f2eefa" ${S}/><path d="M7 6h18" stroke="#b3123a" stroke-width="3"/>`,
  drop: `<path d="M16 3c6 8 10 12 10 17a10 10 0 01-20 0c0-5 4-9 10-17Z" fill="#b3123a" ${S}/><ellipse cx="12" cy="19" rx="2" ry="3.5" fill="#ff8aa0"/>`,
  boot: `<path d="M9 4h9v13l8 3c2 1 3 3 3 5v2H6v-6l3-4Z" fill="#6b3b23" ${S}/><path d="M9 9h9" stroke="#ffc23d" stroke-width="2.5"/>`,
  eye: `<path d="M3 16c4-7 9-10 13-10s9 3 13 10c-4 7-9 10-13 10S7 23 3 16Z" fill="#f2eefa" ${S}/><circle cx="16" cy="16" r="5.5" fill="#ffc23d" ${S}/><circle cx="16" cy="16" r="2.2" fill="${INK}"/>`,
  battery: `<rect x="5" y="9" width="20" height="14" rx="3" fill="#2a1d36" ${S}/><path d="M25 13h3v6h-3" fill="#9aa1b0" ${S}/><rect x="8" y="12" width="9" height="8" rx="1.5" fill="#b05cff"/>`,
  hourglass: `<path d="M8 4h16M8 28h16M10 4c0 7 6 8 6 12s-6 5-6 12h12c0-7-6-8-6-12s6-5 6-12" fill="#e9d8a6" ${S}/><path d="M12 25h8l-4-4Z" fill="#ffc23d"/>`,
  flame: `<path d="M16 3c6 7 10 11 8 18-1.5 5-14.5 5-16 0-2-7 2-11 8-18Z" fill="#ff8a2a" ${S}/><path d="M16 12c3 4 4 6 3 9-.7 2-5.3 2-6 0-1-3 0-5 3-9Z" fill="#fff0a8"/>`,
  lightning: `<path d="M20 2L9 17h6l-4 13 13-17h-6l4-11Z" fill="#9fe0ff" ${S}/>`,
  multi: `<path d="M5 24L15 8M16 26V6M27 24L17 8" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M5 24L15 8M16 26V6M27 24L17 8" stroke="#cfd8e6" stroke-width="3" stroke-linecap="round"/>`,
  bat: `<path d="M16 12c-2-4-7-6-13-4 3 2 3 6 2 8 2-1 4 0 5 2 1-2 3-2 6-1 3-1 5-1 6 1 1-2 3-3 5-2-1-2-1-6 2-8-6-2-11 0-13 4Z" fill="#4a2766" ${S}/><circle cx="14" cy="14" r="1.4" fill="#ff3355"/><circle cx="18" cy="14" r="1.4" fill="#ff3355"/>`,
  magnet: `<path d="M7 5h6v11a3 3 0 006 0V5h6v11a9 9 0 01-18 0Z" fill="#e8344e" ${S}/><path d="M7 5h6v4H7ZM19 5h6v4h-6Z" fill="#cfd8e6" ${S}/>`,
  thorns: `<circle cx="16" cy="16" r="7" fill="#3b4f2a" ${S}/><path d="M16 2v7M16 23v7M2 16h7M23 16h7M6 6l5 5M21 21l5 5M26 6l-5 5M11 21l-5 5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  moon: `<path d="M20 4a12 12 0 100 24 10 10 0 010-24Z" fill="#f6ecc8" ${S}/><circle cx="12" cy="13" r="1.8" fill="#e0cf9a"/>`,
  scythe: `<path d="M9 29L21 5" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M9 29L21 5" stroke="#4a3a5a" stroke-width="3" stroke-linecap="round"/><path d="M20 6C14 3 6 5 3 12c5-3 11-3 16-1Z" fill="#dfe8f5" ${S}/>`,
  nova: `<circle cx="16" cy="16" r="6" fill="#fff0a8" ${S}/><path d="M16 2v6M16 24v6M2 16h6M24 16h6M6 6l4 4M22 22l4 4M26 6l-4 4M10 22l-4 4" stroke="#ffc23d" stroke-width="3" stroke-linecap="round"/>`,
  potion: `<path d="M13 4h6v6c4 1 7 5 7 9a10 10 0 01-20 0c0-4 3-8 7-9Z" fill="#e8344e" ${S}/><path d="M12 4h8" ${S}/><ellipse cx="12" cy="18" rx="2" ry="3" fill="#ffb0c0"/>`,
  staff: `<path d="M8 29L22 10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M8 29L22 10" stroke="#6b3b23" stroke-width="3" stroke-linecap="round"/><circle cx="23" cy="8" r="5" fill="#d06cff" ${S}/>`,
  dagger: `<path d="M8 24l12-14 4-2-2 4-14 12" fill="#dfe8f5" ${S}/><path d="M6 20l6 6" stroke="#ffc23d" stroke-width="3.5" stroke-linecap="round"/><path d="M5 27l3-3" ${S}/>`,
  mace: `<path d="M8 28L18 14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M8 28L18 14" stroke="#8a5a32" stroke-width="3" stroke-linecap="round"/><circle cx="21" cy="10" r="6.5" fill="#cfd8e6" ${S}/><path d="M21 1v3M30 10h-3M27 3l-2 2M27 17l-2-2" ${S}/>`,
  lantern: `<path d="M12 6h8l2 4v12l-2 4h-8l-2-4V10Z" fill="#ffb43d" ${S}/><path d="M16 2v4" ${S}/><path d="M13 12h6v8h-6Z" fill="#fff0a8"/>`,
  bell: `<path d="M16 4c-5 0-8 4-8 9v6l-3 4h22l-3-4v-6c0-5-3-9-8-9Z" fill="#ffc23d" ${S}/><circle cx="16" cy="26" r="2.6" fill="#c98a12" ${sw(1.8)}/>`,
  book: `<path d="M5 6h10c1 0 1 1 1 1v20s0-1-1-1H5ZM27 6H17s-1 0-1 1v20s0-1 1-1h10Z" fill="#9a0f2e" ${S}/><path d="M8 11h5M19 11h5" stroke="#ffc23d" stroke-width="2"/>`,
};

export function icon(name: string, size = 28, extra = ''): string {
  const body = ICONS[name] ?? ICONS.gem;
  return `<svg class="ico ${extra}" viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

/** Map graph node types to icons. */
export const NODE_ICON: Record<string, string> = {
  start: 'castle',
  combat: 'swords',
  elite: 'horned',
  event: 'question',
  shop: 'coins',
  rest: 'campfire',
  boss: 'crown',
};

export const NODE_NAME: Record<string, string> = {
  start: 'Gate',
  combat: 'Battle',
  elite: 'Elite',
  event: 'Mystery',
  shop: 'Shop',
  rest: 'Sanctuary',
  boss: 'Boss',
};
