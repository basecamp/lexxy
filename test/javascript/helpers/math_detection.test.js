import { expect, test, describe } from "vitest"

// Test the regex used for inline math detection
const INLINE_MATH_REGEX = /(?<!\$)\$([^$\n]+)\$(?!\$)/

describe("inline math detection regex", () => {
  test("matches simple inline math", () => {
    const match = INLINE_MATH_REGEX.exec("Hello $E=mc^2$ world")
    expect(match).not.toBeNull()
    expect(match[1]).toBe("E=mc^2")
  })

  test("matches at start of string", () => {
    const match = INLINE_MATH_REGEX.exec("$x^2$ is a term")
    expect(match).not.toBeNull()
    expect(match[1]).toBe("x^2")
  })

  test("matches at end of string", () => {
    const match = INLINE_MATH_REGEX.exec("the formula is $a+b$")
    expect(match).not.toBeNull()
    expect(match[1]).toBe("a+b")
  })

  test("does not match $$ (block delimiters)", () => {
    const match = INLINE_MATH_REGEX.exec("$$E=mc^2$$")
    expect(match).toBeNull()
  })

  test("does not match empty $...$", () => {
    const match = INLINE_MATH_REGEX.exec("$$")
    expect(match).toBeNull()
  })

  test("does not match across newlines", () => {
    const match = INLINE_MATH_REGEX.exec("$hello\nworld$")
    expect(match).toBeNull()
  })

  test("matches first occurrence with text before and after", () => {
    const match = INLINE_MATH_REGEX.exec("before $\\alpha$ after")
    expect(match).not.toBeNull()
    expect(match[1]).toBe("\\alpha")
    expect(match.index).toBe(7)
  })

  test("matches LaTeX commands", () => {
    const match = INLINE_MATH_REGEX.exec("$\\frac{a}{b}$")
    expect(match).not.toBeNull()
    expect(match[1]).toBe("\\frac{a}{b}")
  })
})

// Note: Node serialization tests require an active Lexical editor context.
// These are best tested via integration tests in the dummy Rails app.
