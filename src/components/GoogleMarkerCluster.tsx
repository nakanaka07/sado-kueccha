import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { POI } from "../types/google-maps";

// クラスタリング結果のキャッシュ
const clusterCache = new Map<string, (POI & { clusterSize?: number; originalPois?: POI[] })[]>();

// デバウンス機能付きのカスタムフック
function useDebounce<T>(value: T, delay: number): T {
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

  return debouncedValue;
}

interface GoogleMarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
  currentZoom?: number;
}

interface MarkerComponentProps {
  poi: POI;
  onMarkerClick?: ((poi: POI) => void) | undefined;
  isCluster?: boolean | undefined;
  clusterSize?: number | undefined;
}

// 効率的なクラスタリング関数（距離ベース・最適化版）
const clusterPOIs = (
  pois: POI[],
  zoomLevel: number = 10,
): (POI & { clusterSize?: number; originalPois?: POI[] })[] => {
  if (pois.length === 0) return [];
  // キャッシュキーを生成
  const cacheKey = `${pois.length.toString()}-${Math.round(zoomLevel * 10).toString()}`;

  // キャッシュから結果を取得
  const cached = clusterCache.get(cacheKey);
  if (cached) {
    console.log(
      `⚡ Cache hit for zoom ${zoomLevel.toString()}, returning ${cached.length.toString()} markers`,
    );
    return cached;
  }

  // ズームレベルに応じてクラスタリング距離を調整
  // 高いズームレベル（14以上）では完全にクラスタリングを無効化（最適化）
  if (zoomLevel >= 14) {
    console.log(
      `⚡ Fast path: No clustering at zoom ${zoomLevel.toString()}, returning ${pois.length.toString()} individual markers`,
    );
    clusterCache.set(cacheKey, pois);
    return pois; // クラスタリングを行わず、全て個別マーカーとして返す
  }

  const startTime = performance.now();

  // より効率的な距離計算（ズームレベルに基づいた動的調整）
  const clusterDistance = Math.max(0.002, 0.06 / Math.pow(2, zoomLevel - 8));

  const clusters: (POI & { clusterSize?: number; originalPois?: POI[] })[] = [];
  const processed = new Set<string>();

  // パフォーマンス最適化: POIを座標でソートして近い物同士を優先処理
  const sortedPois = [...pois].sort((a, b) => {
    const latDiff = a.position.lat - b.position.lat;
    return latDiff !== 0 ? latDiff : a.position.lng - b.position.lng;
  });

  for (const poi of sortedPois) {
    if (processed.has(poi.id)) continue;

    const cluster = [poi];
    processed.add(poi.id);

    // 最適化: 事前にソートされているため、距離が大きすぎる場合は早期終了
    for (const otherPoi of sortedPois) {
      if (processed.has(otherPoi.id)) continue;

      // 最適化: より効率的な距離計算（平方根を避ける）
      const latDiff = poi.position.lat - otherPoi.position.lat;
      const lngDiff = poi.position.lng - otherPoi.position.lng;
      const distanceSquared = latDiff * latDiff + lngDiff * lngDiff;
      const clusterDistanceSquared = clusterDistance * clusterDistance;

      if (distanceSquared < clusterDistanceSquared) {
        cluster.push(otherPoi);
        processed.add(otherPoi.id);
      }
    }

    // クラスターの代表POIを作成（最適化）
    if (cluster.length === 1) {
      clusters.push(poi);
    } else {
      // 複数のPOIをまとめた場合は中心位置を計算
      const centerLat = cluster.reduce((sum, p) => sum + p.position.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, p) => sum + p.position.lng, 0) / cluster.length;
      clusters.push({
        ...poi,
        id: `cluster-${poi.id}-${cluster.length.toString()}`,
        name: `${cluster.length.toString()}件の施設`,
        position: { lat: centerLat, lng: centerLng },
        description: cluster.map((p) => p.name).join(", "),
        clusterSize: cluster.length,
        originalPois: cluster,
      });
    }
  }
  const elapsedTime = performance.now() - startTime;
  console.log(
    `⚡ Clustering completed in ${elapsedTime.toString()}ms (zoom: ${zoomLevel.toString()})`,
  );
  // 結果をキャッシュに保存（最大10エントリまで）
  if (clusterCache.size >= 10) {
    const firstKey = clusterCache.keys().next().value;
    if (firstKey) {
      clusterCache.delete(firstKey);
    }
  }
  clusterCache.set(cacheKey, clusters);

  return clusters;
};

// Markerコンポーネント（メモ化して不要な再レンダリングを防止）
const MarkerComponent = memo(
  ({ poi, onMarkerClick, isCluster, clusterSize }: MarkerComponentProps) => {
    const handleClick = useCallback(() => {
      if (onMarkerClick) {
        onMarkerClick(poi);
      }
    }, [poi, onMarkerClick]);

    // クラスターかどうかによってピンのスタイルを変更
    const pinElement = useMemo(() => {
      if (isCluster && clusterSize) {
        // クラスターサイズに応じて色とサイズを決定
        let background = "#FF6B35"; // オレンジ（2-5件）
        let borderColor = "#CC5429";
        let scale = 1.2;

        if (clusterSize >= 10) {
          background = "#E53E3E"; // 赤（10件以上）
          borderColor = "#C53030";
          scale = 1.5;
        } else if (clusterSize >= 6) {
          background = "#FF8C00"; // ダークオレンジ（6-9件）
          borderColor = "#E67300";
          scale = 1.3;
        }

        return (
          <Pin
            background={background}
            borderColor={borderColor}
            glyphColor="white"
            glyph={clusterSize.toString()}
            scale={scale}
          />
        );
      } else {
        // 単独マーカー用のピン
        return (
          <Pin
            background="#4285F4" // Google Mapsのデフォルト青色
            borderColor="#1A73E8"
            glyphColor="white"
            scale={1.0}
          />
        );
      }
    }, [isCluster, clusterSize]);

    return (
      <AdvancedMarker
        position={poi.position}
        onClick={handleClick}
        title={
          isCluster && clusterSize
            ? `${clusterSize.toString()}件の施設が集まっています - クリックしてズーム`
            : poi.name
        }
      >
        {pinElement}
      </AdvancedMarker>
    );
  },
);

MarkerComponent.displayName = "MarkerComponent";

export const GoogleMarkerCluster = memo(
  ({ pois, onMarkerClick, currentZoom = 10 }: GoogleMarkerClusterProps) => {
    // ズーム変更をデバウンス（150msの遅延）して過度な再計算を防ぐ
    const debouncedZoom = useDebounce(currentZoom, 150);

    // クラスタリングされたPOIを計算（デバウンスされたズームレベルを使用）
    const clusteredPois = useMemo(() => {
      const startTime = performance.now();
      const result = clusterPOIs(pois, debouncedZoom);
      const clusterCount = result.filter((poi) => poi.id.startsWith("cluster-")).length;
      const individualCount = result.length - clusterCount;
      const elapsedTime = performance.now() - startTime;

      console.log(
        `🔍 Zoom ${debouncedZoom.toString()}: ${clusterCount.toString()} clusters, ${individualCount.toString()} individual markers (total: ${elapsedTime.toString()}ms)`,
      );
      return result;
    }, [pois, debouncedZoom]);

    // マーカーコンポーネントを事前にメモ化してレンダリング最適化
    const markerComponents = useMemo(() => {
      return clusteredPois.map((poi) => {
        const isCluster = poi.id.startsWith("cluster-");
        const clusterSize = isCluster && "clusterSize" in poi ? poi.clusterSize : undefined;

        return (
          <MarkerComponent
            key={poi.id}
            poi={poi}
            onMarkerClick={onMarkerClick}
            isCluster={isCluster}
            clusterSize={clusterSize}
          />
        );
      });
    }, [clusteredPois, onMarkerClick]);

    return <>{markerComponents}</>;
  },
);

GoogleMarkerCluster.displayName = "GoogleMarkerCluster";
