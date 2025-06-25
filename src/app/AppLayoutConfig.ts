/**
 * @fileoverview アプリケーションレイアウト設定
 *
 * AppLayout.tsx からレイアウト設定を分離し、React Fast Refresh対応。
 * 型定義と設定値を管理するための独立モジュール。
 *
 * @version 1.0.0
 * @since 2025-06-25
 * @author React 19 Architecture Team
 */

/**
 * レイアウトに関連するユーティリティ型
 */
export interface LayoutConfig {
  /** ブレークポイント設定 */
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  /** z-index階層管理 */
  zIndexLayers: {
    base: number;
    overlay: number;
    modal: number;
    tooltip: number;
  };
  /** レイアウトモード */
  layoutMode: 'mobile' | 'tablet' | 'desktop';
}

/**
 * デフォルトのレイアウト設定
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  breakpoints: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
    wide: 1920,
  },
  zIndexLayers: {
    base: 1,
    overlay: 10,
    modal: 100,
    tooltip: 1000,
  },
  layoutMode: 'mobile', // デフォルトはモバイル
} as const satisfies LayoutConfig;

/**
 * レスポンシブブレークポイントユーティリティ
 */
export const BREAKPOINTS = DEFAULT_LAYOUT_CONFIG.breakpoints;

/**
 * Z-Index管理ユーティリティ
 */
export const Z_INDEX = DEFAULT_LAYOUT_CONFIG.zIndexLayers;

/**
 * レイアウトヘルパー関数
 */
export const getLayoutModeByWidth = (
  width: number
): LayoutConfig['layoutMode'] => {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

/**
 * ブレークポイント判定ヘルパー
 */
export const isDesktop = (width: number): boolean =>
  width >= BREAKPOINTS.desktop;
export const isTablet = (width: number): boolean =>
  width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
export const isMobile = (width: number): boolean => width < BREAKPOINTS.tablet;
