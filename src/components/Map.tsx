import type { MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchPOIs } from "../services/sheets";
import type { ClusterablePOI, ClusterPOI, POI } from "../types/google-maps";
import { SADO_CONSTANTS } from "../utils/geo";
import { logger } from "../utils/logger";
import { GoogleMarkerCluster } from "./GoogleMarkerCluster";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

// 型ガード関数
function isClusterPOI(poi: ClusterablePOI): poi is ClusterPOI {
  return "clusterSize" in poi && "originalPois" in poi;
}

// 佐渡島の中心座標
const SADO_CENTER = { lat: 38.0549, lng: 138.3691 };

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
}

export function MapComponent({ className, onMapLoaded }: MapComponentProps) {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(11);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const apiKey = useMemo(() => import.meta.env["VITE_GOOGLE_MAPS_API_KEY"], []);

  // POIデータ読み込み
  useEffect(() => {
    const loadPOIs = async () => {
      try {
        const data = await fetchPOIs();
        setPois(data);
        logger.info("POI data loaded", { count: data.length });
      } catch (error) {
        logger.error("POI loading failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadPOIs();
  }, []);

  // マップとPOIの準備完了を通知
  useEffect(() => {
    if (!loading && mapReady && onMapLoaded) {
      onMapLoaded();
    }
  }, [loading, mapReady, onMapLoaded]);
  // クラスターズーム処理
  const zoomToCluster = useCallback(
    (poi: ClusterablePOI) => {
      if (!mapInstance || !isClusterPOI(poi) || poi.originalPois.length <= 1) return;

      const bounds = new google.maps.LatLngBounds();
      poi.originalPois.forEach((originalPoi: POI) => {
        bounds.extend(originalPoi.position);
      });

      const padding = { top: 80, right: 80, bottom: 80, left: 80 };
      mapInstance.fitBounds(bounds, padding);

      // ズームレベル制限
      google.maps.event.addListenerOnce(mapInstance, "idle", () => {
        const currentZoom = mapInstance.getZoom();
        if (currentZoom && currentZoom > SADO_CONSTANTS.MAX_ZOOM_LEVEL) {
          mapInstance.setZoom(SADO_CONSTANTS.MAX_ZOOM_LEVEL as number);
        } else if (currentZoom && currentZoom < SADO_CONSTANTS.MIN_CLUSTER_ZOOM) {
          mapInstance.setZoom(SADO_CONSTANTS.MIN_CLUSTER_ZOOM as number);
        }
      });
    },
    [mapInstance],
  ); // マーカークリック処理
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

  // マップ準備完了ハンドラー
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  // マップインスタンス取得
  const handleMapInstanceLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

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
  // ライブラリ設定
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
        onLoad={handleMapReady}
      >
        <Map
          defaultZoom={11}
          defaultCenter={SADO_CENTER}
          mapId={import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"] || "佐渡島マップ"}
          mapTypeId={google.maps.MapTypeId.TERRAIN}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={true}
          mapTypeControlOptions={{
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_LEFT,
          }}
          clickableIcons={true}
          style={{ width: "100%", height: "100%" }}
          reuseMaps={true}
          onIdle={handleMapReady}
          onCameraChanged={handleCameraChanged}
        >
          <MapInstanceCapture onMapInstance={handleMapInstanceLoad} />
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
