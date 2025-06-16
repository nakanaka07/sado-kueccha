/**
 * 地理計算ユーティリティ
 */

import { GEO_DISTANCE_THRESHOLDS, ZOOM_CONSTANTS } from "../constants";
import type { Coordinates, PositionObject } from "../types/common";

/**
 * 地理計算に関するユーティリティ関数群
 */
export const GeoUtils = {
  /**
   * 2点間の距離の2乗を計算（パフォーマンス最適化用）
   * 平方根計算を避けることで高速化
   */
  getDistanceSquared(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat1 - lat2;
    const lngDiff = lng1 - lng2;
    return latDiff * latDiff + lngDiff * lngDiff;
  },

  /**
   * 2点間の距離を計算（度単位）
   */
  getDistanceDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return Math.sqrt(this.getDistanceSquared(lat1, lng1, lat2, lng2));
  },

  /**
   * ズームレベルに基づいてクラスタリング距離を計算
   */
  getClusteringDistance(zoomLevel: number): number {
    // クラスタリング距離を大きくして、より積極的にクラスターを作成
    const baseDistance = ZOOM_CONSTANTS.BASE_DISTANCE * 2; // 基本距離を2倍に
    return Math.max(
      GEO_DISTANCE_THRESHOLDS.MIN_CLUSTERING * 2, // 最小クラスタリング距離も2倍に
      baseDistance / Math.pow(2, zoomLevel - ZOOM_CONSTANTS.BASE_ZOOM_LEVEL),
    );
  },

  /**
   * ポイントが境界内にあるかチェック
   */
  isInBounds(lat: number, lng: number, bounds: google.maps.LatLngBounds | null): boolean {
    if (!bounds) return true;
    return bounds.contains({ lat, lng });
  },

  /**
   * 2つの位置が指定した閾値内で近いかどうかを判定
   */
  arePositionsClose(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    threshold: number = GEO_DISTANCE_THRESHOLDS.VERY_CLOSE,
  ): boolean {
    return this.getDistanceSquared(lat1, lng1, lat2, lng2) < threshold * threshold;
  },

  /**
   * 座標オブジェクトベースの距離判定
   */
  areCoordinatesClose(
    coord1: Coordinates,
    coord2: Coordinates,
    threshold: number = GEO_DISTANCE_THRESHOLDS.VERY_CLOSE,
  ): boolean {
    return this.arePositionsClose(coord1.lat, coord1.lng, coord2.lat, coord2.lng, threshold);
  },

  /**
   * 同一または近い位置にあるマーカーにオフセットを適用
   */
  applyOffsetsForCloseMarkers<T extends PositionObject>(
    pois: T[],
    offsetDistance: number = GEO_DISTANCE_THRESHOLDS.MARKER_OFFSET,
  ): T[] {
    const result = [...pois];
    const processed = new Set<number>();

    for (let i = 0; i < result.length; i++) {
      if (processed.has(i)) continue;

      const currentPoi = result[i];
      if (!currentPoi) continue;

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
   * 指定したマーカーの近くにある他のマーカーのインデックスを取得
   * @private
   */
  findCloseMarkers(pois: PositionObject[], targetIndex: number, processed: Set<number>): number[] {
    const targetPoi = pois[targetIndex];
    if (!targetPoi) return [];

    const closeMarkers: number[] = [targetIndex];

    for (let j = targetIndex + 1; j < pois.length; j++) {
      if (processed.has(j)) continue;

      const otherPoi = pois[j];
      if (!otherPoi) continue;

      if (this.areCoordinatesClose(targetPoi.position, otherPoi.position)) {
        closeMarkers.push(j);
      }
    }

    return closeMarkers;
  },

  /**
   * マーカーに円形オフセットを適用
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
      if (!targetPoi) return;

      const angle = (2 * Math.PI * arrayIndex) / indices.length;
      const offsetLat = offsetDistance * Math.cos(angle);
      const offsetLng = offsetDistance * Math.sin(angle);

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
} as const;
