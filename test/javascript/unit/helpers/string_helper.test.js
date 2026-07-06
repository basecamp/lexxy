import { expect, test } from "vitest"
import { filterMatchPosition } from "src/helpers/string_helper"

test("matches a Cyrillic surname", () => {
  const name = "Андрій Ковальчук"
  expect(filterMatchPosition(name, "Ковальчук")).toBe(name.indexOf("Ковальчук"))
})

test("matches a Cyrillic first name", () => {
  expect(filterMatchPosition("Андрій Ковальчук", "Андрій")).toBe(0)
})

test("matches a Latin surname", () => {
  const name = "Jason Fried"
  expect(filterMatchPosition(name, "Fried")).toBe(name.indexOf("Fried"))
})

test("matches across a hyphenated name", () => {
  const name = "Jean-Pierre Dupont"
  expect(filterMatchPosition(name, "Pierre")).toBe(name.indexOf("Pierre"))
})

test("does not match mid-word", () => {
  expect(filterMatchPosition("Ковальчук", "вальчук")).toBe(-1)
  expect(filterMatchPosition("Fried", "ried")).toBe(-1)
})

test("returns 0 for an empty query", () => {
  expect(filterMatchPosition("Андрій Ковальчук", "")).toBe(0)
})
