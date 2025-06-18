/**
 * 🎯 DOM要素の型安全性とアクセシビリティ管理ユーティリティ
 * 最新のWebアクセシビリティガイドラインに準拠
 */

/**
 * 🔍 DOM要素の型安全性チェック用ユーティリティ
 */
export const isHTMLElement = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement;

export const isHTMLButtonElement = (element: Element | null): element is HTMLButtonElement =>
  element instanceof HTMLButtonElement;

export const isHTMLInputElement = (element: Element | null): element is HTMLInputElement =>
  element instanceof HTMLInputElement;

export const isHTMLDivElement = (element: Element | null): element is HTMLDivElement =>
  element instanceof HTMLDivElement;

export const isHTMLAnchorElement = (element: Element | null): element is HTMLAnchorElement =>
  element instanceof HTMLAnchorElement;

export const isHTMLFormElement = (element: Element | null): element is HTMLFormElement =>
  element instanceof HTMLFormElement;

/**
 * 🎯 セーフなクエリセレクター（型安全版）
 * @param parent - 親要素
 * @param selector - CSSセレクター
 * @param typeGuard - 型ガード関数
 * @returns 型安全な要素またはnull
 */
export const safeQuerySelector = <T extends Element>(
  parent: Element | Document,
  selector: string,
  typeGuard: (element: Element | null) => element is T,
): T | null => {
  try {
    const element = parent.querySelector(selector);
    return typeGuard(element) ? element : null;
  } catch {
    return null;
  }
};

/**
 * 🎯 複数要素のセーフなクエリセレクター
 * @param parent - 親要素
 * @param selector - CSSセレクター
 * @param typeGuard - 型ガード関数
 * @returns 型安全な要素の配列
 */
export const safeQuerySelectorAll = <T extends Element>(
  parent: Element | Document,
  selector: string,
  typeGuard: (element: Element | null) => element is T,
): T[] => {
  try {
    const elements = Array.from(parent.querySelectorAll(selector));
    return elements.filter(typeGuard);
  } catch {
    return [];
  }
};

/**
 * 🛡️ 安全なイベントリスナー管理クラス（強化版）
 * メモリリークを防ぎ、アクセシビリティを向上
 */
export class SafeEventManager {
  private listeners: Array<{
    element: Element;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }> = [];

  /**
   * イベントリスナーを追加
   * @param element - 対象要素
   * @param event - イベント名
   * @param handler - ハンドラー関数
   * @param options - イベントリスナーオプション
   */
  addListener(
    element: Element,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    try {
      element.addEventListener(event, handler, options);
      const listenerInfo = { element, event, handler };
      if (options) {
        this.listeners.push({ ...listenerInfo, options });
      } else {
        this.listeners.push(listenerInfo);
      }
    } catch (error) {
      console.error("🚨 イベントリスナーの追加に失敗しました:", error);
    }
  }

  /**
   * 全てのリスナーを削除
   */
  removeAllListeners(): void {
    this.listeners.forEach(({ element, event, handler, options }) => {
      try {
        element.removeEventListener(event, handler, options);
      } catch (error) {
        console.error("🚨 イベントリスナーの削除に失敗しました:", error);
      }
    });
    this.listeners = [];
  }

  /**
   * 特定要素の特定イベントリスナーを削除
   * @param element - 対象要素
   * @param event - イベント名
   */
  removeListener(element: Element, event: string): void {
    this.listeners = this.listeners.filter((listener) => {
      if (listener.element === element && listener.event === event) {
        try {
          element.removeEventListener(event, listener.handler, listener.options);
        } catch (error) {
          console.error("🚨 イベントリスナーの削除に失敗しました:", error);
        }
        return false;
      }
      return true;
    });
  }

  /**
   * 現在のリスナー数を取得
   * @returns リスナー数
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * デバッグ用: 全リスナー情報を取得
   * @returns リスナー情報の配列
   */
  getListenerInfo(): Array<{ element: string; event: string }> {
    return this.listeners.map(({ element, event }) => ({
      element: element.tagName.toLowerCase(),
      event,
    }));
  }
}

/**
 * 🌐 アクセシビリティ支援ユーティリティ
 */

/**
 * ARIA属性を安全に設定
 * @param element - 対象要素
 * @param attributes - ARIA属性のオブジェクト
 */
export function setAriaAttributes(element: Element, attributes: Record<string, string>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    if (key.startsWith("aria-") || key === "role") {
      element.setAttribute(key, value);
    }
  });
}

/**
 * フォーカス可能な要素にフォーカスを設定
 * @param element - フォーカス対象要素
 * @param options - フォーカスオプション
 */
export function setFocus(element: Element, options?: FocusOptions): boolean {
  try {
    if (isHTMLElement(element) && typeof element.focus === "function") {
      element.focus(options);
      return true;
    }
  } catch (error) {
    console.error("🚨 フォーカス設定に失敗しました:", error);
  }
  return false;
}

/**
 * スクリーンリーダー用の隠しテキストを作成
 * @param text - 隠しテキスト
 * @returns 隠しテキスト要素
 */
export function createScreenReaderText(text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "sr-only";
  span.textContent = text;
  span.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  return span;
}

/**
 * 要素の可視性を切り替え（アクセシビリティ対応）
 * @param element - 対象要素
 * @param visible - 表示するかどうか
 */
export function toggleVisibility(element: Element, visible: boolean): void {
  if (isHTMLElement(element)) {
    element.style.display = visible ? "" : "none";
    element.setAttribute("aria-hidden", (!visible).toString());
  }
}

/**
 * 🎨 DOM操作のユーティリティ関数
 */

/**
 * 要素のサイズと位置を安全に取得
 * @param element - 対象要素
 * @returns 要素の境界情報
 */
export function getBoundingRect(element: Element): DOMRect | null {
  try {
    return element.getBoundingClientRect();
  } catch {
    return null;
  }
}

/**
 * 要素が画面内に表示されているかチェック
 * @param element - 対象要素
 * @returns 表示されている場合true
 */
export function isElementVisible(element: Element): boolean {
  const rect = getBoundingRect(element);
  if (!rect) return false;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 要素を画面内にスクロール
 * @param element - 対象要素
 * @param behavior - スクロール動作
 */
export function scrollIntoView(element: Element, behavior: ScrollBehavior = "smooth"): void {
  try {
    element.scrollIntoView({ behavior, block: "nearest" });
  } catch {
    // フォールバック
    try {
      element.scrollIntoView();
    } catch {
      // スクロール失敗時は何もしない
    }
  }
}
