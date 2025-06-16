import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
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
      // Enable type-checked lint rules
      ...tseslint.configs.recommendedTypeChecked,
      // Add stricter rules for better code quality
      ...tseslint.configs.strictTypeChecked,
      // Stylistic rules can be uncommented when team consensus is reached
      // ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      globals: globals.browser,
      parserOptions: {
        // TypeScript project configuration
        project: ["./tsconfig.node.json", "./tsconfig.app.json", "./tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react: react,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: {
        version: "detect", // Auto-detect React version
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Apply standard React rules
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      // Apply accessibility rules
      ...jsxA11y.configs.recommended.rules,
      // Disable PropTypes as they're unnecessary in TypeScript projects
      "react/prop-types": "off",
      // Fix for aria-expanded with boolean expressions - allow string values from boolean expressions
      "jsx-a11y/aria-proptypes": "off",
    },
  },
);
