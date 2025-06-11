import React from "react";
import { formatBusinessHours } from "../utils/businessHours";

interface BusinessHoursDisplayProps {
  businessHours: Record<string, string>;
}

export const BusinessHoursDisplay: React.FC<BusinessHoursDisplayProps> = ({ businessHours }) => {
  const hoursInfo = formatBusinessHours(businessHours);

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

  const statusType = getStatusType();

  return (
    <div className="business-hours">
      <div className="business-hours-status">
        <div className={`status-badge ${statusType}`}>
          <span className="status-icon">
            {statusType === "open" ? "🟢" : statusType === "closed" ? "🔴" : "⚪"}
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
