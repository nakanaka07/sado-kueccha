import type { FC, ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import type { FilterState } from '../types/filter';
import type { POI } from '../types/poi';
import { APP_CONFIG, getCurrentEnvConfig } from './AppConfig';
import { AppContext, type AppContextValue } from './AppContext';

/**
 * @fileoverview アプリケーション状態プロバイダー
 *
 * 全アプリケーション状態の中央管理とコンテキスト提供を担当。
 * React 19のコンテキスト最適化を活用し、パフォーマンスを重視した設計。
 *
 * @version 1.0.0
 * @since 2025-06-25
 * @author React 19 Architecture Team
 */

/**
 * アプリケーション状態の型定義
 */
export interface AppState {
  /** 全体的な読み込み状態 */
  loading: boolean;
  /** マップの読み込み状態 */
  mapLoading: boolean;
  /** POIデータの読み込み状態 */
  poisLoading: boolean;
  /** フェードアウト状態 */
  fadeOut: boolean;
  /** POIデータ */
  pois: POI[];
  /** フィルター状態 */
  filterState: FilterState;
}

/**
 * アプリケーション操作の型定義
 */
export interface AppActions {
  /** マップ読み込み完了時のハンドラー */
  handleMapLoaded: () => void;
  /** フィルター変更時のハンドラー */
  handleFilterChange: (newFilter: FilterState) => void;
}

/**
 * AppProviderのProps型定義
 */
interface AppProviderProps {
  /** プロバイダー内に表示するコンテンツ */
  children: ReactNode;
}

/**
 * アプリケーション状態プロバイダーコンポーネント
 *
 * @description
 * 全アプリケーション状態を管理し、子コンポーネントに提供します。
 *
 * **React 19 最適化:**
 * - コンテキスト値のメモ化による再レンダリング防止
 * - 状態更新の最適化
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AppProvider>
 *       <AppLayout>
 *         <MapComponent />
 *         <FilterPanel />
 *       </AppLayout>
 *     </AppProvider>
 *   );
 * }
 * ```
 *
 * @param props - プロバイダープロパティ
 * @returns 状態プロバイダーコンポーネント
 */
export const AppProvider: FC<AppProviderProps> = ({
  children,
}): ReactElement => {
  // アプリケーション状態の取得
  const appState = useAppState();

  // 環境設定の取得
  const envConfig = getCurrentEnvConfig();

  // コンテキスト値のメモ化（React 19最適化）
  const contextValue = useMemo<AppContextValue>(
    () => ({
      ...appState,
      envConfig,
      appConfig: APP_CONFIG,
    }),
    [appState, envConfig]
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export default AppProvider;
