const CACHE_VERSION = 5;
const STATIC_CACHE = `sc-static-v${CACHE_VERSION}`;
const PAGES_CACHE = `sc-pages-v${CACHE_VERSION}`;
const DATA_CACHE = `sc-data-v${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, DATA_CACHE];

// Pages to prefetch on install for instant navigation
const PREFETCH_PAGES = [
  '/schedule',
  '/information',
  '/workshops',
  '/ticket',
  '/profile',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then((cache) =>
      cache.addAll(PREFETCH_PAGES).catch(() => {
        // Prefetch is best-effort; don't block install on failure
      })
    )
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

function isExcluded(url) {
  const path = url.pathname;
  return path.startsWith('/admin') || path.startsWith('/api/admin');
}

// Cache-first for immutable static assets (_next/static, icons, fonts)
function handleStaticAsset(event) {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && !response.redirected) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
}

// Network-first for navigation — let browser handle redirects natively
function handleNavigation(event) {
  event.respondWith(
    fetch(event.request, { redirect: 'manual' })
      .then((response) => {
        // Auth redirect — return as-is so the browser follows it natively
        if (response.type === 'opaqueredirect') {
          return response;
        }
        if (response.ok) {
          const clone = response.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
}

// Stale-while-revalidate for data/API and other GET requests
function handleData(event) {
  event.respondWith(
    caches.open(DATA_CACHE).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            if (response.ok && !response.redirected) {
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

  // Exclude admin routes entirely
  if (isExcluded(url)) return;

  // Next.js hashed static assets — cache-first (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    return handleStaticAsset(event);
  }

  // Navigation requests (HTML pages) — network-first with cache fallback
  if (event.request.mode === 'navigate') {
    return handleNavigation(event);
  }

  // Static files in /public (icons, images, manifest)
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

  // Supabase Storage images (logos, photos) — cache-first (immutable URLs)
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
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
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    image: data.image || undefined,
    tag: data.tag || undefined,
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || undefined,
    dir: data.dir || 'auto',
    lang: data.lang || undefined,
    actions: data.actions || undefined,
    timestamp: data.timestamp || undefined,
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
