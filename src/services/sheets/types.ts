/**
 * 🎯 Google Sheets サービス型定義
 *
 * @description Sheets API 関連の型定義を一元管理（厳密版へ移行）
 * @version 2.0.0 - 厳密型定義への移行
 */

// 新しい厳密な型定義をエクスポート
export {
  CATEGORY_MAPPING,
  categorizeFromGenre,
  createContactInfo,
  createGenreId,
  createPOIId,
  hasRequiredFields,
  isPOICategory,
  isString,
  isStringArray,
  isValidSheetConfig,
  parseBusinessHours,
  safeGetString,
  validateCoordinates,
  type DataQualityReport,
  type LoadStrategy,
  type OperatingHours,
  type PerformanceLogEntry,
  type RequestMetadata,
  type SheetConfig,
  type TimeFormat,
} from './types-strict';

// 後方互換性のため、旧来のSheetsApiErrorを統合エラーシステムから再エクスポート
export { SheetsApiError } from '../errors';
