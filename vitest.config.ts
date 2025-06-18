import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest専用設定ファイル
 * Vitest拡張機能との互換性を確保するためのシンプルな設定
 */
export default defineConfig({
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
      reporter: ["text", "html"],
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
    },
    // シンプルな設定でVitest拡張機能との互換性を重視
    testTimeout: 5000,
    hookTimeout: 5000,
  },
});
