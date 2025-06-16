/**
 * キャッシュ関連の定数とユーティリティ
 */

/**
 * 時間計算ヘルパー（ミリ秒）
 */
export const timeHelpers = {
  seconds: (count: number) => count * 1000,
  minutes: (count: number) => count * 60 * 1000,
  hours: (count: number) => count * 60 * 60 * 1000,
  days: (count: number) => count * 24 * 60 * 60 * 1000,
} as const;

/**
 * キャッシュ設定
 */
export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: timeHelpers.minutes(15),
  SHEETS_TTL: timeHelpers.hours(1),
  IMAGES_TTL: timeHelpers.days(1),
  MAX_SIZE: 10,
  MAX_ENTRIES: 200, // マーカークラスタリング結果を多くキャッシュ
  STORAGE_KEY: "sado-kueccha-cache",
} as const;
