/**
 * FilterPanel.module.css 型定義
 * TypeScriptでFilterPanelコンポーネント専用CSS Modulesのクラス名を型安全に使用
 *
 * @version 1.0.0
 * @since 2025-07-04
 */

declare const styles: {
  // フィルターパネル基本
  readonly filterPanel: string;
  readonly filterPanelContent: string;

  // フィルターオプション
  readonly filterOptionsVirtualized: string;
  readonly filterOptionItem: string;
  readonly filterOptionItemSelected: string;

  // 検索・入力
  readonly searchInput: string;

  // カテゴリフィルター
  readonly categoryFilter: string;
  readonly categoryTitle: string;
  readonly categoryOptions: string;

  // 統計・結果
  readonly filterStats: string;
  readonly clearFiltersButton: string;
};

export default styles;
