import type React from "react";
import { memo, useCallback } from "react";
import "./InfoPanel.css";

/**
 * 汎用情報表示パネルコンポーネント
 *
 * 特徴:
 * - 再利用可能な情報パネル
 * - サイズとポジション対応
 * - アクセシビリティ対応
 * - キーボードナビゲーション対応
 * - カスタマイズ可能なスタイル
 */
interface InfoPanelProps {
  /** パネルのタイトル */
  title?: string;
  /** パネルの内容 */
  children: React.ReactNode;
  /** クローズボタンのクリックハンドラー */
  onClose?: () => void;
  /** カスタムクラス名 */
  className?: string;
  /** パネルのサイズ */
  size?: "small" | "medium" | "large";
  /** パネルの位置 */
  position?: "center" | "top" | "bottom" | "left" | "right";
  /** テスト用ID */
  testId?: string;
  /** ARIA属性 */
  "aria-label"?: string;
  /** パネルの役割 */
  role?: "dialog" | "region" | "complementary";
}

const InfoPanelComponent: React.FC<InfoPanelProps> = ({
  title,
  children,
  onClose,
  className = "",
  size = "medium",
  position = "center",
  testId = "info-panel",
  "aria-label": ariaLabel,
  role = "region",
}) => {
  const panelClasses = ["info-panel", `info-panel--${size}`, `info-panel--${position}`, className]
    .filter(Boolean)
    .join(" ");

  // キーボード操作でのクローズ処理
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      className={panelClasses}
      role={role}
      aria-label={ariaLabel || title || "Information panel"}
      data-testid={testId}
      onKeyDown={role === "dialog" ? handleKeyDown : undefined}
      tabIndex={role === "dialog" ? -1 : undefined}
    >
      {title || onClose ? (
        <div className="info-panel__header">
          {title ? (
            <h3 className="info-panel__title" id={`${testId}-title`}>
              {title}
            </h3>
          ) : null}
          {onClose ? (
            <button
              className="info-panel__close"
              onClick={onClose}
              aria-label="パネルを閉じる"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="info-panel__content" aria-labelledby={title ? `${testId}-title` : undefined}>
        {children}
      </div>
    </div>
  );
};

/**
 * メモ化されたInfoPanelコンポーネント
 * パフォーマンス最適化のため、propsが変更された場合のみ再レンダリング
 */
export const InfoPanel = memo(InfoPanelComponent);

InfoPanelComponent.displayName = "InfoPanel";
