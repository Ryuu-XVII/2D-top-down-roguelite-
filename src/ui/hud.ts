import { CONFIG } from '../config';
import { formatNum } from '../core/math';
import { TILE_DOOR, TILE_FLOOR } from '../gen/grid';
import type { InteractKind, World } from '../game/world';
import type { Input, InputMethod } from '../platform/input';
import { h } from './dom';
import { icon } from './icons';

const ABILITY_ICON: Record<string, string> = { vanguard: 'shield', weaver: 'singularity', phantom: 'moon' };

const INTERACT_LABEL: Record<InteractKind, string> = {
  chest: 'Open chest',
  shrine: 'Pray at shrine',
  merchant: 'Trade',
  anvil: 'Forge equipment',
  campfire: 'Rest by the fire',
  altar: 'Touch the altar',
  portal: 'Descend deeper',
};

export class Hud {
  readonly el: HTMLElement;
  private lvl: HTMLElement;
  private xpFill: HTMLElement;
  private hpFill: HTMLElement;
  private hpLag: HTMLElement;
  private hpVal: HTMLElement;
  private atkVal: HTMLElement;
  private defVal: HTMLElement;
  private gemVal: HTMLElement;
  private roomPill: HTMLElement;
  private energyFill: HTMLElement;
  private boss: HTMLElement;
  private bossName: HTMLElement;
  private bossFill: HTMLElement;
  private abilities: HTMLElement;
  private abilityTile: HTMLElement;
  private abilityCd: HTMLElement;
  private abilityKey: HTMLElement;
  private dashTile: HTMLElement;
  private dashCd: HTMLElement;
  private dashKey: HTMLElement;
  private prompt: HTMLElement;
  private hints: HTMLElement;
  private toasts: HTMLElement;
  private fps: HTMLElement;
  private minimap: HTMLCanvasElement;
  private mmBase: HTMLCanvasElement | null = null;
  private mmTimer = 0;
  // Touch controls
  private touch: HTMLElement;
  private moveBase: HTMLElement;
  private moveKnob: HTMLElement;
  private aimBase: HTMLElement;
  private aimKnob: HTMLElement;
  private tAbility: HTMLElement;
  private tAbilityCd: HTMLElement;
  private tDash: HTMLElement;
  private tInteract: HTMLElement;
  private method: InputMethod = 'keyboardMouse';
  private last: Record<string, string | number> = {};
  onPause: (() => void) | null = null;
  onMap: (() => void) | null = null;

  constructor(
    parent: HTMLElement,
    private input: Input,
  ) {
    this.lvl = h('span', { class: 'ol' }, 'Lv. 1');
    this.xpFill = h('div');
    this.hpFill = h('div', { class: 'fill' });
    this.hpLag = h('div', { class: 'lag' });
    this.hpVal = h('span', { class: 'val ol' });
    this.atkVal = h('span', { class: 'val ol' });
    this.defVal = h('span', { class: 'val ol' });
    this.gemVal = h('span', { class: 'val ol' });
    this.roomPill = h('div', { class: 'room-pill ol' });
    this.energyFill = h('div');
    const gear = h('button', { class: 'hud-gear interactive', html: icon('gear', 40), attrs: { 'aria-label': 'Pause' }, onClick: () => this.onPause?.() });
    const top = h(
      'div',
      { class: 'hud-top' },
      h('div', { class: 'exp-badge' }, h('div', { class: 'tag ol' }, 'EXP'), this.lvl, h('div', { class: 'xpbar' }, this.xpFill)),
      h('div', { class: 'pill hp', html: icon('heart', 40) }, this.hpLag, this.hpFill, this.hpVal),
      h('div', { class: 'pill', html: icon('sword', 40) }, this.atkVal),
      h('div', { class: 'pill', html: icon('shield', 40) }, this.defVal),
      gear,
    );
    const row2 = h('div', { class: 'hud-row2' }, h('div', { class: 'pill gems', html: icon('gem', 36) }, this.gemVal), this.roomPill);
    this.minimap = h('canvas', { class: 'minimap interactive', attrs: { 'aria-label': 'Map' } });
    this.minimap.addEventListener('click', () => this.onMap?.());
    this.bossName = h('div', { class: 'name ol' });
    this.bossFill = h('div');
    this.boss = h('div', { class: 'bossbar hidden' }, this.bossName, h('div', { class: 'track' }, this.bossFill));
    this.abilityCd = h('div', { class: 'cd' });
    this.abilityKey = h('span', { class: 'key ol' }, 'SPACE');
    this.abilityTile = h('div', { class: 'tile' }, this.abilityCd, this.abilityKey);
    this.dashCd = h('div', { class: 'cd' });
    this.dashKey = h('span', { class: 'key ol' }, 'SHIFT');
    this.dashTile = h('div', { class: 'tile', html: icon('dash', 36) }, this.dashCd, this.dashKey);
    this.abilities = h('div', { class: 'abilities' }, this.dashTile, this.abilityTile);
    this.prompt = h('div', { class: 'prompt hidden' });
    this.hints = h('div', { class: 'hints hidden' });
    this.toasts = h('div', { class: 'toasts' });
    this.fps = h('div', { class: 'fps hidden' });

    // Touch layer
    this.moveBase = h('div', { class: 'stick-base hidden' });
    this.moveKnob = h('div', { class: 'stick-knob hidden' });
    this.aimBase = h('div', { class: 'stick-base hidden' });
    this.aimKnob = h('div', { class: 'stick-knob hidden' });
    const press = (el: HTMLElement, fn: () => void) => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('down');
        fn();
      });
      el.addEventListener('pointerup', () => el.classList.remove('down'));
      el.addEventListener('pointercancel', () => el.classList.remove('down'));
      el.addEventListener('pointerleave', () => el.classList.remove('down'));
    };
    this.tAbilityCd = h('div', { class: 'cd' });
    this.tAbility = h('div', { class: 'tbtn ability' }, this.tAbilityCd);
    this.tDash = h('div', { class: 'tbtn small', html: icon('dash', 30) });
    this.tInteract = h('div', { class: 'tbtn hidden', html: icon('hand', 34) });
    press(this.tAbility, () => input.pressAbility());
    press(this.tDash, () => input.pressDash());
    press(this.tInteract, () => input.pressInteract());
    this.touch = h('div', { class: 'touch-ui hidden' }, this.moveBase, this.moveKnob, this.aimBase, this.aimKnob, this.tAbility, this.tDash, this.tInteract);

    this.el = h('div', { attrs: { id: 'hud' } }, top, row2, this.minimap, this.boss, this.abilities, this.prompt, this.hints, this.toasts, this.fps, this.touch);
    parent.appendChild(this.el);
    this.layoutTouch(false);
  }

  setVisible(on: boolean): void {
    this.el.classList.toggle('hidden', !on);
  }

  setClass(cls: string): void {
    this.abilityTile.innerHTML = icon(ABILITY_ICON[cls] ?? 'bolt', 36);
    this.abilityTile.append(this.abilityCd, this.abilityKey);
    this.tAbility.innerHTML = icon(ABILITY_ICON[cls] ?? 'bolt', 40);
    this.tAbility.append(this.tAbilityCd);
  }

  setMethod(m: InputMethod): void {
    this.method = m;
    this.touch.classList.toggle('hidden', m !== 'touch');
    this.abilities.classList.toggle('hidden', m === 'touch');
    this.abilityKey.textContent = m === 'gamepad' ? 'A' : 'SPACE';
    this.dashKey.textContent = m === 'gamepad' ? 'B' : 'SHIFT';
    this.last.prompt = '';
    this.last.hints = '';
  }

  layoutTouch(leftHanded: boolean): void {
    const side = leftHanded ? 'left' : 'right';
    this.tAbility.style.cssText = `${side}: calc(var(--sa${side[0]}) + 2rem); bottom: calc(var(--sab) + 9.5rem);`;
    this.tDash.style.cssText = `${side}: calc(var(--sa${side[0]}) + 7.5rem); bottom: calc(var(--sab) + 7.5rem);`;
    this.tInteract.style.cssText = `${side}: calc(var(--sa${side[0]}) + 7rem); bottom: calc(var(--sab) + 13rem);`;
  }

  setStickStyle(sizeMul: number, opacity: number): void {
    const R = CONFIG.stickRadiusCss * sizeMul;
    this.input.stickRadius = R;
    for (const b of [this.moveBase, this.aimBase]) {
      b.style.width = b.style.height = R * 2 + 'px';
      b.style.opacity = String(opacity);
    }
    for (const k of [this.moveKnob, this.aimKnob]) {
      k.style.width = k.style.height = R * 0.9 + 'px';
      k.style.opacity = String(Math.min(1, opacity + 0.3));
    }
  }

  toast(text: string): void {
    const t = h('div', { class: 'toast ol' }, text);
    this.toasts.appendChild(t);
    setTimeout(() => t.remove(), 2700);
    while (this.toasts.children.length > 4) this.toasts.firstElementChild?.remove();
  }

  banner(title: string, sub = ''): void {
    const b = h('div', { class: 'banner-big ol' }, title, sub ? h('span', { class: 'sub ol' }, sub) : null);
    this.el.appendChild(b);
    setTimeout(() => b.remove(), 2500);
  }

  setRoomLabel(text: string): void {
    this.roomPill.textContent = text;
  }

  showHints(on: boolean): void {
    this.hints.classList.toggle('hidden', !on);
    this.last.hints = '';
  }

  setFpsVisible(on: boolean): void {
    this.fps.classList.toggle('hidden', !on);
  }

  setFps(text: string): void {
    if (this.last.fps !== text) {
      this.last.fps = text;
      this.fps.textContent = text;
    }
  }

  private set(key: string, v: string | number, apply: () => void): void {
    if (this.last[key] === v) return;
    this.last[key] = v;
    apply();
  }

  /** Build the static minimap image for a new room. */
  buildMinimap(w: World): void {
    const scale = Math.max(2, Math.floor(140 / Math.max(w.w, w.h * 1.4)));
    const c = document.createElement('canvas');
    c.width = w.w * scale;
    c.height = w.h * scale;
    const g = c.getContext('2d')!;
    for (let y = 0; y < w.h; y++)
      for (let x = 0; x < w.w; x++) {
        const t = w.tiles[y * w.w + x];
        if (t === TILE_FLOOR) g.fillStyle = w.room.carpet[y * w.w + x] ? '#7a2a3a' : '#5a4a6a';
        else if (t === TILE_DOOR) g.fillStyle = '#ffc23d';
        else continue;
        g.fillRect(x * scale, y * scale, scale, scale);
      }
    this.mmBase = c;
    const uiScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1;
    const dpr = window.devicePixelRatio || 1;
    this.minimap.width = c.width * dpr;
    this.minimap.height = c.height * dpr;
    this.minimap.style.width = c.width * uiScale * 0.9 + 'px';
    this.minimap.style.height = c.height * uiScale * 0.9 + 'px';
    this.mmTimer = 0;
  }

  update(w: World, dt: number, energyCost: number): void {
    const p = w.player;
    const s = p.stats;
    this.set('lvl', p.level, () => (this.lvl.textContent = `Lv. ${p.level}`));
    const xpPct = Math.round((p.xp / p.xpToNext) * 100);
    this.set('xp', xpPct, () => (this.xpFill.style.width = xpPct + '%'));
    const hpPct = Math.max(0, Math.round((p.hp / s.maxHp) * 1000) / 10);
    this.set('hp', hpPct, () => {
      this.hpFill.style.width = `calc(${hpPct}% - 0.3rem)`;
      this.hpLag.style.width = `calc(${hpPct}% - 0.3rem)`;
    });
    const hpText = `${formatNum(Math.ceil(p.hp))} / ${formatNum(s.maxHp)}`;
    this.set('hpt', hpText, () => (this.hpVal.textContent = hpText));
    const atk = formatNum((p.cls.attack.damage + s.dmgFlat) * s.dmgMul);
    this.set('atk', atk, () => (this.atkVal.textContent = atk));
    const def = formatNum(s.armor);
    this.set('def', def, () => (this.defVal.textContent = def));
    this.set('gem', p.scrap, () => (this.gemVal.textContent = formatNum(p.scrap)));
    const en = Math.round((p.energy / s.maxEnergy) * 100);
    this.set('en', en, () => (this.energyFill.style.width = en + '%'));

    // Ability / dash cooldowns
    const abCd = p.cls.ability.cooldown * (1 - s.cdr);
    const abFrac = p.abilityCd > 0 ? p.abilityCd / abCd : p.energy < energyCost ? 1 : 0;
    const abPct = Math.round(abFrac * 100);
    this.set('ab', abPct, () => {
      this.abilityCd.style.transform = `scaleY(${abFrac})`;
      this.abilityTile.classList.toggle('ready', abFrac === 0);
      this.tAbilityCd.style.setProperty('--p', abPct + '%');
      this.tAbility.classList.toggle('ready', abFrac === 0);
    });
    const dFrac = p.dashCd > 0 ? p.dashCd / s.dashCooldown : 0;
    const dPct = Math.round(dFrac * 100);
    this.set('dash', dPct, () => (this.dashCd.style.transform = `scaleY(${dFrac})`));

    // Boss bar
    const bi = w.bossIndex;
    const bossOn = bi >= 0 && w.enemies.slots.alive[bi] === 1;
    this.set('bossOn', bossOn ? 1 : 0, () => this.boss.classList.toggle('hidden', !bossOn));
    if (bossOn) {
      this.set('bossName', w.bossName, () => (this.bossName.textContent = w.bossName));
      const bp = Math.round((w.enemies.hp[bi] / w.enemies.maxHp[bi]) * 1000) / 10;
      this.set('bossHp', bp, () => (this.bossFill.style.width = bp + '%'));
    }

    // Interact prompt
    let promptKey = '';
    if (w.nearInteract >= 0 && p.alive) {
      const it = w.interactables[w.nearInteract];
      promptKey = it.kind + this.method;
      this.set('prompt', promptKey, () => {
        const key =
          this.method === 'gamepad' ? '<span class="keycap padx">X</span>' : this.method === 'touch' ? icon('hand', 22) : '<span class="keycap">E</span>';
        this.prompt.innerHTML = `${key}<span class="ol">${INTERACT_LABEL[it.kind]}</span>`;
        this.prompt.classList.remove('hidden');
      });
    } else this.set('prompt', '', () => this.prompt.classList.add('hidden'));
    this.tInteract.classList.toggle('hidden', !promptKey);

    // Control hints (start room)
    if (!this.hints.classList.contains('hidden')) {
      this.set('hints', this.method + p.cls.id, () => {
        const ab = p.cls.ability.name;
        const k = (s2: string, cls = '') => `<span class="keycap ${cls}">${s2}</span>`;
        const rows =
          this.method === 'gamepad'
            ? [[k('L') , 'Move'], [k('R'), 'Aim'], [k('RT'), 'Attack'], [k('A', 'pad'), ab], [k('B', 'padb'), 'Dash'], [k('X', 'padx'), 'Interact']]
            : this.method === 'touch'
              ? [[icon('boot', 20), 'Left thumb: move'], [icon('eye', 20), 'Right thumb: aim & fire'], [icon('dash', 20), 'Swipe/tap: dash'], [icon(ABILITY_ICON[p.cls.id], 20), ab]]
              : [[k('WASD'), 'Move'], [k('Mouse'), 'Aim'], [k('LMB'), 'Attack'], [k('Space') + '/' + k('RMB'), ab], [k('Shift'), 'Dash'], [k('E'), 'Interact'], [k('Tab'), 'Map']];
        this.hints.innerHTML = rows.map(([a, b]) => `<span>${a}<span class="ol">${b}</span></span>`).join('');
      });
    }

    // Touch sticks
    if (this.method === 'touch') {
      const place = (base: HTMLElement, knob: HTMLElement, st: { active: boolean; ox: number; oy: number; x: number; y: number }) => {
        base.classList.toggle('hidden', !st.active);
        knob.classList.toggle('hidden', !st.active);
        if (st.active) {
          base.style.left = st.ox + 'px';
          base.style.top = st.oy + 'px';
          knob.style.left = st.x + 'px';
          knob.style.top = st.y + 'px';
        }
      };
      place(this.moveBase, this.moveKnob, this.input.move);
      place(this.aimBase, this.aimKnob, this.input.aim);
    }

    // Minimap (10 Hz)
    this.mmTimer -= dt;
    if (this.mmBase && this.mmTimer <= 0) {
      this.mmTimer = 0.1;
      const g = this.minimap.getContext('2d')!;
      const sc = this.minimap.width / w.w;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.minimap.width, this.minimap.height);
      g.drawImage(this.mmBase, 0, 0, this.minimap.width, this.minimap.height);
      const T = CONFIG.tile;
      g.fillStyle = '#ff4d6a';
      const E = w.enemies;
      for (let i = 0; i < E.slots.high; i++) {
        if (!E.slots.alive[i]) continue;
        g.fillRect((E.x[i] / T) * sc - sc, (E.y[i] / T) * sc - sc, sc * 2, sc * 2);
      }
      g.fillStyle = '#ffc23d';
      for (const it of w.interactables) if (!it.used || it.kind === 'portal' || it.kind === 'merchant' || it.kind === 'anvil') g.fillRect((it.x / T) * sc - sc, (it.y / T) * sc - sc, sc * 2.4, sc * 2.4);
      g.fillStyle = '#5ec8ff';
      g.strokeStyle = '#170b1c';
      g.lineWidth = sc * 0.8;
      g.beginPath();
      g.arc((p.x / T) * sc, (p.y / T) * sc, sc * 1.8, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }
}
