// アプリケーション全体で使用する定数定義

import type { LatLngLiteral } from "../types/google-maps";

/**
 * 佐渡島関連の定数
 */
export const SADO_ISLAND = {
  CENTER: { lat: 38.0549, lng: 138.3691 } as LatLngLiteral,
  ZOOM: {
    DEFAULT: 11,
    MIN: 9,
    MAX: 18,
    MIN_CLUSTER_ZOOM: 8,
    DISABLE_CLUSTERING: 14,
    HIGH_THRESHOLD: 17,
    MAX_ZOOM_LEVEL: 20,
  },
  MARKER_LIMITS: {
    NORMAL_ZOOM: 200,
    HIGH_ZOOM: 500,
  },
  BOUNDS: {
    NORTH: 38.3,
    SOUTH: 37.7,
    EAST: 138.7,
    WEST: 138.0,
  },
} as const;

/**
 * キャッシュ設定
 */
export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 15 * 60 * 1000, // 15分
  SHEETS_TTL: 60 * 60 * 1000, // 1時間
  IMAGES_TTL: 24 * 60 * 60 * 1000, // 24時間
  MAX_SIZE: 10,
  MAX_ENTRIES: 100,
  STORAGE_KEY: "sado-kueccha-cache",
} as const;

/**
 * ベースパスを考慮したアセットパスを生成する関数
 */
function getAssetPath(path: string): string {
  const basePath = import.meta.env.VITE_BASE_PATH || "";

  // ベースパスが設定されている場合は、開発環境でも追加する
  if (basePath) {
    // ベースパスが `/` で終わっていない場合は追加
    const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    return normalizedBasePath + path;
  }

  // ベースパスが設定されていない場合はそのまま返す
  return path;
}

/**
 * アセット設定
 */
export const ASSETS = {
  ICONS: {
    ANO: {
      1: getAssetPath("/assets/ano_icon01.png"),
      2: getAssetPath("/assets/ano_icon02.png"),
      3: getAssetPath("/assets/ano_icon03.png"),
    },
    SHI: {
      1: getAssetPath("/assets/shi_icon01.png"),
      2: getAssetPath("/assets/shi_icon02.png"),
      3: getAssetPath("/assets/shi_icon03.png"),
    },
    AREA_MAP: {
      1: getAssetPath("/assets/area_icon_map01.png"),
      2: getAssetPath("/assets/area_icon_map02.png"),
      3: getAssetPath("/assets/area_icon_map03.png"),
    },
    MARKERS: {
      CURRENT_LOCATION: getAssetPath("/assets/current_location.png"),
      FACING_NORTH: getAssetPath("/assets/facing_north.png"),
      PARKING: getAssetPath("/assets/parking.png"),
      RECOMMEND: getAssetPath("/assets/recommend.png"),
      TOILETTE: getAssetPath("/assets/toilette.png"),
    },
  },
  TITLE: {
    ROW1: getAssetPath("/assets/title_row1.png"),
    ROW2: getAssetPath("/assets/title_row2.png"),
  },
} as const;

/**
 * API設定
 */
export const API_CONFIG = {
  GOOGLE_SHEETS: {
    BASE_URL: "https://docs.google.com/spreadsheets/d",
    EXPORT_FORMAT: "export?format=csv&gid=0",
  },
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 10000,
} as const;
