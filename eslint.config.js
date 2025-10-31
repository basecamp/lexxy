import js from "@eslint/js"

export default [
  {
    ignores: ["dist/**", "app/**", "node_modules/**", "pkg/**", "test/**", "lib/**", "bin/**", "config/**", "docs/**"]
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        HTMLElement: "readonly",
        CustomEvent: "readonly",
        Element: "readonly",
        Node: "readonly",
        NodeList: "readonly",
        Event: "readonly",
        MutationObserver: "readonly",
        DOMParser: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Request: "readonly",
        Response: "readonly",
        FormData: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        XMLHttpRequest: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        customElements: "readonly",
        Prism: "readonly",
        ResizeObserver: "readonly"
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
      "no-extra-parens": ["error"],
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
]
