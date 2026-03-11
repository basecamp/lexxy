import { defineConfig } from "vite"
import path from "node:path"

export default defineConfig({
  root: path.resolve(import.meta.dirname, "fixtures"),
  resolve: {
    alias: {
      lexxy: path.resolve(import.meta.dirname, "../../src/index.js"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
