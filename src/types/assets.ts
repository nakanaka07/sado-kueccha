/**
 * アセット関連の型定義
 * パフォーマンス最適化とtype-safe な実装のための型定義
 */

// ブランド型でURL文字列の型安全性を向上
export type AssetUrl = string & { readonly __brand: 'AssetUrl' };

/**
 * 番号付きアセットのマッピング
 * インデックスシグネチャよりも型安全な定義
 */
export interface NumberedAssets {
  readonly 1: AssetUrl;
  readonly 2: AssetUrl;
  readonly 3: AssetUrl;
}

/**
 * マーカーアセットの型定義
 * 地図上で使用されるマーカーアイコンのURL管理
 */
export interface MarkerAssets {
  readonly CURRENT_LOCATION: AssetUrl;
  readonly FACING_NORTH: AssetUrl;
  readonly PARKING: AssetUrl;
  readonly RECOMMEND: AssetUrl;
  readonly TOILETTE: AssetUrl;
}

/**
 * アイコンアセットの包括的な型定義
 * カテゴリ別のアイコン管理
 */
export interface IconAssets {
  readonly ANO: NumberedAssets;
  readonly SHI: NumberedAssets;
  readonly AREA_MAP: NumberedAssets;
  readonly MARKERS: MarkerAssets;
}

/**
 * タイトル画像アセットの型定義
 */
export interface TitleAssets {
  readonly ROW1: AssetUrl;
  readonly ROW2: AssetUrl;
}

/**
 * 全体的なアセット構造の型定義
 * アプリケーション内で使用される全てのアセットを管理
 */
export interface BaseAssets {
  readonly ICONS: IconAssets;
  readonly TITLE: TitleAssets;
}

/**
 * アセット読み込みの状態管理用型
 */
export interface AssetLoadState {
  readonly url: AssetUrl;
  readonly loaded: boolean;
  readonly error?: Error;
  readonly retryCount: number;
}

/**
 * アセット読み込み設定
 */
export interface AssetLoadOptions {
  readonly timeout?: number;
  readonly maxRetries?: number;
  readonly preload?: boolean;
  readonly priority?: 'high' | 'low' | 'auto';
}

// 型ガード関数
export const isAssetUrl = (value: string): value is AssetUrl => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * アセットキーの型定義（型安全なキーアクセス用）
 */
export type MarkerAssetKey = keyof MarkerAssets;
export type NumberedAssetKey = keyof NumberedAssets;
export type IconCategoryKey = keyof IconAssets;
export type TitleAssetKey = keyof TitleAssets;
