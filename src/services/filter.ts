/**
 * フィルター機能の管理サービス
 */

import type { FilterState } from "../types/filter";
import type { POI } from "../types/google-maps";

export const FilterService = {
  /**
   * デフォルトのフィルター状態を取得
   */
  getDefaultState(): FilterState {
    return this.applyPreset("default");
  },

  /**
   * フィルター状態に基づいてPOIをフィルタリング
   */
  filterPOIs(pois: POI[], filterState: FilterState): POI[] {
    return pois.filter((poi) => {
      // ソースシートが不明な場合はデフォルトで表示
      if (!poi.sourceSheet) {
        return true;
      }

      // シート名に基づいてフィルタリング
      const filterKey = this.getFilterKeyFromSheet(poi.sourceSheet);
      if (!filterKey) {
        // マッピングにないシートはデフォルトで表示
        return true;
      }

      return filterState[filterKey];
    });
  },
  /**
   * シート名からフィルターキーを取得
   */
  getFilterKeyFromSheet(sheetName: string): keyof FilterState | null {
    // 環境変数に基づいたマッピング
    const mapping: Record<string, keyof FilterState> = {
      toilet: "showToilets",
      parking: "showParking",
      recommended: "showRecommended",
      ryotsu_aikawa: "showRyotsuAikawa",
      kanai_sawada: "showKanaiSawada",
      akadomari_hamochi: "showAkadomariHamochi",
      snack: "showSnacks",
    };

    return mapping[sheetName] || null;
  },

  /**
   * フィルター状態の統計情報を取得
   */
  getFilterStats(pois: POI[], filterState: FilterState): FilterStats {
    const total = pois.length;
    const filtered = this.filterPOIs(pois, filterState);
    const visible = filtered.length;
    const hidden = total - visible;

    // シート別の統計
    const sheetStats: Record<string, number> = {};
    pois.forEach((poi) => {
      if (poi.sourceSheet) {
        sheetStats[poi.sourceSheet] = (sheetStats[poi.sourceSheet] || 0) + 1;
      }
    });

    // フィルタリング後の統計
    const visibleSheetStats: Record<string, number> = {};
    filtered.forEach((poi) => {
      if (poi.sourceSheet) {
        visibleSheetStats[poi.sourceSheet] = (visibleSheetStats[poi.sourceSheet] || 0) + 1;
      }
    });

    return {
      total,
      visible,
      hidden,
      sheetStats,
      visibleSheetStats,
    };
  },

  /**
   * プリセットフィルターを適用
   */
  applyPreset(preset: FilterPreset): FilterState {
    switch (preset) {
      case "all":
        return {
          showToilets: true,
          showParking: true,
          showRecommended: true,
          showRyotsuAikawa: true,
          showKanaiSawada: true,
          showAkadomariHamochi: true,
          showSnacks: true,
        };

      case "tourism":
        return {
          showToilets: false,
          showParking: false,
          showRecommended: true,
          showRyotsuAikawa: true,
          showKanaiSawada: true,
          showAkadomariHamochi: true,
          showSnacks: true,
        };

      case "facilities":
        return {
          showToilets: true,
          showParking: true,
          showRecommended: false,
          showRyotsuAikawa: false,
          showKanaiSawada: false,
          showAkadomariHamochi: false,
          showSnacks: false,
        };

      case "none":
        return {
          showToilets: false,
          showParking: false,
          showRecommended: false,
          showRyotsuAikawa: false,
          showKanaiSawada: false,
          showAkadomariHamochi: false,
          showSnacks: false,
        };

      default:
        return {
          showToilets: false,
          showParking: false,
          showRecommended: true,
          showRyotsuAikawa: true,
          showKanaiSawada: true,
          showAkadomariHamochi: true,
          showSnacks: true,
        };
    }
  },
};

// 統計情報の型定義
export interface FilterStats {
  total: number;
  visible: number;
  hidden: number;
  sheetStats: Record<string, number>;
  visibleSheetStats: Record<string, number>;
}

// プリセットフィルターの型定義
export type FilterPreset = "all" | "tourism" | "facilities" | "none" | "default";
