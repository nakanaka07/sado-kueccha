/**
 * シンプルな営業時間管理ユーティリティ
 */

import type { ParsedHours, StatusType } from "../types";

/**
 * 基本的なステータス設定
 */
export const STATUS_CONFIG = {
  open: {
    text: "営業中",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "現在営業中です",
    priority: 10,
    description: "現在営業中",
  },
  closed: {
    text: "定休日",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "定休日です",
    priority: 5,
    description: "本日は定休日",
  },
  unknown: {
    text: "営業時間不明",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間が不明です",
    priority: 1,
    description: "営業時間要確認",
  },
  "24h": {
    text: "24時間営業",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "24時間営業中です",
    priority: 10,
    description: "24時間営業",
  },
  "time-outside": {
    text: "営業時間外",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "営業時間外です",
    priority: 6,
    description: "営業時間外",
  },
  "confirmation-needed": {
    text: "営業時間要確認",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間の確認が必要です",
    priority: 2,
    description: "営業時間要確認",
  },
  "temporarily-closed": {
    text: "一時休業",
    icon: "🟠",
    colorClass: "status-temp-closed",
    ariaLabel: "一時休業中です",
    priority: 4,
    description: "一時的に休業中",
  },
  "permanently-closed": {
    text: "閉店",
    icon: "🔴",
    colorClass: "status-permanent-closed",
    ariaLabel: "閉店しています",
    priority: 0,
    description: "閉店済み",
  },
  "opening-soon": {
    text: "まもなく営業開始",
    icon: "🟡",
    colorClass: "status-opening-soon",
    ariaLabel: "まもなく営業開始です",
    priority: 8,
    description: "まもなく営業開始",
  },
  "closing-soon": {
    text: "まもなく営業終了",
    icon: "🟠",
    colorClass: "status-closing-soon",
    ariaLabel: "まもなく営業終了です",
    priority: 7,
    description: "まもなく営業終了",
  },
} as const;

/**
 * 時間文字列をパース
 */
export function parseTimeString(timeStr: string): ParsedHours | null {
  if (!timeStr || timeStr === "-") return { type: "unknown" };

  // 24時間営業
  if (timeStr.includes("24時間") || timeStr.includes("24h")) {
    return { type: "24h" };
  }

  // 定休日
  if (["定休日", "休業", "閉店"].some((keyword) => timeStr.includes(keyword))) {
    return { type: "closed" };
  }

  // 基本的な時間パターン（例: "09:00-18:00"）
  const timePattern = /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/;
  const match = timePattern.exec(timeStr);

  if (match) {
    const startHour = parseInt(match[1] || "0", 10);
    const startMin = parseInt(match[2] || "0", 10);
    const endHour = parseInt(match[3] || "0", 10);
    const endMin = parseInt(match[4] || "0", 10);

    const start = startHour * 100 + startMin;
    const end = endHour * 100 + endMin;

    return { type: "normal", start, end };
  }

  return { type: "irregular", note: timeStr };
}

/**
 * 現在営業中かチェック
 */
export function isCurrentlyOpen(hours: ParsedHours): StatusType {
  switch (hours.type) {
    case "24h":
      return "24h";
    case "closed":
      return "closed";
    case "unknown":
      return "unknown";
    case "normal": {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();

      if (currentTime >= hours.start && currentTime <= hours.end) {
        return "open";
      }
      return "time-outside";
    }
    case "multiple": {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();

      for (const period of hours.periods) {
        if (currentTime >= period.start && currentTime <= period.end) {
          return "open";
        }
      }
      return "time-outside";
    }
    case "irregular":
      return "confirmation-needed";
    default:
      return "unknown";
  }
}

/**
 * 営業時間の表示テキストを取得
 */
export function getBusinessHoursText(hours: ParsedHours): string {
  switch (hours.type) {
    case "24h":
      return "24時間営業";
    case "closed":
      return "定休日";
    case "unknown":
      return "営業時間不明";
    case "normal":
      return `${formatTime(hours.start)}-${formatTime(hours.end)}`;
    case "multiple":
      return hours.periods.map((p) => `${formatTime(p.start)}-${formatTime(p.end)}`).join(", ");
    case "irregular":
      return hours.note;
    default:
      return "営業時間不明";
  }
}

/**
 * 数値時間を文字列にフォーマット
 */
function formatTime(time: number): string {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * 営業ステータスの表示設定を取得
 */
export function getStatusConfig(status: StatusType) {
  return STATUS_CONFIG[status];
}

/**
 * 営業時間の詳細情報を生成
 */
export function formatBusinessHours(businessHours: Record<string, string>) {
  const today = new Date().getDay();
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const todayKey = dayNames[today] as string;

  // 安全にオブジェクトプロパティにアクセス
  const todayHours = (businessHours[todayKey] as string | undefined) ?? "不明";

  const parsed = parseTimeString(todayHours);
  const statusType = parsed ? isCurrentlyOpen(parsed) : "unknown";

  return {
    isOpen: statusType === "open" || statusType === "24h",
    currentStatus: STATUS_CONFIG[statusType].text,
    statusType,
    todayHours: parsed ? getBusinessHoursText(parsed) : "営業時間不明",
    shouldShowTodayHours: Boolean(todayHours && todayHours !== "不明" && todayHours !== "-"),
  };
}

/**
 * 簡易的な営業時間テキスト生成
 */
export function formatBusinessHoursText(hoursStr: string): string {
  const parsed = parseTimeString(hoursStr);
  return parsed ? getBusinessHoursText(parsed) : "営業時間不明";
}
