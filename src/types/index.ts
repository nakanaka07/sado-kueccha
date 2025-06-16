/**
 * 型定義のメインエントリーポイント
 * 各型定義ファイルからの再エクスポート
 */

// POI関連の型
export type { ClusterablePOI, POI, POICluster, ParsedHours, StatusType } from "./poi";

// Google Maps関連の型
export type {
  CustomMarkerOptions,
  LatLngBounds,
  LatLngLiteral,
  MapDisplayOptions,
  MapEventHandler,
  MarkerClusterOptions,
} from "./google-maps";

// 共通型
export type { CacheEntry } from "./common";

// フィルター関連の型
export type {
  FilterCategory,
  FilterOption,
  FilterPreset,
  FilterState,
  FilterStats,
  PresetConfig,
} from "./filter";

// アセット関連の型
export type { BaseAssets, IconAssets, MarkerAssets, NumberedAssets, TitleAssets } from "./assets";

// Sheets設定関連の型
export type { SheetsConfig } from "./sheets";

// アプリケーション設定関連の型
export interface AppConfig {
  googleMapsApiKey: string;
  googleSheetsApiKey: string;
  spreadsheetId: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
