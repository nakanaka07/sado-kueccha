/**
 * Vite設定用型定義
 *
 * @description Vite 6.x 最新機能対応の型定義
 */

export interface ViteConfigEnv {
  mode: string;
  command: 'build' | 'serve';
  ssrBuild?: boolean;
}

export interface BuildOptions {
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
    output: {
      manualChunks: (id: string) => string | undefined;
      entryFileNames: string;
      chunkFileNames: string;
      assetFileNames: (assetInfo: { names?: string[] }) => string;
    };
    external: string[];
  };
}

export interface ServerOptions {
  hmr: {
    overlay: boolean;
    port: number;
  };
  watch: {
    usePolling: boolean;
    ignored: string[];
  };
  proxy: Record<string, ProxyOptions>;
  https?: HttpsOptions | boolean;
}

export interface ProxyOptions {
  target: string;
  changeOrigin: boolean;
  rewrite: (path: string) => string;
  secure: boolean;
  followRedirects: boolean;
  configure: (proxy: unknown, options: unknown) => void;
}

export interface HttpsOptions {
  key?: Buffer;
  cert?: Buffer;
}

export interface ViteConfig {
  plugins: unknown[];
  base: string;
  publicDir: string;
  css: {
    devSourcemap: boolean;
    modules: {
      localsConvention: string;
    };
  };
  resolve: {
    alias: Record<string, string>;
    conditions: string[];
  };
  esbuild: {
    target: string;
    jsx: string;
    jsxImportSource: string;
    legalComments: string;
    tsconfigRaw: {
      compilerOptions: {
        useDefineForClassFields: boolean;
        experimentalDecorators: boolean;
      };
    };
  };
  server: ServerOptions;
  build: BuildOptions;
  optimizeDeps: {
    include: string[];
    exclude: string[];
    esbuildOptions: {
      target: string;
      keepNames: boolean;
      legalComments: string;
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: boolean;
          useDefineForClassFields: boolean;
        };
      };
    };
    holdUntilCrawlEnd: boolean;
  };
  define: Record<string, string>;
  envPrefix: string[];
  envDir: string;
  preview: {
    port: number;
    host: string;
    strictPort: boolean;
    open: boolean;
    https?: HttpsOptions | boolean;
  };
}

export type ViteConfigFunction = (env: ViteConfigEnv) => ViteConfig;
