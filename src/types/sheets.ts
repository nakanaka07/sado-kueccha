/**
 * Google Sheets設定の型定義
 * データソースとしてのGoogle Sheetsの管理
 */

import type { Brand, TimestampMs } from './common';

// Sheets関連のブランド型
export type SheetId = Brand<string, 'SheetId'>;
export type SpreadsheetId = Brand<string, 'SpreadsheetId'>;
export type CellRange = Brand<string, 'CellRange'>;

/**
 * Google Sheets設定の基本インターフェース
 * データソースのシート名を管理
 */
export interface SheetsConfig {
  readonly recommended?: SheetId;
  readonly toilets?: SheetId;
  readonly parking?: SheetId;
  readonly ryotsuAikawa?: SheetId;
  readonly kanaiSawada?: SheetId;
  readonly akadomariHamochi?: SheetId;
  readonly snacks?: SheetId;
}

/**
 * 拡張されたSheets設定
 * 詳細な設定情報を含む
 */
export interface ExtendedSheetsConfig extends SheetsConfig {
  readonly spreadsheetId: SpreadsheetId;
  readonly apiKey?: string;
  readonly defaultRange?: CellRange;
  readonly headers?: readonly string[];
  readonly refreshInterval?: number; // ミリ秒
  readonly maxRetries?: number;
  readonly timeout?: number; // ミリ秒
  readonly cache?: {
    readonly enabled: boolean;
    readonly ttl: number; // Time To Live in milliseconds
    readonly maxSize: number;
  };
}

/**
 * シート データのメタデータ
 */
export interface SheetMetadata {
  readonly sheetId: SheetId;
  readonly title: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly lastUpdated: TimestampMs;
  readonly checksum?: string;
  readonly version?: string;
}

/**
 * シートデータの読み込み状態
 */
export interface SheetLoadState {
  readonly sheetId: SheetId;
  readonly status: 'idle' | 'loading' | 'success' | 'error';
  readonly data?: unknown[][];
  readonly metadata?: SheetMetadata;
  readonly error?: Error;
  readonly lastFetch: TimestampMs;
  readonly retryCount: number;
}

/**
 * シートのカラム定義
 */
export interface SheetColumnDefinition {
  readonly name: string;
  readonly index: number;
  readonly type:
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'url'
    | 'email'
    | 'phone';
  readonly required?: boolean;
  readonly validator?: (value: unknown) => boolean;
  readonly transformer?: (value: unknown) => unknown;
  readonly description?: string;
}

/**
 * シートスキーマの定義
 */
export interface SheetSchema {
  readonly sheetId: SheetId;
  readonly name: string;
  readonly columns: readonly SheetColumnDefinition[];
  readonly primaryKey?: string;
  readonly headerRow?: number;
  readonly dataStartRow?: number;
  readonly description?: string;
}

/**
 * シートデータの変換設定
 */
export interface SheetTransformConfig {
  readonly skipEmptyRows?: boolean;
  readonly trimWhitespace?: boolean;
  readonly convertTypes?: boolean;
  readonly validateData?: boolean;
  readonly errorHandling?: 'strict' | 'lenient' | 'ignore';
  readonly customTransformers?: Record<string, (value: unknown) => unknown>;
}

/**
 * シートAPIの操作結果
 */
export interface SheetOperationResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly metadata?: {
    readonly requestId?: string;
    readonly timestamp: TimestampMs;
    readonly quotaUsed?: number;
    readonly responseTime?: number;
  };
}

/**
 * シートデータのバッチ操作
 */
export interface SheetBatchOperation {
  readonly operations: ReadonlyArray<{
    readonly type: 'read' | 'write' | 'update' | 'delete';
    readonly sheetId: SheetId;
    readonly range?: CellRange;
    readonly data?: unknown[][];
    readonly options?: SheetTransformConfig;
  }>;
  readonly transactional?: boolean;
  readonly continueOnError?: boolean;
}

// 型ガード関数
export const isSheetId = (value: string): value is SheetId => {
  return typeof value === 'string' && value.length > 0;
};

export const isSpreadsheetId = (value: string): value is SpreadsheetId => {
  return typeof value === 'string' && /^[a-zA-Z0-9-_]+$/.test(value);
};

export const isCellRange = (value: string): value is CellRange => {
  return typeof value === 'string' && /^[A-Z]+\d+:[A-Z]+\d+$/.test(value);
};

export const isValidSheetsConfig = (
  config: unknown
): config is SheetsConfig => {
  if (typeof config !== 'object' || config === null) return false;

  const candidate = config as Record<string, unknown>;
  const validKeys = [
    'recommended',
    'toilets',
    'parking',
    'ryotsuAikawa',
    'kanaiSawada',
    'akadomariHamochi',
    'snacks',
  ];

  return (
    Object.keys(candidate).every(key => validKeys.includes(key)) &&
    Object.values(candidate).every(
      value => value === undefined || typeof value === 'string'
    )
  );
};

/**
 * シート設定のデフォルト値
 */
export const DEFAULT_SHEET_CONFIG: Partial<ExtendedSheetsConfig> = {
  defaultRange: 'A1:Z1000' as CellRange,
  refreshInterval: 300000, // 5分
  maxRetries: 3,
  timeout: 10000, // 10秒
  cache: {
    enabled: true,
    ttl: 300000, // 5分
    maxSize: 100,
  },
} as const;

/**
 * よく使用されるシート操作のユーティリティ型
 */
export type SheetDataRow = Record<string, unknown>;
export type SheetDataMatrix = ReadonlyArray<readonly unknown[]>;

/**
 * シートコンテキストの型定義
 */
export interface SheetsContextValue {
  readonly config: ExtendedSheetsConfig;
  readonly loadStates: readonly SheetLoadState[];
  readonly schemas: readonly SheetSchema[];
  readonly loadSheet: (
    sheetId: SheetId,
    options?: SheetTransformConfig
  ) => Promise<SheetOperationResult>;
  readonly refreshSheet: (sheetId: SheetId) => Promise<SheetOperationResult>;
  readonly getSheetData: (sheetId: SheetId) => SheetDataMatrix | undefined;
  readonly validateSheetData: (
    sheetId: SheetId,
    data: SheetDataMatrix
  ) => readonly string[];
}
