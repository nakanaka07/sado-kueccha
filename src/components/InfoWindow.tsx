import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import type { POI } from "../types/google-maps.d.ts";
import "./InfoWindow.css";

interface InfoWindowProps {
  poi: POI;
  onClose: () => void;
}

// URLを検出してリンク化する関数
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // SNSの種類を判定してアイコンを表示
      const getSNSIcon = (url: string) => {
        if (url.includes("twitter.com") || url.includes("x.com")) return "🐦";
        if (url.includes("instagram.com")) return "📷";
        if (url.includes("facebook.com")) return "📘";
        if (url.includes("youtube.com")) return "🎥";
        if (url.includes("tiktok.com")) return "🎵";
        return "🔗";
      };

      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="sns-link">
          {getSNSIcon(part)} リンクを開く
        </a>
      );
    }
    return part;
  });
};

// 営業時間の型定義
type ParsedHours =
  | { type: "closed" }
  | { type: "24h" }
  | { type: "unknown" }
  | { type: "multiple"; periods: Array<{ start: number; end: number }> }
  | { type: "normal"; start: number; end: number };

// 営業時間の共通ユーティリティ関数
const parseBusinessHours = (hoursStr: string): ParsedHours => {
  // 特別な営業状態を判定
  const closedStatuses = ["定休日", "休業", "-", "閉店", "不定休"];
  if (closedStatuses.includes(hoursStr)) return { type: "closed" };

  if (hoursStr.includes("24時間") || hoursStr === "24h" || hoursStr === "終日") {
    return { type: "24h" };
  }

  // 複数時間帯の営業（例：10:00-14:00, 17:00-21:00）
  const multiTimeMatch = hoursStr.match(
    /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})(?:.*?)(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/,
  );
  if (multiTimeMatch) {
    const [, start1H, start1M, end1H, end1M, start2H, start2M, end2H, end2M] = multiTimeMatch;
    if (start1H && start1M && end1H && end1M && start2H && start2M && end2H && end2M) {
      return {
        type: "multiple",
        periods: [
          {
            start: parseInt(start1H) * 100 + parseInt(start1M),
            end: parseInt(end1H) * 100 + parseInt(end1M),
          },
          {
            start: parseInt(start2H) * 100 + parseInt(start2M),
            end: parseInt(end2H) * 100 + parseInt(end2M),
          },
        ],
      };
    }
  }

  // 通常の営業時間
  const timeMatch = hoursStr.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const [, startH, startM, endH, endM] = timeMatch;
    if (startH && startM && endH && endM) {
      return {
        type: "normal",
        start: parseInt(startH) * 100 + parseInt(startM),
        end: parseInt(endH) * 100 + parseInt(endM),
      };
    }
  }

  return { type: "unknown" };
};

const checkCurrentlyOpen = (parsedHours: ParsedHours, currentTime: number): boolean => {
  switch (parsedHours.type) {
    case "24h":
      return true;
    case "closed":
    case "unknown":
      return false;
    case "multiple":
      return parsedHours.periods.some((period) => {
        if (period.end < period.start) {
          return currentTime >= period.start || currentTime <= period.end;
        }
        return currentTime >= period.start && currentTime <= period.end;
      });
    case "normal":
      if (parsedHours.end < parsedHours.start) {
        return currentTime >= parsedHours.start || currentTime <= parsedHours.end;
      }
      return currentTime >= parsedHours.start && currentTime <= parsedHours.end;
    default:
      return false;
  }
};

// 営業時間の表示を改善する関数
const formatBusinessHours = (businessHours: Record<string, string>) => {
  const now = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();

  // データ形式を統一（generalキーまたは曜日別キー）
  let hoursData: Record<string, string>;

  if (businessHours["general"]) {
    // 後方互換性：general形式を解析
    hoursData = {};
    businessHours["general"].split(",").forEach((entry) => {
      const match = entry.trim().match(/^([月火水木金土日祝]):?\s*(.+)$/);
      if (match && match[1] && match[2]) {
        hoursData[match[1]] = match[2].trim();
      }
    });
  } else {
    hoursData = businessHours;
  }
  const todayHours = currentDay ? hoursData[currentDay] || "不明" : "不明";
  const parsedToday =
    todayHours !== "不明" ? parseBusinessHours(todayHours) : ({ type: "unknown" } as const);
  const isOpen =
    parsedToday.type !== "unknown" ? checkCurrentlyOpen(parsedToday, currentTime) : false;

  // 営業時間をグループ化
  const groupedHours: Record<string, string[]> = {};
  Object.entries(hoursData).forEach(([day, hours]) => {
    if (!groupedHours[hours]) groupedHours[hours] = [];
    groupedHours[hours].push(day);
  });
  const getStatusText = (parsedHours: ParsedHours) => {
    switch (parsedHours.type) {
      case "24h":
        return "24時間営業";
      case "closed":
        return "定休日";
      case "unknown":
        return "営業時間不明";
      default:
        return isOpen ? "営業中" : "営業時間外";
    }
  };
  return {
    isOpen,
    currentStatus: getStatusText(parsedToday),
    todayHours,
    groupedHours,
  };
};

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
          )}{" "}
          {poi.description && (
            <div className="info-window-field">
              <span className="field-label">関連情報（SNS等）:</span>
              <div className="field-value sns-content">{linkifyText(poi.description)}</div>
            </div>
          )}
          {poi.address && (
            <div className="info-window-field">
              <span className="field-label">住所:</span>
              <span className="field-value">{poi.address}</span>
            </div>
          )}{" "}
          {poi.businessHours && (
            <div className="info-window-field">
              <span className="field-label">営業時間:</span>
              <div className="business-hours">
                {(() => {
                  const hoursInfo = formatBusinessHours(poi.businessHours);
                  return (
                    <>
                      <div className={`current-status ${hoursInfo.isOpen ? "open" : "closed"}`}>
                        <span className="status-icon">{hoursInfo.isOpen ? "🟢" : "🔴"}</span>
                        <span className="status-text">{hoursInfo.currentStatus}</span>
                        {hoursInfo.todayHours !== "不明" && (
                          <span className="today-hours">（本日: {hoursInfo.todayHours}）</span>
                        )}
                      </div>
                      <div className="hours-details">
                        {Object.entries(hoursInfo.groupedHours).map(([hours, days]) => (
                          <div key={hours} className="hours-group">
                            <span className="days">{days.join("・")}</span>
                            <span className="hours">{hours}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
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
