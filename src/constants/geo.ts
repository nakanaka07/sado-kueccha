/**
 * 🌍 地理計算・GIS関連定数 - 2025年最新実装
 *
 * @description
 * - 高精度地理計算対応
 * - 現代的な地図API互換性
 * - パフォーマンス最適化された距離計算
 * - 日本の測地系（JGD2011）対応
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

/**
 * 地球の物理定数
 *
 * @description WGS84測地系に基づく正確な地球パラメータ
 * @see https://en.wikipedia.org/wiki/World_Geodetic_System
 */
export const EARTH_CONSTANTS = {
  /** @description 地球の半径（メートル） - WGS84準拠 */
  RADIUS_KM: 6_371.0088,
  /** @description 地球の半径（キロメートル） */
  RADIUS_M: 6_371_008.8,
  /** @description 地球の円周（キロメートル） */
  CIRCUMFERENCE_KM: 40_075.017,
  /** @description 1度あたりの距離（キロメートル） */
  KM_PER_DEGREE: 111.32,
  /** @description 1度あたりの距離（メートル） */
  M_PER_DEGREE: 111_320,
} as const satisfies Readonly<Record<string, number>>;

/**
 * 距離計算の閾値設定
 *
 * @description 用途別の距離閾値（度単位 - 高精度）
 */
export const DISTANCE_THRESHOLDS = {
  /** @description 地理的精度レベル */
  PRECISION: {
    /** @description 極めて高精度（約1m） */
    ULTRA_HIGH: 0.000009,
    /** @description 非常に高精度（約5m） */
    VERY_HIGH: 0.000045,
    /** @description 高精度（約11m） */
    HIGH: 0.0001,
    /** @description 中精度（約50m） */
    MEDIUM: 0.00045,
    /** @description 低精度（約110m） */
    LOW: 0.001,
  },

  /** @description UIコンポーネント用の閾値 */
  UI: {
    /** @description 非常に近い位置の判定（約11m） */
    VERY_CLOSE: 0.0001,
    /** @description マーカーオフセット距離（約22m） */
    MARKER_OFFSET: 0.0002,
    /** @description タップターゲットの範囲（約55m） */
    TAP_TARGET: 0.0005,
    /** @description 選択範囲（約110m） */
    SELECTION_RANGE: 0.001,
  },

  /** @description クラスタリング用の閾値 */
  CLUSTERING: {
    /** @description 最小クラスタリング距離（約220m） */
    MIN_DISTANCE: 0.002,
    /** @description 中規模クラスタリング（約550m） */
    MEDIUM_DISTANCE: 0.005,
    /** @description 大規模クラスタリング（約1.1km） */
    LARGE_DISTANCE: 0.01,
  },

  /** @description 検索・フィルタリング用 */
  SEARCH: {
    /** @description 近隣検索の範囲（約550m） */
    NEARBY: 0.005,
    /** @description 地域検索の範囲（約2.2km） */
    LOCAL: 0.02,
    /** @description 広域検索の範囲（約5.5km） */
    REGIONAL: 0.05,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * ズームレベル計算定数
 *
 * @description Google Maps API v3.x 対応のズーム計算
 */
export const ZOOM_CALCULATION = {
  /** @description ズーム計算の基準定数 */
  CONSTANTS: {
    /** @description ベース距離（度単位） */
    BASE_DISTANCE: 0.06,
    /** @description 基準ズームレベル */
    BASE_ZOOM_LEVEL: 8,
    /** @description ズーム計算の対数底 */
    LOG_BASE: 2,
    /** @description 距離とズームの関係定数 */
    DISTANCE_ZOOM_FACTOR: 156543.03392,
  },

  /** @description 自動ズーム設定 */
  AUTO_ZOOM: {
    /** @description 単一マーカー用のズーム */
    SINGLE_MARKER: 15,
    /** @description 複数マーカー用の最小ズーム */
    MULTI_MARKER_MIN: 10,
    /** @description 複数マーカー用の最大ズーム */
    MULTI_MARKER_MAX: 16,
    /** @description パディング（ピクセル） */
    PADDING: 50,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * 座標変換関連定数
 *
 * @description 日本の測地系変換対応
 */
export const COORDINATE_SYSTEMS = {
  /** @description 日本の測地系 */
  JAPAN: {
    /** @description 日本測地系2011（JGD2011） - 現在標準 */
    JGD2011: "EPSG:6668",
    /** @description 日本測地系2000（JGD2000） - 旧標準 */
    JGD2000: "EPSG:4612",
    /** @description 東京測地系（Tokyo Datum） - レガシー */
    TOKYO: "EPSG:4301",
  },
  /** @description 世界測地系 */
  WORLD: {
    /** @description WGS84 - GPS標準 */
    WGS84: "EPSG:4326",
    /** @description Web メルカトル */
    WEB_MERCATOR: "EPSG:3857",
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * 地理的境界検証用定数
 *
 * @description 有効な座標範囲の定義
 */
export const COORDINATE_BOUNDS = {
  /** @description 緯度の有効範囲 */
  LATITUDE: {
    MIN: -90.0,
    MAX: 90.0,
  },
  /** @description 経度の有効範囲 */
  LONGITUDE: {
    MIN: -180.0,
    MAX: 180.0,
  },
  /** @description 日本の座標範囲（概算） */
  JAPAN: {
    LATITUDE: { MIN: 20.0, MAX: 46.0 },
    LONGITUDE: { MIN: 122.0, MAX: 154.0 },
  },
  /** @description 佐渡島の座標範囲（詳細） */
  SADO: {
    LATITUDE: { MIN: 37.7, MAX: 38.3 },
    LONGITUDE: { MIN: 138.0, MAX: 138.7 },
  },
} as const satisfies Readonly<
  Record<
    string,
    | Readonly<{
        MIN: number;
        MAX: number;
      }>
    | Readonly<
        Record<
          string,
          Readonly<{
            MIN: number;
            MAX: number;
          }>
        >
      >
  >
>;

/**
 * パフォーマンス最適化定数
 *
 * @description 地理計算の効率化設定
 */
export const GEO_PERFORMANCE = {
  /** @description 計算の最適化閾値 */
  OPTIMIZATION: {
    /** @description 高速近似計算を使用する距離閾値（km） */
    FAST_CALCULATION_THRESHOLD: 100,
    /** @description キャッシュを使用する計算量閾値 */
    CACHE_THRESHOLD: 1000,
    /** @description バッチ処理サイズ */
    BATCH_SIZE: 100,
  },
  /** @description 精度とパフォーマンスのトレードオフ */
  PRECISION_LEVELS: {
    /** @description 高速・低精度 */
    FAST: 1,
    /** @description バランス */
    BALANCED: 2,
    /** @description 高精度・低速 */
    PRECISE: 3,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * 下位互換性維持
 * @deprecated v1.x との互換性のため残している。v3.0で削除予定
 */
export const GEO_DISTANCE_THRESHOLDS = {
  VERY_CLOSE: DISTANCE_THRESHOLDS.UI.VERY_CLOSE,
  MARKER_OFFSET: DISTANCE_THRESHOLDS.UI.MARKER_OFFSET,
  MIN_CLUSTERING: DISTANCE_THRESHOLDS.CLUSTERING.MIN_DISTANCE,
} as const;

export const ZOOM_CONSTANTS = {
  BASE_DISTANCE: ZOOM_CALCULATION.CONSTANTS.BASE_DISTANCE,
  BASE_ZOOM_LEVEL: ZOOM_CALCULATION.CONSTANTS.BASE_ZOOM_LEVEL,
} as const;
