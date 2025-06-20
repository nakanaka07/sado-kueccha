import type React from "react";
import { memo } from "react";
import "./LoadingSpinner.css";

/**
 * 統一されたローディングスピナーコンポーネント
 *
 * 特徴:
 * - サイズ対応（small, medium, large）
 * - 進捗表示対応
 * - オーバーレイ対応
 * - アクセシビリティ対応（ARIA属性）
 * - TypeScript strict mode対応
 */
interface LoadingSpinnerProps {
  /** スピナーのサイズ */
  size?: "small" | "medium" | "large";
  /** ローディングメッセージ */
  message?: string;
  /** 進捗率（0-100） */
  progress?: number;
  /** オーバーレイ表示 */
  overlay?: boolean;
  /** テスト用ID */
  testId?: string;
  /** カスタムクラス名 */
  className?: string;
}

const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message,
  progress,
  overlay = false,
  testId = "loading-spinner",
  className = "",
}) => {
  const spinnerClasses = [
    "loading-spinner",
    `loading-spinner--${size}`,
    overlay && "loading-spinner--overlay",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={spinnerClasses}
      role="status"
      aria-live="polite"
      aria-label={message || "コンテンツを読み込み中"}
      data-testid={testId}
    >
      <div className="loading-spinner__icon" aria-hidden="true">
        <div className="loading-spinner__circle" />
      </div>

      {message ? <p className="loading-spinner__message">{message}</p> : null}

      {progress !== undefined && (
        <div className="loading-spinner__progress" aria-label={`進捗: ${progress}%`}>
          <div
            className="loading-spinner__progress-bar"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
          <span className="loading-spinner__progress-text" aria-hidden="true">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * メモ化されたLoadingSpinnerコンポーネント
 * パフォーマンス最適化のため、propsが変更された場合のみ再レンダリング
 */
export const LoadingSpinner = memo(LoadingSpinnerComponent);

LoadingSpinnerComponent.displayName = "LoadingSpinner";
