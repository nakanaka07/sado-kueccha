import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import type { POI } from "../types/google-maps.d.ts";
import "./InfoWindow.css";

interface InfoWindowProps {
  poi: POI;
  onClose: () => void;
}

export const InfoWindow: React.FC<InfoWindowProps> = ({ poi, onClose }) => {
  return (
    <GoogleInfoWindow position={poi.position} onCloseClick={onClose} maxWidth={300}>
      <div className="info-window">
        <div className="info-window-header">
          <h3 className="info-window-title">{poi.name}</h3>
          <span className="info-window-genre">{poi.genre}</span>
        </div>

        <div className="info-window-content">
          {poi.category && (
            <div className="info-window-field">
              <span className="field-label">カテゴリー:</span>
              <span className="field-value">{poi.category}</span>
            </div>
          )}

          {poi.description && (
            <div className="info-window-field">
              <span className="field-label">説明:</span>
              <span className="field-value">{poi.description}</span>
            </div>
          )}

          {poi.address && (
            <div className="info-window-field">
              <span className="field-label">住所:</span>
              <span className="field-value">{poi.address}</span>
            </div>
          )}

          {poi.businessHours && (
            <div className="info-window-field">
              <span className="field-label">営業時間:</span>
              <div className="business-hours">
                {Object.entries(poi.businessHours).map(([day, hours]) => (
                  <div key={day} className="hours-row">
                    <span className="day">{day}:</span>
                    <span className="hours">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="info-window-features">
            {poi.parking && <div className="feature-badge parking">🅿️ 駐車場: {poi.parking}</div>}

            {poi.cashless && <div className="feature-badge cashless">💳 キャッシュレス対応</div>}
          </div>

          {poi.contact && (
            <div className="info-window-field">
              <span className="field-label">連絡先:</span>
              <span className="field-value">
                <a href={`tel:${poi.contact}`} className="contact-link">
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
                className="maps-link"
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
