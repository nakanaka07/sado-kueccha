/**
 * 🔧 サービス統合設定ファイル
 *
 * @description 全サービスの設定を一元管理する統合設定
 * @version 2.1.0 - 設定統合とモジュール化
 */

/**
 * Google Sheets API 設定
 */
export const GOOGLE_SHEETS_API = {
  BASE_URL: 'https://docs.google.com/spreadsheets/d',
  CSV_BASE_URL: 'https://docs.google.com/spreadsheets/d',
  API_BASE: 'https://sheets.googleapis.com/v4/spreadsheets',
  CSV_EXPORT_BASE: 'export?format=csv',
  DEFAULT_RANGE: 'AB:AX',
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  BATCH_SIZE: 100,
} as const;

/**
 * キャッシュ設定（統合）
 */
export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 900000, // 15分
  MEMORY: {
    MAX_SIZE: 100,
    TTL: 300000, // 5分
  },
  PERFORMANCE: {
    PREFETCH_THRESHOLD: 0.7,
    BATCH_SIZE: 10,
  },
  TIMEOUTS: {
    DEFAULT: 5000,
    CRITICAL: 10000,
  },
  TTL: {
    SHORT: 5 * 60 * 1000, // 5分
    MEDIUM: 15 * 60 * 1000, // 15分
    LONG: 60 * 60 * 1000, // 1時間
    SHEETS: 7200000, // 2時間
    POI: 900000, // 15分
    ASSETS: 604800000, // 7日
  },
  LIMITS: {
    MAX_ENTRY_SIZE: 10,
    MAX_ENTRIES: 200,
    MAX_MEMORY_MB: 50,
    CLEANUP_THRESHOLD: 80,
  },
} as const;

/**
 * Sheets データ構造設定
 */
export const SHEETS_DATA_CONFIG = {
  /**
   * 列のマッピング定数（AB〜AX範囲で0-indexed）
   */
  COLUMNS: {
    DISTRICT: 0, // AB列: 地区（入力）
    COORDINATES: 4, // AF列: 座標（経度,緯度）
    NAME: 5, // AG列: 名称
    GENRE: 6, // AH列: ジャンル
    CATEGORY: 7, // AI列: シートカテゴリー
    PARKING: 8, // AJ列: 隣接駐車場
    CASHLESS: 9, // AK列: キャッシュレス対応
    MONDAY: 10, // AL列: 月曜
    TUESDAY: 11, // AM列: 火曜
    WEDNESDAY: 12, // AN列: 水曜
    THURSDAY: 13, // AO列: 木曜
    FRIDAY: 14, // AP列: 金曜
    SATURDAY: 15, // AQ列: 土曜
    SUNDAY: 16, // AR列: 日曜
    HOLIDAY: 17, // AS列: 祝祭
    CLOSED_DAYS: 18, // AT列: 定休日補足
    RELATED_INFO: 19, // AU列: 関連情報
    GOOGLE_MAPS: 20, // AV列: Google マップで見る
    CONTACT: 21, // AW列: 問い合わせ
    ADDRESS: 22, // AX列: 所在地
  } as const,

  /**
   * キャッシュレス判定用の値
   */
  CASHLESS_TRUE_VALUES: new Set([
    'true',
    '○',
    'yes',
    '可',
    'あり',
    '1',
    '対応',
  ]),

  /**
   * 必須カラム（データ変換時の検証用）
   */
  REQUIRED_COLUMNS: ['NAME', 'COORDINATES', 'GENRE'] as const,

  /**
   * デフォルトの範囲設定
   */
  DEFAULT_RANGE: 'AB:AX',
} as const;

/**
 * ロード戦略設定（最適化済み）
 */
export interface LoadStrategy {
  sheetName: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  initialSize: number;
  maxSize: number;
  preload: boolean;
}

export const LOAD_STRATEGIES: LoadStrategy[] = [
  {
    sheetName: 'recommended',
    priority: 'critical',
    initialSize: 20,
    maxSize: 50,
    preload: true,
  },
  {
    sheetName: 'snacks',
    priority: 'high',
    initialSize: 30,
    maxSize: 100,
    preload: true,
  },
  {
    sheetName: 'parking',
    priority: 'high',
    initialSize: 30,
    maxSize: 100,
    preload: true,
  },
  {
    sheetName: 'toilets',
    priority: 'high',
    initialSize: 30,
    maxSize: 100,
    preload: true,
  },
  {
    sheetName: 'ryotsu_aikawa',
    priority: 'normal',
    initialSize: 50,
    maxSize: 200,
    preload: false,
  },
  {
    sheetName: 'kanai_sawada',
    priority: 'normal',
    initialSize: 50,
    maxSize: 200,
    preload: false,
  },
  {
    sheetName: 'akadomari_hamochi',
    priority: 'normal',
    initialSize: 50,
    maxSize: 200,
    preload: false,
  },
] as const;

/**
 * プリロード設定
 */
export const PRELOAD_CONFIG = {
  /**
   * 重要なアセット（プリロード対象）
   */
  CRITICAL_ASSETS: [
    '/assets/title_row1.png',
    '/assets/title_row2.png',
    '/assets/current_location.png',
  ] as const,

  /**
   * プリロードタイムアウト
   */
  TIMEOUTS: {
    ASSET_LOAD: 5000, // 5秒
    DATA_LOAD: 10000, // 10秒
    TOTAL: 15000, // 15秒
  },

  /**
   * 並列処理設定
   */
  CONCURRENCY: {
    ASSETS: 3,
    DATA_FETCH: 2,
  },
} as const;

/**
 * エラーハンドリング設定
 */
export const ERROR_CONFIG = {
  /**
   * リトライ設定
   */
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000, // 1秒
    MAX_DELAY: 5000, // 5秒
    EXPONENTIAL_BASE: 2,
  },

  /**
   * タイムアウト設定
   */
  TIMEOUTS: {
    API_REQUEST: 10000, // 10秒
    CSV_FETCH: 8000, // 8秒
    VALIDATION: 2000, // 2秒
  },

  /**
   * エラーカテゴリ
   */
  CATEGORIES: {
    NETWORK: 'network',
    AUTH: 'authentication',
    VALIDATION: 'validation',
    TIMEOUT: 'timeout',
    UNKNOWN: 'unknown',
  } as const,
} as const;

/**
 * パフォーマンス監視設定
 */
export const PERFORMANCE_CONFIG = {
  /**
   * 監視しきい値（ミリ秒）
   */
  THRESHOLDS: {
    SLOW_OPERATION: 500,
    VERY_SLOW_OPERATION: 1000,
    CRITICAL_OPERATION: 2000,
  },

  /**
   * ログ設定
   */
  LOGGING: {
    MAX_ENTRIES: 1000,
    RETENTION_HOURS: 24,
    CONSOLE_LOG_THRESHOLD: 500, // 500ms以上でコンソール出力
  },

  /**
   * メトリクス収集設定
   */
  METRICS: {
    SAMPLE_RATE: 1.0, // 100%
    BATCH_SIZE: 10,
    FLUSH_INTERVAL: 60000, // 1分
  },
} as const;

/**
 * 開発環境設定
 */
export const DEV_CONFIG = {
  /**
   * デバッグ設定
   */
  DEBUG: {
    ENABLE_CONSOLE_LOGS: true,
    ENABLE_PERFORMANCE_LOGS: true,
    ENABLE_CACHE_STATS: true,
    ENABLE_ERROR_DETAILS: true,
  },

  /**
   * モック設定
   */
  MOCK: {
    ENABLE_API_MOCK: false,
    MOCK_DELAY: 500,
    MOCK_ERROR_RATE: 0.1, // 10%
  },
} as const;

/**
 * 全設定の統合エクスポート
 */
export const SERVICES_CONFIG = {
  API: GOOGLE_SHEETS_API,
  CACHE: CACHE_CONFIG,
  SHEETS: SHEETS_DATA_CONFIG,
  LOAD_STRATEGIES,
  PRELOAD: PRELOAD_CONFIG,
  ERROR: ERROR_CONFIG,
  PERFORMANCE: PERFORMANCE_CONFIG,
  DEV: DEV_CONFIG,
} as const;

/**
 * 設定取得ヘルパー関数
 */
export const getServiceConfig = <T extends keyof typeof SERVICES_CONFIG>(
  key: T
): (typeof SERVICES_CONFIG)[T] => {
  return SERVICES_CONFIG[key];
};

/**
 * 環境別設定の取得
 */
export const getEnvironmentConfig = () => {
  const isDev = import.meta.env.DEV;
  const isProd = import.meta.env.PROD;

  return {
    isDev,
    isProd,
    enableDebug: isDev && DEV_CONFIG.DEBUG.ENABLE_CONSOLE_LOGS,
    enablePerformanceLogs: isDev && DEV_CONFIG.DEBUG.ENABLE_PERFORMANCE_LOGS,
    enableMocking: isDev && DEV_CONFIG.MOCK.ENABLE_API_MOCK,
  };
};
