/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * 🔧 Vite環境変数の型定義（シンプル版）
 * 実際に使用される環境変数のみ定義
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

  // ===== 実際に使用される環境変数のみ =====
  /** @description アプリケーション名 */
  readonly VITE_APP_NAME: string;
  /** @description アプリケーションバージョン */
  readonly VITE_APP_VERSION: string;
  /** @description アプリケーションのベースパス */
  readonly VITE_BASE_PATH: string;

  /** @description Google Maps API キー */
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  /** @description Google Maps マップID */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;

  /** @description Google Spreadsheet ID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  /** @description Google Sheets API キー */
  readonly VITE_GOOGLE_SHEETS_API_KEY: string;

  /** @description おすすめシート名 */
  readonly VITE_SHEETS_RECOMMENDED: string;
  /** @description トイレシート名 */
  readonly VITE_SHEETS_TOILETS: string;
  /** @description 駐車場シート名 */
  readonly VITE_SHEETS_PARKING: string;
  /** @description 両津・相川エリアシート名 */
  readonly VITE_SHEETS_RYOTSU_AIKAWA: string;
  /** @description 金井・佐和田エリアシート名 */
  readonly VITE_SHEETS_KANAI_SAWADA: string;
  /** @description 赤泊・羽茂エリアシート名 */
  readonly VITE_SHEETS_AKADOMARI_HAMOCHI: string;
  /** @description 軽食シート名 */
  readonly VITE_SHEETS_SNACKS: string;

  /** @description EmailJS サービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** @description EmailJS テンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** @description EmailJS パブリックキー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  /** @description キャッシュの有効期限（秒） */
  readonly VITE_CACHE_TTL: string;
  /** @description API タイムアウト（ミリ秒） */
  readonly VITE_API_TIMEOUT: string;
  /** @description バッチサイズ */
  readonly VITE_BATCH_SIZE: string;
  /** @description 最大リトライ回数 */
  readonly VITE_MAX_RETRIES: string;

  /** @description デバッグモード有効化 */
  readonly VITE_DEBUG_MODE: string;
  /** @description コンソールログ有効化 */
  readonly VITE_ENABLE_CONSOLE_LOGS: string;

  /** @description オフラインモード有効化 */
  readonly VITE_FEATURE_OFFLINE_MODE: string;
  /** @description PWAインストール有効化 */
  readonly VITE_FEATURE_PWA_INSTALL: string;
  /** @description 位置情報機能有効化 */
  readonly VITE_FEATURE_GEOLOCATION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
