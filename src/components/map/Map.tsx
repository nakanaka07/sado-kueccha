import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from '@vis.gl/react-google-maps';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SADO_ISLAND } from '../../constants';
import {
  googleSheetsService,
  removeDuplicatePOIs,
} from '../../services/sheets';
import {
  combineModuleClasses,
  PerformanceStyles,
} from '../../styles/constants';
import type { FilterState } from '../../types/filter';
import type { POI } from '../../types/poi';
import { getAppConfig } from '../../utils/env';
import { InfoWindow } from './InfoWindow';
import './Map.css';
import { MapErrorBoundary } from './MapErrorBoundary';
import { MapLoadingStates } from './MapLoadingStates';

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

MapInstanceCapture.displayName = 'MapInstanceCapture';

// POIマーカーコンポーネント - 最適化されたレンダリング
const POIMarkers = memo<{
  pois: POI[];
  onPoiClick: (poi: POI) => void;
}>(({ pois, onPoiClick }) => {
  // パフォーマンス最適化: 大量のPOIがある場合は段階的にレンダリング
  const [renderedCount, setRenderedCount] = useState(Math.min(50, pois.length));

  // 段階的レンダリング - React 18のConcurrent Featuresを活用
  useEffect(() => {
    if (renderedCount < pois.length) {
      const timeoutId = setTimeout(() => {
        setRenderedCount(prev => Math.min(prev + 25, pois.length));
      }, 16); // 次のフレームで追加レンダリング

      return () => {
        clearTimeout(timeoutId);
      };
    }

    return undefined;
  }, [renderedCount, pois.length]);

  // POIの変更時にレンダリング数をリセット
  useEffect(() => {
    setRenderedCount(Math.min(50, pois.length));
  }, [pois]);

  // レンダリングするPOIを制限
  const poisToRender = useMemo(() => {
    // 優先度つきソート: おすすめマーカーを最初に表示
    const sorted = [...pois].sort((a, b) => {
      const aIsRecommended =
        a.sourceSheet?.toLowerCase().includes('recommend') ||
        a.sourceSheet?.toLowerCase().includes('おすすめ');
      const bIsRecommended =
        b.sourceSheet?.toLowerCase().includes('recommend') ||
        b.sourceSheet?.toLowerCase().includes('おすすめ');

      if (aIsRecommended && !bIsRecommended) return -1;
      if (!aIsRecommended && bIsRecommended) return 1;
      return 0;
    });

    return sorted.slice(0, renderedCount);
  }, [pois, renderedCount]);

  return (
    <>
      {poisToRender.map(poi => (
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

POIMarkers.displayName = 'POIMarkers';

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
    className = combineModuleClasses(PerformanceStyles.mapContainer),
    onMapLoaded,
    enableClickableIcons = false,
    filterState,
    pois: externalPois,
    children,
    isPoisLoading = false,
  }) => {
    const [internalPois, setInternalPois] = useState<POI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
    // リスナー管理用のRef
    const zoomListenerRef = useRef<google.maps.MapsEventListener | null>(null);
    const _mapInstanceRef = useRef<google.maps.Map | null>(null);
    const _currentZoomRef = useRef<number>(SADO_ISLAND.ZOOM.DEFAULT);

    // 使用するPOIデータを決定
    const [activePois, setActivePois] = useState<POI[]>([]);

    useEffect(() => {
      const updateActivePois = () => {
        const basePois = externalPois ?? internalPois;
        setActivePois(removeDuplicatePOIs(basePois));
      };

      updateActivePois();
    }, [externalPois, internalPois]);

    // Google Maps API エラーハンドリング（MapErrorBoundaryに委譲）
    useEffect(() => {
      // グローバルエラーハンドラーは MapErrorBoundary が処理するため削除
      return () => {
        // クリーンアップのみ実行
      };
    }, []);

    // フィルタリングロジックをメモ化（パフォーマンス最適化）
    const filterMap = useMemo(
      () => ({
        toilet: filterState?.showToilets ?? true,
        parking: filterState?.showParking ?? true,
        recommended: filterState?.showRecommended ?? true,
        snack: filterState?.showSnacks ?? true,
      }),
      [
        filterState?.showToilets,
        filterState?.showParking,
        filterState?.showRecommended,
        filterState?.showSnacks,
      ]
    );

    // フィルタリング - 最適化されたロジック
    const filteredPois = useMemo(() => {
      if (!filterState) return activePois;

      return activePois.filter(poi => {
        if (!poi.sourceSheet) return true;

        const sheetName = poi.sourceSheet.toLowerCase();

        // 最適化されたフィルタリング: 早期リターンを使用
        for (const [keyword, shouldShow] of Object.entries(filterMap)) {
          if (sheetName.includes(keyword) && !shouldShow) {
            return false;
          }
        }

        return true;
      });
    }, [activePois, filterMap, filterState]);

    // API設定
    const { maps } = getAppConfig();
    const { apiKey: googleMapsApiKey, mapId } = maps;
    const libraries = useMemo(() => ['marker'], []);

    // マップオプションの完全なメモ化
    const mapOptions = useMemo(
      () => ({
        center: SADO_ISLAND.CENTER,
        zoom: SADO_ISLAND.ZOOM.DEFAULT,
        maxZoom: SADO_ISLAND.ZOOM.MAX,
        minZoom: SADO_ISLAND.ZOOM.MIN,
        mapId,
        mapTypeId: 'roadmap' as const,
        clickableIcons: enableClickableIcons,
        disableDefaultUI: false,
        keyboardShortcuts: true,
        gestureHandling: 'greedy' as const,
        restriction: {
          latLngBounds: {
            north: SADO_ISLAND.BOUNDS.NORTH,
            south: SADO_ISLAND.BOUNDS.SOUTH,
            east: SADO_ISLAND.BOUNDS.EAST,
            west: SADO_ISLAND.BOUNDS.WEST,
          },
          strictBounds: false,
        },
      }),
      [mapId, enableClickableIcons]
    );

    const apiProviderConfig = useMemo(
      () => ({
        apiKey: googleMapsApiKey,
        version: 'weekly' as const,
        libraries,
        language: 'ja',
        region: 'JP',
      }),
      [googleMapsApiKey, libraries]
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
          const data = await googleSheetsService.fetchPOIData('recommended');
          const processedData = removeDuplicatePOIs(data);
          if (isMounted) {
            setInternalPois(processedData);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('POIデータの読み込みに失敗しました:', error);
          if (isMounted) {
            setIsLoading(false);
            // エラーは MapErrorBoundary が処理
            throw error;
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
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(
            '[Map] Google Mapsインスタンス読み込み完了 - onMapLoadedを呼び出し'
          );
        }

        onMapLoaded?.(map);

        // ズームイベントリスナーを設定
        if (zoomListenerRef.current) {
          google.maps.event.removeListener(zoomListenerRef.current);
        }
        zoomListenerRef.current = map.addListener('zoom_changed', () => {
          const zoom = map.getZoom() ?? SADO_ISLAND.ZOOM.DEFAULT;
          _currentZoomRef.current = zoom;
        });
      },
      [onMapLoaded]
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

    // エラーハンドリング（MapErrorBoundaryに委譲）
    if (!googleMapsApiKey) {
      throw new Error('地図を読み込めません（APIキーが設定されていません）');
    }

    if (!mapId) {
      throw new Error('地図を読み込めません（Map IDが設定されていません）');
    }

    if (isLoading || (externalPois !== undefined && isPoisLoading)) {
      return (
        <MapLoadingStates
          className={className}
          isLoading={isLoading}
          isPoisLoading={isPoisLoading}
        />
      );
    }

    return (
      <div className={className}>
        <MapErrorBoundary>
          <APIProvider {...apiProviderConfig}>
            <Map
              {...mapOptions}
              style={{ width: '100%', height: '400px' }}
              onClick={() => {
                setSelectedPoi(null);
              }}
              onCameraChanged={_event => {
                // カメラ変更時の処理（必要に応じて）
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
              {/* 最適化されたマーカークラスタリングを使用 */}
              <POIMarkers pois={filteredPois} onPoiClick={handlePoiClick} />
            </Map>
          </APIProvider>
        </MapErrorBoundary>
      </div>
    );
  }
);

MapComponent.displayName = 'MapComponent';
