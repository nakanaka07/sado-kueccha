import type React from "react";
import { memo } from "react";
import "./AsyncWrapper.css";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * 非同期処理の共通化コンポーネント
 *
 * 特徴:
 * - ローディング、エラー、成功状態の統一管理
 * - リトライ機能
 * - 型安全性（Generics使用）
 * - カスタマイズ可能なコンポーネント
 * - アクセシビリティ対応
 */
interface AsyncWrapperProps<T> {
  /** 非同期データ */
  data: T | null | undefined;
  /** ローディング状態 */
  loading: boolean;
  /** エラー状態 */
  error: Error | string | null;
  /** 成功時の子コンポーネント */
  children: (data: T) => React.ReactNode;
  /** カスタムローディングコンポーネント */
  loadingComponent?: React.ReactNode;
  /** カスタムエラーコンポーネント */
  errorComponent?: (error: Error | string) => React.ReactNode;
  /** カスタム空状態コンポーネント */
  emptyComponent?: React.ReactNode;
  /** リトライ関数 */
  retryFn?: () => void;
  /** リトライボタンのテキスト */
  retryText?: string;
  /** ローディングメッセージ */
  loadingMessage?: string;
  /** 空状態メッセージ */
  emptyMessage?: string;
  /** テスト用ID */
  testId?: string;
}

const AsyncWrapperComponent = <T,>({
  data,
  loading,
  error,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  retryFn,
  retryText = "再試行",
  loadingMessage = "読み込み中...",
  emptyMessage = "データがありません",
  testId = "async-wrapper",
}: AsyncWrapperProps<T>): React.ReactElement => {
  // ローディング状態
  if (loading) {
    return (
      <div className="async-wrapper async-wrapper--loading" data-testid={`${testId}-loading`}>
        {loadingComponent || <LoadingSpinner message={loadingMessage} />}
      </div>
    );
  }

  // エラー状態
  if (error) {
    const errorMessage = typeof error === "string" ? error : error.message;

    if (errorComponent) {
      return (
        <div className="async-wrapper async-wrapper--error" data-testid={`${testId}-error`}>
          {errorComponent(error)}
        </div>
      );
    }

    return (
      <div className="async-wrapper async-wrapper--error" data-testid={`${testId}-error`}>
        <div className="async-wrapper__error">
          <div className="async-wrapper__error-icon" aria-hidden="true">
            ⚠️
          </div>
          <h3 className="async-wrapper__error-title">エラーが発生しました</h3>
          <p className="async-wrapper__error-message">{errorMessage}</p>
          {retryFn ? (
            <button onClick={retryFn} className="async-wrapper__retry" type="button">
              {retryText}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // 空状態
  if (!data) {
    if (emptyComponent) {
      return (
        <div className="async-wrapper async-wrapper--empty" data-testid={`${testId}-empty`}>
          {emptyComponent}
        </div>
      );
    }

    return (
      <div className="async-wrapper async-wrapper--empty" data-testid={`${testId}-empty`}>
        <div className="async-wrapper__empty">
          <div className="async-wrapper__empty-icon" aria-hidden="true">
            📭
          </div>
          <p className="async-wrapper__empty-message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  // 成功状態
  return (
    <div className="async-wrapper async-wrapper--success" data-testid={`${testId}-success`}>
      {children(data)}
    </div>
  );
};

/**
 * メモ化されたAsyncWrapperコンポーネント
 * パフォーマンス最適化のため、propsが変更された場合のみ再レンダリング
 */
export const AsyncWrapper = memo(AsyncWrapperComponent) as <T>(
  props: AsyncWrapperProps<T>,
) => React.ReactElement;

AsyncWrapperComponent.displayName = "AsyncWrapper";
