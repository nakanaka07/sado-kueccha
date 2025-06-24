# sado-kueccha 🗾

佐渡島の観光地マップアプリケーション

## 🚀 技術スタック

- **Frontend**: React 19 + TypeScript + Vite
- **Maps**: Google Maps API (@vis.gl/react-google-maps)
- **Testing**: Vitest + Testing Library
- **Styling**: CSS Modules
- **Package Manager**: pnpm

## 📋 開発環境セットアップ

### 前提条件

- Node.js 20.0.0 以上
- pnpm 10.0.0 以上

### 🔧 環境変数設定

1. **環境変数ファイルの準備**

   ```bash
   # .env.local ファイルを作成（実際のAPIキー用）
   cp .env.example .env.local
   ```

2. **API キーの設定**
   - Google Cloud Console で Google Maps API、Google Sheets API キーを取得
   - EmailJS でアカウント作成・設定情報を取得
   - `.env.local` に実際の値を設定

3. **セキュリティ注意事項**
   - 🚨 `.env.local` は絶対に Git にコミットしないでください
   - 🔒 API キーは定期的にローテーションしてください
   - 📋 詳細は `docs/SECURITY.md` を参照してください

### インストール・起動

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test
```

## 🤖 AI 開発支援

このプロジェクトは AI アシスタント（GitHub Copilot 等）による開発支援が最適化さ
れています。

### GitHub Copilot 設定

プロジェクト固有の指示ファイル（`.github/copilot-instructions.md`）により、以下
が自動で適用されます：

- ✅ TypeScript 型安全性の確保
- ✅ React 19 最新パターンの適用
- ✅ パフォーマンス最適化（メモ化、Web Workers）
- ✅ アクセシビリティ対応
- ✅ Google Maps API の適切な使用

### AI プロンプト集

開発効率向上のため、`.vscode/ai-prompts.md` に以下のプロンプトを用意：

- **基本改善指示 (1-10)**: クリーンアップ、最適化、リファクタリング等
- **特化指示 (11-14)**: 冗長性排除、整合性確保、軽量化等
- **組み合わせ指示 (15-17)**: パフォーマンス、品質、モダン化重視
- **プロジェクト診断 (18-20)**: 肥大化チェック、削減・簡略化
- **VS Code 最適化 (22)**: 開発環境の最適化

#### 使用例

```typescript
// Copilot にこのようなコメントを書くと、適切なコードが生成されます：

// POI データを地図上にマーカークラスターで表示し、
// クリックで詳細モーダルを開く React コンポーネント
// 1000個以上のマーカーでもパフォーマンスを維持
```

## 🛠️ 開発ガイドライン

### コーディング規約

- **TypeScript**: Strict mode、明示的型定義
- **React**: 関数コンポーネント、カスタムフック（`use` prefix）
- **CSS**: CSS Modules、BEM 記法、モバイルファースト
- **テスト**: 重要なビジネスロジックは必ずテスト

### パフォーマンス指標

- バンドルサイズ: 500KB 以下
- 初期表示: 3 秒以内
- マーカー描画: 1000 個まで滑らかに表示

### ブラウザ対応

- Chrome, Firefox, Safari, Edge（最新版）
- iOS Safari, Chrome Mobile
- レスポンシブ: 320px〜1920px

## 📁 プロジェクト構造

```text
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
├── types/                # TypeScript型定義
├── utils/                # ユーティリティ関数
└── workers/              # Web Workers
```

## 🧪 テスト

```bash
# テスト実行（ウォッチモード）
pnpm test

# テスト実行（1回のみ）
pnpm test:run

# カバレッジ付きテスト
pnpm test:coverage
```

## 🔧 コマンド一覧

| コマンド          | 説明                                  |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | 開発サーバー起動                      |
| `pnpm build`      | プロダクションビルド                  |
| `pnpm preview`    | ビルド結果のプレビュー                |
| `pnpm test`       | テスト実行（ウォッチ）                |
| `pnpm lint`       | ESLint チェック                       |
| `pnpm lint:fix`   | ESLint 自動修正                       |
| `pnpm type-check` | TypeScript 型チェック                 |
| `pnpm ci`         | CI 用（型チェック + リント + テスト） |

## 📚 参考資料

- [React 19 Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

---

**開発時は AI アシスタントとプロンプト集を活用して、効率的で高品質なコード開発を
行ってください。**
