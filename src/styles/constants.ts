/**
 * CSS クラス名の型安全な定数定義
 * 文字列リテラルエラーを防ぎ、リファクタリング時の安全性を確保
 *
 * @version 2.1.0
 * @since 2025-06-30
 * @updated 2025-06-30 - レガシー関数削除、CSS Modules に統一
 */

import performanceStyles from './Performance.module.css';

/**
 * パフォーマンス最適化関連のCSSクラス（レガシー）
 * @deprecated CSS Modulesの PerformanceStyles を使用してください
 * TODO: 2025年Q4に削除予定（フェーズアウト中）
 */
export const PERFORMANCE_CLASSES = {
  // 仮想化リスト
  virtualList: 'virtual-list',
  virtualListItem: 'virtual-list-item',

  // フィルターオプション
  filterOptionsVirtualized: 'filter-options--virtualized',
  filterOptionItem: 'filter-option-item',

  // マップコンテナ
  mapContainer: 'map-container',

  // デバッグ用
  performanceDebug: 'performance-debug',
} as const;

/**
 * CSS Modules版のパフォーマンス最適化クラス（推奨）
 */
export const PerformanceStyles = performanceStyles;

/**
 * CSS Modules のクラス名型定義
 * TypeScript補完とエラー検出を強化
 */
export type PerformanceModuleClass = keyof typeof performanceStyles;

/**
 * 型安全なクラス名の取得（レガシーサポート用）
 * @deprecated PerformanceStyles を直接使用してください
 */
export type PerformanceClassKey = keyof typeof PERFORMANCE_CLASSES;
export type PerformanceClassName =
  (typeof PERFORMANCE_CLASSES)[PerformanceClassKey];

/**
 * CSS Modules用のクラス名結合ヘルパー
 * 複数のクラス名を安全に結合し、undefinedを自動除外します
 *
 * @param classes - 結合するクラス名の配列（undefined は自動で除外）
 * @returns 結合されたクラス名文字列
 *
 * @example
 * ```typescript
 * const className = combineModuleClasses(
 *   PerformanceStyles.virtualList,
 *   isActive && PerformanceStyles.active,
 *   props.className
 * );
 * ```
 */
export const combineModuleClasses = (
  ...classes: Array<string | undefined | null | false>
): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 条件付きでCSS Modulesクラスを適用するヘルパー
 * 条件に基づいてクラス名を動的に適用します
 *
 * @param condition - クラス名を適用する条件
 * @param className - 適用するクラス名
 * @returns 条件に応じたクラス名または空文字列
 *
 * @example
 * ```typescript
 * const className = conditionalModuleClass(
 *   isLoading,
 *   PerformanceStyles.loading
 * );
 * ```
 */
export const conditionalModuleClass = (
  condition: boolean,
  className: string
): string => {
  return condition ? className : '';
};
