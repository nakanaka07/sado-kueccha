/**
 * 統一ログユーティリティ
 * アプリケーション全体で一貫したログ出力を提供
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "performance";

interface LogContext {
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// ログレベルごとの設定
const LOG_CONFIG = {
  info: { emoji: "💡", method: console.log },
  warn: { emoji: "⚠️", method: console.warn },
  error: { emoji: "❌", method: console.error },
  debug: { emoji: "🐛", method: console.debug },
  performance: { emoji: "⚡", method: console.log },
} as const;

class Logger {
  private readonly isDevelopment = import.meta.env.DEV;

  /**
   * 統一されたログ出力メソッド
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    // 本番環境ではデバッグログを出力しない
    if (!this.isDevelopment && level === "debug") {
      return;
    }

    const config = LOG_CONFIG[level];
    const formattedMessage = this.formatMessage(config.emoji, message, context);

    // メタデータがある場合は追加で出力
    if (context?.metadata) {
      config.method(formattedMessage, context.metadata);
    } else {
      config.method(formattedMessage);
    }
  }

  /**
   * メッセージをフォーマット
   */
  private formatMessage(emoji: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const componentPrefix = context?.component ? `[${context.component}] ` : "";
    const durationSuffix = context?.duration ? ` (${context.duration.toFixed(2)}ms)` : "";
    return `${emoji} ${timestamp} ${componentPrefix}${message}${durationSuffix}`;
  }

  // 便利メソッド
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  performance(message: string, context?: LogContext): void {
    this.log("performance", message, context);
  }
}

export const logger = new Logger();
export type { LogContext, LogLevel };
