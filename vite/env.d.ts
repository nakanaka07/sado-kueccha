/**
 * Vite設定用環境変数型定義
 *
 * @description ビルド・設定時に使用される環境変数の型定義
 */

/**
 * PWA Plugin 型定義
 */
declare module 'virtual:pwa-register' {
  interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: Error) => void;
  }

  interface UpdateSWOptions {
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
  }

  export function registerSW(
    options?: RegisterSWOptions
  ): (reloadPage?: boolean) => Promise<void>;
}

declare module 'virtual:pwa-register/react' {
  import type { Dispatch, SetStateAction } from 'react';

  export interface PwaReloadSWOptions {
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: Error) => void;
  }

  export function useRegisterSW(options?: PwaReloadSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>];
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };
}

/**
 * 必須環境変数の型定義
 */
export interface RequiredEnvironmentVariables {
  readonly VITE_BASE_PATH: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

/**
 * オプション環境変数の型定義
 */
export interface OptionalEnvironmentVariables {
  readonly NODE_ENV?: 'development' | 'production' | 'test';
  readonly CI?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
  readonly VITE_GOOGLE_SPREADSHEET_ID?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_ENABLE_CONSOLE_LOGS?: string;
}

/**
 * 全環境変数の統合型
 */
export type EnvironmentVariables = RequiredEnvironmentVariables &
  OptionalEnvironmentVariables;

/**
 * 環境変数検証結果の型定義
 */
export interface EnvironmentValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
  errors: string[];
}

/**
 * 環境変数のデフォルト値
 */
export const DEFAULT_ENV_VALUES: Partial<EnvironmentVariables> = {
  NODE_ENV: 'development',
  VITE_BASE_PATH: '/',
  VITE_DEBUG_MODE: 'false',
  VITE_ENABLE_CONSOLE_LOGS: 'true',
} as const;

/**
 * 環境変数の説明
 */
export const ENV_DESCRIPTIONS: Record<
  keyof RequiredEnvironmentVariables,
  string
> = {
  VITE_BASE_PATH:
    "アプリケーションのベースパス（通常は '/' または '/sado-kueccha/'）",
  VITE_GOOGLE_MAPS_API_KEY: 'Google Maps APIキー（Google Cloud Consoleで取得）',
} as const;
