/**
 * マップ関連の定数
 */

import type { LatLngLiteral } from "../types/google-maps";

/**
 * 佐渡島関連の定数
 */
export const SADO_ISLAND = {
  CENTER: { lat: 38.0549, lng: 138.3691 } as LatLngLiteral,
  ZOOM: {
    DEFAULT: 11,
    MIN: 9,
    MAX: 18,
    MIN_CLUSTER_ZOOM: 8,
    DISABLE_CLUSTERING: 16, // 14から16に変更してより高ズームでもクラスタリング有効
    HIGH_THRESHOLD: 17,
  },
  MARKER_LIMITS: {
    NORMAL_ZOOM: 200,
    HIGH_ZOOM: 500,
  } /**
   * 佐渡島の地理的境界（概算値）
   * 北緯38.3度から南緯37.7度、東経138.0度から138.7度
   */,
  BOUNDS: {
    NORTH: 38.3, // 佐渡島北端付近
    SOUTH: 37.7, // 佐渡島南端付近
    EAST: 138.7, // 佐渡島東端付近
    WEST: 138.0, // 佐渡島西端付近
  },
} as const;
