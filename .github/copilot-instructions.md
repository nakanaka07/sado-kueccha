# GitHub Copilot Instructions

このファイルは GitHub Copilot がプロジェクト固有のコンテキストを理解し、より適切
なコード提案を行うための指示書です。

## 🎯 プロジェクト概要

**プロジェクト名**: sado-kueccha **技術スタック**: React 19 + TypeScript +
Vite + Vitest **パッケージマネージャー**: pnpm **用途**: 佐渡島の観光地マップア
プリケーション

## 🛠️ 技術仕様

### 主要技術スタック

- **フロントエンド**: React 19.1.0, TypeScript ~5.8.3
- **ビルドツール**: Vite ^6.3.5
- **テストフレームワーク**: Vitest ^3.1.4, @testing-library/react ^16.3.0
- **地図ライブラリ**: @vis.gl/react-google-maps ^1.5.2,
  @googlemaps/markerclusterer ^2.5.3
- **スタイリング**: CSS Modules + 純粋 CSS
- **リンター**: ESLint ^9.28.0 (Flat Config)
- **フォーマッター**: Prettier

### ディレクトリ構造

```
src/
├── app/                    # メインアプリケーション
├── components/            # UIコンポーネント
│   ├── filter/           # フィルタリング機能
│   ├── map/              # 地図関連コンポーネント
│   ├── shared/           # 共有コンポーネント
│   └── ui/               # UIプリミティブ
├── constants/            # 定数定義
├── hooks/                # カスタムフック
├── services/             # API・データ取得
├── styles/               # グローバル・共通スタイル
├── types/                # TypeScript型定義
├── utils/                # ユーティリティ関数
└── workers/              # Web Workers
```

## 📋 コーディング規約・ベストプラクティス

### TypeScript

- **Strict Mode**: 常に有効、型安全性を最優先
- **相対インポート**: プロジェクト内では相対パスを使用
- **パスエイリアス**: `@/*` を src/ のエイリアスとして使用
- **型定義**: 可能な限り明示的な型定義を記述
- **Interface vs Type**: データ構造には interface、計算型には type を使用

```typescript
// ✅ 推奨
interface POI {
  id: string;
  name: string;
  coordinates: [number, number];
  category: POICategory;
}

// ✅ 推奨
type FilterState = 'active' | 'inactive' | 'pending';
```

### React コンポーネント

- **関数コンポーネント**: 常に関数コンポーネントを使用
- **フック**: カスタムフックは `use` で開始
- **Props**: 明示的なインターフェース定義
- **メモ化**: パフォーマンスが重要な部分で React.memo, useMemo, useCallback を適
  切に使用
- **ファイル命名**: PascalCase でコンポーネント名と一致

```typescript
// ✅ 推奨
interface MapProps {
  markers: POI[];
  onMarkerClick: (poi: POI) => void;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  markers,
  onMarkerClick,
  className,
}) => {
  // 実装
};
```

### CSS・スタイリング

- **CSS Modules**: コンポーネント単位でのスタイル管理
- **BEM 記法**: CSS クラス名の命名規則
- **レスポンシブ**: モバイルファーストのアプローチ
- **パフォーマンス**: critical.css での重要スタイルの分離
- **グローバルスタイル**: styles/ ディレクトリでのパフォーマンス最適化・機能別
  CSS 管理

```css
/* ✅ 推奨: MapComponent.module.css */
.container {
  width: 100%;
  height: 100vh;
}

.marker {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.marker:hover {
  transform: scale(1.1);
}
```

### パフォーマンス最適化

- **仮想化**: 大量データの表示時は VirtualList コンポーネントを使用
- **遅延読み込み**: React.lazy + Suspense での動的インポート
- **バッチレンダリング**: useBatchRendering フックでの描画最適化
- **Web Workers**: 重い処理は workers/ ディレクトリ内で実装

### テスト

- **テストファイル**: `*.test.tsx` または `*.test.ts`
- **テスト配置**: src/ ディレクトリ内の各モジュール隣接
- **カバレッジ**: 重要なビジネスロジックは必ずテスト
- **MSW**: API モックには Mock Service Worker を使用

```typescript
// ✅ 推奨
describe("MapComponent", () => {
  it("should render markers correctly", () => {
    const markers = [
      /* テストデータ */
    ];
    render(<Map markers={markers} onMarkerClick={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(markers.length);
  });
});
```

## 🎯 GitHub Copilot 向け特別指示

### コード生成時の優先事項

1. **型安全性**: 必ず型定義を含むコードを生成
2. **パフォーマンス**: メモ化やバッチ処理を考慮
3. **アクセシビリティ**: ARIA 属性やセマンティクス HTML を使用
4. **エラーハンドリング**: 適切なエラー境界とフォールバック
5. **テスタビリティ**: テストしやすい構造での実装

### 避けるべきパターン

- ❌ `any` 型の使用
- ❌ インライン styles（CSS Modules を使用）
- ❌ クラスコンポーネント
- ❌ jQuery や DOM 直接操作
- ❌ console.log のコミット（開発時のみ使用）

### プロジェクト固有の考慮事項

#### 地図機能

- **Google Maps API**: @vis.gl/react-google-maps を使用
- **マーカークラスタリング**: @googlemaps/markerclusterer で実装
- **パフォーマンス**: 大量マーカーの場合は incrementalRendering を適用

#### データ管理

- **POI データ**: Google Sheets API 経由で取得
- **キャッシュ**: services/cache.ts での効率的なキャッシュ戦略
- **フィルタリング**: Web Workers での非同期処理

#### 営業時間処理

- **日本の祝日**: japanese-holidays ライブラリを使用
- **営業時間判定**: utils/businessHours.ts の関数を活用
- **タイムゾーン**: 日本時間（JST）で統一

### コメント・ドキュメント

```typescript
/**
 * POI（Point of Interest）の詳細情報を表示するコンポーネント
 *
 * @param poi - 表示するPOIオブジェクト
 * @param onClose - モーダルを閉じる際のコールバック
 * @param isVisible - モーダルの表示状態
 */
interface POIDetailProps {
  poi: POI;
  onClose: () => void;
  isVisible: boolean;
}
```

## 🔧 開発ワークフロー

### コミット前チェックリスト

- [ ] `pnpm type-check` で TypeScript エラーなし
- [ ] `pnpm lint` で ESLint エラーなし
- [ ] `pnpm test` でテスト通過
- [ ] 新規機能にはテストを追加
- [ ] パフォーマンス影響の確認

### パフォーマンス指標

- **バンドルサイズ**: 500KB 以下を維持
- **初期表示**: 3 秒以内
- **マーカー描画**: 1000 個まで滑らかに表示
- **フィルタリング**: 100ms 以内でレスポンス

### ブラウザ対応

- **現代ブラウザ**: Chrome, Firefox, Safari, Edge（最新版）
- **モバイル**: iOS Safari, Chrome Mobile
- **レスポンシブ**: 320px〜1920px の幅に対応

## 📚 参考リソース

- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

---

**この指示ファイルに従って、一貫性のある高品質なコードの生成をお願いします。**
