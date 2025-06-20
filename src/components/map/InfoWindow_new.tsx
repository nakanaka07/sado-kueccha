import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import { memo, useMemo } from "react";
import type { POI } from "../../types/poi";
import { parseTextWithLinks } from "../../utils/social";
import { AsyncWrapper, InfoPanel } from "../shared";
import { BusinessHoursDisplay } from "../ui/BusinessHoursDisplay";
import "./InfoWindow.css";

interface InfoWindowProps {
  readonly poi: POI;
  readonly onClose: () => void;
}

const InfoWindowComponent = ({ poi, onClose }: InfoWindowProps) => {
  // SNSコンテンツのリンク化を最適化（メモ化）
  const linkifiedContent = useMemo(() => {
    const description = poi.details?.description;
    if (!description) return null;

    const linkParts = parseTextWithLinks(description, "info-window-link");
    return linkParts.map((part) => {
      if (part.type === "link") {
        return (
          <a
            key={part.key}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className={part.className}
            aria-label={`外部リンクを開く: ${part.href}`}
          >
            {part.icon} リンクを開く
          </a>
        );
      }
      return <span key={part.key}>{part.content}</span>;
    });
  }, [poi.details?.description]);

  // 電話番号リンクのクリックハンドラー
  const phoneHref = useMemo(() => {
    const phone = poi.contact?.phone;
    if (!phone) return "";
    // 電話番号の形式を正規化
    const normalizedPhone = phone.replace(/[^\d-]/g, "");
    return `tel:${normalizedPhone}`;
  }, [poi.contact?.phone]);

  // BusinessHoursDisplay用の営業時間データを変換
  const businessHoursRecord = useMemo(() => {
    if (!poi.businessHours) return null;

    // WeeklyBusinessHoursをRecord<string, string>に変換
    const record: Record<string, string> = {};
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    days.forEach((day) => {
      const dayHours = poi.businessHours?.[day];
      if (dayHours) {
        if (dayHours.isClosed) {
          record[day] = "closed";
        } else if (dayHours.is24Hours) {
          record[day] = "24h";
        } else if (dayHours.periods.length) {
          const periodsStr = dayHours.periods.map((p) => `${p.start}-${p.end}`).join(", ");
          record[day] = periodsStr;
        }
      }
    });

    return Object.keys(record).length > 0 ? record : null;
  }, [poi.businessHours]);

  return (
    <GoogleInfoWindow
      position={poi.position}
      onCloseClick={onClose}
      ariaLabel={`${poi.name}の詳細情報`}
    >
      <InfoPanel
        title={poi.name}
        onClose={onClose}
        className="info-window-panel"
        size="small"
        role="dialog"
        aria-label={`${poi.name}の詳細情報`}
      >
        <AsyncWrapper
          data={poi}
          loading={false}
          error={null}
          emptyMessage="POI情報が見つかりません"
        >
          {(poiData) => (
            <div className="info-window-content">
              {poiData.genre ? (
                <span className="info-window-genre" aria-label={`カテゴリ: ${poiData.genre}`}>
                  {poiData.genre}
                </span>
              ) : null}

              {poiData.district ? (
                <div className="info-window-section">
                  <strong>エリア:</strong> {poiData.district}
                </div>
              ) : null}

              {poiData.details?.description ? (
                <div className="info-window-section">
                  <div className="info-window-description">{linkifiedContent}</div>
                </div>
              ) : null}

              {poiData.address ? (
                <div className="info-window-section">
                  <strong>所在地:</strong> {poiData.address}
                </div>
              ) : null}

              {businessHoursRecord ? (
                <div className="info-window-section">
                  <strong>営業時間:</strong>
                  <BusinessHoursDisplay businessHours={businessHoursRecord} />
                </div>
              ) : null}

              <div className="info-window-features">
                {poiData.parking ? (
                  <div className="feature-badge parking">🅿️ 隣接駐車場: {poiData.parking}</div>
                ) : null}
                {poiData.cashless ? (
                  <div className="feature-badge cashless">💳 キャッシュレス対応</div>
                ) : null}
              </div>

              {poiData.contact?.phone ? (
                <div className="info-window-section">
                  <a
                    href={phoneHref}
                    className="info-window-phone"
                    aria-label={`電話をかける: ${poiData.contact.phone}`}
                  >
                    📞 {poiData.contact.phone}
                  </a>
                </div>
              ) : null}

              {poiData.googleMapsUrl ? (
                <div className="info-window-section">
                  <a
                    href={poiData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="info-window-link"
                    aria-label={`${poiData.name}をGoogle Mapsで開く`}
                  >
                    📍 Google Mapsで開く
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </AsyncWrapper>
      </InfoPanel>
    </GoogleInfoWindow>
  );
};

/**
 * メモ化されたInfoWindowコンポーネント
 * パフォーマンス最適化のため、propsが変更された場合のみ再レンダリング
 */
export const InfoWindow = memo(InfoWindowComponent);

InfoWindowComponent.displayName = "InfoWindow";
