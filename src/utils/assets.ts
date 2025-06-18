/**
 * 🎨 アセット解決ユーティリティ
 * 最新のベストプラクティスに基づいたアセット管理
 */

import type { AssetUrl, BaseAssets } from "../types/assets";
import { getAppConfig } from "./env";

/**
 * アセット解決キャッシュ（パフォーマンス最適化）
 */
const assetPathCache = new Map<string, string>();

/**
 * セキュアなアセットパス解決関数
 * XSS攻撃を防ぐためのサニタイゼーション機能付き
 * @param path - 解決するアセットパス
 * @returns サニタイズされた完全なアセットパス
 */
export const resolveAssetPath = (path: string): AssetUrl => {
  // 入力検証とサニタイゼーション
  if (!path || typeof path !== "string") {
    return "" as AssetUrl;
  }

  // キャッシュ確認（パフォーマンス向上）
  const cachedPath = assetPathCache.get(path);
  if (cachedPath) {
    return cachedPath as AssetUrl;
  }

  // XSS攻撃防止のためのサニタイゼーション
  const sanitizedPath = sanitizeAssetPath(path);
  if (!sanitizedPath) {
    return "" as AssetUrl;
  }

  const { app } = getAppConfig();
  const { basePath } = app;

  // 既に完全パスの場合はそのまま返す（HTTPSのみ許可）
  if (isAbsoluteUrl(sanitizedPath)) {
    const resolvedPath = sanitizedPath;
    assetPathCache.set(path, resolvedPath);
    return resolvedPath as AssetUrl;
  }

  // publicフォルダ内のアセットの場合
  // クロスプラットフォーム対応（Windows/Unix両方のパス区切り文字に対応）
  const normalizedPath = sanitizedPath.startsWith("/assets/")
    ? sanitizedPath
    : `/assets/${sanitizedPath.split(/[/\\]/).pop() || sanitizedPath}`;

  // ベースパスが設定されている場合は追加
  const resolvedPath = basePath
    ? `${basePath.endsWith("/") ? basePath.slice(0, -1) : basePath}${normalizedPath}`
    : normalizedPath;

  // キャッシュに保存
  assetPathCache.set(path, resolvedPath);
  return resolvedPath as AssetUrl;
};

/**
 * アセットパスのサニタイゼーション
 * @param path - サニタイズするパス
 * @returns サニタイズされたパス
 */
function sanitizeAssetPath(path: string): string {
  // 危険な文字を除去
  const dangerousChars = /[<>"'&]/g;
  const sanitized = path.replace(dangerousChars, "");

  // パストラバーサル攻撃を防ぐ
  if (sanitized.includes("../") || sanitized.includes("..\\")) {
    return "";
  }

  return sanitized;
}

/**
 * 絶対URLかどうかを判定（HTTPSのみ許可）
 * @param url - 判定するURL
 * @returns HTTPSの絶対URLの場合true
 */
function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("//");
}

/**
 * 高性能アセット定義変換（メモ化対応）
 * 型安全な方法でアセットパスを解決し、結果をキャッシュ
 */
const transformAssetPaths = (() => {
  let cachedAssets: BaseAssets | null = null;

  return (obj: typeof baseAssetDefinition): BaseAssets => {
    // 開発環境では常に再計算、本番環境ではキャッシュを使用
    if (cachedAssets && import.meta.env.PROD) {
      return cachedAssets;
    }

    const transformedAssets: BaseAssets = {
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

    cachedAssets = transformedAssets;
    return transformedAssets;
  };
})();

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

/**
 * 🧹 アセットキャッシュのクリア（メンテナンス用）
 * 開発環境でのアセット更新時に使用
 */
export const clearAssetCache = (): void => {
  assetPathCache.clear();
  // 開発環境でのデバッグ用ログ（lintルールに準拠）
};

/**
 * 📊 アセットキャッシュの統計情報取得
 * @returns キャッシュサイズとエントリ数
 */
export const getAssetCacheStats = (): { size: number; entries: string[] } => {
  return {
    size: assetPathCache.size,
    entries: Array.from(assetPathCache.keys()),
  };
};

/**
 * 🔍 アセットの存在確認（非同期）
 * @param assetPath - 確認するアセットパス
 * @returns アセットが存在する場合true
 */
export const checkAssetExists = async (assetPath: string): Promise<boolean> => {
  try {
    const response = await fetch(assetPath, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * 🎯 プリロード用のアセットリスト生成
 * 重要なアセットの優先読み込み用
 * @returns プリロード対象のアセットパス配列
 */
export const getCriticalAssets = (): string[] => {
  return [
    ASSETS.ICONS.MARKERS.CURRENT_LOCATION,
    ASSETS.ICONS.MARKERS.RECOMMEND,
    ASSETS.TITLE.ROW1,
    ASSETS.TITLE.ROW2,
  ];
};
