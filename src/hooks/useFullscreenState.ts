import { useCallback, useEffect, useState } from "react";

interface FullscreenState {
  isFullscreen: boolean;
  fullscreenElement: Element | null;
  fullscreenContainer: Element | null;
}

/**
 * フルスクリーン状態を監視するカスタムフック
 * Web標準のFullscreen APIを使用し、Google Mapsフルスクリーンコンテナも検出
 */
export const useFullscreenState = (): FullscreenState => {
  const [state, setState] = useState<FullscreenState>({
    isFullscreen: false,
    fullscreenElement: null,
    fullscreenContainer: null,
  });

  const detectFullscreenContainer = useCallback((): Element | null => {
    // Google Mapsフルスクリーンコンテナの検出
    const selector = '[style*="position: absolute"][style*="top: 0px"][style*="left: 0px"]';
    return document.querySelector(selector);
  }, []);

  const updateFullscreenState = useCallback(() => {
    const { fullscreenElement } = document;
    const isFullscreen = !!fullscreenElement;
    const fullscreenContainer = isFullscreen ? detectFullscreenContainer() : null;

    setState((prevState) => {
      // 状態が実際に変更された場合のみ更新
      if (
        prevState.isFullscreen !== isFullscreen ||
        prevState.fullscreenElement !== fullscreenElement ||
        prevState.fullscreenContainer !== fullscreenContainer
      ) {
        return {
          isFullscreen,
          fullscreenElement,
          fullscreenContainer,
        };
      }
      return prevState;
    });
  }, [detectFullscreenContainer]);

  useEffect(() => {
    // 初期状態をチェック
    updateFullscreenState();

    // フルスクリーン変更イベントのリスナー
    document.addEventListener("fullscreenchange", updateFullscreenState, { passive: true });

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  }, [updateFullscreenState]);

  return state;
};
