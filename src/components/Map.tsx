import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPOIs } from "../services/sheets";
import type { POI } from "../types/google-maps";
import { GoogleMarkerCluster } from "./GoogleMarkerCluster";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

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

// 佐渡島の中心座標（定数として外部に出して再計算を防止）
const SADO_CENTER = { lat: 38.0549, lng: 138.3691 };

interface MapComponentProps {
  className?: string;
  onMapLoaded?: () => void;
}

export function MapComponent({ className, onMapLoaded }: MapComponentProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11); // ズームレベルを追跡

  // APIキーをメモ化して無駄な再計算を防止
  const apiKey = useMemo(() => import.meta.env["VITE_GOOGLE_MAPS_API_KEY"], []);

  useEffect(() => {
    const loadPOIs = async () => {
      try {
        console.log("📊 Starting POI data fetch...");
        const startTime = performance.now();

        const data = await fetchPOIs();
        setPois(data);

        const endTime = performance.now();
        console.log(
          `✅ POI data loaded in ${Math.round(endTime - startTime).toString()}ms (${data.length.toString()} items)`,
        );
      } catch (error) {
        console.error("POIデータの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadPOIs();
  }, []);

  // POIデータとマップの両方が準備完了したときに即座にコールバックを呼び出し
  useEffect(() => {
    if (!loading && mapReady && onMapLoaded) {
      console.log("🎯 Both POI data and map are ready, triggering callback immediately");
      // 無駄な待機時間を削除し、即座にコールバックを呼び出し
      onMapLoaded();
    }
  }, [loading, mapReady, onMapLoaded]);

  const handleMarkerClick = useCallback((poi: POI) => {
    console.log("マーカーがクリックされました:", poi);
    setSelectedPoi(poi);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // Google Maps API と Map コンポーネントの読み込み完了を検出
  const handleMapLoad = useCallback(() => {
    console.log("Maps API loaded successfully");
    setMapReady(true);
  }, []); // Map インスタンスの準備完了を検出
  const handleMapIdle = useCallback(() => {
    console.log("Map is ready and idle");
    setMapReady(true);
  }, []); // カメラ変更（ズーム、位置など）を監視するハンドラー
  const handleCameraChanged = useCallback(
    (event: MapCameraChangedEvent) => {
      const { zoom } = event.detail;
      if (zoom && zoom !== currentZoom) {
        console.log(`🔍 Zoom level changed to: ${zoom.toString()}`);
        setCurrentZoom(zoom);
      }
    },
    [currentZoom, setCurrentZoom],
  );

  // ライブラリ配列をメモ化してAPIProviderの不要な再レンダリングを防止
  const libraries = useMemo(() => ["marker"], []);

  if (loading) {
    return (
      <div className={className}>
        <div className="map-loading">地図を読み込み中...</div>
      </div>
    );
  }
  return (
    <div className={className}>
      <APIProvider
        apiKey={apiKey}
        libraries={libraries}
        language="ja"
        region="JP"
        onLoad={handleMapLoad}
      >
        {" "}
        <Map
          // ★重要★ defaultZoom/defaultCenter を使用（Uncontrolledモード）
          // zoom/center を使うとControlledモードになりユーザー操作が無効になる
          defaultZoom={11}
          defaultCenter={SADO_CENTER}
          mapId={import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"] || "佐渡島マップ"}
          mapTypeId={google.maps.MapTypeId.TERRAIN} // 初期マップタイプをterrainに設定
          // ユーザーインタラクションを有効にする重要な設定
          gestureHandling="greedy" // すべてのジェスチャーを許可
          disableDefaultUI={false} // ズーム・パンコントロールを表示
          mapTypeControl={true} // マップタイプ選択ボタンを表示
          mapTypeControlOptions={{
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT,
          }}
          clickableIcons={true} // 地図上のアイコンをクリック可能
          style={{ width: "100%", height: "100%" }}
          // パフォーマンス最適化
          reuseMaps={true} // マップの準備完了を検出
          onIdle={handleMapIdle}
          // カメラ変更（ズーム含む）を監視
          onCameraChanged={handleCameraChanged}
        >
          <GoogleMarkerCluster
            pois={pois}
            onMarkerClick={handleMarkerClick}
            currentZoom={currentZoom}
          />
          {selectedPoi && <InfoWindow poi={selectedPoi} onClose={handleInfoWindowClose} />}
        </Map>
      </APIProvider>
    </div>
  );
}
