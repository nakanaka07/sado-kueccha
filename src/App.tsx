import { useEffect, useState } from "react";
import "./App.css";
import titleImage from "./assets/title_row1.png";
import { MapComponent } from "./components/Map";
import { preloadService } from "./services/preload";

function App() {
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    // アセットをプリロード
    const preloadAssets = async () => {
      try {
        // 重要な画像をプリロード
        await preloadService.preloadImages([
          titleImage,
          // その他の重要な画像も追加可能
        ]);

        // Google Maps APIをプリロード
        const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];
        if (apiKey) {
          preloadService.preloadGoogleMapsAPI(apiKey);
        }
      } catch (error) {
        console.warn("Asset preloading failed:", error);
      }
    };

    void preloadAssets();

    // アプリケーション初期化のためのタイマー
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleMapLoaded = () => {
    setMapLoading(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-content">
          <img src={titleImage} alt="佐渡で食えっちゃ" className="loading-title-image" />
          <div className="loading-spinner"></div>
          <p>佐渡島のおすすめ飲食店を準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {mapLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-content">
            <img src={titleImage} alt="佐渡で食えっちゃ" className="map-loading-title-image" />
            <div className="loading-spinner"></div>
            <p>地図とお店情報を読み込み中...</p>
          </div>
        </div>
      )}
      <header className="app-header">
        <h1>佐渡で食えっちゃ</h1>
        <p>佐渡島のおすすめ飲食店マップ</p>
      </header>
      <main className="app-main">
        <MapComponent className="map-container" onMapLoaded={handleMapLoaded} />
      </main>
    </div>
  );
}

export default App;
