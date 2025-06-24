/**
 * 🔧 統合設定ファイル - 佐渡で食えっちゃ
 *
 * @description 実際に使用される設定のみを統合した効率的な設定管理
 * @version 2.0.0 - Phase 2 構造最適化
 */

import type { LatLngLiteral } from '../types';

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
 * キャッシュ設定
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
 * 佐渡島地理情報設定
 */
export const SADO_ISLAND = {
  CENTER: {
    lat: 38.0549,
    lng: 138.3691,
  } as const satisfies LatLngLiteral,

  ZOOM: {
    DEFAULT: 11,
    MIN: 8,
    MAX: 18,
    DISABLE_CLUSTERING: 16,
    PERFORMANCE_MODE_THRESHOLD: 14,
  },

  BOUNDS: {
    NORTH: 38.3,
    SOUTH: 37.8,
    EAST: 138.6,
    WEST: 138.1,
  },

  PERFORMANCE: {
    MARKER_LIMITS: {
      LOW_ZOOM: 100,
      MEDIUM_ZOOM: 200,
      HIGH_ZOOM: 500,
    },
  },
} as const;

/**
 * 時間計算ユーティリティ
 */
export const TIME_UTILS = {
  seconds: (n: number) => n * 1000,
  minutes: (n: number) => n * 60 * 1000,
  hours: (n: number) => n * 60 * 60 * 1000,
  days: (n: number) => n * 24 * 60 * 60 * 1000,
} as const;

/**
 * 距離計算関連の閾値
 */
export const DISTANCE_THRESHOLDS = {
  SEARCH: {
    NEARBY: 0.005,
    LOCAL: 0.02,
    REGIONAL: 0.05,
  },
  CLUSTERING: {
    MIN_DISTANCE: 0.002,
    MEDIUM_DISTANCE: 0.005,
    LARGE_DISTANCE: 0.01,
  },
  UI: {
    VERY_CLOSE: 0.0001,
    MARKER_OFFSET: 0.0002,
    TAP_TARGET: 0.0005,
    SELECTION_RANGE: 0.001,
  },
} as const;

/**
 * ズーム計算定数
 */
export const ZOOM_CONSTANTS = {
  BASE_DISTANCE: 0.06,
  BASE_ZOOM_LEVEL: 8,
  LOG_BASE: 2,
  DISTANCE_ZOOM_FACTOR: 156543.03392,
} as const;
