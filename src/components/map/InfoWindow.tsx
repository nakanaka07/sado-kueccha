import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import { memo, useMemo } from "react";
import type { POI } from "../../types/poi";
import { parseTextWithLinks } from "../../utils/social";
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
      <article className="info-window" role="dialog" aria-labelledby="info-window-title">
        <header className="info-window-header">
          <h3 id="info-window-title" className="info-window-title">
            {poi.name}
          </h3>
          {poi.genre ? (
            <span className="info-window-genre" aria-label={`カテゴリ: ${poi.genre}`}>
              {poi.genre}
            </span>
          ) : null}
        </header>

        <div className="info-window-content">
          {poi.district ? (
            <div className="info-window-field">
              <span className="field-value" aria-label={`地区: ${poi.district}`}>
                {poi.district}
              </span>
            </div>
          ) : null}

          {poi.details?.description ? (
            <div className="info-window-field">
              <span className="field-label" id="sns-label">
                SNS:
              </span>
              <div className="field-value sns-content" aria-labelledby="sns-label">
                {linkifiedContent}
              </div>
            </div>
          ) : null}

          {poi.address ? (
            <div className="info-window-field">
              <span className="field-label" id="address-label">
                所在地:
              </span>
              <span className="field-value" aria-labelledby="address-label">
                {poi.address}
              </span>
            </div>
          ) : null}

          {businessHoursRecord ? (
            <div className="info-window-field">
              <span className="field-label" id="hours-label">
                営業時間:
              </span>
              <div aria-labelledby="hours-label">
                <BusinessHoursDisplay businessHours={businessHoursRecord} />
              </div>
            </div>
          ) : null}

          <div className="info-window-features" role="list" aria-label="施設の特徴">
            {poi.parking ? (
              <div className="feature-badge parking" role="listitem">
                <span aria-hidden="true">🅿️</span>
                <span>隣接駐車場: {poi.parking}</span>
              </div>
            ) : null}
            {poi.cashless ? (
              <div className="feature-badge cashless" role="listitem">
                <span aria-hidden="true">💳</span>
                <span>キャッシュレス対応</span>
              </div>
            ) : null}
          </div>

          {poi.contact?.phone ? (
            <div className="info-window-field">
              <span className="field-label" id="contact-label">
                連絡先:
              </span>
              <span className="field-value" aria-labelledby="contact-label">
                <a
                  href={phoneHref}
                  className="info-window-link"
                  aria-label={`電話をかける: ${poi.contact.phone}`}
                >
                  {poi.contact.phone}
                </a>
              </span>
            </div>
          ) : null}

          {poi.googleMapsUrl ? (
            <div className="info-window-actions">
              <a
                href={poi.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="info-window-link primary"
                aria-label={`${poi.name}をGoogle Mapsで開く`}
              >
                <span aria-hidden="true">📍</span>
                <span>Google Mapsで開く</span>
              </a>
            </div>
          ) : null}
        </div>
      </article>
    </GoogleInfoWindow>
  );
};

// パフォーマンス最適化のためのメモ化
export const InfoWindow = memo(InfoWindowComponent);
