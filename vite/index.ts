/**
 * Vite設定モジュール統合
 *
 * @description 各設定ファイルからの機能をエクスポート
 */

export {
  BuildConfigValidationError,
  createBuildConfig,
  validateBuildConfig,
} from './build.js';
export {
  EnvironmentValidationError,
  createProxyErrorHandler,
  getBasePath,
  getHttpsConfig,
  validateEnvironmentVariables,
  type HttpsConfig,
} from './helpers.js';
export {
  PluginConfigValidationError,
  createPlugins,
  validatePluginConfig,
} from './plugins.js';
export {
  ServerConfigValidationError,
  createServerConfig,
  validateServerConfig,
} from './server.js';
export type { ViteConfig, ViteConfigEnv, ViteConfigFunction } from './types.js';
export {
  ConfigValidationError,
  runConfigValidation,
  validateAllConfigs,
  type ValidationResult,
} from './validation.js';

// === 設定読み込み・統合 ===
export {
  ConfigLoadError,
  createIntegratedConfig,
  getDefaultConfig,
  loadEnvironmentConfig,
  loadProfileConfig,
  type ApiConfig,
  type EnvironmentConfig,
  type FeatureFlags,
  type LoggingConfig,
  type PerformanceConfig,
  type ProfileConfig,
  type SecurityConfig,
  type TestingConfig,
  type ViteEnvironmentConfig,
} from './config-loader.js';
