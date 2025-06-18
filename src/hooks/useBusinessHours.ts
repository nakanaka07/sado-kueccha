/**
 * 🕒 営業時間管理カスタムフック
 * BusinessHoursDisplayコンポーネント用の状態管理と最適化
 */

import { useMemo } from "react";
import type { StatusConfig, StatusType } from "../types/poi";
import { formatBusinessHours, STATUS_CONFIG } from "../utils/businessHours";

interface UseBusinessHoursOptions {
  readonly businessHours: Record<string, string>;
}

interface BusinessHoursState {
  readonly isOpen: boolean;
  readonly currentStatus: string;
  readonly statusType: StatusType;
  readonly todayHours: string;
  readonly shouldShowTodayHours: boolean;
  readonly statusConfig: StatusConfig;
  readonly lastUpdated: Date;
  readonly confidence: number;
}

/**
 * 営業時間の状態管理カスタムフック
 * @param options - フックのオプション
 * @returns 営業時間の状態と操作関数
 */
export function useBusinessHours({ businessHours }: UseBusinessHoursOptions): BusinessHoursState {
  // 営業時間情報の計算（メモ化済み）
  const hoursInfo = useMemo(() => {
    try {
      return formatBusinessHours(businessHours);
    } catch (error) {
      console.warn("営業時間の解析中にエラーが発生しました:", error);
      return {
        isOpen: false,
        currentStatus: "営業時間不明",
        statusType: "unknown" as const,
        todayHours: "不明",
        shouldShowTodayHours: false,
      };
    }
  }, [businessHours]);

  // ステータス設定の取得
  const statusConfig = useMemo(() => STATUS_CONFIG[hoursInfo.statusType], [hoursInfo.statusType]);

  // 営業時間データの信頼度計算
  const confidence = useMemo(() => {
    const hasValidHours = Object.values(businessHours).some(
      (hours) => hours && hours !== "不明" && hours !== "-",
    );

    if (!hasValidHours) return 0;

    const totalDays = Object.keys(businessHours).length;
    const validDays = Object.values(businessHours).filter(
      (hours) => hours && hours !== "不明" && hours !== "-",
    ).length;

    return totalDays > 0 ? validDays / totalDays : 0;
  }, [businessHours]);

  // 最終更新時刻（現在時刻）
  const lastUpdated = useMemo(() => new Date(), []);

  return {
    isOpen: hoursInfo.isOpen,
    currentStatus: hoursInfo.currentStatus,
    statusType: hoursInfo.statusType,
    todayHours: hoursInfo.todayHours,
    shouldShowTodayHours: hoursInfo.shouldShowTodayHours,
    statusConfig,
    lastUpdated,
    confidence,
  };
}

/**
 * 営業時間の表示用属性を生成するカスタムフック
 * @param statusType - ステータスタイプ
 * @param isOpen - 営業中かどうか
 * @param statusConfig - ステータス設定
 * @returns アクセシビリティ属性
 */
export function useBusinessHoursAccessibility(
  statusType: StatusType,
  isOpen: boolean,
  statusConfig: StatusConfig,
) {
  return useMemo(
    () => ({
      className: `status-badge ${statusType}`,
      role: "status" as const,
      "aria-live": "polite" as const,
      "aria-label": statusConfig.ariaLabel,
      "data-status": statusType,
      "data-is-open": isOpen,
      "data-testid": "business-hours-status-badge",
    }),
    [statusType, isOpen, statusConfig.ariaLabel],
  );
}

/**
 * 営業時間の今日の表示コンテンツを生成するカスタムフック
 * @param shouldShow - 表示するかどうか
 * @param todayHours - 今日の営業時間
 * @returns 表示用JSX要素またはnull
 */
export function useBusinessHoursTodayDisplay(shouldShow: boolean, todayHours: string) {
  return useMemo(() => {
    if (!shouldShow || !todayHours) {
      return null;
    }

    return {
      todayHours,
      ariaLabel: `本日の営業時間: ${todayHours}`,
      testId: "business-hours-today",
    };
  }, [shouldShow, todayHours]);
}

/**
 * 営業時間データの検証を行うカスタムフック
 * @param businessHours - 営業時間データ
 * @returns 検証結果
 */
export function useBusinessHoursValidation(businessHours: Record<string, string>) {
  return useMemo(() => {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      completeness: 0,
    };

    const expectedDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const providedDays = Object.keys(businessHours);

    // 完全性チェック
    validation.completeness = providedDays.length / expectedDays.length;

    // 曜日の存在チェック
    const missingDays = expectedDays.filter((day) => !providedDays.includes(day));
    if (missingDays.length > 0) {
      validation.warnings.push(
        `営業時間が設定されていない曜日があります: ${missingDays.join(", ")}`,
      );
    }

    // 無効なデータのチェック
    Object.entries(businessHours).forEach(([day, hours]) => {
      if (!hours || hours.trim() === "") {
        validation.warnings.push(`${day}の営業時間が空です`);
      }
    });

    // 重大なエラーのチェック
    if (providedDays.length === 0) {
      validation.isValid = false;
      validation.errors.push("営業時間データが提供されていません");
    }

    return validation;
  }, [businessHours]);
}
