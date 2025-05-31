import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { memo, useCallback, useMemo } from "react";
import type { POI } from "../types/google-maps";

interface MarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
}

interface MarkerComponentProps {
  poi: POI;
  onMarkerClick?: ((poi: POI) => void) | undefined;
}

// 簡単なクラスタリング関数（距離ベース）
const clusterPOIs = (pois: POI[], zoomLevel: number = 10): POI[] => {
  if (pois.length === 0) return [];

  // ズームレベルに応じてクラスタリング距離を調整
  const clusterDistance = Math.max(0.01, 0.1 / Math.pow(2, zoomLevel - 8));

  const clusters: POI[] = [];
  const processed = new Set<string>();

  for (const poi of pois) {
    if (processed.has(poi.id)) continue;

    const cluster = [poi];
    processed.add(poi.id);

    // 近くのPOIを探す
    for (const otherPoi of pois) {
      if (processed.has(otherPoi.id)) continue;

      const distance = Math.sqrt(
        Math.pow(poi.position.lat - otherPoi.position.lat, 2) +
          Math.pow(poi.position.lng - otherPoi.position.lng, 2),
      );

      if (distance < clusterDistance) {
        cluster.push(otherPoi);
        processed.add(otherPoi.id);
      }
    }

    // クラスターの代表POIを作成
    if (cluster.length === 1) {
      clusters.push(poi);
    } else {
      // 複数のPOIをまとめた場合は中心位置を計算
      const centerLat = cluster.reduce((sum, p) => sum + p.position.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, p) => sum + p.position.lng, 0) / cluster.length;

      clusters.push({
        ...poi,
        id: `cluster-${poi.id}`,
        name: `${cluster.length.toString()}件の施設`,
        position: { lat: centerLat, lng: centerLng },
        description: cluster.map((p) => p.name).join(", "),
      });
    }
  }

  return clusters;
};

// Markerコンポーネントをメモ化して不要な再レンダリングを防止
const MarkerComponent = memo(({ poi, onMarkerClick }: MarkerComponentProps) => {
  const handleClick = useCallback(() => {
    if (onMarkerClick) {
      onMarkerClick(poi);
    }
  }, [poi, onMarkerClick]);

  return (
    <AdvancedMarker
      position={poi.position}
      onClick={handleClick}
      title={poi.name} // アクセシビリティ向上
    />
  );
});

MarkerComponent.displayName = "MarkerComponent";

export const MarkerCluster = memo(({ pois, onMarkerClick }: MarkerClusterProps) => {
  // クラスタリングされたPOIを計算
  const clusteredPois = useMemo(() => {
    return clusterPOIs(pois);
  }, [pois]);

  return (
    <>
      {clusteredPois.map((poi) => (
        <MarkerComponent key={poi.id} poi={poi} onMarkerClick={onMarkerClick} />
      ))}
    </>
  );
});

MarkerCluster.displayName = "MarkerCluster";
