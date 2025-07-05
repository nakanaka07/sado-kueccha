import type { FC, ReactElement } from 'react';
import { Suspense, lazy, useEffect } from 'react';
import {
  LoadingScreen,
  MapLoadingOverlay,
  PerformanceDebugger,
} from '../components/ui';
import { getAppConfig } from '../utils/env';
import { APP_CONFIG, logConfigDebugInfo } from './AppConfig';
import { useAppContext } from './hooks';

// コンポーネントの遅延読み込み（Code Splitting最適化）
const FilterPanel = lazy(() =>
  import('../components/filter/FilterPanel').then(module => ({
    default: module.FilterPanel,
  }))
);

const MapComponent = lazy(async () => {
  const module = await import('../components/map');
  return { default: module.MapComponent };
});

/**
 * @fileoverview アプリケーションコンテンツコンポーネント
 *
 * AppProvider内で使用される実際のアプリケーションコンテンツ。
 * 状態管理とUIロジックを担当。
 *
 * @version 2.0.0
 * @since 2025-06-25
 */

/**
 * アプリケーションの主要コンテンツコンポーネント
 *
 * @description
 * AppProvider から提供される状態を使用して、
 * 実際のアプリケーション機能を表示します。
 *
 * **機能:**
 * - マップとフィルターの表示
 * - 読み込み状態の管理
 * - パフォーマンス最適化
 * - デバッグ機能の統合
 *
 * @returns アプリケーションコンテンツ
 */
export const AppContent: FC = (): ReactElement => {
  // コンテキストから状態と操作を取得
  const {
    loading,
    mapLoading,
    poisLoading,
    fadeOut,
    pois,
    filterState,
    handleMapLoaded,
    handleFilterChange,
    envConfig,
  } = useAppContext();

  // 開発環境での設定確認
  useEffect(() => {
    if (envConfig.enableConsoleLogging) {
      const config = getAppConfig();
      // eslint-disable-next-line no-console
      console.log('[App] Google Maps設定確認:', {
        apiKey: config.maps.apiKey
          ? `[設定済: ${config.maps.apiKey.slice(0, 10)}...]`
          : '[未設定]',
        mapId: config.maps.mapId || '[未設定]',
      });

      // デバッグ情報の出力
      logConfigDebugInfo();
    }
  }, [envConfig.enableConsoleLogging]);

  // React 19のパフォーマンス最適化: 早期リターンによる無駄なレンダリング防止
  if (loading) {
    return <LoadingScreen aria-label={APP_CONFIG.accessibility.loadingLabel} />;
  }

  return (
    <>
      {/* パフォーマンスデバッガー（開発環境のみ） */}
      {envConfig.enablePerformanceDebugging ? <PerformanceDebugger /> : null}

      {/* マップローディングオーバーレイ */}
      {mapLoading ? (
        <MapLoadingOverlay fadeOut={fadeOut} poisLoading={poisLoading} />
      ) : null}

      {/* メインコンテンツエリア */}
      <div className={APP_CONFIG.cssClasses.appMain}>
        {/* マップコンポーネント */}
        <Suspense
          fallback={
            <LoadingScreen
              aria-label={APP_CONFIG.accessibility.mapLoadingLabel}
            />
          }
        >
          <MapComponent
            onMapLoaded={handleMapLoaded}
            aria-label={APP_CONFIG.accessibility.mapLabel}
            filterState={filterState}
            pois={pois}
            isPoisLoading={poisLoading}
          />
        </Suspense>

        {/* フィルターパネル */}
        <Suspense
          fallback={
            <div
              className={APP_CONFIG.cssClasses.visuallyHidden}
              aria-live="polite"
            >
              フィルター読み込み中...
            </div>
          }
        >
          <FilterPanel
            pois={pois}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            aria-label={APP_CONFIG.accessibility.filterLabel}
          />
        </Suspense>
      </div>
    </>
  );
};

export default AppContent;
