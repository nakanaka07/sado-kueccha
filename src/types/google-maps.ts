/**
 * Google Maps API型定義拡張
 * vis.gl/react-google-maps用の型定義補完
 */

// Google Maps APIの基本型定義
export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/**
 * ベースPOI型定義
 */
export interface POI {
  id: string;
  name: string;
  position: LatLngLiteral;
  genre: string;
  category?: string;
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
 * クラスター拡張POI型定義
 */
export interface ClusterPOI extends POI {
  clusterSize: number;
  originalPois: POI[];
}

/**
 * クラスター可能POI型（Union型）
 */
export type ClusterablePOI = POI | ClusterPOI;
