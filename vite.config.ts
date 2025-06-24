import path from 'node:path';

import {
  createBuildConfig,
  createPlugins,
  createServerConfig,
  getBasePath,
  getHttpsConfig,
  validateEnvironmentVariables,
  type ViteConfig,
  type ViteConfigEnv,
} from './vite/index.js';

/// <reference types="vitest" />

/**
 * Vite設定ファイル
 * React 19 + TypeScript + Google Maps API統合プロジェクト用の最適化された設定
 *
 * @description 2025年最新ベストプラクティス対応
 * - Vite 6.x 最新機能活用
 * - パフォーマンス最適化
 * - モダンブラウザ対応（ES2023）
 * - セキュリティ強化
 * - 開発者体験向上
 */
export default function viteConfig({ mode }: ViteConfigEnv): ViteConfig {
  // 環境変数を直接process.envから取得
  const env = {
    ...process.env,
    VITE_BASE_PATH: process.env.VITE_BASE_PATH || '/',
    VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  };
  const isProduction = mode === 'production' || process.env.CI === 'true';

  // 環境変数の検証
  validateEnvironmentVariables(env);

  // HTTPS設定の取得
  const httpsConfig = getHttpsConfig(isProduction);

  return {
    // === プラグイン設定 ===
    plugins: createPlugins(isProduction),

    // === 基本設定 ===
    base: getBasePath(env),
    publicDir: 'public',

    // === CSS設定 ===
    css: {
      devSourcemap: !isProduction,
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },

    // === モジュール解決設定 ===
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@constants': path.resolve(__dirname, './src/constants'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
      },
      conditions: ['development', 'browser'],
    },

    // === ESBuild設定 ===
    esbuild: {
      target: 'es2023',
      jsx: 'automatic',
      jsxImportSource: 'react',
      legalComments: 'none',
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: true,
          experimentalDecorators: true,
        },
      },
    },

    // === 開発サーバー設定 ===
    server: createServerConfig(httpsConfig),

    // === ビルド設定 ===
    build: createBuildConfig(isProduction),

    // === 依存関係最適化設定 ===
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@vis.gl/react-google-maps',
        '@googlemaps/markerclusterer',
        'googleapis',
        'japanese-holidays',
      ],
      exclude: ['@vitejs/plugin-react-swc'],
      esbuildOptions: {
        target: 'es2023',
        keepNames: true,
        legalComments: 'none',
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
            useDefineForClassFields: true,
          },
        },
      },
      holdUntilCrawlEnd: false, // Vite 6.x対応
    },

    // === 環境変数設定 ===
    define: {
      __APP_VERSION__: JSON.stringify(
        process.env.npm_package_version || '0.1.0'
      ),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // === 環境変数プリフィックス ===
    envPrefix: ['VITE_', 'REACT_APP_'],
    envDir: process.cwd(),

    // === プリビュー設定 ===
    preview: {
      port: 5173,
      host: 'localhost',
      strictPort: false,
      open: false,
      ...(httpsConfig && { https: httpsConfig === true ? {} : httpsConfig }),
    },
  };
}
