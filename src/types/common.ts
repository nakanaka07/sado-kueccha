// 共通型定義とユーティリティ関数

import type { ClusterPOI, LatLngLiteral, POI } from "./google-maps";

/**
 * キャッシュエントリの共通インターフェース
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  expiry?: number;
}

/**
 * 営業時間の解析済みデータ
 */
export type ParsedHours =
  | { type: "closed" }
  | { type: "24h" }
  | { type: "unknown" }
  | { type: "multiple"; periods: Array<{ start: number; end: number }> }
  | { type: "normal"; start: number; end: number };

/**
 * 型ガード: POI配列の検証
 */
export function isPOIArray(data: unknown): data is POI[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every((item) => {
    if (typeof item !== "object" || item === null) {
      return false;
    }

    const obj = item as Record<string, unknown>;
    return (
      typeof obj["id"] === "string" &&
      typeof obj["name"] === "string" &&
      isValidPosition(obj["position"])
    );
  });
}

/**
 * 型ガード: クラスター用POIの検証
 */
export function isClusterPOI(poi: unknown): poi is ClusterPOI {
  if (typeof poi !== "object" || poi === null) {
    return false;
  }

  const obj = poi as Record<string, unknown>;
  return typeof obj["clusterSize"] === "number" && Array.isArray(obj["originalPois"]);
}

/**
 * 型ガード: 有効な地理座標の検証
 */
export function isValidPosition(position: unknown): position is LatLngLiteral {
  if (typeof position !== "object" || position === null) {
    return false;
  }

  const pos = position as Record<string, unknown>;
  return (
    typeof pos["lat"] === "number" &&
    typeof pos["lng"] === "number" &&
    pos["lat"] >= -90 &&
    pos["lat"] <= 90 &&
    pos["lng"] >= -180 &&
    pos["lng"] <= 180
  );
}
