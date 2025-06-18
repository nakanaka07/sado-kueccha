import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SADO_ISLAND } from "../../constants";
import { cacheService } from "../../services/cache";
import type { ClusterablePOI, POI } from "../../types/poi";
import { ASSETS } from "../../utils/assets";
import { GeoUtils } from "../../utils/geo";
import "./GoogleMarkerCluster.css";
import RecommendMarker from "./RecommendMarker";

// 型定義の強化
interface MarkerStyle {
  readonly background: string;
  readonly borderColor: string;
  readonly glyphColor: string;
  readonly glyph?: string;
}

interface MarkerConfig {
  readonly keywords: readonly string[];
  readonly icon: string | null;
  readonly style: MarkerStyle;
}

interface ClusterConfig {
  readonly min: number;
  readonly background: string;
  readonly borderColor: string;
  readonly scale: number;
}

interface AnimationConfig {
  readonly duration: number;
  readonly easing: string;
}

interface ClusteringConfig {
  readonly overlapThresholdPx: number;
  readonly animation: AnimationConfig;
}

// 型安全なクラスタリング状態管理
interface ClusteringState {
  enabled: boolean;
  animatingClusters: Set<string>;
}

// 設定を型安全に管理
const ZOOM_CONFIG = {
  FULL_ICON: 16,
  COMPACT_ICON: 13,
  SMALL_ICON: 10,
  DISABLE_CLUSTERING: SADO_ISLAND.ZOOM.DISABLE_CLUSTERING,
  HIGH_THRESHOLD: SADO_ISLAND.ZOOM.PERFORMANCE_MODE_THRESHOLD,
} as const;

const MARKER_LIMITS = {
  HIGH_ZOOM: SADO_ISLAND.PERFORMANCE.MARKER_LIMITS.HIGH_ZOOM,
  NORMAL_ZOOM: SADO_ISLAND.PERFORMANCE.MARKER_LIMITS.MEDIUM_ZOOM,
  LOW_ZOOM: SADO_ISLAND.PERFORMANCE.MARKER_LIMITS.LOW_ZOOM,
} as const;

const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 100,
  RENDER_INTERVAL: 16,
  BATCH_SIZE: 50,
  MAX_VIEWPORT_MARKERS: 1000,
} as const;

// マーカー設定を型安全に統合
const MARKER_CONFIGS: Record<"toilet" | "parking" | "normal", MarkerConfig> = {
  toilet: {
    keywords: ["トイレ", "toilet", "お手洗い", "化粧室", "WC"],
    icon: ASSETS.ICONS.MARKERS.TOILETTE,
    style: {
      background: "#8B4513",
      borderColor: "#654321",
      glyphColor: "white",
      glyph: "🚻",
    },
  },
  parking: {
    keywords: ["駐車", "parking", "パーキング", "駐車場"],
    icon: ASSETS.ICONS.MARKERS.PARKING,
    style: {
      background: "#2E8B57",
      borderColor: "#1F5F3F",
      glyphColor: "white",
      glyph: "🅿️",
    },
  },
  normal: {
    keywords: [],
    icon: null,
    style: {
      background: "#4285F4",
      borderColor: "#1A73E8",
      glyphColor: "white",
    },
  },
} as const;

const CLUSTER_CONFIGS: readonly ClusterConfig[] = [
  { min: 20, background: "#C53030", borderColor: "#9B2C2C", scale: 1.8 },
  { min: 10, background: "#E53E3E", borderColor: "#C53030", scale: 1.6 },
  { min: 6, background: "#FF8C00", borderColor: "#E67300", scale: 1.4 },
  { min: 2, background: "#FF6B35", borderColor: "#CC5429", scale: 1.2 },
] as const;

// クラスタリング制御の拡張設定
const CLUSTERING_CONFIG: ClusteringConfig = {
  overlapThresholdPx: 45, // より精密な判定
  animation: {
    duration: 400,
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
} as const;

let clusterSequence = 0;

// マーカー重なり判定（画面座標ベース）
const areMarkersOverlapping = (
  pos1: google.maps.LatLng | google.maps.LatLngLiteral,
  pos2: google.maps.LatLng | google.maps.LatLngLiteral,
  map: google.maps.Map,
): boolean => {
  const projection = map.getProjection();
  if (!projection) return false;

  const point1 = projection.fromLatLngToPoint(pos1);
  const point2 = projection.fromLatLngToPoint(pos2);

  if (!point1 || !point2) return false;

  const zoom = map.getZoom() || 10;
  const scale = Math.pow(2, zoom);

  const pixel1 = {
    x: point1.x * scale,
    y: point1.y * scale,
  };
  const pixel2 = {
    x: point2.x * scale,
    y: point2.y * scale,
  };

  const distance = Math.sqrt(Math.pow(pixel1.x - pixel2.x, 2) + Math.pow(pixel1.y - pixel2.y, 2));

  return distance < CLUSTERING_CONFIG.overlapThresholdPx;
};

// 重なりチェック用の関数
const checkMarkersOverlapping = (pois: POI[], map: google.maps.Map): boolean => {
  if (pois.length < 2) return false;

  for (let i = 0; i < pois.length; i++) {
    for (let j = i + 1; j < pois.length; j++) {
      const pos1 = pois[i]?.position;
      const pos2 = pois[j]?.position;
      if (pos1 && pos2 && areMarkersOverlapping(pos1, pos2, map)) {
        return true;
      }
    }
  }
  return false;
};

// クラスターが重なりによって必要かどうかを判定
const shouldKeepCluster = (cluster: POI[], map: google.maps.Map | null): boolean => {
  if (!map || cluster.length <= 1) return false;

  // クラスター内のマーカーが実際に重なっているかチェック
  return checkMarkersOverlapping(cluster, map);
};

// クラスタリング状態管理
interface ClusteringState {
  enabled: boolean;
  animatingClusters: Set<string>; // アニメーション中のクラスター
}

// 共通のユーティリティ関数 - 簡略化版
const simpleHash = (str: string): string => {
  return btoa(str)
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8);
};

const isInViewport = (poi: ClusterablePOI, bounds: google.maps.LatLngBounds | null): boolean => {
  if (!bounds) return true;

  // ClusterablePOIは常にpositionを持つ
  const { position } = poi;
  return GeoUtils.isInBounds(position.lat, position.lng, bounds);
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

// Optimized debounce hook with cleanup
function useDebounce<T>(value: T, delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

// Performance optimized utilities
const performanceUtils = {
  hashCache: new Map<string, string>(),

  generateHashFromArray: (items: string[]): string => {
    const sortedStr = items.sort().join(",");
    if (performanceUtils.hashCache.has(sortedStr)) {
      const cached = performanceUtils.hashCache.get(sortedStr);
      return cached ?? simpleHash(sortedStr);
    }
    const hash = simpleHash(sortedStr);
    performanceUtils.hashCache.set(sortedStr, hash);
    return hash;
  },

  clearCache: (): void => {
    performanceUtils.hashCache.clear();
  },
};

// スマートオフセット関数（画面座標ベース）
const applySmartOffsets = (pois: POI[], map: google.maps.Map): POI[] => {
  if (pois.length < 2) return pois;

  const result = [...pois];
  const processed = new Set<number>();

  for (let i = 0; i < result.length; i++) {
    if (processed.has(i)) continue;

    const currentPoi = result[i];
    if (!currentPoi) continue;

    const overlappingIndices = [i];

    // 重なっているマーカーを検索
    for (let j = i + 1; j < result.length; j++) {
      if (processed.has(j)) continue;

      const otherPoi = result[j];
      if (!otherPoi) continue;

      if (areMarkersOverlapping(currentPoi.position, otherPoi.position, map)) {
        overlappingIndices.push(j);
      }
    }

    // 重なっているマーカーが複数ある場合のみオフセット適用
    if (overlappingIndices.length > 1) {
      overlappingIndices.forEach((index, arrayIndex) => {
        if (arrayIndex === 0) {
          processed.add(index);
          return; // 最初のマーカーは元の位置のまま
        }

        const targetPoi = result[index];
        if (!targetPoi) return;

        const angle = (2 * Math.PI * arrayIndex) / overlappingIndices.length;
        const offsetDistance = 0.0002; // 度単位
        const offsetLat = offsetDistance * Math.cos(angle);
        const offsetLng = offsetDistance * Math.sin(angle);

        result[index] = {
          ...targetPoi,
          position: {
            lat: targetPoi.position.lat + offsetLat,
            lng: targetPoi.position.lng + offsetLng,
          },
        };
        processed.add(index);
      });
    } else {
      processed.add(i);
    }
  }

  return result;
};

// Types
interface GoogleMarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: ClusterablePOI) => void;
  currentZoom?: number;
  // クラスタリング制御をpropで受け取る
  clusteringEnabled?: boolean;
}

interface MarkerComponentProps {
  poi: ClusterablePOI;
  onMarkerClick?: (poi: ClusterablePOI) => void;
  isCluster?: boolean;
  clusterSize?: number;
  currentZoom?: number;
  isAnimating?: boolean;
}

// Helper functions for clustering
const generateCacheKey = (pois: POI[], zoomLevel: number, clusteringEnabled: boolean): string => {
  const poisIdHash = performanceUtils.generateHashFromArray(pois.map((p) => p.id));
  const clusteringFlag = clusteringEnabled ? "clustered" : "individual";
  return `cluster-${pois.length.toString()}-${Math.round(zoomLevel * 10).toString()}-${poisIdHash}-${clusteringFlag}`;
};

const generateClusterId = (centerLat: number, centerLng: number, cluster: POI[]): string => {
  // 同一POI対策：位置ベースの一意ID生成（簡素化）
  const locationHash = Math.abs(
    Math.round(centerLat * 1000000) + Math.round(centerLng * 1000000),
  ).toString(36);
  const clusterSize = cluster.length.toString(36);
  const sequence = (++clusterSequence).toString(36);

  return `cluster-${locationHash}-${clusterSize}-${sequence}`;
};

const createClusterPOI = (cluster: POI[], basePoi: POI): ClusterablePOI => {
  const centerLat = cluster.reduce((sum, p) => sum + p.position.lat, 0) / cluster.length;
  const centerLng = cluster.reduce((sum, p) => sum + p.position.lng, 0) / cluster.length;
  const uniqueId = generateClusterId(centerLat, centerLng, cluster);

  return {
    ...basePoi,
    id: uniqueId as POI["id"], // 型安全なキャスト
    name: `${cluster.length.toString()}件の施設`,
    position: { lat: centerLat, lng: centerLng },
    clusterSize: cluster.length,
    originalPois: cluster,
    details: {
      description: cluster.map((p) => p.name).join(", "),
      ...basePoi.details,
    },
  };
};

// 型ガードの簡略化
const isClusterablePOIArray = (value: unknown): value is ClusterablePOI[] => {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const first = value[0];
  return first != null && typeof first === "object" && "id" in first;
};

// 改良されたクラスタリング関数 - 重なり判定を追加
const clusterPOIs = (
  pois: POI[],
  zoomLevel = 10,
  mapBounds: google.maps.LatLngBounds | null = null,
  map: google.maps.Map | null = null,
  clusteringState: ClusteringState = {
    enabled: true,
    animatingClusters: new Set(),
  },
): ClusterablePOI[] => {
  if (pois.length === 0) return [];

  // 同一POI除去（簡略化）
  const uniquePOIs = pois.filter((poi, index, array) => {
    return array.findIndex((p) => p.id === poi.id) === index;
  });

  // おすすめマーカーを優先するためのソート
  const sortedPOIs = uniquePOIs.sort((a, b) => {
    if (a.sourceSheet === "recommended" && b.sourceSheet !== "recommended") return -1;
    if (a.sourceSheet !== "recommended" && b.sourceSheet === "recommended") return 1;
    return 0;
  });

  // おすすめマーカーとその他のマーカーを分離
  const recommendedPois = sortedPOIs.filter((poi) => poi.sourceSheet === "recommended");
  const otherPois = sortedPOIs.filter((poi) => poi.sourceSheet !== "recommended");

  const cacheKey = generateCacheKey(sortedPOIs, zoomLevel, clusteringState.enabled);
  const cached = cacheService.getTyped(cacheKey, isClusterablePOIArray);

  if (cached) {
    return cached;
  }

  // クラスタリング無効時または高ズーム時
  if (!clusteringState.enabled || zoomLevel >= ZOOM_CONFIG.DISABLE_CLUSTERING) {
    const maxMarkers =
      zoomLevel >= ZOOM_CONFIG.HIGH_THRESHOLD ? MARKER_LIMITS.HIGH_ZOOM : MARKER_LIMITS.NORMAL_ZOOM;

    let limitedPois: POI[];

    // おすすめマーカーは常に表示し、残りの枠でその他のマーカーを選択
    const remainingSlots = Math.max(0, maxMarkers - recommendedPois.length);

    if (otherPois.length > remainingSlots) {
      // ビューポート内のマーカーを優先的に選択（おすすめマーカーも考慮）
      const inViewportOtherPois = mapBounds
        ? otherPois.filter((poi) => isInViewport(poi, mapBounds))
        : [];
      const outOfViewportOtherPois = mapBounds
        ? otherPois.filter((poi) => !isInViewport(poi, mapBounds))
        : otherPois;

      if (mapBounds && inViewportOtherPois.length > 0) {
        // ビューポート内のマーカーを最大限含める
        const viewportCount = Math.min(inViewportOtherPois.length, remainingSlots);
        const remainingAfterViewport = Math.max(0, remainingSlots - viewportCount);
        const selectedViewportPois = inViewportOtherPois.slice(0, viewportCount);
        const selectedOutOfViewportPois = outOfViewportOtherPois.slice(0, remainingAfterViewport);

        limitedPois = [...recommendedPois, ...selectedViewportPois, ...selectedOutOfViewportPois];
      } else {
        // マップ境界が利用できない場合は従来通り（おすすめ優先）
        limitedPois = [...recommendedPois, ...otherPois.slice(0, remainingSlots)];
      }
    } else {
      limitedPois = [...recommendedPois, ...otherPois];
    }

    // 重なり判定による自動オフセット
    const poisWithOffsets = map
      ? applySmartOffsets(limitedPois, map)
      : GeoUtils.applyOffsetsForCloseMarkers(limitedPois);

    // POIをClusterablePOIに変換
    const clusterablePois: ClusterablePOI[] = poisWithOffsets.map((poi: POI) => ({ ...poi }));

    cacheService.set(cacheKey, clusterablePois);
    return clusterablePois;
  }

  // クラスタリング処理（おすすめマーカー以外のみ）
  const clusterDistance = GeoUtils.getClusteringDistance(zoomLevel);
  const clusters: ClusterablePOI[] = [];
  const processed = new Set<string>();

  // デバッグ情報をコンソールに出力
  // 効率的なクラスタリング（空間分割アルゴリズム） - その他のマーカーのみ
  const gridSize = clusterDistance;
  const grid = new Map<string, POI[]>();

  // その他のPOIのみをグリッドに分割
  for (const poi of otherPois) {
    const gridX = Math.floor(poi.position.lat / gridSize);
    const gridY = Math.floor(poi.position.lng / gridSize);
    const gridKey = `${gridX.toString()}-${gridY.toString()}`;

    if (!grid.has(gridKey)) {
      grid.set(gridKey, []);
    }
    const gridPOIs = grid.get(gridKey);
    if (gridPOIs) {
      gridPOIs.push(poi);
    }
  }

  // グリッドごとにクラスタリング（重なり判定も考慮）
  for (const [, gridPOIs] of grid) {
    for (const poi of gridPOIs) {
      if (processed.has(poi.id)) continue;

      const cluster = [poi];
      processed.add(poi.id);

      // 同じグリッド内の近隣POIのみを検索
      for (const otherPoi of gridPOIs) {
        if (processed.has(otherPoi.id)) continue;

        const distanceSquared = GeoUtils.getDistanceSquared(
          poi.position.lat,
          poi.position.lng,
          otherPoi.position.lat,
          otherPoi.position.lng,
        );

        // クラスタリングするかどうかを判定
        const shouldCluster = distanceSquared < clusterDistance * clusterDistance;

        // 重なり判定も追加
        const wouldOverlap = map
          ? areMarkersOverlapping(poi.position, otherPoi.position, map)
          : false;

        if (shouldCluster || wouldOverlap) {
          cluster.push(otherPoi);
          processed.add(otherPoi.id);
        }
      }

      // 重なり判定による自動解除: クラスター内のマーカーが重なっていない場合は個別表示
      // ただし、距離ベースでクラスタリングされた場合は重なり判定を緩くする
      if (cluster.length > 1) {
        // 最初に距離ベースでクラスタリングされたかチェック
        const hasDistanceBasedClustering = cluster.some((poi, index) => {
          if (index === 0) return false;
          const firstPoi = cluster[0];
          if (!firstPoi) return false;
          const distanceSquared = GeoUtils.getDistanceSquared(
            poi.position.lat,
            poi.position.lng,
            firstPoi.position.lat,
            firstPoi.position.lng,
          );
          return distanceSquared < clusterDistance * clusterDistance;
        });

        // 距離ベースでクラスタリングされた場合は、重なり判定は行わずクラスターを維持
        if (hasDistanceBasedClustering || (map && shouldKeepCluster(cluster, map))) {
          const clusterPoi = createClusterPOI(cluster, poi);
          clusters.push(clusterPoi);
        } else {
          // 重なりがない場合は個別マーカーとして追加
          cluster.forEach((individualPoi) => {
            clusters.push({ ...individualPoi });
          });
        }
      } else {
        // シングルマーカーの場合
        clusters.push({ ...poi });
      }
    }
  }

  // 非常に近い位置の個別マーカーにオフセットを適用（その他のマーカーのみ）
  const clustersWithOffsets = map
    ? applySmartOffsets(clusters, map)
    : GeoUtils.applyOffsetsForCloseMarkers(clusters);

  // おすすめマーカーを個別に追加（クラスタリング対象外）
  const recommendedAsClusterable: ClusterablePOI[] = recommendedPois.map((poi: POI) => ({
    ...poi,
  }));
  const finalResult = [...recommendedAsClusterable, ...clustersWithOffsets];

  cacheService.set(cacheKey, finalResult);
  return finalResult;
};

// マーカータイプの判定 - 統合された設定を使用
const getMarkerType = (poi: POI): "toilet" | "parking" | "normal" => {
  if (!poi.name) return "normal";

  const name = poi.name.toLowerCase();

  if (MARKER_CONFIGS.toilet.keywords.some((keyword) => name.includes(keyword))) {
    return "toilet";
  }

  if (MARKER_CONFIGS.parking.keywords.some((keyword) => name.includes(keyword))) {
    return "parking";
  }

  return "normal";
};

// カスタムマーカーアイコンの設定（統合）
const getMarkerConfig = (markerType: "toilet" | "parking" | "normal") => {
  return MARKER_CONFIGS[markerType];
};

// Pin configuration with 3段階ズーム対応 - 簡略化版
const getPinConfig = (
  isCluster: boolean,
  clusterSize?: number,
  poi?: POI,
  currentZoom?: number,
) => {
  // クラスターの場合
  if (isCluster && clusterSize) {
    const config =
      CLUSTER_CONFIGS.find((c) => clusterSize >= c.min) ??
      CLUSTER_CONFIGS[CLUSTER_CONFIGS.length - 1];
    if (!config) return null;

    // minプロパティを除外してPinコンポーネント用の設定のみを返す

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
  const markerConfig = getMarkerConfig(markerType);

  // 超高ズーム：フルサイズカスタムアイコン
  if (currentZoom && currentZoom >= ZOOM_CONFIG.FULL_ICON) {
    if (markerConfig.icon) {
      return {
        background: "transparent",
        borderColor: "transparent",
        scale: 1.0,
        useCustomIcon: true,
        customIconUrl: markerConfig.icon,
        iconSize: "full-size",
      };
    }
  }

  // 中ズーム：小さなカスタムアイコン
  if (currentZoom && currentZoom >= ZOOM_CONFIG.COMPACT_ICON) {
    if (markerConfig.icon) {
      return {
        background: "transparent",
        borderColor: "transparent",
        scale: 1.0,
        useCustomIcon: true,
        customIconUrl: markerConfig.icon,
        iconSize: "compact",
      };
    }
  }

  // 低ズーム：カラー＋絵文字のPinマーカー
  return {
    ...markerConfig.style,
    scale: 1.0,
  };
};

// Marker Component
const MarkerComponent = memo(
  ({
    poi,
    onMarkerClick,
    isCluster,
    clusterSize,
    currentZoom,
    isAnimating,
  }: MarkerComponentProps) => {
    const handleClick = useCallback(() => {
      if (onMarkerClick) {
        onMarkerClick(poi);
      }
    }, [poi, onMarkerClick]);

    // おすすめマーカーの場合は専用コンポーネントを使用
    if (!isCluster && poi.sourceSheet === "recommended") {
      return (
        <RecommendMarker
          poi={poi}
          {...(onMarkerClick && { onClick: onMarkerClick })}
          showLabel={currentZoom !== undefined && currentZoom >= ZOOM_CONFIG.COMPACT_ICON}
        />
      );
    }

    const pinConfig = getPinConfig(isCluster || false, clusterSize, poi, currentZoom);
    if (!pinConfig) return null;

    const title =
      isCluster && clusterSize
        ? `${clusterSize.toString()}件の施設が集まっています - クリックしてズーム\n含まれる施設: ${poi.details?.description ?? "データなし"}`
        : poi.name;

    // アニメーションクラス - クラスターズーム時は特別なアニメーション
    const animationClass = isAnimating ? (isCluster ? "cluster-zooming" : "marker-expanding") : "";

    // カスタムアイコンを使用する場合
    if ("useCustomIcon" in pinConfig && pinConfig.useCustomIcon && "customIconUrl" in pinConfig) {
      const iconSizeClass =
        "iconSize" in pinConfig && pinConfig.iconSize === "compact"
          ? "custom-marker-icon--compact"
          : "custom-marker-icon--full-size";

      return (
        <AdvancedMarker position={poi.position} onClick={handleClick} title={title}>
          <img
            src={pinConfig.customIconUrl}
            alt={`${poi.name}のマーカー`}
            title={title}
            className={`custom-marker-icon ${iconSizeClass} ${animationClass}`}
            aria-label={`${poi.name} - クリックして詳細を表示`}
          />
        </AdvancedMarker>
      );
    }

    // 通常のPinマーカー - クラスターの場合は特別なスタイリング
    const pinElement = <Pin {...pinConfig} />;

    return (
      <AdvancedMarker position={poi.position} onClick={handleClick} title={title}>
        {animationClass ? (
          <div className={animationClass} role="presentation">
            {pinElement}
          </div>
        ) : (
          pinElement
        )}
      </AdvancedMarker>
    );
  },
);

MarkerComponent.displayName = "MarkerComponent";

// Main Component
export const GoogleMarkerCluster = memo(
  ({
    pois,
    onMarkerClick,
    currentZoom = 10,
    clusteringEnabled = true,
  }: GoogleMarkerClusterProps) => {
    const map = useMap();
    const [visibleMarkers, setVisibleMarkers] = useState<ClusterablePOI[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // クラスタリング状態管理（propから制御）
    const [clusteringState, setClusteringState] = useState<ClusteringState>({
      enabled: clusteringEnabled,
      animatingClusters: new Set(),
    });

    const debouncedZoom = useDebounce(currentZoom);

    // propの変更に応じてクラスタリング状態を更新
    useEffect(() => {
      setClusteringState((prev) => ({
        ...prev,
        enabled: clusteringEnabled,
      }));

      // クラスタリング状態が変更されたときはキャッシュをクリア
      cacheService.clear();
    }, [clusteringEnabled]);

    // クラスターズーム処理（緩やかなアニメーション）
    const handleClusterZoom = useCallback(
      (clusterPoi: ClusterablePOI) => {
        if (!map || !clusterPoi.originalPois || clusterPoi.originalPois.length <= 1) return;

        // アニメーション状態を設定
        setClusteringState((prev) => ({
          ...prev,
          animatingClusters: new Set([...prev.animatingClusters, clusterPoi.id]),
        }));

        // 現在のズームレベルを取得
        const currentZoom = map.getZoom() || 10;

        // 段階的なズーム増加（一気に変わらないように）
        let targetZoom = currentZoom + 1;

        // POI数に応じた最大ズームレベルの制限
        if (clusterPoi.originalPois.length === 2) {
          targetZoom = Math.min(targetZoom, 15); // 2個の場合は控えめに
        } else if (clusterPoi.originalPois.length <= 5) {
          targetZoom = Math.min(targetZoom, 14); // 5個以下の場合はさらに控えめに
        } else {
          targetZoom = Math.min(targetZoom, 13); // それ以上の場合はもっと控えめに
        }

        // ステップ1: クラスターを画面中央に移動（ゆっくり）
        map.panTo(clusterPoi.position);

        // ステップ2: 少し遅延してから緩やかにズーム
        setTimeout(() => {
          map.setZoom(targetZoom);

          // ステップ3: さらに遅延してからfitBounds（控えめなパディング）
          setTimeout(() => {
            const bounds = new google.maps.LatLngBounds();
            clusterPoi.originalPois?.forEach((originalPoi: POI) => {
              bounds.extend(originalPoi.position);
            });

            map.fitBounds(bounds, {
              top: 120,
              right: 120,
              bottom: 120,
              left: 120,
            });

            // アニメーション状態をクリア
            setTimeout(() => {
              setClusteringState((prev) => ({
                ...prev,
                animatingClusters: new Set(
                  [...prev.animatingClusters].filter((id) => id !== clusterPoi.id),
                ),
              }));
            }, 300);
          }, 600);
        }, 400);
      },
      [map],
    );

    const clusteredPois = useMemo(() => {
      // ビューポート内のPOIを事前にフィルタリングして効率化
      const bounds = map?.getBounds() ?? null;
      let visiblePois = pois;

      if (bounds && pois.length > 1000) {
        // 大量のマーカーがある場合のみビューポートフィルタリングを適用
        visiblePois = pois.filter((poi) =>
          GeoUtils.isInBounds(poi.position.lat, poi.position.lng, bounds),
        );

        // ビューポート外の重要なマーカー（おすすめ）も含める
        const importantOutsidePois = pois
          .filter(
            (poi) =>
              poi.sourceSheet === "recommended" &&
              !GeoUtils.isInBounds(poi.position.lat, poi.position.lng, bounds),
          )
          .slice(0, 20); // 最大20個まで

        visiblePois = [...visiblePois, ...importantOutsidePois];
      }

      const result = clusterPOIs(visiblePois, debouncedZoom, bounds, map, clusteringState);
      return result;
    }, [pois, debouncedZoom, map, clusteringState]);

    // マーカークリックハンドラー
    const handleMarkerClick = useCallback(
      (poi: ClusterablePOI) => {
        if (onMarkerClick) {
          onMarkerClick(poi);
        }
      },
      [onMarkerClick],
    );

    // Viewport-based rendering with new features
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

      // 最初にビューポート内のマーカーを表示
      setVisibleMarkers(inViewport);

      // ビューポート外のマーカーを段階的に追加（簡略化）
      if (outOfViewport.length > 0) {
        setIsLoadingMore(true);

        const timeoutId = setTimeout(() => {
          setVisibleMarkers(clusteredPois);
          setIsLoadingMore(false);
        }, PERFORMANCE_CONFIG.RENDER_INTERVAL);

        return () => {
          clearTimeout(timeoutId);
          setIsLoadingMore(false);
        };
      }

      return undefined;
    }, [map, clusteredPois]);

    const markerComponents = useMemo(() => {
      return visibleMarkers.map((poi) => {
        const isCluster = poi.clusterSize !== undefined;
        const { clusterSize } = poi;
        const isAnimating = clusteringState.animatingClusters.has(poi.id);

        const props: MarkerComponentProps = {
          poi,
          isCluster,
          currentZoom: debouncedZoom,
          onMarkerClick: isCluster ? handleClusterZoom : handleMarkerClick,
          isAnimating,
        };

        if (clusterSize !== undefined) {
          props.clusterSize = clusterSize;
        }

        // 最適化されたkey生成（ハッシュ化不要）
        const uniqueKey = `${poi.id}-${isCluster ? clusterSize?.toString() || "cluster" : "single"}`;

        return <MarkerComponent key={uniqueKey} {...props} />;
      });
    }, [
      visibleMarkers,
      handleMarkerClick,
      handleClusterZoom,
      debouncedZoom,
      clusteringState.animatingClusters,
    ]);

    // 手動クラスタリング制御のエクスポート（削除）

    return (
      <>
        {markerComponents}
        {isLoadingMore ? (
          <div className="marker-loading-indicator">🔄 マーカー読み込み中...</div>
        ) : null}
      </>
    );
  },
);

GoogleMarkerCluster.displayName = "GoogleMarkerCluster";

// エクスポート用の型定義
export type { ClusteringState, GoogleMarkerClusterProps, MarkerComponentProps };

// パフォーマンスユーティリティのエクスポート
export const GoogleMarkerClusterUtils = {
  performanceUtils,
  ZOOM_CONFIG,
  MARKER_LIMITS,
  PERFORMANCE_CONFIG,
  clearCache: () => {
    performanceUtils.clearCache();
    cacheService.clear();
  },
} as const;

// デフォルトエクスポート
export default GoogleMarkerCluster;
