import { execSync } from "node:child_process"
import path from "node:path"

const dummyDir = path.resolve(import.meta.dirname, "../dummy")

export default function globalSetup() {
  console.log("Preparing test database…")
  execSync("bundle exec rails db:test:prepare", {
    cwd: dummyDir,
    stdio: "inherit",
    env: { ...process.env, RAILS_ENV: "test" },
  })
}
