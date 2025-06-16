/**
 * 型ガード関数の集約
 * 型安全性を確保するための検証関数群
 */

import type { LatLngLiteral } from "../types/google-maps";
import type { POI, POICluster } from "../types/poi";

/**
 * 型ガード: 有効な地理座標の検証
 * 緯度・経度の有効範囲を含めた厳密な検証
 */
export function isValidPosition(position: unknown): position is LatLngLiteral {
  if (typeof position !== "object" || position === null) {
    return false;
  }

  const pos = position as Record<string, unknown>;
  const lat = pos["lat"];
  const lng = pos["lng"];

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * 型ガード: 有効な文字列の検証
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * 型ガード: 単一POIの検証
 * POIインターフェースのすべての必須プロパティを検証
 */
export function isPOI(data: unknown): data is POI {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    isValidString(obj["id"]) &&
    isValidString(obj["name"]) &&
    isValidString(obj["genre"]) &&
    isValidPosition(obj["position"])
  );
}

/**
 * 型ガード: POI配列の検証
 * 配列内のすべての要素がPOI型であることを検証
 */
export function isPOIArray(data: unknown): data is POI[] {
  if (!Array.isArray(data)) {
    return false;
  }

  // 空配列は有効
  if (data.length === 0) {
    return true;
  }

  // すべての要素がPOI型であることを検証
  return data.every(isPOI);
}

/**
 * 型ガード: POIクラスターの検証
 * POIClusterインターフェースのすべての必須プロパティを検証
 */
export function isPOICluster(data: unknown): data is POICluster {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return (
    isValidString(obj["id"]) &&
    isValidPosition(obj["center"]) &&
    typeof obj["size"] === "number" &&
    Number.isInteger(obj["size"]) &&
    obj["size"] >= 0 &&
    Array.isArray(obj["pois"]) &&
    isPOIArray(obj["pois"])
  );
}
