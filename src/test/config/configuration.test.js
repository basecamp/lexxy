import { expect, test } from "vitest"
import Configuration from "../../config/configuration"

const config = new Configuration({
  default: { toolbar: true },
})

test("gets path", () => {
  expect(config.get("default.toolbar")).toBe(true)
})

test("returns bool early", () => {
  expect(config.get("default.toolbar.bold")).toBe(true)
})

test("deep merges arguments", () => {
  const config = new Configuration(
    { toolbar: false },
    { toolbar: { bold: true } }
  )
  expect(config.get("toolbar.bold")).toBe(true)
})
