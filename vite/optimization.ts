/**
 * Vite設定統合・最適化モジュール
 *
 * @description 設定ファイルの統合と軽量化を行う
 */

import { createBuildConfig } from './build.js';
import { getBasePath, getHttpsConfig } from './helpers.js';
import { createPlugins } from './plugins.js';
import { createServerConfig } from './server.js';
import { runConfigValidation } from './validation.js';

/**
 * 統合設定オプション
 */
export interface IntegratedConfigOptions {
  isProduction: boolean;
  env: Record<string, string>;
  enablePWA?: boolean;
  enableBundleAnalyzer?: boolean;
  skipValidation?: boolean;
}

/**
 * 最適化レベル
 */
export type OptimizationLevel = 'minimal' | 'balanced' | 'aggressive';

/**
 * パフォーマンス指標
 */
export interface PerformanceMetrics {
  bundleSize: {
    maxChunkSize: number;
    maxAssetSize: number;
    warningThreshold: number;
  };
  buildTime: {
    maxBuildTime: number; // 秒
    warningThreshold: number; // 秒
  };
  runtime: {
    initialLoadTime: number; // ミリ秒
    cacheHitRate: number; // パーセント
  };
}

/**
 * 最適化レベルに応じた設定を生成
 */
function createOptimizedConfig(
  level: OptimizationLevel,
  isProduction: boolean
) {
  const baseConfig = {
    minimal: {
      enablePWA: isProduction,
      enableBundleAnalyzer: false,
      chunkSizeLimit: 1000 * 1024, // 1MB
      treeshake: false,
      minification: 'esbuild' as const,
    },
    balanced: {
      enablePWA: true,
      enableBundleAnalyzer: isProduction,
      chunkSizeLimit: 500 * 1024, // 500KB
      treeshake: isProduction,
      minification: 'esbuild' as const,
    },
    aggressive: {
      enablePWA: true,
      enableBundleAnalyzer: true,
      chunkSizeLimit: 250 * 1024, // 250KB
      treeshake: true,
      minification: 'esbuild' as const,
    },
  };

  return baseConfig[level];
}

/**
 * パフォーマンス指標の設定
 */
function createPerformanceMetrics(
  optimizationLevel: OptimizationLevel
): PerformanceMetrics {
  const metrics = {
    minimal: {
      bundleSize: {
        maxChunkSize: 1000 * 1024, // 1MB
        maxAssetSize: 500 * 1024, // 500KB
        warningThreshold: 800 * 1024, // 800KB
      },
      buildTime: {
        maxBuildTime: 120, // 2分
        warningThreshold: 90, // 1.5分
      },
      runtime: {
        initialLoadTime: 5000, // 5秒
        cacheHitRate: 70, // 70%
      },
    },
    balanced: {
      bundleSize: {
        maxChunkSize: 500 * 1024, // 500KB
        maxAssetSize: 250 * 1024, // 250KB
        warningThreshold: 400 * 1024, // 400KB
      },
      buildTime: {
        maxBuildTime: 90, // 1.5分
        warningThreshold: 60, // 1分
      },
      runtime: {
        initialLoadTime: 3000, // 3秒
        cacheHitRate: 80, // 80%
      },
    },
    aggressive: {
      bundleSize: {
        maxChunkSize: 250 * 1024, // 250KB
        maxAssetSize: 125 * 1024, // 125KB
        warningThreshold: 200 * 1024, // 200KB
      },
      buildTime: {
        maxBuildTime: 60, // 1分
        warningThreshold: 45, // 45秒
      },
      runtime: {
        initialLoadTime: 2000, // 2秒
        cacheHitRate: 90, // 90%
      },
    },
  };

  return metrics[optimizationLevel];
}

/**
 * 統合Vite設定の生成
 */
export function createIntegratedConfig(
  options: IntegratedConfigOptions,
  optimizationLevel: OptimizationLevel = 'balanced'
) {
  const { isProduction, env, skipValidation = false } = options;

  // 設定検証（オプション）
  if (!skipValidation) {
    try {
      const validationResult = runConfigValidation({
        env,
        isProduction,
        throwOnError: false,
      });

      if (!validationResult.isValid) {
        console.warn(
          '⚠️ 設定検証で警告が発生しました:',
          validationResult.errors
        );
      }
    } catch (error) {
      console.warn('⚠️ 設定検証中にエラーが発生しました:', error);
    }
  }

  // 最適化設定の生成
  const optimizedConfig = createOptimizedConfig(
    optimizationLevel,
    isProduction
  );
  const performanceMetrics = createPerformanceMetrics(optimizationLevel);

  // HTTPS設定の取得
  const httpsConfig = getHttpsConfig(isProduction);

  // 各設定の生成
  const buildConfig = createBuildConfig(isProduction);
  const serverConfig = createServerConfig(httpsConfig);
  const plugins = createPlugins(isProduction, {
    enablePWA: optimizedConfig.enablePWA,
    enableBundleAnalyzer: optimizedConfig.enableBundleAnalyzer,
  });

  // 統合設定
  const integratedConfig = {
    // 基本設定
    base: getBasePath(env),
    plugins,

    // ビルド設定
    build: {
      ...buildConfig,
      // 最適化レベルに応じた調整
      chunkSizeWarningLimit: optimizedConfig.chunkSizeLimit / 1024, // KBに変換
    },

    // サーバー設定
    server: serverConfig,

    // 開発設定
    ...(isProduction
      ? {}
      : {
          // 開発時のみの設定
          clearScreen: false,
          logLevel: 'info',
        }),

    // 最適化設定
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime'],
      exclude: isProduction
        ? []
        : [
            // 開発時は重いライブラリを除外
            'google-spreadsheet',
            '@googlemaps/markerclusterer',
          ],
    },

    // パフォーマンス指標
    performance: performanceMetrics,
  };

  return integratedConfig;
}

/**
 * 軽量設定の生成（最小限の機能）
 */
export function createLightweightConfig(env: Record<string, string>) {
  return createIntegratedConfig(
    {
      isProduction: false,
      env,
      enablePWA: false,
      enableBundleAnalyzer: false,
      skipValidation: true,
    },
    'minimal'
  );
}

/**
 * 本番最適化設定の生成
 */
export function createProductionConfig(env: Record<string, string>) {
  return createIntegratedConfig(
    {
      isProduction: true,
      env,
      enablePWA: true,
      enableBundleAnalyzer: true,
      skipValidation: false,
    },
    'aggressive'
  );
}

/**
 * 設定の検証とメトリクス計算
 */
export function validateConfigPerformance(
  _config: unknown,
  metrics: PerformanceMetrics
) {
  const warnings: string[] = [];

  // バンドルサイズチェック（実際のチェックはビルド後に行う）
  console.warn('📊 パフォーマンス指標:');
  console.warn(
    `   最大チャンクサイズ: ${metrics.bundleSize.maxChunkSize / 1024}KB`
  );
  console.warn(
    `   最大アセットサイズ: ${metrics.bundleSize.maxAssetSize / 1024}KB`
  );
  console.warn(`   最大ビルド時間: ${metrics.buildTime.maxBuildTime}秒`);
  console.warn(`   目標初期読み込み時間: ${metrics.runtime.initialLoadTime}ms`);
  console.warn(`   目標キャッシュヒット率: ${metrics.runtime.cacheHitRate}%`);

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
