import React from "react";
import { ASSETS } from "../utils/assets";

interface LoadingScreenProps {
  title?: string;
  message?: string;
  progress?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title = "佐渡で食えっちゃ",
  message = "佐渡島のおすすめ飲食店を準備中...",
  progress = "アセットを読み込み中です",
}) => {
  return (
    <div className="loading">
      <div className="loading-content">
        <img src={ASSETS.TITLE.ROW1} alt={title} className="loading-title-image" />
        <div className="loading-spinner"></div>
        <p>{message}</p>
        <div className="loading-progress">
          <small>{progress}</small>
        </div>
      </div>
    </div>
  );
};

interface MapLoadingOverlayProps {
  fadeOut: boolean;
  poisLoading: boolean;
}

export const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({ fadeOut, poisLoading }) => {
  return (
    <div className={`map-loading-overlay ${fadeOut ? "fade-out" : ""}`}>
      <div className="map-loading-content">
        <img src={ASSETS.TITLE.ROW1} alt="佐渡で食えっちゃ" className="map-loading-title-image" />
        <div className="loading-spinner"></div>
        <p>{poisLoading ? "お店のデータを読み込み中..." : "地図を準備中..."}</p>
        <div className="loading-progress">
          <small>
            {poisLoading ? "最新の店舗情報を取得しています" : "マーカーを配置しています"}
          </small>
        </div>
      </div>
    </div>
  );
};
