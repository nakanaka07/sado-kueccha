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
    // recommended: おすすめの飲食店をピックアップしたデータ
    // ryotsu_aikawa: 両津・相川地区
    // kanai_sawada: 金井・佐和田・新穂・畑野・真野地区
    // akadomari_hamochi: 赤泊・羽茂・小木地区
    // snack: スナック営業している店舗
    // toilet: 公共トイレの位置情報
    // parking: 公共の駐車場
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

      case "gourmet":
        // グルメ中心の表示：一般的な飲食店のみを表示し、施設系とスナックは除外
        return {
          showToilets: false,
          showParking: false,
          showRecommended: true,
          showRyotsuAikawa: true,
          showKanaiSawada: true,
          showAkadomariHamochi: true,
          showSnacks: false, // スナックを除外
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

      case "nightlife":
        // ナイトライフ中心の表示：スナック営業店舗のみを表示
        return {
          showToilets: false,
          showParking: false,
          showRecommended: false,
          showRyotsuAikawa: false,
          showKanaiSawada: false,
          showAkadomariHamochi: false,
          showSnacks: true,
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
        // デフォルト状態：一般的な飲食店のみ表示、スナックと施設系は非表示
        return {
          showToilets: false,
          showParking: false,
          showRecommended: true,
          showRyotsuAikawa: true,
          showKanaiSawada: true,
          showAkadomariHamochi: true,
          showSnacks: false, // デフォルトでスナックは非表示
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
export type FilterPreset = "all" | "gourmet" | "facilities" | "nightlife" | "none" | "default";
