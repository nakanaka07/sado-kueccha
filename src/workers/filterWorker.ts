/**
 * フィルタリング専用Webワーカー (現在未使用)
 * 大量データの処理をメインスレッドから分離
 *
 * @description
 * 🚧 現在このWorkerは使用されていません。
 * React 18のConcurrent Features (useDeferredValue, startTransition) により、
 * メインスレッドでの処理で十分なパフォーマンスが得られているため。
 *
 * 将来的に非常に大量のデータ (10,000+ POI) を扱う場合に
 * 再度有効化を検討する可能性があります。
 *
 * 現在の最適化:
 * - FilterPanel.tsx での useDeferredValue による遅延処理
 * - useMemo による効率的なフィルタリング
 * - バッチレンダリングによる段階的表示
 *
 * @version 1.0.0 (未使用)
 * @since 2025-06-20
 * @deprecated React 18最適化により現在未使用
 */

import type { FilterState } from '../types/filter';
import type { POI } from '../types/poi';

interface FilterWorkerMessage {
  type: 'filter' | 'stats' | 'process';
  requestId?: string;
  payload: {
    pois: POI[];
    filterState: FilterState;
  };
}

interface FilterWorkerResponse {
  type: 'filter-result' | 'stats-result' | 'process-result' | 'error' | 'ready';
  requestId?: string;
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
    error?: string;
  };
}

// フィルタリングロジック
function filterPOIs(pois: POI[], filterState: FilterState): POI[] {
  const startTime = performance.now();

  const filterMap = {
    toilet: filterState.showToilets,
    parking: filterState.showParking,
    recommended: filterState.showRecommended,
    snack: filterState.showSnacks,
  };

  // 地域フィルター対応
  const regionFilterMap = {
    ryotsu_aikawa: filterState.showRyotsuAikawa,
    kanai_sawada: filterState.showKanaiSawada,
    akadomari_hamochi: filterState.showAkadomariHamochi,
  };

  const result = pois.filter(poi => {
    if (!poi.sourceSheet) return true;

    const sheetName = poi.sourceSheet.toLowerCase();

    // 施設タイプフィルタリング: 早期リターン
    for (const [keyword, shouldShow] of Object.entries(filterMap)) {
      if (sheetName.includes(keyword) && !shouldShow) {
        return false;
      }
    }

    // 地域フィルタリング
    for (const [regionKeyword, shouldShow] of Object.entries(regionFilterMap)) {
      if (sheetName.includes(regionKeyword) && !shouldShow) {
        return false;
      }
    }

    return true;
  });

  const endTime = performance.now();

  if (process.env.NODE_ENV === 'development') {
    // パフォーマンス測定（開発環境のみ）
    const processingTime = endTime - startTime;
    if (processingTime > 10) {
      console.warn(
        `[FilterWorker] フィルタリング処理時間: ${processingTime.toFixed(2)}ms (${pois.length}件 → ${result.length}件)`
      );
    }
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
  const processingTime = endTime - startTime;

  // Web Worker環境でのメモリ使用量測定の試行
  let memoryUsage: number | undefined;
  try {
    // Web Worker環境でもperformance.memoryが利用可能な場合がある
    if ('memory' in performance && performance.memory) {
      const memory = performance.memory as {
        usedJSHeapSize?: number;
      };
      memoryUsage = memory.usedJSHeapSize;
    }
  } catch {
    // メモリAPIが利用できない場合は無視
    memoryUsage = undefined;
  }

  return {
    totalCount: pois.length,
    visibleCount: filteredPois.length,
    categoryStats,
    performanceMetrics: {
      processingTime,
      memoryUsage,
    },
  };
}

// メッセージハンドラー
self.onmessage = (event: MessageEvent<FilterWorkerMessage>) => {
  const { type, payload, requestId } = event.data;
  const { pois, filterState } = payload;

  try {
    switch (type) {
      case 'filter': {
        const filteredPois = filterPOIs(pois, filterState);
        const response: FilterWorkerResponse = {
          type: 'filter-result',
          requestId,
          payload: { filteredPois },
        };
        self.postMessage(response);
        break;
      }

      case 'stats': {
        const stats = calculateStats(pois, filterState);
        const response: FilterWorkerResponse = {
          type: 'stats-result',
          requestId,
          payload: { stats },
        };
        self.postMessage(response);
        break;
      }

      case 'process': {
        // フィルタリングと統計計算を同時実行
        const filteredPois = filterPOIs(pois, filterState);
        const stats = calculateStats(pois, filterState);
        const response: FilterWorkerResponse = {
          type: 'process-result',
          requestId,
          payload: { filteredPois, stats },
        };
        self.postMessage(response);
        break;
      }

      default: {
        const unknownType = type as string;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[FilterWorker] 未知のメッセージタイプ: ${unknownType}`);
        }
        const errorResponse: FilterWorkerResponse = {
          type: 'error',
          requestId,
          payload: { error: `未対応のメッセージタイプ: ${unknownType}` },
        };
        self.postMessage(errorResponse);
        break;
      }
    }
  } catch (error) {
    console.error('[FilterWorker] Processing error:', error);
    // エラー応答を返す
    const errorResponse: FilterWorkerResponse = {
      type: 'error',
      requestId,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
    self.postMessage(errorResponse);
  }
};

// ワーカーの初期化完了を通知
const readyResponse: FilterWorkerResponse = {
  type: 'ready',
  payload: {},
};
self.postMessage(readyResponse);
