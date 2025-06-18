/**
 * Google Maps API型定義拡張
 * vis.gl/react-google-maps用の型定義補完と拡張
 * 最新のGoogle Maps APIに対応した型安全な実装
 */

import type { Brand, TimestampMs } from "./common";

// ブランド型でGoogle Maps固有の値を型安全に管理
export type MapId = Brand<string, "MapId">;
export type MarkerId = Brand<string, "MarkerId">;
export type ClusterId = Brand<string, "ClusterId">;

// 基本的な Google Maps API 型の再エクスポート（型安全性を向上）
export type LatLngLiteral = google.maps.LatLngLiteral;
export type LatLngBounds = google.maps.LatLngBounds;
export type LatLng = google.maps.LatLng;
export type GoogleMap = google.maps.Map;
export type Marker = google.maps.Marker;
export type InfoWindow = google.maps.InfoWindow;

/**
 * 拡張された座標型
 * より詳細な位置情報を含む
 */
export interface ExtendedLatLngLiteral extends LatLngLiteral {
  readonly accuracy?: number;
  readonly altitude?: number;
  readonly heading?: number;
  readonly speed?: number;
}

/**
 * マーカークラスタリング関連の拡張型
 * パフォーマンス最適化を考慮した設定
 */
export interface MarkerClusterOptions {
  readonly gridSize?: number;
  readonly maxZoom?: number;
  readonly zoomOnClick?: boolean;
  readonly averageCenter?: boolean;
  readonly minimumClusterSize?: number;
  readonly enableRetinaIcons?: boolean;
  readonly ignoreHidden?: boolean;
  readonly title?: string;
  readonly calculator?: (markers: Marker[], numStyles: number) => ClusterIconInfo;
  readonly clusterClass?: string;
  readonly styles?: ClusterIconStyle[];
}

/**
 * クラスターアイコンの情報
 */
export interface ClusterIconInfo {
  readonly text: string;
  readonly index: number;
  readonly title?: string;
}

/**
 * クラスターアイコンのスタイル
 */
export interface ClusterIconStyle {
  readonly url: string;
  readonly height: number;
  readonly width: number;
  readonly anchorText?: [number, number];
  readonly anchorIcon?: [number, number];
  readonly textColor?: string;
  readonly textSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: string;
  readonly backgroundPosition?: string;
}

/**
 * カスタムマーカー表示オプション
 * 拡張されたマーカー設定
 */
export interface CustomMarkerOptions {
  readonly position: LatLngLiteral;
  readonly map?: GoogleMap;
  readonly icon?: string | google.maps.Icon | google.maps.Symbol;
  readonly title?: string;
  readonly label?: string | google.maps.MarkerLabel;
  readonly clickable?: boolean;
  readonly draggable?: boolean;
  readonly visible?: boolean;
  readonly opacity?: number;
  readonly zIndex?: number;
  readonly animation?: google.maps.Animation;
  readonly cursor?: string;
  readonly crossOnDrag?: boolean;
  readonly optimized?: boolean;
  readonly shape?: google.maps.MarkerShape;
}

/**
 * 高度なマーカーオプション
 * パフォーマンスとUXを考慮した設定
 */
export interface AdvancedMarkerOptions extends CustomMarkerOptions {
  readonly id: MarkerId;
  readonly category?: string;
  readonly priority?: "high" | "medium" | "low";
  readonly clusterable?: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly accessibilityLabel?: string;
  readonly tooltip?: string;
}

/**
 * Google Maps APIのイベントハンドラー型
 * より具体的なイベント型定義
 */
export type MapEventHandler<T = unknown> = (event: T) => void;
export type MarkerEventHandler = MapEventHandler<google.maps.MapMouseEvent>;
export type MapClickHandler = MapEventHandler<google.maps.MapMouseEvent>;
export type MapBoundsChangedHandler = MapEventHandler<void>;
export type MapZoomChangedHandler = MapEventHandler<void>;

/**
 * 地図の表示設定
 * アクセシビリティとパフォーマンスを考慮
 */
export interface MapDisplayOptions {
  readonly center?: LatLngLiteral;
  readonly zoom?: number;
  readonly minZoom?: number;
  readonly maxZoom?: number;
  readonly mapTypeId?: google.maps.MapTypeId;
  readonly gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  readonly disableDefaultUI?: boolean;
  readonly zoomControl?: boolean;
  readonly mapTypeControl?: boolean;
  readonly scaleControl?: boolean;
  readonly streetViewControl?: boolean;
  readonly rotateControl?: boolean;
  readonly fullscreenControl?: boolean;
  readonly keyboardShortcuts?: boolean;
  readonly clickableIcons?: boolean;
  readonly draggable?: boolean;
  readonly scrollwheel?: boolean;
  readonly disableDoubleClickZoom?: boolean;
  readonly backgroundColor?: string;
  readonly restriction?: google.maps.MapRestriction;
}

/**
 * 地図のテーマ設定
 * カスタムスタイル対応
 */
export interface MapThemeOptions {
  readonly styles?: google.maps.MapTypeStyle[];
  readonly darkMode?: boolean;
  readonly customControls?: boolean;
  readonly accessibilityMode?: boolean;
}

/**
 * 情報ウィンドウの設定
 */
export interface InfoWindowOptions {
  readonly content?: string | Element;
  readonly maxWidth?: number;
  readonly pixelOffset?: google.maps.Size;
  readonly position?: LatLngLiteral;
  readonly zIndex?: number;
  readonly disableAutoPan?: boolean;
  readonly headerDisabled?: boolean;
  readonly ariaLabel?: string;
}

/**
 * 地図の境界設定
 */
export interface MapBounds {
  readonly north: number;
  readonly south: number;
  readonly east: number;
  readonly west: number;
}

/**
 * ジオコーディング結果の型
 */
export interface GeocodingResult {
  readonly address: string;
  readonly location: LatLngLiteral;
  readonly accuracy: number;
  readonly types: readonly string[];
  readonly placeId?: string;
}

/**
 * 地図の状態管理用型
 */
export interface MapState {
  readonly isLoaded: boolean;
  readonly isLoading: boolean;
  readonly error?: Error;
  readonly center: LatLngLiteral;
  readonly zoom: number;
  readonly bounds?: MapBounds;
  readonly mapInstance?: GoogleMap;
  readonly lastUpdated: TimestampMs;
}

/**
 * マーカー管理用の型
 */
export interface MarkerManager {
  readonly markers: Map<MarkerId, Marker>;
  readonly clusters: Map<ClusterId, unknown>; // MarkerClustererは外部ライブラリ依存のため unknownで対応
  readonly visibleMarkers: Set<MarkerId>;
  readonly selectedMarker?: MarkerId;
}

/**
 * パフォーマンス監視用の型
 */
export interface MapPerformanceMetrics {
  readonly renderTime: number;
  readonly markerCount: number;
  readonly clusterCount: number;
  readonly memoryUsage?: number;
  readonly lastMeasurement: TimestampMs;
}

// 型ガード関数
export const isLatLngLiteral = (value: unknown): value is LatLngLiteral => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    "lat" in candidate &&
    "lng" in candidate &&
    typeof candidate.lat === "number" &&
    typeof candidate.lng === "number" &&
    candidate.lat >= -90 &&
    candidate.lat <= 90 &&
    candidate.lng >= -180 &&
    candidate.lng <= 180
  );
};

export const isMapBounds = (value: unknown): value is MapBounds => {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    "north" in candidate &&
    "south" in candidate &&
    "east" in candidate &&
    "west" in candidate &&
    typeof candidate.north === "number" &&
    typeof candidate.south === "number" &&
    typeof candidate.east === "number" &&
    typeof candidate.west === "number" &&
    candidate.north > candidate.south
  );
};

/**
 * 地図コンポーネント用のプロパティ型
 */
export interface MapComponentProps {
  readonly options?: MapDisplayOptions;
  readonly theme?: MapThemeOptions;
  readonly onLoad?: (map: GoogleMap) => void;
  readonly onError?: (error: Error) => void;
  readonly onBoundsChanged?: MapBoundsChangedHandler;
  readonly onZoomChanged?: MapZoomChangedHandler;
  readonly onClick?: MapClickHandler;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly accessibilityLabel?: string;
}
