import { createContext } from 'react';
import type { APP_CONFIG, getCurrentEnvConfig } from './AppConfig';
import type { AppActions, AppState } from './AppProvider';

/**
 * @fileoverview アプリケーションコンテキスト定義
 *
 * Fast Refresh対応のため、AppProvider.tsxから分離
 *
 * @version 1.0.0
 * @since 2025-06-25
 */

/**
 * アプリケーションコンテキストの値の型定義
 */
export interface AppContextValue extends AppState, AppActions {
  /** 現在の環境設定 */
  envConfig: ReturnType<typeof getCurrentEnvConfig>;
  /** アプリケーション設定 */
  appConfig: typeof APP_CONFIG;
}

/**
 * アプリケーションコンテキスト
 */
export const AppContext = createContext<AppContextValue | null>(null);
