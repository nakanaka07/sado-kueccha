import React, { useCallback, useEffect, useRef, useState } from "react";
import { FilterService, type FilterPreset, type FilterStats } from "../services/filter";
import type { FilterCategory, FilterState } from "../types/filter";
import { FILTER_CATEGORIES } from "../types/filter";
import type { POI } from "../types/google-maps";
import "./FilterPanel.css";

interface FilterPanelProps {
  pois: POI[];
  filterState: FilterState;
  onFilterChange: (newFilterState: FilterState) => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  filterState,
  onFilterChange,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  // 最適化：単一のuseEffectで高さ管理（CSS変数使用）
  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (!contentRef.current) return;

      if (isExpanded) {
        // 展開時：実際のコンテンツ高さを設定
        const height = contentRef.current.scrollHeight;
        contentRef.current.style.setProperty("--content-height", `${height.toString()}px`);
      } else {
        // 折りたたみ時：0に設定
        contentRef.current.style.setProperty("--content-height", "0px");
      }
    };

    // 初回実行
    updateHeight();

    // カテゴリ変更時の高さ再計算（展開時のみ）
    if (isExpanded) {
      // 少し遅延させて再計算（DOM更新後）
      const timeoutId = setTimeout(updateHeight, 10);
      return () => {
        clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [isExpanded, activeCategories, filterState]); // フィルター変更ハンドラー
  const handleFilterToggle = useCallback(
    (key: keyof FilterState) => {
      onFilterChange({
        ...filterState,
        [key]: !filterState[key],
      });
    },
    [filterState, onFilterChange],
  ); // 最適化：プリセット適用ハンドラー（統一化）
  const handlePresetApply = useCallback(
    (preset: FilterPreset) => {
      const newFilterState = FilterService.applyPreset(preset);
      onFilterChange(newFilterState);

      // プリセットカテゴリマッピング（型安全）
      const categoryMappings: Record<FilterPreset, string[]> = {
        gourmet: ["dining"],
        facilities: ["facilities"],
        nightlife: ["nightlife"],
        all: FILTER_CATEGORIES.map((category) => category.id),
        none: [],
        default: ["dining"],
      };

      setActiveCategories(categoryMappings[preset]);
    },
    [onFilterChange],
  );

  // カテゴリの開閉を切り替え
  const toggleCategory = useCallback((categoryId: string) => {
    setActiveCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }, []);
  // 統計情報を計算
  const stats: FilterStats = FilterService.getFilterStats(pois, filterState);

  return (
    <div className={`filter-panel ${!isExpanded ? "collapsed" : ""} ${className}`}>
      {/* ヘッダー */}
      <div className="filter-header">
        {" "}
        <button
          className="filter-toggle"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          data-expanded={isExpanded}
        >
          <span className="filter-icon">🔍</span>
          <span className="filter-title">フィルター</span>
          <span className="filter-count">
            ({stats.visible}/{stats.total})
          </span>
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>▲</span>
        </button>
      </div>

      <div className="filter-content" ref={contentRef}>
        {" "}
        <div className="filter-presets">
          <button
            className="preset-button facilities"
            onClick={() => {
              handlePresetApply("facilities");
            }}
            title="施設のみ表示"
          >
            🏢 施設
          </button>
          <button
            className="preset-button gourmet"
            onClick={() => {
              handlePresetApply("gourmet");
            }}
            title="一般的な飲食店のみ表示（スナック除く）"
          >
            🍽️ グルメ
          </button>
          <button
            className="preset-button nightlife"
            onClick={() => {
              handlePresetApply("nightlife");
            }}
            title="ナイトライフ（スナック）のみ表示"
          >
            🍸 夜遊び
          </button>
          <button
            className="preset-button clear"
            onClick={() => {
              handlePresetApply("none");
            }}
            title="すべて非表示"
          >
            ❌ クリア
          </button>
          <button
            className="preset-button all"
            onClick={() => {
              handlePresetApply("all");
            }}
            title="すべて表示"
          >
            ✅ 全表示
          </button>
        </div>{" "}
        <div className="filter-categories">
          {FILTER_CATEGORIES.map((category: FilterCategory) => (
            <div key={category.id} className="filter-category">
              <button
                className={`category-header ${activeCategories.includes(category.id) ? "active" : ""}`}
                onClick={() => {
                  toggleCategory(category.id);
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
                <span
                  className={`expand-icon ${activeCategories.includes(category.id) ? "expanded" : ""}`}
                >
                  ▲
                </span>
              </button>
              {activeCategories.includes(category.id) && (
                <div className="filter-options">
                  {category.options.map((option) => (
                    <label key={option.key} className="filter-option">
                      <input
                        type="checkbox"
                        checked={filterState[option.key]}
                        onChange={() => {
                          handleFilterToggle(option.key);
                        }}
                      />
                      <span>{option.icon}</span>
                      <span>{option.description}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>{" "}
        <div className="filter-stats">
          <div className="stats-summary">
            <span className="stats-visible">{stats.visible}件表示中</span>
            <span className="stats-separator">/</span>
            <span className="stats-total">{stats.total}件中</span>
          </div>
          {stats.hidden > 0 && <div className="stats-hidden">{stats.hidden}件が非表示</div>}
        </div>
      </div>
    </div>
  );
};
