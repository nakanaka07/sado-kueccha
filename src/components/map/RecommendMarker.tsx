import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { FC } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { POI } from "../../types/poi";
import { ASSETS } from "../../utils/assets";
import "./RecommendMarker.css";

interface RecommendMarkerProps {
  poi: POI;
  onClick?: (poi: POI) => void;
  isHighlighted?: boolean;
  showLabel?: boolean;
}

/**
 * おすすめマーカーコンポーネント
 * パフォーマンス最適化とアクセシビリティを考慮した実装
 */
const RecommendMarker: FC<RecommendMarkerProps> = memo(
  ({ poi, onClick, isHighlighted = false, showLabel = false }) => {
    const [shouldBounce, setShouldBounce] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isAnimatingRef = useRef(false);

    // アニメーション制御の最適化
    const triggerBounceAnimation = useCallback(() => {
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      setShouldBounce(true);

      animationFrameRef.current = requestAnimationFrame(() => {
        timeoutRef.current = setTimeout(() => {
          setShouldBounce(false);
          isAnimatingRef.current = false;
        }, 600);
      });
    }, []);

    // マウント時のアニメーション（IntersectionObserver使用を検討）
    useEffect(() => {
      const mountTimer = setTimeout(() => {
        triggerBounceAnimation();
      }, 100);

      return () => {
        clearTimeout(mountTimer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [triggerBounceAnimation]);

    // クリックハンドラーの最適化
    const handleClick = useCallback(() => {
      triggerBounceAnimation();
      onClick?.(poi);
    }, [onClick, poi, triggerBounceAnimation]);

    // クラス名の動的生成（useMemoで最適化）
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
        <div
          className={markerClasses}
          role="button"
          tabIndex={0}
          aria-label={`おすすめスポット: ${poi.name || "おすすめ"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="recommend-marker-content">
            <img
              src={ASSETS.ICONS.MARKERS.RECOMMEND}
              alt=""
              role="presentation"
              className="recommend-marker-icon"
              loading="lazy"
            />
          </div>
          {Boolean(showLabel || isHighlighted) && (
            <div className="recommend-marker-label" aria-hidden="true">
              おすすめ
            </div>
          )}
        </div>
      </AdvancedMarker>
    );
  },
);

RecommendMarker.displayName = "RecommendMarker";

export default RecommendMarker;
