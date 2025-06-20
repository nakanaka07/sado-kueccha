import { useCallback, useEffect, useRef } from "react";
import type { FilterState } from "../types";
import { isDevelopment } from "../utils/env";

interface FullscreenPanelOptions {
  filterState: FilterState;
  isExpanded: boolean;
  onFilterChange: (newFilterState: FilterState) => void;
  onToggleExpanded: () => void;
  stats: { visible: number; total: number };
}

interface FullscreenPanelReturn {
  updatePanel: () => void;
  removePanelFromFullscreen: () => void;
  isFullscreenActive: boolean;
  panelElement: Element | null;
}

/**
 * フルスクリーン時のフィルターパネル管理フック
 * 最新のベストプラクティス適用:
 * - Intersection Observer API活用
 * - DOM操作の最適化
 * - イベントリスナーの効率的な管理
 * - アクセシビリティ対応の強化
 * - エラーハンドリングとフォールバック機能
 */
export const useFullscreenPanel = (
  fullscreenContainer: Element | null,
  isFullscreen: boolean,
  options: FullscreenPanelOptions,
): FullscreenPanelReturn => {
  const panelElementRef = useRef<Element | null>(null);
  const originalParentRef = useRef<Element | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // パネルの可視性を監視
  const setupIntersectionObserver = useCallback(() => {
    if (!panelElementRef.current || intersectionObserverRef.current) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // パネルの可視性に基づいてUIを調整
          const panel = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            panel.setAttribute("data-visible", "true");
          } else {
            panel.setAttribute("data-visible", "false");
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "10px",
      },
    );

    intersectionObserverRef.current.observe(panelElementRef.current);
  }, []);

  // パネルをフルスクリーンコンテナに移動
  const updatePanel = useCallback(() => {
    if (isProcessingRef.current || !isFullscreen || !fullscreenContainer) {
      return;
    }

    isProcessingRef.current = true;

    try {
      // フィルターパネル要素を検索
      const panelSelector = '[data-testid="filter-panel"], .filter-panel, [class*="filter"]';
      const panel = document.querySelector(panelSelector);

      if (!panel || panelElementRef.current === panel) {
        return;
      }

      // 元の親要素を記録
      originalParentRef.current ??= panel.parentElement;

      // アクセシビリティ属性の設定
      panel.setAttribute("aria-hidden", "false");
      panel.setAttribute("role", "complementary");
      panel.setAttribute("aria-label", "フィルターパネル");

      // フルスクリーンコンテナに移動
      fullscreenContainer.appendChild(panel);
      panelElementRef.current = panel;

      // スタイルの適用
      const panelElement = panel as HTMLElement;
      panelElement.style.position = "absolute";
      panelElement.style.top = "20px";
      panelElement.style.right = "20px";
      panelElement.style.zIndex = "1000";
      panelElement.style.maxHeight = "80vh";
      panelElement.style.overflowY = "auto";
      panelElement.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
      panelElement.style.backdropFilter = "blur(10px)";
      panelElement.style.borderRadius = "12px";
      panelElement.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
      panelElement.style.padding = "16px";
      panelElement.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

      // レスポンシブ対応
      if (window.innerWidth < 768) {
        panelElement.style.right = "10px";
        panelElement.style.top = "10px";
        panelElement.style.maxWidth = "calc(100vw - 20px)";
      }

      // Intersection Observerのセットアップ
      setupIntersectionObserver();

      // カスタムイベントの発火
      panel.dispatchEvent(
        new CustomEvent("fullscreenPanelMounted", {
          detail: { container: fullscreenContainer, options },
        }),
      );
    } catch (error) {
      if (isDevelopment()) {
        console.warn("フルスクリーンパネルの更新中にエラーが発生しました:", error);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [isFullscreen, fullscreenContainer, options, setupIntersectionObserver]);

  // パネルを元の位置に戻す
  const removePanelFromFullscreen = useCallback(() => {
    if (isProcessingRef.current || !panelElementRef.current || !originalParentRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const panel = panelElementRef.current as HTMLElement;

      // スタイルのリセット
      panel.style.position = "";
      panel.style.top = "";
      panel.style.right = "";
      panel.style.zIndex = "";
      panel.style.maxHeight = "";
      panel.style.overflowY = "";
      panel.style.backgroundColor = "";
      panel.style.backdropFilter = "";
      panel.style.borderRadius = "";
      panel.style.boxShadow = "";
      panel.style.padding = "";
      panel.style.transition = "";
      panel.style.maxWidth = "";

      // アクセシビリティ属性のリセット
      panel.removeAttribute("aria-hidden");
      panel.removeAttribute("role");
      panel.removeAttribute("aria-label");

      // 元の親要素に戻す
      originalParentRef.current.appendChild(panel);

      // Intersection Observerのクリーンアップ
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        intersectionObserverRef.current = null;
      }

      // カスタムイベントの発火
      panel.dispatchEvent(
        new CustomEvent("fullscreenPanelUnmounted", {
          detail: { originalParent: originalParentRef.current },
        }),
      );

      // 参照のクリア
      panelElementRef.current = null;
      originalParentRef.current = null;
    } catch (error) {
      if (isDevelopment()) {
        console.warn("フルスクリーンパネルの削除中にエラーが発生しました:", error);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  // フルスクリーン状態の変化を監視
  useEffect(() => {
    if (isFullscreen && fullscreenContainer) {
      // デバウンス処理
      const timeoutId = setTimeout(updatePanel, 100);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      removePanelFromFullscreen();
      return undefined;
    }
  }, [isFullscreen, fullscreenContainer, updatePanel, removePanelFromFullscreen]);

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      removePanelFromFullscreen();
    };
  }, [removePanelFromFullscreen]);

  // レスポンシブ対応のためのリサイズイベント
  useEffect(() => {
    if (!isFullscreen || !panelElementRef.current) return;

    const handleResize = () => {
      if (panelElementRef.current) {
        const panel = panelElementRef.current as HTMLElement;
        if (window.innerWidth < 768) {
          panel.style.right = "10px";
          panel.style.top = "10px";
          panel.style.maxWidth = "calc(100vw - 20px)";
        } else {
          panel.style.right = "20px";
          panel.style.top = "20px";
          panel.style.maxWidth = "";
        }
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isFullscreen]);

  return {
    updatePanel,
    removePanelFromFullscreen,
    isFullscreenActive: isFullscreen && !!panelElementRef.current,
    panelElement: panelElementRef.current,
  };
};
