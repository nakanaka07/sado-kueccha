/**
 * 🎨 UI/UX関連定数 - 2025年最新実装
 *
 * @description
 * - Modern Design System 準拠
 * - アクセシビリティ対応（WCAG 2.1 AA）
 * - レスポンシブデザイン最適化
 * - パフォーマンス重視の設定値
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

/**
 * パフォーマンス最適化設定
 *
 * @description Core Web Vitals向上とUX最適化を両立
 */
export const PERFORMANCE_CONFIG = {
  /** @description タイミング制御（ミリ秒） */
  TIMING: {
    /** @description デバウンス遅延（ユーザー入力） */
    DEBOUNCE_DELAY: 300,
    /** @description スロットル間隔（スクロール等） */
    THROTTLE_INTERVAL: 16, // 60fps対応
    /** @description レンダリング間隔 */
    RENDER_INTERVAL: 100,
    /** @description アニメーション継続時間 */
    ANIMATION_DURATION: 300,
    /** @description 最小ローディング表示時間 */
    MIN_LOADING_TIME: 300,
    /** @description 長時間処理の閾値 */
    LONG_TASK_THRESHOLD: 1_000,
  },

  /** @description フレームレート最適化 */
  FRAME_RATE: {
    /** @description 目標FPS */
    TARGET_FPS: 60,
    /** @description フレーム時間（ミリ秒） */
    FRAME_TIME: 16.67,
    /** @description 重い処理の分割単位 */
    HEAVY_TASK_CHUNK: 5,
    /** @description アイドル時間利用 */
    IDLE_DEADLINE: 5,
  },

  /** @description メモリ管理 */
  MEMORY: {
    /** @description オブジェクトプール初期サイズ */
    OBJECT_POOL_SIZE: 50,
    /** @description ガベージコレクション間隔 */
    GC_INTERVAL: 30_000,
    /** @description 大容量アセット閾値（KB） */
    LARGE_ASSET_THRESHOLD: 1024,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * UI コンポーネント設定
 *
 * @description 統一されたUI体験のための設定
 */
export const UI_CONFIG = {
  /** @description フィルターパネル */
  FILTER_PANEL: {
    /** @description デフォルト展開状態 */
    DEFAULT_EXPANDED: false,
    /** @description デフォルトカテゴリ */
    DEFAULT_CATEGORIES: ["display"],
    /** @description アニメーション時間 */
    TRANSITION_DURATION: 300,
    /** @description 最大高さ（vh） */
    MAX_HEIGHT: 80,
    /** @description 最小幅（px） */
    MIN_WIDTH: 280,
  },

  /** @description マーカー表示 */
  MARKERS: {
    /** @description バウンス時間 */
    BOUNCE_DURATION: 1_000,
    /** @description スケール係数 */
    SCALE_FACTOR: 1.2,
    /** @description デフォルトサイズ */
    DEFAULT_SIZE: "medium" as const,
    /** @description ホバー遅延 */
    HOVER_DELAY: 100,
    /** @description 選択状態の持続時間 */
    SELECTION_DURATION: 2_000,
  },

  /** @description ローディング表示 */
  LOADING: {
    /** @description スピナーサイズ（px） */
    SPINNER_SIZE: 40,
    /** @description フェード時間 */
    FADE_DURATION: 600,
    /** @description 段階的表示遅延 */
    PROGRESSIVE_DELAY: 150,
    /** @description 最小表示時間 */
    MIN_DISPLAY_TIME: 500,
  },

  /** @description 情報ウィンドウ */
  INFO_WINDOW: {
    /** @description 最大幅（px） */
    MAX_WIDTH: 400,
    /** @description 最大高さ（px） */
    MAX_HEIGHT: 300,
    /** @description アニメーション時間 */
    ANIMATION_DURATION: 250,
    /** @description 自動閉じる時間（0で無効） */
    AUTO_CLOSE_DELAY: 0,
  },

  /** @description 通知システム */
  NOTIFICATIONS: {
    /** @description 表示時間（ミリ秒） */
    DISPLAY_DURATION: 5_000,
    /** @description 最大表示数 */
    MAX_VISIBLE: 3,
    /** @description アニメーション時間 */
    ANIMATION_DURATION: 300,
    /** @description 位置（画面上の） */
    POSITION: "top-right" as const,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * レスポンシブブレークポイント
 *
 * @description モダンデバイス対応のブレークポイント
 */
export const BREAKPOINTS = {
  /** @description 極小デバイス（スマートウォッチ等） */
  XS: 320,
  /** @description スマートフォン */
  MOBILE: 768,
  /** @description タブレット */
  TABLET: 1024,
  /** @description デスクトップ */
  DESKTOP: 1200,
  /** @description 大型デスクトップ */
  LARGE_DESKTOP: 1440,
  /** @description 4K・ウルトラワイド */
  ULTRA_WIDE: 1920,
} as const satisfies Readonly<Record<string, number>>;

/**
 * Zインデックス管理
 *
 * @description レイヤー順序の統一管理
 */
export const Z_INDEX = {
  /** @description 基本レイヤー */
  BASE: {
    /** @description 地図本体 */
    MAP: 1,
    /** @description 地図上のマーカー */
    MARKERS: 100,
    /** @description 情報ウィンドウ */
    INFO_WINDOW: 200,
  },

  /** @description UI要素 */
  UI: {
    /** @description ナビゲーション */
    NAVIGATION: 300,
    /** @description フィルターパネル */
    FILTER_PANEL: 400,
    /** @description サイドバー */
    SIDEBAR: 500,
    /** @description ヘッダー */
    HEADER: 600,
  },

  /** @description オーバーレイ */
  OVERLAY: {
    /** @description ツールチップ */
    TOOLTIP: 700,
    /** @description ドロップダウン */
    DROPDOWN: 800,
    /** @description ローディング */
    LOADING: 900,
    /** @description モーダル */
    MODAL: 1000,
    /** @description エラー境界 */
    ERROR_BOUNDARY: 1100,
  },

  /** @description システム */
  SYSTEM: {
    /** @description 通知 */
    NOTIFICATIONS: 1200,
    /** @description デバッグ情報 */
    DEBUG: 9999,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * カラーシステム
 *
 * @description アクセシビリティ対応のカラーパレット
 */
export const COLORS = {
  /** @description プライマリカラー */
  PRIMARY: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    900: "#0c4a6e",
  },

  /** @description セマンティックカラー */
  SEMANTIC: {
    SUCCESS: "#10b981",
    WARNING: "#f59e0b",
    ERROR: "#ef4444",
    INFO: "#3b82f6",
  },

  /** @description グレースケール */
  GRAY: {
    50: "#f9fafb",
    100: "#f3f4f6",
    300: "#d1d5db",
    500: "#6b7280",
    700: "#374151",
    900: "#111827",
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * タイポグラフィ設定
 *
 * @description 読みやすさとアクセシビリティを重視
 */
export const TYPOGRAPHY = {
  /** @description フォントサイズ（rem） */
  FONT_SIZE: {
    XS: 0.75,
    SM: 0.875,
    BASE: 1,
    LG: 1.125,
    XL: 1.25,
    "2XL": 1.5,
    "3XL": 1.875,
  },

  /** @description 行の高さ */
  LINE_HEIGHT: {
    TIGHT: 1.25,
    NORMAL: 1.5,
    RELAXED: 1.75,
  },

  /** @description フォントウェイト */
  FONT_WEIGHT: {
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * アニメーション設定
 *
 * @description パフォーマンスとUXのバランス
 */
export const ANIMATIONS = {
  /** @description イージング関数 */
  EASING: {
    /** @description 標準 */
    STANDARD: "cubic-bezier(0.4, 0.0, 0.2, 1)",
    /** @description 高速化 */
    ACCELERATE: "cubic-bezier(0.4, 0.0, 1, 1)",
    /** @description 減速 */
    DECELERATE: "cubic-bezier(0.0, 0.0, 0.2, 1)",
    /** @description バウンス */
    BOUNCE: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  /** @description 継続時間（ミリ秒） */
  DURATION: {
    /** @description 超短時間 */
    INSTANT: 100,
    /** @description 短時間 */
    FAST: 200,
    /** @description 標準 */
    NORMAL: 300,
    /** @description やや長め */
    SLOW: 500,
    /** @description 長時間 */
    SLOWER: 1000,
  },

  /** @description 遅延（ミリ秒） */
  DELAY: {
    /** @description 段階的表示 */
    STAGGER: 100,
    /** @description ホバー応答 */
    HOVER: 50,
    /** @description フォーカス応答 */
    FOCUS: 0,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * アクセシビリティ設定
 *
 * @description WCAG 2.1 AA準拠
 */
export const ACCESSIBILITY = {
  /** @description フォーカス設定 */
  FOCUS: {
    /** @description アウトライン幅（px） */
    OUTLINE_WIDTH: 2,
    /** @description アウトラインオフセット（px） */
    OUTLINE_OFFSET: 2,
    /** @description フォーカス可視化遅延（ミリ秒） */
    VISIBLE_DELAY: 100,
  },

  /** @description コントラスト比 */
  CONTRAST: {
    /** @description 最小コントラスト比（WCAG AA） */
    MIN_RATIO: 4.5,
    /** @description 大きなテキストの最小比（WCAG AA） */
    MIN_RATIO_LARGE: 3.0,
    /** @description 推奨コントラスト比（WCAG AAA） */
    ENHANCED_RATIO: 7.0,
  },

  /** @description タッチターゲット */
  TOUCH_TARGET: {
    /** @description 最小サイズ（px） */
    MIN_SIZE: 44,
    /** @description 推奨サイズ（px） */
    RECOMMENDED_SIZE: 48,
    /** @description 最小間隔（px） */
    MIN_SPACING: 8,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * 下位互換性維持
 * @deprecated v1.x との互換性のため残している。v3.0で削除予定
 */
export const { MARKERS, LOADING, FILTER_PANEL } = UI_CONFIG;
