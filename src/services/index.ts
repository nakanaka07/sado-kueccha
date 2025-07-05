/**
 * 🎯 サービス統合エクスポート
 *
 * @description プロジェクト内のすべてのサービスを統一管理
 * @version 2.1.0 - エラーハンドリング統合・設定統合対応
 */

// 🎯 キャッシュサービス
export { cacheService } from './cache';

// 🎯 Google Sheets サービス（モジュール式アーキテクチャ）
export {
  CACHE_TTL,
  DEFAULT_RANGE,
  GoogleSheetsService,
  googleSheetsService,
  performanceLogger,
  SheetsApiClient,
  SheetsDataConverter,
  type OperatingHours,
  type SheetConfig,
} from './sheets/index';

// 🎯 プリローダーサービス
export { preloadManager as preloadService } from './preload';

// 🎯 統合設定
export {
  CACHE_CONFIG,
  DEV_CONFIG,
  ERROR_CONFIG,
  getEnvironmentConfig,
  getServiceConfig,
  GOOGLE_SHEETS_API,
  LOAD_STRATEGIES,
  PERFORMANCE_CONFIG,
  PRELOAD_CONFIG,
  SERVICES_CONFIG,
  SHEETS_DATA_CONFIG,
} from './config';

// 🎯 統一エラーハンドリング
export {
  AuthenticationError,
  createError,
  handleError,
  isError,
  NetworkError,
  ServiceError,
  SheetsApiError,
  TimeoutError,
  ValidationError,
  withRetry,
  type ErrorCategory,
  type ErrorContext,
} from './errors';

/**
 * 🎯 推奨使用パターン
 *
 * ```typescript
 * // モダンアーキテクチャ（推奨）
 * import { googleSheetsService } from '@/services';
 * const pois = await googleSheetsService.fetchPOIData('recommended');
 *
 * // 複数シートデータ取得
 * const allData = await googleSheetsService.fetchAllPOIData();
 *
 * // キャッシュサービス
 * import { cacheService } from '@/services';
 * const cached = cacheService.get('key');
 *
 * // エラーハンドリング
 * import { withRetry, handleError } from '@/services';
 * try {
 *   const result = await withRetry(() => riskyOperation());
 * } catch (error) {
 *   handleError.log(error);
 *   const userMessage = handleError.getUserMessage(error);
 * }
 *
 * // 設定の取得
 * import { getServiceConfig } from '@/services';
 * const cacheConfig = getServiceConfig('CACHE');
 * ```
 */
