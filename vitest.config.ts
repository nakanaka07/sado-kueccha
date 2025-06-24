import { defineConfig } from 'vitest/config';

/**
 * Vitest専用設定ファイル
 * React 19 + TypeScript プロジェクト用の最適化されたテスト設定
 *
 * @description 2025年最新ベストプラクティス対応
 * - Vitest 3.x 最新機能活用
 * - 高パフォーマンステスト実行
 * - 包括的コードカバレッジ
 * - TypeScript strict mode 対応
 */
export default defineConfig({
  // === テスト設定 ===
  test: {
    // === 基本設定 ===
    globals: true,
    environment: 'jsdom',

    // === セットアップファイル ===
    setupFiles: ['./src/setupTests.ts'],

    // === ファイルパターン ===
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      'coverage',
      '**/*.d.ts',
      '**/*.config.*',
    ],

    // === タイムアウト設定 ===
    testTimeout: 10000,
    hookTimeout: 10000,

    // === パフォーマンス設定 ===
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true,
      },
    },

    // === カバレッジ設定 ===
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        'dist/',
        'coverage/',
        'public/',
        'vite/',
        'src/main.tsx', // エントリーポイント
        'src/vite-env.d.ts',
        'src/workers/**', // Web Workers は別途テスト
      ],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // 重要なモジュールはより高い基準
        'src/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/utils/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      // カバレッジレポートの詳細設定
      watermarks: {
        statements: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        lines: [80, 95],
      },
    },

    // === レポート設定 ===
    reporters: ['default', 'html', 'junit', 'json'],
    outputFile: {
      html: './coverage/html/index.html',
      junit: './coverage/junit.xml',
      json: './coverage/coverage.json',
    },

    // === ウォッチモード設定 ===
    watch: false, // CI環境では無効

    // === 並列実行設定 ===
    maxConcurrency: 4,

    // === モック設定 ===
    clearMocks: true,
    restoreMocks: true,

    // === エラーハンドリング ===
    passWithNoTests: false,
    silent: false,
  },
});
