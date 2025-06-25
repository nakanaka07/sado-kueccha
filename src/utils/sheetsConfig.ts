import type { SheetId, SheetsConfig } from '../types';

/**
 * 環境変数の型安全な取得
 * @param value 環境変数の値
 * @param defaultValue デフォルト値
 * @returns 環境変数の値
 */
const getEnvValue = (
  value: string | undefined,
  defaultValue: string
): SheetId => {
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
  recommended: 'recommended',
  toilets: 'toilet',
  parking: 'parking',
  ryotsuAikawa: 'ryotsu_aikawa',
  kanaiSawada: 'kanai_sawada',
  akadomariHamochi: 'akadomari_hamochi',
  snacks: 'snacks',
} as const;

/**
 * 環境変数からシート設定を取得
 * 個別の環境変数を使用し、型安全性を確保
 */
export function getSheetsConfig(): SheetsConfig {
  const {
    VITE_SHEETS_RECOMMENDED,
    VITE_SHEETS_TOILETS,
    VITE_SHEETS_PARKING,
    VITE_SHEETS_RYOTSU_AIKAWA,
    VITE_SHEETS_KANAI_SAWADA,
    VITE_SHEETS_AKADOMARI_HAMOCHI,
    VITE_SHEETS_SNACKS,
  } = import.meta.env;

  return {
    recommended: getEnvValue(
      VITE_SHEETS_RECOMMENDED as string | undefined,
      DEFAULT_SHEETS_CONFIG.recommended
    ),
    toilets: getEnvValue(
      VITE_SHEETS_TOILETS as string | undefined,
      DEFAULT_SHEETS_CONFIG.toilets
    ),
    parking: getEnvValue(
      VITE_SHEETS_PARKING as string | undefined,
      DEFAULT_SHEETS_CONFIG.parking
    ),
    ryotsuAikawa: getEnvValue(
      VITE_SHEETS_RYOTSU_AIKAWA as string | undefined,
      DEFAULT_SHEETS_CONFIG.ryotsuAikawa
    ),
    kanaiSawada: getEnvValue(
      VITE_SHEETS_KANAI_SAWADA as string | undefined,
      DEFAULT_SHEETS_CONFIG.kanaiSawada
    ),
    akadomariHamochi: getEnvValue(
      VITE_SHEETS_AKADOMARI_HAMOCHI as string | undefined,
      DEFAULT_SHEETS_CONFIG.akadomariHamochi
    ),
    snacks: getEnvValue(
      VITE_SHEETS_SNACKS as string | undefined,
      DEFAULT_SHEETS_CONFIG.snacks
    ),
  };
}

/**
 * 特定のシート名を取得
 * @param sheetKey シートのキー
 * @returns シート名
 */
export const getSheetName = (sheetKey: keyof SheetsConfig): string => {
  const config = getSheetsConfig();
  return config[sheetKey] || '';
};
