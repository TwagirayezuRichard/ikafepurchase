const CACHE_NAME = 'ikafepurcharseapp-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(['/', '/manifest.json', '/icon-192.png', '/icon-512.png']);
      const appShell = await cache.match('/');
      const html = await appShell.text();
      const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map((match) => match[1]);
      await Promise.allSettled(assets.map((asset) => cache.add(asset)));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    const networkResponse = fetch(event.request).then(async (response) => {
      if (response.ok) {
        await (await caches.open(CACHE_NAME)).put(event.request, response.clone());
      }
      return response;
    });
    event.waitUntil(networkResponse.then(() => undefined).catch(() => undefined));
    event.respondWith(networkResponse.catch(async () =>
      (await caches.match(event.request)) || (await caches.match('/')) || Response.error()
    ));
    return;
  }

  if (requestUrl.pathname.startsWith('/assets/') || /^\/(manifest\.json|icon-(192|512)\.png)$/.test(requestUrl.pathname)) {
    const networkResponse = fetch(event.request).then(async (response) => {
      if (response.ok) {
        await (await caches.open(CACHE_NAME)).put(event.request, response.clone());
      }
      return response;
    });
    event.waitUntil(networkResponse.then(() => undefined).catch(() => undefined));
    event.respondWith(
      caches.match(event.request).then((cached) => cached || networkResponse)
    );
  }
});
