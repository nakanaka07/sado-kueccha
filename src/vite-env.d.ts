/// <reference types="vite/client" />

/**
 * 🔧 Vite環境変数の型定義
 * 最新のTypeScriptベストプラクティスに基づいて強化
 */
interface ImportMetaEnv {
  // ===== 基本アプリケーション設定 =====
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_CACHE_TTL: string;
  readonly VITE_API_TIMEOUT: string;

  // ===== Google Maps関連 =====
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;

  // ===== Google Sheets関連 =====
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;

  // ===== データ取得最適化 =====
  readonly VITE_BATCH_SIZE: string;
  readonly VITE_MAX_RETRIES: string;

  // ===== EmailJS設定 =====
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ===== シート設定 =====
  readonly VITE_SHEETS_RECOMMENDED: string;
  readonly VITE_SHEETS_RYOTSU_AIKAWA: string;
  readonly VITE_SHEETS_KANAI_SAWADA: string;
  readonly VITE_SHEETS_AKADOMARI_HAMOCHI: string;
  readonly VITE_SHEETS_SNACKS: string;
  readonly VITE_SHEETS_TOILETS: string;
  readonly VITE_SHEETS_PARKING: string;

  // ===== 開発・デバッグ設定 =====
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;

  // ===== フィーチャーフラグ =====
  readonly VITE_FEATURE_OFFLINE_MODE: string;
  readonly VITE_FEATURE_PWA_INSTALL: string;
  readonly VITE_FEATURE_GEOLOCATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * 🎨 CSSモジュールの型定義
 */
declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

/**
 * 🖼️ 静的アセットの型定義
 */
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

/**
 * 🗂️ その他ファイル形式の型定義
 */
declare module "*.json" {
  const value: unknown;
  export default value;
}

declare module "*.txt" {
  const content: string;
  export default content;
}
