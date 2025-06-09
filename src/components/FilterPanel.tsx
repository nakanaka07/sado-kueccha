import React, { useState } from "react";
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 統計情報を取得
  const stats: FilterStats = FilterService.getFilterStats(pois, filterState);

  // フィルター変更ハンドラー
  const handleFilterToggle = (key: keyof FilterState) => {
    const newFilterState = {
      ...filterState,
      [key]: !filterState[key],
    };
    onFilterChange(newFilterState);
  };

  // プリセット適用ハンドラー
  const handlePresetApply = (preset: FilterPreset) => {
    const newFilterState = FilterService.applyPreset(preset);
    onFilterChange(newFilterState);
  };

  // すべてクリアボタン
  const handleClearAll = () => {
    onFilterChange(FilterService.applyPreset("none"));
  };

  // すべて選択ボタン
  const handleSelectAll = () => {
    onFilterChange(FilterService.applyPreset("all"));
  };
  return (
    <div className={`filter-panel ${className}`}>
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
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>▼</span>
        </button>
      </div>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div className="filter-content">
          {/* プリセットボタン */}{" "}
          <div className="filter-presets">
            <button
              className="preset-button tourism"
              onClick={() => {
                handlePresetApply("tourism");
              }}
              title="観光スポットのみ表示"
            >
              🗾 観光
            </button>
            <button
              className="preset-button facilities"
              onClick={() => {
                handlePresetApply("facilities");
              }}
              title="施設のみ表示"
            >
              🏢 施設
            </button>
            <button className="preset-button clear" onClick={handleClearAll} title="すべて非表示">
              ❌ クリア
            </button>
            <button className="preset-button all" onClick={handleSelectAll} title="すべて表示">
              ✅ すべて
            </button>
          </div>
          {/* カテゴリ別フィルター */}
          <div className="filter-categories">
            {" "}
            {FILTER_CATEGORIES.map((category: FilterCategory) => (
              <div key={category.id} className="filter-category">
                <button
                  className={`category-header ${activeCategory === category.id ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(activeCategory === category.id ? null : category.id);
                  }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-label">{category.label}</span>
                  <span
                    className={`category-expand ${activeCategory === category.id ? "expanded" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {(activeCategory === category.id || category.id === "facilities") && (
                  <div className="filter-options">
                    {" "}
                    {category.options.map((option) => (
                      <label key={option.key} className="filter-option">
                        <input
                          type="checkbox"
                          checked={filterState[option.key]}
                          onChange={() => {
                            handleFilterToggle(option.key);
                          }}
                          className="filter-checkbox"
                        />
                        <span className="option-icon">{option.icon}</span>
                        <span className="option-label">{option.label}</span>
                        {option.description && (
                          <span className="option-description">{option.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* 統計情報 */}
          <div className="filter-stats">
            <div className="stats-summary">
              <span className="stats-visible">{stats.visible}件表示中</span>
              <span className="stats-separator">/</span>
              <span className="stats-total">{stats.total}件中</span>
            </div>
            {stats.hidden > 0 && <div className="stats-hidden">{stats.hidden}件が非表示</div>}
          </div>
        </div>
      )}
    </div>
  );
};
