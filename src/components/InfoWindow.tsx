import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import type { POI } from "../types/google-maps";
import "./InfoWindow.css";

interface InfoWindowProps {
  poi: POI;
  onClose: () => void;
}

// 営業時間の型定義
type ParsedHours =
  | { type: "closed" }
  | { type: "24h" }
  | { type: "unknown" }
  | { type: "multiple"; periods: Array<{ start: number; end: number }> }
  | { type: "normal"; start: number; end: number };

// 営業時間関連のユーティリティ関数
const BusinessHoursUtils = {
  // 時刻を数値に変換 (例: 14:30 -> 1430)
  timeToNumber: (hour: number, minute: number): number => hour * 100 + minute,

  // SNSアイコンを判定
  getSNSIcon: (url: string): string => {
    if (url.includes("twitter.com") || url.includes("x.com")) return "🐦";
    if (url.includes("instagram.com")) return "📷";
    if (url.includes("facebook.com")) return "📘";
    if (url.includes("youtube.com")) return "🎥";
    if (url.includes("tiktok.com")) return "🎵";
    return "🔗";
  },
  // 営業時間文字列をパース
  parseHours: (hoursStr: string): ParsedHours => {
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
              start: BusinessHoursUtils.timeToNumber(parseInt(start1H), parseInt(start1M)),
              end: BusinessHoursUtils.timeToNumber(parseInt(end1H), parseInt(end1M)),
            },
            {
              start: BusinessHoursUtils.timeToNumber(parseInt(start2H), parseInt(start2M)),
              end: BusinessHoursUtils.timeToNumber(parseInt(end2H), parseInt(end2M)),
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
          start: BusinessHoursUtils.timeToNumber(parseInt(startH), parseInt(startM)),
          end: BusinessHoursUtils.timeToNumber(parseInt(endH), parseInt(endM)),
        };
      }
    }

    return { type: "unknown" };
  },

  // 現在営業中かどうかチェック
  isCurrentlyOpen: (parsedHours: ParsedHours, currentTime: number): boolean => {
    const isInPeriod = (start: number, end: number) => {
      return end < start
        ? currentTime >= start || currentTime <= end
        : currentTime >= start && currentTime <= end;
    };

    switch (parsedHours.type) {
      case "24h":
        return true;
      case "closed":
      case "unknown":
        return false;
      case "multiple":
        return parsedHours.periods.some((period) => isInPeriod(period.start, period.end));
      case "normal":
        return isInPeriod(parsedHours.start, parsedHours.end);
      default:
        return false;
    }
  },

  // 営業状態のテキストを取得
  getStatusText: (parsedHours: ParsedHours, isOpen: boolean): string => {
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
  },

  // 営業時間データを整理
  formatBusinessHours: (businessHours: Record<string, string>) => {
    const now = new Date();
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const currentDay = dayNames[now.getDay()];
    const currentTime = BusinessHoursUtils.timeToNumber(now.getHours(), now.getMinutes());

    // データ形式を統一
    let hoursData: Record<string, string>;
    if (businessHours["general"]) {
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
      todayHours !== "不明"
        ? BusinessHoursUtils.parseHours(todayHours)
        : ({ type: "unknown" } as const);
    const isOpen =
      parsedToday.type !== "unknown"
        ? BusinessHoursUtils.isCurrentlyOpen(parsedToday, currentTime)
        : false;

    // 営業時間をグループ化
    const groupedHours: Record<string, string[]> = {};
    Object.entries(hoursData).forEach(([day, hours]) => {
      if (!groupedHours[hours]) groupedHours[hours] = [];
      groupedHours[hours].push(day);
    });

    return {
      isOpen,
      currentStatus: BusinessHoursUtils.getStatusText(parsedToday, isOpen),
      todayHours,
      groupedHours,
    };
  },
};

// URLを検出してリンク化する関数
const linkifyText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="link">
          {BusinessHoursUtils.getSNSIcon(part)} リンクを開く
        </a>
      );
    }
    return part;
  });
};

// 営業時間表示用のコンポーネント
const BusinessHoursDisplay: React.FC<{ businessHours: Record<string, string> }> = ({
  businessHours,
}) => {
  const hoursInfo = BusinessHoursUtils.formatBusinessHours(businessHours);

  return (
    <div className="business-hours">
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
    </div>
  );
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
          )}

          {poi.description && (
            <div className="info-window-field">
              <span className="field-label">関連情報（SNS等）:</span>
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
            {poi.parking && <div className="feature-badge parking">🅿️ 駐車場: {poi.parking}</div>}
            {poi.cashless && <div className="feature-badge cashless">💳 キャッシュレス対応</div>}
          </div>

          {poi.contact && (
            <div className="info-window-field">
              <span className="field-label">連絡先:</span>
              <span className="field-value">
                <a href={`tel:${poi.contact}`} className="link">
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
                className="link"
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
