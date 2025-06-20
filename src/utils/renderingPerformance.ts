/**
 * レンダリング性能監視ユーティリティ
 * リアルタイムでのパフォーマンス測定と最適化提案
 *
 * @description
 * - FPS監視
 * - レンダリング時間測定
 * - メモリ使用量監視
 * - パフォーマンス最適化の提案
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import { useEffect, useState } from "react";

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderCount: number;
  timestamp: number;
}

interface PerformanceConfig {
  /** FPS測定間隔（ミリ秒） */
  fpsInterval: number;
  /** メトリクス履歴の保持数 */
  maxHistory: number;
  /** 警告しきい値 */
  thresholds: {
    lowFps: number;
    highFrameTime: number;
    highMemoryUsage: number;
  };
}

class RenderingPerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private animationFrameId: number | null = null;
  private isMonitoring = false;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      fpsInterval: 1000,
      maxHistory: 60,
      thresholds: {
        lowFps: 30,
        highFrameTime: 16.67, // 60FPS基準
        highMemoryUsage: 50 * 1024 * 1024, // 50MB
      },
      ...config,
    };
  }

  /**
   * パフォーマンス監視を開始
   */
  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.measureFPS();
  }

  /**
   * パフォーマンス監視を停止
   */
  stop(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * メトリクス監視者を追加
   */
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * 現在のパフォーマンスメトリクスを取得
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] ?? null;
  }

  /**
   * パフォーマンス履歴を取得
   */
  getHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * パフォーマンス統計を取得
   */
  getStats() {
    if (this.metrics.length === 0) return null;

    const fps = this.metrics.map((m) => m.fps);
    const frameTimes = this.metrics.map((m) => m.frameTime);

    return {
      averageFps: fps.reduce((a, b) => a + b, 0) / fps.length,
      minFps: Math.min(...fps),
      maxFps: Math.max(...fps),
      averageFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      maxFrameTime: Math.max(...frameTimes),
      totalRenderCount: this.metrics.reduce((total, m) => total + m.renderCount, 0),
    };
  }

  /**
   * パフォーマンス警告をチェック
   */
  checkPerformanceWarnings(): string[] {
    const current = this.getCurrentMetrics();
    if (!current) return [];

    const warnings: string[] = [];

    if (current.fps < this.config.thresholds.lowFps) {
      warnings.push(
        `低FPS検出: ${current.fps.toFixed(1)}fps (推奨: ${this.config.thresholds.lowFps}fps以上)`,
      );
    }

    if (current.frameTime > this.config.thresholds.highFrameTime) {
      warnings.push(
        `高フレーム時間: ${current.frameTime.toFixed(2)}ms (推奨: ${
          this.config.thresholds.highFrameTime
        }ms以下)`,
      );
    }

    if (current.memoryUsage && current.memoryUsage > this.config.thresholds.highMemoryUsage) {
      const memoryMB = (current.memoryUsage / (1024 * 1024)).toFixed(1);
      const thresholdMB = (this.config.thresholds.highMemoryUsage / (1024 * 1024)).toFixed(1);
      warnings.push(`高メモリ使用量: ${memoryMB}MB (推奨: ${thresholdMB}MB以下)`);
    }

    return warnings;
  }

  /**
   * パフォーマンス最適化の提案を取得
   */
  getOptimizationSuggestions(): string[] {
    const stats = this.getStats();
    if (!stats) return [];

    const suggestions: string[] = [];

    if (stats.averageFps < 50) {
      suggestions.push("マーカーのクラスタリングを有効にしてレンダリング負荷を軽減");
      suggestions.push("仮想化スクロールを使用して大量リストの性能を改善");
    }

    if (stats.maxFrameTime > 20) {
      suggestions.push("アニメーションでwill-changeプロパティを使用してGPU加速を有効化");
      suggestions.push("重い処理をrequestIdleCallbackで分割実行");
    }

    if (stats.totalRenderCount > 1000) {
      suggestions.push("React.memoとuseMemoでコンポーネントの再レンダリングを抑制");
      suggestions.push("インクリメンタルレンダリングで初期表示を高速化");
    }

    return suggestions;
  }

  private measureFPS(): void {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    // FPS計算間隔に達した場合
    if (now - this.lastFrameTime >= this.config.fpsInterval) {
      const deltaTime = now - this.lastFrameTime;
      const fps = Math.round((this.frameCount * 1000) / deltaTime);
      const frameTime = deltaTime / this.frameCount;

      // メモリ使用量取得（対応ブラウザのみ）
      let memoryUsage: number | undefined;
      if ("memory" in performance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        memoryUsage = (performance as any).memory?.usedJSHeapSize as number;
      }

      const metrics: PerformanceMetrics = {
        fps,
        frameTime,
        memoryUsage,
        renderCount: this.frameCount,
        timestamp: now,
      };

      // メトリクスを記録
      this.metrics.push(metrics);
      if (this.metrics.length > this.config.maxHistory) {
        this.metrics.shift();
      }

      // 監視者に通知
      this.observers.forEach((observer) => {
        observer(metrics);
      });

      // リセット
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // 次のフレーム
    this.animationFrameId = requestAnimationFrame(() => {
      this.measureFPS();
    });
  }
}

/**
 * グローバルパフォーマンス監視インスタンス
 */
export const performanceMonitor = new RenderingPerformanceMonitor();

/**
 * React フック形式でのパフォーマンス監視
 */
export const useRenderingPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    performanceMonitor.start();

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setWarnings(performanceMonitor.checkPerformanceWarnings());
    });

    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, []);

  return {
    metrics,
    warnings,
    stats: performanceMonitor.getStats(),
    suggestions: performanceMonitor.getOptimizationSuggestions(),
  };
};
