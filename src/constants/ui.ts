/**
 * アプリケーション全体で使用される定数定義
 * パフォーマンス設定とUI設定を含む
 */

// パフォーマンス関連の設定
export const PERFORMANCE_CONFIG = {
  // デバウンス遅延（ミリ秒）
  DEBOUNCE_DELAY: 300,
  // レンダリング間隔（ミリ秒）
  RENDER_INTERVAL: 100,
  // アニメーション継続時間（ミリ秒）
  ANIMATION_DURATION: 300,
  // 最小ローディング表示時間（ミリ秒）
  MIN_LOADING_TIME: 300,
} as const;

// UI関連の設定
export const UI_CONFIG = {
  // フィルターパネルの設定
  FILTER_PANEL: {
    DEFAULT_EXPANDED: false,
    DEFAULT_CATEGORIES: ["display"],
    TRANSITION_DURATION: 300,
  },
  // マーカーの設定
  MARKERS: {
    BOUNCE_DURATION: 1000,
    SCALE_FACTOR: 1.2,
    DEFAULT_SIZE: "medium",
  },
  // ローディングの設定
  LOADING: {
    SPINNER_SIZE: 40,
    FADE_DURATION: 600,
  },
} as const;

// ブレークポイント設定
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

// Zインデックス管理
export const Z_INDEX = {
  MAP: 1,
  MARKERS: 100,
  INFO_WINDOW: 200,
  FILTER_PANEL: 300,
  LOADING_OVERLAY: 900,
  ERROR_BOUNDARY: 1000,
} as const;
