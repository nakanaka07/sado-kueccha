# Google Maps 総合開発ガイド

> **📝 ドキュメント構成について**  
> このガイドでは、コード例の重複を避けるため、実装例は実際のソースコードファイルへのリンクで参照しています。  
> 最新の実装詳細は、各リンク先ファイルをご確認ください。

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

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx) - Line 433-447

基本的なマップ設定例：

- `defaultZoom`: SADO_ISLAND定数による初期ズーム設定
- `defaultCenter`: 佐渡島中心座標
- `mapTypeId`: TERRAIN表示の設定
- `gestureHandling`: ユーザー操作の制御

**使用場面：**

- ユーザーが自由にマップを操作できるようにしたい
- 一般的なマップビューア
- インタラクティブな地図アプリ

#### ⚠️ Controlled モード（慎重に使用）

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx) - Line 58,
81-87

Controlled モードでのズーム状態管理：

- `useState`でズーム状態を管理
- `onCameraChanged`イベントでの状態同期
- プログラム制御が可能

**使用場面：**

- マップの状態を厳密に管理したい
- 外部からマップを操作する必要がある
- アニメーションやプログラム制御が必要

### 必須設定項目

#### 基本設定

**設定値の参照**: [`src/constants/index.ts`](../src/constants/index.ts) -
SADO_ISLAND定数

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx) - Line 433-447

主要な設定項目：

- **defaultZoom**: `SADO_ISLAND.ZOOM.DEFAULT`
  (11) - 佐渡島全体が見える最適なズーム
- **defaultCenter**: `SADO_ISLAND.CENTER` - 佐渡島の地理的中心点
- **mapId**: 環境変数によるMap ID設定（スタイリング用）
- **mapTypeId**: `google.maps.MapTypeId.TERRAIN` - 地形表示
- **gestureHandling**: `"greedy"` - スクロール操作の制御
- **reuseMaps**: `true` - パフォーマンス向上のためのマップインスタンス再利用

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

**実装例**: [`src/services/preload.ts`](../src/services/preload.ts)

**アプリケーション側の実装**: [`src/App.tsx`](../src/App.tsx) - Line 51-55

改善内容：

- **useMemo活用**: メモ化によるパフォーマンス向上
- **非同期読み込み**: `loading=async`による最適化
- **バージョン指定**: `version="weekly"`で最新安定版使用
- **地域設定**: 日本語・リージョン最適化

### 3. パフォーマンス設定

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx) - Line 49-52

重要な設定項目：

- **reuseMaps**: マップインスタンスの再利用
- **language/region**: 地域最適化
- **onLoad**: 読み込み完了の監視

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

**実装ファイル**:
[`src/components/GoogleMarkerCluster.tsx`](../src/components/GoogleMarkerCluster.tsx)

**キャッシュキー生成**: Line 240-252 **ビューポート最適化**: Line 140-160
**地理計算ユーティリティ**: [`src/utils/geo.ts`](../src/utils/geo.ts)

主要な機能：

- **キャッシュベース最適化**: ハッシュ化されたキャッシュキーで重複計算回避
- **ビューポート最適化**: 表示領域内のPOIのみ処理
- **ユーティリティ分離**: GeoUtilsクラスでの地理計算モジュール化
- **リアルタイム更新**: ズーム変更時の即座な再計算
- **デバウンス処理**: useDebounceフックによる頻繁更新制御

#### 3. 🚀 パフォーマンス最適化

**実装ファイル**:
[`src/components/GoogleMarkerCluster.tsx`](../src/components/GoogleMarkerCluster.tsx)

**メモ化実装**: Line 360-370 (React.memo), Line 390+ (useMemo), Line 410+
(useCallback) **デバウンス実装**: Line 36-45 (useDebounce hook)
**キャッシュサービス**: [`src/services/cache.ts`](../src/services/cache.ts)

最適化手法：

- **React.memo**: MarkerComponentのメモ化によるコンポーネント最適化
- **useMemo**: クラスタリング結果のメモ化とキャッシュ活用
- **useCallback**: イベントハンドラーのメモ化
- **デバウンス処理**: 150msデバウンスによるズーム変更の頻繁更新制御

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

**実装ファイル**: [`src/services/cache.ts`](../src/services/cache.ts)

**設定定数**: [`src/constants/index.ts`](../src/constants/index.ts) -
CACHE_CONFIG

主要な機能：

- **統合キャッシュサービス**: 単一のCacheServiceクラスで一元管理
- **LRU方式**: 最大エントリ数制限による効率的なメモリ管理
- **有効期限制御**: アイテム別の有効期限設定
- **型安全な取得**: typeGuardによる型安全なデータ取得
- **自動サイズ管理**: enforceSize()による古いエントリ自動削除

#### 3. アニメーション最適化

**実装ファイル**: [`src/components/Map.tsx`](../src/components/Map.tsx)

**アニメーション設定**: Line 40-45 (ANIMATION_CONFIG定数)
**クラスタークリック処理**: Line 147-177 (zoomToCluster関数)

設定値と実装：

- **PAN_DELAY**: 400ms - パンアニメーション完了待ち時間
- **ZOOM_STEPS**: ズーム1レベルあたり4ステップで滑らかな移行
- **段階的実行**: パン→ズームの順次実行でUX向上
- **最適ズーム計算**: クラスター内POI分布に基づく適切なズームレベル算出

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

**定数ファイル**: [`src/constants/index.ts`](../src/constants/index.ts)

#### SADO_ISLAND設定

主要な設定値：

- **CENTER**: `{ lat: 38.0549, lng: 138.3691 }` - 佐渡島の地理的中心
- **DEFAULT_ZOOM**: `11` - 佐渡島全体表示に最適なズーム
- **ZOOM範囲**: MIN(9) ～ MAX(18) - 操作可能な範囲
- **CLUSTERING制御**: MIN_CLUSTER_ZOOM(8), DISABLE_CLUSTERING(14)
- **MARKER制限**: NORMAL_ZOOM(200), HIGH_ZOOM(500) - 表示マーカー数制限

#### CACHE_CONFIG設定

キャッシュ管理の設定：

- **DEFAULT_EXPIRY**: 15分 - 標準的なキャッシュ有効期限
- **SHEETS_TTL**: 1時間 - Google Sheetsデータのキャッシュ
- **IMAGES_TTL**: 24時間 - 画像リソースのキャッシュ
- **MAX_ENTRIES**: 100 - 最大キャッシュエントリ数

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

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx) - Line 81-87

**クラスタリング監視**:
[`src/components/GoogleMarkerCluster.tsx`](../src/components/GoogleMarkerCluster.tsx) -
Line 390+

開発時のログ出力：

- **ズーム変更監視**: `handleCameraChanged`でのズームレベル変化追跡
- **キャッシュ効率監視**: クラスタリングキャッシュのヒット/ミス状況
- **パフォーマンス測定**: 計算時間の測定とログ出力

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

**実装推奨パターン**: パフォーマンス測定ユーティリティ

```typescript
// パフォーマンス測定ユーティリティ（開発時のみ使用推奨）
const measurePerformance = (name: string, fn: () => void) => {
  if (import.meta.env.DEV) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name}: ${end - start}ms`);
  } else {
    fn();
  }
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

**実装例**: [`src/components/Map.tsx`](../src/components/Map.tsx)

基本的なエラーハンドリングパターン：

```typescript
const handleMapError = (error: any) => {
  console.error("Google Maps Error:", error);
  // ユーザーへの適切なエラー表示
  // 例：トーストメッセージやエラーバナーの表示
};
```

### 3. デバッグ支援

- 開発環境でのみ詳細ログを出力
- パフォーマンス指標の可視化
- マーカークラスタリングの状態表示

### 4. 現在の実装における注意点

#### 環境変数の管理

**設定ファイル**: `.env`ファイル（プロジェクトルート）

```typescript
// Vite環境変数の使用例
const apiKey = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];
const mapId = import.meta.env["VITE_GOOGLE_MAPS_MAP_ID"];
```

**実装例**: [`src/App.tsx`](../src/App.tsx) - Line 51

#### イベントリスナーのクリーンアップ

**実装パターン**: React useEffectでの適切なクリーンアップ

```typescript
useEffect(() => {
  const cleanup = setupMapEventListeners();
  return cleanup; // 必ず適切なクリーンアップを実行
}, []);
```

**参考実装**: [`src/components/Map.tsx`](../src/components/Map.tsx) - useEffect
hooks

#### 型安全性の確保

**型定義ファイル**: [`src/types/google-maps.ts`](../src/types/google-maps.ts)

**実装例**:
[`src/components/GoogleMarkerCluster.tsx`](../src/components/GoogleMarkerCluster.tsx)

型ガードの使用例：

```typescript
// 型ガードを使用した安全な型変換
if (isClusterPOI(poi)) {
  // ClusterPOI型として安全に使用可能
  zoomToCluster(poi);
}
```

このガイドに従って開発することで、高性能で使いやすいGoogle
Mapsアプリケーションを構築できます。
