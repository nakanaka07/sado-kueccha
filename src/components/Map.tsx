import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SADO_ISLAND } from "../constants";
import { fetchPOIs } from "../services/sheets";
import type { FilterState } from "../types/filter";
import type { POI, POICluster } from "../types/poi";
import { getAppConfig } from "../utils/env";
import { isPOICluster } from "../utils/typeGuards";
import { GoogleMarkerCluster } from "./GoogleMarkerCluster";
import { InfoWindow } from "./InfoWindow";
import "./Map.css";

// 設定定数
const MAP_CONFIG = {
  DEFAULT_ZOOM: SADO_ISLAND.ZOOM.DEFAULT,
} as const;

/**
 * POI重複除去ユーティリティ
 * recommendedシートを優先し、位置ベースで重複を除去
 */
function deduplicatePOIs(pois: POI[]): POI[] {
  const positionMap: Record<string, POI> = {};

  // 非recommendedを先に処理
  pois.forEach((poi) => {
    if (poi.sourceSheet === "recommended") return;
    const key = `${poi.position.lat.toFixed(6)}-${poi.position.lng.toFixed(6)}`;
    positionMap[key] ??= poi;
  });

  // recommendedで上書き
  pois.forEach((poi) => {
    if (poi.sourceSheet !== "recommended") return;
    const key = `${poi.position.lat.toFixed(6)}-${poi.position.lng.toFixed(6)}`;
    positionMap[key] = poi;
  });

  return Object.values(positionMap);
}

/**
 * エラー状態表示コンポーネント
 */
const ErrorDisplay = ({ message, className }: { message: string; className: string }) => {
  return (
    <div className={className}>
      <div className="map-state-display map-error">{message}</div>
    </div>
  );
};

/**
 * ローディング状態表示コンポーネント
 */
const LoadingDisplay = ({ className }: { className: string }) => {
  return (
    <div className={className}>
      <div className="map-state-display map-loading">地図を読み込み中...</div>
    </div>
  );
};

// マップインスタンス取得用ヘルパー
const MapInstanceCapture = ({
  onMapInstance,
}: {
  onMapInstance: (map: google.maps.Map) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapInstance(map);
    }
  }, [map, onMapInstance]);

  return null;
};

interface MapComponentProps {
  className?: string;
  onMapLoaded?: () => void;
  enableClickableIcons?: boolean;
  filterState?: FilterState;
  pois?: POI[];
  children?: React.ReactNode;
  isPoisLoading?: boolean;
}

export const MapComponent = ({
  className = "map-container",
  onMapLoaded,
  enableClickableIcons = false,
  filterState,
  pois: externalPois,
  children,
  isPoisLoading = false,
}: MapComponentProps) => {
  const [internalPois, setInternalPois] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(MAP_CONFIG.DEFAULT_ZOOM);

  // 使用するPOIデータを決定（簡素化された重複除去）
  const activePois = useMemo(() => {
    const basePois = externalPois ?? internalPois;
    return deduplicatePOIs(basePois);
  }, [externalPois, internalPois]);

  // フィルタされたPOIを計算
  const filteredPois = useMemo(() => {
    if (!filterState) return activePois;

    // 基本的なフィルタリングロジック
    return activePois.filter((poi) => {
      if (!poi.sourceSheet) return true;

      // シート名に基づく簡単なフィルタリング
      const sheetName = poi.sourceSheet.toLowerCase();
      if (sheetName.includes("toilet") && !filterState.showToilets) return false;
      if (sheetName.includes("parking") && !filterState.showParking) return false;
      if (sheetName.includes("recommended") && !filterState.showRecommended) return false;
      if (sheetName.includes("snack") && !filterState.showSnacks) return false;

      return true;
    });
  }, [activePois, filterState]);

  // APIキーとライブラリ設定
  const { maps } = getAppConfig();
  const { apiKey: googleMapsApiKey, mapId: googleMapsMapId } = maps;
  const libraries = useMemo(() => ["marker"], []);

  // Google Maps API読み込み状態を監視
  useEffect(() => {
    const checkGoogleMapsLoaded = () => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (typeof google !== "undefined" && google?.maps?.MapTypeId) {
        setIsGoogleMapsLoaded(true);
      }
    };

    // 既に読み込まれているかチェック
    checkGoogleMapsLoaded();

    // 読み込まれていない場合は定期的にチェック
    const interval = setInterval(checkGoogleMapsLoaded, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // POIデータ読み込み（外部から提供されない場合のみ）
  useEffect(() => {
    // 外部からPOIが提供される場合は、独自の取得を行わない
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
        }
      } catch {
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

  // マップとPOIの準備完了を通知（外部POI読み込み状態も考慮）
  useEffect(() => {
    // 内部でPOIを読み込む場合は内部のloadingを使用
    // 外部からPOIが提供される場合は外部のloading状態を使用
    const effectiveLoading = externalPois !== undefined ? isPoisLoading : isLoading;

    if (!effectiveLoading && onMapLoaded) {
      onMapLoaded();
    }
  }, [isLoading, isPoisLoading, onMapLoaded, externalPois]);

  // クラスターズーム処理（シンプル版）
  const zoomToCluster = useCallback(
    (poi: POICluster) => {
      if (!mapInstance || poi.pois.length <= 1) return;

      // 緩やかなズーム処理
      const bounds = new google.maps.LatLngBounds();
      poi.pois.forEach((originalPoi: POI) => {
        bounds.extend(originalPoi.position);
      });

      // 段階的にズーム
      const currentZoom = mapInstance.getZoom() || 10;
      const targetZoom = Math.min(currentZoom + 2, 16); // 最大でも+2ズーム

      // まず中心に移動
      mapInstance.panTo(poi.center);

      // 少し遅延してからズーム
      setTimeout(() => {
        mapInstance.setZoom(targetZoom);

        // さらに遅延してからfitBounds
        setTimeout(() => {
          mapInstance.fitBounds(bounds, {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100,
          });
        }, 500);
      }, 300);
    },
    [mapInstance],
  );

  // マーカークリック処理（緩やかなアニメーション）
  const handleMarkerClick = useCallback(
    (poi: POI | POICluster) => {
      if (isPOICluster(poi)) {
        zoomToCluster(poi);
      } else {
        setSelectedPoi(poi);
      }
    },
    [zoomToCluster],
  );

  // マップインスタンス設定
  const handleMapInstanceLoad = useCallback(
    (map: google.maps.Map) => {
      setMapInstance(map);

      // ズームレベル変更リスナーを追加
      const zoomChangedListener = map.addListener("zoom_changed", () => {
        const zoom = map.getZoom();
        if (zoom !== undefined) {
          setCurrentZoom(zoom);
        }
      });

      if (!enableClickableIcons) {
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          const eventWithPlace = event as google.maps.MapMouseEvent & { placeId?: string };
          if (eventWithPlace.placeId) {
            event.stop();
          }
        });
      }

      // クリーンアップ用のリスナー削除を考慮
      return () => {
        google.maps.event.removeListener(zoomChangedListener);
      };
    },
    [enableClickableIcons],
  );

  if (isLoading || (externalPois !== undefined && isPoisLoading)) {
    return <LoadingDisplay className={className} />;
  }

  if (!googleMapsApiKey) {
    return (
      <ErrorDisplay
        className={className}
        message="Google Maps APIキーが設定されていません。VITE_GOOGLE_MAPS_API_KEY環境変数を設定してください。"
      />
    );
  }

  if (error) {
    return <ErrorDisplay className={className} message={error} />;
  }

  // Google Maps APIが読み込まれるまで待機
  if (!isGoogleMapsLoaded) {
    return <LoadingDisplay className={className} />;
  }

  return (
    <div className={className}>
      {children}
      <APIProvider
        apiKey={googleMapsApiKey}
        version="weekly"
        libraries={libraries}
        language="ja"
        region="JP"
        onError={() => {
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
          fullscreenControlOptions={{
            position: google.maps.ControlPosition.TOP_RIGHT,
          }}
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
          onClick={() => {
            setSelectedPoi(null);
          }}
        >
          <MapInstanceCapture onMapInstance={handleMapInstanceLoad} />
          <GoogleMarkerCluster
            pois={filteredPois}
            onMarkerClick={handleMarkerClick}
            currentZoom={currentZoom}
            clusteringEnabled={filterState?.enableClustering ?? true}
          />
          {selectedPoi ? (
            <InfoWindow
              poi={selectedPoi}
              onClose={() => {
                setSelectedPoi(null);
              }}
            />
          ) : null}
        </Map>
      </APIProvider>
    </div>
  );
};
