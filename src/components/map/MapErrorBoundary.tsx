/**
 * Google Maps専用エラーバウンダリー
 * Maps API特有のエラーハンドリングに特化
 *
 * @version 1.0.0
 * @since 2025-06-30
 */

import { Component, type ReactNode } from 'react';
import './MapErrorBoundary.css';

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error | null) => ReactNode;
  className?: string;
}

/**
 * Google Maps API特有のエラーを処理する専用エラーバウンダリー
 */
export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<MapErrorBoundaryState> {
    // エラーの種類を判定
    const errorMessage = error.message.toLowerCase();

    let errorInfo = 'Google Maps の読み込みに失敗しました。';

    if (errorMessage.includes('referernotallowedmaperror')) {
      errorInfo =
        'Google Maps API のリファラー制限エラーが発生しました。\n' +
        '開発時は Google Cloud Console で以下のURLを許可してください：\n' +
        '- https://localhost:5174\n' +
        '- http://localhost:5174\n' +
        '- https://localhost:5173\n' +
        '- http://localhost:5173';
    } else if (errorMessage.includes('invalidkeymaperror')) {
      errorInfo =
        'Google Maps API キーが無効です。環境変数を確認してください。';
    } else if (errorMessage.includes('quotaexceededmaperror')) {
      errorInfo =
        'Google Maps API の利用制限に達しました。しばらく時間をおいて再試行してください。';
    } else if (errorMessage.includes('networkerror')) {
      errorInfo =
        'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    }

    return {
      hasError: true,
      error,
      errorInfo,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 開発環境でのエラーログ
    if (process.env.NODE_ENV === 'development') {
      console.error('[MapErrorBoundary] Google Maps Error:', error);
      console.error('[MapErrorBoundary] Error Info:', errorInfo);
    }

    // 本番環境での分析サービスへの送信（将来的に実装）
    // this.sendErrorToAnalytics(error, errorInfo);
  }

  /**
   * エラー状態をリセット
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, className = 'map-container' } = this.props;

    if (hasError) {
      // カスタムフォールバックが提供されている場合
      if (fallback) {
        return fallback(error);
      }

      // デフォルトのエラー表示
      return (
        <div className={className}>
          <div className="map-error-boundary">
            <div className="error-content">
              <div className="error-icon">🗺️</div>
              <h3 className="error-title">地図の読み込みに失敗しました</h3>
              <p className="error-message">{errorInfo}</p>
              <div className="error-actions">
                <button
                  type="button"
                  onClick={this.resetError}
                  className="retry-button"
                >
                  再試行
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="reload-button"
                >
                  ページを再読み込み
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && error ? (
                <details className="error-details">
                  <summary>詳細なエラー情報（開発環境のみ）</summary>
                  <pre className="error-stack">
                    {error.name}: {error.message}
                    {error.stack ? `\n${error.stack}` : null}
                  </pre>
                </details>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
