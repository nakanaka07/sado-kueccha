import reactSWC from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * プラグイン設定検証エラー
 */
export class PluginConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidPlugins: string[]
  ) {
    super(message);
    this.name = 'PluginConfigValidationError';
  }
}

/**
 * プラグイン設定の妥当性検証（簡略化）
 */
export function validatePluginConfig(isProduction: boolean): void {
  // 環境フラグの検証
  if (typeof isProduction !== 'boolean') {
    throw new PluginConfigValidationError(
      'isProduction は boolean 型である必要があります',
      ['isProduction']
    );
  }
}

/**
 * 軽量化された動的プラグイン読み込み
 */
interface PluginLoadOptions {
  isProduction: boolean;
  enablePWA?: boolean;
  enableBundleAnalyzer?: boolean;
  enableDevTools?: boolean;
}

/**
 * 条件付きプラグイン読み込み（軽量化）
 */
function loadPluginsConditionally(options: PluginLoadOptions) {
  const {
    isProduction,
    enablePWA = true,
    enableBundleAnalyzer = true,
  } = options;
  const plugins = [];

  // React SWC プラグイン（常に必要）
  plugins.push(
    reactSWC({
      jsxImportSource: 'react',
      plugins: [],
      devTarget: isProduction ? 'es2023' : 'es2022', // 本番では最新ターゲット
      tsDecorators: true,
      // 本番環境では最適化を強化
      ...(isProduction && {
        optimize: true,
        minify: true,
      }),
    })
  );

  // PWA プラグイン（オプション）
  if (enablePWA) {
    try {
      plugins.push(
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'assets/*.png', 'robots.txt'],
          manifest: false,
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            // リビジョン管理の明確化でキャッシュ競合を回避
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
            // 本番環境でのキャッシュ戦略を最適化
            runtimeCaching: isProduction
              ? [
                  {
                    urlPattern: /^https:\/\/docs\.google\.com\//,
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'google-sheets-cache',
                      expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24, // 24時間
                      },
                    },
                  },
                  {
                    urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'images-cache',
                      expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
                      },
                    },
                  },
                ]
              : [],
          },
        })
      );
    } catch (error) {
      console.warn('⚠️ PWA プラグインの読み込みに失敗しました:', error);
    }
  }

  // Bundle Analyzer（本番環境のみ、オプション）
  if (isProduction && enableBundleAnalyzer) {
    try {
      plugins.push(
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
          title: 'Bundle Analysis - Sado Kueccha',
        })
      );
    } catch (error) {
      console.warn(
        '⚠️ Bundle analyzer プラグインの読み込みに失敗しました:',
        error
      );
    }
  }

  return plugins;
}

/**
 * プラグイン設定
 */
export function createPlugins(
  isProduction: boolean,
  options?: Partial<PluginLoadOptions>
) {
  // 設定の妥当性検証を実行
  validatePluginConfig(isProduction);

  return loadPluginsConditionally({ isProduction, ...options });
}
