/**
 * アセット関連の型定義
 */

export interface NumberedAssets {
  1: string;
  2: string;
  3: string;
}

export interface MarkerAssets {
  CURRENT_LOCATION: string;
  FACING_NORTH: string;
  PARKING: string;
  RECOMMEND: string;
  TOILETTE: string;
}

export interface IconAssets {
  ANO: NumberedAssets;
  SHI: NumberedAssets;
  AREA_MAP: NumberedAssets;
  MARKERS: MarkerAssets;
}

export interface TitleAssets {
  ROW1: string;
  ROW2: string;
}

export interface BaseAssets {
  ICONS: IconAssets;
  TITLE: TitleAssets;
}
