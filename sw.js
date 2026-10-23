const AUDIO_CACHE = 'thai5000-pronunciation-newrepo-v1';
const PAGE_CACHE = 'thai5000-pages-newrepo-v1';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('thai5000-pages-') || key.startsWith('thai5000-pronunciation-'))
      .filter(key => key !== AUDIO_CACHE && key !== PAGE_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/__thai_audio_cache__/')) {
    event.respondWith((async () => {
      const query = url.searchParams.get('q');
      if (!query) return new Response('Missing q', { status: 400 });
      const remote = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=th&q=' + encodeURIComponent(query.trim());
      const cache = await caches.open(AUDIO_CACHE);
      return (await cache.match(remote)) || new Response('Not cached', { status: 404 });
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(PAGE_CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') {
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      return (await cache.match(event.request)) || Response.error();
    }
  })());
});
