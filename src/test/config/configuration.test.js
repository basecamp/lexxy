import { expect, test } from "vitest"
import Configuration from "../../config/configuration"

test("gets path", () => {
  const c = new Configuration(
    {
      default: {
        toolbar: true
      },
    },
    {
      simple: {
        toolbar: false
      },
    }
  )
  expect(c.get("default.toolbar")).toBe(true)
  expect(c.get("default.toolbar.bold")).toBe(true)
  expect(c.get("default.invalid")).toBe(null)
})
