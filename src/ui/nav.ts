import type { UiAction } from '../platform/input';

/**
 * Spatial focus navigation so every screen works with a gamepad (D-pad + A)
 * or keyboard (arrows + Enter) as well as mouse and touch.
 */
export class Nav {
  private root: HTMLElement | null = null;
  private current: HTMLElement | null = null;
  onBack: (() => void) | null = null;
  showFocus = false;

  setRoot(root: HTMLElement | null, onBack: (() => void) | null = null): void {
    this.root = root;
    this.onBack = onBack;
    this.current = null;
    if (root) {
      const first = root.querySelector<HTMLElement>('[data-autofocus]') ?? this.items()[0] ?? null;
      this.focus(first);
    }
  }

  refresh(): void {
    if (!this.root) return;
    if (!this.current || !this.root.contains(this.current) || (this.current as HTMLButtonElement).disabled) {
      this.focus(this.items()[0] ?? null);
    }
  }

  private items(): HTMLElement[] {
    if (!this.root) return [];
    return [...this.root.querySelectorAll<HTMLElement>('[data-nav]')].filter((e) => e.offsetParent !== null && !(e as HTMLButtonElement).disabled);
  }

  focus(el: HTMLElement | null): void {
    this.current?.classList.remove('focus');
    this.current = el;
    if (el && this.showFocus) el.classList.add('focus');
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  setShowFocus(on: boolean): void {
    this.showFocus = on;
    if (this.current) this.current.classList.toggle('focus', on);
  }

  handle(a: UiAction): boolean {
    if (!this.root) return false;
    if (a === 'back') {
      const b = this.root.querySelector<HTMLElement>('[data-back]');
      if (b) b.click();
      else this.onBack?.();
      return true;
    }
    if (a === 'confirm') {
      if (!this.showFocus) {
        this.setShowFocus(true);
        if (this.current) return true;
      }
      this.current?.click();
      return true;
    }
    if (a === 'up' || a === 'down' || a === 'left' || a === 'right') {
      this.setShowFocus(true);
      const items = this.items();
      if (!items.length) return true;
      if (!this.current || !items.includes(this.current)) {
        this.focus(items[0]);
        return true;
      }
      // Range inputs: left/right adjust value.
      if (this.current instanceof HTMLInputElement && this.current.type === 'range' && (a === 'left' || a === 'right')) {
        const r = this.current;
        const step = Number(r.step) || 0.05;
        r.value = String(Math.min(Number(r.max), Math.max(Number(r.min), Number(r.value) + (a === 'right' ? step : -step))));
        r.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      const cr = this.current.getBoundingClientRect();
      const cx = cr.left + cr.width / 2;
      const cy = cr.top + cr.height / 2;
      const dx = a === 'left' ? -1 : a === 'right' ? 1 : 0;
      const dy = a === 'up' ? -1 : a === 'down' ? 1 : 0;
      let best: HTMLElement | null = null;
      let bestScore = Infinity;
      for (const el of items) {
        if (el === this.current) continue;
        const r = el.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const vx = ex - cx;
        const vy = ey - cy;
        const along = vx * dx + vy * dy;
        if (along <= 4) continue;
        const across = Math.abs(vx * dy - vy * dx);
        const score = along + across * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }
      if (best) this.focus(best);
      return true;
    }
    return false;
  }
}
