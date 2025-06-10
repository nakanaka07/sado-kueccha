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
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // 統計情報を取得
  const stats: FilterStats = FilterService.getFilterStats(pois, filterState);

  // フィルター変更ハンドラー
  const handleFilterToggle = (key: keyof FilterState) => {
    const newFilterState = {
      ...filterState,
      [key]: !filterState[key],
    };
    onFilterChange(newFilterState);
  }; // プリセット適用ハンドラー
  const handlePresetApply = (preset: FilterPreset) => {
    const newFilterState = FilterService.applyPreset(preset);
    onFilterChange(newFilterState);

    // プリセットに応じて関連カテゴリを自動で開く
    switch (preset) {
      case "gourmet":
        setActiveCategories(["dining"]);
        break;
      case "facilities":
        setActiveCategories(["facilities"]);
        break;
      case "nightlife":
        setActiveCategories(["nightlife"]);
        break;
      case "all":
        // すべてのカテゴリを開く
        setActiveCategories(FILTER_CATEGORIES.map((category) => category.id));
        break;
      case "none":
        // 何も表示しないので、カテゴリを閉じる
        setActiveCategories([]);
        break;
      default:
        // デフォルトはグルメカテゴリを開く
        setActiveCategories(["dining"]);
        break;
    }
  }; // すべてクリアボタン
  const handleClearAll = () => {
    onFilterChange(FilterService.applyPreset("none"));
    setActiveCategories([]); // カテゴリを閉じる
  };

  // すべて選択ボタン
  const handleSelectAll = () => {
    onFilterChange(FilterService.applyPreset("all"));
    setActiveCategories(FILTER_CATEGORIES.map((category) => category.id)); // すべてのカテゴリを開く
  };
  return (
    <div className={`filter-panel ${!isExpanded ? "collapsed" : ""} ${className}`}>
      {/* ヘッダー */}
      <div className="filter-header">
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
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
            {/* スマホでは上向き矢印、デスクトップでは下向き矢印 */}
            <span className="expand-arrow-mobile">▲</span>
            <span className="expand-arrow-desktop">▼</span>
          </span>
        </button>
      </div>

      {/* コンテンツ（CSSアニメーション用に常に存在） */}
      <div className="filter-content">
        {" "}
        {/* プリセットボタン */}{" "}
        <div className="filter-presets">
          {" "}
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
          <button className="preset-button clear" onClick={handleClearAll} title="すべて非表示">
            ❌ クリア
          </button>
          <button className="preset-button all" onClick={handleSelectAll} title="すべて表示">
            ✅ 全表示
          </button>
        </div>
        {/* カテゴリ別フィルター */}
        <div className="filter-categories">
          {" "}
          {FILTER_CATEGORIES.map((category: FilterCategory) => (
            <div key={category.id} className="filter-category">
              <button
                className={`category-header ${activeCategories.includes(category.id) ? "active" : ""}`}
                onClick={() => {
                  if (activeCategories.includes(category.id)) {
                    // カテゴリが開いている場合は閉じる
                    setActiveCategories(activeCategories.filter((id) => id !== category.id));
                  } else {
                    // カテゴリが閉じている場合は開く
                    setActiveCategories([...activeCategories, category.id]);
                  }
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
                <span
                  className={`category-expand ${activeCategories.includes(category.id) ? "expanded" : ""}`}
                >
                  ▼
                </span>
              </button>

              {activeCategories.includes(category.id) && (
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
                      />{" "}
                      <span className="option-icon">{option.icon}</span>
                      <span className="option-label">{option.description}</span>
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
          </div>{" "}
          {stats.hidden > 0 && <div className="stats-hidden">{stats.hidden}件が非表示</div>}
        </div>
      </div>
    </div>
  );
};
