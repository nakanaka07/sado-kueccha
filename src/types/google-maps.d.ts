// Google Maps API型定義拡張
// vis.gl/react-google-maps用の型定義補完

declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
  }
}

// POI共通型定義
export interface POI {
  id: string;
  name: string;
  position: google.maps.LatLngLiteral;
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

  // クラスター関連のプロパティ
  clusterSize?: number;
  originalPois?: POI[];
}

export {};
