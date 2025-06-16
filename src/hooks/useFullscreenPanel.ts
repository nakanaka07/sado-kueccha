import type { FilterState } from "../types/filter";

interface FullscreenPanelOptions {
  filterState: FilterState;
  isExpanded: boolean;
  onFilterChange: (newFilterState: FilterState) => void;
  onToggleExpanded: () => void;
  stats: { visible: number; total: number };
}

/**
 * フルスクリーン時のフィルターパネル管理フック
 * 通常のFilterPanelコンポーネントがそのまま使用されるため、追加の処理は不要
 */
export const useFullscreenPanel = (
  _fullscreenContainer: Element | null,
  _isFullscreen: boolean,
  _options: FullscreenPanelOptions,
) => {
  // 明示的に未使用パラメータを無効化
  void _fullscreenContainer;
  void _isFullscreen;
  void _options;

  // 互換性のため空の関数を返す
  return {
    updatePanel: () => {},
    removePanelFromFullscreen: () => {},
  };
};
