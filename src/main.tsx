import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getAppConfig, isDevelopment, isProduction, validateAppConfig } from "./utils/env";
import App from "./App.tsx";
import "./index.css";

/**
 * アプリケーションエントリーポイント
 * React 18の新機能とパフォーマンス最適化を適用
 */

// 環境変数の検証
const validateEnvironment = (): void => {
  try {
    validateAppConfig();
    if (isDevelopment()) {
      console.log("✅ All required environment variables are present");
    }
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

  // 開発環境では詳細なエラー情報を表示
  if (isDevelopment()) {
    try {
      const errorWithStack = event.reason as Error;
      console.error("Stack trace:", errorWithStack.stack);
    } catch {
      // スタックトレースの取得に失敗した場合は無視
    }
  }

  // 本番環境ではエラーレポートサービスに送信（例: Sentry）
  if (isProduction()) {
    // TODO: エラーレポートサービスへの送信実装
    // reportError(event.reason);
  }

  event.preventDefault(); // デフォルトのエラー処理を防ぐ
};

// エラーハンドリング: JavaScript実行時エラーをキャッチ
const handleError = (event: ErrorEvent): void => {
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error as Error | undefined,
  };

  console.error("🚨 JavaScript Error:", errorInfo);

  // 本番環境ではエラーレポートサービスに送信
  if (isProduction()) {
    // TODO: エラーレポートサービスへの送信実装
    // reportError(errorInfo.error);
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
  // 開発環境ではService Workerを無効化（Viteの制限のため）
  if (isDevelopment()) {
    console.log("🔧 Service Worker is disabled in development mode");
    return;
  }

  if ("serviceWorker" in navigator) {
    try {
      // Base URLを考慮したService Workerパス
      const { baseUrl } = getAppConfig();
      const swPath = `${baseUrl}sw.js`.replace(/\/+/g, "/"); // 重複スラッシュを除去

      const registration = await navigator.serviceWorker.register(swPath);

      console.log("✅ Service Worker registered successfully:", registration);
    } catch (error) {
      console.warn("SW registration failed:", error);
    }
  } else {
    console.log("Service Worker is not supported in this browser");
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
    // 開発環境でのみ有効（本番では自動的に無効化される）
    // 開発環境での重複実行を防ぐため、条件付きで適用
    const AppComponent = isDevelopment() ? (
      <App />
    ) : (
      <StrictMode>
        <App />
      </StrictMode>
    );

    root.render(AppComponent);

    if (isDevelopment()) {
      console.log("🚀 佐渡で食えっちゃ アプリケーション起動完了");
    }

    // パフォーマンス測定（開発環境のみ）
    if (isDevelopment()) {
      window.performance.mark("app-rendered");
      window.performance.measure("app-initialization", "app-start", "app-rendered");

      // 初期化時間をログ出力
      const measures = window.performance.getEntriesByName("app-initialization");
      if (measures.length > 0 && measures[0]) {
        const duration = measures[0].duration;
        console.log(`⚡ App initialization took ${Math.round(duration).toString()}ms`);
      }
    }

    // Service Workerを登録
    void registerServiceWorker();
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);

    // フォールバック: エラーメッセージを表示
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
          font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
          text-align: center;
          background: linear-gradient(135deg, #2792c3 0%, #65318e 100%);
          color: white;
        ">
          <h1 style="margin-bottom: 1rem; font-size: 2rem;">佐渡で食えっちゃ</h1>
          <p style="margin-bottom: 1rem; font-size: 1.1rem;">
            アプリケーションの初期化に失敗しました
          </p>
          <p style="margin-bottom: 2rem; color: rgba(255,255,255,0.8);">
            ページを再読み込みしてみてください
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              padding: 0.75rem 1.5rem;
              background: rgba(255,255,255,0.2);
              border: 2px solid white;
              border-radius: 8px;
              color: white;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
          >
            ページを再読み込み
          </button>
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
