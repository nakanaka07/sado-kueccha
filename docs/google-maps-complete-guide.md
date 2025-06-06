# Google Maps 総合開発ガイド

## 📋 目次

1. [開発の基本方針](#development-basics)
2. [API最適化設定](#api-optimization)
3. [マーカークラスタリング](#marker-clustering)
4. [パフォーマンス最適化](#performance-optimization)
5. [現在の実装状況](#current-implementation)
6. [監視と分析](#monitoring-analysis)
7. [開発時のベストプラクティス](#best-practices)

---

## 🎯 開発の基本方針 {#development-basics}

### マップモードの選択指針

#### ✅ Uncontrolled モード（推奨）

```tsx
<Map
  defaultZoom={SADO_ISLAND.ZOOM.DEFAULT}
  defaultCenter={SADO_ISLAND.CENTER}
  mapId={import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"] || "佐渡島マップ"}
  mapTypeId={google.maps.MapTypeId.TERRAIN}
  gestureHandling="greedy"
  disableDefaultUI={false}
  mapTypeControl={true}
  mapTypeControlOptions={{
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    position: google.maps.ControlPosition.TOP_LEFT,
  }}
  clickableIcons={enableClickableIcons}
  style={{ width: "100%", height: "100%" }}
  reuseMaps={true}
>
```

**使用場面：**

- ユーザーが自由にマップを操作できるようにしたい
- 一般的なマップビューア
- インタラクティブな地図アプリ

#### ⚠️ Controlled モード（慎重に使用）

```tsx
const [currentZoom, setCurrentZoom] = useState<number>(SADO_ISLAND.ZOOM.DEFAULT);

<Map
  zoom={currentZoom}
  center={SADO_ISLAND.CENTER}
  onCameraChanged={(e: MapCameraChangedEvent) => {
    const { zoom } = e.detail;
    if (zoom && zoom !== currentZoom) {
      setCurrentZoom(zoom);
    }
  }}
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
  defaultZoom={SADO_ISLAND.ZOOM.DEFAULT}                    // 初期ズーム（11）
  defaultCenter={SADO_ISLAND.CENTER}                        // 初期中心点（佐渡島中心）
  mapId={import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"] || "佐渡島マップ"} // Map ID（スタイリング用）
  mapTypeId={google.maps.MapTypeId.TERRAIN}                 // 地形表示
  gestureHandling="greedy"                                  // ジェスチャー制御
  disableDefaultUI={false}                                  // UIコントロール有効
  mapTypeControl={true}                                     // マップタイプ切り替え
  mapTypeControlOptions={{
    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    position: google.maps.ControlPosition.TOP_LEFT,
  }}
  clickableIcons={enableClickableIcons}                     // 既存アイコンクリック制御
  style={{ width: "100%", height: "100%" }}                // スタイル
  reuseMaps={true}                                          // マップインスタンス再利用
>
```

---

## 🚀 API最適化設定 {#api-optimization}

### 1. APIProvider の最適化

```tsx
// APIキーをメモ化してパフォーマンス向上
const apiKey = useMemo(() => import.meta.env["VITE_GOOGLE_MAPS_API_KEY"], []);
// ライブラリ設定をメモ化 - パフォーマンス最適化のためバージョンを指定
const libraries = useMemo(() => ["marker"], []);
const version = useMemo(() => "weekly", []); // 最新の安定版を使用

<APIProvider
  apiKey={apiKey}
  version={version}
  libraries={libraries}
  language="ja"
  region="JP"
  onLoad={handleMapReady}
>
```

**最適化ポイント：**

- `useMemo`を使用してAPIキー、ライブラリ設定、バージョンをメモ化
- `libraries={['marker']}`: 必要なライブラリのみを明示的に読み込み
- `version="weekly"`: 最新の安定版APIを使用
- `language="ja"`: 日本語対応
- `region="JP"`: 日本リージョン設定
- `onLoad` イベントハンドラ: 読み込み完了の監視

### 2. プリロードサービスの改善

```typescript
// 現在の実装では非同期読み込みを活用
const apiKey = useMemo(() => import.meta.env["VITE_GOOGLE_MAPS_API_KEY"], []);
const version = useMemo(() => "weekly", []);
const libraries = useMemo(() => ["marker"], []);

// 事前読み込みが必要な場合のプリロード実装例
export const preloadGoogleMaps = () => {
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&language=ja&region=JP&v=weekly`;
  script.async = true;
  document.head.appendChild(script);
};
```

**改善内容：**

- `useMemo`によるメモ化でパフォーマンス向上
- `version="weekly"` パラメータで最新安定版を使用
- `loading=async` パラメータの追加
- エラーハンドリングの追加
- 日本語・リージョン設定

### 3. パフォーマンス設定

```tsx
<APIProvider
  apiKey={apiKey}
  version={version}
  libraries={libraries}
  language="ja"
  region="JP"
  onLoad={handleMapReady}
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
// 現在の実装：GoogleMarkerCluster.tsx
const generateCacheKey = (pois: POI[], zoomLevel: number): string => {
  const poisIdHash = Math.abs(
    pois
      .map((p) => p.id)
      .sort()
      .join("-")
      .split("")
      .reduce((hash, char) => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
        return hash;
      }, 0),
  ).toString(36);

  return `cluster-${pois.length.toString()}-${Math.round(zoomLevel * 10).toString()}-${poisIdHash}`;
};

// ハバーシン公式による正確な距離計算は GeoUtils で実装
import { GeoUtils } from "../utils/geo";

// ビューポート内のPOIのみを処理
const partitionPOIsByViewport = (
  pois: ClusterablePOI[],
  bounds: google.maps.LatLngBounds | null,
) => {
  if (!bounds) return { inViewport: pois, outOfViewport: [] };

  return pois.reduce(
    (acc, poi) => {
      if (GeoUtils.isInBounds(poi.position.lat, poi.position.lng, bounds)) {
        acc.inViewport.push(poi);
      } else {
        acc.outOfViewport.push(poi);
      }
      return acc;
    },
    {
      inViewport: [] as ClusterablePOI[],
      outOfViewport: [] as ClusterablePOI[],
    },
  );
};
```

**特徴：**

- **キャッシュベースの最適化**: ハッシュ化されたキャッシュキーで重複計算を回避
- **ビューポート最適化**: 表示領域内のPOIのみをクラスタリング処理
- **ユーティリティ分離**: GeoUtils クラスで地理計算をモジュール化
- **リアルタイム更新**: ズーム変更時にクラスターが即座に再計算
- **デバウンス処理**: useDebounce フックで頻繁な更新を制御

#### 3. 🚀 パフォーマンス最適化

```typescript
// React.memo でコンポーネントをメモ化
const MarkerComponent = memo<MarkerComponentProps>(({ poi, onMarkerClick, isCluster, clusterSize, currentZoom }) => {
  return (
    <AdvancedMarker
      position={poi.position}
      onClick={() => onMarkerClick?.(poi)}
    >
      {isCluster ? (
        <Pin
          background={getClusterColor(clusterSize || 0)}
          borderColor="#ffffff"
          glyphColor="#ffffff"
          scale={getClusterScale(clusterSize || 0)}
        >
          {clusterSize}
        </Pin>
      ) : (
        <img src={poi.icon} alt={poi.name} />
      )}
    </AdvancedMarker>
  );
});

// useMemo でクラスタリング結果をメモ化
const clusteredPOIs = useMemo(() => {
  // キャッシュチェック
  const cacheKey = generateCacheKey(pois, currentZoom || 10);
  const cached = cacheService.get(cacheKey);
  if (cached) return cached as ClusterablePOI[];

  // クラスタリング処理...
}, [pois, currentZoom]);

// useCallback でイベントハンドラーをメモ化
const handleMarkerClick = useCallback((poi: ClusterablePOI) => {
  onMarkerClick?.(poi);
}, [onMarkerClick]);

// デバウンス処理でズーム変更の頻繁な更新を制御
const debouncedZoom = useDebounce(currentZoom || 10, 150);
```

#### 4. 🎯 ユーザビリティ向上

- **詳細ツールチップ**: クラスターマーカーに「〜件の施設が集まっています」と表示
- **視覚的フィードバック**: クラスターサイズによる色とサイズの段階的変化
- **レスポンシブ対応**: ズーム操作に対するマーカーの動的な分離・統合
- **クラスタークリック処理**: クラスター選択時の自動ズーム・パン機能
- **スムーズなアニメーション**: パンとズームの段階的実行でUX向上

---

## ⚡ パフォーマンス最適化 {#performance-optimization}

### 実装済みの改善

#### 1. ローディングスピナー + タイトル画像表示

- ページアクセス時に即座に美しいローディング画面を表示
- `title_row1.png`を使用したブランディング

#### 2. データキャッシュ機能

```typescript
// services/cache.ts - 実装済み統合キャッシュサービス
import { CACHE_CONFIG } from "../constants";

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_EXPIRY = CACHE_CONFIG.DEFAULT_EXPIRY; // 15分
  private readonly MAX_SIZE = CACHE_CONFIG.MAX_ENTRIES; // 100エントリ

  set(
    key: string,
    data: unknown,
    expiryMs: number = this.DEFAULT_EXPIRY,
  ): void {
    this.enforceSize(); // サイズ制限チェック

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    this.cache.set(key, entry);
  }

  get(key: string): unknown {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const expiry = entry.expiry ?? this.DEFAULT_EXPIRY;
    if (now - entry.timestamp > expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // 型安全な取得メソッド
  getTyped<T>(
    key: string,
    typeGuard: (value: unknown) => value is T,
  ): T | null {
    const value = this.get(key);
    return value !== null && typeGuard(value) ? value : null;
  }
}

export const cacheService = new CacheService();
```

#### 3. アニメーション最適化

```typescript
// アニメーション設定定数（Map.tsx）
const ANIMATION_CONFIG = {
  PAN_DELAY: 400, // パンアニメーション完了待ち時間（ms）
  ZOOM_STEPS_PER_LEVEL: 4, // ズーム1レベルあたりのステップ数
  ZOOM_STEP_INTERVAL: 25, // 各ズームステップの間隔（ms）
  DEFAULT_ZOOM_INCREMENT: 2, // デフォルトのズーム増分
} as const;

// クラスタークリック時のスムーズズーム処理
const zoomToCluster = useCallback(
  (poi: ClusterablePOI) => {
    if (!mapInstance || !isClusterPOI(poi)) return;

    const bounds = new google.maps.LatLngBounds();
    poi.originalPois.forEach((originalPoi: POI) => {
      bounds.extend(originalPoi.position);
    });

    // 段階的にパン→ズーム実行
    const center = bounds.getCenter();
    mapInstance.panTo(center);

    setTimeout(() => {
      // 適切なズームレベルを計算してスムーズに移行
      const targetZoom = calculateOptimalZoom(poi.originalPois);
      mapInstance.setZoom(targetZoom);
    }, ANIMATION_CONFIG.PAN_DELAY);
  },
  [mapInstance],
);
```

### 期待される改善効果

#### 1. 読み込み時間の短縮

- **改善前**: Maps API の同期読み込みによる性能低下
- **改善後**:
  `version="weekly"`指定と非同期読み込み、必要ライブラリのみの読み込み
- **実装済み**: useMemoによるAPIキー・設定のメモ化で再レンダリング最適化

#### 2. メモリ使用量の最適化

- マップインスタンスの再利用（`reuseMaps={true}`）
- React.memo、useMemo、useCallbackによる不要な再レンダリング防止
- LRUキャッシュによるメモリ効率的なデータ管理

#### 3. ユーザー体験の向上

- 日本語・日本リージョンに最適化
- エラー処理の改善
- スムーズなクラスターアニメーション
- デバウンス処理による応答性向上

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

- Bundle 最適化

```typescript
// Dynamic import でコード分割
const { MarkerCluster } = await import("./MarkerCluster");
```

---

## 🏗️ 現在の実装状況 {#current-implementation}

### プロジェクト構成

```text
src/
  components/
    Map.tsx                    # メインマップコンポーネント
    GoogleMarkerCluster.tsx    # マーカークラスタリング
    InfoWindow.tsx             # 情報ウィンドウ
    LazyMap.tsx               # 遅延読み込みラッパー
  constants/
    index.ts                  # 定数定義（SADO_ISLAND, CACHE_CONFIG等）
  services/
    cache.ts                  # 統合キャッシュサービス
    sheets.ts                 # Google Sheets API連携
    preload.ts                # アセットプリロード
  types/
    google-maps.ts            # Google Maps関連型定義
    common.ts                 # 共通型定義
  utils/
    geo.ts                    # 地理計算ユーティリティ
    assets.ts                 # アセット管理
```

### 主要な実装済み機能

#### 1. 高度なマーカークラスタリング

- **ビューポート最適化**: 表示領域内のPOIのみ処理
- **キャッシュ機能**: ハッシュベースの効率的なキャッシング
- **デバウンス処理**: ズーム変更時の過度な再計算を防止
- **視覚的差別化**: クラスターサイズに応じた色・スケール変更

#### 2. パフォーマンス最適化

- **React.memo**: コンポーネントレベルのメモ化
- **useMemo/useCallback**: 適切なフック使用
- **LRUキャッシュ**: メモリ効率的なデータ管理
- **リソース管理**: 不要なイベントリスナーの適切なクリーンアップ

#### 3. ユーザーインタラクション

- **スマートズーム**: クラスタークリック時の最適なズームレベル計算
- **スムーズアニメーション**: パン→ズームの段階的実行
- **InfoWindow制御**: 外部クリックでの自動クローズ
- **地形表示**: 佐渡島の地理に適したTERRAINモード

#### 4. 設定管理

- **環境変数**: Vite環境変数による設定管理
- **定数定義**: SADO_ISLAND設定での一元管理
- **型安全性**: TypeScript型定義による品質保証

### 使用ライブラリ・依存関係

```json
{
  "@vis.gl/react-google-maps": "^1.5.2", // React Google Maps
  "@googlemaps/markerclusterer": "^2.5.3", // 公式クラスタリング（補助）
  "react": "19.1.0", // React 19
  "react-dom": "19.1.0" // React DOM
}
```

### 現在の設定値

```typescript
// constants/index.ts
export const SADO_ISLAND = {
  CENTER: { lat: 38.0549, lng: 138.3691 },
  ZOOM: {
    DEFAULT: 11,
    MIN: 9,
    MAX: 18,
    MIN_CLUSTER_ZOOM: 8,
    DISABLE_CLUSTERING: 14,
    HIGH_THRESHOLD: 17,
    MAX_ZOOM_LEVEL: 20,
  },
  MARKER_LIMITS: {
    NORMAL_ZOOM: 200,
    HIGH_ZOOM: 500,
  },
  BOUNDS: {
    NORTH: 38.3,
    SOUTH: 37.7,
    EAST: 138.7,
    WEST: 138.0,
  },
};

export const CACHE_CONFIG = {
  DEFAULT_EXPIRY: 15 * 60 * 1000, // 15分
  SHEETS_TTL: 60 * 60 * 1000, // 1時間
  IMAGES_TTL: 24 * 60 * 60 * 1000, // 24時間
  MAX_SIZE: 10,
  MAX_ENTRIES: 100,
};
```

### 実装済みの最適化

#### マーカークラスタリング最適化

- ビューポート境界チェックによる処理対象絞り込み
- キャッシュキーのハッシュ化による高速検索
- デバウンス処理（150ms）による頻繁な更新制御

#### メモリ管理最適化

- LRU方式による古いキャッシュエントリ自動削除
- MutationObserverによるDOM要素の適切なクリーンアップ
- useEffect依存配列の最適化

#### ユーザビリティ最適化

- クラスタークリック時の段階的ズーム（パン400ms待機→ズーム）
- InfoWindow外部クリック検出による自動クローズ
- Google Maps標準アイコンとの共存制御

---

## 🔍 監視と分析 {#monitoring-analysis}

### 開発者ツールでの確認

#### 1. Network タブ

- Maps API の読み込み方法の確認
- `version=weekly` の効果確認
- ライブラリの並行読み込み状況

#### 2. Console ログ

```typescript
// ズームレベル変更の監視（Map.tsx）
const handleCameraChanged = useCallback(
  (event: MapCameraChangedEvent) => {
    const { zoom } = event.detail;
    if (zoom && zoom !== currentZoom) {
      console.log(`Zoom changed: ${currentZoom} → ${zoom}`);
      setCurrentZoom(zoom);
    }
  },
  [currentZoom],
);

// クラスタリングキャッシュの監視（GoogleMarkerCluster.tsx）
const clusteredPOIs = useMemo(() => {
  const cacheKey = generateCacheKey(pois, debouncedZoom);
  const cached = cacheService.get(cacheKey);

  if (cached) {
    console.log(`Cache hit for zoom ${debouncedZoom}`);
    return cached as ClusterablePOI[];
  }

  console.log(`Computing clusters for zoom ${debouncedZoom}`);
  // クラスタリング処理...
}, [pois, debouncedZoom]);
```

#### 3. Performance タブ

- マーカーレンダリングのパフォーマンス測定
- React DevToolsでコンポーネントの再レンダリング分析
- メモリ使用量の監視

### 監視すべき指標

1. **初期読み込み時間**

   - Google Maps API の読み込み完了時間
   - 最初のマーカー表示までの時間
   - POIデータの取得時間

2. **インタラクション応答性**

   - ズーム操作の応答時間（デバウンス150ms考慮）
   - マーカークリックの応答時間
   - クラスタークリック時のアニメーション時間

3. **メモリ使用量**

   - マーカー数増加時のメモリ使用量
   - キャッシュエントリ数とメモリ効率
   - DOM要素のクリーンアップ状況

4. **キャッシュ効率**
   - クラスタリングキャッシュのヒット率
   - POIデータキャッシュの有効性
   - LRU削除の発生頻度

### パフォーマンス測定のコード例

```typescript
// パフォーマンス測定ユーティリティ
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name}: ${end - start}ms`);
};

// 使用例
measurePerformance("Clustering calculation", () => {
  const result = computeClusters(pois, zoomLevel);
});
```

---

## 🎯 開発時のベストプラクティス {#best-practices}

### 1. コンポーネント設計

- Google Maps関連コンポーネントは`React.memo`でメモ化
- イベントハンドラーは`useCallback`で最適化
- 重い計算は`useMemo`でメモ化
- 型安全性を重視したTypeScript活用

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

### 4. 現在の実装における注意点

#### 環境変数の管理

```typescript
// Vite環境変数を使用
const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];
const mapId = import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"];
```

#### イベントリスナーのクリーンアップ

```typescript
useEffect(() => {
  const cleanup = setupMapEventListeners();
  return cleanup; // 必ず適切なクリーンアップを実行
}, []);
```

#### 型安全性の確保

```typescript
// 型ガードを使用した安全な型変換
if (isClusterPOI(poi)) {
  // ClusterPOI型として安全に使用可能
  zoomToCluster(poi);
}
```

このガイドに従って開発することで、高性能で使いやすいGoogle
Mapsアプリケーションを構築できます。
