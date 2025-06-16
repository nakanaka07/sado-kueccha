import type { ParsedHours, StatusConfig, StatusType } from "../types/poi";

// 営業時間関連の定数
export const BUSINESS_HOURS_CONSTANTS = {
  CLOSED_STATUSES: ["定休日", "休業", "-", "閉店", "不定休"],
  OPEN_24H_KEYWORDS: ["24時間", "24h", "終日"],
  DAY_NAMES: ["日", "月", "火", "水", "木", "金", "土"] as const,
  TIME_MULTIPLIER: 100, // 時間を数値に変換する際の乗数
  MAX_HOUR: 24,
  MAX_MINUTE: 59,
} as const;

// ステータス表示用の統合定数（アクセシビリティ対応）
export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  open: {
    text: "営業中",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "現在営業中です",
  },
  closed: {
    text: "定休日",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "本日は定休日です",
  },
  unknown: {
    text: "営業時間不明",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間が不明です",
  },
  "24h": {
    text: "24時間営業",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "24時間営業です",
  },
  "time-outside": {
    text: "営業時間外",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "現在営業時間外です",
  },
  "confirmation-needed": {
    text: "営業時間要確認",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間の確認が必要です",
  },
} as const;

/**
 * 時間値のバリデーション
 */
function validateTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= BUSINESS_HOURS_CONSTANTS.MAX_HOUR &&
    minute >= 0 &&
    minute <= BUSINESS_HOURS_CONSTANTS.MAX_MINUTE
  );
}

// 時刻を数値に変換 (例: 14:30 -> 1430)
export function timeToNumber(hour: number, minute: number): number {
  if (!validateTime(hour, minute)) {
    throw new Error(`Invalid time: ${hour.toString()}:${minute.toString()}`);
  }
  return hour * BUSINESS_HOURS_CONSTANTS.TIME_MULTIPLIER + minute;
}

/**
 * 安全な文字列から数値への変換
 */
function safeParseInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * 時間文字列のパース（統合版）
 */
function parseTimeString(hoursStr: string): ParsedHours | null {
  // 複数時間帯のパターン（例：9:00-12:00 13:00-17:00）
  const multipleTimePattern = /(\d{1,2}):(\d{2})\s*[-~〜]\s*(\d{1,2}):(\d{2})/g;
  const multipleMatches = Array.from(hoursStr.matchAll(multipleTimePattern));

  if (multipleMatches.length >= 2) {
    const periods: Array<{ start: number; end: number }> = [];

    for (const match of multipleMatches) {
      const [, startH, startM, endH, endM] = match;
      const startHour = safeParseInt(startH);
      const startMinute = safeParseInt(startM);
      const endHour = safeParseInt(endH);
      const endMinute = safeParseInt(endM);

      if (startHour !== null && startMinute !== null && endHour !== null && endMinute !== null) {
        try {
          periods.push({
            start: timeToNumber(startHour, startMinute),
            end: timeToNumber(endHour, endMinute),
          });
        } catch {
          return null;
        }
      }
    }

    if (periods.length >= 2) {
      return { type: "multiple", periods };
    }
  }

  // 通常の営業時間パターン
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*[-~〜ー]\s*(\d{1,2}):?(\d{2})?/, // 9:00-17:00 or 9-17
    /(\d{1,2})時?\s*[-~〜ー]\s*(\d{1,2})時?/, // 9時-17時
  ];

  for (const pattern of timePatterns) {
    const match = hoursStr.match(pattern);
    if (match) {
      const [, startH, startM = "00", endH, endM = "00"] = match;
      const startHour = safeParseInt(startH);
      const startMinute = safeParseInt(startM);
      const endHour = safeParseInt(endH);
      const endMinute = safeParseInt(endM);

      if (startHour !== null && startMinute !== null && endHour !== null && endMinute !== null) {
        try {
          return {
            type: "normal",
            start: timeToNumber(startHour, startMinute),
            end: timeToNumber(endHour, endMinute),
          };
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

// 営業時間文字列をパース
export function parseHours(hoursStr: string): ParsedHours {
  if (BUSINESS_HOURS_CONSTANTS.CLOSED_STATUSES.some((status) => hoursStr === status)) {
    return { type: "closed" };
  }

  if (BUSINESS_HOURS_CONSTANTS.OPEN_24H_KEYWORDS.some((keyword) => hoursStr.includes(keyword))) {
    return { type: "24h" };
  }

  // 統合された時間パース処理を使用
  const result = parseTimeString(hoursStr);
  if (result) {
    return result;
  }

  return { type: "unknown" };
}

/**
 * 現在営業中かどうかチェック
 */
export function isCurrentlyOpen(parsedHours: ParsedHours, currentTime: number): boolean {
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
}

/**
 * 営業状態のテキストとタイプを取得
 */
export function getStatusInfo(
  parsedHours: ParsedHours,
  isOpen: boolean,
  todayHours: string,
): { text: string; type: StatusType; shouldShowTodayHours: boolean } {
  switch (parsedHours.type) {
    case "24h":
      return {
        text: STATUS_CONFIG["24h"].text,
        type: "open",
        shouldShowTodayHours: false,
      };
    case "closed":
      return {
        text: STATUS_CONFIG.closed.text,
        type: "closed",
        shouldShowTodayHours: false,
      };
    case "unknown":
      if (todayHours !== "不明") {
        return {
          text: `${STATUS_CONFIG["confirmation-needed"].text} (${todayHours})`,
          type: "unknown",
          shouldShowTodayHours: false,
        };
      }
      return {
        text: STATUS_CONFIG.unknown.text,
        type: "unknown",
        shouldShowTodayHours: false,
      };
    default:
      return {
        text: isOpen ? STATUS_CONFIG.open.text : STATUS_CONFIG["time-outside"].text,
        type: isOpen ? "open" : "closed",
        shouldShowTodayHours: !isOpen && todayHours !== "不明",
      };
  }
}

/**
 * ステータスに対応するアイコンを取得（廃止予定 - STATUS_CONFIG.iconを直接使用）
 * @deprecated Use STATUS_CONFIG[statusType].icon instead
 */
export function getStatusIcon(statusType: StatusType): string {
  return STATUS_CONFIG[statusType].icon;
}

/**
 * ステータス設定を取得
 */
export function getStatusConfig(statusType: StatusType): StatusConfig {
  return STATUS_CONFIG[statusType];
}

/**
 * 現在時刻を取得（テスト可能にするため分離）
 */
export function getCurrentTime(): { day: string; time: number } {
  const now = new Date();
  const currentDay = BUSINESS_HOURS_CONSTANTS.DAY_NAMES[now.getDay()] ?? "日";
  const currentTime = timeToNumber(now.getHours(), now.getMinutes());
  return { day: currentDay, time: currentTime };
}

/**
 * 営業時間データの形式を統一
 */
function normalizeBusinessHoursData(businessHours: Record<string, string>): Record<string, string> {
  if (businessHours["general"]) {
    const hoursData: Record<string, string> = {};
    businessHours["general"].split(",").forEach((entry) => {
      const match = entry.trim().match(/^([月火水木金土日祝]):?\s*(.+)$/);
      if (match?.[1] && match[2]) {
        hoursData[match[1]] = match[2].trim();
      }
    });
    return hoursData;
  }
  return businessHours;
}

/**
 * 営業時間データを整理（責任を分割して簡素化）
 */
export function formatBusinessHours(businessHours: Record<string, string>) {
  const { day: currentDay, time: currentTime } = getCurrentTime();
  const hoursData = normalizeBusinessHoursData(businessHours);

  const todayHours = hoursData[currentDay] ?? "不明";
  const parsedToday =
    todayHours !== "不明" ? parseHours(todayHours) : ({ type: "unknown" } as const);
  const isOpen = parsedToday.type !== "unknown" ? isCurrentlyOpen(parsedToday, currentTime) : false;
  const statusInfo = getStatusInfo(parsedToday, isOpen, todayHours);

  return {
    isOpen,
    currentStatus: statusInfo.text,
    statusType: statusInfo.type,
    todayHours,
    shouldShowTodayHours: statusInfo.shouldShowTodayHours,
  };
}
