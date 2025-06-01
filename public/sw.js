// Service Worker for 佐渡で食えっちゃ
// キャッシュ戦略: ネットワーク優先、フォールバックでキャッシュ

const CACHE_NAME = "sado-kueccha-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/title_row2.png",
  "/src/main.tsx",
  "/src/index.css",
  "/src/App.tsx",
  "/src/App.css",
];

// インストール時: 静的アセットをキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error("Failed to cache static assets:", error);
      }),
  );
  self.skipWaiting();
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// フェッチ時: ネットワーク優先、フォールバックでキャッシュ
self.addEventListener("fetch", (event) => {
  // Google Maps API や外部リソースはキャッシュしない
  if (
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("google.com") ||
    event.request.url.includes("docs.google.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 成功したレスポンスをキャッシュに保存
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから取得
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // キャッシュにもない場合はオフラインページを返す
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      }),
  );
});

// バックグラウンド同期（将来的な機能拡張用）
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Background sync triggered");
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
