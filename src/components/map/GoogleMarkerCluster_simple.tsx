import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { memo, useCallback } from "react";
import type { POI } from "../../types/poi";
import { ASSETS } from "../../utils/assets";
import "./GoogleMarkerCluster.css";
import RecommendMarker from "./RecommendMarker";

/**
 * 基本的なマーカー設定
 */
const MARKER_CONFIGS = {
  toilet: {
    keywords: ["トイレ", "toilet", "お手洗い"],
    icon: ASSETS.ICONS.MARKERS.TOILETTE,
    style: { background: "#8B4513", borderColor: "#654321", glyphColor: "white" },
  },
  parking: {
    keywords: ["駐車", "parking", "パーキング"],
    icon: ASSETS.ICONS.MARKERS.PARKING,
    style: { background: "#2E8B57", borderColor: "#1F5F3F", glyphColor: "white" },
  },
  normal: {
    keywords: [],
    icon: null,
    style: { background: "#4285F4", borderColor: "#1A73E8", glyphColor: "white" },
  },
} as const;

/**
 * マーカーの種類を判定
 */
const getMarkerType = (poi: POI): keyof typeof MARKER_CONFIGS => {
  const name = poi.name.toLowerCase();
  const genre = poi.genre.toLowerCase();
  const combined = `${name} ${genre}`;

  if (MARKER_CONFIGS.toilet.keywords.some((keyword) => combined.includes(keyword))) {
    return "toilet";
  }
  if (MARKER_CONFIGS.parking.keywords.some((keyword) => combined.includes(keyword))) {
    return "parking";
  }
  return "normal";
};

/**
 * おすすめPOIかどうかを判定
 */
const isRecommendedPOI = (poi: POI): boolean => {
  return poi.sourceSheet === "recommended" || poi.genre === "recommend";
};

/**
 * シンプルなGoogle Mapsマーカークラスター
 */
interface GoogleMarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
  visible?: boolean;
}

const GoogleMarkerCluster = memo<GoogleMarkerClusterProps>(
  ({ pois, onMarkerClick, visible = true }) => {
    const map = useMap();

    // マーカークリックハンドラー
    const handleMarkerClick = useCallback(
      (poi: POI) => {
        onMarkerClick?.(poi);
      },
      [onMarkerClick],
    );

    // 表示制御
    if (!visible || !map) {
      return null;
    }

    // 現在のズームレベルを取得
    const zoom = map.getZoom() || 10;

    // パフォーマンス制限
    const maxMarkers = zoom >= 15 ? 200 : zoom >= 12 ? 100 : 50;
    const limitedPOIs = pois.slice(0, maxMarkers);

    return (
      <>
        {/* 通常のマーカー */}
        {limitedPOIs
          .filter((poi) => !isRecommendedPOI(poi))
          .map((poi) => {
            const markerType = getMarkerType(poi);
            const config = MARKER_CONFIGS[markerType];

            return (
              <AdvancedMarker
                key={poi.id}
                position={poi.position}
                onClick={() => {
                  handleMarkerClick(poi);
                }}
                title={poi.name}
              >
                <Pin
                  background={config.style.background}
                  borderColor={config.style.borderColor}
                  glyphColor={config.style.glyphColor}
                  scale={zoom >= 15 ? 1.2 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

        {/* おすすめマーカー */}
        {limitedPOIs
          .filter((poi) => isRecommendedPOI(poi))
          .map((poi) => (
            <RecommendMarker
              key={`recommend-${poi.id}`}
              poi={poi}
              onClick={() => {
                handleMarkerClick(poi);
              }}
            />
          ))}
      </>
    );
  },
);

GoogleMarkerCluster.displayName = "GoogleMarkerCluster";

export default GoogleMarkerCluster;
