import { useCallback, useEffect, useState } from "react";

import "./App.css";
import { FilterPanel } from "./components/FilterPanel";
import { MapComponent } from "./components/Map";
import { ASSETS } from "./constants";
import { FilterService } from "./services/filter";
import { preloadService } from "./services/preload";
import { fetchPOIs } from "./services/sheets";
import type { FilterState } from "./types/filter";
import { getAppConfig, isDevelopment } from "./utils/env";
import type { POI } from "./types/google-maps";

function App() {
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [filterState, setFilterState] = useState<FilterState>(() =>
    FilterService.getDefaultState(),
  );

  // アセットプリロードのuseEffectを最適化
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        const startTime = performance.now();

        // 開発モードでは Vite の静的ファイルサーバーの準備を待つ
        if (isDevelopment()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          // 開発環境では画像プリロードをスキップして、ブラウザに読み込みを任せる
          console.log("🔧 Dev mode: Using browser default loading");
        } else {
          // プロダクション環境でのみ画像をプリロード
          const imagesToPreload = [
            ASSETS.ICONS.AREA_MAP[1],
            ASSETS.ICONS.AREA_MAP[2],
            ASSETS.ICONS.AREA_MAP[3],
            ASSETS.ICONS.MARKERS.CURRENT_LOCATION,
            ASSETS.ICONS.MARKERS.FACING_NORTH,
            ASSETS.ICONS.MARKERS.PARKING,
            ASSETS.ICONS.MARKERS.RECOMMEND,
            ASSETS.TITLE.ROW1,
            ASSETS.ICONS.MARKERS.TOILETTE,
          ];

          // 最適化されたプリロード機能を使用
          await preloadService.preloadImagesWithValidation(imagesToPreload);
        }

        // Google Maps APIをプリロード
        const { googleMapsApiKey } = getAppConfig();
        if (googleMapsApiKey) {
          preloadService.preloadGoogleMapsAPI(googleMapsApiKey);
        }

        const endTime = performance.now();

        if (isDevelopment()) {
          console.log(
            `✅ Asset preload completed in ${Math.round(endTime - startTime).toString()}ms`,
          );
        }

        // 最適化：Promise.allを使用してタイマーを管理
        const minDisplayTime = 300;
        const remainingTime = Math.max(0, minDisplayTime - (endTime - startTime));

        await new Promise((resolve) => setTimeout(resolve, remainingTime));

        // 初期ローディングを即座に終了
        setLoading(false);
      } catch (error) {
        console.warn("Asset preloading failed:", error);
        // エラーが発生しても最小表示時間後にローディングを終了
        await new Promise((resolve) => setTimeout(resolve, 300));
        setLoading(false);
      }
    };

    void preloadAssets();
  }, []);

  // POIデータの読み込み
  useEffect(() => {
    let isMounted = true;

    const loadPOIs = async () => {
      try {
        const data = await fetchPOIs();
        if (isMounted) {
          setPois(data);
        }
      } catch (error) {
        console.warn("POI loading failed:", error);
        if (isMounted) {
          setPois([]);
        }
      }
    };

    void loadPOIs();

    return () => {
      isMounted = false;
    };
  }, []);

  // マップロード完了ハンドラーをuseCallbackでメモ化
  const handleMapLoaded = useCallback(() => {
    if (isDevelopment()) {
      console.log("🗺️ Map fully loaded and ready");
    }

    // 最適化：Promise.allを使用してタイマーを管理
    const animateOut = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFadeOut(true);

      await new Promise((resolve) => setTimeout(resolve, 600));
      setMapLoading(false);

      if (isDevelopment()) {
        console.log("✅ Map loading overlay removed");
      }
    };

    void animateOut();
  }, []);

  // フィルタ変更ハンドラー
  const handleFilterChange = useCallback((newFilterState: FilterState) => {
    setFilterState(newFilterState);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <img src={ASSETS.TITLE.ROW1} alt="佐渡で食えっちゃ" className="loading-title-image" />
          <div className="loading-spinner"></div>
          <p>佐渡島のおすすめ飲食店を準備中...</p>
          <div className="loading-progress">
            <small>アセットを読み込み中です</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {mapLoading && (
        <div className={`map-loading-overlay ${fadeOut ? "fade-out" : ""}`}>
          <div className="map-loading-content">
            <img
              src={ASSETS.TITLE.ROW1}
              alt="佐渡で食えっちゃ"
              className="map-loading-title-image"
            />
            <div className="loading-spinner"></div>
            <p>地図とお店情報を読み込み中...</p>
            <div className="loading-progress">
              <small>最新の店舗情報を取得しています</small>
            </div>
          </div>
        </div>
      )}
      <main className="app-main">
        <FilterPanel pois={pois} filterState={filterState} onFilterChange={handleFilterChange} />
        <MapComponent
          className="map-container"
          onMapLoaded={handleMapLoaded}
          enableClickableIcons={true} // アイコンをクリック可能にする
          filterState={filterState}
          pois={pois}
        />
      </main>
    </div>
  );
}

export default App;
