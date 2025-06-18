/**
 * 型定義のメインエントリーポイント
 * 各型定義ファイルからの再エクスポート
 * 最新のTypeScript 5.x に対応した型安全な実装
 */

import type { TimestampMs } from "./common";

// 共通型（基盤となるユーティリティ型）
export type {
  AsyncState,
  AsyncStatus,
  BaseConfig,
  Brand,
  CacheEntry,
  CacheMetadata,
  Coordinates,
  DeepPartial,
  DeepReadonly,
  EntityId,
  EnvironmentConfig,
  ExtendedCacheEntry,
  ExtendedCoordinates,
  Maybe,
  NonNullable,
  PositionObject,
  Predicate,
  Result,
  TimestampMs,
  TypeGuard,
  Validator,
  VersionString,
} from "./common";

// POI関連の型（地図上の興味地点）
export type {
  BusinessHoursInfo,
  BusinessHoursPeriod,
  ClusterablePOI,
  ClusterPOIId,
  ContactInfo,
  DailyBusinessHours,
  DistrictId,
  GenreId,
  ParsedHours,
  POI,
  POICluster,
  POIContextValue,
  POIDetails,
  POIId,
  POIOperation,
  POIOperationResult,
  POISearchCriteria,
  POISearchResult,
  POIUpdateHistory,
  POIValidationResult,
  StatusConfig,
  StatusType,
  WeeklyBusinessHours,
} from "./poi";

// Google Maps関連の型（地図機能）
export type {
  AdvancedMarkerOptions,
  ClusterIconInfo,
  ClusterIconStyle,
  ClusterId,
  CustomMarkerOptions,
  ExtendedLatLngLiteral,
  GeocodingResult,
  GoogleMap,
  InfoWindow,
  InfoWindowOptions,
  LatLng,
  LatLngBounds,
  LatLngLiteral,
  MapBounds,
  MapBoundsChangedHandler,
  MapClickHandler,
  MapComponentProps,
  MapDisplayOptions,
  MapEventHandler,
  MapId,
  MapPerformanceMetrics,
  MapState,
  MapThemeOptions,
  MapZoomChangedHandler,
  Marker,
  MarkerClusterOptions,
  MarkerEventHandler,
  MarkerId,
  MarkerManager,
} from "./google-maps";

// フィルター関連の型（表示制御）
export type {
  FilterAction,
  FilterCategory,
  FilterCategoryGroup,
  FilterChangeEvent,
  FilterContextValue,
  FilterKey,
  FilterOption,
  FilterPreset,
  FilterState,
  FilterStateUpdate,
  FilterStats,
  PresetConfig,
} from "./filter";

// アセット関連の型（リソース管理）
export type {
  AssetLoadOptions,
  AssetLoadState,
  AssetUrl,
  BaseAssets,
  IconAssets,
  IconCategoryKey,
  MarkerAssetKey,
  MarkerAssets,
  NumberedAssetKey,
  NumberedAssets,
  TitleAssetKey,
  TitleAssets,
} from "./assets";

// Google Sheets関連の型（データソース）
export type {
  CellRange,
  ExtendedSheetsConfig,
  SheetBatchOperation,
  SheetColumnDefinition,
  SheetDataMatrix,
  SheetDataRow,
  SheetId,
  SheetLoadState,
  SheetMetadata,
  SheetOperationResult,
  SheetSchema,
  SheetsConfig,
  SheetsContextValue,
  SheetTransformConfig,
  SpreadsheetId,
} from "./sheets";

// アプリケーション設定関連の型
export interface AppConfig {
  readonly googleMapsApiKey: string;
  readonly googleSheetsApiKey: string;
  readonly spreadsheetId: string;
  readonly refreshInterval?: number;
  readonly debug?: boolean;
  readonly features?: {
    readonly clustering?: boolean;
    readonly geolocation?: boolean;
    readonly caching?: boolean;
    readonly analytics?: boolean;
  };
}

/**
 * エラーバウンダリの状態管理
 */
export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
  readonly errorInfo?: {
    readonly componentStack: string;
    readonly errorBoundary?: string;
  };
  readonly retryCount: number;
  readonly timestamp: TimestampMs;
}

/**
 * アプリケーション全体の状態管理用型
 */
export interface AppState {
  readonly initialized: boolean;
  readonly loading: boolean;
  readonly error?: Error;
  readonly user?: {
    readonly id: string;
    readonly preferences: Record<string, unknown>;
  };
  readonly session?: {
    readonly id: string;
    readonly startTime: TimestampMs;
    readonly lastActivity: TimestampMs;
  };
}

/**
 * パフォーマンス監視用の型
 */
export interface PerformanceMetrics {
  readonly renderTime: number;
  readonly loadTime: number;
  readonly memoryUsage?: number;
  readonly networkRequests: number;
  readonly errorCount: number;
  readonly timestamp: TimestampMs;
}

/**
 * ログレベルの定義
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ログエントリの型
 */
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: TimestampMs;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
  readonly source?: string;
}

/**
 * API レスポンスの共通形式
 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly metadata?: {
    readonly requestId: string;
    readonly timestamp: TimestampMs;
    readonly version: string;
  };
}

/**
 * イベント処理用の型
 */
export interface CustomEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: TimestampMs;
  readonly source?: string;
  readonly preventDefault?: () => void;
  readonly stopPropagation?: () => void;
}

// 型ガード関数のエクスポート
export { isAssetUrl } from "./assets";
export { isCoordinates, isPositionObject } from "./common";
export { isFilterCategory, isFilterKey, isFilterPreset } from "./filter";
export { isLatLngLiteral, isMapBounds } from "./google-maps";
export { isPOI, isPOICluster, isStatusType } from "./poi";
export { isCellRange, isSheetId, isSpreadsheetId, isValidSheetsConfig } from "./sheets";

// 定数のエクスポート
export { DEFAULT_FILTER_STATE, FILTER_CATEGORIES, PRESET_CONFIGS } from "./filter";
export { DEFAULT_SHEET_CONFIG } from "./sheets";
