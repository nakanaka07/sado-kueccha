/**
 * 🎯 Google Sheets モジュール統合エクスポート
 *
 * @description 分割されたSheetsサービスの統一インターフェース
 * @version 1.2.0 - Phase 2 最適化統合（Worker、リアクティブキャッシュ、高度パフォーマンス監視）
 */

// 主要クラスのエクスポート
export { SheetsApiClient } from './client';
export { SheetsDataConverter, removeDuplicatePOIs } from './converter';
export { GoogleSheetsService, googleSheetsService } from './service';

// Phase 2 高度機能のエクスポート
export { performanceLogger } from './performance';
export { reactiveCacheManager, setupPOICacheStrategy } from './reactive-cache';
export { workerAdapter } from './worker-adapter';

// 型定義とユーティリティのエクスポート
export {
  SheetsApiError,
  createContactInfo,
  createGenreId,
  createPOIId,
  parseBusinessHours,
  type OperatingHours,
  type SheetConfig,
} from './types';

// 設定のエクスポート
export { CACHE_TTL, DEFAULT_RANGE, LOAD_STRATEGIES } from './config';

// 後方互換性のためのデフォルトエクスポート
export { googleSheetsService as default } from './service';
