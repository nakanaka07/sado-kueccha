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
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      img.src = src;
    });
  }
  // 複数の画像を並行してプリロードする
  async preloadImages(sources: string[]): Promise<void> {
    const promises = sources.map((src) =>
      this.preloadImage(src).catch((error: unknown) => {
        console.warn(`Image preload failed for ${src}:`, error);
      }),
    );

    await Promise.allSettled(promises);
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
