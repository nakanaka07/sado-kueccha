/**
 * 地理計算関連の定数
 */

/**
 * 距離計算の閾値（度単位）
 */
export const GEO_DISTANCE_THRESHOLDS = {
  /** 非常に近い位置の判定閾値（約11m） */
  VERY_CLOSE: 0.0001,
  /** マーカーオフセットの距離（約22m） */
  MARKER_OFFSET: 0.0002,
  /** クラスタリングの最小距離 */
  MIN_CLUSTERING: 0.002,
} as const;

/**
 * ズームレベル計算の定数
 */
export const ZOOM_CONSTANTS = {
  /** ベース距離 */
  BASE_DISTANCE: 0.06,
  /** 基準ズームレベル */
  BASE_ZOOM_LEVEL: 8,
} as const;
