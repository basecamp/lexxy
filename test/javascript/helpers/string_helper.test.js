import { expect, test } from "vitest"
import { parameterize } from "../../../src/helpers/string_helper"

test("parameterizes simple text", () => {
  expect(parameterize("Hello World")).toBe("hello-world")
})

test("handles diacritics", () => {
  expect(parameterize("Café Résumé")).toBe("cafe-resume")
})

test("handles special characters", () => {
  expect(parameterize("What's New?")).toBe("whats-new")
})

test("collapses multiple spaces", () => {
  expect(parameterize("Hello   World")).toBe("hello-world")
})

test("returns empty string for empty input", () => {
  expect(parameterize("")).toBe("")
})

test("returns empty string for emoji-only input", () => {
  expect(parameterize("🎉")).toBe("")
})
