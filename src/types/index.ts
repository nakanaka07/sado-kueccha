/**
 * 型定義のメインエントリーポイント
 * 各型定義ファイルからの再エクスポート
 * 最新のTypeScript 5.x に対応した型安全な実装
 */

// 環境変数型定義は env.d.ts で自動的に読み込まれます

// 共通型（基盤となるユーティリティ型）
export type {
  ApiResponse,
  AppConfig,
  AppState,
  AsyncState,
  AsyncStatus,
  BaseConfig,
  Brand,
  CacheEntry,
  CacheMetadata,
  Coordinates,
  CustomEvent,
  DeepPartial,
  DeepReadonly,
  EntityId,
  EnvironmentConfig,
  ErrorBoundaryState,
  ExtendedCacheEntry,
  ExtendedCoordinates,
  LogEntry,
  LogLevel,
  Maybe,
  NonNullable,
  PerformanceMetrics,
  PositionObject,
  Predicate,
  Result,
  TimestampMs,
  TypeGuard,
  Validator,
  VersionString,
} from './common';

// POI関連の型（地図上の興味地点）
export type {
  BusinessHoursInfo,
  BusinessHoursPeriod,
  ClusterPOIId,
  ClusterablePOI,
  ContactInfo,
  DailyBusinessHours,
  DistrictId,
  GenreId,
  POI,
  POICategory,
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
  ParsedHours,
  StatusConfig,
  StatusType,
  WeeklyBusinessHours,
} from './poi';

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
} from './google-maps';

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
} from './filter';

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
} from './assets';

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
  SheetTransformConfig,
  SheetsConfig,
  SheetsContextValue,
  SpreadsheetId,
} from './sheets';

// 型ガード関数のエクスポート
export { isAssetUrl } from './assets';
export { isCoordinates, isPositionObject } from './common';
export { isFilterCategory, isFilterKey, isFilterPreset } from './filter';
export { isLatLngLiteral, isMapBounds } from './google-maps';
export { isPOI, isPOICluster, isStatusType } from './poi';
export {
  isCellRange,
  isSheetId,
  isSpreadsheetId,
  isValidSheetsConfig,
} from './sheets';

// 定数のエクスポート
export {
  DEFAULT_FILTER_STATE,
  FILTER_CATEGORIES,
  PRESET_CONFIGS,
} from './filter';
export { DEFAULT_SHEET_CONFIG } from './sheets';
