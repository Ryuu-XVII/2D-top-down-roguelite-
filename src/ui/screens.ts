import { CONFIG, type QualityPreset } from '../config';
import { seedToString } from '../core/rng';
import type { FloorGraph } from '../gen/graph';
import type { Rarity } from '../gen/loot';
import { CARD_BY_ID, PACKS, TIER_LABEL, type CardDef, type UnlockPack } from '../game/cards';
import { CLASSES, CLASS_ORDER, type ClassId } from '../game/classes';
import type { MysteryEvent, ShopEntry } from '../game/economy';
import { describeStats, ITEM_BY_ID, itemStats, SLOT_INFO, SLOTS, type ItemDef, type OwnedItem } from '../game/equipment';
import { CLASS_COST, STAT_BONUS_MAX, statBonusCost, type MetaSave } from '../game/meta';
import type { Player } from '../game/player';
import { ATTR_INFO, ATTRS, upgradeCost, type Attr } from '../game/stats';
import type { Settings } from '../platform/settings';
import { RARITY_COLORS, hex } from '../theme';
import { button, h, richText } from './dom';
import { icon, NODE_ICON, NODE_NAME } from './icons';
import type { Nav } from './nav';

/** Owns the single active full-screen panel and wires it to focus navigation. */
export class UI {
  current: HTMLElement | null = null;
  constructor(
    readonly root: HTMLElement,
    readonly nav: Nav,
    private tap: () => void,
  ) {
    root.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, .card, .class-card, .shop-item')) this.tap();
    });
  }

  open(el: HTMLElement, onBack: (() => void) | null = null): void {
    this.current?.remove();
    this.current = el;
    this.root.appendChild(el);
    this.nav.setRoot(el, onBack);
  }

  close(): void {
    this.current?.remove();
    this.current = null;
    this.nav.setRoot(null);
  }

  get isOpen(): boolean {
    return this.current !== null;
  }
}

const rarityStyle = (r: Rarity) => `--edge:${hex(RARITY_COLORS[r].edge)};--fill:${hex(RARITY_COLORS[r].fill)}`;

// ── Title & menus ───────────────────────────────────────────────────────────

function castleSilhouette(): string {
  // Code-drawn castle skyline with towers, spires and lit windows.
  const towers = [
    [40, 260, 70],
    [130, 200, 60],
    [210, 300, 90],
    [330, 230, 70],
    [420, 340, 110],
    [560, 250, 70],
    [650, 190, 55],
    [730, 290, 80],
    [840, 220, 65],
    [930, 170, 60],
  ];
  let d = 'M0 400 V330 ';
  let wins = '';
  for (const [x, hgt, w] of towers) {
    d += `H${x} V${400 - hgt} L${x + w / 2} ${400 - hgt - w * 0.9} L${x + w} ${400 - hgt} V330 `;
    for (let k = 0; k < 3; k++) wins += `<rect x="${x + w / 2 - 5}" y="${400 - hgt + 30 + k * 40}" width="10" height="16" rx="5" fill="#ffb43d" opacity="${0.5 + (k % 2) * 0.4}"/>`;
  }
  d += 'H1000 V400 Z';
  return `<svg viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax slice"><path d="${d}" fill="#0d0714" stroke="#170b1c" stroke-width="6"/>${wins}<rect y="380" width="1000" height="20" fill="#0d0714"/></svg>`;
}

export function titleBackdrop(): HTMLElement {
  const bg = h('div', { class: 'title-bg', html: `<div class="moon"></div>${castleSilhouette()}` });
  for (let i = 0; i < 5; i++) {
    const b = h('div', { class: 'bat', html: icon('bat', 40) });
    b.style.top = 12 + i * 9 + '%';
    b.style.animationDelay = `0s, ${-i * 3.1}s`;
    bg.appendChild(b);
  }
  return bg;
}

function logo(): HTMLElement {
  return h(
    'div',
    { class: 'logo' },
    h('span', { class: 'lw' }, h('span', { class: 'st' }, 'CRIMSON'), h('span', { class: 'fi' }, 'CRIMSON')),
    h('span', { class: 'lw big' }, h('span', { class: 'st' }, 'KEEP'), h('span', { class: 'fi' }, 'KEEP')),
    h('div', { class: 'logo-banner ol' }, 'A GOTHIC ROGUELITE'),
  );
}

export function titleScreen(onStart: () => void): HTMLElement {
  const el = h(
    'div',
    { class: 'screen', style: 'background: none; backdrop-filter: none' },
    titleBackdrop(),
    h('div', { class: 'title-wrap' }, logo(), h('div', { class: 'tap-start ol' }, 'Tap or press any key')),
  );
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    window.removeEventListener('keydown', go);
    onStart();
  };
  // 'click' (not pointerdown) so the same tap can't land on the next menu's buttons.
  el.addEventListener('click', go);
  window.addEventListener('keydown', go);
  const poll = () => {
    if (!el.isConnected) return;
    for (const gp of navigator.getGamepads?.() ?? []) if (gp?.buttons.some((b) => b.pressed)) return go();
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
  return el;
}

export interface MenuHandlers {
  hasSave: boolean;
  meta: MetaSave;
  onContinue: () => void;
  onNew: () => void;
  onDaily: () => void;
  onSeed: () => void;
  onUnlocks: () => void;
  onSettings: () => void;
}

export function mainMenu(m: MenuHandlers): HTMLElement {
  const btns = h('div', { class: 'col' });
  if (m.hasSave) {
    const c = button('Continue Run', m.onContinue, 'green');
    c.dataset.autofocus = '1';
    btns.append(c);
  }
  btns.append(
    button('New Run', m.onNew),
    button('Daily Moon', m.onDaily, 'alt'),
    button('Enter Seed', m.onSeed, 'alt'),
    button('Unlocks', m.onUnlocks, 'alt'),
    button('Settings', m.onSettings, 'alt'),
  );
  return h(
    'div',
    { class: 'screen', style: 'background: none; backdrop-filter: none' },
    titleBackdrop(),
    h('div', { class: 'title-wrap' }, logo(), btns, h('div', { class: 'seedline' }, `Souls ${m.meta.souls} · Runs ${m.meta.runs} · Wins ${m.meta.wins}`)),
  );
}

export function classSelect(
  meta: MetaSave,
  portrait: (c: ClassId) => HTMLCanvasElement,
  onPick: (c: ClassId) => void,
  onBack: () => void,
): HTMLElement {
  const row = h('div', { class: 'row' });
  for (const id of CLASS_ORDER) {
    const c = CLASSES[id];
    const unlocked = meta.classes.includes(id);
    const card = h(
      'div',
      { class: `class-card${unlocked ? '' : ' locked'}`, nav: true, attrs: { role: 'button', tabindex: '0' } },
      h('div', { class: 'portrait' }, portrait(id)),
      h('div', { class: 'nm ol' }, c.name),
      h('div', { class: 'role' }, `${c.role.toUpperCase()} · ${c.geometry}`),
      h('p', {}, c.blurb),
      h(
        'div',
        { class: 'stats' },
        h('span', {}, `HP ${c.maxHp}`),
        h('span', {}, `ARM ${c.armor}`),
        h('span', {}, `SPD ${c.moveSpeed}`),
        h('span', {}, `EN ${c.maxEnergy}`),
        h('span', {}, `CRIT ${Math.round(c.crit * 100)}%`),
        h('span', {}, `CDR ${Math.round(c.cdr * 100)}%`),
      ),
      h('div', { class: 'role', html: `${icon('bolt', 14)}` }, c.ability.name),
      unlocked ? null : h('div', { class: 'ol', html: `${icon('soul', 18)} ${CLASS_COST[id]} souls in Unlocks` }),
    );
    if (unlocked) card.addEventListener('click', () => onPick(id));
    if (id === CLASS_ORDER.find((x) => meta.classes.includes(x))) card.dataset.autofocus = '1';
    row.appendChild(card);
  }
  return h('div', { class: 'screen' }, h('h2', { class: 'ol' }, 'Choose your hunter'), row, h('div', { style: 'height:1rem' }), button('Back', onBack, 'alt small'));
}

// ── Cards ───────────────────────────────────────────────────────────────────

export function cardEl(c: CardDef, owned: number, onPick: (() => void) | null, price?: number, canAfford = true): HTMLElement {
  const el = h(
    'div',
    { class: 'card', nav: !!onPick, style: rarityStyle(c.rarity), attrs: { role: 'button', tabindex: '0' } },
    owned ? h('div', { class: 'owned ol' }, `×${owned}`) : null,
    h('div', { class: 'tags' }, ...c.tags.map((t) => h('span', { class: 'tag' }, `[${t}]`))),
    h('div', { class: 'medal', html: icon(c.icon, 56) }),
    h('div', { class: 'nm ol' }, c.name),
    h('div', { class: 'desc', html: richText(c.desc) }),
    h('div', { class: 'foot' }, `${RARITY_COLORS[c.rarity].label} // TIER ${TIER_LABEL[c.tier]}`),
    price !== undefined ? h('div', { class: 'price ol', html: `${icon('gem', 18)} ${price}` }) : null,
  );
  if (onPick && canAfford) el.addEventListener('click', onPick);
  if (!canAfford) el.style.opacity = '0.55';
  return el;
}

export function levelUpScreen(p: Player, offers: CardDef[], onPick: (c: CardDef) => void, title = 'LEVEL UP!', sub = 'Choose an upgrade'): HTMLElement {
  const cards = h('div', { class: 'cards' });
  offers.forEach((c, i) => {
    const el = cardEl(c, p.cards.get(c.id) ?? 0, () => onPick(c));
    if (i === 1 || offers.length === 1) el.dataset.autofocus = '1';
    cards.appendChild(el);
  });
  return h('div', { class: 'screen' }, h('h2', { class: 'ol', style: 'font-size:2.6rem' }, title), h('div', { class: 'sub' }, sub), cards);
}

// ── Stat allocation & character sheet ──────────────────────────────────────

export function statPanel(p: Player, onChange: () => void, onDone?: () => void): HTMLElement {
  const panel = h('div', { class: 'panel col' });
  const pending: Record<Attr, number> = { str: 0, agi: 0, vit: 0, int: 0, foc: 0 };
  let left = p.statPoints;
  const pts = h('div', { class: 'points ol' });
  const grid = h('div', { class: 'stats-grid' });
  const vals: Record<string, HTMLElement> = {};
  const refresh = () => {
    pts.textContent = `${left} point${left === 1 ? '' : 's'} to spend`;
    for (const a of ATTRS) vals[a].textContent = String(p.attrs[a] + p.metaAttrs[a] + pending[a]);
  };
  for (const a of ATTRS) {
    const info = ATTR_INFO[a];
    vals[a] = h('span', { class: 'v ol' });
    grid.append(
      h('span', { class: 'nm ol', style: `color:${info.color}` }, info.short),
      h('span', { class: 'ds' }, info.desc),
      button('−', () => {
        if (pending[a] > 0) {
          pending[a]--;
          left++;
          refresh();
        }
      }, 'alt small'),
      vals[a],
      button('+', () => {
        if (left > 0) {
          pending[a]++;
          left--;
          refresh();
        }
      }, 'small'),
    );
  }
  const commit = () => {
    for (const a of ATTRS) p.attrs[a] += pending[a];
    p.statPoints = left;
    for (const a of ATTRS) pending[a] = 0;
    p.recompute();
    onChange();
  };
  const auto = () => {
    // Spread points following the class's strengths.
    const pref: Record<string, Attr[]> = { vanguard: ['str', 'vit', 'agi', 'foc', 'int'], weaver: ['int', 'foc', 'vit', 'agi', 'str'], phantom: ['foc', 'agi', 'str', 'vit', 'int'] };
    const order = pref[p.cls.id];
    let k = 0;
    while (left > 0) {
      pending[order[k % 3 === 2 ? 1 : k % 2]]++;
      left--;
      k++;
    }
    refresh();
  };
  panel.append(pts, grid, h('div', { class: 'row' }, button('Auto-assign', auto, 'alt'), button(onDone ? 'Confirm' : 'Apply', () => {
    commit();
    onDone?.();
    refresh();
  }, 'green')));
  refresh();
  return panel;
}

function sheet(p: Player): HTMLElement {
  const s = p.stats;
  const rows: [string, string][] = [
    ['Max HP', String(s.maxHp)],
    ['Regen', s.hpRegen.toFixed(1) + '/s'],
    ['Armor', s.armor.toFixed(1)],
    ['Damage', ((p.cls.attack.damage + s.dmgFlat) * s.dmgMul).toFixed(1)],
    ['Attack speed', (s.atkSpeed * 100).toFixed(0) + '%'],
    ['Move speed', s.move.toFixed(0)],
    ['Crit chance', (s.crit * 100).toFixed(1) + '%'],
    ['Crit damage', (s.critDmg * 100).toFixed(0) + '%'],
    ['Cooldown red.', (s.cdr * 100).toFixed(1) + '%'],
    ['Energy', `${s.maxEnergy.toFixed(0)} (+${s.energyRegen.toFixed(1)}/s)`],
    ['Familiars', String(s.orbitals)],
    ['Life steal', (s.lifesteal * 100).toFixed(1) + '%'],
  ];
  return h('div', { class: 'sheet' }, ...rows.flatMap(([k, v]) => [h('span', { class: 'k' }, k), h('span', {}, v)]));
}

function slotRow(p: Player, slot: (typeof SLOTS)[number], action?: HTMLElement): HTMLElement {
  const it = p.equipment[slot];
  const def = it ? ITEM_BY_ID[it.id] : null;
  return h(
    'div',
    { class: 'slot' },
    h('div', { class: 'medal', html: icon(def?.glyph ?? 'gem', 34), style: def ? '' : 'opacity:.3' }),
    h(
      'div',
      { class: 'meta' },
      h('div', { class: 't ol', style: def ? `color:${RARITY_COLORS[def.rarity].text}` : '' }, def ? def.name : `Empty ${SLOT_INFO[slot].name}`),
      h('div', { class: 's' }, def ? `${SLOT_INFO[slot].name} · ${describeStats(itemStats(it!)).join(' · ')}` : SLOT_INFO[slot].flavor),
    ),
    it ? h('div', { class: 'lv ol' }, `Lv ${it.level}`) : null,
    action ?? null,
  );
}

export interface PauseHandlers {
  player: Player;
  seed: string;
  graph: FloorGraph;
  current: number;
  visited: number[];
  floorName: string;
  settings: () => HTMLElement;
  onResume: () => void;
  onAbandon: () => void;
  onChange: () => void;
}

export function pauseScreen(hd: PauseHandlers, startTab = 'character'): HTMLElement {
  const p = hd.player;
  const body = h('div', { class: 'col', style: 'min-height: 18rem' });
  const tabsEl = h('div', { class: 'tabs' });
  const tabs: Record<string, () => HTMLElement> = {
    character: () => h('div', { class: 'col' }, sheet(p), p.statPoints > 0 ? statPanel(p, () => {
      hd.onChange();
      show('character');
    }) : null),
    equipment: () => h('div', { class: 'slot-list' }, ...SLOTS.map((s) => slotRow(p, s))),
    cards: () =>
      p.cards.size
        ? h(
            'div',
            { class: 'mini-cards' },
            ...[...p.cards.entries()].map(([id, n]) => {
              const c = CARD_BY_ID[id];
              return h('div', { class: 'mini-card ol', style: `border-color:${hex(RARITY_COLORS[c.rarity].edge)}`, html: `${icon(c.icon, 22)}${c.name}${n > 1 ? ' ×' + n : ''}` });
            }),
          )
        : h('div', { class: 'sub' }, 'No upgrade cards yet — level up to earn them.'),
    map: () => mapView(hd.graph, hd.current, hd.visited),
    settings: () => hd.settings(),
  };
  const show = (name: string) => {
    body.replaceChildren(tabs[name]());
    for (const b of tabsEl.children) (b as HTMLElement).classList.toggle('on', (b as HTMLElement).dataset.tab === name);
  };
  for (const name of Object.keys(tabs)) {
    const b = h('button', { class: 'tab', nav: true, onClick: () => show(name) }, name[0].toUpperCase() + name.slice(1));
    b.dataset.tab = name;
    tabsEl.appendChild(b);
  }
  show(startTab);
  const resume = button('Resume', hd.onResume, 'green');
  resume.dataset.autofocus = '1';
  resume.dataset.back = '1';
  return h(
    'div',
    { class: 'screen' },
    h('h2', { class: 'ol' }, 'Paused'),
    h('div', { class: 'sub' }, `${hd.floorName} · seed ${hd.seed}`),
    tabsEl,
    h('div', { class: 'panel', style: 'max-width: 94vw' }, body),
    h('div', { style: 'height: 0.8rem' }),
    h('div', { class: 'row' }, resume, button('Abandon Run', hd.onAbandon, 'red')),
  );
}

/** Floor map in the spirit of Sample 2, restyled as a cartoon gothic chart. */
export function mapView(g: FloorGraph, current: number, visited: number[]): HTMLElement {
  const W = 800;
  const H = 300;
  const cols = g.columns.length;
  const pos = (id: number) => {
    const n = g.nodes[id];
    return { x: 70 + (n.col * (W - 140)) / (cols - 1), y: H / 2 + (n.row - (n.rowsInCol - 1) / 2) * 92 };
  };
  const reach = new Set<number>();
  const stack = [current];
  while (stack.length) {
    const n = stack.pop()!;
    for (const m of g.nodes[n].next) if (!reach.has(m)) {
      reach.add(m);
      stack.push(m);
    }
  }
  let svg = `<svg class="map-svg" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" rx="18" fill="#140c1e" stroke="#170b1c" stroke-width="6"/>`;
  for (const n of g.nodes)
    for (const m of n.next) {
      const a = pos(n.id);
      const b = pos(m);
      const walked = visited.includes(n.id) && visited.includes(m);
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#170b1c" stroke-width="9" stroke-linecap="round"/>`;
      svg += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${walked ? '#ffc23d' : '#4a3a6a'}" stroke-width="4" stroke-dasharray="${walked ? '0' : '8 7'}" stroke-linecap="round"/>`;
    }
  for (const n of g.nodes) {
    const { x, y } = pos(n.id);
    const isCur = n.id === current;
    const dim = !isCur && !reach.has(n.id) && !visited.includes(n.id);
    const r = n.type === 'boss' ? 30 : 24;
    svg += `<g opacity="${dim ? 0.35 : 1}">`;
    if (isCur) svg += `<circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="#5ec8ff" stroke-width="4" stroke-dasharray="6 5"><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="6s" repeatCount="indefinite"/></circle>`;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${n.type === 'boss' ? '#5c0820' : '#2c2347'}" stroke="#170b1c" stroke-width="5"/>`;
    svg += `<g transform="translate(${x - r * 0.7} ${y - r * 0.7}) scale(${(r * 1.4) / 32})">${icon(NODE_ICON[n.type], 32).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
    svg += `<text x="${x}" y="${y + r + 18}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="12" fill="#fff" stroke="#170b1c" stroke-width="4" paint-order="stroke">${NODE_NAME[n.type].toUpperCase()}</text></g>`;
  }
  svg += '</svg>';
  return h('div', { html: svg });
}

export function mapScreen(g: FloorGraph, current: number, visited: number[], floorName: string, onClose: () => void): HTMLElement {
  const close = button('Close', onClose, 'alt');
  close.dataset.back = '1';
  close.dataset.autofocus = '1';
  return h('div', { class: 'screen' }, h('h2', { class: 'ol' }, floorName), mapView(g, current, visited), h('div', { style: 'height:1rem' }), close);
}

// ── Settings ────────────────────────────────────────────────────────────────

export function settingsPanel(s: Settings, onChange: (s: Settings) => void, onFullscreen: () => void): HTMLElement {
  const grid = h('div', { class: 'settings' });
  const toggle = (label: string, key: keyof Settings) => {
    const b = h('button', { class: `toggle${s[key] ? ' on' : ''}`, nav: true }, s[key] ? 'ON' : 'OFF');
    b.addEventListener('click', () => {
      (s[key] as boolean) = !s[key];
      b.classList.toggle('on', !!s[key]);
      b.textContent = s[key] ? 'ON' : 'OFF';
      onChange(s);
    });
    grid.append(h('label', {}, label), b);
  };
  const slider = (label: string, key: keyof Settings, min: number, max: number, step: number) => {
    const r = h('input', { nav: true, attrs: { type: 'range', min: String(min), max: String(max), step: String(step), value: String(s[key]) } });
    r.addEventListener('input', () => {
      (s[key] as number) = Number(r.value);
      onChange(s);
    });
    grid.append(h('label', {}, label), r);
  };
  const sel = h('select', { nav: true });
  for (const q of ['auto', 'ultra', 'high', 'medium', 'low'] as const) {
    const o = h('option', { attrs: { value: q } }, q.toUpperCase());
    if (s.quality === q) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => {
    s.quality = sel.value as QualityPreset | 'auto';
    onChange(s);
  });
  // Gamepad: cycle with confirm.
  sel.addEventListener('click', (e) => {
    if ((e as MouseEvent).detail === 0) {
      sel.selectedIndex = (sel.selectedIndex + 1) % sel.options.length;
      sel.dispatchEvent(new Event('change'));
    }
  });
  grid.append(h('label', {}, 'Quality'), sel);
  slider('Master volume', 'volMaster', 0, 1, 0.05);
  slider('SFX volume', 'volSfx', 0, 1, 0.05);
  slider('Music volume', 'volMusic', 0, 1, 0.05);
  toggle('Battery saver (60 FPS)', 'batterySaver');
  toggle('Screen shake', 'screenShake');
  toggle('Haptics', 'haptics');
  toggle('Aim assist (touch/pad)', 'aimAssist');
  toggle('Auto-aim (one thumb)', 'autoAim');
  slider('Joystick size', 'stickSize', 0.6, 1.6, 0.05);
  slider('Joystick opacity', 'stickOpacity', 0.2, 1, 0.05);
  toggle('Left-handed sticks', 'leftHanded');
  slider('UI scale', 'uiScaleAdj', -0.25, 0.25, 0.05);
  toggle('Show FPS', 'showFps');
  const fs = h('button', { class: 'toggle', nav: true, onClick: onFullscreen }, 'TOGGLE');
  grid.append(h('label', {}, 'Fullscreen'), fs);
  return h('div', { class: 'panel' }, grid);
}

export function settingsScreen(panel: HTMLElement, onBack: () => void): HTMLElement {
  const b = button('Back', onBack, 'alt');
  b.dataset.back = '1';
  return h('div', { class: 'screen' }, h('h2', { class: 'ol' }, 'Settings'), panel, h('div', { style: 'height:1rem' }), b);
}

// ── Shop, forge, rest, events, chests ──────────────────────────────────────

export function shopScreen(p: Player, stock: ShopEntry[], onBuy: (e: ShopEntry) => void, onClose: () => void): HTMLElement {
  const grid = h('div', { class: 'shop-grid' });
  for (const e of stock) {
    const afford = p.scrap >= e.price && !e.sold;
    let ic = 'potion';
    let title = '';
    let sub = '';
    let color = '';
    if (e.kind === 'card') {
      ic = e.card.icon;
      title = e.card.name;
      sub = e.card.desc.replace(/[{}]/g, '');
      color = RARITY_COLORS[e.card.rarity].text;
    } else if (e.kind === 'item') {
      ic = e.item.glyph;
      title = e.item.name;
      sub = `${SLOT_INFO[e.item.slot].name}: ${describeStats(e.item.stats).join(' · ')}`;
      color = RARITY_COLORS[e.item.rarity].text;
    } else if (e.kind === 'potion') {
      title = 'Crimson Potion';
      sub = 'Heal 40% HP.';
    } else {
      ic = 'book';
      title = 'Tome of Insight';
      sub = '+1 stat point.';
    }
    const el = h(
      'button',
      { class: 'shop-item', nav: true, disabled: !afford },
      h('div', { html: icon(ic, 40) }),
      h('div', { class: 'meta' }, h('div', { class: 't ol', style: color ? `color:${color}` : '' }, e.sold ? `${title} (sold)` : title), h('div', { class: 's' }, sub)),
      h('div', { class: 'price ol', html: `${icon('gem', 18)}${e.price}` }),
    );
    el.addEventListener('click', () => afford && onBuy(e));
    grid.appendChild(el);
  }
  const close = button('Leave shop', onClose, 'alt');
  close.dataset.back = '1';
  return h(
    'div',
    { class: 'screen' },
    h('h2', { class: 'ol' }, 'The Wandering Merchant'),
    h('div', { class: 'sub', html: `"Heh heh... what're ya buyin'?" · You have ${p.scrap} gems` }),
    grid,
    h('div', { style: 'height:1rem' }),
    close,
  );
}

export function forgeScreen(p: Player, onUpgrade: (slot: (typeof SLOTS)[number]) => void, onClose: () => void): HTMLElement {
  const list = h('div', { class: 'slot-list' });
  for (const s of SLOTS) {
    const it = p.equipment[s];
    let action: HTMLElement | undefined;
    if (it) {
      const cost = upgradeCost(it.level);
      action = h(
        'button',
        { class: 'btn small', nav: true, disabled: p.scrap < cost, html: `${icon('anvil', 20)}&nbsp;${cost}` },
      );
      action.addEventListener('click', () => p.scrap >= cost && onUpgrade(s));
    }
    list.appendChild(slotRow(p, s, action));
  }
  const close = button('Done', onClose, 'alt');
  close.dataset.back = '1';
  return h(
    'div',
    { class: 'screen' },
    h('h2', { class: 'ol' }, 'The Forge'),
    h('div', { class: 'sub' }, `Spend gems to raise item level (+20% stats per level). You have ${p.scrap} gems.`),
    list,
    h('div', { style: 'height:1rem' }),
    close,
  );
}

export function choiceScreen(title: string, text: string, ic: string, choices: { label: string; detail: string; onPick: () => void; disabled?: boolean }[]): HTMLElement {
  const col = h('div', { class: 'col', style: 'width: min(30rem, 90vw)' });
  choices.forEach((c, i) => {
    const b = h(
      'button',
      { class: 'btn alt', nav: true, disabled: c.disabled, style: 'width:100%; display:flex; flex-direction:column; align-items:center; gap:.2rem' },
      h('span', {}, c.label),
      h('span', { class: 'mono', style: '-webkit-text-stroke:0; font-size:.75rem; color:#2a1d36' }, c.detail),
    );
    b.addEventListener('click', () => !c.disabled && c.onPick());
    if (i === 0) b.dataset.autofocus = '1';
    col.appendChild(b);
  });
  return h(
    'div',
    { class: 'screen' },
    h('div', { html: icon(ic, 84) }),
    h('h2', { class: 'ol' }, title),
    h('div', { class: 'sub', style: 'max-width: 30rem' }, text),
    col,
  );
}

export function eventScreen(ev: MysteryEvent, canAfford: (cost: number) => boolean, onPick: (i: number) => void): HTMLElement {
  return choiceScreen(
    ev.title,
    ev.text,
    ev.icon,
    ev.choices.map((c, i) => ({
      label: c.label,
      detail: c.detail,
      disabled: 'cost' in c.effect ? !canAfford((c.effect as { cost: number }).cost) : false,
      onPick: () => onPick(i),
    })),
  );
}

export function itemFoundScreen(item: ItemDef, current: OwnedItem | undefined, onEquip: () => void, onSalvage: () => void, salvageValue: number): HTMLElement {
  const cur = current ? ITEM_BY_ID[current.id] : null;
  const stats = describeStats(item.stats).join(' · ');
  const curStats = cur ? describeStats(itemStats(current!)).join(' · ') : '—';
  const equip = button('Equip', onEquip, 'green');
  equip.dataset.autofocus = '1';
  return h(
    'div',
    { class: 'screen' },
    h('div', { class: 'card', style: rarityStyle(item.rarity) + ';min-height:auto;width:min(20rem,86vw)' },
      h('div', { class: 'tags' }, h('span', { class: 'tag' }, SLOT_INFO[item.slot].name.toUpperCase())),
      h('div', { class: 'medal', html: icon(item.glyph, 56) }),
      h('div', { class: 'nm ol' }, item.name),
      h('div', { class: 'desc' }, stats),
      h('div', { class: 'foot' }, `${RARITY_COLORS[item.rarity].label} ITEM`),
    ),
    h('div', { class: 'sub', style: 'margin-top:1rem' }, cur ? `Currently: ${cur.name} Lv${current!.level} (${curStats})` : `Your ${SLOT_INFO[item.slot].name} slot is empty.`),
    h('div', { class: 'row' }, equip, button(`Salvage (+${salvageValue} gems)`, onSalvage, 'alt')),
  );
}

export interface EndStats {
  victory: boolean;
  cls: ClassId;
  level: number;
  floor: number;
  rooms: number;
  kills: number;
  damage: number;
  time: number;
  souls: number;
  seed: string;
}

export function endScreen(st: EndStats, onRetry: () => void, onNew: () => void, onTitle: () => void): HTMLElement {
  const mins = Math.floor(st.time / 60);
  const secs = Math.floor(st.time % 60);
  const retry = button('Retry (new map)', onRetry, 'green');
  retry.dataset.autofocus = '1';
  return h(
    'div',
    { class: 'screen' },
    h('h2', { class: 'ol', style: `font-size:3rem;color:${st.victory ? '#ffc23d' : '#e8344e'}` }, st.victory ? 'VICTORY!' : 'YOU HAVE FALLEN'),
    h('div', { class: 'sub' }, st.victory ? 'The Count is no more. Dawn breaks over the keep.' : 'Your soul returns to the castle gate...'),
    h(
      'div',
      { class: 'panel sheet', style: 'min-width: min(24rem, 90vw)' },
      ...(
        [
          ['Hunter', CLASSES[st.cls].name],
          ['Level', String(st.level)],
          ['Floor reached', `${st.floor + 1} / ${CONFIG.floors}`],
          ['Rooms cleared', String(st.rooms)],
          ['Enemies slain', String(st.kills)],
          ['Damage dealt', Math.round(st.damage).toLocaleString()],
          ['Time', `${mins}:${String(secs).padStart(2, '0')}`],
          ['Seed', st.seed],
        ] as [string, string][]
      ).flatMap(([k, v]) => [h('span', { class: 'k' }, k), h('span', {}, v)]),
    ),
    h('div', { class: 'ol', style: 'margin: 1rem 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.4rem', html: `${icon('soul', 26)}+${st.souls} souls` }),
    h('div', { class: 'row' }, retry, button('New Run', onNew), button('Title', onTitle, 'alt')),
  );
}

export function unlocksScreen(meta: MetaSave, buy: (kind: 'class' | 'pack' | 'stat', id: string) => void, onBack: () => void): HTMLElement {
  const grid = h('div', { class: 'shop-grid' });
  const entry = (ic: string, title: string, sub: string, price: number, owned: boolean, onClick: () => void) => {
    const can = !owned && meta.souls >= price;
    const el = h(
      'button',
      { class: 'shop-item', nav: true, disabled: !can },
      h('div', { html: icon(ic, 40) }),
      h('div', { class: 'meta' }, h('div', { class: 't ol' }, title), h('div', { class: 's' }, sub)),
      h('div', { class: 'price ol', html: owned ? 'OWNED' : `${icon('soul', 18)}${price}` }),
    );
    el.addEventListener('click', () => can && onClick());
    grid.appendChild(el);
  };
  for (const id of CLASS_ORDER) {
    if (id === 'vanguard') continue;
    const c = CLASSES[id];
    entry(id === 'weaver' ? 'staff' : 'dagger', `Unlock ${c.name}`, `${c.role} — ${c.ability.name}`, CLASS_COST[id], meta.classes.includes(id), () => buy('class', id));
  }
  for (const k of Object.keys(PACKS) as UnlockPack[]) {
    entry(k === 'holy' ? 'cross' : k === 'blood' ? 'fang' : 'scythe', PACKS[k].name, PACKS[k].desc, PACKS[k].cost, meta.packs.includes(k), () => buy('pack', k));
  }
  for (const a of ATTRS) {
    const lv = meta.statBonus[a];
    entry('book', `${ATTR_INFO[a].name} +1 (${lv}/${STAT_BONUS_MAX})`, `Start every run with +1 ${ATTR_INFO[a].short}.`, statBonusCost(lv), lv >= STAT_BONUS_MAX, () => buy('stat', a));
  }
  const back = button('Back', onBack, 'alt');
  back.dataset.back = '1';
  return h(
    'div',
    { class: 'screen' },
    h('h2', { class: 'ol' }, 'Unlocks'),
    h('div', { class: 'sub', html: `${icon('soul', 18)} ${meta.souls} souls — earned by converting gems when a run ends` }),
    grid,
    h('div', { style: 'height:1rem' }),
    back,
  );
}

export function seedScreen(onGo: (seed: string) => void, onBack: () => void): HTMLElement {
  const inp = h('input', {
    nav: true,
    attrs: { type: 'text', maxlength: '9', placeholder: 'e.g. 1A2B3C', autocapitalize: 'characters', spellcheck: 'false' },
    style: 'font: 900 1.4rem var(--mono); padding: .5rem 1rem; min-height: 44px; border-radius: .7rem; border: .22rem solid var(--ink); background: #f6f0ff; color: #170b1c; text-transform: uppercase; width: 14rem; text-align: center',
  });
  const back = button('Back', onBack, 'alt');
  back.dataset.back = '1';
  const go = button('Begin', () => inp.value.trim() && onGo(inp.value.trim()), 'green');
  inp.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && inp.value.trim()) onGo(inp.value.trim());
    if (e.key === 'Escape') onBack();
  });
  setTimeout(() => inp.focus(), 50);
  return h('div', { class: 'screen' }, h('h2', { class: 'ol' }, 'Enter a seed'), h('div', { class: 'sub' }, 'Same seed + same attempt = the same castle. Share seeds for bug reports and races.'), inp, h('div', { style: 'height:1rem' }), h('div', { class: 'row' }, go, back));
}

export function confirmScreen(text: string, yes: string, onYes: () => void, onNo: () => void): HTMLElement {
  const no = button('Cancel', onNo, 'alt');
  no.dataset.back = '1';
  no.dataset.autofocus = '1';
  return h('div', { class: 'screen' }, h('h2', { class: 'ol' }, text), h('div', { class: 'row' }, button(yes, onYes, 'red'), no));
}

export function rotateOverlay(): HTMLElement {
  return h('div', { class: 'rotate hidden' }, h('div', { class: 'phone' }), h('div', { class: 'ol', style: 'font-size:1.4rem' }, 'Rotate your device'), h('div', { class: 'sub' }, 'Crimson Keep plays in landscape.'));
}

export const seedLabel = (seed: number, attempt: number): string => `${seedToString(seed)}-${attempt}`;
