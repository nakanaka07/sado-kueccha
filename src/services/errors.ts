/**
 * 🚨 統一エラーハンドリングシステム
 *
 * @description 全サービス共通のエラークラスとユーティリティ
 * @version 1.0.0 - 初期実装
 */

import { ERROR_CONFIG } from './config';

/**
 * エラーカテゴリ型
 */
export type ErrorCategory =
  (typeof ERROR_CONFIG.CATEGORIES)[keyof typeof ERROR_CONFIG.CATEGORIES];

/**
 * エラーコンテキスト情報
 */
export interface ErrorContext {
  readonly operation?: string;
  readonly service?: string;
  readonly timestamp?: number;
  readonly userAgent?: string;
  readonly url?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * 基底サービスエラークラス
 */
export class ServiceError extends Error {
  public readonly category: ErrorCategory;
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    category: ErrorCategory = ERROR_CONFIG.CATEGORIES.UNKNOWN,
    code?: string,
    context: ErrorContext = {},
    retryable = false
  ) {
    super(message);
    this.name = 'ServiceError';
    this.category = category;
    this.code = code || `${category.toUpperCase()}_ERROR`;
    this.context = {
      timestamp: Date.now(),
      ...context,
    };
    this.timestamp = Date.now();
    this.retryable = retryable;

    // エラーのスタックトレースを設定
    Error.captureStackTrace(this, ServiceError);
  }

  /**
   * エラーの詳細情報を取得
   */
  getDetails(): {
    name: string;
    message: string;
    category: ErrorCategory;
    code: string;
    timestamp: number;
    retryable: boolean;
    context: ErrorContext;
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      code: this.code,
      timestamp: this.timestamp,
      retryable: this.retryable,
      context: this.context,
      ...(this.stack && { stack: this.stack }),
    };
  }

  /**
   * ログ用の文字列表現
   */
  toLogString(): string {
    return `[${this.category.toUpperCase()}] ${this.code}: ${this.message}`;
  }

  /**
   * JSON表現（シリアライズ可能）
   */
  toJSON(): Record<string, unknown> {
    return this.getDetails();
  }
}

/**
 * ネットワーク関連エラー
 */
export class NetworkError extends ServiceError {
  public readonly statusCode?: number;
  public readonly responseBody?: string;

  constructor(
    message: string,
    statusCode?: number,
    responseBody?: string,
    context: ErrorContext = {}
  ) {
    super(
      message,
      ERROR_CONFIG.CATEGORIES.NETWORK,
      `NETWORK_${statusCode || 'UNKNOWN'}`,
      context,
      statusCode ? statusCode >= 500 : true // 5xx系エラーはリトライ可能
    );
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * 認証関連エラー
 */
export class AuthenticationError extends ServiceError {
  constructor(
    message: string,
    code = 'AUTH_FAILED',
    context: ErrorContext = {}
  ) {
    super(message, ERROR_CONFIG.CATEGORIES.AUTH, code, context, false); // 認証エラーはリトライ不可
    this.name = 'AuthenticationError';
  }
}

/**
 * データ検証エラー
 */
export class ValidationError extends ServiceError {
  public readonly field?: string;
  public readonly value?: unknown;
  public readonly constraint?: string;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    constraint?: string,
    context: ErrorContext = {}
  ) {
    super(
      message,
      ERROR_CONFIG.CATEGORIES.VALIDATION,
      `VALIDATION_${field?.toUpperCase() || 'FAILED'}`,
      context,
      false // バリデーションエラーはリトライ不可
    );
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends ServiceError {
  public readonly timeoutMs: number;

  constructor(message: string, timeoutMs: number, context: ErrorContext = {}) {
    super(
      message,
      ERROR_CONFIG.CATEGORIES.TIMEOUT,
      'TIMEOUT_EXCEEDED',
      context,
      true
    ); // タイムアウトはリトライ可能
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Google Sheets API 専用エラー（既存のSheetsApiErrorを拡張）
 */
export class SheetsApiError extends NetworkError {
  public readonly sheetName?: string;
  public readonly range?: string;
  public readonly details?: string;

  constructor(
    message: string,
    statusCode?: number,
    details?: string,
    sheetName?: string,
    range?: string
  ) {
    super(message, statusCode, undefined, {
      operation: 'sheets_api_call',
      service: 'google_sheets',
      metadata: { sheetName, range, details },
    });
    this.name = 'SheetsApiError';
    this.sheetName = sheetName;
    this.range = range;
    this.details = details;
  }
}

/**
 * エラーファクトリー関数
 */
export const createError = {
  network: (
    message: string,
    statusCode?: number,
    context?: ErrorContext
  ): NetworkError => new NetworkError(message, statusCode, undefined, context),

  auth: (message: string, context?: ErrorContext): AuthenticationError =>
    new AuthenticationError(message, 'AUTH_FAILED', context),

  validation: (
    message: string,
    field?: string,
    value?: unknown,
    context?: ErrorContext
  ): ValidationError =>
    new ValidationError(message, field, value, undefined, context),

  timeout: (
    message: string,
    timeoutMs: number,
    context?: ErrorContext
  ): TimeoutError => new TimeoutError(message, timeoutMs, context),

  sheets: (
    message: string,
    statusCode?: number,
    details?: string,
    sheetName?: string,
    range?: string
  ): SheetsApiError =>
    new SheetsApiError(message, statusCode, details, sheetName, range),

  generic: (
    message: string,
    category: ErrorCategory = ERROR_CONFIG.CATEGORIES.UNKNOWN,
    context?: ErrorContext
  ): ServiceError => new ServiceError(message, category, undefined, context),
};

/**
 * エラー判定ユーティリティ
 */
export const isError = {
  /**
   * ServiceErrorかどうかを判定
   */
  serviceError: (error: unknown): error is ServiceError =>
    error instanceof ServiceError,

  /**
   * リトライ可能なエラーかどうかを判定
   */
  retryable: (error: unknown): boolean => {
    if (error instanceof ServiceError) {
      return error.retryable;
    }
    // 標準のエラーはネットワーク系のみリトライ可能とみなす
    return error instanceof TypeError && error.message.includes('fetch');
  },

  /**
   * ネットワークエラーかどうかを判定
   */
  network: (error: unknown): error is NetworkError =>
    error instanceof NetworkError,

  /**
   * 認証エラーかどうかを判定
   */
  auth: (error: unknown): error is AuthenticationError =>
    error instanceof AuthenticationError,

  /**
   * バリデーションエラーかどうかを判定
   */
  validation: (error: unknown): error is ValidationError =>
    error instanceof ValidationError,

  /**
   * タイムアウトエラーかどうかを判定
   */
  timeout: (error: unknown): error is TimeoutError =>
    error instanceof TimeoutError,

  /**
   * Sheets APIエラーかどうかを判定
   */
  sheets: (error: unknown): error is SheetsApiError =>
    error instanceof SheetsApiError,
};

/**
 * エラーハンドリングヘルパー
 */
export const handleError = {
  /**
   * エラーログの出力
   */
  log: (error: unknown, context?: ErrorContext): void => {
    const isDev = import.meta.env.DEV;

    if (isError.serviceError(error)) {
      const logMessage = `${error.toLogString()} | Context: ${JSON.stringify({
        ...error.context,
        ...context,
      })}`;

      if (isDev) {
        console.error(logMessage, error.getDetails());
      }
    } else if (error instanceof Error) {
      const logMessage = `[UNKNOWN] ${error.name}: ${error.message}`;
      if (isDev) {
        console.error(logMessage, { context, stack: error.stack });
      }
    } else {
      const logMessage = `[UNKNOWN] Unknown error: ${String(error)}`;
      if (isDev) {
        console.error(logMessage, { context });
      }
    }
  },

  /**
   * ユーザー向けメッセージの生成
   */
  getUserMessage: (error: unknown): string => {
    if (isError.serviceError(error)) {
      switch (error.category) {
        case ERROR_CONFIG.CATEGORIES.NETWORK:
          return 'ネットワークエラーが発生しました。接続を確認してください。';
        case ERROR_CONFIG.CATEGORIES.AUTH:
          return '認証に失敗しました。設定を確認してください。';
        case ERROR_CONFIG.CATEGORIES.VALIDATION:
          return 'データの形式が正しくありません。';
        case ERROR_CONFIG.CATEGORIES.TIMEOUT:
          return '処理がタイムアウトしました。しばらく後に再試行してください。';
        default:
          return '予期しないエラーが発生しました。';
      }
    }
    return '予期しないエラーが発生しました。';
  },

  /**
   * エラーを標準エラーに変換
   */
  normalize: (error: unknown, context?: ErrorContext): ServiceError => {
    if (isError.serviceError(error)) {
      return error;
    }

    if (error instanceof Error) {
      // 標準エラーをServiceErrorに変換
      return new ServiceError(
        error.message,
        ERROR_CONFIG.CATEGORIES.UNKNOWN,
        error.name,
        { ...context, metadata: { originalStack: error.stack } }
      );
    }

    // 非エラーオブジェクトの場合
    return new ServiceError(
      `Unknown error: ${String(error)}`,
      ERROR_CONFIG.CATEGORIES.UNKNOWN,
      'UNKNOWN_ERROR',
      context
    );
  },
};

/**
 * リトライ実行ヘルパー
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    exponentialBase?: number;
    retryCondition?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attempt: number) => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = ERROR_CONFIG.RETRY.MAX_ATTEMPTS,
    baseDelay = ERROR_CONFIG.RETRY.BASE_DELAY,
    maxDelay = ERROR_CONFIG.RETRY.MAX_DELAY,
    exponentialBase = ERROR_CONFIG.RETRY.EXPONENTIAL_BASE,
    retryCondition = isError.retryable,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 最後の試行の場合はエラーをそのまま投げる
      if (attempt === maxAttempts) {
        throw handleError.normalize(error);
      }

      // リトライ条件をチェック
      if (!retryCondition(error)) {
        throw handleError.normalize(error);
      }

      // リトライコールバックを実行
      onRetry?.(error, attempt);

      // 指数バックオフで待機
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // ここには到達しないはずだが、TypeScriptの型チェックを満たすため
  throw handleError.normalize(lastError);
};
