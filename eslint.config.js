import { defineConfig } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"

export default defineConfig([
  {
    ignores: ["dist/**", "app/assets/javascript/**", "node_modules/**", "pkg/**", "test/**", "lib/**", "bin/**", "config/**", "docs/**", "vendor/**", ".claude/worktrees/**"]
  },
  {
    files: ["src/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.browser
    },
    rules: {
      "array-bracket-spacing": ["error", "always"],
      "block-spacing": ["error", "always"],
      "camelcase": ["error"],
      "comma-spacing": ["error"],
      "curly": ["error", "multi-line"],
      "dot-notation": ["error"],
      "eol-last": ["error"],
      "func-style": ["error", "declaration"],
      "getter-return": ["error"],
      "keyword-spacing": ["error"],
      "no-empty": "off",
      "no-multi-spaces": ["error", { "exceptions": { "VariableDeclarator": true } }],
      "no-multiple-empty-lines": ["error", { "max": 2 }],
      "no-restricted-globals": ["error", "event"],
      "no-trailing-spaces": ["error"],
      "no-unused-vars": ["error", { "vars": "all", "args": "none", "caughtErrors": "none" }],
      "no-var": ["error"],
      "object-curly-spacing": ["error", "always"],
      "prefer-const": ["error"],
      "quotes": ["error", "double"],
      "semi": ["error", "never"],
      "sort-imports": ["error", { "ignoreDeclarationSort": true }]
    }
  },
  {
    files: ["scripts/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        ...globals.node
      }
    },
    rules: {
      "array-bracket-spacing": ["error", "always"],
      "block-spacing": ["error", "always"],
      "camelcase": ["error"],
      "comma-spacing": ["error"],
      "curly": ["error", "multi-line"],
      "dot-notation": ["error"],
      "eol-last": ["error"],
      "func-style": ["error", "declaration"],
      "getter-return": ["error"],
      "keyword-spacing": ["error"],
      "no-empty": "off",
      "no-multi-spaces": ["error", { "exceptions": { "VariableDeclarator": true } }],
      "no-multiple-empty-lines": ["error", { "max": 2 }],
      "no-restricted-globals": ["error", "event"],
      "no-trailing-spaces": ["error"],
      "no-unused-vars": ["error", { "vars": "all", "args": "none", "caughtErrors": "none" }],
      "no-var": ["error"],
      "object-curly-spacing": ["error", "always"],
      "prefer-const": ["error"],
      "quotes": ["error", "double"],
      "semi": ["error", "never"],
      "sort-imports": ["error", { "ignoreDeclarationSort": true }]
    }
  }
])
