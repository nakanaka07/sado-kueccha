/**
 * 地理計算ユーティリティ
 */
export const GeoUtils = {
  /**
   * 2点間の差分を計算（共通処理）
   * @param lat1 緯度1
   * @param lng1 経度1
   * @param lat2 緯度2
   * @param lng2 経度2
   * @returns 緯度差と経度差の2乗の合計
   */
  _getDistanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return latDiff * latDiff + lngDiff * lngDiff;
  },

  /**
   * 2点間の距離を計算（度単位）
   * @param lat1 緯度1
   * @param lng1 経度1
   * @param lat2 緯度2
   * @param lng2 経度2
   * @returns 距離（度単位）
   */
  getDistanceDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(this._getDistanceSquared(lat1, lng1, lat2, lng2));
  },

  /**
   * 2点間の距離の2乗を計算（パフォーマンス最適化用）
   * @param lat1 緯度1
   * @param lng1 経度1
   * @param lat2 緯度2
   * @param lng2 経度2
   * @returns 距離の2乗（度単位）
   */
  getDistanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return this._getDistanceSquared(lat1, lng1, lat2, lng2);
  },

  /**
   * ズームレベルに基づいてクラスタリング距離を計算
   * @param zoomLevel ズームレベル
   * @returns クラスタリング距離（度単位）
   */
  getClusteringDistance(zoomLevel: number): number {
    return Math.max(0.002, 0.06 / Math.pow(2, zoomLevel - 8));
  },
  /**
   * ポイントが境界内にあるかチェック
   * @param lat 緯度
   * @param lng 経度
   * @param bounds Google Maps境界オブジェクト
   * @returns 境界内にある場合true
   */
  isInBounds(lat: number, lng: number, bounds: google.maps.LatLngBounds | null): boolean {
    if (!bounds) return true;
    return bounds.contains({ lat, lng });
  },
} as const;

/**
 * 佐渡島関連の地理定数
 */
export const SADO_CONSTANTS = {
  /** 地図中心座標 */
  CENTER: { lat: 38.0549, lng: 138.3691 } as const,

  /** ズームレベル設定 */
  ZOOM: {
    DEFAULT: 10,
    MIN: 8,
    MAX: 20,
    MIN_CLUSTER: 15,
    DISABLE_CLUSTERING: 16,
    HIGH_THRESHOLD: 18,
  } as const,

  /** マーカー表示制限 */
  MARKER_LIMITS: {
    HIGH_ZOOM: 200,
    NORMAL_ZOOM: 400,
  } as const,

  /** 佐渡島の境界 */
  BOUNDS: {
    north: 38.3,
    south: 37.8,
    east: 138.7,
    west: 138.0,
  } as const,
} as const;
