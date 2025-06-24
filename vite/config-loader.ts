import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * 環境設定の型定義
 */
export interface EnvironmentConfig {
  name: string;
  description: string;
  vite: ViteEnvironmentConfig;
  api: ApiConfig;
  features: FeatureFlags;
  logging: LoggingConfig;
  performance: PerformanceConfig;
  security?: SecurityConfig;
  testing?: TestingConfig;
}

export interface ViteEnvironmentConfig {
  server: {
    port: number;
    host?: string;
    https?: boolean;
    hmr?: {
      port?: number;
      overlay?: boolean;
    };
    strictPort?: boolean;
    open?: boolean;
  };
  build: {
    sourcemap: boolean;
    minify: boolean | string;
    reportCompressedSize?: boolean;
    chunkSizeWarningLimit?: number;
    rollupOptions?: Record<string, unknown>;
  };
  optimizeDeps?: {
    force?: boolean;
    include?: string[];
  };
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface FeatureFlags {
  devTools: boolean;
  bundleAnalyzer: boolean;
  pwa: boolean;
  errorOverlay?: boolean;
  hotReload?: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableNetwork: boolean;
}

export interface PerformanceConfig {
  optimizationLevel: 'minimal' | 'balanced' | 'aggressive';
  enableProfiling: boolean;
}

export interface SecurityConfig {
  csp?: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
}

export interface TestingConfig {
  coverage: {
    threshold: number;
    reportFormats: string[];
  };
  timeout: number;
  parallel: boolean;
  mockApi: boolean;
}

/**
 * プロファイル設定の型定義
 */
export interface ProfileConfig {
  name: string;
  description: string;
  performance: {
    bundleSize: {
      maxChunkSize: number;
      maxAssetSize: number;
    };
    buildTime: {
      maxBuildTime: number;
    };
    runtime: {
      initialLoadTime: number;
      cacheHitRate: number;
    };
  };
  features: Record<string, boolean>;
  plugins: {
    essential: string[];
    optimization?: string[];
    disabled?: string[];
  };
  build: Record<string, unknown>;
  optimization?: Record<string, unknown>;
  debugging?: Record<string, boolean>;
}

/**
 * 設定読み込みエラー
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly configPath: string
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * 環境設定を読み込む
 *
 * @param environment - 環境名 (development, production, test, staging)
 * @param configDir - 設定ディレクトリパス (デフォルト: ./config)
 * @returns 環境設定オブジェクト
 */
export function loadEnvironmentConfig(
  environment: string,
  configDir = './config'
): EnvironmentConfig {
  const configPath = path.resolve(configDir, `${environment}.json`);

  if (!existsSync(configPath)) {
    throw new ConfigLoadError(
      `Environment config file not found: ${environment}.json`,
      configPath
    );
  }

  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as EnvironmentConfig;

    // 基本バリデーション
    validateEnvironmentConfig(config);

    return config;
  } catch (error) {
    if (error instanceof ConfigLoadError) {
      throw error;
    }
    throw new ConfigLoadError(
      `Failed to load environment config: ${
        error instanceof Error ? error.message : String(error)
      }`,
      configPath
    );
  }
}

/**
 * プロファイル設定を読み込む
 *
 * @param profileName - プロファイル名 (minimal, full, performance)
 * @param configDir - 設定ディレクトリパス
 * @returns プロファイル設定オブジェクト
 */
export function loadProfileConfig(
  profileName: string,
  configDir = './config'
): ProfileConfig {
  const profilePath = path.resolve(
    configDir,
    'profiles',
    `${profileName}.json`
  );

  if (!existsSync(profilePath)) {
    throw new ConfigLoadError(
      `Profile config file not found: ${profileName}.json`,
      profilePath
    );
  }

  try {
    const configContent = readFileSync(profilePath, 'utf-8');
    return JSON.parse(configContent) as ProfileConfig;
  } catch (error) {
    throw new ConfigLoadError(
      `Failed to load profile config: ${error instanceof Error ? error.message : String(error)}`,
      profilePath
    );
  }
}

/**
 * 統合設定を作成
 * 環境設定とプロファイル設定を統合し、環境変数でオーバーライド
 *
 * @param environment - 環境名
 * @param profile - プロファイル名（オプション）
 * @param envOverrides - 環境変数オーバーライド
 * @returns 統合された設定
 */
export function createIntegratedConfig(
  environment: string,
  profile?: string,
  envOverrides: Record<string, string | undefined> = process.env
) {
  // 基本設定の読み込み
  const envConfig = loadEnvironmentConfig(environment);

  // プロファイル設定の読み込み（指定された場合）
  let profileConfig: ProfileConfig | undefined;
  if (profile) {
    try {
      profileConfig = loadProfileConfig(profile);
    } catch (_error) {
      console.warn(
        `Profile config not found, using environment config only: ${profile}`
      );
    }
  }

  // 環境変数からのオーバーライド
  const config = applyEnvironmentOverrides(envConfig, envOverrides);

  // プロファイル設定の適用
  if (profileConfig?.performance) {
    config.performance.optimizationLevel = 'balanced'; // プロファイルに基づいて設定
  }

  return config;
}

/**
 * 環境変数オーバーライドを適用
 *
 * @param config - 基本設定
 * @param envVars - 環境変数
 * @returns オーバーライドされた設定
 */
function applyEnvironmentOverrides(
  config: EnvironmentConfig,
  envVars: Record<string, string | undefined>
): EnvironmentConfig {
  const overrides = { ...config };

  // ポート番号のオーバーライド
  if (envVars.PORT) {
    overrides.vite.server.port = parseInt(envVars.PORT, 10);
  }

  // API URLのオーバーライド
  if (envVars.VITE_API_BASE_URL) {
    overrides.api.baseUrl = envVars.VITE_API_BASE_URL;
  }

  // HTTPS設定のオーバーライド
  if (envVars.HTTPS !== undefined) {
    overrides.vite.server.https = envVars.HTTPS === 'true';
  }

  // ログレベルのオーバーライド
  if (envVars.LOG_LEVEL) {
    overrides.logging.level = envVars.LOG_LEVEL as LoggingConfig['level'];
  }

  return overrides;
}

/**
 * 環境設定のバリデーション
 *
 * @param config - 検証する設定
 */
function validateEnvironmentConfig(config: EnvironmentConfig): void {
  const errors: string[] = [];

  // 必須フィールドの検証
  if (!config.name) {
    errors.push('Environment name is required');
  }

  if (!config.vite.server.port) {
    errors.push('Server port is required');
  }

  if (!config.api.baseUrl) {
    errors.push('API base URL is required');
  }

  // ポート番号の検証
  if (config.vite.server.port < 1 || config.vite.server.port > 65535) {
    errors.push('Server port must be between 1 and 65535');
  }

  // ログレベルの検証
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(config.logging.level)) {
    errors.push(`Invalid log level: ${config.logging.level}`);
  }

  if (errors.length > 0) {
    throw new ConfigLoadError(
      `Configuration validation failed: ${errors.join(', ')}`,
      'validation'
    );
  }
}

/**
 * デフォルト設定を取得
 * 設定ファイルが見つからない場合のフォールバック
 */
export function getDefaultConfig(): EnvironmentConfig {
  return {
    name: 'default',
    description: 'Default fallback configuration',
    vite: {
      server: {
        port: 5173,
        host: 'localhost',
        https: false,
      },
      build: {
        sourcemap: true,
        minify: false,
      },
    },
    api: {
      baseUrl: 'http://localhost:8080',
      timeout: 30000,
      retries: 3,
    },
    features: {
      devTools: true,
      bundleAnalyzer: false,
      pwa: false,
    },
    logging: {
      level: 'info',
      enableConsole: true,
      enableNetwork: false,
    },
    performance: {
      optimizationLevel: 'balanced',
      enableProfiling: false,
    },
  };
}
