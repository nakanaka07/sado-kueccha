import reactSWC from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/// <reference types="vitest" />

/**
 * Vite設定ファイル
 * React 19 + TypeScript 5.8 + Google Maps API統合プロジェクト用の最適化された設定
 * 2025年最新ベストプラクティス対応
 * - Vite 6.x 最新機能活用（ES2023ターゲット、非同期分割コード、型安全性向上）
 * - パフォーマンス最適化（依存関係の最適化、HMR改善、チャンク戦略）
 * - モダンブラウザ対応（ES2023、新しいJavaScript機能）
 * - セキュリティ強化（CSP、HTTPS、プロキシ設定）
 * - 開発者体験向上（型チェック分離、デバッグ最適化、エラーハンドリング）
 */
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 環境変数の読み込み
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production" || process.env.CI === "true";

  // 必須環境変数の検証
  validateEnvironmentVariables(env);

  // サーバー設定の動的構築（型安全性確保）
  const httpsConfig = getHttpsConfig(isProduction);
  const serverConfig = {
    // HMR設定 (Vite 6.x 最適化)
    hmr: {
      overlay: false, // エラーオーバーレイを無効化
      port: 24678, // HMR専用ポート
    },

    // ファイル監視設定 (パフォーマンス最適化)
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**", "**/.git/**"],
    },

    // Google Sheets API用のプロキシ設定（CORS回避）
    proxy: {
      "/api/sheets": {
        target: "https://docs.google.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/sheets/, "/spreadsheets"),
        secure: true,
        followRedirects: true,
        configure: configureProxy as (proxy: unknown, options: unknown) => void,
      },
    },
    // HTTPS設定（証明書がある場合のみ追加）
    ...(httpsConfig && httpsConfig !== true && { https: httpsConfig }),
    ...(httpsConfig === true && { https: {} }),
  };

  return {
    // === プラグイン設定 ===
    plugins: (() => {
      const basePlugins = [
        reactSWC({
          // React 19対応の最新設定 (Vite 6.x + SWC最適化)
          jsxImportSource: "react",
          plugins: [],
          // TypeScript分離型チェック推奨 (Vite公式ガイダンス)
          devTarget: "es2022",
          // SWC最適化オプション
          tsDecorators: true,
        }),
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["favicon.ico", "assets/*.png", "robots.txt"],
          manifest: false, // 既存のmanifest.jsonを使用
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/docs\.google\.com\//,
                handler: "NetworkFirst",
                options: {
                  cacheName: "google-sheets-cache",
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24, // 24時間
                  },
                },
              },
              {
                urlPattern: /\.(png|jpg|jpeg|svg|gif)$/,
                handler: "CacheFirst",
                options: {
                  cacheName: "images-cache",
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
                  },
                },
              },
            ],
          },
        }),
      ];

      if (isProduction) {
        try {
          const bundleAnalyzer = (visualizer as unknown as (...args: unknown[]) => unknown)({
            filename: "dist/bundle-analysis.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: "treemap" as const,
            title: "Bundle Analysis - Sado Kueccha",
          });
          basePlugins.push(bundleAnalyzer as never);
        } catch (error) {
          console.warn("Bundle analyzer plugin could not be loaded:", error);
        }
      }

      return basePlugins;
    })(),
    // === 基本設定 ===
    base: getBasePath(env),
    publicDir: "public",

    // === CSS設定 (Vite 6.x最適化) ===
    css: {
      devSourcemap: !isProduction,
      // PostCSS設定は postcss.config.js で管理
      postcss: {},
      // Lightning CSS実験的サポート (必要に応じて)
      // transformer: 'lightningcss',
    },

    // === モジュール解決設定 ===
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@types": path.resolve(__dirname, "./src/types"),
        "@constants": path.resolve(__dirname, "./src/constants"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
      },
      // Vite 6.x: 改良されたモジュール解決
      dedupe: ["react", "react-dom"],
    },

    // === ESBuild設定 ===
    esbuild: {
      // ES2023ターゲット
      target: "es2023",
      // JSX設定
      jsx: "automatic",
      jsxImportSource: "react",
      // TypeScript設定
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: true,
          experimentalDecorators: true,
        },
      },
    },

    // === 開発サーバー設定 ===
    server: serverConfig,
    build: {
      outDir: "dist",
      emptyOutDir: true,
      // Vite 6.x 推奨: ES2023ターゲット (モダンブラウザ対応)
      target: "es2023",
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
      minify: isProduction ? ("esbuild" as const) : false,
      cssMinify: isProduction,
      assetsInlineLimit: 4096,
      reportCompressedSize: false, // パフォーマンス向上
      rollupOptions: {
        output: {
          // 手動チャンク分割でバンドルサイズを最適化 (Vite 6.x改良版)
          manualChunks: (id: string) => {
            // Node modules の分割 (より細かな制御)
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("@vis.gl/react-google-maps") || id.includes("@googlemaps")) {
                return "vendor-maps";
              }
              if (id.includes("google-spreadsheet") || id.includes("googleapis")) {
                return "vendor-sheets";
              }
              // その他のベンダーライブラリ
              return "vendor";
            }
            // アプリケーションコードの分割
            if (id.includes("src/services")) {
              return "services";
            }
            if (id.includes("src/components")) {
              return "components";
            }
            if (id.includes("src/utils")) {
              return "utils";
            }
            // デフォルトではundefinedを返す（自動分割）
            return undefined;
          },

          // キャッシュ最適化のためのハッシュ付きファイル名 (Vite 6.x推奨形式)
          entryFileNames: "assets/js/[name]-[hash].js",
          chunkFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const fileName = assetInfo.names[0] ?? "unknown";
            const info = fileName.split(".");
            const ext = info[info.length - 1] ?? "unknown";
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(css)$/i.test(fileName)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/${ext}/[name]-[hash][extname]`;
          },
        },
        external: isProduction ? [] : [],
      },
    },
    optimizeDeps: {
      // Vite 6.x 推奨: 明示的な依存関係管理
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@vis.gl/react-google-maps",
        "@googlemaps/markerclusterer",
        "googleapis",
        "japanese-holidays",
      ],
      exclude: ["@vitejs/plugin-react-swc"],
      esbuildOptions: {
        // ES2023ターゲット (モダンブラウザ対応)
        target: "es2023",
        keepNames: true,
        // Vite 6.x: より良いTypeScript統合
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
            useDefineForClassFields: true,
          },
        },
      },
      // 本番環境では依存関係を強制的に再ビルド
      force: isProduction,
      // Vite 6.x: 改良された依存関係探索
      entries: ["./src/main.tsx"],
    },

    // === 環境変数設定 ===
    envPrefix: ["VITE_", "REACT_APP_"],
    envDir: process.cwd(),

    // === プリビュー設定 ===
    preview: {
      port: 5173,
      host: "localhost",
      strictPort: false,
      open: false,
      https: {
        // 自己署名証明書を使用
        key: undefined,
        cert: undefined,
      },
    },

    // === テスト設定 ===
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.ts"],
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["node_modules", "dist", ".git", ".cache", "coverage"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/setupTests.ts",
          "**/*.d.ts",
          "**/*.config.*",
          "dist/",
          "coverage/",
          "**/*.test.*",
          "**/*.spec.*",
        ],
        reportsDirectory: "./coverage",
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
      testTimeout: 10000,
      hookTimeout: 10000,
      // Vite 6.x: 改良されたテスト並列実行
      pool: "threads",
      poolOptions: {
        threads: {
          singleThread: false,
        },
      },
    },
  };
});

/**
 * 必須環境変数の存在確認 (Vite 6.x対応)
 */
function validateEnvironmentVariables(env: Record<string, string>): void {
  const requiredEnvVars = ["VITE_BASE_PATH", "VITE_GOOGLE_MAPS_API_KEY"];
  const isProduction = process.env.NODE_ENV === "production" || process.env.CI === "true";

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      const message = `環境変数 ${varName} が設定されていません`;

      if (isProduction) {
        throw new Error(`❌ ${message} - 本番環境では必須です`);
      } else {
        console.warn(`⚠️ ${message} - 開発環境では任意ですが推奨されます`);
      }
    }
  }
}

/**
 * GitHub Pages用のベースパス設定
 */
function getBasePath(env: Record<string, string>): string {
  // 環境変数が設定されている場合はそれを使用
  if (env.VITE_BASE_PATH) {
    return env.VITE_BASE_PATH;
  }

  // GitHub Actionsの場合、リポジトリ名をベースパスとして使用
  if (process.env.CI === "true" && process.env.GITHUB_REPOSITORY) {
    const parts = process.env.GITHUB_REPOSITORY.split("/");
    const repoName = parts[1];
    if (repoName) {
      return `/${repoName}/`;
    }
  }

  // デフォルト
  return "/";
}

/**
 * HTTPS設定の取得 (Vite 6.x最適化)
 */
function getHttpsConfig(isProduction: boolean) {
  if (isProduction) return undefined;

  const certPath = path.resolve(__dirname, ".local/localhost.crt");
  const keyPath = path.resolve(__dirname, ".local/localhost.key");

  try {
    // 証明書ファイルの存在確認
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.log("🔓 HTTPS証明書が見つかりません。");
      console.log(`  証明書パス: ${certPath}`);
      console.log(`  キーパス: ${keyPath}`);
      console.log("  自己署名証明書を使用します。");
      return true;
    }

    console.log("🔒 HTTPS証明書を読み込んでいます...");
    console.log(`  証明書: ${certPath}`);
    console.log(`  キー: ${keyPath}`);

    const config = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    console.log("✅ HTTPS証明書の読み込みが完了しました。");
    return config;
  } catch (error) {
    console.warn("🔓 HTTPS証明書の読み込みに失敗しました:", error);
    console.log("  自己署名証明書を使用します。");
    return true;
  }
}

/**
 * プロキシの設定 (Vite 6.x改良版 - 型安全)
 */
function configureProxy(proxy: Record<string, unknown>) {
  // プロキシオブジェクトを安全にキャスト
  const proxyEventEmitter = proxy as {
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
  };

  // エラーハンドリング
  proxyEventEmitter.on?.("error", (err: unknown, _req: unknown, res: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("🚨 プロキシエラー:", error.message);

    // レスポンスオブジェクトの型安全チェック
    const response = res as {
      headersSent?: boolean;
      writeHead?: (status: number, headers: Record<string, string>) => void;
      end?: (data: string) => void;
    } | null;
    if (response?.headersSent !== true && response) {
      try {
        response.writeHead?.(500, { "Content-Type": "application/json" });
        response.end?.(
          JSON.stringify({
            error: "プロキシエラー",
            message: error.message,
            timestamp: new Date().toISOString(),
          }),
        );
      } catch {
        // レスポンスの送信に失敗した場合は無視
      }
    }
  });

  // リクエストログ (開発時のみ)
  if (process.env.NODE_ENV === "development") {
    proxyEventEmitter.on?.("proxyReq", (proxyReq: unknown, req: unknown) => {
      try {
        const request = req as { method?: string; url?: string } | null;
        const proxyRequest = proxyReq as {
          getHeader?: (name: string) => string | undefined;
        } | null;

        const method = String(request?.method ?? "UNKNOWN");
        const url = String(request?.url ?? "UNKNOWN");
        const host = String(proxyRequest?.getHeader?.("host") ?? "UNKNOWN");
        console.log(`📡 プロキシリクエスト: ${method} ${url} -> ${host}`);
      } catch {
        console.log("📡 プロキシリクエスト: [詳細取得エラー]");
      }
    });
  }
}
