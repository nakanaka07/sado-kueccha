import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import type React from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SADO_ISLAND } from "../../constants/map";
import { fetchPOIs, removeDuplicatePOIs } from "../../services/sheets";
import type { FilterState } from "../../types/filter";
import type { POI } from "../../types/poi";
import { getAppConfig } from "../../utils/env";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

// MapインスタンスをキャプチャするためのComponent
const MapInstanceCapture = memo<{
  onMapLoad: (map: google.maps.Map) => void;
}>(({ onMapLoad }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      // Mapインスタンスが取得されました
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  return null;
});

MapInstanceCapture.displayName = "MapInstanceCapture";

// POIマーカーコンポーネント - AdvancedMarkerを使用して非推奨警告を解決
const POIMarkers = memo<{
  pois: POI[];
  onPoiClick: (poi: POI) => void;
}>(({ pois, onPoiClick }) => {
  return (
    <>
      {pois.map((poi) => (
        <AdvancedMarker
          key={poi.id}
          position={poi.position}
          title={poi.name}
          onClick={() => {
            onPoiClick(poi);
          }}
        />
      ))}
    </>
  );
});

POIMarkers.displayName = "POIMarkers";

interface MapComponentProps {
  className?: string;
  onMapLoaded?: (map: google.maps.Map) => void;
  enableClickableIcons?: boolean;
  filterState?: FilterState;
  pois?: POI[];
  children?: React.ReactNode;
  isPoisLoading?: boolean;
}

export const MapComponent = memo<MapComponentProps>(
  ({
    className = "map-container",
    onMapLoaded,
    enableClickableIcons = false,
    filterState,
    pois: externalPois,
    children,
    isPoisLoading = false,
  }) => {
    const [internalPois, setInternalPois] = useState<POI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
    // リスナー管理用のRef
    const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);
    const _mapInstanceRef = useRef<google.maps.Map | null>(null);
    const _currentZoomRef = useRef<number>(SADO_ISLAND.ZOOM.DEFAULT);

    // 使用するPOIデータを決定
    const activePois = useMemo(() => {
      const basePois = externalPois ?? internalPois;
      return removeDuplicatePOIs(basePois);
    }, [externalPois, internalPois]);

    // フィルタリング
    const filteredPois = useMemo(() => {
      if (!filterState) return activePois;

      return activePois.filter((poi) => {
        if (!poi.sourceSheet) return true;

        const sheetName = poi.sourceSheet.toLowerCase();

        const filterMap = {
          toilet: filterState.showToilets,
          parking: filterState.showParking,
          recommended: filterState.showRecommended,
          snack: filterState.showSnacks,
        } as const;

        for (const [keyword, shouldShow] of Object.entries(filterMap)) {
          if (sheetName.includes(keyword) && !shouldShow) {
            return false;
          }
        }

        return true;
      });
    }, [activePois, filterState]);

    // API設定
    const { maps } = getAppConfig();
    const { apiKey: googleMapsApiKey, mapId } = maps;
    const libraries = useMemo(() => ["marker"], []);

    const apiProviderConfig = useMemo(
      () => ({
        apiKey: googleMapsApiKey,
        version: "weekly" as const,
        libraries,
        language: "ja",
        region: "JP",
      }),
      [googleMapsApiKey, libraries],
    );

    // POIデータ読み込み
    useEffect(() => {
      if (externalPois !== undefined) {
        setIsLoading(false);
        return;
      }

      let isMounted = true;

      const loadPOIs = async () => {
        try {
          const data = await fetchPOIs();
          if (isMounted) {
            setInternalPois(data);
            setIsLoading(false);
            setError(null);
          }
        } catch (error) {
          console.error("POIデータの読み込みに失敗しました:", error);
          if (isMounted) {
            setError("POIデータの読み込みに失敗しました");
            setIsLoading(false);
          }
        }
      };

      void loadPOIs();

      return () => {
        isMounted = false;
      };
    }, [externalPois]);

    // マップインスタンスの設定
    const handleMapLoad = useCallback(
      (map: google.maps.Map) => {
        // マップが読み込まれました
        _mapInstanceRef.current = map;

        // 開発環境でのデバッグログ
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("[Map] Google Mapsインスタンス読み込み完了 - onMapLoadedを呼び出し");
        }

        onMapLoaded?.(map);

        // ズームイベントリスナーを設定
        if (zoomListenerRef.current) {
          google.maps.event.removeListener(zoomListenerRef.current);
        }
        zoomListenerRef.current = map.addListener("zoom_changed", () => {
          const zoom = map.getZoom() ?? SADO_ISLAND.ZOOM.DEFAULT;
          _currentZoomRef.current = zoom;
        });
      },
      [onMapLoaded],
    );

    // POIクリックハンドラー
    const handlePoiClick = useCallback((poi: POI) => {
      setSelectedPoi(poi);
    }, []);

    // クリーンアップ
    useEffect(() => {
      return () => {
        if (zoomListenerRef.current) {
          google.maps.event.removeListener(zoomListenerRef.current);
        }
      };
    }, []);

    // エラーハンドリング
    if (!googleMapsApiKey) {
      return (
        <div className={className}>
          <div className="map-error">地図を読み込めません（APIキーが設定されていません）</div>
        </div>
      );
    }

    if (!mapId) {
      return (
        <div className={className}>
          <div className="map-error">地図を読み込めません（Map IDが設定されていません）</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={className}>
          <div className="map-error">地図の読み込みに失敗しました</div>
        </div>
      );
    }

    if (isLoading || (externalPois !== undefined && isPoisLoading)) {
      return (
        <div className={className}>
          <div className="map-loading">地図を読み込み中...</div>
        </div>
      );
    }

    return (
      <div className={className}>
        <APIProvider
          {...apiProviderConfig}
          onError={() => {
            setError("地図の読み込みに失敗しました");
          }}
        >
          <Map
            defaultZoom={11}
            defaultCenter={{ lat: 38.0549, lng: 138.3691 }}
            mapTypeId="roadmap"
            mapId={mapId}
            style={{ width: "100%", height: "400px" }}
            disableDefaultUI={false}
            gestureHandling="greedy"
            clickableIcons={enableClickableIcons}
            onClick={() => {
              setSelectedPoi(null);
            }}
          >
            <MapInstanceCapture onMapLoad={handleMapLoad} />
            {children}
            {selectedPoi ? (
              <InfoWindow
                poi={selectedPoi}
                onClose={() => {
                  setSelectedPoi(null);
                }}
              />
            ) : null}
            <POIMarkers pois={filteredPois} onPoiClick={handlePoiClick} />
          </Map>
        </APIProvider>
      </div>
    );
  },
);

MapComponent.displayName = "MapComponent";
