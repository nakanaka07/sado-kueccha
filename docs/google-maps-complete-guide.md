# Google Maps 総合開発ガイド

## 📋 目次

1. [開発の基本方針](#development-basics)
2. [API最適化設定](#api-optimization)
3. [マーカークラスタリング](#marker-clustering)
4. [パフォーマンス最適化](#performance-optimization)
5. [監視と分析](#monitoring-analysis)

---

## 🎯 開発の基本方針 {#development-basics}

### マップモードの選択指針

#### ✅ Uncontrolled モード（推奨）

```tsx
<Map
  defaultZoom={11}
  defaultCenter={center}
  gestureHandling="greedy"
>
```

**使用場面：**

- ユーザーが自由にマップを操作できるようにしたい
- 一般的なマップビューア
- インタラクティブな地図アプリ

#### ⚠️ Controlled モード（慎重に使用）

```tsx
const [camera, setCamera] = useState({ zoom: 11, center: SADO_CENTER });

<Map
  zoom={camera.zoom}
  center={camera.center}
  onCameraChanged={(e) => setCamera(e.detail)}
>
```

**使用場面：**

- マップの状態を厳密に管理したい
- 外部からマップを操作する必要がある
- アニメーションやプログラム制御が必要

### 必須設定項目

#### 基本設定

```tsx
<Map
  defaultZoom={11}                    // 初期ズーム
  defaultCenter={SADO_CENTER}         // 初期中心点
  mapId={process.env.GOOGLE_MAPS_MAP_ID} // Map ID（スタイリング用）
  gestureHandling="greedy"            // ジェスチャー制御
  disableDefaultUI={false}            // UIコントロール
  clickableIcons={true}               // アイコンクリック
>
```

---

## 🚀 API最適化設定 {#api-optimization}

### 1. APIProvider の最適化

```tsx
<APIProvider
  apiKey={process.env.VITE_GOOGLE_MAPS_API_KEY}
  libraries={['marker']}
  language="ja"
  region="JP"
  onLoad={() => console.log('Google Maps API loaded')}
>
```

**最適化ポイント：**

- `libraries={['marker']}`: 必要なライブラリのみを明示的に読み込み
- `language="ja"`: 日本語対応
- `region="JP"`: 日本リージョン設定
- `onLoad` イベントハンドラ: 読み込み完了の監視

### 2. プリロードサービスの改善

```typescript
// services/preload.ts
export const preloadGoogleMaps = () => {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&language=ja&region=JP`;
  script.async = true;
  document.head.appendChild(script);
};
```

**改善内容：**

- `loading=async` パラメータの追加
- エラーハンドリングの追加
- 日本語・リージョン設定

### 3. パフォーマンス設定

```tsx
<APIProvider
  apiKey={apiKey}
  libraries={['marker']}
  language="ja"
  region="JP"
  onLoad={handleMapLoad}
  reuseMaps={true}  // マップインスタンスの再利用
>
```

---

## 🎯 マーカークラスタリング {#marker-clustering}

### 実装済み改善内容

#### 1. 🎨 視覚的差別化の強化

- **クラスターマーカー**: サイズと色でクラスター内のマーカー数を表現
  - 2-5件: オレンジ色 (#FF6B35)、スケール1.2倍
  - 6-9件: ダークオレンジ色 (#FF8C00)、スケール1.3倍
  - 10件以上: 赤色 (#E53E3E)、スケール1.5倍
- **個別マーカー**: 青色 (#4285F4) でGoogle Mapsデフォルトスタイル
- **数字表示**: クラスターマーカーに施設数を白文字で表示

#### 2. 🔍 ズームレベル対応クラスタリング

```typescript
const clusterPOIs = (pois: POI[], zoomLevel: number = 10) => {
  const baseDistance = 0.05; // 基本距離（km）
  const zoomFactor = Math.max(0.1, Math.pow(0.7, zoomLevel - 8));
  const clusterDistance = baseDistance * zoomFactor;

  // ハバーシン公式による正確な距離計算
  const haversineDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // 地球の半径 (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
};
```

**特徴：**

- **動的距離調整**: ズームレベルに応じてクラスタリング距離を自動調整
- **ハバーシン公式**: 正確な地球表面距離計算を実装
- **リアルタイム更新**: ズーム変更時にクラスターが即座に再計算

#### 3. 🚀 パフォーマンス最適化

```typescript
// React.memo でコンポーネントをメモ化
const MarkerComponent = React.memo(({ poi, onClick }: MarkerProps) => {
  return (
    <AdvancedMarker
      position={{ lat: poi.latitude, lng: poi.longitude }}
      onClick={() => onClick(poi)}
    >
      <img src={poi.icon} alt={poi.name} />
    </AdvancedMarker>
  );
});

// useMemo でクラスタリング結果をメモ化
const clusteredPOIs = useMemo(() => {
  return clusterPOIs(pois, zoomLevel);
}, [pois, zoomLevel]);

// useCallback でイベントハンドラーをメモ化
const handleMarkerClick = useCallback((poi: POI) => {
  setSelectedPOI(poi);
}, []);
```

#### 4. 🎯 ユーザビリティ向上

- **詳細ツールチップ**: クラスターマーカーに「〜件の施設が集まっています」と表示
- **視覚的フィードバック**: クラスターサイズによる色とサイズの段階的変化
- **レスポンシブ対応**: ズーム操作に対するマーカーの動的な分離・統合

---

## ⚡ パフォーマンス最適化 {#performance-optimization}

### 実装済みの改善

#### 1. ローディングスピナー + タイトル画像表示

- ページアクセス時に即座に美しいローディング画面を表示
- `title_row1.png`を使用したブランディング

#### 2. データキャッシュ機能

```typescript
// services/cache.ts
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }
}
```

#### 3. プリローディング機能

- 重要なアセットの事前読み込み
- Google Maps APIの並行読み込み

### 期待される改善効果

#### 1. 読み込み時間の短縮

- **改善前**: Maps API の同期読み込みによる性能低下
- **改善後**: 非同期読み込みと必要ライブラリのみの読み込み

#### 2. メモリ使用量の最適化

- マップインスタンスの再利用
- 不要な再レンダリングの防止

#### 3. ユーザー体験の向上

- 日本語・日本リージョンに最適化
- エラー処理の改善

### さらなる最適化案

#### A. データ取得の最適化

```typescript
// 並行データ取得（現在は順次取得）
const promises = sheetConfigs.map((config) =>
  this.fetchSheetData(config.name, "A:Z"),
);
const results = await Promise.allSettled(promises);
```

#### B. Service Worker によるオフラインキャッシュ

- 重要なデータの永続キャッシュ
- オフライン時の基本機能提供

#### C. 仮想化（大量マーカー対応）

- 表示領域内のマーカーのみレンダリング
- メモリ使用量の削減

#### D. Progressive Web App 対応

- アプリライクなユーザーエクスペリエンス
- インストール可能な Web アプリ

#### E. Bundle 最適化

```typescript
// Dynamic import でコード分割
const { MarkerCluster } = await import("./MarkerCluster");
```

---

## 🔍 監視と分析 {#monitoring-analysis}

### 開発者ツールでの確認

#### 1. Network タブ

- Maps API の読み込み方法の確認
- `loading=async` の効果確認

#### 2. Console ログ

```typescript
// ズームレベル変更の監視
const handleCameraChanged = useCallback(
  (e: any) => {
    const newZoom = e.detail.zoom;
    console.log(`Zoom changed: ${zoomLevel} → ${newZoom}`);
    console.log(
      `Cluster distance: ${baseDistance * Math.pow(0.7, newZoom - 8)}km`,
    );
    setZoomLevel(newZoom);
  },
  [zoomLevel],
);
```

#### 3. Performance タブ

- マーカーレンダリングのパフォーマンス測定
- メモリ使用量の監視

### 監視すべき指標

1. **初期読み込み時間**

   - Google Maps API の読み込み完了時間
   - 最初のマーカー表示までの時間

2. **インタラクション応答性**

   - ズーム操作の応答時間
   - マーカークリックの応答時間

3. **メモリ使用量**

   - マーカー数増加時のメモリ使用量
   - クラスタリング処理のメモリ効率

4. **ネットワーク効率**
   - API呼び出し回数
   - キャッシュヒット率

---

## 🎯 開発時のベストプラクティス

### 1. コンポーネント設計

- Google Maps関連コンポーネントは`React.memo`でメモ化
- イベントハンドラーは`useCallback`で最適化
- 重い計算は`useMemo`でメモ化

### 2. エラーハンドリング

```typescript
const handleMapError = (error: any) => {
  console.error("Google Maps Error:", error);
  // ユーザーへの適切なエラー表示
};
```

### 3. デバッグ支援

- 開発環境でのみ詳細ログを出力
- パフォーマンス指標の可視化
- マーカークラスタリングの状態表示

このガイドに従って開発することで、高性能で使いやすいGoogle
Mapsアプリケーションを構築できます。
