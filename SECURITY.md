# 🔒 セキュリティガイドライン

## 環境変数管理のベストプラクティス

### 📋 概要

このドキュメントは、佐渡で食えっちゃアプリケーションにおける環境変数のセキュアな管理方法について説明します。

### 🚨 重要なセキュリティ事項

#### 1. APIキーの保護

- ✅ **実行すべき**: GitHub Secrets、環境変数での管理
- ❌ **禁止事項**: ソースコードへの直接記述
- ❌ **禁止事項**: 公開リポジトリへのAPIキー含有ファイルのコミット

#### 2. 環境別設定

- 🔧 **開発環境**: `.env.local` ファイルを使用（Gitignore対象）
- 🚀 **本番環境**: CI/CDツールのシークレット管理機能を使用
- 🧪 **テスト環境**: モック値または専用のテスト用APIキーを使用

### 🛡️ 実装済みセキュリティ機能

#### 1. 型安全な環境変数管理

```typescript
// 実行時バリデーション
export const validateAppConfig = (): void => {
  // 必須APIキーの検証
  // 本番環境でのプレースホルダー値の検出
};
```

#### 2. デバッグ情報の制御

```typescript
// デバッグログは開発環境でのみ有効
export const debugLog = (message: string, ...args: unknown[]): void => {
  if (
    isDevelopment() ||
    getEnvBoolean(import.meta.env.VITE_ENABLE_CONSOLE_LOGS, false)
  ) {
    // ログ出力
  }
};
```

### 📁 ファイル構成

```text
├── .env.example          # 設定例（公開OK）
├── .env                  # 実際の設定（Gitignore）
├── .env.local           # ローカル環境専用（Gitignore）
└── .gitignore           # 機密ファイルの除外設定
```

### 🔧 設定手順

#### 1. 初期設定

```bash
# 設定例ファイルをコピー
cp .env.example .env

# 実際の値を設定
# エディタで .env ファイルを編集
```

#### 2. Google Cloud Console でのAPIキー設定

1. Google Cloud Console にアクセス
2. プロジェクトを選択または作成
3. APIs & Services → Credentials でAPIキーを作成
4. 適切な制限を設定（HTTP リファラー、APIスコープ）

#### 3. GitHub での機密情報管理

```bash
# GitHub Secrets での設定例
VITE_GOOGLE_MAPS_API_KEY: "実際のAPIキー"
VITE_GOOGLE_SHEETS_API_KEY: "実際のAPIキー"
VITE_EMAILJS_SERVICE_ID: "実際のサービスID"
```

### ⚠️ 注意事項

#### Viteの制限事項

- `VITE_` プレフィックスが付いた環境変数のみクライアントサイドで利用可能
- これらの値はビルド時にバンドルに埋め込まれるため、機密度の高い情報は避ける
- サーバーサイド専用の機密情報は別途管理が必要

#### API制限の推奨事項

1. **Google Maps API**:

   - HTTP リファラーによる制限
   - 必要最小限のAPIスコープのみ有効化

2. **Google Sheets API**:

   - 読み取り専用アクセスの設定
   - 特定のスプレッドシートへのアクセス制限

3. **EmailJS**:
   - テンプレートの事前承認
   - 送信制限の設定

### 🔍 セキュリティチェックリスト

- [ ] APIキーがソースコードに含まれていない
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] 本番環境でプレースホルダー値が使用されていない
- [ ] API制限が適切に設定されている
- [ ] デバッグログが本番環境で無効化されている
- [ ] 環境変数の型チェックが実装されている

### 🚀 CI/CD での環境変数設定

#### GitHub Actions の例

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Build
        env:
          VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
          VITE_GOOGLE_SHEETS_API_KEY: ${{ secrets.VITE_GOOGLE_SHEETS_API_KEY }}
        run: |
          npm ci
          npm run build
```

### 📞 緊急時の対応

#### APIキー漏洩が疑われる場合

1. 🚨 **即座にAPIキーを無効化**
2. 🔄 **新しいAPIキーを生成**
3. 🔍 **影響範囲の調査**
4. 📝 **インシデント記録の作成**
5. 🔒 **セキュリティ強化の実施**

### 📚 参考リンク

- [GitHub Secrets の使用方法](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Vite 環境変数ガイド](https://vitejs.dev/guide/env-and-mode.html)
- [Google Cloud API キー制限](https://cloud.google.com/docs/authentication/api-keys)
- [12-Factor App 設定原則](https://12factor.net/config)
