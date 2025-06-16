/**
 * アセット解決ユーティリティ
 */

import type { BaseAssets } from "../types/assets";
import { getAppConfig } from "./env";

/**
 * アセットパス解決関数
 * Viteベースパスとpublicフォルダ両方に対応
 */
export const resolveAssetPath = (path: string): string => {
  // 入力検証
  if (!path || typeof path !== "string") {
    return "";
  }

  const { app } = getAppConfig();
  const { basePath } = app;

  // 既に完全パスの場合はそのまま返す
  if (path.startsWith("http") || path.startsWith("//")) {
    return path;
  }

  // publicフォルダ内のアセットの場合
  // クロスプラットフォーム対応（Windows/Unix両方のパス区切り文字に対応）
  const normalizedPath = path.startsWith("/assets/")
    ? path
    : `/assets/${path.split(/[/\\]/).pop() || path}`;

  // ベースパスが設定されている場合は追加
  if (basePath) {
    const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    return normalizedBasePath + normalizedPath;
  }

  return normalizedPath;
};

/**
 * アセット定義にパス変換を適用
 * 型安全な方法でアセットパスを解決
 */
const transformAssetPaths = (obj: typeof baseAssetDefinition): BaseAssets => {
  return {
    ICONS: {
      ANO: {
        1: resolveAssetPath(obj.ICONS.ANO[1]),
        2: resolveAssetPath(obj.ICONS.ANO[2]),
        3: resolveAssetPath(obj.ICONS.ANO[3]),
      },
      SHI: {
        1: resolveAssetPath(obj.ICONS.SHI[1]),
        2: resolveAssetPath(obj.ICONS.SHI[2]),
        3: resolveAssetPath(obj.ICONS.SHI[3]),
      },
      AREA_MAP: {
        1: resolveAssetPath(obj.ICONS.AREA_MAP[1]),
        2: resolveAssetPath(obj.ICONS.AREA_MAP[2]),
        3: resolveAssetPath(obj.ICONS.AREA_MAP[3]),
      },
      MARKERS: {
        CURRENT_LOCATION: resolveAssetPath(obj.ICONS.MARKERS.CURRENT_LOCATION),
        FACING_NORTH: resolveAssetPath(obj.ICONS.MARKERS.FACING_NORTH),
        PARKING: resolveAssetPath(obj.ICONS.MARKERS.PARKING),
        RECOMMEND: resolveAssetPath(obj.ICONS.MARKERS.RECOMMEND),
        TOILETTE: resolveAssetPath(obj.ICONS.MARKERS.TOILETTE),
      },
    },
    TITLE: {
      ROW1: resolveAssetPath(obj.TITLE.ROW1),
      ROW2: resolveAssetPath(obj.TITLE.ROW2),
    },
  };
};

/**
 * 基本アセット定義（パス変換前）
 */
const baseAssetDefinition = {
  ICONS: {
    ANO: {
      1: "ano_icon01.png",
      2: "ano_icon02.png",
      3: "ano_icon03.png",
    },
    SHI: {
      1: "shi_icon01.png",
      2: "shi_icon02.png",
      3: "shi_icon03.png",
    },
    AREA_MAP: {
      1: "area_icon_map01.png",
      2: "area_icon_map02.png",
      3: "area_icon_map03.png",
    },
    MARKERS: {
      CURRENT_LOCATION: "current_location.png",
      FACING_NORTH: "facing_north.png",
      PARKING: "parking.png",
      RECOMMEND: "recommend.png",
      TOILETTE: "toilette.png",
    },
  },
  TITLE: {
    ROW1: "title_row1.png",
    ROW2: "title_row2.png",
  },
} as const;

/**
 * アセット設定（パス変換済み）
 * アプリケーション全体で使用されるアセットパスの統一エントリーポイント
 */
export const ASSETS: BaseAssets = transformAssetPaths(baseAssetDefinition);
