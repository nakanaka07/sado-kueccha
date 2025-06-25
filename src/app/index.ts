/**
 * アプリケーションのメインエントリーポイント
 */
export { default } from './App';

/**
 * アプリケーション設定の再エクスポート
 * 他のモジュールから設定にアクセスする際に使用
 */
export {
  ANIMATION_CONFIG,
  APP_CONFIG,
  FEATURE_FLAGS,
  getAppConfig,
  getCurrentEnvConfig,
  getFeatureFlag,
  PERFORMANCE_CONFIG,
  type AppConfigKey,
  type EnvironmentType,
  type FeatureFlagKey,
} from './AppConfig';
