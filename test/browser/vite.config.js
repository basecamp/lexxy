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
    port: parseInt(process.env.VITE_PORT || "5173", 10),
    strictPort: true,
  },
})
