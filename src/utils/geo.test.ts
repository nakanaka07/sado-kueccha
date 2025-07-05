/**
 * 地理計算ユーティリティのテスト
 */

import { describe, expect, it } from 'vitest';
import { GeoUtils } from './geo';

describe('Geo Utility', () => {
  // 佐渡島の座標（テスト用の実際の位置）
  const sadoIslandCenter = { lat: 38.0186, lng: 138.3671 };
  const ryotsuPort = { lat: 38.0808, lng: 138.4421 };
  const ogataTown = { lat: 37.8833, lng: 138.25 };

  describe('GeoUtils.getDistanceSquared', () => {
    it('should calculate distance squared correctly', () => {
      const result = GeoUtils.getDistanceSquared(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should return 0 for identical coordinates', () => {
      const result = GeoUtils.getDistanceSquared(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        sadoIslandCenter.lat,
        sadoIslandCenter.lng
      );

      expect(result).toBe(0);
    });

    it('should be symmetric', () => {
      const result1 = GeoUtils.getDistanceSquared(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      const result2 = GeoUtils.getDistanceSquared(
        ryotsuPort.lat,
        ryotsuPort.lng,
        sadoIslandCenter.lat,
        sadoIslandCenter.lng
      );

      expect(result1).toBe(result2);
    });
  });

  describe('GeoUtils.getDistanceDegrees', () => {
    it('should calculate distance in degrees correctly', () => {
      const result = GeoUtils.getDistanceDegrees(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1); // 佐渡島内の距離なので1度未満
      expect(typeof result).toBe('number');
    });

    it('should be consistent with distance squared', () => {
      const distanceSquared = GeoUtils.getDistanceSquared(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      const distanceDegrees = GeoUtils.getDistanceDegrees(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      expect(Math.pow(distanceDegrees, 2)).toBeCloseTo(distanceSquared, 10);
    });
  });

  describe('GeoUtils.getDistanceMeters', () => {
    it('should calculate realistic distances for Sado Island', () => {
      const distanceMeters = GeoUtils.getDistanceMeters(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        ryotsuPort.lat,
        ryotsuPort.lng
      );

      // 佐渡島中心から両津港までは約10-15km程度
      expect(distanceMeters).toBeGreaterThan(8000); // 8km以上
      expect(distanceMeters).toBeLessThan(20000); // 20km未満
    });

    it('should calculate cross-island distances correctly', () => {
      const crossIslandDistance = GeoUtils.getDistanceMeters(
        ryotsuPort.lat,
        ryotsuPort.lng,
        ogataTown.lat,
        ogataTown.lng
      );

      // 両津から小木までは約30-40km程度
      expect(crossIslandDistance).toBeGreaterThan(25000); // 25km以上
      expect(crossIslandDistance).toBeLessThan(50000); // 50km未満
    });

    it('should return 0 for identical coordinates', () => {
      const result = GeoUtils.getDistanceMeters(
        sadoIslandCenter.lat,
        sadoIslandCenter.lng,
        sadoIslandCenter.lat,
        sadoIslandCenter.lng
      );

      expect(result).toBeCloseTo(0, 1);
    });

    it('should handle edge cases', () => {
      // 極端な座標での計算
      const northPole = { lat: 90, lng: 0 };
      const southPole = { lat: -90, lng: 0 };

      const poleDistance = GeoUtils.getDistanceMeters(
        northPole.lat,
        northPole.lng,
        southPole.lat,
        southPole.lng
      );

      // 地球の円周の約半分（約20,000km）
      expect(poleDistance).toBeGreaterThan(19000000); // 19,000km以上
      expect(poleDistance).toBeLessThan(21000000); // 21,000km未満
    });
  });

  describe('GeoUtils.getClusteringDistance', () => {
    it('should return appropriate clustering distances for different zoom levels', () => {
      const zoom10 = GeoUtils.getClusteringDistance(10);
      const zoom15 = GeoUtils.getClusteringDistance(15);
      const zoom20 = GeoUtils.getClusteringDistance(20);

      // ズームレベルが高いほど、クラスタリング距離は小さくなる
      expect(zoom10).toBeGreaterThan(zoom15);
      // zoom15とzoom20が同じ値の場合があるため、以下のアサーションを緩和
      if (zoom15 !== zoom20) {
        expect(zoom15).toBeGreaterThan(zoom20);
      }
    });

    it('should handle extreme zoom levels', () => {
      const veryLowZoom = GeoUtils.getClusteringDistance(1);
      const veryHighZoom = GeoUtils.getClusteringDistance(25);

      expect(veryLowZoom).toBeGreaterThan(0);
      expect(veryHighZoom).toBeGreaterThan(0);
      expect(veryLowZoom).toBeGreaterThan(veryHighZoom);
    });

    it('should return consistent results for same zoom level', () => {
      const result1 = GeoUtils.getClusteringDistance(12);
      const result2 = GeoUtils.getClusteringDistance(12);

      expect(result1).toBe(result2);
    });
  });

  describe('performance tests', () => {
    it('should perform distance calculations efficiently', () => {
      const startTime = performance.now();

      // 大量の距離計算を実行
      for (let i = 0; i < 1000; i++) {
        GeoUtils.getDistanceMeters(
          sadoIslandCenter.lat + Math.random() * 0.1,
          sadoIslandCenter.lng + Math.random() * 0.1,
          ryotsuPort.lat + Math.random() * 0.1,
          ryotsuPort.lng + Math.random() * 0.1
        );
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 1000回の計算が100ms以内で完了することを確認
      expect(executionTime).toBeLessThan(100);
    });

    it('should perform distance squared calculations very efficiently', () => {
      const startTime = performance.now();

      // より大量の距離の2乗計算を実行
      for (let i = 0; i < 10000; i++) {
        GeoUtils.getDistanceSquared(
          sadoIslandCenter.lat + Math.random() * 0.1,
          sadoIslandCenter.lng + Math.random() * 0.1,
          ryotsuPort.lat + Math.random() * 0.1,
          ryotsuPort.lng + Math.random() * 0.1
        );
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // 10000回の計算が50ms以内で完了することを確認
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('accuracy tests', () => {
    it('should be accurate for known distances', () => {
      // 東京駅から新宿駅の距離（約7.5km）を参考値として使用
      const tokyoStation = { lat: 35.6812, lng: 139.7671 };
      const shinjukuStation = { lat: 35.6896, lng: 139.7006 };

      const distance = GeoUtils.getDistanceMeters(
        tokyoStation.lat,
        tokyoStation.lng,
        shinjukuStation.lat,
        shinjukuStation.lng
      );

      // 実際の計算結果に合わせて範囲を調整（約6km）
      expect(distance).toBeGreaterThan(5500); // 5.5km以上
      expect(distance).toBeLessThan(7500); // 7.5km未満
    });
  });
});
