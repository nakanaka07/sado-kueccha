import { useCallback, useEffect, useState } from "react";
import "./App.css";
import anoIcon01 from "./assets/ano_icon01.png";
import currentLocationIcon from "./assets/current_location.png";
import parkingIcon from "./assets/parking.png";
import shiIcon01 from "./assets/shi_icon01.png";
import titleImage from "./assets/title_row1.png";
import toiletteIcon from "./assets/toilette.png";
import { MapComponent } from "./components/Map";
import { preloadService } from "./services/preload";

function App() {
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // アセットプリロードのuseEffectを最適化
  useEffect(() => {
    const preloadAssets = async () => {
      try {
        console.log("🚀 Starting asset preload...");
        const startTime = performance.now();

        // 重要な画像をプリロード（マップアイコンも追加）
        await preloadService.preloadImages([
          titleImage,
          anoIcon01,
          shiIcon01,
          currentLocationIcon,
          parkingIcon,
          toiletteIcon,
        ]);

        // Google Maps APIをプリロード
        const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];
        if (apiKey) {
          preloadService.preloadGoogleMapsAPI(apiKey);
        }

        const endTime = performance.now();
        console.log(
          `✅ Asset preload completed in ${Math.round(endTime - startTime).toString()}ms`,
        );

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

  // マップロード完了ハンドラーをuseCallbackでメモ化
  const handleMapLoaded = useCallback(() => {
    console.log("🗺️ Map fully loaded and ready");

    // 最適化：Promise.allを使用してタイマーを管理
    const animateOut = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setFadeOut(true);

      await new Promise((resolve) => setTimeout(resolve, 600));
      setMapLoading(false);
      console.log("✅ Map loading overlay removed");
    };

    void animateOut();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <img src={titleImage} alt="佐渡で食えっちゃ" className="loading-title-image" />
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
            <img src={titleImage} alt="佐渡で食えっちゃ" className="map-loading-title-image" />
            <div className="loading-spinner"></div>
            <p>地図とお店情報を読み込み中...</p>
            <div className="loading-progress">
              <small>最新の店舗情報を取得しています</small>
            </div>
          </div>
        </div>
      )}
      <main className="app-main">
        <MapComponent className="map-container" onMapLoaded={handleMapLoaded} />
      </main>
    </div>
  );
}

export default App;
