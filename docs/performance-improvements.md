# パフォーマンス改善案

## 実装済みの改善

1. **ローディングスピナー + タイトル画像表示**

   - ページアクセス時に即座に美しいローディング画面を表示
   - `title_row1.png`を使用したブランディング

2. **データキャッシュ機能**

   - 5分間のメモリキャッシュでAPIコールを削減
   - 2回目以降のアクセスは即座に表示

3. **プリローディング機能**
   - 重要なアセットの事前読み込み
   - Google Maps APIの並行読み込み

## さらなる最適化案

### A. データ取得の最適化

```typescript
// 並行データ取得（現在は順次取得）
const promises = sheetConfigs.map((config) =>
  this.fetchSheetData(config.name, "A:Z"),
);
const results = await Promise.allSettled(promises);
```

### B. Service Worker によるオフラインキャッシュ

- 重要なデータの永続キャッシュ
- オフライン時の基本機能提供

### C. 仮想化（大量マーカー対応）

- 表示領域内のマーカーのみレンダリング
- メモリ使用量の削減

### D. Progressive Web App 対応

- アプリライクなユーザーエクスペリエンス
- インストール可能な Web アプリ

### E. Bundle 最適化

```typescript
// Dynamic import でコード分割
const { MarkerCluster } = await import("./MarkerCluster");
```

## 期待される効果

- 初回ローディング体験の向上（視覚的フィードバック）
- 2回目以降のアクセスの高速化（キャッシュ効果）
- モバイルデバイスでの快適な操作
- SEO とアクセシビリティの向上

## 測定指標

- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
