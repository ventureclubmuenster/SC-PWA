const CACHE_VERSION = 2;
const STATIC_CACHE = `sc-static-v${CACHE_VERSION}`;
const PAGES_CACHE = `sc-pages-v${CACHE_VERSION}`;
const DATA_CACHE = `sc-data-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];

// All PWA page routes to precache for offline-ready start
const PRECACHE_PAGES = [
  '/',
  '/schedule',
  '/information',
  '/workshops',
  '/profile',
  '/applicants',
  '/ticket',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCmsOrExcluded(url) {
  const path = url.pathname;
  return path.startsWith('/admin') || path.startsWith('/api/admin');
}

// Cache-first for hashed static assets (_next/static) — immutable once built
function handleStaticAsset(event) {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
}

// Stale-while-revalidate for pages — serve cached instantly, update in background
function handleNavigation(event) {
  event.respondWith(
    caches.open(PAGES_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    )
  );
}

// Stale-while-revalidate for data/API and other GET requests
function handleData(event) {
  event.respondWith(
    caches.open(DATA_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    )
  );
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude CMS routes entirely
  if (isCmsOrExcluded(url)) return;

  // Next.js hashed static assets — cache-first (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    return handleStaticAsset(event);
  }

  // Navigation requests (HTML pages) — stale-while-revalidate
  if (event.request.mode === 'navigate') {
    return handleNavigation(event);
  }

  // Static files in /public (fonts, icons, images, manifest)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname === '/manifest.json'
  ) {
    return handleStaticAsset(event);
  }

  // External fonts (Google Fonts) — cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    return handleStaticAsset(event);
  }

  // Everything else (API data, images, etc.) — stale-while-revalidate
  handleData(event);
});

// Push notification handler — runs even when PWA is closed
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Startup Contacts';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
