# 環境変数とセキュリティガイドライン

## 📁 ファイル構造と役割

### `.env`（本番環境設定）

- **⚠️ 注意**: このファイルには機密情報が含まれています
- 本番環境での実際のAPIキーとサービス設定が含まれる
- `.gitignore`により、Gitで追跡されない（セキュリティ保護）
- 本番デプロイ時は環境変数またはGitHub Secretsで管理推奨

### `.env.example`（テンプレートファイル）

- チーム開発でのテンプレートとして使用
- 実際のAPIキーは含まない（プレースホルダーのみ）
- 新しいメンバーがプロジェクトに参加する際のガイド
- Gitで追跡される（機密情報なし）

### `.env.local.example`（ローカル開発テンプレート）

- 開発環境専用の設定テンプレート
- `.env.local`にコピーして個別設定に使用
- 開発用のAPIキーやデバッグ設定を含む

### `.gitignore`

- 機密情報を含むファイルをGit追跡から除外
- `.env*`パターンで環境変数ファイルを包括的に除外

## 🔐 セキュリティベストプラクティス

### 1. APIキー管理

```bash
# ❌ 悪い例：本番APIキーをコードに含める
VITE_GOOGLE_MAPS_API_KEY=

# ✅ 良い例：GitHub Secretsやクラウド環境変数で管理
VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
```

### 2. 環境分離

- **開発環境**: `.env.local`（個人設定）
- **ステージング環境**: 環境変数で管理
- **本番環境**: GitHub SecretsまたはAzure Key Vault

### 3. 機密情報の扱い

- APIキーは絶対にコミットしない
- 開発用と本番用でAPIキーを分ける
- 定期的なAPIキーのローテーション

## 🚀 セットアップ手順

### 新規メンバー向け

1. `.env.example`を`.env.local`にコピー
2. 開発用APIキーを取得・設定
3. スプレッドシートIDを開発用に変更

### 本番デプロイ時

1. GitHub Secretsに本番APIキーを設定
2. 環境変数でのデプロイ設定確認
3. セキュリティ監査の実施

## 📊 環境変数カテゴリ

### アプリケーション設定

- `VITE_APP_NAME`: アプリケーション名
- `VITE_APP_VERSION`: バージョン情報
- `VITE_BASE_PATH`: ベースパス設定

### 外部サービス連携

- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API
- `VITE_GOOGLE_SHEETS_API_KEY`: Google Sheets API
- `VITE_EMAILJS_*`: EmailJS設定

### データソース

- `VITE_GOOGLE_SPREADSHEET_ID`: メインデータソース
- `VITE_SHEET_*`: 各シート設定

## 🔍 トラブルシューティング

### よくある問題

1. **APIキーエラー**: `.env.local`の設定確認
2. **CORS エラー**: API キーの権限設定確認
3. **データ取得失敗**: スプレッドシートIDとシートID確認

### デバッグ方法

```bash
# 環境変数の確認
echo $VITE_GOOGLE_MAPS_API_KEY

# 開発サーバーでの環境変数確認
npm run dev -- --mode development
```
