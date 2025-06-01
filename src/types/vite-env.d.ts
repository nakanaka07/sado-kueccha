/// <reference types="vite/client" />

// Vite環境変数の型定義
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
  // スプレッドシート設定
  readonly [key: `VITE_SHEET_${string}`]: string;

  // その他環境変数
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
