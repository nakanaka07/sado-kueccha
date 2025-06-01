import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cacheService } from "../services/cache";
import type { ClusterablePOI, ClusterPOI, POI } from "../types/google-maps";
import { GeoUtils, SADO_CONSTANTS } from "../utils/geo";
import { logger } from "../utils/logger";
import "./Map.css";

let clusterSequence = 0;

// Utility functions
const isInViewport = (poi: POI, bounds: google.maps.LatLngBounds | null): boolean => {
  return !bounds || GeoUtils.isInBounds(poi.position.lat, poi.position.lng, bounds);
};

const partitionPOIsByViewport = (
  pois: ClusterablePOI[],
  bounds: google.maps.LatLngBounds | null,
) => {
  if (!bounds) return { inViewport: pois, outOfViewport: [] };

  return pois.reduce(
    (acc, poi) => {
      if (isInViewport(poi, bounds)) {
        acc.inViewport.push(poi);
      } else {
        acc.outOfViewport.push(poi);
      }
      return acc;
    },
    { inViewport: [] as ClusterablePOI[], outOfViewport: [] as ClusterablePOI[] },
  );
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
}

// Helper functions for clustering
const generateCacheKey = (pois: POI[], zoomLevel: number): string => {
  const poisIdHash = Math.abs(
    pois
      .map((p) => p.id)
      .sort()
      .join("-")
      .split("")
      .reduce((hash, char) => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
        return hash;
      }, 0),
  ).toString(36);

  return `cluster-${pois.length.toString()}-${Math.round(zoomLevel * 10).toString()}-${poisIdHash}`;
};

const generateClusterId = (centerLat: number, centerLng: number, cluster: POI[]): string => {
  const sortedIds = cluster
    .map((p) => p.id)
    .sort()
    .join("-");
  const locationHash = Math.abs(
    Math.round(centerLat * 1000000) + Math.round(centerLng * 1000000),
  ).toString(36);
  const idsHash = Math.abs(
    sortedIds.split("").reduce((hash, char) => {
      hash = ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
      return hash;
    }, 0),
  ).toString(36);

  return `cluster-${locationHash}-${cluster.length.toString()}-${idsHash}-${(++clusterSequence).toString(36)}`;
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
const clusterPOIs = (pois: POI[], zoomLevel: number = 10): ClusterablePOI[] => {
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
    logger.performance(`Cache hit for zoom ${String(zoomLevel)}`, {
      component: "GoogleMarkerCluster",
      action: "clusterPOIs",
      metadata: { markers: cached.length, zoomLevel },
    });
    return cached;
  }
  // Disable clustering at high zoom levels
  if (zoomLevel >= SADO_CONSTANTS.ZOOM.DISABLE_CLUSTERING) {
    const maxMarkers =
      zoomLevel >= SADO_CONSTANTS.ZOOM.HIGH_THRESHOLD
        ? SADO_CONSTANTS.MARKER_LIMITS.HIGH_ZOOM
        : SADO_CONSTANTS.MARKER_LIMITS.NORMAL_ZOOM;
    const limitedPois = pois.length > maxMarkers ? pois.slice(0, maxMarkers) : pois;
    logger.performance(
      pois.length > maxMarkers
        ? `Limited markers to ${maxMarkers.toString()}`
        : `No clustering at zoom ${String(zoomLevel)}`,
      {
        component: "GoogleMarkerCluster",
        action: "clusterPOIs",
        metadata: {
          original: pois.length,
          limited: pois.length > maxMarkers ? maxMarkers : pois.length,
          zoomLevel,
        },
      },
    );

    cacheService.setWithLimit(cacheKey, limitedPois);
    return limitedPois;
  }

  const startTime = performance.now();
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

    clusters.push(cluster.length === 1 ? poi : createClusterPOI(cluster, poi));
  }

  const elapsedTime = performance.now() - startTime;
  logger.performance(`Clustering completed`, {
    component: "GoogleMarkerCluster",
    action: "clusterPOIs",
    duration: elapsedTime,
    metadata: { zoomLevel, clusters: clusters.length },
  });

  cacheService.setWithLimit(cacheKey, clusters);
  return clusters;
};

// Pin configuration
const getPinConfig = (isCluster: boolean, clusterSize?: number) => {
  if (!isCluster) {
    return {
      background: "#4285F4",
      borderColor: "#1A73E8",
      glyphColor: "white",
      scale: 1.0,
    };
  }

  if (!clusterSize) return null;

  const configs = [
    { min: 10, background: "#E53E3E", borderColor: "#C53030", scale: 1.5 },
    { min: 6, background: "#FF8C00", borderColor: "#E67300", scale: 1.3 },
    { min: 2, background: "#FF6B35", borderColor: "#CC5429", scale: 1.2 },
  ];

  const config = configs.find((c) => clusterSize >= c.min) || configs[configs.length - 1];

  return {
    ...config,
    glyphColor: "white",
    glyph: clusterSize.toString(),
  };
};

// Marker Component
const MarkerComponent = memo(
  ({ poi, onMarkerClick, isCluster, clusterSize }: MarkerComponentProps) => {
    const handleClick = useCallback(() => {
      if (onMarkerClick) {
        onMarkerClick(poi);
      }
    }, [poi, onMarkerClick]);

    const pinConfig = getPinConfig(isCluster || false, clusterSize);
    if (!pinConfig) return null;

    const title =
      isCluster && clusterSize
        ? `${clusterSize.toString()}件の施設が集まっています - クリックしてズーム`
        : poi.name;

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
      const startTime = performance.now();
      const result = clusterPOIs(pois, debouncedZoom);
      const clusterCount = result.filter((poi) => poi.id.startsWith("cluster-")).length;
      const individualCount = result.length - clusterCount;
      const elapsedTime = performance.now() - startTime;

      logger.debug(`Zoom processing completed`, {
        component: "GoogleMarkerCluster",
        action: "useMemo:clusteredPois",
        duration: elapsedTime,
        metadata: {
          zoom: debouncedZoom,
          clusters: clusterCount,
          individual: individualCount,
          total: result.length,
        },
      });

      return result;
    }, [pois, debouncedZoom]);

    // Viewport-based progressive rendering
    useEffect(() => {
      if (!map || clusteredPois.length === 0) {
        setVisibleMarkers(clusteredPois);
        return;
      }

      const startTime = performance.now();
      const bounds = map.getBounds();

      if (!bounds) {
        setVisibleMarkers(clusteredPois);
        return;
      }

      const { inViewport, outOfViewport } = partitionPOIsByViewport(clusteredPois, bounds);

      logger.debug(`Viewport rendering`, {
        component: "GoogleMarkerCluster",
        action: "viewport-partition",
        metadata: {
          inView: inViewport.length,
          outOfView: outOfViewport.length,
        },
      });

      setVisibleMarkers(inViewport);

      if (outOfViewport.length > 0) {
        setIsLoadingMore(true);

        const chunkSize = Math.min(50, Math.max(10, Math.floor(outOfViewport.length / 10)));
        let currentIndex = 0;

        const loadChunk = () => {
          if (currentIndex >= outOfViewport.length) {
            setIsLoadingMore(false);
            const totalTime = performance.now() - startTime;

            logger.performance(`All markers loaded`, {
              component: "GoogleMarkerCluster",
              action: "loadChunk-complete",
              duration: totalTime,
              metadata: {
                total: clusteredPois.length,
                immediate: inViewport.length,
                deferred: outOfViewport.length,
              },
            });
            return;
          }

          const chunk = outOfViewport.slice(currentIndex, currentIndex + chunkSize);
          setVisibleMarkers((prev) => [...prev, ...chunk]);
          currentIndex += chunkSize;

          logger.debug(`Loaded chunk`, {
            component: "GoogleMarkerCluster",
            action: "loadChunk-progress",
            metadata: {
              loaded: currentIndex,
              total: outOfViewport.length,
            },
          });

          setTimeout(loadChunk, 16);
        };

        setTimeout(loadChunk, 100);
      }
    }, [map, clusteredPois]);
    const markerComponents = useMemo(() => {
      return visibleMarkers.map((poi, index) => {
        const isCluster = poi.id.startsWith("cluster-");
        const clusterSize = isCluster && "clusterSize" in poi ? poi.clusterSize : undefined;
        const componentKey = `${poi.id}-${index.toString()}`;

        return (
          <MarkerComponent
            key={componentKey}
            poi={poi}
            {...(onMarkerClick && { onMarkerClick })}
            isCluster={isCluster}
            {...(clusterSize !== undefined && { clusterSize })}
          />
        );
      });
    }, [visibleMarkers, onMarkerClick]);

    return (
      <>
        {markerComponents}
        {isLoadingMore && <div className="marker-loading-indicator">🔄 マーカー読み込み中...</div>}
      </>
    );
  },
);

GoogleMarkerCluster.displayName = "GoogleMarkerCluster";
