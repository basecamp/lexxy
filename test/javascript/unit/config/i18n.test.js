import { expect, test, beforeEach } from "vitest"
import I18n from "src/config/i18n"

let i18n

beforeEach(() => {
  i18n = new I18n()
})

test("looks up a simple key", () => {
  expect(i18n.t("toolbar.bold")).toBe("Bold")
})

test("returns the key itself when not found", () => {
  expect(i18n.t("toolbar.nonexistent")).toBe("toolbar.nonexistent")
})

test("interpolates %{variable} placeholders", () => {
  expect(i18n.t("table.add", { childType: "row" })).toBe("Add row")
})

test("interpolates multiple placeholders", () => {
  i18n.registerLocale("test", { msg: "%{a} and %{b}" })
  i18n.locale = "test"
  expect(i18n.t("msg", { a: "X", b: "Y" })).toBe("X and Y")
})

test("handles pluralization with count", () => {
  expect(i18n.t("table.rowCount", { count: 1 })).toBe("1 row")
  expect(i18n.t("table.rowCount", { count: 3 })).toBe("3 rows")
})

test("handles pluralization with count 0", () => {
  expect(i18n.t("table.rowCount", { count: 0 })).toBe("0 rows")
})

test("returns key when result is plural object but count not provided", () => {
  expect(i18n.t("table.rowCount")).toBe("table.rowCount")
})

test("falls back to English for missing locale key", () => {
  const i18nAr = new I18n({ ar: { toolbar: { bold: "عريض" } } }, "ar")
  expect(i18nAr.t("toolbar.bold")).toBe("عريض")
  expect(i18nAr.t("toolbar.italic")).toBe("Italic")
})

test("registers a new locale", () => {
  i18n.registerLocale("fr", { toolbar: { bold: "Gras" } })
  i18n.locale = "fr"
  expect(i18n.t("toolbar.bold")).toBe("Gras")
  expect(i18n.t("toolbar.italic")).toBe("Italic")
})

test("setting locale changes active language", () => {
  i18n.registerLocale("ar", { toolbar: { bold: "عريض" } })
  i18n.locale = "ar"
  expect(i18n.t("toolbar.bold")).toBe("عريض")
})

test("empty string translation is returned, not treated as missing", () => {
  i18n.registerLocale("test", { toolbar: { bold: "" } })
  i18n.locale = "test"
  expect(i18n.t("toolbar.bold")).toBe("")
})

test("registerLocale overwrites existing locale", () => {
  i18n.registerLocale("fr", { toolbar: { bold: "Gras" } })
  i18n.registerLocale("fr", { toolbar: { bold: "Gras v2" } })
  i18n.locale = "fr"
  expect(i18n.t("toolbar.bold")).toBe("Gras v2")
})
