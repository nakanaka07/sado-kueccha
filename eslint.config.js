import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      // 型チェック対応のlintルールに置き換え初期
      ...tseslint.configs.recommendedTypeChecked,
      // より厳格なルールを追加（オプション）安定期
      ...tseslint.configs.strictTypeChecked,
      // スタイリスティックなルールを追加（オプション）チーム合意がある場合
      // ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        // TypeScriptプロジェクト設定を追加
        project: ["./tsconfig.node.json", "./tsconfig.app.json", "./tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react: react,
    },
    settings: {
      react: {
        version: "detect", // Reactのバージョンを自動検出
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // 標準的なReactのルールを適用
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      // TypeScriptプロジェクトでは不要なPropTypesを無効化
      "react/prop-types": "off",
    },
  },
);
