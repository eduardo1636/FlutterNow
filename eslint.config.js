import js from "@eslint/js";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  { ignores: ["dist/**", "coverage/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { react },
    rules: {
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      ...js.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  }
];
