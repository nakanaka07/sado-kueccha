// プリローディングサービス
export class PreloadService {
  private static instance: PreloadService | undefined;
  private preloadedResources = new Set<string>();

  static getInstance(): PreloadService {
    if (!PreloadService.instance) {
      PreloadService.instance = new PreloadService();
    }
    return PreloadService.instance;
  }
  // 画像をプリロードする
  async preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      console.log(`⚡ Image already preloaded: ${src}`);
      return Promise.resolve();
    }

    const startTime = performance.now();
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const endTime = performance.now();
        console.log(
          `🖼️ Image preloaded in ${Math.round(endTime - startTime).toString()}ms: ${src}`,
        );
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = () => {
        const endTime = performance.now();
        console.warn(
          `❌ Image preload failed after ${Math.round(endTime - startTime).toString()}ms: ${src}`,
        );
        reject(new Error(`Failed to preload image: ${src}`));
      };
      img.src = src;
    });
  } // 複数の画像を並行してプリロードする（最適化版）
  async preloadImages(sources: string[]): Promise<void> {
    // 既にプリロード済みの画像は除外
    const unloadedSources = sources.filter((src) => !this.preloadedResources.has(src));

    if (unloadedSources.length === 0) {
      console.log("⚡ All images already preloaded");
      return;
    }

    console.log(`📸 Preloading ${unloadedSources.length.toString()} images...`);

    const promises = unloadedSources.map((src) =>
      this.preloadImage(src).catch((error: unknown) => {
        console.warn(`Image preload failed for ${src}:`, error);
        return null; // 失敗したものはnullを返す
      }),
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter((result) => result.status === "fulfilled").length;
    console.log(
      `✅ Successfully preloaded ${successCount.toString()}/${unloadedSources.length.toString()} images`,
    );
  }
  // Google Maps APIスクリプトをプリロードする（最適化版）
  preloadGoogleMapsAPI(apiKey: string): void {
    const scriptId = "google-maps-api";
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    // パフォーマンス最適化: loading=async パラメータを追加
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&language=ja&region=JP`;
    script.async = true;
    script.defer = true;

    // エラーハンドリングを追加
    script.onerror = () => {
      console.warn("Google Maps API preload failed");
    };

    document.head.appendChild(script);
    this.preloadedResources.add("google-maps-api");
  }

  isPreloaded(resource: string): boolean {
    return this.preloadedResources.has(resource);
  }
}

export const preloadService = PreloadService.getInstance();
