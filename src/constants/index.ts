/**
 * 🏗️ 定数定義のメインエントリーポイント - 2025年最新実装
 *
 * @description
 * - 統一されたエクスポート管理
 * - Tree-shaking最適化対応
 * - 型安全な再エクスポート
 * - パフォーマンス最適化
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

// === 地図・地理関連 ===
export * from "./geo";
export * from "./map";

// === データ管理 ===
export * from "./api";
export * from "./cache";

// === UI・UX ===
export * from "./filter";
export * from "./ui";

// === 型安全な再エクスポート（個別指定）===

// 地図関連
export type {} from "./map";

// キャッシュ関連
export type {} from "./cache";

// API関連
export type {} from "./api";

// 地理計算関連
export type {} from "./geo";

// フィルター関連
export type {} from "./filter";

// UI関連
export type {} from "./ui";

/**
 * 🎯 使用頻度の高い定数の集約エクスポート
 *
 * @description よく使用される定数をまとめて提供
 */
export const COMMON_CONSTANTS = {
  // 地図設定
  MAP_CENTER: { lat: 38.0549, lng: 138.3691 } as const,
  DEFAULT_ZOOM: 11,

  // UI設定
  MOBILE_BREAKPOINT: 768,
  DEBOUNCE_DELAY: 300,

  // キャッシュ設定
  DEFAULT_CACHE_TTL: 15 * 60 * 1000, // 15分

  // API設定
  DEFAULT_TIMEOUT: 10_000,
  MAX_RETRIES: 3,
} as const satisfies Readonly<Record<string, unknown>>;

/**
 * 🚀 パフォーマンス最適化された定数
 *
 * @description 高頻度アクセス用の最適化済み定数
 */
export const PERFORMANCE_CONSTANTS = {
  // アニメーション
  FAST_ANIMATION: 200,
  NORMAL_ANIMATION: 300,
  SLOW_ANIMATION: 500,

  // レンダリング
  FRAME_TIME: 16.67, // 60fps
  BATCH_SIZE: 50,

  // メモリ管理
  OBJECT_POOL_SIZE: 100,
  GC_INTERVAL: 30_000,
} as const satisfies Readonly<Record<string, number>>;

/**
 * 📱 レスポンシブデザイン定数
 *
 * @description デバイス対応用の統一定数
 */
export const RESPONSIVE_CONSTANTS = {
  BREAKPOINTS: {
    XS: 320,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1400,
  },
  GRID: {
    COLUMNS: 12,
    GUTTER: 16,
    CONTAINER_MAX: 1200,
  },
} as const satisfies Readonly<{
  readonly BREAKPOINTS: Readonly<Record<string, number>>;
  readonly GRID: Readonly<Record<string, number>>;
}>;

/**
 * 🎨 デザインシステム定数
 *
 * @description 統一されたデザイン定数
 */
export const DESIGN_CONSTANTS = {
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    FULL: 9999,
  },
  Z_INDEX: {
    BASE: 1,
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL: 1040,
    POPOVER: 1050,
    TOOLTIP: 1060,
    TOAST: 1070,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

// 下位互換性維持のためのデフォルトエクスポート
export default {
  ...COMMON_CONSTANTS,
  ...PERFORMANCE_CONSTANTS,
  ...RESPONSIVE_CONSTANTS,
  ...DESIGN_CONSTANTS,
} as const;
