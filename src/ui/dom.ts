type Child = Node | string | number | null | undefined | false;

export interface Props {
  class?: string;
  html?: string;
  text?: string;
  style?: string;
  nav?: boolean;
  back?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: (e: MouseEvent) => void;
  attrs?: Record<string, string>;
}

/** Minimal element builder. `nav: true` makes the element focusable by gamepad / keys. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props.class) el.className = props.class;
  if (props.html !== undefined) el.innerHTML = props.html;
  if (props.text !== undefined) el.textContent = props.text;
  if (props.style) el.setAttribute('style', props.style);
  if (props.title) el.title = props.title;
  if (props.nav) el.dataset.nav = '1';
  if (props.back) el.dataset.back = '1';
  if (props.disabled) (el as HTMLButtonElement).disabled = true;
  if (props.attrs) for (const k in props.attrs) el.setAttribute(k, props.attrs[k]);
  if (props.onClick) el.addEventListener('click', props.onClick as EventListener);
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'number' ? String(c) : c);
  }
  return el;
}

export function button(label: string, onClick: () => void, cls = '', disabled = false): HTMLButtonElement {
  return h('button', { class: `btn ${cls}`, nav: true, disabled, onClick: () => !disabled && onClick() }, label);
}

/** Render "{highlight}" spans from data-driven card text. */
export function richText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\{([^}]+)\}/g, '<b>$1</b>');
}
