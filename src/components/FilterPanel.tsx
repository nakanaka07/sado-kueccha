import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFullscreenPanel } from "../hooks/useFullscreenPanel";
import { useFullscreenState } from "../hooks/useFullscreenState";
import type { FilterCategory, FilterPreset, FilterState, FilterStats } from "../types/filter";
import { DEFAULT_FILTER_STATE, FILTER_CATEGORIES, PRESET_CONFIGS } from "../types/filter";
import type { POI } from "../types/poi";
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
  const [activeCategories, setActiveCategories] = useState<string[]>(["display"]); // 初期状態で表示設定を開く
  const contentRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // カスタムフックを使用してフルスクリーン状態を管理
  const { isFullscreen, fullscreenContainer } = useFullscreenState(); // 統計情報を計算（メモ化でパフォーマンス最適化）
  const stats = useMemo((): FilterStats => {
    const visibleCount = pois.filter(() => {
      return (
        filterState.showRecommended ||
        filterState.showRyotsuAikawa ||
        filterState.showKanaiSawada ||
        filterState.showAkadomariHamochi
      );
    }).length;

    return {
      total: pois.length,
      visible: visibleCount,
      hidden: pois.length - visibleCount,
      sheetStats: {},
      visibleSheetStats: {},
    };
  }, [pois, filterState]); // フルスクリーンパネル管理
  useFullscreenPanel(fullscreenContainer, isFullscreen, {
    filterState,
    isExpanded,
    onFilterChange,
    onToggleExpanded: () => {
      setIsExpanded(!isExpanded);
    },
    stats: { visible: stats.visible, total: stats.total },
  });
  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (!contentRef.current) return;
      const height = isExpanded ? contentRef.current.scrollHeight : 0;
      contentRef.current.style.setProperty("--content-height", `${height.toString()}px`);
    };

    updateHeight();

    if (isExpanded) {
      const timeoutId = setTimeout(updateHeight, 10);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [isExpanded, activeCategories]); // フィルター変更ハンドラー（最適化版）
  const handleFilterToggle = useCallback(
    (key: keyof FilterState) => {
      const newValue = !filterState[key];

      onFilterChange({
        ...filterState,
        [key]: newValue,
      });
    },
    [filterState, onFilterChange],
  );

  // プリセット適用ハンドラー（最適化版）
  const handlePresetApply = useCallback(
    (preset: FilterPreset) => {
      const config = PRESET_CONFIGS[preset];
      const baseState = config.baseState;

      const newFilterState: FilterState = {
        ...DEFAULT_FILTER_STATE,
        ...baseState,
        ...config.overrides,
      };
      onFilterChange(newFilterState); // プリセットに応じてカテゴリの開閉状態を更新
      if (preset !== "none") {
        const categoryMappings: Record<Exclude<FilterPreset, "none">, string[]> = {
          gourmet: ["dining", "display"], // 表示設定も開く
          facilities: ["facilities", "display"],
          nightlife: ["nightlife", "display"],
          all: FILTER_CATEGORIES.map((category) => category.id),
          default: ["dining", "display"],
        };
        setActiveCategories(categoryMappings[preset]);
      } else {
        // noneの場合は表示設定のみを開く
        setActiveCategories(["display"]);
      }
    },
    [onFilterChange],
  );

  // カテゴリの開閉を切り替え（最適化版）
  const toggleCategory = useCallback((categoryId: string) => {
    setActiveCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }, []);
  // 通常時のパネルコンテンツ（最適化版）
  const renderPanelContent = () => (
    <div
      ref={panelRef}
      className={`filter-panel ${!isExpanded ? "collapsed" : ""} ${isFullscreen ? "fullscreen-mode" : ""} ${className}`}
      data-fullscreen={isFullscreen}
      role="region"
      aria-label="フィルターパネル"
    >
      {" "}
      {/* ヘッダー（アクセシビリティ強化） */}
      <div className="filter-header">
        {" "}
        <button
          className="filter-toggle"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          data-expanded={isExpanded}
          aria-expanded={isExpanded}
          aria-controls="filter-content"
          aria-label={`フィルターパネルを${isExpanded ? "折りたたむ" : "展開する"}`}
        >
          <span className="filter-icon" aria-hidden="true">
            🔍
          </span>
          <span className="filter-title">フィルター</span>
          <span className="filter-count">
            ({stats.visible}/{stats.total})
          </span>
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`} aria-hidden="true">
            ▼
          </span>
        </button>
      </div>
      <div className="filter-content" ref={contentRef} id="filter-content">
        {/* プリセットボタン（最適化版） */}
        <div className="filter-presets" role="group" aria-label="フィルタープリセット">
          {" "}
          <button
            className="preset-button facilities"
            onClick={() => {
              handlePresetApply("facilities");
            }}
            title="施設のみ表示"
            aria-label="施設のみ表示するプリセット"
          >
            🏢 施設
          </button>
          <button
            className="preset-button gourmet"
            onClick={() => {
              handlePresetApply("gourmet");
            }}
            title="一般的な飲食店のみ表示（スナック除く）"
            aria-label="グルメのみ表示するプリセット"
          >
            🍽️ グルメ
          </button>
          <button
            className="preset-button nightlife"
            onClick={() => {
              handlePresetApply("nightlife");
            }}
            title="ナイトライフ（スナック）のみ表示"
            aria-label="ナイトライフのみ表示するプリセット"
          >
            🍸 夜遊び
          </button>
          <button
            className="preset-button clear"
            onClick={() => {
              handlePresetApply("none");
            }}
            title="すべて非表示"
            aria-label="すべてのフィルターをクリア"
          >
            ❌ クリア
          </button>
          <button
            className="preset-button all"
            onClick={() => {
              handlePresetApply("all");
            }}
            title="すべて表示"
            aria-label="すべてのアイテムを表示"
          >
            ✅ 全表示
          </button>
        </div>

        {/* カテゴリ別フィルター（最適化版） */}
        <div className="filter-categories" role="group" aria-label="カテゴリ別フィルター">
          {FILTER_CATEGORIES.map((category: FilterCategory) => (
            <div key={category.id} className="filter-category">
              {" "}
              <button
                className={`category-header ${activeCategories.includes(category.id) ? "active" : ""}`}
                onClick={() => {
                  toggleCategory(category.id);
                }}
                aria-expanded={activeCategories.includes(category.id)}
                aria-controls={`category-${category.id}`}
                aria-label={`${category.label}カテゴリを${activeCategories.includes(category.id) ? "折りたたむ" : "展開する"}`}
              >
                <span className="category-icon" aria-hidden="true">
                  {category.icon}
                </span>
                <span className="category-label">{category.label}</span>
                <span
                  className={`expand-icon ${activeCategories.includes(category.id) ? "expanded" : ""}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>
              {activeCategories.includes(category.id) && (
                <div
                  className="filter-options"
                  id={`category-${category.id}`}
                  role="group"
                  aria-label={`${category.label}のフィルターオプション`}
                >
                  {category.options.map((option) => (
                    <label key={option.key} className="filter-option">
                      {" "}
                      <input
                        type="checkbox"
                        checked={filterState[option.key]}
                        onChange={() => {
                          handleFilterToggle(option.key);
                        }}
                        aria-describedby={`desc-${option.key}`}
                      />
                      <span aria-hidden="true">{option.icon}</span>
                      <span id={`desc-${option.key}`}>{option.description}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 統計表示（最適化版） */}
        <div className="filter-stats" role="status" aria-live="polite">
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
  return (
    <>
      {/* フルスクリーン時はPortalを使用してフルスクリーンコンテナに描画 */}
      {isFullscreen && fullscreenContainer
        ? createPortal(renderPanelContent(), fullscreenContainer)
        : renderPanelContent()}

      {/* デバッグ表示（開発時のみ） */}
      {process.env.NODE_ENV === "development" && isFullscreen && (
        <div className="fullscreen-debug-indicator">✅ Fullscreen Active - Full Panel</div>
      )}
    </>
  );
};
