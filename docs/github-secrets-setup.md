# GitHub Secrets 設定ガイド

## 📋 必要なSecrets一覧

以下のSecretsをGitHubリポジトリに設定してください：

### Google Maps API関連

- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps JavaScript APIキー
- `VITE_GOOGLE_MAPS_MAP_ID` - Google Maps マップID

### Google Sheets API関連

- `VITE_GOOGLE_SHEETS_API_KEY` - Google Sheets APIキー
- `VITE_GOOGLE_SPREADSHEET_ID` - 対象のスプレッドシートID

### EmailJS関連

- `VITE_EMAILJS_SERVICE_ID` - EmailJSサービスID
- `VITE_EMAILJS_TEMPLATE_ID` - EmailJSテンプレートID
- `VITE_EMAILJS_PUBLIC_KEY` - EmailJSパブリックキー

## 🛠️ 設定手順

### 1. GitHubリポジトリのSettings画面へ

1. GitHubリポジトリページにアクセス
2. `Settings` タブをクリック
3. 左サイドバーの `Secrets and variables` → `Actions` をクリック

### 2. Secretsを追加

1. `New repository secret` ボタンをクリック
2. `Name` フィールドに上記のSecret名を入力
3. `Secret` フィールドに対応する値を入力
4. `Add secret` ボタンをクリック

### 3. 設定確認

全てのSecretsが正しく設定されると、GitHub Actionsの警告が解消されます。

## ⚠️ 注意事項

- Secretsは一度設定すると値を確認できません
- 間違えた場合は `Update` で修正してください
- 本番環境用の認証情報を使用してください

## 🚀 設定後の動作

Secrets設定後、GitHub
ActionsワークフローでViteビルド時に環境変数として利用されます：

```bash
# ビルド時に自動的に環境変数として設定される
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key
VITE_GOOGLE_MAPS_MAP_ID=your_actual_map_id
# ...etc
```
