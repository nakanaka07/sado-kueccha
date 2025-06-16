import { AdvancedMarker } from "@vis.gl/react-google-maps";
import React, { useCallback, useEffect, useState } from "react";
import type { POI } from "../types/poi";
import { ASSETS } from "../utils/assets";
import "./RecommendMarker.css";

interface RecommendMarkerProps {
  poi: POI;
  onClick?: ((poi: POI) => void) | undefined;
  isHighlighted?: boolean;
  showLabel?: boolean;
}

export const RecommendMarker: React.FC<RecommendMarkerProps> = ({
  poi,
  onClick,
  isHighlighted = false,
  showLabel = false,
}) => {
  const [shouldBounce, setShouldBounce] = useState(false);

  // マーカーがマウント時にバウンスアニメーション（最適化：requestAnimationFrameを使用）
  useEffect(() => {
    let animationId: number;

    const startAnimation = () => {
      setShouldBounce(true);
      animationId = requestAnimationFrame(() => {
        setTimeout(() => {
          setShouldBounce(false);
        }, 600);
      });
    };

    const timer = setTimeout(startAnimation, 100);

    return () => {
      clearTimeout(timer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
  const handleClick = useCallback(() => {
    // クリック時のバウンス効果（最適化：重複アニメーション防止）
    if (!shouldBounce) {
      setShouldBounce(true);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setShouldBounce(false);
        }, 600);
      });
    }

    if (onClick) {
      onClick(poi);
    }
  }, [onClick, poi, shouldBounce]);
  const markerClasses = [
    "recommend-marker",
    "recommend-marker-special",
    shouldBounce && "recommend-marker-bounce",
    isHighlighted && "recommend-marker-highlighted",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <AdvancedMarker position={poi.position} onClick={handleClick} zIndex={1000}>
      <div className={markerClasses}>
        <div className="recommend-marker-content">
          <img
            src={ASSETS.ICONS.MARKERS.RECOMMEND}
            alt="おすすめ"
            className="recommend-marker-icon"
          />
        </div>
        {(showLabel || isHighlighted) && <div className="recommend-marker-label">おすすめ</div>}
      </div>
    </AdvancedMarker>
  );
};

export default RecommendMarker;
