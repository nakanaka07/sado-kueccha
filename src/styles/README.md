# Styles System Documentation

`src/styles` ディレクトリの統合スタイル管理システムのドキュメントです。

## 📊 概要

**CSS Modules + TypeScript** による型安全で現代的なスタイル管理システムを提供します。

## 🗂️ ディレクトリ構造

```text
src/styles/
├── index.ts                          # エントリーポイント（統合エクスポート）
├── constants.ts                      # 型安全な定数とヘルパー関数
├── Performance.module.css            # CSS Modules（推奨）⭐
├── Performance.module.css.d.ts       # TypeScript型定義
├── base/
│   └── performance.css              # 基本パフォーマンス設定
├── components/                       # コンポーネント専用スタイル ✅
│   ├── Map.module.css               # Map専用スタイル
│   ├── FilterPanel.module.css       # FilterPanel専用スタイル
│   └── README.md                    # 使用ガイドライン
└── utilities/
    └── performance.css              # ユーティリティクラス
```

## 🚀 基本的な使用方法

### 1. CSS Modules の使用（推奨）

```typescript
import { PerformanceStyles, combineModuleClasses } from '../../styles';

// 基本的な使用
<div className={PerformanceStyles.virtualList}>

// 複数クラスの結合
<div className={combineModuleClasses(
  PerformanceStyles.virtualList,
  PerformanceStyles.gpuAccelerated
)}>

// 条件付きクラス
<div className={combineModuleClasses(
  PerformanceStyles.mapContainer,
  isLoading && PerformanceStyles.willChangeOpacity
)}>
```

### 2. コンポーネント専用スタイルの使用 ✨

```typescript
import MapStyles from '../../styles/components/Map.module.css';
import FilterStyles from '../../styles/components/FilterPanel.module.css';
import { PerformanceStyles, combineModuleClasses } from '../../styles';

// 共通最適化 + コンポーネント固有スタイル
<div className={combineModuleClasses(
  PerformanceStyles.gpuAccelerated,
  MapStyles.mapContainer
)}>
```

### 3. ヘルパー関数の活用

```typescript
import { combineModuleClasses, conditionalModuleClass } from '../../styles';

// 条件付きクラス適用
const className = combineModuleClasses(
  PerformanceStyles.virtualList,
  conditionalModuleClass(isActive, PerformanceStyles.active),
  props.className
);
```

## 🎯 利用可能なスタイルクラス

### コンポーネント固有スタイル

| クラス名                   | 用途                 | パフォーマンス効果        |
| -------------------------- | -------------------- | ------------------------- |
| `virtualList`              | 仮想化リスト         | GPU加速 + CSS Containment |
| `virtualListItem`          | リストアイテム       | Layout/Style/Paint 分離   |
| `filterOptionsVirtualized` | フィルターオプション | 仮想化最適化              |
| `filterOptionItem`         | フィルターアイテム   | クリック反応最適化        |
| `mapContainer`             | 地図コンテナ         | タッチスクロール最適化    |

### ユーティリティクラス

| クラス名              | 用途           | CSS プロパティ                   |
| --------------------- | -------------- | -------------------------------- |
| `gpuAccelerated`      | GPU加速        | `transform: translateZ(0)`       |
| `willChangeTransform` | 変形予告       | `will-change: transform`         |
| `willChangeOpacity`   | 透明度変化予告 | `will-change: opacity`           |
| `containStrict`       | 完全分離       | `contain: strict`                |
| `smoothTransition`    | スムース遷移   | `transition: all 150ms ease-out` |
| `fastTransition`      | 高速遷移       | `transition: all 100ms ease-out` |

## 🛠️ パフォーマンス最適化の指針

### 1. GPU加速の活用

```typescript
// GPU層を作成して描画性能を向上
<div className={PerformanceStyles.gpuAccelerated}>
```

### 2. CSS Containment の活用

```typescript
// レイアウト計算を分離して全体性能を向上
<div className={PerformanceStyles.containStrict}>
```

### 3. will-change の適切な使用

```typescript
// アニメーション前に最適化ヒントを提供
<div className={PerformanceStyles.willChangeTransform}>
```

## 🔧 トラブルシューティング

### TypeScript エラーが出る場合

```bash
# 型定義ファイルを再生成
npm run type-check
```

### CSS Modules が認識されない場合

```typescript
// vite-env.d.ts に以下が含まれているか確認
declare module '*.module.css';
```

### パフォーマンス問題の調査

```typescript
// デバッグモードでパフォーマンス監視
<div className={PerformanceStyles.performanceDebug}>
  <div className={PerformanceStyles.virtualList}>
    {/* 緑のアウトラインで視覚的にデバッグ */}
  </div>
</div>
```

## 📋 ベストプラクティス

### ✅ 推奨パターン

```typescript
// 1. インポートは統合エントリーポイントから
import { PerformanceStyles, combineModuleClasses } from '../../styles';

// 2. 型安全なクラス名結合
const className = combineModuleClasses(
  PerformanceStyles.virtualList,
  props.className
);

// 3. 条件付きクラスは明示的に
const loadingClass = isLoading
  ? PerformanceStyles.willChangeOpacity
  : undefined;
```

### ❌ 避けるべきパターン

```typescript
// ❌ 文字列直接指定（型安全性なし）
className="virtual-list"

// ❌ 複雑な条件を一行に詰め込み
className={`${PerformanceStyles.virtualList} ${isActive ? PerformanceStyles.active : ''} ${isLoading ? PerformanceStyles.loading : ''}`}

// ❌ レガシー関数の使用
combinePerformanceClasses() // 廃止予定
```

## 🔮 今後の展開

### 短期計画（1-2週間）

- [ ] レガシーCSS ファイルの完全削除
- [ ] コンポーネント専用スタイルの分離
- [ ] パフォーマンス指標の測定とベンチマーク

### 中期計画（1ヶ月）

- [ ] テーマシステムの導入
- [ ] デザイントークンとの統合
- [ ] 自動最適化ツールの導入

### 長期計画（2-3ヶ月）

- [ ] CSS-in-JS との統合検討
- [ ] デザインシステムとの完全統合
- [ ] ビルド時最適化の強化

---

**最終更新**: 2025-06-30
**バージョン**: 2.1.0
