/**
 * Vite設定統合バリデーション
 *
 * @description 全設定ファイルの整合性を一括チェックする機能
 */

import { BuildConfigValidationError, validateBuildConfig } from './build.js';
import {
  EnvironmentValidationError,
  validateEnvironmentVariables,
  type HttpsConfig,
} from './helpers.js';
import {
  PluginConfigValidationError,
  validatePluginConfig,
} from './plugins.js';
import { ServerConfigValidationError, validateServerConfig } from './server.js';

/**
 * 総合設定検証エラー
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{
      category: string;
      error: Error;
      severity: 'error' | 'warning';
    }>
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 設定検証結果の型定義
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    category: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  summary: {
    totalChecks: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * 全設定ファイルの整合性を一括チェック
 */
export function validateAllConfigs(options: {
  env: Record<string, string>;
  isProduction: boolean;
  buildConfig?: unknown;
  serverConfig?: unknown;
  httpsConfig?: HttpsConfig | boolean;
}): ValidationResult {
  const { env, isProduction, buildConfig, serverConfig, httpsConfig } = options;
  const errors: Array<{
    category: string;
    message: string;
    severity: 'error' | 'warning';
  }> = [];

  let totalChecks = 0;
  let errorCount = 0;
  let warningCount = 0;

  // 1. 環境変数の検証
  totalChecks++;
  try {
    validateEnvironmentVariables(env);
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      errors.push({
        category: 'environment',
        message: error.message,
        severity: 'error',
      });
      errorCount++;
    }
  }

  // 2. プラグイン設定の検証
  totalChecks++;
  try {
    validatePluginConfig(isProduction);
  } catch (error) {
    if (error instanceof PluginConfigValidationError) {
      errors.push({
        category: 'plugins',
        message: error.message,
        severity: 'error',
      });
      errorCount++;
    }
  }

  // 3. ビルド設定の検証（設定が提供されている場合）
  if (buildConfig) {
    totalChecks++;
    try {
      validateBuildConfig(
        buildConfig as Parameters<typeof validateBuildConfig>[0]
      );
    } catch (error) {
      if (error instanceof BuildConfigValidationError) {
        errors.push({
          category: 'build',
          message: error.message,
          severity: 'error',
        });
        errorCount++;
      }
    }
  }

  // 4. サーバー設定の検証（設定が提供されている場合）
  if (serverConfig) {
    totalChecks++;
    try {
      validateServerConfig(
        serverConfig as Parameters<typeof validateServerConfig>[0]
      );
    } catch (error) {
      if (error instanceof ServerConfigValidationError) {
        errors.push({
          category: 'server',
          message: error.message,
          severity: 'error',
        });
        errorCount++;
      }
    }
  }

  // 5. 設定間の整合性チェック
  totalChecks++;
  try {
    validateConfigConsistency(env, isProduction, httpsConfig);
  } catch (error) {
    errors.push({
      category: 'consistency',
      message: error instanceof Error ? error.message : '設定間の整合性エラー',
      severity: 'warning',
    });
    warningCount++;
  }

  const isValid = errorCount === 0;

  return {
    isValid,
    errors,
    summary: {
      totalChecks,
      errorCount,
      warningCount,
    },
  };
}

/**
 * 設定間の整合性チェック
 */
function validateConfigConsistency(
  env: Record<string, string>,
  isProduction: boolean,
  httpsConfig?: HttpsConfig | boolean
): void {
  const warnings: string[] = [];

  // 1. 環境とHTTPS設定の整合性
  if (isProduction && !httpsConfig) {
    warnings.push('本番環境でHTTPS設定が無効になっています');
  }

  // 2. 環境変数とビルド環境の整合性
  const envMode = env.NODE_ENV || 'development';
  const expectedMode = isProduction ? 'production' : 'development';
  if (envMode !== expectedMode) {
    warnings.push(
      `NODE_ENV (${envMode}) とビルドモード (${expectedMode}) が一致しません`
    );
  }

  // 3. 必須環境変数の相互依存関係チェック
  const hasGoogleMapsKey = !!env.VITE_GOOGLE_MAPS_API_KEY;
  const hasGoogleSheetsKey = !!env.VITE_GOOGLE_SHEETS_API_KEY;

  if (hasGoogleMapsKey && !hasGoogleSheetsKey) {
    warnings.push(
      'Google Maps APIキーが設定されていますが、Google Sheets APIキーが設定されていません'
    );
  }

  // 4. PWA設定の整合性
  if (isProduction && !env.VITE_BASE_PATH) {
    warnings.push(
      '本番環境でベースパスが設定されていません。PWA機能に影響する可能性があります'
    );
  }

  // 警告の出力
  for (const warning of warnings) {
    console.warn(`⚠️ 設定整合性警告: ${warning}`);
  }

  if (warnings.length > 0) {
    throw new Error(`設定間の整合性で ${warnings.length} 個の警告があります`);
  }
}

/**
 * 設定検証の実行とエラーハンドリング
 */
export function runConfigValidation(options: {
  env: Record<string, string>;
  isProduction: boolean;
  buildConfig?: unknown;
  serverConfig?: unknown;
  httpsConfig?: HttpsConfig | boolean;
  throwOnError?: boolean;
}): ValidationResult {
  const { throwOnError = false, ...validationOptions } = options;

  try {
    const result = validateAllConfigs(validationOptions);

    if (!result.isValid && throwOnError) {
      const errorMessages = result.errors
        .filter(e => e.severity === 'error')
        .map(e => `[${e.category}] ${e.message}`)
        .join('\n');

      throw new ConfigValidationError(
        `設定検証に失敗しました:\n${errorMessages}`,
        result.errors.map(e => ({
          category: e.category,
          error: new Error(e.message),
          severity: e.severity,
        }))
      );
    }

    return result;
  } catch (error) {
    if (throwOnError) {
      throw error;
    }

    console.error('❌ 設定検証中にエラーが発生しました:', error);
    return {
      isValid: false,
      errors: [
        {
          category: 'validation',
          message: error instanceof Error ? error.message : '未知のエラー',
          severity: 'error',
        },
      ],
      summary: {
        totalChecks: 0,
        errorCount: 1,
        warningCount: 0,
      },
    };
  }
}
