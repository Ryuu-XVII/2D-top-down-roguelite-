import { defineConfig, type Plugin } from 'vite';
import { appIconSvg } from './build/appIcon';

const manifest = {
  name: 'Crimson Keep',
  short_name: 'Crimson Keep',
  description: 'A code-only gothic roguelite. Every visual is drawn from primitives; every sound is synthesized.',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  orientation: 'landscape',
  background_color: '#0b0610',
  theme_color: '#0b0610',
  icons: [
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
  ],
};

/** PWA without raster assets: manifest + code-drawn SVG icon + generated offline service worker. */
function pwa(): Plugin {
  return {
    name: 'crimson-keep-pwa',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        if (url.endsWith('/manifest.webmanifest')) {
          res.setHeader('Content-Type', 'application/manifest+json');
          res.end(JSON.stringify(manifest));
        } else if (url.endsWith('/icon.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(appIconSvg());
        } else next();
      });
    },
    generateBundle(_opts, bundle) {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: JSON.stringify(manifest, null, 2) });
      this.emitFile({ type: 'asset', fileName: 'icon.svg', source: appIconSvg() });
      const files = ['./', './index.html', './manifest.webmanifest', './icon.svg', ...Object.keys(bundle).map((f) => './' + f)];
      const version = Date.now().toString(36);
      const sw = `// Generated at build time: cache-first offline support.
const CACHE = 'crimson-keep-${version}';
const FILES = ${JSON.stringify([...new Set(files)])};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [pwa()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
  },
} as Parameters<typeof defineConfig>[0]);
