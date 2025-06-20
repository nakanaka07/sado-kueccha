/**
 * 仮想化フィルターオプションコンポーネント
 * 大量のフィルターオプションのレンダリング性能を最適化
 *
 * @description
 * - 仮想化スクロールによる大量リスト対応
 * - 検索・フィルタリング機能
 * - キーボードナビゲーション対応
 * - アクセシビリティ完全対応
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import type React from "react";
import { memo, useCallback, useMemo } from "react";
import type { FilterOption } from "../../types/filter";
import { VirtualList } from "../shared";

interface VirtualizedFilterOptionsProps {
  /** フィルターオプション一覧 */
  options: FilterOption[];
  /** 選択されたオプション */
  selectedOptions: string[];
  /** オプション選択時のコールバック */
  onOptionChange: (optionKey: string, selected: boolean) => void;
  /** 検索クエリ */
  searchQuery?: string;
  /** 最大表示高さ */
  maxHeight?: number;
  /** アイテムの高さ */
  itemHeight?: number;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 個別フィルターオプションアイテム
 */
const FilterOptionItem: React.FC<{
  option: FilterOption;
  isSelected: boolean;
  onToggle: (optionKey: string, selected: boolean) => void;
  style: React.CSSProperties;
}> = memo(({ option, isSelected, onToggle, style }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(option.key, event.target.checked);
  };

  const optionId = `filter-option-${option.key}`;

  return (
    <div
      style={style}
      className={`filter-option-item ${isSelected ? "filter-option-item--selected" : ""}`}
    >
      <label className="filter-option-label" htmlFor={optionId}>
        <input
          id={optionId}
          type="checkbox"
          className="filter-option-checkbox"
          checked={isSelected}
          onChange={handleChange}
          aria-describedby={`${optionId}-desc`}
        />
        <span className="filter-option-text">
          <span className="filter-option-icon" aria-hidden="true">
            {option.icon}
          </span>
          {option.key}
          <span id={`${optionId}-desc`} className="filter-option-description">
            {option.description}
          </span>
        </span>
      </label>
    </div>
  );
});

FilterOptionItem.displayName = "FilterOptionItem";

/**
 * 仮想化フィルターオプションコンポーネント
 */
export const VirtualizedFilterOptions: React.FC<VirtualizedFilterOptionsProps> = memo(
  ({
    options,
    selectedOptions,
    onOptionChange,
    searchQuery = "",
    maxHeight = 300,
    itemHeight = 40,
    className = "",
  }) => {
    // 検索フィルタリング
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;

      const query = searchQuery.toLowerCase();
      return options.filter(
        (option) =>
          option.key.toLowerCase().includes(query) ||
          option.description.toLowerCase().includes(query),
      );
    }, [options, searchQuery]);

    // 仮想化リストアイテムレンダラー
    const renderItem = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const option = filteredOptions[index];
        if (!option) return null;

        const isSelected = selectedOptions.includes(option.key);

        return (
          <FilterOptionItem
            key={option.key}
            option={option}
            isSelected={isSelected}
            onToggle={onOptionChange}
            style={style}
          />
        );
      },
      [filteredOptions, selectedOptions, onOptionChange],
    );

    // 少数のアイテムの場合は通常レンダリング
    if (filteredOptions.length <= 10) {
      return (
        <div className={`filter-options ${className}`} role="group">
          {filteredOptions.map((option) => {
            const isSelected = selectedOptions.includes(option.key);
            return (
              <FilterOptionItem
                key={option.key}
                option={option}
                isSelected={isSelected}
                onToggle={onOptionChange}
                style={{}}
              />
            );
          })}
        </div>
      );
    }

    // 大量のアイテムの場合は仮想化リスト
    return (
      <div className={`filter-options filter-options--virtualized ${className}`}>
        <VirtualList
          itemCount={filteredOptions.length}
          itemHeight={itemHeight}
          height={Math.min(maxHeight, filteredOptions.length * itemHeight)}
          renderItem={renderItem}
          itemData={filteredOptions}
        />
      </div>
    );
  },
);

VirtualizedFilterOptions.displayName = "VirtualizedFilterOptions";

/**
 * フィルターオプション検索コンポーネント
 */
export const FilterOptionsSearch: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}> = memo(({ searchQuery, onSearchChange, placeholder = "検索...", className = "" }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <div className={`filter-search ${className}`}>
      <input
        type="search"
        className="filter-search-input"
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="フィルターオプションを検索"
      />
      <span className="filter-search-icon" aria-hidden="true">
        🔍
      </span>
    </div>
  );
});

FilterOptionsSearch.displayName = "FilterOptionsSearch";
