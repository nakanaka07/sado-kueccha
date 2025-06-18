/**
 * 🗺️ 地図表示・制御関連定数 - 2025年最新実装
 *
 * @description
 * - Google Maps JavaScript API v3.x 最新機能対応
 * - レスポンシブデザイン対応
 * - アクセシビリティ準拠（WCAG 2.1 AA）
 * - パフォーマンス最適化
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

import type { LatLngLiteral } from "../types/google-maps";

/**
 * 佐渡島の地理情報と表示設定
 *
 * @description 佐渡島観光マップに最適化された設定値
 */
export const SADO_ISLAND = {
  /** @description 佐渡島の中心座標（測量データ基準） */
  CENTER: {
    lat: 38.0549,
    lng: 138.3691,
  } as const satisfies LatLngLiteral,

  /** @description ズームレベル設定 */
  ZOOM: {
    /** @description デフォルトズームレベル */
    DEFAULT: 11,
    /** @description 最小ズーム（島全体表示） */
    MIN: 9,
    /** @description 最大ズーム（詳細表示） */
    MAX: 18,
    /** @description クラスタリング開始ズーム */
    MIN_CLUSTER_ZOOM: 8,
    /** @description クラスタリング無効化ズーム（詳細表示時） */
    DISABLE_CLUSTERING: 16,
    /** @description 高精度表示の閾値 */
    HIGH_PRECISION_THRESHOLD: 17,
    /** @description パフォーマンス重視モードの閾値 */
    PERFORMANCE_MODE_THRESHOLD: 14,
  } as const,

  /** @description パフォーマンス最適化設定 */
  PERFORMANCE: {
    /** @description 標準ズーム時のマーカー表示上限 */
    MARKER_LIMITS: {
      /** @description 低ズーム時（9-13） */
      LOW_ZOOM: 100,
      /** @description 中ズーム時（14-16） */
      MEDIUM_ZOOM: 200,
      /** @description 高ズーム時（17-18） */
      HIGH_ZOOM: 500,
    },
    /** @description レンダリング最適化 */
    RENDERING: {
      /** @description 地図タイル読み込み優先度 */
      TILE_PRIORITY: "high" as const,
      /** @description アニメーション品質 */
      ANIMATION_QUALITY: "balanced" as const,
      /** @description 遅延読み込み閾値（ピクセル） */
      LAZY_LOAD_THRESHOLD: 100,
    },
  } as const,

  /** @description 地理的境界（詳細測量データ） */
  GEOGRAPHIC_BOUNDS: {
    /** @description 北端（金北山付近） */
    NORTH: 38.3,
    /** @description 南端（小木港付近） */
    SOUTH: 37.7,
    /** @description 東端（両津港付近） */
    EAST: 138.7,
    /** @description 西端（相川地区付近） */
    WEST: 138.0,
  } as const,

  /** @description 主要エリア座標 */
  MAJOR_AREAS: {
    /** @description 両津エリア中心 */
    RYOTSU: { lat: 38.0833, lng: 138.4333 },
    /** @description 相川エリア中心 */
    AIKAWA: { lat: 38.0167, lng: 138.2833 },
    /** @description 佐和田エリア中心 */
    SAWADA: { lat: 38.0, lng: 138.3667 },
    /** @description 金井エリア中心 */
    KANAI: { lat: 38.0167, lng: 138.3833 },
    /** @description 小木エリア中心 */
    OGI: { lat: 37.8167, lng: 138.2833 },
  } as const satisfies Readonly<Record<string, LatLngLiteral>>,
} as const satisfies Readonly<{
  readonly CENTER: LatLngLiteral;
  readonly ZOOM: Readonly<Record<string, number>>;
  readonly PERFORMANCE: Readonly<Record<string, unknown>>;
  readonly GEOGRAPHIC_BOUNDS: Readonly<Record<string, number>>;
  readonly MAJOR_AREAS: Readonly<Record<string, LatLngLiteral>>;
}>;

/**
 * 地図表示スタイル設定
 *
 * @description アクセシビリティとUXを重視したスタイル
 */
export const MAP_STYLES = {
  /** @description デフォルトスタイル（明度調整済み） */
  DEFAULT: [],

  /** @description 高コントラストモード */
  HIGH_CONTRAST: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ saturation: -100 }, { contrast: 50 }],
    },
  ],

  /** @description ダークモード */
  DARK: [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
  ],

  /** @description 印刷用（モノクロ） */
  PRINT: [
    {
      featureType: "all",
      elementType: "all",
      stylers: [{ saturation: -100 }, { lightness: 50 }],
    },
  ],
} as const satisfies Readonly<Record<string, readonly unknown[]>>;

/**
 * 地図制御UI設定
 *
 * @description ユーザビリティを重視した制御要素
 */
export const MAP_CONTROLS = {
  /** @description デフォルト制御要素 */
  DEFAULT: {
    /** @description ズーム制御表示 */
    zoomControl: true,
    /** @description 地図タイプ制御表示 */
    mapTypeControl: false,
    /** @description スケール制御表示 */
    scaleControl: true,
    /** @description ストリートビュー制御表示 */
    streetViewControl: false,
    /** @description 全画面制御表示 */
    fullscreenControl: true,
    /** @description 回転制御表示 */
    rotateControl: false,
  } as const,

  /** @description モバイル向け制御要素 */
  MOBILE: {
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    rotateControl: false,
  } as const,

  /** @description アクセシビリティ重視 */
  ACCESSIBLE: {
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    rotateControl: false,
  } as const,
} as const satisfies Readonly<Record<string, Readonly<Record<string, boolean>>>>;

/**
 * インタラクション設定
 *
 * @description ユーザーインタラクションの制御
 */
export const MAP_INTERACTION = {
  /** @description デフォルトインタラクション */
  DEFAULT: {
    /** @description ドラッグ可能 */
    draggable: true,
    /** @description スクロールホイールズーム */
    scrollwheel: true,
    /** @description ダブルクリックズーム */
    disableDoubleClickZoom: false,
    /** @description キーボードショートカット */
    keyboardShortcuts: true,
  } as const,

  /** @description 制限モード（埋め込み用） */
  RESTRICTED: {
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    keyboardShortcuts: false,
  } as const,

  /** @description タッチ最適化 */
  TOUCH_OPTIMIZED: {
    draggable: true,
    scrollwheel: false, // タッチスクロールとの競合回避
    disableDoubleClickZoom: false,
    keyboardShortcuts: true,
    gestureHandling: "cooperative" as const,
  } as const,
} as const satisfies Readonly<Record<string, Readonly<Record<string, unknown>>>>;

/**
 * レスポンシブ設定
 *
 * @description デバイス種別に応じた最適化
 */
export const MAP_RESPONSIVE = {
  /** @description ブレークポイント（ピクセル） */
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
    LARGE_DESKTOP: 1440,
  } as const,

  /** @description デバイス別設定 */
  DEVICE_CONFIGS: {
    MOBILE: {
      zoom: SADO_ISLAND.ZOOM.DEFAULT - 1,
      controls: MAP_CONTROLS.MOBILE,
      interaction: MAP_INTERACTION.TOUCH_OPTIMIZED,
    },
    TABLET: {
      zoom: SADO_ISLAND.ZOOM.DEFAULT,
      controls: MAP_CONTROLS.DEFAULT,
      interaction: MAP_INTERACTION.DEFAULT,
    },
    DESKTOP: {
      zoom: SADO_ISLAND.ZOOM.DEFAULT,
      controls: MAP_CONTROLS.ACCESSIBLE,
      interaction: MAP_INTERACTION.DEFAULT,
    },
  } as const,
} as const satisfies Readonly<{
  readonly BREAKPOINTS: Readonly<Record<string, number>>;
  readonly DEVICE_CONFIGS: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}>;

/**
 * パフォーマンス監視設定
 *
 * @description 地図パフォーマンスの測定・最適化
 */
export const MAP_PERFORMANCE_CONFIG = {
  /** @description 監視対象メトリクス */
  METRICS: {
    /** @description 初期読み込み時間（ミリ秒） */
    INITIAL_LOAD_TIME: 3_000,
    /** @description タイル読み込み時間（ミリ秒） */
    TILE_LOAD_TIME: 1_000,
    /** @description マーカー描画時間（ミリ秒） */
    MARKER_RENDER_TIME: 500,
    /** @description インタラクション応答時間（ミリ秒） */
    INTERACTION_RESPONSE_TIME: 100,
  } as const,

  /** @description 最適化閾値 */
  OPTIMIZATION_THRESHOLDS: {
    /** @description マーカー数による最適化 */
    MARKER_COUNT_THRESHOLD: 100,
    /** @description メモリ使用量制限（MB） */
    MEMORY_LIMIT_MB: 50,
    /** @description CPU使用率制限（%） */
    CPU_USAGE_LIMIT: 70,
  } as const,
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;
