import fs from 'node:fs';
import path from 'node:path';
import type { RequiredEnvironmentVariables } from './env.d.js';

/**
 * HTTPS設定の型定義
 */
export interface HttpsConfig {
  key?: Buffer;
  cert?: Buffer;
}

/**
 * 環境変数検証エラー
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[]
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * 必須環境変数の存在確認
 */
export function validateEnvironmentVariables(
  env: Record<string, string>
): void {
  const requiredEnvVars: Array<keyof RequiredEnvironmentVariables> = [
    'VITE_BASE_PATH',
    'VITE_GOOGLE_MAPS_API_KEY',
  ];
  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.CI === 'true';
  const missingVars: string[] = [];
  const warningVars: string[] = [];

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      if (isProduction) {
        missingVars.push(varName);
      } else {
        warningVars.push(varName);
      }
    } else {
      // 値の妥当性チェック
      if (varName === 'VITE_BASE_PATH' && !env[varName].startsWith('/')) {
        console.warn(
          `⚠️ 環境変数 ${varName} は "/" で始まる必要があります。現在の値: "${env[varName]}"`
        );
      }
      if (varName === 'VITE_GOOGLE_MAPS_API_KEY' && env[varName].length < 20) {
        console.warn(`⚠️ 環境変数 ${varName} の値が短すぎる可能性があります`);
      }
    }
  }

  // 本番環境で必須変数が不足している場合はエラー
  if (missingVars.length > 0) {
    throw new EnvironmentValidationError(
      `❌ 必須環境変数が設定されていません: ${missingVars.join(', ')}`,
      missingVars
    );
  }

  // 開発環境での警告
  if (warningVars.length > 0) {
    console.warn(
      `⚠️ 環境変数が設定されていません: ${warningVars.join(
        ', '
      )} - 開発環境では任意ですが推奨されます`
    );
  }

  // 成功ログ（開発時のみ）
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('✅ 環境変数の検証が完了しました');
  }
}

/**
 * GitHub Pages用のベースパス設定
 */
export function getBasePath(env: Record<string, string>): string {
  if (env.VITE_BASE_PATH) {
    return env.VITE_BASE_PATH;
  }

  if (process.env.CI === 'true' && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    return repoName ? `/${repoName}/` : '/';
  }

  return '/';
}

/**
 * HTTPS設定の取得
 */
export function getHttpsConfig(
  isProduction: boolean
): HttpsConfig | boolean | undefined {
  if (isProduction) return undefined;

  const certPath = path.resolve(process.cwd(), '.local/localhost.crt');
  const keyPath = path.resolve(process.cwd(), '.local/localhost.key');

  try {
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.warn(
        '🔓 HTTPS証明書が見つかりません。自己署名証明書を使用します。'
      );
      console.warn(`  証明書パス: ${certPath}`);
      console.warn(`  秘密鍵パス: ${keyPath}`);
      return true;
    }

    // ファイルサイズとアクセス権限をチェック
    const certStats = fs.statSync(certPath);
    const keyStats = fs.statSync(keyPath);

    if (certStats.size === 0) {
      console.warn('🔓 証明書ファイルが空です。自己署名証明書を使用します。');
      return true;
    }

    if (keyStats.size === 0) {
      console.warn('🔓 秘密鍵ファイルが空です。自己署名証明書を使用します。');
      return true;
    }

    const config = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // 証明書の基本的な妥当性チェック
    if (config.key.length === 0 || config.cert.length === 0) {
      console.warn(
        '🔓 証明書または秘密鍵の読み込みに失敗しました。自己署名証明書を使用します。'
      );
      return true;
    }

    // eslint-disable-next-line no-console
    console.log('🔒 カスタムHTTPS証明書を読み込みました');
    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('🔓 HTTPS証明書の読み込みに失敗しました:', errorMessage);
    console.warn('  自己署名証明書を使用します。');

    // ファイルアクセス権限の問題を詳しく報告
    if (errorMessage.includes('EACCES')) {
      console.warn('  ヒント: 証明書ファイルのアクセス権限を確認してください');
    } else if (errorMessage.includes('ENOENT')) {
      console.warn(
        '  ヒント: 証明書ファイルが存在しません。パスを確認してください'
      );
    }

    return true;
  }
}

/**
 * プロキシの基本設定
 */
export function createProxyErrorHandler() {
  return (err: unknown, _req: unknown, res: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('🚨 プロキシエラー:', error.message);

    const response = res as {
      headersSent?: boolean;
      writeHead?: (status: number, headers: Record<string, string>) => void;
      end?: (data: string) => void;
    };

    if (!response.headersSent) {
      try {
        response.writeHead?.(500, { 'Content-Type': 'application/json' });
        response.end?.(
          JSON.stringify({
            error: 'プロキシエラー',
            message: error.message,
            timestamp: new Date().toISOString(),
          })
        );
      } catch {
        // レスポンス送信に失敗した場合は無視
      }
    }
  };
}
