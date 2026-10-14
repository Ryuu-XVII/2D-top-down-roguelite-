import './ui/styles.css';
import { App } from './app';

const app = new App();
app.boot().catch((err) => {
  console.error(err);
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#f6f0ff;font:700 18px system-ui;text-align:center;padding:2rem;background:#0b0610';
  el.textContent = 'Crimson Keep could not start: ' + (err?.message ?? err);
  document.body.appendChild(el);
});

// Installable + offline (PWA). The service worker is generated at build time.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
