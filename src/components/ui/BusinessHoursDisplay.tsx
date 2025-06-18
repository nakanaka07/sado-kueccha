import { memo } from "react";
import {
  useBusinessHours,
  useBusinessHoursAccessibility,
  useBusinessHoursTodayDisplay,
} from "../../hooks/useBusinessHours";
import "./BusinessHoursDisplay.css";

interface BusinessHoursDisplayProps {
  readonly businessHours: Record<string, string>;
  readonly className?: string;
  readonly showDetailedInfo?: boolean;
}

const BusinessHoursDisplayComponent = ({
  businessHours,
  className = "",
  showDetailedInfo = false,
}: BusinessHoursDisplayProps) => {
  // カスタムフックを使用して営業時間の状態を管理
  const businessHoursState = useBusinessHours({ businessHours });

  // アクセシビリティ属性の生成
  const statusBadgeProps = useBusinessHoursAccessibility(
    businessHoursState.statusType,
    businessHoursState.isOpen,
    businessHoursState.statusConfig,
  );

  // 今日の営業時間表示の生成
  const todayHoursDisplay = useBusinessHoursTodayDisplay(
    businessHoursState.shouldShowTodayHours,
    businessHoursState.todayHours,
  );

  return (
    <section
      className={`business-hours ${className}`.trim()}
      aria-labelledby="business-hours-heading"
      data-testid="business-hours-display"
      data-confidence={Math.round(businessHoursState.confidence * 100)}
    >
      <div className="business-hours-status">
        <div {...statusBadgeProps}>
          <span
            className="status-icon"
            aria-hidden="true"
            role="img"
            aria-label={`ステータスアイコン: ${businessHoursState.statusConfig.text}`}
          >
            {businessHoursState.statusConfig.icon}
          </span>
          <span className="status-text">{businessHoursState.currentStatus}</span>
        </div>

        {todayHoursDisplay ? (
          <div
            className="hours-info"
            aria-label={todayHoursDisplay.ariaLabel}
            data-testid={todayHoursDisplay.testId}
          >
            <span className="hours-label" aria-hidden="true">
              本日:
            </span>
            <time className="hours-value" dateTime={todayHoursDisplay.todayHours}>
              {todayHoursDisplay.todayHours}
            </time>
          </div>
        ) : null}

        {showDetailedInfo && businessHoursState.statusConfig.description ? (
          <div
            className="hours-description"
            aria-label={`詳細情報: ${businessHoursState.statusConfig.description}`}
          >
            {businessHoursState.statusConfig.description}
          </div>
        ) : null}
      </div>
    </section>
  );
};

// パフォーマンス最適化のためのメモ化エクスポート
export const BusinessHoursDisplay = memo(BusinessHoursDisplayComponent);
