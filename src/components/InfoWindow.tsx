import { InfoWindow as GoogleInfoWindow } from "@vis.gl/react-google-maps";
import type { ParsedHours } from "../types/common";
import type { POI } from "../types/google-maps";
import "./InfoWindow.css";

interface InfoWindowProps {
  poi: POI;
  onClose: () => void;
}

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
      /(\d{1,2}):(\d{2})\s*[-~〜]\s*(\d{1,2}):(\d{2})(?:.*?)(\d{1,2}):(\d{2})\s*[-~〜]\s*(\d{1,2}):(\d{2})/,
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

    // 通常の営業時間（様々な区切り文字と時間表記に対応）
    const timeMatch = hoursStr.match(/(\d{1,2}):?(\d{2})?\s*[-~〜ー]\s*(\d{1,2}):?(\d{2})?/);
    if (timeMatch) {
      const [, startH, startM = "00", endH, endM = "00"] = timeMatch;
      if (startH && endH) {
        return {
          type: "normal",
          start: BusinessHoursUtils.timeToNumber(parseInt(startH), parseInt(startM)),
          end: BusinessHoursUtils.timeToNumber(parseInt(endH), parseInt(endM)),
        };
      }
    }

    // 時間部分のみ（例：9-17、9時-17時）
    const simpleTimeMatch = hoursStr.match(/(\d{1,2})時?\s*[-~〜ー]\s*(\d{1,2})時?/);
    if (simpleTimeMatch) {
      const [, startH, endH] = simpleTimeMatch;
      if (startH && endH) {
        return {
          type: "normal",
          start: BusinessHoursUtils.timeToNumber(parseInt(startH), 0),
          end: BusinessHoursUtils.timeToNumber(parseInt(endH), 0),
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
  getStatusText: (parsedHours: ParsedHours, isOpen: boolean, todayHours: string): string => {
    switch (parsedHours.type) {
      case "24h":
        return "24時間営業";
      case "closed":
        return "定休日";
      case "unknown":
        // デバッグ情報を含める（本来の時間情報がある場合）
        return todayHours !== "不明" ? `営業時間要確認 (${todayHours})` : "営業時間不明";
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

    return {
      isOpen,
      currentStatus: BusinessHoursUtils.getStatusText(parsedToday, isOpen, todayHours),
      todayHours,
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

  // ステータスの種類を判定
  const getStatusType = () => {
    if (hoursInfo.currentStatus === "24時間営業") return "open";
    if (hoursInfo.currentStatus === "定休日") return "closed";
    if (
      hoursInfo.currentStatus.includes("営業時間不明") ||
      hoursInfo.currentStatus.includes("営業時間要確認")
    )
      return "unknown";
    return hoursInfo.isOpen ? "open" : "closed";
  };

  return (
    <div className="business-hours">
      <div className="business-hours-status">
        <div className={`status-badge ${getStatusType()}`}>
          <span className="status-icon">
            {getStatusType() === "open" ? "🟢" : getStatusType() === "closed" ? "🔴" : "⚪"}
          </span>
          <span className="status-text">{hoursInfo.currentStatus}</span>
        </div>
        {hoursInfo.todayHours !== "不明" &&
          !hoursInfo.currentStatus.includes(hoursInfo.todayHours) && (
            <div className="hours-info">本日: {hoursInfo.todayHours}</div>
          )}
      </div>
    </div>
  );
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
