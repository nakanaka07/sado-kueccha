/**
 * POI（Point of Interest）関連の型定義
 */

/**
 * 基本POI型定義
 */
export interface POI {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
  genre: string;
  description?: string;
  parking?: string;
  cashless?: boolean;
  businessHours?: {
    [key: string]: string; // 曜日別営業時間
  };
  contact?: string;
  googleMapsUrl?: string;
  address?: string;
  district?: string; // 地区情報
  sourceSheet?: string; // データソースのシート名
}

/**
 * POIクラスター型定義
 * 複数のPOIをまとめたクラスター情報
 */
export interface POICluster {
  id: string;
  center: google.maps.LatLngLiteral;
  size: number;
  pois: POI[];
  bounds?: google.maps.LatLngBounds;
}

/**
 * クラスタリング可能なPOI型定義
 * マーカークラスタリングで使用
 */
export interface ClusterablePOI extends POI {
  clusterSize?: number;
  offset?: google.maps.LatLngLiteral;
  originalPois?: POI[];
  center?: google.maps.LatLngLiteral;
}

/**
 * 営業時間の解析済みデータ
 */
export type ParsedHours =
  | { type: "closed" }
  | { type: "24h" }
  | { type: "unknown" }
  | { type: "multiple"; periods: Array<{ start: number; end: number }> }
  | { type: "normal"; start: number; end: number };

/**
 * 営業ステータスの種類
 */
export type StatusType =
  | "open"
  | "closed"
  | "unknown"
  | "24h"
  | "time-outside"
  | "confirmation-needed";

/**
 * 営業時間表示用の情報
 */
export interface BusinessHoursInfo {
  isOpen: boolean;
  currentStatus: string;
  statusType: StatusType;
  todayHours: string;
  shouldShowTodayHours: boolean;
}

/**
 * ステータス設定の型定義
 */
export interface StatusConfig {
  text: string;
  icon: string;
  colorClass: string;
  ariaLabel: string;
}
