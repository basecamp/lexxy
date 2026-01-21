import { expect, test, describe } from "vitest"
import { normalizeEmptyContent } from "../../../src/helpers/html_normalization_helper"

describe("normalizeEmptyContent", () => {
  test("normalizes empty Lexical editor content to empty string", () => {
    const emptyLexicalContent = "<p><br></p>"
    expect(normalizeEmptyContent(emptyLexicalContent)).toBe("")
  })

  test("normalizes empty Lexical editor content with whitespace to empty string", () => {
    const emptyLexicalContentWithWhitespace = "  <p><br></p>  "
    expect(normalizeEmptyContent(emptyLexicalContentWithWhitespace)).toBe("")
  })

  test("preserves actual content", () => {
    const realContent = "<p>Hello, world!</p>"
    expect(normalizeEmptyContent(realContent)).toBe("<p>Hello, world!</p>")
  })

  test("preserves content with line breaks", () => {
    const contentWithBreaks = "<p>Hello</p><p><br></p><p>World</p>"
    expect(normalizeEmptyContent(contentWithBreaks)).toBe(
      "<p>Hello</p><p><br></p><p>World</p>"
    )
  })

  test("preserves paragraph with text and br", () => {
    const contentWithBr = "<p>Some text<br></p>"
    expect(normalizeEmptyContent(contentWithBr)).toBe("<p>Some text<br></p>")
  })

  test("handles null input", () => {
    expect(normalizeEmptyContent(null)).toBe(null)
  })

  test("handles undefined input", () => {
    expect(normalizeEmptyContent(undefined)).toBe(undefined)
  })

  test("handles empty string input", () => {
    expect(normalizeEmptyContent("")).toBe("")
  })
})
