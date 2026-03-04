import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    exclude: [ "vendor/**", "node_modules/**" ],
  },
})
