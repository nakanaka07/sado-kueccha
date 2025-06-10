import type { ParsedHours } from "../types/common";

// 営業時間関連の定数
export const BUSINESS_HOURS_CONSTANTS = {
  CLOSED_STATUSES: ["定休日", "休業", "-", "閉店", "不定休"],
  OPEN_24H_KEYWORDS: ["24時間", "24h", "終日"],
  DAY_NAMES: ["日", "月", "火", "水", "木", "金", "土"] as const,
} as const;

// 営業時間関連のユーティリティ関数
export class BusinessHoursUtils {
  // 時刻を数値に変換 (例: 14:30 -> 1430)
  static timeToNumber(hour: number, minute: number): number {
    return hour * 100 + minute;
  } // 営業時間文字列をパース
  static parseHours(hoursStr: string): ParsedHours {
    if (BUSINESS_HOURS_CONSTANTS.CLOSED_STATUSES.some((status) => hoursStr === status)) {
      return { type: "closed" };
    }

    if (BUSINESS_HOURS_CONSTANTS.OPEN_24H_KEYWORDS.some((keyword) => hoursStr.includes(keyword))) {
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
              start: this.timeToNumber(parseInt(start1H), parseInt(start1M)),
              end: this.timeToNumber(parseInt(end1H), parseInt(end1M)),
            },
            {
              start: this.timeToNumber(parseInt(start2H), parseInt(start2M)),
              end: this.timeToNumber(parseInt(end2H), parseInt(end2M)),
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
          start: this.timeToNumber(parseInt(startH), parseInt(startM)),
          end: this.timeToNumber(parseInt(endH), parseInt(endM)),
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
          start: this.timeToNumber(parseInt(startH), 0),
          end: this.timeToNumber(parseInt(endH), 0),
        };
      }
    }

    return { type: "unknown" };
  }

  // 現在営業中かどうかチェック
  static isCurrentlyOpen(parsedHours: ParsedHours, currentTime: number): boolean {
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

  // 営業状態のテキストを取得
  static getStatusText(parsedHours: ParsedHours, isOpen: boolean, todayHours: string): string {
    switch (parsedHours.type) {
      case "24h":
        return "24時間営業";
      case "closed":
        return "定休日";
      case "unknown":
        return todayHours !== "不明" ? `営業時間要確認 (${todayHours})` : "営業時間不明";
      default:
        return isOpen ? "営業中" : "営業時間外";
    }
  }

  // 営業時間データを整理
  static formatBusinessHours(businessHours: Record<string, string>) {
    const now = new Date();
    const currentDay = BUSINESS_HOURS_CONSTANTS.DAY_NAMES[now.getDay()];
    const currentTime = this.timeToNumber(now.getHours(), now.getMinutes());

    // データ形式を統一
    let hoursData: Record<string, string>;
    if (businessHours["general"]) {
      hoursData = {};
      businessHours["general"].split(",").forEach((entry) => {
        const match = entry.trim().match(/^([月火水木金土日祝]):?\s*(.+)$/);
        if (match?.[1] && match[2]) {
          hoursData[match[1]] = match[2].trim();
        }
      });
    } else {
      hoursData = businessHours;
    }
    const todayHours = currentDay ? (hoursData[currentDay] ?? "不明") : "不明";
    const parsedToday =
      todayHours !== "不明" ? this.parseHours(todayHours) : ({ type: "unknown" } as const);
    const isOpen =
      parsedToday.type !== "unknown" ? this.isCurrentlyOpen(parsedToday, currentTime) : false;

    return {
      isOpen,
      currentStatus: this.getStatusText(parsedToday, isOpen, todayHours),
      todayHours,
    };
  }
}
