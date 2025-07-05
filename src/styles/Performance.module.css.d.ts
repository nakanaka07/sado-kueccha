/**
 * CSS Modules型定義
 * TypeScriptでCSS Modulesのクラス名を型安全に使用
 *
 * @version 2.2.0
 * @since 2025-06-30
 * @updated 2025-07-04 - 新機能クラス追加
 */

declare const styles: {
  // コンポーネント固有スタイル
  readonly virtualList: string;
  readonly virtualListItem: string;
  readonly filterOptionsVirtualized: string;
  readonly filterOptionItem: string;
  readonly mapContainer: string;
  readonly performanceDebug: string;
  readonly filterPanel: string;
  readonly recommendMarkerIcon: string;

  // ユーティリティクラス
  readonly gpuAccelerated: string;
  readonly willChangeTransform: string;
  readonly willChangeOpacity: string;
  readonly willChangeScroll: string;
  readonly containLayout: string;
  readonly containStyle: string;
  readonly containPaint: string;
  readonly containStrict: string;
  readonly smoothTransition: string;
  readonly fastTransition: string;

  // 新機能: バッチレンダリング最適化
  readonly batchRenderContainer: string;
  readonly lazyLoadTrigger: string;

  // 新機能: CSS Grid 最適化
  readonly optimizedGrid: string;
  readonly gridItem: string;

  // 新機能: フォントレンダリング最適化
  readonly optimizedText: string;
};

export default styles;
