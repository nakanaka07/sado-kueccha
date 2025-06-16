import React from "react";
import { formatBusinessHours, STATUS_CONFIG } from "../utils/businessHours";

interface BusinessHoursDisplayProps {
  businessHours: Record<string, string>;
}

export const BusinessHoursDisplay: React.FC<BusinessHoursDisplayProps> = ({ businessHours }) => {
  const hoursInfo = formatBusinessHours(businessHours);

  return (
    <div className="business-hours">
      <div className="business-hours-status">
        {" "}
        <div className={`status-badge ${hoursInfo.statusType}`}>
          <span className="status-icon">{STATUS_CONFIG[hoursInfo.statusType].icon}</span>
          <span className="status-text">{hoursInfo.currentStatus}</span>
        </div>
        {hoursInfo.shouldShowTodayHours && (
          <div className="hours-info">本日: {hoursInfo.todayHours}</div>
        )}
      </div>
    </div>
  );
};
