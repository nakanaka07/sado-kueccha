/**
 * Google Maps API型定義拡張
 * vis.gl/react-google-maps用の型定義補完と拡張
 */

// 基本的な Google Maps API 型の再エクスポート
export type LatLngLiteral = google.maps.LatLngLiteral;
export type LatLngBounds = google.maps.LatLngBounds;

/**
 * マーカークラスタリング関連の拡張型
 */
export interface MarkerClusterOptions {
  gridSize?: number;
  maxZoom?: number;
  zoomOnClick?: boolean;
  averageCenter?: boolean;
  minimumClusterSize?: number;
}

/**
 * カスタムマーカー表示オプション
 */
export interface CustomMarkerOptions {
  position: google.maps.LatLngLiteral;
  map?: google.maps.Map;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  title?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
}

/**
 * Google Maps APIのイベントハンドラー型
 */
export type MapEventHandler<T = unknown> = (event: T) => void;

/**
 * 地図の表示設定
 */
export interface MapDisplayOptions {
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  mapTypeId?: google.maps.MapTypeId;
  gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  streetViewControl?: boolean;
  rotateControl?: boolean;
  fullscreenControl?: boolean;
}
