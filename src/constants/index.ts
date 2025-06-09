// アプリケーション全体で使用する定数定義

import type { LatLngLiteral } from "../types/google-maps";
import { getAppConfig } from "../utils/env";

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

// =============================================================================
// アセット解決ユーティリティ（統合版）
// =============================================================================

/**
 * アセット構造の型定義
 */
export interface NumberedAssets {
  1: string;
  2: string;
  3: string;
}

export interface MarkerAssets {
  CURRENT_LOCATION: string;
  FACING_NORTH: string;
  PARKING: string;
  RECOMMEND: string;
  TOILETTE: string;
}

export interface IconAssets {
  ANO: NumberedAssets;
  SHI: NumberedAssets;
  AREA_MAP: NumberedAssets;
  MARKERS: MarkerAssets;
}

export interface TitleAssets {
  ROW1: string;
  ROW2: string;
}

export interface BaseAssets {
  ICONS: IconAssets;
  TITLE: TitleAssets;
}

/**
 * アセットパス解決関数（統合版）
 * Viteベースパスとpublicフォルダ両方に対応
 */
export const resolveAssetPath = (path: string): string => {
  const basePath = getAppConfig().basePath;

  // 既に完全パスの場合はそのまま返す
  if (path.startsWith("http") || path.startsWith("//")) {
    return path;
  }

  // publicフォルダ内のアセットの場合
  const normalizedPath = path.startsWith("/assets/")
    ? path
    : `/assets/${path.replace(/^.*\//, "")}`;

  // ベースパスが設定されている場合は追加
  if (basePath) {
    const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    return normalizedBasePath + normalizedPath;
  }

  return normalizedPath;
};

/**
 * 再帰的にパス変換を行うヘルパー関数
 */
const transformAssetPaths = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return resolveAssetPath(obj) as T;
  }

  if (obj && typeof obj === "object") {
    const result = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      (result as Record<string, unknown>)[key] = transformAssetPaths(value);
    }
    return result;
  }

  return obj;
};

/**
 * 基本アセット定義（パス変換前）
 */
const baseAssetDefinition = {
  ICONS: {
    ANO: {
      1: "ano_icon01.png",
      2: "ano_icon02.png",
      3: "ano_icon03.png",
    },
    SHI: {
      1: "shi_icon01.png",
      2: "shi_icon02.png",
      3: "shi_icon03.png",
    },
    AREA_MAP: {
      1: "area_icon_map01.png",
      2: "area_icon_map02.png",
      3: "area_icon_map03.png",
    },
    MARKERS: {
      CURRENT_LOCATION: "current_location.png",
      FACING_NORTH: "facing_north.png",
      PARKING: "parking.png",
      RECOMMEND: "recommend.png",
      TOILETTE: "toilette.png",
    },
  },
  TITLE: {
    ROW1: "title_row1.png",
    ROW2: "title_row2.png",
  },
} as const;

/**
 * アセット設定（パス変換済み）
 */
export const ASSETS: BaseAssets = transformAssetPaths(baseAssetDefinition);

/**
 * アセットのプリロード用のURL解決（従来のgetAssetUrls互換）
 */
export const getAssetUrls = (): BaseAssets => ASSETS;

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
