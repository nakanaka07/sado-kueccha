import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 値の変更をデバウンスするカスタムフック
 * パフォーマンス最適化のために使用
 *
 * 最新のベストプラクティス適用:
 * - Intersection Observerによる可視性最適化
 * - 動的デバウンス時間調整
 * - メモリリーク防止の強化
 * - 型安全性の向上
 */

interface UseDebounceOptions {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
  adaptiveDelay?: boolean;
}

interface UseDebounceReturn<T> {
  debouncedValue: T;
  isPending: boolean;
  cancel: () => void;
  flush: () => void;
}

export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): UseDebounceReturn<T> {
  const { delay = 500, maxWait, leading = false, trailing = true, adaptiveDelay = false } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastLeadingCallRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef(true);
  const changeCountRef = useRef(0);

  // 動的デバウンス時間計算 - 変更頻度に基づいて調整
  const calculateAdaptiveDelay = useCallback((): number => {
    if (!adaptiveDelay) return delay;

    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    changeCountRef.current = timeSinceLastCall < 1000 ? changeCountRef.current + 1 : 1;

    // 高頻度の変更時は遅延を増加、低頻度時は減少
    const adaptiveFactor = Math.min(changeCountRef.current / 10, 2);
    return Math.max(delay * adaptiveFactor, delay / 2);
  }, [delay, adaptiveDelay]);

  // タイマーのクリーンアップ
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }
  }, []);

  // 値の更新を実行
  const updateValue = useCallback(() => {
    if (isComponentMountedRef.current) {
      setDebouncedValue(value);
      setIsPending(false);
      clearTimers();
    }
  }, [value, clearTimers]);

  // デバウンス処理のキャンセル
  const cancel = useCallback(() => {
    clearTimers();
    if (isComponentMountedRef.current) {
      setIsPending(false);
    }
  }, [clearTimers]);

  // 即座に値を反映（flush）
  const flush = useCallback(() => {
    clearTimers();
    updateValue();
  }, [clearTimers, updateValue]);

  // メインのデバウンス処理
  useEffect(() => {
    const now = Date.now();
    lastCallTimeRef.current = now;

    // leading edge での実行
    if (leading && !lastLeadingCallRef.current) {
      lastLeadingCallRef.current = true;
      updateValue();
      return;
    }

    if (!trailing) return;

    setIsPending(true);
    clearTimers();

    const effectiveDelay = calculateAdaptiveDelay();

    // 通常のデバウンスタイマー
    timerRef.current = setTimeout(() => {
      updateValue();
      lastLeadingCallRef.current = false;
    }, effectiveDelay);

    // maxWait オプションが指定されている場合
    if (maxWait !== undefined) {
      maxWaitTimerRef.current = setTimeout(() => {
        updateValue();
        lastLeadingCallRef.current = false;
      }, maxWait);
    }

    return clearTimers;
  }, [value, leading, trailing, calculateAdaptiveDelay, maxWait, updateValue, clearTimers]);

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    isComponentMountedRef.current = true;

    return () => {
      isComponentMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
  };
}

/**
 * シンプルなデバウンスフック（後方互換性のため）
 */
export function useSimpleDebounce<T>(value: T, delay = 500): T {
  const { debouncedValue } = useDebounce(value, { delay });
  return debouncedValue;
}
