import path from 'node:path';

/**
 * ビルド設定の型定義
 */
interface BuildConfig {
  outDir: string;
  emptyOutDir: boolean;
  target: string;
  sourcemap: boolean;
  chunkSizeWarningLimit: number;
  minify: 'esbuild' | false;
  cssMinify: boolean;
  assetsInlineLimit: number;
  reportCompressedSize: boolean;
  rollupOptions: {
    treeshake?:
      | {
          moduleSideEffects: boolean;
          propertyReadSideEffects: boolean;
          unknownGlobalSideEffects: boolean;
        }
      | false;
    output: {
      manualChunks: (id: string) => string | undefined;
      entryFileNames: string;
      chunkFileNames: string;
      assetFileNames: (assetInfo: { names?: string[] }) => string;
    };
    external: string[];
  };
}

/**
 * パフォーマンス最適化設定
 */
interface PerformanceConfig {
  maxChunkSize: number;
  maxAssetSize: number;
  treeshakeOptions: {
    moduleSideEffects: boolean;
    propertyReadSideEffects: boolean;
    unknownGlobalSideEffects: boolean;
  };
  experimentalFeatures: {
    preloadModules: boolean;
    modulePreload: boolean;
    dynamicImportPreload: boolean;
  };
}

/**
 * ビルド設定検証エラー
 */
export class BuildConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidOptions: string[]
  ) {
    super(message);
    this.name = 'BuildConfigValidationError';
  }
}

/**
 * ビルド設定の妥当性検証
 */
export function validateBuildConfig(config: BuildConfig): void {
  const errors: string[] = [];

  // 出力ディレクトリの検証
  if (!config.outDir || config.outDir.trim() === '') {
    errors.push('outDir が設定されていません');
  }

  // チャンクサイズ警告制限の検証
  if (config.chunkSizeWarningLimit <= 0) {
    errors.push('chunkSizeWarningLimit は正の数である必要があります');
  }

  // アセットインライン制限の検証
  if (config.assetsInlineLimit < 0) {
    errors.push('assetsInlineLimit は0以上である必要があります');
  }

  // ターゲットの検証
  const validTargets = [
    'es2015',
    'es2016',
    'es2017',
    'es2018',
    'es2019',
    'es2020',
    'es2021',
    'es2022',
    'es2023',
    'esnext',
  ];
  if (!validTargets.includes(config.target)) {
    errors.push(
      `無効なターゲット: ${config.target}。有効な値: ${validTargets.join(', ')}`
    );
  }

  if (errors.length > 0) {
    throw new BuildConfigValidationError(
      `ビルド設定に問題があります: ${errors.join(', ')}`,
      errors
    );
  }

  // 成功ログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('✅ ビルド設定の検証が完了しました');
  }
}

/**
 * パフォーマンス最適化設定の作成
 */
function createPerformanceConfig(isProduction: boolean): PerformanceConfig {
  return {
    maxChunkSize: isProduction ? 500 * 1024 : 1000 * 1024, // 500KB（本番）/ 1MB（開発）
    maxAssetSize: isProduction ? 250 * 1024 : 500 * 1024, // 250KB（本番）/ 500KB（開発）
    treeshakeOptions: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
    experimentalFeatures: {
      preloadModules: isProduction,
      modulePreload: isProduction,
      dynamicImportPreload: isProduction,
    },
  };
}

/**
 * ビルド設定
 */
export function createBuildConfig(isProduction: boolean): BuildConfig {
  // 設定の妥当性検証を実行
  const performanceConfig = createPerformanceConfig(isProduction);

  const config: BuildConfig = {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2023',
    sourcemap: !isProduction,
    chunkSizeWarningLimit: performanceConfig.maxChunkSize / 1024, // KBに変換
    minify: isProduction ? 'esbuild' : false,
    cssMinify: isProduction,
    assetsInlineLimit: 4096,
    reportCompressedSize: !isProduction, // 開発時にサイズ情報を表示

    rollupOptions: {
      // Tree shaking の最適化
      treeshake: isProduction ? performanceConfig.treeshakeOptions : false,

      output: {
        // 手動チャンク分割でバンドルサイズを最適化
        manualChunks: (id: string) => {
          // Node modules の分割
          if (id.includes('node_modules')) {
            // React関連
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // 地図関連
            if (
              id.includes('@vis.gl/react-google-maps') ||
              id.includes('@googlemaps')
            ) {
              return 'vendor-maps';
            }
            // データ取得関連
            if (
              id.includes('google-spreadsheet') ||
              id.includes('googleapis')
            ) {
              return 'vendor-sheets';
            }
            // ユーティリティライブラリ
            if (id.includes('date-fns') || id.includes('japanese-holidays')) {
              return 'vendor-utils';
            }
            // PWA関連
            if (id.includes('workbox') || id.includes('vite-plugin-pwa')) {
              return 'vendor-pwa';
            }
            return 'vendor';
          }

          // アプリケーションコードの分割
          if (id.includes('src/services')) {
            return 'services';
          }
          if (id.includes('src/components')) {
            return 'components';
          }
          if (id.includes('src/utils')) {
            return 'utils';
          }
          if (id.includes('src/workers')) {
            return 'workers';
          }

          return undefined;
        },

        // キャッシュ最適化のためのハッシュ付きファイル名
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo: { names?: string[] }) => {
          const fileName = assetInfo.names?.[0] ?? 'unknown';

          // 画像ファイル
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(fileName)) {
            return 'assets/images/[name]-[hash][extname]';
          }

          // スタイルシート
          if (/\.css$/i.test(fileName)) {
            return 'assets/styles/[name]-[hash][extname]';
          }

          // フォント
          if (/\.(woff2?|eot|ttf|otf)$/i.test(fileName)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }

          // その他のアセット
          const extension =
            path.extname(fileName).slice(1).toLowerCase() || 'misc';
          return `assets/${extension}/[name]-[hash][extname]`;
        },
      },
      external: isProduction ? [] : [],
    },
  };

  // 設定の検証
  validateBuildConfig(config);

  return config;
}
