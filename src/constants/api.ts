/**
 * 🌐 API関連の設定定数
 * 2025年最新のベストプラクティスに基づいた設計
 *
 * @description
 * - 型安全性とパフォーマンスを重視
 * - セキュリティ対応（CSP準拠、HTTPS強制）
 * - モダンHTTPクライアント対応
 * - リトライ戦略とタイムアウト管理
 *
 * @version 2.0.0
 * @since 2025-01-01
 */

/**
 * Google Sheets API 設定定数
 *
 * @description Google Sheets API v4に最適化された設定
 * @see https://developers.google.com/sheets/api/reference/rest
 */
export const GOOGLE_SHEETS_API = {
  /** @description Google Sheets のベースURL（HTTPS強制） */
  BASE_URL: "https://docs.google.com/spreadsheets/d" as const,
  /** @description CSV エクスポート用のクエリパラメータ */
  CSV_EXPORT_BASE: "export?format=csv" as const,
  /** @description Google Sheets API v4 のベースURL */
  API_BASE: "https://sheets.googleapis.com/v4/spreadsheets" as const,
  /** @description デフォルトの読み取り範囲 */
  DEFAULT_RANGE: "AB:AX" as const,
  /** @description API バージョン */
  VERSION: "v4" as const,
  /** @description 対応する MIME タイプ */
  MIME_TYPES: {
    CSV: "text/csv" as const,
    JSON: "application/json" as const,
    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const,
  },
} as const satisfies Readonly<{
  readonly BASE_URL: string;
  readonly CSV_EXPORT_BASE: string;
  readonly API_BASE: string;
  readonly DEFAULT_RANGE: string;
  readonly VERSION: string;
  readonly MIME_TYPES: Readonly<Record<string, string>>;
}>;

/**
 * HTTP リクエスト設定
 *
 * @description モダンブラウザとAPI通信に最適化された設定
 */
export const HTTP_CONFIG = {
  /** @description デフォルトのリクエストタイムアウト（ミリ秒） */
  TIMEOUT: 10_000 as const,
  /** @description 長時間実行される処理のタイムアウト */
  LONG_TIMEOUT: 30_000 as const,
  /** @description リトライ試行回数 */
  RETRY_ATTEMPTS: 3 as const,
  /** @description リトライ間隔（指数バックオフ）のベース値（ミリ秒） */
  RETRY_BASE_DELAY: 1_000 as const,
  /** @description リトライ間隔の最大値（ミリ秒） */
  RETRY_MAX_DELAY: 10_000 as const,
  /** @description 並行リクエスト数の上限 */
  CONCURRENT_LIMIT: 5 as const,
} as const satisfies Readonly<Record<string, number>>;

/**
 * HTTP ヘッダー設定
 *
 * @description セキュリティとパフォーマンスを重視したヘッダー設定
 */
export const HTTP_HEADERS = {
  /** @description デフォルトのHTTPヘッダー */
  DEFAULT: {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
  } as const,
  /** @description API通信用のヘッダー */
  API: {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  } as const,
  /** @description フォームデータ用のヘッダー */
  FORM: {
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    Accept: "application/json, text/html",
  } as const,
  /** @description ファイルアップロード用のヘッダー */
  MULTIPART: {
    Accept: "application/json",
    // Content-Type は自動設定されるため除外
  } as const,
} as const satisfies Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * レスポンス状態コード定義
 *
 * @description HTTP ステータスコードの型安全な定数
 */
export const HTTP_STATUS = {
  /** @description 成功レスポンス */
  SUCCESS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
  },
  /** @description リダイレクト */
  REDIRECT: {
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,
  },
  /** @description クライアントエラー */
  CLIENT_ERROR: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    RATE_LIMITED: 429,
  },
  /** @description サーバーエラー */
  SERVER_ERROR: {
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },
} as const satisfies Readonly<Record<string, Readonly<Record<string, number>>>>;

/**
 * API エンドポイント設定
 *
 * @description 外部APIへの接続設定
 */
export const API_ENDPOINTS = {
  /** @description Google Services */
  GOOGLE: {
    SHEETS: GOOGLE_SHEETS_API.API_BASE,
    MAPS: "https://maps.googleapis.com/maps/api",
    PLACES: "https://places.googleapis.com/v1",
  } as const,
} as const satisfies Readonly<Record<string, Readonly<Record<string, string>>>>;

/**
 * 旧設定との互換性維持
 * @deprecated v1.x との互換性のため残している。v3.0で削除予定
 */
export const API_CONFIG = HTTP_CONFIG;
