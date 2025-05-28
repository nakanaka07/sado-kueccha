import reactSWC from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import type { ConfigEnv } from "vite";
import { defineConfig, loadEnv } from "vite";
/// <reference types="vitest" />

// 型定義を明示的に指定して安全性を確保
export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd());

  // 環境変数の検証
  const requiredEnvVars = ["VITE_BASE_PATH", "VITE_GOOGLE_MAPS_API_KEY"];
  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      console.warn(`警告: 環境変数 ${varName} が設定されていません`);
    }
  }

  const isProduction = mode === "production" || process.env.CI === "true";

  // GitHub Pages用のベースパス設定
  const getBasePath = () => {
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
  };

  return {
    plugins: [
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
    ],
    base: getBasePath(),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@types": path.resolve(__dirname, "./src/types"),
      },
    },
    server: {
      // HTTPS設定をオプションにして、証明書がない場合はHTTPで起動
      https: (() => {
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
      })(),
      // 開発サーバーのパフォーマンス向上のための設定
      hmr: {
        overlay: false, // エラーオーバーレイを無効化
      },
      watch: {
        usePolling: false,
      },
      // Google Sheets API用のプロキシ設定（CORS回避）
      // 理由: 開発環境でlocalhost -> docs.google.comへの直接アクセスでCORSエラーが発生するため
      proxy: {
        "/api/sheets": {
          target: "https://docs.google.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/sheets/, "/spreadsheets"),
          secure: true,
          followRedirects: true, // リダイレクトを自動的にフォロー
          configure: (proxy) => {
            // エラーハンドリング（デバッグ用）
            proxy.on("error", (err, _req, res) => {
              console.log("🚨 プロキシエラー:", err.message);
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (res && !res.headersSent) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("プロキシエラー: " + err.message);
              }
            });
            // リクエスト・レスポンスのログ（開発時のデバッグ用）
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log("📤 プロキシリクエスト:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log("📥 プロキシレスポンス:", proxyRes.statusCode, req.url);
              // リダイレクトステータスのログ出力
              switch (proxyRes.statusCode) {
                case 307:
                case 302:
                  console.log("🔄 リダイレクト先:", proxyRes.headers.location);
                  break;
              }
            });
          },
        },
      },
    },
    build: {
      // ビルド最適化設定
      outDir: "dist", // 出力ディレクトリを明示的に指定
      emptyOutDir: true, // ビルド前にディレクトリをクリア
      target: "es2022",
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
      minify: isProduction ? "esbuild" : false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            maps: ["@vis.gl/react-google-maps"],
            sheets: ["src/services/sheets.ts"],
          },
          // ファイル名にハッシュを追加してキャッシュ最適化
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
    optimizeDeps: {
      // 依存関係の事前バンドル設定
      include: ["react", "react-dom"],
      exclude: [],
    },
    test: {
      // Vitestの設定
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.ts"],
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
  };
});
