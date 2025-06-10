import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import React from "react";
import type { POI } from "../types/google-maps";
import { SocialUtils } from "../utils/social";
import { BusinessHoursDisplay } from "./BusinessHoursDisplay";
import "./InfoWindow.css";

interface InfoWindowProps {
  poi: POI;
  onClose: () => void;
}

// URLを検出してリンク化する関数
const linkifyText = (text: string) => {
  const linkParts = SocialUtils.linkifyText(text, "info-window-link");

  return linkParts.map((part) => {
    if (part.type === "link") {
      return (
        <a
          key={part.key}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          className={part.className}
        >
          {part.icon} リンクを開く
        </a>
      );
    }
    return part.content;
  });
};

export const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose }) => {
  // 情報ウィンドウ内のクリックイベントの伝播を防ぐ
  const handleInfoWindowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <GoogleInfoWindow position={poi.position} onCloseClick={onClose} maxWidth={300}>
      <div className="info-window" onClick={handleInfoWindowClick}>
        <div className="info-window-header">
          <h3 className="info-window-title">{poi.name}</h3>
          <span className="info-window-genre">{poi.genre}</span>
        </div>

        <div className="info-window-content">
          {poi.district && (
            <div className="info-window-field">
              <span className="field-label">地区:</span>
              <span className="field-value">{poi.district}</span>
            </div>
          )}

          {poi.description && (
            <div className="info-window-field">
              <span className="field-label">SNS:</span>
              <div className="field-value sns-content">{linkifyText(poi.description)}</div>
            </div>
          )}

          {poi.address && (
            <div className="info-window-field">
              <span className="field-label">所在地:</span>
              <span className="field-value">{poi.address}</span>
            </div>
          )}

          {poi.businessHours && (
            <div className="info-window-field">
              <span className="field-label">営業時間:</span>
              <BusinessHoursDisplay businessHours={poi.businessHours} />
            </div>
          )}

          <div className="info-window-features">
            {poi.parking && (
              <div className="feature-badge parking">🅿️ 隣接駐車場: {poi.parking}</div>
            )}
            {poi.cashless && <div className="feature-badge cashless">💳 キャッシュレス対応</div>}
          </div>

          {poi.contact && (
            <div className="info-window-field">
              <span className="field-label">連絡先:</span>
              <span className="field-value">
                <a href={`tel:${poi.contact}`} className="info-window-link">
                  {poi.contact}
                </a>
              </span>
            </div>
          )}

          {poi.googleMapsUrl && (
            <div className="info-window-actions">
              <a
                href={poi.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="info-window-link primary"
              >
                📍 Google Mapsで開く
              </a>
            </div>
          )}
        </div>
      </div>
    </GoogleInfoWindow>
  );
};
