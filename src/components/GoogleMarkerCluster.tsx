import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSETS, SADO_ISLAND } from "../constants";
import { cacheService } from "../services/cache";
import type { ClusterablePOI, ClusterPOI, POI } from "../types/google-maps";
import { GeoUtils } from "../utils/geo";
import "./GoogleMarkerCluster.css";

let clusterSequence = 0;

// 共通のユーティリティ関数
const generateHashFromArray = (items: string[]): string => {
  return Math.abs(
    items
      .sort()
      .join("-")
      .split("")
      .reduce((hash, char) => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
        return hash;
      }, 0),
  ).toString(36);
};

const isInViewport = (poi: POI, bounds: google.maps.LatLngBounds | null): boolean => {
  return !bounds || GeoUtils.isInBounds(poi.position.lat, poi.position.lng, bounds);
};

const partitionPOIsByViewport = (
  pois: ClusterablePOI[],
  bounds: google.maps.LatLngBounds | null,
) => {
  if (!bounds) return { inViewport: pois, outOfViewport: [] };

  const inViewport: ClusterablePOI[] = [];
  const outOfViewport: ClusterablePOI[] = [];

  for (const poi of pois) {
    if (isInViewport(poi, bounds)) {
      inViewport.push(poi);
    } else {
      outOfViewport.push(poi);
    }
  }

  return { inViewport, outOfViewport };
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Types
interface GoogleMarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: ClusterablePOI) => void;
  currentZoom?: number;
}

interface MarkerComponentProps {
  poi: ClusterablePOI;
  onMarkerClick?: (poi: ClusterablePOI) => void;
  isCluster?: boolean;
  clusterSize?: number;
  currentZoom?: number;
}

// Helper functions for clustering
const generateCacheKey = (pois: POI[], zoomLevel: number): string => {
  const poisIdHash = generateHashFromArray(pois.map((p) => p.id));
  return `cluster-${pois.length.toString()}-${Math.round(zoomLevel * 10).toString()}-${poisIdHash}`;
};

const generateClusterId = (centerLat: number, centerLng: number, cluster: POI[]): string => {
  const sortedIds = cluster.map((p) => p.id).sort(); // ソートして一意性を保証
  const locationHash = Math.abs(
    Math.round(centerLat * 10000000) + Math.round(centerLng * 10000000), // 精度向上
  ).toString(36);
  const idsHash = generateHashFromArray(sortedIds);
  const timestamp = Date.now().toString(36); // タイムスタンプを追加
  const randomSuffix = Math.random().toString(36).substring(2, 11); // ランダム文字列追加

  return `cluster-${locationHash}-${cluster.length.toString()}-${idsHash}-${timestamp}-${(++clusterSequence).toString(36)}-${randomSuffix}`;
};

const createClusterPOI = (cluster: POI[], poi: POI): ClusterPOI => {
  const centerLat = cluster.reduce((sum, p) => sum + p.position.lat, 0) / cluster.length;
  const centerLng = cluster.reduce((sum, p) => sum + p.position.lng, 0) / cluster.length;
  const uniqueId = generateClusterId(centerLat, centerLng, cluster);

  return {
    ...poi,
    id: uniqueId,
    name: `${cluster.length.toString()}件の施設`,
    position: { lat: centerLat, lng: centerLng },
    description: cluster.map((p) => p.name).join(", "),
    clusterSize: cluster.length,
    originalPois: cluster,
  };
};

// Main clustering function
const clusterPOIs = (
  pois: POI[],
  zoomLevel: number = 10,
  mapBounds: google.maps.LatLngBounds | null = null,
): ClusterablePOI[] => {
  if (pois.length === 0) return [];

  const cacheKey = generateCacheKey(pois, zoomLevel);
  const cached = cacheService.getTyped(
    cacheKey,
    (value): value is ClusterablePOI[] =>
      Array.isArray(value) &&
      (value.length === 0 ||
        (typeof value[0] === "object" && value[0] !== null && "id" in value[0])),
  );

  if (cached) {
    return cached;
  } // Disable clustering at high zoom levels
  if (zoomLevel >= SADO_ISLAND.ZOOM.DISABLE_CLUSTERING) {
    const maxMarkers =
      zoomLevel >= SADO_ISLAND.ZOOM.HIGH_THRESHOLD
        ? SADO_ISLAND.MARKER_LIMITS.HIGH_ZOOM
        : SADO_ISLAND.MARKER_LIMITS.NORMAL_ZOOM;

    let limitedPois: POI[];

    if (pois.length > maxMarkers) {
      // ビューポート内のマーカーを優先的に選択
      const inViewportPois = mapBounds ? pois.filter((poi) => isInViewport(poi, mapBounds)) : [];
      const outOfViewportPois = mapBounds
        ? pois.filter((poi) => !isInViewport(poi, mapBounds))
        : pois;

      if (mapBounds && inViewportPois.length > 0) {
        // ビューポート内のマーカーを最大限含める
        const viewportCount = Math.min(inViewportPois.length, maxMarkers);
        const remainingSlots = Math.max(0, maxMarkers - viewportCount);
        const selectedViewportPois = inViewportPois.slice(0, viewportCount);
        const selectedOutOfViewportPois = outOfViewportPois.slice(0, remainingSlots);

        limitedPois = [...selectedViewportPois, ...selectedOutOfViewportPois];
      } else {
        // マップ境界が利用できない場合は従来通り
        limitedPois = pois.slice(0, maxMarkers);
      }
    } else {
      limitedPois = pois;
    }

    // 非常に近い位置のマーカーにオフセットを適用
    const poisWithOffsets = GeoUtils.applyOffsetsForCloseMarkers(limitedPois);

    cacheService.setWithLimit(cacheKey, poisWithOffsets);
    return poisWithOffsets;
  }

  const clusterDistance = GeoUtils.getClusteringDistance(zoomLevel);
  const clusters: ClusterablePOI[] = [];
  const processed = new Set<string>();

  // Sort POIs for better clustering performance
  const sortedPois = [...pois].sort((a, b) => {
    const latDiff = a.position.lat - b.position.lat;
    return latDiff !== 0 ? latDiff : a.position.lng - b.position.lng;
  });

  for (const poi of sortedPois) {
    if (processed.has(poi.id)) continue;

    const cluster = [poi];
    processed.add(poi.id);

    for (const otherPoi of sortedPois) {
      if (processed.has(otherPoi.id)) continue;

      const distanceSquared = GeoUtils.getDistanceSquared(
        poi.position.lat,
        poi.position.lng,
        otherPoi.position.lat,
        otherPoi.position.lng,
      );
      const clusterDistanceSquared = clusterDistance * clusterDistance;

      if (distanceSquared < clusterDistanceSquared) {
        cluster.push(otherPoi);
        processed.add(otherPoi.id);
      }
    }

    const clusterPoi = cluster.length === 1 ? poi : createClusterPOI(cluster, poi);

    clusters.push(clusterPoi);
  }

  // 非常に近い位置の個別マーカーにオフセットを適用
  const clustersWithOffsets = GeoUtils.applyOffsetsForCloseMarkers(clusters);

  cacheService.setWithLimit(cacheKey, clustersWithOffsets);
  return clustersWithOffsets;
};

// マーカー設定の定数
const ZOOM_THRESHOLDS = {
  FULL_ICON: 16,
  COMPACT_ICON: 13,
} as const;

const MARKER_KEYWORDS = {
  toilet: ["トイレ", "toilet", "お手洗い", "化粧室"],
  parking: ["駐車", "parking", "パーキング"],
} as const;

const MARKER_STYLES = {
  toilet: {
    background: "#8B4513",
    borderColor: "#654321",
    glyphColor: "white",
    glyph: "🚻",
  },
  parking: {
    background: "#2E8B57",
    borderColor: "#1F5F3F",
    glyphColor: "white",
    glyph: "🅿️",
  },
  normal: {
    background: "#4285F4",
    borderColor: "#1A73E8",
    glyphColor: "white",
  },
} as const;

const CLUSTER_CONFIGS = [
  { min: 10, background: "#E53E3E", borderColor: "#C53030", scale: 1.5 },
  { min: 6, background: "#FF8C00", borderColor: "#E67300", scale: 1.3 },
  { min: 2, background: "#FF6B35", borderColor: "#CC5429", scale: 1.2 },
] as const;

// マーカータイプの判定
const getMarkerType = (poi: POI): "toilet" | "parking" | "normal" => {
  if (!poi.name) return "normal";

  const name = poi.name.toLowerCase();

  if (MARKER_KEYWORDS.toilet.some((keyword) => name.includes(keyword))) {
    return "toilet";
  }

  if (MARKER_KEYWORDS.parking.some((keyword) => name.includes(keyword))) {
    return "parking";
  }

  return "normal";
};

// カスタムマーカーアイコンの設定（高ズーム時用）
const getCustomMarkerIcon = (markerType: "toilet" | "parking" | "normal"): string | null => {
  switch (markerType) {
    case "toilet":
      return ASSETS.ICONS.MARKERS.TOILETTE;
    case "parking":
      return ASSETS.ICONS.MARKERS.PARKING;
    default:
      return null;
  }
};

// Pin configuration with 3段階ズーム対応
const getPinConfig = (
  isCluster: boolean,
  clusterSize?: number,
  poi?: POI,
  currentZoom?: number,
) => {
  // クラスターの場合
  if (isCluster && clusterSize) {
    const config =
      CLUSTER_CONFIGS.find((c) => clusterSize >= c.min) ||
      CLUSTER_CONFIGS[CLUSTER_CONFIGS.length - 1];
    if (!config) return null;

    // minプロパティを除外してPinコンポーネント用の設定のみを返す
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { min, ...pinProps } = config;

    return {
      ...pinProps,
      glyphColor: "white",
      glyph: clusterSize.toString(),
    };
  }

  // 個別マーカーの場合
  if (!poi) return null;

  const markerType = getMarkerType(poi);

  // 超高ズーム：フルサイズカスタムアイコン
  if (currentZoom && currentZoom >= ZOOM_THRESHOLDS.FULL_ICON) {
    const customIcon = getCustomMarkerIcon(markerType);
    if (customIcon) {
      return {
        background: "transparent",
        borderColor: "transparent",
        scale: 1.0,
        useCustomIcon: true,
        customIconUrl: customIcon,
        iconSize: "full-size",
      };
    }
  }

  // 中ズーム：小さなカスタムアイコン
  if (currentZoom && currentZoom >= ZOOM_THRESHOLDS.COMPACT_ICON) {
    const customIcon = getCustomMarkerIcon(markerType);
    if (customIcon) {
      return {
        background: "transparent",
        borderColor: "transparent",
        scale: 1.0,
        useCustomIcon: true,
        customIconUrl: customIcon,
        iconSize: "compact",
      };
    }
  }

  // 低ズーム：カラー＋絵文字のPinマーカー
  return {
    ...MARKER_STYLES[markerType],
    scale: 1.0,
  };
};

// Marker Component
const MarkerComponent = memo(
  ({ poi, onMarkerClick, isCluster, clusterSize, currentZoom }: MarkerComponentProps) => {
    const handleClick = useCallback(() => {
      if (onMarkerClick) {
        onMarkerClick(poi);
      }
    }, [poi, onMarkerClick]);

    const pinConfig = getPinConfig(isCluster || false, clusterSize, poi, currentZoom);
    if (!pinConfig) return null;

    const title =
      isCluster && clusterSize
        ? `${clusterSize.toString()}件の施設が集まっています - クリックしてズーム\n含まれる施設: ${poi.description || "データなし"}`
        : poi.name;

    // カスタムアイコンを使用する場合
    if ("useCustomIcon" in pinConfig && pinConfig.useCustomIcon && "customIconUrl" in pinConfig) {
      const iconSizeClass =
        "iconSize" in pinConfig
          ? `custom-marker-icon--${pinConfig.iconSize}`
          : "custom-marker-icon--full-size";
      return (
        <AdvancedMarker position={poi.position} onClick={handleClick} title={title}>
          <img
            src={pinConfig.customIconUrl}
            alt={title}
            className={`custom-marker-icon ${iconSizeClass}`}
          />
        </AdvancedMarker>
      );
    }

    // 通常のPinマーカー
    return (
      <AdvancedMarker position={poi.position} onClick={handleClick} title={title}>
        <Pin {...pinConfig} />
      </AdvancedMarker>
    );
  },
);

MarkerComponent.displayName = "MarkerComponent";

// Main Component
export const GoogleMarkerCluster = memo(
  ({ pois, onMarkerClick, currentZoom = 10 }: GoogleMarkerClusterProps) => {
    const map = useMap();
    const [visibleMarkers, setVisibleMarkers] = useState<ClusterablePOI[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const debouncedZoom = useDebounce(currentZoom, 100);

    const clusteredPois = useMemo(() => {
      // マップの境界を取得してclusterPOIs関数に渡す
      const bounds = map?.getBounds() || null;

      const result = clusterPOIs(pois, debouncedZoom, bounds);
      return result;
    }, [pois, debouncedZoom, map]);

    // Viewport-based progressive rendering
    useEffect(() => {
      if (!map || clusteredPois.length === 0) {
        setVisibleMarkers(clusteredPois);
        return;
      }

      const bounds = map.getBounds();

      if (!bounds) {
        setVisibleMarkers(clusteredPois);
        return;
      }

      const { inViewport, outOfViewport } = partitionPOIsByViewport(clusteredPois, bounds);

      setVisibleMarkers(inViewport);

      if (outOfViewport.length > 0) {
        setIsLoadingMore(true);

        const chunkSize = Math.min(50, Math.max(10, Math.floor(outOfViewport.length / 10)));
        let currentIndex = 0;

        const loadChunk = () => {
          if (currentIndex >= outOfViewport.length) {
            setIsLoadingMore(false);
            return;
          }

          const chunk = outOfViewport.slice(currentIndex, currentIndex + chunkSize);
          setVisibleMarkers((prev) => [...prev, ...chunk]);
          currentIndex += chunkSize;

          setTimeout(loadChunk, 16);
        };

        setTimeout(loadChunk, 100);
      }
    }, [map, clusteredPois]);
    const markerComponents = useMemo(() => {
      return visibleMarkers.map((poi) => {
        const isCluster = poi.id.startsWith("cluster-");
        const clusterSize = isCluster && "clusterSize" in poi ? poi.clusterSize : undefined;

        const props: MarkerComponentProps = {
          poi,
          isCluster,
          currentZoom: debouncedZoom,
        };

        if (onMarkerClick) {
          props.onMarkerClick = onMarkerClick;
        }

        if (clusterSize !== undefined) {
          props.clusterSize = clusterSize;
        }

        // POIの一意キーを生成（重複を防ぐため）
        const latStr = poi.position.lat.toFixed(8);
        const lngStr = poi.position.lng.toFixed(8);
        const timestamp = Date.now().toString(36);
        const uniqueKey = `${poi.id}-${latStr}-${lngStr}-${timestamp}-${Math.random().toString(36).substring(2, 11)}`;
        return <MarkerComponent key={uniqueKey} {...props} />;
      });
    }, [visibleMarkers, onMarkerClick, debouncedZoom]);

    return (
      <>
        {markerComponents}
        {isLoadingMore && <div className="marker-loading-indicator">🔄 マーカー読み込み中...</div>}
      </>
    );
  },
);

GoogleMarkerCluster.displayName = "GoogleMarkerCluster";
