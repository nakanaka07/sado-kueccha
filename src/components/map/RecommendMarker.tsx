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
 *
 * @description
 * - Intersection Observer によるアニメーション最適化
 * - requestAnimationFrame による滑らかなアニメーション
 * - will-change プロパティによるGPU加速
 * - アクセシビリティ完全対応
 */
const RecommendMarker: FC<RecommendMarkerProps> = memo(
  ({ poi, onClick, isHighlighted = false, showLabel = false }) => {
    const [shouldBounce, setShouldBounce] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isAnimatingRef = useRef(false);
    const markerRef = useRef<HTMLDivElement>(null);

    // Intersection Observer によるビューポート監視
    useEffect(() => {
      const markerElement = markerRef.current;
      if (!markerElement) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry) {
            setIsVisible(entry.isIntersecting);
            // ビューポートに入った時のみアニメーションを有効化
            if (entry.isIntersecting && !isAnimatingRef.current) {
              // 少し遅延してからアニメーションを開始
              setTimeout(() => {
                if (entry.isIntersecting) {
                  triggerBounceAnimation();
                }
              }, Math.random() * 500); // ランダム遅延でマーカーが一斉にアニメーションするのを防ぐ
            }
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        },
      );

      observer.observe(markerElement);

      return () => {
        observer.disconnect();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // アニメーション制御の最適化（GPU加速対応）
    const triggerBounceAnimation = useCallback(() => {
      if (isAnimatingRef.current || !isVisible) return;

      isAnimatingRef.current = true;
      setShouldBounce(true);

      // will-change プロパティを動的に設定
      if (markerRef.current) {
        markerRef.current.style.willChange = "transform, opacity";
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        timeoutRef.current = setTimeout(() => {
          setShouldBounce(false);
          isAnimatingRef.current = false;

          // アニメーション完了後に will-change を削除
          if (markerRef.current) {
            markerRef.current.style.willChange = "auto";
          }
        }, 600);
      });
    }, [isVisible]);

    // マウント時のアニメーション（Intersection Observer依存に変更）
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

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
          ref={markerRef}
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
