// アセット解決ユーティリティ

// アセット構造の型定義
interface NumberedAssets {
  1: string;
  2: string;
  3: string;
}

interface MarkerAssets {
  CURRENT_LOCATION: string;
  FACING_NORTH: string;
  PARKING: string;
  RECOMMEND: string;
  TOILETTE: string;
}

interface IconAssets {
  ANO: NumberedAssets;
  SHI: NumberedAssets;
  AREA_MAP: NumberedAssets;
  MARKERS: MarkerAssets;
}

interface TitleAssets {
  ROW1: string;
  ROW2: string;
}

interface BaseAssets {
  ICONS: IconAssets;
  TITLE: TitleAssets;
}

/**
 * Viteでのアセット解決のためのヘルパー関数
 */
export const resolveAsset = (path: string): string => {
  // publicフォルダ内のアセットへのパス解決
  return path.startsWith("/assets/") ? path : `/assets/${path.replace(/^.*\//, "")}`;
};

/**
 * 再帰的にパス変換を行うヘルパー関数
 */
const transformPaths = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return resolveAsset(obj) as T;
  }

  if (obj && typeof obj === "object") {
    const result = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      (result as Record<string, unknown>)[key] = transformPaths(value);
    }
    return result;
  }

  return obj;
};

/**
 * アセットのプリロード用のURL解決
 */
export const getAssetUrls = (): BaseAssets => {
  const baseAssets: BaseAssets = {
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
  };

  return transformPaths(baseAssets);
};
