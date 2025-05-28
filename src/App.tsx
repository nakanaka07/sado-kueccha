import { useEffect, useState } from "react";
import "./App.css";
import { MapComponent } from "./components/Map";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // アプリケーション初期化のためのタイマー
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <h1>佐渡で食えっちゃ</h1>
        <p>データを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>佐渡で食えっちゃ</h1>
        <p>佐渡島のおすすめ飲食店マップ</p>
      </header>
      <main className="app-main">
        <MapComponent className="map-container" />
      </main>
    </div>
  );
}

export default App;
