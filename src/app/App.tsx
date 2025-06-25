import type { FC, ReactElement } from 'react';
import { ErrorBoundary } from '../components/ui';
import { getCurrentEnvConfig } from './AppConfig';
import { AppContent } from './AppContent';
import { AppLayout } from './AppLayout';
import { AppProvider } from './AppProvider';

/**
 * @fileoverview メインアプリケーションコンポーネント
 * React 19 + TypeScript 2024-2025 ベストプラクティスに準拠
 *
 * **Phase 2 アーキテクチャ改善:**
 * - AppProvider による状態管理の中央化
 * - AppLayout による責任分離
 * - AppContent による機能分離
 * - エラーバウンダリの統合
 * - 設定の外部化
 *
 * @version 2.0.0 - アーキテクチャ改善版
 * @since 2025-06-25
 * @author React 19 Architecture Team
 */

/**
 * メインアプリケーションコンポーネント
 *
 * 佐渡観光マップアプリケーションのルートコンポーネント。
 * React 19の新機能とPhase 2アーキテクチャ改善を活用。
 *
 * @description
 * **Phase 2 アーキテクチャ改善:**
 * - AppProvider による状態管理の中央化
 * - AppLayout による責任分離
 * - AppContent による機能分離
 * - エラーバウンダリの統合
 * - 設定の外部化
 *
 * **React 19 最適化:**
 * - コンテキスト値のメモ化
 * - エラーハンドリングの改善
 * - パフォーマンス最適化
 *
 * **設計原則:**
 * - 単一責任原則
 * - 関心の分離
 * - 再利用性の向上
 * - テスタビリティの向上
 *
 * @example
 * ```tsx
 * // 基本的な使用法
 * function AppRoot() {
 *   return <App />;
 * }
 *
 * // カスタムエラーハンドリング付き
 * function AppRoot() {
 *   return (
 *     <ErrorProvider>
 *       <App />
 *     </ErrorProvider>
 *   );
 * }
 * ```
 *
 * @returns 完全なアプリケーション
 */
const App: FC = (): ReactElement => {
  return (
    <ErrorBoundary
      onError={(_error, _errorInfo) => {
        // React 19の改良されたエラーハンドリング
        // 本番環境では外部エラー監視サービス（Sentry、LogRocket等）に送信
        const envConfig = getCurrentEnvConfig();
        if (envConfig.enableDetailedErrorReporting) {
          // 開発環境での詳細エラー報告
          // 例: console.error('App Error:', error, errorInfo);
        } else {
          // 本番環境での最小限のエラー報告
          // 例: reportError(error, errorInfo);
          // 例: analytics.track('app_error', { error: error.message });
        }
      }}
    >
      <AppProvider>
        <AppLayout>
          <AppContent />
        </AppLayout>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
