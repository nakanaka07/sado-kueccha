import type { ErrorInfo, ReactNode } from "react";
import React from "react";
import "./ErrorBoundary.css";

// エラーの種類を分類するための型定義
export type ErrorType = "network" | "javascript" | "rendering" | "async" | "unknown";

// エラー情報を構造化するためのインターフェース
export interface StructuredError {
  type: ErrorType;
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: StructuredError) => ReactNode);
  onError?: (error: StructuredError, errorInfo: ErrorInfo) => void;
  enableErrorReporting?: boolean;
  maxRetryCount?: number;
  autoRetryDelay?: number;
  isolate?: boolean; // 他のコンポーネントへの影響を分離
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: StructuredError | null;
  retryCount: number;
  isRetrying: boolean;
}

// エラー分類のユーティリティ関数
const classifyError = (error: Error): ErrorType => {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || "";

  // ネットワークエラーの検出
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("cors") ||
    error.name === "NetworkError"
  ) {
    return "network";
  }

  // 非同期エラーの検出
  if (
    message.includes("promise") ||
    message.includes("async") ||
    stack.includes("async") ||
    error.name === "UnhandledPromiseRejectionWarning"
  ) {
    return "async";
  }

  // レンダリングエラーの検出
  if (
    message.includes("render") ||
    message.includes("component") ||
    stack.includes("render") ||
    stack.includes("reconciler")
  ) {
    return "rendering";
  }

  // JavaScriptエラー
  if (
    error.name === "TypeError" ||
    error.name === "ReferenceError" ||
    error.name === "SyntaxError"
  ) {
    return "javascript";
  }

  return "unknown";
};

// セッションIDを生成（セッション単位でエラーを追跡）
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// セッションIDをセッションストレージから取得または新規作成
const getOrCreateSessionId = (): string => {
  const stored = sessionStorage.getItem("error_boundary_session_id");
  if (stored) return stored;

  const newSessionId = generateSessionId();
  sessionStorage.setItem("error_boundary_session_id", newSessionId);
  return newSessionId;
};

// エラーを構造化された形式に変換
const structureError = (error: Error): StructuredError => {
  const structuredError: StructuredError = {
    type: classifyError(error),
    message: error.message,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: getOrCreateSessionId(),
  };

  // stackプロパティを条件付きで追加
  if (error.stack) {
    structuredError.stack = error.stack;
  }

  return structuredError;
};

// エラー報告サービス（実装例）
const reportErrorToService = (structuredError: StructuredError, errorInfo: ErrorInfo): void => {
  try {
    // ここに実際のエラー報告ロジックを実装
    // 例: Sentry, LogRocket, カスタムAPIエンドポイント等
    console.error("🚨 Error Report:", structuredError);
    console.error("Error Info:", errorInfo);

    // 本番環境での実装例
    if (process.env.NODE_ENV === "production") {
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ error: structuredError, errorInfo })
      // }).catch(console.error);
    }
  } catch (reportingError) {
    console.error("Error reporting failed:", reportingError);
  }
};

/**
 * 最新のReact 19パターンに基づく高度なErrorBoundary
 * - エラー分類とトラッキング
 * - 自動復旧機能
 * - 構造化ログ
 * - アクセシビリティ対応
 * - パフォーマンス最適化
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error) => <CustomErrorComponent error={error} />}
 *   onError={(error, errorInfo) => reportError(error, errorInfo)}
 *   enableErrorReporting={true}
 *   maxRetryCount={3}
 *   autoRetryDelay={2000}
 *   isolate={true}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const structuredError = structureError(error);
    // 次のレンダリングでフォールバックUIを表示
    return {
      hasError: true,
      error: structuredError,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const structuredError = structureError(error);

    // エラーログの出力
    console.error("ErrorBoundary caught an error:", structuredError, errorInfo);

    // カスタムエラーハンドラーがあれば実行
    this.props.onError?.(structuredError, errorInfo);

    // エラー報告サービスを有効にしている場合
    if (this.props.enableErrorReporting) {
      reportErrorToService(structuredError, errorInfo);
    }

    // 自動リトライ機能
    this.attemptAutoRetry();
  }

  override componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * 自動リトライ機能
   */
  private attemptAutoRetry = (): void => {
    const { maxRetryCount = 3, autoRetryDelay = 2000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetryCount) {
      this.setState({ isRetrying: true });

      this.retryTimeoutId = setTimeout(() => {
        this.setState((prevState) => ({
          hasError: false,
          error: null,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));
      }, autoRetryDelay);
    }
  }; /**
   * エラー状態をリセットする
   */
  private resetError = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  /**
   * ページを再読み込みしてエラー状態をクリア
   */
  private reloadPage = (): void => {
    window.location.reload();
  };

  /**
   * エラー種別のラベルを取得
   */
  private getErrorTypeLabel = (type: ErrorType): string => {
    const labels: Record<ErrorType, string> = {
      network: "ネットワークエラー",
      javascript: "JavaScriptエラー",
      rendering: "レンダリングエラー",
      async: "非同期処理エラー",
      unknown: "不明なエラー",
    };
    return labels[type];
  };

  override render(): ReactNode {
    const { hasError, error, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (fallback) {
        if (typeof fallback === "function") {
          return fallback(error);
        }
        return fallback;
      }

      // リトライ中の表示
      if (isRetrying) {
        return (
          <div
            className="error-boundary error-retrying"
            role="status"
            aria-live="polite"
            aria-label="エラーから復旧中"
          >
            <div className="error-content">
              <h2>復旧中...</h2>
              <p>エラーから自動復旧を試みています。しばらくお待ちください。</p>
              <div className="loading-spinner" aria-hidden="true" />
            </div>
          </div>
        );
      }

      // デフォルトのエラーUI
      return (
        <div
          className="error-boundary"
          role="alert"
          aria-labelledby="error-title"
          aria-describedby="error-description"
        >
          <div className="error-content">
            <h2 id="error-title">申し訳ございません。エラーが発生しました。</h2>
            <p id="error-description">ページを再読み込みしてもう一度お試しください。</p>

            {/* エラー種別の表示 */}
            <div className="error-type" aria-label={`エラー種別: ${error.type}`}>
              <span className={`error-badge error-badge--${error.type}`}>
                {this.getErrorTypeLabel(error.type)}
              </span>
            </div>

            {/* エラー詳細（開発環境のみ） */}
            {process.env.NODE_ENV === "development" && error.stack ? (
              <details className="error-details">
                <summary>エラー詳細</summary>
                <pre className="error-stack">
                  {error.message}
                  {error.stack ? `\n${error.stack}` : ""}
                </pre>
              </details>
            ) : null}

            <div className="error-actions">
              <button
                onClick={this.resetError}
                className="error-retry-button"
                type="button"
                aria-label="エラーをリセットして再試行"
              >
                再試行
              </button>
              <button
                onClick={this.reloadPage}
                className="error-reload-button"
                type="button"
                aria-label="ページを再読み込み"
              >
                ページを再読み込み
              </button>
            </div>

            {/* リトライ回数の表示 */}
            {this.state.retryCount > 0 && (
              <div className="retry-info" aria-live="polite">
                <small>再試行回数: {this.state.retryCount}</small>
              </div>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
