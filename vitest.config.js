import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/browser/**", "**/vendor/**", "**/node_modules/**"],
  },
})
