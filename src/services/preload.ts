/**
 * アセットプリロードサービス
 *
 * このモジュールは、ウェブアプリケーションのパフォーマンス最適化のために
 * 画像リソースとGoogle Maps APIの事前読み込みを効率的に実行します。
 *
 * 主な機能：
 * - 画像の並列プリロード（WebP最適化対応）
 * - Google Maps API読み込み状態管理
 * - エラーハンドリングと詳細ログ出力
 * - モダンブラウザAPIの活用（link rel="preload"）
 *
 * 最適化機能：
 * - 段階的プリロード戦略
 * - インテリジェントプリフェッチ
 * - ユーザー行動予測プリロード
 * - バックグラウンド処理最適化
 *
 * @see https://web.dev/preload-critical-assets/
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/preload
 */

import { cacheService } from "./cache";

// 必要に応じて実際のsheetsServiceをimport（統合時）
// import { sheetsService } from "./sheets";

/** プリロード結果の詳細情報 */
export interface PreloadResult {
  /** 成功した画像の数 */
  succeeded: number;
  /** 失敗した画像の数 */
  failed: number;
  /** 成功した画像パスのリスト */
  succeededPaths: string[];
  /** 失敗した画像パスとエラー情報 */
  failedPaths: Array<{ path: string; error: string }>;
  /** 総読み込み時間（ミリ秒） */
  totalDuration: number;
}

/** Google Maps API読み込み状態 */
export interface GoogleMapsLoadState {
  /** 読み込み済みかどうか */
  isLoaded: boolean;
  /** 読み込み中かどうか */
  isLoading: boolean;
  /** エラー情報 */
  error?: string | undefined;
}

/** Google Maps API拡張Window型 */
interface GoogleMapsWindow extends Window {
  initializeGoogleMaps?: () => void;
}

declare const window: GoogleMapsWindow;

/**
 * 開発時ログ出力ヘルパー
 */
const devLog = (message: string, ...args: unknown[]): void => {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
};

/**
 * 画像形式の最適化判定
 * モダンブラウザでWebP対応を確認
 */
const supportsWebP = (() => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
})();

/**
 * 単一画像のプリロード処理
 * link rel="preload"を優先し、フォールバックでImage()を使用
 */
const preloadSingleImage = async (
  imagePath: string,
): Promise<{ path: string; success: boolean; error?: string; method: string }> => {
  const startTime = performance.now();

  try {
    // link rel="preload"を使用
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = imagePath;

    // WebP対応ブラウザの場合、適切なタイプ指定
    if (supportsWebP && imagePath.includes(".webp")) {
      link.type = "image/webp";
    }

    document.head.appendChild(link);

    return await new Promise((resolve) => {
      link.onload = () => {
        const duration = performance.now() - startTime;
        resolve({
          path: imagePath,
          success: true,
          method: `preload (${duration.toFixed(2)}ms)`,
        });
      };
      link.onerror = () => {
        // フォールバック：Image()オブジェクトで再試行
        void fallbackImageLoad(imagePath, startTime).then(resolve);
      };

      // タイムアウト処理（5秒）
      setTimeout(() => {
        void fallbackImageLoad(imagePath, startTime).then(resolve);
      }, 5000);
    });
  } catch {
    // フォールバック：従来のImage()オブジェクト
    return await fallbackImageLoad(imagePath, startTime);
  }
};

/**
 * フォールバック用のImage()オブジェクト読み込み
 */
const fallbackImageLoad = async (
  imagePath: string,
  startTime: number,
): Promise<{ path: string; success: boolean; error?: string; method: string }> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const duration = performance.now() - startTime;
      resolve({
        path: imagePath,
        success: true,
        method: `image-fallback (${duration.toFixed(2)}ms)`,
      });
    };

    img.onerror = () => {
      const duration = performance.now() - startTime;
      resolve({
        path: imagePath,
        success: false,
        error: `Failed to load image: ${imagePath}`,
        method: `image-fallback-error (${duration.toFixed(2)}ms)`,
      });
    };

    // クロスオリジン設定（必要に応じて）
    img.crossOrigin = "anonymous";
    img.src = imagePath;
  });
};

/**
 * 画像を事前読み込みし、詳細な結果を返します
 *
 * 最新のベストプラクティス：
 * - link rel="preload"を優先使用
 * - WebP最適化サポート
 * - 詳細なパフォーマンス測定
 * - 堅牢なエラーハンドリング
 *
 * @param imagePaths プリロードする画像パスの配列
 * @param options オプション設定
 * @returns プリロード結果の詳細情報
 */
export async function preloadImagesWithValidation(
  imagePaths: string[],
  options: {
    /** 並列実行数の制限（デフォルト: 6） */
    concurrency?: number;
    /** 詳細ログ出力（デフォルト: false） */
    verbose?: boolean;
  } = {},
): Promise<PreloadResult> {
  const { concurrency = 6, verbose = false } = options;
  const overallStartTime = performance.now();

  if (!imagePaths.length) {
    return {
      succeeded: 0,
      failed: 0,
      succeededPaths: [],
      failedPaths: [],
      totalDuration: 0,
    };
  }

  if (verbose) {
    devLog(`🖼️ Starting preload of ${imagePaths.length} images (concurrency: ${concurrency})`);
    devLog("WebP support:", supportsWebP);
  }

  // 並列数制限付きで実行
  const results: Array<{ path: string; success: boolean; error?: string; method: string }> = [];

  for (let i = 0; i < imagePaths.length; i += concurrency) {
    const batch = imagePaths.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((path) => preloadSingleImage(path)));
    results.push(...batchResults);

    if (verbose && batch.length > 1) {
      devLog(
        `📦 Batch ${Math.floor(i / concurrency) + 1} completed: ${
          batchResults.filter((r) => r.success).length
        }/${batch.length} successful`,
      );
    }
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const totalDuration = performance.now() - overallStartTime;

  const result: PreloadResult = {
    succeeded: succeeded.length,
    failed: failed.length,
    succeededPaths: succeeded.map((r) => r.path),
    failedPaths: failed.map((r) => ({ path: r.path, error: r.error || "Unknown error" })),
    totalDuration,
  };

  if (verbose || failed.length > 0) {
    devLog(
      `✅ Preload completed: ${succeeded.length}/${
        imagePaths.length
      } successful (${totalDuration.toFixed(2)}ms)`,
    );
    if (failed.length > 0) {
      console.warn(
        "❌ Failed images:",
        failed.map((f) => f.path),
      );
    }
  }

  return result;
}

// Google Maps API読み込み状態のグローバル管理
const googleMapsState: GoogleMapsLoadState = {
  isLoaded: false,
  isLoading: false,
};

/**
 * Google Maps APIの読み込み状態を取得
 */
export function getGoogleMapsLoadState(): GoogleMapsLoadState {
  return { ...googleMapsState };
}

/**
 * Google Maps APIを事前読み込みします
 *
 * 最新のベストプラクティス：
 * - Promise基盤の非同期処理
 * - 詳細な状態管理
 * - 重複読み込み防止
 * - 適切なライブラリ指定
 *
 * @param apiKey Google Maps API キー
 * @param options 追加オプション
 * @returns Promise<void> 読み込み完了または既に読み込み済み
 */
export async function preloadGoogleMapsAPI(
  apiKey: string,
  options: {
    /** 追加ライブラリ（デフォルト: ['geometry'] */
    libraries?: string[];
    /** 言語設定（デフォルト: 'ja'） */
    language?: string;
    /** 地域設定（デフォルト: 'JP'） */
    region?: string;
    /** 詳細ログ（デフォルト: false） */
    verbose?: boolean;
  } = {},
): Promise<void> {
  const { libraries = ["geometry"], language = "ja", region = "JP", verbose = false } = options;

  // 既に読み込み済みの場合
  if (googleMapsState.isLoaded) {
    if (verbose) devLog("🗺️ Google Maps API already loaded");
    return Promise.resolve();
  }

  // 既に読み込み中の場合は待機
  if (googleMapsState.isLoading) {
    if (verbose) devLog("🗺️ Google Maps API loading in progress, waiting...");
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (googleMapsState.isLoaded) {
          clearInterval(checkInterval);
          resolve();
        } else if (googleMapsState.error) {
          clearInterval(checkInterval);
          reject(new Error(googleMapsState.error));
        }
      }, 100);

      // 30秒でタイムアウト
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("Google Maps API loading timeout"));
      }, 30000);
    });
  }

  // 既存スクリプトの確認
  const existingScript = document.querySelector(
    `script[src*="maps.googleapis.com/maps/api/js"][src*="key=${apiKey}"]`,
  );

  if (existingScript) {
    googleMapsState.isLoaded = true;
    if (verbose) devLog("🗺️ Google Maps API script already exists");
    return Promise.resolve();
  }

  if (verbose) devLog("🗺️ Loading Google Maps API...");
  googleMapsState.isLoading = true;
  googleMapsState.error = undefined;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(",")}` : "";

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}&language=${language}&region=${region}&loading=async&callback=initializeGoogleMaps`;
    script.async = true;
    script.defer = true;

    // グローバルコールバック設定
    window.initializeGoogleMaps = () => {
      googleMapsState.isLoaded = true;
      googleMapsState.isLoading = false;
      delete window.initializeGoogleMaps;

      if (verbose) devLog("✅ Google Maps API loaded successfully");
      resolve();
    };

    script.onerror = () => {
      googleMapsState.isLoading = false;
      googleMapsState.error = "Failed to load Google Maps API script";
      delete window.initializeGoogleMaps;

      console.error("❌ Failed to load Google Maps API");
      reject(new Error("Failed to load Google Maps API script"));
    };

    // タイムアウト処理
    setTimeout(() => {
      if (googleMapsState.isLoading) {
        googleMapsState.isLoading = false;
        googleMapsState.error = "Google Maps API loading timeout";
        delete window.initializeGoogleMaps;
        reject(new Error("Google Maps API loading timeout"));
      }
    }, 30000);

    document.head.appendChild(script);
  });
}

/**
 * アセットの事前読み込みを一括で実行するヘルパー関数
 *
 * @param assets アセット定義オブジェクト
 * @param options プリロードオプション
 * @returns プリロード結果
 */
export async function preloadAllAssets(
  assets: Record<string, string | Record<string, string>>,
  options?: { concurrency?: number; verbose?: boolean },
): Promise<PreloadResult> {
  const imagePaths: string[] = [];

  const collectPaths = (obj: Record<string, unknown>): void => {
    Object.values(obj).forEach((value) => {
      if (typeof value === "string" && /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(value)) {
        imagePaths.push(value);
      } else if (typeof value === "object" && value !== null) {
        collectPaths(value as Record<string, unknown>);
      }
    });
  };

  collectPaths(assets);
  return preloadImagesWithValidation(imagePaths, options);
}

/**
 * 重要な画像のみを優先的にプリロードするヘルパー関数
 *
 * @param criticalPaths 優先度の高い画像パス配列
 * @param nonCriticalPaths 優先度の低い画像パス配列
 * @param options プリロードオプション
 * @returns Promise<void>
 */
export async function preloadCriticalFirst(
  criticalPaths: string[],
  nonCriticalPaths: string[] = [],
  options?: { verbose?: boolean },
): Promise<void> {
  const { verbose = false } = options ?? {};

  // 重要な画像を最初にプリロード
  if (criticalPaths.length > 0) {
    if (verbose) devLog("🚀 Preloading critical assets...");
    await preloadImagesWithValidation(criticalPaths, { concurrency: 3, verbose });
  }

  // 重要でない画像をバックグラウンドでプリロード
  if (nonCriticalPaths.length > 0) {
    if (verbose) devLog("⏳ Preloading non-critical assets in background...");
    // バックグラウンドで実行（await しない）
    void preloadImagesWithValidation(nonCriticalPaths, { concurrency: 2, verbose });
  }
}

/**
 * ブラウザの idle 時間を活用したプリロード
 *
 * @param imagePaths プリロードする画像パス配列
 * @param options プリロードオプション
 * @returns Promise<PreloadResult>
 */
export async function preloadWhenIdle(
  imagePaths: string[],
  options?: { timeout?: number; verbose?: boolean },
): Promise<PreloadResult> {
  const { timeout = 5000, verbose = false } = options ?? {};

  return new Promise((resolve) => {
    const executePreload = async (): Promise<void> => {
      if (verbose) devLog("🎯 Starting idle preload...");
      const result = await preloadImagesWithValidation(imagePaths, { verbose });
      resolve(result);
    };

    // requestIdleCallback が利用可能な場合
    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        () => {
          void executePreload();
        },
        { timeout },
      );
    } else {
      // フォールバック：短い遅延後に実行
      setTimeout(() => {
        void executePreload();
      }, 100);
    }
  });
}

/**
 * インターセクションオブザーバーを使用した遅延プリロード
 * 要素が画面に近づいたときに画像をプリロード
 *
 * @param targetElement 監視対象の要素
 * @param imagePaths プリロードする画像パス配列
 * @param options オプション設定
 * @returns cleanup 関数
 */
export function setupLazyPreload(
  targetElement: Element,
  imagePaths: string[],
  options?: {
    rootMargin?: string;
    threshold?: number;
    verbose?: boolean;
  },
): () => void {
  const { rootMargin = "100px", threshold = 0.1, verbose = false } = options ?? {};

  let hasPreloaded = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasPreloaded) {
          hasPreloaded = true;
          if (verbose) devLog("👀 Element in view, starting lazy preload...");
          void preloadImagesWithValidation(imagePaths, { verbose });
          observer.unobserve(targetElement);
        }
      });
    },
    { rootMargin, threshold },
  );

  observer.observe(targetElement);

  // cleanup 関数を返す
  return () => {
    observer.disconnect();
  };
}

/**
 * Service Worker を使用したバックグラウンドプリロード
 * Service Worker が利用可能な場合のみ動作
 *
 * @param imagePaths プリロードする画像パス配列
 * @param options オプション設定
 * @returns Promise<boolean> 成功したかどうか
 */
export async function preloadWithServiceWorker(
  imagePaths: string[],
  options?: { verbose?: boolean },
): Promise<boolean> {
  const { verbose = false } = options ?? {};

  if (!("serviceWorker" in navigator)) {
    if (verbose) devLog("⚠️ Service Worker not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration.active) {
      if (verbose) devLog("⚠️ No active Service Worker");
      return false;
    }

    // Service Worker にプリロード指示を送信
    registration.active.postMessage({
      type: "PRELOAD_IMAGES",
      imagePaths,
    });

    if (verbose) devLog("📡 Sent preload request to Service Worker");
    return true;
  } catch (error) {
    if (verbose) console.error("❌ Service Worker preload failed:", error);
    return false;
  }
}

/**
 * データプリロードサービス
 * POIデータの事前読み込みでLCPを改善
 * 重複取得防止とインテリジェントキャッシュ機能付き
 */
export class DataPreloadService {
  private static instance: DataPreloadService | undefined;
  private preloadPromise: Promise<void> | null = null;
  private preloadedSheets = new Set<string>();

  private constructor() {}

  static getInstance(): DataPreloadService {
    return (this.instance ??= new DataPreloadService());
  }

  /**
   * アプリ起動時にデータを先行取得
   */
  async preloadCriticalData(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.preloadPromise = this.executePreload();
    return this.preloadPromise;
  }

  /**
   * 特定のシートがプリロード済みかチェック
   */
  isSheetPreloaded(sheetName: string): boolean {
    return this.preloadedSheets.has(sheetName);
  }

  /**
   * プリロード状況をリセット（主にテスト用）
   */
  reset(): void {
    this.preloadPromise = null;
    this.preloadedSheets.clear();
  }

  private async executePreload(): Promise<void> {
    try {
      const startTime = performance.now();

      // 重要なシートを段階的に取得
      const { sheetsService } = await import("./sheets");

      // Phase 1: 最重要データ (推奨スポット) - より大きな範囲で取得してキャッシュ効果を最大化
      const recommendedPromise = this.preloadSheet(sheetsService, "recommended", "AB2:AX1000");

      // Phase 2: 頻繁にアクセスされるデータも大きな範囲で取得
      setTimeout(() => {
        void this.preloadSheet(sheetsService, "snack", "AB2:AX1000");
        void this.preloadSheet(sheetsService, "parking", "AB2:AX1000");
        void this.preloadSheet(sheetsService, "toilet", "AB2:AX1000");
      }, 500); // 500ms遅延で負荷分散

      // 推奨データの完了を待つ
      await recommendedPromise;

      const duration = performance.now() - startTime;

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(`📊 Critical data preload completed: ${Math.round(duration)}ms`);
      }
    } catch (error) {
      console.error("❌ Data preload failed:", error);
    }
  }

  private async preloadSheet(
    sheetsService: { fetchSheetData: (sheetName: string, range: string) => Promise<string[][]> },
    sheetName: string,
    range: string,
  ): Promise<void> {
    if (this.preloadedSheets.has(sheetName)) {
      return; // 既にプリロード済み
    }

    try {
      await sheetsService.fetchSheetData(sheetName, range);
      this.preloadedSheets.add(sheetName);
    } catch (error) {
      console.warn(`⚠️ Failed to preload ${sheetName}:`, error);
    }
  }
}

export const dataPreloadService = DataPreloadService.getInstance();

/**
 * 最適化されたプリロード戦略
 *
 * アプリケーション起動時の最適化されたデータロード管理
 * - 段階的データロード
 * - ユーザー体験を考慮したプライオリティ管理
 * - バックグラウンド処理
 */

/**
 * プリロード戦略の設定
 */
interface PreloadConfig {
  /** クリティカルデータプリロード（即座に必要） */
  critical: {
    enabled: boolean;
    timeout: number; // ms
    retryCount: number;
  };
  /** バックグラウンドプリロード（後で必要） */
  background: {
    enabled: boolean;
    delay: number; // ms
    batchSize: number;
  };
  /** ユーザー行動予測プリロード */
  predictive: {
    enabled: boolean;
    delay: number; // ms
    probabilityThreshold: number;
  };
}

/**
 * プリロード結果
 */
interface OptimizedPreloadResult {
  phase: "critical" | "background" | "predictive";
  success: boolean;
  dataCount: number;
  duration: number;
  error?: string;
}

/**
 * 最適化されたプリロードマネージャー
 */
class OptimizedPreloadManager {
  private isPreloading = false;
  private preloadResults: OptimizedPreloadResult[] = [];
  private preloadPromise: Promise<void> | null = null;
  private hasLoggedStart = false; // ログ出力の重複を防ぐフラグ

  private readonly config: PreloadConfig = {
    critical: {
      enabled: true,
      timeout: 3000, // 3秒
      retryCount: 2,
    },
    background: {
      enabled: true,
      delay: 1000, // 1秒後
      batchSize: 3,
    },
    predictive: {
      enabled: true,
      delay: 5000, // 5秒後
      probabilityThreshold: 0.4,
    },
  };

  /**
   * メインプリロード処理
   * 段階的にデータを読み込み、ユーザー体験を最適化
   */
  async startOptimizedPreload(): Promise<void> {
    // 既にプリロードが実行中または完了している場合は同じPromiseを返す
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    if (this.isPreloading) {
      return;
    }

    this.preloadPromise = this.executePreload();
    return this.preloadPromise;
  }

  private async executePreload(): Promise<void> {
    this.isPreloading = true;
    this.preloadResults = [];

    try {
      if (import.meta.env.DEV && !this.hasLoggedStart) {
        // eslint-disable-next-line no-console
        console.log("[PreloadManager] 最適化プリロード開始");
        this.hasLoggedStart = true;
      }

      await this.executeCriticalPreload();
      this.executeBackgroundPreload();
      this.executePredictivePreload();

      // プリロード完了時のまとめログ
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[PreloadManager] 全フェーズ開始完了");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("[PreloadManager] プリロードエラー:", error);
      }
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * クリティカルデータのプリロード
   * アプリの初期表示に必要な最小限のデータ
   */
  private async executeCriticalPreload(): Promise<void> {
    if (!this.config.critical.enabled) return;

    const startTime = performance.now();

    try {
      // 開発環境でのみ簡潔なログを出力
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log("[PreloadManager] Phase 1 開始");
      }

      // 推奨データとインフラ系データを優先取得
      await cacheService.warmCache([
        {
          keyPattern: "sheet_recommended_AB2:AX100",
          fetcher: async () => {
            const { sheetsService } = await import("./sheets");
            return sheetsService.fetchSheetData("recommended", "AB2:AX100");
          },
          strategy: {
            priority: "critical",
            sizeHint: "medium",
            ttl: 10 * 60 * 1000,
          },
        },
        {
          keyPattern: "sheet_parking_AB2:AX200",
          fetcher: async () => {
            const { sheetsService } = await import("./sheets");
            return sheetsService.fetchSheetData("parking", "AB2:AX200");
          },
          strategy: {
            priority: "critical",
            sizeHint: "medium",
            ttl: 10 * 60 * 1000,
          },
        },
      ]);

      const duration = performance.now() - startTime;
      const result: OptimizedPreloadResult = {
        phase: "critical",
        success: true,
        dataCount: 2,
        duration,
      };

      this.preloadResults.push(result);
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(`[PreloadManager] Phase 1 完了 (${duration.toFixed(0)}ms)`);
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: OptimizedPreloadResult = {
        phase: "critical",
        success: false,
        dataCount: 0,
        duration,
        error: String(error),
      };

      this.preloadResults.push(result);
      console.error("[PreloadManager] Phase 1 失敗:", error);
    }
  }

  /**
   * バックグラウンドデータのプリロード
   * 非同期でユーザーの操作をブロックしない
   */
  private executeBackgroundPreload(): void {
    if (!this.config.background.enabled) return;

    setTimeout(() => {
      (async () => {
        const startTime = performance.now();

        try {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[PreloadManager] Phase 2 開始");
          }

          await this.loadRegionalDataInBatches();

          const duration = performance.now() - startTime;
          const result: OptimizedPreloadResult = {
            phase: "background",
            success: true,
            dataCount: 3,
            duration,
          };

          this.preloadResults.push(result);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(`[PreloadManager] Phase 2 完了 (${duration.toFixed(0)}ms)`);
          }
        } catch (error) {
          const duration = performance.now() - startTime;
          const result: OptimizedPreloadResult = {
            phase: "background",
            success: false,
            dataCount: 0,
            duration,
            error: String(error),
          };

          this.preloadResults.push(result);
          console.error("[PreloadManager] Phase 2 失敗:", error);
        }
      })().catch(console.error);
    }, this.config.background.delay);
  }

  /**
   * 予測プリロード
   * ユーザーの行動パターンから次に必要なデータを予測
   */
  private executePredictivePreload(): void {
    if (!this.config.predictive.enabled) return;

    setTimeout(() => {
      (async () => {
        const startTime = performance.now();

        try {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[PreloadManager] Phase 3 開始");
          }

          const predictions = this.generateUserBehaviorPredictions();
          await cacheService.prefetch(predictions);

          const duration = performance.now() - startTime;
          const result: OptimizedPreloadResult = {
            phase: "predictive",
            success: true,
            dataCount: predictions.length,
            duration,
          };

          this.preloadResults.push(result);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(`[PreloadManager] Phase 3 完了 (${duration.toFixed(0)}ms)`);
          }
        } catch (error) {
          const duration = performance.now() - startTime;
          const result: OptimizedPreloadResult = {
            phase: "predictive",
            success: false,
            dataCount: 0,
            duration,
            error: String(error),
          };

          this.preloadResults.push(result);
          console.error("[PreloadManager] Phase 3 失敗:", error);
        }
      })().catch(console.error);
    }, this.config.predictive.delay);
  }

  /**
   * 地域別データのバッチ読み込み
   */
  private async loadRegionalDataInBatches(): Promise<void> {
    const { sheetsService } = await import("./sheets");

    await cacheService.warmCache([
      {
        keyPattern: "sheet_ryotsu_aikawa_AB2:AX200",
        fetcher: () => sheetsService.fetchSheetData("ryotsu_aikawa", "AB2:AX200"),
        strategy: {
          priority: "normal",
          sizeHint: "large",
          ttl: 15 * 60 * 1000,
        },
      },
      {
        keyPattern: "sheet_kanai_sawada_AB2:AX200",
        fetcher: () => sheetsService.fetchSheetData("kanai_sawada", "AB2:AX200"),
        strategy: {
          priority: "normal",
          sizeHint: "large",
          ttl: 15 * 60 * 1000,
        },
      },
      {
        keyPattern: "sheet_akadomari_hamochi_AB2:AX200",
        fetcher: () => sheetsService.fetchSheetData("akadomari_hamochi", "AB2:AX200"),
        strategy: {
          priority: "normal",
          sizeHint: "large",
          ttl: 15 * 60 * 1000,
        },
      },
    ]);
  }

  /**
   * ユーザー行動予測の生成
   */
  private generateUserBehaviorPredictions(): Array<{
    key: string;
    probability: number;
    fetcher: () => Promise<unknown>;
  }> {
    // 現在時刻から予測される行動パターン
    const hour = new Date().getHours();
    const predictions: Array<{
      key: string;
      probability: number;
      fetcher: () => Promise<unknown>;
    }> = [];

    // 食事時間帯の予測
    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      predictions.push({
        key: "predicted_restaurant_search",
        probability: 0.7,
        fetcher: async () => {
          const { sheetsService } = await import("./sheets");
          return sheetsService.fetchSheetData("snack", "AB2:AX50");
        },
      });
    }

    // 観光時間帯の予測
    if (hour >= 9 && hour <= 17) {
      predictions.push({
        key: "predicted_tourism_search",
        probability: 0.6,
        fetcher: async () => {
          const { sheetsService } = await import("./sheets");
          return sheetsService.fetchSheetData("ryotsu_aikawa", "AB2:AX100");
        },
      });
    }

    // インフラ施設は常に一定の確率
    predictions.push({
      key: "predicted_infrastructure_search",
      probability: 0.5,
      fetcher: async () => {
        const { sheetsService } = await import("./sheets");
        return sheetsService.fetchSheetData("toilet", "AB2:AX100");
      },
    });

    return predictions;
  }

  /**
   * プリロード結果の取得
   */
  getPreloadResults(): OptimizedPreloadResult[] {
    return [...this.preloadResults];
  }

  /**
   * プリロード統計の取得
   */
  getPreloadStats(): {
    totalDuration: number;
    successRate: number;
    dataCount: number;
  } {
    const totalDuration = this.preloadResults.reduce((sum, result) => sum + result.duration, 0);
    const successCount = this.preloadResults.filter((r) => r.success).length;
    const successRate =
      this.preloadResults.length > 0 ? successCount / this.preloadResults.length : 0;
    const dataCount = this.preloadResults.reduce((sum, result) => sum + result.dataCount, 0);

    return {
      totalDuration,
      successRate,
      dataCount,
    };
  }
}

/**
 * シングルトンプリロードマネージャー
 */
export const preloadManager = new OptimizedPreloadManager();

/**
 * アプリ起動時の自動プリロード初期化を無効化
 * プリロードは明示的にuseAppStateから呼び出される
 */
// if (typeof window !== "undefined") {
//   // DOM読み込み完了後に自動開始
//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", () => {
//       void preloadManager.startOptimizedPreload();
//     });
//   } else {
//     // 既に読み込み完了している場合は即座に開始
//     setTimeout(() => {
//       void preloadManager.startOptimizedPreload();
//     }, 100);
//   }
// }
