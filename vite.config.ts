import reactSWC from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import type { ConfigEnv, UserConfig } from "vite";
import { defineConfig, loadEnv } from "vite";

/// <reference types="vitest" />

/**
 * Vite設定ファイル
 * React + TypeScript + Google Maps API統合プロジェクト用の設定
 */
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // 環境変数の読み込み
  const env = loadEnv(mode, process.cwd());
  const isProduction = mode === "production" || process.env.CI === "true";

  // 必須環境変数の検証
  validateEnvironmentVariables(env);

  return {
    plugins: createPlugins(isProduction),
    base: getBasePath(env),
    publicDir: "public",
    resolve: createResolveConfig(),
    server: createServerConfig(isProduction),
    build: createBuildConfig(isProduction),
    optimizeDeps: createOptimizeDepsConfig(),
    // @ts-expect-error Vitestの設定はViteの型定義に含まれていないため
    test: createTestConfig(),
  };
});

/**
 * 必須環境変数の存在確認
 */
function validateEnvironmentVariables(env: Record<string, string>): void {
  const requiredEnvVars = ["VITE_BASE_PATH", "VITE_GOOGLE_MAPS_API_KEY"];

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      console.warn(`⚠️ 環境変数 ${varName} が設定されていません`);
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
    const repoName = process.env.GITHUB_REPOSITORY.split("/")[1];
    return `/${repoName}/`;
  }

  // デフォルト
  return "/";
}

/**
 * プラグイン設定の作成
 */
function createPlugins(isProduction: boolean) {
  return [
    reactSWC(),
    ...(isProduction
      ? [
          visualizer({
            filename: "dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
            template: "treemap",
          }),
        ]
      : []),
  ];
}

/**
 * resolve設定の作成
 */
function createResolveConfig() {
  return {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@constants": path.resolve(__dirname, "./src/constants"),
    },
  };
}

/**
 * 開発サーバー設定の作成
 */
function createServerConfig(isProduction: boolean) {
  return {
    // HTTPS設定（証明書がない場合はHTTPで起動）
    https: getHttpsConfig(isProduction),

    // HMR設定
    hmr: {
      overlay: false, // エラーオーバーレイを無効化
    },

    watch: {
      usePolling: false,
    },

    // Google Sheets API用のプロキシ設定（CORS回避）
    proxy: {
      "/api/sheets": {
        target: "https://docs.google.com",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/sheets/, "/spreadsheets"),
        secure: true,
        followRedirects: true,
        configure: configureProxy,
      },
    },
  };
}

/**
 * HTTPS設定の取得
 */
function getHttpsConfig(isProduction: boolean) {
  if (isProduction) return undefined;

  try {
    return {
      key: fs.readFileSync(path.resolve(__dirname, ".local/localhost.key")),
      cert: fs.readFileSync(path.resolve(__dirname, ".local/localhost.crt")),
    };
  } catch {
    console.log("🔓 HTTPS証明書が見つかりません。HTTPで起動します。");
    return undefined;
  }
}

/**
 * プロキシの設定
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function configureProxy(proxy: any) {
  // エラーハンドリング
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  proxy.on("error", (err: Error, _req: any, res: any) => {
    console.log("🚨 プロキシエラー:", err.message);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (res && !res.headersSent) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.writeHead(500, { "Content-Type": "text/plain" });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.end("プロキシエラー: " + err.message);
    }
  });

  // リクエスト・レスポンスのログ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  proxy.on("proxyReq", (_proxyReq: any, req: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log("📤 プロキシリクエスト:", req.method, req.url);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  proxy.on("proxyRes", (proxyRes: any, req: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log("📥 プロキシレスポンス:", proxyRes.statusCode, req.url);

    // リダイレクトステータスのログ
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (proxyRes.statusCode === 307 || proxyRes.statusCode === 302) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log("🔄 リダイレクト先:", proxyRes.headers.location);
    }
  });
}

/**
 * ビルド設定の作成
 */
function createBuildConfig(isProduction: boolean) {
  return {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    sourcemap: !isProduction,
    chunkSizeWarningLimit: 1000,
    minify: isProduction ? ("esbuild" as const) : false,
    rollupOptions: {
      output: {
        // 手動チャンク分割でバンドルサイズを最適化
        manualChunks: {
          vendor: ["react", "react-dom"],
          maps: ["@vis.gl/react-google-maps"],
          sheets: ["google-spreadsheet", "googleapis"],
          utils: ["src/services/cache.ts", "src/services/preload.ts"],
        },

        // キャッシュ最適化のためのハッシュ付きファイル名
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
      external: isProduction ? [] : [],
    },
  };
}

/**
 * 依存関係最適化設定の作成
 */
function createOptimizeDepsConfig() {
  return {
    include: ["react", "react-dom", "@vis.gl/react-google-maps", "google-spreadsheet"],
    exclude: [],
    esbuildOptions: {
      target: "es2022",
    },
  };
}

/**
 * テスト設定の作成（Vitest）
 */
function createTestConfig() {
  return {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  };
}
