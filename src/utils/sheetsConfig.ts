import type { SheetId, SheetsConfig } from "../types";

/**
 * 環境変数の型安全な取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns 環境変数の値
 */
const getEnvValue = (value: string | undefined, defaultValue: string): SheetId => {
  return createSheetId(value || defaultValue);
};

/**
 * Creates a branded SheetId from a string
 */
function createSheetId(id: string): SheetId {
  return id as SheetId;
}

/**
 * デフォルトのシート設定（文字列）
 * 型定義と一致するデフォルト値を提供
 */
const DEFAULT_SHEETS_CONFIG = {
  recommended: "recommended",
  toilets: "toilet",
  parking: "parking",
  ryotsuAikawa: "ryotsu_aikawa",
  kanaiSawada: "kanai_sawada",
  akadomariHamochi: "akadomari_hamochi",
  snacks: "snacks",
} as const;

/**
 * 環境変数からシート設定を取得
 * 個別の環境変数を使用し、型安全性を確保
 */
export function getSheetsConfig(): SheetsConfig {
  return {
    recommended: getEnvValue(
      import.meta.env.VITE_SHEETS_RECOMMENDED,
      DEFAULT_SHEETS_CONFIG.recommended,
    ),
    toilets: getEnvValue(import.meta.env.VITE_SHEETS_TOILETS, DEFAULT_SHEETS_CONFIG.toilets),
    parking: getEnvValue(import.meta.env.VITE_SHEETS_PARKING, DEFAULT_SHEETS_CONFIG.parking),
    ryotsuAikawa: getEnvValue(
      import.meta.env.VITE_SHEETS_RYOTSU_AIKAWA,
      DEFAULT_SHEETS_CONFIG.ryotsuAikawa,
    ),
    kanaiSawada: getEnvValue(
      import.meta.env.VITE_SHEETS_KANAI_SAWADA,
      DEFAULT_SHEETS_CONFIG.kanaiSawada,
    ),
    akadomariHamochi: getEnvValue(
      import.meta.env.VITE_SHEETS_AKADOMARI_HAMOCHI,
      DEFAULT_SHEETS_CONFIG.akadomariHamochi,
    ),
    snacks: getEnvValue(import.meta.env.VITE_SHEETS_SNACKS, DEFAULT_SHEETS_CONFIG.snacks),
  };
}

/**
 * 特定のシート名を取得
 * @param sheetKey シートのキー
 * @returns シート名
 */
export const getSheetName = (sheetKey: keyof SheetsConfig): string => {
  const config = getSheetsConfig();
  return config[sheetKey] || "";
};
