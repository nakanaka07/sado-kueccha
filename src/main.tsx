import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary, LoadingScreen } from './components/ui';

// アプリケーションの遅延読み込み
const App = lazy(() => import('./app/App'));

// クリティカル CSS を優先読み込み
import './critical.css';

import { isDevelopment, isProduction, validateAppConfig } from './utils/env';
import { devOnly, logger, performanceLogger } from './utils/logger';
import { initializeApp as initializeAppValidation } from './utils/runtime-validation';

// 非クリティカル CSS の遅延読み込み（パフォーマンス最適化）
const loadNonCriticalStyles = (): void => {
  void import('./index.css').catch((error: unknown) => {
    devOnly.warn('Non-critical styles loading failed', error, 'main');
  });
};

// Pre-connect to external domains for performance
const preconnectToDomains = (): void => {
  const domains = [
    'https://maps.googleapis.com',
    'https://fonts.googleapis.com',
    'https://docs.google.com',
    'https://sheets.googleapis.com',
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
};

/**
 * 🚀 アプリケーションエントリーポイント
 * React 19 + Vite最適化 + Core Web Vitalsパフォーマンス重視設計
 *
 * @description
 * - React 19の最新機能とconcurrent rendering対応
 * - Core Web Vitals (LCP, INP, CLS) 最適化
 * - Service Worker統合による高速化
 * - エラー境界とパフォーマンス監視
 * - Code Splitting と遅延読み込み最適化
 */

// 🔍 環境変数の検証と初期化
const validateEnvironment = (): void => {
  try {
    // 新しいランタイム検証を実行
    initializeAppValidation();

    // 既存の検証も実行
    validateAppConfig();
  } catch (error) {
    devOnly.warn('Environment validation error', error, 'main');
    devOnly.warn(
      'アプリケーションが正常に動作しない可能性があります。.env ファイルを確認してください。',
      undefined,
      'main'
    );

    if (isProduction()) {
      logger.error(
        'Production environment validation failed',
        error instanceof Error ? error : undefined,
        'main'
      );
    }
  }
};

// 🚨 グローバルエラーハンドリング: 未処理のPromise拒否をキャッチ
const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
  logger.error(
    'Unhandled Promise Rejection',
    event.reason instanceof Error ? event.reason : undefined,
    'main'
  );

  // Core Web Vitalsに影響するエラーの追跡
  if (isProduction()) {
    // Error reporting will be integrated in future versions
  }

  // ユーザーエクスペリエンスを維持するため、エラーを隠す
  event.preventDefault();
};

// 🚨 グローバルエラーハンドリング: JavaScript実行時エラーをキャッチ
const handleError = (event: ErrorEvent): void => {
  const errorInfo = new Error(`JavaScript Error: ${event.message}`);
  errorInfo.name = 'JavaScriptError';

  logger.error('JavaScript Error', errorInfo, 'main');

  if (isProduction()) {
    // Error reporting will be integrated in future versions
  }
};

// グローバルエラーハンドラーの設定
window.addEventListener('unhandledrejection', handleUnhandledRejection);
window.addEventListener('error', handleError);

// 📊 パフォーマンス監視とCore Web Vitals追跡
if (isDevelopment()) {
  // React DevTools のパフォーマンストラッキングを有効化
  performanceLogger.start('app-initialization');

  // Web Vitals 測定開始マーク
  performance.mark('vitals-measurement-start');
}

// 🌐 Service Worker登録処理 (Vite PWA Plugin経由)
const registerServiceWorker = (): void => {
  // 開発環境またはService Worker非対応ブラウザではスキップ
  if (isDevelopment() || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // PWA機能の有効化（本番環境のみ）
    if (isProduction()) {
      // Service Workerの登録
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          logger.info(
            'Service Worker registered successfully',
            {
              scope: registration.scope,
            },
            'pwa'
          );

          // Service Workerの更新チェック
          registration.addEventListener('updatefound', () => {
            devOnly.info('Service Worker update found', undefined, 'pwa');
          });
        })
        .catch((error: unknown) => {
          logger.warn('Service Worker registration failed', error, 'pwa');
        });
    } else {
      devOnly.info('PWA機能は本番環境でのみ有効です', undefined, 'pwa');
    }
  } catch (error) {
    devOnly.warn('SW registration failed', error, 'main');
  }
};

// 🎯 Web Vitals測定の初期化 (本番環境のみ)
const initWebVitals = (): void => {
  if (!isProduction()) {
    return;
  }

  try {
    // LCP (Largest Contentful Paint) 測定
    // パフォーマンス監視（エラー時のみ出力）
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      // LCP計測のみ実行、ログ出力は開発環境のみ
      if (lcp?.startTime !== undefined && lcp.startTime > 2500) {
        devOnly.warn(
          'LCP遅延',
          { duration: Math.round(lcp.startTime) },
          'performance'
        );
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS監視（閾値超過時のみ）
    let clsValue = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        if (
          !layoutShift.hadRecentInput &&
          typeof layoutShift.value === 'number'
        ) {
          clsValue += layoutShift.value;
        }
      }
      // CLS計測のみ実行、ログ出力は開発環境のみ
      if (clsValue > 0.1) {
        devOnly.warn(
          'CLS閾値超過',
          { value: Math.round(clsValue * 1000) / 1000 },
          'performance'
        );
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // FID監視（遅延時のみ）
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const eventTiming = entry as PerformanceEntry & {
          processingStart?: number;
        };
        if (typeof eventTiming.processingStart === 'number') {
          const fid = eventTiming.processingStart - entry.startTime;
          // FID計測のみ実行、ログ出力は開発環境のみ
          if (fid > 100) {
            devOnly.warn(
              'FID遅延',
              { duration: Math.round(fid) },
              'performance'
            );
          }
        }
      }
    }).observe({ type: 'first-input', buffered: true });
  } catch (error) {
    // Performance Observer非対応ブラウザでは無視
    devOnly.warn('Performance Observer not supported', error, 'performance');
  }
};

// 🚀 アプリケーション初期化 (React 19 + 最新パフォーマンス最適化)
const initializeApp = (): void => {
  try {
    // Step 1: 環境変数の検証
    validateEnvironment();

    // Step 2: External domains の pre-connect とリソース最適化
    preconnectToDomains();

    // Step 3: 非クリティカル CSS を遅延読み込み
    setTimeout(() => {
      loadNonCriticalStyles();
    }, 100);

    // Step 4: ルート要素の取得と検証
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error(
        'Root element not found. Make sure there is an element with id="root" in your HTML.'
      );
    }

    // Step 5: 最適化されたデータプリロードを並行して開始（ノンブロッキング）
    void import('./services/preload').then(({ preloadManager }) => {
      preloadManager.startOptimizedPreload().catch((error: unknown) => {
        devOnly.warn('プリロード失敗', error, 'main');
      });
    });

    // Step 6: React 19 の createRoot API を使用
    const root = createRoot(rootElement);

    // Step 7: StrictMode で React の潜在的な問題を検出
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    );

    // Step 8: パフォーマンス測定 (開発環境)
    if (isDevelopment()) {
      performanceLogger.end('app-initialization');
    }

    // Step 9: Service Worker登録
    registerServiceWorker();

    // Step 10: Web Vitals測定初期化
    initWebVitals();
  } catch (error) {
    logger.error(
      'Failed to initialize application',
      error instanceof Error ? error : undefined,
      'main'
    );

    // フォールバック: シンプルなエラーメッセージを表示
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif;
          text-align: center;
          background: linear-gradient(135deg, #2792c3 0%, #65318e 100%);
          color: white;
          line-height: 1.6;
        ">
          <h1 style="margin-bottom: 1rem; font-size: 2rem;">佐渡で食えっちゃ</h1>
          <p style="margin-bottom: 2rem; opacity: 0.9;">アプリケーションの初期化に失敗しました</p>
          <button onclick="window.location.reload()" style="
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
          " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
             onmouseout="this.style.background='rgba(255,255,255,0.2)'">
            ページを再読み込み
          </button>
        </div>
      `;
    }
  }
};

// 🎯 DOMContentLoaded最適化アプローチ
// React 19 + Vite環境での最適なDOM初期化
if (document.readyState === 'loading') {
  // DOM読み込み中の場合、DOMContentLoadedイベントを待つ
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  // DOMが既に読み込まれている場合は即座に実行
  // パフォーマンス最適化：nextTickで実行してブロッキングを防ぐ
  if (typeof requestIdleCallback !== 'undefined') {
    // ブラウザがアイドル状態の時に実行（パフォーマンス最適化）
    requestIdleCallback(initializeApp, { timeout: 100 });
  } else {
    // requestIdleCallback非対応の場合はsetTimeoutで次のイベントループで実行
    setTimeout(initializeApp, 0);
  }
}
