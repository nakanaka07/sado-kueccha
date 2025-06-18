/**
 * 🌍 環境変数管理ユーティリティ
 * 最新のベストプラクティスに基づいた型安全な環境変数管理
 */

import { getSheetsConfig } from "./sheetsConfig";

/**
 * 🔧 環境変数の型安全な取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値（オプション）
 * @returns 環境変数の値
 */
export const getEnvValue = (value: string | undefined, defaultValue = ""): string => {
  return value || defaultValue;
};

/**
 * 🔢 数値型環境変数の取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns 数値型の環境変数の値
 */
export const getEnvNumber = (value: string | undefined, defaultValue: number): number => {
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
};

/**
 * ✅ ブール型環境変数の取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns ブール型の環境変数の値
 */
export const getEnvBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1" || value === "yes";
};

/**
 * 🛡️ 必須環境変数の検証
 * @param vars 環境変数の値のオブジェクト
 * @param requiredKeys 必須キーのリスト
 * @throws 欠落している環境変数がある場合はエラー
 */
export const validateRequiredEnvVars = (
  vars: Record<string, string | undefined>,
  requiredKeys: string[],
): void => {
  const missing = requiredKeys.filter((key) => !vars[key]);

  if (missing.length > 0) {
    throw new Error(`❌ 必須環境変数が不足しています: ${missing.join(", ")}`);
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
 * ⚠️ 警告ログ
 */
export const warnLog = (message: string, ...args: unknown[]): void => {
  console.warn(`⚠️ [WARN] ${message}`, ...args);
};

/**
 * ❌ エラーログ
 */
export const errorLog = (message: string, ...args: unknown[]): void => {
  console.error(`❌ [ERROR] ${message}`, ...args);
};

// 🎯 デフォルト設定値（最新のベストプラクティス）
const DEFAULT_CONFIG = {
  GOOGLE_MAPS_MAP_ID: "佐渡島マップ",
  BASE_PATH: "/",
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

  return {
    // 🏗️ 基本アプリケーション設定
    app: {
      name: getEnvValue(import.meta.env.VITE_APP_NAME, "sado-kueccha"),
      version: getEnvValue(import.meta.env.VITE_APP_VERSION, "0.1.0"),
      basePath: getEnvValue(import.meta.env.VITE_BASE_PATH, DEFAULT_CONFIG.BASE_PATH),
      baseUrl: import.meta.env.BASE_URL || "/",
    },

    // 🗺️ Google Maps関連
    maps: {
      apiKey: getEnvValue(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
      mapId: getEnvValue(
        import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        DEFAULT_CONFIG.GOOGLE_MAPS_MAP_ID,
      ),
    },

    // 📊 データソース関連
    data: {
      spreadsheetId: getEnvValue(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID),
      sheetsApiKey: getEnvValue(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY),
      sheets: sheetsConfig,
    },

    // 📧 EmailJS設定
    email: {
      serviceId: getEnvValue(import.meta.env.VITE_EMAILJS_SERVICE_ID),
      templateId: getEnvValue(import.meta.env.VITE_EMAILJS_TEMPLATE_ID),
      publicKey: getEnvValue(import.meta.env.VITE_EMAILJS_PUBLIC_KEY),
    },

    // ⚡ パフォーマンス設定
    performance: {
      cacheTtl: getEnvNumber(import.meta.env.VITE_CACHE_TTL, DEFAULT_CONFIG.CACHE_TTL),
      apiTimeout: getEnvNumber(import.meta.env.VITE_API_TIMEOUT, DEFAULT_CONFIG.API_TIMEOUT),
      batchSize: getEnvNumber(import.meta.env.VITE_BATCH_SIZE, DEFAULT_CONFIG.BATCH_SIZE),
      maxRetries: getEnvNumber(import.meta.env.VITE_MAX_RETRIES, DEFAULT_CONFIG.MAX_RETRIES),
    },

    // 🔧 開発・デバッグ設定
    debug: {
      mode: getEnvBoolean(import.meta.env.VITE_DEBUG_MODE, false),
      enableLogs: getEnvBoolean(import.meta.env.VITE_ENABLE_CONSOLE_LOGS, false),
    },

    // 🚀 フィーチャーフラグ
    features: {
      offlineMode: getEnvBoolean(import.meta.env.VITE_FEATURE_OFFLINE_MODE, true),
      pwaInstall: getEnvBoolean(import.meta.env.VITE_FEATURE_PWA_INSTALL, true),
      geolocation: getEnvBoolean(import.meta.env.VITE_FEATURE_GEOLOCATION, true),
    },

    // 🌍 環境フラグ
    env: {
      isDev: isDevelopment(),
      isProd: isProduction(),
      mode: import.meta.env.MODE,
    },
  };
};

/**
 * 🛡️ 必須環境変数の検証（アプリケーション用・強化版）
 */
export const validateAppConfig = (): void => {
  const { env } = import.meta;

  // 必須のAPIキー検証
  const requiredApiKeys = [
    "VITE_GOOGLE_MAPS_API_KEY",
    "VITE_GOOGLE_SPREADSHEET_ID",
    "VITE_GOOGLE_SHEETS_API_KEY",
  ];

  validateRequiredEnvVars(
    {
      VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
      VITE_GOOGLE_SPREADSHEET_ID: env.VITE_GOOGLE_SPREADSHEET_ID,
      VITE_GOOGLE_SHEETS_API_KEY: env.VITE_GOOGLE_SHEETS_API_KEY,
    },
    requiredApiKeys,
  );

  // セキュリティチェック
  if (isProduction()) {
    const sensitiveKeys = requiredApiKeys.filter((key) => {
      const value = env[key as keyof typeof env] as string | undefined;
      return (
        !value ||
        (typeof value === "string" && (value.includes("your_") || value.includes("example")))
      );
    });

    if (sensitiveKeys.length > 0) {
      throw new Error(`🚨 本番環境で無効なAPIキーが検出されました: ${sensitiveKeys.join(", ")}`);
    }
  }

  debugLog("✅ 環境変数の検証が完了しました");
};

/**
 * 🔍 アプリケーション起動時の環境チェック
 */
export const performStartupCheck = (): void => {
  try {
    validateAppConfig();
    const config = getAppConfig();

    debugLog("🚀 アプリケーション設定", {
      app: config.app,
      env: config.env,
      features: config.features,
    });

    if (config.env.isDev) {
      debugLog("🔧 開発モードで実行中");
    }
  } catch (error) {
    errorLog("環境設定エラー", error);
    throw error;
  }
};
