import React, { useEffect, useRef, useState } from "react";
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

  // フィルターパネルの開閉時に高さを動的に設定
  useEffect(() => {
    if (contentRef.current) {
      if (isExpanded) {
        // 開く時：実際のコンテンツ高さを計算
        const height = contentRef.current.scrollHeight;
        contentRef.current.style.setProperty("--content-height", `${height.toString()}px`);
      } else {
        // 閉じる時：現在の高さから0へのアニメーションのため、一度実際の高さを設定してから0にする
        const currentHeight = contentRef.current.offsetHeight;
        contentRef.current.style.setProperty("--content-height", `${currentHeight.toString()}px`);
        // 少し遅らせて0に設定（アニメーションのため）
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.style.setProperty("--content-height", "0px");
          }
        }, 10);
      }
    }
  }, [isExpanded]);

  // カテゴリが変更された時のみ、開いた状態なら高さを再計算
  useEffect(() => {
    if (contentRef.current && isExpanded) {
      const height = contentRef.current.scrollHeight;
      contentRef.current.style.setProperty("--content-height", `${height.toString()}px`);
    }
  }, [activeCategories, filterState, isExpanded]);

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
        setActiveCategories(FILTER_CATEGORIES.map((category) => category.id));
        break;
      case "none":
        setActiveCategories([]);
        break;
      default:
        setActiveCategories(["dining"]);
        break;
    }
  };

  // カテゴリの開閉を切り替え
  const toggleCategory = (categoryId: string) => {
    setActiveCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
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
          </span>{" "}
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>▲</span>
        </button>
      </div>{" "}
      {/* コンテンツ（CSSアニメーション用に常に存在） */}{" "}
      <div className="filter-content" ref={contentRef}>
        {/* プリセットボタン */}
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
          </button>{" "}
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
        {/* カテゴリ別フィルター */}
        <div className="filter-categories">
          {FILTER_CATEGORIES.map((category: FilterCategory) => (
            <div key={category.id} className="filter-category">
              {" "}
              <button
                className={`category-header ${activeCategories.includes(category.id) ? "active" : ""}`}
                onClick={() => {
                  toggleCategory(category.id);
                }}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>{" "}
                <span
                  className={`category-expand ${activeCategories.includes(category.id) ? "expanded" : ""}`}
                >
                  ▲
                </span>{" "}
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
        </div>
        {/* 統計情報 */}
        <div className="filter-stats">
          {" "}
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
