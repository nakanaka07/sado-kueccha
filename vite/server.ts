import { createProxyErrorHandler, type HttpsConfig } from './helpers.js';

/**
 * サーバー設定検証エラー
 */
export class ServerConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly invalidOptions: string[]
  ) {
    super(message);
    this.name = 'ServerConfigValidationError';
  }
}

/**
 * サーバー設定の型定義
 */
interface ServerConfig {
  host: string;
  port: number;
  strictPort: boolean;
  open: boolean;
  hmr: {
    overlay: boolean;
    port: number;
    clientPort?: number;
  };
  watch: {
    usePolling: boolean;
    ignored: string[];
  };
  proxy: Record<string, ProxyOptions>;
  https?: HttpsConfig | boolean;
}

interface ProxyOptions {
  target: string;
  changeOrigin: boolean;
  rewrite: (path: string) => string;
  secure: boolean;
  followRedirects: boolean;
  configure: (proxy: unknown, options: unknown) => void;
}

/**
 * サーバー設定の妥当性検証
 */
export function validateServerConfig(config: ServerConfig): void {
  const errors: string[] = [];

  // ポート設定の検証
  if (config.port <= 0 || config.port > 65535) {
    errors.push('サーバーポートは1-65535の範囲で設定してください');
  }

  // HMR設定の検証
  if (config.hmr.port <= 0 || config.hmr.port > 65535) {
    errors.push('HMRポートは1-65535の範囲で設定してください');
  }

  // HMRとサーバーのポートが同じでないことを確認
  if (config.port === config.hmr.port) {
    errors.push('サーバーポートとHMRポートは異なる値を設定してください');
  }

  // プロキシ設定の検証
  for (const [path, proxyOptions] of Object.entries(config.proxy)) {
    if (!path.startsWith('/')) {
      errors.push(`プロキシパス "${path}" は "/" で始まる必要があります`);
    }

    if (!proxyOptions.target) {
      errors.push(`プロキシ "${path}" のターゲットが設定されていません`);
    } else {
      try {
        new URL(proxyOptions.target);
      } catch {
        errors.push(
          `プロキシ "${path}" のターゲット "${proxyOptions.target}" は有効なURLではありません`
        );
      }
    }
  }

  // HTTPS設定の検証
  if (config.https && typeof config.https === 'object') {
    if (!config.https.key && !config.https.cert) {
      console.warn('⚠️ HTTPS設定はありますが、証明書が設定されていません');
    }
  }

  if (errors.length > 0) {
    throw new ServerConfigValidationError(
      `サーバー設定に ${errors.length} 個のエラーがあります`,
      errors
    );
  }
}

/**
 * 開発サーバー設定
 */
export function createServerConfig(
  httpsConfig: HttpsConfig | boolean | undefined
): ServerConfig {
  const config: ServerConfig = {
    // 基本設定
    host: '0.0.0.0', // すべてのネットワークインターフェースでリッスン
    port: 5173,
    strictPort: false,
    open: false,

    // HMR設定
    hmr: {
      overlay: false, // エラーオーバーレイを無効化
      port: 24678, // HMR専用ポート
      clientPort: undefined, // ブラウザ側で自動検出
    },

    // ファイル監視設定
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },

    // Google Sheets API用のプロキシ設定（CORS回避）
    proxy: {
      '/api/sheets': {
        target: 'https://docs.google.com',
        changeOrigin: true,
        rewrite: (path: string) =>
          path.replace(/^\/api\/sheets/, '/spreadsheets'),
        secure: true,
        followRedirects: true,
        configure: (proxy: unknown) => {
          const proxyEventEmitter = proxy as {
            on?: (event: string, handler: (...args: unknown[]) => void) => void;
          };
          proxyEventEmitter.on?.('error', createProxyErrorHandler());
        },
      },
    },

    // HTTPS設定（証明書がある場合のみ追加）
    ...(httpsConfig &&
      typeof httpsConfig === 'object' && { https: httpsConfig }),
    ...(httpsConfig === true && { https: {} }),
  };

  // 設定の妥当性検証を実行
  validateServerConfig(config);

  return config;
}
