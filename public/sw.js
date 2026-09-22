const CACHE_NAME = "torneiosmvp-v1";

function appUrl(path = "./") {
  return new URL(path, self.registration.scope).href;
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const homeUrl = appUrl();
  const response = await fetch(homeUrl, { cache: "reload" });

  if (!response.ok) {
    throw new Error("Nao foi possivel preparar o aplicativo para uso offline.");
  }

  await cache.put(homeUrl, response.clone());

  const html = await response.text();
  const assetPaths = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => new URL(match[1], homeUrl))
    .filter((url) => url.origin === self.location.origin)
    .map((url) => url.href);

  const fixedAssets = [
    appUrl("manifest.webmanifest"),
    appUrl("icons/torneios.svg"),
    appUrl("icons/torneios-192.png"),
    appUrl("icons/torneios-512.png"),
    appUrl("icons/torneios-maskable-512.png")
  ];

  await cache.addAll([...new Set([...assetPaths, ...fixedAssets])]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(appUrl(), response.clone());
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) || caches.match(appUrl());
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      });
    })
  );
});
