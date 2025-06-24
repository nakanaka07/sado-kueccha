/**
 * フィルタリング専用Webワーカー
 * 大量データの処理をメインスレッドから分離
 *
 * @description
 * - 大量POIデータのフィルタリング処理
 * - 統計計算処理
 * - メインスレッドのブロッキング防止
 *
 * @version 1.0.0
 * @since 2025-06-20
 */

import type { FilterState } from '../types/filter';
import type { POI } from '../types/poi';

interface FilterWorkerMessage {
  type: 'filter' | 'stats';
  payload: {
    pois: POI[];
    filterState: FilterState;
  };
}

interface FilterWorkerResponse {
  type: 'filter-result' | 'stats-result';
  payload: {
    filteredPois?: POI[];
    stats?: {
      totalCount: number;
      visibleCount: number;
      categoryStats: Record<string, number>;
      performanceMetrics: {
        processingTime: number;
        memoryUsage?: number;
      };
    };
  };
}

// フィルタリングロジック
function filterPOIs(pois: POI[], filterState: FilterState): POI[] {
  // const _startTime = performance.now(); // 開発時のみ使用

  const filterMap = {
    toilet: filterState.showToilets,
    parking: filterState.showParking,
    recommended: filterState.showRecommended,
    snack: filterState.showSnacks,
  };

  const result = pois.filter(poi => {
    if (!poi.sourceSheet) return true;

    const sheetName = poi.sourceSheet.toLowerCase();

    // 最適化されたフィルタリング: 早期リターン
    for (const [keyword, shouldShow] of Object.entries(filterMap)) {
      if (sheetName.includes(keyword) && !shouldShow) {
        return false;
      }
    }

    return true;
  });
  // const _endTime = performance.now(); // 開発時のみ使用
  if (process.env.NODE_ENV === 'development') {
    // パフォーマンス測定（開発環境のみ）
  }

  return result;
}

// 統計計算ロジック
function calculateStats(pois: POI[], filterState: FilterState) {
  const startTime = performance.now();

  const filteredPois = filterPOIs(pois, filterState);

  const categoryStats: Record<string, number> = {};

  filteredPois.forEach(poi => {
    if (poi.sourceSheet) {
      const category = poi.sourceSheet.toLowerCase();
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    }
  });

  const endTime = performance.now();

  return {
    totalCount: pois.length,
    visibleCount: filteredPois.length,
    categoryStats,
    performanceMetrics: {
      processingTime: endTime - startTime,
      memoryUsage: undefined, // Web Worker環境ではmemory APIは利用できない場合がある
    },
  };
}

// メッセージハンドラー
self.onmessage = (event: MessageEvent<FilterWorkerMessage>) => {
  const { type, payload } = event.data;
  const { pois, filterState } = payload;

  try {
    switch (type) {
      case 'filter': {
        const filteredPois = filterPOIs(pois, filterState);
        const response: FilterWorkerResponse = {
          type: 'filter-result',
          payload: { filteredPois },
        };
        self.postMessage(response);
        break;
      }

      case 'stats': {
        const stats = calculateStats(pois, filterState);
        const response: FilterWorkerResponse = {
          type: 'stats-result',
          payload: { stats },
        };
        self.postMessage(response);
        break;
      }

      default:
        if (process.env.NODE_ENV === 'development') {
          // 未知のメッセージタイプ（開発環境のみ）
        }
    }
  } catch (error) {
    console.error('[FilterWorker] Processing error:', error);
    // エラー応答を返す
    self.postMessage({
      type: 'error',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
};

// ワーカーの初期化完了を通知
self.postMessage({ type: 'ready', payload: {} });
