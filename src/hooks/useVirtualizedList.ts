/**
 * 仮想化リスト用のカスタムフック
 * 大量のリストアイテムのレンダリング性能を最適化
 *
 * @description
 * - インクリメンタルレンダリング
 * - ビューポートベースの表示制御
 * - スクロール位置の自動管理
 * - メモ化による再レンダリング抑制
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface VirtualizedListOptions {
  /** アイテムの総数 */
  itemCount: number;
  /** アイテムの高さ（ピクセル） */
  itemHeight: number;
  /** コンテナの高さ（ピクセル） */
  containerHeight: number;
  /** オーバースキャン数（上下に追加でレンダリングするアイテム数） */
  overscan?: number;
  /** 初期スクロール位置 */
  initialScrollTop?: number;
}

interface VirtualizedListResult {
  /** レンダリングすべきアイテムの開始インデックス */
  startIndex: number;
  /** レンダリングすべきアイテムの終了インデックス */
  endIndex: number;
  /** 表示されるアイテム数 */
  visibleItemCount: number;
  /** 上部の空白領域の高さ */
  offsetTop: number;
  /** 下部の空白領域の高さ */
  offsetBottom: number;
  /** スクロールコンテナのrefオブジェクト */
  scrollElementRef: React.RefObject<HTMLDivElement | null>;
  /** 特定のインデックスにスクロールする関数 */
  scrollToIndex: (index: number) => void;
  /** 現在のスクロール位置 */
  scrollTop: number;
}

/**
 * 仮想化リストフック
 */
export const useVirtualizedList = (options: VirtualizedListOptions): VirtualizedListResult => {
  const { itemCount, itemHeight, containerHeight, overscan = 5, initialScrollTop = 0 } = options;

  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(initialScrollTop);

  // 表示するアイテムの範囲を計算
  const { startIndex, endIndex, visibleItemCount, offsetTop, offsetBottom } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(itemCount - 1, start + visibleCount - 1);

    // オーバースキャンを適用
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(itemCount - 1, end + overscan);

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      visibleItemCount: overscanEnd - overscanStart + 1,
      offsetTop: overscanStart * itemHeight,
      offsetBottom: (itemCount - overscanEnd - 1) * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan]);

  // スクロールイベントハンドラー
  const handleScroll = useCallback((event: Event) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 特定のインデックスにスクロール
  const scrollToIndex = useCallback(
    (index: number) => {
      if (!scrollElementRef.current) return;

      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = targetScrollTop;
      setScrollTop(targetScrollTop);
    },
    [itemHeight],
  );

  // スクロールイベントリスナーの設定
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return {
    startIndex,
    endIndex,
    visibleItemCount,
    offsetTop,
    offsetBottom,
    scrollElementRef,
    scrollToIndex,
    scrollTop,
  };
};

/**
 * 仮想化リストコンポーネントの型定義
 */
export interface VirtualListItemProps {
  /** アイテムのインデックス */
  index: number;
  /** アイテムのスタイル */
  style: React.CSSProperties;
  /** アイテムデータ */
  data?: unknown;
}

export interface VirtualListProps {
  /** アイテムの総数 */
  itemCount: number;
  /** アイテムの高さ */
  itemHeight: number;
  /** コンテナの高さ */
  height: number;
  /** アイテムレンダリング関数 */
  renderItem: (props: VirtualListItemProps) => React.ReactNode;
  /** アイテムデータ配列 */
  itemData?: unknown[];
  /** オーバースキャン数 */
  overscan?: number;
  /** カスタムクラス名 */
  className?: string;
  /** カスタムスタイル */
  style?: React.CSSProperties;
}
