/// <reference types="vite/client" />

/**
 * Vite環境変数の型定義
 */
interface ImportMetaEnv {
  // アプリケーション基本設定
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_CACHE_TTL: string;

  // Google Maps API関連
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;

  // データソース設定
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // EmailJS設定
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // スプレッドシート設定（個別定義）
  readonly VITE_SHEET_RECOMMENDED: string;
  readonly VITE_SHEET_RYOTSU_AIKAWA: string;
  readonly VITE_SHEET_KANAI_SAWADA: string;
  readonly VITE_SHEET_AKADOMARI_HAMOCHI: string;
  readonly VITE_SHEET_SNACK: string;
  readonly VITE_SHEET_TOILET: string;
  readonly VITE_SHEET_PARKING: string;

  // Google Sheets API関連
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;

  // 環境情報
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
