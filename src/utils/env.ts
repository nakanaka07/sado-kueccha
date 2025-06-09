/**
 * 環境変数アクセスユーティリティ
 * 型安全で統一された環境変数アクセスを提供
 */

/**
 * 環境変数の型安全な取得（簡易版）
 * @param value 環境変数の値
 * @param defaultValue デフォルト値（オプション）
 * @returns 環境変数の値
 */
export const getEnvValue = (
  value: string | undefined,
  defaultValue: string = "",
): string => {
  return value || defaultValue;
};

/**
 * 数値型環境変数の取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns 数値型の環境変数の値
 */
export const getEnvNumber = (
  value: string | undefined,
  defaultValue: number,
): number => {
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
};

/**
 * 必須環境変数の検証
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
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

/**
 * 開発環境チェック
 */
export const isDevelopment = (): boolean => import.meta.env.DEV;

/**
 * 本番環境チェック
 */
export const isProduction = (): boolean => import.meta.env.PROD;

/**
 * アプリケーション設定の取得
 */
export const getAppConfig = () => ({
  // Google Maps関連
  googleMapsApiKey: getEnvValue(import.meta.env.VITE_GOOGLE_MAPS_API_KEY),
  googleMapsMapId: getEnvValue(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, "佐渡島マップ"),
  
  // データソース関連
  googleSpreadsheetId: getEnvValue(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID),
  googleSheetsApiKey: getEnvValue(import.meta.env.VITE_GOOGLE_SHEETS_API_KEY),
  
  // アプリケーション基本設定
  basePath: getEnvValue(import.meta.env.VITE_BASE_PATH, ""),
  cacheTtl: getEnvNumber(import.meta.env.VITE_CACHE_TTL, 300000),
  
  // スプレッドシート設定
  sheets: {
    recommended: getEnvValue(import.meta.env.VITE_SHEET_RECOMMENDED),
    ryotsuAikawa: getEnvValue(import.meta.env.VITE_SHEET_RYOTSU_AIKAWA),
    kanaiSawada: getEnvValue(import.meta.env.VITE_SHEET_KANAI_SAWADA),
    akadomariHamochi: getEnvValue(import.meta.env.VITE_SHEET_AKADOMARI_HAMOCHI),
    snack: getEnvValue(import.meta.env.VITE_SHEET_SNACK),
    toilet: getEnvValue(import.meta.env.VITE_SHEET_TOILET),
    parking: getEnvValue(import.meta.env.VITE_SHEET_PARKING),
  },
  
  // 環境フラグ
  isDev: isDevelopment(),
  isProd: isProduction(),
  
  // ベースURL
  baseUrl: getEnvValue(import.meta.env.BASE_URL, "/"),
});

/**
 * 必須環境変数の検証（アプリケーション用）
 */
export const validateAppConfig = (): void => {
  const env = import.meta.env;
  validateRequiredEnvVars(
    {
      VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
      VITE_GOOGLE_SPREADSHEET_ID: env.VITE_GOOGLE_SPREADSHEET_ID,
    },
    ["VITE_GOOGLE_MAPS_API_KEY", "VITE_GOOGLE_SPREADSHEET_ID"],
  );
};
