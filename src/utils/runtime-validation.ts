/**
 * 🚨 アプリケーション実行時エラーハンドリング
 * プロダクション環境での環境変数未定義エラーを早期検出・対処
 */

import { getAppConfig } from './env';

/**
 * アプリケーション起動時の環境変数検証
 */
export const validateRuntimeEnvironment = (): void => {
  try {
    // 設定を取得してみる（エラーがあれば ここで発生）
    const config = getAppConfig();

    // Google Maps APIキーの検証
    if (!config.maps.apiKey) {
      console.error('❌ Google Maps APIキーが設定されていません');
      throw new Error(
        "Cannot read properties of undefined (reading 'VITE_GOOGLE_MAPS_API_KEY')"
      );
    }

    // 本番環境での追加検証
    if (import.meta.env.PROD) {
      if (config.maps.apiKey.length < 20) {
        console.warn(
          '⚠️ Google Maps APIキーが短すぎます。正しいキーを設定してください'
        );
      }
    }

    // 開発環境でのみログ出力
    if (import.meta.env.DEV) {
      console.warn('✅ 環境変数の検証が完了しました');
    }
  } catch (error) {
    console.error('🔥 環境変数の検証でエラーが発生しました:', error);

    // 開発環境では詳細なエラー情報を表示
    if (import.meta.env.DEV) {
      console.error('🔍 デバッグ情報');
      console.error('import.meta.env:', import.meta.env);
      console.error('現在の環境:', import.meta.env.MODE);
    }

    // エラーを再throw
    throw error;
  }
};

/**
 * グローバルエラーハンドラーの設定
 */
export const setupGlobalErrorHandlers = (): void => {
  // 未処理の JavaScript エラー
  window.addEventListener('error', event => {
    console.error('🚨 グローバルエラー:', event.error);

    // 環境変数関連のエラーの場合は特別な処理
    try {
      const error = event.error as Error;
      const errorStack = error.stack;
      if (
        typeof errorStack === 'string' &&
        errorStack.includes('VITE_GOOGLE_MAPS_API_KEY')
      ) {
        console.error(
          '💡 解決方法: .envファイルにVITE_GOOGLE_MAPS_API_KEY=your_api_keyを設定してください'
        );
      }
    } catch {
      // エラーの詳細取得に失敗した場合は無視
    }
  });

  // 未処理の Promise rejection
  window.addEventListener('unhandledrejection', event => {
    console.error('🚨 未処理のPromise rejection:', event.reason);

    // 環境変数関連のエラーの場合は特別な処理
    try {
      const reason = event.reason as Error;
      const reasonMessage = reason.message;
      if (
        typeof reasonMessage === 'string' &&
        reasonMessage.includes('VITE_GOOGLE_MAPS_API_KEY')
      ) {
        console.error(
          '💡 解決方法: .envファイルにVITE_GOOGLE_MAPS_API_KEY=your_api_keyを設定してください'
        );
      }
    } catch {
      // エラーの詳細取得に失敗した場合は無視
    }
  });
};

/**
 * ライフサイクルフックでの検証
 */
export const initializeApp = (): void => {
  try {
    // エラーハンドラーの設定
    setupGlobalErrorHandlers();

    // 環境変数の検証
    validateRuntimeEnvironment();

    // 開発環境でのみログ出力
    if (import.meta.env.DEV) {
      console.warn('🚀 アプリケーションの初期化が完了しました');
    }
  } catch (error) {
    console.error('💥 アプリケーションの初期化に失敗しました:', error);

    // ユーザーにわかりやすいエラーメッセージを表示
    if (import.meta.env.DEV) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 1rem;
        z-index: 9999;
        font-family: monospace;
      `;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errorDiv.innerHTML = `
        <strong>🚨 開発環境エラー</strong><br>
        ${errorMessage}<br>
        <small>詳細はコンソールを確認してください</small>
      `;
      document.body.prepend(errorDiv);
    }

    throw error;
  }
};
