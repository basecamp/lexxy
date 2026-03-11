import { defineConfig, devices } from "@playwright/test"

const isCI = !!process.env.CI

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
    baseURL: "http://lexxy.localhost:45678",
    trace: "on-first-retry",
    video: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],

  globalSetup: "./global-setup.js",

  webServer: {
    command: "bundle exec rails server -p 45678 -e test",
    url: "http://lexxy.localhost:45678",
    reuseExistingServer: !isCI,
    cwd: `${import.meta.dirname}/../dummy`,
    timeout: 30_000,
  },

  outputDir: "./test-results",
})
