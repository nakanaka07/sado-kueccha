# Google Maps React 開発ガイド

## マップモードの選択指針

### ✅ Uncontrolled モード（推奨）

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

### ⚠️ Controlled モード（慎重に使用）

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

## 必須設定項目

### 基本設定

```tsx
<Map
  defaultZoom={11}                    // 初期ズーム
  defaultCenter={SADO_CENTER}         // 初期中心点
  mapId={process.env.GOOGLE_MAPS_MAP_ID} // Map ID（スタイリング用）
  gestureHandling="greedy"            // ジェスチャー制御
  disableDefaultUI={false}            // UIコントロール
  clickableIcons={true}               // アイコンクリック
  style={{ width: '100%', height: '100%' }} // サイズ指定
>
```

### gestureHandling オプション

- `"greedy"`: すべてのジェスチャーを許可（推奨）
- `"cooperative"`: Ctrl+スクロールでズーム
- `"none"`: すべて無効
- `"auto"`: 自動判定

## よくある問題と解決方法

### 問題1: マップが操作できない

**原因:** Controlledモードになっている **解決:** `zoom` →
`defaultZoom`、`center` → `defaultCenter`

### 問題2: マップサイズが0になる

**原因:** 親要素の高さが指定されていない **解決:** CSSで明示的に高さを指定

### 問題3: API キーエラー

**原因:** 環境変数の設定ミス **解決:** .envファイルとGoogle Cloud
Console設定を確認

### 問題4: マーカーが表示されない

**原因:** AdvancedMarker API が有効化されていない **解決:** Google Cloud
ConsoleでAdvanced Markersを有効化

## パフォーマンス最適化

### 1. Map Instance Caching

```tsx
<Map reuseMaps={true} />
```

### 2. メモ化の活用

```tsx
const memoizedMarkers = useMemo(
  () =>
    data.map((item) => (
      <AdvancedMarker key={item.id} position={item.position} />
    )),
  [data],
);
```

### 3. 大量マーカーの処理

```tsx
import { MarkerClusterer } from "@googlemaps/markerclusterer";
// クラスタリングを使用して表示パフォーマンス向上
```

## セキュリティ注意事項

### API キー管理

1. `.env`ファイルは`.gitignore`に追加
2. 本番環境ではHTTPリファラー制限を設定
3. 必要最小限のAPIのみ有効化

### ドメイン制限

```javascript
// Google Cloud Console での設定例
https://yourdomain.com/*
http://localhost:3000/*  // 開発環境用
```

## デバッグ方法

### 1. カメラ変更の監視

```tsx
const handleCameraChange = useCallback((event) => {
  console.log("Camera:", event.detail);
}, []);

<Map onCameraChanged={handleCameraChange} />;
```

### 2. エラーハンドリング

```tsx
<APIProvider
  apiKey={apiKey}
  onLoad={() => console.log("Maps API loaded")}
  libraries={['marker']}
>
```

### 3. ブラウザ開発者ツール

- Network タブでAPI呼び出しを確認
- Console でJavaScriptエラーをチェック
- Elements でDOMの状態を確認

## 今後の機能拡張時の指針

### 1. 段階的な機能追加

- まず基本的なマップ表示を安定させる
- その後、マーカー、インフォウィンドウ等を追加
- 最後にインタラクション機能を実装

### 2. コンポーネント分割

```text
components/
  Map/
    Map.tsx           // メインマップ
    MapMarker.tsx     // マーカー専用
    MapControls.tsx   // カスタムコントロール
    MapCluster.tsx    // クラスタリング
```

### 3. 状態管理

- Zustand や Context API でマップ状態を管理
- マーカーデータは別途状態管理
- フィルタリング機能は専用フック化

## 推奨ライブラリバージョン

```json
{
  "@vis.gl/react-google-maps": "^1.5.2",
  "@googlemaps/markerclusterer": "^2.5.3",
  "@types/google.maps": "^3.58.1",
  "react": "^19.1.0"
}
```

## 参考リンク

- [vis.gl react-google-maps ドキュメント](https://visgl.github.io/react-google-maps/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Google Cloud Console](https://console.cloud.google.com/)
