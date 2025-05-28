import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { POI } from "../types/google-maps";

interface MarkerClusterProps {
  pois: POI[];
  onMarkerClick?: (poi: POI) => void;
}

export const MarkerCluster = ({ pois, onMarkerClick }: MarkerClusterProps) => {
  return (
    <>
      {pois.map((poi) => (
        <AdvancedMarker key={poi.id} position={poi.position} onClick={() => onMarkerClick?.(poi)} />
      ))}
    </>
  );
};
