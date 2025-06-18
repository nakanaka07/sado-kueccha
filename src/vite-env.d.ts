/// <reference types="vite/client" />

/**
 * 🔧 Vite環境変数の型定義
 * 最新のTypeScript & Vite 6.x ベストプラクティスに基づいて設計
 *
 * @description
 * - 2024年最新のViteガイドラインに準拠
 * - 厳密な型安全性を提供
 * - 開発者体験を向上させるJSDoc付き
 * - パフォーマンスとセキュリティを重視
 *
 * @see https://vite.dev/guide/env-and-mode.html#intellisense-for-typescript
 * @version 2024年最新版
 */

/**
 * 型安全性のオプション設定
 * unknown を指定することで、未定義の環境変数へのアクセスを防止
 */
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

/**
 * カスタム環境変数の型定義
 * 全ての環境変数は readonly として定義し、イミュータブル性を保証
 */
interface ImportMetaEnv {
  // ===== Vite組み込み定数 =====
  /** @description アプリケーションの実行モード (development | production | test) */
  readonly MODE: string;
  /** @description アプリケーションのベースURL */
  readonly BASE_URL: string;
  /** @description 本番環境かどうかのブール値 */
  readonly PROD: boolean;
  /** @description 開発環境かどうかのブール値 */
  readonly DEV: boolean;
  /** @description SSRモードかどうかのブール値 */
  readonly SSR: boolean;

  // ===== 基本アプリケーション設定 =====
  /** @description アプリケーション名 */
  readonly VITE_APP_NAME: string;
  /** @description アプリケーションバージョン */
  readonly VITE_APP_VERSION: string;
  /** @description アプリケーションのベースパス */
  readonly VITE_BASE_PATH: string;
  /** @description キャッシュの有効期限（秒） */
  readonly VITE_CACHE_TTL: string;
  /** @description API通信のタイムアウト時間（ミリ秒） */
  readonly VITE_API_TIMEOUT: string;

  // ===== Google Maps関連 =====
  /** @description Google Maps APIキー（必須） */
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  /** @description Google Maps Map ID（オプション） */
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;

  // ===== Google Sheets関連 =====
  /** @description Google SpreadsheetのID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  /** @description Google Sheets APIキー */
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;

  // ===== データ取得最適化 =====
  /** @description バッチ処理のサイズ */
  readonly VITE_BATCH_SIZE: string;
  /** @description リトライの最大回数 */
  readonly VITE_MAX_RETRIES: string;

  // ===== EmailJS設定 =====
  /** @description EmailJSサービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** @description EmailJSテンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** @description EmailJSパブリックキー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ===== Google Sheetsデータソース設定 =====
  /** @description おすすめスポットシート名 */
  readonly VITE_SHEETS_RECOMMENDED: string;
  /** @description 両津・相川エリアシート名 */
  readonly VITE_SHEETS_RYOTSU_AIKAWA: string;
  /** @description 金井・佐和田エリアシート名 */
  readonly VITE_SHEETS_KANAI_SAWADA: string;
  /** @description 赤泊・羽茂エリアシート名 */
  readonly VITE_SHEETS_AKADOMARI_HAMOCHI: string;
  /** @description 軽食・スナックシート名 */
  readonly VITE_SHEETS_SNACKS: string;
  /** @description トイレ情報シート名 */
  readonly VITE_SHEETS_TOILETS: string;
  /** @description 駐車場情報シート名 */
  readonly VITE_SHEETS_PARKING: string;

  // ===== 開発・デバッグ設定 =====
  /** @description デバッグモードの有効化 */
  readonly VITE_DEBUG_MODE: string;
  /** @description コンソールログの有効化 */
  readonly VITE_ENABLE_CONSOLE_LOGS: string;

  // ===== Progressive Web App (PWA) フィーチャーフラグ =====
  /** @description オフラインモード機能の有効化 */
  readonly VITE_FEATURE_OFFLINE_MODE: string;
  /** @description PWAインストール機能の有効化 */
  readonly VITE_FEATURE_PWA_INSTALL: string;
  /** @description 位置情報取得機能の有効化 */
  readonly VITE_FEATURE_GEOLOCATION: string;

  // ===== セキュリティ関連 =====
  /** @description CORS設定（オプション） */
  readonly VITE_CORS_ORIGINS?: string;
  /** @description CSP（Content Security Policy）設定（オプション） */
  readonly VITE_CSP_DIRECTIVES?: string;
}

/**
 * ImportMeta インターフェースの拡張
 * Vite 6.x の最新仕様に準拠
 */
interface ImportMeta {
  /** @description 環境変数へのアクセスポイント（型安全） */
  readonly env: ImportMetaEnv;

  /** @description モジュールの絶対URL（ESモジュール標準） */
  readonly url: string;

  /** @description Hot Module Replacement API（開発時のみ利用可能） */
  readonly hot?: import("vite/types/hot").ViteHotContext;

  /** @description Vite固有の開発者API */
  readonly glob?: import("vite/types/importGlob").ImportGlobFunction;
}

// ===== モジュール宣言セクション =====

/**
 * 🎨 CSSモジュールの型定義
 * 最新のCSS Modules仕様に対応
 */

/** @description 通常のCSSファイル */
declare module "*.css" {
  const content: string;
  export default content;
}

/** @description CSS Modules（クラス名マップ） */
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

/** @description Sass/SCSSファイル */
declare module "*.scss" {
  const content: string;
  export default content;
}

/** @description Sass/SCSS Modules */
declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

/** @description Less CSS ファイル */
declare module "*.less" {
  const content: string;
  export default content;
}

/** @description Stylus CSS ファイル */
declare module "*.styl" {
  const content: string;
  export default content;
}

/**
 * 🖼️ 静的アセットの型定義
 * Web標準およびモダンフォーマットをサポート
 */

/** @description PNG画像ファイル */
declare module "*.png" {
  const src: string;
  export default src;
}

/** @description JPEG画像ファイル */
declare module "*.jpg" {
  const src: string;
  export default src;
}

/** @description JPEG画像ファイル（.jpeg拡張子） */
declare module "*.jpeg" {
  const src: string;
  export default src;
}

/** @description GIF画像ファイル */
declare module "*.gif" {
  const src: string;
  export default src;
}

/** @description WebP画像ファイル（最新フォーマット） */
declare module "*.webp" {
  const src: string;
  export default src;
}

/** @description AVIF画像ファイル（次世代フォーマット） */
declare module "*.avif" {
  const src: string;
  export default src;
}

/** @description SVG画像ファイル */
declare module "*.svg" {
  const src: string;
  export default src;
}

/** @description ICO ファビコンファイル */
declare module "*.ico" {
  const src: string;
  export default src;
}

/**
 * 🗂️ その他ファイル形式の型定義
 * モダンWeb開発で使用される各種ファイル形式をサポート
 */

/** @description JSONファイル（厳密な型チェック） */
declare module "*.json" {
  const value: Record<string, unknown>;
  export default value;
}

/** @description プレーンテキストファイル */
declare module "*.txt" {
  const content: string;
  export default content;
}

/** @description マークダウンファイル */
declare module "*.md" {
  const content: string;
  export default content;
}

/** @description XMLファイル */
declare module "*.xml" {
  const content: string;
  export default content;
}

/**
 * 🎵 メディアファイルの型定義
 * 音声・動画コンテンツのサポート
 */

/** @description MP3音声ファイル */
declare module "*.mp3" {
  const src: string;
  export default src;
}

/** @description WAV音声ファイル */
declare module "*.wav" {
  const src: string;
  export default src;
}

/** @description MP4動画ファイル */
declare module "*.mp4" {
  const src: string;
  export default src;
}

/** @description WebM動画ファイル */
declare module "*.webm" {
  const src: string;
  export default src;
}

/**
 * 📄 フォントファイルの型定義
 * Web フォント形式をサポート
 */

/** @description WOFF フォントファイル */
declare module "*.woff" {
  const src: string;
  export default src;
}

/** @description WOFF2 フォントファイル（最新フォーマット） */
declare module "*.woff2" {
  const src: string;
  export default src;
}

/** @description TTF フォントファイル */
declare module "*.ttf" {
  const src: string;
  export default src;
}

/** @description EOT フォントファイル（レガシーサポート） */
declare module "*.eot" {
  const src: string;
  export default src;
}

/**
 * 🔧 Vite 固有のヘルパータイプ
 * 開発効率を向上させる型定義
 */

/**
 * @description 環境変数の型安全なアクセサ
 * @example
 * const apiKey = getEnvVar('VITE_API_KEY'); // string
 * const debugMode = getEnvVar('VITE_DEBUG_MODE'); // string
 */
type ViteEnvVar<T extends keyof ImportMetaEnv> = ImportMetaEnv[T];

/**
 * @description 型安全な環境変数取得関数の型定義
 * 実行時エラーを防ぐためのヘルパー型
 */
type RequiredEnvVars = {
  [K in keyof ImportMetaEnv as ImportMetaEnv[K] extends string ? K : never]: ImportMetaEnv[K];
};

/**
 * 🚀 アプリケーション固有の型拡張
 * プロジェクトの特性に合わせたカスタム型定義
 */

/** @description PWA マニフェストファイル */
declare module "*/manifest.json" {
  const manifest: {
    name: string;
    short_name: string;
    description: string;
    icons: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
    theme_color: string;
    background_color: string;
    display: string;
    start_url: string;
  };
  export default manifest;
}

/** @description Service Worker ファイル */
declare module "*/sw.js" {
  const swUrl: string;
  export default swUrl;
}
