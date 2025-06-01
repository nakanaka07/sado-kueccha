import { lazy, Suspense } from "react";

// MapComponentを動的インポートで遅延読み込み
const MapComponent = lazy(() =>
  import("./Map").then((module) => ({ default: module.MapComponent })),
);

interface LazyMapProps {
  className?: string;
  onMapLoaded?: () => void;
}

export function LazyMap(props: LazyMapProps) {
  return (
    <Suspense
      fallback={
        <div className={props.className}>
          <div className="map-loading">地図を読み込み中...</div>
        </div>
      }
    >
      <MapComponent {...props} />
    </Suspense>
  );
}
