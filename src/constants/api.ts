/**
 * API関連の設定
 */

/**
 * Google Sheets API設定
 */
export const GOOGLE_SHEETS_API = {
  BASE_URL: "https://docs.google.com/spreadsheets/d",
  CSV_EXPORT_BASE: "export?format=csv",
  API_BASE: "https://sheets.googleapis.com/v4/spreadsheets",
  DEFAULT_RANGE: "AB:AX",
} as const;

/**
 * 汎用API設定
 */
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
} as const;
