import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { ASSETS } from '../../utils/assets';

/**
 * ローディング画面のプロパティ
 * アクセシビリティとパフォーマンスを重視した設計
 */
interface LoadingScreenProps {
  /** 画面タイトル（スクリーンリーダー対応） */
  title?: string;
  /** メインメッセージ */
  message?: string;
  /** 進捗詳細情報 */
  progress?: string;
  /** ローディング完了率（0-100） */
  progressPercentage?: number;
  /** カスタムアリアラベル */
  ariaLabel?: string;
  /** テスト用ID */
  testId?: string;
}

/**
 * プログレッシブな読み込み状態を管理するカスタムフック
 */
const useProgressiveLoading = (progressPercentage?: number) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (progressPercentage === undefined) return;

    // スムーズなプログレスアニメーション
    const timer = setTimeout(() => {
      setDisplayProgress(progressPercentage);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [progressPercentage]);

  return displayProgress;
};

/**
 * アクセシブルで高パフォーマンスなローディング画面コンポーネント
 *
 * 特徴:
 * - WCAG 2.1 AA準拠のアクセシビリティ
 * - プログレッシブローディング対応
 * - メモ化によるパフォーマンス最適化
 * - セマンティックHTML使用
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = memo(
  ({
    title = '佐渡で食えっちゃ',
    message = '佐渡島のおすすめ飲食店を準備中...',
    progress = 'アセットを読み込み中です',
    progressPercentage,
    ariaLabel = 'アプリケーション読み込み中',
    testId = 'loading-screen',
  }) => {
    const displayProgress = useProgressiveLoading(progressPercentage);

    return (
      <div
        className="loading"
        role="status"
        aria-label={ariaLabel}
        aria-live="polite"
        data-testid={testId}
      >
        <div className="loading-content">
          <img
            src={ASSETS.TITLE.ROW1}
            alt={`${title}のロゴ`}
            className="loading-title-image"
            loading="eager"
            decoding="sync"
          />

          <div
            className="loading-spinner"
            role="progressbar"
            aria-label="読み込み中"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={
              {
                '--progress-value': `${displayProgress}%`,
              } as React.CSSProperties
            }
          />

          <p className="loading-message">{message}</p>

          <div className="loading-progress">
            <small className="loading-progress-text">
              {progress}
              {progressPercentage !== undefined && (
                <span className="loading-percentage">
                  {' '}
                  ({displayProgress}%)
                </span>
              )}
            </small>
          </div>
        </div>
      </div>
    );
  }
);

// LoadingScreenコンポーネントの表示名を設定（React DevTools用）
LoadingScreen.displayName = 'LoadingScreen';

/**
 * マップローディングオーバーレイのプロパティ
 * 高度なアニメーション制御とアクセシビリティ対応
 */
interface MapLoadingOverlayProps {
  /** フェードアウトアニメーションの有効化 */
  fadeOut: boolean;
  /** POIデータの読み込み状態 */
  poisLoading: boolean;
  /** ローディング完了時のコールバック */
  onLoadingComplete?: () => void;
  /** カスタムアリアラベル */
  ariaLabel?: string;
  /** アニメーション継続時間（ms） */
  animationDuration?: number;
  /** テスト用ID */
  testId?: string;
}

/**
 * フェードアウトアニメーションを管理するカスタムフック
 */
const useFadeOutAnimation = (
  fadeOut: boolean,
  onComplete?: () => void,
  duration = 600
) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!fadeOut) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [fadeOut, onComplete, duration]);

  return isVisible;
};

/**
 * マップローディングオーバーレイコンポーネント
 *
 * 特徴:
 * - スムーズなフェードアウトアニメーション
 * - アクセシビリティ完全対応
 * - カスタマイズ可能なアニメーション
 * - メモ化によるパフォーマンス最適化
 * - プリファードモーション設定の尊重
 */
export const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = memo(
  ({
    fadeOut,
    poisLoading,
    onLoadingComplete,
    ariaLabel = '地図読み込み中',
    animationDuration = 600,
    testId = 'map-loading-overlay',
  }) => {
    const isVisible = useFadeOutAnimation(
      fadeOut,
      onLoadingComplete,
      animationDuration
    );

    // アニメーション完了後は完全に非表示
    if (!isVisible) return null;

    const currentMessage = poisLoading
      ? 'お店のデータを読み込み中...'
      : '地図を準備中...';

    const currentProgress = poisLoading
      ? '最新の店舗情報を取得しています'
      : 'マーカーを配置しています';

    return (
      <div
        className={`map-loading-overlay ${fadeOut ? 'fade-out' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-live="polite"
        data-testid={testId}
        style={
          {
            '--animation-duration': `${animationDuration}ms`,
          } as React.CSSProperties
        }
      >
        <div className="map-loading-content">
          <img
            src={ASSETS.TITLE.ROW1}
            alt="佐渡で食えっちゃのロゴ"
            className="map-loading-title-image"
            loading="eager"
            decoding="sync"
          />

          <div
            className="loading-spinner"
            role="progressbar"
            aria-label="地図読み込み進行状況"
            aria-valuetext={currentProgress}
          />

          <p className="loading-message" aria-live="polite">
            {currentMessage}
          </p>

          <div className="loading-progress">
            <small className="loading-progress-text">{currentProgress}</small>
          </div>
        </div>
      </div>
    );
  }
);

// MapLoadingOverlayコンポーネントの表示名を設定
MapLoadingOverlay.displayName = 'MapLoadingOverlay';

// 名前付きエクスポートでの再エクスポート（Tree Shaking最適化）
export {
  LoadingScreen as default,
  type LoadingScreenProps,
  type MapLoadingOverlayProps,
};
