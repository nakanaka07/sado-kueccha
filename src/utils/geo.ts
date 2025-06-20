/**
 * 🌍 地理計算ユーティリティ（高性能・高精度版）
 * 最新のベストプラクティスに基づいた地理計算システム
 */

import { DISTANCE_THRESHOLDS, ZOOM_CONSTANTS } from "../constants";
import type { Coordinates, PositionObject } from "../types";

/**
 * 地理計算の定数（高精度版）
 */
const GEO_CONSTANTS = {
  EARTH_RADIUS_KM: 6371.0088, // 地球の半径（平均値・高精度）
  DEGREES_TO_RADIANS: Math.PI / 180,
  RADIANS_TO_DEGREES: 180 / Math.PI,
  METERS_PER_DEGREE_AT_EQUATOR: 111320, // 赤道での1度あたりのメートル数
} as const;

/**
 * 🧮 地理計算に関するユーティリティ関数群（強化版）
 */
export const GeoUtils = {
  /**
   * 🚀 2点間の距離の2乗を計算（パフォーマンス最適化用）
   * 平方根計算を避けることで高速化
   * @param lat1 - 地点1の緯度
   * @param lng1 - 地点1の経度
   * @param lat2 - 地点2の緯度
   * @param lng2 - 地点2の経度
   * @returns 距離の2乗
   */
  getDistanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return latDiff * latDiff + lngDiff * lngDiff;
  },

  /**
   * 📏 2点間の距離を計算（度単位・高速版）
   * @param lat1 - 地点1の緯度
   * @param lng1 - 地点1の経度
   * @param lat2 - 地点2の緯度
   * @param lng2 - 地点2の経度
   * @returns 距離（度単位）
   */
  getDistanceDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(this.getDistanceSquared(lat1, lng1, lat2, lng2));
  },

  /**
   * 🌍 2点間の実際の距離を計算（ハーバーサイン公式・高精度版）
   * @param lat1 - 地点1の緯度
   * @param lng1 - 地点1の経度
   * @param lat2 - 地点2の緯度
   * @param lng2 - 地点2の経度
   * @returns 距離（メートル）
   */
  getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = (lat2 - lat1) * GEO_CONSTANTS.DEGREES_TO_RADIANS;
    const dLng = (lng2 - lng1) * GEO_CONSTANTS.DEGREES_TO_RADIANS;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * GEO_CONSTANTS.DEGREES_TO_RADIANS) *
        Math.cos(lat2 * GEO_CONSTANTS.DEGREES_TO_RADIANS) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return GEO_CONSTANTS.EARTH_RADIUS_KM * c * 1000; // メートルに変換
  },

  /**
   * 🔍 ズームレベルに基づいてクラスタリング距離を計算（最適化版）
   * @param zoomLevel - ズームレベル
   * @returns クラスタリング距離
   */
  getClusteringDistance(zoomLevel: number): number {
    // 動的調整係数でより細かい制御
    const adjustmentFactor = Math.max(1.5, Math.min(3.0, 20 - zoomLevel) / 5);
    const baseDistance = ZOOM_CONSTANTS.BASE_DISTANCE * adjustmentFactor;

    return Math.max(
      DISTANCE_THRESHOLDS.CLUSTERING.MIN_DISTANCE * adjustmentFactor,
      baseDistance / Math.pow(2, zoomLevel - ZOOM_CONSTANTS.BASE_ZOOM_LEVEL),
    );
  },

  /**
   * 🎯 ポイントが境界内にあるかチェック（null安全版）
   * @param lat - 緯度
   * @param lng - 経度
   * @param bounds - 境界オブジェクト
   * @returns 境界内の場合true
   */
  isInBounds(lat: number, lng: number, bounds: google.maps.LatLngBounds | null): boolean {
    if (!bounds || !Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    return bounds.contains({ lat, lng });
  },

  /**
   * ✅ 2つの位置が指定した閾値内で近いかどうかを判定（高精度版）
   * @param lat1 - 地点1の緯度
   * @param lng1 - 地点1の経度
   * @param lat2 - 地点2の緯度
   * @param lng2 - 地点2の経度
   * @param threshold - 閾値（度単位）
   * @returns 近い場合true
   */
  arePositionsClose(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    threshold: number = DISTANCE_THRESHOLDS.UI.VERY_CLOSE,
  ): boolean {
    // NaN や Infinity チェック
    const coords = [lat1, lng1, lat2, lng2];
    if (coords.some((coord) => !Number.isFinite(coord))) {
      return false;
    }

    return this.getDistanceSquared(lat1, lng1, lat2, lng2) < threshold * threshold;
  },

  /**
   * 📍 座標オブジェクトベースの距離判定（型安全版）
   * @param coord1 - 座標1
   * @param coord2 - 座標2
   * @param threshold - 閾値
   * @returns 近い場合true
   */
  areCoordinatesClose(
    coord1: Coordinates,
    coord2: Coordinates,
    threshold: number = DISTANCE_THRESHOLDS.UI.VERY_CLOSE,
  ): boolean {
    return this.arePositionsClose(coord1.lat, coord1.lng, coord2.lat, coord2.lng, threshold);
  },

  /**
   * 🎨 同一または近い位置にあるマーカーにオフセットを適用（最適化版）
   * @param pois - POI配列
   * @param offsetDistance - オフセット距離
   * @returns オフセット適用済みPOI配列
   */
  applyOffsetsForCloseMarkers<T extends PositionObject>(
    pois: T[],
    offsetDistance: number = DISTANCE_THRESHOLDS.UI.MARKER_OFFSET,
  ): T[] {
    if (pois.length <= 1) return [...pois];

    const result = [...pois];
    const processed = new Set<number>();

    for (let i = 0; i < result.length; i++) {
      if (processed.has(i)) continue;

      const currentPoi = result[i];
      if (!currentPoi?.position) continue;

      const closeMarkerIndices = this.findCloseMarkers(result, i, processed);

      if (closeMarkerIndices.length > 1) {
        this.applyCircularOffsets(result, closeMarkerIndices, offsetDistance);
        closeMarkerIndices.forEach((index) => processed.add(index));
      } else {
        processed.add(i);
      }
    }

    return result;
  },

  /**
   * 🔍 指定したマーカーの近くにある他のマーカーのインデックスを取得（最適化版）
   * @param pois - POI配列
   * @param targetIndex - 対象インデックス
   * @param processed - 処理済みインデックスのSet
   * @returns 近いマーカーのインデックス配列
   * @private
   */
  findCloseMarkers(pois: PositionObject[], targetIndex: number, processed: Set<number>): number[] {
    const targetPoi = pois[targetIndex];
    if (!targetPoi?.position) return [];

    const closeMarkers: number[] = [targetIndex];

    for (let j = targetIndex + 1; j < pois.length; j++) {
      if (processed.has(j)) continue;

      const otherPoi = pois[j];
      if (!otherPoi?.position) continue;

      if (this.areCoordinatesClose(targetPoi.position, otherPoi.position)) {
        closeMarkers.push(j);
      }
    }

    return closeMarkers;
  },

  /**
   * 🎯 マーカーに円形オフセットを適用（改良版）
   * @param pois - POI配列
   * @param indices - オフセット対象のインデックス配列
   * @param offsetDistance - オフセット距離
   * @returns オフセット適用済みPOI配列
   * @private
   */
  applyCircularOffsets<T extends PositionObject>(
    pois: T[],
    indices: number[],
    offsetDistance: number,
  ): T[] {
    indices.forEach((index, arrayIndex) => {
      if (arrayIndex === 0) return; // 最初のマーカーは元の位置のまま

      const targetPoi = pois[index];
      if (!targetPoi?.position) return;

      const angle = (2 * Math.PI * arrayIndex) / indices.length;
      const offsetLat = offsetDistance * Math.cos(angle);
      const offsetLng = offsetDistance * Math.sin(angle);

      // 不変性を保つため新しいオブジェクトを作成
      pois[index] = {
        ...targetPoi,
        position: {
          lat: targetPoi.position.lat + offsetLat,
          lng: targetPoi.position.lng + offsetLng,
        },
      } as T;
    });

    return pois;
  },

  /**
   * 🧭 方位角を計算（新機能）
   * @param lat1 - 地点1の緯度
   * @param lng1 - 地点1の経度
   * @param lat2 - 地点2の緯度
   * @param lng2 - 地点2の経度
   * @returns 方位角（度、0-360）
   */
  getBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * GEO_CONSTANTS.DEGREES_TO_RADIANS;
    const lat1Rad = lat1 * GEO_CONSTANTS.DEGREES_TO_RADIANS;
    const lat2Rad = lat2 * GEO_CONSTANTS.DEGREES_TO_RADIANS;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * GEO_CONSTANTS.RADIANS_TO_DEGREES;
    return (bearing + 360) % 360;
  },

  /**
   * 📦 境界ボックスを計算（新機能）
   * @param positions - 座標配列
   * @returns 境界ボックス
   */
  getBoundingBox(positions: Coordinates[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null {
    if (positions.length === 0) return null;

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    for (const pos of positions) {
      if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) continue;

      north = Math.max(north, pos.lat);
      south = Math.min(south, pos.lat);
      east = Math.max(east, pos.lng);
      west = Math.min(west, pos.lng);
    }

    return { north, south, east, west };
  },

  /**
   * 📏 座標配列の中心点を計算（新機能）
   * @param positions - 座標配列
   * @returns 中心座標
   */
  getCenterPoint(positions: Coordinates[]): Coordinates | null {
    if (positions.length === 0) return null;

    const validPositions = positions.filter(
      (pos) => Number.isFinite(pos.lat) && Number.isFinite(pos.lng),
    );

    if (validPositions.length === 0) return null;

    const sum = validPositions.reduce(
      (acc, pos) => ({
        lat: acc.lat + pos.lat,
        lng: acc.lng + pos.lng,
      }),
      { lat: 0, lng: 0 },
    );

    return {
      lat: sum.lat / validPositions.length,
      lng: sum.lng / validPositions.length,
    };
  },

  /**
   * 🎯 適切なズームレベルを計算（新機能）
   * @param positions - 座標配列
   * @param containerWidth - コンテナ幅（ピクセル）
   * @param containerHeight - コンテナ高さ（ピクセル）
   * @returns 適切なズームレベル
   */
  calculateOptimalZoom(
    positions: Coordinates[],
    containerWidth: number,
    containerHeight: number,
  ): number {
    const bounds = this.getBoundingBox(positions);
    if (!bounds) return ZOOM_CONSTANTS.BASE_ZOOM_LEVEL;

    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;

    // パディングを考慮した調整
    const padding = 0.1; // 10%のパディング
    const adjustedLatDiff = latDiff * (1 + padding);
    const adjustedLngDiff = lngDiff * (1 + padding);

    // 緯度と経度の差からズームレベルを計算
    const latZoom = Math.log2(
      containerHeight / ((adjustedLatDiff * GEO_CONSTANTS.METERS_PER_DEGREE_AT_EQUATOR) / 256),
    );
    const lngZoom = Math.log2(
      containerWidth / ((adjustedLngDiff * GEO_CONSTANTS.METERS_PER_DEGREE_AT_EQUATOR) / 256),
    );

    return Math.max(1, Math.min(20, Math.floor(Math.min(latZoom, lngZoom))));
  },
} as const;
