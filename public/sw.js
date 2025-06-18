// Service Worker for 佐渡で食えっちゃ
// 最適化されたキャッシュ戦略: 段階的キャッシング + プリロード対応

const CACHE_NAME = "sado-kueccha-v2";
const CACHE_STATIC = "static-v2";
const CACHE_DYNAMIC = "dynamic-v2";
const CACHE_IMAGES = "images-v2";

const BASE_PATH = self.location.pathname.includes("/sado-kueccha/") ? "/sado-kueccha" : "";

// クリティカルアセット（即座にキャッシュ）
const CRITICAL_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/assets/title_row2.png`,
];

// 重要度が高いアセット（段階的キャッシュ）
const IMPORTANT_ASSETS = [
  `${BASE_PATH}/assets/title_row1.png`,
  `${BASE_PATH}/assets/current_location.png`,
  `${BASE_PATH}/assets/recommend.png`,
];

// 最大キャッシュサイズ制限
const MAX_CACHE_SIZE = {
  [CACHE_DYNAMIC]: 50,
  [CACHE_IMAGES]: 100,
};

// インストール時: クリティカルアセットのみキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // クリティカルアセットを即座にキャッシュ
      caches.open(CACHE_STATIC).then(async (cache) => {
        const cachePromises = CRITICAL_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`Failed to cache critical asset: ${asset}`, error);
          }
        });
        await Promise.all(cachePromises);
      }),
      // 重要なアセットをバックグラウンドでプリキャッシュ
      scheduleImportantAssetsCache(),
    ]),
  );
  self.skipWaiting();
});

// 重要なアセットのバックグラウンドキャッシュ
async function scheduleImportantAssetsCache() {
  // 500ms後に実行してクリティカルパスをブロックしない
  setTimeout(async () => {
    try {
      const cache = await caches.open(CACHE_IMAGES);
      const cachePromises = IMPORTANT_ASSETS.map(async (asset) => {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn(`Failed to precache important asset: ${asset}`, error);
        }
      });
      await Promise.all(cachePromises);
    } catch (error) {
      console.warn("Failed to precache important assets", error);
    }
  }, 500);
}

// アクティベート時: 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes("v2")) {
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // キャッシュサイズ制限を適用
      limitCacheSize(CACHE_DYNAMIC, MAX_CACHE_SIZE[CACHE_DYNAMIC]),
      limitCacheSize(CACHE_IMAGES, MAX_CACHE_SIZE[CACHE_IMAGES]),
    ]),
  );
  self.clients.claim();
});

// キャッシュサイズ制限関数
async function limitCacheSize(cacheName, maxSize) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxSize) {
      // 古いエントリから削除（LRU風）
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    }
  } catch (error) {
    console.warn(`Failed to limit cache size for ${cacheName}`, error);
  }
}

// フェッチ時: 最適化されたキャッシュ戦略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Google APIs や外部サービスはキャッシュしない
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("google.com") ||
    url.hostname.includes("docs.google.com")
  ) {
    return;
  }

  // リクエストタイプ別の戦略
  if (request.destination === "image") {
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === "document") {
    event.respondWith(handleDocumentRequest(request));
  } else if (request.destination === "script" || request.destination === "style") {
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// 画像リクエストの処理（キャッシュファースト）
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_IMAGES);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn("Image request failed:", error);
    return new Response("Image not available", { status: 404 });
  }
}

// ドキュメントリクエストの処理（ネットワークファースト）
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_STATIC);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_STATIC);
    const cachedResponse = (await cache.match(request)) || (await cache.match("/index.html"));
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

// 静的アセットの処理（キャッシュファースト）
async function handleStaticAssetRequest(request) {
  try {
    const cache = await caches.open(CACHE_STATIC);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // バックグラウンドで更新チェック
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            cache.put(request, response);
          }
        })
        .catch(() => {
          // ネットワークエラーは無視
        });
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.warn("Static asset request failed:", error);
    return new Response("Asset not available", { status: 404 });
  }
}

// 一般的なリクエストの処理
async function handleGenericRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(CACHE_DYNAMIC);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response("Request failed", { status: 503 });
  }
}

// バックグラウンド同期（将来的な機能拡張用）
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    // 必要に応じてデータ同期処理を実装
  }
});

// プッシュ通知（将来的な機能拡張用）
self.addEventListener("push", (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: "/title_row2.png",
      badge: "/title_row2.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
      },
    };

    event.waitUntil(self.registration.showNotification("佐渡で食えっちゃ", options));
  }
});
