import { AdvancedMarker as GoogleAdvancedMarker } from "@vis.gl/react-google-maps";

interface AdvancedMarkerProps {
  position: google.maps.LatLngLiteral;
  onClick?: () => void;
  title?: string;
}

export const AdvancedMarker = ({ position, onClick, title }: AdvancedMarkerProps) => {
  return (
    <GoogleAdvancedMarker
      position={position}
      {...(onClick && { onClick })}
      {...(title && { title })}
    />
  );
};
