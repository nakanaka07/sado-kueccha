/**
 * インクリメンタルマーカーレンダリングフック
 * 大量のマーカーを段階的にレンダリングして性能を最適化
 *
 * @description
 * - 初期レンダリング時に重要なマーカーのみ表示
 * - requestIdleCallback を使用した非同期レンダリング
 * - ビューポート内のマーカーを優先表示
 * - バッチ処理による滑らかなUI更新
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { POI } from '../types/poi';

interface IncrementalRenderingOptions {
  /** 全POIデータ */
  allPois: POI[];
  /** 一度にレンダリングするバッチサイズ */
  batchSize?: number;
  /** レンダリング間隔（ミリ秒） */
  renderInterval?: number;
  /** 優先度の高いPOIのフィルタ関数 */
  priorityFilter?: (poi: POI) => boolean;
  /** ビューポート境界（地図の表示範囲） */
  viewport?: google.maps.LatLngBounds | null;
  /** 無効化フラグ */
  disabled?: boolean;
}

interface IncrementalRenderingResult {
  /** 現在レンダリングされているPOI */
  renderedPois: POI[];
  /** レンダリングが完了したかどうか */
  isComplete: boolean;
  /** レンダリング進行率（0-1） */
  progress: number;
  /** レンダリングを強制的に完了する関数 */
  forceComplete: () => void;
  /** レンダリングをリセットする関数 */
  reset: () => void;
  /** ローディング状態 */
  isLoading: boolean;
}

/**
 * インクリメンタルマーカーレンダリングフック
 */
export const useIncrementalMarkerRendering = (
  options: IncrementalRenderingOptions
): IncrementalRenderingResult => {
  const {
    allPois,
    batchSize = 50,
    renderInterval = 16, // 60FPS相当
    priorityFilter,
    viewport,
    disabled = false,
  } = options;

  const [renderedPois, setRenderedPois] = useState<POI[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const renderingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentBatchRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ビューポート内のPOIを判定
  const isInViewport = useCallback(
    (poi: POI): boolean => {
      if (!viewport) return true;
      return viewport.contains(
        new google.maps.LatLng(poi.position.lat, poi.position.lng)
      );
    },
    [viewport]
  );

  // POIを優先度順にソート
  const sortedPois = useCallback(() => {
    if (disabled) return allPois;

    const priority = [...allPois];

    // 優先度の高いPOI（おすすめマーカーなど）を最初に配置
    if (priorityFilter) {
      priority.sort((a, b) => {
        const aPriority = priorityFilter(a) ? 1 : 0;
        const bPriority = priorityFilter(b) ? 1 : 0;
        return bPriority - aPriority;
      });
    }

    // ビューポート内のマーカーを優先
    if (viewport) {
      priority.sort((a, b) => {
        const aInViewport = isInViewport(a) ? 1 : 0;
        const bInViewport = isInViewport(b) ? 1 : 0;
        return bInViewport - aInViewport;
      });
    }

    return priority;
  }, [allPois, priorityFilter, viewport, isInViewport, disabled]);

  // バッチレンダリングの実行
  const renderNextBatch = useCallback(() => {
    if (abortControllerRef.current?.signal.aborted) return;

    const sorted = sortedPois();
    const startIndex = currentBatchRef.current * batchSize;
    const endIndex = Math.min(startIndex + batchSize, sorted.length);

    if (startIndex >= sorted.length) {
      setIsComplete(true);
      setIsLoading(false);
      return;
    }

    const nextBatch = sorted.slice(0, endIndex);
    setRenderedPois(nextBatch);

    currentBatchRef.current += 1;

    // 次のバッチをスケジュール
    if (endIndex < sorted.length) {
      renderingTimeoutRef.current = setTimeout(() => {
        renderNextBatch();
      }, renderInterval);
    } else {
      setIsComplete(true);
      setIsLoading(false);
    }
  }, [sortedPois, batchSize, renderInterval]);

  // レンダリングの開始
  const startRendering = useCallback(() => {
    if (disabled) {
      setRenderedPois(allPois);
      setIsComplete(true);
      setIsLoading(false);
      return;
    }

    // 既存のレンダリングを中止
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (renderingTimeoutRef.current) {
      clearTimeout(renderingTimeoutRef.current);
    }

    // 新しいレンダリングセッションを開始
    abortControllerRef.current = new AbortController();
    currentBatchRef.current = 0;
    setIsComplete(false);
    setIsLoading(true);

    // 最初のバッチを即座にレンダリング
    const sorted = sortedPois();
    const initialBatch = sorted.slice(0, batchSize);
    setRenderedPois(initialBatch);

    if (sorted.length <= batchSize) {
      setIsComplete(true);
      setIsLoading(false);
    } else {
      currentBatchRef.current = 1;
      renderingTimeoutRef.current = setTimeout(() => {
        renderNextBatch();
      }, renderInterval);
    }
  }, [
    allPois,
    disabled,
    sortedPois,
    batchSize,
    renderInterval,
    renderNextBatch,
  ]);

  // 強制完了
  const forceComplete = useCallback(() => {
    if (renderingTimeoutRef.current) {
      clearTimeout(renderingTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setRenderedPois(allPois);
    setIsComplete(true);
    setIsLoading(false);
  }, [allPois]);

  // リセット
  const reset = useCallback(() => {
    if (renderingTimeoutRef.current) {
      clearTimeout(renderingTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    currentBatchRef.current = 0;
    setRenderedPois([]);
    setIsComplete(false);
    setIsLoading(false);
  }, []);

  // POIデータが変更されたときにレンダリングを再開始
  useEffect(() => {
    startRendering();

    return () => {
      if (renderingTimeoutRef.current) {
        clearTimeout(renderingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [startRendering]);

  // 進行率の計算
  const progress =
    allPois.length > 0 ? renderedPois.length / allPois.length : 1;

  return {
    renderedPois,
    isComplete,
    progress,
    forceComplete,
    reset,
    isLoading,
  };
};
