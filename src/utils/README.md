# Utils ディレクトリ ガイド

`src/utils` ディレクトリには、アプリケーション全体で使用される汎用的なユーティリティ関数群が格納されています。

## 📋 ファイル構成

### 🎨 アセット管理

- **`assets.ts`**: 画像・アイコンなどのアセットパス解決
- **テスト**: `assets.test.ts`

### ⏰ 営業時間管理

- **`businessHours.ts`**: 営業時間の解析・判定
- **テスト**: `businessHours.test.ts`

### 🌍 地理計算

- **`geo.ts`**: 地理的な距離計算、クラスタリング
- **テスト**: `geo.test.ts`

### 🛡️ 型安全性

- **`typeGuards.ts`**: 型ガード関数群
- **テスト**: `typeGuards.test.ts`

### 🔧 システム関連

- **`env.ts`**: 環境変数管理
- **`logger.ts`**: ログシステム
- **`runtime-validation.ts`**: 実行時検証

### 🎯 DOM・UI操作

- **`domHelpers.ts`**: DOM操作ヘルパー
- **`social.ts`**: SNS関連ユーティリティ

### ⚡ パフォーマンス

- **`progressiveLoader.ts`**: プログレッシブローディング
- **`renderingPerformance.ts`**: レンダリング性能監視

### ⚙️ 設定管理

- **`sheetsConfig.ts`**: Google Sheets設定

## 🚀 使用例

### アセット管理

```typescript
import { resolveAssetPath, ASSETS } from '@/utils/assets';

// 個別アセットの解決
const iconPath = resolveAssetPath('ano_icon01.png');
// → '/assets/ano_icon01.png'

// 定義済みアセットの使用
const currentLocationIcon = ASSETS.ICONS.MARKERS.CURRENT_LOCATION;
const titleImage = ASSETS.TITLE.ROW1;

// 重要アセットのプリロード
import { getCriticalAssets } from '@/utils/assets';
const criticalPaths = getCriticalAssets();
```

### 営業時間判定

```typescript
import {
  parseTimeString,
  isCurrentlyOpen,
  STATUS_CONFIG,
} from '@/utils/businessHours';

// 営業時間文字列の解析
const hours = parseTimeString('09:00-18:00');
// → { type: 'normal', start: 900, end: 1800 }

// 現在の営業状態チェック
const status = isCurrentlyOpen(hours);
// → 'open' | 'closed' | 'time-outside' etc.

// ステータス表示用の設定取得
const config = STATUS_CONFIG[status];
console.log(config.text); // → '営業中'
console.log(config.icon); // → '🟢'
```

### 地理計算

```typescript
import { GeoUtils } from '@/utils/geo';

// 2地点間の距離計算（メートル）
const distance = GeoUtils.getDistanceMeters(
  38.0186,
  138.3671, // 佐渡島中心
  38.0808,
  138.4421 // 両津港
);
// → 約12000（メートル）

// クラスタリング距離の計算
const clusterDistance = GeoUtils.getClusteringDistance(15);
// ズームレベル15での適切なクラスタリング距離

// 高速な距離比較（平方根計算なし）
const distanceSquared = GeoUtils.getDistanceSquared(lat1, lng1, lat2, lng2);
```

### 型ガード

```typescript
import { isValidPosition, isValidEmail, isValidUrl } from '@/utils/typeGuards';

// 座標の検証
if (isValidPosition(userInput)) {
  // userInput は LatLngLiteral 型として使用可能
  const { lat, lng } = userInput;
}

// メールアドレスの検証
if (isValidEmail(input)) {
  // input は有効なメールアドレス文字列
  sendEmail(input);
}

// URLの検証（HTTP/HTTPSのみ許可）
if (isValidUrl(link)) {
  window.open(link);
}
```

### 環境変数管理

```typescript
import { getAppConfig, isDevelopment, isProduction } from '@/utils/env';

// 型安全な設定取得
const config = getAppConfig();
const mapsApiKey = config.maps.apiKey;
const basePath = config.app.basePath;

// 環境判定
if (isDevelopment()) {
  console.log('開発環境での追加ログ');
}

if (isProduction()) {
  // 本番環境でのみ実行される処理
}
```

### ログシステム

```typescript
import { logger } from '@/utils/logger';

// 基本的なログ出力
logger.info('データを正常に読み込みました', { count: 150 });
logger.warn('APIレスポンスが遅延しています', { duration: 5000 });
logger.error('データ読み込みエラー', new Error('Network timeout'));

// パフォーマンス測定
const startTime = performance.now();
// ... 何らかの処理 ...
logger.performance('データ処理完了', startTime, 'DataLoader');

// ログレベルの変更
logger.setLevel('warn'); // warn以上のみ出力
```

### DOM操作ヘルパー

```typescript
import {
  safeQuerySelector,
  isHTMLButtonElement,
  setupAccessibilityAttributes,
} from '@/utils/domHelpers';

// 型安全なDOM要素取得
const button = safeQuerySelector(document, '#submit-btn', isHTMLButtonElement);

if (button) {
  // button は HTMLButtonElement として使用可能
  button.disabled = true;
}

// アクセシビリティ属性の設定
setupAccessibilityAttributes(element, {
  role: 'button',
  'aria-label': '送信ボタン',
  'aria-pressed': 'false',
});
```

## 🧪 テスト実行

```bash
# 全てのutilsテストを実行
pnpm test:run src/utils

# 特定のファイルのテストのみ
pnpm test:run src/utils/geo.test.ts

# カバレッジ付きテスト
pnpm test:coverage src/utils
```

## 📊 パフォーマンス考慮事項

### キャッシュ戦略

- アセット解決結果のキャッシュ（最大100エントリ）
- 地理計算結果のメモ化
- ログバッファの適切なサイズ制限

### 最適化ポイント

- 地理計算では平方根計算を避ける `getDistanceSquared` を優先使用
- 大量のマーカー表示では `getClusteringDistance` でクラスタリング
- 本番環境では不要なログ出力を自動制御

## 🔧 開発時の注意事項

### 新しいユーティリティ追加時

1. 適切なファイルに配置（単一責任原則）
2. 型安全性を重視した実装
3. テストファイルの作成（\*.test.ts）
4. JSDocコメントの追加
5. `index.ts` での適切なエクスポート

### パフォーマンス重視の関数

- エラーハンドリングを軽量化
- 不要な依存関係を避ける
- メモ化・キャッシュの適切な実装

### セキュリティ考慮

- XSS攻撃の防止（入力値サニタイゼーション）
- パストラバーサル攻撃の防止
- HTTPS URLのみ許可

## 🛠️ トラブルシューティング

### よくある問題

#### アセットが読み込まれない

```typescript
// ❌ 問題のあるコード
const iconPath = '/assets/icon.png'; // ハードコード

// ✅ 正しいコード
const iconPath = resolveAssetPath('icon.png');
```

#### 営業時間判定が正しく動作しない

```typescript
// 時間文字列の形式を確認
console.log(parseTimeString('営業時間文字列'));
// タイムゾーンを考慮（JST）
```

#### 地理計算の精度問題

```typescript
// 高精度が必要な場合は getDistanceMeters を使用
// 比較のみの場合は getDistanceSquared で高速化
```

### デバッグ用ツール

```typescript
// アセットキャッシュの状態確認
import { getAssetCacheStats, clearAssetCache } from '@/utils/assets';
console.log(getAssetCacheStats());

// ログの統計情報
logger.debug('デバッグ情報', { timestamp: Date.now() });
```

## 📚 関連ドキュメント

- [TypeScript ベストプラクティス](../docs/typescript-best-practices.md)
- [テスト戦略](../docs/testing-strategy.md)
- [パフォーマンス最適化](../docs/performance-optimization.md)
- [セキュリティガイドライン](../docs/security-guidelines.md)
