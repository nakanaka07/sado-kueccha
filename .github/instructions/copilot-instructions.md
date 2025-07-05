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
- **テストフレームワーク**: Vitest ^3.2.4, @testing-library/react ^16.3.0
- **地図ライブラリ**: @vis.gl/react-google-maps ^1.5.3,
  @googlemaps/markerclusterer ^2.5.3
- **スタイリング**: CSS Modules + 純粋 CSS
- **リンター**: ESLint ^9.29.0 (Flat Config)
- **フォーマッター**: Prettier ^3.4.2
- **パッケージマネージャー**: pnpm ^10.12.2

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
- **React 19 機能**: use フック、Server Components（準備段階）を適切に活用
- **フック**: カスタムフックは `use` で開始
- **Props**: 明示的なインターフェース定義
- **メモ化**: パフォーマンスが重要な部分で React.memo, useMemo, useCallback を適
  切に使用
- **ファイル命名**: PascalCase でコンポーネント名と一致
- **Error Boundaries**: エラー処理にはError Boundaryを活用

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
- **React 19 最適化**: Concurrent Features、Automatic Batching を活用
- **バッチレンダリング**: useBatchRendering フックでの描画最適化
- **Web Workers**: 重い処理は workers/ ディレクトリ内で実装
- **Bundle Splitting**: Vite の動的インポートでチャンク分割
- **Critical CSS**: 重要スタイルの優先読み込み

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
2. **問題解決優先**: エラーや不具合は「修正」、改善は「最適化」として区別
3. **パフォーマンス**: メモ化やバッチ処理を考慮
4. **アクセシビリティ**: ARIA 属性やセマンティクス HTML を使用
5. **エラーハンドリング**: 適切なエラー境界とフォールバック
6. **テスタビリティ**: テストしやすい構造での実装
7. **セキュリティ**: XSS対策、CSP準拠、安全なAPI呼び出し
8. **SEO**: 適切なメタタグ、構造化データの活用

### 避けるべきパターン

- ❌ `any` 型の使用
- ❌ インライン styles（CSS Modules を使用）
- ❌ クラスコンポーネント
- ❌ jQuery や DOM 直接操作
- ❌ console.log のコミット（開発時のみ使用）
- ❌ 問題解決を「最適化」と表現すること
- ❌ 改善要求を「修正」と表現すること

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

### コード改善指示の使い分け

#### 🔧 「適切に修正して」vs ⚡ 「最適化して」の違い

GitHub Copilotを使用する際、改善指示の意味を正確に理解して使い分けることが重要です。

| 指示                  | 目的                         | 使用場面                               | 具体例                                                         |
| --------------------- | ---------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| **🔧 適切に修正して** | **問題・エラーの解決**       | 何かが壊れている、正しく動作していない | TypeScript型エラー、実行時エラー、バグ修正、セキュリティ脆弱性 |
| **⚡ 最適化して**     | **パフォーマンス・品質向上** | 動作するが、もっと良くできる           | 実行速度改善、メモリ削減、バンドルサイズ縮小、可読性向上       |

#### 実践的な使い分け例

```typescript
// ❌ 間違った使い方：エラーが出ているのに「最適化」を求める
// 「このTypeScriptエラーが出ているコードを最適化して」

// ✅ 正しい使い方：エラーに対して「修正」を求める
// 「このTypeScriptエラーが出ているコードを適切に修正して」

// ❌ 間違った使い方：動作しているコードに「修正」を求める
// 「動作している地図表示コンポーネントを適切に修正して」

// ✅ 正しい使い方：動作しているコードに「最適化」を求める
// 「動作している地図表示コンポーネントを最適化して」
```

#### 「適切に修正して」を使うべき場面

- **TypeScript型エラー**: `Property 'xxx' does not exist on type 'yyy'`
- **実行時エラー**: `Cannot read property 'xxx' of undefined`
- **コンパイルエラー**: ビルドが失敗する
- **UIの表示不具合**: コンポーネントが正しく表示されない
- **API通信エラー**: データ取得が失敗する
- **セキュリティ問題**: XSS、CSRF等の脆弱性
- **アクセシビリティ問題**: スクリーンリーダー対応不備

#### 「最適化して」を使うべき場面

- **パフォーマンス改善**: 既に動作するが速度を上げたい
- **メモリ効率化**: 使用量を削減したい
- **バンドルサイズ削減**: 読み込み時間を短縮したい
- **コード可読性**: より理解しやすくしたい
- **保守性向上**: メンテナンスしやすくしたい
- **再利用性向上**: 他の場所でも使えるようにしたい

## 📖 改善指示の実践例

### 地図機能での指示例

```typescript
// 🔧 適切に修正が必要な場合
'地図が表示されないエラーを適切に修正して';
'マーカーのクリックイベントが動作しない問題を適切に修正して';
"TypeScriptエラー: Property 'coordinates' does not exist を適切に修正して";

// ⚡ 最適化が適切な場合
'地図の描画パフォーマンスを最適化して';
'マーカーのクラスタリング機能を最適化して';
'地図コンポーネントのメモリ使用量を最適化して';
```

### フィルタリング機能での指示例

```typescript
// 🔧 適切に修正が必要な場合
'フィルターが動作しない問題を適切に修正して';
'検索結果が正しく表示されないバグを適切に修正して';
'フィルター条件のリセットが動作しないエラーを適切に修正して';

// ⚡ 最適化が適切な場合
'フィルタリング処理の速度を最適化して';
'フィルター UI の使いやすさを最適化して';
'フィルター結果の表示方法を最適化して';
```

### 共通パターンでの指示例

```typescript
// 🔧 適切に修正が必要な場合
'404エラーが発生する問題を適切に修正して';
'レスポンシブデザインが崩れる問題を適切に修正して';
'アクセシビリティの問題を適切に修正して';

// ⚡ 最適化が適切な場合
'コンポーネントの再利用性を最適化して';
'バンドルサイズを最適化して';
'ユーザーエクスペリエンスを最適化して';
```

## 🔧 開発ワークフロー

### コミット前チェックリスト

- [ ] `pnpm type-check` で TypeScript エラーなし
- [ ] `pnpm lint` で ESLint エラーなし
- [ ] `pnpm test:run` でテスト通過
- [ ] `pnpm format:check` でフォーマット確認
- [ ] 新規機能にはテストを追加
- [ ] パフォーマンス影響の確認
- [ ] アクセシビリティの確認

### パフォーマンス指標

- **バンドルサイズ**: 500KB 以下を維持
- **初期表示**: 3 秒以内（Core Web Vitals 準拠）
- **マーカー描画**: 1000 個まで滑らかに表示
- **フィルタリング**: 100ms 以内でレスポンス
- **LCP**: 2.5秒以内、**FID**: 100ms以内、**CLS**: 0.1以下

### ブラウザ対応

- **現代ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **モバイル**: iOS Safari 14+, Chrome Mobile 90+
- **レスポンシブ**: 320px〜1920px の幅に対応
- **PWA**: Progressive Web App として動作

## 📚 参考リソース

- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Documentation](https://vitest.dev/)
- [Google Maps Platform](https://developers.google.com/maps/documentation)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Core Web Vitals](https://web.dev/vitals/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**この指示ファイルに従って、一貫性のある高品質なコードの生成をお願いします。**
