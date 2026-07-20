import { defineConfig, devices } from "@playwright/test"
import { existsSync } from "fs"

const isCI = !!process.env.CI
const vitePort = process.env.VITE_PORT || "5173"

const chromiumPath = existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined
const firefoxPath = existsSync("/usr/bin/firefox") ? "/usr/bin/firefox" : undefined

export default defineConfig({
  testDir: "./tests",
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 1 : 2,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never", outputFolder: "./playwright-report" }]]
    : [["list"], ["html", { open: "on-failure", outputFolder: "./playwright-report" }]],

  use: {
    baseURL: `http://localhost:${vitePort}`,
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"],
      launchOptions: chromiumPath ? { executablePath: chromiumPath } : {} } },
    { name: "firefox", use: { ...devices["Desktop Firefox"],
      launchOptions: firefoxPath ? { executablePath: firefoxPath } : {} } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  webServer: {
    command: `npx vite --config ${import.meta.dirname}/vite.config.js`,
    url: `http://localhost:${vitePort}`,
    reuseExistingServer: !isCI,
    timeout: 15_000,
  },

  outputDir: "./test-results",
})
