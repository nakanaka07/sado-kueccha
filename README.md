# Kueccha

Google Maps APIを使用したReact + TypeScriptアプリケーション

## 🚀 技術スタック

- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **ビルドツール**: Vite 6.3.5
- **スタイリング**: CSS Modules
- **マップ**: Google Maps API + @vis.gl/react-google-maps
- **テスト**: Vitest + Testing Library
- **リンター**: ESLint + Prettier
- **パッケージマネージャー**: pnpm

## 📋 必要な環境

- Node.js 18.0.0以上
- pnpm 8.0.0以上
- Google Maps API キー

## 🛠️ セットアップ

1. **リポジトリのクローン**

   ```bash
   git clone <repository-url>
   cd kueccha
   ```

2. **依存関係のインストール**

   ```bash
   pnpm install
   ```

3. **環境変数の設定**

   ```bash
   # .env.exampleをコピーして.envファイルを作成
   copy .env.example .env

   # .envファイルでGoogle Maps API キーを設定
   VITE_GOOGLE_API_KEY=your_actual_api_key_here
   ```

4. **開発サーバーの起動**
   ```bash
   pnpm dev
   ```

## 📝 利用可能なスクリプト

- `pnpm dev` - 開発サーバーを起動
- `pnpm build` - 本番用ビルドを作成
- `pnpm preview` - ビルドしたアプリをプレビュー
- `pnpm lint` - ESLintでコードチェック
- `pnpm lint:fix` - ESLintで自動修正
- `pnpm format` - Prettierでコードフォーマット
- `pnpm format:check` - フォーマットチェック
- `pnpm test` - テストを実行
- `pnpm test:watch` - テストをウォッチモードで実行
- `pnpm test:ui` - Vitest UIでテスト実行
- `pnpm test:coverage` - カバレッジ付きでテスト実行
- `pnpm type-check` - TypeScriptの型チェック
- `pnpm pre-commit` - コミット前チェック（型、Lint、フォーマット、テスト）

## 🏗️ プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── Map.tsx         # メインマップコンポーネント
│   ├── AdvancedMarker.tsx
│   └── MarkerCluster.tsx
├── services/           # API通信ロジック
│   └── sheets.ts       # Google Sheets連携
├── types/              # TypeScript型定義
├── utils/              # ユーティリティ関数
└── assets/            # 静的アセット
```

## 🧪 テスト

このプロジェクトではVitestとTesting Libraryを使用してテストを行います。

- テストファイルは `*.test.tsx` または `*.spec.tsx` として作成
- `src/test/setup.ts` にテスト用のセットアップを定義
- カバレッジ目標: 80%以上

## 📱 ブラウザサポート

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 🔧 開発ツール

### VSCode拡張機能

推奨拡張機能は `.vscode/extensions.json` に定義されています：

- TypeScript and JavaScript Language Features
- Prettier - Code formatter
- ESLint
- Vitest Test Explorer

### コード品質

- **ESLint**: コードの品質とスタイルをチェック
- **Prettier**: コードフォーマット
- **TypeScript**: 静的型チェック
- **strict モード**: 厳格な型チェックを有効

## 🚀 デプロイ

```bash
# 本番用ビルド
pnpm build

# ビルド結果の確認
pnpm preview
```

## 🤝 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。
