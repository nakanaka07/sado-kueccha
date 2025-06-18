/**
 * 遅延読み込み対応マップコンポーネント
 *
 * @description
 * - React.lazy()による動的インポート
 * - Suspenseでのローディング状態管理
 * - エラーバウンダリー対応
 * - パフォーマンス最適化
 *
 * @version 1.0.0
 * @since 2025-01-27
 */

import React, { Suspense } from "react";
import { ErrorBoundary, LoadingScreen } from "../ui";

// 遅延読み込み用のMapコンポーネント
const LazyMapComponent = React.lazy(() =>
  import("./Map").then((module) => ({ default: module.MapComponent })),
);

/**
 * マップコンポーネントのProps型定義
 */
interface LazyMapProps {
  /** クラス名 */
  className?: string;
  /** その他のProps */
  [key: string]: unknown;
}

/**
 * 遅延読み込みマップコンポーネント
 */
export const LazyMap: React.FC<LazyMapProps> = (props) => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div
            style={{
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LoadingScreen message="地図を読み込み中..." />
          </div>
        }
      >
        <LazyMapComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyMap;
