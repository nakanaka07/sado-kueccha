/**
 * 🌍 環境変数管理ユーティリティ
 * 最新のベストプラクティスに基づいた型安全な環境変数管理
 */

import { getSheetsConfig } from './sheetsConfig';

/**
 * 🔧 環境変数の型安全な取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値（オプション）
 * @returns 環境変数の値
 */
export const getEnvValue = (
  value: string | undefined,
  defaultValue = ''
): string => {
  // プロダクション環境でのランタイムエラーを防ぐための安全なチェック
  if (!value) {
    if (defaultValue === '' && import.meta.env.DEV) {
      console.warn(
        `⚠️ 環境変数が未設定です。デフォルト値を使用します: ${defaultValue}`
      );
    }
    return defaultValue;
  }

  // すでに文字列として渡されているので、そのまま返す
  return value;
};

/**
 * 🔢 数値型環境変数の取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns 数値型の環境変数の値
 */
export const getEnvNumber = (
  value: string | undefined,
  defaultValue: number
): number => {
  if (typeof value === 'string') {
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }
  return defaultValue;
};

/**
 * ✅ ブール型環境変数の取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns ブール型の環境変数の値
 */
export const getEnvBoolean = (
  value: string | undefined,
  defaultValue: boolean
): boolean => {
  if (typeof value === 'string') {
    return value === 'true' || value === '1' || value === 'yes';
  }
  return defaultValue;
};

/**
 * 🛡️ 必須環境変数の検証
 * @param vars 環境変数の値のオブジェクト
 * @param requiredKeys 必須キーのリスト
 * @throws 欠落している環境変数がある場合はエラー
 */
export const validateRequiredEnvVars = (
  vars: Record<string, string | undefined>,
  requiredKeys: string[]
): void => {
  const missing = requiredKeys.filter(key => !vars[key]);

  if (missing.length > 0) {
    throw new Error(`❌ 必須環境変数が不足しています: ${missing.join(', ')}`);
  }
};

/**
 * 🚀 開発環境チェック
 */
export const isDevelopment = () => import.meta.env.DEV;

/**
 * 🏗️ 本番環境チェック
 */
export const isProduction = () => import.meta.env.PROD;

/**
 * 🐛 デバッグ機能
 */
export const debugLog = (_message: string, ..._args: unknown[]): void => {
  // デバッグログは削除（パフォーマンス向上のため）
};

/**
 * ⚠️ 警告ログ (開発環境のみ)
 */
export const warnLog = (message: string, ...args: unknown[]): void => {
  if (isDevelopment()) {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  }
};

/**
 * ❌ エラーログ
 */
export const errorLog = (message: string, ...args: unknown[]): void => {
  console.error(`❌ [ERROR] ${message}`, ...args);
};

// 🎯 デフォルト設定値（最新のベストプラクティス）
const DEFAULT_CONFIG = {
  GOOGLE_MAPS_MAP_ID: '佐渡島マップ',
  BASE_PATH: '/',
  CACHE_TTL: 3600000, // 1時間
  API_TIMEOUT: 10000, // 10秒
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
} as const;

/**
 * 🌟 アプリケーション設定の取得（統合版・強化版）
 */
export const getAppConfig = () => {
  const sheetsConfig = getSheetsConfig();
  const {
    VITE_APP_NAME,
    VITE_APP_VERSION,
    VITE_BASE_PATH,
    BASE_URL,
    VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_MAPS_MAP_ID,
    VITE_GOOGLE_SPREADSHEET_ID,
    VITE_GOOGLE_SHEETS_API_KEY,
    VITE_EMAILJS_SERVICE_ID,
    VITE_EMAILJS_TEMPLATE_ID,
    VITE_EMAILJS_PUBLIC_KEY,
    VITE_CACHE_TTL,
    VITE_API_TIMEOUT,
    VITE_BATCH_SIZE,
    VITE_MAX_RETRIES,
    VITE_DEBUG_MODE,
    VITE_ENABLE_CONSOLE_LOGS,
    VITE_FEATURE_OFFLINE_MODE,
    VITE_FEATURE_PWA_INSTALL,
    VITE_FEATURE_GEOLOCATION,
    MODE,
  } = import.meta.env;

  return {
    // 🏗️ 基本アプリケーション設定
    app: {
      name: getEnvValue(VITE_APP_NAME as string | undefined, 'sado-kueccha'),
      version: getEnvValue(VITE_APP_VERSION as string | undefined, '0.1.0'),
      basePath: getEnvValue(
        VITE_BASE_PATH as string | undefined,
        DEFAULT_CONFIG.BASE_PATH
      ),
      baseUrl: BASE_URL || '/',
    },

    // 🗺️ Google Maps関連
    maps: {
      apiKey: getEnvValue(VITE_GOOGLE_MAPS_API_KEY as string | undefined),
      mapId: getEnvValue(
        VITE_GOOGLE_MAPS_MAP_ID as string | undefined,
        DEFAULT_CONFIG.GOOGLE_MAPS_MAP_ID
      ),
    },

    // 📊 データソース関連
    data: {
      spreadsheetId: getEnvValue(
        VITE_GOOGLE_SPREADSHEET_ID as string | undefined
      ),
      sheetsApiKey: getEnvValue(
        VITE_GOOGLE_SHEETS_API_KEY as string | undefined
      ),
      sheets: sheetsConfig,
    },

    // 📧 EmailJS設定
    email: {
      serviceId: getEnvValue(VITE_EMAILJS_SERVICE_ID as string | undefined),
      templateId: getEnvValue(VITE_EMAILJS_TEMPLATE_ID as string | undefined),
      publicKey: getEnvValue(VITE_EMAILJS_PUBLIC_KEY as string | undefined),
    },

    // ⚡ パフォーマンス設定
    performance: {
      cacheTtl: getEnvNumber(
        VITE_CACHE_TTL as string | undefined,
        DEFAULT_CONFIG.CACHE_TTL
      ),
      apiTimeout: getEnvNumber(
        VITE_API_TIMEOUT as string | undefined,
        DEFAULT_CONFIG.API_TIMEOUT
      ),
      batchSize: getEnvNumber(
        VITE_BATCH_SIZE as string | undefined,
        DEFAULT_CONFIG.BATCH_SIZE
      ),
      maxRetries: getEnvNumber(
        VITE_MAX_RETRIES as string | undefined,
        DEFAULT_CONFIG.MAX_RETRIES
      ),
    },

    // 🔧 開発・デバッグ設定
    debug: {
      mode: getEnvBoolean(VITE_DEBUG_MODE as string | undefined, false),
      enableLogs: getEnvBoolean(
        VITE_ENABLE_CONSOLE_LOGS as string | undefined,
        false
      ),
    },

    // 🚀 フィーチャーフラグ
    features: {
      offlineMode: getEnvBoolean(
        VITE_FEATURE_OFFLINE_MODE as string | undefined,
        true
      ),
      pwaInstall: getEnvBoolean(
        VITE_FEATURE_PWA_INSTALL as string | undefined,
        true
      ),
      geolocation: getEnvBoolean(
        VITE_FEATURE_GEOLOCATION as string | undefined,
        true
      ),
    },

    // 🌍 環境フラグ
    env: {
      isDev: isDevelopment(),
      isProd: isProduction(),
      mode: MODE,
    },
  };
};

/**
 * 🛡️ 必須環境変数の検証（アプリケーション用・強化版）
 */
export const validateAppConfig = (): void => {
  const {
    VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_SPREADSHEET_ID,
    VITE_GOOGLE_SHEETS_API_KEY,
  } = import.meta.env;

  // 必須のAPIキー検証
  const requiredApiKeys = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
  ];

  validateRequiredEnvVars(
    {
      VITE_GOOGLE_MAPS_API_KEY: getEnvValue(
        VITE_GOOGLE_MAPS_API_KEY as string | undefined
      ),
      VITE_GOOGLE_SPREADSHEET_ID: getEnvValue(
        VITE_GOOGLE_SPREADSHEET_ID as string | undefined
      ),
      VITE_GOOGLE_SHEETS_API_KEY: getEnvValue(
        VITE_GOOGLE_SHEETS_API_KEY as string | undefined
      ),
    },
    requiredApiKeys
  );

  // セキュリティチェック
  if (isProduction()) {
    const mapsKey = getEnvValue(VITE_GOOGLE_MAPS_API_KEY as string | undefined);
    const spreadsheetId = getEnvValue(
      VITE_GOOGLE_SPREADSHEET_ID as string | undefined
    );
    const sheetsKey = getEnvValue(
      VITE_GOOGLE_SHEETS_API_KEY as string | undefined
    );

    const invalidKeys: string[] = [];

    if (
      !mapsKey ||
      mapsKey.includes('your_') ||
      mapsKey.includes('example') ||
      mapsKey.length < 10 ||
      mapsKey === 'test'
    ) {
      invalidKeys.push('VITE_GOOGLE_MAPS_API_KEY');
    }

    if (
      !spreadsheetId ||
      spreadsheetId.includes('your_') ||
      spreadsheetId.includes('example') ||
      spreadsheetId.length < 10 ||
      spreadsheetId === 'test'
    ) {
      invalidKeys.push('VITE_GOOGLE_SPREADSHEET_ID');
    }

    if (
      !sheetsKey ||
      sheetsKey.includes('your_') ||
      sheetsKey.includes('example') ||
      sheetsKey.length < 10 ||
      sheetsKey === 'test'
    ) {
      invalidKeys.push('VITE_GOOGLE_SHEETS_API_KEY');
    }

    if (invalidKeys.length > 0) {
      throw new Error(
        `🚨 本番環境で無効なAPIキーが検出されました: ${invalidKeys.join(', ')}`
      );
    }
  }

  debugLog('✅ 環境変数の検証が完了しました');
};

/**
 * 🔍 アプリケーション起動時の環境チェック
 */
export const performStartupCheck = (): void => {
  try {
    validateAppConfig();
    const config = getAppConfig();

    debugLog('🚀 アプリケーション設定', {
      app: config.app,
      env: config.env,
      features: config.features,
    });

    if (config.env.isDev) {
      debugLog('🔧 開発モードで実行中');
    }
  } catch (error) {
    errorLog('環境設定エラー', error);
    throw error;
  }
};
