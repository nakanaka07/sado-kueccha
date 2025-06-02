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

  /**
   * 2つの位置が非常に近いかどうかを判定
   * @param lat1 緯度1
   * @param lng1 経度1
   * @param lat2 緯度2
   * @param lng2 経度2
   * @param threshold 閾値（度単位、デフォルト: 0.0001 ≈ 11m）
   * @returns 非常に近い場合true
   */
  arePositionsVeryClose(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    threshold: number = 0.0001,
  ): boolean {
    return this.getDistanceSquared(lat1, lng1, lat2, lng2) < threshold * threshold;
  },

  /**
   * 同一または非常に近い位置にあるマーカーにオフセットを適用
   * @param pois POI配列
   * @param offsetDistance オフセット距離（度単位、デフォルト: 0.0002 ≈ 22m）
   * @returns オフセット適用後のPOI配列
   */
  applyOffsetsForCloseMarkers<T extends { position: { lat: number; lng: number } }>(
    pois: T[],
    offsetDistance: number = 0.0002,
  ): T[] {
    const result = [...pois];
    const processed = new Set<number>();

    for (let i = 0; i < result.length; i++) {
      if (processed.has(i)) continue;

      const currentPoi = result[i];
      if (!currentPoi) continue;

      const closeMarkers: number[] = [i];

      // 同じまたは非常に近い位置のマーカーを見つける
      for (let j = i + 1; j < result.length; j++) {
        if (processed.has(j)) continue;

        const otherPoi = result[j];
        if (!otherPoi) continue;

        if (
          this.arePositionsVeryClose(
            currentPoi.position.lat,
            currentPoi.position.lng,
            otherPoi.position.lat,
            otherPoi.position.lng,
          )
        ) {
          closeMarkers.push(j);
        }
      }

      // 近いマーカーが複数ある場合、オフセットを適用
      if (closeMarkers.length > 1) {
        closeMarkers.forEach((index, arrayIndex) => {
          processed.add(index);

          if (arrayIndex > 0) {
            // 最初のマーカーは元の位置のまま
            const targetPoi = result[index];
            if (!targetPoi) return;

            const angle = (2 * Math.PI * arrayIndex) / closeMarkers.length;
            const offsetLat = offsetDistance * Math.cos(angle);
            const offsetLng = offsetDistance * Math.sin(angle);

            result[index] = {
              ...targetPoi,
              position: {
                lat: targetPoi.position.lat + offsetLat,
                lng: targetPoi.position.lng + offsetLng,
              },
            } as T;
          }
        });
      } else {
        processed.add(i);
      }
    }

    return result;
  },
} as const;
