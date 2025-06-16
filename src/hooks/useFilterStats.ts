import { useMemo } from "react";
import type { FilterState, FilterStats, POI } from "../types";

/**
 * フィルターの統計情報を計算するカスタムフック
 */
export const useFilterStats = (pois: POI[], filterState: FilterState): FilterStats => {
  return useMemo((): FilterStats => {
    const visibleCount = pois.filter(() => {
      return (
        filterState.showRecommended ||
        filterState.showRyotsuAikawa ||
        filterState.showKanaiSawada ||
        filterState.showAkadomariHamochi
      );
    }).length;

    return {
      total: pois.length,
      visible: visibleCount,
      hidden: pois.length - visibleCount,
      sheetStats: {},
      visibleSheetStats: {},
    };
  }, [pois, filterState]);
};
