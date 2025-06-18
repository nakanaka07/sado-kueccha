/**
 * 🗄️ キャッシュ管理システム - 2025年最新実装
 *
 * @description
 * - メモリ効率とパフォーマンス最適化
 * - LRU・TTLベースのキャッシュ戦略
 * - Web標準API対応（Cache API、IndexedDB）
 * - TypeScript 5.x 厳密型システム対応
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

/**
 * 時間計算ユーティリティ
 *
 * @description 型安全で読みやすい時間計算ヘルパー
 * @example
 * ```typescript
 * const timeout = TIME_UTILS.minutes(5); // 300,000 ms
 * const cacheExpiry = TIME_UTILS.hours(2); // 7,200,000 ms
 * ```
 */
export const TIME_UTILS = {
  /** @description 秒をミリ秒に変換 */
  seconds: (count: number): number => count * 1_000,
  /** @description 分をミリ秒に変換 */
  minutes: (count: number): number => count * 60 * 1_000,
  /** @description 時間をミリ秒に変換 */
  hours: (count: number): number => count * 60 * 60 * 1_000,
  /** @description 日をミリ秒に変換 */
  days: (count: number): number => count * 24 * 60 * 60 * 1_000,
  /** @description 週をミリ秒に変換 */
  weeks: (count: number): number => count * 7 * 24 * 60 * 60 * 1_000,
} as const satisfies Readonly<Record<string, (count: number) => number>>;

/**
 * キャッシュ層別設定
 *
 * @description データの性質に応じた最適なキャッシュ戦略
 */
export const CACHE_STRATEGY = {
  /** @description 一時的なUIステート */
  MEMORY: {
    DEFAULT_TTL: TIME_UTILS.minutes(5),
    MAX_SIZE: 50,
    CLEANUP_INTERVAL: TIME_UTILS.minutes(1),
  },
  /** @description APIレスポンス */
  SESSION: {
    DEFAULT_TTL: TIME_UTILS.minutes(15),
    MAX_SIZE: 100,
    CLEANUP_INTERVAL: TIME_UTILS.minutes(5),
  },
  /** @description 長期保存データ */
  PERSISTENT: {
    DEFAULT_TTL: TIME_UTILS.days(7),
    MAX_SIZE: 500,
    CLEANUP_INTERVAL: TIME_UTILS.hours(1),
  },
} as const satisfies Readonly<
  Record<
    string,
    Readonly<{
      DEFAULT_TTL: number;
      MAX_SIZE: number;
      CLEANUP_INTERVAL: number;
    }>
  >
>;

/**
 * データ種別ごとのキャッシュ設定
 *
 * @description アプリケーション固有のデータに最適化
 */
export const CACHE_CONFIG = {
  /** @description デフォルトの有効期限 */
  DEFAULT_EXPIRY: TIME_UTILS.minutes(15),

  /** @description データソース別TTL設定 */
  TTL: {
    /** @description Google Sheets データ */
    SHEETS: TIME_UTILS.hours(2), // 1時間から2時間に延長
    /** @description 画像・静的アセット */
    IMAGES: TIME_UTILS.days(1),
    /** @description 地図データ */
    MAP_DATA: TIME_UTILS.hours(6),
    /** @description ユーザー設定 */
    USER_PREFERENCES: TIME_UTILS.days(30),
    /** @description 検索結果 */
    SEARCH_RESULTS: TIME_UTILS.minutes(30), // 10分から30分に延長
    /** @description API レスポンス */
    API_RESPONSE: TIME_UTILS.minutes(15), // 5分から15分に延長
    /** @description クラスタリングデータ */
    CLUSTERING: TIME_UTILS.hours(1),
  },

  /** @description 容量制限 */
  LIMITS: {
    /** @description 単一キャッシュエントリの最大サイズ（MB） */
    MAX_ENTRY_SIZE: 10,
    /** @description 総エントリ数の上限 */
    MAX_ENTRIES: 200,
    /** @description メモリ使用量の上限（MB） */
    MAX_MEMORY_MB: 50,
    /** @description クリーンアップトリガー閾値（%） */
    CLEANUP_THRESHOLD: 80,
  },

  /** @description ストレージ設定 */
  STORAGE: {
    /** @description LocalStorage のキー名 */
    KEY: "sado-kueccha-cache",
    /** @description SessionStorage のキー名 */
    SESSION_KEY: "sado-kueccha-session",
    /** @description IndexedDB データベース名 */
    IDB_NAME: "sado-kueccha-idb",
    /** @description バージョン管理 */
    VERSION: "2.0.0",
  },

  /** @description パフォーマンス設定 */
  PERFORMANCE: {
    /** @description バッチ処理サイズ */
    BATCH_SIZE: 10,
    /** @description デバウンス遅延（ミリ秒） */
    DEBOUNCE_DELAY: 100,
    /** @description 圧縮閾値（KB） */
    COMPRESSION_THRESHOLD: 1024,
    /** @description 非同期処理の並行数 */
    CONCURRENT_OPERATIONS: 3,
  },
} as const satisfies Readonly<{
  readonly DEFAULT_EXPIRY: number;
  readonly TTL: Readonly<Record<string, number>>;
  readonly LIMITS: Readonly<Record<string, number>>;
  readonly STORAGE: Readonly<Record<string, string>>;
  readonly PERFORMANCE: Readonly<Record<string, number>>;
}>;

/**
 * キャッシュ操作の優先度設定
 *
 * @description リソース制約下での適切な優先制御
 */
export const CACHE_PRIORITY = {
  /** @description 最高優先度（ユーザー操作に直結） */
  CRITICAL: 1,
  /** @description 高優先度（UX改善） */
  HIGH: 2,
  /** @description 中優先度（パフォーマンス向上） */
  MEDIUM: 3,
  /** @description 低優先度（最適化） */
  LOW: 4,
  /** @description 最低優先度（将来利用） */
  LOWEST: 5,
} as const satisfies Readonly<Record<string, number>>;

/**
 * エラーハンドリング設定
 *
 * @description キャッシュ操作失敗時の適切な対応
 */
export const CACHE_ERROR_CONFIG = {
  /** @description リトライ設定 */
  RETRY: {
    /** @description 最大試行回数 */
    MAX_ATTEMPTS: 3,
    /** @description 初期遅延（ミリ秒） */
    INITIAL_DELAY: 100,
    /** @description 指数バックオフの乗数 */
    BACKOFF_MULTIPLIER: 2,
    /** @description 最大遅延（ミリ秒） */
    MAX_DELAY: 5_000,
  },
  /** @description フォールバック設定 */
  FALLBACK: {
    /** @description メモリキャッシュへのフォールバック有効 */
    ENABLE_MEMORY_FALLBACK: true,
    /** @description ネットワークへのフォールバック有効 */
    ENABLE_NETWORK_FALLBACK: true,
    /** @description 古いキャッシュの利用許可 */
    ALLOW_STALE_DATA: true,
  },
} as const satisfies Readonly<{
  readonly RETRY: Readonly<Record<string, number>>;
  readonly FALLBACK: Readonly<Record<string, boolean>>;
}>;

/**
 * 下位互換性維持
 * @deprecated v1.x との互換性のため残している。v3.0で削除予定
 */
export const timeHelpers = TIME_UTILS;
