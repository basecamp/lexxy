import { expect, test } from "vitest"
import Configuration from "../../../src/config/configuration"

const config = new Configuration({
  default: { richText: true },
})

test("gets path", () => {
  expect(config.get("default.richText")).toBe(true)
})

test("returns undefined for missing option", () => {
  expect(config.get("default.missing")).toBe(undefined)
})

test("overwrites bool with hash", () => {
  const config = new Configuration(
    { toolbar: false },
    { toolbar: { bold: true } }
  )
  expect(config.get("toolbar.bold")).toBe(true)
})

test("ovewrites hash with bool", () => {
  const config = new Configuration(
    { toolbar: { bold: true } },
    { toolbar: false }
  )
  expect(config.get("toolbar")).toBe(false)
})
