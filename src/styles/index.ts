/**
 * スタイルのエントリーポイント
 * モジュール化されたスタイルの統合管理
 *
 * @version 2.2.0
 * @since 2025-06-30
 * @updated 2025-07-04 - 型安全性向上、レガシーサポート強化
 */

/* === 推奨: CSS Modules スタイル === */
export { default as PerformanceStyles } from './Performance.module.css';

/* === コンポーネント専用スタイル === */
export { default as FilterPanelStyles } from './components/FilterPanel.module.css';
export { default as MapStyles } from './components/Map.module.css';

/* === ヘルパー関数・型定義 === */
export {
  combineModuleClasses,
  conditionalModuleClass,
  type PerformanceClassKey,
  type PerformanceClassName,
  type PerformanceModuleClass,
} from './constants';

/* === レガシーサポート（段階的廃止予定 - 2025年Q4） === */
export {
  PERFORMANCE_CLASSES,
  PerformanceStyles as PerformanceModules,
} from './constants';
