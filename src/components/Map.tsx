import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import { fetchPOIs } from "../services/sheets";
import type { POI } from "../types/google-maps";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";
import { MarkerCluster } from "./MarkerCluster";

/**
 * Google Maps React 開発における重要な注意点
 *
 * 1. Controlled vs Uncontrolled モード:
 *    - zoom/center = Controlled（React完全制御、ユーザー操作無効）
 *    - defaultZoom/defaultCenter = Uncontrolled（ユーザー操作可能）
 *
 * 2. 必須設定項目:
 *    - gestureHandling="greedy": すべてのジェスチャーを許可
 *    - disableDefaultUI={false}: ズーム・パンコントロールを有効
 *    - mapId: Google Cloud Console で設定したMap ID
 *
 * 3. セキュリティ:
 *    - API キーは環境変数で管理
 *    - 本番環境ではHTTPリファラー制限を設定
 *
 * 4. パフォーマンス:
 *    - reuseMaps={true} でインスタンス再利用
 *    - 大量マーカーはクラスタリング使用
 */

// 佐渡島の中心座標
const SADO_CENTER = { lat: 38.0549, lng: 138.3691 };

interface MapComponentProps {
  className?: string;
  onMapLoaded?: () => void;
}

export function MapComponent({ className, onMapLoaded }: MapComponentProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];

  useEffect(() => {
    const loadPOIs = async () => {
      try {
        const data = await fetchPOIs();
        setPois(data);
      } catch (error) {
        console.error("POIデータの取得に失敗しました:", error);
      } finally {
        setLoading(false);
        // POIの読み込みが完了したらコールバックを呼び出し
        onMapLoaded?.();
      }
    };

    void loadPOIs();
  }, [onMapLoaded]);
  const handleMarkerClick = (poi: POI) => {
    console.log("マーカーがクリックされました:", poi);
    setSelectedPoi(poi);
  };

  const handleInfoWindowClose = () => {
    setSelectedPoi(null);
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="map-loading">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <APIProvider apiKey={apiKey}>
        <Map
          // ★重要★ defaultZoom/defaultCenter を使用（Uncontrolledモード）
          // zoom/center を使うとControlledモードになりユーザー操作が無効になる
          defaultZoom={11}
          defaultCenter={SADO_CENTER}
          mapId={import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"] || "佐渡島マップ"}
          // ユーザーインタラクションを有効にする重要な設定
          gestureHandling="greedy" // すべてのジェスチャーを許可
          disableDefaultUI={false} // ズーム・パンコントロールを表示
          clickableIcons={true} // 地図上のアイコンをクリック可能
          style={{ width: "100%", height: "100%" }}
        >
          <MarkerCluster pois={pois} onMarkerClick={handleMarkerClick} />
          {selectedPoi && <InfoWindow poi={selectedPoi} onClose={handleInfoWindowClose} />}
        </Map>
      </APIProvider>
    </div>
  );
}
