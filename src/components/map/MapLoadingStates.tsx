/**
 * マップローディング状態コンポーネント
 * マップ読み込み中の表示を管理
 *
 * @version 1.0.0
 * @since 2025-06-30
 */

import { memo } from 'react';
import './MapLoadingStates.css';

interface MapLoadingStatesProps {
  className?: string;
  isLoading: boolean;
  isPoisLoading?: boolean;
  message?: string;
}

/**
 * マップのローディング状態を表示するコンポーネント
 */
export const MapLoadingStates = memo<MapLoadingStatesProps>(
  ({
    className = 'map-container',
    isLoading,
    isPoisLoading = false,
    message,
  }) => {
    // どちらかがtrueの場合にローディング表示
    const shouldShowLoading = isLoading || isPoisLoading;

    if (!shouldShowLoading) {
      return null;
    }

    const displayMessage =
      message ||
      (isPoisLoading ? 'POIデータを読み込み中...' : '地図を読み込み中...');

    return (
      <div className={className}>
        <div className="map-loading-states">
          <div className="loading-content">
            <div className="loading-spinner" aria-hidden="true" />
            <p className="loading-text">{displayMessage}</p>
          </div>
        </div>
      </div>
    );
  }
);

MapLoadingStates.displayName = 'MapLoadingStates';
