/**
 * Map.module.css 型定義
 * TypeScriptでMapコンポーネント専用CSS Modulesのクラス名を型安全に使用
 *
 * @version 1.0.0
 * @since 2025-07-04
 */

declare const styles: {
  // 地図コンテナ
  readonly mapContainer: string;

  // マーカー関連
  readonly markerContainer: string;
  readonly recommendMarkerIcon: string;

  // インフォウィンドウ
  readonly infoWindow: string;
  readonly infoWindowContent: string;

  // 地図コントロール
  readonly mapControls: string;
  readonly zoomControl: string;
};

export default styles;
