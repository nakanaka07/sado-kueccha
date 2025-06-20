/**
 * 仮想化リストコンポーネント
 * 大量のアイテムを効率的にレンダリング
 *
 * @description
 * - ビューポートベースのレンダリング
 * - スムーズなスクロール体験
 * - アクセシビリティ対応
 * - メモ化による最適化
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import type React from "react";
import { memo } from "react";
import type { VirtualListProps } from "../../hooks";
import { useVirtualizedList } from "../../hooks";

/**
 * 仮想化リストコンポーネント
 */
export const VirtualList: React.FC<VirtualListProps> = memo(
  ({
    itemCount,
    itemHeight,
    height,
    renderItem,
    itemData = [],
    overscan = 5,
    className = "",
    style = {},
  }) => {
    const { startIndex, endIndex, offsetTop, offsetBottom, scrollElementRef } = useVirtualizedList({
      itemCount,
      itemHeight,
      containerHeight: height,
      overscan,
    });

    // レンダリング対象のアイテムを生成
    const items = [];
    for (let index = startIndex; index <= endIndex; index++) {
      const itemStyle: React.CSSProperties = {
        position: "absolute",
        top: index * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
      };

      items.push(
        renderItem({
          index,
          style: itemStyle,
          data: itemData[index],
        }),
      );
    }

    return (
      <div
        ref={scrollElementRef}
        className={`virtual-list ${className}`}
        style={{
          height,
          overflow: "auto",
          position: "relative",
          ...style,
        }}
        role="list"
        aria-label={`仮想化リスト（${itemCount}件）`}
      >
        {/* 上部の空白領域 */}
        {offsetTop > 0 ? (
          <div
            style={{
              height: offsetTop,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        ) : null}

        {/* 実際にレンダリングされるアイテム */}
        <div
          style={{
            position: "relative",
            height: (endIndex - startIndex + 1) * itemHeight,
          }}
        >
          {items}
        </div>

        {/* 下部の空白領域 */}
        {offsetBottom > 0 ? (
          <div
            style={{
              height: offsetBottom,
              pointerEvents: "none",
            }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    );
  },
);

VirtualList.displayName = "VirtualList";

/**
 * シンプルな仮想化リストアイテムコンポーネント
 */
export const VirtualListItem: React.FC<{
  children: React.ReactNode;
  style: React.CSSProperties;
}> = memo(({ children, style }) => (
  <div style={style} role="listitem">
    {children}
  </div>
));

VirtualListItem.displayName = "VirtualListItem";
