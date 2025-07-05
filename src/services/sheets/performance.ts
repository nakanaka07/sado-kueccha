/**
 * 📊 パフォーマンス監視モジュール
 *
 * @description Google Sheets API のパフォーマンス監視とロギング機能
 * @version 1.1.0 - Phase 2 強化版（リアルタイム監視、メトリクス集計）
 */

import type { PerformanceLogEntry } from './types';

/**
 * パフォーマンスメトリクス集計型
 */
interface PerformanceMetrics {
  totalOperations: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  slowestOperation: {
    operation: string;
    duration: number;
    metadata?: Record<string, unknown>;
  } | null;
  fastestOperation: {
    operation: string;
    duration: number;
    metadata?: Record<string, unknown>;
  } | null;
  operationsPerSecond: number;
  errorRate: number;
  cacheHitRate: number;
}

/**
 * リアルタイムパフォーマンス監視システム
 */
class AdvancedPerformanceLogger {
  private readonly logs: PerformanceLogEntry[] = [];
  private readonly maxLogSize = 1000; // メモリ効率のため最大ログ数制限
  private readonly operationCounts = new Map<string, number>();
  private readonly operationDurations = new Map<string, number[]>();
  private errorCount = 0;
  private cacheHits = 0;
  private cacheAttempts = 0;

  /**
   * 操作のパフォーマンスをログ記録
   */
  async logOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    let success = true;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      this.errorCount++;
      throw error;
    } finally {
      const duration = performance.now() - start;

      this.recordOperation(operation, duration, success, metadata);

      // リアルタイム警告
      this.checkPerformanceThresholds(operation, duration);
    }
  }

  /**
   * 操作記録の内部実装
   */
  private recordOperation(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const logEntry: PerformanceLogEntry = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      ...(metadata && { metadata }),
    };

    // ログサイズ制限
    if (this.logs.length >= this.maxLogSize) {
      this.logs.shift(); // 古いログを削除
    }
    this.logs.push(logEntry);

    // 統計データ更新
    this.operationCounts.set(
      operation,
      (this.operationCounts.get(operation) || 0) + 1
    );

    if (!this.operationDurations.has(operation)) {
      this.operationDurations.set(operation, []);
    }
    const durations = this.operationDurations.get(operation);
    if (durations) {
      durations.push(duration);

      // 統計データもサイズ制限
      if (durations.length > 100) {
        durations.shift();
      }
    }
  }

  /**
   * パフォーマンス閾値チェック
   */
  private checkPerformanceThresholds(
    operation: string,
    duration: number
  ): void {
    if (!import.meta.env.DEV) return;

    // 警告閾値
    const slowThreshold = 1000; // 1秒
    const verySlowThreshold = 3000; // 3秒

    if (duration > verySlowThreshold) {
      console.error(
        `🔴 非常に遅い操作検出: ${operation} (${duration.toFixed(2)}ms)`
      );
    } else if (duration > slowThreshold) {
      console.warn(`⚠️ 遅い操作検出: ${operation} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * キャッシュヒットを記録
   */
  recordCacheHit(): void {
    this.cacheHits++;
    this.cacheAttempts++;
  }

  /**
   * キャッシュミスを記録
   */
  recordCacheMiss(): void {
    this.cacheAttempts++;
  }

  /**
   * 高度なパフォーマンス統計を取得
   */
  getAdvancedMetrics(): PerformanceMetrics {
    if (this.logs.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        slowestOperation: null,
        fastestOperation: null,
        operationsPerSecond: 0,
        errorRate: 0,
        cacheHitRate: 0,
      };
    }

    const durations = this.logs.map(log => log.duration).sort((a, b) => a - b);

    const slowestLog = this.logs.reduce((slowest, current) =>
      current.duration > slowest.duration ? current : slowest
    );

    const fastestLog = this.logs.reduce((fastest, current) =>
      current.duration < fastest.duration ? current : fastest
    );

    const firstLog = this.logs[0];
    const lastLog = this.logs[this.logs.length - 1];
    const timeSpan =
      firstLog && lastLog ? lastLog.timestamp - firstLog.timestamp : 0;
    const operationsPerSecond =
      timeSpan > 0 ? (this.logs.length / timeSpan) * 1000 : 0;

    return {
      totalOperations: this.logs.length,
      averageDuration:
        durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)] || 0,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      slowestOperation: {
        operation: slowestLog.operation,
        duration: slowestLog.duration,
        metadata: slowestLog.metadata,
      },
      fastestOperation: {
        operation: fastestLog.operation,
        duration: fastestLog.duration,
        metadata: fastestLog.metadata,
      },
      operationsPerSecond,
      errorRate: this.logs.length > 0 ? this.errorCount / this.logs.length : 0,
      cacheHitRate:
        this.cacheAttempts > 0 ? this.cacheHits / this.cacheAttempts : 0,
    };
  }

  /**
   * 操作別統計を取得
   */
  getOperationBreakdown(): Array<{
    operation: string;
    count: number;
    averageDuration: number;
    totalDuration: number;
  }> {
    const breakdown: Array<{
      operation: string;
      count: number;
      averageDuration: number;
      totalDuration: number;
    }> = [];

    for (const [operation, durations] of this.operationDurations.entries()) {
      const totalDuration = durations.reduce((sum, d) => sum + d, 0);
      const averageDuration = totalDuration / durations.length;

      breakdown.push({
        operation,
        count: durations.length,
        averageDuration,
        totalDuration,
      });
    }

    return breakdown.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  /**
   * パフォーマンスサマリーをコンソールに出力（開発環境のみ）
   */
  logPerformanceSummary(): void {
    if (!import.meta.env.DEV) return;

    const metrics = this.getAdvancedMetrics();
    const breakdown = this.getOperationBreakdown();

    // 開発環境での統計表示（簡素化）
    if (metrics.totalOperations > 0) {
      console.warn(
        `📊 Performance: ${metrics.totalOperations} ops, avg ${metrics.averageDuration.toFixed(2)}ms`
      );
      if (breakdown.length > 0 && breakdown[0]) {
        const topOperation = breakdown[0];
        console.warn(
          `  Top: ${topOperation.operation} (${topOperation.count} calls, ${topOperation.averageDuration.toFixed(2)}ms avg)`
        );
      }
    }
  }

  /**
   * 古いログと統計をクリア
   */
  clear(): void {
    this.logs.length = 0;
    this.operationCounts.clear();
    this.operationDurations.clear();
    this.errorCount = 0;
    this.cacheHits = 0;
    this.cacheAttempts = 0;
  }

  /**
   * 最近のログを取得
   */
  getRecentLogs(count = 10): PerformanceLogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * 遅い操作のログのみを取得
   */
  getSlowOperations(threshold = 1000): PerformanceLogEntry[] {
    return this.logs.filter(log => log.duration > threshold);
  }

  // 後方互換性のためのエイリアス
  getStats() {
    const advanced = this.getAdvancedMetrics();
    return {
      totalOperations: advanced.totalOperations,
      averageDuration: advanced.averageDuration,
      slowestOperation: advanced.slowestOperation,
      operationsPerSecond: advanced.operationsPerSecond,
    };
  }
}

// シングルトンインスタンス
export const performanceLogger = new AdvancedPerformanceLogger();
