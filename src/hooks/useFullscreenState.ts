import { useCallback, useEffect, useRef, useState } from 'react';

// ブラウザ固有のフルスクリーンAPI型定義
interface ExtendedDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ExtendedElement extends Element {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
  msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
}

interface FullscreenState {
  isFullscreen: boolean;
  fullscreenElement: Element | null;
  fullscreenContainer: Element | null;
  isTransitioning: boolean;
  error: string | null;
}

interface FullscreenMethods {
  enterFullscreen: (element?: Element) => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: (element?: Element) => Promise<void>;
  clearError: () => void;
}

type UseFullscreenStateReturn = FullscreenState & FullscreenMethods;

/**
 * フルスクリーン状態を監視するカスタムフック
 * 最新のベストプラクティス適用:
 * - Web標準のFullscreen APIを使用
 * - Google Mapsフルスクリーンコンテナの検出
 * - エラーハンドリングと復旧機能
 * - ブラウザ間の互換性対応
 * - アクセシビリティ対応
 * - パフォーマンス最適化
 */
export const useFullscreenState = (): UseFullscreenStateReturn => {
  const [state, setState] = useState<FullscreenState>({
    isFullscreen: false,
    fullscreenElement: null,
    fullscreenContainer: null,
    isTransitioning: false,
    error: null,
  });

  const observerRef = useRef<MutationObserver | null>(null);
  const isComponentMountedRef = useRef(true);
  const lastCheckedRef = useRef<number>(0);

  // ブラウザサポートのチェック
  const isFullscreenSupported = useCallback((): boolean => {
    const doc = document as ExtendedDocument;
    return !!(
      document.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );
  }, []);

  // クロスブラウザ対応のフルスクリーン要素取得
  const getFullscreenElement = useCallback((): Element | null => {
    const doc = document as ExtendedDocument;
    return (
      document.fullscreenElement ??
      doc.webkitFullscreenElement ??
      doc.mozFullScreenElement ??
      doc.msFullscreenElement ??
      null
    );
  }, []);

  // Google Mapsフルスクリーンコンテナの検出（改良版）
  const detectFullscreenContainer = useCallback((): Element | null => {
    const selectors = [
      // Google Mapsの一般的なフルスクリーンコンテナ
      '[style*="position: absolute"][style*="top: 0px"][style*="left: 0px"]',
      '.gm-fullscreen-control',
      '[data-control-name="FullscreenControl"]',
      // 他の地図ライブラリとの互換性
      '[class*="fullscreen-container"]',
      '[class*="map-fullscreen"]',
      // 汎用的なフルスクリーンコンテナ
      '[data-fullscreen="true"]',
      '.fullscreen-active',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        // 実際にフルスクリーン状態かを確認
        const rect = element.getBoundingClientRect();
        const isFullSize =
          rect.width >= window.innerWidth * 0.9 &&
          rect.height >= window.innerHeight * 0.9;
        if (isFullSize) {
          return element;
        }
      }
    }

    return null;
  }, []);

  // 状態更新の最適化（デバウンス付き）
  const updateFullscreenState = useCallback(() => {
    const now = Date.now();
    if (now - lastCheckedRef.current < 50) {
      return; // 50ms以内の連続呼び出しを防ぐ
    }
    lastCheckedRef.current = now;

    if (!isComponentMountedRef.current) return;

    try {
      const fullscreenElement = getFullscreenElement();
      const isFullscreen = !!fullscreenElement;
      const fullscreenContainer = isFullscreen
        ? detectFullscreenContainer()
        : null;

      setState(prevState => {
        // 状態が実際に変更された場合のみ更新
        if (
          prevState.isFullscreen !== isFullscreen ||
          prevState.fullscreenElement !== fullscreenElement ||
          prevState.fullscreenContainer !== fullscreenContainer
        ) {
          return {
            ...prevState,
            isFullscreen,
            fullscreenElement,
            fullscreenContainer,
            isTransitioning: false,
            error: null,
          };
        }
        return prevState;
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'フルスクリーン状態の取得に失敗しました';
      setState(prevState => ({
        ...prevState,
        error: errorMessage,
        isTransitioning: false,
      }));
    }
  }, [getFullscreenElement, detectFullscreenContainer]);

  // フルスクリーンに入る
  const enterFullscreen = useCallback(
    async (element?: Element): Promise<void> => {
      if (!isFullscreenSupported()) {
        throw new Error('このブラウザはフルスクリーンをサポートしていません');
      }

      setState(prev => ({ ...prev, isTransitioning: true, error: null }));

      try {
        const targetElement = (element ??
          document.documentElement) as ExtendedElement;

        // ブラウザ固有API順に試行
        if (targetElement.webkitRequestFullscreen) {
          await targetElement.webkitRequestFullscreen();
        } else if (targetElement.mozRequestFullScreen) {
          await targetElement.mozRequestFullScreen();
        } else if (targetElement.msRequestFullscreen) {
          await targetElement.msRequestFullscreen();
        } else {
          await targetElement.requestFullscreen();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'フルスクリーンの開始に失敗しました';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isTransitioning: false,
        }));
        throw error;
      }
    },
    [isFullscreenSupported]
  );

  // フルスクリーンから退出
  const exitFullscreen = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isTransitioning: true, error: null }));

    try {
      const doc = document as ExtendedDocument;

      // ブラウザ固有API順に試行
      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'フルスクリーンの終了に失敗しました';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isTransitioning: false,
      }));
      throw error;
    }
  }, []);

  // フルスクリーンの切り替え
  const toggleFullscreen = useCallback(
    async (element?: Element): Promise<void> => {
      if (state.isFullscreen) {
        await exitFullscreen();
      } else {
        await enterFullscreen(element);
      }
    },
    [state.isFullscreen, enterFullscreen, exitFullscreen]
  );

  // エラーのクリア
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // フルスクリーン変更イベントの監視
  useEffect(() => {
    // 初期状態をチェック
    updateFullscreenState();

    // フルスクリーン変更イベントのリスナー（クロスブラウザ対応）
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ];

    events.forEach(event => {
      document.addEventListener(event, updateFullscreenState, {
        passive: true,
      });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateFullscreenState);
      });
    };
  }, [updateFullscreenState]);

  // DOM変更の監視（Google Mapsコンテナの動的検出）
  useEffect(() => {
    if (!state.isFullscreen) return;

    observerRef.current = new MutationObserver(mutations => {
      const shouldUpdate = mutations.some(mutation => {
        return (
          (mutation.type === 'attributes' &&
            (mutation.attributeName === 'style' ||
              mutation.attributeName === 'class')) ||
          (mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 ||
              mutation.removedNodes.length > 0))
        );
      });

      if (shouldUpdate) {
        setTimeout(updateFullscreenState, 100); // デバウンス
      }
    });

    observerRef.current.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [state.isFullscreen, updateFullscreenState]);

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    isComponentMountedRef.current = true;

    return () => {
      isComponentMountedRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    clearError,
  };
};
