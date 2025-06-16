import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import { getAppConfig, isDevelopment, isProduction, validateAppConfig } from "./utils/env";

/**
 * アプリケーションエントリーポイント
 * React 18の新機能とパフォーマンス最適化を適用
 */

// 環境変数の検証
const validateEnvironment = (): void => {
  try {
    validateAppConfig();
  } catch (error) {
    console.warn("⚠️ Environment validation error:", error);
    console.warn(
      "アプリケーションが正常に動作しない可能性があります。.env ファイルを確認してください。",
    );
  }
};

// エラーハンドリング: 未処理のPromise拒否をキャッチ
const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
  console.error("🚨 Unhandled Promise Rejection:", event.reason);

  if (isProduction()) {
    // TODO: エラーレポートサービスへの送信実装
  }

  event.preventDefault();
};

// エラーハンドリング: JavaScript実行時エラーをキャッチ
const handleError = (event: ErrorEvent): void => {
  console.error("🚨 JavaScript Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    error: event.error as Error | undefined,
  });

  if (isProduction()) {
    // TODO: エラーレポートサービスへの送信実装
  }
};

// グローバルエラーハンドラーの設定
window.addEventListener("unhandledrejection", handleUnhandledRejection);
window.addEventListener("error", handleError);

// パフォーマンス監視（開発環境のみ）
if (isDevelopment()) {
  // React DevTools のパフォーマンストラッキングを有効化
  window.performance.mark("app-start");
}

// Service Worker登録処理
const registerServiceWorker = async (): Promise<void> => {
  if (isDevelopment() || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const { app } = getAppConfig();
    const { baseUrl } = app;
    const swPath = `${baseUrl}sw.js`.replace(/\/+/g, "/");
    await navigator.serviceWorker.register(swPath);
  } catch (error) {
    console.warn("SW registration failed:", error);
  }
};

// アプリケーション初期化
const initializeApp = (): void => {
  try {
    // 環境変数の検証
    validateEnvironment();

    // ルート要素の取得と検証
    const rootElement = document.getElementById("root");

    if (!rootElement) {
      throw new Error(
        'Root element not found. Make sure there is an element with id="root" in your HTML.',
      );
    }

    // React 18 の createRoot API を使用
    const root = createRoot(rootElement);

    // StrictMode で React の潜在的な問題を検出
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );

    if (isDevelopment()) {
      // パフォーマンス測定
      window.performance.mark("app-rendered");
      window.performance.measure("app-initialization", "app-start", "app-rendered");
    }

    // Service Workerを登録
    void registerServiceWorker();
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);

    // フォールバック: シンプルなエラーメッセージを表示
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Hiragino Kaku Gothic ProN', sans-serif;
          text-align: center;
          background: linear-gradient(135deg, #2792c3 0%, #65318e 100%);
          color: white;
        ">
          <h1>佐渡で食えっちゃ</h1>
          <p>アプリケーションの初期化に失敗しました</p>
          <button onclick="window.location.reload()" style="
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            border-radius: 8px;
            color: white;
            cursor: pointer;
          ">ページを再読み込み</button>
        </div>
      `;
    }
  }
};

// DOM読み込み完了後にアプリケーションを初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOMが既に読み込まれている場合は即座に実行
  initializeApp();
}
