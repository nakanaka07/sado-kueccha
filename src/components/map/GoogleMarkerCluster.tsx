import { AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { memo, useCallback, useMemo } from 'react';
import type { POI } from '../../types/poi';
import { ASSETS } from '../../utils/assets';
import './GoogleMarkerCluster.css';
import RecommendMarker from './RecommendMarker';

// 統合された設定とユーティリティ関数をインポート
import {
  CLUSTERING_CONFIG,
  MARKER_CONFIGS,
  getMarkerType,
  getMaxMarkersForZoom,
  isRecommendedPOI,
  sortPOIsByPriority,
} from './config';

/**
 * 統合されたGoogle Mapsマーカークラスター
 * シンプルモードと高度モードを設定で切り替え可能
 */
/**
 * 統合されたGoogle Mapsマーカークラスター
 * シンプルモードと高度モードを設定で切り替え可能
 */
interface GoogleMarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
  visible?: boolean;
  config?: {
    mode?: 'simple' | 'advanced';
    maxMarkers?: Record<number, number>;
    enableAnimations?: boolean;
    enablePulse?: boolean;
  };
}

const GoogleMarkerCluster = memo<GoogleMarkerClusterProps>(
  ({ pois, onMarkerClick, visible = true, config }) => {
    const map = useMap();

    // 設定をマージ（型安全版）
    const mergedConfig = useMemo(() => {
      return {
        mode: config?.mode ?? CLUSTERING_CONFIG.mode,
        maxMarkers: config?.maxMarkers ?? CLUSTERING_CONFIG.maxMarkers,
        enableAnimations:
          config?.enableAnimations ?? CLUSTERING_CONFIG.enableAnimations,
        enablePulse: config?.enablePulse ?? CLUSTERING_CONFIG.enablePulse,
      };
    }, [config]);

    // マーカークリックハンドラー
    const handleMarkerClick = useCallback(
      (poi: POI) => {
        if (process.env.NODE_ENV === 'development') {
          // Development logging
          // eslint-disable-next-line no-console
          console.log('[MarkerCluster] Marker clicked:', poi.name);
        }
        onMarkerClick?.(poi);
      },
      [onMarkerClick]
    );

    // アイコン設定の動的更新（ASSETSと統合）
    const getMarkerIcon = useCallback((type: keyof typeof MARKER_CONFIGS) => {
      switch (type) {
        case 'toilet':
          return ASSETS.ICONS.MARKERS.TOILETTE;
        case 'parking':
          return ASSETS.ICONS.MARKERS.PARKING;
        default:
          return null;
      }
    }, []);

    // 現在のズームレベルを取得
    const zoom = map?.getZoom() || 10;

    // パフォーマンス制限とPOIの優先度ソート
    const { processedPOIs, totalCount } = useMemo(() => {
      const maxMarkers = getMaxMarkersForZoom(zoom);
      const sortedPOIs = sortPOIsByPriority(pois);
      const limited = sortedPOIs.slice(0, maxMarkers);

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(
          `[MarkerCluster] Zoom: ${zoom}, Max: ${maxMarkers}, Showing: ${limited.length}/${pois.length}`
        );
      }

      return {
        processedPOIs: limited,
        totalCount: pois.length,
      };
    }, [pois, zoom]);

    // POIを通常マーカーとおすすめマーカーに分離
    const { normalPOIs, recommendedPOIs } = useMemo(() => {
      const normal: POI[] = [];
      const recommended: POI[] = [];

      processedPOIs.forEach(poi => {
        if (isRecommendedPOI(poi)) {
          recommended.push(poi);
        } else {
          normal.push(poi);
        }
      });

      return { normalPOIs: normal, recommendedPOIs: recommended };
    }, [processedPOIs]);

    // 表示制御
    if (!visible || !map) {
      return null;
    }

    return (
      <>
        {/* パフォーマンス情報（開発時のみ） */}
        {process.env.NODE_ENV === 'development' ? (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            Markers: {processedPOIs.length}/{totalCount} | Zoom: {zoom}
          </div>
        ) : null}

        {/* 通常のマーカー */}
        {normalPOIs.map(poi => {
          const markerType = getMarkerType(poi);
          const markerConfig = MARKER_CONFIGS[markerType];
          const icon = getMarkerIcon(markerType);

          // 設定が取得できない場合のフォールバック
          if (!markerConfig) {
            return null;
          }

          return (
            <AdvancedMarker
              key={poi.id}
              position={poi.position}
              onClick={() => {
                handleMarkerClick(poi);
              }}
              title={poi.name}
              zIndex={100}
            >
              {mergedConfig.mode === 'simple' || !icon ? (
                <Pin
                  background={markerConfig.style.background}
                  borderColor={markerConfig.style.borderColor}
                  glyphColor={markerConfig.style.glyphColor}
                  scale={zoom >= 15 ? 1.2 : 1.0}
                />
              ) : (
                <div className="custom-marker-icon">
                  <img
                    src={icon}
                    alt={`${markerType} marker`}
                    width={zoom >= 15 ? 32 : 24}
                    height={zoom >= 15 ? 32 : 24}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                  />
                </div>
              )}
            </AdvancedMarker>
          );
        })}

        {/* おすすめマーカー */}
        {recommendedPOIs.map(poi => (
          <RecommendMarker
            key={`recommend-${poi.id}`}
            poi={poi}
            onClick={() => {
              handleMarkerClick(poi);
            }}
            showLabel={zoom >= 14}
            isHighlighted={false}
          />
        ))}
      </>
    );
  }
);

GoogleMarkerCluster.displayName = 'GoogleMarkerCluster';

GoogleMarkerCluster.displayName = 'GoogleMarkerCluster';

export default GoogleMarkerCluster;
