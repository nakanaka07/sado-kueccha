/**
 * 統合ログシステム
 * 環境に応じたログレベル制御とパフォーマンス最適化
 *
 * @description
 * - 本番環境でのconsole出力制御
 * - 開発環境での詳細ログ出力
 * - エラー報告システム準備
 * - パフォーマンス影響の最小化
 */

import { isDevelopment, isProduction } from './env';

// ログレベル定義
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

// ログレベルの優先度
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
} as const;

// 環境別デフォルトログレベル
const DEFAULT_LOG_LEVEL: LogLevel = isProduction() ? 'error' : 'debug';

/**
 * ログ設定インターフェース
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enablePersistence: boolean;
  maxLogEntries: number;
}

/**
 * ログエントリ構造
 */
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: string;
}

/**
 * 統合ログクラス
 */
class Logger {
  private readonly config: LoggerConfig;
  private logBuffer: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: DEFAULT_LOG_LEVEL,
      enableConsole: !isProduction(),
      enablePersistence: isProduction(),
      maxLogEntries: 1000,
      ...config,
    };
  }

  /**
   * ログレベルを設定
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * ログ出力の判定
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  /**
   * ログエントリの作成
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): LogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      data,
      context,
    };
  }

  /**
   * コンソール出力（環境制御付き）
   */
  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const prefix = isDevelopment() ? `[${entry.level.toUpperCase()}]` : '';

    const timestamp = isDevelopment()
      ? `[${new Date(entry.timestamp).toISOString()}]`
      : '';

    const contextStr = entry.context ? `[${entry.context}]` : '';
    const fullMessage = `${prefix}${timestamp}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage, entry.data);
        break;
      case 'info':
        console.info(fullMessage, entry.data);
        break;
      case 'warn':
        console.warn(fullMessage, entry.data);
        break;
      case 'error':
        // エラーログは安全な方法で出力
        console.error(fullMessage);
        if (entry.data) {
          console.log('Error details:', entry.data);
        }
        break;
    }
  }

  /**
   * ログの永続化（本番環境用）
   */
  private persistLog(entry: LogEntry): void {
    if (!this.config.enablePersistence) return;

    this.addToBuffer(entry);

    // 本番環境では重要なログのみローカルストレージに保存
    if (entry.level === 'error' || entry.level === 'warn') {
      try {
        const existingLogs = localStorage.getItem('app-logs');
        const logs: LogEntry[] = existingLogs
          ? (JSON.parse(existingLogs) as LogEntry[])
          : [];
        logs.push(entry);

        // 最新100件のみ保持
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }

        localStorage.setItem('app-logs', JSON.stringify(logs));
      } catch (_error) {
        // ローカルストレージエラーは無視
      }
    }
  }

  /**
   * バッファへの安全な追加
   */
  private addToBuffer(entry: LogEntry): void {
    try {
      this.logBuffer.push(entry);

      // バッファサイズ制限
      if (this.logBuffer.length > this.config.maxLogEntries) {
        this.logBuffer.shift(); // 古いエントリを削除
      }
    } catch (error) {
      // バッファ追加失敗時は無視（無限ループ防止）
      console.warn('Log buffer addition failed:', error);
    }
  }

  /**
   * 汎用ログメソッド
   */
  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, data, context);

    this.outputToConsole(entry);
    this.persistLog(entry);
  }

  /**
   * デバッグログ
   */
  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  /**
   * 情報ログ
   */
  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * 警告ログ
   */
  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * エラーログ
   */
  error(message: string, error?: Error, context?: string): void {
    if (!this.shouldLog('error')) return;

    const logEntry = this.createLogEntry('error', message, error, context);

    // エラーオブジェクトの場合はスタックトレースを追加
    if (error instanceof Error) {
      logEntry.data = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      };
    }

    this.addToBuffer(logEntry);
    this.outputToConsole(logEntry);
  }

  /**
   * パフォーマンス測定用ログ
   */
  performance(message: string, startTime: number, context?: string): void {
    if (!this.shouldLog('info')) return;

    const duration = performance.now() - startTime;
    const logEntry = this.createLogEntry(
      'info',
      message,
      { duration },
      context
    );

    this.addToBuffer(logEntry);
    this.outputToConsole(logEntry);
  }

  /**
   * 条件付きログ（開発環境のみ）
   */
  devOnly = {
    debug: (message: string, data?: unknown, context?: string) => {
      if (isDevelopment()) this.debug(message, data, context);
    },
    info: (message: string, data?: unknown, context?: string) => {
      if (isDevelopment()) this.info(message, data, context);
    },
    warn: (message: string, data?: unknown, context?: string) => {
      if (isDevelopment()) this.warn(message, data, context);
    },
  };

  /**
   * パフォーマンス測定付きログ
   */
  performanceLogger = {
    start: (label: string): void => {
      if (isDevelopment()) {
        window.performance.mark(`${label}-start`);
      }
    },
    end: (label: string): void => {
      if (isDevelopment()) {
        window.performance.mark(`${label}-end`);
        window.performance.measure(label, `${label}-start`, `${label}-end`);

        const measures = window.performance.getEntriesByName(label);
        const measure = measures[measures.length - 1];
        if (measure && 'duration' in measure) {
          this.debug(
            `Performance: ${label}`,
            {
              duration: `${measure.duration.toFixed(2)}ms`,
            },
            'performance'
          );
        }
      }
    },
  };

  /**
   * ログバッファの取得（エラー報告用）
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * エラーログの取得（本番環境用）
   */
  getErrorLogs(): LogEntry[] {
    return this.logBuffer.filter(
      entry => entry.level === 'error' || entry.level === 'warn'
    );
  }

  /**
   * ログクリア
   */
  clear(): void {
    this.logBuffer = [];
    try {
      localStorage.removeItem('app-logs');
    } catch (_error) {
      // ローカルストレージエラーは無視
    }
  }
}

// グローバルロガーインスタンス
export const logger = new Logger();

// 便利なエクスポート
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const { devOnly, performanceLogger } = logger;

// レガシーconsole置き換え用（段階的移行用）
export const console = {
  debug: logger.debug.bind(logger),
  log: logger.info.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};

export default logger;
