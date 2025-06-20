import type { FC, ReactElement } from "react";
import { Suspense, lazy, useEffect } from "react";
import {
  ErrorBoundary,
  LoadingScreen,
  MapLoadingOverlay,
  PerformanceDebugger,
} from "../components/ui";
import { useAppState } from "../hooks/useAppState";
import { getAppConfig } from "../utils/env";

// 最適化されたスタイルの遅延読み込み
void import("../styles/filter-loading.css");

// コンポーネントの遅延読み込み（Code Splitting最適化）
const FilterPanel = lazy(() =>
  import("../components/filter/FilterPanel").then((module) => ({ default: module.FilterPanel })),
);

const MapComponent = lazy(async () => {
  const module = await import("../components/map");
  return { default: module.MapComponent };
});

/**
 * @fileoverview メインアプリケーションコンポーネント
 * React 19 + TypeScript 2024-2025 ベストプラクティスに準拠
 * Code Splitting と遅延読み込み最適化を実装
 *
 * @version 1.1.0
 * @since 2024-12-16
 * @author React 19 Refactoring Team
 */

/**
 * アプリケーションの設定定数
 *
 * React 19のTypeScript 2024-2025年パターンを使用:
 * - `as const satisfies`による型安全性と推論の両立
 * - Record型による構造の明示
 * - readonly属性による不変性保証
 */
const APP_CONFIG = {
  /**
   * アクセシビリティ設定
   * WCAG 2.1 AA準拠のラベルと説明文
   */
  accessibility: {
    appLabel: "佐渡観光マップアプリケーション",
    appDescription: "佐渡島の観光スポットを検索・閲覧できるインタラクティブマップアプリケーション",
    loadingLabel: "アプリケーション読み込み中",
    mapLoadingLabel: "マップ読み込み中",
    mapLabel: "観光スポットマップ",
    filterLabel: "観光スポットフィルター",
    mainHeading: "佐渡観光マップ",
    mapInstructions: "矢印キーでマップを移動、Enterキーで選択されたマーカーの詳細を表示",
  },
  /**
   * CSS クラス名定数
   * 文字列リテラルの型安全性を確保
   */
  cssClasses: {
    app: "app",
    appMain: "app-main",
    mapContainer: "map-container",
    visuallyHidden: "visually-hidden",
  },
  /**
   * React 19の新機能利用フラグ
   * 段階的な機能導入のための設定
   */
  features: {
    useOptimisticUpdates: false, // 将来の楽観的更新機能
    useServerActions: false, // Server Actions利用
    useNewErrorBoundary: true, // React 19のエラーバウンダリ
    useActionState: false, // useActionStateによるフォーム管理
  },
} as const satisfies {
  readonly accessibility: Record<string, string>;
  readonly cssClasses: Record<string, string>;
  readonly features: Record<string, boolean>;
};

/**
 * メインアプリケーションコンポーネント
 *
 * 佐渡観光マップアプリケーションのルートコンポーネント。
 * React 19の新機能を活用し、TypeScript 2024-2025年のベストプラクティスに従って設計。
 *
 * @description
 * **React 19の新機能:**
 * - `as const satisfies`による型安全性向上
 * - 改良されたエラーハンドリング
 * - 条件付きレンダリングの最適化（Boolean値リーク防止）
 * - より良いTypeScript統合
 *
 * **アクセシビリティ機能:**
 * - WCAG 2.1 AA準拠
 * - スクリーンリーダー対応
 * - キーボードナビゲーション
 * - ARIAラベル・説明の適切な使用
 *
 * **パフォーマンス最適化:**
 * - 早期リターンによる無駄なレンダリング防止
 * - 条件付きレンダリングの最適化
 * - メモ化とコールバック最適化
 *
 * @example
 * ```tsx
 * // 基本的な使用法
 * function AppRoot() {
 *   return <App />;
 * }
 *
 * // エラーバウンダリと組み合わせた使用法
 * function AppWithErrorBoundary() {
 *   return (
 *     <GlobalErrorBoundary>
 *       <App />
 *     </GlobalErrorBoundary>
 *   );
 * }
 * ```
 *
 * @returns アプリケーションのメインビュー
 * @throws {Error} 初期化に失敗した場合
 *
 * @see {@link useAppState} - アプリケーション状態管理
 * @see {@link ErrorBoundary} - エラーハンドリング
 * @see {@link MapComponent} - マップコンポーネント
 */
const App: FC = (): ReactElement => {
  // 開発環境での設定確認
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const config = getAppConfig();
      // eslint-disable-next-line no-console
      console.log("[App] Google Maps設定確認:", {
        apiKey: config.maps.apiKey ? `[設定済: ${config.maps.apiKey.slice(0, 10)}...]` : "[未設定]",
        mapId: config.maps.mapId || "[未設定]",
      });
    }
  }, []);

  const {
    loading,
    mapLoading,
    poisLoading,
    fadeOut,
    pois,
    filterState,
    handleMapLoaded,
    handleFilterChange,
  } = useAppState();

  // React 19のパフォーマンス最適化: 早期リターンによる無駄なレンダリング防止
  if (loading) {
    return <LoadingScreen aria-label={APP_CONFIG.accessibility.loadingLabel} />;
  }

  return (
    <ErrorBoundary
      onError={(_error, _errorInfo) => {
        // React 19の改良されたエラーハンドリング
        // 本番環境では外部エラー監視サービス（Sentry、LogRocket等）に送信
        if (process.env.NODE_ENV === "production") {
          // 例: reportError(error, errorInfo);
          // 例: analytics.track('app_error', { error: error.message });
        }
      }}
    >
      <div
        className={APP_CONFIG.cssClasses.app}
        role="application"
        aria-label={APP_CONFIG.accessibility.appLabel}
        aria-describedby="app-description"
      >
        {/*
          React 19 のアクセシビリティ向上
          スクリーンリーダー用の詳細説明
        */}
        <div id="app-description" className={APP_CONFIG.cssClasses.visuallyHidden}>
          {APP_CONFIG.accessibility.appDescription}
        </div>

        {/*
          React 19の条件付きレンダリング最適化
          Boolean値のリークを防ぐため三項演算子を使用
          mapLoadingがfalsyの場合でも明示的にnullを返す
        */}
        {mapLoading ? (
          <MapLoadingOverlay
            fadeOut={fadeOut}
            poisLoading={poisLoading}
            aria-label={APP_CONFIG.accessibility.mapLoadingLabel}
          />
        ) : null}

        <main className={APP_CONFIG.cssClasses.appMain} role="main" aria-labelledby="main-heading">
          {/*
            アクセシビリティのためのメインヘッディング
            視覚的には非表示だが構造的に重要
          */}
          <h1 id="main-heading" className={APP_CONFIG.cssClasses.visuallyHidden}>
            {APP_CONFIG.accessibility.mainHeading}
          </h1>

          <Suspense fallback={<LoadingScreen aria-label={APP_CONFIG.accessibility.loadingLabel} />}>
            <Suspense fallback={<MapLoadingOverlay fadeOut={false} poisLoading={true} />}>
              <MapComponent
                className={APP_CONFIG.cssClasses.mapContainer}
                onMapLoaded={handleMapLoaded}
                enableClickableIcons
                filterState={filterState}
                pois={pois}
                isPoisLoading={poisLoading}
                aria-label={APP_CONFIG.accessibility.mapLabel}
                aria-describedby="map-instructions"
              >
                {/* キーボードナビゲーション説明 */}
                <div id="map-instructions" className={APP_CONFIG.cssClasses.visuallyHidden}>
                  {APP_CONFIG.accessibility.mapInstructions}
                </div>

                <Suspense fallback={<div className="filter-loading">フィルター読み込み中...</div>}>
                  <FilterPanel
                    pois={pois}
                    filterState={filterState}
                    onFilterChange={handleFilterChange}
                    aria-label={APP_CONFIG.accessibility.filterLabel}
                  />
                </Suspense>
              </MapComponent>
            </Suspense>
          </Suspense>
        </main>

        {/* パフォーマンス監視デバッガー（開発環境のみ） */}
        <PerformanceDebugger position="bottom-right" />
      </div>
    </ErrorBoundary>
  );
};

/**
 * React 19の新機能利用の推奨事項
 *
 * @future React 19の新しいAPIを段階的に導入することで、
 * アプリケーションのパフォーマンスとユーザー体験を向上させることができます:
 *
 * 1. **useActionState**: フォーム状態管理の改善
 *    ```tsx
 *    const [error, formAction, isPending] = useActionState(async (prev, data) => {
 *      // POI検索やフィルター更新のアクション
 *    }, null);
 *    ```
 *
 * 2. **useOptimistic**: 楽観的UI更新
 *    ```tsx
 *    const [optimisticPois, addOptimisticPoi] = useOptimistic(pois, (state, newPoi) =>
 *      [...state, newPoi]
 *    );
 *    ```
 *
 * 3. **use**: データストリーミング
 *    ```tsx
 *    const poisData = use(poisPromise); // Server Componentsとの連携
 *    ```
 *
 * 4. **React Server Components**: サーバーサイドでのPOIデータ取得
 *    ```tsx
 *    // server-component.tsx
 *    async function POIServerComponent() {
 *      const pois = await fetchPOIsOnServer();
 *      return <MapWithPOIs pois={pois} />;
 *    }
 *    ```
 *
 * @see https://react.dev/blog/2024/12/05/react-19 React 19公式ブログ
 * @see https://react.dev/reference/react/use use API ドキュメント
 * @see https://react.dev/reference/react/useActionState useActionState ドキュメント
 * @see https://react.dev/reference/react/useOptimistic useOptimistic ドキュメント
 */

export default App;
