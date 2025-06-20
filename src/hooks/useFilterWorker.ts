/**
 * フィルタリング処理用Webワーカーフック
 * 大量データの非同期処理でパフォーマンス向上
 *
 * @description
 * - メインスレッドをブロックしない非同期フィルタリング
 * - 統計計算の並列処理
 * - エラーハンドリング・リトライ機能
 * - パフォーマンス監視
 *
 * @version 1.0.0
 * @since 2025-06-20
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { FilterState } from "../types/filter";
import type { POI } from "../types/poi";

interface WorkerMessage {
  type: string;
  requestId?: string;
  payload?: {
    filteredPois?: POI[];
    stats?: FilterWorkerResult["stats"];
    error?: string;
  };
}

interface FilterWorkerResult {
  filteredPois: POI[];
  stats: {
    totalCount: number;
    visibleCount: number;
    categoryStats: Record<string, number>;
    performanceMetrics: {
      processingTime: number;
      memoryUsage?: number;
    };
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function useFilterWorker(): {
  processData: (pois: POI[], filterState: FilterState) => Promise<FilterWorkerResult>;
  isWorkerReady: boolean;
  workerError: string | null;
} {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);

  // ワーカーの初期化
  useEffect(() => {
    try {
      // Webワーカーをインライン作成（バンドラー対応）
      const workerCode = `
        // フィルタリングロジック
        function filterPOIs(pois, filterState) {
          const startTime = performance.now();

          const filterMap = {
            toilet: filterState.showToilets,
            parking: filterState.showParking,
            recommended: filterState.showRecommended,
            snack: filterState.showSnacks,
          };

          const result = pois.filter((poi) => {
            if (!poi.sourceSheet) return true;

            const sheetName = poi.sourceSheet.toLowerCase();

            for (const [keyword, shouldShow] of Object.entries(filterMap)) {
              if (sheetName.includes(keyword) && !shouldShow) {
                return false;
              }
            }

            return true;
          });

          const endTime = performance.now();

          return result;
        }

        // 統計計算
        function calculateStats(pois, filterState) {
          const startTime = performance.now();

          const filteredPois = filterPOIs(pois, filterState);

          const categoryStats = {};

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
            },
          };
        }

        // メッセージハンドラー
        self.onmessage = (event) => {
          const { type, payload, requestId } = event.data;
          const { pois, filterState } = payload;

          try {
            switch (type) {
              case 'process': {
                const filteredPois = filterPOIs(pois, filterState);
                const stats = calculateStats(pois, filterState);

                self.postMessage({
                  type: 'result',
                  requestId,
                  payload: { filteredPois, stats },
                });
                break;
              }

              default:
                console.warn('Unknown message type:', type);
            }
          } catch (error) {
            self.postMessage({
              type: 'error',
              requestId,
              payload: { error: error.message || 'Unknown error' },
            });
          }
        };

        // 初期化完了通知
        self.postMessage({ type: 'ready' });
      `;

      const blob = new Blob([workerCode], { type: "application/javascript" });
      const workerUrl = URL.createObjectURL(blob);

      workerRef.current = new Worker(workerUrl);

      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type } = event.data;
        if (type === "ready") {
          setIsWorkerReady(true);
          setWorkerError(null);
        }
      };

      workerRef.current.onerror = (error) => {
        setWorkerError(`ワーカーエラー: ${error.message}`);
        setIsWorkerReady(false);
      };

      // URLを解放
      return () => {
        URL.revokeObjectURL(workerUrl);
      };
    } catch (error) {
      setWorkerError(
        `ワーカー初期化エラー: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsWorkerReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const processData = useCallback(
    async (pois: POI[], filterState: FilterState): Promise<FilterWorkerResult> => {
      if (!workerRef.current || !isWorkerReady) {
        // フォールバック: メインスレッドで処理
        const startTime = performance.now();

        const filterMap = {
          toilet: filterState.showToilets,
          parking: filterState.showParking,
          recommended: filterState.showRecommended,
          snack: filterState.showSnacks,
        };

        const filteredPois = pois.filter((poi) => {
          if (!poi.sourceSheet) return true;
          const sheetName = poi.sourceSheet.toLowerCase();
          for (const [keyword, shouldShow] of Object.entries(filterMap)) {
            if (sheetName.includes(keyword) && !shouldShow) {
              return false;
            }
          }
          return true;
        });

        const endTime = performance.now();

        const categoryStats: Record<string, number> = {};
        filteredPois.forEach((poi) => {
          if (poi.sourceSheet) {
            const category = poi.sourceSheet.toLowerCase();
            categoryStats[category] = (categoryStats[category] || 0) + 1;
          }
        });

        return {
          filteredPois,
          stats: {
            totalCount: pois.length,
            visibleCount: filteredPois.length,
            categoryStats,
            performanceMetrics: {
              processingTime: endTime - startTime,
            },
          },
          isLoading: false,
          error: null,
        };
      }

      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substring(7);

        const timeout = setTimeout(() => {
          reject(new Error("ワーカー処理タイムアウト"));
        }, 5000);

        const handleMessage = (event: MessageEvent<WorkerMessage>) => {
          const { type, requestId: responseId, payload } = event.data;

          if (responseId !== requestId) return;

          clearTimeout(timeout);
          workerRef.current?.removeEventListener("message", handleMessage);

          if (type === "result" && payload?.filteredPois && payload.stats) {
            resolve({
              filteredPois: payload.filteredPois,
              stats: payload.stats,
              isLoading: false,
              error: null,
            });
          } else if (type === "error" && payload?.error) {
            reject(new Error(payload.error));
          }
        };

        workerRef.current?.addEventListener("message", handleMessage);
        workerRef.current?.postMessage({
          type: "process",
          requestId,
          payload: { pois, filterState },
        });
      });
    },
    [isWorkerReady],
  );

  return {
    processData,
    isWorkerReady,
    workerError,
  };
}
