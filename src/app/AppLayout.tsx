import type { FC, ReactElement, ReactNode } from 'react';
import { APP_CONFIG } from './AppConfig';

/**
 * @fileoverview アプリケーションレイアウトコンポーネント
 *
 * レイアウト責任を App.tsx から分離し、UIの構造化を担当。
 * レスポンシブデザインとアクセシビリティを重視した設計。
 *
 * @version 1.0.0
 * @since 2025-06-25
 * @author React 19 Architecture Team
 */

interface AppLayoutProps {
  /** レイアウト内に表示するコンテンツ */
  children: ReactNode;
  /** メインコンテンツエリアのARIAラベル */
  mainAriaLabel?: string;
  /** アプリケーション全体のARIAラベル */
  appAriaLabel?: string;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * アプリケーションの基本レイアウト構造を提供するコンポーネント
 *
 * @description
 * **設計原則:**
 * - レイアウト責任の分離（App.tsx から独立）
 * - レスポンシブデザイン対応
 * - アクセシビリティ重視（WCAG 2.1 AA準拠）
 * - セマンティックHTML構造
 *
 * **レスポンシブ戦略:**
 * - モバイルファースト（320px〜）
 * - タブレット対応（768px〜）
 * - デスクトップ対応（1024px〜）
 * - 大画面対応（1920px〜）
 *
 * **アクセシビリティ機能:**
 * - landmark roles の適切な使用
 * - スクリーンリーダー対応
 * - キーボードナビゲーション対応
 * - 高コントラスト対応
 *
 * @example
 * ```tsx
 * // 基本的な使用法
 * <AppLayout>
 *   <FilterPanel />
 *   <MapComponent />
 * </AppLayout>
 *
 * // カスタムラベル付き
 * <AppLayout
 *   appAriaLabel="佐渡観光マップ"
 *   mainAriaLabel="マップとフィルター表示エリア"
 * >
 *   <Content />
 * </AppLayout>
 * ```
 *
 * @param props - レイアウトプロパティ
 * @returns アプリケーションレイアウト構造
 */
export const AppLayout: FC<AppLayoutProps> = ({
  children,
  mainAriaLabel = APP_CONFIG.accessibility.mainContentLabel,
  appAriaLabel = APP_CONFIG.accessibility.appLabel,
  className = '',
}): ReactElement => {
  return (
    <div
      className={`${APP_CONFIG.cssClasses.app} ${className}`.trim()}
      role="application"
      aria-label={appAriaLabel}
      data-testid="app-layout"
    >
      {/* ヘッダー領域（将来的な拡張用） */}
      <header
        className={APP_CONFIG.cssClasses.header}
        role="banner"
        aria-label="アプリケーションヘッダー"
      >
        {/* 現在は非表示、将来のナビゲーション用に構造を準備 */}
        <h1 className="sr-only">佐渡観光マップアプリケーション</h1>
      </header>

      {/* メインコンテンツ領域 */}
      <main
        className={APP_CONFIG.cssClasses.main}
        role="main"
        aria-label={mainAriaLabel}
        id="main-content"
      >
        {children}
      </main>

      {/* フッター領域（将来的な拡張用） */}
      <footer
        className={APP_CONFIG.cssClasses.footer}
        role="contentinfo"
        aria-label="アプリケーションフッター"
      >
        {/* 現在は非表示、将来のクレジット・リンク用に構造を準備 */}
      </footer>
    </div>
  );
};

export default AppLayout;
