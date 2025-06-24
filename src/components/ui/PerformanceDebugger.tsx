/**
 * パフォーマンス監視デバッガーコンポーネント
 * 簡易版 - FPS と基本メトリクスを表示
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import './PerformanceDebugger.css';

interface SimpleMetrics {
  fps: number;
  frameTime: number;
  renderCount: number;
}

interface PerformanceDebuggerProps {
  /** デバッガーの表示制御 */
  enabled?: boolean;
  /** 位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** 透明度 */
  opacity?: number;
}

/**
 * 簡易パフォーマンスデバッガー
 */
export const PerformanceDebugger: React.FC<PerformanceDebuggerProps> = memo(
  ({
    enabled = process.env.NODE_ENV === 'development',
    position = 'top-right',
    opacity = 0.9,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [metrics, setMetrics] = useState<SimpleMetrics>({
      fps: 0,
      frameTime: 0,
      renderCount: 0,
    });

    // 簡易FPS測定
    const measureFPS = useCallback(() => {
      let frameCount = 0;
      let lastTime = performance.now();
      let renderCount = 0;

      const measureFrame = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        frameCount++;
        renderCount++;

        if (deltaTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / deltaTime);
          const frameTime = deltaTime / frameCount;

          setMetrics({
            fps,
            frameTime: Math.round(frameTime * 100) / 100,
            renderCount,
          });

          frameCount = 0;
          lastTime = currentTime;
        }

        if (enabled && isVisible) {
          requestAnimationFrame(measureFrame);
        }
      };

      if (enabled && isVisible) {
        requestAnimationFrame(measureFrame);
      }
    }, [enabled, isVisible]);

    // FPS測定開始/停止
    useEffect(() => {
      if (enabled && isVisible) {
        measureFPS();
      }
    }, [enabled, isVisible, measureFPS]);

    // キーボードショートカット（Ctrl + Shift + P でトグル）
    useEffect(() => {
      if (!enabled) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
          event.preventDefault();
          setIsVisible(prev => !prev);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [enabled]);

    // 表示を制御
    if (!enabled || !isVisible) {
      return (
        <button
          className={`performance-debugger-toggle performance-debugger-toggle--${position}`}
          onClick={() => {
            setIsVisible(true);
          }}
          style={{ opacity }}
          title="パフォーマンスデバッガーを表示 (Ctrl+Shift+P)"
          aria-label="パフォーマンスデバッガーを表示"
        >
          📊
        </button>
      );
    }

    return (
      <div
        className={`performance-debugger performance-debugger--${position}`}
        style={{ opacity }}
        role="complementary"
        aria-label="パフォーマンス監視パネル"
      >
        <div className="performance-debugger__header">
          <h3 className="performance-debugger__title">Performance</h3>
          <button
            className="performance-debugger__close"
            onClick={() => {
              setIsVisible(false);
            }}
            aria-label="パフォーマンスデバッガーを閉じる"
          >
            ✕
          </button>
        </div>

        <div className="performance-debugger__content">
          <div className="performance-debugger__metrics">
            <div className="metric">
              <span className="metric__label">FPS:</span>
              <span
                className={`metric__value ${metrics.fps < 30 ? 'metric__value--warning' : ''}`}
              >
                {metrics.fps}
              </span>
            </div>

            <div className="metric">
              <span className="metric__label">Frame Time:</span>
              <span
                className={`metric__value ${
                  metrics.frameTime > 16.67 ? 'metric__value--warning' : ''
                }`}
              >
                {metrics.frameTime}ms
              </span>
            </div>

            <div className="metric">
              <span className="metric__label">Renders:</span>
              <span className="metric__value">{metrics.renderCount}</span>
            </div>
          </div>

          <div className="performance-debugger__info">
            <small>Ctrl+Shift+P でトグル</small>
          </div>
        </div>
      </div>
    );
  }
);

PerformanceDebugger.displayName = 'PerformanceDebugger';
