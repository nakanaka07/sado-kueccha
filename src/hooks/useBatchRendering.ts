/**
 * 高性能バッチレンダリングフック
 * React 18+ Concurrent Features を活用した段階的レンダリング
 *
 * @description
 * - Scheduler.postTask による優先度制御
 * - ビューポートベースの可視性判定
 * - メモリ効率的なバッチ処理
 * - フレームドロップ防止機能
 *
 * @version 2.0.0
 * @since 2025-06-20
 */

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { POI } from '../types/poi';

interface BatchRenderingOptions {
  /** 全POIデータ */
  allPois: POI[];
  /** バッチサイズ（デフォルト: 20） */
  batchSize?: number;
  /** フレーム予算（ミリ秒、デフォルト: 5ms） */
  frameBudget?: number;
  /** 優先度フィルター */
  priorityFilter?: (poi: POI) => boolean;
  /** ビューポート判定関数 */
  isInViewport?: (poi: POI) => boolean;
  /** 無効化フラグ */
  disabled?: boolean;
  /** 最大同時レンダリング数 */
  maxConcurrent?: number;
}

interface BatchRenderingResult {
  /** レンダリング済みPOI */
  renderedPois: POI[];
  /** 処理進捗（0-1） */
  progress: number;
  /** 完了フラグ */
  isComplete: boolean;
  /** ローディング状態 */
  isLoading: boolean;
  /** 強制完了 */
  forceComplete: () => void;
  /** リセット */
  reset: () => void;
  /** パフォーマンス統計 */
  stats: {
    processedCount: number;
    totalFrames: number;
    averageFrameTime: number;
  };
}

export function useBatchRendering(
  options: BatchRenderingOptions
): BatchRenderingResult {
  const {
    allPois,
    batchSize = 20,
    frameBudget = 5,
    priorityFilter,
    isInViewport,
    disabled = false,
    maxConcurrent = 1000,
  } = options;

  const [renderedPois, setRenderedPois] = useState<POI[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    processedCount: 0,
    totalFrames: 0,
    averageFrameTime: 0,
  });

  const schedulerRef = useRef<number | null>(null);
  const frameTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // 優先度つきPOIリストをメモ化
  const prioritizedPois = useMemo(() => {
    if (disabled) return allPois.slice(0, maxConcurrent);

    let sorted = [...allPois];

    // 優先度ソート
    if (priorityFilter) {
      sorted = sorted.sort((a, b) => {
        const aPriority = priorityFilter(a) ? 2 : 0;
        const bPriority = priorityFilter(b) ? 2 : 0;
        return bPriority - aPriority;
      });
    }

    // ビューポート内優先
    if (isInViewport) {
      sorted = sorted.sort((a, b) => {
        const aVisible = isInViewport(a) ? 1 : 0;
        const bVisible = isInViewport(b) ? 1 : 0;
        return bVisible - aVisible;
      });
    }

    return sorted.slice(0, maxConcurrent);
  }, [allPois, priorityFilter, isInViewport, disabled, maxConcurrent]);

  // 進捗計算
  const progress = useMemo(() => {
    if (prioritizedPois.length === 0) return 1;
    return Math.min(currentIndex / prioritizedPois.length, 1);
  }, [currentIndex, prioritizedPois.length]);

  const isComplete = progress >= 1;

  // バッチレンダリング処理
  const processBatch = useCallback(() => {
    if (currentIndex >= prioritizedPois.length) {
      setIsLoading(false);
      return;
    }

    const frameStart = performance.now();
    startTimeRef.current = frameStart;

    const processBatchRecursive = () => {
      const now = performance.now();
      const elapsed = now - frameStart;

      // フレーム予算を超過した場合は次のフレームへ
      if (elapsed >= frameBudget) {
        schedulerRef.current = requestIdleCallback(
          () => {
            processBatch();
          },
          { timeout: 16 }
        );
        return;
      }

      const endIndex = Math.min(
        currentIndex + batchSize,
        prioritizedPois.length
      );

      const newBatch = prioritizedPois.slice(currentIndex, endIndex);

      // React 18 startTransition で非緊急更新として処理
      startTransition(() => {
        setRenderedPois(prev => [...prev, ...newBatch]);
        setCurrentIndex(endIndex);

        // 統計更新
        const frameTime = performance.now() - frameStart;
        frameTimesRef.current.push(frameTime);

        setStats(prev => ({
          processedCount: endIndex,
          totalFrames: prev.totalFrames + 1,
          averageFrameTime:
            frameTimesRef.current.reduce((a, b) => a + b, 0) /
            frameTimesRef.current.length,
        }));
      });

      // 次のバッチを処理
      if (endIndex < prioritizedPois.length) {
        // 可能であればrequestIdleCallbackを使用
        if ('requestIdleCallback' in window) {
          schedulerRef.current = requestIdleCallback(
            () => {
              processBatch();
            },
            { timeout: 16 }
          );
        } else {
          // フォールバック: setTimeout
          schedulerRef.current = setTimeout(() => {
            processBatch();
          }, 0) as unknown as number;
        }
      } else {
        setIsLoading(false);
      }
    };

    processBatchRecursive();
  }, [currentIndex, prioritizedPois, batchSize, frameBudget]);

  // 強制完了
  const forceComplete = useCallback(() => {
    if (schedulerRef.current) {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(schedulerRef.current);
      } else {
        clearTimeout(schedulerRef.current);
      }
      schedulerRef.current = null;
    }

    startTransition(() => {
      setRenderedPois(prioritizedPois);
      setCurrentIndex(prioritizedPois.length);
      setIsLoading(false);
    });
  }, [prioritizedPois]);

  // リセット
  const reset = useCallback(() => {
    if (schedulerRef.current) {
      if ('cancelIdleCallback' in window) {
        cancelIdleCallback(schedulerRef.current);
      } else {
        clearTimeout(schedulerRef.current);
      }
      schedulerRef.current = null;
    }

    startTransition(() => {
      setRenderedPois([]);
      setCurrentIndex(0);
      setIsLoading(false);
      setStats({
        processedCount: 0,
        totalFrames: 0,
        averageFrameTime: 0,
      });
    });

    frameTimesRef.current = [];
  }, []);

  // POIデータ変更時の処理
  useEffect(() => {
    reset();

    if (prioritizedPois.length > 0 && !disabled) {
      setIsLoading(true);
      // 少し遅延してから開始（UI応答性確保）
      const timeoutId = setTimeout(() => {
        processBatch();
      }, 10);

      return () => {
        clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [prioritizedPois, disabled, reset, processBatch]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (schedulerRef.current) {
        if ('cancelIdleCallback' in window) {
          cancelIdleCallback(schedulerRef.current);
        } else {
          clearTimeout(schedulerRef.current);
        }
      }
    };
  }, []);

  return {
    renderedPois,
    progress,
    isComplete,
    isLoading,
    forceComplete,
    reset,
    stats,
  };
}
