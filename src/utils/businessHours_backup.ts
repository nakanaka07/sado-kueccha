/**
 * 🕒 営業時間管理ユーティリティ
 * 最新のベストプラクティスに基づいた営業時間解析システム
 */

import type { ParsedHours, StatusConfig, StatusType } from "../types";

// 🎯 営業時間関連の定数（immutable設計）
export const BUSINESS_HOURS_CONSTANTS = {
  CLOSED_STATUSES: ["定休日", "休業", "-", "閉店", "不定休"] as const,
  OPEN_24H_KEYWORDS: ["24時間", "24h", "終日"] as const,
  DAY_NAMES: ["日", "月", "火", "水", "木", "金", "土"] as const,
  TIME_MULTIPLIER: 100 as const, // 時間を数値に変換する際の乗数
  MAX_HOUR: 24 as const,
  MAX_MINUTE: 59 as const,
  MINUTES_IN_HOUR: 60 as const,
} as const;

// 🎨 ステータス表示用の統合定数（アクセシビリティ準拠）
export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  open: {
    text: "営業中",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "現在営業中です。お立ち寄りいただけます。",
    priority: 1,
  },
  closed: {
    text: "定休日",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "本日は定休日です。営業しておりません。",
    priority: 2,
  },
  unknown: {
    text: "営業時間不明",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間が不明です。事前にお問い合わせください。",
    priority: 4,
  },
  "24h": {
    text: "24時間営業",
    icon: "🟢",
    colorClass: "status-open",
    ariaLabel: "24時間営業です。いつでもご利用いただけます。",
    priority: 0,
  },
  "time-outside": {
    text: "営業時間外",
    icon: "🔴",
    colorClass: "status-closed",
    ariaLabel: "現在営業時間外です。営業時間をご確認ください。",
    priority: 3,
  },
  "confirmation-needed": {
    text: "営業時間要確認",
    icon: "⚪",
    colorClass: "status-unknown",
    ariaLabel: "営業時間の確認が必要です。事前にお問い合わせください。",
    priority: 5,
  },
  "temporarily-closed": {
    text: "一時休業",
    icon: "🟠",
    colorClass: "status-temp-closed",
    ariaLabel: "一時的に休業中です。再開時期をご確認ください。",
    priority: 6,
  },
  "permanently-closed": {
    text: "閉店",
    icon: "🔴",
    colorClass: "status-permanent-closed",
    ariaLabel: "永続的に閉店しています。",
    priority: 7,
  },
  "opening-soon": {
    text: "まもなく営業開始",
    icon: "🟡",
    colorClass: "status-opening-soon",
    ariaLabel: "まもなく営業開始予定です。",
    priority: 1,
  },
  "closing-soon": {
    text: "まもなく営業終了",
    icon: "🟠",
    colorClass: "status-closing-soon",
    ariaLabel: "まもなく営業終了予定です。お急ぎください。",
    priority: 2,
  },
} as const;

/**
 * 🔒 時間値のバリデーション（厳密チェック）
 * @param hour - 検証する時間
 * @param minute - 検証する分
 * @returns 有効な時間の場合true
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

/**
 * 🕰️ 時刻を数値に変換（高精度版）
 * @param hour - 時間
 * @param minute - 分
 * @returns 数値化された時刻（例: 14:30 -> 1430）
 * @throws 無効な時刻の場合エラー
 */
export function timeToNumber(hour: number, minute: number): number {
  if (!validateTime(hour, minute)) {
    throw new Error(
      `⚠️ 無効な時刻です: ${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
    );
  }
  return hour * BUSINESS_HOURS_CONSTANTS.TIME_MULTIPLIER + minute;
}

/**
 * 🔢 数値を時刻に変換
 * @param timeNumber - 数値化された時刻
 * @returns 時間と分のオブジェクト
 */
export function numberToTime(timeNumber: number): { hour: number; minute: number } {
  const hour = Math.floor(timeNumber / BUSINESS_HOURS_CONSTANTS.TIME_MULTIPLIER);
  const minute = timeNumber % BUSINESS_HOURS_CONSTANTS.TIME_MULTIPLIER;
  return { hour, minute };
}

/**
 * 🛡️ 安全な文字列から数値への変換
 * @param value - 変換する文字列
 * @returns 変換された数値またはnull
 */
function safeParseInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * 🧩 時間文字列のパース（統合・高性能版）
 * 複数の時間帯形式に対応し、エラーハンドリングを強化
 * @param hoursStr - パース対象の時間文字列
 * @returns パース結果またはnull
 */
function parseTimeString(hoursStr: string): ParsedHours | null {
  if (!hoursStr.trim()) return null;

  const normalizedStr = hoursStr.trim().replace(/\s+/g, " ");

  // 複数時間帯のパターン（例：9:00-12:00 13:00-17:00）
  const multipleTimePattern = /(\d{1,2}):(\d{2})\s*[-~〜]\s*(\d{1,2}):(\d{2})/g;
  const multipleMatches = Array.from(normalizedStr.matchAll(multipleTimePattern));

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
          continue; // 無効な時間の場合はスキップ
        }
      }
    }

    if (periods.length >= 2) {
      return { type: "multiple", periods };
    }
  }

  // 通常の営業時間パターン（改良版）
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*[-~〜ー]\s*(\d{1,2}):(\d{2})/, // 9:00-17:00
    /(\d{1,2}):(\d{2})\s*[-~〜ー]\s*(\d{1,2})/, // 9:00-17（分省略）
    /(\d{1,2})\s*[-~〜ー]\s*(\d{1,2}):(\d{2})/, // 9-17:00（開始分省略）
    /(\d{1,2})\s*[-~〜ー]\s*(\d{1,2})/, // 9-17（両方分省略）
    /(\d{1,2})時\s*[-~〜ー]\s*(\d{1,2})時/, // 9時-17時
  ] as const;

  for (const pattern of timePatterns) {
    const match = normalizedStr.match(pattern);
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
          continue; // 無効な時間の場合は次のパターンを試行
        }
      }
    }
  }

  return null;
}

/**
 * 🕒 営業時間文字列をパース（メイン関数）
 * @param hoursStr - パース対象の営業時間文字列
 * @returns パース済み営業時間情報
 */
export function parseHours(hoursStr: string): ParsedHours {
  if (!hoursStr.trim()) {
    return { type: "unknown" };
  }

  const normalizedStr = hoursStr.trim();

  // 定休日判定（大文字小文字を区別しない）
  if (
    BUSINESS_HOURS_CONSTANTS.CLOSED_STATUSES.some((status) =>
      normalizedStr.toLowerCase().includes(status.toLowerCase()),
    )
  ) {
    return { type: "closed" };
  }

  // 24時間営業判定
  if (
    BUSINESS_HOURS_CONSTANTS.OPEN_24H_KEYWORDS.some((keyword) => normalizedStr.includes(keyword))
  ) {
    return { type: "24h" };
  }

  // 統合された時間パース処理を使用
  const result = parseTimeString(normalizedStr);
  return result ?? { type: "unknown" };
}

/**
 * 🔍 現在営業中かどうかチェック（高性能版）
 * @param parsedHours - パース済み営業時間
 * @param currentTime - 現在時刻（数値）
 * @returns 営業中の場合true
 */
export function isCurrentlyOpen(parsedHours: ParsedHours, currentTime: number): boolean {
  /**
   * 時間範囲内の判定（日跨ぎ対応）
   * @param start - 開始時刻
   * @param end - 終了時刻
   * @returns 時間範囲内の場合true
   */
  const isInPeriod = (start: number, end: number): boolean => {
    // 日跨ぎの場合（例: 22:00-06:00）
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
    default: {
      // TypeScriptの網羅性チェックで未定義のケースを検出
      return false;
    }
  }
}

/**
 * 🎭 営業状態のテキストとタイプを取得（強化版）
 * @param parsedHours - パース済み営業時間
 * @param isOpen - 現在営業中かどうか
 * @param todayHours - 本日の営業時間文字列
 * @returns ステータス情報
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
      if (todayHours !== "不明" && todayHours.trim()) {
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
        shouldShowTodayHours: !isOpen && todayHours !== "不明" && Boolean(todayHours.trim()),
      };
  }
}

/**
 * 🎨 ステータス設定を取得
 * @param statusType - ステータスタイプ
 * @returns ステータス設定
 */
export function getStatusConfig(statusType: StatusType): StatusConfig {
  return STATUS_CONFIG[statusType];
}

/**
 * ⏰ 現在時刻を取得（テスト可能にするため分離）
 * @returns 現在の曜日と時刻
 */
export function getCurrentTime(): { day: string; time: number } {
  const now = new Date();
  const currentDay = BUSINESS_HOURS_CONSTANTS.DAY_NAMES[now.getDay()] ?? "日";
  const currentTime = timeToNumber(now.getHours(), now.getMinutes());
  return { day: currentDay, time: currentTime };
}

/**
 * 📊 営業時間データの形式を統一（エラーハンドリング強化版）
 * @param businessHours - 営業時間データ
 * @returns 正規化された営業時間データ
 */
function normalizeBusinessHoursData(businessHours: Record<string, string>): Record<string, string> {
  if (businessHours.general?.trim()) {
    const hoursData: Record<string, string> = {};
    try {
      businessHours.general.split(",").forEach((entry) => {
        const match = /^([月火水木金土日祝]):?\s*(.+)$/.exec(entry.trim());
        if (match?.[1]?.trim() && match[2]?.trim()) {
          hoursData[match[1].trim()] = match[2].trim();
        }
      });
      return Object.keys(hoursData).length > 0 ? hoursData : businessHours;
    } catch {
      return businessHours;
    }
  }
  return businessHours;
}

/**
 * 🏪 営業時間データを整理（責任を分割して簡素化）
 * @param businessHours - 営業時間データ
 * @returns フォーマット済み営業時間情報
 */
export function formatBusinessHours(businessHours: Record<string, string>) {
  const { day: currentDay, time: currentTime } = getCurrentTime();
  const hoursData = normalizeBusinessHoursData(businessHours);

  const todayHours = hoursData[currentDay]?.trim() ?? "不明";
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

/**
 * 🕰️ 次の営業開始/終了時刻を取得（新機能）
 * @param parsedHours - パース済み営業時間
 * @param currentTime - 現在時刻
 * @returns 次の状態変更時刻
 */
export function getNextStatusChange(
  parsedHours: ParsedHours,
  currentTime: number,
): { nextTime: number | null; isOpening: boolean } | null {
  if (
    parsedHours.type === "24h" ||
    parsedHours.type === "closed" ||
    parsedHours.type === "unknown"
  ) {
    return null;
  }

  // Type guard for periods
  interface NormalPeriod {
    readonly start: number;
    readonly end: number;
  }

  const periods: readonly NormalPeriod[] =
    parsedHours.type === "multiple"
      ? parsedHours.periods
      : parsedHours.type === "normal"
      ? [{ start: parsedHours.start, end: parsedHours.end }]
      : [];

  if (periods.length === 0) {
    return null;
  }

  // 現在営業中の場合は次の終了時刻を探す
  for (const period of periods) {
    if (currentTime >= period.start && currentTime <= period.end) {
      return { nextTime: period.end, isOpening: false };
    }
  }

  // 営業時間外の場合は次の開始時刻を探す
  const nextOpenTime = periods
    .filter((period) => period.start > currentTime)
    .sort((a, b) => a.start - b.start)[0];

  if (nextOpenTime) {
    return { nextTime: nextOpenTime.start, isOpening: true };
  }

  // 翌日の最初の営業時間
  const sortedPeriods = [...periods].sort((a, b) => a.start - b.start);
  const firstPeriod = sortedPeriods[0];
  if (firstPeriod) {
    return { nextTime: firstPeriod.start + 2400, isOpening: true }; // 翌日
  }

  return null;
}

/**
 * 📈 営業時間の統計情報を取得（新機能）
 * @param businessHours - 営業時間データ
 * @returns 統計情報
 */
export function getBusinessHoursStats(businessHours: Record<string, string>) {
  const hoursData = normalizeBusinessHoursData(businessHours);
  const days = Object.keys(hoursData);

  let openDays = 0;
  let closedDays = 0;
  let twentyFourHourDays = 0;
  let unknownDays = 0;

  days.forEach((day) => {
    const parsed = parseHours(hoursData[day] ?? "");
    switch (parsed.type) {
      case "normal":
      case "multiple":
        openDays++;
        break;
      case "closed":
        closedDays++;
        break;
      case "24h":
        twentyFourHourDays++;
        break;
      case "unknown":
        unknownDays++;
        break;
    }
  });

  return {
    totalDays: days.length,
    openDays,
    closedDays,
    twentyFourHourDays,
    unknownDays,
    openingRate: days.length > 0 ? (openDays + twentyFourHourDays) / days.length : 0,
  };
}
