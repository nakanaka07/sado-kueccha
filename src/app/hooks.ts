import { useContext } from 'react';
import { AppContext, type AppContextValue } from './AppContext';
import type { AppActions, AppState } from './AppProvider';

/**
 * @fileoverview アプリケーションコンテキスト関連フック
 *
 * Fast Refresh対応のため、AppProvider.tsxから分離
 *
 * @version 1.0.0
 * @since 2025-06-25
 */

/**
 * アプリケーションコンテキストを使用するためのカスタムフック
 *
 * @description
 * AppProviderで提供される状態と操作にアクセスするためのフック。
 * 型安全性を確保し、適切なエラーハンドリングを提供します。
 *
 * **使用上の注意:**
 * - AppProvider内でのみ使用可能
 * - 型安全性が保証される
 * - パフォーマンス最適化済み
 *
 * @example
 * ```tsx
 * function MapComponent() {
 *   const {
 *     pois,
 *     mapLoading,
 *     handleMapLoaded,
 *     envConfig
 *   } = useAppContext();
 *
 *   if (mapLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return (
 *     <Map
 *       pois={pois}
 *       onLoaded={handleMapLoaded}
 *       debugMode={envConfig.enableDebugMode}
 *     />
 *   );
 * }
 * ```
 *
 * @returns アプリケーションの状態と操作
 * @throws {Error} AppProvider外で使用された場合
 */
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useAppContext must be used within an AppProvider. ' +
        'Make sure to wrap your component tree with <AppProvider>.'
    );
  }

  return context;
};

/**
 * アプリケーション状態のみを取得するフック（操作は不要な場合）
 *
 * @description
 * 状態のみが必要で操作が不要なコンポーネント用の最適化されたフック。
 * 不要な依存関係を避けることで、パフォーマンスを向上させます。
 *
 * @example
 * ```tsx
 * function StatusDisplay() {
 *   const { loading, poisLoading } = useAppStateOnly();
 *
 *   return (
 *     <div>
 *       <span>読み込み中: {loading ? 'はい' : 'いいえ'}</span>
 *       <span>POI読み込み中: {poisLoading ? 'はい' : 'いいえ'}</span>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns アプリケーション状態のみ
 */
export const useAppStateOnly = (): AppState => {
  const { loading, mapLoading, poisLoading, fadeOut, pois, filterState } =
    useAppContext();

  return {
    loading,
    mapLoading,
    poisLoading,
    fadeOut,
    pois,
    filterState,
  };
};

/**
 * アプリケーション操作のみを取得するフック（状態は不要な場合）
 *
 * @description
 * 操作のみが必要で状態が不要なコンポーネント用の最適化されたフック。
 *
 * @example
 * ```tsx
 * function ActionButtons() {
 *   const { handleMapLoaded, handleFilterChange } = useAppActionsOnly();
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleMapLoaded()}>
 *         マップ読み込み完了
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns アプリケーション操作のみ
 */
export const useAppActionsOnly = (): AppActions => {
  const { handleMapLoaded, handleFilterChange } = useAppContext();

  return {
    handleMapLoaded,
    handleFilterChange,
  };
};
