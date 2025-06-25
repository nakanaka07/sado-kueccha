/**
 * アプリケーション設定ファイル
 *
 * App.tsx から設定を分離し、保守性と可読性を向上
 * React 19のTypeScript 2024-2025年パターンを使用
 *
 * @version 1.0.0
 * @since 2025-06-25
 */

/**
 * アプリケーションの設定定数
 *
 * React 19のTypeScript 2024-2025年パターンを使用:
 * - `as const satisfies`による型安全性と推論の両立
 * - Record型による構造の明示
 * - readonly属性による不変性保証
 */
export const APP_CONFIG = {
  /**
   * アクセシビリティ設定
   * WCAG 2.1 AA準拠のラベルと説明文
   */
  accessibility: {
    appLabel: '佐渡観光マップアプリケーション',
    appDescription:
      '佐渡島の観光スポットを検索・閲覧できるインタラクティブマップアプリケーション',
    loadingLabel: 'アプリケーション読み込み中',
    mapLoadingLabel: 'マップ読み込み中',
    mapLabel: '観光スポットマップ',
    filterLabel: '観光スポットフィルター',
    mainHeading: '佐渡観光マップ',
    mainContentLabel: 'メインコンテンツエリア',
    mapInstructions:
      '矢印キーでマップを移動、Enterキーで選択されたマーカーの詳細を表示',
  },
  /**
   * CSS クラス名定数
   * 文字列リテラルの型安全性を確保
   */
  cssClasses: {
    app: 'app',
    appMain: 'app-main',
    main: 'main',
    header: 'header',
    footer: 'footer',
    mapContainer: 'map-container',
    visuallyHidden: 'visually-hidden',
  },
} as const satisfies {
  readonly accessibility: Record<string, string>;
  readonly cssClasses: Record<string, string>;
};

/**
 * React 19の新機能利用フラグ
 * 段階的な機能導入のための設定
 */
export const FEATURE_FLAGS = {
  useOptimisticUpdates: false, // 将来の楽観的更新機能
  useServerActions: false, // Server Actions利用
  useNewErrorBoundary: true, // React 19のエラーバウンダリ
  useActionState: false, // useActionStateによるフォーム管理
} as const satisfies Record<string, boolean>;

/**
 * 環境別設定
 */
export const ENV_CONFIG = {
  development: {
    enableConsoleLogging: true,
    enablePerformanceDebugging: true,
    enableDetailedErrorReporting: true,
  },
  production: {
    enableConsoleLogging: false,
    enablePerformanceDebugging: false,
    enableDetailedErrorReporting: false,
  },
} as const;

/**
 * パフォーマンス設定
 */
export const PERFORMANCE_CONFIG = {
  suspense: {
    fallbackDelay: 200, // Suspenseフォールバック表示遅延
    maxRetries: 3, // 最大リトライ回数
  },
  lazyLoading: {
    chunkPrefetch: true, // チャンクの事前読み込み
    dynamicImportTimeout: 10000, // 動的インポートタイムアウト
  },
} as const;

/**
 * アニメーション設定
 */
export const ANIMATION_CONFIG = {
  transitions: {
    fadeOutDuration: 600, // フェードアウト時間
    mapLoadingDelay: 100, // マップローディング表示遅延
  },
  easing: {
    default: 'ease-in-out',
    fast: 'ease-out',
    slow: 'ease-in',
  },
} as const;

/**
 * React 19対応のtype-safeな設定取得ヘルパー
 */
export type AppConfigKey = keyof typeof APP_CONFIG;
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type EnvironmentType = keyof typeof ENV_CONFIG;

/**
 * 設定値を安全に取得するヘルパー関数
 */
export const getAppConfig = <T extends AppConfigKey>(
  key: T
): (typeof APP_CONFIG)[T] => {
  return APP_CONFIG[key];
};

export const getFeatureFlag = (key: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[key];
};

export const getEnvConfig = (env: EnvironmentType) => {
  return ENV_CONFIG[env];
};

/**
 * 現在の環境設定を取得
 */
export const getCurrentEnvConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return getEnvConfig(isProduction ? 'production' : 'development');
};

/**
 * デバッグ用の設定情報出力（開発環境のみ）
 */
export const logConfigDebugInfo = (): void => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.group('🔧 App Configuration Debug Info');
    // eslint-disable-next-line no-console
    console.log('📋 App Config:', APP_CONFIG);
    // eslint-disable-next-line no-console
    console.log('🚀 Feature Flags:', FEATURE_FLAGS);
    // eslint-disable-next-line no-console
    console.log('🌍 Environment Config:', getCurrentEnvConfig());
    // eslint-disable-next-line no-console
    console.log('⚡ Performance Config:', PERFORMANCE_CONFIG);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
};
