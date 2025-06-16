/**
 * 共通型定義
 */

/**
 * 位置情報を持つオブジェクトの型
 */
export interface PositionObject {
  position: {
    lat: number;
    lng: number;
  };
}

/**
 * 位置座標の型
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * キャッシュエントリの共通インターフェース
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiry?: number;
}
