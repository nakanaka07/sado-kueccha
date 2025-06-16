/**
 * DOM要素の型安全性チェック用ユーティリティ
 */

export const isHTMLElement = (element: Element | null): element is HTMLElement =>
  element instanceof HTMLElement;

export const isHTMLButtonElement = (element: Element | null): element is HTMLButtonElement =>
  element instanceof HTMLButtonElement;

export const isHTMLInputElement = (element: Element | null): element is HTMLInputElement =>
  element instanceof HTMLInputElement;

export const isHTMLDivElement = (element: Element | null): element is HTMLDivElement =>
  element instanceof HTMLDivElement;

/**
 * セーフなクエリセレクター
 */
export const safeQuerySelector = <T extends Element>(
  parent: Element | Document,
  selector: string,
  typeGuard: (element: Element | null) => element is T,
): T | null => {
  const element = parent.querySelector(selector);
  return typeGuard(element) ? element : null;
};

/**
 * 安全なイベントリスナー管理
 */
export class SafeEventManager {
  private listeners: Array<{
    element: Element;
    event: string;
    handler: EventListener;
  }> = [];
  addListener(element: Element, event: string, handler: EventListener): void {
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  removeAllListeners(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }

  removeListener(element: Element, event: string): void {
    this.listeners = this.listeners.filter((listener) => {
      if (listener.element === element && listener.event === event) {
        element.removeEventListener(event, listener.handler);
        return false;
      }
      return true;
    });
  }
}
