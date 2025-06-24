/// <reference types="vite-plugin-pwa/client" />

/**
 * 🔧 Vite環境変数型定義
 * プロジェクトで使用されるすべての環境変数を定義
 */
interface ImportMetaEnv {
  // ===== Vite組み込み定数 =====
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;

  // ===== カスタム環境変数 =====
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;
  readonly VITE_SHEETS_RECOMMENDED: string;
  readonly VITE_SHEETS_TOILETS: string;
  readonly VITE_SHEETS_PARKING: string;
  readonly VITE_SHEETS_RYOTSU_AIKAWA: string;
  readonly VITE_SHEETS_KANAI_SAWADA: string;
  readonly VITE_SHEETS_AKADOMARI_HAMOCHI: string;
  readonly VITE_SHEETS_SNACKS: string;
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
  readonly VITE_CACHE_TTL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_BATCH_SIZE: string;
  readonly VITE_MAX_RETRIES: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_ENABLE_CONSOLE_LOGS: string;
  readonly VITE_FEATURE_OFFLINE_MODE: string;
  readonly VITE_FEATURE_PWA_INSTALL: string;
  readonly VITE_FEATURE_GEOLOCATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * 🔧 Node.js環境変数の型定義
 */
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly CI?: string;
    readonly VITE_BASE_PATH?: string;
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    readonly GITHUB_REPOSITORY?: string;
    readonly npm_package_version?: string;
  }
}

/**
 * 🔧 CSS Modules型定義
 */
declare module '*.module.css';
declare module '*.css';

/**
 * 🔧 Virtual modules型定義
 */
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (
      registration: ServiceWorkerRegistration | undefined
    ) => void;
    onRegisterError?: (error: unknown) => void;
  }

  export function registerSW(
    options?: RegisterSWOptions
  ): (reloadPage?: boolean) => Promise<void>;
}

/**
 * 🔧 アセットファイルの型定義
 */
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.webp';
