/*
 * SolveLab's service worker: just enough to reload the timer without a network.
 *
 * Conservative on purpose:
 * - Pages are network-first. Online, you always get the latest deploy; the copy
 *   kept here is only used when the network fails.
 * - Hashed build files (/_next/static/, the cubing chunks) never change under
 *   the same name, so they are served from the cache once kept.
 * - Anything on another origin (Firebase, Google sign-in, AI providers) and
 *   anything that isn't a GET is left alone.
 * - Pages are kept under their path alone. The Google sign-in return
 *   (/signed-in/, or any ?code= or ?state=) is never kept: its URL carries a
 *   one-time auth code.
 *
 * Bump VERSION to drop everything kept by an older worker.
 */
const VERSION = "v2";
const PAGES = `solvelab-pages-${VERSION}`;
const ASSETS = `solvelab-assets-${VERSION}`;

// The scope ends in "/" and carries any base path the site is served under.
const SCOPE = new URL(self.registration.scope);
const BASE = SCOPE.pathname;
const OFFLINE_PAGE = `${BASE}timer/`;

function isImmutable(url) {
  return (
    url.pathname.startsWith(`${BASE}_next/static/`) ||
    url.pathname.startsWith(`${BASE}vendor/cubing/chunks/`)
  );
}

/** The build files a page asks for up front, read from its HTML. */
function assetsIn(html) {
  const found = new Set();
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = new URL(match[1], SCOPE);
    if (url.origin === SCOPE.origin && isImmutable(url)) found.add(url.href);
  }
  return [...found];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // Keep the timer page and what it needs to start, so the first offline
      // reload works even if the timer was never opened with this worker.
      const pages = await caches.open(PAGES);
      const response = await fetch(OFFLINE_PAGE, { cache: "no-store" });
      if (response.ok) {
        await pages.put(OFFLINE_PAGE, response.clone());
        const assets = await caches.open(ASSETS);
        await assets.addAll(assetsIn(await response.text())).catch(() => undefined);
        // The scrambler is loaded only when a scramble is needed; keep all of it.
        const cubing = await fetch(`${BASE}vendor/cubing/files.json`, { cache: "no-store" })
          .then((list) => (list.ok ? list.json() : []))
          .catch(() => []);
        await assets
          .addAll(cubing.map((file) => `${BASE}vendor/cubing/${file}`))
          .catch(() => undefined);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGES, ASSETS]);
      for (const name of await caches.keys()) {
        if (name.startsWith("solvelab-") && !keep.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

/** A page's cache key (its path, no query), or null when it must not be kept. */
function pageKey(url) {
  if (url.pathname === `${BASE}signed-in/`) return null;
  if (url.searchParams.has("code") || url.searchParams.has("state")) return null;
  return url.origin + url.pathname;
}

async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName);
  const key = request.mode === "navigate" ? pageKey(new URL(request.url)) : request;
  try {
    const response = await fetch(request);
    if (key && response.ok && response.type === "basic") await cache.put(key, response.clone());
    return response;
  } catch (error) {
    const kept = key && (await cache.match(key));
    if (kept) return kept;
    if (fallback) {
      const page = await cache.match(fallback);
      if (page) return page;
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const kept = await cache.match(request);
  if (kept) return kept;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(BASE)) return;
  // Firebase's own pages, if they are ever served from this origin.
  if (url.pathname.startsWith(`${BASE}__/`)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES, OFFLINE_PAGE));
  } else if (isImmutable(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request, ASSETS));
  }
});
