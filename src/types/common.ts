/**
 * 共通型定義
 * アプリケーション全体で使用される基本的な型定義とユーティリティ型
 */

// ブランド型の基盤定義
export type Brand<T, U> = T & { readonly __brand: U };

// 基本的なID型の定義
export type EntityId = Brand<string, 'EntityId'>;
export type TimestampMs = Brand<number, 'TimestampMs'>;
export type VersionString = Brand<string, 'Version'>;

/**
 * 位置情報を持つオブジェクトの型
 * 地理的座標を含むエンティティの基底型
 */
export interface PositionObject {
  readonly position: Coordinates;
}

/**
 * 位置座標の型
 * WGS84座標系での緯度経度を表現
 */
export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

/**
 * 拡張された座標情報
 * 精度や高度情報を含む
 */
export interface ExtendedCoordinates extends Coordinates {
  readonly accuracy?: number;
  readonly altitude?: number;
  readonly altitudeAccuracy?: number;
  readonly heading?: number;
  readonly speed?: number;
}

/**
 * キャッシュエントリの共通インターフェース
 * ジェネリック型を使用した型安全なキャッシュシステム
 *
 * @template T - キャッシュされるデータの型
 */
export interface CacheEntry<T = unknown> {
  /** キャッシュされるデータ */
  readonly data: T;
  /** データが保存された時刻のタイムスタンプ */
  readonly timestamp: TimestampMs;
  /** 有効期限（ミリ秒、省略時はデフォルト値を使用） */
  readonly expiry?: TimestampMs;
  /** データの整合性チェック用ハッシュ */
  readonly checksum?: string;
}

/**
 * 強化されたキャッシュエントリのメタデータ
 * パフォーマンス監視とキャッシュ戦略のための情報
 */
export interface CacheMetadata {
  /** アクセス回数 */
  readonly accessCount: number;
  /** 最後にアクセスされた時刻 */
  readonly lastAccessed: TimestampMs;
  /** データのバージョン情報 */
  readonly version: VersionString;
  /** データサイズ（バイト） */
  readonly size?: number;
  /** キャッシュの優先度 */
  readonly priority?: 'high' | 'medium' | 'low';
}

/**
 * 拡張キャッシュエントリ
 * メタデータを含む完全なキャッシュエントリ
 */
export interface ExtendedCacheEntry<T = unknown> extends CacheEntry<T> {
  readonly metadata: CacheMetadata;
}

/**
 * 型ガード関数の型定義
 * より厳密な型チェックのための関数型
 *
 * @template T - ガードする型
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * 述語関数の型定義
 * フィルタリングなどで使用
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * エラー処理用の結果型
 * Railway-oriented programming パターンの実装
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * オプショナルな値の型
 * null/undefined の安全な取り扱い
 */
export type Maybe<T> = T | null | undefined;

/**
 * 非null/undefinedの値を保証する型
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 部分的な更新用の型
 * DeepPartial を使用したネストした構造での部分更新対応
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 読み取り専用の深い型
 * 完全なイミュータビリティの保証
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 非同期操作の状態
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 非同期操作の状態管理用型
 */
export interface AsyncState<T = unknown, E = Error> {
  readonly status: AsyncStatus;
  readonly data?: T;
  readonly error?: E;
  readonly isLoading: boolean;
  readonly isSuccess: boolean;
  readonly isError: boolean;
}

// 型ガード関数の実装例
export const isCoordinates = (value: unknown): value is Coordinates => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    'lat' in candidate &&
    'lng' in candidate &&
    typeof candidate.lat === 'number' &&
    typeof candidate.lng === 'number'
  );
};

export const isPositionObject = (value: unknown): value is PositionObject => {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return 'position' in candidate && isCoordinates(candidate.position);
};

/**
 * 共通のバリデーション関数型
 */
export type Validator<T> = (value: unknown) => Result<T, string>;

/**
 * 設定オブジェクトの基底型
 */
export type BaseConfig = Record<string, unknown>;

/**
 * 環境変数の型安全なアクセス用
 */
export interface EnvironmentConfig extends Record<string, unknown> {
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly API_BASE_URL?: string;
  readonly DEBUG?: boolean;
}

/**
 * ローディング状態を表す型
 * アプリケーション全体でのローディング管理に使用
 */
export interface LoadingState {
  /** ローディング中かどうか */
  readonly isLoading: boolean;
  /** 進捗率（0-100） */
  readonly progress?: number;
  /** ローディングメッセージ */
  readonly message?: string;
  /** エラー情報 */
  readonly error?: Error | null;
  /** 詳細な進捗情報 */
  readonly progressDetails?: string;
}

/**
 * プログレッシブローディングの段階
 */
export type LoadingPhase =
  | 'initializing'
  | 'loading-assets'
  | 'loading-data'
  | 'processing'
  | 'finalizing'
  | 'complete'
  | 'error';

/**
 * アクセシビリティ関連の設定
 */
export interface AccessibilityConfig {
  /** プリファードモーション設定 */
  readonly prefersReducedMotion?: boolean;
  /** 高コントラストモード */
  readonly prefersHighContrast?: boolean;
  /** ダークモード設定 */
  readonly prefersDarkMode?: boolean;
  /** スクリーンリーダー対応 */
  readonly screenReaderEnabled?: boolean;
}

/**
 * アプリケーション設定関連の型
 */
export interface AppConfig {
  readonly googleMapsApiKey: string;
  readonly googleSheetsApiKey: string;
  readonly spreadsheetId: string;
  readonly refreshInterval?: number;
  readonly debug?: boolean;
  readonly features?: {
    readonly clustering?: boolean;
    readonly geolocation?: boolean;
    readonly caching?: boolean;
    readonly analytics?: boolean;
  };
}

/**
 * エラーバウンダリの状態管理
 */
export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error?: Error;
  readonly errorInfo?: {
    readonly componentStack: string;
    readonly errorBoundary?: string;
  };
  readonly retryCount: number;
  readonly timestamp: TimestampMs;
}

/**
 * アプリケーション全体の状態管理用型
 */
export interface AppState {
  readonly initialized: boolean;
  readonly loading: boolean;
  readonly error?: Error;
  readonly user?: {
    readonly id: string;
    readonly preferences: Record<string, unknown>;
  };
  readonly session?: {
    readonly id: string;
    readonly startTime: TimestampMs;
    readonly lastActivity: TimestampMs;
  };
}

/**
 * パフォーマンス監視用の型
 */
export interface PerformanceMetrics {
  readonly renderTime: number;
  readonly loadTime: number;
  readonly memoryUsage?: number;
  readonly bundleSize?: number;
  readonly cacheHitRate?: number;
}

/**
 * API応答の共通型
 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly metadata?: {
    readonly requestId: string;
    readonly timestamp: TimestampMs;
    readonly version: string;
  };
}

/**
 * イベント処理用の型
 */
export interface CustomEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: TimestampMs;
  readonly source?: string;
  readonly preventDefault?: () => void;
  readonly stopPropagation?: () => void;
}

/**
 * ログレベルの定義
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ログエントリの型
 */
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: TimestampMs;
  readonly context?: Record<string, unknown>;
  readonly error?: Error;
  readonly source?: string;
}
