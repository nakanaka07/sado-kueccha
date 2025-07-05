# Components Styles Directory

このディレクトリは、**コンポーネント固有のCSS Modules** を配置するためのディレクトリです。

## 📋 用途

- 特定のコンポーネントに固有のスタイル定義
- 共通スタイルでは対応できない複雑なレイアウト
- サードパーティライブラリのスタイルオーバーライド

## 🗂️ ファイル構成

```text
components/
├── Map.module.css                  ✅ Map コンポーネント専用スタイル
├── Map.module.css.d.ts            ✅ Map 型定義
├── FilterPanel.module.css          ✅ FilterPanel コンポーネント専用スタイル
├── FilterPanel.module.css.d.ts     ✅ FilterPanel 型定義
├── VirtualList.module.css          🚀 予定: VirtualList 専用スタイル
└── ThirdParty/                     📁 サードパーティ用スタイル
    ├── GoogleMaps.module.css       🚀 予定
    └── ReactVirtualized.module.css 🚀 予定
```

## ✅ 使用ガイドライン

### 基本的な使用パターン

```typescript
// Map コンポーネントでの使用例
import MapStyles from '../../styles/components/Map.module.css';
import { combineModuleClasses } from '../../styles';

const MapComponent: React.FC = () => {
  return (
    <div className={combineModuleClasses(
      MapStyles.mapContainer,
      isLoading && MapStyles.loading
    )}>
      <div className={MapStyles.markerContainer}>
        {/* マーカー */}
      </div>
    </div>
  );
};
```

```typescript
// FilterPanel コンポーネントでの使用例
import FilterStyles from '../../styles/components/FilterPanel.module.css';
import { combineModuleClasses, conditionalModuleClass } from '../../styles';

const FilterPanel: React.FC = () => {
  return (
    <div className={FilterStyles.filterPanel}>
      <div className={FilterStyles.filterPanelContent}>
        <input
          className={FilterStyles.searchInput}
          placeholder="検索..."
        />
        <div className={FilterStyles.categoryFilter}>
          <h3 className={FilterStyles.categoryTitle}>カテゴリ</h3>
          <div className={FilterStyles.categoryOptions}>
            {/* フィルターオプション */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 推奨される使用パターン

```typescript
// 複数スタイルの組み合わせ
import MapStyles from '../../styles/components/Map.module.css';
import { PerformanceStyles, combineModuleClasses } from '../../styles';

// 共通最適化 + コンポーネント固有スタイル
<div className={combineModuleClasses(
  PerformanceStyles.gpuAccelerated,
  MapStyles.mapContainer,
  isFullscreen && MapStyles.fullscreen
)}>
```

### 避けるべきパターン

- ❌ 複数コンポーネントで共有されるスタイル（`PerformanceStyles` を使用）
- ❌ ユーティリティクラスの重複定義
- ❌ パフォーマンス最適化の基本設定の重複

## 🚀 利用可能なコンポーネントスタイル

### Map.module.css

| クラス名          | 用途             | 最適化                      |
| ----------------- | ---------------- | --------------------------- |
| `mapContainer`    | 地図全体コンテナ | GPU加速 + タッチ最適化      |
| `markerContainer` | マーカー表示     | ホバー効果 + クラスタリング |
| `infoWindow`      | 情報ウィンドウ   | スムーズ表示・非表示        |
| `mapControls`     | 地図コントロール | タッチ操作最適化            |

### FilterPanel.module.css

| クラス名           | 用途                 | 最適化                   |
| ------------------ | -------------------- | ------------------------ |
| `filterPanel`      | フィルターパネル全体 | GPU加速 + レイアウト分離 |
| `filterOptionItem` | フィルター項目       | インタラクション最適化   |
| `searchInput`      | 検索入力フィールド   | フォーカス最適化         |
| `categoryFilter`   | カテゴリセクション   | レイアウト最適化         |

## 🎯 今後の展開

### 次のステップ（実装済み ✅）

- [x] **Map コンポーネント専用スタイル分離**
- [x] **FilterPanel コンポーネント専用スタイル分離**
- [x] **TypeScript型定義の完全対応**

### 今後の予定（🚀）

1. **VirtualList 専用スタイル分離**
2. **サードパーティライブラリ用スタイル**
3. **テーマシステムとの統合**
4. **デザインシステム準拠のコンポーネントスタイル**

---

**更新日**: 2025-07-04 | **バージョン**: 2.0.0
