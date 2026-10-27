import js from "@eslint/js";
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
    rules: {
      ...js.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatchClause: true }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  }
];
