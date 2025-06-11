import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SADO_ISLAND } from "../constants";
import { FilterService } from "../services/filter";
import { fetchPOIs } from "../services/sheets";
import { isClusterPOI } from "../types/common";
import type { FilterState } from "../types/filter";
import type { ClusterablePOI, POI } from "../types/google-maps";
import { getAppConfig } from "../utils/env";
import { GoogleMarkerCluster } from "./GoogleMarkerCluster";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

// 設定定数
const MAP_CONFIG = {
  DEFAULT_ZOOM: SADO_ISLAND.ZOOM.DEFAULT,
} as const;

// マップインスタンス取得用ヘルパー
function MapInstanceCapture({ onMapInstance }: { onMapInstance: (map: google.maps.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapInstance(map);
    }
  }, [map, onMapInstance]);

  return null;
}

interface MapComponentProps {
  className?: string;
  onMapLoaded?: () => void;
  enableClickableIcons?: boolean;
  filterState?: FilterState;
  pois?: POI[];
}

export function MapComponent({
  className = "map-container",
  onMapLoaded,
  enableClickableIcons = false,
  filterState,
  pois: externalPois,
}: MapComponentProps) {
  const [internalPois, setInternalPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(MAP_CONFIG.DEFAULT_ZOOM);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // 使用するPOIデータを決定（最適化された重複除去）
  const activePois = useMemo(() => {
    const basePois = externalPois?.length ? externalPois : internalPois;

    // recommendedシート優先の重複除去
    const seenIds = new Set<string>();
    const positionToPoi: Record<string, POI> = {};

    // まずrecommendedシート以外のPOIを処理
    basePois.forEach((poi) => {
      if (poi.sourceSheet === "recommended") return; // recommendedは後で処理

      const positionKey = `${poi.position.lat.toFixed(6)}-${poi.position.lng.toFixed(6)}`;

      if (!seenIds.has(poi.id) && !positionToPoi[positionKey]) {
        seenIds.add(poi.id);
        positionToPoi[positionKey] = poi;
      }
    });

    // 次にrecommendedシートのPOIを処理（優先して上書き）
    basePois.forEach((poi) => {
      if (poi.sourceSheet !== "recommended") return;

      const positionKey = `${poi.position.lat.toFixed(6)}-${poi.position.lng.toFixed(6)}`;
      const existingPoi = positionToPoi[positionKey];

      if (existingPoi) {
        // recommendedで既存を削除
        seenIds.delete(existingPoi.id);
      }

      // recommendedを追加（IDが同じでも位置が同じでも優先）
      seenIds.add(poi.id);
      positionToPoi[positionKey] = poi;
    });

    const uniquePois: POI[] = Object.values(positionToPoi);

    // 重複が見つかった場合はログ出力
    if (basePois.length !== uniquePois.length) {
      const duplicateCount = basePois.length - uniquePois.length;
      console.warn(`POIデータに重複が見つかりました: ${duplicateCount.toString()}件の重複を除去`);
    }

    return uniquePois;
  }, [externalPois, internalPois]);

  // フィルタされたPOIを計算
  const filteredPois = useMemo(() => {
    return filterState ? FilterService.filterPOIs(activePois, filterState) : activePois;
  }, [activePois, filterState]);

  // APIキーとライブラリ設定
  const { googleMapsApiKey, googleMapsMapId } = getAppConfig();
  const libraries = useMemo(() => ["marker"], []);

  // デバッグ用ログ
  useEffect(() => {
    console.log("Map Component状態:", {
      isLoading,
      externalPoisLength: externalPois?.length,
      internalPoisLength: internalPois.length,
      activePoisLength: activePois.length,
      googleMapsApiKey: googleMapsApiKey ? "設定済み" : "未設定",
      googleMapsMapId: googleMapsMapId ? "設定済み" : "未設定",
    });
  }, [
    isLoading,
    externalPois?.length,
    internalPois.length,
    activePois.length,
    googleMapsApiKey,
    googleMapsMapId,
  ]);

  // POIデータ読み込み
  useEffect(() => {
    if (externalPois?.length) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadPOIs = async () => {
      try {
        const data = await fetchPOIs();
        if (isMounted) {
          setInternalPois(data);
        }
      } catch (error) {
        console.warn("POIデータの読み込みに失敗しました:", error);
        if (isMounted) {
          setError("POIデータの読み込みに失敗しました。ネットワーク接続を確認してください。");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPOIs();
    return () => {
      isMounted = false;
    };
  }, [externalPois]);

  // マップとPOIの準備完了を通知
  useEffect(() => {
    if (!isLoading && onMapLoaded) {
      onMapLoaded();
    }
  }, [isLoading, onMapLoaded]);

  // クラスターズーム処理（修正版）
  const zoomToCluster = useCallback(
    (poi: ClusterablePOI) => {
      if (!mapInstance || !isClusterPOI(poi) || poi.originalPois.length <= 1) return;

      const bounds = new google.maps.LatLngBounds();
      poi.originalPois.forEach((originalPoi: POI) => {
        bounds.extend(originalPoi.position);
      });

      // Google Maps標準のfitBoundsを使用（安全な型での実装）
      mapInstance.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    },
    [mapInstance],
  );

  // マーカークリック処理
  const handleMarkerClick = useCallback(
    (poi: ClusterablePOI) => {
      if (isClusterPOI(poi)) {
        zoomToCluster(poi);
      } else {
        setSelectedPoi(poi);
      }
    },
    [zoomToCluster],
  );

  const handleInfoWindowClose = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // マップクリック時の処理
  const handleMapClick = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // マップインスタンス設定（修正版）
  const handleMapInstanceLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);

      if (!enableClickableIcons) {
        map.addListener("click", (event: google.maps.MapMouseEvent & { placeId?: string }) => {
          if (event.placeId) {
            event.stop();
          }
        });
      }
    },
    [enableClickableIcons],
  );

  // ズーム変更ハンドラー
  const handleCameraChanged = useCallback(
    (event: MapCameraChangedEvent) => {
      const { zoom } = event.detail;
      if (zoom && zoom !== currentZoom) {
        setCurrentZoom(zoom);
      }
    },
    [currentZoom],
  );

  if (isLoading) {
    return (
      <div className={className}>
        <div className="map-loading">地図を読み込み中...</div>
      </div>
    );
  }

  // APIキーが設定されていない場合のエラー表示
  if (!googleMapsApiKey) {
    return (
      <div className={className}>
        <div className="map-error">
          Google Maps APIキーが設定されていません。
          <br />
          VITE_GOOGLE_MAPS_API_KEY環境変数を設定してください。
        </div>
      </div>
    );
  }

  // データ読み込みエラーの表示
  if (error) {
    return (
      <div className={className}>
        <div className="map-error">{error}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <APIProvider
        apiKey={googleMapsApiKey}
        version="weekly"
        libraries={libraries}
        language="ja"
        region="JP"
        onLoad={() => {
          console.log("Google Maps API loaded successfully");
        }}
        onError={(error) => {
          console.error("Google Maps API load error:", error);
          setError("Google Maps APIの読み込みに失敗しました。APIキーを確認してください。");
        }}
      >
        <Map
          defaultZoom={MAP_CONFIG.DEFAULT_ZOOM}
          defaultCenter={SADO_ISLAND.CENTER}
          mapId={googleMapsMapId}
          mapTypeId={google.maps.MapTypeId.TERRAIN}
          gestureHandling="greedy"
          disableDefaultUI={true}
          fullscreenControl={true}
          zoomControl={true}
          streetViewControl={true}
          mapTypeControl={true}
          mapTypeControlOptions={{
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          }}
          scaleControl={true}
          clickableIcons={enableClickableIcons}
          style={{ width: "100%", height: "100%" }}
          reuseMaps={true}
          onCameraChanged={handleCameraChanged}
          onClick={handleMapClick}
        >
          <MapInstanceCapture onMapInstance={handleMapInstanceLoad} />
          <GoogleMarkerCluster
            pois={filteredPois}
            onMarkerClick={handleMarkerClick}
            currentZoom={currentZoom}
          />
          {selectedPoi && <InfoWindow poi={selectedPoi} onClose={handleInfoWindowClose} />}
        </Map>
      </APIProvider>
    </div>
  );
}
