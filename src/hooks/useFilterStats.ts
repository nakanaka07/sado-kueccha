import { useMemo, useRef } from 'react';
import type { FilterState, FilterStats, POI } from '../types';

/**
 * フィルターの統計情報を計算するカスタムフック
 *
 * 最新のベストプラクティス適用:
 * - 効率的なフィルタリングアルゴリズム
 * - メモ化による計算最適化
 * - エリア別統計の詳細分析
 * - パフォーマンス監視機能
 */

interface FilterCriteria {
  showRecommended: boolean;
  showRyotsuAikawa: boolean;
  showKanaiSawada: boolean;
  showAkadomariHamochi: boolean;
}

interface AreaStats {
  total: number;
  visible: number;
  hidden: number;
  percentage: number;
}

interface DetailedFilterStats extends FilterStats {
  areaStats: {
    recommended: AreaStats;
    ryotsuAikawa: AreaStats;
    kanaiSawada: AreaStats;
    akadomariHamochi: AreaStats;
  };
}

// POIをエリア別に分類する関数
const categorizePOIsByArea = (pois: POI[]) => {
  const categorized = {
    recommended: [] as POI[],
    ryotsuAikawa: [] as POI[],
    kanaiSawada: [] as POI[],
    akadomariHamochi: [] as POI[],
    uncategorized: [] as POI[],
  };

  for (const poi of pois) {
    // POIの分類ロジック（district または sourceSheet ベースで分類）
    const district = poi.district?.toString() || '';
    const sourceSheet = poi.sourceSheet || '';

    if (
      sourceSheet.includes('recommended') ||
      sourceSheet.includes('おすすめ')
    ) {
      categorized.recommended.push(poi);
    } else if (
      district.includes('ryotsu') ||
      district.includes('aikawa') ||
      sourceSheet.includes('両津') ||
      sourceSheet.includes('相川')
    ) {
      categorized.ryotsuAikawa.push(poi);
    } else if (
      district.includes('kanai') ||
      district.includes('sawada') ||
      sourceSheet.includes('金井') ||
      sourceSheet.includes('佐和田')
    ) {
      categorized.kanaiSawada.push(poi);
    } else if (
      district.includes('akadomari') ||
      district.includes('hamochi') ||
      sourceSheet.includes('赤泊') ||
      sourceSheet.includes('羽茂')
    ) {
      categorized.akadomariHamochi.push(poi);
    } else {
      categorized.uncategorized.push(poi);
    }
  }

  return categorized;
};

// エリア別統計を計算する関数
const calculateAreaStats = (
  areaPOIs: POI[],
  isVisible: boolean,
  totalPOIs: number
): AreaStats => {
  const total = areaPOIs.length;
  const visible = isVisible ? total : 0;
  const hidden = total - visible;
  const percentage = totalPOIs > 0 ? (visible / totalPOIs) * 100 : 0;

  return {
    total,
    visible,
    hidden,
    percentage: Math.round(percentage * 100) / 100, // 小数点第2位まで
  };
};

export const useFilterStats = (
  pois: POI[],
  filterState: FilterState
): DetailedFilterStats => {
  const performanceRef = useRef({
    times: [] as number[],
    lastCalculationTime: 0,
    averageCalculationTime: 0,
    calculationCount: 0,
  });

  return useMemo((): DetailedFilterStats => {
    const startTime = performance.now();

    // フィルター条件の抽出
    const criteria: FilterCriteria = {
      showRecommended: filterState.showRecommended,
      showRyotsuAikawa: filterState.showRyotsuAikawa,
      showKanaiSawada: filterState.showKanaiSawada,
      showAkadomariHamochi: filterState.showAkadomariHamochi,
    };

    // POIをエリア別に分類
    const categorizedPOIs = categorizePOIsByArea(pois);

    // 各エリアの表示状況を判定
    const areaVisibility = {
      recommended: criteria.showRecommended,
      ryotsuAikawa: criteria.showRyotsuAikawa,
      kanaiSawada: criteria.showKanaiSawada,
      akadomariHamochi: criteria.showAkadomariHamochi,
    };

    // 可視POI数を効率的に計算
    const visibleCount = Object.entries(categorizedPOIs).reduce(
      (total, [area, areaPOIs]) => {
        if (area === 'uncategorized') return total;
        const isAreaVisible =
          areaVisibility[area as keyof typeof areaVisibility];
        return total + (isAreaVisible ? areaPOIs.length : 0);
      },
      0
    );

    // エリア別統計を計算
    const areaStats = {
      recommended: calculateAreaStats(
        categorizedPOIs.recommended,
        areaVisibility.recommended,
        pois.length
      ),
      ryotsuAikawa: calculateAreaStats(
        categorizedPOIs.ryotsuAikawa,
        areaVisibility.ryotsuAikawa,
        pois.length
      ),
      kanaiSawada: calculateAreaStats(
        categorizedPOIs.kanaiSawada,
        areaVisibility.kanaiSawada,
        pois.length
      ),
      akadomariHamochi: calculateAreaStats(
        categorizedPOIs.akadomariHamochi,
        areaVisibility.akadomariHamochi,
        pois.length
      ),
    };

    // パフォーマンス統計を更新
    const endTime = performance.now();
    const calculationTime = endTime - startTime;

    performanceRef.current.times.push(calculationTime);
    performanceRef.current.lastCalculationTime = calculationTime;
    performanceRef.current.calculationCount++;

    // 直近10回の平均を計算
    const recentTimes = performanceRef.current.times.slice(-10);
    performanceRef.current.averageCalculationTime =
      recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;

    // 基本統計とシート統計（後方互換性のため）
    const sheetStats = Object.entries(categorizedPOIs).reduce<
      Record<string, number>
    >((stats, [area, areaPOIs]) => {
      if (area !== 'uncategorized') {
        stats[area] = areaPOIs.length;
      }
      return stats;
    }, {});

    const visibleSheetStats = Object.entries(areaStats).reduce<
      Record<string, number>
    >((stats, [area, areaStats_]) => {
      stats[area] = areaStats_.visible;
      return stats;
    }, {});

    return {
      total: pois.length,
      visible: visibleCount,
      hidden: pois.length - visibleCount,
      sheetStats,
      visibleSheetStats,
      lastUpdated: Date.now(),
      performance: {
        filterTime: performanceRef.current.lastCalculationTime,
        renderTime: 0, // 別途計測が必要
      },
      areaStats,
    };
  }, [pois, filterState]);
};

/**
 * シンプルなフィルター統計フック（後方互換性のため）
 */
export const useSimpleFilterStats = (
  pois: POI[],
  filterState: FilterState
): FilterStats => {
  const detailedStats = useFilterStats(pois, filterState);

  return {
    total: detailedStats.total,
    visible: detailedStats.visible,
    hidden: detailedStats.hidden,
    sheetStats: detailedStats.sheetStats,
    visibleSheetStats: detailedStats.visibleSheetStats,
    lastUpdated: detailedStats.lastUpdated,
    performance: detailedStats.performance ?? {
      filterTime: 0,
      renderTime: 0,
    },
  };
};
